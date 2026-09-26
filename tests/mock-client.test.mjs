import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { readMockSession, writeMockSession, clearMockSession, discardMockSession, mockRemaining, mockSpent } from '../frontend/src/mockPersistence.js';
import { api } from '../frontend/src/api.js';
import { ensureBankReady } from '../frontend/src/bank.js';

await ensureBankReady(async () => []);
const source = fs.readFileSync(new URL('../frontend/src/components/Mock.jsx', import.meta.url), 'utf8');
const applyHandlers = source.slice(source.indexOf('  function applyRun('), source.indexOf('  useEffect(() => {\n    let alive = true;'));
const recoveryEffect = source.slice(source.indexOf('  useEffect(() => {\n    let alive = true;'), source.indexOf('  }, [uid, recoveryRetry]);') + '  }, [uid, recoveryRetry]);'.length);
const handlers = source.slice(source.indexOf('  async function startExam('), source.indexOf('  const formatLabel ='));
const timerEffect = source.slice(source.indexOf('  useEffect(() => {\n    if (!sessionReady'), source.indexOf('  }, [sessionReady, test, result, pause, uid]);') + '  }, [sessionReady, test, result, pause, uid]);'.length);
const nextTick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const copy = (value) => JSON.parse(JSON.stringify(value));
function memoryStorage() {
  const data = new Map();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}

function fixture({ storage = memoryStorage(), uid = 'kid', pro = true, diagUsed = false, save, mark, restore } = {}) {
  let now = 100000;
  let saveImpl = save || (async () => {});
  let markImpl = mark || (async () => {});
  let restoreImpl = restore || (async (value) => value);
  const state = {}, writes = [], marked = [], graded = [], timers = [];
  const variant = { id: 'exam-1', school: 'РФМШ', timeLimitMin: 1, sections: 2, targetCount: 3,
    questions: [1, 2, 3].map((num) => ({ id: `q${num}`, num, section: num < 3 ? 1 : 2, statement: '2 + 2?', options: ['3', '4'] })) };
  const result = { score: 1, gradable: 3, total: 3, review: [{ num: 1, qid: 'q1', correct: true, answer: '4', your: '4' }] };
  const context = {
    uid, pro, diagUsed, ru: true, lang: 'ru', sessionReady: true, recoveryError: '', recoveryRetry: 0,
    mounted: { current: true }, runRef: { current: null }, attemptId: { current: null }, pendingSave: { current: null },
    generationRef: { current: 0 },
    deadlineRef: { current: null }, pausedAtRef: { current: null }, submittingRef: { current: false },
    startingRef: { current: false }, savingRef: { current: false }, tick: { current: null }, submitRef: { current: () => {} },
    auth: { currentUser: { uid } }, Date: { now: () => now }, crypto: { randomUUID: () => 'stable-exam-attempt' },
    readRecent: () => [], rememberRecent: () => {}, getMocks: async () => [], translateQuestions: async (list) => list,
    readMockSession: (owner) => readMockSession(owner, storage), writeMockSession: (record) => writeMockSession(record, storage),
    clearMockSession: (owner, id) => clearMockSession(owner, id, storage),
    mockRemaining: (record) => mockRemaining(record, now), mockSpent: (record) => mockSpent(record, now),
    saveMock: async (...args) => { writes.push(args); return saveImpl(...args); },
    markDiagnosticComplete: async (owner) => { marked.push(owner); return markImpl(owner); },
    api: {
      mockRandom: async () => variant, mockRestore: async (value) => restoreImpl(value),
      reviewQuestionIds: () => [], reviewVariantId: () => null,
      mockSubmit: async (id, answers) => { graded.push({ id, answers }); return result; },
    },
    useEffect: (effect) => { context.cleanup = effect(); }, clearInterval: () => {},
    setInterval: (callback) => { timers.push(callback); return timers.length; },
  };
  context.isCurrent = () => context.mounted.current && context.auth.currentUser?.uid === uid;
  for (const key of ['School', 'Test', 'Meta', 'Answers', 'Flags', 'I', 'Pause', 'Left', 'HideTimer', 'NavOpen', 'IsDiagnosticRun', 'Result', 'RecoveryAvailable', 'SessionReady', 'RecoveryError', 'SaveState', 'StartError', 'Starting', 'DiagUsed']) {
    context[`set${key}`] = (value) => { state[key] = typeof value === 'function' ? value(state[key]) : value; };
  }
  vm.createContext(context);
  vm.runInContext(applyHandlers + handlers, context);
  return { context, state, storage, writes, marked, graded, variant, result, timers,
    advance: (ms) => { now += ms; }, setSave: (impl) => { saveImpl = impl; }, setMark: (impl) => { markImpl = impl; },
    start: () => context.startExam('РФМШ'), load: () => vm.runInContext(recoveryEffect, context),
    timer: () => { Object.assign(context, { test: state.Test, result: state.Result, pause: state.Pause }); vm.runInContext(timerEffect, context); },
  };
}

