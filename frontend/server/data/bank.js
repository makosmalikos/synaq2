// Банк задач и мок-варианты — построены из 8 официальных вариантов РФМШ-2025 (7 класс).
// Источник данных: variants.json (240 задач). Ответы посчитаны и проверены;
// 5 задач с рисунками/узорами помечены verify=true — сверить по официальному ключу.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const data = require('./variants.json');

export const topicsKk = data.topics;

// Делим 8 вариантов пополам:
//  — половина идёт в «Апталық сынақ» (мок-тесты, формат экзамена);
//  — половина разбирается по тақырыптар в «Дайындық» (тренажёр).
const MOCK_IDS = ['var1', 'var2', 'var3', 'var4'];   // апталық сынақ
const TRAIN_IDS = ['var5', 'var7', 'var8', 'var9'];  // дайындық по темам

const mockSource = data.variants.filter((v) => MOCK_IDS.includes(v.id));
const trainSource = data.variants.filter((v) => TRAIN_IDS.includes(v.id));

// Полные мок-варианты (как на экзамене): 30 задач, открытый ответ.
export const mockVariants = mockSource.map((v, i) => ({
  id: v.id,
  title: `Апталық сынақ · ${i + 1}-нұсқа`,
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

// Банк для тренировки — только «тренировочные» варианты, разбитые по темам.
export const questions = trainSource.flatMap((v) =>
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
