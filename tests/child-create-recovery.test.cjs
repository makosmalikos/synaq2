const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

const source = fs.readFileSync(`${__dirname}/../api/child-create.js`, 'utf8');
const REQUEST = '11111111-1111-4111-8111-111111111111';
const SECOND = '22222222-2222-4222-8222-222222222222';
const payload = { name: 'Student', klass: '6', code: 'studentone', pin: 'private-pin-456', requestId: REQUEST };
const authError = (code) => Object.assign(Error(code), { code });
const clone = (value) => value == null ? value : structuredClone(value);
function deferred() {
  let resolve;
  const promise = new Promise((yes) => { resolve = yes; });
  return { promise, resolve };
}

function fixture() {
  const docs = new Map([['families/parent', { parentEmail: 'parent@example.test' }]]);
  const users = new Map(), created = [], createCalls = [], deleted = [], deleteCalls = [], logs = [];
  const controls = {};
  let tail = Promise.resolve();
  const records = () => [...docs.entries()].filter(([path]) => path.startsWith('childCreateRequests/'));
  const snap = (path) => ({ exists: docs.has(path), data: () => clone(docs.get(path)) });
  const collection = (path) => ({ doc: (id) => ref(`${path}/${id}`), limit: () => ({ kind: 'children', path }),
    where: (field, op, uid) => {
      assert.equal(path, 'families'); assert.equal(field, 'childAccountUid'); assert.equal(op, '==');
      return { limit: () => marker(uid) };
    },
  });
  const ref = (path) => ({ kind: 'document', path, collection: (name) => collection(`${path}/${name}`), get: () => read(ref(path), false) });
  const group = (code) => ({ kind: 'group', code, get: () => read(group(code), false) });
  const marker = (uid) => ({ kind: 'marker', uid, get: () => read(marker(uid), false) });
  async function read(value, transaction) {
    await controls.beforeRead?.(value, transaction);
    if (!transaction && controls.failReadback) throw Error('readback_unavailable');
    if (value.kind === 'document') return snap(value.path);
    if (value.kind === 'group' && controls.failGroupQuery) throw Error('missing_collection_group_index');
    const matches = [...docs.entries()].filter(([path, data]) => value.kind === 'marker'
      ? /^families\/[^/]+$/.test(path) && data.childAccountUid === value.uid
      : value.kind === 'group'
      ? /^families\/[^/]+\/children\/[^/]+$/.test(path) && data.code === value.code
      : path.startsWith(`${value.path}/`) && path.slice(value.path.length + 1).split('/').length === 1);
    return { empty: matches.length === 0, docs: matches.slice(0, 1).map(([path]) => snap(path)) };
  }
  const db = {
    collection,
    collectionGroup: (name) => ({ where: (field, op, code) => {
      assert.equal(name, 'children'); assert.equal(field, 'code'); assert.equal(op, '==');
      return { limit: () => group(code) };
    } }),
    runTransaction(callback) {
      const run = tail.then(async () => {
        const writes = [];
        const result = await callback({
          get(value) { assert.equal(writes.length, 0, 'all proof reads precede writes'); return read(value, true); },
          create(value, data) { writes.push({ path: value.path, data: clone(data), create: true }); },
          set(value, data, options) { writes.push({ path: value.path, data: clone(data), merge: options?.merge }); },
        });
        const reserve = writes.some((write) => write.data.status === 'reserved');
        const finish = writes.some((write) => write.data.status === 'complete');
        if ((reserve && controls.failReserve) || (finish && controls.failFinish)) throw Error('transaction_unavailable');
        for (const write of writes) if (write.create) assert.equal(docs.has(write.path), false, 'create requires an absent document');
        for (const write of writes) docs.set(write.path, write.merge ? { ...docs.get(write.path), ...write.data } : write.data);
        await controls.afterCommit?.(writes);
        if (reserve && controls.loseReserveAck) { controls.loseReserveAck = false; throw Error('lost_reservation_ack'); }
        if (finish && controls.loseFinishAck) { controls.loseFinishAck = false; throw Error('lost_finish_ack'); }
        return result;
      });
      tail = run.catch(() => {});
      return run;
    },
  };
  const auth = {
    async verifyIdToken(token, revoked) { assert.equal(revoked, true); return { uid: token, email: `${token}@example.test` }; },
    async createUser(input) {
      // Assert the central safety property at the exact Auth call boundary.
      assert.ok(records().some(([, record]) => record.childUid === input.uid && record.status === 'reserved'));
      createCalls.push(clone(input));
      await controls.beforeCreate?.(input);
      if (controls.failCreate) throw authError('auth/internal-error');
      if (users.has(input.uid)) throw authError('auth/uid-already-exists');
      if ([...users.values()].some((user) => user.email === input.email)) throw authError('auth/email-already-exists');
      const user = { uid: input.uid, email: input.email, displayName: input.displayName, disabled: false };
      users.set(input.uid, user); created.push(input.uid);
      if (controls.loseAuthAck) { controls.loseAuthAck = false; throw authError('auth/internal-error'); }
      return clone(user);
    },
    async getUser(uid) {
      await controls.onGetUser?.(uid);
      if (controls.failGetUser) throw authError('auth/internal-error');
      if (!users.has(uid)) throw authError('auth/user-not-found');
      return clone(users.get(uid));
    },
    async getUserByEmail() { assert.fail('email lookup must never authorize account adoption'); },
    async deleteUser(uid) {
      deleteCalls.push(uid);
      if (controls.failDelete) throw authError('auth/internal-error');
      assert.ok(records().some(([, record]) => record.childUid === uid && record.status === 'cancelled'));
      assert.equal(docs.has(`childIndex/${uid}`), false);
      users.delete(uid); deleted.push(uid);
    },
  };
  function instance() {
    const context = { module: { exports: {} }, Date,
      console: { error: (...args) => logs.push(args), warn: (...args) => logs.push(args) },
      require(name) {
        if (name === 'node:crypto') return crypto;
        if (name === '../backend/lib/firebase-admin') return { getAdmin: () => ({ db, auth }) };
        throw Error(`Unexpected dependency ${name}`);
      },
    };
    vm.runInNewContext(source, context, { filename: 'child-create.js' });
    return async (body = payload, uid = 'parent') => {
      const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; },
        status(code) { this.statusCode = code; return this; }, json(value) { this.body = clone(value); return this; } };
      await context.module.exports({ method: 'POST', headers: { authorization: `Bearer ${uid}` }, body: clone(body) }, res);
      return { status: res.statusCode, body: res.body, headers: res.headers };
    };
  }
  return { docs, users, controls, created, createCalls, deleted, deleteCalls, logs, records, instance, invoke: instance(),
    addWinner() {
      docs.set('families/parent/children/winner', { code: 'winnercode', name: 'Winner' });
      docs.set('families/parent', { ...docs.get('families/parent'), childAccountUid: 'winner' });
    },
  };
}

