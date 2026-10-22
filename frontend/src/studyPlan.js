import { trainingDayKey } from './trainingPersistence.js';

export const STUDY_PLAN_ATTEMPT_LIMIT = 100;
// Explicit names also work in mobile WebViews without Kazakh Intl locale data.
export function studyPlanDate(key, lang = 'kk') {
  const [year, month, day] = String(key).split('-').map(Number);
  if (![year, month, day].every(Number.isInteger) || year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return '';
  const months = lang === 'ru'
    ? ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.']
    : ['қаң.', 'ақп.', 'нау.', 'сәу.', 'мам.', 'мау.', 'шіл.', 'там.', 'қыр.', 'қаз.', 'қар.', 'жел.'];
  return `${day} ${months[month - 1]}`;
}
const DAY_MS = 86400000;

function timestamp(value) {
  if (value == null) return null;
  try {
    const time = value?.toMillis?.() ?? (typeof value?.seconds === 'number'
      ? value.seconds * 1000 : new Date(value).getTime());
    return Number.isFinite(time) ? time : null;
  } catch { return null; }
}

const keyAt = (time) => new Date(time).toISOString().slice(0, 10);
const dayStart = (key) => Date.parse(`${key}T00:00:00+05:00`);

/**
 * A Monday–Sunday plan in the same Kazakhstan day as the server daily limit.
 * Pass only history belonging to the current account, and historyReady=true
 * only after both history requests succeed. A failed/loading request is not an
 * empty history. `attemptLimit` must match the newest-first history query cap.
 *
 * Counts are verified answers (plus the authoritative current-day counter),
 * never local pending answers or diagnostic recommendations. `exact=false`
 * means a lower bound: render a '+' or a limited-history note. An unobserved
 * day has active=null, not false, when it falls outside the history window.
 * Milestone `current` is a real count; clamp only the displayed progress bar.
 * `completedCount=null` means history is unavailable. `next` is only a topic
 * suggestion; the caller must give recovery and daily limits precedence.
 */
export function studyPlan({ attempts = [], diagnostics = [], daily, topics = [],
  now = new Date(), historyReady = false, attemptLimit = STUDY_PLAN_ATTEMPT_LIMIT } = {}) {
  const nowTime = timestamp(now);
  if (nowTime === null) throw new TypeError('studyPlan requires a valid current date');
  const today = trainingDayKey(new Date(nowTime));
  const calendarToday = Date.parse(`${today}T00:00:00Z`);
  const monday = calendarToday - ((new Date(calendarToday).getUTCDay() + 6) % 7) * DAY_MS;
  const start = keyAt(monday), end = keyAt(monday + 6 * DAY_MS);
  const startTime = dayStart(start);
  const ready = historyReady && Array.isArray(attempts) && Array.isArray(diagnostics);
  const rows = ready ? attempts : [];
  const cap = Number.isSafeInteger(attemptLimit) && attemptLimit > 0 ? attemptLimit : STUDY_PLAN_ATTEMPT_LIMIT;
  const dated = rows.map((attempt) => ({ attempt, time: timestamp(attempt?.at) }));
  const badDates = dated.some(({ time }) => time === null || time > nowTime);
  const oldest = dated.length && !badDates ? Math.min(...dated.map(({ time }) => time)) : null;
  const historyComplete = ready && !badDates && (rows.length < cap || oldest < startTime);
  const answers = dated.filter(({ attempt, time }) => time !== null && time >= startTime && time <= nowTime
    && attempt.verified === true && typeof attempt.correct === 'boolean');
  const todayCount = daily?.day === today && Number.isFinite(daily?.count) && daily.count >= 0
    ? Math.floor(daily.count) : null;
  const counts = new Map();
  for (const { time } of answers) {
    const key = trainingDayKey(new Date(time));
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = keyAt(monday + index * DAY_MS), isToday = key === today, isFuture = key > today;
    const observed = counts.get(key) || 0;
    const dailyKnown = isToday && todayCount !== null;
    const exact = isFuture || (dailyKnown && todayCount >= observed)
      || (ready && !badDates && (historyComplete || (oldest !== null && oldest < dayStart(key))));
    const count = isFuture ? 0 : dailyKnown ? Math.max(todayCount, observed)
      : ready && (observed > 0 || exact) ? observed : null;
    return { key, index, isToday, isFuture, count, active: count > 0 ? true : exact ? false : null, exact };
  });
  const pastAndToday = days.filter((day) => !day.isFuture);
  const weeklyAnswerCount = ready ? pastAndToday.reduce((sum, day) => sum + (day.count || 0), 0) : null;
  const weeklyStudyDays = ready ? pastAndToday.filter((day) => day.active === true).length : null;
  const answersExact = ready && pastAndToday.every((day) => day.exact);
  const daysExact = ready && pastAndToday.every((day) => day.active !== null);

  const catalog = new Map(topics.filter((topic) => topic.gradableCount > 0).map((topic) => [topic.id, topic]));
  const diagnostic = (ready ? diagnostics : []).map((result) => ({ result, time: timestamp(result?.completedAt) }))
    .filter(({ result, time }) => result.verified === true && time !== null && time <= nowTime && Array.isArray(result.topics))
    .sort((a, b) => b.time - a.time)[0];
  const weakest = (diagnostic?.result.topics || [])
    .filter((item) => catalog.has(item.trainingTopicId) && Number.isFinite(item.pct) && item.pct >= 0 && item.pct <= 100)
    .sort((a, b) => a.pct - b.pct)[0];
  const reviewTopic = weakest ? catalog.get(weakest.trainingTopicId) : null;
  const reviewCount = ready ? answers.filter(({ attempt, time }) => reviewTopic && time > diagnostic.time
    && attempt.topic === reviewTopic.id && attempt.correct === true).length : null;
  const reviewExact = ready && (!reviewTopic || historyComplete
    || (!badDates && oldest !== null && oldest < Math.max(startTime, diagnostic.time)));
  const review = {
    topic: reviewTopic, correctCount: reviewCount, target: 3, done: reviewCount !== null && reviewCount >= 3,
    exact: reviewExact, needsDiagnostic: ready && !reviewTopic,
    diagnosticAt: diagnostic ? new Date(diagnostic.time).toISOString() : null,
  };
  const milestones = [
    { id: 'days', current: weeklyStudyDays, target: 3, done: weeklyStudyDays !== null && weeklyStudyDays >= 3, exact: daysExact },
    { id: 'answers', current: weeklyAnswerCount, target: 15, done: weeklyAnswerCount !== null && weeklyAnswerCount >= 15, exact: answersExact },
    { id: 'review', current: reviewCount, target: 3, done: review.done, exact: reviewExact, topic: reviewTopic },
  ];
  return {
    week: { start, end, today }, days, milestones, historyComplete,
    completedCount: ready ? milestones.filter((item) => item.done).length : null,
    totalMilestones: milestones.length, weeklyAnswerCount, weeklyStudyDays, review,
    // A clipped history cannot prove that an older review is unfinished. Keep
    // its card available, but do not displace the student's current practice.
    next: ready && reviewTopic && review.exact && !review.done ? { kind: 'review', tab: 'training', topic: reviewTopic } : null,
  };
}
