const test = require('node:test');
const assert = require('node:assert/strict');
const { createLearningService, learningDay, SESSION_TTL } = require('../backend/lib/learning-service');

function memoryStore(seed) {
  const records = new Map(Object.entries(seed));
  let tail = Promise.resolve(), failure = null;
  const snap = (path) => ({ exists: records.has(path), data: () => records.get(path) });
  const query = (path, filters = []) => ({ path, filters, query: true, where: (field, op, value) => query(path, [...filters, [field, op, value]]) });
  const collection = (path) => ({ ...query(path), doc: (id) => doc(`${path}/${id}`) });
  const doc = (path) => ({ path, get: async () => snap(path), collection: (name) => collection(`${path}/${name}`) });
  const db = { records, collection, failNext: (mode) => { failure = mode; }, runTransaction(callback) {
    const work = tail.then(async () => {
      const pending = [];
      const value = await callback({ get: async (ref) => {
        assert.equal(pending.length, 0, 'all transaction reads precede writes');
        if (!ref.query) return snap(ref.path);
        const docs = [...records].filter(([path, data]) => path.startsWith(`${ref.path}/`) && path.split('/').length === ref.path.split('/').length + 1
          && ref.filters.every(([field, op, expected]) => op === '>=' ? data[field] >= expected : data[field] < expected));
        return { size: docs.length, docs: docs.map(([path]) => snap(path)) };
      }, create(ref, data) { assert.equal(records.has(ref.path), false); pending.push([ref.path, data]); },
      set(ref, data, options) { pending.push([ref.path, options?.merge ? { ...records.get(ref.path), ...data } : data]); },
      update(ref, data) { assert.ok(records.has(ref.path)); pending.push([ref.path, { ...records.get(ref.path), ...data }]); } });
      const fault = failure; failure = null;
      if (fault === 'before') throw Error('connection-lost');
      pending.forEach(([path, data]) => records.set(path, data));
      if (fault === 'after') throw Error('acknowledgement-lost');
      return value;
    });
    tail = work.catch(() => {});
    return work;
  } };
  return db;
}

function fixture({ pro = false, plan } = {}) {
  let now = Date.parse('2026-09-24T00:00:00Z'), generated = 0;
  const db = memoryStore({ 'families/parent': { pro, ...(plan ? { plan } : {}) }, 'families/parent/children/kid': { code: 'student' }, 'childIndex/kid': { parentUid: 'parent' } });
  const user = { uid: 'kid', email: 'student@synaq.kids' };
  const act = createLearningService({ db, now: () => now,
    getTrainingTopics: async () => [{ id: 'num', name: { ru: 'Числа', kk: 'Сандар' }, count: 2 }],
    getTrainingQuestions: async ({ topicId, mixed, excludeIds, limit }) => [
      { id: 'q1', statement: '2 + 2?', topic: 'num', school: 'НИШ' },
      { id: 'q2', statement: '3 + 3?', topic: 'num', school: 'РФМШ' },
    ].filter((question) => (mixed || question.topic === topicId) && !excludeIds.includes(question.id)).slice(0, limit),
    getTrainingQuestion: async (id) => /^q\d+$/.test(id) ? { id, statement: '2 + 2?', answer: '4', solution: '2 + 2 = 4', topic: 'num', school: 'НИШ' } : null,
    getCurriculumQuestion: async (key, level, id, accessOnly) => {
      if (!['standard', 'premium'].includes(key)) return null;
      if (!accessOnly) generated++;
      return { free: key === 'standard', standard: key === 'standard', question: { id: `${key}-${id}`, text: { ru: '2 + 2?', kk: '2 + 2?' }, answer: '4', solution: { ru: '4', kk: '4' }, topic: 'num', school: 'curriculum' } };
    }, gradeAnswer: async (given, question) => given === question.answer,
  });
  const start = (id = 'session-1', qid = 'q1') => act(user, { action: 'start', mode: 'training', id, qid });
  const answer = (id = 'session-1', given = '4', extras = {}) => act(user, { ...extras, action: 'answer', id, answer: given });
  return { db, user, act, start, answer, generated: () => generated, advance(ms) { now += ms; }, now: () => now };
}

