// Dodo: verify, reconcile the current subscription, record once, sync.
// https://docs.dodopayments.com/developer-resources/subscription-integration-guide
// A scheduled cancellation keeps access until next_billing_date. A payment or
// refund alone does not describe the current subscription entitlement.
const crypto = require('crypto');
const { getAdmin } = require('../backend/lib/firebase-admin');

const EVENTS = new Set([
  'payment.succeeded', 'refund.succeeded', 'subscription.active',
  'subscription.renewed', 'subscription.updated', 'subscription.plan_changed',
  'subscription.on_hold', 'subscription.paused', 'subscription.unpaused',
  'subscription.cancelled', 'subscription.expired', 'subscription.failed',
]);
const idOf = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : '';
const timestamp = (value) => {
  if (value?.toMillis) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = typeof value === 'string' ? Date.parse(value) : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
const failure = (message, status = 503) => Object.assign(new Error(message), { status });

async function rawBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw failure('payload_too_large', 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function verify(raw, headers, secret) {
  const id = headers['webhook-id'];
  const ts = headers['webhook-timestamp'];
  const sigHeader = headers['webhook-signature'];
  const time = Number(ts);
  if (!id || !ts || !sigHeader || !secret || !Number.isFinite(time)
      || Math.abs(Date.now() / 1000 - time) > 300) return false;
  const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key)
    .update(`${id}.${ts}.${raw.toString('utf8')}`).digest();
  return String(sigHeader).split(/\s+/).some((part) => {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) return false;
    const actual = Buffer.from(value, 'base64');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  });
}

function store() {
  return getAdmin().db;
}

