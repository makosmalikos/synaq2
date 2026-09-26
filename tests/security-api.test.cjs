const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const plans = require('../backend/lib/plans');

function fixture(filename, envOverrides = {}) {
  const shared = new Set(['admin-login.js', 'child-password.js', 'duel-award.js', 'entitlement.js']);
  const sourcePath = shared.has(filename)
    ? `${__dirname}/../backend/handlers/${filename}`
    : `${__dirname}/../api/${filename}`;
  const docs = new Map([['families/parent', { pro: true, parentEmail: 'parent@test.invalid' }]]);
  const created = [], deleted = [], updated = [], revoked = [], fetched = [], reads = [];
  const childUsers = new Map();
  let failLinks = false, loseCommitAck = false;
  let providerText = '1. Складываем 2 и 2. Ответ: 4';
  let providerPayload = null, providerStatus = 200;
  const env = { FIREBASE_PROJECT_ID: 'test-project', FIREBASE_CLIENT_EMAIL: 'test@test.invalid', FIREBASE_PRIVATE_KEY: 'test-key', GEMINI_API_KEY: 'test-gemini', ...envOverrides };
  const snap = (path) => ({ exists: docs.has(path), data: () => docs.get(path) });
  const write = (path, data, options) => docs.set(path, options?.merge ? { ...docs.get(path), ...data } : data);
  const ref = (path) => ({ path, get: async () => { reads.push(path); return snap(path); },
    set: async (data, options) => write(path, data, options),
    collection: (name) => collection(`${path}/${name}`),
  });
  const collection = (path) => ({ doc: (id) => ref(`${path}/${id}`), limit: () => ({ path, query: true }),
    where: (key, op, uid) => ({ limit: () => ({ group: true,
      get: async () => ({ empty: ![...docs.entries()].some(([docPath, data]) => /^families\/[^/]+$/.test(docPath) && data[key] === uid) }),
    }) }),
  });
  const childGroup = (code) => ({ group: true, code,
    get: async () => ({ empty: ![...docs.entries()].some(([path, data]) => /^families\/[^/]+\/children\/[^/]+$/.test(path) && data.code === code) }),
  });
  const db = { collection, collectionGroup: () => ({ where: (key, op, code) => ({ limit: () => childGroup(code) }) }), async runTransaction(callback) {
    const pending = [];
    const result = await callback({ get: async (value) => {
      assert.equal(pending.length, 0, 'transaction reads before writes');
      reads.push(value.path);
      if (value.group) return value.get();
      if (value.query) return { empty: ![...docs.keys()].some((path) => path.startsWith(`${value.path}/`)) };
      return snap(value.path);
    }, set(value, data, options) { pending.push([value.path, data, options]); },
    create(value, data) { assert.equal(docs.has(value.path), false); pending.push([value.path, data]); } });
    if (failLinks && pending.some(([path]) => path.startsWith('childIndex/'))) throw new Error('injected_db_failure');
    pending.forEach((args) => write(...args));
    if (loseCommitAck && pending.some(([path]) => path.startsWith('childIndex/'))) throw Error('lost_commit_acknowledgement');
    return result;
  } };
  const auth = {
    async verifyIdToken(token, checkRevoked) {
      assert.equal(checkRevoked, true);
      if (token === 'invalid') throw Object.assign(new Error('invalid token'), { code: 'auth/id-token-expired' });
      return token === 'child' ? { uid: 'kid', email: 'kid@synaq.kids' } : { uid: 'parent', email: 'parent@test.invalid' };
    },
    async createUser(user) {
      created.push(user);
      if (childUsers.has(user.uid)) throw Object.assign(Error('exists'), { code: 'auth/uid-already-exists' });
      const identity = { uid: user.uid, email: user.email };
      childUsers.set(user.uid, identity); return identity;
    },
    async deleteUser(uid) { deleted.push(uid); childUsers.delete(uid); },
    async getUser(uid) {
      if (filename !== 'child-create.js') return { uid, email: 'kidcode@synaq.kids' };
      if (!childUsers.has(uid)) throw Object.assign(Error('missing'), { code: 'auth/user-not-found' });
      return childUsers.get(uid);
    },
    async updateUser(uid, data) { updated.push({ uid, data }); },
    async revokeRefreshTokens(uid) { revoked.push(uid); },
  };
  const apps = [{ name: '[DEFAULT]' }];
  let childAdmin;
  const context = { module: { exports: {} }, Date, Buffer, AbortSignal, AbortController, Headers,
    console: { error() {}, warn() {}, log() {} }, process: { env },
    require(name) {
      if (name === 'node:crypto' || name === 'crypto') return crypto;
      if (name === '../backend/lib/plans' || name === '../lib/plans') return plans;
      if (name === 'firebase-admin/app') return { getApps: () => apps, cert: (value) => value,
        initializeApp(options, name) { const app = { name, options }; apps.push(app); return app; } };
      if (name === 'firebase-admin/auth') return { getAuth: () => auth };
      if (name === 'firebase-admin/firestore') return { getFirestore: () => db, Firestore: class { constructor() { return db; } } };
      if (name === '../backend/lib/firebase-admin' || name === '../lib/firebase-admin') {
        if (!childAdmin) {
          const adminContext = { ...context, module: { exports: {} } };
          vm.runInNewContext(fs.readFileSync(`${__dirname}/../backend/lib/firebase-admin.js`, 'utf8'), adminContext);
          childAdmin = adminContext.module.exports;
        }
        return childAdmin;
      }
      throw new Error(`Unstubbed dependency ${name}`);
    },
    async fetch(url, options) {
      assert.match(url, /^https:\/\/generativelanguage\.googleapis\.com\//, 'only stubbed AI provider is permitted');
      fetched.push({ url, options });
      return { ok: providerStatus >= 200 && providerStatus < 300, status: providerStatus,
        text: async () => 'stubbed provider error',
        json: async () => providerPayload || ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: providerText }] } }] }) };
    },
  };
  vm.runInNewContext(fs.readFileSync(sourcePath, 'utf8'), context, { filename: sourcePath });
  async function invoke(body = {}, token = 'parent', method = 'POST') {
    const req = { method, body, headers: { authorization: token ? `Bearer ${token}` : '' } };
    const res = { statusCode: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(value) { this.body = JSON.parse(JSON.stringify(value)); return this; } };
    await context.module.exports(req, res);
    return { status: res.statusCode, body: res.body, headers: res.headers };
  }
  return { docs, auth, env, created, deleted, updated, revoked, fetched, reads, invoke,
    failLinks: () => { failLinks = true; }, loseCommitAck: () => { loseCommitAck = true; }, respondWith: (text) => { providerText = text; },
    respondWithPayload: (payload, status = 200) => { providerPayload = payload; providerStatus = status; } };
}

