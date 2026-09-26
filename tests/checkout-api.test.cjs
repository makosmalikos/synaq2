const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

const source = fs.readFileSync(`${__dirname}/../api/checkout.js`, 'utf8');
const DAY = 24 * 60 * 60 * 1000;
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fixture() {
  let now = Date.parse('2026-09-24T00:00:00Z');
  const docs = new Map([['families/parent', { parentName: 'Parent' }], ['families/other', { parentName: 'Other' }]]);
  const sessions = new Map(), providerObjects = new Map(), calls = [];
  let nextSession = 0, provider = null, tail = Promise.resolve();
  let failReady = false, loseReadyAck = false, loseReservationAck = false;
  let onReady = null;
  const clone = (value) => value == null ? value : structuredClone(value);
  const snapshot = (path) => ({ exists: docs.has(path), data: () => clone(docs.get(path)) });
  const ref = (path) => ({ path, get: async () => snapshot(path) });
  const db = { collection: (path) => ({ doc: (id) => ref(`${path}/${id}`) }), runTransaction(callback) {
    // Serialize transactions like conflicting Firestore commits. No provider
    // call is allowed inside one; concurrent function instances share this DB.
    const run = tail.then(async () => {
      const writes = [];
      const result = await callback({
        get: async (value) => { assert.equal(writes.length, 0); return snapshot(value.path); },
        set(value, data, options) { writes.push({ path: value.path, data: clone(data), merge: options?.merge }); },
      });
      if (failReady && writes.some((write) => write.data.status === 'ready')) throw Error('ready_write_failed');
      for (const write of writes) docs.set(write.path, write.merge ? { ...docs.get(write.path), ...write.data } : write.data);
      if (writes.some((write) => write.data.status === 'ready')) {
        onReady?.();
        if (loseReadyAck) { loseReadyAck = false; throw Error('lost_ready_ack'); }
      }
      if (loseReservationAck && writes.some((write) => write.data.status === 'creating')) {
        loseReservationAck = false; throw Error('lost_reservation_ack');
      }
      return result;
    });
    tail = run.catch(() => {});
    return run;
  } };
  const auth = { verifyIdToken: async (token, revoked) => {
    assert.equal(revoked, true);
    if (token === 'invalid') throw Object.assign(Error('bad token'), { code: 'auth/invalid-id-token' });
    return { uid: token, email: token === 'child' ? 'child@synaq.kids' : `${token}@example.test`, name: 'Authenticated Name' };
  } };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const env = { FIREBASE_PROJECT_ID: 'local-test', FIREBASE_CLIENT_EMAIL: 'local@example.invalid', FIREBASE_PRIVATE_KEY: 'unused-stub-key',
    DODO_PAYMENTS_API_KEY: 'unused-stub-provider-key', DODO_PRODUCT_ID: 'pro-product', DODO_ENV: 'test_mode', APP_URL: 'https://example.test' };
  async function defaultProvider(url, options) {
    if (options.method === 'POST') {
      const id = `cks_${++nextSession}`;
      sessions.set(id, { id, created_at: new Date(now).toISOString(), payment_id: null, payment_status: null });
      return { ok: true, status: 200, json: async () => ({ session_id: id, checkout_url: `https://test.checkout.dodopayments.com/session/${id}` }) };
    }
    const path = new URL(url).pathname.slice(1);
    const data = path.startsWith('checkouts/') ? sessions.get(url.split('/').at(-1)) : providerObjects.get(path);
    if (data instanceof Error) throw data;
    return { ok: !!data, status: data ? 200 : 404, json: async () => clone(data || {}) };
  }
  function instance() {
    const context = { module: { exports: {} }, URL, Date: Clock, AbortSignal,
      console: { log() {}, warn() {}, error() {} }, process: { env },
      require(name) {
        if (name === 'crypto') return crypto;
        if (name === '../backend/lib/firebase-admin') return { getAdmin: () => ({ auth, db }) };
        throw Error(`Unexpected dependency ${name}`);
      },
      fetch: async (url, options) => {
        assert.match(url, /^https:\/\/test\.dodopayments\.com\/(?:checkouts(?:\/cks_[a-zA-Z0-9_-]+)?|(?:payments|subscriptions)\/[a-zA-Z0-9_-]+)$/);
        calls.push({ url, ...options });
        return (provider || defaultProvider)(url, options);
      },
    };
    vm.runInNewContext(source, context, { filename: 'checkout.js' });
    return async ({ uid = 'parent', body = {}, method = 'POST' } = {}) => {
      const req = { method, body, headers: { authorization: uid ? `Bearer ${uid}` : '' } };
      const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; },
        status(code) { this.statusCode = code; return this; }, json(value) { this.body = clone(value); return this; } };
      await context.module.exports(req, res);
      return { status: res.statusCode, body: res.body, headers: res.headers };
    };
  }
  return { docs, sessions, providerObjects, calls, env, instance, invoke: instance(), defaultProvider,
    records: () => [...docs.entries()].filter(([path]) => path.startsWith('checkoutSessions/')),
    posts: () => calls.filter((call) => call.method === 'POST'),
    advance: (ms) => { now += ms; }, setProvider: (value) => { provider = value; },
    failReady: () => { failReady = true; }, loseReadyAck: () => { loseReadyAck = true; },
    loseReservationAck: () => { loseReservationAck = true; }, onReady: (value) => { onReady = value; },
  };
}