test('a reservation write failure cannot create Auth; lost reservation acknowledgement recovers the same UID', async () => {
  const f = fixture(); f.controls.failReserve = true;
  assert.equal((await f.invoke()).status, 500);
  assert.equal(f.createCalls.length, 0); assert.equal(f.records().length, 0);
  f.controls.failReserve = false; f.controls.loseReserveAck = true;
  assert.equal((await f.instance()()).status, 500);
  const reservedUid = f.records()[0][1].childUid;
  assert.equal(f.createCalls.length, 0);
  assert.equal(f.docs.get('childCreateLimits/parent').count, 1);
  const retry = await f.instance()();
  assert.equal(retry.status, 201); assert.equal(retry.body.childUid, reservedUid);
  assert.deepEqual(f.created, [reservedUid]);
  assert.equal(f.docs.get('childCreateLimits/parent').count, 1);
});

test('a crash before Auth leaves a durable request that can be resumed without another quota charge', async () => {
  const f = fixture(); f.controls.failCreate = true;
  assert.equal((await f.invoke()).status, 500);
  const uid = f.records()[0][1].childUid;
  assert.equal(f.users.size, 0); assert.equal(f.records()[0][1].status, 'reserved');
  f.controls.failCreate = false;
  const retry = await f.instance()();
  assert.equal(retry.status, 201); assert.equal(retry.body.childUid, uid);
  assert.equal(f.docs.get('childCreateLimits/parent').count, 1);
});