const child = { name: 'Бала', klass: '5', code: 'kidcode', pin: 'secret123', avatar: 'fox' };

test('child creation creates Auth and both trusted relationship documents atomically', async () => {
  const f = fixture('child-create.js');
  const result = await f.invoke(child);
  assert.equal(result.status, 201);
  const uid = result.body.childUid;
  assert.match(uid, /^synaqkid_[a-f0-9]{32}$/);
  assert.deepEqual(result.body, { childUid: uid, code: 'kidcode' });
  assert.equal(f.created[0].email, 'kidcode@synaq.kids');
  assert.equal(f.created[0].uid, uid);
  assert.equal(f.docs.get(`families/parent/children/${uid}`).code, 'kidcode');
  assert.equal(f.docs.get(`families/parent/children/${uid}`).avatar, 'fox');
  assert.equal(f.docs.get(`childIndex/${uid}`).parentUid, 'parent');
  assert.equal(f.docs.get(`childIndex/${uid}`).linkedByServer, true);
  assert.equal(f.docs.get(`childIndex/${uid}`).pro, true);
  assert.equal(f.docs.get(`childIndex/${uid}`).avatar, 'fox');
  assert.equal(f.deleted.length, 0);
});

test('taken child email is never linked to the requesting family', async () => {
  const f = fixture('child-create.js');
  f.docs.set('childIndex/other-kid', { parentUid: 'other-parent' });
  f.auth.createUser = async () => { throw Object.assign(new Error('taken'), { code: 'auth/email-already-exists' }); };
  assert.equal((await f.invoke(child)).status, 409);
  assert.equal(f.docs.get('childIndex/other-kid').parentUid, 'other-parent');
  assert.equal([...f.docs.keys()].some((path) => path.startsWith('families/parent/children/')), false);
  assert.deepEqual(f.deleted, []);
});

