const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const plans = require('../backend/lib/plans');

const SECRET = Buffer.from('local-test-secret');
const NOW = Date.now();
const future = new Date(NOW + 86400000).toISOString();
const active = (id, extra = {}) => ({ subscription_id: id, status: 'active', product_id: 'pro-product',
  next_billing_date: future, metadata: { parentUid: 'parent' }, ...extra });
const event = (type, id = 'sub-1', at = NOW - 1000, extra = {}) => ({ type,
  timestamp: new Date(at).toISOString(), data: { subscription_id: id, ...extra } });

function fixture(file = 'webhook.js') {
  const sourcePath = file === 'entitlement.js'
    ? `${__dirname}/../backend/handlers/${file}`
    : `${__dirname}/../api/${file}`;
  const docs = new Map([['families/parent', { parentName: 'Parent' }]]);
  const provider = new Map([['subscriptions/sub-1', active('sub-1')]]);
  const calls = [];
  let mirrorFailures = 0, familyWrites = 0;
  const snap = (path) => ({ id: path.split('/').at(-1), exists: docs.has(path), data: () => docs.get(path) });
  const write = (path, data, options) => {
    if (path === 'families/parent') familyWrites++;
    docs.set(path, options?.merge ? { ...docs.get(path), ...data } : { ...data });
  };
  const ref = (path) => ({ path, get: async () => snap(path),
    set: async (data, options) => write(path, data, options),
    collection: (name) => collection(`${path}/${name}`),
  });
  const collection = (path) => ({ path,
    doc: (id) => ref(`${path}/${id}`),
    get: async () => ({ docs: [...docs.keys()].filter((key) => key.startsWith(path + '/')
      && key.split('/').length === path.split('/').length + 1).map(snap) }),
    where: (key, op, value) => ({ query: path, key, value }),
  });
  const db = { collection, async runTransaction(callback) {
    const writes = [];
    const tx = { async get(reference) {
      if (writes.length) throw Error('transaction reads must precede writes');
      if (!reference.query) return snap(reference.path);
      return { docs: [...docs.keys()].filter((key) => key.startsWith(reference.query + '/')
        && docs.get(key)[reference.key] === reference.value).map(snap) };
    }, set(reference, data, options) { writes.push([reference.path, data, options]); } };
    const result = await callback(tx);
    if (mirrorFailures && writes.some(([path]) => path.startsWith('childIndex/'))) {
      mirrorFailures--;
      throw Error('injected mirror failure');
    }
    for (const args of writes) write(...args);
    return result;
  } };
  const auth = { verifyIdToken: async () => ({ uid: 'parent', email: 'parent@example.test' }) };
  const context = { module: { exports: {} }, Buffer, Date, URL, AbortController, AbortSignal, setTimeout, clearTimeout,
    console: { error() {}, warn() {}, log() {} },
    process: { env: { DODO_WEBHOOK_SECRET: 'whsec_' + SECRET.toString('base64'), DODO_PAYMENTS_API_KEY: 'test-key',
      DODO_PRODUCT_ID: 'pro-product', DODO_STANDARD_PRODUCT_ID: 'standard-product', FIREBASE_PROJECT_ID: 'test-project', FIREBASE_CLIENT_EMAIL: 'test-email',
      FIREBASE_PRIVATE_KEY: 'test-private-key', APP_URL: 'https://example.test' } },
    require(name) {
      if (name === 'crypto') return crypto;
      if (name === '../backend/lib/plans' || name === '../lib/plans') return plans;
      if (name === '../backend/lib/firebase-admin' || name === '../lib/firebase-admin') return { getAdmin: () => ({ auth, db }) };
      throw Error('Unexpected module ' + name);
    },
    fetch: async (url, options) => {
      const path = new URL(url).pathname.slice(1); calls.push({ path, options });
      const value = provider.get(path);
      if (value instanceof Error) throw value;
      return { ok: !!value && !value.httpStatus, status: value?.httpStatus || (value ? 200 : 503),
        json: async () => value };
    },
  };
  vm.runInNewContext(fs.readFileSync(sourcePath, 'utf8'), context);
  async function invoke(payload, { id = crypto.randomUUID(), timestamp = String(Math.floor(Date.now() / 1000)),
    signature, method = file === 'entitlement.js' ? 'GET' : 'POST', token = 'test-token' } = {}) {
    const raw = JSON.stringify(payload);
    const req = file === 'webhook.js' ? Readable.from([Buffer.from(raw)]) : { body: payload };
    req.method = method;
    req.headers = { 'webhook-id': id, 'webhook-timestamp': timestamp,
      'webhook-signature': signature ?? 'v1,' + crypto.createHmac('sha256', SECRET).update(`${id}.${timestamp}.${raw}`).digest('base64'),
      authorization: token ? `Bearer ${token}` : '' };
    const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; },
      status(code) { this.statusCode = code; return this; }, send(body) { this.body = body; return this; },
      json(body) { this.body = JSON.parse(JSON.stringify(body)); return this; } };
    await context.module.exports(req, res);
    return { status: res.statusCode, body: res.body };
  }
  return { docs, provider, calls, invoke, auth, failMirrors: (n) => { mirrorFailures = n; },
    familyWrites: () => familyWrites, ledger: (id) => docs.get('paymentEvents/' + crypto.createHash('sha256').update(id).digest('hex')) };
}

