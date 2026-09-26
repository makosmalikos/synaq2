const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');

const enabled = !!process.env.FIREBASE_AUTH_EMULATOR_HOST && !!process.env.FIRESTORE_EMULATOR_HOST;
before(() => {
  if (!enabled) return;
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
  // Never load credentials, .env, production APIs or real accounts in this suite.
  for (const key of ['FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_CONFIG']) delete process.env[key];
  process.env.SYNAQ_USE_EMULATORS = '1';
  process.env.FIREBASE_PROJECT_ID = 'demo-synaq-tests';
  process.env.GOOGLE_CLOUD_PROJECT = process.env.GCLOUD_PROJECT = 'demo-synaq-tests';
  process.env.NODE_ENV = 'test';
});
after(async () => {
  if (!enabled) return;
  const { getApps, deleteApp } = require('firebase-admin/app');
  const { getAdmin } = require('../backend/lib/firebase-admin');
  await getAdmin().db.terminate();
  for (const app of getApps()) await deleteApp(app);
});

test('real parent signup → child API → child login → retry-safe practice → parent progress', { skip: !enabled, timeout: 120000 }, async () => {
  const { loadEmulatorClient, sdk } = require('./helpers/emulator-browser-client.cjs');
  const proxy = await require('./helpers/firestore-fault-proxy.cjs').firestoreFaultProxy();
  const { createApp } = require('../backend/server');
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const rawFetch = global.fetch;
  let failLearningAnswer = false, loseLearningAcknowledgement = false;
  global.fetch = async (input, options) => {
    const url = typeof input === 'string' && input.startsWith('/api/') ? new URL(input, origin) : new URL(typeof input === 'string' ? input : input.url || input.href);
    assert.equal(url.hostname, '127.0.0.1', `External network is forbidden: ${url.hostname}`);
    assert.ok([String(server.address().port), '19099', '18080'].includes(url.port));
    const isAnswer = url.pathname === '/api/learning' && JSON.parse(options?.body || '{}').action === 'answer';
    if (isAnswer && failLearningAnswer) { failLearningAnswer = false; throw new TypeError('injected transport failure'); }
    const response = await rawFetch(url, options);
    if (isAnswer && loseLearningAcknowledgement) { loseLearningAcknowledgement = false; throw new TypeError('injected lost response'); }
    return response;
  };
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const clients = [];
  const client = async (name) => { const value = await loadEmulatorClient(`${name}-${suffix}`, { firestorePort: proxy.port }); clients.push(value); return value; };
  try {
    const parent = await client('parent');
    const credential = await parent.registerParent(`parent-${suffix}@example.test`, 'test-parent-123', 'Тестовый родитель');
    const parentUid = credential.uid;
    assert.equal(parent.auth.currentUser.uid, parentUid);
    const family = await parent.getFamily(parentUid);
    assert.equal(family.parentName, 'Тестовый родитель');
    assert.equal(family.parentEmail, `parent-${suffix}@example.test`);
    const request = { name: 'Тестовый ученик', klass: '5', code: `kid${suffix}`, pin: 'test-pin-123', requestId: randomUUID() };
    const created = await parent.createChild(parentUid, request);
    const retry = await parent.createChild(parentUid, request); // response to the first request could be lost
    assert.equal(retry.childUid, created.childUid);
    const children = await parent.getChildren(parentUid);
    assert.equal(children.length, 1);
    assert.equal(children[0].uid, created.childUid);

    const child = await client('child');
    await assert.rejects(child.loginChild(request.code, 'incorrect-pin'));
    await child.loginChild(request.code, request.pin);
    assert.equal(child.auth.currentUser.uid, created.childUid);
    const profile = await child.getMyProfile();
    assert.equal(profile.name, request.name);
    assert.equal(profile.pro, false);
    await assert.rejects(child.ensureFamilyProfile(child.auth.currentUser), { code: 'auth/parent-required' });
    await assert.rejects(child.getChildren(parentUid));

    const { POOL } = await import('../frontend/src/bank.js');
    const q = POOL.find((item) => item.school === 'РФМШ' && !item.image);
    const attemptId = randomUUID();
    const session = await child.startLearningSession(created.childUid, { mode: 'training', qid: q.id }, attemptId);
    assert.equal(session.question.answer, undefined); assert.equal(session.question.solution, undefined);
    assert.equal((await child.startLearningSession(created.childUid, { mode: 'training', qid: q.id }, attemptId)).id, attemptId);
    const payload = { sessionId: attemptId, answer: q.answer, correct: false, secs: 90000 };
    failLearningAnswer = true;
    await assert.rejects(child.saveAttempt(created.childUid, payload, attemptId));
    const saved = await child.saveAttempt(created.childUid, payload, attemptId);
    assert.equal(saved.saved, true); assert.equal(saved.gain, 5); assert.equal(saved.totalXp, 5);
    const duplicate = await child.saveAttempt(created.childUid, payload, attemptId);
    assert.equal(duplicate.saved, false); assert.equal(duplicate.totalXp, 5);
    const secondId = randomUUID();
    await child.startLearningSession(created.childUid, { mode: 'training', qid: q.id }, secondId);
    loseLearningAcknowledgement = true;
    await assert.rejects(child.saveAttempt(created.childUid, { ...payload, sessionId: secondId }, secondId));
    const replay = await child.saveAttempt(created.childUid, { ...payload, sessionId: secondId }, secondId);
    assert.equal(replay.saved, false); assert.equal(replay.gain, 0); assert.equal(replay.totalXp, 5);
    assert.equal((await child.getSolved(created.childUid)).length, 1);
    assert.equal(await child.todayCount(created.childUid), 2);

    await child.logout();
    const reloaded = await client('child-after-reload');
    await reloaded.loginChild(`${request.code}@synaq.kids`, request.pin);
    assert.equal((await reloaded.getXpSummary(created.childUid)).xp, 5);
    assert.equal((await reloaded.getAttempts(created.childUid)).length, 2);
    assert.equal((await parent.getAttempts(created.childUid)).length, 2);
    assert.ok((await parent.getXpSummary(created.childUid)).studySecs < 300, 'browser secs cannot invent an hourly bonus');

    // Open four sessions with three answers left, then answer concurrently.
    // Real Firestore transactions serialize the quota, not just a test double.
    const ids = Array.from({ length: 4 }, () => randomUUID());
    const qs = POOL.filter((item) => item.id !== q.id && !item.image).slice(0, 4);
    await Promise.all(ids.map((id, i) => reloaded.startLearningSession(created.childUid, { mode: 'training', qid: qs[i].id }, id)));
    const quotaRace = await Promise.allSettled(ids.map((id, i) => reloaded.saveAttempt(created.childUid, { sessionId: id, answer: String(qs[i].answer) }, id)));
    assert.equal(quotaRace.filter((item) => item.status === 'fulfilled').length, 3);
    assert.equal(quotaRace.find((item) => item.status === 'rejected').reason.code, 'learning/daily-limit');
    assert.equal(await reloaded.todayCount(created.childUid), 5);
    assert.equal((await parent.getAttempts(created.childUid)).length, 5);
    assert.equal((await parent.getXpSummary(created.childUid)).xp, 20);

    const outsider = await client('outsider');
    await outsider.registerParent(`outsider-${suffix}@example.test`, 'test-outsider-123', 'Другой родитель');
    await assert.rejects(outsider.getAttempts(created.childUid));
    await assert.rejects(outsider.createChild(outsider.auth.currentUser.uid, request));
    assert.equal((await parent.getChildren(parentUid)).length, 1);

    // Separate tabs with distinct request IDs must not bypass the one-child limit.
    const raceRequests = ['a', 'b'].map((tag) => ({ ...request, code: `race${tag}${suffix}`, requestId: randomUUID() }));
    const raced = await Promise.allSettled(raceRequests.map((value) => outsider.createChild(outsider.auth.currentUser.uid, value)));
    assert.equal(raced.filter((result) => result.status === 'fulfilled').length, 1);
    const loser = raced.findIndex((result) => result.status === 'rejected');
    assert.equal(raced[loser].reason.code, 'auth/child-limit');
    assert.equal((await outsider.getChildren(outsider.auth.currentUser.uid)).length, 1);
    const { getAdmin } = require('../backend/lib/firebase-admin');
    await assert.rejects(getAdmin().auth.getUserByEmail(`${raceRequests[loser].code}@synaq.kids`), { code: 'auth/user-not-found' });

    // Recovering the child's PIN preserves identity and all saved progress.
    await assert.rejects(outsider.resetChildPassword(created.childUid, 'unauthorized-pin'), { code: 'auth/not-child-owner' });
    await parent.resetChildPassword(created.childUid, 'new-demo-pin-123');
    await reloaded.logout();
    await assert.rejects(reloaded.loginChild(request.code, request.pin));
    await reloaded.loginChild(request.code, 'new-demo-pin-123');
    assert.equal(reloaded.auth.currentUser.uid, created.childUid);
    assert.equal((await reloaded.getXpSummary(created.childUid)).xp, 20);
    assert.equal((await reloaded.getAttempts(created.childUid)).length, 5);
  } finally {
    for (const item of clients) { await sdk.terminate(item.db); await sdk.deleteApp(item.auth.app); }
    await proxy.close();
    await new Promise((resolve) => server.close(resolve));
    global.fetch = rawFetch;
  }
});

