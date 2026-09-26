const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const realBank = require('../backend/lib/diagnostic-bank');

const source = fs.readFileSync(`${__dirname}/../api/diagnostic-session.js`, 'utf8');
const makeQuestion = (index, wave, difficulty = 'easy') => ({ id: `question-${index}`, moduleId: `module-${index % 8}`,
  wave, difficulty, topic: { kind: 'addsub', title: { ru: `Тема ${index}`, kk: `Тақырып ${index}` } },
  question: { text: { ru: `${index} + 1?`, kk: `${index} + 1?` }, answer: String(index + 1),
    solution: { ru: 'Решение', kk: 'Шешімі' } } });

function fixture() {
  const docs = new Map([
    ['childIndex/kid', { parentUid: 'parent' }], ['families/parent', { plan: 'free' }],
    ['families/parent/children/kid', { code: 'bala' }],
  ]);
  let serial = Promise.resolve(), clock = Date.parse('2026-09-26T00:00:00Z');
  const snapshot = (path) => ({ exists: docs.has(path), data: () => docs.get(path) });
  const doc = (path) => ({ path, get: async () => snapshot(path), collection: (name) => collection(`${path}/${name}`) });
  const collection = (path) => ({ doc: (id) => doc(`${path}/${id}`) });
  const db = { collection, runTransaction(callback) {
    const work = serial.then(async () => {
      const writes = [], result = await callback({
        get: async (ref) => snapshot(ref.path),
        create: (ref, value) => { if (docs.has(ref.path)) throw Error('exists'); writes.push([ref.path, value]); },
        set: (ref, value, options) => writes.push([ref.path, options?.merge ? { ...docs.get(ref.path), ...value } : value]),
        update: (ref, value) => writes.push([ref.path, { ...docs.get(ref.path), ...value }]),
      });
      writes.forEach(([path, value]) => docs.set(path, value));
      return result;
    });
    serial = work.catch(() => {}); return work;
  } };
  const auth = { verifyIdToken: async (token) => token === 'kid'
    ? { uid: 'kid', email: 'bala@synaq.kids' }
    : token === 'parent' ? { uid: 'parent', email: 'parent@example.test' }
      : Promise.reject(Object.assign(Error('expired'), { code: 'auth/expired' })) };
  const bank = {
    VERSION: 2, TOTAL: 20,
    createWave: async () => Array.from({ length: 8 }, (_, index) => makeQuestion(index, 1)),
    nextWave: async (_grade, wave) => Array.from({ length: wave === 2 ? 8 : 4 }, (_, offset) => {
      const index = wave === 2 ? 8 + offset : 16 + offset;
      return makeQuestion(index, wave, wave === 2 ? 'medium' : 'hard');
    }),
    publicQuestion: ({ question, ...item }) => { const { answer, solution, ...publicValue } = question; return { ...item, question: publicValue }; },
    answerMatches: async (given, expected) => given.trim() === expected,
    buildResult: (session, at) => { const correct = session.records.filter((item) => item.correct).length; return {
      version: 2, grade: session.grade, completedAt: new Date(at).toISOString(), readiness: Math.round(correct / 20 * 100),
      correct, total: 20, spentSec: 20, topics: [], mistakes: session.records.filter((item) => !item.correct)
        .map((item) => ({ text: item.question.text, your: item.your, answer: item.question.answer, solution: item.question.solution })), verified: true,
    }; },
  };
  class FakeDate extends Date { static now() { return clock; } }
  const context = { module: { exports: {} }, process, console: { error() {} }, Date: FakeDate,
    require(name) {
      if (name === '../backend/lib/firebase-admin') return { getAdmin: () => ({ auth, db }) };
      if (name === '../backend/lib/diagnostic-bank') return bank;
      throw Error(`unexpected ${name}`);
    } };
  const script = new vm.Script(source, { filename: 'diagnostic-session.js' });
  script.runInNewContext(context);
  async function invoke(body, token = 'kid') {
    const req = { method: 'POST', body, headers: { authorization: token ? `Bearer ${token}` : '' } };
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; },
      json(value) { this.body = JSON.parse(JSON.stringify(value)); return this; } };
    await context.module.exports(req, res); return { status: res.statusCode, body: res.body };
  }
  return { docs, invoke, advance(ms) { clock += ms; } };
}

