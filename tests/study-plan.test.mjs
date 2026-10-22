import test from 'node:test';
import assert from 'node:assert/strict';
import { studyPlan, studyPlanDate } from '../frontend/src/studyPlan.js';
import { homeModel } from '../frontend/src/homeModel.js';

const now = new Date('2026-10-22T12:00:00Z');
const topics = [{ id: 'num', gradableCount: 10 }, { id: 'frac', gradableCount: 10 }, { id: 'empty', gradableCount: 0 }];
const answer = (at, extra = {}) => ({ at, topic: 'num', correct: true, verified: true, ...extra });
const diagnostic = (extra = {}) => ({ completedAt: '2026-10-19T08:00:00Z', verified: true,
  topics: [{ trainingTopicId: 'num', pct: 25 }, { trainingTopicId: 'frac', pct: 75 }], ...extra });
const build = (extra = {}) => studyPlan({ now, topics, historyReady: true, ...extra });

test('weekly date labels keep Kazakh month names even without a WebView locale pack', () => {
  assert.equal(studyPlanDate('2026-10-19', 'kk'), '19 қаз.');
  assert.equal(studyPlanDate('2026-10-19', 'ru'), '19 окт.');
  assert.equal(studyPlanDate('2027-01-03', 'kk'), '3 қаң.');
  assert.equal(studyPlanDate('invalid', 'kk'), '');
});

test('week and day boundaries use Kazakhstan Monday–Sunday, including year rollover', () => {
  const sunday = build({ now: new Date('2026-10-25T18:59:59Z') });
  assert.deepEqual(sunday.week, { start: '2026-10-19', end: '2026-10-25', today: '2026-10-25' });
  const monday = build({ now: new Date('2026-10-25T19:00:00Z') });
  assert.deepEqual(monday.week, { start: '2026-10-26', end: '2026-11-01', today: '2026-10-26' });
  assert.equal(monday.days[0].isToday, true);
  assert.equal(monday.days.filter((day) => day.isFuture).length, 6);
  assert.deepEqual(build({ now: new Date('2027-01-01T00:00:00Z') }).week,
    { start: '2026-12-28', end: '2027-01-03', today: '2027-01-01' });
});

test('loading or failed history stays unknown, while a confirmed empty week starts at zero', () => {
  const unknown = build({ historyReady: false, attempts: [answer(now)], diagnostics: [diagnostic()] });
  assert.equal(unknown.completedCount, null);
  assert.equal(unknown.weeklyAnswerCount, null);
  assert.equal(unknown.weeklyStudyDays, null);
  assert.equal(unknown.days[0].active, null);
  assert.equal(unknown.next, null);
  assert.ok(unknown.milestones.every((item) => item.current === null && !item.done));
  const empty = build();
  assert.equal(empty.weeklyAnswerCount, 0);
  assert.equal(empty.completedCount, 0);
  assert.equal(empty.historyComplete, true);
  assert.equal(empty.review.needsDiagnostic, true);
  assert.equal(empty.days[0].active, false);
});

test('three days, fifteen verified answers and three correct answers after diagnosis complete the plan', () => {
  const attempts = ['2026-10-19T09:00:00Z', '2026-10-20T09:00:00Z', '2026-10-21T09:00:00Z']
    .flatMap((at) => Array.from({ length: 5 }, () => answer(at)));
  const plan = build({ attempts, diagnostics: [diagnostic()] });
  assert.equal(plan.weeklyAnswerCount, 15);
  assert.equal(plan.weeklyStudyDays, 3);
  assert.equal(plan.completedCount, 3);
  assert.deepEqual(plan.days.map((day) => day.count), [5, 5, 5, 0, 0, 0, 0]);
  assert.ok(plan.milestones.every((milestone) => milestone.done && milestone.exact));
  assert.equal(plan.next, null);
});

test('only verified graded answers in this week count; invalid and future records cannot create activity', () => {
  const plan = build({ attempts: [
    answer('2026-10-18T18:59:59Z'), answer('2026-10-18T19:00:00Z'),
    answer('2026-10-19T12:00:00Z', { verified: false }), answer('2026-10-19T12:00:00Z', { correct: undefined }),
    answer('2026-10-23T12:00:00Z'), answer('not-a-date'), answer({ seconds: Date.parse('2026-10-21T19:00:00Z') / 1000 }),
  ] });
  assert.equal(plan.weeklyAnswerCount, 2);
  assert.equal(plan.weeklyStudyDays, 2);
  assert.equal(plan.days[0].count, 1);
  assert.equal(plan.days[3].count, 1);
  assert.equal(plan.days[1].active, null);
  assert.equal(plan.days[4].active, false);
  assert.equal(plan.historyComplete, false);
});

test('the server daily counter fills the current day without double-counting its attempt history', () => {
  const attempts = [answer('2026-10-20T09:00:00Z'), answer('2026-10-22T09:00:00Z')];
  const plan = build({ attempts, daily: { day: '2026-10-22', count: 4 } });
  assert.equal(plan.weeklyAnswerCount, 5);
  assert.equal(plan.days[3].count, 4);
  assert.equal(plan.days[3].exact, true);
  assert.equal(build({ attempts, daily: { day: '2026-10-21', count: 100 } }).weeklyAnswerCount, 2);
  assert.equal(build({ attempts, daily: { day: '2026-10-22', count: -1 } }).weeklyAnswerCount, 2);
  assert.equal(build({ historyReady: false, daily: { day: '2026-10-22', count: 2 } }).days[3].count, 2);
});

