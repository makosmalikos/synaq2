import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { readPendingTraining, writePendingTraining, clearPendingTraining, trainingDayKey, trainingQuestion } from '../frontend/src/trainingPersistence.js';

const source = fs.readFileSync(new URL('../frontend/src/components/Training.jsx', import.meta.url), 'utf8');
const saveHandlers = source.slice(source.indexOf('  function terminalLearningError('), source.indexOf('  const saveNotice ='));
const navigation = source.slice(source.indexOf('  const start ='), source.indexOf('  const fmt ='));
const loadEffect = source.slice(source.indexOf('  useEffect(() => {\n    let alive = true;'), source.indexOf('  }, [uid, loadRetry]);') + '  }, [uid, loadRetry]);'.length);
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function memoryStorage() {
  const data = new Map();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}

function fixture({ storage = memoryStorage(), pro = false, count = 4, save, start, ready = true, uid = 'kid' } = {}) {
  const writes = [], starts = [], xp = [], timers = [];
  const question = { id: 'q1', statement: '2 + 2?', answer: '4', topic: 'eq', school: 'НИШ' };
  const topic = { id: 'eq', name: 'Equations' };
  const state = { Done: count, Solved: new Set(), SolvedIn: {}, SaveState: 'idle', Checked: false, Answer: '4', Topic: topic, Items: [question], Loading: false, LoadErrorCode: '', SessionState: ready ? 'ready' : 'idle', ServerResult: null };
  let saveImpl = save || (async () => ({ saved: true, gain: 105, totalXp: 130 }));
  let startImpl = start || (async (_owner, _payload, id) => ({ id, question: trainingQuestion(question), startedAt: Date.now(), expiresAt: Date.now() + 3600000 }));
  let countImpl = async () => count;
  let nextId = ready ? 1 : 0;
  const context = {
    uid, pro, locked: false, checked: false, loading: false, opening: false,
    answer: '4', items: [question], i: 0, secs: 60, topic, lang: 'ru', loadRetry: 0,
    checkingRef: { current: false }, savingRef: { current: false }, pendingAttempt: { current: null },
    questionSession: { current: ready ? { key: `${uid}:eq:0:q1`, uid, qid: 'q1', id: 'stable-attempt-1', ready: true } : null },
    currentQuestion: { current: `${uid}:eq:0:q1` }, sessionState: ready ? 'ready' : 'idle',
    mounted: { current: true }, topicRequest: { current: 0 }, dayRef: { current: 'today' },
    solvedRef: { current: new Set() }, onXpRef: { current: (...args) => xp.push(args) },
    auth: { currentUser: { uid } }, crypto: { randomUUID: () => `stable-attempt-${++nextId}` },
    trainingQuestion, trainingDayKey: () => 'today',
    writePendingTraining: (value) => writePendingTraining(value, storage),
    readPendingTraining: (owner) => readPendingTraining(owner, storage),
    clearPendingTraining: (owner, id) => clearPendingTraining(owner, id, storage),
    saveAttempt: async (...args) => { writes.push(args); return { correct: true, answer: '4', solution: '2 + 2 = 4', count: 5, secs: 60, ...await saveImpl(...args) }; },
    startLearningSession: async (...args) => { starts.push(args); return startImpl(...args); },
    todayCount: async () => countImpl(),
    getTrainingTopics: async () => [topic], getTrainingQuestions: async () => [trainingQuestion(question)],
    getSolved: async () => [], getFlags: async () => [],
    watchPro: (_owner, callback) => { callback(pro); return () => {}; },
    translateQuestions: async (list) => list, t: (key) => key,
    setTimeout: (callback) => timers.push(callback),
    useEffect: (effect) => { context.cleanup = effect(); },
  };
  for (const name of ['Done', 'Solved', 'SolvedIn', 'SaveState', 'Checked', 'Answer', 'Topic', 'Items', 'I', 'Secs', 'XpPop', 'Opening', 'RecoveryAvailable', 'Loading', 'LoadError', 'LoadErrorCode', 'Pro', 'Flags', 'Topics', 'SessionState', 'SessionNotice', 'ServerResult']) {
    context[`set${name}`] = (value) => {
      state[name] = typeof value === 'function' ? value(state[name]) : value;
      context[name[0].toLowerCase() + name.slice(1)] = state[name];
    };
  }
  vm.createContext(context); vm.runInContext(saveHandlers + navigation + '\nglobalThis.leave = leaveTopic; globalThis.startSession = start;', context);
  return { context, state, writes, starts, xp, storage, question, topic,
    setSave: (value) => { saveImpl = value; }, setCount: (value) => { countImpl = value; },
    setStart: (value) => { startImpl = value; },
    load: () => vm.runInContext(loadEffect, context),
  };
}

