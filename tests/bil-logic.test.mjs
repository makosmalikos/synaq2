import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bilLogicQuestions } from '../frontend/src/bilLogicQuestions.js';
import { POOL } from '../frontend/src/bank.js';
import { mockAvailability } from '../frontend/src/api.js';

test('the BIL logic section has 20 original, complete and distinct questions', () => {
  assert.equal(bilLogicQuestions.length, 20);
  assert.equal(new Set(bilLogicQuestions.map((question) => question.id)).size, 20);
  for (const question of bilLogicQuestions) {
    assert.equal(question.subject, 'logic');
    assert.ok(question.statement.length > 20);
    assert.ok(question.solution.length > 20);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.equal(question.options.filter((option) => option === question.answer).length, 1);
    assert.ok(POOL.some((item) => item.id === question.id && item.school === 'БИЛ'));
  }
  const available = mockAvailability('БИЛ');
  assert.equal(available.count, 80);
  assert.equal(available.shortened, false);
  assert.equal(available.subjects.find((subject) => subject.subject === 'logic').count, 20);
});

test('BIL logic answer key agrees with independent calculations', () => {
  const expected = [
    47 * 2 + 1, 27 + 11, 120 * 6, 8 + 13, 34 + 15, 31 * 2 + 1,
    6 * 5 / 2, 3 * 2, 5 * 4 / 2, 4 + 1,
    'Дана', 'Ол тіктөртбұрыш', 'Батыс', '16:05', 3 * 3,
    4 * 3, 'U', 12 + 10 - 5, 'Үшінші', 9 + 4 + 1,
  ];
  for (const [index, question] of bilLogicQuestions.entries()) {
    assert.equal(question.answer, String(expected[index]), question.id);
  }
});

test('serverless functions that load the bank bundle the BIL logic module', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  for (const handler of ['api/mock-session.js', 'api/duel.js', 'api/learning.js']) {
    assert.match(config.functions[handler].includeFiles, /\bbilLogicQuestions\b/, handler);
  }
});