test('each answer is journaled synchronously and refresh restores exact variant, position, flags and deadline', async () => {
  const first = fixture(); await first.start();
  first.context.changeRun({ answers: { 1: '4', 2: '3' }, flags: { 2: true }, index: 1, hideTimer: true });
  const stored = readMockSession('kid', first.storage).record;
  assert.equal(stored.id, 'stable-exam-attempt'); assert.equal(stored.answers[2], '3');
  assert.equal(stored.test.questions.some((q) => Object.hasOwn(q, 'answer')), false);
  const refreshed = fixture({ storage: first.storage }); refreshed.advance(22000); refreshed.load(); await nextTick();
  assert.equal(refreshed.state.Test.id, 'exam-1'); assert.equal(refreshed.state.I, 1);
  assert.deepEqual(copy(refreshed.state.Answers), { 1: '4', 2: '3' });
  assert.equal(refreshed.state.Flags[2], true); assert.equal(refreshed.state.HideTimer, true);
  assert.equal(refreshed.state.Left, 38, 'navigation away cannot reset the exam timer');
  assert.equal(refreshed.context.runRef.current.deadline, stored.deadline);
  assert.equal(refreshed.writes.length, 0);
});

test('section pause survives refresh and neither paused time nor background time drifts', async () => {
  const first = fixture(); await first.start(); first.advance(10000);
  first.context.goToQuestion(2);
  assert.equal(first.state.Pause, true); assert.equal(first.state.Left, 50);
  const refreshed = fixture({ storage: first.storage }); refreshed.advance(130000); refreshed.load(); await nextTick();
  assert.equal(refreshed.state.Pause, true); assert.equal(refreshed.state.Left, 50);
  refreshed.context.resumeExam();
  assert.equal(refreshed.state.Pause, false); assert.equal(refreshed.state.Left, 50);
  assert.equal(refreshed.context.runRef.current.pausedMs, 120000);
  refreshed.advance(20000); await refreshed.context.submit(); await nextTick();
  assert.equal(refreshed.writes[0][1].spentSec, 30, 'study time excludes the inter-section break');
});

test('expired restored exam submits all stored answers once with the original attempt ID', async () => {
  const first = fixture(); await first.start(); first.context.changeRun({ answers: { 1: '4' } });
  const delayed = deferred();
  const refreshed = fixture({ storage: first.storage, save: () => delayed.promise });
  refreshed.advance(61000); refreshed.load(); await nextTick();
  refreshed.context.submitRef.current = refreshed.context.submit;
  refreshed.timer(); refreshed.context.submit();
  await nextTick();
  assert.equal(refreshed.graded.length, 1); assert.equal(refreshed.graded[0].answers[1], '4');
  assert.equal(refreshed.writes.length, 1); assert.equal(refreshed.writes[0][2], 'stable-exam-attempt');
  assert.equal(refreshed.writes[0][1].spentSec, 60, 'returning after expiry cannot inflate study time');
  assert.ok(readMockSession('kid', first.storage).record.pending);
  delayed.resolve(); await nextTick();
  assert.equal(refreshed.state.SaveState, 'saved'); assert.equal(readMockSession('kid', first.storage).record, null);
});

