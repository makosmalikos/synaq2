// Единый банк задач. Три исходных банка лежат в data.js в РАЗНЫХ схемах:
//   questions (РФМШ) — есть topic, есть school
//   nishMath  (НИШ)  — есть subject, НЕТ ни topic, ни school
//   bilQ      (БИЛ)  — есть school и subject, НЕТ topic
// Пока они такие, отфильтровать задачи по школе нечем. Здесь всё сводится
// к одной схеме, чтобы работал выбор нескольких школ и перемешивание.
import { topics as baseTopics, questions, nishMath, bilQ, variants as rfmshVariants } from './data.js';
import { KK } from './kk.js';
import { generate, canGenerate } from './generators.js';

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

// Задачи из реальных вариантов.
const REAL = [
  ...questions.map((q) => norm(q, 'РФМШ')),
  ...nishMath.map((q) => norm(q, 'НИШ')),
  ...bilQ.map((q) => norm(q, 'БИЛ')),
];

// Сгенерированные задачи — прямо в банк, наравне с настоящими.
// Тип задачи взят из реальных вариантов, числа и слова новые.
// Сразу по-казахски и с полным разбором.
// Языковые генераторы шаблонные: из 20 шаблонов больше 20 разных задач не выжать.
// Поэтому просим с запасом и выкидываем повторы по тексту — иначе в одной теме
// окажется одна и та же задача под разными номерами.
const PER_TOPIC = 40;
const seen = new Set();
const GENERATED = TOPICS
  .filter((t) => canGenerate(t.id))
  .flatMap((t) => generate(PER_TOPIC * 2, t.id))
  .filter((q) => {
    const k = q.topic + '|' + q.statement;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  })
  .reduce((acc, q) => {
    const n = acc.filter((x) => x.topic === q.topic).length;
    if (n < PER_TOPIC) acc.push(q);
    return acc;
  }, []);

export const POOL = [...REAL, ...GENERATED];

// Мок-варианты собираем ТОЛЬКО из настоящих экзаменационных задач.
// Мок должен быть репетицией реального экзамена, а не тренажёром.
export const REAL_POOL = REAL;

// ── Перемешивание ──────────────────────────────────────────────────────
// Дайындык берёт весь банк. Но просто shuffle не годится: НИШ с его 445
// задачами забил бы ленту, а РФМШ почти не появлялся бы. Поэтому берём
// по одной задаче из каждой школы по кругу.
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);

export function mixAcrossSchools(items) {
  const groups = [...SCHOOLS, 'Synaq'];
  const buckets = groups.map((s) => shuffle(items.filter((q) => q.school === s))).filter((b) => b.length);
  const out = [];
  for (let i = 0; buckets.some((b) => i < b.length); i++) {
    for (const b of buckets) if (i < b.length) out.push(b[i]);
  }
  return out;
}

// ── Казахская локализация ──────────────────────────────────────────────
// Перевода ещё нет — отдаём русский текст, но помечаем needsTranslation,
// чтобы на карточке был честный бейдж «рус», а не молчаливая подмена языка.
export function localize(q, lang = 'kk') {
  if (lang !== 'kk') return q;
  if (q.block === 'lang') return q;      // орыс/ағылшын тілі — язык и есть предмет
  if (q.lang === 'kk') return q;
  const t = KK[q.id];
  if (t) return { ...q, statement: t.s, solution: t.sol || q.solution };
  return { ...q, needsTranslation: true };
}
const loc = (list, lang) => list.map((q) => localize(q, lang));

// ── Дайындык: весь банк, школы не спрашиваем ───────────────────────────
export function topicsAll() {
  return TOPICS
    .map((t) => {
      const qs = POOL.filter((q) => q.topic === t.id);
      return { ...t, count: qs.length, schools: [...new Set(qs.map((q) => q.school))] };
    })
    .filter((t) => t.count > 0);
}

export function topicQuestionsAll(topicId, lang = 'kk') {
  return loc(mixAcrossSchools(POOL.filter((q) => q.topic === topicId)), lang);
}

export function mixedAll(lang = 'kk', limit = 20, block = null) {
  const items = block ? POOL.filter((q) => q.block === block) : POOL;
  return loc(mixAcrossSchools(items).slice(0, limit), lang);
}

// ── Мок-варианты ───────────────────────────────────────────────────────
// РФМШ уже собраны в data.js. Для НИШ собираем сами (в data.js их нет вообще),
// БИЛ — один вариант. Языковые предметы в мок не берём: это отдельный экзамен.
// НИШ: 40 математика + 20 сандық салыстыру + по 20 на каждый язык
// (қазақ, орыс, ағылшын) = 120 вопросов. Задачи тянутся СЛУЧАЙНО из всего банка.
//
// ВНИМАНИЕ: қазақ тілі в банке всего 13 задач, а формату нужно 20.
// Дублировать внутри одного варианта нельзя, поэтому блок казахского выходит
// НЕПОЛНЫМ — 13 вместо 20. Довести до формата = долить ≥7 задач (лучше 60+,
// иначе все шесть вариантов будут с одинаковым казахским).
const NISH_MATH = 40;
const NISH_CMP  = 20;
const NISH_LANG = { lang_kaz: 20, lang_rus: 20, lang_eng: 20 };
// Пока делаем только ПЕРВЫЙ вариант — остальные соберём, когда пополнится банк.
const NISH_COUNT = 1;

// Дублей внутри одного варианта быть не должно — ребёнок не должен встретить
// ту же задачу дважды. Поэтому если задач меньше, чем просят, берём сколько
// есть, а не зацикливаем список.
const rndPick = (arr, n) => shuffle(arr).slice(0, n);

const nishVariants = Array.from({ length: NISH_COUNT }, (_, i) => {
  const qs = [
    ...rndPick(REAL_POOL.filter((q) => q.block === 'math'), NISH_MATH),
    ...rndPick(REAL_POOL.filter((q) => q.topic === 'cmp'), NISH_CMP),
    ...Object.entries(NISH_LANG).flatMap(([t, n]) => rndPick(REAL_POOL.filter((q) => q.topic === t), n)),
  ];
  return {
    id: `nish_v${i + 1}`,
    school: 'НИШ',
    title: `НИШ · Байқау сынағы · ${i + 1}-нұсқа`,
    timeLimitMin: 240,
    questions: qs.map((q, k) => ({ ...q, num: k + 1 })),
  };
});

// БИЛ: мок-тест пока не собираем — в интерфейсе «Жақында ашылады».
//
// Формат, когда будем делать: 60 вопросов = 40 математика + 10 қазақ тілі
// + 10 логика, 100 минут. Баллы: каждые 4 неверных ответа съедают 1 верный,
// остаток × 1,5. Формула уже написана в api.js — вариант помечается
// scoring: 'bil', и подсчёт включается сам.
const bilVariants = [];

export const VARIANTS = [
  // Вопросы РФМШ-вариантов в data.js без id. Привязываем их к id банка
  // (rfmsh2025_v1 + №1 → «v1_1»), иначе переводы в моке не подхватятся.
  // Пока показываем только первый вариант.
  ...rfmshVariants.slice(0, 1).map(v => {
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

export function localizeVariant(v, lang = 'kk') {
  return { ...v, questions: v.questions.map(q => localize(q, lang)) };
}
