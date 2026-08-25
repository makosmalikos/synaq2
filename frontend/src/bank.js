// Единый банк задач: РФМШ + НИШ (+ КТЛ/БИЛ — один формат, сейчас банк пуст).
import * as DATA from './data.js';
import { db } from './firebase.js';
import { collection, getDocs } from 'firebase/firestore';

const questions  = DATA.questions  || [];
const nishMath   = DATA.nishMath   || [];
const bilQ       = DATA.bilQ       || [];
const ktlQ       = DATA.ktlQ       || [];
const ktlNish    = DATA.ktlNish    || [];
const kolzar2    = DATA.kolzar2    || [];
const kolzar3    = DATA.kolzar3    || [];
const logic1     = DATA.logic1     || [];
const variantA2  = DATA.variantA2  || [];

const RULES = [
  ['pct',   /процент|%|пайыз|скидк|наценк|подорожа|подешев|годовых|депозит|выручк|прибыл|раствор|сплав|концентрац|құрам|пайда/i],
  ['geo',   /площад|периметр|объ[её]м|көлем|аудан|треугольник|прямоугольник|квадрат|окружност|радиус|диаметр|шеңбер|шаршы|тіктөртбұрыш|үшбұрыш|параллелепипед|куб|градус|бұрыш|\bугол|стрелк|координат|отрезок|кесінді|масштаб|см2|м2|см3|қабырға/i],
  ['work',  /за сколько (дней|часов|минут)|производительн|рабочи|каменщик|труб[аы]|бассейн|наполн|вместе (выполн|за)|бірге|жұмысшы|среднее арифметическ|орташа арифметик|в среднем|среднее значение|орташа/i],
  ['ratio', /скорост|км\/ч|км\/сағ|жылдамдық|навстречу|догон|течени[еюя]|против течения|отношени[еяю]|относятся|қатынас|пропорци|бөліп|санының/i],
  ['seq',   /последовательн(?!ых (нечётных|чётных))|продолжите ряд|жалғастыр|закономерн|ряд чисел|тізбек|следующ[еи][йе] числ|кажд(ая|ой) части? длиннее|әр бөлік/i],
  ['comb',  /сколькими способами|неше тәсіл|комбинац|перестанов|вероятн|лжец|өтірікші|турнир|шахмат|рукопожат|амандасу|способов|букет/i],
  ['sys',   /неравенств|теңсіздік|систем[ауы] ур|жүйе|множеств|жиын|пересечени|объединени|қиылыс|интервал|аралығ|диаграмм|и то, и другое|екеуін де|ни то ни другое|оба предмета/i],
  ['num',   /НОД|НОК|ЕҮОБ|ЕКОЕ|дели(тся|мо[ес]|тел)|бөлін|бөлгіш|еселік|прост[оы]е числ|жай сан|составн[оы]e числ|құрама сан|разряд|цифр|остат[ко]|қалдық|кратн|на простые|жай көбейткіш|факториал|нол[ья]ми|оканчива|аяқтал|последовательных (нечётных|чётных|чисел)|тақ сан|жұп сан|чётн/i],
  ['frac',  /дроб|бөлшек|десятичн|ондық|обратн[оы]e число|кері сан|противоположн|қарама-қарсы|найдите (сумму|разность|произведение|частное)|сандардың (қосындысын|айырмасын|көбейтіндісін|бөліндісін)|вычислите|есепте|выполните действи|амалды орында|значение выражения|өрнектің мәнін|раскройте скобк|жақшаны аш|целую часть|бүтін бөлі|модул|обратите|айналдыр/i],
  ['eq',    /уравнени|теңдеу|корень|түбір|упрост|ықшамда|подобные слагаемые|ұқсас қосылғыш|неизвестн|белгісіз|задуманное число|ойланған сан|возраст|\bлет\b|жаста|старше|младше|үлкен|кіші|уменьшаемо|вычитаемо|азайғыш|азайтқыш|операци|⊕|в \d+ раза? (больше|меньше)|есе (артық|кем)/i],
  ['spat',  /куб(ик)?ов|развёртк|фигур|клетчат|сетк|рисунк|сурет|кеңістік|треугольников можно найти|квадратов можно/i],
];

