const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const CODE = 'ABC234';
const proof = (result = {}) => ({ version: 2, status: 'finished', result: {
  hostUid: 'host', guestUid: 'guest', scores: { host: 12, guest: 10 },
  speedWins: { host: 4, guest: 6 }, ...result,
} });

// Exercise the actual handler; all identity and storage operations stay local.
function fixture() {
  const docs = new Map();
  const commits = [];
  let rejectCommit = false;
  const snapshot = (path) => ({ exists: docs.has(path), data: () => docs.get(path) });
  const collection = (path) => ({ doc: (id) => ({ path: `${path}/${id}`,
    collection: (name) => collection(`${path}/${id}/${name}`),
  }) });
  const db = { collection, async runTransaction(callback) {
    const writes = [];
    const tx = {
      async get(ref) {
        if (writes.length) throw Error('transaction read after write');
        return snapshot(ref.path);
      },
      create(ref, data) { writes.push({ path: ref.path, data, create: true }); },
      set(ref, data, options) { writes.push({ path: ref.path, data, merge: options?.merge }); },
    };
    const result = await callback(tx);
    if (rejectCommit) { rejectCommit = false; throw Error('injected transaction failure'); }
    for (const write of writes) if (write.create && docs.has(write.path)) throw Error('already exists');
    for (const write of writes) docs.set(write.path, write.merge ? { ...docs.get(write.path), ...write.data } : write.data);
    if (writes.length) commits.push(writes);
    return result;
  } };
  const auth = { verifyIdToken: async (token, revoked) => {
    assert.equal(revoked, true);
    if (token === 'invalid') throw Object.assign(Error('invalid'), { code: 'auth/invalid-id-token' });
    return { uid: token };
  } };
  const context = { module: { exports: {} }, Date,
    process: { env: { FIREBASE_CLIENT_EMAIL: 'test@example.test', FIREBASE_PRIVATE_KEY: 'local-key' } },
    console: { error() {} },
    require(name) {
      if (name === '../lib/firebase-admin') return { getAdmin: () => ({ auth, db }) };
      throw Error('unexpected module ' + name);
    },
  };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../backend/handlers/duel-award.js`, 'utf8'), context);
  async function invoke({ uid = 'host', code = CODE, method = 'POST', body } = {}) {
    const req = { method, headers: { authorization: uid ? `Bearer ${uid}` : '' }, body: body ?? { code } };
    const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; },
      status(value) { this.statusCode = value; return this; },
      json(value) { this.body = JSON.parse(JSON.stringify(value)); return this; },
    };
    await context.module.exports(req, res);
    return { status: res.statusCode, body: res.body };
  }
  return { docs, commits, invoke, failNextCommit() { rejectCommit = true; } };
}

test('public forged room cannot attest completed duel or award XP', async () => {
  const f = fixture();
  f.docs.set(`duels/${CODE}`, { ...proof(), host: 'host', guest: 'guest', winner: 'host',
    scores: { host: 15, guest: 0 }, speedWins: { host: 15, guest: 0 } });
  assert.deepEqual(await f.invoke(), { status: 409, body: { error: 'duel_not_finished' } });
  assert.equal(f.commits.length, 0);
  assert.equal(f.docs.has('results/host/stats/summary'), false);
});

test('a stranger cannot claim an award from valid private proof', async () => {
  const f = fixture();
  f.docs.set(`duelPrivate/${CODE}`, proof());
  assert.deepEqual(await f.invoke({ uid: 'stranger' }), { status: 403, body: { error: 'not_player' } });
  assert.equal(f.commits.length, 0);
});

test('valid private proof credits correct, speed and winner XP once per participant', async () => {
  const f = fixture();
  f.docs.set(`duelPrivate/${CODE}`, proof());
  f.docs.set('results/host/stats/summary', { xp: 25, studySecs: 345, diagnosticMockUsed: true });
  assert.deepEqual(await f.invoke({ code: ' abc234 ' }), { status: 200, body: { gain: 122, credited: true } });
  assert.equal(f.docs.get('results/host/stats/summary').xp, 147);
  assert.equal(f.docs.get('results/host/stats/summary').studySecs, 345);
  assert.equal(f.docs.get('results/host/stats/summary').diagnosticMockUsed, true);
  assert.equal(f.docs.get(`results/host/awards/duel_${CODE}`).role, 'host');
  assert.deepEqual(await f.invoke(), { status: 200, body: { gain: 122, credited: false } });
  assert.equal(f.docs.get('results/host/stats/summary').xp, 147);
  assert.equal(f.commits.length, 1);
  assert.deepEqual(await f.invoke({ uid: 'guest' }), { status: 200, body: { gain: 68, credited: true } });
  assert.equal(f.docs.get('results/guest/stats/summary').xp, 68);
  assert.equal(f.docs.get('results/guest/stats/summary').studySecs, 0);
});

test('tied score uses speed tiebreak and a full draw has no winner bonus', async () => {
  const f = fixture();
  f.docs.set(`duelPrivate/${CODE}`, proof({ scores: { host: 10, guest: 10 }, speedWins: { host: 5, guest: 4 } }));
  assert.deepEqual((await f.invoke()).body, { gain: 115, credited: true });
  const draw = fixture();
  draw.docs.set(`duelPrivate/${CODE}`, proof({ scores: { host: 10, guest: 10 }, speedWins: { host: 4, guest: 4 } }));
  assert.deepEqual((await draw.invoke()).body, { gain: 62, credited: true });
});

test('malformed private proof is rejected before all writes', async () => {
  const cases = [
    { value: { ...proof(), version: 1 }, error: 'duel_not_finished' },
    { value: { ...proof(), status: 'playing' }, error: 'duel_not_finished' },
    { value: { version: 2, status: 'finished' }, error: 'duel_not_finished' },
    { value: proof({ guestUid: 'host' }), error: 'bad_duel_result' },
    { value: proof({ guestUid: '' }), error: 'bad_duel_result' },
    { value: proof({ scores: { host: 16, guest: 10 } }), error: 'bad_duel_result' },
    { value: proof({ scores: { host: 12.5, guest: 10 } }), error: 'bad_duel_result' },
    { value: proof({ scores: { host: '12', guest: 10 } }), error: 'bad_duel_result' },
    { value: proof({ speedWins: { host: 13, guest: 6 } }), error: 'bad_duel_result' },
    { value: proof({ speedWins: { host: -1, guest: 6 } }), error: 'bad_duel_result' },
    { value: proof({ scores: undefined }), error: 'bad_duel_result' },
  ];
  for (const { value, error } of cases) {
    const f = fixture();
    f.docs.set(`duelPrivate/${CODE}`, value);
    assert.deepEqual(await f.invoke(), { status: 409, body: { error } });
    assert.equal(f.commits.length, 0);
  }
});

test('failed transaction cannot partially credit XP and a later retry credits once', async () => {
  const f = fixture();
  f.docs.set(`duelPrivate/${CODE}`, proof());
  f.failNextCommit();
  assert.equal((await f.invoke()).status, 500);
  assert.equal(f.docs.has('results/host/stats/summary'), false);
  assert.equal(f.docs.has(`results/host/awards/duel_${CODE}`), false);
  assert.deepEqual((await f.invoke()).body, { gain: 122, credited: true });
  assert.deepEqual((await f.invoke()).body, { gain: 122, credited: false });
  assert.equal(f.docs.get('results/host/stats/summary').xp, 122);
});

test('award endpoint rejects unauthenticated requests, wrong methods and invalid codes', async () => {
  const f = fixture();
  assert.equal((await f.invoke({ uid: '' })).status, 401);
  assert.equal((await f.invoke({ uid: 'invalid' })).status, 401);
  assert.equal((await f.invoke({ method: 'GET' })).status, 405);
  assert.equal((await f.invoke({ code: 'BAD' })).status, 400);
  assert.equal((await f.invoke({ body: '{not-json' })).status, 400);
  assert.equal(f.commits.length, 0);
});
