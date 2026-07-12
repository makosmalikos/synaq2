// Данные вшиты в приложение (data.js → bank.js) — бэкенд не требуется.
// Все ручки принимают СПИСОК школ: при нескольких выбранных задачи мешаются.
import {
  TOPICS, topicsFor, topicQuestions, mixedQuestions,
  variantsFor, localizeVariant, parseSchools, POOL, mixAcrossSchools, localize,
} from './bank.js';

// Сверка ответа. Осторожно: \b в JS работает только по латинице, поэтому
// на «5лет» он не срабатывает и правильный ответ не засчитывался.
// Порядок важен — длинные варианты идут раньше коротких (км до м, тг до г).
const UNITS = /(км\/сағ|км\/ч|м\/с|см²|м²|см³|м³|см2|м3|градус|тенге|теңге|сағат|минут|литр|штук|дана|адам|мин|сек|лет|года|годов|год|жыл|жас|раза|раз|есе|км|см|мм|дм|кг|тг|га|шт|°|м|г|л|ч)/gi;

export const normAnswer = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '')
  .replace(/,/g, '.')
  .replace(/%/g, '')
  .replace(UNITS, '');

export const isCorrect = (given, q) => {
  if (q.answer == null) return false;
  if (q.options) return given === q.answer;
  const a = normAnswer(given);
  return a !== '' && a === normAnswer(q.answer);
};

const P = (x) => Promise.resolve(x);

export const api = {
  // Темы по выбранным школам (математика / логика / тілдер)
  topics: (schools) => P(topicsFor(parseSchools(schools))),

  // Задачи одной темы — перемешаны по всем выбранным школам
  topicQuestions: (topicId, schools, lang = 'kk') =>
    P(topicQuestions(topicId, parseSchools(schools), lang)),

  // Смешанная тренировка
  mixed: (schools, lang = 'kk', limit = 15, block = null) =>
    P(mixedQuestions(parseSchools(schools), lang, limit, block)),

  // Мок недели: ротация по вариантам всех выбранных школ
  mockWeekly: (schools) => {
    const list = variantsFor(parseSchools(schools));
    if (!list.length) return P(null);
    const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
    const idx = ((week % list.length) + list.length) % list.length;
    const v = list[idx];
    return P({
      id: v.id, week: idx + 1, school: v.school, title: v.title,
      timeLimitMin: v.timeLimitMin, count: v.questions.length,
    });
  },

  // Список всех доступных вариантов (если захочешь показать выбор)
  mockList: (schools) => P(variantsFor(parseSchools(schools)).map(v => ({
    id: v.id, school: v.school, title: v.title,
    timeLimitMin: v.timeLimitMin, count: v.questions.length,
  }))),

  // Режим экзамена: ответы и разборы не отдаём
  mockGet: (id, lang = 'kk') => {
    const v = variantsFor(['РФМШ', 'НИШ', 'БИЛ']).find(x => x.id === id);
    if (!v) return P(null);
    const lv = localizeVariant(v, lang);
    return P({ ...lv, questions: lv.questions.map(({ answer, solution, ...rest }) => rest) });
  },

  mockSubmit: (id, answers, lang = 'kk') => {
    const v = variantsFor(['РФМШ', 'НИШ', 'БИЛ']).find(x => x.id === id);
    if (!v) return P(null);
    const lv = localizeVariant(v, lang);
    let score = 0, gradable = 0;
    const review = lv.questions.map(q => {
      const has = q.answer != null;
      if (has) gradable++;
      const ok = has && isCorrect(answers[q.num], q);
      if (ok) score++;
      return {
        id: q.id, num: q.num, topic: q.topic, school: q.school,
        your: answers[q.num] ?? null, answer: q.answer, correct: ok,
        statement: q.statement, solution: q.solution || '', image: q.image || null,
      };
    });
    return P({ score, gradable, total: lv.questions.length, review });
  },
};

export { TOPICS, POOL, mixAcrossSchools, localize, parseSchools };
