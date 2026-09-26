// Данные вшиты в приложение (data.js + bank.js) — бэкенд не требуется.
// Задачи без проверяемого ответа не участвуют в автопроверке.
import { topics as BASE_TOPICS, variants } from './data.js';
import { POOL, EXTRA_TOPICS, ensureBankReady } from './bank.js';

const P = (x) => Promise.resolve(x);
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
const toIdSet = (v) => (v instanceof Set ? v : new Set(v || []));

import { norm, isGradable, isCorrect } from './grading.js';
import { addQuestionsToTopics } from './topicSummary.js';
export { isGradable, isCorrect } from './grading.js';
export { topicStats, readiness, weekHours, mockSeries } from './analytics.js';

const ALL_TOPICS = [...BASE_TOPICS, ...EXTRA_TOPICS];

// ── Мок-тест РФМШ ──
// Раньше выдавали один из 8 захардкоженных вариантов (rfmsh2025_v1..v9) —
// с ограниченным пулом дети быстро натыкались на повтор одного и того же
// теста. Теперь, как и для НИШ/БИЛ, собираем 30 вопросов на лету из общего
// пула РФМШ (он больше исходных 8×30 = 240 вопросов и пополняется), поэтому
// набор реально меняется от попытки к попытке, а не зацикливается на 8 штуках.
const RFMSH_COUNT = 30;
const RFMSH_TIME_MIN = 120;

// Mock.jsx передаёт excludeQuestionIds (вопросы из недавних попыток этой
// школы), чтобы вариант не повторял то же самое от попытки к попытке.
// Раньше mockRandom() этот аргумент вообще не принимал — исключение молча
// не работало ни для одной из трёх школ. "Предпочесть свежее" — не "жёстко
// исключить": если непросмотренных не хватает на нужное число вопросов,
// честно добираем уже виденными, а не урезаем экзамен.
function pickPreferFresh(pool, want, excludeIds) {
  const exclude = toIdSet(excludeIds);
  const fresh = pool.filter((q) => !exclude.has(q.id));
  const stale = pool.filter((q) => exclude.has(q.id));
  return [...fresh, ...stale].slice(0, want);
}

function buildRfmsh(excludeIds) {
  const pool = shuffle(POOL.filter((q) => q.school === 'РФМШ' && isGradable(q)));
  const qs = pickPreferFresh(pool, RFMSH_COUNT, excludeIds).map((q, k) => ({ ...q, num: k + 1, section: 1 }));
  return {
    id: `rfmsh_${Date.now()}`,
    school: 'РФМШ',
    title: 'РФМШ · Пробный тест',
    timeLimitMin: RFMSH_TIME_MIN,
    sections: 1,
    questions: qs,
  };
}

// ── Мок-тест НИШ ──
// Готовых вариантов НИШ в банке нет, поэтому собираем их сами по формату экзамена:
// математика 40 · колзар 20 · ағылшын 20 · орыс 20 · қазақ 20.
// Секция 1 — математика и колзар. Секция 2 — языки. Между ними перерыв.
const NISH_SPEC = [
  ['math', 40, 1], ['kolzar', 20, 1],
  ['eng', 20, 2], ['rus', 20, 2], ['kaz', 20, 2],
];
const NISH_TIME_MIN = 150;

function buildNish(excludeIds) {
  const qs = [];
  for (const [subj, want, section] of NISH_SPEC) {
    // казахских задач у НИШ мало — добираем из БИЛ
    const pool = shuffle(examPool('НИШ', subj));
    for (const q of pickPreferFresh(pool, want, excludeIds)) {
      qs.push({ ...q, num: qs.length + 1, subject: subj, section });
    }
  }
  return {
    id: `nish_${Date.now()}`,
    school: 'НИШ',
    timeLimitMin: NISH_TIME_MIN,
    sections: 2,
    questions: qs,
  };
}

