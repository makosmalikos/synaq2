import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../frontend/src/PlatformApp.jsx', import.meta.url), 'utf8');
function extractEffect(marker, dependencies) {
  const start = source.indexOf(`useEffect(() => {\n    ${marker}`);
  const end = source.indexOf(`  }, [${dependencies}]);`, start);
  assert.ok(start >= 0 && end > start);
  return source.slice(start + 'useEffect('.length, end + '  }'.length);
}
const familyEffect = extractEffect('if (!user || isKid(user) || adminUser !== false) return;', 'user, adminUser, familyRetry');
const profileEffect = extractEffect('setProfileError(false);', 'user');
const trainingXpCallback = source.match(/onXp=\{(\(gain, totalXp\) =>[^\n]+)\}/)?.[1];
assert.ok(trainingXpCallback);
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const isKid = (user) => user?.kind === 'kid';

function familyHarness() {
  let state;
  const requests = [];
  const context = vm.createContext({
    isKid, console: { error() {} },
    setFamilyState: (value) => { state = { ...value }; },
    ensureFamilyProfile: (user) => {
      const request = deferred();
      requests.push({ uid: user.uid, ...request });
      return request.promise;
    },
  });
  const mount = vm.runInContext(`(user, adminUser = false) => (${familyEffect})()`, context);
  return { mount, requests, state: () => state };
}

test('family gate ignores a previous parent request after the authenticated uid changes', async () => {
  const f = familyHarness();
  const stopFirst = f.mount({ uid: 'parent-first' });
  assert.deepEqual(f.state(), { uid: 'parent-first', status: 'loading' });
  stopFirst();
  const stopSecond = f.mount({ uid: 'parent-second' });
  f.requests[0].resolve();
  await tick();
  assert.deepEqual(f.state(), { uid: 'parent-second', status: 'loading' });
  f.requests[1].resolve();
  await tick();
  assert.deepEqual(f.state(), { uid: 'parent-second', status: 'ready' });
  stopSecond();
  assert.ok(source.includes("familyState?.uid !== user.uid || familyState.status === 'loading'"));
});

test('family initialization failure can retry without recreating the Auth account', async () => {
  const f = familyHarness();
  let stop = f.mount({ uid: 'parent' });
  f.requests[0].reject(Error('offline'));
  await tick();
  assert.deepEqual(f.state(), { uid: 'parent', status: 'error' });
  stop();
  stop = f.mount({ uid: 'parent' });
  assert.deepEqual(f.state(), { uid: 'parent', status: 'loading' });
  f.requests[1].resolve();
  await tick();
  assert.deepEqual(f.state(), { uid: 'parent', status: 'ready' });
  assert.ok(source.includes('setFamilyRetry((value) => value + 1)'));
  stop();
});

test('family gate skips children, admins and unverified roles, and ignores late failures after logout', async () => {
  const f = familyHarness();
  for (const [user, role] of [[null, false], [{ uid: 'kid', kind: 'kid' }, false], [{ uid: 'admin' }, true], [{ uid: 'checking' }, null]]) {
    assert.equal(f.mount(user, role), undefined);
  }
  assert.equal(f.requests.length, 0);
  const stop = f.mount({ uid: 'parent' });
  const before = f.state();
  stop();
  f.requests[0].reject(Error('late failure'));
  await tick();
  assert.deepEqual(f.state(), before);
});

function profileHarness() {
  const state = { xp: 0, profile: null, error: false };
  const requests = [], listeners = [];
  const context = vm.createContext({
    isKid, console: { error() {} },
    setProfileError: (value) => { state.error = value; },
    setProfile: (value) => { state.profile = value; },
    setXp: (value) => { state.xp = typeof value === 'function' ? value(state.xp) : value; },
    watchMyProfile: (callback, error) => {
      const listener = { callback, error, stopped: false };
      listeners.push(listener);
      return () => { listener.stopped = true; };
    },
    getXpSummary: (uid) => {
      const request = deferred();
      requests.push({ uid, ...request });
      return request.promise;
    },
  });
  const mount = vm.runInContext(`(user) => (${profileEffect})()`, context);
  const onTrainingXp = vm.runInContext(`(${trainingXpCallback})`, context);
  return { mount, onTrainingXp, state, requests, listeners };
}

test('late initial XP loading cannot lower a confirmed training total or duplicate a replay award', async () => {
  const f = profileHarness();
  const stop = f.mount({ uid: 'kid', kind: 'kid' });
  f.onTrainingXp(105, 205);
  assert.equal(f.state.xp, 205);
  f.requests[0].resolve({ xp: 100 });
  await tick();
  assert.equal(f.state.xp, 205);
  f.onTrainingXp(0, 205);
  assert.equal(f.state.xp, 205);
  f.onTrainingXp(0, 100);
  assert.equal(f.state.xp, 205);
  stop();
});

test('a slow Progress read cannot overwrite a newer confirmed training XP total', () => {
  const start = source.indexOf('  const mergeXp = useCallback(');
  const end = source.indexOf('  }, []);', start) + '  }, []);'.length;
  assert.ok(start > 0 && end > start);
  let xp = 100;
  let dependencies;
  const context = vm.createContext({
    setXp: (value) => { xp = typeof value === 'function' ? value(xp) : value; },
    useCallback: (callback, deps) => { dependencies = [...deps]; return callback; },
  });
  const mergeXp = vm.runInContext(`${source.slice(start, end)}\nmergeXp`, context);
  const onTrainingXp = vm.runInContext(`(${trainingXpCallback})`, context);
  const previousProgressTotal = 100;
  onTrainingXp(105, 205);
  mergeXp(previousProgressTotal);
  assert.equal(xp, 205);
  mergeXp(220);
  assert.equal(xp, 220);
  for (const invalid of [undefined, NaN, Infinity, 'invalid']) mergeXp(invalid);
  assert.equal(xp, 220);
  assert.deepEqual(dependencies, [], 'Progress load effect requires a stable callback');
  assert.ok(source.includes('<Progress onXpLoad={mergeXp}'));
});

test('profile and XP callbacks from a previous child cannot replace the new child state', async () => {
  const f = profileHarness();
  const stopFirst = f.mount({ uid: 'kid-first', kind: 'kid' });
  f.listeners[0].callback({ name: 'First' });
  f.onTrainingXp(5, 1005);
  stopFirst();
  const stopSecond = f.mount({ uid: 'kid-second', kind: 'kid' });
  assert.equal(f.state.xp, 0);
  f.listeners[1].callback({ name: 'Second' });
  f.requests[1].resolve({ xp: 20 });
  await tick();
  f.listeners[0].callback({ name: 'Stale First' });
  f.listeners[0].error(Error('stale failure'));
  f.requests[0].resolve({ xp: 1000 });
  await tick();
  assert.equal(f.state.profile.name, 'Second');
  assert.equal(f.state.xp, 20);
  assert.equal(f.state.error, false);
  stopSecond();
  assert.ok(f.listeners.every((listener) => listener.stopped));
});