const requestId = '93196e8f-f835-4eec-a527-d9667aaec0ab';
test('lost child-create response can be replayed without another Auth user or rate-limit charge', async () => {
  const f = fixture('child-create.js');
  const payload = { ...child, requestId };
  const first = await f.invoke(payload);
  assert.equal(first.status, 201);
  const replay = await f.invoke(payload);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, first.body);
  assert.equal(f.created.length, 1);
  assert.equal(f.docs.get('childCreateLimits/parent').count, 1);
  const ledger = f.docs.get(`childCreateRequests/parent_${requestId}`);
  assert.equal(ledger.childUid, first.body.childUid);
  assert.equal(ledger.status, 'complete');
  assert.equal(JSON.stringify(ledger).includes(child.pin), false);
});

test('child-create request replay rejects changed payload or missing ownership proof', async () => {
  const f = fixture('child-create.js');
  const payload = { ...child, requestId };
  const first = await f.invoke(payload);
  assert.equal((await f.invoke({ ...payload, pin: 'changed123' })).body.error, 'request_conflict');
  assert.equal((await f.invoke({ ...payload, name: 'Another' })).body.error, 'request_conflict');
  f.docs.set(`childIndex/${first.body.childUid}`, { parentUid: 'other-parent', linkedByServer: true });
  assert.equal((await f.invoke(payload)).body.error, 'request_incomplete');
  assert.equal(f.created.length, 1);
});

test('failed child links never leave a successful request ledger; invalid request ID is rejected', async () => {
  const f = fixture('child-create.js'); f.failLinks();
  assert.equal((await f.invoke({ ...child, requestId })).status, 500);
  assert.equal(f.docs.get(`childCreateRequests/parent_${requestId}`).status, 'reserved');
  assert.deepEqual(f.deleted, []);
  assert.equal((await f.invoke({ ...child, requestId: '../other-parent' })).status, 400);
});

test('lost Firestore commit acknowledgement never deletes the successfully linked Auth child', async () => {
  const f = fixture('child-create.js'); f.loseCommitAck();
  assert.equal((await f.invoke({ ...child, requestId })).status, 201);
  assert.deepEqual(f.deleted, []);
  const uid = f.docs.get(`childCreateRequests/parent_${requestId}`).childUid;
  assert.equal(f.docs.get(`childIndex/${uid}`).parentUid, 'parent');
  assert.equal((await f.invoke({ ...child, requestId })).status, 200);
});

test('a request ID never permits adopting an existing Auth account without server proof', async () => {
  const f = fixture('child-create.js');
  f.auth.createUser = async () => { throw Object.assign(new Error('taken'), { code: 'auth/email-already-exists' }); };
  assert.equal((await f.invoke({ ...child, requestId })).status, 409);
  assert.equal(f.docs.get(`childCreateRequests/parent_${requestId}`).status, 'cancelled');
  assert.equal([...f.docs.keys()].some((path) => path.startsWith('families/parent/children/')), false);
});

