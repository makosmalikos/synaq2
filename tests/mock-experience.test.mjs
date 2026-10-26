import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { readMockSession, writeMockSession, mockRemaining } from '../frontend/src/mockPersistence.js';
import { groupMockQuestions, hasMockAnswer, mockMistakes, mockReviewQuestions, mockReviewStatus, mockReviewSummary } from '../frontend/src/mockReviewModel.js';

const mockSource = fs.readFileSync(new URL('../frontend/src/components/Mock.jsx', import.meta.url), 'utf8');
const resultSource = fs.readFileSync(new URL('../frontend/src/components/MockResults.jsx', import.meta.url), 'utf8');
const row = (num, patch = {}) => ({ num, qid: `q${num}`, subject: 'math', statement: '2 + 2?', answer: '4', your: null, correct: false, ...patch });

test('all 180 NIS tasks keep their global numbers and direct navigation indices across subjects', () => {
  const subjects = [['math', 40], ['kolzar', 60], ['science', 20], ['eng', 20], ['rus', 20], ['kaz', 20]];
  const questions = subjects.flatMap(([subject, length]) => Array.from({ length }, () => ({ subject })));
  questions.forEach((question, i) => { question.num = i + 1; });
  const grouped = groupMockQuestions(questions);
  assert.deepEqual(grouped.map(group => group.questions.length), [40, 60, 20, 20, 20, 20]);
  for (const { question, index } of grouped.flatMap(group => group.questions)) assert.equal(question.num, index + 1);
  assert.equal(grouped.at(-1).questions.at(-1).index, 179);
});

test('answer colours distinguish whitespace, a real zero, skipped tasks, errors and redacted snapshots', () => {
  assert.equal(hasMockAnswer('   '), false); assert.equal(hasMockAnswer('0'), true);
  assert.equal(hasMockAnswer(undefined), false);
  assert.equal(mockReviewStatus(row(1, { correct: true, your: '4' })), 'correct');
  assert.equal(mockReviewStatus(row(2, { your: '0' })), 'wrong');
  assert.equal(mockReviewStatus(row(3, { your: '  ' })), 'unanswered');
  assert.equal(mockReviewStatus(row(4, { unavailable: true })), 'unavailable');
});

test('subject summaries retain BIL +4/-1/0 scoring including negative marks', () => {
  const review = [row(1, { your: '4', correct: true }), row(2, { your: '9' }), row(3), row(4, { your: ' ' })];
  assert.deepEqual(mockReviewSummary(review, 'БИЛ'), { correct: 1, wrong: 1, unanswered: 2, unavailable: 0, total: 4, score: 3, max: 16 });
  assert.equal(mockReviewSummary([row(1, { your: '9' })], 'БИЛ').score, -1);
  for (const school of ['НИШ', 'РФМШ']) assert.equal(mockReviewSummary(review, school).score, 1);
});

test('work on mistakes includes errors and omissions but excludes correct and unavailable questions', () => {
  const review = [row(1, { correct: true }), row(2, { your: '9' }), row(3), row(4, { unavailable: true }), row(5, { answer: null }), row(6, { answer: '—' })];
  assert.deepEqual(mockMistakes(review).map(question => question.num), [2, 3]);
});

test('review uses the verified verdict and key, preserves original language and never reopens redacted text', () => {
  const result = { review: [row(2, { answer: 'server key', unavailable: true }), row(1, { correct: true })] };
  const original = { questions: [{ id: 'q1', num: 1, statement: 'Old text', answer: 'untrusted', lang: 'kk', options: ['4', '5'] },
    { id: 'q2', num: 2, statement: 'Withdrawn text', lang: 'kk' }] };
  const before = JSON.stringify(result);
  const review = mockReviewQuestions(result, original);
  assert.deepEqual(review.map(question => question.num), [1, 2]);
  assert.equal(review[0].answer, '4'); assert.equal(review[0].statement, '2 + 2?');
  assert.equal(review[0].lang, 'kk'); assert.equal(review[0].id, 'q1');
  assert.equal(review[1], result.review[0]);
  assert.equal(JSON.stringify(result), before);
});

test('actual navigation supports 2 → 30 → 5 and section jumps without losing answers or moving the deadline', () => {
  const questions = Array.from({ length: 180 }, (_, index) => ({ num: index + 1, section: index < 120 ? 1 : 2 }));
  const run = { index: 1, test: { questions }, deadline: 999999, answers: { 2: 'answer', 30: '0' }, pausedAt: null };
  const patches = [];
  const context = { runRef: { current: run }, mockRemaining: () => 60,
    changeRun: patch => { patches.push(patch); Object.assign(run, patch); } };
  vm.createContext(context);
  vm.runInContext(mockSource.slice(mockSource.indexOf('  function goToQuestion('), mockSource.indexOf('  const formatLabel =')), context);
  for (const index of [29, 4, 179, 0]) { context.goToQuestion(index); assert.equal(run.index, index); }
  assert.deepEqual(JSON.parse(JSON.stringify(patches)), [{ index: 29 }, { index: 4 }, { index: 179 }, { index: 0 }]);
  assert.deepEqual(run.answers, { 2: 'answer', 30: '0' }); assert.equal(run.deadline, 999999); assert.equal(run.pausedAt, null);
  context.goToQuestion(-1); context.goToQuestion(180); assert.equal(patches.length, 4);
  run.result = {}; context.goToQuestion(1); assert.equal(patches.length, 4);
  run.result = null; context.mockRemaining = () => 0; context.goToQuestion(1); assert.equal(patches.length, 4);
});