test('diagnostic starts with a public server question and resumes the same session', async () => {
  const f = fixture(), id = 'diagnostic_12345678';
  const first = await f.invoke({ action: 'start', id, grade: 5 });
  assert.equal(first.status, 200); assert.equal(first.body.index, 0); assert.equal(first.body.total, 20);
  assert.equal(first.body.question.question.answer, undefined); assert.equal(first.body.question.question.solution, undefined);
  assert.equal(f.docs.get(`diagnosticSessions/kid_${id}`).questions[0].question.answer, '1');
  assert.deepEqual(await f.invoke({ action: 'resume', id }), first);
});

test('server grades all waves, adapts them and persists one verified result', async () => {
  const f = fixture(), id = 'diagnostic_12345678'; await f.invoke({ action: 'start', id, grade: 5 });
  for (let index = 0; index < 20; index++) {
    f.advance(1000);
    const response = await f.invoke({ action: 'answer', id, index, answer: index % 2 ? 'wrong' : String(index + 1), correct: true });
    if (index < 19) {
      assert.equal(response.body.index, index + 1);
      assert.equal(response.body.question.question.answer, undefined);
    } else {
      assert.equal(response.body.completed, true); assert.equal(response.body.result.correct, 10);
      assert.equal(response.body.result.verified, true); assert.equal(response.body.result.mistakes[0].answer, '2');
    }
  }
  const saved = f.docs.get(`results/kid/diagnostics/${id}`);
  assert.equal(saved.correct, 10); assert.equal(saved.sourceId, id);
  const replay = await f.invoke({ action: 'answer', id, index: 19, answer: '20' });
  assert.equal(replay.body.result.correct, 10);
});

test('answer retries are idempotent and invalid identities or payloads fail closed', async () => {
  const f = fixture(), id = 'diagnostic_12345678';
  assert.equal((await f.invoke({ action: 'start', id, grade: 5 }, 'parent')).status, 403);
  await f.invoke({ action: 'start', id, grade: 5 });
  const first = await f.invoke({ action: 'answer', id, index: 0, answer: '1' });
  const replay = await f.invoke({ action: 'answer', id, index: 0, answer: 'forged' });
  assert.equal(first.body.index, 1); assert.equal(replay.body.index, 1);
  assert.equal(f.docs.get(`diagnosticSessions/kid_${id}`).records.length, 1);
  assert.equal((await f.invoke({ action: 'answer', id, index: 4, answer: '5' })).status, 409);
  assert.equal((await f.invoke({ action: 'answer', id, index: 1, answer: { correct: true } })).status, 400);
});

test('real adaptive diagnostic bank keeps secrets server-side and builds twenty-question reports', async () => {
  const first = await realBank.createWave(5, 1);
  assert.equal(first.length, 8);
  assert.equal(realBank.publicQuestion(first[0]).question.answer, undefined);
  assert.equal(realBank.publicQuestion(first[0]).question.solution, undefined);
  const firstRecords = first.map((item, index) => ({ ...item, your: index % 2 ? 'wrong' : item.question.answer,
    correct: index % 2 === 0, seconds: 5 }));
  const second = await realBank.nextWave(5, 2, firstRecords);
  assert.equal(second.length, 8);
  const secondRecords = second.map((item) => ({ ...item, your: item.question.answer, correct: true, seconds: 5 }));
  const third = await realBank.nextWave(5, 3, [...firstRecords, ...secondRecords]);
  assert.equal(third.length, 4);
  const records = [...firstRecords, ...secondRecords, ...third.map((item) => ({ ...item, your: '', correct: false, seconds: 5 }))];
  const report = realBank.buildResult({ grade: 5, records, startedAt: 1000 }, 101000);
  assert.equal(report.total, 20); assert.equal(report.correct, 12); assert.equal(report.verified, true);
  assert.equal(report.mistakes.length, 8); assert.ok(report.mistakes.every((item) => item.answer != null));
});
