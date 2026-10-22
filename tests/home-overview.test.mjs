import test from 'node:test';
import assert from 'node:assert/strict';
import { homeModel, currentDailyCount, loadHomeSections, HOME_ATTEMPT_LIMIT, bindInitialDiagnostic } from '../frontend/src/homeModel.js';

const topics = [
  { id: 'frac', name: 'Бөлшектер', nameRu: 'Дроби', gradableCount: 10 },
  { id: 'num', name: 'Сандар', nameRu: 'Числа', gradableCount: 20 },
  { id: 'empty', name: 'Пустая тема', gradableCount: 0 },
];
const now = new Date('2026-10-21T12:00:00Z');
const daily = { day: '2026-10-21', count: 3, limit: 5 };
const attempt = (topic, correct, at = now) => ({ topic, correct, at });
const result = (completedAt = '2026-10-20T10:00:00Z') => ({ completedAt, topics: [{ trainingTopicId: 'num', pct: 30, total: 3 }, { trainingTopicId: 'frac', pct: 80, total: 3 }] });
const build = (input = {}) => homeModel({ topics, now, ...input });

test('a public diagnostic handoff stays bound to its first student on shared devices', () => {
  const initial = result();
  assert.equal(bindInitialDiagnostic(null, initial, null), null);
  assert.equal(bindInitialDiagnostic(null, {}, 'first'), null);
  const bound = bindInitialDiagnostic(null, initial, 'first');
  assert.equal(bound.result, initial);
  assert.equal(bindInitialDiagnostic(bound, initial, 'second'), bound);
  assert.notEqual(bindInitialDiagnostic(bound, initial, 'second').uid, 'second');
});

test('new students get a diagnostic only when empty personal history is confirmed', () => {
  assert.equal(build().next.kind, 'practice');
  assert.equal(build({ historyReady: true }).next.kind, 'diagnosis');
  assert.equal(build().accuracy, null);
  assert.equal(build().balance, null);
  assert.equal(build().todayCount, null);
});
test('resume uses the most recent valid practice topic and never a removed/empty topic', () => {
  const data = build({ attempts: [attempt('num', true, '2026-10-19'), attempt('empty', false, '2026-10-22'), attempt('frac', false)] });
  assert.equal(data.next.kind, 'continue');
  assert.equal(data.next.topic.id, 'frac');
  assert.equal(build({ attempts: [attempt('curriculum:5:lesson', true)] }).next.tab, 'curriculum');
  assert.equal(build({ diagnostics: [{ topics: [{ trainingTopicId: 'removed', pct: 10 }] }], historyReady: true }).next.tab, 'diagnosis');
});
test('newer diagnostic guides the next topic, newer practice continues the practiced topic', () => {
  assert.equal(build({ attempts: [attempt('frac', true)], diagnostics: [result()] }).next.topic.id, 'frac');
  const data = build({ attempts: [attempt('frac', true)], diagnostics: [result('2026-10-22T10:00:00Z')] });
  assert.equal(data.next.kind, 'recommended');
  assert.equal(data.next.topic.id, 'num');
  assert.equal(data.progressSource, 'diagnostic');
});
test('pending answer or diagnostic is not overwritten by a new topic or exhausted limit', () => {
  const data = { attempts: [attempt('num', true)], daily: { ...daily, count: 5 } };
  assert.deepEqual(build({ ...data, pendingTraining: true, pendingDiagnostic: true }).next, { kind: 'resumeTraining', tab: 'training' });
  assert.deepEqual(build({ ...data, pendingDiagnostic: true }).next, { kind: 'resumeDiagnostic', tab: 'diagnosis' });
  assert.equal(build(data).next.kind, 'done');
  assert.equal(build({ ...data, daily: { ...daily, count: 5, limit: null } }).next.kind, 'continue');
});
test('daily goal resets at midnight in Kazakhstan, independent of the device time zone', () => {
  assert.equal(currentDailyCount(daily, new Date('2026-10-21T18:59:59Z')), 3);
  assert.equal(currentDailyCount(daily, new Date('2026-10-21T19:00:00Z')), null);
  assert.equal(currentDailyCount({ day: '2026-10-22', count: 0 }, new Date('2026-10-21T19:00:00Z')), 0);
  assert.equal(currentDailyCount({ ...daily, count: -1 }, now), null);
  assert.equal(currentDailyCount({ ...daily, count: '4' }, now), null);
});
test('accuracy uses a bounded recent sample, ignores ungraded records and accepts Firestore timestamps', () => {
  const records = Array.from({ length: 150 }, (_, i) => attempt('frac', i >= 100, { seconds: Math.floor(+now / 1000) - i }));
  const data = build({ attempts: [attempt('num', undefined), ...records] });
  assert.equal(data.answerCount, HOME_ATTEMPT_LIMIT);
  assert.equal(data.accuracy, 0);
  assert.equal(data.progressTopics[0].pct, 0);
  const timestamp = { toMillis: () => +now + 1000 };
  assert.equal(build({ attempts: [attempt('num', false), attempt('frac', true, timestamp)] }).next.topic.id, 'frac');
  assert.equal(records.length, 150);
});
test('wallet balance, not lifetime XP, determines reward progress and pending requests', () => {
  const wallet = { xp: 6000, balance: 1000, rewards: [{ id: 'expensive', price: 6000 }, { id: 'book', price: 4500 }], requests: [{ status: 'pending_parent' }] };
  const data = build({ wallet });
  assert.equal(data.balance, 1000);
  assert.equal(data.reward.id, 'book');
  assert.equal(data.coinsLeft, 3500);
  assert.equal(data.pendingReward, true);
  assert.equal(build({ wallet: { ...wallet, balance: 8000 } }).coinsLeft, 0);
  assert.equal(build({ wallet: { xp: 5000 } }).balance, null);
  assert.equal(build({ wallet: { ...wallet, balance: 0, requests: [{ status: 'cancelled' }] } }).pendingReward, false);
});
test('a slow wallet cannot block successful study data and failed data is not reported as zero', async () => {
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const seen = {};
  const all = loadHomeSections({ attempts: () => [], wallet: () => pending, daily: () => { throw Error('offline'); } }, (key, section) => { seen[key] = section; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(seen.attempts.status, 'ready');
  assert.equal(seen.daily.status, 'error');
  assert.equal(seen.daily.value, null);
  assert.equal(seen.wallet, undefined);
  finish({ balance: 4 });
  await all;
  assert.equal(seen.wallet.value.balance, 4);
});
test('account changes/unmount discard late successful and failed responses', async () => {
  let finish, activeUid = 'first';
  const pending = new Promise((resolve) => { finish = resolve; });
  const seen = [];
  const all = loadHomeSections({ wallet: () => pending }, (...args) => seen.push(args), { isCurrent: () => activeUid === 'first' });
  activeUid = 'second';
  finish({ balance: 9000 });
  await all;
  assert.deepEqual(seen, []);
});
test('timed out data can be retried and late results do not overwrite the retry', async () => {
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const seen = [];
  await loadHomeSections({ daily: () => pending }, (_, section) => seen.push(section), { timeoutMs: 10 });
  await loadHomeSections({ daily: () => daily }, (_, section) => seen.push(section));
  finish({ ...daily, count: 99 });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(seen.map((item) => item.status), ['error', 'ready']);
  assert.equal(seen.at(-1).value.count, 3);
});
