const test = require('node:test');
const assert = require('node:assert/strict');
const lead = require('../backend/handlers/lead');

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test('lead validation accepts a real contact and rejects malformed or bot input', () => {
  assert.deepEqual(lead.validate({ name: ' Алия ', phone: '+7 777 123 45 67', role: 'parent', comment: ' НИШ ' }), {
    name: 'Алия', phone: '+7 777 123 45 67', role: 'parent', comment: 'НИШ',
  });
  assert.equal(lead.validate({ name: 'A', phone: 'not-a-phone', role: 'parent' }), null);
  assert.deepEqual(lead.validate({ name: 'Алия', phone: '+77771234567', role: 'parent', website: 'spam.test' }), { bot: true });
});

test('lead endpoint stores validated data without retaining a raw IP address', async () => {
  const writes = [];
  const db = {
    collection(name) {
      return { doc(id) { return { collection: name, id: id || 'generated-lead' }; } };
    },
    async runTransaction(callback) {
      await callback({
        async get() { return { exists: false, data: () => ({}) }; },
        set(ref, value) { writes.push({ ref, value }); },
      });
    },
  };
  const handler = lead.createHandler({ admin: () => ({ db }), now: () => new Date('2026-09-28T10:15:00.000Z') });
  const res = response();
  await handler({ method: 'POST', headers: { 'x-forwarded-for': '203.0.113.7' }, socket: {},
    body: { name: 'Алия', phone: '+7 777 123 45 67', role: 'parent', comment: '', lang: 'kk' } }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(writes.length, 2);
  const stored = writes.find(({ ref }) => ref.collection === 'leads').value;
  assert.equal(stored.name, 'Алия');
  assert.equal(stored.lang, 'kk');
  assert.equal('ip' in stored, false);
  assert.equal(writes.some(({ value }) => JSON.stringify(value).includes('203.0.113.7')), false);
});

test('lead endpoint rejects invalid submissions before touching Firestore', async () => {
  const handler = lead.createHandler({ admin: () => { throw new Error('must not run'); } });
  const res = response();
  await handler({ method: 'POST', headers: {}, socket: {}, body: { name: 'A', phone: 'x', role: 'other' } }, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'invalid_lead' });
});
