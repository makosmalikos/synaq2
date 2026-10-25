const test = require('node:test');
const assert = require('node:assert/strict');
const adminStats = require('../backend/handlers/admin-stats');

const response = () => ({ statusCode: 200, headers: {}, body: null,
  setHeader(n, v) { this.headers[n] = v; }, status(c) { this.statusCode = c; return this; }, json(v) { this.body = v; return this; } });
const counter = (n) => ({ count: () => ({ get: async () => ({ data: () => ({ count: n }) }) }) });
function handler() {
  const db = {
    collection: (name) => counter(name === 'childIndex' ? 42 : 7),
    collectionGroup: () => ({ ...counter(900), where: () => counter(650) }),
  };
  const auth = { async verifyIdToken(token) {
    if (token !== 'admin') throw Object.assign(new Error('x'), { code: 'auth/argument-error' });
    return { uid: 'a', email: 'makosmalikos@gmail.com', admin: true, adminAuthVersion: 2 };
  } };
  return adminStats.createHandler({ admin: () => ({ auth, db }) });
}

test('stats are admin only', async () => {
  const res = response();
  await handler()({ method: 'GET', headers: { authorization: 'Bearer nope' } }, res);
  assert.equal(res.statusCode, 403);
});

test('stats return counts for admin', async () => {
  const res = response();
  await handler()({ method: 'GET', headers: { authorization: 'Bearer admin' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual([res.body.students, res.body.parents, res.body.tasksSolved, res.body.tasksCorrect], [42, 7, 900, 650]);
});