test('one-child limit is enforced before creating a new Auth identity', async () => {
  const f = fixture('child-create.js');
  f.docs.set('families/parent/children/existing-child', { code: 'existing' });
  assert.equal((await f.invoke({ ...child, requestId })).body.error, 'child_limit');
  assert.deepEqual(f.deleted, []);
  assert.equal(f.created.length, 0);
  assert.equal(f.docs.has('childIndex/new-kid'), false);
  assert.equal(f.docs.has(`childCreateRequests/parent_${requestId}`), false);
  assert.equal(f.docs.get('families/parent/children/existing-child').code, 'existing');
});

test('new child cannot inherit expired or malformed Pro entitlement', async () => {
  for (const proExpiresAt of [new Date(0), 'not-a-date', { seconds: 0 }]) {
    const f = fixture('child-create.js');
    f.docs.set('families/parent', { pro: true, proExpiresAt });
    const result = await f.invoke(child);
    assert.equal(result.status, 201);
    assert.equal(f.docs.get(`childIndex/${result.body.childUid}`).pro, false);
  }
});

test('failed relationship transaction keeps its reserved Auth identity recoverable without partial links', async () => {
  const f = fixture('child-create.js'); f.failLinks();
  assert.equal((await f.invoke(child)).status, 500);
  assert.deepEqual(f.deleted, []);
  const uid = f.created[0].uid;
  assert.equal(f.docs.has(`childIndex/${uid}`), false);
  assert.equal(f.docs.has(`families/parent/children/${uid}`), false);
  assert.equal([...f.docs.entries()].find(([path]) => path.startsWith('childCreateRequests/'))[1].status, 'reserved');
});

test('child creation rejects absent/invalid tokens, child accounts and missing families', async () => {
  const f = fixture('child-create.js');
  assert.equal((await f.invoke(child, '')).status, 401);
  assert.equal((await f.invoke(child, 'invalid')).status, 401);
  assert.equal((await f.invoke(child, 'child')).status, 403);
  f.docs.delete('families/parent');
  assert.equal((await f.invoke(child)).status, 409);
  assert.equal(f.created.length, 0);
});

test('PIN reset requires both ownership records and the matching child Auth identity', async () => {
  const f = fixture('child-password.js');
  const payload = { childUid: 'kid', password: 'new-secret' };
  f.docs.set('families/parent/children/kid', { code: 'kidcode' });
  f.docs.set('childIndex/kid', { parentUid: 'other-parent' });
  assert.equal((await f.invoke(payload)).status, 403);
  f.docs.set('childIndex/kid', { parentUid: 'parent' });
  f.auth.getUser = async () => ({ email: 'unrelated@test.invalid' });
  assert.equal((await f.invoke(payload)).status, 403);
  assert.equal(f.updated.length, 0);
  f.auth.getUser = async () => ({ email: 'kidcode@synaq.kids' });
  assert.equal((await f.invoke(payload)).status, 200);
  assert.deepEqual(f.updated.map((item) => item.uid), ['kid']);
  assert.deepEqual(f.revoked, ['kid']);
});

test('PIN revocation failure reports the changed password, not a false login failure', async () => {
  const f = fixture('child-password.js');
  f.docs.set('families/parent/children/kid', { code: 'kidcode' });
  f.docs.set('childIndex/kid', { parentUid: 'parent' });
  f.auth.revokeRefreshTokens = async () => { throw Object.assign(Error('temporary'), { code: 'auth/internal-error' }); };
  const result = await f.invoke({ childUid: 'kid', password: 'new-secret' });
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, { error: 'token_revocation_failed', passwordChanged: true });
  assert.equal(f.updated.length, 1);
});