// ── Мок-тест БИЛ ──
// 40 математика · 20 логика · 20 қазақ тілі. Случайно из банка БИЛ. 2 часа.
const BIL_SPEC = [
  ['math', 40, 1], ['logic', 20, 1],
  ['kaz', 20, 2],
];
const BIL_TIME_MIN = 120;

export const MOCK_SPECS = {
  'РФМШ': { count: RFMSH_COUNT, minutes: RFMSH_TIME_MIN, subjects: [[null, RFMSH_COUNT, 1]] },
  'НИШ': { count: 120, minutes: NISH_TIME_MIN, subjects: NISH_SPEC },
  'БИЛ': { count: 80, minutes: BIL_TIME_MIN, subjects: BIL_SPEC },
};

function examPool(school, subject) {
  return POOL.filter((q) => isGradable(q) && (school === 'БИЛ'
    ? ['БИЛ', 'КТЛ'].includes(q.school)
    : q.school === school || (school === 'НИШ' && subject === 'kaz' && q.school === 'БИЛ'))
    && (subject == null || q.subject === subject));
}

export function mockAvailability(school) {
  const spec = MOCK_SPECS[school];
  if (!spec) return { code: school, ready: false, count: 0, sections: 0 };
  const subjects = spec.subjects.map(([subject, target, section]) => ({
    subject, target, section, count: Math.min(target, examPool(school, subject).length),
  }));
  const count = subjects.reduce((sum, item) => sum + item.count, 0);
  return { code: school, ready: count > 0, count, targetCount: spec.count,
    shortened: count < spec.count, missingSubjects: subjects.filter((item) => item.count < item.target),
    subjects, sections: new Set(subjects.filter((item) => item.count).map((item) => item.section)).size,
    timeLimitMin: Math.max(1, Math.round(spec.minutes * count / spec.count)),
  };
}

export function reviewQuestionIds(review = []) {
  return [...new Set(review.flatMap((item) => {
    if (item.qid || item.id) return [item.qid || item.id];
    // Older reviews did not include qid. Match only unambiguous original text;
    // never guess from a question number, which repeats between variants.
    const matches = POOL.filter((q) => q.statement === item.statement
      && (item.answer == null || String(q.answer) === String(item.answer)));
    return matches.length === 1 ? [matches[0].id] : [];
  }))];
}

export function reviewVariantId(school, review = []) {
  const found = (variants || []).find((variant) => (variant.school || 'РФМШ') === school
    && variant.questions.length === review.length && review.length > 0
    && variant.questions.every((q, index) => q.statement === review[index].statement));
  return found?.id || null;
}

function bilPool(subj, excludeIds) {
  // КТЛ и БИЛ — один формат; оба банка пусты до нового импорта.
  const all = examPool('БИЛ', subj);
  const gradable = shuffle(all.filter(isGradable));
  const ungradable = shuffle(all.filter((q) => !isGradable(q)));
  // Внутри каждой группы (с ответом / без) тоже предпочитаем непросмотренные —
  // want=длина массива здесь просто переупорядочивает, ничего не отбрасывая.
  return [
    ...pickPreferFresh(gradable, gradable.length, excludeIds),
    ...pickPreferFresh(ungradable, ungradable.length, excludeIds),
  ];
}

function buildBil(excludeIds) {
  const qs = [];
  for (const [subj, want, section] of BIL_SPEC) {
    const pool = bilPool(subj, excludeIds);
    for (let k = 0; k < Math.min(want, pool.length); k++) {
      qs.push({ ...pool[k], num: qs.length + 1, subject: subj, section });
    }
  }
  return {
    id: `bil_${Date.now()}`,
    school: 'БИЛ',
    timeLimitMin: BIL_TIME_MIN,
    sections: 2,
    questions: qs,
  };
}

// Собранные на лету варианты держим в памяти, чтобы mockGet/mockSubmit их нашли.
const GENERATED = new Map();



