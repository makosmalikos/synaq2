// Банк задач и мок-варианты — построены из 8 официальных вариантов РФМШ-2025 (7 класс).
// Источник данных: variants.json (240 задач). Ответы посчитаны и проверены;
// 5 задач с рисунками/узорами помечены verify=true — сверить по официальному ключу.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const data = require('./variants.json');

export const topicsKk = data.topics;

// Полные мок-варианты (как на экзамене): 30 задач, открытый ответ.
export const mockVariants = data.variants.map((v) => ({
  id: v.id,
  title: v.title,
  timeLimitMin: v.timeLimitMin,
  questions: v.questions.map((q) => ({
    id: q.id,
    num: q.num,
    topic: q.topic,
    statement: q.statement,
    answer: q.answer,        // строка или null (для задач по ключу)
    solution: q.solution,
    verify: q.verify,
    image: q.image || null,
  })),
}));

// Единый банк для тренировки (все задачи из всех вариантов).
export const questions = data.variants.flatMap((v) =>
  v.questions.map((q) => ({
    ...q,
    variant: v.id,
    gradable: q.answer !== null,
  }))
);

// Задачи по теме.
export const byTopic = (topicId) => questions.filter((q) => q.topic === topicId);

// Публичная версия варианта (без ответов/разбора) — как выдаётся на экзамене.
export const publicVariant = (v) => ({
  id: v.id,
  title: v.title,
  timeLimitMin: v.timeLimitMin,
  questions: v.questions.map(({ answer, solution, verify, ...rest }) => rest),
});