test('both child APIs allow isolated demo emulator credentials and fail closed on mixed configuration', async () => {
  const demo = { FIREBASE_PROJECT_ID: 'demo-synaq-tests', FIREBASE_CLIENT_EMAIL: '', FIREBASE_PRIVATE_KEY: '',
    SYNAQ_USE_EMULATORS: '1', NODE_ENV: 'test', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:19099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:18080' };
  const f = fixture('child-create.js', demo);
  assert.equal((await f.invoke(child)).status, 201);
  for (const filename of ['child-create.js', 'child-password.js']) {
    const invalid = fixture(filename, { ...demo, FIREBASE_PRIVATE_KEY: 'production-key' });
    assert.equal((await invalid.invoke(child)).status, 503);
    assert.equal(invalid.created.length, 0);
    assert.equal(invalid.updated.length, 0);
  }
});

test('PIN reset rejects missing auth, child account and weak password', async () => {
  const f = fixture('child-password.js');
  assert.equal((await f.invoke({ childUid: 'kid', password: 'secret123' }, '')).status, 401);
  assert.equal((await f.invoke({ childUid: 'kid', password: 'secret123' }, 'child')).status, 403);
  assert.equal((await f.invoke({ childUid: 'kid', password: '123' })).status, 400);
  assert.equal(f.updated.length, 0);
});

test('AI fails closed without user or server credentials and never calls provider', async () => {
  const f = fixture('explain.js');
  const body = { statement: '2 + 2?', answer: '4', lang: 'ru' };
  assert.equal((await f.invoke(body, '')).status, 401);
  assert.equal((await f.invoke(body, 'invalid')).status, 401);
  delete f.env.FIREBASE_PRIVATE_KEY;
  assert.equal((await f.invoke(body)).status, 503);
  delete f.env.GEMINI_API_KEY;
  assert.equal((await f.invoke(body)).status, 500);
  assert.equal(f.fetched.length, 0);
});

test('AI uses server-owned v2 content cache and isolates different content', async () => {
  const f = fixture('explain.js');
  f.docs.set('explanations/task_ru', { text: 'poisoned legacy cache' });
  const body = { id: 'task', statement: '2 + 2?', answer: '4', lang: 'ru' };
  const first = await f.invoke(body);
  assert.equal(first.status, 200);
  assert.equal(first.headers['Cache-Control'], 'private, no-store');
  assert.notEqual(first.body.text, 'poisoned legacy cache');
  assert.deepEqual((await f.invoke(body)).body, first.body);
  assert.equal(f.fetched.length, 1);
  assert.equal(f.reads.some((path) => path.startsWith('explanations/')), false);
  assert.ok([...f.docs.keys()].some((path) => /^aiCache\/v2_[a-f0-9]{64}$/.test(path)));
  await f.invoke({ ...body, statement: '3 + 1?' });
  assert.equal(f.fetched.length, 2);
  assert.equal([...f.docs.keys()].filter((path) => path.startsWith('aiCache/')).length, 2);
});

test('AI translation validates provider output and does not cache malformed answers', async () => {
  const f = fixture('explain.js');
  const body = { mode: 'translate', lang: 'kk', items: [{ id: 'task', statement: 'Сложи 2 и 2', solution: '4' }] };
  f.respondWith('{"task":{"statement":"2 мен 2-ні қос","solution":"4"},"unexpected":{"statement":"ignored"}}');
  const result = await f.invoke(body);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { task: { statement: '2 мен 2-ні қос', solution: '4' } });
  const broken = fixture('explain.js'); broken.respondWith('{"task":{"statement":42}}');
  assert.notEqual((await broken.invoke(body)).status, 200);
  assert.equal([...broken.docs.keys()].some((path) => path.startsWith('aiCache/')), false);
});

test('personalized AI error explanations are not shared or replayed from cache', async () => {
  const f = fixture('explain.js');
  const body = { statement: '2 + 2?', answer: '4', given: '5', lang: 'ru' };
  assert.equal((await f.invoke(body)).status, 200);
  assert.equal((await f.invoke(body)).status, 200);
  assert.equal(f.fetched.length, 2);
  assert.equal([...f.docs.keys()].some((path) => path.startsWith('aiCache/')), false);
});

