// Данные вшиты в приложение (data.js + bank.js) — бэкенд не требуется.
// Задачи без проверяемого ответа не участвуют в автопроверке.
import { topics as BASE_TOPICS, variants } from './data.js';
import { POOL, EXTRA_TOPICS } from './bank.js';
import { auth } from './firebase.js';

const P = (x) => Promise.resolve(x);
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);

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

// ── Мок-тест НИШ ──
// Готовых вариантов НИШ в банке нет, поэтому собираем их сами по формату экзамена:
// математика 40 · колзар 20 · ағылшын 20 · орыс 20 · қазақ 20.
// Секция 1 — математика и колзар. Секция 2 — языки. Между ними перерыв.
const NISH_SPEC = [
  ['math', 40, 1], ['kolzar', 20, 1],
  ['eng', 20, 2], ['rus', 20, 2], ['kaz', 20, 2],
];
const NISH_TIME_MIN = 150;

function buildNish() {
  const qs = [];
  for (const [subj, want, section] of NISH_SPEC) {
    // казахских задач у НИШ мало — добираем из БИЛ
    const pool = shuffle(POOL.filter((q) => (q.school === 'НИШ' || q.school === 'БИЛ') && q.subject === subj));
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

function bilPool(subj) {
  // КТЛ и БИЛ — один формат; оба банка пусты до нового импорта.
  const all = POOL.filter((q) => (q.school === 'БИЛ' || q.school === 'КТЛ') && q.subject === subj);
  const ok = (q) => q.answer != null && String(q.answer).trim() !== '';
  return [...shuffle(all.filter(ok)), ...shuffle(all.filter((q) => !ok(q)))];
}

function buildBil() {
  const qs = [];
  for (const [subj, want, section] of BIL_SPEC) {
    const pool = bilPool(subj);
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

  topicQuestions: (id) => P(shuffle(POOL.filter((q) => q.topic === id && q.answer != null && String(q.answer).trim() && String(q.answer).trim() !== '—'))),

  // Аралас дайындык: только математические блоки, вперемешку по школам.
  mixed: (_lang, limit = 20, block = 'math') => {
    const ids = ALL_TOPICS.filter((t) => t.block === block).map((t) => t.id);
    return P(shuffle(POOL.filter((q) => ids.includes(q.topic))).slice(0, limit));
  },

  // ── Мок-тест ──
  schools: () => P([
    { code: 'РФМШ', ready: variants.some((v) => v.school === 'РФМШ') },
    { code: 'НИШ',  ready: POOL.some((q) => q.school === 'НИШ') },
    { code: 'БИЛ',  ready: POOL.some((q) => (q.school === 'БИЛ' || q.school === 'КТЛ') && q.subject === 'math') },
  ]),

  // Случайный вариант по школе. Никакого выбора «нұсқа» — жмёшь школу и решаешь.
  mockRandom: (school) => {
    let v;
    if (school === 'НИШ') {
      v = buildNish();
    } else if (school === 'БИЛ') {
      v = buildBil();
    } else {
      const pool = variants.filter((x) => x.school === school);
      if (!pool.length) return P(null);
      const src = pool[Math.floor(Math.random() * pool.length)];
      v = { ...src, id: `${src.id}_${Date.now()}`, sections: 1,
            questions: src.questions.map((q) => ({ ...q, section: 1 })) };
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
        num: q.num, topic: q.topic || null, subject: q.subject || null, school: v.school,
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
// Оригиналы в data.js — на русском. Если выбран казахский, условия математики,
// логики и колзара переводим через /api/explain (режим translate) и кешируем.
// Задачи по языкам (орыс/ағылшын/қазақ тілі) НЕ переводим: перевод убивает задание.
const LANG_SUBJECTS = ['rus', 'eng', 'kaz'];
const trCache = new Map();

export const translatable = (q) => !LANG_SUBJECTS.includes(q.subject);

export async function translateQuestions(list, lang) {
  // Банктегі есептер қазақша жазылған. Сондықтан 'kk' кезінде аудармаймыз,
  // басқа тілде (мыс. 'ru') — /api/explain арқылы аударамыз.
  if (lang === 'kk' || !list?.length) return list;

  const need = list.filter((q) => translatable(q) && !trCache.has(`${q.id}_${lang}`));

  if (need.length) {
    try {
      const token = await auth.currentUser?.getIdToken?.();
      const r = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          mode: 'translate',
          lang,
          items: need.map((q) => ({ id: q.id, statement: q.statement, solution: q.solution || '' })),
        }),
      });
      const data = await r.json();
      for (const [id, v] of Object.entries(data || {})) trCache.set(`${id}_${lang}`, v);
    } catch (e) {
      console.warn('перевод не удался — показываем оригинал', e);
    }
  }

  return list.map((q) => {
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
