const timestamp = (item) => item?.at?.toMillis?.() || (Number(item?.at?.seconds) || 0) * 1000 || Date.parse(item?.completedAt || '') || 0;
const accuracy = (items) => items.length ? Math.round(items.filter(a => a.correct === true).length / items.length * 100) : null;

export function parentSummary(attempts = [], mocks = [], topics = [], now = Date.now()) {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const start = new Date(today); start.setDate(start.getDate() - 6);
  const previous = new Date(start); previous.setDate(previous.getDate() - 7);
  const valid = attempts.filter(a => timestamp(a) > 0 && timestamp(a) <= now);
  const comparisonComplete = attempts.length < 500 || Math.min(...valid.map(timestamp)) <= previous.getTime();
  const current = valid.filter(a => timestamp(a) >= start.getTime());
  const before = valid.filter(a => timestamp(a) >= previous.getTime() && timestamp(a) < start.getTime());
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start); date.setDate(date.getDate() + i);
    const end = new Date(date); end.setDate(end.getDate() + 1);
    const items = current.filter(a => timestamp(a) >= date.getTime() && timestamp(a) < end.getTime());
    const tests = mocks.filter(a => timestamp(a) >= date.getTime() && timestamp(a) < end.getTime() && timestamp(a) <= now);
    return { date, count: items.length, active: items.length > 0 || tests.length > 0, seconds: items.reduce((n, a) => n + Math.max(0, Number(a.secs) || 0), 0) };
  });
  const topicResults = topics.map(topic => {
    const items = valid.filter(a => a.topic === topic.id);
    const recent = current.filter(a => a.topic === topic.id);
    const old = before.filter(a => a.topic === topic.id);
    return { ...topic, count: items.length, pct: accuracy(items), delta: comparisonComplete && recent.length >= 5 && old.length >= 5 ? accuracy(recent) - accuracy(old) : null };
  }).filter(a => a.count > 0);
  const weak = topicResults.filter(a => a.count >= 3 && a.pct < 70).sort((a, b) => a.pct - b.pct);
  const improved = topicResults.filter(a => a.delta > 0).sort((a, b) => b.delta - a.delta);
  const tests = mocks.filter(a => a.gradable > 0 && timestamp(a) > 0 && timestamp(a) <= now).sort((a, b) => timestamp(a) - timestamp(b)).slice(-6).map(a => ({ ...a, date: new Date(timestamp(a)), pct: Math.min(100, Math.max(0, Math.round(a.score / a.gradable * 100))) }));
  return { currentCount: current.length, accuracy: accuracy(current), delta: comparisonComplete && current.length >= 5 && before.length >= 5 ? accuracy(current) - accuracy(before) : null, days, topics: topicResults, weak, improved, mastered: topicResults.filter(a => a.count >= 10 && a.pct >= 70).length, tests, lastAt: Math.max(0, ...valid.map(timestamp), ...mocks.map(timestamp).filter(a => a <= now)), seconds: days.reduce((n, a) => n + a.seconds, 0) };
}
