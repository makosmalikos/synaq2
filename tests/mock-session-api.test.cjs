const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const plans = require('../backend/lib/plans');

const source = fs.readFileSync(`${__dirname}/../api/mock-session.js`, 'utf8');
const secretQuestions = [
  { id: 'q1', num: 1, section: 1, school: 'РФМШ', topic: 'num', statement: '2 + 2?', answer: '4', solution: '2 + 2 = 4' },
  { id: 'q2', num: 2, section: 1, school: 'РФМШ', topic: 'num', statement: '3 + 3?', answer: '6', solution: '3 + 3 = 6' },
];

function fixture({ pro = false, paid = false } = {}) {
  const docs = new Map([
    ['childIndex/kid', { parentUid: 'parent' }],
    ['families/parent', { plan: pro ? 'pro' : 'free' }],
    ['families/parent/children/kid', { code: 'bala' }],
    ...(paid ? [['weeklyMockPasses/pass_parent_2026-09-28', { paid: true, parentUid: 'parent', weekKey: '2026-09-28' }]] : []),
  ]);
  let serial = Promise.resolve();
  const snapshot = (path) => ({ exists: docs.has(path), data: () => docs.get(path) });
  const write = (path, value, options) => docs.set(path, options?.merge ? { ...docs.get(path), ...value } : value);
  const doc = (path) => ({ path, get: async () => snapshot(path),
    collection: (name) => collection(`${path}/${name}`) });
  const collection = (path) => ({ doc: (id) => doc(`${path}/${id}`), get: async () => ({ docs: [] }) });
  const db = { collection, runTransaction(callback) {
    const pending = serial.then(async () => {
      const writes = [];
      const result = await callback({
        get: async (ref) => snapshot(ref.path),
        set: (ref, value, options) => writes.push(['set', ref.path, value, options]),
        create: (ref, value) => {
          if (docs.has(ref.path)) throw Object.assign(Error('exists'), { code: 6 });
          writes.push(['set', ref.path, value]);
        },
        update: (ref, value) => {
          if (!docs.has(ref.path)) throw Error('missing');
          writes.push(['set', ref.path, { ...docs.get(ref.path), ...value }]);
        },
      });
      for (const [, path, value, options] of writes) write(path, value, options);
      return result;
    });
    serial = pending.catch(() => {});
    return pending;
  } };
  const auth = { async verifyIdToken(token, revoked) {
    assert.equal(revoked, true);
    if (token === 'kid') return { uid: 'kid', email: 'bala@synaq.kids' };
    if (token === 'parent') return { uid: 'parent', email: 'parent@example.test' };
    throw Object.assign(Error('expired'), { code: 'auth/id-token-expired' });
  } };
  const mockBank = {
    mockCatalog: async () => [{ code: 'РФМШ', ready: true, count: 2, targetCount: 2, timeLimitMin: 1 }],
    createWeeklyMock: async (_db, school, weekKey) => school === 'РФМШ' ? { school, weekKey, title: 'Пробник', timeLimitMin: 1,
      sections: 1, shortened: false, targetCount: 2, questions: secretQuestions } : null,
    restoreMock: async (_db, session) => ({ id: session.attemptId, school: session.school, title: session.title,
      timeLimitMin: session.timeLimitMin, sections: session.sections,
      questions: session.questionRefs.map((ref) => ({ ...secretQuestions.find((question) => question.id === ref.id), ...ref })) }),
    gradeMock: async (_db, session, answers) => ({ score: secretQuestions.filter((question) => answers[question.num] === question.answer).length,
      gradable: 2, total: 2, review: secretQuestions.map((question) => ({ qid: question.id, num: question.num,
        statement: question.statement, your: answers[question.num] ?? null, answer: question.answer,
        solution: question.solution, correct: answers[question.num] === question.answer })) }),
    publicMock: (variant) => ({ ...variant, questions: variant.questions.map(({ answer, solution, ...question }) => question) }),
  };
  const context = { module: { exports: {} }, Date, console: { error() {} }, process,
    require(name) {
      if (name === '../backend/lib/firebase-admin') return { getAdmin: () => ({ db, auth }) };
      if (name === '../backend/lib/plans') return plans;
      if (name === '../backend/lib/mock-bank') return mockBank;
      if (name === '../backend/lib/weekly-mock') return { PRICE_KZT: 2500,
        weeklyWindow: () => ({ weekKey: '2026-09-28', startsAt: 1, endsAt: 2 }),
        passId: (parentUid, weekKey) => `pass_${parentUid}_${weekKey}` };
      throw Error(`unexpected ${name}`);
    } };
  vm.runInNewContext(source, context);
  async function invoke(body, token = 'kid') {
    const req = { method: 'POST', body, headers: { authorization: token ? `Bearer ${token}` : '' } };
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; },
      json(value) { this.body = JSON.parse(JSON.stringify(value)); return this; } };
    await context.module.exports(req, res);
    return { status: res.statusCode, body: res.body };
  }
  return { docs, invoke };
}