test('a capped history exposes lower bounds and unknown earlier days instead of false whole-week totals', () => {
  const attempts = Array.from({ length: 100 }, () => answer('2026-10-21T09:00:00Z'));
  const plan = build({ attempts });
  assert.equal(plan.historyComplete, false);
  assert.equal(plan.weeklyAnswerCount, 100);
  assert.equal(plan.milestones[1].done, true);
  assert.equal(plan.milestones[1].exact, false);
  assert.equal(plan.milestones[0].exact, false);
  assert.equal(plan.days[0].active, null);
  assert.equal(plan.days[0].count, null);
  assert.equal(plan.days[2].active, true);
  assert.equal(plan.days[2].exact, false);
  assert.equal(plan.days[3].active, false);
  assert.equal(plan.days[3].exact, true);
  const coversWeek = build({ attempts: [...attempts.slice(1), answer('2026-10-18T10:00:00Z')] });
  assert.equal(coversWeek.historyComplete, true);
  assert.equal(coversWeek.weeklyAnswerCount, 99);
  assert.equal(coversWeek.days[0].active, false);
});

test('review uses the latest verified diagnostic and only later verified correct answers for its weakest available topic', () => {
  const plan = build({ diagnostics: [
    diagnostic(), diagnostic({ completedAt: 'invalid', topics: [{ trainingTopicId: 'frac', pct: 0 }] }),
    diagnostic({ completedAt: '2026-10-23T00:00:00Z', topics: [{ trainingTopicId: 'frac', pct: 0 }] }),
    diagnostic({ verified: false, completedAt: '2026-10-22T00:00:00Z', topics: [{ trainingTopicId: 'frac', pct: 0 }] }),
  ], attempts: [
    answer('2026-10-19T07:00:00Z'), answer('2026-10-19T08:00:00Z'),
    answer('2026-10-19T09:00:00Z', { correct: false }), answer('2026-10-19T09:00:00Z', { verified: false }),
    answer('2026-10-19T09:00:00Z', { topic: 'frac' }), answer('2026-10-19T09:00:00Z'),
    answer({ toMillis: () => Date.parse('2026-10-19T10:00:00Z') }),
  ] });
  assert.equal(plan.review.correctCount, 2);
  assert.equal(plan.review.topic.id, 'num');
  assert.equal(plan.review.done, false);
  assert.deepEqual(plan.next, { kind: 'review', tab: 'training', topic: topics[0] });
  const noTopic = build({ diagnostics: [diagnostic({ topics: [{ trainingTopicId: 'removed', pct: 0 }, { trainingTopicId: 'empty', pct: 0 }] })] });
  assert.equal(noTopic.next, null);
  assert.equal(noTopic.review.needsDiagnostic, true);
});

test('review completion resets each week and public recommendations cannot complete it', () => {
  const attempts = Array.from({ length: 3 }, () => answer('2026-10-20T09:00:00Z'));
  assert.equal(build({ attempts, diagnostics: [diagnostic()] }).review.done, true);
  assert.equal(build({ now: new Date('2026-10-26T09:00:00Z'), attempts, diagnostics: [diagnostic()] }).review.done, false);
  assert.equal(build({ attempts, diagnostics: [diagnostic({ verified: false, source: 'public' })] }).review.done, false);
});

test('a weak-topic suggestion respects pending training, diagnostic recovery and the daily limit', () => {
  const input = { now, topics, historyReady: true, diagnostics: [diagnostic()], attempts: [answer('2026-10-22T09:00:00Z', { topic: 'frac' })] };
  assert.equal(homeModel(input).next.kind, 'review');
  assert.equal(homeModel(input).next.topic.id, 'num');
  assert.equal(homeModel({ ...input, pendingTraining: true, pendingDiagnostic: true }).next.kind, 'resumeTraining');
  assert.equal(homeModel({ ...input, pendingDiagnostic: true }).next.kind, 'resumeDiagnostic');
  assert.equal(homeModel({ ...input, daily: { day: '2026-10-22', count: 5, limit: 5 } }).next.kind, 'done');
  assert.equal(homeModel({ ...input, historyReady: false }).next.kind, 'continue');
});

test('finishing the three verified review answers restores continuation of the most recent practice topic', () => {
  const attempts = [
    ...Array.from({ length: 3 }, (_, index) => answer(`2026-10-20T09:00:0${index}Z`)),
    answer('2026-10-22T09:00:00Z', { topic: 'frac' }),
  ];
  const model = homeModel({ now, topics, attempts, diagnostics: [diagnostic()], historyReady: true });
  assert.equal(model.plan.review.done, true);
  assert.equal(model.plan.next, null);
  assert.equal(model.next.kind, 'continue');
  assert.equal(model.next.topic.id, 'frac');
});

test('a clipped review history keeps its optional topic without displacing current practice', () => {
  const attempts = Array.from({ length: 100 }, () => answer('2026-10-21T09:00:00Z', { topic: 'frac' }));
  const model = homeModel({ now, topics, attempts, diagnostics: [diagnostic()], historyReady: true });
  assert.equal(model.plan.review.exact, false);
  assert.equal(model.plan.review.topic.id, 'num');
  assert.equal(model.plan.review.done, false);
  assert.equal(model.plan.next, null);
  assert.equal(model.next.kind, 'continue');
  assert.equal(model.next.topic.id, 'frac');
});
