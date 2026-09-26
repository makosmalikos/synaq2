import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

const source = fs.readFileSync(new URL('../frontend/src/Parent.jsx', import.meta.url), 'utf8');
const methods = source.slice(source.indexOf('  async function add()'), source.indexOf('  const [stats, setStats]'));
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture(overrides = {}) {
  const calls = [], state = {}, loads = [];
  let generated = 0;
  const context = {
    auth: { currentUser: { uid: 'parent' } }, crypto: { randomUUID },
    creating: { current: false }, pendingCreation: { current: null }, usernameEdited: { current: false }, mounted: { current: true },
    childrenLoaded: true, children: [], name: 'Ali', username: 'ali', pass: '', avatar: 'fox', lang: 'ru',
    cleanUsername: (value) => value.toLowerCase().replace(/[^a-z0-9]/g, ''), suggestUsername: () => 'ali123',
    genPassword: () => `password${++generated}`, text: (ru) => ru, errText: (error) => error.message,
    load: async () => { loads.push(true); },
    createChild: async (uid, request) => { calls.push({ uid, request: { ...request } }); },
    ...overrides,
  };
  for (const name of ['Err', 'Busy', 'Adding', 'Username', 'Pass', 'Avatar', 'Created', 'Name']) {
    context[`set${name}`] = (value) => { state[name] = value; context[name[0].toLowerCase() + name.slice(1)] = value; };
  }
  vm.createContext(context);
  vm.runInContext(methods, context);
  return { context, state, calls, loads, add: () => context.add(), name: (value) => context.changeName(value) };
}

test('name typing keeps automatic username in sync but preserves a manually chosen username', () => {
  const f = fixture({ name: '', username: '' });
  for (const value of ['A', 'Al', 'Ali']) f.name(value);
  assert.equal(f.context.username, 'ali');
  f.context.usernameEdited.current = true;
  f.context.username = 'chosen';
  f.name('Alina');
  assert.equal(f.context.username, 'chosen');
});

test('same-render create clicks produce only one request with credentials available before response', async () => {
  const pending = deferred(), sent = [];
  const f = fixture({ createChild: (uid, request) => { sent.push(request); return pending.promise; } });
  const first = f.add();
  await f.add();
  assert.equal(sent.length, 1);
  assert.equal(f.state.Pass, 'password1');
  assert.equal(f.state.Username, 'ali');
  assert.equal(sent[0].avatar, 'fox');
  assert.match(sent[0].requestId, /^[0-9a-f-]{36}$/);
  pending.resolve();
  await first;
  assert.equal(f.state.Created.pass, 'password1');
  assert.equal(f.context.pendingCreation.current, null);
  assert.equal(f.state.Busy, false);
});

test('ambiguous response refreshes children and reuses exact request/PIN even when child already exists', async () => {
  const sent = [];
  const f = fixture({ createChild: async (uid, request) => {
    sent.push(JSON.stringify(request));
    if (sent.length === 1) throw Error('lost_response');
  } });
  await f.add();
  assert.equal(f.state.Created, undefined);
  assert.equal(f.state.Pass, 'password1');
  assert.equal(f.loads.length, 1);
  f.context.children = [{ uid: 'created-child', code: 'ali' }];
  await f.add();
  assert.equal(sent.length, 2);
  assert.equal(sent[1], sent[0]);
  assert.equal(f.state.Created.pass, 'password1');
});

test('unmounted parent does not show delayed success; initial loading blocks submission', async () => {
  const pending = deferred();
  const f = fixture({ createChild: () => pending.promise });
  const result = f.add();
  f.context.mounted.current = false;
  const before = { ...f.state };
  pending.resolve();
  await result;
  assert.deepEqual(f.state, before);
  assert.equal(f.loads.length, 0);
  const unloaded = fixture({ childrenLoaded: false });
  await unloaded.add();
  assert.equal(unloaded.calls.length, 0);
  await tick();
});
