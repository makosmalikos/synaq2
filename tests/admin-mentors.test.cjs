const test = require('node:test');
const assert = require('node:assert/strict');
const adminMentors = require('../backend/handlers/admin-mentors');

const response = () => ({ statusCode: 200, headers: {}, body: null,
  setHeader(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; } });

function fixture() {
  const records = new Map();
  const ref = (id) => ({ async get() { return { exists: records.has(id), data: () => records.get(id) }; },
    async set(value, options) { records.set(id, options?.merge ? { ...records.get(id), ...value } : value); } });
  const db = { collection(name) { assert.equal(name, 'mentors');
    return { doc: ref, orderBy() { return { limit() { return { async get() {
      return { docs: [...records].map(([id, data]) => ({ id, data: () => data })) }; } }; } }; } }; } };
  const auth = { async verifyIdToken(token) {
    if (token !== 'admin') throw Object.assign(new Error('bad'), { code: 'auth/id-token-expired' });
    return { uid: 'a', email: 'makosmalikos@gmail.com', admin: true, adminAuthVersion: 2 }; } };
  const handler = adminMentors.createHandler({ admin: () => ({ auth, db }) });
  const call = async (method, body, token = 'admin', query) => { const res = response();
    await handler({ method, headers: { authorization: `Bearer ${token}` }, body, query }, res); return res; };
  return { records, call };
}

test('mentors admin: only admins, validates input, creates, updates schedule and hides mentor', async () => {
  const { call } = fixture();
  assert.equal((await call('GET', null, 'user')).statusCode, 403);
  const base = { name: 'Айгерим', email: 'Aigerim@Mail.com', meetLink: 'https://meet.google.com/abc-defg-hij', slots: [{ day: 2, time: '17:00' }, { day: 2, time: '17:00' }, { day: 1, time: '16:20' }] };
  assert.equal((await call('POST', { ...base, email: 'x' })).statusCode, 400);
  assert.equal((await call('POST', { ...base, meetLink: 'http://evil' })).statusCode, 400);
  assert.equal((await call('POST', { ...base, slots: [{ day: 9, time: '10:00' }] })).statusCode, 400);
  const created = await call('POST', base);
  assert.equal(created.statusCode, 201);
  const mentor = created.body.mentor;
  assert.equal(mentor.email, 'aigerim@mail.com');
  assert.deepEqual(mentor.slots, [{ day: 1, time: '16:20' }, { day: 2, time: '17:00' }]);
  assert.equal(mentor.rateKzt, 3000);
  const updated = await call('POST', { ...base, id: mentor.id, slots: [{ day: 3, time: '18:00' }] });
  assert.deepEqual(updated.body.mentor.slots, [{ day: 3, time: '18:00' }]);
  assert.equal((await call('GET')).body.mentors.length, 1);
  assert.equal((await call('DELETE', null, 'admin', { id: mentor.id })).statusCode, 200);
  assert.equal((await call('GET')).body.mentors[0].active, false);
});