test('two concurrent function instances reserve one provider POST and replay its durable URL', async () => {
  const f = fixture(), entered = deferred(), release = deferred();
  f.setProvider(async (url, options) => {
    if (options.method === 'POST') { entered.resolve(); await release.promise; }
    return f.defaultProvider(url, options);
  });
  const first = f.invoke({ body: { uid: 'attacker', productId: 'wrong', email: 'wrong@example.test' } });
  await entered.promise;
  const concurrent = await f.instance()();
  assert.equal(concurrent.status, 409);
  assert.equal(concurrent.body.error, 'checkout_pending');
  assert.equal(concurrent.headers['Retry-After'], '3');
  assert.equal(f.posts().length, 1);
  release.resolve();
  const created = await first, replay = await f.instance()();
  assert.equal(created.status, 200);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, created.body);
  assert.equal(f.posts().length, 1);
  const payload = JSON.parse(f.posts()[0].body);
  assert.equal(payload.metadata.parentUid, 'parent');
  assert.equal(payload.metadata.checkoutAttemptId, f.records()[0][1].attemptId);
  assert.equal(payload.customer.email, 'parent@example.test');
  assert.equal(payload.product_cart[0].product_id, 'pro-product');
  assert.equal(created.headers['Cache-Control'], 'private, no-store');
});

test('reservation scope separates authenticated parents and products, never client-supplied IDs', async () => {
  const f = fixture();
  const parent = await f.invoke(), other = await f.invoke({ uid: 'other' });
  assert.notEqual(parent.body.url, other.body.url);
  f.env.DODO_PRODUCT_ID = 'second-configured-product';
  await f.invoke();
  assert.equal(f.posts().length, 3);
  assert.equal(f.records().length, 3);
});

test('ambiguous provider POST stays blocked across instances and expiry without another POST', async () => {
  const f = fixture();
  f.setProvider(async (url, options) => { await f.defaultProvider(url, options); throw Error('response lost after creation'); });
  const initial = await f.invoke();
  assert.equal(initial.status, 503);
  assert.equal(initial.body.error, 'checkout_verification_required');
  assert.ok(initial.body.message.includes('Повторная оплата не запускается'));
  assert.equal(f.records()[0][1].status, 'unknown');
  f.advance(7 * DAY);
  const retry = await f.instance()();
  assert.equal(retry.status, 503);
  assert.equal(f.posts().length, 1);
});

test('provider 5xx, invalid JSON, missing ID and unsafe URL never release a reservation', async () => {
  for (const response of [
    { ok: false, status: 503, json: async () => ({}) },
    { ok: true, status: 200, json: async () => { throw Error('truncated json'); } },
    { ok: true, status: 200, json: async () => ({ checkout_url: 'https://test.checkout.dodopayments.com/session/cks_1' }) },
    { ok: true, status: 200, json: async () => ({ session_id: 'cks_1', checkout_url: 'javascript:alert(1)' }) },
  ]) {
    const f = fixture(); f.setProvider(async () => response);
    assert.equal((await f.invoke()).status, 503);
    assert.equal((await f.instance()()).status, 503);
    assert.equal(f.posts().length, 1);
  }
});

