import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { PUBLIC_MOCKS } from '../frontend/src/publicMockData.generated.js';

const require = createRequire(import.meta.url);
const { PRICE_KZT, weeklyWindow, deterministicOrder } = require('../backend/lib/weekly-mock');
const { createWeeklyMock } = require('../backend/lib/mock-bank');

test('landing exposes one fixed full-format variant for each school', () => {
  assert.deepEqual(Object.keys(PUBLIC_MOCKS).sort(), ['БИЛ', 'НИШ', 'РФМШ'].sort());
  const expected = { 'РФМШ': 30, 'БИЛ': 60, 'НИШ': 180 };
  for (const [school, mock] of Object.entries(PUBLIC_MOCKS)) {
    const { questions } = mock;
    assert.equal(questions.length, expected[school], school);
    assert.ok(mock.minutes >= 110, school);
    assert.equal(new Set(questions.map((question) => question.id)).size, expected[school], school);
    for (const question of questions) {
      assert.ok(question.statement && question.answer, `${school}/${question.id}`);
      if (question.options) assert.ok(question.options.includes(question.answer), `${school}/${question.id}`);
    }
  }
});

test('Almaty weekly key changes on Monday and price stays server-owned', () => {
  assert.equal(PRICE_KZT, 2500);
  assert.equal(weeklyWindow(Date.parse('2026-09-27T18:59:59Z')).weekKey, '2026-09-21');
  assert.equal(weeklyWindow(Date.parse('2026-09-27T19:00:00Z')).weekKey, '2026-09-28');
});

test('question order is stable during a week and changes with the weekly seed', () => {
  const items = Array.from({ length: 30 }, (_, index) => ({ id: `q${index + 1}` }));
  const first = deterministicOrder(items, '2026-09-28:НИШ:math').map((item) => item.id);
  const replay = deterministicOrder([...items].reverse(), '2026-09-28:НИШ:math').map((item) => item.id);
  const next = deterministicOrder(items, '2026-10-05:НИШ:math').map((item) => item.id);
  assert.deepEqual(first, replay);
  assert.notDeepEqual(first, next);
});

test('real weekly school variants replay exactly within a week and rotate next week', async () => {
  const db = { collection: () => ({ get: async () => ({ docs: [] }) }) };
  for (const school of ['БИЛ', 'НИШ', 'РФМШ']) {
    const first = await createWeeklyMock(db, school, '2026-09-28');
    const replay = await createWeeklyMock(db, school, '2026-09-28');
    const next = await createWeeklyMock(db, school, '2026-10-05');
    const ids = (variant) => variant.questions.map((question) => question.id);
    assert.deepEqual(ids(first), ids(replay), school);
    assert.notDeepEqual(ids(first), ids(next), school);
    assert.equal(first.questions.length, first.targetCount, school);
  }
});
