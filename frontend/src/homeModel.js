import { trainingDayKey } from './trainingPersistence.js';
import { studyPlan, STUDY_PLAN_ATTEMPT_LIMIT } from './studyPlan.js';

export const HOME_ATTEMPT_LIMIT = STUDY_PLAN_ATTEMPT_LIMIT;
export const DAILY_GOAL = 5;

export function bindInitialDiagnostic(previous, result, uid) {
  if (previous || !uid || !Array.isArray(result?.topics)) return previous;
  return { uid, result };
}

export function attemptTime(at) {
  const value = at?.toMillis?.() ?? (typeof at?.seconds === 'number' ? at.seconds * 1000 : new Date(at).getTime());
  return Number.isFinite(value) ? value : 0;
}

export function currentDailyCount(daily, now = new Date()) {
  if (daily?.day !== trainingDayKey(now) || !Number.isFinite(daily?.count) || daily.count < 0) return null;
  return Math.floor(daily.count);
}

export function homeModel({ attempts = [], diagnostics = [], topics = [], daily, wallet,
  pendingTraining = false, pendingDiagnostic = false, historyReady = false, now = new Date() } = {}) {
  const catalog = new Map(topics.filter((topic) => topic.gradableCount > 0).map((topic) => [topic.id, topic]));
  const answers = attempts.filter((item) => typeof item.correct === 'boolean')
    .sort((a, b) => attemptTime(b.at) - attemptTime(a.at)).slice(0, HOME_ATTEMPT_LIMIT);
  const groups = new Map();
  for (const answer of answers) {
    if (!catalog.has(answer.topic)) continue;
    const group = groups.get(answer.topic) || { topic: catalog.get(answer.topic), correct: 0, total: 0 };
    group.total++;
    if (answer.correct) group.correct++;
    groups.set(answer.topic, group);
  }
  const practiceTopics = [...groups.values()].map((group) => ({ ...group, pct: Math.round(100 * group.correct / group.total) }))
    .sort((a, b) => a.pct - b.pct || b.total - a.total);
  const diagnostic = [...diagnostics].sort((a, b) => attemptTime(b.completedAt) - attemptTime(a.completedAt))[0];
  const diagnosticTopics = (diagnostic?.topics || []).filter((item) => catalog.has(item.trainingTopicId) && Number.isFinite(item.pct))
    .map((item) => ({ ...item, topic: catalog.get(item.trainingTopicId), pct: Math.max(0, Math.min(100, item.pct)) }))
    .sort((a, b) => a.pct - b.pct);
  const recent = answers.find((item) => catalog.has(item.topic));
  const diagnosticIsNewer = diagnostic && attemptTime(diagnostic.completedAt) > attemptTime(answers[0]?.at);
  const progressTopics = diagnosticIsNewer || !practiceTopics.length ? diagnosticTopics : practiceTopics;
  const weak = progressTopics.find((item) => item.pct < 70);
  const todayCount = currentDailyCount(daily, now);
  const limitReached = todayCount !== null && Number.isFinite(daily.limit) && daily.limit > 0 && todayCount >= daily.limit;
  const plan = studyPlan({ attempts, diagnostics, daily, topics, historyReady, now });

  // Recovery owns its topic/session. Opening a different topic must not replace
  // an answer waiting for acknowledgement or an unfinished diagnostic.
  let next = { kind: 'practice', tab: 'training' };
  if (pendingTraining) next = { kind: 'resumeTraining', tab: 'training' };
  else if (pendingDiagnostic) next = { kind: 'resumeDiagnostic', tab: 'diagnosis' };
  else if (limitReached) next = { kind: 'done', tab: 'progress' };
  else if (plan.next) next = plan.next;
  else if (diagnosticIsNewer && diagnosticTopics.length) next = { kind: 'recommended', topic: diagnosticTopics[0].topic };
  else if (recent) next = { kind: 'continue', topic: catalog.get(recent.topic) };
  else if (answers.length) next = { kind: 'lessons', tab: 'curriculum' };
  else if (diagnosticTopics.length) next = { kind: 'recommended', topic: diagnosticTopics[0].topic };
  else if (historyReady) next = { kind: 'diagnosis', tab: 'diagnosis' };

  const balance = Number.isFinite(wallet?.balance) && wallet.balance >= 0 ? Math.floor(wallet.balance) : null;
  const reward = [...(wallet?.rewards || [])].filter((item) => Number.isFinite(item.price) && item.price > 0)
    .sort((a, b) => a.price - b.price)[0];
  return {
    next, weak, todayCount, limitReached, plan,
    accuracy: answers.length ? Math.round(100 * answers.filter((item) => item.correct).length / answers.length) : null,
    answerCount: answers.length, progressTopics: progressTopics.slice(0, 3),
    progressSource: diagnosticIsNewer || !practiceTopics.length ? 'diagnostic' : 'practice',
    fromPublicDiagnostic: (diagnosticIsNewer || !practiceTopics.length) && diagnostic?.source === 'public',
    balance, reward, coinsLeft: balance !== null && reward ? Math.max(0, reward.price - balance) : null,
    pendingReward: (wallet?.requests || []).some((item) => ['pending_parent', 'pending_fulfillment'].includes(item.status)),
  };
}

export const emptyHomeOverview = () => Object.fromEntries(['attempts', 'diagnostics', 'daily', 'wallet']
  .map((key) => [key, { status: 'loading', value: null }]));

// Resolve independently: a slow rewards endpoint must not hide the study plan.
// Timeouts only bound this screen; late responses and previous accounts cannot
// update it. Firebase requests themselves may finish after the screen unmounts.
export async function loadHomeSections(loaders, onSection, { isCurrent = () => true, timeoutMs = 12000 } = {}) {
  return Promise.allSettled(Object.entries(loaders).map(async ([key, load]) => {
    let timer;
    try {
      const value = await Promise.race([
        Promise.resolve().then(load),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('home-timeout')), timeoutMs); }),
      ]);
      if (isCurrent()) onSection(key, { status: 'ready', value });
    } catch {
      if (isCurrent()) onSection(key, { status: 'error', value: null });
    } finally { clearTimeout(timer); }
  }));
}
