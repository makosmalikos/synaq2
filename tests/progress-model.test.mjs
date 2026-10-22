import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProgressModel, formatProgressDate, PROGRESS_ATTEMPT_LIMIT } from '../frontend/src/progressModel.js';

const now = new Date('2026-10-22T07:00:00Z');
const topics = [
  { id: 'fractions', name: 'Бөлшектер', nameRu: 'Дроби', gradableCount: 20 },
  { id: 'geometry', name: 'Геометрия', nameRu: 'Геометрия', gradableCount: 30 },
  { id: 'retired', name: 'Ескі тақырып', gradableCount: 0 },
];
const answer = (topic, correct, extra = {}) => ({ topic, correct, verified: true, at: '2026-10-21T15:00:00Z', secs: 30, ...extra });
const model = (attempts, extra = {}) => buildProgressModel({ attempts, topics, now, ...extra });

test('history dates use explicit Kazakh month names and the same Kazakhstan date as the plan', () => {
  const at = { seconds: Date.parse('2026-10-21T19:05:00Z') / 1000 };
  assert.equal(formatProgressDate(at, 'kk'), '22 қаз., 00:05');
  assert.equal(formatProgressDate(at, 'ru'), '22 окт., 00:05');
  assert.equal(formatProgressDate('invalid', 'kk'), '');
  assert.equal(formatProgressDate(null, 'kk'), '');
});

test('next topic is supported by actual verified errors, with exact counts rather than rounded reconstruction', () => {
  const result = model([
    answer('geometry', true), answer('geometry', false), answer('geometry', true),
    answer('fractions', false), answer('fractions', false), answer('fractions', true),
    answer('geometry', false, { verified: false }), answer('geometry', false, { verified: undefined }),
    answer('fractions', 'false'), answer('fractions', null),
  ]);
  assert.equal(result.next.kind, 'review');
  assert.equal(result.next.topic.id, 'fractions');
  assert.equal(result.next.topic.total, 3);
  assert.equal(result.next.topic.correct, 1);
  assert.equal(result.next.topic.wrong, 2);
  assert.equal(result.next.topic.pct, 33);
  assert.equal(result.answerCount, 6);
  assert.equal(result.correct, 3);
  assert.equal(result.accuracy, 50);
  assert.equal(result.totalSeconds, 180);
});

test('unknown and unavailable topics do not become practice destinations', () => {
  const result = model([answer('missing', false), answer('retired', false), answer('geometry', true)]);
  assert.equal(result.answerCount, 3);
  assert.equal(result.accuracy, 33);
  assert.equal(result.topics.length, 2);
  assert.equal(result.topics.find(topic => topic.id === 'retired').canPractice, false);
  assert.equal(result.next.topic.id, 'geometry');
  assert.equal(result.next.kind, 'continue');
  assert.equal(model([answer('missing', false), answer('retired', false)]).next, null);
});

test('a perfect result continues an observed topic without inventing an error or mastered level', () => {
  const result = model([answer('geometry', true), answer('geometry', true), answer('fractions', true)]);
  assert.equal(result.next.kind, 'continue');
  assert.equal(result.next.topic.id, 'fractions');
  assert.equal(result.next.topic.wrong, 0);
  assert.equal(result.accuracy, 100);
  assert.equal('readiness' in result, false);
});

test('no verified answers is an empty result with unknown accuracy, never zero percent', () => {
  for (const attempts of [[], [answer('geometry', false, { verified: false })]]) {
    const result = model(attempts);
    assert.equal(result.accuracy, null);
    assert.equal(result.next, null);
    assert.equal(result.answerCount, 0);
    assert.deepEqual(result.topics, []);
    assert.equal(result.totalSeconds, 0);
  }
});

test('future and invalid dates are not evidence; Firestore timestamps and ISO dates are supported', () => {
  const result = model([
    answer('geometry', false, { at: '2026-10-23T00:00:00Z' }),
    answer('geometry', false, { at: null }), answer('geometry', false, { at: 'invalid' }),
    answer('geometry', true, { at: { seconds: Date.parse('2026-10-20T06:00:00Z') / 1000 } }),
    answer('geometry', true, { at: { toMillis: () => Date.parse('2026-10-21T06:00:00Z') } }),
  ]);
  assert.equal(result.answerCount, 2);
  assert.equal(result.next.kind, 'continue');
  assert.equal(result.accuracy, 100);
});

test('weekly practice uses Kazakhstan Monday, retains seconds, and excludes negative or nonfinite time', () => {
  const result = model([
    answer('geometry', true, { at: '2026-10-18T18:59:59Z', secs: 999 }),
    answer('geometry', true, { at: '2026-10-18T19:00:00Z', secs: 20 }),
    answer('geometry', true, { at: '2026-10-19T18:59:59Z', secs: 25 }),
    answer('geometry', true, { at: '2026-10-19T19:00:00Z', secs: 10 }),
    answer('geometry', true, { secs: -10 }), answer('geometry', true, { secs: Infinity }),
    answer('geometry', true, { secs: '45' }),
  ]);
  assert.equal(result.week[0].key, '2026-10-19');
  assert.equal(result.week[0].seconds, 45);
  assert.equal(result.week[1].seconds, 10);
  assert.equal(result.totalSeconds, 55);
});

test('the bounded newest-first history is disclosed and does not pull in records beyond the query cap', () => {
  const attempts = Array.from({ length: PROGRESS_ATTEMPT_LIMIT }, () => answer('geometry', true));
  attempts.push(answer('geometry', false));
  const result = model(attempts);
  assert.equal(result.answerCount, 500);
  assert.equal(result.accuracy, 100);
  assert.equal(result.historyLimited, true);
  assert.equal(model(attempts.slice(0, 499)).historyLimited, false);
});

test('building progress never mutates caller-owned history or topic metadata', () => {
  const attempts = Object.freeze([Object.freeze(answer('geometry', false)), Object.freeze(answer('fractions', true))]);
  const catalog = Object.freeze(topics.map(topic => Object.freeze({ ...topic })));
  const result = model(attempts, { topics: catalog });
  assert.equal(result.next.topic.id, 'geometry');
  assert.equal(catalog[1].total, undefined);
  assert.equal(attempts[0].topic, 'geometry');
});
