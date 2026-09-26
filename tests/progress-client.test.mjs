import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

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
    getAttempts: async () => [{ qid: 'q1', correct: true }],
    getMocks: async () => [{ score: 10 }],
    getXpSummary: async () => ({ xp: 85, studySecs: 500 }),
    loadTopicCatalog: async () => [{ id: 'topic' }],
    topicStats: () => [{ id: 'topic', pct: 100 }], weekHours: () => [{ hours: 1 }],
    onXpLoad: (xp) => xpLoads.push(xp),
    watchPro(uid, callback, error) {
      assert.equal(uid, 'kid');
      const listener = { callback, error, stopped: false };
      listeners.push(listener);
      return () => { listener.stopped = true; };
    },
    ...overrides,
  };
  for (const name of ['Loading', 'LoadError', 'Pro', 'Topics', 'Stats', 'Week', 'Mocks', 'XpInfo']) {
    context[`set${name}`] = (value) => { state[name] = value; };
  }
  vm.createContext(context);
  const mount = () => vm.runInContext(`(${effect})()`, context);
  return { state, xpLoads, listeners, context, mount };
}

test('failed progress reads never replace existing XP or progress with fake zeros', async () => {
  for (const helper of ['getAttempts', 'getMocks', 'getXpSummary']) {
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

test('progress error and loading guards precede all analytics rendering', () => {
  assert.ok(source.indexOf('if (loadError)') < source.indexOf('if (open)'));
  assert.ok(source.includes('if (loading || !stats || pro === null)'));
  assert.ok(source.includes('setLoadRetry((value) => value + 1)'));
  assert.equal(source.includes('.catch(() => [])'), false);
});