test('same-render duplicate check is journaled once; confirmed XP uses the actual hourly bonus', async () => {
  const pending = deferred();
  const f = fixture({ pro: true, save: () => pending.promise });
  f.context.check(); f.context.check();
  assert.equal(f.writes.length, 1);
  assert.equal(readPendingTraining('kid', f.storage).id, 'stable-attempt-1');
  assert.equal(f.state.Done, 4);
  pending.resolve({ saved: true, gain: 105, totalXp: 130 }); await tick();
  assert.deepEqual(f.xp, [[105, 130]]);
  assert.equal(f.state.XpPop, 105);
  assert.equal(f.state.Done, 5, 'paid attempts must count if Pro expires later in the session');
  assert.equal(f.state.SaveState, 'saved');
  assert.equal(readPendingTraining('kid', f.storage), null);
  assert.ok(f.context.solvedRef.current.has('q1'));
});

test('failed save retries the stable ID; an ambiguous previous commit reconciles XP and free count once', async () => {
  const f = fixture({ save: async () => { throw new Error('offline'); } });
  f.context.check(); await tick();
  assert.equal(f.state.SaveState, 'error'); assert.equal(f.state.Done, 4);
  f.context.leave();
  assert.equal(f.state.Topic.id, 'eq', 'navigation cannot discard the pending answer');
  f.setSave(async () => ({ saved: false, gain: 0, totalXp: 130 }));
  f.setCount(async () => 5);
  await f.context.persistAttempt();
  assert.deepEqual(f.writes.map((args) => args[2]), ['stable-attempt-1', 'stable-attempt-1']);
  assert.deepEqual(f.xp, [[0, 130]]);
  assert.equal(f.state.Done, 5); assert.equal(f.state.Checked, true);
  assert.equal(f.state.SaveState, 'saved');
  assert.equal(readPendingTraining('kid', f.storage), null);
});

test('refresh restores checked feedback and resumes the same unsaved attempt', async () => {
  const first = fixture({ save: async () => { throw new Error('offline'); } });
  first.context.check(); await tick();
  const refreshed = fixture({ storage: first.storage });
  refreshed.load(); await tick(); await tick();
  assert.equal(refreshed.state.Checked, true);
  assert.equal(refreshed.state.Answer, '4');
  assert.equal(refreshed.state.Items[0].id, 'q1');
  assert.equal(refreshed.writes.length, 1);
  assert.equal(refreshed.writes[0][2], 'stable-attempt-1');
  assert.equal(refreshed.state.Done, 5);
  assert.equal(refreshed.state.SaveState, 'saved');
  assert.equal(readPendingTraining('kid', first.storage), null);
});

test('refresh after a committed write does not count or credit the attempt twice', async () => {
  const first = fixture({ save: async () => { throw new Error('lost acknowledgement'); } });
  first.context.check(); await tick();
  const refreshed = fixture({ storage: first.storage, count: 5, save: async () => ({ saved: false, gain: 0, totalXp: 130 }) });
  refreshed.load(); await tick(); await tick();
  assert.equal(refreshed.state.Done, 5);
  assert.deepEqual(refreshed.xp, [[0, 130]]);
  assert.equal(refreshed.state.Checked, true, 'fifth answer keeps its feedback visible');
});

test('a retry remains recoverable when its post-commit daily count cannot be read', async () => {
  const f = fixture({ save: async () => ({ saved: false, gain: 0, totalXp: 130, count: null }) });
  f.setCount(async () => { throw new Error('offline count'); });
  f.context.check(); await tick();
  assert.equal(f.state.SaveState, 'error');
  assert.ok(readPendingTraining('kid', f.storage));
  assert.equal(f.xp.length, 0);
  f.setCount(async () => 5); await f.context.persistAttempt();
  assert.equal(f.state.Done, 5); assert.deepEqual(f.xp, [[0, 130]]);
});

