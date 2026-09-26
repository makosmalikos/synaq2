import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { diagnosticProgressKey, diagnosticStorageKey } from '../frontend/src/platformDiagnostic.js';
import { acknowledgeDiagnosticResult, diagnosticRecovery, stageDiagnosticResult } from '../frontend/src/diagnosticPersistence.js';

const source = fs.readFileSync(new URL('../frontend/src/components/PlatformDiagnostic.jsx', import.meta.url), 'utf8');
const saveHandler = source.slice(source.indexOf('  async function persistResult()'), source.indexOf('\n  useEffect(() => {\n    if (recoveryAvailable'));
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
let sequence = 0;
function memoryStorage() {
  const data = new Map(), operations = [];
  return { data, operations, getItem: (key) => data.get(key) ?? null,
    setItem(key, value) { operations.push(['set', key]); data.set(key, value); },
    removeItem(key) { operations.push(['remove', key]); data.delete(key); } };
}
function result(saveId = 'attempt-1', completedAt = '2026-09-24T00:00:00.000Z') {
  return { version: 1, saveId, savePending: true, completedAt, topics: [], mistakes: [], readiness: 70, correct: 14, total: 20 };
}
function fixture({ storage = memoryStorage(), save = async () => {}, guest = false } = {}) {
  const uid = guest ? null : `diagnostic-child-${++sequence}`;
  const state = { save: 'idle', recovery: true }, writes = [];
  const value = result();
  let saveImpl = save;
  const context = {
    ownerUid: uid, auth: { currentUser: uid ? { uid } : null }, mounted: { current: true },
    pendingSave: { current: { uid, result: value, id: value.saveId } }, savingRef: { current: false },
    setSaveState: (next) => { state.save = next; }, setRecoveryAvailable: (next) => { state.recovery = next; },
    stageDiagnosticResult: (owner, data) => stageDiagnosticResult(owner, data, storage),
    acknowledgeDiagnosticResult: (owner, data) => acknowledgeDiagnosticResult(owner, data, storage),
    savePlatformDiagnostic: async (...args) => { writes.push(args); return saveImpl(...args); },
  };
  vm.createContext(context); vm.runInContext(saveHandler, context);
  return { context, state, writes, storage, uid, value, setSave(next) { saveImpl = next; } };
}

test('a complete result reaches storage before its matching draft is removed', () => {
  const uid = 'diag-order', storage = memoryStorage(), value = result();
  storage.setItem(diagnosticProgressKey(uid), JSON.stringify({ attemptId: value.saveId }));
  storage.operations.length = 0;
  assert.equal(stageDiagnosticResult(uid, value, storage), true);
  assert.deepEqual(storage.operations, [['set', diagnosticStorageKey(uid)], ['remove', diagnosticProgressKey(uid)]]);
  acknowledgeDiagnosticResult(uid, value, storage);
});

test('quota failure retains the draft and a UID-scoped in-memory pending result', () => {
  const uid = 'diag-quota', storage = memoryStorage(), value = result();
  storage.setItem(diagnosticProgressKey(uid), JSON.stringify({ attemptId: value.saveId }));
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(stageDiagnosticResult(uid, value, storage), false);
  assert.ok(storage.getItem(diagnosticProgressKey(uid)), 'last recoverable draft remains intact');
  assert.equal(diagnosticRecovery(uid).result.saveId, value.saveId);
  assert.equal(diagnosticRecovery(uid).durable, false);
  assert.equal(diagnosticRecovery('different-child').result, null);
  acknowledgeDiagnosticResult(uid, value, storage);
});

test('late acknowledgement and retry preserve a newer result and draft', () => {
  const uid = 'diag-newer', storage = memoryStorage(), old = result(), newer = result('attempt-2', '2026-09-24T01:00:00.000Z');
  stageDiagnosticResult(uid, old, storage);
  storage.setItem(diagnosticStorageKey(uid), JSON.stringify(newer));
  storage.setItem(diagnosticProgressKey(uid), JSON.stringify({ attemptId: newer.saveId }));
  assert.equal(stageDiagnosticResult(uid, old, storage), false);
  acknowledgeDiagnosticResult(uid, old, storage);
  assert.equal(JSON.parse(storage.getItem(diagnosticStorageKey(uid))).saveId, newer.saveId);
  assert.equal(JSON.parse(storage.getItem(diagnosticStorageKey(uid))).savePending, true);
  assert.equal(JSON.parse(storage.getItem(diagnosticProgressKey(uid))).attemptId, newer.saveId);
});

test('double save submits once and confirms the stable attempt ID', async () => {
  const wait = deferred(), f = fixture({ save: () => wait.promise });
  const first = f.context.persistResult(); f.context.persistResult();
  assert.equal(f.writes.length, 1); assert.equal(f.state.save, 'saving');
  wait.resolve(); await first;
  assert.equal(f.state.save, 'saved'); assert.equal(f.context.pendingSave.current, null);
  assert.equal(JSON.parse(f.storage.getItem(diagnosticStorageKey(f.uid))).savePending, false);
});

test('storage plus network failure is not called saved; retry keeps the ID', async () => {
  const storage = memoryStorage(), originalWrite = storage.setItem;
  storage.setItem = () => { throw new Error('blocked'); };
  const f = fixture({ storage, save: async () => { throw new Error('offline'); } });
  await f.context.persistResult();
  assert.equal(f.state.save, 'error'); assert.equal(f.state.recovery, false);
  assert.ok(f.context.pendingSave.current);
  storage.setItem = originalWrite;
  f.setSave(async () => {}); await f.context.persistResult();
  assert.deepEqual(f.writes.map((args) => args[2]), ['attempt-1', 'attempt-1']);
  assert.equal(f.state.save, 'saved'); assert.equal(f.state.recovery, true);
});

test('late confirmation cleans its journal but does not update another account or unmounted UI', async () => {
  const wait = deferred(), f = fixture({ save: () => wait.promise });
  const work = f.context.persistResult();
  f.context.mounted.current = false; f.context.auth.currentUser = { uid: 'other' };
  const state = { ...f.state };
  wait.resolve(); await work; await tick();
  assert.deepEqual(f.state, state);
  assert.equal(JSON.parse(f.storage.getItem(diagnosticStorageKey(f.uid))).savePending, false);
  assert.equal(diagnosticRecovery(f.uid).result, null, 'volatile pending result is cleared');
});

test('a retry after switching accounts never submits the previous child result', async () => {
  const f = fixture(); f.context.auth.currentUser = { uid: 'another-child' };
  await f.context.persistResult();
  assert.equal(f.writes.length, 0); assert.equal(f.state.save, 'idle');
});

test('guest storage failure remains pending instead of reporting fake server success', async () => {
  const storage = memoryStorage(), write = storage.setItem;
  storage.setItem = () => { throw Error('blocked'); };
  const f = fixture({ guest: true, storage });
  await f.context.persistResult();
  assert.equal(f.state.save, 'error'); assert.equal(f.writes.length, 0);
  storage.setItem = write; await f.context.persistResult();
  assert.equal(f.state.save, 'saved'); assert.equal(f.writes.length, 0);
});