test('processing and succeeded checkouts cannot create a second payment while webhook is delayed', async () => {
  for (const payment_status of ['processing', 'succeeded', 'requires_capture', 'unknown_future_status']) {
    const f = fixture(); await f.invoke();
    Object.assign(f.sessions.get('cks_1'), { payment_id: 'pay_1', payment_status });
    if (payment_status === 'succeeded') {
      f.providerObjects.set('payments/pay_1', { payment_id: 'pay_1', status: 'succeeded', subscription_id: 'sub_1', metadata: { parentUid: 'parent' } });
      f.providerObjects.set('subscriptions/sub_1', { subscription_id: 'sub_1', status: 'active', product_id: 'pro-product',
        next_billing_date: '2026-10-24T00:00:00Z', metadata: { parentUid: 'parent' } });
    }
    f.advance(2 * DAY);
    const result = await f.instance()();
    assert.equal(result.status, 409);
    assert.equal(result.body.error, 'checkout_payment_pending');
    assert.equal(f.posts().length, 1);
  }
});

test('confirmed failed/cancelled payment may be replaced, but concurrent replacements still POST once', async () => {
  for (const payment_status of ['failed', 'cancelled']) {
    const f = fixture(); await f.invoke();
    Object.assign(f.sessions.get('cks_1'), { payment_id: 'pay_1', payment_status });
    const results = await Promise.all([f.instance()(), f.instance()(), f.instance()()]);
    assert.equal(f.posts().length, 2);
    assert.ok(results.some((result) => result.status === 200));
    assert.equal(f.records()[0][1].sessionId, 'cks_2');
    assert.ok(results.every((result) => [200, 409].includes(result.status)));
  }
});

test('only provider-confirmed unstarted checkout beyond 24h plus grace may be renewed', async () => {
  const f = fixture(); await f.invoke();
  f.advance(DAY - 1);
  assert.equal((await f.invoke()).body.url, 'https://test.checkout.dodopayments.com/session/cks_1');
  f.advance(1);
  assert.equal((await f.invoke()).status, 409);
  f.advance(60000);
  assert.equal((await f.invoke()).body.url, 'https://test.checkout.dodopayments.com/session/cks_2');
  assert.equal(f.posts().length, 2);
});

test('failed status lookup, wrong session ID, absent or invalid timestamps never trigger a POST', async () => {
  for (const state of [new Error('offline'), null,
    { id: 'cks_other', created_at: '2026-09-24T00:00:00Z', payment_status: 'failed' },
    { id: 'cks_1', payment_status: 'failed' },
    { id: 'cks_1', created_at: 'invalid', payment_status: 'failed' }]) {
    const f = fixture(); await f.invoke(); f.advance(2 * DAY);
    f.setProvider(async () => {
      if (state instanceof Error) throw state;
      return { ok: !!state, status: state ? 200 : 404, json: async () => state };
    });
    assert.equal((await f.invoke()).status, 503);
    assert.equal(f.posts().length, 1);
  }
});

test('lost durable-ready write acknowledgement returns the saved URL without another provider call', async () => {
  const f = fixture(); f.loseReadyAck();
  assert.equal((await f.invoke()).status, 200);
  assert.equal(f.records()[0][1].status, 'ready');
  assert.equal((await f.instance()()).status, 200);
  assert.equal(f.posts().length, 1);
});

test('lost reservation acknowledgement sends no POST and never expires into a blind retry', async () => {
  const f = fixture(); f.loseReservationAck();
  assert.equal((await f.invoke()).status, 503);
  assert.equal(f.posts().length, 0);
  assert.equal((await f.instance()()).status, 409);
  f.advance(DAY);
  assert.equal((await f.instance()()).status, 503);
  assert.equal(f.posts().length, 0);
});

test('failed ready persistence preserves an unresolved reservation rather than returning an unrecorded link', async () => {
  const f = fixture(); f.failReady();
  assert.equal((await f.invoke()).status, 503);
  assert.equal(f.records()[0][1].status, 'unknown');
  assert.equal((await f.instance()()).status, 503);
  assert.equal(f.posts().length, 1);
});

test('active family subscription, missing family and invalid identity refuse payment before reservation', async () => {
  const f = fixture();
  f.docs.set('families/parent', { pro: true });
  assert.equal((await f.invoke()).body.error, 'already_pro');
  assert.equal((await f.invoke({ uid: 'child' })).status, 403);
  assert.equal((await f.invoke({ uid: 'missing' })).status, 403);
  assert.equal((await f.invoke({ uid: '' })).status, 401);
  assert.equal((await f.invoke({ uid: 'invalid' })).status, 401);
  assert.equal(f.calls.length, 0);
  assert.equal(f.records().length, 0);
});