test('training catalog and question selection are server-owned and answer-free', async () => {
  const f = fixture();
  const catalog = await f.act(f.user, { action: 'topics' });
  assert.deepEqual(catalog.topics, [{ id: 'num', name: { ru: 'Числа', kk: 'Сандар' }, count: 2 }]);
  const selection = await f.act(f.user, { action: 'questions', topicId: 'num', mixed: false, excludeIds: ['q1'], limit: 10 });
  assert.deepEqual(selection.questions.map((question) => question.id), ['q2']);
  assert.equal(selection.questions[0].answer, undefined);
  assert.equal(selection.questions[0].solution, undefined);
  await assert.rejects(f.act({ uid: 'parent', email: 'parent@example.test' }, { action: 'topics' }), /child-required/);
  await assert.rejects(f.act(f.user, { action: 'questions', topicId: 'num', mixed: false, excludeIds: [], limit: 101 }), /bad-request/);
  await assert.rejects(f.act(f.user, { action: 'questions', topicId: 'num', mixed: false, excludeIds: ['../q1'], limit: 10 }), /bad-request/);
});

test('server sessions hide the answer and replay the same question without extra rate charge', async () => {
  const f = fixture();
  const first = await f.start(); f.advance(1000);
  assert.deepEqual(await f.start(), first);
  assert.equal(first.question.answer, undefined); assert.equal(first.question.solution, undefined);
  assert.equal(f.db.records.get('learningRateLimits/kid').starts, 1);
  await assert.rejects(f.start('session-1', 'q2'), /request-conflict/);
});

test('forged client grade, XP, metadata and duration do not affect the server result', async () => {
  const f = fixture(); await f.start(); f.advance(12000);
  const result = await f.answer('session-1', 'wrong', { correct: true, secs: 90000, xp: 100000, topic: 'spoof', school: 'spoof' });
  assert.equal(result.correct, false); assert.equal(result.gain, 0); assert.equal(result.secs, 12);
  const stored = f.db.records.get('results/kid/attempts/session-1');
  assert.equal(stored.topic, 'num'); assert.equal(stored.school, 'НИШ'); assert.equal(stored.verified, true);
  assert.equal(f.db.records.get('results/kid/stats/summary').studySecs, 12);
});

test('answer result, daily count, solved record and XP commit atomically and replay once', async () => {
  const f = fixture(); await f.start(); f.advance(12000); f.db.failNext('before');
  await assert.rejects(f.answer(), /connection-lost/);
  assert.equal(f.db.records.has('results/kid/attempts/session-1'), false);
  assert.equal(f.db.records.has('results/kid/stats/summary'), false);
  const first = await f.answer(), repeat = await f.answer();
  assert.equal(first.gain, 5); assert.equal(first.totalXp, 5);
  assert.equal(repeat.saved, false); assert.equal(repeat.gain, 0); assert.equal(repeat.count, 1);
  await assert.rejects(f.answer('session-1', 'changed'), /request-conflict/);
});

test('lost commit acknowledgement is reconciled without a second award or allowance charge', async () => {
  const f = fixture(); await f.start(); f.db.failNext('after');
  await assert.rejects(f.answer(), /acknowledgement-lost/);
  const result = await f.answer();
  assert.equal(result.saved, false); assert.equal(result.totalXp, 5); assert.equal(result.count, 1);
});

test('parallel free answers cannot exceed five, including sessions opened while Pro was active', async () => {
  const f = fixture({ pro: true });
  await Promise.all(Array.from({ length: 6 }, (_, i) => f.start(`session-${i}`, `q${i}`)));
  f.db.records.set('families/parent', { pro: false });
  const results = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => f.answer(`session-${i}`)));
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 5);
  assert.match(results.find((r) => r.status === 'rejected').reason.message, /daily-limit/);
  assert.equal((await f.act(f.user, { action: 'count' })).count, 5);
  await assert.rejects(f.start('new-session'), /daily-limit/);
});

test('Standard allows twenty daily tasks and medium curriculum but not premium topics', async () => {
  const f = fixture({ plan: 'standard' });
  f.db.records.set('results/kid/daily/2026-09-24', { count: 19 });
  assert.equal((await f.act(f.user, { action: 'count' })).limit, 20);
  await f.act(f.user, { action: 'start', mode: 'curriculum', id: 'standard-medium', topicKey: 'standard', level: 'medium' });
  await f.answer('standard-medium');
  await assert.rejects(f.start('standard-over', 'q2'), /daily-limit/);
  await assert.rejects(f.act(f.user, { action: 'start', mode: 'curriculum', id: 'premium-denied', topicKey: 'premium', level: 'easy' }), /daily-limit|pro-required/);
});

test('repeated questions do not farm correct-answer XP and parallel timers cannot double credit', async () => {
  const f = fixture({ pro: true });
  await f.start('session-1', 'q1'); await f.start('session-2', 'q2');
  f.advance(3600000);
  const first = await f.answer('session-1'), second = await f.answer('session-2');
  assert.equal(first.gain, 5); assert.equal(second.gain, 5); assert.equal(second.secs, 0);
  assert.equal(f.db.records.get('results/kid/stats/summary').studySecs, 300, 'one AFK question cannot earn an hourly bonus');
  await f.start('session-3', 'q1');
  assert.equal((await f.answer('session-3')).gain, 0);
});

