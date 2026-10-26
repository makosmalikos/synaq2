import { trainingDayKey } from './trainingPersistence.js';

const DAY = 86400000;
const timestamp = (item) => {
  try {
    const value = item?.at;
    const time = value?.toMillis?.() ?? (typeof value?.seconds === 'number' ? value.seconds * 1000
      : value != null ? new Date(value).getTime() : Date.parse(item?.completedAt || ''));
    return Number.isFinite(time) ? time : 0;
  } catch { return 0; }
};
const gradedMock = (item, now) => Number.isFinite(item?.gradable) && item.gradable > 0
  && Number.isFinite(item.score) && timestamp(item) > 0 && timestamp(item) <= now;
const accuracy = (items) => items.length ? Math.round(items.filter(a => a.correct === true).length / items.length * 100) : null;

const SCHOOL_CODES = ['РФМШ', 'НИШ', 'БИЛ'];

function schoolReadiness(mocks, now) {
  return SCHOOL_CODES.map(code => {
    const items = mocks
      .filter(m => m.school === code && gradedMock(m, now))
      .sort((a, b) => timestamp(a) - timestamp(b));
    const percentages = items.map(m => Math.min(100, Math.max(0, Math.round(m.score / m.gradable * 100))));
    return { code, count: items.length, latestResult: items.at(-1) || null, last: percentages.at(-1) ?? null, best: percentages.length ? Math.max(...percentages) : null };
  });
}

export function parentSummary(attempts = [], mocks = [], topics = [], now = Date.now()) {
  // Match the student's verified answers and Kazakhstan calendar even abroad.
  const today = Date.parse(`${trainingDayKey(new Date(now))}T00:00:00+05:00`);
  const start = today - 6 * DAY, previous = start - 7 * DAY;
  const rows = attempts.slice(0, 500);
  const dated = rows.filter(a => timestamp(a) > 0 && timestamp(a) <= now);
  const valid = dated.filter(a => a.verified === true && typeof a.correct === 'boolean');
  const comparisonComplete = rows.length < 500 || (dated.length === rows.length && Math.min(...dated.map(timestamp)) < previous);
  const current = valid.filter(a => timestamp(a) >= start);
  const before = valid.filter(a => timestamp(a) >= previous && timestamp(a) < start);
  const validMocks = mocks.filter(a => gradedMock(a, now));
  const days = Array.from({ length: 7 }, (_, i) => {
    const time = start + i * DAY, date = new Date(time);
    const items = current.filter(a => timestamp(a) >= time && timestamp(a) < time + DAY);
    const tests = validMocks.filter(a => timestamp(a) >= time && timestamp(a) < time + DAY);
    return { date, count: items.length, active: items.length > 0 || tests.length > 0, seconds: items.reduce((n, a) => n + (Number.isFinite(a.secs) ? Math.max(0, a.secs) : 0), 0) };
  });
  const topicResults = topics.map(topic => {
    const items = valid.filter(a => a.topic === topic.id);
    const recent = current.filter(a => a.topic === topic.id);
    const old = before.filter(a => a.topic === topic.id);
    return { ...topic, count: items.length, pct: accuracy(items), delta: comparisonComplete && recent.length >= 5 && old.length >= 5 ? accuracy(recent) - accuracy(old) : null };
  }).filter(a => a.count > 0);
  const weak = topicResults.filter(a => a.count >= 3 && a.pct < 70).sort((a, b) => a.pct - b.pct);
  const improved = topicResults.filter(a => a.delta > 0).sort((a, b) => b.delta - a.delta);
  const tests = validMocks.sort((a, b) => timestamp(a) - timestamp(b)).slice(-6).map(a => ({ ...a, date: new Date(timestamp(a)), pct: Math.min(100, Math.max(0, Math.round(a.score / a.gradable * 100))) }));
  return { schools: schoolReadiness(validMocks, now), currentCount: current.length, accuracy: accuracy(current), delta: comparisonComplete && current.length >= 5 && before.length >= 5 ? accuracy(current) - accuracy(before) : null, days, topics: topicResults, weak, improved, mastered: topicResults.filter(a => a.count >= 10 && a.pct >= 70).length, tests, lastAt: Math.max(0, ...valid.map(timestamp), ...validMocks.map(timestamp)), seconds: days.reduce((n, a) => n + a.seconds, 0) };
}