test('checkout rechecks family Pro in the replacement transaction', async () => {
  const f = fixture(); await f.invoke();
  Object.assign(f.sessions.get('cks_1'), { payment_id: 'pay_1', payment_status: 'failed' });
  f.setProvider(async (url, options) => {
    const response = await f.defaultProvider(url, options);
    f.docs.set('families/parent', { pro: true });
    return response;
  });
  assert.equal((await f.invoke()).body.error, 'already_pro');
  assert.equal(f.posts().length, 1);
});

async function paidFixture(status = 'expired') {
  const f = fixture();
  await f.invoke(); f.advance(32 * DAY);
  Object.assign(f.sessions.get('cks_1'), { payment_id: 'pay_1', payment_status: 'succeeded' });
  const metadata = { parentUid: 'parent', checkoutAttemptId: f.records()[0][1].attemptId };
  f.providerObjects.set('payments/pay_1', { payment_id: 'pay_1', status: 'succeeded', subscription_id: 'sub_1',
    checkout_session_id: 'cks_1', metadata });
  f.providerObjects.set('subscriptions/sub_1', { subscription_id: 'sub_1', status, product_id: 'pro-product',
    next_billing_date: '2026-10-24T00:00:00Z', metadata });
  return f;
}

test('successful purchase can renew only after matching provider subscription is terminal and paid period ended', async () => {
  for (const status of ['expired', 'cancelled']) {
    const f = await paidFixture(status);
    const results = await Promise.all([f.instance()(), f.instance()()]);
    assert.equal(f.posts().length, 2);
    assert.ok(results.some((result) => result.status === 200));
    assert.equal(f.records()[0][1].sessionId, 'cks_2');
    assert.equal(f.docs.get('families/parent').pro, undefined, 'checkout never grants Pro');
  }
});

test('paid active/on_hold/unknown or cancelled-but-still-paid subscription cannot create another purchase', async () => {
  for (const status of ['active', 'on_hold', 'unknown_future_status', 'cancelled']) {
    const f = await paidFixture(status);
    if (status === 'cancelled') f.providerObjects.get('subscriptions/sub_1').next_billing_date = '2026-11-24T00:00:00Z';
    const result = await f.invoke();
    assert.equal(result.status, 409);
    assert.equal(result.body.error, 'checkout_payment_pending');
    assert.equal(f.posts().length, 1);
  }
});

test('renewal rejects absent/conflicting ownership, wrong product/session/attempt and unverified periods', async () => {
  const changes = [
    (f) => { f.providerObjects.get('payments/pay_1').metadata = { parentUid: 'stranger' }; },
    (f) => { f.providerObjects.get('payments/pay_1').metadata = {}; f.providerObjects.get('subscriptions/sub_1').metadata = {}; },
    (f) => { f.providerObjects.get('subscriptions/sub_1').product_id = 'other-product'; },
    (f) => { f.providerObjects.get('payments/pay_1').checkout_session_id = 'cks_other'; },
    (f) => { f.providerObjects.get('payments/pay_1').metadata = { parentUid: 'parent', checkoutAttemptId: 'other' }; },
    (f) => { f.providerObjects.get('subscriptions/sub_1').next_billing_date = 'invalid'; },
    (f) => { f.providerObjects.get('subscriptions/sub_1').expires_at = 'invalid'; },
    (f) => { f.providerObjects.set('payments/pay_1', new Error('payment read offline')); },
    (f) => { f.providerObjects.delete('subscriptions/sub_1'); },
  ];
  for (const change of changes) {
    const f = await paidFixture(); change(f);
    assert.equal((await f.invoke()).status, 503);
    assert.equal(f.posts().length, 1);
  }
});

test('renewal reconciles outside the transaction but rechecks family activation before its one replacement POST', async () => {
  const f = await paidFixture();
  f.setProvider(async (url, options) => {
    const response = await f.defaultProvider(url, options);
    if (url.includes('/subscriptions/')) f.docs.set('families/parent', { pro: true });
    return response;
  });
  assert.equal((await f.invoke()).body.error, 'already_pro');
  assert.equal(f.posts().length, 1);
});
