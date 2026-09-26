import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { memoryDb } = require('./helpers/memory-db.cjs');
const { createDuelService } = require('../backend/lib/duel-service.js');
const source = readFileSync(new URL('../frontend/src/Duel.jsx', import.meta.url), 'utf8');
const helpers = source.slice(source.indexOf('const consumedInvites ='), source.indexOf('const copy ='));
const submit = source.slice(source.indexOf('  async function onSubmit()'), source.indexOf('  function onPlayAgain()'));
const playAgain = source.slice(source.indexOf('  function onPlayAgain()'), source.indexOf('  async function onCopy()'));
const feedback = source.slice(source.indexOf('  // The server already'), source.indexOf('  // XP'));
const awardEffect = source.slice(source.indexOf('  // XP'), source.indexOf('  async function onCreate()'));

// Execute the production helpers, handlers and effect bodies, with only React
// state, timers and network boundaries stubbed. No Firebase or browser needed.
function fixture() {
  let resolve, reject;
  const response = new Promise((yes, no) => { resolve = yes; reject = no; });
  const state = { answer: '4', verdict: null, err: '', busy: false };
  let calls = 0;
  const context = {
    answer: '4', duel: { qIndex: 0, status: 'playing', round: {} }, role: 'host', code: 'ABCDEF',
    roundKey: 'ABCDEF:0', busy: false, submitting: { current: null },
    currentRound: { current: 'ABCDEF:0' }, currentAward: { current: 'ABCDEF:host' }, mounted: { current: true },
    submitDuelAnswer: () => { calls++; return response; },
    setBusy: (value) => { state.busy = value; }, setAnswer: (value) => { state.answer = value; },
    setVerdict: (value) => { state.verdict = value; }, setErr: (value) => { state.err = value; },
    errorText: (error) => error.message,
  };
  vm.createContext(context);
  vm.runInContext(helpers + submit + playAgain, context);
  return { context, state, resolve, reject, calls: () => calls };
}

