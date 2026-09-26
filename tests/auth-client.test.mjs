import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../frontend/src/Auth.jsx', import.meta.url), 'utf8');
const handlers = source.slice(source.indexOf('  const requestPending ='), source.indexOf('  const submitChild ='));

function authHarness() {
  const writes = [];
  let effect;
  const context = {
    useRef: (current) => ({ current }),
    useEffect: (callback) => { effect = callback; },
    setErr: (value) => writes.push(['error', value]),
    setInfo: (value) => writes.push(['info', value]),
    setBusy: (value) => writes.push(['busy', value]),
    errText: (error, lang) => `${lang}:${error.message}`,
    lang: 'ru',
  };
  const result = vm.runInNewContext(`${handlers}\n({ run, mountedRef, requestPending })`, context);
  const cleanup = effect();
  return { ...result, writes, cleanup, mount: () => effect() };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('auth blocks same-render double submit across different actions and unlocks after success', async () => {
  const auth = authHarness();
  const request = deferred();
  let calls = 0;
  const submit = auth.run(() => { calls++; return request.promise; });
  const first = submit();
  await submit();
  await auth.run(() => { calls++; })();
  assert.equal(calls, 1);
  assert.deepEqual(auth.writes, [['error', ''], ['info', ''], ['busy', true]]);
  request.resolve();
  await first;
  assert.deepEqual(auth.writes.at(-1), ['busy', false]);
  await auth.run(() => { calls++; })();
  assert.equal(calls, 2);
});

test('auth formats failures and permits retry, including synchronous failures', async () => {
  const auth = authHarness();
  await auth.run(() => { throw Error('invalid'); }, (error) => `child:${error.message}`)();
  assert.deepEqual(auth.writes.slice(-2), [['error', 'child:invalid'], ['busy', false]]);
  await auth.run(() => Promise.reject(Error('offline')))();
  assert.deepEqual(auth.writes.slice(-2), [['error', 'ru:offline'], ['busy', false]]);
  let retried = false;
  await auth.run(() => { retried = true; })();
  assert.equal(retried, true);
});

test('auth ignores late errors and cannot start another request after unmount', async () => {
  const auth = authHarness();
  const request = deferred();
  let formats = 0;
  const pending = auth.run(() => request.promise, () => { formats++; return 'late'; })();
  auth.cleanup();
  const before = auth.writes.slice();
  request.reject(Error('offline'));
  await pending;
  await auth.run(() => { throw Error('must not run'); })();
  assert.deepEqual(auth.writes, before);
  assert.equal(formats, 0);
  assert.equal(auth.requestPending.current, false);
});

test('auth ignores late success and restores mounted state after a StrictMode effect replay', async () => {
  const auth = authHarness();
  const request = deferred();
  const pending = auth.run(() => request.promise)();
  auth.cleanup();
  const before = auth.writes.slice();
  request.resolve();
  await pending;
  assert.deepEqual(auth.writes, before);
  const cleanup = auth.mount();
  let calls = 0;
  await auth.run(() => { calls++; })();
  assert.equal(calls, 1);
  assert.deepEqual(auth.writes.at(-1), ['busy', false]);
  cleanup();
  assert.equal(auth.mountedRef.current, false);
});

test('password reset confirmation does not write state after unmount', async () => {
  const start = source.indexOf('async () => {', source.indexOf("t('auth.login')"));
  const end = source.indexOf('\n              })}', start);
  assert.ok(start > 0 && end > start);
  const request = deferred();
  const mountedRef = { current: true };
  const messages = [];
  const reset = vm.runInNewContext(`(${source.slice(start, end)}\n})`, {
    resetParentPassword: () => request.promise,
    email: 'demo@example.test',
    mountedRef,
    setInfo: (value) => messages.push(value),
    t: (key) => key,
  });
  const pending = reset();
  mountedRef.current = false;
  request.resolve();
  await pending;
  assert.deepEqual(messages, []);
});