test('failed or ambiguous save survives refresh and replays the same payload without regrading', async () => {
  const first = fixture({ save: async () => { throw Error('lost acknowledgement'); } });
  await first.start(); first.context.changeRun({ answers: { 1: '4' } }); await first.context.submit(); await nextTick();
  assert.equal(first.state.SaveState, 'error');
  const record = readMockSession('kid', first.storage).record;
  assert.ok(record.pending); assert.equal(record.pending.id, record.id);
  const refreshed = fixture({ storage: first.storage, restore: async () => { throw Error('bank unavailable'); } });
  refreshed.load(); await nextTick(); await nextTick();
  assert.equal(refreshed.graded.length, 0, 'a pending result never depends on rebuilding the bank');
  assert.equal(refreshed.writes.length, 1);
  assert.deepEqual(copy(refreshed.writes[0]), copy(first.writes[0]));
  assert.equal(refreshed.state.SaveState, 'saved'); assert.equal(readMockSession('kid', first.storage).record, null);
});

test('partial diagnostic save keeps its stable journal until the free-use marker also succeeds', async () => {
  const first = fixture({ pro: false, mark: async () => { throw Error('offline marker'); } });
  await first.start(); await first.context.submit(); await nextTick();
  assert.equal(first.writes[0][1].diagnostic, true); assert.equal(first.state.SaveState, 'error');
  assert.ok(readMockSession('kid', first.storage).record.pending);
  first.setMark(async () => {}); await first.context.persistResult();
  assert.equal(first.writes.length, 2); assert.equal(first.writes[0][2], first.writes[1][2]);
  assert.equal(first.state.DiagUsed, true); assert.equal(readMockSession('kid', first.storage).record, null);
});

test('free entitlement checks and same-render double-start guard are preserved', async () => {
  for (const options of [{ pro: false, diagUsed: true }, { pro: null }, { diagUsed: null }]) {
    const f = fixture(options); await f.start(); assert.equal(f.context.runRef.current, null);
  }
  const f = fixture({ pro: false }), waiting = deferred();
  f.context.getMocks = () => waiting.promise;
  const first = f.start(); await f.start(); assert.equal(f.state.Starting, true);
  waiting.resolve([]); await first;
  assert.equal(f.context.runRef.current.isDiagnosticRun, true);
  const record = f.context.runRef.current; await f.start(); assert.equal(f.context.runRef.current, record);
});

test('read/write failures are explicit and a corrupt journal is never silently overwritten', async () => {
  const blocked = { getItem() { throw Error('disabled'); }, setItem() { throw Error('quota'); }, removeItem() { throw Error('disabled'); } };
  const f = fixture({ storage: blocked }); f.load(); await f.start();
  assert.equal(f.state.RecoveryAvailable, false); assert.equal(f.state.Test.id, 'exam-1');
  await f.context.submit(); await nextTick(); assert.equal(f.state.SaveState, 'saved');
  const valid = fixture(); await valid.start();
  const [key] = valid.storage.data.keys(); valid.storage.data.set(key, '{broken');
  const refreshed = fixture({ storage: valid.storage }); refreshed.load();
  assert.equal(refreshed.state.RecoveryError, 'invalid'); assert.equal(valid.storage.data.get(key), '{broken');
  assert.equal(discardMockSession('kid', valid.storage), true); assert.equal(readMockSession('kid', valid.storage).record, null);
});

test('failed restoration preserves the original answers and can be retried', async () => {
  const first = fixture(); await first.start(); first.context.changeRun({ answers: { 1: '4' } });
  const f = fixture({ storage: first.storage, restore: async () => { throw Error('question missing'); } });
  f.load(); await nextTick();
  assert.equal(f.state.RecoveryError, 'restore'); assert.equal(f.state.SessionReady, true);
  assert.equal(readMockSession('kid', first.storage).record.answers[1], '4');
  const retried = fixture({ storage: first.storage }); retried.load(); await nextTick();
  assert.equal(retried.state.Answers[1], '4');
});

