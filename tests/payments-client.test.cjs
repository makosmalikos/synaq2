const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

// Execute the actual browser adapter with local Firebase doubles, never SDK I/O.
function client() {
  const docs = new Map(), subscriptions = new Map(), calls = [];
  let rejectCommit = false, response = { ok: true, body: { childUid: 'created-child' } };
  const auth = { currentUser: { uid: 'child', displayName: 'Child', email: 'child@synaq.kids', getIdToken: async () => 'local-token' } };
  const doc = (_, ...parts) => parts.join('/');
  const snap = (key) => ({ exists: () => docs.has(key), data: () => docs.get(key) });
  const context = {
    module: { exports: {} }, console, Date, crypto: crypto.webcrypto, setTimeout, clearTimeout, AbortSignal,
    initializeApp: () => ({}), getAuth: () => auth, getFirestore: () => ({}), doc,
    firebaseSettings: () => ({ config: {}, emulators: false }),
    getDoc: async (ref) => snap(ref), serverTimestamp: () => new Date(),
    onIdTokenChanged: (_, callback) => { calls.push({ tokenListener: callback }); return () => {}; },
    onSnapshot: (ref, callback) => { subscriptions.set(ref, callback); callback(snap(ref)); return () => subscriptions.delete(ref); },
    runTransaction: async (_, callback) => {
      const pending = [];
      const result = await callback({
        get: async (ref) => { if (pending.length) throw Error('read after write'); return snap(ref); },
        set: (ref, data, options) => pending.push([ref, data, options]),
      });
      if (rejectCommit) { rejectCommit = false; throw Error('injected write failure'); }
      for (const [ref, data, options] of pending) docs.set(ref, options?.merge ? { ...docs.get(ref), ...data } : data);
      return result;
    },
    signInWithEmailAndPassword: async (_, email, pin) => { calls.push({ email, pin }); return { user: auth.currentUser }; },
    fetch: async (path, options) => { calls.push({ path, options }); return { ok: response.ok, json: async () => response.body }; },
  };
  const source = fs.readFileSync(`${__dirname}/../frontend/src/firebase.js`, 'utf8')
    .replace(/^import[\s\S]*?from ['"][^'"]+['"];\n/gm, '').replace(/\bexport /g, '').replaceAll('import.meta.env', 'undefined');
  vm.runInNewContext(source + '\nmodule.exports = { getMyProfile, familyHasPro, isPro, watchMyProfile, watchAuth, isAdmin, loginChild, createChild, resetChildPassword, ensureFamilyProfile, saveAttempt, startLearningSession, todayCount, saveMock, savePlatformDiagnostic, markDiagnosticComplete };', context);
  return { api: context.module.exports, docs, auth, calls, rejectNextCommit() { rejectCommit = true; },
    respond(value) { response = value; },
    update(ref, data) { docs.set(ref, data); subscriptions.get(ref)?.(snap(ref)); } };
}

test('paid profile and live updates come from family, not stale childIndex mirror', async () => {
  const c = client();
  c.docs.set('childIndex/child', { name: 'A', klass: '5', parentUid: 'parent', pro: false });
  c.docs.set('families/parent', { pro: true, proExpiresAt: new Date(Date.now() + 60000) });
  assert.equal((await c.api.getMyProfile()).pro, true);
  assert.equal(await c.api.isPro('child'), true);
  const values = [];
  const stop = c.api.watchMyProfile((value) => values.push(value));
  assert.equal(values.at(-1).pro, true);
  c.update('families/parent', { pro: false });
  assert.equal(values.at(-1).pro, false);
  stop();
});

test('expiry and malformed expiry cannot grant Pro', () => {
  const c = client();
  assert.equal(c.api.familyHasPro({ pro: true }), true); // legacy/manual grant
  assert.equal(c.api.familyHasPro({ pro: true, proExpiresAt: new Date(Date.now() - 1) }), false);
  assert.equal(c.api.familyHasPro({ pro: true, proExpiresAt: 'invalid' }), false);
});

test('child login accepts username or complete synthetic email', async () => {
  const c = client();
  await c.api.loginChild(' Alice ', '123456');
  await c.api.loginChild('Alice@SYNAQ.KIDS', '123456');
  assert.equal(c.calls[0].email, 'alice@synaq.kids');
  assert.equal(c.calls[1].email, 'alice@synaq.kids');
  await assert.rejects(c.api.loginChild('bad@other.test', '123456'));
});

test('admin claim checks do not force-refresh the token and auth uses token events', async () => {
  const c = client();
  const refreshArgs = [];
  assert.equal(await c.api.isAdmin({ getIdTokenResult: async (...args) => {
    refreshArgs.push(args); return { claims: { admin: true, adminAuthVersion: 2 } };
  } }), true);
  assert.equal(refreshArgs[0].length, 0);
  c.api.watchAuth(() => {});
  assert.equal(typeof c.calls[0].tokenListener, 'function');
});

test('child creation delegates identity/ownership writes to authenticated server', async () => {
  const c = client();
  c.auth.currentUser.uid = 'parent';
  const result = await c.api.createChild('parent', { name: 'Alice', code: 'ALICE@synaq.kids', pin: '123456', requestId: 'stable-create-id' });
  assert.equal(result.childUid, 'created-child');
  assert.equal(c.calls[0].path, '/api/child-create');
  assert.equal(c.calls[0].options.headers.Authorization, 'Bearer local-token');
  assert.equal(JSON.parse(c.calls[0].options.body).code, 'alice');
  assert.equal(JSON.parse(c.calls[0].options.body).requestId, 'stable-create-id');
  assert.equal(c.docs.size, 0);
});