test('client feedback follows server lastRound after atomic advance, with a stable timer key', async () => {
  const db = memoryDb(); let at = 100000;
  const act = createDuelService({ db, now: () => at, newCode: () => 'ABCDEF',
    getPool: async () => Array.from({ length: 15 }, (_, i) => ({ id: `q${i}`, statement: '2 + 2?', answer: '4' })) });
  await act({ uid: 'host' }, { action: 'create' });
  await act({ uid: 'guest' }, { action: 'join', code: 'ABCDEF' }); at += 3000;
  await act({ uid: 'host' }, { action: 'answer', code: 'ABCDEF', qIndex: 0, answer: '4' });
  await act({ uid: 'guest' }, { action: 'answer', code: 'ABCDEF', qIndex: 0, answer: '3' });
  const room = db.records.get('duels/ABCDEF');
  assert.equal(room.qIndex, 1);
  assert.deepEqual(room.round, { host: null, guest: null });
  const { context } = fixture();
  const key = context.duelFeedbackKey('ABCDEF', room);
  assert.equal(key, 'ABCDEF:0:103000:103000');
  assert.equal(context.duelFeedbackKey('ABCDEF', { ...room, round: { host: { submitted: true } } }), key);
  assert.equal(context.duelFeedbackKey('ABCDEF', { ...room, status: 'finished' }), null);
  let visible, timer, cleanup;
  Object.assign(context, { feedbackKey: key,
    useEffect: (effect) => { cleanup = effect(); },
    setShowRoundResult: (value) => { visible = value; },
    setTimeout: (callback, delay) => { assert.equal(delay, 2200); timer = callback; return 7; },
    clearTimeout: (id) => assert.equal(id, 7),
  });
  vm.runInContext(feedback, context);
  assert.equal(visible, true); timer(); assert.equal(visible, false); cleanup();
  // A running server timer must not be spent on a feedback-only screen.
  assert.doesNotMatch(source, /\{q && !showRoundResult/);
});

test('same-render answer clicks send once and current response updates feedback', async () => {
  const f = fixture();
  const first = f.context.onSubmit();
  await f.context.onSubmit();
  assert.equal(f.calls(), 1);
  assert.equal(f.state.busy, true);
  f.resolve({ advanced: false, correct: true }); await first;
  assert.equal(f.state.verdict, true);
  assert.equal(f.state.answer, '');
  assert.equal(f.state.busy, false);
  assert.equal(f.context.submitting.current, null);
});

test('late previous-round success cannot clear next-round input or its pending request', async () => {
  const f = fixture();
  const first = f.context.onSubmit();
  f.context.currentRound.current = 'ABCDEF:1';
  f.state.answer = 'answer to the new question';
  const newRequest = { key: 'ABCDEF:1' };
  f.context.submitting.current = newRequest;
  f.resolve({ advanced: false, correct: true }); await first;
  assert.equal(f.state.answer, 'answer to the new question');
  assert.equal(f.state.verdict, null);
  assert.equal(f.state.busy, true);
  assert.equal(f.context.submitting.current, newRequest);
});

test('late errors from another room or an unmounted screen do not alter UI state', async () => {
  for (const leave of ['room', 'unmount']) {
    const f = fixture(); const request = f.context.onSubmit();
    if (leave === 'room') f.context.currentRound.current = 'GHIJKL:0';
    else f.context.mounted.current = false;
    f.reject(new Error('old_request_failed')); await request;
    assert.equal(f.state.err, '');
    assert.equal(f.state.answer, '4');
  }
});

test('play again consumes invitation across remounts and works when sessionStorage is blocked', () => {
  const f = fixture(); const state = { code: 'ABCDEF', duel: f.context.duel, joining: true };
  Object.assign(f.context, {
    initialCode: 'ABCDEF', countdownDone: { current: true }, setAwardError: () => {},
    setConsumedInvite: (value) => { state.consumedInvite = value; },
    setCode: (value) => { state.code = value; }, setDuel: (value) => { state.duel = value; },
    setJoinInput: () => {}, setJoining: (value) => { state.joining = value; },
    setShowRoundResult: () => {}, setCountdown: () => {}, setGameReady: () => {},
    sessionStorage: { removeItem: () => { throw new Error('blocked storage'); } },
    window: { history: { replaceState: (_state, _title, path) => { state.path = path; } } },
  });
  assert.equal(f.context.shouldJoinInvite('ABCDEF', ''), true);
  f.context.onPlayAgain();
  assert.equal(state.code, ''); assert.equal(state.duel, null); assert.equal(state.joining, false);
  assert.equal(state.path, '/app');
  assert.equal(f.context.shouldJoinInvite('ABCDEF', state.consumedInvite), false);
  assert.equal(f.context.shouldJoinInvite('ABCDEF', ''), false, 'a fresh component cannot rejoin a consumed invitation');
  assert.equal(f.context.shouldJoinInvite('KLMNPQ', ''), true, 'another invitation remains usable');
  assert.equal(f.context.currentRound.current, null);
  assert.equal(f.context.currentAward.current, null, 'old award callbacks are invalidated before React renders');
  assert.match(source, /if \(fromLink && invitePending &&/);
  assert.match(source, /if \(!invitePending\) return undefined/);
});

function awardFixture() {
  const state = { error: false, retry: 0, gains: [] };
  const calls = [], timers = new Map();
  let cleanup, previousDeps, timerId = 0, force = false;
  const context = {
    award: { current: null }, currentAward: { current: null }, mounted: { current: true },
    auth: { currentUser: { uid: 'host' } }, onXpRef: { current: (gain) => state.gains.push(gain) },
    setAwardError: (value) => { state.error = value; },
    setAwardRetry: (update) => { state.retry = update(state.retry); },
    claimDuelXp: (code) => new Promise((resolve, reject) => calls.push({ code, resolve, reject })),
    setTimeout: (callback, delay) => { assert.equal(delay, 1500); timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => { timers.delete(id); },
    useEffect: (effect, deps) => {
      if (!force && previousDeps && deps.every((value, i) => Object.is(value, previousDeps[i]))) return;
      cleanup?.(); previousDeps = deps; cleanup = effect(); force = false;
    },
  };
  vm.createContext(context);
  vm.runInContext(helpers, context);
  function render(code = 'ABCDEF', uid = 'host', room = { id: code, status: 'finished', host: { uid: 'host' }, guest: { uid: 'guest' } }) {
    context.auth.currentUser = uid ? { uid } : null;
    const awardKey = context.duelAwardKey(code, room, uid);
    context.currentAward.current = awardKey;
    context.renderInputs = { code, awardUid: uid, awardKey, awardRetry: state.retry };
    // Capture the same per-render values as React; refs and Auth remain live.
    vm.runInContext(`(function({ code, awardUid, awardKey, awardRetry }) { ${awardEffect} })(renderInputs)`, context);
  }
  return {
    context, state, calls, timers, render,
    replay: () => { force = true; render(); },
    unmount: () => { context.mounted.current = false; cleanup?.(); },
    fireRetry: () => { const [id, callback] = timers.entries().next().value; timers.delete(id); callback(); },
  };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('late award from the previous room cannot mark the new room as credited or suppress its claim', async () => {
  const f = awardFixture();
  f.render('ABCDEF');
  f.render('GHIJKL');
  assert.deepEqual(f.calls.map(({ code }) => code), ['ABCDEF', 'GHIJKL']);
  const nextScope = f.context.award.current;
  f.calls[0].resolve({ gain: 100, credited: true }); await settle();
  assert.equal(nextScope.done, false);
  assert.equal(f.context.award.current, nextScope);
  assert.deepEqual(f.state.gains, []);
  f.calls[1].resolve({ gain: 80, credited: true }); await settle();
  assert.equal(nextScope.done, true);
  assert.deepEqual(f.state.gains, [80]);
});

test('a new code cannot claim using the previous room finished snapshot', () => {
  const f = awardFixture();
  const previous = { id: 'ABCDEF', status: 'finished', host: { uid: 'host' } };
  f.render('GHIJKL', 'host', previous);
  assert.equal(f.calls.length, 0);
  assert.equal(f.context.duelAwardKey('ABCDEF', previous, 'outsider'), null);
});

test('award effect replay reuses its promise and uses the latest XP callback only once', async () => {
  const f = awardFixture(); f.render(); f.replay();
  const latestGains = [];
  f.context.onXpRef.current = (gain) => latestGains.push(gain);
  f.render();
  assert.equal(f.calls.length, 1);
  f.calls[0].resolve({ gain: 120, credited: true }); await settle();
  assert.deepEqual(f.state.gains, []);
  assert.deepEqual(latestGains, [120]);
  f.replay(); assert.equal(f.calls.length, 1);
});

test('old award errors and unmounted requests cannot show an error or schedule a retry', async () => {
  for (const transition of ['room', 'unmount']) {
    const f = awardFixture(); f.render();
    if (transition === 'room') f.render('GHIJKL');
    else f.unmount();
    f.calls[0].reject(new Error('network')); await settle();
    assert.equal(f.state.error, false);
    assert.equal(f.timers.size, 0);
  }
});

test('award ownership includes uid and verifies current Auth even before a new render', async () => {
  const f = awardFixture(); f.render();
  f.render('ABCDEF', 'guest');
  assert.equal(f.calls.length, 2);
  f.calls[0].resolve({ gain: 100, credited: true }); await settle();
  assert.equal(f.context.award.current.done, false);
  assert.deepEqual(f.state.gains, []);
  f.calls[1].resolve({ gain: 30, credited: true }); await settle();
  assert.deepEqual(f.state.gains, [30]);

  const signedOut = awardFixture(); signedOut.render();
  signedOut.context.auth.currentUser = null;
  signedOut.calls[0].resolve({ gain: 100, credited: true }); await settle();
  assert.deepEqual(signedOut.state.gains, []);
  assert.equal(signedOut.context.award.current.done, false);
});

test('award retries are bounded per room, allow manual retry, and are cancelled on leaving', async () => {
  const f = awardFixture(); f.render();
  for (let attempt = 0; attempt < 3; attempt++) {
    f.calls[attempt].reject(new Error('network')); await settle();
    assert.equal(f.state.error, true);
    if (attempt < 2) {
      assert.equal(f.timers.size, 1); f.fireRetry(); f.render();
    } else assert.equal(f.timers.size, 0);
  }
  f.state.retry += 1; f.render();
  assert.equal(f.calls.length, 4);
  f.calls[3].resolve({ gain: 0, credited: false }); await settle();
  assert.equal(f.context.award.current.done, true);
  assert.equal(f.state.error, false);
  assert.deepEqual(f.state.gains, []);

  f.render('GHIJKL');
  f.calls[4].reject(new Error('network')); await settle();
  assert.equal(f.timers.size, 1, 'new room receives its own retry budget');
  f.render(''); assert.equal(f.timers.size, 0);
  assert.equal(f.calls.length, 5);
});
