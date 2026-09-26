// POST /api/checkout  { email? }  →  { url }
// Dodo Payments-те төлем сессиясын ашып, сілтемесін қайтарады.
// uid-ті Firebase ID token-нен аламыз — клиент басқа адамның uid-ін бере алмайды.
//
// CommonJS (module.exports) — explain.js сияқты. ESM-ге көшірмеңіз:
// түбірдегі package.json-да "type": "module" жоқ, Vercel функцияны іске қоса алмайды.

const { getAdmin } = require('../backend/lib/firebase-admin');
const { createHash, randomUUID } = require('crypto');

const API = process.env.DODO_ENV === 'test_mode'
  ? 'https://test.dodopayments.com'
  : 'https://live.dodopayments.com';
const MODE = process.env.DODO_ENV === 'test_mode' ? 'test_mode' : 'live_mode';
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const EXPIRY_GRACE_MS = 60 * 1000;
const failure = (code, status, message) => Object.assign(new Error(code), { status, publicMessage: message });
const verificationNeeded = () => failure('checkout_verification_required', 503,
  'Не удалось подтвердить состояние предыдущей оплаты. Повторная оплата не запускается. Обратитесь в поддержку.');
const pending = () => failure('checkout_pending', 409,
  'Оплата уже открывается. Подождите несколько секунд и повторите — мы продолжим ту же попытку.');
const paymentPending = () => failure('checkout_payment_pending', 409,
  'Предыдущий платёж ещё обрабатывается. Дождитесь подтверждения или обратитесь в поддержку.');

function hasPro(family) {
  const expiresAt = family.proExpiresAt;
  const expiresMs = expiresAt?.toMillis?.() ?? (expiresAt == null ? 0 : new Date(expiresAt).getTime());
  return family.pro === true && (expiresAt == null || Number.isFinite(expiresMs) && expiresMs > Date.now());
}

function validSessionId(id) {
  return typeof id === 'string' && /^cks_[a-zA-Z0-9_-]{1,160}$/.test(id);
}

function validProviderId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(id);
}

function validCheckoutUrl(value, sessionId) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && url.hostname === (MODE === 'test_mode' ? 'test.checkout.dodopayments.com' : 'checkout.dodopayments.com')
      && url.pathname === `/session/${sessionId}`;
  } catch { return false; }
}

// The unmatched collection is denied by Firestore Rules. Reserving before the
// provider call is essential: a function crash must not permit another POST.
async function reserve(db, familyRef, checkoutRef, user, productId, replaceAttemptId = null) {
  return db.runTransaction(async (tx) => {
    const [family, existing] = await Promise.all([tx.get(familyRef), tx.get(checkoutRef)]);
    if (!family.exists) throw failure('family_required', 403, 'Оплата доступна только родителю с семейным аккаунтом.');
    if (hasPro(family.data())) throw failure('already_pro', 409, 'Подписка Pro уже активна.');
    const current = existing.data();
    if (current && (current.parentUid !== user.uid || current.productId !== productId || current.mode !== MODE)) throw verificationNeeded();
    if (current && (!replaceAttemptId || current.attemptId !== replaceAttemptId || current.status !== 'ready')) {
      return { current };
    }
    const record = { version: 1, parentUid: user.uid, productId, mode: MODE,
      attemptId: randomUUID(), status: 'creating', createdAt: new Date(), updatedAt: new Date() };
    tx.set(checkoutRef, record);
    return { created: record, family: family.data() };
  });
}

async function markUnknown(db, ref, attemptId) {
  try {
    await db.runTransaction(async (tx) => {
      const record = (await tx.get(ref)).data();
      if (record?.attemptId === attemptId && record.status === 'creating') {
        tx.set(ref, { status: 'unknown', updatedAt: new Date() }, { merge: true });
      }
    });
  } catch { console.warn('checkout reservation remains unresolved'); }
}

