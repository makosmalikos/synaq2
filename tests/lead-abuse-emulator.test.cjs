const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { enabled, configure, shutdown } = require('./helpers/deep-live-fixture.cjs');
before(() => { configure(); delete process.env.TELEGRAM_BOT_TOKEN; delete process.env.TELEGRAM_LEAD_CHAT_ID; });
after(shutdown);
for (const [kind, accepted] of [['ip', 5], ['contact', 3], ['global', 4]]) {
  test(`concurrent lead spam cannot exceed the ${kind} allowance in real Firestore`, { skip: !enabled, timeout: 120000 }, async () => {
    const { db } = require('../backend/lib/firebase-admin').getAdmin();
    const prefix = 'securityLead_' + randomUUID().replaceAll('-', '') + '_';
    const scoped = { collection: name => db.collection(prefix + name), runTransaction: db.runTransaction.bind(db) };
    const handler = require('../backend/handlers/lead').createHandler({ admin: () => ({ db: scoped }), trustVercel: true, globalLimit: kind === 'global' ? 4 : 100, now: () => new Date('2026-10-26T10:15:00Z') });
    try {
      const responses = await Promise.all(Array.from({ length: 8 }, async (_, i) => {
        const res = { code: 200, setHeader() {}, status(n) { this.code = n; return this; }, json() { return this; } };
        await handler({ method: 'POST', headers: { 'x-forwarded-for': kind === 'ip' ? '203.0.113.7' : `198.51.100.${i}` }, socket: {}, body: { name: 'Local security fixture', phone: kind === 'contact' ? '+77771234567' : '+7777000000' + i, role: 'parent' } }, res);
        return res.code;
      }));
      assert.equal(responses.filter(n => n === 201).length, accepted, JSON.stringify(responses));
      assert.ok(responses.every(n => n === 201 || n === 429));
      assert.equal((await scoped.collection('leads').get()).size, accepted);
      const global = (await scoped.collection('platformRateLimits').doc('leads').get()).data();
      assert.equal(global.count, accepted);
    } finally {
      for (const name of ['leads', 'leadRateLimits', 'platformRateLimits']) for (const row of (await scoped.collection(name).get()).docs) await row.ref.delete();
    }
  });
}
