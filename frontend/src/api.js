// Данные вшиты в приложение (data.js → bank.js) — бэкенд не нужен.
//
// Дайындык: школа не спрашивается, берём ВЕСЬ банк вперемешку.
// Но блоки разделены: математика / логика / қазақ / орыс / ағылшын —
// смешивать язык с математикой в одной ленте бессмысленно.
//
// Мок-тест: наоборот, строго по школам. Экзамен у каждой школы свой,
// и вариант должен быть цельным, а не солянкой.
import {
  TOPICS, topicsAll, topicQuestionsAll, mixedAll,
  VARIANTS, localizeVariant, SCHOOLS, POOL, localize,
} from './bank.js';

// Сверка ответа. \b в JS работает только по латинице, поэтому на «5лет»
// он не срабатывал и верный ответ не засчитывался.
// Порядок важен: длинные варианты раньше коротких (км до м, тг до г).
const UNITS = /(км\/сағ|км\/ч|м\/с|см²|м²|см³|м³|см2|м3|градус|тенге|теңге|сағат|минут|литр|штук|дана|адам|мин|сек|лет|года|годов|год|жыл|жас|раза|раз|есе|км|см|мм|дм|кг|тг|га|шт|°|м|г|л|ч)/gi;

export const normAnswer = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '').replace(/,/g, '.').replace(/%/g, '').replace(UNITS, '');

export const isCorrect = (given, q) => {
  if (q.answer == null) return false;
  if (q.options) return given === q.answer;
  const a = normAnswer(given);
  return a !== '' && a === normAnswer(q.answer);
};

const P = (x) => Promise.resolve(x);

export const api = {
  // ── Дайындык: весь банк, без школ ──
  topics: () => P(topicsAll()),
  topicQuestions: (topicId, lang = 'kk') => P(topicQuestionsAll(topicId, lang)),
  mixed: (lang = 'kk', limit = 20, block = null) => P(mixedAll(lang, limit, block)),

  // ── Мок-тест: по школам ──
  // Школы без вариантов не прячем — показываем «Жақында ашылады».
  schools: () => P(SCHOOLS.map((s) => ({
    code: s,
    variants: VARIANTS.filter((v) => v.school === s).length,
    questions: POOL.filter((q) => q.school === s).length,
  }))),

  mockList: (school) => P(
    VARIANTS.filter((v) => !school || v.school === school)
      .map((v) => ({ id: v.id, school: v.school, title: v.title, timeLimitMin: v.timeLimitMin, count: v.questions.length })),
  ),

  // Режим экзамена: ответы и разборы не отдаём
  mockGet: (id, lang = 'kk') => {
    const v = VARIANTS.find((x) => x.id === id);
    if (!v) return P(null);
    const lv = localizeVariant(v, lang);
    return P({ ...lv, questions: lv.questions.map(({ answer, solution, ...rest }) => rest) });
  },

  mockSubmit: (id, answers, lang = 'kk') => {
    const v = VARIANTS.find((x) => x.id === id);
    if (!v) return P(null);
    const lv = localizeVariant(v, lang);
    let score = 0, gradable = 0, wrong = 0;
    const review = lv.questions.map((q) => {
      const has = q.answer != null;
      if (has) gradable++;
      const ok = has && isCorrect(answers[q.num], q);
      if (ok) score++;
      else if (has) wrong++;
      return {
        id: q.id, num: q.num, topic: q.topic, school: q.school,
        your: answers[q.num] ?? null, answer: q.answer, correct: ok,
        statement: q.statement, solution: q.solution || '', image: q.image || null,
      };
    });
    // Правило БИЛ: каждые 4 неверных ответа съедают 1 верный,
    // остаток умножается на 1,5. Пустой ответ — тоже неверный.
    // Включается сам, если у варианта стоит scoring: 'bil'.
    if (v.scoring === 'bil') {
      const kept = Math.max(0, score - Math.floor(wrong / 4));
      return P({
        score, wrong, gradable, total: lv.questions.length, review,
        scoring: 'bil',
        cancelled: score - kept,
        points: Math.round(kept * 1.5 * 10) / 10,
        maxPoints: Math.round(gradable * 1.5 * 10) / 10,
      });
    }
    return P({ score, wrong, gradable, total: lv.questions.length, review });
  },
};

export { TOPICS, POOL, localize, SCHOOLS };
