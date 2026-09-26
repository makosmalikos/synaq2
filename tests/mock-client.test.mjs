import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readMockSession, writeMockSession, clearMockSession, discardMockSession, mockRemaining, mockSpent,
  readMockStart, writeMockStart, clearMockStart } from '../frontend/src/mockPersistence.js';

const component = fs.readFileSync(new URL('../frontend/src/components/Mock.jsx', import.meta.url), 'utf8');
const adapter = fs.readFileSync(new URL('../frontend/src/mockApi.js', import.meta.url), 'utf8');

function memoryStorage() {
  const data = new Map();
  return { data, getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}

function record(overrides = {}) {
  return { version: 1, uid: 'kid', id: 'stable-exam-attempt', school: 'РФМШ',
    test: { id: 'stable-exam-attempt', school: 'РФМШ', timeLimitMin: 1, sections: 1,
      questions: [{ id: 'q1', num: 1, section: 1, statement: '2 + 2?', options: ['3', '4'] }] },
    meta: { school: 'РФМШ' }, answers: { 1: '4' }, flags: {}, index: 0,
    startedAt: 1000, deadline: 61000, pausedAt: null, pausedMs: 0,
    isDiagnosticRun: false, result: null, pending: null, ...overrides };
}

test('mock screen uses authenticated server sessions instead of the browser question bank', () => {
  assert.match(component, /mockStart\(\{ id: requestId, school: code, excludeQuestionIds \}\)/);
  assert.match(component, /mockSubmit\(run\.id, run\.answers\)/);
  assert.match(component, /mockResume\(record\?\.id \|\| interruptedStart\.id\)/);
  assert.doesNotMatch(component, /from ['"]\.\.\/api\.js['"]/);
  assert.match(adapter, /Authorization: `Bearer \$\{token\}`/);
  assert.match(adapter, /fetch\('\/api\/mock-session'/);
});

test('journal stores public questions and restores answers, flags and deadline', () => {
  const storage = memoryStorage(), value = record({ flags: { 1: true }, hideTimer: true });
  assert.equal(writeMockSession(value, storage), true);
  const restored = readMockSession('kid', storage);
  assert.equal(restored.error, null);
  assert.equal(restored.record.answers[1], '4');
  assert.equal(restored.record.flags[1], true);
  assert.equal(restored.record.deadline, 61000);
  assert.equal(restored.record.test.questions.some((question) => Object.hasOwn(question, 'answer')), false);
});

test('journal is UID-isolated and rejects malformed state', () => {
  const storage = memoryStorage(), value = record();
  writeMockSession(value, storage);
  assert.equal(readMockSession('other-kid', storage).record, null);
  const [key] = storage.data.keys();
  for (const patch of [{ version: 2 }, { uid: 'other-kid' }, { deadline: null }, { index: 50 }]) {
    storage.data.set(key, JSON.stringify({ ...value, ...patch }));
    assert.equal(readMockSession('kid', storage).error, 'invalid');
  }
});

test('late acknowledgement clears only the matching exam journal', () => {
  const storage = memoryStorage();
  writeMockSession(record({ id: 'new-exam', test: { ...record().test, id: 'new-exam' } }), storage);
  assert.equal(clearMockSession('kid', 'old-exam', storage), true);
  assert.equal(readMockSession('kid', storage).record.id, 'new-exam');
  assert.equal(discardMockSession('kid', storage), true);
  assert.equal(readMockSession('kid', storage).record, null);
});

test('a lost start response keeps the stable server attempt id across refresh', () => {
  const storage = memoryStorage(), pending = { uid: 'kid', id: 'attempt_12345678', school: 'РФМШ' };
  assert.equal(writeMockStart(pending, storage), true);
  assert.deepEqual(readMockStart('kid', storage), pending);
  assert.equal(clearMockStart('kid', 'another-attempt', storage), true);
  assert.deepEqual(readMockStart('kid', storage), pending);
  assert.equal(clearMockStart('kid', pending.id, storage), true);
  assert.equal(readMockStart('kid', storage), null);
});

test('timer uses absolute deadlines and excludes a paused interval', () => {
  const value = record({ startedAt: 1000, deadline: 61000, pausedAt: null, pausedMs: 0 });
  assert.equal(mockRemaining(value, 11000), 50);
  assert.equal(mockRemaining(value, 999999), 0);
  assert.equal(mockSpent(value, 31000), 30);
  assert.equal(mockSpent({ ...value, pausedAt: 11000, pausedMs: 0 }, 50000), 10);
});
