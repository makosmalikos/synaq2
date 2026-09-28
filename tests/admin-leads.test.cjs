const test = require('node:test');
const assert = require('node:assert/strict');
const adminLeads = require('../backend/handlers/admin-leads');

function response() {
  return { statusCode: 200, headers: {}, body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; } };
}

function fixture() {
  const records = new Map([['lead-1', { name: 'Алия', phone: '+7 777 123 45 67', role: 'parent',
    comment: 'НИШ', lang: 'kk', status: 'new', createdAt: new Date('2026-09-28T10:00:00.000Z') }]]);
  const ref = (id) => ({
    async get() { return { exists: records.has(id), data: () => records.get(id) }; },
    async update(value) { records.set(id, { ...records.get(id), ...value }); },
  });
  const db = { collection(name) {
    assert.equal(name, 'leads');
    return {
      doc: ref,
      orderBy(field, direction) {
        assert.equal(field, 'createdAt'); assert.equal(direction, 'desc');
        return { limit(size) { assert.equal(size, 100); return { async get() {
          return { docs: [...records].map(([id, data]) => ({ id, data: () => data })) };
        } }; } };
      },
    };
  } };
  const auth = { async verifyIdToken(token, revoked) {
    assert.equal(revoked, true);
    if (token !== 'admin') throw Object.assign(new Error('bad token'), { code: 'auth/id-token-expired' });
    return { uid: 'admin-1', email: 'makosmalikos@gmail.com', admin: true, adminAuthVersion: 2 };
  } };
  return { records, handler: adminLeads.createHandler({ admin: () => ({ auth, db }) }) };
}

test('admin lead inbox requires the current admin claim and returns bounded safe fields', async () => {
  const { handler } = fixture();
  const denied = response();
  await handler({ method: 'GET', headers: {} }, denied);
  assert.equal(denied.statusCode, 403);

  const res = response();
  await handler({ method: 'GET', headers: { authorization: 'Bearer admin' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.leads.length, 1);
  assert.equal(res.body.leads[0].name, 'Алия');
  assert.equal(res.body.leads[0].createdAt, '2026-09-28T10:00:00.000Z');
  assert.equal('updatedBy' in res.body.leads[0], false);
});

test('admin can change only a known lead to a supported status', async () => {
  const { handler, records } = fixture();
  const res = response();
  await handler({ method: 'PATCH', headers: { authorization: 'Bearer admin' }, body: { id: 'lead-1', status: 'contacted' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(records.get('lead-1').status, 'contacted');
  assert.equal(records.get('lead-1').updatedBy, 'makosmalikos@gmail.com');

  const invalid = response();
  await handler({ method: 'PATCH', headers: { authorization: 'Bearer admin' }, body: { id: 'lead-1', status: 'deleted' } }, invalid);
  assert.equal(invalid.statusCode, 400);
});