test('webhook rejects forged signatures and nonnumeric signing timestamps', async () => {
  const f = fixture();
  assert.equal((await f.invoke(event('subscription.active'), { signature: 'v1,bad' })).status, 403);
  assert.equal((await f.invoke(event('subscription.active'), { timestamp: 'NaN' })).status, 403);
  assert.equal(f.familyWrites(), 0);
});

test('metadata/provider outage returns retryable status, then same event succeeds', async () => {
  const f = fixture(), payload = event('payment.succeeded', undefined, NOW - 1000, { payment_id: 'pay-1' });
  assert.equal((await f.invoke(payload, { id: 'retry' })).status, 503);
  assert.equal(f.ledger('retry'), undefined);
  f.provider.set('payments/pay-1', { subscription_id: 'sub-1', metadata: { parentUid: 'parent' } });
  assert.equal((await f.invoke(payload, { id: 'retry' })).status, 200);
  assert.equal(f.docs.get('families/parent').pro, true);
});

test('Standard subscription is stored as Standard without granting Pro', async () => {
  const f = fixture();
  f.provider.set('subscriptions/sub-standard', active('sub-standard', { product_id: 'standard-product' }));
  const result = await f.invoke(event('subscription.active', 'sub-standard'), { id: 'standard-active' });
  assert.equal(result.status, 200);
  const family = f.docs.get('families/parent');
  assert.equal(family.plan, 'standard');
  assert.equal(family.pro, false);
  assert.ok(family.planExpiresAt instanceof Date);
});

test('unresolved parent is not acknowledged; payment can establish mapping for later retries', async () => {
  const f = fixture();
  f.provider.set('subscriptions/sub-1', active('sub-1', { metadata: {} }));
  assert.equal((await f.invoke(event('subscription.active'), { id: 'early' })).status, 503);
  f.provider.set('payments/pay-1', { subscription_id: 'sub-1', metadata: { parentUid: 'parent' } });
  await f.invoke(event('payment.succeeded', 'sub-1', NOW - 500, { payment_id: 'pay-1' }));
  assert.equal((await f.invoke(event('subscription.active'), { id: 'early' })).status, 200);
  assert.equal(f.docs.get('families/parent').pro, true);
});

test('completed events are idempotent without calling provider again', async () => {
  const f = fixture();
  await f.invoke(event('subscription.active'), { id: 'once' });
  const writes = f.familyWrites(), calls = f.calls.length;
  assert.equal((await f.invoke(event('subscription.active'), { id: 'once' })).body, 'duplicate');
  assert.equal(f.familyWrites(), writes);
  assert.equal(f.calls.length, calls);
});

