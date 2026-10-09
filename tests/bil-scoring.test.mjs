import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { scorePublicMock } from '../frontend/src/publicMockScoring.js';
import { createPublicDiagnosticResult } from '../frontend/src/diagnosticPlan.js';
import { mockDisplayScore, mockSeries } from '../frontend/src/analytics.js';

const require = createRequire(import.meta.url);
const { scoreBil } = require('../backend/lib/bil-scoring');

test('BIL awards +4, subtracts 1 per wrong answer and leaves skips at zero', () => {
  assert.deepEqual(scoreBil(1, 4, 60), {
    scoring: 'bil', score: 1, wrong: 4, unanswered: 55, points: 0, maxPoints: 240,
  });
  assert.equal(scoreBil(2, 1, 60).points, 7);
  assert.equal(scoreBil(0, 1, 60).points, -1);
});

test('public BIL result uses the same points while ordinary mocks keep percent correct', () => {
  const questions = [
    { id: 'a', topic: 'math', answer: 'A' },
    { id: 'b', topic: 'math', answer: 'B' },
    { id: 'c', topic: 'logic', answer: 'C' },
    { id: 'd', topic: 'logic', answer: 'D' },
    { id: 'e', topic: 'reading', answer: 'A' },
    { id: 'f', topic: 'reading', answer: 'B' },
  ];
  const answers = { a: 'A', b: 'A', c: 'A', d: 'A', e: 'B' };
  const bil = scorePublicMock(questions, answers, 'БИЛ');
  assert.deepEqual([bil.correct, bil.wrong, bil.unanswered, bil.points, bil.maxPoints, bil.pct], [1, 4, 1, 0, 24, 0]);
  assert.equal(bil.mistakes.length, 5);
  const saved = createPublicDiagnosticResult({ grade: 6, target: 'БИЛ', report: bil });
  assert.deepEqual([saved.points, saved.maxPoints, saved.wrong, saved.unanswered], [0, 24, 4, 1]);
  const nis = scorePublicMock(questions, answers, 'НИШ');
  assert.deepEqual([nis.points, nis.maxPoints, nis.pct], [1, 6, 17]);
});

test('history recalculates legacy BIL results with the official formula', () => {
  const old = { school: 'БИЛ', score: 20, wrong: 8, gradable: 60, points: 27, maxPoints: 90, at: { seconds: 1 } };
  assert.deepEqual(mockDisplayScore(old), { score: 72, max: 240 });
  assert.deepEqual(mockSeries([old]).map(({ score, max }) => [score, max]), [[72, 240]]);
});
