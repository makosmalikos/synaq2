import { trainingDayKey } from './trainingPersistence.js';
import { studyPlanDate } from './studyPlan.js';

export const PROGRESS_ATTEMPT_LIMIT = 500;

function timestamp(at) {
  if (at == null) return null;
  try {
    const time = at?.toMillis?.() ?? (typeof at?.seconds === 'number' ? at.seconds * 1000 : new Date(at).getTime());
    return Number.isFinite(time) ? time : null;
  } catch { return null; }
}

export function formatProgressDate(at, lang = 'kk') {
  const time = timestamp(at);
  if (time === null) return '';
  const date = new Date(time);
  const clock = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit' }).format(date);
  return `${studyPlanDate(trainingDayKey(date), lang)}, ${clock}`;
}

// These are answer counts from the bounded practice history, not unique tasks
// mastered or an estimate of exam readiness. Unknown topics still contribute
// to overall accuracy, but cannot become a practice destination.
export function buildProgressModel({ attempts = [], topics = [], now = new Date() } = {}) {
  const nowTime = timestamp(now);
  if (nowTime === null) throw new TypeError('A valid date is required');
  const rows = attempts.slice(0, PROGRESS_ATTEMPT_LIMIT);
  const answers = rows.map((answer) => ({ answer, time: timestamp(answer?.at) }))
    .filter(({ answer, time }) => answer?.verified === true && typeof answer.correct === 'boolean'
      && time !== null && time <= nowTime);
  const catalog = new Map(topics.map((topic) => [topic.id, topic]));
  const groups = new Map();
  for (const { answer, time } of answers) {
    if (!catalog.has(answer.topic)) continue;
    const group = groups.get(answer.topic) || { ...catalog.get(answer.topic), total: 0, correct: 0, lastAt: 0 };
    group.total++;
    if (answer.correct) group.correct++;
    group.lastAt = Math.max(group.lastAt, time);
    groups.set(answer.topic, group);
  }
  const results = [...groups.values()].map((group) => ({ ...group,
    wrong: group.total - group.correct, pct: Math.round(100 * group.correct / group.total),
    canPractice: group.gradableCount > 0,
  })).sort((a, b) => a.pct - b.pct || b.wrong - a.wrong || b.total - a.total || a.id.localeCompare(b.id));
  const practice = results.filter((topic) => topic.canPractice);
  const withErrors = practice.find((topic) => topic.wrong > 0);
  const next = withErrors ? { kind: 'review', topic: withErrors }
    : practice.length ? { kind: 'continue', topic: [...practice].sort((a, b) => a.total - b.total || b.lastAt - a.lastAt)[0] }
      : null;

  // Use the same Kazakhstan day as training limits and the home weekly plan.
  const today = trainingDayKey(new Date(nowTime));
  const todayUtc = Date.parse(`${today}T00:00:00Z`);
  const monday = todayUtc - ((new Date(todayUtc).getUTCDay() + 6) % 7) * 86400000;
  const week = Array.from({ length: 7 }, (_, index) => ({
    key: new Date(monday + index * 86400000).toISOString().slice(0, 10), index, seconds: 0,
  }));
  const weekStart = Date.parse(`${week[0].key}T00:00:00+05:00`);
  for (const { answer, time } of answers) {
    const day = week[Math.floor((time - weekStart) / 86400000)];
    if (day && typeof answer.secs === 'number' && Number.isFinite(answer.secs)) day.seconds += Math.max(0, answer.secs);
  }
  const correct = answers.filter(({ answer }) => answer.correct).length;
  return { topics: results, next, answerCount: answers.length, correct, wrong: answers.length - correct,
    accuracy: answers.length ? Math.round(100 * correct / answers.length) : null,
    historyLimited: attempts.length >= PROGRESS_ATTEMPT_LIMIT,
    week, totalSeconds: week.reduce((sum, day) => sum + day.seconds, 0),
  };
}