async function providerObject(kind, id) {
  if (!validProviderId(id)) throw verificationNeeded();
  let response, data;
  try {
    response = await fetch(`${API}/${kind}/${encodeURIComponent(id)}`, {
      method: 'GET', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}` },
    });
    data = await response.json();
  } catch { throw verificationNeeded(); }
  if (!response.ok || !data || typeof data !== 'object') throw verificationNeeded();
  return data;
}

// A completed purchase may be replaced only when its own subscription has
// actually ended; an old successful payment alone must not block renewal forever.
// https://docs.dodopayments.com/api-reference/payments/get-payments-1
// https://docs.dodopayments.com/api-reference/subscriptions/get-subscriptions
async function subscriptionHasEnded(record, paymentId) {
  const payment = await providerObject('payments', paymentId);
  if (payment.payment_id !== paymentId || payment.status !== 'succeeded'
      || !validProviderId(payment.subscription_id)
      || (payment.checkout_session_id != null && payment.checkout_session_id !== record.sessionId)) throw verificationNeeded();
  const subscription = await providerObject('subscriptions', payment.subscription_id);
  if (subscription.subscription_id !== payment.subscription_id || subscription.product_id !== record.productId) throw verificationNeeded();
  const owners = [payment.metadata?.parentUid, subscription.metadata?.parentUid].filter((value) => value != null);
  const attempts = [payment.metadata?.checkoutAttemptId, subscription.metadata?.checkoutAttemptId].filter((value) => value != null);
  if (!owners.length || owners.some((uid) => uid !== record.parentUid)
      || attempts.some((id) => id !== record.attemptId)) throw verificationNeeded();
  if (!['expired', 'cancelled'].includes(subscription.status)) return false;
  const periodEnd = typeof subscription.next_billing_date === 'string' ? Date.parse(subscription.next_billing_date) : NaN;
  const termEnd = subscription.expires_at == null ? periodEnd
    : typeof subscription.expires_at === 'string' ? Date.parse(subscription.expires_at) : NaN;
  if (!Number.isFinite(periodEnd) || !Number.isFinite(termEnd)) throw verificationNeeded();
  return periodEnd <= Date.now() && termEnd <= Date.now();
}

// Dodo does not document an idempotency header for POST /checkouts. Never
// invent one or expire an unknown POST reservation into a new payment attempt.
// https://docs.dodopayments.com/api-reference/checkout-sessions/get-checkouts
// https://docs.dodopayments.com/developer-resources/checkout-session
async function inspectExisting(record) {
  if (record?.status === 'creating') {
    const age = Date.now() - (record.createdAt?.toMillis?.() ?? new Date(record.createdAt).getTime());
    throw !Number.isFinite(age) || age < 0 || age >= 30000 ? verificationNeeded() : pending();
  }
  if (record?.status !== 'ready' || !validSessionId(record.sessionId)
      || !validCheckoutUrl(record.url, record.sessionId)) throw verificationNeeded();
  const data = await providerObject('checkouts', record.sessionId);
  if (data.id !== record.sessionId) throw verificationNeeded();
  const createdAt = typeof data.created_at === 'string' ? Date.parse(data.created_at) : NaN;
  if (!Number.isFinite(createdAt) || createdAt > Date.now() + EXPIRY_GRACE_MS) throw verificationNeeded();
  const status = data.payment_status;
  if (status === 'failed' || status === 'cancelled') {
    if (!validProviderId(data.payment_id)) throw verificationNeeded();
    return { replace: true };
  }
  if (status === 'succeeded' && await subscriptionHasEnded(record, data.payment_id)) return { replace: true };
  const unstarted = data.payment_id === null && status === null;
  // Expiry alone does not prove a payment was never submitted. Only the
  // provider's still-unstarted state AND the documented maximum lifetime do.
  if (unstarted && Date.now() >= createdAt + SESSION_LIFETIME_MS + EXPIRY_GRACE_MS) return { replace: true };
  if (unstarted || ['requires_customer_action', 'requires_payment_method', 'requires_confirmation'].includes(status)) {
    if (Date.now() < createdAt + SESSION_LIFETIME_MS) return { url: record.url };
  }
  throw paymentPending();
}

async function createReserved(db, ref, record, user, family) {
  let response, data;
  try {
    response = await fetch(`${API}/checkouts`, {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}` },
      body: JSON.stringify({
        product_cart: [{ product_id: record.productId, quantity: 1 }],
        customer: (user.email || family.parentEmail) ? { email: user.email || family.parentEmail, name: user.name || family.parentName || undefined } : undefined,
        return_url: `${process.env.APP_URL || 'https://synaq.app'}/app?paid=1`,
        metadata: { parentUid: user.uid, checkoutAttemptId: record.attemptId },
      }),
    });
    data = await response.json();
  } catch {
    await markUnknown(db, ref, record.attemptId);
    throw verificationNeeded();
  }
  if (!response.ok || !validSessionId(data?.session_id) || !validCheckoutUrl(data?.checkout_url, data?.session_id)) {
    console.warn('checkout provider response unresolved', response.status);
    await markUnknown(db, ref, record.attemptId);
    throw verificationNeeded();
  }
  const ready = { status: 'ready', sessionId: data.session_id, url: data.checkout_url, updatedAt: new Date() };
  try {
    await db.runTransaction(async (tx) => {
      const current = (await tx.get(ref)).data();
      if (current?.attemptId !== record.attemptId || !['creating', 'unknown'].includes(current.status)) throw verificationNeeded();
      tx.set(ref, ready, { merge: true });
    });
  } catch {
    // A lost Firestore acknowledgement may follow a successful durable write.
    // Confirm it without repeating the provider POST or replacing another attempt.
    const stored = await ref.get().then((snap) => snap.data()).catch(() => null);
    if (stored?.attemptId === record.attemptId && stored.status === 'ready'
      && stored.sessionId === ready.sessionId && stored.url === ready.url) return { url: ready.url };
    await markUnknown(db, ref, record.attemptId);
    throw verificationNeeded();
  }
  return { url: ready.url };
}

