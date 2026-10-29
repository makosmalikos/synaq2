const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { enabled, configure, shutdown, liveFixture } = require('./helpers/deep-live-fixture.cjs');
before(configure); after(shutdown);
const options = { skip: !enabled, timeout: 120000 };

test('an Auth signup using a child-shaped email cannot create duels without a server-owned family link', options, async () => liveFixture(async f => {
  const { auth } = require('../backend/lib/firebase-admin').getAdmin();
  const { loadEmulatorClient, sdk } = require('./helpers/emulator-browser-client.cjs');
  const uid = 'orphan' + randomUUID().replaceAll('-', ''), password = 'Local-audit-123!';
  await auth.createUser({ uid, email: uid + '@synaq.kids', password });
  const client = await loadEmulatorClient(uid);
  try {
    await client.loginChild(uid, password);
    const token = await client.auth.currentUser.getIdToken();
    const result = await f.post('duel', { action: 'create', name: 'Local security fixture' }, token);
    if (result.body.code) { f.track('duels/' + result.body.code); f.track('duelPrivate/' + result.body.code); }
    f.track('duelRateLimits/' + uid);
    assert.equal(result.status, 403);
    assert.equal((await f.db.doc('duelRateLimits/' + uid).get()).exists, false);
    const award = await f.post('duel-award', { code: 'ABC234' }, token);
    assert.equal(award.status, 403);
  } finally {
    await sdk.terminate(client.db); await sdk.deleteApp(client.auth.app);
    await f.db.recursiveDelete(f.db.doc('results/' + uid));
    await auth.deleteUser(uid);
  }
}));

test('a valid linked child may create a duel but a broken mirror cannot create one or claim XP', options, async () => liveFixture(async f => {
  const valid = await f.post('duel', { action: 'create', name: 'Local security fixture' });
  assert.equal(valid.status, 200);
  f.track('duels/' + valid.body.code); f.track('duelPrivate/' + valid.body.code); f.track('duelRateLimits/' + f.uid);
  await f.db.doc(`families/${f.parentUid}/children/${f.uid}`).update({ code: 'differentidentity' });
  for (const [route, body] of [['duel', { action: 'create' }], ['duel-award', { code: valid.body.code }]]) {
    const result = await f.post(route, body);
    assert.equal(result.status, 403);
  }
  assert.equal((await f.db.doc('duelRateLimits/' + f.uid).get()).data().created, 1);
}));
