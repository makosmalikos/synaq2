import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../frontend/src/components/Mock.jsx', import.meta.url), 'utf8');
const end = source.indexOf('  }, [uid, loadRetry]);');
const start = source.lastIndexOf('  useEffect(() => {', end);
const effect = source.slice(start, end + '  }, [uid, loadRetry]);'.length);

for (const access of [true, false]) test(`catalog loads with access=${access} without client Firestore permissions`, async () => {
  const state = {};
  let cleanup;
  const weekly = { access, pro: access };
  vm.runInNewContext(effect, {
    uid: 'student', loadRetry: 0, isCurrent: () => true,
    useEffect: fn => { cleanup = fn(); },
    mockCatalog: async () => ({ weekly, schools: ['НИШ'], previews: ['БИЛ'] }),
    loadTopicCatalog: async () => ['math'],
    setLoading: value => { state.loading = value; },
    setLoadError: value => { state.error = value; },
    setWeekly: value => { state.weekly = value; },
    setSchools: value => { state.schools = value; },
    setPreviews: value => { state.previews = value; },
    setTopics: value => { state.topics = value; },
    watchPro: () => { throw Error('permission-denied'); },
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(state.loading, false);
  assert.equal(state.error, false);
  assert.equal(state.weekly.access, access);
  assert.deepEqual(state.schools, ['НИШ']);
  cleanup();
});
