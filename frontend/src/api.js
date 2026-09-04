// Данные вшиты в приложение (data.js + bank.js) — бэкенд не требуется.
// Задачи без проверяемого ответа не участвуют в автопроверке.
import { topics as BASE_TOPICS, variants } from './data.js';
import { POOL, EXTRA_TOPICS, detectLang } from './bank.js';
import { auth, db } from './firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generateFor, GENERATABLE_TOPICS } from './generators.js';

const P = (x) => Promise.resolve(x);
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// Нормализация ответа: пробелы, запятая/точка, %, единицы измерения.
const norm = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '').replace(',', '.').replace(/%$/, '')
  .replace(/(км|мм|см|м|мин|кг|г|л|тг|га|°)$/u, '');

// Проверка ответа. Для теста с вариантами — точное совпадение опции.
export function isCorrect(given, q) {
  if (!q || q.answer == null) return false;
  const ans = String(q.answer).trim();
  if (!ans || ans === '—' || ans === '-') return false;
  if (q.options) return String(given).trim() === ans;
  const a = norm(given);
  return a !== '' && a === norm(q.answer);
}

const ALL_TOPICS = [...BASE_TOPICS, ...EXTRA_TOPICS];

// Показать сначала непройденные задачи, потом (если непройденных не хватает)
// добрать уже виденные — топик/мок никогда не «упрётся» в пустоту.
const idSet = (values = []) => (values instanceof Set ? values : new Set(values || []));
const unseenFirst = (items, excluded = []) => {
  const used = idSet(excluded);
  return [
    ...shuffle(items.filter((q) => !used.has(q.id))),
    ...shuffle(items.filter((q) => used.has(q.id))),
  ];
};

// ── Регенерация «похожих» задач ──
// Реальный банк конечен: сколько бы задач в нём ни было, при активной
// тренировке они рано или поздно кончаются/повторяются. Для тем, где есть
// шаблон-генератор (generators.js — проценты, отношения, геометрия и т.п.),
// подмешиваем свежесгенерированные задачи с новыми числами к реальным из
// POOL — в дополнение к unseenFirst (который просто прячет уже виденные
// реальные задачи назад в конец очереди, но не создаёт новых). Темы без
// шаблона (картинки, языковые предметы) отдают только реальные задачи.
const genForTopic = (topicId, lang, count, schoolLabel) =>
  GENERATABLE_TOPICS.includes(topicId) ? generateFor(topicId, lang, count, schoolLabel) : [];

// Сколько сгенерированных задач подмешать к N реальным — примерно треть,
// но не меньше 4 (чтобы тема с маленьким реальным банком тоже не заканчивалась).
const genQuota = (n) => Math.max(4, Math.ceil(n * 0.4));

// Какие темы-генераторы относятся к какому предмету мок-теста (math/logic/kolzar).
const MATH_GEN_TOPICS = ['eq', 'num', 'work', 'ratio', 'geo', 'frac', 'pct', 'sys'];
const LOGIC_GEN_TOPICS = ['seq', 'comb'];
const GEN_TOPICS_BY_SUBJECT = { math: MATH_GEN_TOPICS, logic: LOGIC_GEN_TOPICS, kolzar: ['kolzar'] };

function genForSubject(subj, lang, count, schoolLabel) {
  const tps = GEN_TOPICS_BY_SUBJECT[subj];
  if (!tps || !count) return [];
  const out = [];
  for (let k = 0; k < count; k++) {
    out.push(...genForTopic(tps[rnd(0, tps.length - 1)], lang, 1, schoolLabel));
  }
  return out;
}

// ── Мок-тест РФМШ ──
// Раньше выдавали один из 8 захардкоженных вариантов (rfmsh2025_v1..v9) —
// с ограниченным пулом дети быстро натыкались на повтор одного и того же
// теста. Теперь, как и для НИШ/БИЛ, собираем 30 вопросов на лету из общего
// пула РФМШ (он больше исходных 8×30 = 240 вопросов и пополняется) плюс
// подмешиваем свежесгенерированные — набор реально меняется от попытки к
// попытке, а не зацикливается на 8 штуках.
const RFMSH_COUNT = 30;
const RFMSH_TIME_MIN = 120;

