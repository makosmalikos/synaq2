import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../frontend/src/ParentCenterHome.jsx', import.meta.url), 'utf8');
const start = source.indexOf('  useEffect(() => {');
const end = source.indexOf('  }, [ids, revision, onAvailability]);', start);
const effect = source.slice(start + '  useEffect('.length, end + '  }'.length);
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness() {
  let state = { ids: '', results: [], loading: true }, selected = '', available = false;
  const requests = [];
  const context = vm.createContext({
    setState(value) { state = typeof value === 'function' ? value(state) : value; },
    setSelected(value) { selected = typeof value === 'function' ? value(selected) : value; },
    onAvailability(value) { available = value; },
    centerCall({ childUid }) { return new Promise((resolve, reject) => requests.push({ childUid, resolve, reject })); },
  });
  const mount = vm.runInContext(`ids => (${effect})()`, context);
  return { mount, requests, state: () => state, selected: () => selected, available: () => available };
}
const connected = name => ({ enrollment: { centerName: name }, students: [], assignments: [], schedule: [] });

test('a failed child request does not hide another child’s center', async () => {
  const f = harness(); f.mount('first|second');
  f.requests[0].reject(Error('offline'));
  f.requests[1].resolve(connected('Second Center'));
  await tick();
  assert.equal(f.available(), true);
  assert.equal(f.selected(), 'second');
  assert.equal(f.state().results[1].data.enrollment.centerName, 'Second Center');
  assert.equal(f.state().error.message, 'offline');
});

test('refresh keeps the current view mounted while loading and drops unavailable data afterwards', async () => {
  const f = harness(); const stop = f.mount('first');
  f.requests[0].resolve(connected('Center')); await tick(); stop();
  f.mount('first');
  assert.equal(f.state().loading, true);
  assert.equal(f.state().results[0].data.enrollment.centerName, 'Center');
  f.requests[1].reject(Error('not_child_owner')); await tick();
  assert.equal(f.state().loading, false);
  assert.equal(f.available(), false);
  assert.equal(f.state().results[0].data, null);
});

test('switching children clears the previous data and ignores late responses', async () => {
  const f = harness(); const stop = f.mount('old-child'); stop();
  f.mount('new-child');
  assert.equal(f.state().results.length, 0);
  f.requests[1].resolve(connected('New')); await tick();
  f.requests[0].resolve(connected('Old')); await tick();
  assert.equal(f.state().ids, 'new-child');
  assert.equal(f.state().results[0].data.enrollment.centerName, 'New');
});

const snapshotSource = fs.readFileSync(new URL('../frontend/src/useCenterSnapshot.js', import.meta.url), 'utf8');
const snapshotStart = snapshotSource.indexOf('  useEffect(() => {');
const snapshotEnd = snapshotSource.indexOf('  }, [childUid, membershipKey, revision]);', snapshotStart);
const snapshotEffect = snapshotSource.slice(snapshotStart + '  useEffect('.length, snapshotEnd + '  }'.length);
test('student refresh preserves layout, but group changes and permission failures clear old data', async () => {
  let state = { key: ':group-a', data: connected('A'), loading: false };
  const requests = [];
  const context = vm.createContext({
    childUid: undefined,
    setState(value) { state = typeof value === 'function' ? value(state) : value; },
    centerCall() { return new Promise((resolve, reject) => requests.push({ resolve, reject })); },
  });
  const mount = vm.runInContext(`requestKey => (${snapshotEffect})()`, context);
  const stop = mount(':group-a');
  assert.equal(state.data.enrollment.centerName, 'A');
  assert.equal(state.loading, true); stop();
  mount(':group-b');
  assert.equal(state.data, null);
  requests[0].resolve(connected('Stale A')); await tick();
  assert.equal(state.data, null);
  requests[1].reject(Error('not_allowed')); await tick();
  assert.equal(state.loading, false);
  assert.equal(state.data, null);
  assert.equal(state.error.message, 'not_allowed');
});
