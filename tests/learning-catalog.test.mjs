import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { topics as BASE_TOPICS } from '../frontend/src/data.js';
import { POOL, EXTRA_TOPICS, ensureBankReady } from '../frontend/src/bank.js';
import * as apiModule from '../frontend/src/api.js';
import * as analytics from '../frontend/src/analytics.js';
import { STATIC_TOPICS, STATIC_BANK_IDS } from '../frontend/src/topicCatalog.generated.js';
import { loadTopicCatalog, topicsWithAdminTasks } from '../frontend/src/topicCatalog.js';
import { addQuestionsToTopics } from '../frontend/src/topicSummary.js';
import { isCorrect, isGradable } from '../frontend/src/grading.js';
import { buildDiagnosis } from '../frontend/src/diagnosis.js';
import { checkTopicCatalog, topicCatalogSource } from '../scripts/generate-topic-catalog.mjs';

await ensureBankReady(async () => []);

test('generated catalog reproduces the real bank and the existing topics API without question content', async () => {
  assert.equal(checkTopicCatalog(), true);
  assert.deepEqual(STATIC_BANK_IDS, POOL.map((question) => question.id));
  assert.equal(STATIC_TOPICS.reduce((sum, topic) => sum + topic.count, 0), POOL.length);
  assert.deepEqual(await loadTopicCatalog(async () => []), await apiModule.api.topics());
  assert.equal(topicCatalogSource().includes(POOL[0].statement), false);
  for (const topic of STATIC_TOPICS) assert.deepEqual(Object.keys(topic).filter((key) => ['statement', 'answer', 'solution', 'image'].includes(key)), []);
});

test('lightweight catalog and full bank share admin normalization, deduplication and quarantine', async () => {
  const tasks = [
    { id: 'catalog-admin-1', topic: 'eq', subject: 'logic', school: 'БИЛ', statement: '2 + 2?', answer: '4' },
    { id: 'catalog-admin-1', topic: 'eq', school: 'НИШ', statement: 'Duplicate', answer: '4' },
    { id: POOL[0].id, topic: 'num', statement: 'Static ID collision', answer: '1' },
    { id: 'catalog-missing-answer', topic: 'eq', statement: '?' },
    { id: 'catalog-bad-options', topic: 'eq', statement: '?', answer: '4', options: ['1', '2'] },
    { id: 'catalog-missing-figure', topic: 'eq', statement: '?', answer: '4', image: '/figures/logic66.png' },
    { id: 'catalog-placeholder', topic: 'eq', school: 'БИЛ', statement: '?', answer: '—' },
    { id: 'catalog-custom-topic', topic: 'custom_admin_topic', school: 'НИШ', statement: '?', answer: '1' },
  ];
  const fullBank = await import('../frontend/src/bank.js?catalog-admin-test');
  await fullBank.ensureBankReady(async () => tasks);
  const actual = await loadTopicCatalog(async () => tasks);
  assert.deepEqual(actual, addQuestionsToTopics([...BASE_TOPICS, ...EXTRA_TOPICS], fullBank.POOL).filter((topic) => topic.count));
  const eq = actual.find((topic) => topic.id === 'eq');
  const original = STATIC_TOPICS.find((topic) => topic.id === 'eq');
  assert.equal(eq.count, original.count + 2);
  assert.equal(eq.gradableCount, original.gradableCount + 1);
  assert.equal(actual.find((topic) => topic.id === 'custom_admin_topic').count, 1);
  assert.deepEqual(topicsWithAdminTasks(tasks), actual, 'summaries never accumulate duplicate loads');
  assert.equal(STATIC_TOPICS.find((topic) => topic.id === 'eq').count, original.count, 'static input remains untouched');
});

test('catalog read failures retain the offline baseline and allow retry', async () => {
  let calls = 0;
  const reader = async () => { if (++calls === 1) throw new Error('offline'); return [{ id: 'retry-task', topic: 'eq', statement: '?', answer: '1' }]; };
  const fallback = await loadTopicCatalog(reader);
  const retried = await loadTopicCatalog(reader);
  assert.deepEqual(fallback, topicsWithAdminTasks());
  assert.equal(retried.find((topic) => topic.id === 'eq').count, fallback.find((topic) => topic.id === 'eq').count + 1);
});

