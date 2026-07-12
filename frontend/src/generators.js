// Генератор похожих задач. Тип задачи сохраняется, числа каждый раз новые —
// значит, натаскаться на конкретный ответ нельзя, надо понять метод.
// Всё по-казахски: банк наполовину русский, а генератор пишем сразу правильно.

const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const NAMES = ['Айгерім', 'Дәулет', 'Мадина', 'Ерасыл', 'Аружан', 'Нұрлан', 'Әсем', 'Тимур'];

// ── Головы и ноги (В2 №4, В4 №7) ──
function headsLegs() {
  const chick = r(5, 25), four = r(3, 20);
  const heads = chick + four, legs = chick * 2 + four * 4;
  return {
    topic: 'work',
    statement: `Ауладағы тауықтар мен қойлардың басы ${heads}, аяғы ${legs}. Тауық нешеу?`,
    answer: String(chick),
    solution: `Барлығы қой деп есептесек, аяқ саны ${heads}·4 = ${heads * 4} болар еді. Шын мәнінде ${legs}, айырмасы ${heads * 4 - legs}. Әр тауық 2 аяққа кем, сондықтан тауық саны ${heads * 4 - legs} : 2 = ${chick}.`,
  };
}

// ── Две подряд идущие наценки (В3 №15, В4 №17) ──
function twoPercents() {
  const p1 = r(1, 4) * 5, p2 = r(1, 4) * 5;
  const k = (1 + p1 / 100) * (1 + p2 / 100);
  const pct = Math.round((k - 1) * 10000) / 100;
  return {
    topic: 'pct',
    statement: `Тауар бағасы ${p1}%-ға қымбаттады, содан кейін жаңа баға тағы ${p2}%-ға қымбаттады. Бастапқы бағамен салыстырғанда тауар неше пайызға қымбаттады?`,
    answer: `${pct}%`,
    solution: `Пайыздарды жай қосуға болмайды — екінші өсім жаңа бағадан алынады. Бастапқы бағаны 1 деп алсақ: 1 · ${(1 + p1 / 100).toFixed(2)} · ${(1 + p2 / 100).toFixed(2)} = ${k.toFixed(4)}. Демек өсім ${pct}%.`,
  };
}

// ── Скидка от известной конечной цены (В1 №17) ──
function discount() {
  const p = r(2, 6) * 5;               // 10..30%
  const base = r(12, 40) * 100;
  const final = Math.round(base * (100 - p) / 100);
  return {
    topic: 'pct',
    statement: `Дүкенде барлық тауар ${p}%-ға арзандады. Жеңілдіктен кейін кітаптың бағасы ${final} теңге. Кітап неше теңгеге арзандады?`,
    answer: String(base - final),
    solution: `Жеңілдіктен кейінгі баға — бастапқысының ${100 - p}%-ы. Демек бастапқы баға ${final} : 0,${100 - p} = ${base} теңге. Арзандағаны: ${base} − ${final} = ${base - final} теңге.`,
  };
}

// ── Части и отношение ──
function ratioParts() {
  const a = r(2, 6), b = r(2, 6), part = r(4, 15);
  const total = (a + b) * part;
  return {
    topic: 'ratio',
    statement: `Екі баланың арасында ${total} кәмпит ${a} : ${b} қатынасымен бөлінді. Көбірек алған бала неше кәмпит алды?`,
    answer: String(Math.max(a, b) * part),
    solution: `Барлығы ${a} + ${b} = ${a + b} үлес. Бір үлес: ${total} : ${a + b} = ${part} кәмпит. Көбірек алған бала ${Math.max(a, b)} үлес алады: ${Math.max(a, b)} · ${part} = ${Math.max(a, b) * part}.`,
  };
}

// ── Совместная работа (трубы) ──
function pipes() {
  const t1 = r(2, 9), t2 = r(2, 9);
  const t = Math.round((t1 * t2 / (t1 + t2)) * 100) / 100;
  return {
    topic: 'work',
    statement: `Бірінші құбыр бассейнді ${t1} сағатта, екіншісі ${t2} сағатта толтырады. Екеуі бірге қанша сағатта толтырады?`,
    answer: String(t),
    solution: `Жұмысты 1 деп аламыз. Бірінші сағатына 1/${t1} бөлігін, екіншісі 1/${t2} бөлігін толтырады. Бірге: 1/${t1} + 1/${t2} = ${(1 / t1 + 1 / t2).toFixed(4)}. Уақыт = 1 : ${(1 / t1 + 1 / t2).toFixed(4)} ≈ ${t} сағат.`,
  };
}

