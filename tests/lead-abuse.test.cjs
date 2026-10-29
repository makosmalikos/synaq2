const { test } = require('node:test');
const assert = require('node:assert/strict');
const lead = require('../backend/handlers/lead');

function fixture(options = {}) {
  const records = new Map(); let next = 0, at = Date.parse('2026-10-26T10:15:00Z');
  const db = { collection: name => ({ doc: id => ({ path: `${name}/${id || ++next}` }) }),
    async runTransaction(fn) {
      const writes = [];
      await fn({ get: async ref => ({ exists: records.has(ref.path), data: () => records.get(ref.path) }), set: (ref, data) => writes.push([ref.path, data]) });
      for (const [path, data] of writes) records.set(path, data);
    } };
  const handler = lead.createHandler({ admin: () => ({ db }), now: () => new Date(at), ...options });
  async function send({ ip = '203.0.113.7', forward = ip, phone = '+77771234567', website = '' } = {}) {
    const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(value) { this.body = value; return this; } };
    await handler({ method: 'POST', socket: { remoteAddress: ip }, headers: { 'x-forwarded-for': forward }, body: { name: 'Local fixture', phone, role: 'parent', website } }, res);
    return res;
  }
  return { records, send, nextHour: () => { at += 3600000; } };
}
test('forged forwarding headers cannot rotate the lead IP allowance on a direct server', async () => {
  const f = fixture({ trustVercel: false });
  for (let i = 0; i < 5; i++) assert.equal((await f.send({ forward: `198.51.100.${i}`, phone: '+7777000000' + i })).code, 201);
  const denied = await f.send({ forward: '198.51.100.99', phone: '+77770000099' });
  assert.equal(denied.code, 429); assert.ok(Number(denied.headers['Retry-After']) > 0);
  assert.equal([...f.records.keys()].filter(p => p.startsWith('leads/')).length, 5);
});
test('rotating trusted IPs cannot spam the same normalized contact', async () => {
  const f = fixture({ trustVercel: true });
  for (let i = 0; i < 3; i++) assert.equal((await f.send({ forward: `198.51.100.${i}` })).code, 201);
  assert.equal((await f.send({ forward: '198.51.100.99', phone: '+7 (777) 123-45-67' })).code, 429);
  assert.equal([...f.records.keys()].filter(p => p.startsWith('leads/')).length, 3);
});
test('lead global circuit breaker bounds rotating IPs and contacts, rejects atomically and resets by hour', async () => {
  const f = fixture({ trustVercel: true, globalLimit: 4 });
  for (let i = 0; i < 4; i++) assert.equal((await f.send({ forward: `198.51.100.${i}`, phone: '+7777000000' + i })).code, 201);
  const before = JSON.stringify([...f.records]);
  assert.equal((await f.send({ forward: '198.51.100.99', phone: '+77779999999' })).code, 429);
  assert.equal(JSON.stringify([...f.records]), before);
  f.nextHour(); assert.equal((await f.send()).code, 201);
});
test('honeypot lead succeeds quietly without allocating counters or records', async () => {
  const f = fixture(); assert.equal((await f.send({ website: 'spam.test' })).code, 201); assert.equal(f.records.size, 0);
});