test('AI defaults to stable Flash-Lite when no explicit model is configured', async () => {
  for (const env of [{}, { GEMINI_MODEL: '  ' }]) {
    const f = fixture('explain.js', env);
    const result = await f.invoke({ statement: '2 + 2?', answer: '4' });
    assert.equal(result.status, 200);
    assert.equal(result.body.model, 'gemini-3.1-flash-lite');
    assert.equal(f.fetched.length, 1);
    assert.match(f.fetched[0].url, /\/models\/gemini-3\.1-flash-lite:generateContent\?/);
  }
});

test('explicit AI model is respected without fallback on provider errors or empty output', async () => {
  const body = { statement: '2 + 2?', answer: '4' };
  const configured = fixture('explain.js', { GEMINI_MODEL: ' gemini-configured-test ' });
  assert.equal((await configured.invoke(body)).body.model, 'gemini-configured-test');
  for (const status of [400, 404]) {
    const f = fixture('explain.js', { GEMINI_MODEL: 'gemini-configured-test' });
    f.respondWithPayload({}, status);
    assert.deepEqual((await f.invoke(body)).body, { error: 'upstream', status });
    assert.equal(f.fetched.length, 1);
    assert.match(f.fetched[0].url, /\/models\/gemini-configured-test:generateContent\?/);
  }
  const empty = fixture('explain.js', { GEMINI_MODEL: 'gemini-configured-test' });
  empty.respondWith('');
  assert.equal((await empty.invoke(body)).body.error, 'empty');
  assert.equal(empty.fetched.length, 1);
});

test('AI thought parts never reach an explanation, translation or their cached result', async () => {
  const f = fixture('explain.js');
  f.respondWithPayload({ candidates: [{ finishReason: 'STOP', content: { parts: [
    { thought: true, text: 'internal reasoning is not the answer' },
    { text: 'Ответ: ' }, { text: '4' },
  ] } }] });
  const first = await f.invoke({ statement: '2 + 2?', answer: '4' });
  assert.equal(first.body.text, 'Ответ: 4');
  assert.equal(JSON.stringify([...f.docs.values()]).includes('internal reasoning'), false);
  const tr = fixture('explain.js');
  tr.respondWithPayload({ candidates: [{ finishReason: 'STOP', content: { parts: [
    { thought: true, text: 'internal reasoning is not JSON' },
    { text: '{"q":{"statement":"Екіге екі қос","solution":"4"}}' },
  ] } }] });
  assert.deepEqual((await tr.invoke({ mode: 'translate', lang: 'kk', items: [{ id: 'q', statement: 'Сложи два и два' }] })).body,
    { q: { statement: 'Екіге екі қос', solution: '4' } });
});

test('MAX_TOKENS returns a retryable truncated error and never caches partial output', async () => {
  for (const body of [{ statement: '2 + 2?', answer: '4' },
    { mode: 'translate', lang: 'kk', items: [{ id: 'q', statement: 'Сложи два и два' }] }]) {
    const f = fixture('explain.js');
    f.respondWithPayload({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"q":{"statement":"partial","solution":"4"}}' }] } }] });
    const result = await f.invoke(body);
    assert.equal(result.status, 502);
    assert.deepEqual(result.body, { error: 'truncated', reason: 'MAX_TOKENS', retryable: true });
    assert.equal([...f.docs.keys()].some((path) => path.startsWith('aiCache/')), false);
    assert.equal(f.fetched.length, 1);
  }
});

test('invalid request JSON is a 400 without an AI call; malformed provider JSON is not blamed on the caller', async () => {
  const f = fixture('explain.js');
  const result = await f.invoke('{"statement":');
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: 'invalid_json' });
  assert.equal(f.fetched.length, 0);
  assert.equal(f.docs.has('rateLimits/parent'), false);
  const broken = fixture('explain.js'); broken.respondWith('not JSON');
  assert.equal((await broken.invoke({ mode: 'translate', lang: 'kk', items: [{ id: 'q', statement: 'Два' }] })).status, 500);
});