function guessTopic(text) {
  let best = 'num', score = 0;
  for (const [topic, re] of RULES) {
    const n = (text.match(new RegExp(re.source, 'gi')) || []).length;
    if (n > score) { score = n; best = topic; }
  }
  return best;
}

const SUBJ_TOPIC = { kolzar: 'kolzar', kaz: 'lang_kaz', rus: 'lang_rus', eng: 'lang_eng', logic: 'mtx' };

// ── На каком языке реально написано условие ──
// В data.js есть задачи вперемешку: часть РФМШ/НИШ написана по-русски, часть —
// по-казахски, без единой пометки языка. Определяем по казахским буквам
// (ә/і/ң/ғ/ү/ұ/қ/ө/һ, которых в русском алфавите нет) — это надёжнее, чем
// доверять источнику. Для предметов-языков (kaz/rus/eng) язык известен заранее
// и не зависит от текста (урок английского не «становится казахским»).
const KK_LETTERS = /[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/;
const SUBJ_LANG = { kaz: 'kk', rus: 'ru', eng: 'en' };
const TOPIC_LANG = { lang_kaz: 'kk', lang_rus: 'ru', lang_eng: 'en' };
export function detectLang(q) {
  return SUBJ_LANG[q.subject] || TOPIC_LANG[q.topic] || (KK_LETTERS.test(q.statement || '') ? 'kk' : 'ru');
}

function cleanLang(text) {
  if (!text) return text;
  let s = String(text);
  s = s.replace(/^\s*(Текст|Мәтін|Text|Passage)\s*[:.\-–]\s*/i, '');
  s = s.replace(/\s*\n?\s*(Вопрос|Сұрақ|Question)\s*[:.\-–]\s*/gi, '\n\n');
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

const LANGS = ['rus', 'eng', 'kaz'];

const one = (q, school) => ({
  id: q.id,
  school,
  subject: q.subject || null,
  topic: q.topic || SUBJ_TOPIC[q.subject] || guessTopic(`${q.statement} ${q.answer ?? ''}`),
  num: q.num,
  statement: LANGS.includes(q.subject) ? cleanLang(q.statement) : q.statement,
  answer: q.answer,
  solution: q.solution || '',
  image: q.image || null,
  options: q.options || null,
  lang: detectLang(q),
});

const RAW_POOL = [
  ...questions.map((q) => one(q, 'РФМШ')),
  ...nishMath.map((q) => one(q, 'НИШ')),
  ...bilQ.map((q) => one(q, 'БИЛ')),
  ...ktlQ.map((q) => one(q, 'КТЛ')),
  ...ktlNish.map((q) => one(q, 'НИШ')),
  ...kolzar2.map((q) => one(q, 'НИШ')),
  ...kolzar3.map((q) => one(q, 'НИШ')),
  ...logic1.map((q) => one(q, 'НИШ')),
  ...variantA2.map((q) => one(q, 'НИШ')),
];

// Эти ссылки есть в импортированных данных, но самих файлов в public/figures нет.
// Держим список рядом с банком, чтобы такие вопросы не попадали детям. Валидатор
// проверяет, что список можно сокращать по мере восстановления изображений.
const MISSING_FIGURES = new Set([
  '/figures/logic66.png',
  '/figures/logic67.png',
  '/figures/logic68.png',
  '/figures/logic69.png',
  '/figures/logic70.png',
  '/figures/a2_img1.png',
  '/figures/a2_img2.png',
  '/figures/a2_img3.png',
  '/figures/a2_img4.png',
  '/figures/a2_img5.png',
  '/figures/a2_img6.png',
  '/figures/a2_img7.png',
  '/figures/a2_img8.png',
  '/figures/a2_img9.png',
  '/figures/a2_img10.png',
  '/figures/a2_img11.png',
  '/figures/a2_img13.png',
]);

function quarantineReason(q) {
  if (!q.id || !String(q.id).trim()) return 'missing_id';
  if (!q.statement || !String(q.statement).trim()) return 'missing_statement';
  if (q.answer == null || !String(q.answer).trim()) return 'missing_answer';
  if (q.options != null && (!Array.isArray(q.options) || q.options.length < 2)) return 'insufficient_options';
  if (Array.isArray(q.options) && !q.options.map(String).includes(String(q.answer))) return 'answer_not_in_options';
  if (q.image && MISSING_FIGURES.has(q.image)) return 'missing_image';
  return null;
}

// Сохраняем первый встретившийся ID, чтобы не ломать уже записанный прогресс.
// Только последующие совпадения получают стабильный суффикс __dupN. Нормализуем
// до карантина, чтобы восстановление вопроса не меняло ID остальных заданий.
const usedIds = new Set();
function withUniqueId(q) {
  if (q.id == null || !String(q.id).trim()) return q;
  const base = String(q.id);
  let id = base;
  let n = 2;
  while (usedIds.has(id)) id = `${base}__dup${n++}`;
  usedIds.add(id);
  return id === base ? q : { ...q, id, originalId: base };
}

const reviewed = RAW_POOL
  .map((q) => withUniqueId(q))
  .map((q) => ({ question: q, reason: quarantineReason(q) }));

// Экспорт нужен валидатору и позволяет видеть масштаб проблем без выдачи
// повреждённых заданий пользователям.
export const BANK_QUARANTINE = reviewed
  .filter((item) => item.reason)
  .map(({ question, reason }) => ({ ...question, quarantineReason: reason }));

export const POOL = reviewed
  .filter((item) => !item.reason)
  .map((item) => item.question);

export const EXTRA_TOPICS = [
  { id: 'kolzar',   block: 'math',     name: 'Сандық салыстыру (колхар)' },
  { id: 'lang_kaz', block: 'lang_kaz', name: 'Қазақ тілі' },
  { id: 'lang_rus', block: 'lang_rus', name: 'Орыс тілі' },
  { id: 'lang_eng', block: 'lang_eng', name: 'Ағылшын тілі' },
];

// ── Живой пул: задачи, добавленные через Admin Panel (Firestore → bankTasks) ──
// data.js остаётся статическим файлом — ничего в нём не переписывается. Задачи,
// которые сохраняет администратор (api/admin-task.js), читаются отсюда один раз
// при загрузке приложения и подмешиваются в уже существующие POOL/BANK_QUARANTINE
// через .push() — т.к. это те же самые массивы (const фиксирует ссылку, не
// содержимое), все, кто уже сделал `import { POOL } from './bank.js'`, увидят
// новые задачи без пересборки и передеплоя, как только придёт ответ от Firestore.
function normalizeAdminTask(raw) {
  return {
    id: raw.id,
    school: raw.school || null,
    topic: raw.topic || null,
    difficulty: raw.difficulty ?? null,
    statement: raw.statement || '',
    answer: raw.answer ?? null,
    solution: raw.solution || '',
    image: raw.image || null,
    options: Array.isArray(raw.options) ? raw.options : null,
    lang: detectLang({ topic: raw.topic, statement: raw.statement }),
  };
}

(async function loadAdminTasks() {
  try {
    const snap = await getDocs(collection(db, 'bankTasks'));
    const seenIds = new Set(POOL.map((q) => q.id));
    for (const docSnap of snap.docs) {
      const q = normalizeAdminTask({ id: docSnap.id, ...docSnap.data() });
      const reason = seenIds.has(q.id) ? 'duplicate_id' : quarantineReason(q);
      if (reason) { BANK_QUARANTINE.push({ ...q, quarantineReason: reason }); continue; }
      seenIds.add(q.id);
      POOL.push(q);
    }
  } catch (e) {
    // Тренировка на статическом банке продолжает работать и без admin-задач.
    console.warn('bankTasks (задачи администратора) не загрузились:', e?.message || e);
  }
})();
