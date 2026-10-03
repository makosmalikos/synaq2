// One-time Dodo checkout for the current weekly mock pass (2500 KZT product).
const { getAdmin } = require('../backend/lib/firebase-admin');
const { familyPlan } = require('../backend/lib/plans');
const { createHash, randomUUID } = require('node:crypto');
const { weeklyWindow, passId, PRICE_KZT } = require('../backend/lib/weekly-mock');

const API = process.env.DODO_ENV === 'test_mode' ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
const MODE = process.env.DODO_ENV === 'test_mode' ? 'test_mode' : 'live_mode';
const failure = (code, status) => Object.assign(new Error(code), { status });
const validProviderId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value);
const validSessionId = (value) => typeof value === 'string' && /^cks_[A-Za-z0-9_-]{1,160}$/.test(value);

function validCheckoutUrl(value, sessionId) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && url.hostname === (MODE === 'test_mode' ? 'test.checkout.dodopayments.com' : 'checkout.dodopayments.com')
      && url.pathname === `/session/${sessionId}`;
  } catch { return false; }
}

async function identity(db, user) {
  if (!user?.uid) throw failure('auth-required', 401);
  if (!String(user.email || '').endsWith('@synaq.kids')) {
    const family = await db.collection('families').doc(user.uid).get();
    if (!family.exists) throw failure('family-required', 403);
    return { parentUid: user.uid, family: family.data(), email: user.email, name: user.name };
  }
  const index = await db.collection('childIndex').doc(user.uid).get();
  const parentUid = index.data()?.parentUid;
  if (!index.exists || !validProviderId(parentUid)) throw failure('child-required', 403);
  const familyRef = db.collection('families').doc(parentUid);
  const [family, child] = await Promise.all([familyRef.get(), familyRef.collection('children').doc(user.uid).get()]);
  if (!family.exists || !child.exists || `${child.data().code}@synaq.kids` !== user.email) throw failure('child-required', 403);
  return { parentUid, family: family.data(), email: family.data().parentEmail, name: family.data().parentName };
}

async function providerCheckout(id) {
  if (!validSessionId(id)) throw failure('checkout-verification-required', 503);
  let response, data;
  try {
    response = await fetch(`${API}/checkouts/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}` }, signal: AbortSignal.timeout(10000),
    });
    data = await response.json();
  } catch { throw failure('checkout-verification-required', 503); }
  if (!response.ok || data?.id !== id) throw failure('checkout-verification-required', 503);
  return data;
}

async function markUnknown(db, ref, attemptId) {
  try {
    await db.runTransaction(async (tx) => {
      const current = (await tx.get(ref)).data();
      if (current?.attemptId === attemptId && current.status === 'creating') tx.set(ref, { status: 'unknown', updatedAt: new Date() }, { merge: true });
    });
  } catch { /* keep the reservation fail-closed */ }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const productId = String(process.env.DODO_WEEKLY_MOCK_PRODUCT_ID || '').trim();
  if (!process.env.DODO_PAYMENTS_API_KEY || !validProviderId(productId)) return res.status(503).json({ error: 'weekly-payment-unavailable' });
  const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'auth-required' });
  try {
    const { auth, db } = getAdmin();
    const user = await auth.verifyIdToken(token, true);
    const owner = await identity(db, user);
    const window = weeklyWindow();
    if (familyPlan(owner.family) === 'pro') return res.status(200).json({ access: true, included: true, ...window });
    const passRef = db.collection('weeklyMockPasses').doc(passId(owner.parentUid, window.weekKey));
    if ((await passRef.get()).data()?.paid === true) return res.status(200).json({ access: true, paid: true, ...window });

    const key = createHash('sha256').update(`${owner.parentUid}:${window.weekKey}:${productId}:${MODE}`).digest('hex');
    const ref = db.collection('weeklyMockCheckoutSessions').doc(key);
    let reservation = await db.runTransaction(async (tx) => {
      const [family, pass, existing] = await Promise.all([
        tx.get(db.collection('families').doc(owner.parentUid)), tx.get(passRef), tx.get(ref),
      ]);
      if (!family.exists) throw failure('family-required', 403);
      if (familyPlan(family.data()) === 'pro' || pass.data()?.paid === true) return { access: true };
      const current = existing.data();
      if (current) return { current };
      const created = { version: 1, kind: 'weekly_mock', parentUid: owner.parentUid,
        weekKey: window.weekKey, productId, mode: MODE, attemptId: randomUUID(), status: 'creating',
        createdAt: new Date(), updatedAt: new Date() };
      tx.create(ref, created);
      return { created };
    });
    if (reservation.access) return res.status(200).json({ access: true, ...window });
    if (reservation.current) {
      const current = reservation.current;
      if (current.parentUid !== owner.parentUid || current.weekKey !== window.weekKey
          || current.productId !== productId || current.mode !== MODE) throw failure('checkout-verification-required', 503);
      if (current.status === 'ready' && validCheckoutUrl(current.url, current.sessionId)) {
        const checkout = await providerCheckout(current.sessionId);
        if (checkout.payment_status === null || ['requires_customer_action', 'requires_payment_method', 'requires_confirmation'].includes(checkout.payment_status)) {
          return res.status(200).json({ url: current.url, priceKzt: PRICE_KZT, ...window });
        }
        if (checkout.payment_status === 'succeeded' || checkout.payment_status === 'processing') throw failure('payment-pending', 409);
      }
      throw failure(current.status === 'creating' ? 'checkout-pending' : 'checkout-verification-required', current.status === 'creating' ? 409 : 503);
    }

    const record = reservation.created;
    let response, data;
    try {
      response = await fetch(`${API}/checkouts`, {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}` },
        body: JSON.stringify({
          product_cart: [{ product_id: productId, quantity: 1 }],
          customer: owner.email ? { email: owner.email, name: owner.name || undefined } : undefined,
          return_url: `${process.env.APP_URL || 'https://synaq.app'}/app?weeklyMock=${window.weekKey}`,
          metadata: { kind: 'weekly_mock', parentUid: owner.parentUid, weekKey: window.weekKey, checkoutAttemptId: record.attemptId },
        }),
      });
      data = await response.json();
    } catch {
      await markUnknown(db, ref, record.attemptId);
      throw failure('checkout-verification-required', 503);
    }
    if (!response.ok || !validSessionId(data?.session_id) || !validCheckoutUrl(data?.checkout_url, data?.session_id)) {
      await markUnknown(db, ref, record.attemptId);
      throw failure('checkout-verification-required', 503);
    }
    await db.runTransaction(async (tx) => {
      const current = (await tx.get(ref)).data();
      if (current?.attemptId !== record.attemptId || current.status !== 'creating') throw failure('checkout-verification-required', 503);
      tx.set(ref, { status: 'ready', sessionId: data.session_id, url: data.checkout_url, updatedAt: new Date() }, { merge: true });
    });
    return res.status(200).json({ url: data.checkout_url, priceKzt: PRICE_KZT, ...window });
  } catch (error) {
    if (error?.code?.startsWith('auth/')) return res.status(401).json({ error: 'auth-required' });
    if (error?.status) return res.status(error.status).json({ error: error.message });
    console.error('weekly-mock-checkout', error?.code || error?.name || 'failed');
    return res.status(503).json({ error: 'weekly-payment-unavailable' });
  }
};
