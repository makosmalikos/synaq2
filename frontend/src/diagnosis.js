// Диагностика слабых сторон из реального review мок-теста.
import { isGradable } from './grading.js';
import { STATIC_TOPICS } from './topicCatalog.generated.js';

const LEVEL = (pct) => (pct >= 70 ? 'strong' : pct >= 50 ? 'mid' : 'weak');

function topicName(id, topicList) {
  return topicList.find((t) => t.id === id)?.name || id;
}

// isGradable, не просто "answer непустой": иначе задачи-заглушки ('—'/'-',
// которые никогда не засчитываются верными — см. api.js) завышали бы
// рекомендованное число задач в плане подготовки.
function tasksInTopic(id, topicList) {
  // Training passes live counts; reports pass the lightweight catalog merged
  // with the same admin tasks. Old callers with name-only topics remain valid.
  const topic = topicList.find((item) => item.id === id);
  return topic?.gradableCount ?? STATIC_TOPICS.find((item) => item.id === id)?.gradableCount ?? 0;
}

function explainTopic({ name, pct, correct, total, wrong, skipped, lang }) {
  if (lang === 'ru') {
    const result = `Из ${total} задач верно ${correct} (${pct}%), ошибок: ${wrong}, пропущено: ${skipped}.`;
    if (pct < 50) return `${result} Тема «${name}» — главная слабость, нужна отдельная практика.`;
    if (pct < 70) return `${result} «${name}» нестабильна — закрепи типовые приёмы.`;
    return `${result} «${name}» — сильная сторона, поддерживай уровень.`;
  }
  return `${total} есептен ${correct} дұрыс (${pct}%), қате: ${wrong}, өткізіп алынды: ${skipped}. «${name}» — ${pct < 50 ? 'негізгі әлсіз тұс, жеке жаттығу керек' : pct < 70 ? 'орташа деңгей, тәжірибе керек' : 'мықты тақырып'}.`;
}

function planLine(topic, lang) {
  const n = Math.min(15, Math.max(5, topic.taskCount));
  if (lang === 'ru') return `«${topic.name}» — решить ${n} задач из банка (сейчас ${topic.pct}%).`;
  return `«${topic.name}» — ${n} есеп шеш (${topic.pct}% қазір).`;
}

/** @param {Array} review — review из saveMock / mockSubmit */
export function buildDiagnosis(review, topicList, lang = 'kk') {
  if (!review?.length) return null;

  const by = {};
  for (const r of review) {
    if (!isGradable(r)) continue;
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
      const pct = total ? Math.round((g.correct / total) * 100) : 0;
      const name = topicName(g.id, topicList);
      return {
        ...g,
        name,
        total,
        graded,
        pct,
        level: graded ? LEVEL(pct) : 'weak',
        explanation: explainTopic({ name, pct, correct: g.correct, total, wrong: g.wrong, skipped: g.skipped, lang }),
        taskCount: tasksInTopic(g.id, topicList),
      };
    })
    .filter((t) => t.total > 0)
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

  const readiness = Math.round(topics.reduce((s, t) => s + t.correct, 0) / topics.reduce((s, t) => s + t.total, 0) * 100);

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
