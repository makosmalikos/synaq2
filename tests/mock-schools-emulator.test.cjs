const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const enabled = !!process.env.FIREBASE_AUTH_EMULATOR_HOST && !!process.env.FIRESTORE_EMULATOR_HOST;
before(() => {
  if (!enabled) return;
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
  for (const key of ['FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_CONFIG']) delete process.env[key];
  Object.assign(process.env, { SYNAQ_USE_EMULATORS: '1', FIREBASE_PROJECT_ID: 'demo-synaq-tests', GOOGLE_CLOUD_PROJECT: 'demo-synaq-tests', GCLOUD_PROJECT: 'demo-synaq-tests', NODE_ENV: 'test' });
});
after(async () => {
  if (!enabled) return;
  await require('../backend/lib/firebase-admin').getAdmin().db.terminate();
  const { getApps, deleteApp } = require('firebase-admin/app');
  for (const app of getApps()) await deleteApp(app);
});

async function fixture(action) {
  const { db, auth } = require('../backend/lib/firebase-admin').getAdmin();
  const { loadEmulatorClient, sdk } = require('./helpers/emulator-browser-client.cjs');
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12), parentUid = 'scenarioparent' + suffix;
  const uids = ['scenarioa' + suffix, 'scenariob' + suffix], clients = [], ids = [];
  const server = require('../backend/server').createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    await db.doc('families/' + parentUid).set({ plan: 'pro', parentName: 'Scenario fixture' });
    for (const uid of uids) {
      await auth.createUser({ uid, email: uid + '@synaq.kids', password: 'scenario-pin-123' });
      const child = { parentUid, code: uid, klass: '6', name: 'Scenario fixture' };
      await db.doc(`families/${parentUid}/children/${uid}`).set(child);
      await db.doc('childIndex/' + uid).set(child);
      const client = await loadEmulatorClient('schools-' + uid);
      clients.push(client);
      await client.loginChild(uid, 'scenario-pin-123');
    }
    const tokens = await Promise.all(clients.map(client => client.auth.currentUser.getIdToken()));
    const post = async (body, token = tokens[0]) => {
      const response = await fetch(origin + '/api/mock-session', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) });
      return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
    };
    const start = async school => {
      const id = 'school_' + randomUUID(); ids.push(id);
      const catalog = await post({ action: 'catalog' });
      assert.equal(catalog.status, 200);
      const result = await post({ action: 'start', id, school, weekKey: catalog.body.weekly.weekKey, excludeQuestionIds: [] });
      assert.equal(result.status, 200);
      return { id, ...result.body };
    };
    await action({ db, uids, parentUid, clients, tokens, post, start });
  } finally {
    for (const client of clients) { await sdk.terminate(client.db); await sdk.deleteApp(client.auth.app); }
    await new Promise(resolve => { server.close(resolve); server.closeIdleConnections?.(); });
    for (const uid of uids) {
      for (const id of ids) await db.doc(`mockSessions/${uid}_${id}`).delete();
      await db.doc('mockRateLimits/' + uid).delete();
      await db.recursiveDelete(db.doc('results/' + uid));
      await db.doc('childIndex/' + uid).delete();
      await auth.deleteUser(uid).catch(error => { if (error.code !== 'auth/user-not-found') throw error; });
    }
    await db.recursiveDelete(db.doc('families/' + parentUid));
  }
}

for (const [school, count] of [['БИЛ', 60], ['НИШ', 180], ['РФМШ', 30]]) {
  test(`full ${school} mock keeps all ${count} questions, grades answers and skips, and replays one result`, { skip: !enabled, timeout: 120000 }, async () => fixture(async ({ db, uids, clients, post, start }) => {
    const started = await start(school);
    assert.equal(started.test.shortened, false);
    assert.equal(started.test.questions.length, count);
    assert.deepEqual(started.test.questions.map(q => q.num), Array.from({ length: count }, (_, i) => i + 1));
    for (const q of started.test.questions) { assert.equal(q.answer, undefined); assert.equal(q.solution, undefined); }
    const restored = await post({ action: 'resume', id: started.id });
    assert.equal(restored.status, 200);
    assert.equal(restored.body.deadline, started.deadline);
    assert.deepEqual(restored.body.test.questions.map(q => q.id), started.test.questions.map(q => q.id));
    const session = (await db.doc(`mockSessions/${uids[0]}_${started.id}`).get()).data();
    const secret = await require('../backend/lib/mock-bank').restoreMock(db, session);
    const answers = { 1: String(secret.questions[0].answer), 2: '__wrong_scenario_answer__' };
    if (school === 'НИШ') await require('./helpers/nis-session.cjs').completeNisPhases(post, started.id, answers);
    const finished = await post({ action: 'submit', id: started.id, answers });
    assert.equal(finished.status, 200);
    const result = finished.body.result;
    assert.equal(result.score, 1); assert.equal(result.total, count); assert.equal(result.review.length, count);
    assert.equal(result.review[0].correct, true); assert.equal(result.review[1].correct, false);
    assert.equal(result.review.filter(q => q.your == null).length, count - 2);
    assert.equal(result.review[0].answer, secret.questions[0].answer);
    if (school === 'БИЛ') { assert.equal(result.points, 3); assert.equal(result.wrong, 1); }
    const duplicate = await post({ action: 'submit', id: started.id, answers: {} });
    assert.equal(duplicate.status, 200); assert.deepEqual(duplicate.body.result, result);
    const completed = await post({ action: 'resume', id: started.id });
    assert.equal(completed.body.completed, true); assert.deepEqual(completed.body.result, result);
    assert.equal((await clients[0].getMocks(uids[0])).filter(r => r.sourceId === started.id).length, 1);
  }));
}

test('mock sessions deny anonymous access and another linked child cannot resume or submit an attempt', { skip: !enabled, timeout: 120000 }, async () => fixture(async ({ post, tokens, start }) => {
  const started = await start('БИЛ');
  for (const action of ['resume', 'submit', 'phase']) {
    const body = { action, id: started.id, answers: {} };
    const anonymous = await post(body, null);
    assert.equal(anonymous.status, 401); assert.match(anonymous.cache, /private.*no-store/);
    const sibling = await post(body, tokens[1]);
    assert.equal(sibling.status, 404); assert.equal(sibling.body.result, undefined); assert.equal(sibling.body.test, undefined);
  }
  const owner = await post({ action: 'resume', id: started.id });
  assert.equal(owner.status, 200); assert.equal(owner.body.completed, undefined);
}));