// ── Скорость: поезд и мост (В1 №19) ──
function trainBridge() {
  const v = r(10, 25);                 // м/с
  const len = r(10, 30) * 10;          // длина поезда
  const bridge = r(20, 60) * 10;
  const t1 = len / v, t2 = (len + bridge) / v;
  return {
    topic: 'ratio',
    statement: `Пойыз бағанадан ${t1} секундта, ал ұзындығы ${bridge} м көпірден ${t2} секундта өтеді. Пойыздың ұзындығы қандай?`,
    answer: `${len} м`,
    solution: `Бағанадан өткенде пойыз өз ұзындығына тең жол жүреді: L = ${t1}·v. Көпірден өткенде L + ${bridge} = ${t2}·v. Азайтсақ: ${bridge} = ${t2 - t1}·v, демек v = ${v} м/с. Сонда L = ${t1} · ${v} = ${len} м.`,
  };
}

// ── Возраст (В1 №2) ──
function ages() {
  const kid = r(4, 9), k = r(3, 6);
  const parent = kid * k;
  const m = r(2, 3);
  const t = (parent - m * kid) / (m - 1);
  if (!Number.isInteger(t) || t <= 0) return ages();
  return {
    topic: 'comb',
    statement: `${pick(NAMES)} қазір ұлынан ${k} есе үлкен. Ұлы ${kid} жаста. Неше жылдан кейін ол ұлынан ${m} есе үлкен болады?`,
    answer: String(t),
    solution: `Қазір ана ${parent} жаста. t жылдан кейін: ${parent} + t = ${m}·(${kid} + t). Жақшаны ашамыз: ${parent} + t = ${m * kid} + ${m}t. Демек ${parent - m * kid} = ${m - 1}t, t = ${t} жыл.`,
  };
}

// ── Средний балл (В1 №3) ──
function average() {
  const n = r(8, 14), avg = r(30, 42) / 10;
  const sum = Math.round(avg * n);
  const target = Math.ceil(avg);
  const need = target * n - sum;
  if (need <= 0 || need > n) return average();
  return {
    topic: 'work',
    statement: `Оқушының ${n} бағасы бар, орташа балы ${(sum / n).toFixed(2)}. Орташа балы ${target} болу үшін неше пәннен бағасын 1 балға көтеру керек?`,
    answer: String(need),
    solution: `Бағалардың қосындысы: ${(sum / n).toFixed(2)} · ${n} = ${sum}. Орташа ${target} болу үшін қосынды ${target * n} керек. Айырмасы ${target * n} − ${sum} = ${need}. Әр көтерілген баға қосындыны 1-ге өсіреді, демек ${need} пән.`,
  };
}

// ── Делимость на 9 (В1 №9) ──
function divisible9() {
  const digits = [r(1, 4), r(5, 7)];
  const base = Number(`${digits[0]}${digits[1]}${r(1, 9)}`);
  const s = String(base).split('').reduce((a, c) => a + +c, 0);
  const need = (9 - (s % 9)) % 9;
  return {
    topic: 'num',
    statement: `${base}x төрт таңбалы саны 9-ға бөлінеді. x цифрын тап.`,
    answer: String(need),
    solution: `Сан 9-ға бөлінеді, егер цифрларының қосындысы 9-ға бөлінсе. ${String(base).split('').join(' + ')} = ${s}. ${s} + x саны 9-ға еселік болуы керек, ең кіші жарамды x = ${need}.`,
  };
}

// ── Периметр и площадь ──
function rectangle() {
  const a = r(4, 18), b = r(4, 18);
  return {
    topic: 'geo',
    statement: `Тіктөртбұрыштың қабырғалары ${a} см және ${b} см. Периметрі мен ауданының қосындысын тап.`,
    answer: String(2 * (a + b) + a * b),
    solution: `Периметр = 2·(${a} + ${b}) = ${2 * (a + b)} см. Аудан = ${a} · ${b} = ${a * b} см². Қосындысы: ${2 * (a + b)} + ${a * b} = ${2 * (a + b) + a * b}.`,
  };
}

// ── Линейное уравнение ──
function linearEq() {
  const x = r(2, 12), a = r(2, 9), b = r(1, 30);
  return {
    topic: 'eq',
    statement: `Теңдеуді шеш: ${a}x + ${b} = ${a * x + b}.`,
    answer: String(x),
    solution: `Екі жағынан ${b} азайтамыз: ${a}x = ${a * x}. Екі жағын ${a}-ға бөлеміз: x = ${x}.`,
  };
}