test('server creates an answer-free mock session for the linked child', async () => {
  const f = fixture({ paid: true });
  const catalog = await f.invoke({ action: 'catalog' });
  assert.equal(catalog.status, 200);
  const started = await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] });
  assert.equal(started.status, 200);
  assert.equal(started.body.diagnostic, false);
  assert.equal(started.body.weekKey, '2026-09-28');
  assert.equal(started.body.test.questions.length, 2);
  assert.equal(Object.hasOwn(started.body.test.questions[0], 'answer'), false);
  assert.equal(Object.hasOwn(started.body.test.questions[0], 'solution'), false);
  const stored = f.docs.get('mockSessions/kid_attempt_12345678');
  assert.deepEqual(stored.questionRefs.map((question) => Object.keys(question).sort()), [
    ['id', 'num', 'section', 'subject'], ['id', 'num', 'section', 'subject'],
  ]);
});

test('server grades and persists a verified result exactly once', async () => {
  const f = fixture({ paid: true });
  await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] });
  const first = await f.invoke({ action: 'submit', id: 'attempt_12345678', answers: { 1: '4', 2: '0' }, score: 99 });
  assert.equal(first.status, 200);
  assert.equal(first.body.result.score, 1);
  assert.equal(first.body.result.verified, true);
  assert.equal(f.docs.get('results/kid/mocks/attempt_12345678').score, 1);
  assert.equal(f.docs.get('results/kid/mocks/attempt_12345678').weekKey, '2026-09-28');
  const replay = await f.invoke({ action: 'submit', id: 'attempt_12345678', answers: { 1: '0', 2: '6' } });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.result.score, 1);
  assert.equal(replay.body.result.review[0].your, '4');
});

test('weekly mock requires Pro or the current paid weekly pass', async () => {
  const free = fixture();
  assert.equal((await free.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] })).status, 402);
  const paid = fixture({ paid: true });
  assert.equal((await paid.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] })).status, 200);
  const pro = fixture({ pro: true });
  assert.equal((await pro.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] })).body.diagnostic, false);
  assert.equal((await pro.invoke({ action: 'start', id: 'attempt_87654321', school: 'РФМШ', excludeQuestionIds: [] })).status, 200);
});

test('parents, forged sessions and malformed answers cannot submit a mock', async () => {
  const f = fixture({ paid: true });
  assert.equal((await f.invoke({ action: 'catalog' }, 'parent')).status, 403);
  assert.equal((await f.invoke({ action: 'resume', id: 'missing_12345678' })).status, 404);
  await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] });
  assert.equal((await f.invoke({ action: 'submit', id: 'attempt_12345678', answers: { 1: { correct: true } } })).status, 400);
});


test('a previous week pass does not unlock the current week and stale starts refresh', async () => {
  const f = fixture();
  f.docs.set('weeklyMockPasses/pass_parent_2026-09-21', { paid: true });
  assert.equal((await f.invoke({ action: 'catalog' })).body.weekly.access, false);
  assert.equal((await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', weekKey: '2026-09-21', excludeQuestionIds: [] })).status, 409);
});

test('sessions started before weekly rollout can still save a result', async () => {
  const f = fixture({ pro: true });
  await f.invoke({ action: 'start', id: 'attempt_12345678', school: 'РФМШ', excludeQuestionIds: [] });
  delete f.docs.get('mockSessions/kid_attempt_12345678').weekKey;
  const response = await f.invoke({ action: 'submit', id: 'attempt_12345678', answers: { 1: '4' } });
  assert.equal(response.status, 200);
  assert.equal(f.docs.get('results/kid/mocks/attempt_12345678').weekKey, null);
});