export const api = {
  reviewQuestionIds,
  reviewVariantId,
  // ── Тренировка ──
  topics: async () => {
    await ensureBankReady();
    return addQuestionsToTopics(ALL_TOPICS, POOL).filter((topic) => topic.count > 0);
  },

  // excludeIds (Set/массив id уже решённых задач) раньше принимался
  // Training.jsx-те (openTopic/startTopicId-эффект), но здесь второй аргумент
  // просто отбрасывался — "не повторять решённое" молча не работал вообще,
  // ни в одном из путей входа в тренировку.
  topicQuestions: async (id, { excludeIds } = {}) => {
    await ensureBankReady();
    const exclude = toIdSet(excludeIds);
    return P(shuffle(POOL.filter((q) => q.topic === id && isGradable(q) && !exclude.has(q.id))));
  },

  // Аралас дайындык: только математические блоки, вперемешку по школам.
  mixed: async (_lang, limit = 20, block = 'math', excludeIds) => {
    await ensureBankReady();
    const exclude = toIdSet(excludeIds);
    const ids = ALL_TOPICS.filter((t) => t.block === block).map((t) => t.id);
    return P(shuffle(POOL.filter((q) => ids.includes(q.topic) && isGradable(q) && !exclude.has(q.id))).slice(0, limit));
  },

  // ── Мок-тест ──
  schools: async () => { await ensureBankReady(); return Object.keys(MOCK_SPECS).map(mockAvailability); },

  // Случайный вариант по школе. Никакого выбора «нұсқа» — жмёшь школу и решаешь.
  // Для всех трёх школ вариант собирается заново из общего пула (см. buildRfmsh/
  // buildNish/buildBil) — это гарантирует, что тест меняется от попытки к
  // попытке, а не зацикливается на маленьком наборе захардкоженных вариантов.
  //
  // excludeQuestionIds раньше принимался Mock.jsx (недавние вопросы этой школы
  // из localStorage/истории), но здесь отбрасывался — исключение не работало
  // вообще ни для одной школы. Теперь честно учитывается (см. pickPreferFresh).
  // excludeVariantIds НЕ используется: с тех пор как варианты собираются на
  // лету из общего пула (а не выбираются из фиксированного набора), у сборки
  // нет устойчивого "id варианта" для сравнения — buildRfmsh/Nish/Bil каждый
  // раз возвращают новый id (`rfmsh_${Date.now()}` и т.п.), так что сравнивать
  // с "недавними вариантами" было бы сравнением со случайным числом.
  mockRandom: async (school, { excludeQuestionIds } = {}) => {
    await ensureBankReady();
    const availability = mockAvailability(school);
    if (!availability.ready) return null;
    let v;
    if (school === 'РФМШ') {
      v = buildRfmsh(excludeQuestionIds);
    } else if (school === 'НИШ') {
      v = buildNish(excludeQuestionIds);
    } else if (school === 'БИЛ') {
      v = buildBil(excludeQuestionIds);
    } else {
      return P(null);
    }
    v = { ...v, ...availability, id: `${school}_${crypto.randomUUID()}` };
    GENERATED.set(v.id, v);
    // отдаём без ответов и разборов — как на экзамене
    return P({ ...v, questions: v.questions.map(({ answer, solution, note, ...rest }) => rest) });
  },

  // Вариант без ответов и разборов — как на настоящем экзамене.
  mockGet: (id) => {
    const v = GENERATED.get(id);
    if (!v) return P(null);
    return P({
      ...v,
      questions: v.questions.map(({ answer, solution, note, ...rest }) => rest),
    });
  },

  // Refresh loses GENERATED. Rehydrate the exact variant using trusted bank
  // questions; a stored display/translation snapshot never supplies its answers.
  mockRestore: async (snapshot) => {
    await ensureBankReady();
    if (!snapshot || typeof snapshot.id !== 'string' || !snapshot.id
      || !MOCK_SPECS[snapshot.school] || !Array.isArray(snapshot.questions)
      || !snapshot.questions.length || snapshot.questions.length > MOCK_SPECS[snapshot.school].count
      || !Number.isFinite(snapshot.timeLimitMin) || snapshot.timeLimitMin < 1
      || snapshot.timeLimitMin > MOCK_SPECS[snapshot.school].minutes) throw new Error('invalid_exam_snapshot');
    const bank = new Map(POOL.map((q) => [q.id, q]));
    const ids = new Set();
    const questions = snapshot.questions.map((saved, index) => {
      const q = bank.get(saved?.id);
      if (!q || !isGradable(q) || ids.has(q.id) || saved.num !== index + 1
        || ![1, 2].includes(saved.section)) throw new Error('exam_question_unavailable');
      ids.add(q.id);
      return { ...q, num: saved.num, section: saved.section };
    });
    GENERATED.set(snapshot.id, { ...snapshot, questions });
    return api.mockGet(snapshot.id);
  },

  mockSubmit: (id, answers) => {
    const v = GENERATED.get(id);
    if (!v) return P(null);
    let correct = 0, gradable = 0, wrong = 0;
    const review = v.questions.map((q) => {
      const has = isGradable(q);
      if (has) gradable++;
      const ok = has && isCorrect(answers[q.num], q);
      if (ok) correct++;
      else if (has && norm(answers[q.num]) !== '') wrong++;
      return {
        qid: q.id, num: q.num, topic: q.topic || null, subject: q.subject || null, school: v.school,
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


// ── Перевод условий задач ──
// Банк собран из разных источников: часть задач (РФМШ целиком, часть НИШ)
// написана по-русски, часть — по-казахски, вперемешку и без общей логики —
// раньше это и давало «смешение языков» внутри одной темы. Теперь у каждой
// задачи есть q.lang (bank.js: detectLang) — реальный язык условия. Переводим
// только то, что не совпадает с выбранным языком интерфейса, через /api/explain.
// Общий доверенный кэш принадлежит серверу; клиент хранит только память сессии.
// Задачи по языкам (орыс/ағылшын/қазақ тілі) НЕ переводим: перевод убивает задание.
const LANG_SUBJECTS = ['rus', 'eng', 'kaz'];
const trCache = new Map();   // в пределах сессии — вообще без похода в сеть/Firestore
const translationKey = (q, lang) => JSON.stringify([q.id, q.statement, q.solution || '', lang]);

export const translatable = (q) => !LANG_SUBJECTS.includes(q.subject);

export async function translateQuestions(list, lang) {
  if (!list?.length) return list;

  // нужен перевод только тому, чей реальный язык не совпадает с выбранным
  const need = list.filter((q) => translatable(q) && q.lang && q.lang !== lang && !trCache.has(translationKey(q, lang)));

  if (need.length) {
      try {
        const { auth } = await import('./firebase.js');
        const token = await auth.currentUser?.getIdToken?.();
        for (let i = 0; i < need.length; i += 30) {
          const batch = need.slice(i, i + 30);
          const r = await fetch('/api/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              mode: 'translate',
              lang,
              items: batch.map((q) => ({ id: q.id, statement: q.statement, solution: q.solution || '' })),
            }),
          });
          if (!r.ok) throw new Error(`translation_${r.status}`);
          const data = await r.json();
          for (const q of batch) {
            const value = data?.[q.id];
            if (value && typeof value.statement === 'string' && value.statement.trim()) {
              trCache.set(translationKey(q, lang), value);
            }
          }
        }
      } catch (e) {
        console.warn('перевод не удался — показываем оригинал', e);
      }
  }

  return list.map((q) => {
    if (!translatable(q) || !q.lang || q.lang === lang) return q;
    const tr = trCache.get(translationKey(q, lang));
    return tr ? { ...q, statement: tr.statement || q.statement, solution: tr.solution || q.solution } : { ...q, needsTranslation: true };
  });
}

// Analytics live in analytics.js so reports do not load the question bank.