test('Auth success followed by failed Firestore transaction and failed readback is recoverable, never deleted', async () => {
  const f = fixture(); f.controls.failFinish = true; f.controls.failReadback = true;
  const first = await f.invoke(), uid = f.records()[0][1].childUid;
  assert.equal(first.status, 500); assert.equal(f.users.has(uid), true);
  assert.equal(f.records()[0][1].status, 'reserved'); assert.equal(f.deleteCalls.length, 0);
  assert.equal(f.docs.has(`childIndex/${uid}`), false);
  f.controls.failFinish = false; f.controls.failReadback = false;
  const retry = await f.instance()();
  assert.equal(retry.status, 201); assert.equal(retry.body.childUid, uid);
  assert.deepEqual(f.created, [uid]);
  assert.deepEqual(f.createCalls.map((call) => call.uid), [uid, uid]);
  assert.equal(f.records()[0][1].status, 'complete');
  assert.equal(f.docs.get('childCreateLimits/parent').count, 1);
});

test('lost Auth acknowledgement adopts only the previously reserved UID, even after a failed UID lookup', async () => {
  for (const lookupUnavailable of [false, true]) {
    const f = fixture(); f.controls.loseAuthAck = true; f.controls.failGetUser = lookupUnavailable;
    const first = await f.invoke(), uid = f.records()[0][1].childUid;
    assert.equal(first.status, lookupUnavailable ? 500 : 201);
    assert.equal(f.users.has(uid), true); assert.equal(f.deleteCalls.length, 0);
    f.controls.failGetUser = false;
    const retry = await f.instance()();
    assert.equal(retry.status, lookupUnavailable ? 201 : 200);
    assert.equal(retry.body.childUid, uid); assert.deepEqual(f.created, [uid]);
  }
});

test('an occupied email never authorizes adopting or deleting its foreign UID', async () => {
  const f = fixture();
  f.users.set('foreign-child', { uid: 'foreign-child', email: `${payload.code}@synaq.kids` });
  for (let repeat = 0; repeat < 2; repeat++) {
    const result = await f.instance()();
    assert.equal(result.status, 409); assert.equal(result.body.error, 'email-already-in-use');
  }
  assert.equal(f.users.has('foreign-child'), true); assert.equal(f.deleteCalls.length, 0);
  assert.equal(f.created.length, 0); assert.equal(f.records()[0][1].status, 'cancelled');
  assert.equal(f.docs.has('childIndex/foreign-child'), false);
});

test('a reserved UID with mismatched email or disabled Auth identity is not adopted or deleted', async () => {
  for (const mismatch of [{ email: 'different@synaq.kids' }, { disabled: true }]) {
    const f = fixture(); f.controls.failCreate = true; await f.invoke(); f.controls.failCreate = false;
    const uid = f.records()[0][1].childUid;
    f.users.set(uid, { uid, email: `${payload.code}@synaq.kids`, ...mismatch });
    const result = await f.instance()();
    assert.equal(result.status, 409); assert.equal(result.body.error, 'request_incomplete');
    assert.equal(f.users.has(uid), true); assert.equal(f.deleteCalls.length, 0);
    assert.equal(f.records()[0][1].status, 'reserved');
  }
});

