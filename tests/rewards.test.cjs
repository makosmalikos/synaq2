const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../backend/handlers/rewards');
const { REWARDS, coinBalance } = require('../backend/lib/reward-catalog');

function fixture() {
  const records = new Map([
    ['childIndex/kid', { parentUid: 'parent' }],
    ['families/parent/children/kid', { code: 'kid' }],
    ['results/kid/stats/summary', { xp: 8000 }],
    ['families/parent', { parentEmail: 'parent@example.com' }],
  ]);
  let tail = Promise.resolve();
  const snapshot = (path) => ({ id: path.split('/').at(-1), exists: records.has(path), data: () => records.get(path) });
  const doc = (path) => ({ id: path.split('/').at(-1), path, collection: (name) => collection(`${path}/${name}`), get: async () => snapshot(path) });
  const collection = (path) => ({ doc: (id) => doc(`${path}/${id || 'new'}`),
    where: (field, op, value) => ({ get: async () => ({ docs: [...records].filter(([key, row]) => key.startsWith(`${path}/`) && key.split('/').length === path.split('/').length + 1 && row[field] === value).map(([key]) => snapshot(key)) }) }),
    orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [...records].filter(([key]) => key.startsWith(`${path}/`)).map(([key]) => snapshot(key)) }) }) }),
  });
  const db = { collection, records, runTransaction(callback) {
    const work = tail.then(async () => {
      const writes = [];
      const result = await callback({ get: async (ref) => snapshot(ref.path),
        create(ref, value) { assert.equal(records.has(ref.path), false); writes.push([ref.path, value]); },
        update(ref, value) { assert.equal(records.has(ref.path), true); writes.push([ref.path, { ...records.get(ref.path), ...value }]); },
        set(ref, value, options) { writes.push([ref.path, options?.merge ? { ...records.get(ref.path), ...value } : value]); } });
      writes.forEach(([path, value]) => records.set(path, value));
      return result;
    });
    tail = work.catch(() => {});
    return work;
  } };
  const users = { kid: { uid: 'kid', email: 'kid@synaq.kids' }, parent: { uid: 'parent', email: 'parent@example.com' },
    stranger: { uid: 'stranger', email: 'other@example.com' }, admin: { uid: 'admin', email: 'nurss.aldb@gmail.com', admin: true, adminAuthVersion: 2 } };
  const handler = createHandler({ admin: () => ({ db, auth: { verifyIdToken: async (token) => users[token] } }), now: () => new Date('2026-10-06T12:00:00Z') });
  async function call(who, method = 'GET', body) {
    let status = 200, data;
    await handler({ method, body, headers: { authorization: `Bearer ${who}` } }, { setHeader() {}, status(value) { status = value; return this; }, json(value) { data = value; return this; } });
    return { status, data };
  }
  return { call, records };
}

test('catalog prices are ordered by reward value and coins do not reduce XP', () => {
  assert.deepEqual(REWARDS.map((reward) => reward.price), [4500, 6000, 7500]);
  assert.equal(coinBalance(8000, 4500), 3500);
  assert.equal(coinBalance(8000, 0), 8000);
});

test('child request needs parent approval, admin can decline and coins return', async () => {
  const f = fixture();
  const start = await f.call('kid');
  assert.equal(start.data.balance, 8000);
  const claim = await f.call('kid', 'POST', { action: 'claim', rewardId: 'steam' });
  assert.equal(claim.status, 200);
  assert.equal(claim.data.balance, 2000);
  assert.equal((await f.call('kid', 'POST', { action: 'claim', rewardId: 'book' })).status, 409);
  assert.equal((await f.call('stranger', 'POST', { action: 'approve', id: claim.data.id })).status, 403);
  assert.equal((await f.call('parent', 'POST', { action: 'approve', id: claim.data.id })).data.status, 'pending_fulfillment');
  assert.equal((await f.call('admin', 'POST', { action: 'decline', id: claim.data.id })).data.status, 'declined');
  assert.equal((await f.call('kid')).data.balance, 8000);
  assert.equal(f.records.get('results/kid/stats/summary').xp, 8000);
});

test('fulfilled reward keeps spend and enforces thirty-day cooldown', async () => {
  const f = fixture();
  const claim = await f.call('kid', 'POST', { action: 'claim', rewardId: 'book' });
  await f.call('parent', 'POST', { action: 'approve', id: claim.data.id });
  assert.equal((await f.call('admin', 'POST', { action: 'fulfill', id: claim.data.id })).data.status, 'fulfilled');
  assert.equal((await f.call('kid')).data.balance, 3500);
  f.records.set('results/kid/stats/summary', { xp: 20000 });
  assert.equal((await f.call('kid', 'POST', { action: 'claim', rewardId: 'book' })).data.error, 'monthly_limit');
});

test('unapproved request can be cancelled and parent rejection restores coins', async () => {
  const f = fixture();
  const first = await f.call('kid', 'POST', { action: 'claim', rewardId: 'book' });
  assert.equal((await f.call('kid', 'POST', { action: 'cancel', id: first.data.id })).data.status, 'cancelled');
  assert.equal((await f.call('kid')).data.balance, 8000);
  const second = await f.call('kid', 'POST', { action: 'claim', rewardId: 'book' });
  assert.equal((await f.call('parent', 'POST', { action: 'reject', id: second.data.id })).data.status, 'rejected');
  assert.equal((await f.call('kid')).data.balance, 8000);
  assert.equal((await f.call('admin', 'POST', { action: 'fulfill', id: second.data.id })).status, 409);
});