async function providerObject(kind, id) {
  if (!idOf(id)) throw failure('missing_provider_id');
  const api = process.env.DODO_ENV === 'test_mode'
    ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${api}/${kind}/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}` },
      signal: controller.signal,
    });
    // A temporary 404 can precede visibility of a newly created object.
    if (!response.ok) throw failure(`provider_${response.status}`);
    const data = await response.json();
    if (!data || typeof data !== 'object') throw failure('invalid_provider_response');
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw failure('provider_unavailable');
  } finally { clearTimeout(timeout); }
}

async function legacySubscription(id) {
  try { return await providerObject('subscriptions', id); }
  catch (error) {
    if (error.message !== 'provider_404') throw error;
    // Old webhook versions sometimes stored payment_id in dodoSubId.
    let payment;
    try { payment = await providerObject('payments', id); }
    catch (paymentError) {
      if (paymentError.message === 'provider_404') return null;
      throw paymentError;
    }
    if (!idOf(payment.subscription_id)) return null;
    try { return await providerObject('subscriptions', payment.subscription_id); }
    catch (subscriptionError) {
      if (subscriptionError.message === 'provider_404') return null;
      throw subscriptionError;
    }
  }
}

function subscriptionState(subscription, parentUid, eventAt, eventId) {
  const status = String(subscription.status || '');
  const periodEnd = timestamp(subscription.next_billing_date);
  const termEnd = timestamp(subscription.expires_at);
  if (status === 'active' && !periodEnd) throw failure('missing_subscription_period');
  const expiresAt = periodEnd && termEnd ? Math.min(periodEnd, termEnd) : periodEnd || termEnd;
  return {
    parentUid, subscriptionId: subscription.subscription_id, productId: subscription.product_id,
    status, pro: status === 'active', expiresAt: expiresAt || null,
    cancelAtPeriodEnd: subscription.cancel_at_next_billing_date === true,
    eventAt, eventId, reconciledAt: new Date(),
  };
}

async function resolveSubscription(db, event) {
  const data = event.data || {};
  let payment;
  let subscriptionId = idOf(data.subscription_id);
  if (event.type.startsWith('subscription.')) subscriptionId ||= idOf(data.id);
  else {
    const paymentId = idOf(data.payment_id) || (event.type === 'payment.succeeded' ? idOf(data.id) : '');
    if (paymentId) payment = await providerObject('payments', paymentId);
    subscriptionId = idOf(payment?.subscription_id) || subscriptionId;
    if (payment && !subscriptionId) return { ignored: 'not_a_subscription' };
  }
  const subscription = await providerObject('subscriptions', subscriptionId);
  if (subscription.subscription_id !== subscriptionId) throw failure('subscription_id_mismatch');
  const ref = db.collection('paymentSubscriptions').doc(subscriptionId);
  const previous = await ref.get();
  if (subscription.product_id !== process.env.DODO_PRODUCT_ID && !previous.exists) {
    return { ignored: 'other_product' };
  }
  const candidates = [subscription.metadata?.parentUid, payment?.metadata?.parentUid,
    data.metadata?.parentUid, previous.data()?.parentUid].filter(Boolean);
  const parentUid = candidates[0];
  if (!idOf(parentUid)) throw failure('unresolved_parent');
  if (candidates.some((uid) => uid !== parentUid)) throw failure('conflicting_parent');
  return { subscription, ref, parentUid };
}

async function syncChildrenPro(db, parentUid) {
  const familyRef = db.collection('families').doc(parentUid);
  const children = await familyRef.collection('children').get();
  for (let start = 0; start < children.docs.length; start += 400) {
    // A delayed retry reads CURRENT family state inside every transaction,
    // so it cannot mirror an older activation over a newer cancellation.
    await db.runTransaction(async (tx) => {
      const family = await tx.get(familyRef);
      const data = family.data() || {};
      const pro = data.pro === true && (!timestamp(data.proExpiresAt) || timestamp(data.proExpiresAt) > Date.now());
      for (const child of children.docs.slice(start, start + 400)) {
        tx.set(db.collection('childIndex').doc(child.id), {
          parentUid, pro, proExpiresAt: data.proExpiresAt || null,
        }, { merge: true });
      }
    });
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  if (!process.env.DODO_WEBHOOK_SECRET || !process.env.DODO_PAYMENTS_API_KEY
      || !process.env.DODO_PRODUCT_ID || (process.env.SYNAQ_USE_EMULATORS !== '1' && (!process.env.FIREBASE_PROJECT_ID
      || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY))) {
    return res.status(503).send('server_not_configured');
  }
  try {
    const raw = await rawBody(req);
    if (!verify(raw, req.headers, process.env.DODO_WEBHOOK_SECRET)) return res.status(403).send('bad_signature');
    let event;
    try { event = JSON.parse(raw.toString('utf8')); } catch { return res.status(400).send('bad_json'); }
    if (!EVENTS.has(event.type)) return res.status(200).send('ignored');
    const eventAt = timestamp(event.timestamp);
    if (!eventAt || eventAt > Date.now() + 300000) return res.status(400).send('bad_event_timestamp');

    const db = store();
    const eventId = String(req.headers['webhook-id']);
    const eventRef = db.collection('paymentEvents').doc(crypto.createHash('sha256').update(eventId).digest('hex'));
    const previousEvent = (await eventRef.get()).data();
    if (previousEvent?.status === 'processed' || previousEvent?.status === 'ignored') return res.status(200).send('duplicate');
    let parentUid = previousEvent?.status === 'applied' ? previousEvent.parentUid : '';

    if (!parentUid) {
      const resolved = await resolveSubscription(db, event);
      if (resolved.ignored) {
        await eventRef.set({ eventId, type: event.type, eventAt, status: 'ignored', reason: resolved.ignored, processedAt: new Date() });
        return res.status(200).send('ignored');
      }
      const { subscription, ref } = resolved;
      parentUid = resolved.parentUid;
      const familyRef = db.collection('families').doc(parentUid);
      const incoming = subscriptionState(subscription, parentUid, eventAt, eventId);
      if (subscription.product_id !== process.env.DODO_PRODUCT_ID) incoming.pro = false;
      const familyBefore = await familyRef.get();
      if (!familyBefore.exists) throw failure('family_not_found');

      // During rollout, retain another live subscription previously tracked
      // only in the family document, even if the first event is an old expiry.
      let legacy;
      const legacyId = idOf(familyBefore.data()?.dodoSubId);
      if (legacyId && legacyId !== subscription.subscription_id) {
        const oldRef = db.collection('paymentSubscriptions').doc(legacyId);
        if (!(await oldRef.get()).exists) {
          const current = await legacySubscription(legacyId);
          if (current) {
            if (current.metadata?.parentUid && current.metadata.parentUid !== parentUid) throw failure('conflicting_legacy_parent');
            legacy = subscriptionState(current, parentUid, timestamp(familyBefore.data()?.dodoEventAt), 'migration');
            if (current.product_id !== process.env.DODO_PRODUCT_ID) legacy.pro = false;
          }
        }
      }

      await db.runTransaction(async (tx) => {
        const [ledger, family, own, all] = await Promise.all([
          tx.get(eventRef), tx.get(familyRef), tx.get(ref),
          tx.get(db.collection('paymentSubscriptions').where('parentUid', '==', parentUid)),
        ]);
        if (['applied', 'processed'].includes(ledger.data()?.status)) return;
        if (!family.exists) throw failure('family_not_found');
        if (own.exists && own.data().parentUid !== parentUid) throw failure('conflicting_parent');
        const states = new Map(all.docs.map((doc) => [doc.id, doc.data()]));
        if (legacy && !states.has(legacy.subscriptionId)) {
          states.set(legacy.subscriptionId, legacy);
          tx.set(db.collection('paymentSubscriptions').doc(legacy.subscriptionId), legacy);
        }
        const stale = own.exists && Number(own.data().eventAt) > eventAt;
        if (!stale) {
          states.set(subscription.subscription_id, incoming);
          tx.set(ref, incoming);
        }
        const active = [...states.values()].filter((s) => s.pro === true && Number(s.expiresAt) > Date.now())
          .sort((a, b) => Number(b.expiresAt) - Number(a.expiresAt));
        const selected = active[0];
        tx.set(familyRef, {
          pro: !!selected, proExpiresAt: selected ? new Date(selected.expiresAt) : null,
          dodoSubId: selected?.subscriptionId || family.data()?.dodoSubId || subscription.subscription_id,
          dodoStatus: selected?.status || (stale ? family.data()?.dodoStatus || 'inactive' : incoming.status),
          dodoEventAt: new Date(Math.max(timestamp(family.data()?.dodoEventAt), eventAt)),
          proUpdatedAt: new Date(),
        }, { merge: true });
        tx.set(eventRef, { eventId, type: event.type, eventAt, parentUid,
          subscriptionId: subscription.subscription_id, status: 'applied', stale, appliedAt: new Date() });
      });
    }

    // Keep 'applied' until every mirror succeeds. A retry resumes sync and
    // never reapplies the old event to the authoritative family.
    await syncChildrenPro(db, parentUid);
    await eventRef.set({ status: 'processed', processedAt: new Date() }, { merge: true });
    return res.status(200).send('ok');
  } catch (error) {
    console.error('payment webhook failed:', error.message);
    res.setHeader('Retry-After', '30');
    return res.status(error.status || 503).send(error.status ? error.message : 'processing_failed');
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
