const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const plans = require('../backend/lib/plans');
const payments = require('../shared/payments.json');

function fixture() {
  const docs = new Map([['families/parent', { parentName: 'Parent' }]]);
  const reads = [];
  const auth = { verifyIdToken: async (token, revoked) => {
    assert.equal(revoked, true);
    if (token === 'invalid') throw Object.assign(Error('bad token'), { code: 'auth/invalid-id-token' });
    return { uid: token, email: token === 'child' ? 'child@synaq.kids' : `${token}@example.test` };
  } };
  const db = { collection: (collection) => ({ doc: (id) => ({ get: async () => {
    const key = `${collection}/${id}`; reads.push(key);
    return { exists: docs.has(key), data: () => docs.get(key) };
  } }) }) };
  const context = { module: { exports: {} }, console,
    fetch() { throw Error('Kaspi link lookup must never call a payment provider'); },
    require(name) {
      if (name === '../backend/lib/firebase-admin') return { getAdmin: () => ({ auth, db }) };
      if (name === '../backend/lib/plans') return plans;
      if (name === '../shared/payments.json') return payments;
      throw Error(`Unexpected dependency ${name}`);
    },
  };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../api/checkout.js`, 'utf8'), context);
  async function invoke({ uid = 'parent', method = 'POST', body = {} } = {}) {
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await context.module.exports({ method, body, headers: { authorization: uid ? `Bearer ${uid}` : '' } }, res);
    return res;
  }
  return { docs, reads, invoke };
}

test('Kaspi lookup validates method, revoked token, parent identity and family', async () => {
  const f = fixture();
  for (const [request, status] of [[{ method: 'GET' }, 405], [{ uid: '' }, 401], [{ uid: 'invalid' }, 401], [{ uid: 'child' }, 403], [{ uid: 'missing' }, 403]]) {
    assert.equal((await f.invoke(request)).statusCode, status);
  }
});

test('all paid plans return the fixed Kaspi link and server prices, without writing access', async () => {
  const f = fixture(), before = structuredClone([...f.docs]);
  for (const [body, price] of [[{ plan: 'pro' }, 5999], [{ plan: 'mentor', lessons: 2 }, 44999], [{ plan: 'mentor', lessons: 3 }, 59999]]) {
    const result = await f.invoke({ body: { ...body, priceKzt: 1, uid: 'other', url: 'https://attacker.test' } });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.url, payments.kaspiUrl);
    assert.equal(result.body.priceKzt, price);
    assert.equal(result.body.manualActivation, true);
    assert.equal(result.headers['Cache-Control'], 'private, no-store');
  }
  assert.deepEqual([...f.docs], before);
  assert.ok(f.reads.every(key => key === 'families/parent'));
});

test('invalid plans and duplicate or overlapping subscriptions cannot initiate a new payment', async () => {
  const f = fixture();
  for (const body of [{ plan: 'free' }, { plan: 'standard' }, { plan: 'mentor' }, { plan: 'mentor', lessons: 4 }]) {
    assert.equal((await f.invoke({ body })).statusCode, 400);
  }
  f.docs.set('families/parent', { plan: 'pro' });
  assert.equal((await f.invoke()).body.error, 'already_pro');
  assert.equal((await f.invoke({ body: { plan: 'mentor', lessons: 2 } })).body.error, 'plan_change_required');
  f.docs.set('families/parent', { plan: 'mentor' });
  assert.equal((await f.invoke({ body: { plan: 'mentor', lessons: 3 } })).body.error, 'already_plan');
  f.docs.set('families/parent', { plan: 'pro', planExpiresAt: new Date(Date.now() - 1) });
  assert.equal((await f.invoke()).statusCode, 200);
});
