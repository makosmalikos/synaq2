import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as model from '../frontend/src/curriculumProgress.js';
import { CURRICULUM } from '../frontend/src/curriculumData.js';

const source = fs.readFileSync(new URL('../frontend/src/useCurriculumProgress.js', import.meta.url), 'utf8')
  .replace(/import[\s\S]*?from '[^']+';\n/g, '').replace('export function useCurriculumProgress', 'function useCurriculumProgress');
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
function fixture({ storage, read } = {}) {
  const states = [], effects = [], refs = [], scheduled = [], writes = [], callbacks = new Map();
  let cursor = 0, refCursor = 0, effectCursor = 0, readImpl = read || (async () => ({ docs: [] }));
  const data = new Map();
  const context = { ...model, CURRICULUM, setTimeout, clearTimeout, db: {}, auth: { currentUser: { uid: 'kid' } },
    localStorage: storage || { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) },
    window: { addEventListener: (key, fn) => callbacks.set(key, fn), removeEventListener: (key, fn) => { if (callbacks.get(key) === fn) callbacks.delete(key); } },
    collection: (_db, ...path) => path.join('/'), doc: (_db, ...path) => path.join('/'),
    getDocsFromServer: path => readImpl(path), getAttempts: async () => [],
    runTransaction: async (_db, run) => run({ get: async () => ({ exists: () => false }), set: (path, value) => writes.push({ path, value }) }),
    useState: initial => { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef: initial => refs[refCursor++] ||= { current: initial },
    useCallback: fn => fn, useMemo: fn => fn(),
    useEffect: (fn, deps) => { const i = effectCursor++, previous = effects[i]; if (!previous || deps.some((value, n) => value !== previous.deps[n])) { scheduled.push(() => { previous?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; }); } },
  };
  vm.createContext(context); vm.runInContext(source, context);
  return { context, writes, read: fn => { readImpl = fn; }, render(uid = context.auth.currentUser.uid) {
    cursor = refCursor = effectCursor = 0;
    const result = context.useCurriculumProgress(uid, 3, 'pro', { attempts: [], historyStatus: 'ready' });
    while (scheduled.length) scheduled.shift()();
    return result;
  }, cleanup() { for (const effect of effects) effect.cleanup?.(); } };
}

test('retry preserves the only in-memory reading copy when storage and cloud are initially unavailable', async () => {
  const f = fixture({ storage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } }, read: async () => { throw Error('offline'); } });
  f.render(); await tick();
  let result = f.render(); assert.equal(result.syncStatus, 'local');
  result.updateTheory(CURRICULUM[3][0], { step: 'intro', advance: true, now: 1 });
  result = f.render(); assert.equal(result.theory.lessons['g3-review-1'].lastStep, 0);
  f.read(async () => ({ docs: [] })); result.retry(); await tick();
  result = f.render();
  assert.equal(result.theory.lessons['g3-review-1'].lastStep, 0);
  assert.equal(result.syncStatus, 'synced');
  assert.equal(f.writes.length, 1);
  assert.deepEqual([...f.writes[0].value.completedSteps], ['intro']);
  f.cleanup();
});

test('late cloud reads from the previous UID cannot populate or write the next account', async () => {
  const wait = deferred();
  const f = fixture({ read: path => path.includes('/kid/') ? wait.promise : Promise.resolve({ docs: [] }) });
  f.render(); f.context.auth.currentUser = { uid: 'other' }; f.render(); await tick();
  wait.resolve({ docs: [{ id: 'g3-review-1', data: () => ({ lastStep: 'summary', completedSteps: ['intro', 0, 1, 2, 3], checkPassed: true, studiedAt: 1, updatedAt: 2 }) }] });
  await tick(); const result = f.render();
  assert.equal(result.theory.uid, 'other');
  assert.deepEqual(Object.keys(result.theory.lessons), []);
  assert.equal(f.writes.length, 0);
  f.cleanup();
});

test('supplied history skips the additional 500-attempt query', async () => {
  const f = fixture(); let calls = 0;
  f.context.getAttempts = async () => { calls++; return []; };
  f.render(); await tick(); f.render();
  assert.equal(calls, 0);
  f.cleanup();
});

test('requested lesson waits for practice recovery and cloud reading, then opens only once', () => {
  const curriculum = fs.readFileSync(new URL('../frontend/src/Curriculum.jsx', import.meta.url), 'utf8');
  const start = curriculum.indexOf(' useEffect(()=>{\n   if(!ready||session||recoveryError||progress.syncStatus');
  const effect = curriculum.slice(start, curriculum.indexOf(' const theoryStorageText=', start));
  const opened = [], consumed = [];
  const context = { uid: 'kid', ready: true, session: { pendingSave: {} }, recoveryError: false, initialTopicKey: 'g3-review-1', grade: 3,
    progress: { syncStatus: 'synced' }, requestedTopicRef: { current: null }, gradeTopics: CURRICULUM[3],
    useEffect: fn => fn(), openTopic: topic => opened.push(topic.key), onTopicOpened: key => consumed.push(key) };
  vm.createContext(context);
  vm.runInContext(effect, context); assert.equal(opened.length, 0);
  context.session = null; context.progress.syncStatus = 'loading';
  vm.runInContext(effect, context); assert.equal(opened.length, 0);
  context.progress.syncStatus = 'synced';
  vm.runInContext(effect, context); vm.runInContext(effect, context);
  assert.deepEqual(opened, ['g3-review-1']); assert.deepEqual(consumed, ['g3-review-1']);
});