test('grading and analytics re-exports retain the original contracts and history ordering', () => {
  for (const name of ['topicStats', 'readiness', 'weekHours', 'mockSeries']) assert.equal(apiModule[name], analytics[name]);
  assert.equal(apiModule.isCorrect, isCorrect); assert.equal(apiModule.isGradable, isGradable);
  assert.equal(isCorrect('12,50', { answer: '12.5' }), true);
  assert.equal(isCorrect('100см', { answer: '100км' }), false);
  const attempts = [{ topic: 'eq', correct: true, at: { seconds: 100000 }, secs: 10 }, { topic: 'eq', correct: false, at: { seconds: 100000 }, secs: 20 }];
  assert.deepEqual(analytics.topicStats(attempts, STATIC_TOPICS), [{ id: 'eq', name: BASE_TOPICS[0].name, block: 'math', tried: 2, pct: 50, level: 'mid', days: 1 }]);
  assert.equal(analytics.readiness(analytics.topicStats(attempts, STATIC_TOPICS)), 50);
  const mocks = [{ at: { seconds: 2 }, score: 2, gradable: 30, school: 'РФМШ' }, { at: { seconds: 1 }, score: 1, gradable: 60, school: 'БИЛ' }];
  assert.deepEqual(analytics.mockSeries(mocks).map((item) => item.score), [1, 2]);
  assert.equal(mocks[0].score, 2, 'saved history is not sorted in place');
});

test('diagnosis uses live gradable counts and supports historical name-only callers', () => {
  const review = [{ topic: 'eq', answer: '4', your: '3', correct: false }];
  assert.equal(buildDiagnosis(review, [{ id: 'eq', name: 'Equations', gradableCount: 7 }]).topics[0].taskCount, 7);
  assert.equal(buildDiagnosis(review, [{ id: 'eq', name: 'Equations' }]).topics[0].taskCount, STATIC_TOPICS.find((topic) => topic.id === 'eq').gradableCount);
  assert.equal(buildDiagnosis(review, [{ id: 'eq', name: 'Equations', gradableCount: 0 }]).topics[0].taskCount, 0);
});

function staticDependencies(entry, seen = new Set()) {
  const full = path.resolve(entry);
  if (seen.has(full)) return seen;
  seen.add(full);
  const source = fs.readFileSync(full, 'utf8');
  for (const match of source.matchAll(/^\s*(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/gm)) {
    if (match[1].startsWith('.')) staticDependencies(path.resolve(path.dirname(full), match[1]), seen);
  }
  return seen;
}

test('student screens that only need public questions cannot import the full bank or legacy training API', () => {
  const sourceRoot = fileURLToPath(new URL('../frontend/src/', import.meta.url));
  for (const screen of ['Parent.jsx', 'Progress.jsx', 'components/Training.jsx', 'components/Mock.jsx', 'topicCatalog.js', 'diagnosis.js']) {
    const deps = [...staticDependencies(path.join(sourceRoot, screen))];
    for (const banned of ['bank.js', 'data.js', 'api.js']) assert.equal(deps.includes(path.join(sourceRoot, banned)), false, `${screen} must not eagerly load ${banned}`);
  }
  const diagnosticDeps = [...staticDependencies(path.join(sourceRoot, 'components/PlatformDiagnostic.jsx'))];
  for (const banned of ['bank.js', 'data.js', 'api.js', 'curriculumData.js']) {
    assert.equal(diagnosticDeps.includes(path.join(sourceRoot, banned)), false, `PlatformDiagnostic.jsx must not eagerly load ${banned}`);
  }
  assert.equal(staticDependencies(path.join(sourceRoot, 'api.js')).has(path.join(sourceRoot, 'bank.js')), true, 'the deprecated adapter remains isolated from production screens');
});

test('the shared lazy admin reader caches parallel calls and retries rejected reads', async () => {
  const source = fs.readFileSync(new URL('../frontend/src/adminTasks.js', import.meta.url), 'utf8')
    .replace('export function', 'function').replace("import('./firebase.js')", 'loadFirebase()').replace("import('firebase/firestore')", 'loadFirestore()');
  let reads = 0;
  const context = {
    loadFirebase: async () => ({ db: {} }),
    loadFirestore: async () => ({ collection: () => 'bankTasks', getDocs: async () => {
      reads++;
      if (reads === 1) throw new Error('offline');
      return { docs: [{ id: 'admin-id', data: () => ({ id: 'ignored-body-id', topic: 'eq' }) }] };
    } }),
  };
  vm.createContext(context); vm.runInContext(source, context);
  const first = context.readAdminTasks(), second = context.readAdminTasks();
  assert.equal(first, second);
  await assert.rejects(first, /offline/);
  const retried = await context.readAdminTasks();
  assert.equal(reads, 2); assert.equal(retried[0].id, 'admin-id');
  assert.equal(await context.readAdminTasks(), retried);
  assert.equal(reads, 2);
});
