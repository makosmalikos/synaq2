import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { readWithDeadline } from '../frontend/src/readDeadline.js';
const source = fs.readFileSync(new URL('../frontend/src/Parent.jsx', import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

function familyFixture() {
  const state = {}, timers = new Map();
  let next = 0, callback, failure, cleanup;
  const context = { auth: { currentUser: { uid: 'parent', displayName: 'Parent' } }, text: ru => ru,
    setMe() {}, setFamilyError: value => { state.error = value; }, setPlan: value => { state.plan = value; }, setBillingStatus() {},
    wantedHandled: { current: true }, paymentPending: false, lang: 'ru', familyRetry: 0,
    window: { location: { search: '' } }, URLSearchParams, console: { error() {} },
    familyPlan: () => 'pro', doc: () => ({}), db: {},
    setTimeout: (fn, ms) => { timers.set(++next, { fn, ms }); return next; }, clearTimeout: id => timers.delete(id),
    onSnapshot: (_, fn, error) => { callback = fn; failure = error; return () => { state.unsubscribed = true; }; },
    useEffect: effect => { cleanup = effect(); },
  };
  vm.createContext(context);
  const start = source.indexOf('  // Observe webhook updates after checkout');
  const end = source.indexOf('  }, [lang, familyRetry]);', start) + '  }, [lang, familyRetry]);'.length;
  vm.runInContext(source.slice(start, end), context);
  return { state, context, timers, stop: () => cleanup(), emit: () => callback({ exists: () => true, data: () => ({}) }), fail: () => failure(Error('offline')) };
}
test('parent subscription shows a retryable error when its first snapshot never arrives, then recovers', () => {
  const f = familyFixture();
  const first = [...f.timers.values()][0];
  assert.equal(first.ms, 15000);
  first.fn();
  assert.equal(f.state.plan, null);
  assert.match(f.state.error, /слишком долго/);
  f.emit();
  assert.equal(f.state.plan, 'pro');
  assert.equal(f.state.error, '');
  f.stop();
  assert.equal(f.timers.size, 0);
});
test('subscription cleanup and logout prevent late callbacks from changing parent data', () => {
  for (const logout of [false, true]) {
    const f = familyFixture();
    if (logout) f.context.auth.currentUser = null;
    else f.stop();
    f.emit(); f.fail();
    assert.equal(f.state.plan, undefined);
    assert.equal(f.state.error, '');
    f.stop();
    assert.equal(f.timers.size, 0);
  }
});
function childFixture(read) {
  const state = {};
  const context = { auth: { currentUser: { uid: 'parent' } }, mounted: { current: true }, childrenRequest: { current: 0 }, childrenAbort: { current: null }, AbortController,
    readWithDeadline: (fn, options) => readWithDeadline(fn, { ...options, timeoutMs: 5 }),
    getChildren: read, setChildrenError: value => { state.error = value; }, setChildren: value => { state.children = value; }, setChildrenLoaded: value => { state.loaded = value; }, console: { error() {} } };
  vm.createContext(context);
  const start = source.indexOf('  const load = async () => {');
  const end = source.indexOf('  useEffect(() => {\n    mounted.current = true;', start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end) + '\n globalThis.loadChildren = load;', context);
  return { context, state };
}
test('a stalled child list fails visibly and can retry without claiming the family has no child', async () => {
  let resolve;
  const f = childFixture(() => new Promise(yes => { resolve = yes; }));
  await f.context.loadChildren();
  assert.equal(f.state.error, true);
  assert.equal(f.state.loaded, undefined);
  resolve([{ uid: 'late' }]); await flush();
  assert.equal(f.state.children, undefined);
  f.context.getChildren = async () => [{ uid: 'child' }];
  await f.context.loadChildren();
  assert.equal(f.state.error, false);
  assert.equal(f.state.loaded, true);
  assert.equal(f.state.children[0].uid, 'child');
});
test('a newer child-list load cancels the previous wait and rejects stale data', async () => {
  let resolve;
  const f = childFixture(() => new Promise(yes => { resolve = yes; }));
  const first = f.context.loadChildren(); await flush();
  f.context.getChildren = async () => [{ uid: 'current-child' }];
  await f.context.loadChildren(); await first;
  resolve([{ uid: 'stale-child' }]); await flush();
  assert.equal(f.state.children[0].uid, 'current-child');
  assert.equal(f.state.error, false);
});