function buildRfmsh(lang = 'kk', excludeQuestionIds = []) {
  const real = POOL.filter((q) => q.school === 'РФМШ' && q.answer != null && String(q.answer).trim() !== '');
  // РФМШ вперемешку даёт математику и логику одним потоком (без деления по
  // темам, как у НИШ/БИЛ) — подмешиваем сгенерированные по всем темам сразу.
  const generated = GENERATABLE_TOPICS
    .filter((t) => t !== 'kolzar')
    .flatMap((t) => genForTopic(t, lang, 2, 'РФМШ'));
  const pool = unseenFirst([...real, ...generated], excludeQuestionIds);
  const qs = pool.slice(0, RFMSH_COUNT).map((q, k) => ({ ...q, num: k + 1, section: 1 }));
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

function buildNish(lang = 'kk', excludeQuestionIds = []) {
  const qs = [];
  for (const [subj, want, section] of NISH_SPEC) {
    // казахских задач у НИШ мало — добираем из БИЛ
    const real = POOL.filter((q) => (q.school === 'НИШ' || q.school === 'БИЛ') && q.subject === subj);
    // языковые предметы (eng/rus/kaz) шаблонами не покрыты — там только реальные задачи
    const generated = genForSubject(subj, lang, genQuota(want), 'НИШ');
    const pool = unseenFirst([...real, ...generated], excludeQuestionIds);
    for (let k = 0; k < Math.min(want, pool.length); k++) {
      qs.push({ ...pool[k], num: qs.length + 1, subject: subj, section });
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

function bilPool(subj, lang, excludeQuestionIds = []) {
  // КТЛ и БИЛ — один формат; оба банка пусты до нового импорта.
  const all = POOL.filter((q) => (q.school === 'БИЛ' || q.school === 'КТЛ') && q.subject === subj);
  const ok = (q) => q.answer != null && String(q.answer).trim() !== '';
  const real = all.filter(ok);
  const generated = genForSubject(subj, lang, genQuota(real.length || 20), 'БИЛ');
  return [
    ...unseenFirst([...real, ...generated], excludeQuestionIds),
    ...unseenFirst(all.filter((q) => !ok(q)), excludeQuestionIds),
  ];
}

function buildBil(lang = 'kk', excludeQuestionIds = []) {
  const qs = [];
  for (const [subj, want, section] of BIL_SPEC) {
    const pool = bilPool(subj, lang, excludeQuestionIds);
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
  // Старые результаты не содержат qid/sourceId. Восстанавливаем их по условию,
  // чтобы защита от повторов работала сразу после обновления, а не только для
  // новых попыток.
  reviewQuestionIds: (review = []) => {
    const byStatement = new Map(POOL.map((q) => [String(q.statement || '').trim(), q.id]));
    return review.map((q) => q.qid || byStatement.get(String(q.statement || '').trim())).filter(Boolean);
  },

  reviewVariantId: (school, review = []) => {
    const statements = new Set(review.map((q) => String(q.statement || '').trim()).filter(Boolean));
    if (!statements.size) return null;
    let best = null;
    let score = 0;
    for (const variant of variants.filter((v) => v.school === school)) {
      const matched = variant.questions.filter((q) => statements.has(String(q.statement || '').trim())).length;
      if (matched > score) { best = variant.id; score = matched; }
    }
    return score >= Math.min(5, statements.size) ? best : null;
  },

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

  // opts.lang — язык интерфейса; для тем с шаблоном (generators.js) на его
  // основе подмешиваются свежесгенерированные задачи, чтобы тренировка не
  // упиралась в конечный размер реального банка темы. opts.excludeIds —
  // уже решённые задачи ребёнком: прячем их в конец очереди (unseenFirst),
  // а не убираем совсем — если реальных задач меньше решённых, лучше
  // повторить старую, чем остаться без задач вовсе.
  topicQuestions: (id, { lang, excludeIds = [] } = {}) => {
    const all = POOL.filter((q) => q.topic === id && q.answer != null && String(q.answer).trim() && String(q.answer).trim() !== '—');
    const native = lang ? all.filter((q) => q.lang === lang) : all;
    const foreign = lang ? all.filter((q) => q.lang !== lang) : [];
    const generated = genForTopic(id, lang || 'kk', genQuota(native.length || 10));
    return P([...unseenFirst([...native, ...generated], excludeIds), ...unseenFirst(foreign, excludeIds)]);
  },

  // Аралас дайындык: только математические блоки, вперемешку по школам + генерация.
  mixed: (lang, limit = 20, block = 'math', excludeIds = []) => {
    const ids = ALL_TOPICS.filter((t) => t.block === block).map((t) => t.id);
    const all = POOL.filter((q) => ids.includes(q.topic));
    const native = lang ? all.filter((q) => q.lang === lang) : all;
    const foreign = lang ? all.filter((q) => q.lang !== lang) : [];
    const generated = ids.filter((t) => GENERATABLE_TOPICS.includes(t)).flatMap((t) => genForTopic(t, lang || 'kk', 2));
    return P([
      ...unseenFirst([...native, ...generated], excludeIds),
      ...unseenFirst(foreign, excludeIds),
    ].slice(0, limit));
  },

  // ── Мок-тест ──
  schools: () => P([
    { code: 'РФМШ', ready: POOL.some((q) => q.school === 'РФМШ') },
    { code: 'НИШ',  ready: POOL.some((q) => q.school === 'НИШ') },
    { code: 'БИЛ',  ready: POOL.some((q) => (q.school === 'БИЛ' || q.school === 'КТЛ') && q.subject === 'math') },
  ]),

  // Случайный вариант по школе. Никакого выбора «нұсқа» — жмёшь школу и решаешь.
  // Для всех трёх школ вариант собирается заново из общего пула (см. buildRfmsh/
  // buildNish/buildBil) с приоритетом на ещё не виденные задачи (excludeQuestionIds,
  // которые собирает Mock.jsx из localStorage + истории мок-тестов) — это и
  // гарантирует, что тест меняется от попытки к попытке, а не зацикливается на
  // маленьком наборе. lang — язык интерфейса, на нём же генерируются свежие
  // задачи, чтобы не гонять их через платный перевод.
  mockRandom: (school, { excludeQuestionIds = [], excludeVariantIds = [] } = {}, lang = 'kk') => {
    let v;
    if (school === 'РФМШ') {
      v = buildRfmsh(lang, excludeQuestionIds);
    } else if (school === 'НИШ') {
      v = buildNish(lang, excludeQuestionIds);
    } else if (school === 'БИЛ') {
      v = buildBil(lang, excludeQuestionIds);
    } else {
      return P(null);
    }
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

  mockSubmit: (id, answers) => {
    const v = GENERATED.get(id);
    if (!v) return P(null);
    let correct = 0, gradable = 0, wrong = 0;
    const review = v.questions.map((q) => {
      const has = q.answer != null && String(q.answer).trim() !== '' && String(q.answer).trim() !== '—';
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
        sourceId: v.sourceId || null,
        scoring: 'bil', score: correct, wrong, cancelled,
        points: +(net * 1.5).toFixed(1), maxPoints: +(gradable * 1.5).toFixed(1),
        gradable, total: v.questions.length, review,
      });
    }
    return P({ sourceId: v.sourceId || null, score: correct, gradable, total: v.questions.length, review });
  },
};


// ── Перевод условий задач ──
// Банк собран из разных источников: часть задач (РФМШ целиком, часть НИШ)
// написана по-русски, часть — по-казахски, вперемешку и без общей логики —
// раньше это и давало «смешение языков» внутри одной темы. Теперь у каждой
// задачи есть q.lang (bank.js: detectLang) — реальный язык условия. Переводим
// только то, что не совпадает с выбранным языком интерфейса, через /api/explain
// (режим translate), и кешируем результат НАВСЕГДА в Firestore — как explain.js
// кэширует разборы: один раз переведено — дальше отдаётся всем детям бесплатно
// и мгновенно, без повторных обращений к модели.
// Задачи по языкам (орыс/ағылшын/қазақ тілі) НЕ переводим: перевод убивает задание.
const LANG_SUBJECTS = ['rus', 'eng', 'kaz'];
const trCache = new Map();   // в пределах сессии — вообще без похода в сеть/Firestore

export const translatable = (q) => !LANG_SUBJECTS.includes(q.subject);

export async function translateQuestions(list, lang) {
  if (!list?.length) return list;

  // нужен перевод только тому, чей реальный язык не совпадает с выбранным
  const need = list.filter((q) => translatable(q) && q.lang && q.lang !== lang && !trCache.has(`${q.id}_${lang}`));

  if (need.length) {
    // 1) сначала общий кэш в Firestore — вдруг эту же задачу уже перевели для другого ребёнка
    const stillMissing = [];
    await Promise.all(need.map(async (q) => {
      const key = `${q.id}_${lang}`;
      try {
        const snap = await getDoc(doc(db, 'translations', key));
        if (snap.exists()) { trCache.set(key, snap.data()); return; }
      } catch { /* правила ещё не опубликованы — просто переводим заново */ }
      stillMissing.push(q);
    }));

    // 2) чего нигде нет — переводим через Gemini батчами (api/explain ограничивает 30 за раз)
    if (stillMissing.length) {
      try {
        const token = await auth.currentUser?.getIdToken?.();
        for (let i = 0; i < stillMissing.length; i += 30) {
          const batch = stillMissing.slice(i, i + 30);
          const r = await fetch('/api/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              mode: 'translate',
              lang,
              items: batch.map((q) => ({ id: q.id, statement: q.statement, solution: q.solution || '' })),
            }),
          });
          const data = await r.json();
          for (const [id, v] of Object.entries(data || {})) {
            const key = `${id}_${lang}`;
            trCache.set(key, v);
            // create-only: готовый перевод больше не перезаписывается
            setDoc(doc(db, 'translations', key), { ...v, lang, qid: id, at: serverTimestamp() }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('перевод не удался — показываем оригинал', e);
      }
    }
  }

  return list.map((q) => {
    if (!translatable(q) || !q.lang || q.lang === lang) return q;
    const tr = trCache.get(`${q.id}_${lang}`);
    return tr ? { ...q, statement: tr.statement || q.statement, solution: tr.solution || q.solution } : q;
  });
}

// ── Статистика по ребёнку ──
// Считается из реальных данных: attempts (тема, верно/неверно, секунды) и mocks.

const LEVEL = (pct) => (pct >= 70 ? 'strong' : pct >= 50 ? 'mid' : 'weak');

// Освоение по темам: сколько решено, сколько верно, уровень.
export function topicStats(attempts, topicList) {
  const by = {};
  for (const a of attempts) {
    const k = a.topic || '—';
    by[k] = by[k] || { tried: 0, ok: 0, secs: 0, days: new Set() };
    by[k].tried++;
    if (a.correct) by[k].ok++;
    by[k].secs += a.secs || 0;
    const d = a.at?.seconds ? new Date(a.at.seconds * 1000).toDateString() : null;
    if (d) by[k].days.add(d);
  }
  return topicList
    .map((t) => {
      const s = by[t.id];
      if (!s || !s.tried) return null;
      const pct = Math.round((s.ok / s.tried) * 100);
      return {
        id: t.id, name: t.name, block: t.block,
        tried: s.tried, pct, level: LEVEL(pct), days: s.days.size,
      };
    })
    .filter(Boolean);
}

// Общая готовность: средний процент по темам, где были попытки.
export function readiness(stats) {
  if (!stats.length) return 0;
  return Math.round(stats.reduce((s, t) => s + t.pct, 0) / stats.length);
}

// Часы занятий по дням текущей недели (Дс…Жс).
export function weekHours(attempts) {
  const DAYS = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб'];
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const out = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс'].map((d) => ({ day: d, hours: 0 }));
  for (const a of attempts) {
    if (!a.at?.seconds) continue;
    const t = new Date(a.at.seconds * 1000);
    if (t < monday) continue;
    const idx = (t.getDay() + 6) % 7;          // Дс = 0
    out[idx].hours += (a.secs || 0) / 3600;
  }
  return out.map((d) => ({ ...d, hours: Math.round(d.hours * 10) / 10 }));
}

// Баллы мок-тестов по неделям (для графика роста).
export function mockSeries(mocks) {
  return [...mocks]
    .filter((m) => m.at?.seconds)
    .sort((a, b) => a.at.seconds - b.at.seconds)
    .slice(-6)
    .map((m, i) => ({
      label: `${i + 1}-ап`,
      score: m.score || 0,
      max: m.gradable || 0,
      school: m.school || '',
    }));
}