test('separate concurrent requests for one parent create only one child and clean up only the losing reservation', async () => {
  const f = fixture(), bothEntered = deferred(), release = deferred();
  let entered = 0;
  f.controls.beforeCreate = async () => { if (++entered === 2) bothEntered.resolve(); await release.promise; };
  const first = f.invoke(), second = f.instance()({ ...payload, requestId: SECOND, code: 'studenttwo' });
  await bothEntered.promise; assert.equal(f.records().length, 2); release.resolve();
  const results = await Promise.all([first, second]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  const winner = results.find((result) => result.status === 201).body.childUid;
  const loser = f.records().find(([, record]) => record.childUid !== winner)[1];
  assert.equal(loser.status, 'cancelled'); assert.equal(loser.reason, 'child_limit');
  assert.deepEqual(f.deleted, [loser.childUid]);
  assert.equal(f.users.has(winner), true); assert.equal(f.users.size, 1);
  assert.equal(f.docs.get('families/parent').childAccountUid, winner);
  assert.equal(f.docs.get('childCreateLimits/parent').count, 2);
});

test('concurrent retries of the same request share one Auth identity, relationship, and quota charge', async () => {
  const f = fixture(), bothEntered = deferred(), release = deferred();
  let entered = 0;
  f.controls.beforeCreate = async () => { if (++entered === 2) bothEntered.resolve(); await release.promise; };
  const first = f.invoke(), second = f.instance()();
  await bothEntered.promise; assert.equal(f.records().length, 1); release.resolve();
  const results = await Promise.all([first, second]);
  assert.deepEqual(results.map((result) => result.status), [201, 201]);
  assert.equal(results[0].body.childUid, results[1].body.childUid);
  assert.equal(f.created.length, 1); assert.equal(f.deleteCalls.length, 0);
  assert.equal(f.docs.get('childCreateLimits/parent').count, 1);
});

test('cancelled cleanup failure can be retried without creating another Auth identity', async () => {
  const f = fixture(); f.controls.failFinish = true; await f.invoke(); f.controls.failFinish = false;
  const uid = f.records()[0][1].childUid; f.addWinner(); f.controls.failDelete = true;
  assert.equal((await f.instance()()).body.error, 'child_limit');
  assert.equal(f.records()[0][1].status, 'cancelled'); assert.equal(f.users.has(uid), true);
  const createCount = f.createCalls.length;
  f.controls.failDelete = false;
  assert.equal((await f.instance()()).body.error, 'child_limit');
  assert.equal(f.users.has(uid), false); assert.deepEqual(f.deleted, [uid]);
  assert.equal(f.createCalls.length, createCount);
  assert.equal(f.docs.get('families/parent/children/winner').code, 'winnercode');
});

test('missing collection-group index blocks cleanup without treating a failed query as absence', async () => {
  const f = fixture(); f.controls.failFinish = true; await f.invoke(); f.controls.failFinish = false;
  const uid = f.records()[0][1].childUid; f.addWinner(); f.controls.failGroupQuery = true;
  assert.equal((await f.instance()()).body.error, 'child_limit');
  assert.equal(f.records()[0][1].status, 'reserved'); assert.equal(f.users.has(uid), true);
  assert.equal(f.deleteCalls.length, 0);
  f.controls.failGroupQuery = false;
  assert.equal((await f.instance()()).body.error, 'child_limit');
  assert.equal(f.users.has(uid), false); assert.deepEqual(f.deleted, [uid]);
});

test('ownership links in any family, or a trusted index, prohibit cleanup of the reserved identity', async () => {
  for (const relationship of ['foreign-family', 'index', 'own-child', 'foreign-marker']) {
    const f = fixture(); f.controls.failFinish = true; await f.invoke(); f.controls.failFinish = false;
    const uid = f.records()[0][1].childUid; f.addWinner();
    if (relationship === 'foreign-family') f.docs.set(`families/other/children/${uid}`, { code: payload.code });
    if (relationship === 'own-child') f.docs.set(`families/parent/children/${uid}`, { code: payload.code });
    if (relationship === 'index') f.docs.set(`childIndex/${uid}`, { parentUid: 'other', linkedByServer: true });
    if (relationship === 'foreign-marker') f.docs.set('families/other', { childAccountUid: uid });
    const result = await f.instance()();
    assert.equal(result.status, 409); assert.equal(f.users.has(uid), true); assert.equal(f.deleteCalls.length, 0);
  }
});

test('final post-Auth readback prevents cleanup when a foreign relationship appears after cancellation', async () => {
  const f = fixture(); f.controls.failFinish = true; await f.invoke(); f.controls.failFinish = false;
  const uid = f.records()[0][1].childUid; f.addWinner();
  f.controls.onGetUser = async () => {
    if (f.records()[0][1].status === 'cancelled') f.docs.set(`families/other/children/${uid}`, { code: payload.code });
  };
  assert.equal((await f.instance()()).body.error, 'child_limit');
  assert.equal(f.records()[0][1].status, 'cancelled'); assert.equal(f.users.has(uid), true);
  assert.equal(f.deleteCalls.length, 0);
});

test('failed final cleanup readback never deletes an Auth identity', async () => {
  const f = fixture(); f.controls.failFinish = true; await f.invoke(); f.controls.failFinish = false;
  const uid = f.records()[0][1].childUid; f.addWinner();
  f.controls.onGetUser = async () => { if (f.records()[0][1].status === 'cancelled') f.controls.failReadback = true; };
  assert.equal((await f.instance()()).body.error, 'child_limit');
  assert.equal(f.users.has(uid), true); assert.equal(f.deleteCalls.length, 0);
});

test('changed name, class, code, or PIN cannot reuse a reserved request and sensitive values are never logged', async () => {
  const f = fixture(); f.controls.failFinish = true; await f.invoke(); f.controls.failFinish = false;
  for (const patch of [{ name: 'Changed' }, { klass: '7' }, { code: 'changedcode' }, { pin: 'different-private-pin' }]) {
    const response = await f.instance()({ ...payload, ...patch });
    assert.equal(response.status, 409); assert.equal(response.body.error, 'request_conflict');
  }
  assert.equal(f.createCalls.length, 1); assert.equal(f.docs.get('childCreateLimits/parent').count, 1);
  assert.equal(JSON.stringify([...f.docs.values()]).includes(payload.pin), false);
  const output = JSON.stringify(f.logs);
  assert.equal(output.includes(payload.pin), false); assert.equal(output.includes(f.records()[0][1].hash), false);
});

test('completed legacy ledgers replay only with matching links and Auth identity, without new reservation or quota', async () => {
  const f = fixture(), childUid = 'legacy-child-uid';
  const { name, klass, code, pin } = payload;
  const hash = crypto.createHash('sha256').update(JSON.stringify({ name, klass, code, pin })).digest('hex');
  f.docs.set(`childCreateRequests/parent_${REQUEST}`, { parentUid: 'parent', hash, code, childUid });
  f.docs.set(`families/parent/children/${childUid}`, { name, klass, code });
  f.docs.set(`childIndex/${childUid}`, { parentUid: 'parent', linkedByServer: true });
  f.users.set(childUid, { uid: childUid, email: `${code}@synaq.kids` });
  const replay = await f.instance()();
  assert.equal(replay.status, 200); assert.equal(replay.body.childUid, childUid);
  assert.equal(f.createCalls.length, 0); assert.equal(f.docs.has('childCreateLimits/parent'), false);
  f.docs.delete(`childIndex/${childUid}`);
  assert.equal((await f.instance()()).body.error, 'request_incomplete');
  assert.equal(f.deleteCalls.length, 0);
});

test('legacy clients without requestId use a stable reservation and recover partial creation', async () => {
  const f = fixture(), body = { ...payload }; delete body.requestId;
  f.controls.failFinish = true; assert.equal((await f.invoke(body)).status, 500); f.controls.failFinish = false;
  const [path, record] = f.records()[0];
  assert.match(path, /^childCreateRequests\/parent_legacy_[a-f0-9]{64}$/);
  const retry = await f.instance()(body);
  assert.equal(retry.status, 201); assert.equal(retry.body.childUid, record.childUid);
  assert.equal(f.created.length, 1); assert.equal(f.docs.get('childCreateLimits/parent').count, 1);
});

test('lost successful Firestore acknowledgement replays committed ownership and never rolls back Auth', async () => {
  for (const unavailableReadback of [false, true]) {
    const f = fixture(); f.controls.loseFinishAck = true; f.controls.failReadback = unavailableReadback;
    const first = await f.invoke(), uid = f.records()[0][1].childUid;
    assert.equal(first.status, unavailableReadback ? 500 : 201);
    assert.equal(f.records()[0][1].status, 'complete'); assert.equal(f.users.has(uid), true);
    assert.equal(f.deleteCalls.length, 0); f.controls.failReadback = false;
    const replay = await f.instance()();
    assert.equal(replay.status, 200); assert.equal(replay.body.childUid, uid);
    assert.equal(f.createCalls.length, 1);
  }
});

test('normal daily reservation quota is retained while an existing reserved request remains retryable', async () => {
  const f = fixture(); f.controls.failCreate = true;
  for (let i = 0; i < 10; i++) {
    const requestId = `${String(i).padStart(8, '0')}-3333-4333-8333-333333333333`;
    assert.equal((await f.instance()({ ...payload, requestId })).status, 500);
  }
  const denied = await f.instance()();
  assert.equal(denied.status, 429); assert.equal(denied.body.error, 'rate_limit');
  assert.equal(f.records().length, 10); assert.equal(f.createCalls.length, 10);
  f.controls.failCreate = false;
  const retry = await f.instance()({ ...payload, requestId: '00000000-3333-4333-8333-333333333333' });
  assert.equal(retry.status, 201); assert.equal(f.docs.get('childCreateLimits/parent').count, 10);
});
