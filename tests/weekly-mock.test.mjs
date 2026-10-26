import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_MOCKS } from '../frontend/src/publicMockData.generated.js';

const require = createRequire(import.meta.url);
const { PRICE_KZT, weeklyWindow, deterministicOrder } = require('../backend/lib/weekly-mock');
const { createWeeklyMock, gradeMock } = require('../backend/lib/mock-bank');

test('landing mocks follow school answer formats and retain usable figures', () => {
  assert.deepEqual(Object.keys(PUBLIC_MOCKS).sort(), ['БИЛ', 'НИШ', 'РФМШ'].sort());
  const expected = { 'РФМШ': 30, 'БИЛ': 60, 'НИШ': 180 };
  for (const [school, mock] of Object.entries(PUBLIC_MOCKS)) {
    const { questions } = mock;
    assert.equal(questions.length, expected[school], school);
    assert.ok(mock.minutes >= 110, school);
    assert.equal(new Set(questions.map((question) => question.id)).size, expected[school], school);
    for (const question of questions) {
      assert.ok(question.statement && question.answer, `${school}/${question.id}`);
      if (school === 'РФМШ') {
        assert.equal(question.options, null, question.id);
        assert.match(question.answer, /^-?\d+$/, question.id);
      } else {
        assert.equal(question.options?.length, 4, question.id);
        assert.equal(new Set(question.options).size, 4, question.id);
        assert.ok(question.options.includes(question.answer), `${school}/${question.id}`);
      }
      if (question.image) {
        const publicDir = fileURLToPath(new URL('../frontend/public/', import.meta.url));
        assert.ok(fs.existsSync(path.join(publicDir, question.image.replace(/^\//, ''))), question.id);
      }
    }
  }
  const nis = PUBLIC_MOCKS['НИШ'].questions;
  assert.deepEqual(['math', 'kolzar', 'science', 'eng', 'rus', 'kaz'].map((subject) => nis.filter((question) => question.topic === subject).length), [40, 60, 20, 20, 20, 20]);
  assert.equal(nis.filter((question) => question.section === 1).length, 120);
  assert.equal(nis.filter((question) => question.section === 2).length, 60);
  const bil = PUBLIC_MOCKS['БИЛ'].questions;
  assert.deepEqual(['math', 'logic', 'reading'].map((subject) => bil.filter((question) => question.topic === subject).length), [40, 10, 10]);
  assert.ok(PUBLIC_MOCKS['РФМШ'].questions.every((question) => !question.id.endsWith('v1_1')));
  assert.ok(nis.every((question) => !/^public-НИШ-nm\d+$/.test(question.id)));
  assert.ok(bil.every((question) => !/^public-БИЛ-bil_sets_/.test(question.id)));
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

test('weekly BIL submission scores answered errors and skips separately', async () => {
  const db = { collection: () => ({ get: async () => ({ docs: [] }) }) };
  const variant = await createWeeklyMock(db, 'БИЛ', '2026-09-28');
  const session = {
    school: 'БИЛ', attemptId: 'bil-scoring-test', title: variant.title,
    timeLimitMin: variant.timeLimitMin, sections: variant.sections,
    targetCount: variant.targetCount,
    questionRefs: variant.questions.map(({ id, num, section, subject }) => ({ id, num, section, subject })),
  };
  const answers = { [variant.questions[0].num]: variant.questions[0].answer };
  for (const question of variant.questions.slice(1, 5)) answers[question.num] = '__wrong_answer__';
  const result = await gradeMock(db, session, answers);
  assert.deepEqual([result.score, result.wrong, result.unanswered, result.points, result.maxPoints], [1, 4, 55, 0, 240]);
  assert.equal(result.review[0].lang, variant.questions[0].lang || null);
  assert.equal(result.review[0].section, variant.questions[0].section);
});
