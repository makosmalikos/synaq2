import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { POOL, ensureBankReady, normalizeAdminTask } from '../frontend/src/bank.js';
import { api, MOCK_SPECS, mockAvailability, reviewQuestionIds, reviewVariantId } from '../frontend/src/api.js';
import { buildDiagnosis } from '../frontend/src/diagnosis.js';
import { CURRICULUM, createCurriculumQuestions, curriculumAnswersMatch } from '../frontend/src/curriculumData.js';

// Explicit stub of the only remote bank boundary; imports above perform no I/O.
await ensureBankReady(async () => []);

test('reviews retain question IDs and historical reviews have a safe fallback', async () => {
  const exam = await api.mockRandom('РФМШ');
  const result = await api.mockSubmit(exam.id, {});
  assert.deepEqual(api.reviewQuestionIds(result.review), exam.questions.map((q) => q.id));
  const old = result.review.map(({ qid, ...item }) => item);
  const expected = old.flatMap((item) => {
    const matches = POOL.filter((q) => q.statement === item.statement && String(q.answer) === String(item.answer));
    return matches.length === 1 ? [matches[0].id] : [];
  });
  assert.deepEqual(reviewQuestionIds(old), [...new Set(expected)]);
  assert.equal(reviewVariantId('БИЛ', []), null);
  assert.doesNotThrow(() => [{ review: old }].flatMap((item) => api.reviewQuestionIds(item.review)));
});

test('every generated exam describes its actual pool and flags shortened BIL', async () => {
  for (const school of Object.keys(MOCK_SPECS)) {
    const available = mockAvailability(school);
    const exam = await api.mockRandom(school);
    assert.equal(exam.questions.length, available.count);
    assert.equal(exam.sections, new Set(exam.questions.map((q) => q.section)).size);
    assert.equal(exam.shortened, exam.questions.length < MOCK_SPECS[school].count);
    assert.ok(exam.questions.every((q) => !Object.hasOwn(q, 'answer')));
    for (const section of available.subjects) {
      assert.equal(exam.questions.filter((q) => section.subject == null || q.subject === section.subject).length, section.count);
    }
  }
  assert.equal(mockAvailability('БИЛ').shortened, true);
  assert.equal(mockAvailability('БИЛ').count, 60);
});

test('new exam prefers questions not in saved review', async () => {
  const first = await api.mockRandom('РФМШ');
  const second = await api.mockRandom('РФМШ', { excludeQuestionIds: first.questions.map((q) => q.id) });
  const firstIds = new Set(first.questions.map((q) => q.id));
  assert.ok(second.questions.every((q) => !firstIds.has(q.id)));
  assert.notEqual(first.id, second.id);
});

test('admin subjects survive normalization and loading has an awaited barrier', async () => {
  assert.equal(normalizeAdminTask({ id: 'test', subject: 'logic', topic: 'num' }).subject, 'logic');
  const bank = await import('../frontend/src/bank.js?readiness-test');
  let finish;
  const loading = bank.ensureBankReady(() => new Promise((resolve) => { finish = resolve; }));
  assert.equal(bank.POOL.some((q) => q.id === 'test-admin-logic'), false);
  finish([{ id: 'test-admin-logic', school: 'БИЛ', subject: 'logic', topic: 'mtx', statement: '2 + 2?', answer: '4' }]);
  await loading;
  assert.equal(bank.POOL.find((q) => q.id === 'test-admin-logic').subject, 'logic');
});

test('readiness includes skipped answers and entirely skipped topics', () => {
  const review = Array.from({ length: 30 }, (_, i) => ({ topic: i < 15 ? 'num' : 'eq', answer: '1', your: i === 0 ? '1' : '', correct: i === 0 }));
  const result = buildDiagnosis(review, [{ id: 'num', name: 'Числа' }, { id: 'eq', name: 'Уравнения' }], 'ru');
  assert.equal(result.readiness, 3);
  assert.equal(result.topics.length, 2);
  assert.equal(result.topics.find((q) => q.id === 'eq').pct, 0);
  assert.ok(result.plan.some((item) => item.topicId === 'eq'));
});

