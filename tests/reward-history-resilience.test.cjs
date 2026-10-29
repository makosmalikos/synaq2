const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../backend/handlers/rewards');

async function history(role, dates) {
  const rows = dates.map((createdAt, i) => ({ id: 'request-' + i, data: () => ({ childUid: 'kid', parentUid: 'parent', status: 'cancelled', createdAt, updatedAt: createdAt }) }));
  const collection = name => ({ doc: () => ({ get: async () => ({ exists: true, data: () => name === 'childIndex' ? { parentUid: 'parent' } : name === 'families' ? { parentEmail: 'test@example.test' } : { xp: 5000 } }), collection }),
    where: () => ({ get: async () => ({ docs: rows }) }), orderBy: () => ({ limit: () => ({ get: async () => ({ docs: rows }) }) }) });
  const users = { child: { uid: 'kid', email: 'kid@synaq.kids' }, parent: { uid: 'parent', email: 'parent@example.test' } };
  const handler = createHandler({ admin: () => ({ db: { collection }, auth: { verifyIdToken: async () => users[role] } }) });
  let status = 200, body;
  await handler({ method: 'GET', headers: { authorization: 'Bearer test' } }, { setHeader() {}, status(n) { status = n; return this; }, json(value) { body = value; } });
  return { status, body };
}
for (const role of ['child', 'parent']) {
  for (const [kind, value] of [['missing', undefined], ['null', null], ['invalid', new Date(NaN)], ['legacy ISO', '2026-10-01T12:00:00.000Z']]) {
    test(`reward history for ${role} survives a ${kind} date and retains valid requests`, async () => {
      const result = await history(role, [value, new Date('2026-10-26T12:00:00Z'), new Date('2026-10-25T12:00:00Z')]);
      assert.equal(result.status, 200);
      assert.equal(result.body.requests.length, 3);
      assert.equal(result.body.requests[0].createdAt, '2026-10-26T12:00:00.000Z');
      assert.equal(result.body.requests[1].createdAt, '2026-10-25T12:00:00.000Z');
      assert.equal(result.body.requests[2].createdAt, kind === 'legacy ISO' ? value : null);
    });
  }
}
