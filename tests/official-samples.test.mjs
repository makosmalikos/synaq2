import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { nishScienceQuestions } from '../frontend/src/nishScienceQuestions.js';
import { nishOfficialLanguageQuestions } from '../frontend/src/nishOfficialLanguageQuestions.js';
import { bilReadingQuestions } from '../frontend/src/bilReadingQuestions.js';
import { MOCK_SPECS, mockAvailability } from '../frontend/src/api.js';

const require = createRequire(import.meta.url);
const { SPECS: SERVER_SPECS } = require('../backend/lib/mock-bank.js');

test('official NIS science sample has 20 complete, gradable questions and its two figures', () => {
  assert.equal(nishScienceQuestions.length, 20);
  assert.equal(new Set(nishScienceQuestions.map((question) => question.id)).size, 20);
  for (const question of nishScienceQuestions) {
    assert.equal(question.school, 'НИШ');
    assert.equal(question.subject, 'science');
    assert.equal(question.options.length, 4);
    assert.ok(question.options.includes(question.answer), question.id);
    assert.ok(question.solution.length > 20, question.id);
    if (question.image) assert.ok(fs.existsSync(new URL(`../frontend/public${question.image}`, import.meta.url)), question.image);
  }
  assert.equal(mockAvailability('НИШ').subjects.find((item) => item.subject === 'science').count, 20);
});

test('BIL reading sample is added once despite the two shuffled public booklets', () => {
  assert.equal(bilReadingQuestions.length, 10);
  assert.equal(new Set(bilReadingQuestions.map((question) => question.id)).size, 10);
  for (const question of bilReadingQuestions) {
    assert.equal(question.school, 'БИЛ');
    assert.equal(question.subject, 'reading');
    assert.equal(question.options.length, 4);
    assert.ok(question.options.includes(question.answer), question.id);
  }
  assert.equal(mockAvailability('БИЛ').subjects.find((item) => item.subject === 'reading').count, 10);
});

test('official NIS language sample adds 20 questions for each language with the published key', () => {
  const officialKey = [
    'D', 'B', 'A', 'B', 'B', 'D', 'D', 'A', 'A', 'C',
    'C', 'D', 'B', 'B', 'D', 'B', 'B', 'B', 'A', 'C',
    'D', 'C', 'D', 'B', 'B', 'A', 'C', 'A', 'B', 'D',
    'D', 'D', 'A', 'D', 'C', 'C', 'D', 'A', 'B', 'A',
    'B', 'A', 'A', 'D', 'B', 'B', 'C', 'B', 'C', 'C',
    'B', 'A', 'B', 'A', 'B', 'A', 'A', 'C', 'B', 'B',
  ];
  assert.equal(nishOfficialLanguageQuestions.length, 60);
  assert.equal(new Set(nishOfficialLanguageQuestions.map((question) => question.id)).size, 60);
  assert.deepEqual(
    Object.fromEntries(['rus', 'kaz', 'eng'].map((subject) => [subject, nishOfficialLanguageQuestions.filter((question) => question.subject === subject).length])),
    { rus: 20, kaz: 20, eng: 20 },
  );
  for (const [index, question] of nishOfficialLanguageQuestions.entries()) {
    assert.equal(question.school, 'НИШ');
    assert.ok(question.options.length >= 3 && question.options.length <= 4, question.id);
    assert.ok(question.options.includes(question.answer), question.id);
    assert.equal('ABCD'[question.options.indexOf(question.answer)], officialKey[index], question.id);
    assert.ok(question.solution.length > 20, question.id);
    assert.match(question.source, /official language sample \(adapted\)/);
  }
});

test('client and server publish the same current NIS and BIL exam structures', () => {
  assert.deepEqual(MOCK_SPECS, SERVER_SPECS);
  assert.deepEqual(MOCK_SPECS['НИШ'], {
    count: 180, minutes: 240,
    subjects: [['math', 40, 1], ['kolzar', 60, 1], ['science', 20, 1], ['eng', 20, 2], ['rus', 20, 2], ['kaz', 20, 2]],
  });
  assert.deepEqual(MOCK_SPECS['БИЛ'], {
    count: 60, minutes: 110,
    subjects: [['math', 40, 1], ['logic', 10, 1], ['reading', 10, 1]],
  });
});