test('hourly study bonus needs multiple sequential verified attempts, not one idle tab', async () => {
  const f = fixture({ pro: true });
  for (let i = 0; i < 12; i++) {
    await f.start(`session-${i}`, `q${i}`); f.advance(300000);
    const saved = await f.answer(`session-${i}`);
    assert.equal(saved.gain, i === 11 ? 105 : 5);
  }
  assert.equal(f.db.records.get('results/kid/stats/summary').xp, 160);
});

test('legacy ISO Pro expiry is interpreted consistently with the client and checkout', async () => {
  const f = fixture();
  f.db.records.set('families/parent', { pro: true, proExpiresAt: new Date(f.now() + 10000).toISOString() });
  await f.act(f.user, { action: 'start', mode: 'curriculum', id: 'session-iso', topicKey: 'premium', level: 'hard' });
  f.db.records.set('families/parent', { pro: true, proExpiresAt: 'invalid' });
  await assert.rejects(f.act(f.user, { action: 'start', mode: 'curriculum', id: 'session-bad', topicKey: 'premium', level: 'hard' }), /pro-required/);
});

test('curriculum access and difficulty are enforced by the family entitlement on start and submit', async () => {
  const f = fixture();
  const request = { action: 'start', mode: 'curriculum', id: 'curriculum-1', topicKey: 'premium', level: 'easy' };
  await assert.rejects(f.act(f.user, request), /pro-required/);
  await assert.rejects(f.act(f.user, { ...request, topicKey: 'standard', level: 'hard' }), /pro-required/);
  const open = await f.act(f.user, { ...request, topicKey: 'standard' });
  assert.equal(open.question.answer, undefined);
  const generated = f.generated(); await f.act(f.user, { ...request, topicKey: 'standard' });
  assert.equal(f.generated(), generated, 'replay never regenerates a random question');
  f.db.records.set('families/parent', { pro: true, proExpiresAt: new Date(f.now() + 1000) });
  await f.act(f.user, { ...request, id: 'curriculum-2' }); f.advance(2000);
  await assert.rejects(f.answer('curriculum-2'), /pro-required/);
});

test('legacy daily attempts seed the counter but earlier days are excluded', async () => {
  const f = fixture();
  for (let i = 0; i < 5; i++) f.db.records.set(`results/kid/attempts/old-${i}`, { at: new Date(f.now()), qid: 'q1' });
  f.db.records.set('results/kid/attempts/yesterday', { at: new Date(f.now() - 86400000) });
  assert.equal((await f.act(f.user, { action: 'count' })).count, 5);
  await assert.rejects(f.start(), /daily-limit/);
  f.advance(86400000); assert.equal((await f.act(f.user, { action: 'count' })).count, 0);
  await f.start();
});

test('Almaty midnight is independent from the caller timezone and a replay uses the current count', async () => {
  assert.equal(learningDay(Date.parse('2026-09-23T18:59:59Z')).day, '2026-09-23');
  assert.equal(learningDay(Date.parse('2026-09-23T19:00:00Z')).day, '2026-09-24');
  const f = fixture(); await f.start(); await f.answer(); f.advance(86400000);
  const replay = await f.answer(); assert.equal(replay.count, 0); assert.equal(replay.totalXp, 5);
});

test('unknown, expired and foreign sessions fail closed; legacy linked children remain supported', async () => {
  const f = fixture(); await f.start();
  await assert.rejects(f.answer('missing-session'), /session-not-found/);
  await assert.rejects(f.act({ uid: 'kid', email: 'other@synaq.kids' }, { action: 'count' }), /child-required/);
  await assert.rejects(f.act({ uid: 'parent', email: 'parent@example.test' }, { action: 'count' }), /child-required/);
  f.advance(SESSION_TTL); await assert.rejects(f.answer(), /session-expired/);
  f.db.records.delete('families/parent/children/kid');
  await assert.rejects(f.act(f.user, { action: 'count' }), /child-required/);
});

test('invalid payloads and excessive session creation are bounded before result writes', async () => {
  const f = fixture();
  await assert.rejects(f.start('../bad/id'), /bad-request/);
  await assert.rejects(f.start('session-ok', 'unknown'), /question-unavailable/);
  await f.start();
  await assert.rejects(f.answer('session-1', ''), /bad-answer/);
  await assert.rejects(f.answer('session-1', '4'.repeat(2001)), /bad-answer/);
  f.db.records.set('learningRateLimits/kid', { day: learningDay(f.now()).day, starts: 60 });
  await assert.rejects(f.start('session-next'), /rate-limit/);
});