test('storage failure is nonfatal but surfaced; invalid or foreign journals are ignored', async () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const f = fixture({ storage: blocked });
  f.context.check(); assert.equal(f.state.RecoveryAvailable, false); await tick();
  assert.equal(f.state.SaveState, 'saved');
  const pending = fixture({ save: async () => { throw new Error('offline'); } });
  pending.context.check(); await tick();
  assert.equal(readPendingTraining('other-kid', pending.storage), null);
  const [key, raw] = [...pending.storage.data.entries()][0];
  const record = JSON.parse(raw);
  pending.storage.data.set(key, JSON.stringify({ ...record, version: 999 }));
  assert.equal(readPendingTraining('kid', pending.storage), null);
  pending.storage.data.set(key, '{broken');
  assert.equal(readPendingTraining('kid', pending.storage), null);
});

test('late confirmation clears only its own journal and cannot mutate another child or unmounted screen', async () => {
  const promise = deferred(), f = fixture({ save: () => promise.promise });
  f.context.check();
  f.context.mounted.current = false;
  f.context.auth.currentUser = { uid: 'other-kid' };
  const before = { ...f.state };
  promise.resolve({ saved: true, gain: 5, totalXp: 30 }); await tick();
  assert.deepEqual(f.state, before); assert.equal(f.xp.length, 0);
  assert.equal(readPendingTraining('kid', f.storage), null);
  const record = { uid: 'kid', id: 'new-attempt', sessionId: 'new-attempt', question: f.question, answer: '4', payload: { sessionId: 'new-attempt', answer: '4' } };
  writePendingTraining(record, f.storage); clearPendingTraining('kid', 'old-attempt', f.storage);
  assert.equal(readPendingTraining('kid', f.storage).id, 'new-attempt');
});

test('late topic loads cannot replace the latest session and completed questions are excluded immediately', async () => {
  const f = fixture(), delayed = deferred();
  const first = f.context.openQuestions({ id: 'old', name: 'Old' }, () => delayed.promise);
  await f.context.openQuestions({ id: 'new', name: 'New' }, async () => [{ ...f.question, id: 'new-q' }]);
  delayed.resolve([f.question]); await first;
  assert.equal(f.state.Topic.id, 'new'); assert.equal(f.state.Items[0].id, 'new-q');
  f.context.solvedRef.current.add('q1');
  f.context.startSession(f.topic, [f.question, { ...f.question, id: 'q2' }]);
  assert.deepEqual(f.state.Items.map((item) => item.id), ['q2']);
});

test('missing authentication never produces unsaved checked feedback and Almaty day keys roll over', () => {
  const f = fixture(); f.context.auth.currentUser = null; f.context.check();
  assert.equal(f.state.Checked, false); assert.equal(f.state.LoadError, true); assert.equal(f.writes.length, 0);
  assert.equal(trainingDayKey(new Date('2026-09-24T18:59:59Z')), '2026-09-24');
  assert.equal(trainingDayKey(new Date('2026-09-24T19:00:00Z')), '2026-09-25');
  assert.match(source, /setInterval\(refreshDay, 60000\)/);
});

test('slow bootstrap across midnight reloads the daily count instead of keeping yesterday locked', async () => {
  const f = fixture({ count: 5 }), topics = deferred();
  let day = 'yesterday', countReads = 0;
  f.context.trainingDayKey = () => day;
  f.context.getTrainingTopics = () => topics.promise;
  f.setCount(async () => { countReads++; return day === 'yesterday' ? 5 : 0; });
  f.load(); await tick();
  day = 'today';
  topics.resolve([f.topic]); await tick(); await tick();
  assert.equal(countReads, 2, 'the count returned before midnight must be refreshed');
  assert.equal(f.state.Done, 0);
  assert.equal(f.context.dayRef.current, 'today');
  assert.equal(f.state.Loading, false);
});

test('bootstrap preserves a server configuration error for an actionable message', async () => {
  const f = fixture();
  f.setCount(async () => { throw Object.assign(new Error('server_not_configured'), { code: 'learning/server_not_configured' }); });
  f.load(); await tick(); await tick();
  assert.equal(f.state.LoadError, true);
  assert.equal(f.state.LoadErrorCode, 'learning/server_not_configured');
  assert.match(source, /Firebase Admin/);
});