test('late expiry of one subscription preserves another active subscription', async () => {
  const f = fixture();
  f.provider.set('subscriptions/sub-new', active('sub-new'));
  f.provider.set('subscriptions/sub-old', active('sub-old', { status: 'expired' }));
  await f.invoke(event('subscription.active', 'sub-new', NOW - 1000));
  await f.invoke(event('subscription.expired', 'sub-old', NOW - 100000));
  assert.equal(f.docs.get('families/parent').pro, true);
  assert.equal(f.docs.get('families/parent').dodoSubId, 'sub-new');
});

test('late activation cannot undo a newer cancellation on the same subscription', async () => {
  const f = fixture();
  f.provider.set('subscriptions/sub-1', active('sub-1', { status: 'cancelled' }));
  await f.invoke(event('subscription.cancelled', 'sub-1', NOW - 1000));
  f.provider.set('subscriptions/sub-1', active('sub-1'));
  await f.invoke(event('subscription.active', 'sub-1', NOW - 100000));
  assert.equal(f.docs.get('families/parent').pro, false);
});

test('scheduled cancellation retains the paid period, actual cancellation revokes', async () => {
  const f = fixture();
  f.provider.set('subscriptions/sub-1', active('sub-1', { cancel_at_next_billing_date: true }));
  await f.invoke(event('subscription.updated'));
  assert.equal(f.docs.get('families/parent').pro, true);
  assert.equal(f.docs.get('families/parent').proExpiresAt.toISOString(), future);
  f.provider.set('subscriptions/sub-1', active('sub-1', { status: 'cancelled' }));
  await f.invoke(event('subscription.cancelled', 'sub-1', NOW));
  assert.equal(f.docs.get('families/parent').pro, false);
});

test('expired paid period and on_hold never create indefinite Pro', async () => {
  for (const patch of [{ next_billing_date: new Date(NOW - 1000).toISOString() }, { status: 'on_hold' }]) {
    const f = fixture(); f.provider.set('subscriptions/sub-1', active('sub-1', patch));
    await f.invoke(event('subscription.updated'));
    assert.equal(f.docs.get('families/parent').pro, false);
  }
});

test('refund reconciles current subscription instead of blindly revoking another paid cycle', async () => {
  const f = fixture();
  f.provider.set('payments/old-payment', { subscription_id: 'sub-1', metadata: { parentUid: 'parent' } });
  await f.invoke(event('refund.succeeded', 'sub-1', NOW - 1000, { payment_id: 'old-payment' }));
  assert.equal(f.docs.get('families/parent').pro, true);
});

test('other products and one-time payments cannot activate Pro', async () => {
  const f = fixture();
  f.provider.set('subscriptions/sub-1', active('sub-1', { product_id: 'other' }));
  assert.equal((await f.invoke(event('subscription.active'))).body, 'ignored');
  f.provider.set('payments/one-time', { metadata: { parentUid: 'parent' } });
  assert.equal((await f.invoke(event('payment.succeeded', '', NOW - 1000, { payment_id: 'one-time' }))).body, 'ignored');
  assert.equal(f.familyWrites(), 0);
});

test('partial mirror failure retries synchronization without reverting newer cancellation', async () => {
  const f = fixture();
  f.docs.set('families/parent/children/child', { name: 'Child' });
  f.failMirrors(1);
  assert.equal((await f.invoke(event('subscription.active'), { id: 'partial' })).status, 503);
  assert.equal(f.ledger('partial').status, 'applied');
  f.provider.set('subscriptions/sub-1', active('sub-1', { status: 'cancelled' }));
  await f.invoke(event('subscription.cancelled', 'sub-1', NOW));
  const calls = f.calls.length;
  assert.equal((await f.invoke(event('subscription.active'), { id: 'partial' })).status, 200);
  assert.equal(f.calls.length, calls);
  assert.equal(f.docs.get('childIndex/child').pro, false);
  assert.equal(f.ledger('partial').status, 'processed');
});

test('rollout preserves legacy family subscription while handling old subscription expiry', async () => {
  const f = fixture();
  f.docs.set('families/parent', { pro: true, dodoSubId: 'sub-current' });
  f.provider.set('subscriptions/sub-current', active('sub-current'));
  f.provider.set('subscriptions/sub-old', active('sub-old', { status: 'expired' }));
  assert.equal((await f.invoke(event('subscription.expired', 'sub-old'))).status, 200);
  assert.equal(f.docs.get('families/parent').pro, true);
  assert.equal(f.docs.get('families/parent').dodoSubId, 'sub-current');
});