// ── Количественное сравнение (стиль БИЛ) ──
function compare() {
  const a1 = r(2, 12), a2 = r(2, 12), b1 = r(2, 12), b2 = r(2, 12);
  const A = a1 * a2, B = b1 + b2 * 3;
  const ans = A > B ? 'А' : (A < B ? 'В' : 'Тең');
  return {
    topic: 'cmp',
    statement: `Салыстыр (қайсысы үлкен?):\nА) ${a1} · ${a2}\nВ) ${b1} + ${b2} · 3`,
    answer: ans,
    solution: `А = ${a1} · ${a2} = ${A}. В = ${b1} + ${b2}·3 = ${b1} + ${b2 * 3} = ${B}. ${A === B ? 'Екеуі тең.' : (A > B ? 'А үлкен.' : 'В үлкен.')}`,
  };
}


// ── Дроби и вычисления ──
function fractions() {
  const a = r(2, 9), b = r(2, 9), c = r(2, 9), d = r(2, 9);
  const num = a * d + c * b, den = b * d;
  const g = (x, y) => (y ? g(y, x % y) : x);
  const k = g(num, den);
  return {
    topic: 'frac',
    statement: `Есептеңіз: ${a}/${b} + ${c}/${d}. Жауабын қысқарған бөлшек түрінде жаз.`,
    answer: `${num / k}/${den / k}`,
    solution: `Ортақ бөлім — ${den}. ${a}/${b} = ${a * d}/${den}, ${c}/${d} = ${c * b}/${den}. Қосамыз: ${num}/${den}. ${k > 1 ? `${k}-ке қысқартамыз: ${num / k}/${den / k}.` : 'Қысқармайды.'}`,
  };
}

// ── Неравенство: сумма целых решений ──
function inequality() {
  const a = r(2, 6), lo = r(1, 8), hi = lo + r(2, 6);
  const xs = [];
  for (let x = -20; x <= 40; x++) if (a * x > lo && a * x <= hi * a) xs.push(x);
  if (!xs.length) return inequality();
  return {
    topic: 'sys',
    statement: `${lo} < ${a}x ≤ ${hi * a} теңсіздігінің барлық бүтін шешімдерінің қосындысын тап.`,
    answer: String(xs.reduce((s, x) => s + x, 0)),
    solution: `Барлығын ${a}-ға бөлеміз: ${(lo / a).toFixed(2)} < x ≤ ${hi}. Бүтін шешімдер: ${xs.join(', ')}. Қосындысы = ${xs.reduce((s, x) => s + x, 0)}.`,
  };
}

// ── Последовательность ──
function sequence() {
  const start = r(2, 9), step = r(2, 9), n = r(5, 9);
  const arr = Array.from({ length: 4 }, (_, i) => start + step * i);
  return {
    topic: 'seq',
    statement: `Тізбекті жалғастыр: ${arr.join(', ')}, … ${n}-ші мүшесі нешеге тең?`,
    answer: String(start + step * (n - 1)),
    solution: `Әр келесі сан ${step}-ке артады. ${n}-ші мүше = ${start} + ${step}·${n - 1} = ${start + step * (n - 1)}.`,
  };
}

// ── Пространственное: развёртка куба ──
function cubeNet() {
  const faces = [1, 2, 3, 4, 5, 6];
  const a = pick(faces), opp = 7 - a;
  return {
    topic: 'spat',
    statement: `Кубтың қарама-қарсы жақтарындағы сандардың қосындысы әрқашан 7. Бір жағында ${a} тұрса, оған қарама-қарсы жағында қандай сан тұр?`,
    answer: String(opp),
    solution: `Қосындысы 7 болғандықтан: 7 − ${a} = ${opp}.`,
  };
}