test('retry handlers check independently, preserve other answers and never change the original result', () => {
  const original = { score: 0, review: [row(1)] }, before = JSON.stringify(original);
  const answers = {};
  const context = { question: row(1), retry: undefined, hasMockAnswer,
    isCorrect: (given, question) => String(given).trim() === question.answer,
    setRetryAnswers: change => { Object.assign(answers, change({ ...answers })); context.retry = answers[context.question.num]; } };
  vm.createContext(context);
  vm.runInContext(resultSource.slice(resultSource.indexOf('  function updateRetry('), resultSource.indexOf("  if (mode === 'summary')")), context);
  context.updateRetry(' '); context.checkRetry(); assert.equal(context.retry.checked, false);
  context.updateRetry('5'); context.checkRetry(); assert.equal(context.retry.correct, false); assert.equal(context.retry.checked, true);
  context.updateRetry('4'); assert.equal(context.retry.value, '5', 'a checked answer is frozen until an explicit retry');
  context.question = row(2); context.retry = undefined;
  context.updateRetry('4'); context.checkRetry(); assert.equal(context.retry.correct, true);
  assert.equal(answers[1].value, '5'); assert.equal(JSON.stringify(original), before);
});

test('completed results remain recoverable until leaving; language switches do not reset the active exam', () => {
  const submit = mockSource.slice(mockSource.indexOf('  async function submit()'), mockSource.indexOf('  function resumeExam()'));
  assert.doesNotMatch(submit, /clearMockSession/);
  assert.match(mockSource, /clearMockSession\(uid, runRef\.current\?\.id\)/);
  assert.match(mockSource, /\}, \[uid, recoveryRetry\]\)/);
  assert.doesNotMatch(mockSource, /translateQuestions/);
});

test('actual submit and resume handlers preserve a completed review through refresh without resubmission', async () => {
  const data = new Map(), storage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const result = { score: 1, gradable: 2, review: [row(1, { correct: true, your: '4' }), row(2)] };
  const record = { uid: 'kid', id: 'mock-attempt-1234', school: 'БИЛ',
    test: { id: 'mock-attempt-1234', school: 'БИЛ', questions: [1, 2].map(num => ({ id: `q${num}`, num, section: 1, statement: '2 + 2?' })) },
    meta: { school: 'БИЛ' }, answers: { 1: '4' }, flags: {}, index: 1, startedAt: Date.now(), deadline: Date.now() + 60000,
    pausedAt: null, pausedMs: 0, isDiagnosticRun: false, result: null, pending: null };
  const state = {}, calls = [];
  const context = { uid: 'kid', ru: true, recoveryRetry: 0, isCurrent: () => true, clearInterval() {}, mockRemaining,
    runRef: { current: record }, submittingRef: { current: false }, tick: {},
    attemptId: {}, pendingSave: {}, deadlineRef: {}, pausedAtRef: {}, generationRef: { current: 0 }, startingRef: {}, savingRef: {},
    writeMockSession: value => writeMockSession(value, storage), readMockSession: uid => readMockSession(uid, storage),
    readMockStart: () => null, mockSubmit: async (...args) => { calls.push(args); return result; },
    mockResume: async () => ({ completed: true, result }), useEffect: effect => effect(),
  };
  for (const name of ['School', 'Test', 'Meta', 'Answers', 'Flags', 'I', 'Pause', 'Left', 'HideTimer', 'IsDiagnosticRun', 'Result',
    'RecoveryAvailable', 'SaveState', 'SessionReady', 'RecoveryError', 'StartError', 'Starting']) context[`set${name}`] = value => { state[name] = value; };
  vm.createContext(context);
  const handlers = mockSource.slice(mockSource.indexOf('  function applyRun('), mockSource.indexOf('  useEffect(() => {\n    let alive = true;'))
    + mockSource.slice(mockSource.indexOf('  async function submit()'), mockSource.indexOf('  function resumeExam()'));
  vm.runInContext(handlers, context);
  await context.submit(); await context.submit();
  assert.equal(calls.length, 1); assert.equal(calls[0][0], record.id);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1])), { 1: '4' });
  assert.equal(state.SaveState, 'saved');
  assert.deepEqual(readMockSession('kid', storage).record.result.review, result.review);
  const restore = mockSource.slice(mockSource.indexOf('  useEffect(() => {\n    let alive = true;'),
    mockSource.indexOf('  }, [uid, recoveryRetry]);') + '  }, [uid, recoveryRetry]);'.length);
  vm.runInContext(restore, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(state.SessionReady, true); assert.equal(state.Result, result);
  assert.equal(state.I, 1); assert.deepEqual(state.Answers, { 1: '4' });
  assert.equal(calls.length, 1, 'refresh resumes the verified result and does not send answers again');
});