test('legacy payment ID migrates through its payment; confirmed missing legacy does not block', async () => {
  const f = fixture();
  f.docs.set('families/parent', { pro: true, dodoSubId: 'pay-legacy' });
  f.provider.set('subscriptions/pay-legacy', { httpStatus: 404 });
  f.provider.set('payments/pay-legacy', { subscription_id: 'sub-current' });
  f.provider.set('subscriptions/sub-current', active('sub-current'));
  f.provider.set('subscriptions/sub-old', active('sub-old', { status: 'expired' }));
  assert.equal((await f.invoke(event('subscription.expired', 'sub-old'))).status, 200);
  assert.equal(f.docs.get('families/parent').pro, true);

  const missing = fixture();
  missing.docs.set('families/parent', { dodoSubId: 'missing' });
  missing.provider.set('subscriptions/missing', { httpStatus: 404 });
  missing.provider.set('payments/missing', { httpStatus: 404 });
  assert.equal((await missing.invoke(event('subscription.active'))).status, 200);
  assert.equal(missing.docs.get('families/parent').pro, true);
});

test('temporary legacy API failure remains retryable instead of losing old entitlement', async () => {
  const f = fixture();
  f.docs.set('families/parent', { pro: true, dodoSubId: 'pay-legacy' });
  f.provider.set('subscriptions/pay-legacy', { httpStatus: 404 });
  f.provider.set('payments/pay-legacy', { httpStatus: 503 });
  assert.equal((await f.invoke(event('subscription.active'))).status, 503);
  assert.equal(f.familyWrites(), 0);
});

test('checkout uses authenticated parent identity and refuses active duplicate subscription', async () => {
  const f = fixture('checkout.js');
  f.provider.set('checkouts', { session_id: 'cks_local', checkout_url: 'https://checkout.dodopayments.com/session/cks_local' });
  f.provider.set('checkouts/cks_local', { id: 'cks_local', created_at: new Date(NOW).toISOString(), payment_id: null, payment_status: null });
  assert.equal((await f.invoke({ uid: 'someone-else' })).status, 200);
  assert.equal(JSON.parse(f.calls[0].options.body).metadata.parentUid, 'parent');
  f.docs.set('families/parent', { pro: true, proExpiresAt: new Date(future) });
  assert.equal((await f.invoke({})).body.error, 'already_pro');
  f.docs.set('families/parent', { pro: true, proExpiresAt: 'invalid-expiry' });
  assert.equal((await f.invoke({})).status, 200);
  f.auth.verifyIdToken = async () => ({ uid: 'parent', email: 'child@synaq.kids' });
  assert.equal((await f.invoke({})).status, 403);
});

test('child entitlement checks source family and expires even without expiry webhook', async () => {
  const f = fixture('entitlement.js');
  f.auth.verifyIdToken = async () => ({ uid: 'child', email: 'child@synaq.kids' });
  f.docs.set('childIndex/child', { parentUid: 'parent', pro: true });
  f.docs.set('families/parent', { pro: true, proExpiresAt: new Date(NOW - 1000) });
  assert.deepEqual((await f.invoke({})).body, { plan: 'free', standard: false, pro: false, expiresAt: null });
  f.docs.set('families/parent', { pro: true, proExpiresAt: new Date(future) });
  assert.deepEqual((await f.invoke({})).body, { plan: 'pro', standard: false, pro: true, expiresAt: future });
  f.docs.set('families/parent', { pro: true, proExpiresAt: 'invalid-expiry' });
  assert.deepEqual((await f.invoke({})).body, { plan: 'free', standard: false, pro: false, expiresAt: null });
  f.docs.set('families/parent', { plan: 'standard', planExpiresAt: new Date(future) });
  assert.deepEqual((await f.invoke({})).body, { plan: 'standard', standard: true, pro: false, expiresAt: future });
});
