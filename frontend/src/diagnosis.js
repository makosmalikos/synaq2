// Диагностика слабых сторон из реального review мок-теста.
import { POOL } from './bank.js';

const LEVEL = (pct) => (pct >= 70 ? 'strong' : pct >= 50 ? 'mid' : 'weak');

function topicName(id, topicList) {
  return topicList.find((t) => t.id === id)?.name || id;
}

function tasksInTopic(id) {
  return POOL.filter((q) => q.topic === id && q.answer != null && String(q.answer).trim()).length;
}

function explainTopic({ name, pct, correct, total, wrong, lang }) {
  if (lang === 'ru') {
    if (pct < 50) return `Из ${total} задач верно ${correct} (${pct}%). Тема «${name}» — главная слабость: много ошибок (${wrong}), нужна отдельная практика.`;
    if (pct < 70) return `Из ${total} задач верно ${correct} (${pct}%). «${name}» нестабильна — закрепи типовые приёмы.`;
    return `Из ${total} задач верно ${correct} (${pct}%). «${name}» — сильная сторона, поддерживай уровень.`;
  }
  return `${total} есептен ${correct} дұрыс (${pct}%). «${name}» — ${pct < 50 ? 'негізгі әлсіз тұс, қателер көп' : pct < 70 ? 'орташа деңгей, тәжірибе керек' : 'мықты тақырып'}.`;
}

function planLine(topic, lang) {
  const n = Math.min(15, Math.max(5, tasksInTopic(topic.id)));
  if (lang === 'ru') return `«${topic.name}» — решить ${n} задач из банка (сейчас ${topic.pct}%).`;
  return `«${topic.name}» — ${n} есеп шеш (${topic.pct}% қазір).`;
}

/** @param {Array} review — review из saveMock / mockSubmit */
export function buildDiagnosis(review, topicList, lang = 'kk') {
  if (!review?.length) return null;

  const by = {};
  for (const r of review) {
    const tid = r.topic || r.subject || '—';
    if (!by[tid]) by[tid] = { id: tid, correct: 0, wrong: 0, skipped: 0, mistakes: [] };
    const g = by[tid];
    const answered = r.your != null && String(r.your).trim() !== '';
    if (r.correct) g.correct++;
    else if (answered) {
      g.wrong++;
      g.mistakes.push({
        num: r.num,
        your: r.your,
        answer: r.answer,
        statement: (r.statement || '').slice(0, 120),
      });
    } else g.skipped++;
  }

  const topics = Object.values(by)
    .map((g) => {
      const total = g.correct + g.wrong + g.skipped;
      const graded = g.correct + g.wrong;
      const pct = graded ? Math.round((g.correct / graded) * 100) : 0;
      const name = topicName(g.id, topicList);
      return {
        ...g,
        name,
        total,
        graded,
        pct,
        level: graded ? LEVEL(pct) : 'weak',
        explanation: graded ? explainTopic({ name, pct, correct: g.correct, total: graded, wrong: g.wrong, lang }) : explainTopic({ name, pct: 0, correct: 0, total: 0, wrong: 0, lang }),
        taskCount: tasksInTopic(g.id),
      };
    })
    .filter((t) => t.graded > 0)
    .sort((a, b) => a.pct - b.pct || b.wrong - a.wrong);

  if (!topics.length) return null;

  const weak = topics.filter((t) => t.level === 'weak' || t.level === 'mid');
  const strong = topics.filter((t) => t.level === 'strong');
  const weakest2 = topics.slice(0, 2);
  const errors = topics.flatMap((t) => t.mistakes.map((m) => ({ ...m, topicId: t.id, topicName: t.name })));
  const plan = (weak.length ? weak : topics.slice(0, 3)).map((t) => ({
    topicId: t.id,
    topicName: t.name,
    pct: t.pct,
    taskCount: Math.min(15, Math.max(5, t.taskCount || 5)),
    line: planLine(t, lang),
  }));

  const readiness = Math.round(topics.reduce((s, t) => s + t.pct, 0) / topics.length);

  return {
    topics,
    weak,
    strong,
    weakest2,
    errors,
    plan,
    readiness,
    totalQuestions: review.length,
    correctTotal: review.filter((r) => r.correct).length,
  };
}

export function pickDiagnosticMock(mocks) {
  if (!mocks?.length) return null;
  const diag = mocks.filter((m) => m.diagnostic && m.review?.length);
  if (diag.length) {
    return diag.sort((a, b) => (b.at?.seconds || 0) - (a.at?.seconds || 0))[0];
  }
  return [...mocks]
    .filter((m) => m.review?.length)
    .sort((a, b) => (b.at?.seconds || 0) - (a.at?.seconds || 0))[0];
}
