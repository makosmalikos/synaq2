// Данные вшиты в приложение (data.js + bank.js) — бэкенд не требуется.
import { topics as BASE_TOPICS, variants } from './data.js';
import { POOL, EXTRA_TOPICS } from './bank.js';

const P = (x) => Promise.resolve(x);
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);

// Нормализация ответа: пробелы, запятая/точка, %, единицы измерения.
const norm = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '').replace(',', '.').replace(/%$/, '')
  .replace(/(км|мм|см|м|мин|кг|г|л|тг|га|°)$/u, '');

// Проверка ответа. Для теста с вариантами — точное совпадение опции.
export function isCorrect(given, q) {
  if (!q || q.answer == null) return false;
  if (q.options) return String(given).trim() === String(q.answer).trim();
  const a = norm(given);
  return a !== '' && a === norm(q.answer);
}

const ALL_TOPICS = [...BASE_TOPICS, ...EXTRA_TOPICS];

// ── Мок-тест НИШ ──
// Готовых вариантов НИШ в банке нет, поэтому собираем их сами по формату экзамена:
// математика 40 · колзар 20 · ағылшын 20 · орыс 20 · қазақ 20.
const NISH_SPEC = [
  ['math', 40], ['kolzar', 20], ['eng', 20], ['rus', 20], ['kaz', 20],
];
const NISH_VARIANTS_N = 3;      // сколько вариантов собрать
const NISH_TIME_MIN = 150;

function buildNish() {
  // Пул НИШ; казахских задач у НИШ мало, поэтому добираем из БИЛ.
  const bySubj = {};
  for (const [subj] of NISH_SPEC) {
    const own = POOL.filter((q) => q.school === 'НИШ' && q.subject === subj);
    const extra = POOL.filter((q) => q.school === 'БИЛ' && q.subject === subj);
    bySubj[subj] = shuffle([...own, ...extra]);
  }
  const out = [];
  for (let v = 0; v < NISH_VARIANTS_N; v++) {
    const qs = [];
    for (const [subj, want] of NISH_SPEC) {
      const pool = bySubj[subj];
      if (!pool.length) continue;
      for (let k = 0; k < want; k++) {
        const q = pool[(v * want + k) % pool.length];   // варианты не повторяют друг друга
        qs.push({ ...q, num: qs.length + 1, subject: subj });
      }
    }
    out.push({
      id: `nish_v${v + 1}`,
      school: 'НИШ',
      title: `НИШ · ${v + 1}-нұсқа`,
      timeLimitMin: NISH_TIME_MIN,
      questions: qs,
    });
  }
  return out;
}

const ALL_VARIANTS = [...variants, ...buildNish()];

export const api = {
  // ── Тренировка ──
  topics: () => P(
    ALL_TOPICS
      .map((t) => {
        const qs = POOL.filter((q) => q.topic === t.id);
        return {
          ...t,
          count: qs.length,
          schools: [...new Set(qs.map((q) => q.school))],
        };
      })
      .filter((t) => t.count > 0)
  ),

  topicQuestions: (id) => P(shuffle(POOL.filter((q) => q.topic === id))),

  // Аралас дайындык: только математические блоки, вперемешку по школам.
  mixed: (_lang, limit = 20, block = 'math') => {
    const ids = ALL_TOPICS.filter((t) => t.block === block).map((t) => t.id);
    return P(shuffle(POOL.filter((q) => ids.includes(q.topic))).slice(0, limit));
  },

  // ── Мок-тест ──
  schools: () => P(['РФМШ', 'НИШ', 'БИЛ'].map((code) => {
    const vs = ALL_VARIANTS.filter((v) => v.school === code);
    return {
      code,
      variants: vs.length,
      questions: vs.reduce((s, v) => s + v.questions.length, 0),
    };
  })),

  mockList: (school) => P(
    ALL_VARIANTS.filter((v) => v.school === school).map((v) => ({
      id: v.id,
      school: v.school,
      title: v.title,
      timeLimitMin: v.timeLimitMin,
      count: v.questions.length,
    }))
  ),

  // Вариант без ответов и разборов — как на настоящем экзамене.
  mockGet: (id) => {
    const v = ALL_VARIANTS.find((x) => x.id === id);
    if (!v) return P(null);
    return P({
      ...v,
      questions: v.questions.map(({ answer, solution, note, ...rest }) => rest),
    });
  },

  mockSubmit: (id, answers) => {
    const v = ALL_VARIANTS.find((x) => x.id === id);
    if (!v) return P(null);
    let correct = 0, gradable = 0, wrong = 0;
    const review = v.questions.map((q) => {
      const has = q.answer != null;
      if (has) gradable++;
      const ok = has && isCorrect(answers[q.num], q);
      if (ok) correct++;
      else if (has && norm(answers[q.num]) !== '') wrong++;
      return {
        num: q.num, topic: q.topic, school: v.school,
        statement: q.statement, solution: q.solution || '', image: q.image || null,
        options: q.options || null,
        your: answers[q.num] ?? null, answer: q.answer,
        correct: ok, note: q.note || null,
      };
    });

    // БИЛ считает иначе: каждые 4 ошибки съедают 1 верный ответ, остаток ×1,5.
    if (v.school === 'БИЛ') {
      const cancelled = Math.floor(wrong / 4);
      const net = Math.max(0, correct - cancelled);
      return P({
        scoring: 'bil', score: correct, wrong, cancelled,
        points: +(net * 1.5).toFixed(1), maxPoints: +(gradable * 1.5).toFixed(1),
        gradable, total: v.questions.length, review,
      });
    }
    return P({ score: correct, gradable, total: v.questions.length, review });
  },
};