test('sign-in repairs a missing family after an interrupted signup without replacing paid data', { skip: !enabled, timeout: 60000 }, async () => {
  const { loadEmulatorClient, sdk } = require('./helpers/emulator-browser-client.cjs');
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const client = await loadEmulatorClient(`recovery-${suffix}`);
  try {
    const email = `recovery-${suffix}@example.test`, password = 'test-recovery-123';
    const { user } = await sdk.createUserWithEmailAndPassword(client.auth, email, password);
    assert.equal(await client.getFamily(user.uid), null); // Auth succeeded, Firestore did not
    await client.logout();
    await client.loginParent(email, password);
    assert.equal((await client.getFamily(user.uid)).parentEmail, email);
    const { getAdmin } = require('../backend/lib/firebase-admin');
    const { db } = getAdmin();
    const ref = db.collection('families').doc(user.uid);
    await ref.set({ parentName: 'Сохранённое имя', pro: true, subscriptionId: 'emulator-only-subscription' }, { merge: true });
    await Promise.all([client.ensureFamilyProfile(client.auth.currentUser), client.ensureFamilyProfile(client.auth.currentUser, 'Другое имя')]);
    const family = await client.getFamily(user.uid);
    assert.equal(family.pro, true); assert.equal(family.subscriptionId, 'emulator-only-subscription');
    assert.equal(family.parentName, 'Сохранённое имя');
  } finally {
    await sdk.terminate(client.db); await sdk.deleteApp(client.auth.app);
  }
});
