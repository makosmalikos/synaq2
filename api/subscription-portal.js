// Creates a short-lived Dodo Customer Portal session for the authenticated
// parent. The provider customer id is resolved server-side from the family's
// verified subscription; the browser cannot choose another customer.
const { getAdmin } = require('../backend/lib/firebase-admin');

const API = process.env.DODO_ENV === 'test_mode'
  ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
const idOf = (value, prefix) => typeof value === 'string'
  && new RegExp(`^${prefix}_[a-zA-Z0-9_-]{1,160}$`).test(value) ? value : '';

function portalUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && (url.hostname === 'dodopayments.com' || url.hostname.endsWith('.dodopayments.com'));
  } catch { return false; }
}

async function provider(path, options = {}) {
  let response, data;
  try {
    response = await fetch(`${API}/${path}`, {
      ...options,
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`, ...(options.headers || {}) },
    });
    data = await response.json();
  } catch { throw Object.assign(Error('provider_unavailable'), { status: 503 }); }
  if (!response.ok) throw Object.assign(Error(response.status === 404 ? 'subscription_not_found' : 'provider_unavailable'), { status: response.status === 404 ? 404 : 503 });
  if (!data || typeof data !== 'object') throw Object.assign(Error('invalid_provider_response'), { status: 503 });
  return data;
}

async function resolveSubscription(id) {
  try { return await provider(`subscriptions/${encodeURIComponent(id)}`); }
  catch (error) {
    if (error.status !== 404 || !idOf(id, 'pay')) throw error;
    const payment = await provider(`payments/${encodeURIComponent(id)}`);
    const subscriptionId = idOf(payment.subscription_id, 'sub');
    if (!subscriptionId) throw Object.assign(Error('subscription_not_found'), { status: 404 });
    return provider(`subscriptions/${encodeURIComponent(subscriptionId)}`);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!process.env.DODO_PAYMENTS_API_KEY || (process.env.SYNAQ_USE_EMULATORS !== '1'
      && (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY))) {
    return res.status(503).json({ error: 'server_not_configured' });
  }
  try {
    const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'login_required' });
    const { auth, db } = getAdmin();
    const user = await auth.verifyIdToken(match[1], true);
    if (!user?.uid || String(user.email || '').endsWith('@synaq.kids')) return res.status(403).json({ error: 'parent_required' });
    const family = await db.collection('families').doc(user.uid).get();
    if (!family.exists) return res.status(404).json({ error: 'family_required' });
    const storedId = String(family.data()?.dodoSubId || '');
    if (!idOf(storedId, 'sub') && !idOf(storedId, 'pay')) return res.status(409).json({ error: 'subscription_required' });

    const subscription = await resolveSubscription(storedId);
    const subscriptionId = idOf(subscription.subscription_id, 'sub');
    if (!subscriptionId) throw Object.assign(Error('invalid_provider_response'), { status: 503 });
    const ledger = await db.collection('paymentSubscriptions').doc(subscriptionId).get();
    if (ledger.exists && ledger.data()?.parentUid !== user.uid) return res.status(403).json({ error: 'subscription_owner_mismatch' });
    if (subscription.metadata?.parentUid && subscription.metadata.parentUid !== user.uid) return res.status(403).json({ error: 'subscription_owner_mismatch' });
    const customerId = idOf(subscription.customer?.customer_id, 'cus');
    if (!customerId) throw Object.assign(Error('customer_not_found'), { status: 503 });

    const returnUrl = new URL('/app', process.env.APP_URL || 'https://synaq.app').toString();
    const query = new URLSearchParams({ return_url: returnUrl });
    const session = await provider(`customers/${encodeURIComponent(customerId)}/customer-portal/session?${query}`, { method: 'POST' });
    if (!portalUrl(session.link)) throw Object.assign(Error('invalid_portal_url'), { status: 503 });
    return res.status(200).json({ url: session.link });
  } catch (error) {
    if (error?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
    if (error?.code?.startsWith('auth/')) return res.status(401).json({ error: 'login_required' });
    console.error('subscription portal failed', error?.message || 'unknown');
    return res.status(error?.status === 404 ? 409 : 503).json({ error: error?.status === 404 ? 'subscription_required' : 'portal_unavailable' });
  }
};
