import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import React from '../frontend/node_modules/react/index.js';
import { buildProgressModel, PROGRESS_ATTEMPT_LIMIT } from '../frontend/src/progressModel.js';

const source = fs.readFileSync(new URL('../frontend/src/Progress.jsx', import.meta.url), 'utf8');
const effect = source.slice(source.indexOf('  useEffect(() => {') + '  useEffect('.length,
  source.indexOf('  }, [uid, loadRetry, onXpLoad]);') + '  }'.length);
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

function fixture(overrides = {}) {
  const state = {}, xpLoads = [], listeners = [];
  const context = {
    uid: 'kid', console: { error() {} },
    auth: { currentUser: { uid: 'kid' } },
    getAttempts: async (uid, limit) => {
      assert.equal(uid, 'kid');
      assert.equal(limit, 500);
      return [{ qid: 'q1', topic: 'topic', correct: true, verified: true, at: { seconds: 100 } }];
    },
    getPlatformDiagnostics: async () => [{ readiness: 10, correct: 2, total: 20 }],
    getMocks: async () => [{ score: 10 }],
    getXpSummary: async () => ({ xp: 85, studySecs: 500 }),
    loadTopicCatalog: async () => [{ id: 'topic', gradableCount: 10 }],
    buildProgressModel, PROGRESS_ATTEMPT_LIMIT,
    onXpLoad: (xp) => xpLoads.push(xp),
    watchPro(uid, callback, error) {
      assert.equal(uid, 'kid');
      const listener = { callback, error, stopped: false };
      listeners.push(listener);
      return () => { listener.stopped = true; };
    },
    ...overrides,
  };
  for (const name of ['Loading', 'LoadError', 'Pro', 'Topics', 'Stats', 'Mocks', 'XpInfo', 'Diagnostics']) {
    context[`set${name}`] = (value) => { state[name] = value; };
  }
  vm.createContext(context);
  const mount = () => vm.runInContext(`(${effect})()`, context);
  return { state, xpLoads, listeners, context, mount };
}

test('failed progress reads never replace existing XP or progress with fake zeros', async () => {
  for (const helper of ['getAttempts', 'getMocks', 'getXpSummary', 'getPlatformDiagnostics']) {
    const f = fixture({ [helper]: async () => { throw Error('offline'); } });
    const stop = f.mount();
    f.listeners[0].callback(true);
    await tick();
    assert.equal(f.state.LoadError, true);
    assert.equal(f.state.Loading, false);
    assert.equal(f.state.Stats, undefined);
    assert.equal(f.state.XpInfo, undefined);
    assert.deepEqual(f.xpLoads, []);
    stop();
  }
});

test('retry recovers progress and Pro updates stay live', async () => {
  const f = fixture({ getAttempts: async () => { throw Error('offline'); } });
  let stop = f.mount();
  await tick();
  assert.equal(f.state.LoadError, true);
  stop();
  f.context.getAttempts = async () => [];
  stop = f.mount();
  assert.equal(f.state.LoadError, false);
  assert.equal(f.state.Pro, null);
  f.listeners[1].callback(false);
  await tick();
  assert.equal(f.state.XpInfo.xp, 85);
  assert.equal(f.state.Diagnostics[0].readiness, 10);
  assert.equal(f.state.Stats.accuracy, null);
  assert.deepEqual(f.xpLoads, [85]);
  assert.equal(f.state.Pro, false);
  f.listeners[1].callback(true);
  assert.equal(f.state.Pro, true);
  f.listeners[1].error(Error('permission-denied'));
  assert.equal(f.state.LoadError, true);
  assert.equal(f.state.Pro, null);
  assert.deepEqual(f.xpLoads, [85]);
  stop();
  assert.ok(f.listeners.every((listener) => listener.stopped));
});

test('unmounted progress ignores delayed reads and snapshot callbacks', async () => {
  const pending = deferred();
  const f = fixture({ getAttempts: () => pending.promise });
  const stop = f.mount();
  stop();
  const before = { ...f.state };
  f.listeners[0].callback(true);
  f.listeners[0].error(Error('late listener error'));
  pending.resolve([]);
  await tick();
  assert.deepEqual(f.state, before);
  assert.deepEqual(f.xpLoads, []);
  assert.equal(f.listeners[0].stopped, true);
});

test('a direct child switch replaces the full screen identity, including an open mock and filter', () => {
  const boundarySource = source.slice(source.indexOf('export default function Progress(') + 'export default '.length,
    source.indexOf('\nfunction ProgressAccount('));
  const auth = { currentUser: { uid: 'first-child' } };
  const onTrainTopic = () => {};
  const context = vm.createContext({ React, auth, ProgressAccount: function ProgressAccount() {} });
  const renderBoundary = vm.runInContext(`(${boundarySource})`, context);
  const first = renderBoundary({ onTrainTopic });
  assert.equal(first.props.uid, 'first-child');
  // All review/filter state lives inside the keyed component. React must
  // replace that component on a key change, even while its review is open.
  const accountSource = source.slice(source.indexOf('\nfunction ProgressAccount('));
  assert.match(accountSource, /const \[open, setOpen\] = useState\(null\)/);
  assert.match(accountSource, /const \[q, setQ\] = useState\(null\)/);
  assert.match(accountSource, /const \[onlyErrors, setOnlyErrors\] = useState\(false\)/);
  auth.currentUser = { uid: 'second-child' };
  const second = renderBoundary({ onTrainTopic });
  assert.equal(second.type, first.type);
  assert.notEqual(second.key, first.key);
  assert.equal(second.props.uid, 'second-child');
  assert.equal(second.props.onTrainTopic, onTrainTopic);
  auth.currentUser = null;
  const signedOut = renderBoundary({ onTrainTopic });
  assert.notEqual(signedOut.key, second.key);
  assert.equal(signedOut.props.uid, null);
});

test('auth switching blocks old history, XP and Pro writes even before effect cleanup', async () => {
  const pending = deferred();
  const f = fixture({ getAttempts: () => pending.promise });
  const stop = f.mount();
  f.context.auth.currentUser = { uid: 'second-child' };
  const before = { ...f.state };
  f.listeners[0].callback(true);
  f.listeners[0].error(Error('old entitlement failure'));
  pending.resolve([{ topic: 'topic', correct: false, verified: true, at: { seconds: 100 } }]);
  await tick();
  assert.deepEqual(f.state, before);
  assert.deepEqual(f.xpLoads, []);
  assert.equal(f.state.Mocks, undefined);
  assert.equal(f.state.Stats, undefined);
  stop();
});

test('progress error and loading guards precede all analytics rendering', () => {
  assert.ok(source.indexOf('if (loadError)') < source.indexOf('if (open) return'));
  assert.ok(source.includes('if (loading || !stats || pro === null)'));
  assert.ok(source.includes('setLoadRetry((value) => value + 1)'));
  assert.equal(source.includes('.catch(() => [])'), false);
});