test('opening a question starts its server clock before submission and blocks check until ready', async () => {
  const promise = deferred(), f = fixture({ ready: false, start: () => promise.promise });
  const opening = f.context.beginQuestion();
  await f.context.beginQuestion();
  f.context.check();
  assert.equal(f.starts.length, 1);
  assert.equal(f.state.SessionState, 'starting');
  assert.equal(f.writes.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(f.starts[0])), ['kid', { mode: 'training', qid: 'q1' }, 'stable-attempt-1']);
  promise.resolve({ id: 'stable-attempt-1', question: trainingQuestion(f.question), startedAt: Date.now(), expiresAt: Date.now() + 3600000 });
  await opening;
  assert.equal(f.state.SessionState, 'ready');
  assert.equal('answer' in f.state.Items[0], false);
  assert.equal('solution' in f.state.Items[0], false);
  f.context.check(); await tick();
  assert.deepEqual(JSON.parse(JSON.stringify(f.writes[0])), ['kid', { sessionId: 'stable-attempt-1', answer: '4' }, 'stable-attempt-1']);
});

test('transport retry preserves the session ID while an explicitly restarted expired session gets a new ID', async () => {
  const f = fixture({ ready: false, start: async () => { throw Error('offline'); } });
  await f.context.beginQuestion();
  assert.equal(f.state.SessionState, 'error');
  f.setStart(async (_owner, _payload, id) => ({ id, question: trainingQuestion(f.question), startedAt: Date.now() }));
  await f.context.beginQuestion();
  assert.deepEqual(f.starts.map((args) => args[2]), ['stable-attempt-1', 'stable-attempt-1']);
  f.setSave(async () => { throw Object.assign(Error('expired'), { code: 'learning/session-expired' }); });
  f.context.check(); await tick();
  assert.equal(f.state.SessionState, 'expired');
  assert.equal(f.state.Checked, false);
  assert.equal(f.context.pendingAttempt.current, null);
  assert.equal(readPendingTraining('kid', f.storage), null);
  await f.context.beginQuestion();
  assert.equal(f.starts.length, 2, 'expired sessions do not restart implicitly');
  await f.context.beginQuestion({ fresh: true });
  assert.equal(f.starts[2][2], 'stable-attempt-2');
  assert.equal(f.state.SessionState, 'ready');
  assert.equal(f.writes.length, 1, 'restart must not silently resubmit the old answer');
});

test('late start responses cannot replace a new question, a new account or an unmounted screen', async () => {
  for (const transition of ['question', 'account', 'unmount']) {
    const pending = deferred(), f = fixture({ ready: false, start: () => pending.promise });
    const opening = f.context.beginQuestion();
    if (transition === 'question') f.context.currentQuestion.current = 'kid:eq:1:q2';
    if (transition === 'account') f.context.auth.currentUser = { uid: 'other-child' };
    if (transition === 'unmount') f.context.mounted.current = false;
    const before = { ...f.state };
    pending.resolve({ id: 'stable-attempt-1', question: trainingQuestion(f.question), startedAt: Date.now() });
    await opening;
    assert.deepEqual(f.state, before);
    assert.equal(f.context.questionSession.current.ready, false);
  }
});