function getAdminAuth() {
  return getAdmin().auth;
}

function getAdminStore() {
  return getAdmin().db;
}

async function authenticatedUser(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return getAdminAuth().verifyIdToken(match[1], true);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if ((process.env.SYNAQ_USE_EMULATORS !== '1' && (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL
      || !process.env.FIREBASE_PRIVATE_KEY)) || !process.env.DODO_PAYMENTS_API_KEY
      || !process.env.DODO_PRODUCT_ID) {
    console.error('Checkout environment variables are incomplete');
    return res.status(500).json({ error: 'Төлем баптаулары толық емес' });
  }

  try {
    const user = await authenticatedUser(req);
    if (!user?.uid) return res.status(401).json({ error: 'Қайта кіріңіз' });
    if (String(user.email || '').endsWith('@synaq.kids')) {
      return res.status(403).json({ error: 'parent_required' });
    }
    const db = getAdminStore(), productId = process.env.DODO_PRODUCT_ID;
    const familyRef = db.collection('families').doc(user.uid);
    const key = createHash('sha256').update(JSON.stringify([user.uid, productId, MODE])).digest('hex');
    const ref = db.collection('checkoutSessions').doc(key);
    let reservation = await reserve(db, familyRef, ref, user, productId);
    if (reservation.current) {
      const previous = await inspectExisting(reservation.current);
      if (previous.url) return res.status(200).json(previous);
      reservation = await reserve(db, familyRef, ref, user, productId, reservation.current.attemptId);
      // Another request already replaced this exact attempt. It owns the POST.
      if (!reservation.created) throw pending();
    }
    return res.status(200).json(await createReserved(db, ref, reservation.created, user, reservation.family));
  } catch (e) {
    if (e?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
    if (e?.code?.startsWith('auth/')) {
      console.warn('checkout auth failed', e.code);
      return res.status(401).json({ error: 'Қайта кіріңіз' });
    }
    if (e?.publicMessage) {
      if (e.message === 'checkout_pending') res.setHeader('Retry-After', '3');
      return res.status(e.status).json({ error: e.message, message: e.publicMessage });
    }
    console.error('checkout failed', e?.code || 'storage_or_server_error');
    return res.status(503).json({ error: 'checkout_unavailable', message: 'Не удалось открыть оплату. Повторите позже или обратитесь в поддержку.' });
  }
};