test('child PIN reset preserves partial success instead of claiming the password is unchanged', async () => {
  const c = client();
  c.respond({ ok: false, body: { error: 'token_revocation_failed', passwordChanged: true } });
  await assert.rejects(c.api.resetChildPassword('child', 'new-test-pin'), (error) => {
    assert.equal(error.passwordChanged, true); assert.equal(error.code, 'auth/child-reset-failed'); return true;
  });
  c.respond({ ok: false, body: { error: 'weak_password' } });
  await assert.rejects(c.api.resetChildPassword('child', 'short'), (error) => {
    assert.equal(error.passwordChanged, false); assert.equal(error.code, 'auth/weak-password'); return true;
  });
});

test('family initialization is retryable and never replaces subscription or existing name', async () => {
  const c = client(), parent = { uid: 'parent', email: ' Parent@Example.Test ', displayName: 'Parent' };
  c.rejectNextCommit();
  await assert.rejects(c.api.ensureFamilyProfile(parent));
  assert.equal(c.docs.size, 0);
  await c.api.ensureFamilyProfile(parent);
  assert.equal(c.docs.get('families/parent').parentEmail, 'parent@example.test');
  c.docs.set('families/parent', { ...c.docs.get('families/parent'), parentName: null, pro: true, subscriptionId: 'paid' });
  await c.api.ensureFamilyProfile(parent, 'Updated name');
  await c.api.ensureFamilyProfile(parent, 'Do not overwrite');
  const family = c.docs.get('families/parent');
  assert.equal(family.parentName, 'Updated name'); assert.equal(family.pro, true); assert.equal(family.subscriptionId, 'paid');
  await assert.rejects(c.api.ensureFamilyProfile(c.auth.currentUser), { code: 'auth/parent-required' });
});

test('learning adapter sends only the server session and answer, never client grade or time', async () => {
  const c = client();
  c.respond({ ok: true, body: { saved: true, gain: 5, totalXp: 5, count: 1, correct: true } });
  const first = await c.api.saveAttempt('child', { sessionId: 'attempt-1', answer: '4', correct: false, secs: 90000, xp: 123 }, 'attempt-1');
  assert.equal(first.gain, 5);
  assert.deepEqual(JSON.parse(c.calls[0].options.body), { action: 'answer', id: 'attempt-1', answer: '4' });
  assert.equal(c.calls[0].path, '/api/learning');
  assert.equal(c.docs.size, 0, 'no direct browser result writes');
  await assert.rejects(c.api.saveAttempt('child', { correct: true, qid: 'q1' }), { code: 'learning/session-required' });
  await assert.rejects(c.api.saveAttempt('other', { sessionId: 'attempt-1', answer: '4' }), { code: 'learning/auth-required' });
});

test('first diagnostic marker initializes zero stats and preserves server-owned XP', async () => {
  const c = client();
  await c.api.markDiagnosticComplete('child');
  let stats = c.docs.get('results/child/stats/summary');
  assert.equal(stats.xp, 0); assert.equal(stats.studySecs, 0); assert.equal(stats.diagnosticMockUsed, true);
  c.docs.set('results/child/stats/summary', { xp: 105, studySecs: 3600, diagnosticMockUsed: false });
  await c.api.markDiagnosticComplete('child');
  stats = c.docs.get('results/child/stats/summary');
  assert.equal(stats.xp, 105); assert.equal(stats.studySecs, 3600);
  assert.equal(stats.diagnosticMockUsed, true);
});

test('learning start and daily count use the server API and expose actionable errors', async () => {
  const c = client();
  c.respond({ ok: true, body: { id: 'session-1', question: { id: 'q1' } } });
  await c.api.startLearningSession('child', { mode: 'training', qid: 'q1', correct: true }, 'session-1');
  assert.deepEqual(JSON.parse(c.calls[0].options.body), { action: 'start', mode: 'training', qid: 'q1', id: 'session-1' });
  c.respond({ ok: true, body: { count: 4 } });
  assert.equal(await c.api.todayCount('child'), 4);
  c.respond({ ok: false, body: { error: 'daily-limit' } });
  await assert.rejects(c.api.startLearningSession('child', { mode: 'training', qid: 'q1' }), { code: 'learning/daily-limit' });
});

test('mock and platform diagnostic retries reuse document IDs', async () => {
  const c = client();
  await c.api.saveMock('child', { total: 20 }, 'mock-1');
  await c.api.saveMock('child', { total: 999 }, 'mock-1');
  assert.equal(c.docs.get('results/child/mocks/mock-1').total, 20);
  const result = { version: 1, grade: 5, completedAt: new Date().toISOString(), readiness: 50,
    correct: 10, total: 20, spentSec: 100, topics: [], mistakes: [] };
  await c.api.savePlatformDiagnostic('child', result, 'diag-1');
  await c.api.savePlatformDiagnostic('child', { ...result, correct: 20 }, 'diag-1');
  assert.equal(c.docs.get('results/child/diagnostics/diag-1').correct, 10);
});