test('only the server verdict, solution, elapsed time and daily count drive confirmed feedback', async () => {
  const f = fixture({ pro: true, save: async () => ({ saved: true, gain: 0, totalXp: 25,
    correct: false, answer: 'server answer', solution: 'server solution', secs: 7, count: 19 }) });
  f.context.secs = 999999;
  f.setCount(async () => { throw Error('should not query legacy count'); });
  f.context.check();
  assert.equal(f.state.ServerResult, null, 'no optimistic correctness before server response');
  await tick();
  assert.deepEqual(JSON.parse(JSON.stringify(f.state.ServerResult)), { correct: false, answer: 'server answer', solution: 'server solution' });
  assert.equal(f.state.Secs, 7);
  assert.equal(f.state.Done, 19);
  assert.deepEqual(f.xp, [[0, 25]]);
  assert.equal(f.state.SaveState, 'saved');
  assert.doesNotMatch(source, /isCorrect\(/);
});

test('daily-limit start and submit errors are terminal and do not trap the user in a pending retry', async () => {
  const limited = () => { throw Object.assign(Error('limited'), { code: 'learning/daily-limit' }); };
  const opening = fixture({ ready: false, start: limited });
  await opening.context.beginQuestion();
  assert.equal(opening.state.SessionState, 'limited');
  assert.equal(opening.context.pendingAttempt.current, null);
  opening.context.leave(); assert.equal(opening.state.Topic, null);

  const submit = fixture({ pro: true, save: limited });
  submit.context.check(); await tick();
  assert.equal(submit.state.SessionState, 'limited');
  assert.equal(submit.state.Checked, false);
  assert.equal(submit.state.SaveState, 'idle');
  assert.equal(submit.context.pendingAttempt.current, null);
  assert.equal(readPendingTraining('kid', submit.storage), null);
  submit.context.leave(); assert.equal(submit.state.Topic, null);
});

test('missing server sessions expose an explicit restart instead of retrying forever', async () => {
  const f = fixture({ save: async () => { throw Object.assign(Error('missing'), { code: 'learning/session-not-found' }); } });
  f.context.check(); await tick();
  assert.equal(f.state.SessionState, 'expired');
  assert.equal(f.context.pendingAttempt.current, null);
  assert.equal(readPendingTraining('kid', f.storage), null);
  assert.deepEqual(f.xp, []);
  assert.equal(f.state.Done, 4);
});

test('server anti-abuse start limit is terminal, including paid accounts', async () => {
  const f = fixture({ pro: true, ready: false, start: async () => { throw Object.assign(Error('rate'), { code: 'learning/rate-limit' }); } });
  await f.context.beginQuestion();
  assert.equal(f.state.SessionState, 'limited');
  await f.context.beginQuestion();
  assert.equal(f.starts.length, 1);
  f.context.leave(); assert.equal(f.state.Topic, null);
});

test('same-render double restart cannot create two new server sessions', async () => {
  const pending = deferred(), f = fixture({ ready: false, start: () => pending.promise });
  const first = f.context.beginQuestion({ fresh: true });
  await f.context.beginQuestion({ fresh: true });
  assert.equal(f.starts.length, 1);
  pending.resolve({ id: 'stable-attempt-1', question: trainingQuestion(f.question), startedAt: Date.now() });
  await first;
  assert.equal(f.state.SessionState, 'ready');
});

test('legacy pre-server journals migrate once without trusting their correctness or seconds', async () => {
  const storage = memoryStorage();
  storage.setItem('synaq_training_pending_v1_kid', JSON.stringify({ version: 1, uid: 'kid', id: 'legacy-session-id',
    question: { id: 'q1', statement: '2 + 2?', answer: 'evil', solution: 'client solution', topic: 'eq' },
    answer: '4', topic: { id: 'eq', name: 'Equations' }, payload: { qid: 'q1', correct: true, secs: 99999999, topic: 'eq' } }));
  const f = fixture({ storage, save: async () => ({ saved: true, correct: false, answer: '5', solution: 'trusted', gain: 0, totalXp: 0, secs: 0 }) });
  f.load(); await tick(); await tick();
  assert.equal(f.starts.length, 1);
  assert.equal(f.starts[0][2], 'legacy-session-id');
  assert.deepEqual(JSON.parse(JSON.stringify(f.writes[0])), ['kid', { sessionId: 'legacy-session-id', answer: '4' }, 'legacy-session-id']);
  assert.equal(f.state.SessionNotice, 'legacy');
  assert.equal(f.state.ServerResult.correct, false);
  assert.equal(f.state.Secs, 0);
  assert.equal(storage.data.size, 0);
});

test('v2 journals contain the session and answer only, not local grading or answer keys', async () => {
  const f = fixture({ save: async () => { throw Error('offline'); } });
  f.context.check(); await tick();
  const restored = readPendingTraining('kid', f.storage);
  assert.equal(restored.version, 2);
  assert.equal(restored.sessionId, restored.id);
  assert.deepEqual(restored.payload, { sessionId: restored.id, answer: '4' });
  assert.equal('answer' in restored.question, false);
  assert.equal('solution' in restored.question, false);
  const [key] = f.storage.data.keys();
  f.storage.setItem(key, JSON.stringify({ ...restored, payload: { ...restored.payload, sessionId: 'foreign-session' } }));
  assert.equal(readPendingTraining('kid', f.storage), null);
});