// ── Қазақ тілі: септік жалғауы ──
const KAZ = [
  { w: 'кітап', q: 'барыс септігінде', a: 'кітапқа', why: 'қатаң дауыссызға біткен сөзге -қа жалғанады' },
  { w: 'мектеп', q: 'барыс септігінде', a: 'мектепке', why: 'қатаң дауыссызға біткен сөзге -ке жалғанады (жіңішке буын)' },
  { w: 'бала', q: 'ілік септігінде', a: 'баланың', why: 'дауыстыға біткен сөзге -ның жалғанады' },
  { w: 'дос', q: 'шығыс септігінде', a: 'достан', why: 'қатаң дауыссызға біткен сөзге -тан жалғанады' },
  { w: 'ағаш', q: 'жатыс септігінде', a: 'ағашта', why: 'қатаң дауыссызға біткен сөзге -та жалғанады' },
  { w: 'үй', q: 'табыс септігінде', a: 'үйді', why: 'ұяң/дауыстыға біткен сөзге -ді жалғанады' },
  { w: 'қала', q: 'жатыс септігінде', a: 'қалада', why: 'дауыстыға біткен сөзге -да жалғанады' },
  { w: 'терезе', q: 'барыс септігінде', a: 'терезеге', why: 'дауыстыға біткен жіңішке сөзге -ге жалғанады' },
  { w: 'ана', q: 'табыс септігінде', a: 'ананы', why: 'дауыстыға біткен сөзге -ны жалғанады' },
  { w: 'қыз', q: 'ілік септігінде', a: 'қыздың', why: 'ұяң дауыссызға біткен сөзге -дың жалғанады' },
  { w: 'жол', q: 'шығыс септігінде', a: 'жолдан', why: 'үнді дауыссызға біткен сөзге -дан жалғанады' },
  { w: 'көше', q: 'жатыс септігінде', a: 'көшеде', why: 'дауыстыға біткен жіңішке сөзге -де жалғанады' },
  { w: 'аспан', q: 'барыс септігінде', a: 'аспанға', why: 'үнді дауыссызға біткен жуан сөзге -ға жалғанады' },
  { w: 'кеш', q: 'жатыс септігінде', a: 'кеште', why: 'қатаң дауыссызға біткен жіңішке сөзге -те жалғанады' },
  { w: 'дәптер', q: 'табыс септігінде', a: 'дәптерді', why: 'үнді дауыссызға біткен сөзге -ді жалғанады' },
  { w: 'су', q: 'ілік септігінде', a: 'судың', why: 'дауыстыға біткен сөзге -дың жалғанады' },
  { w: 'тау', q: 'шығыс септігінде', a: 'таудан', why: 'дауыстыға біткен сөзге -дан жалғанады' },
  { w: 'мұғалім', q: 'барыс септігінде', a: 'мұғалімге', why: 'үнді дауыссызға біткен жіңішке сөзге -ге жалғанады' },
  { w: 'дала', q: 'жатыс септігінде', a: 'далада', why: 'дауыстыға біткен жуан сөзге -да жалғанады' },
  { w: 'ат', q: 'ілік септігінде', a: 'аттың', why: 'қатаң дауыссызға біткен сөзге -тың жалғанады' },
  { w: 'ел', q: 'шығыс септігінде', a: 'елден', why: 'үнді дауыссызға біткен жіңішке сөзге -ден жалғанады' },
];
function kazCase() {
  const it = pick(KAZ);
  return {
    topic: 'lang_kaz',
    statement: `«${it.w}» сөзін ${it.q} жаз.`,
    answer: it.a,
    solution: `${it.a} — ${it.why}.`,
  };
}

// ── Орыс тілі: орфография ──
const RUS = [
  { q: 'ж..знь', a: 'жизнь', why: 'жи-ши пиши с буквой и' },
  { q: 'ч..довище', a: 'чудовище', why: 'ча-ща, чу-щу пиши с буквой у' },
  { q: 'с..бака', a: 'собака', why: 'словарное слово, запоминаем' },
  { q: 'м..лыш', a: 'малыш', why: 'проверочное слово — ма́лый' },
  { q: 'в..да', a: 'вода', why: 'проверочное слово — во́ды' },
  { q: 'гр..за', a: 'гроза', why: 'проверочное слово — гро́зы' },
  { q: 'ш..рокий', a: 'широкий', why: 'жи-ши пиши с буквой и' },
  { q: 'п..сьмо', a: 'письмо', why: 'проверочное слово — пи́сьма' },
  { q: 'щ..вель', a: 'щавель', why: 'ча-ща пиши с буквой а' },
  { q: 'ч..йник', a: 'чайник', why: 'ча-ща пиши с буквой а' },
  { q: 'л..сной', a: 'лесной', why: 'проверочное слово — лес' },
  { q: 'с..сна', a: 'сосна', why: 'проверочное слово — со́сны' },
  { q: 'сн..га', a: 'снега', why: 'проверочное слово — снег' },
  { q: 'з..ма', a: 'зима', why: 'проверочное слово — зи́мы' },
  { q: 'ж..раф', a: 'жираф', why: 'жи-ши пиши с буквой и' },
  { q: 'щ..ка', a: 'щука', why: 'чу-щу пиши с буквой у' },
  { q: 'м..ря', a: 'моря', why: 'проверочное слово — мо́ре' },
  { q: 'гл..за', a: 'глаза', why: 'проверочное слово — глаз' },
  { q: 'ст..на', a: 'стена', why: 'проверочное слово — сте́ны' },
  { q: 'тр..ва', a: 'трава', why: 'проверочное слово — тра́вы' },
];
function rusSpell() {
  const it = pick(RUS);
  return {
    topic: 'lang_rus',
    statement: `Вставь пропущенную букву и запиши слово целиком: ${it.q}`,
    answer: it.a,
    solution: `${it.a} — ${it.why}.`,
  };
}

