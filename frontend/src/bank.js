// Единый банк задач. Три исходных банка лежат в data.js в РАЗНЫХ схемах:
//   questions (РФМШ) — есть topic, есть school
//   nishMath  (НИШ)  — есть subject, НЕТ ни topic, ни school
//   bilQ      (БИЛ)  — есть school и subject, НЕТ topic
// Пока они такие, отфильтровать задачи по школе нечем. Здесь всё сводится
// к одной схеме, чтобы работал выбор нескольких школ и перемешивание.
import { topics as baseTopics, questions, nishMath, bilQ, variants as rfmshVariants } from './data.js';
import { KK } from './kk.js';

// ── Темы ───────────────────────────────────────────────────────────────
// К 12 базовым добавляем «сандық салыстыру» (колзар) и языковые предметы НИШ.
export const TOPICS = [
  ...baseTopics,
  { id: 'cmp',      block: 'logic', name: 'Сандық салыстыру',  nameRu: 'Количественное сравнение' },
  { id: 'lang_kaz', block: 'lang',  name: 'Қазақ тілі',        nameRu: 'Казахский язык' },
  { id: 'lang_rus', block: 'lang',  name: 'Орыс тілі',         nameRu: 'Русский язык' },
  { id: 'lang_eng', block: 'lang',  name: 'Ағылшын тілі',      nameRu: 'Английский язык' },
];
const BLOCK = Object.fromEntries(TOPICS.map(t => [t.id, t.block]));

export const SCHOOLS = ['РФМШ', 'НИШ', 'БИЛ'];

// ── Язык задачи ────────────────────────────────────────────────────────
// Специфические казахские буквы — самый надёжный признак.
const KK_LETTERS = /[әғқңөұүһі]/i;
function detectLang(s = '') {
  if (KK_LETTERS.test(s)) return 'kk';
  if (/[а-яё]/i.test(s)) return 'ru';
  return 'en';
}

// ── Автоклассификатор тем для НИШ (у 445 задач темы нет вообще) ─────────
const RULES = [
  ['pct',   /%|пайыз|процент/i],
  ['geo',   /периметр|аудан|площад|куб|шеңбер|окружност|радиус|тіктөртбұрыш|прямоугольн|квадрат|шаршы|параллелепипед|бұрыш|угол|градус|көлем|объ[её]м/i],
  ['num',   /ЕҮОБ|ЕКОЕ|НОД|НОК|жай сан|құрама сан|простое|составное|бөлгіш|делител|еселік|кратн|разряд|таңбалы|цифр/i],
  ['ratio', /жылдамдық|скорост|қатынас|отношени|масштаб|км\/сағ|км\/ч|бөлі[кг]|пропорц/i],
  ['work',  /орташа|средн|бірге|вместе|өнімділік|бірінші күні|за \d+ (ч|сағ)/i],
  ['frac',  /бөлшек|дроб|ондық|десятичн|аралас сан/i],
  ['eq',    /теңдеу|уравнени|ықшамда|упрост|өрнек|выражени|жақша|скобк|шеш/i],
  ['comb',  /неше тәсіл|сколькими способ|ойлан|задуман|жасы|возраст|лет|жыл/i],
];
function classifyTopic(q) {
  if (q.topic) return q.topic;
  if (q.subject === 'kolzar') return 'cmp';
  if (q.subject === 'kaz') return 'lang_kaz';
  if (q.subject === 'rus') return 'lang_rus';
  if (q.subject === 'eng') return 'lang_eng';
  const s = q.statement || '';
  for (const [id, re] of RULES) if (re.test(s)) return id;
  return 'num';
}

// ── Нормализация в единую схему ────────────────────────────────────────
function norm(q, school) {
  const topic = classifyTopic(q);
  return {
    ...q,
    id: q.id,
    school,
    topic,
    block: BLOCK[topic] || 'math',
    subject: q.subject || 'math',
    lang: detectLang(q.statement),
    statement: q.statement,
    solution: q.solution || '',
    answer: q.answer ?? null,
    options: q.options || null,
    image: q.image || null,
  };
}

export const POOL = [
  ...questions.map(q => norm(q, 'РФМШ')),
  ...nishMath.map(q => norm(q, 'НИШ')),
  ...bilQ.map(q => norm(q, 'БИЛ')),
];

// ── Выбор школ ─────────────────────────────────────────────────────────
// Школы приходят массивом. Старые аккаунты хранят одну строку — терпим оба.
export function parseSchools(v) {
  const arr = Array.isArray(v) ? v : (v ? [v] : []);
  const out = arr.map(s => String(s).trim()).filter(s => SCHOOLS.includes(s));
  return out.length ? out : ['РФМШ'];
}
const bySchools = (schools) => POOL.filter(q => schools.includes(q.school));