test('journal is UID-isolated and rejects invalid versions, malformed timestamps and foreign pending saves', async () => {
  const f = fixture(); await f.start();
  assert.equal(readMockSession('other-kid', f.storage).record, null);
  const [key, raw] = [...f.storage.data.entries()][0], record = JSON.parse(raw);
  for (const patch of [{ version: 100 }, { uid: 'other-kid' }, { deadline: null }, { index: 500 }, { pausedAt: -1 }, { pending: { uid: 'other-kid', id: record.id, payload: {} }, result: { review: [] } }]) {
    f.storage.data.set(key, JSON.stringify({ ...record, ...patch }));
    assert.equal(readMockSession('kid', f.storage).error, 'invalid');
  }
});

test('late start or restore responses cannot update an unmounted screen or changed account', async () => {
  const pending = deferred(), f = fixture(); f.context.getMocks = () => pending.promise;
  const started = f.start(); f.context.auth.currentUser = { uid: 'other-kid' };
  const before = copy(f.state); pending.resolve([]); await started;
  assert.deepEqual(copy(f.state), before); assert.equal(f.context.runRef.current, null);
  const first = fixture(); await first.start(); const wait = deferred();
  const refreshed = fixture({ storage: first.storage, restore: () => wait.promise }); refreshed.load();
  refreshed.context.cleanup(); refreshed.context.mounted.current = false;
  const state = copy(refreshed.state); wait.resolve(first.variant); await nextTick();
  assert.deepEqual(copy(refreshed.state), state);
});

test('late save acknowledgement clears only its own journal and never mutates a different screen', async () => {
  const pending = deferred(), f = fixture({ save: () => pending.promise });
  await f.start(); await f.context.submit(); await nextTick();
  f.context.mounted.current = false; f.context.auth.currentUser = { uid: 'other-kid' };
  const before = copy(f.state);
  const newer = { ...readMockSession('kid', f.storage).record, id: 'new-exam', result: null, pending: null };
  writeMockSession(newer, f.storage);
  pending.resolve(); await nextTick();
  assert.deepEqual(copy(f.state), before); assert.equal(readMockSession('kid', f.storage).record.id, 'new-exam');
  assert.equal(clearMockSession('kid', 'stable-exam-attempt', f.storage), true);
  assert.equal(readMockSession('kid', f.storage).record.id, 'new-exam');
});

test('restored generated variants use canonical bank answers, not storage-supplied answers', async () => {
  const original = await api.mockRandom('РФМШ');
  const expected = await api.mockSubmit(original.id, { 1: '42' });
  const snapshot = { ...original, id: 'restored-variant', questions: original.questions.map((q) => ({ ...q, answer: '42', solution: 'forged' })) };
  assert.equal(await api.mockGet(snapshot.id), null);
  const restored = await api.mockRestore(snapshot);
  assert.deepEqual(restored.questions.map((q) => q.id), original.questions.map((q) => q.id));
  assert.ok(restored.questions.every((q) => !Object.hasOwn(q, 'answer')));
  assert.deepEqual(await api.mockSubmit(snapshot.id, { 1: '42' }), expected);
  await assert.rejects(api.mockRestore({ ...snapshot, questions: [{ ...snapshot.questions[0], id: 'no-such-question' }] }), /unavailable/);
  await assert.rejects(api.mockRestore({ ...snapshot, timeLimitMin: 100000 }), /invalid/);
});

test('elapsed helper uses ceiling seconds and cannot produce negative elapsed or remaining time', () => {
  const record = { startedAt: 1000, deadline: 2000, pausedMs: 0, pausedAt: null };
  assert.equal(mockRemaining(record, 1001), 1); assert.equal(mockRemaining(record, 4000), 0);
  assert.equal(mockSpent(record, 3600000), 1);
  assert.equal(mockSpent(record, 0), 0); assert.equal(mockSpent({ ...record, pausedAt: 1500 }, 9500), 1);
});