// ── Ағылшын тілі: етістік формасы ──
const ENG = [
  { s: 'She ___ to school every day.', a: 'goes', why: 'Present Simple, he/she/it → -es' },
  { s: 'They ___ football on Sundays.', a: 'play', why: 'Present Simple, they → базовая форма' },
  { s: 'I ___ a book yesterday.', a: 'read', why: 'Past Simple, read — неправильный глагол' },
  { s: 'He ___ his homework now.', a: 'is doing', why: 'Present Continuous — сейчас, now' },
  { s: 'We ___ to Astana last year.', a: 'went', why: 'Past Simple, go → went' },
  { s: 'My sister ___ English very well.', a: 'speaks', why: 'Present Simple, she → -s' },
  { s: 'It ___ raining since morning.', a: 'has been', why: 'Present Perfect Continuous — since' },
  { s: 'The children ___ in the garden yesterday.', a: 'were', why: 'Past Simple, множественное → were' },
  { s: 'She ___ already finished her work.', a: 'has', why: 'Present Perfect, she → has' },
  { s: 'I ___ TV when he called.', a: 'was watching', why: 'Past Continuous — действие шло, когда прервали' },
  { s: 'We ___ visit the museum tomorrow.', a: 'will', why: 'Future Simple — tomorrow' },
  { s: 'He ___ not like coffee.', a: 'does', why: 'Present Simple, отрицание с he → does not' },
  { s: 'They ___ living here since 2010.', a: 'have been', why: 'Present Perfect Continuous — since' },
  { s: 'My father ___ a car last month.', a: 'bought', why: 'Past Simple, buy → bought' },
  { s: 'Look! It ___ snowing.', a: 'is', why: 'Present Continuous — прямо сейчас, Look!' },
  { s: 'She ___ to Almaty three times.', a: 'has been', why: 'Present Perfect — опыт, «три раза»' },
  { s: 'The boys ___ tired after the game.', a: 'were', why: 'Past Simple, множественное → were' },
  { s: 'I ___ my keys. I cannot open the door.', a: 'have lost', why: 'Present Perfect — результат виден сейчас' },
  { s: 'Water ___ at 100 degrees.', a: 'boils', why: 'Present Simple — факт, it → -s' },
  { s: 'He ___ football when he was young.', a: 'played', why: 'Past Simple — when he was young' },
];
function engVerb() {
  const it = pick(ENG);
  return {
    topic: 'lang_eng',
    statement: `Етістікті дұрыс формада қой:\n${it.s}`,
    answer: it.a,
    solution: `${it.a} — ${it.why}.`,
  };
}

const GEN = {
  work:  [headsLegs, pipes, average],
  pct:   [twoPercents, discount],
  ratio: [ratioParts, trainBridge],
  comb:  [ages],
  num:   [divisible9],
  geo:   [rectangle],
  eq:    [linearEq],
  cmp:   [compare],
  frac:  [fractions],
  sys:   [inequality],
  seq:   [sequence],
  spat:  [cubeNet],
  lang_kaz: [kazCase],
  lang_rus: [rusSpell],
  lang_eng: [engVerb],
};
const ALL = Object.values(GEN).flat();

// Генерируем n похожих задач. Если тема известна — берём генераторы этой темы,
// а если для неё генератора нет, честно возвращаем пусто, а не подсовываем чужое.
export function generate(n = 5, topic = null) {
  const pool = topic ? (GEN[topic] || []) : ALL;
  if (!pool.length) return [];
  const out = [];
  for (let i = 0; i < n; i++) {
    const g = pool[i % pool.length];
    const q = g();
    out.push({
      ...q,
      id: `gen_${topic || q.topic}_${i}`,
      school: 'Synaq',
      generated: true,
      lang: 'kk',
      block: ['cmp', 'seq', 'spat', 'comb'].includes(q.topic) ? 'logic'
        : (q.topic.startsWith('lang_') ? 'lang' : 'math'),
    });
  }
  return out;
}

export const canGenerate = (topic) => !!(GEN[topic] && GEN[topic].length);