// ── Перемешивание по кругу ─────────────────────────────────────────────
// Если просто shuffle всего пула, НИШ (445 задач) забьёт выдачу и РФМШ почти
// не появится. Поэтому берём по одной задаче из каждой школы по очереди.
const shuffle = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

export function mixAcrossSchools(items, schools) {
  const buckets = schools.map(s => shuffle(items.filter(q => q.school === s))).filter(b => b.length);
  const out = [];
  for (let i = 0; buckets.some(b => i < b.length); i++) {
    for (const b of buckets) if (i < b.length) out.push(b[i]);
  }
  return out;
}

// ── Казахская локализация ──────────────────────────────────────────────
// Если перевода ещё нет — отдаём русский текст, но помечаем needsTranslation,
// чтобы на карточке был честный бейдж «рус», а не молчаливая подмена языка.
export function localize(q, lang = 'kk') {
  if (lang !== 'kk') return q;
  if (q.block === 'lang') return q;      // орыс/ағылшын тілі — язык и есть предмет
  if (q.lang === 'kk') return q;
  const t = KK[q.id];
  if (t) return { ...q, statement: t.s, solution: t.sol || q.solution };
  return { ...q, needsTranslation: true };
}
const loc = (list, lang) => list.map(q => localize(q, lang));

// ── Публичный доступ ───────────────────────────────────────────────────
export function topicsFor(schools) {
  const items = bySchools(schools);
  return TOPICS
    .map(t => {
      const qs = items.filter(q => q.topic === t.id);
      return { ...t, count: qs.length, schools: [...new Set(qs.map(q => q.school))] };
    })
    .filter(t => t.count > 0);
}

export function topicQuestions(topicId, schools, lang = 'kk') {
  const items = bySchools(schools).filter(q => q.topic === topicId);
  return loc(mixAcrossSchools(items, schools), lang);
}

export function mixedQuestions(schools, lang = 'kk', limit = 15, block = null) {
  let items = bySchools(schools);
  if (block) items = items.filter(q => q.block === block);
  return loc(mixAcrossSchools(items, schools).slice(0, limit), lang);
}

// ── Мок-варианты ───────────────────────────────────────────────────────
// РФМШ уже собраны в data.js. Для НИШ собираем сами (в data.js их нет вообще),
// БИЛ — один вариант. Языковые предметы в мок не берём: это отдельный экзамен.
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i + n <= arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const nishPool = POOL.filter(q => q.school === 'НИШ' && q.block !== 'lang');
const nishVariants = chunk(nishPool, 30).slice(0, 10).map((qs, i) => ({
  id: `nish_v${i + 1}`,
  school: 'НИШ',
  title: `НИШ · Байқау сынағы · ${i + 1}-нұсқа`,
  timeLimitMin: 90,
  questions: qs.map((q, k) => ({ ...q, num: k + 1 })),
}));

// В БИЛ математика и «сандық салыстыру» нумеруются каждая с 1 — в одном
// варианте это давало два разных вопроса под номером 1 и ответы конфликтовали.
const bilPool = POOL.filter(q => q.school === 'БИЛ');
const bilVariants = [{
  id: 'bil_v1',
  school: 'БИЛ',
  title: 'БИЛ · Байқау сынағы',
  timeLimitMin: 60,
  questions: [
    ...bilPool.filter(q => q.subject === 'math'),
    ...bilPool.filter(q => q.subject !== 'math'),
  ].map((q, k) => ({ ...q, num: k + 1 })),
}];

export const VARIANTS = [
  // Вопросы РФМШ-вариантов в data.js без id. Привязываем их к id банка
  // (rfmsh2025_v1 + №1 → «v1_1»), иначе переводы в моке не подхватятся.
  ...rfmshVariants.map(v => {
    const vkey = v.id.replace('rfmsh2025_', '');
    return {
      ...v,
      school: 'РФМШ',
      questions: v.questions.map(q => ({
        ...q,
        id: q.id || `${vkey}_${q.num}`,
        school: 'РФМШ',
        block: BLOCK[q.topic] || 'math',
        lang: detectLang(q.statement),
      })),
    };
  }),
  ...nishVariants,
  ...bilVariants,
];

export function variantsFor(schools) {
  return VARIANTS.filter(v => schools.includes(v.school));
}

export function localizeVariant(v, lang = 'kk') {
  return { ...v, questions: v.questions.map(q => localize(q, lang)) };
}
