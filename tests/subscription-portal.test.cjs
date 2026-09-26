const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(`${__dirname}/../api/subscription-portal.js`, 'utf8');

function fixture({ tokenUser, family, ledger, subscription, payment, portalLink } = {}) {
  const calls = [];
  const docs = new Map();
  if (family !== null) docs.set('families/parent', family || { dodoSubId: 'sub_owned' });
  if (ledger !== null) docs.set('paymentSubscriptions/sub_owned', ledger || { parentUid: 'parent' });
  const snap = (path) => ({ exists: docs.has(path), data: () => docs.get(path) });
  const db = { collection: (name) => ({ doc: (id) => ({ path: `${name}/${id}`, get: async () => snap(`${name}/${id}`) }) }) };
  const auth = { verifyIdToken: async (token, revoked) => {
    assert.equal(revoked, true);
    if (token === 'bad') throw Object.assign(Error('bad'), { code: 'auth/id-token-expired' });
    return tokenUser || { uid: 'parent', email: 'parent@example.test' };
  } };
  const providerSubscription = subscription || {
    subscription_id: 'sub_owned', metadata: { parentUid: 'parent' }, customer: { customer_id: 'cus_owner' },
  };
  const context = { module: { exports: {} }, URL, URLSearchParams, AbortSignal,
    console: { error() {} }, process: { env: {
      FIREBASE_PROJECT_ID: 'test', FIREBASE_CLIENT_EMAIL: 'test@example.test', FIREBASE_PRIVATE_KEY: 'key',
      DODO_PAYMENTS_API_KEY: 'dodo-key', DODO_ENV: 'test_mode', APP_URL: 'https://synaq.app',
    } },
    require(name) {
      if (name === '../backend/lib/firebase-admin') return { getAdmin: () => ({ auth, db }) };
      throw Error(`unexpected dependency ${name}`);
    },
    async fetch(url, options) {
      calls.push({ url, options });
      const path = new URL(url).pathname;
      if (path === '/subscriptions/sub_owned') return { ok: true, status: 200, json: async () => providerSubscription };
      if (path === '/subscriptions/pay_legacy') return { ok: false, status: 404, json: async () => ({}) };
      if (path === '/payments/pay_legacy') return { ok: true, status: 200, json: async () => payment || { subscription_id: 'sub_owned' } };
      if (path === '/customers/cus_owner/customer-portal/session') return { ok: true, status: 200,
        json: async () => ({ link: portalLink || 'https://customer-portal.dodopayments.com/session/test' }) };
      return { ok: false, status: 404, json: async () => ({}) };
    },
  };
  vm.runInNewContext(source, context, { filename: 'subscription-portal.js' });
  async function invoke(token = 'parent', method = 'POST') {
    const req = { method, headers: { authorization: token ? `Bearer ${token}` : '' } };
    const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; },
      status(code) { this.statusCode = code; return this; }, json(value) { this.body = structuredClone(value); return this; } };
    await context.module.exports(req, res);
    return { status: res.statusCode, body: res.body };
  }
  return { invoke, calls, docs };
}

test('authenticated parent receives only the provider portal for the owned subscription', async () => {
  const f = fixture();
  const result = await f.invoke();
  assert.equal(result.status, 200);
  assert.equal(result.body.url, 'https://customer-portal.dodopayments.com/session/test');
  assert.equal(f.calls.length, 2);
  const portal = new URL(f.calls[1].url);
  assert.equal(portal.pathname, '/customers/cus_owner/customer-portal/session');
  assert.equal(portal.searchParams.get('return_url'), 'https://synaq.app/app');
  assert.equal(f.calls[1].options.method, 'POST');
});

test('legacy stored payment resolves its subscription before opening the portal', async () => {
  const f = fixture({ family: { dodoSubId: 'pay_legacy' } });
  const result = await f.invoke();
  assert.equal(result.status, 200);
  assert.deepEqual(f.calls.slice(0, 3).map((call) => new URL(call.url).pathname), [
    '/subscriptions/pay_legacy', '/payments/pay_legacy', '/subscriptions/sub_owned',
  ]);
});

test('child, missing ownership and unsafe provider links fail closed', async () => {
  const child = fixture({ tokenUser: { uid: 'child', email: 'child@synaq.kids' } });
  assert.equal((await child.invoke()).status, 403);
  assert.equal(child.calls.length, 0);

  const mismatch = fixture({ ledger: { parentUid: 'someone-else' } });
  assert.equal((await mismatch.invoke()).status, 403);
  assert.equal(mismatch.calls.length, 1);

  const unsafe = fixture({ portalLink: 'https://dodopayments.com.attacker.test/session/x' });
  const result = await unsafe.invoke();
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'portal_unavailable');
});