test('diagnosis cards use total questions and distinguish wrong answers from skips in both languages', () => {
  const source = fs.readFileSync(new URL('../frontend/src/components/DiagnosisReport.jsx', import.meta.url), 'utf8');
  const helper = source.slice(source.indexOf('export function topicResultText'), source.indexOf('function TopicCard')).replace('export ', '');
  const format = vm.runInNewContext(`${helper}\ntopicResultText`);
  const review = Array.from({ length: 10 }, (_, index) => ({ topic: 'eq', num: index + 1, answer: '4', your: index === 0 ? '3' : '', correct: false }));
  const ru = buildDiagnosis(review, [{ id: 'eq', name: 'Уравнения' }], 'ru').topics[0];
  assert.equal(ru.graded, 1);
  assert.equal(format(ru, 'ru'), '0/10 верно · Ошибок: 1 · Пропущено: 9');
  assert.match(ru.explanation, /Из 10 задач верно 0 .*ошибок: 1, пропущено: 9/);
  const kk = buildDiagnosis(review, [{ id: 'eq', name: 'Теңдеулер' }], 'kk').topics[0];
  assert.equal(format(kk, 'kk'), '0/10 дұрыс · Қате: 1 · Өткізіп алынды: 9');
  assert.match(kk.explanation, /қате: 1, өткізіп алынды: 9/);
  const skipped = buildDiagnosis(review.map((item) => ({ ...item, your: '' })), [], 'ru').topics[0];
  assert.equal(format(skipped, 'ru'), '0/10 верно · Ошибок: 0 · Пропущено: 10');
  assert.equal(source.includes('topic.correct}/{topic.graded'), false);
  assert.match(source, /\{topicResultText\(topic, lang\)\}/);
});

test('inverse dependency accepts exact equivalent fractions', (t) => {
  const numbers = [0, .999, .3, .3, .1];
  t.mock.method(Math, 'random', () => numbers.shift() ?? .1);
  const topic = CURRICULUM[6].find((item) => item.kind === 'dependency');
  const q = createCurriculumQuestions(topic, 'easy', 1)[0];
  assert.equal(q.answer, '4/3');
  // createCurriculumQuestions picks the single difficulty before generating.
  const values = q.text.ru.match(/x = (\d+), y = (\d+).*x = (\d+)/).slice(1).map(Number);
  assert.ok(curriculumAnswersMatch(`${values[0] * values[1]}/${values[2]}`, q.answer));
  assert.equal(curriculumAnswersMatch('4/3', '1.333333'), false);
  assert.ok(curriculumAnswersMatch('28/21', '4/3'));
});

test('fifth free answer keeps feedback; next task is locked', () => {
  const source = fs.readFileSync(new URL('../frontend/src/components/Training.jsx', import.meta.url), 'utf8');
  const declaration = source.match(/export const showTrainingLimit = ([^;]+);/)[1];
  const limit = vm.runInNewContext(declaration);
  assert.equal(limit(false, 5, true), false);
  assert.equal(limit(false, 5, false), true);
  assert.equal(limit(true, 500, false), false);
});

test('same-render double submit persists an attempt only once', () => {
  const source = fs.readFileSync(new URL('../frontend/src/components/Training.jsx', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('  function check() {'), source.indexOf('  const saveNotice ='));
  let writes = 0;
  const context = { checkingRef: { current: false }, checked: false, locked: false, loading: false, opening: false, pro: true, uid: 'kid', topic: { id: 'num', name: 'Numbers' }, answer: '4', items: [{ id: 'q', topic: 'num', school: 'НИШ' }], i: 0, secs: 3,
    sessionState: 'ready', currentQuestion: { current: 'kid:num:0:q' },
    questionSession: { current: { id: 'attempt-1', uid: 'kid', key: 'kid:num:0:q', ready: true } },
    trainingQuestion: (q) => q, setServerResult: () => {},
    setChecked: () => {}, setRecoveryAvailable: () => {}, writePendingTraining: () => true, auth: { currentUser: { uid: 'kid' } }, pendingAttempt: { current: null }, persistAttempt: () => { writes++; } };
  vm.createContext(context);
  vm.runInContext(`${body}\ncheck();check();`, context);
  assert.equal(writes, 1);
});
