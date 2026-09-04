// Генераторы похожих задач — процедурная регенерация «таких же, но с другими
// числами» задач по темам банка. Раньше тренировка/мок-тесты просто тасовали
// готовый банк (POOL) — конечный набор задач рано или поздно повторяется.
// Здесь — библиотека шаблонов: каждый шаблон знает СТРУКТУРУ задачи темы
// (например «две трубы наполняют бассейн») и на каждый вызов подставляет
// новые случайные числа, пересчитывая верный ответ и разбор заново. Это не
// замена банку, а добавка: используется вперемешку с реальными задачами
// (см. frontend/src/api.js — topicQuestions/mixed/buildRfmsh/buildNish/buildBil).
//
// Темы без шаблона (mtx — матрицы/аналогии, spat — пространственное мышление,
// lang_* — языковые предметы) намеренно не генерируются: они завязаны на
// картинку или конкретный текст, «случайные числа» там бессмысленны или
// рискуют дать некорректную задачу.

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a * b) / gcd(a, b);

// digits*10^-dec → строка вида "0,0015" (используется в колхар-шаблоне).
function fmtDecimal(digits, dec) {
  const s = String(digits).padStart(dec + 1, '0');
  const intPart = s.slice(0, s.length - dec) || '0';
  const fracPart = s.slice(s.length - dec);
  return `${intPart},${fracPart}`;
}

function reduceFraction(num, den) {
  const g = gcd(Math.abs(num), Math.abs(den)) || 1;
  return [num / g, den / g];
}

// ── eq: уравнения и упрощение ──

function eqThinkOfNumber(lang) {
  const a = rnd(2, 6);
  const x = rnd(3, 40);
  const b = rnd(1, 50);
  const c = a * x + b;
  const statement = lang === 'kk'
    ? `Бір санды ойладық. Оны ${a}-ге көбейтіп, үстіне ${b} қостық, нәтижесінде ${c} шықты. Қандай сан ойланған?`
    : `Задумали число. Умножили его на ${a} и прибавили ${b}, получили ${c}. Какое число задумали?`;
  const solution = lang === 'kk'
    ? `Ойланған санды x деп белгілейік. Шарт бойынша ${a}x + ${b} = ${c}. Бұдан ${a}x = ${c} − ${b} = ${a * x}. Демек x = ${a * x} : ${a} = ${x}. Тексеру: ${a}·${x} + ${b} = ${c} — шарт орындалды. Ойланған сан — ${x}.`
    : `Пусть задуманное число — x. По условию ${a}x + ${b} = ${c}. Значит ${a}x = ${c} − ${b} = ${a * x}, откуда x = ${a * x} : ${a} = ${x}. Проверка: ${a}·${x} + ${b} = ${c} — совпадает с условием. Задуманное число — ${x}.`;
  return { topic: 'eq', difficulty: 1, statement, answer: String(x), solution };
}

function eqSumRatio(lang) {
  const k = rnd(2, 5);
  const m = rnd(3, 30);
  const second = m, first = k * m, S = first + second;
  const statement = lang === 'kk'
    ? `Екі санның қосындысы ${S}-ге тең. Бірінші сан екіншісінен ${k} есе үлкен. Бірінші санды табыңыз.`
    : `Сумма двух чисел равна ${S}. Первое число в ${k} раз больше второго. Найдите первое число.`;
  const solution = lang === 'kk'
    ? `Екінші санды x деп алайық, онда бірінші сан ${k}x. Қосындысы: x + ${k}x = ${S}, яғни ${k + 1}x = ${S}. Бұдан x = ${S} : ${k + 1} = ${m}. Бірінші сан ${k}·${m} = ${first}. Тексеру: ${first} + ${m} = ${S}. Жауап — ${first}.`
    : `Пусть второе число — x, тогда первое — ${k}x. Их сумма: x + ${k}x = ${S}, то есть ${k + 1}x = ${S}, откуда x = ${S} : ${k + 1} = ${m}. Первое число: ${k}·${m} = ${first}. Проверка: ${first} + ${m} = ${S}. Ответ — ${first}.`;
  return { topic: 'eq', difficulty: 2, statement, answer: String(first), solution };
}

// ── num: числа и делимость ──

function numGCD(lang) {
  const g = pick([2, 3, 4, 5, 6, 7]);
  let p = rnd(2, 12), q = rnd(2, 12);
  while (gcd(p, q) !== 1) { p = rnd(2, 12); q = rnd(2, 12); }
  const a = g * p, b = g * q;
  const statement = lang === 'kk'
    ? `${a} және ${b} сандарының ең үлкен ортақ бөлгішін (ЕҮОБ) табыңыз.`
    : `Найдите наибольший общий делитель (НОД) чисел ${a} и ${b}.`;
  const solution = lang === 'kk'
    ? `${a} = ${g}·${p}, ал ${b} = ${g}·${q}. ${p} мен ${q} сандарының басқа ортақ бөлгіші жоқ (өзара жай сандар), сондықтан ЕҮОБ(${a}, ${b}) = ${g}.`
    : `${a} = ${g}·${p}, а ${b} = ${g}·${q}. Числа ${p} и ${q} взаимно простые (общих делителей, кроме 1, нет), поэтому НОД(${a}, ${b}) = ${g}.`;
  return { topic: 'num', difficulty: 2, statement, answer: String(g), solution };
}

function numLCM(lang) {
  const g = pick([2, 3, 4, 5]);
  let p = rnd(2, 9), q = rnd(2, 9);
  while (gcd(p, q) !== 1 || p === q) { p = rnd(2, 9); q = rnd(2, 9); }
  const a = g * p, b = g * q;
  const l = lcm(a, b);
  const statement = lang === 'kk'
    ? `${a} және ${b} сандарының ең кіші ортақ еселігін (ЕКОК) табыңыз.`
    : `Найдите наименьшее общее кратное (НОК) чисел ${a} и ${b}.`;
  const solution = lang === 'kk'
    ? `${a} = ${g}·${p}, ${b} = ${g}·${q}, ал ЕҮОБ(${a}, ${b}) = ${g}. ЕКОК табу формуласы: ЕКОК = (${a}·${b}) : ЕҮОБ = (${a}·${b}) : ${g} = ${l}.`
    : `${a} = ${g}·${p}, ${b} = ${g}·${q}, а НОД(${a}, ${b}) = ${g}. По формуле НОК = (${a}·${b}) : НОД = (${a}·${b}) : ${g} = ${l}.`;
  return { topic: 'num', difficulty: 2, statement, answer: String(l), solution };
}

// ── work: работа и производительность ──

function workPipes(lang) {
  const t1 = rnd(2, 8), t2 = rnd(3, 12);
  const together = (t1 * t2) / (t1 + t2);
  const ans = Number.isInteger(together) ? together : Math.round(together * 100) / 100;
  const statement = lang === 'kk'
    ? `Бірінші құбыр бассейнді жеке толтырса ${t1} сағат, ал екінші құбыр ${t2} сағат кетеді. Екі құбыр бірге ашылса, бассейн неше сағатта толады?`
    : `Первая труба наполняет бассейн за ${t1} ч, вторая — за ${t2} ч. За сколько часов бассейн наполнится, если открыть обе трубы вместе?`;
  const solution = lang === 'kk'
    ? `Бір сағатта бірінші құбыр бассейннің 1/${t1} бөлігін, екіншісі 1/${t2} бөлігін толтырады. Бірге — 1/${t1} + 1/${t2} = (${t1}+${t2})/(${t1}·${t2}) бөлігін. Толық бассейн үшін керек уақыт: ${t1}·${t2} : (${t1}+${t2}) = ${ans} сағат.`
    : `За час первая труба заполняет 1/${t1} бассейна, вторая — 1/${t2}. Вместе за час: 1/${t1} + 1/${t2} = (${t1}+${t2})/(${t1}·${t2}) бассейна. Время на весь бассейн: ${t1}·${t2} : (${t1}+${t2}) = ${ans} ч.`;
  return { topic: 'work', difficulty: 2, statement, answer: String(ans), solution };
}

function workWall(lang) {
  const t1 = rnd(4, 15), t2 = rnd(5, 20);
  const together = (t1 * t2) / (t1 + t2);
  const ans = Number.isInteger(together) ? together : Math.round(together * 100) / 100;
  const statement = lang === 'kk'
    ? `Бірінші жұмысшы қабырғаны жалғыз салса ${t1} күнде, екіншісі ${t2} күнде бітіреді. Екеуі бірге жұмыс істесе, қабырға неше күнде бітеді?`
    : `Один рабочий строит стену за ${t1} дней, другой — за ${t2} дней. За сколько дней они построят стену вместе?`;
  const solution = lang === 'kk'
    ? `Күніне бірінші жұмысшы жұмыстың 1/${t1} бөлігін, екіншісі 1/${t2} бөлігін орындайды. Бірге — (${t1}+${t2})/(${t1}·${t2}) бөлігін күніне. Барлық жұмысқа керек уақыт: ${t1}·${t2} : (${t1}+${t2}) = ${ans} күн.`
    : `За день первый выполняет 1/${t1} работы, второй — 1/${t2}. Вместе за день — (${t1}+${t2})/(${t1}·${t2}) всей стены. Время на всю стену: ${t1}·${t2} : (${t1}+${t2}) = ${ans} дней.`;
  return { topic: 'work', difficulty: 2, statement, answer: String(ans), solution };
}

// ── ratio: части, отношения, движение ──

function ratioParts(lang) {
  const a = rnd(2, 6), b = rnd(2, 6);
  const unit = rnd(3, 12);
  const total = (a + b) * unit;
  const bigger = Math.max(a, b) * unit;
  const statement = lang === 'kk'
    ? `Екі санның қатынасы ${a}:${b}, ал қосындысы ${total}-ге тең. Үлкен санды табыңыз.`
    : `Отношение двух чисел ${a}:${b}, их сумма равна ${total}. Найдите большее число.`;
  const solution = lang === 'kk'
    ? `Барлығы ${a + b} бөлік, әр бөлік ${total} : ${a + b} = ${unit}-ге тең. Үлкен сан = ${Math.max(a, b)}·${unit} = ${bigger}.`
    : `Всего частей ${a + b}, каждая часть = ${total} : ${a + b} = ${unit}. Большее число = ${Math.max(a, b)}·${unit} = ${bigger}.`;
  return { topic: 'ratio', difficulty: 1, statement, answer: String(bigger), solution };
}

function ratioMeeting(lang) {
  const v1 = rnd(4, 10) * 5, v2 = rnd(4, 10) * 5;
  const t = rnd(2, 6);
  const D = (v1 + v2) * t;
  const statement = lang === 'kk'
    ? `Екі қала арасындағы қашықтық ${D} км. Бір-біріне қарай бір мезгілде екі көлік шықты: біреуінің жылдамдығы ${v1} км/сағ, екіншісінікі ${v2} км/сағ. Олар неше сағаттан кейін кездеседі?`
    : `Расстояние между городами ${D} км. Навстречу друг другу одновременно выехали две машины со скоростями ${v1} км/ч и ${v2} км/ч. Через сколько часов они встретятся?`;
  const solution = lang === 'kk'
    ? `Қарама-қарсы қозғалғанда жылдамдықтар қосылады: ${v1} + ${v2} = ${v1 + v2} км/сағ. Кездесу уақыты — қашықтықты қосынды жылдамдыққа бөлу: ${D} : ${v1 + v2} = ${t} сағат.`
    : `При встречном движении скорости складываются: ${v1} + ${v2} = ${v1 + v2} км/ч. Время встречи — расстояние делим на суммарную скорость: ${D} : ${v1 + v2} = ${t} ч.`;
  return { topic: 'ratio', difficulty: 2, statement, answer: String(t), solution };
}

function ratioCatchUp(lang) {
  const v1 = rnd(3, 8) * 5, v2 = v1 + rnd(1, 4) * 5;
  const t = rnd(2, 6);
  const D = (v2 - v1) * t;
  const statement = lang === 'kk'
    ? `Велосипедші жылдамдығы ${v1} км/сағ болған соң, оның артынан ${D} км қалғанда екінші велосипедші ${v2} км/сағ жылдамдықпен қуа шықты. Ол оны неше сағаттан кейін қуып жетеді?`
    : `Велосипедист едет со скоростью ${v1} км/ч. Вслед за ним, когда отставание составляло ${D} км, выехал второй велосипедист со скоростью ${v2} км/ч. Через сколько часов он его догонит?`;
  const solution = lang === 'kk'
    ? `Қуып жету кезінде жылдамдықтардың айырмасы маңызды: ${v2} − ${v1} = ${v2 - v1} км/сағ — осыншаға қашықтық әр сағат сайын қысқарады. Бастапқы қашықтық ${D} км, сондықтан қуып жету уақыты: ${D} : ${v2 - v1} = ${t} сағат.`
    : `При погоне важна разность скоростей: ${v2} − ${v1} = ${v2 - v1} км/ч — именно на столько сокращается расстояние каждый час. Начальное отставание ${D} км, значит время погони: ${D} : ${v2 - v1} = ${t} ч.`;
  return { topic: 'ratio', difficulty: 2, statement, answer: String(t), solution };
}

// ── geo: геометрия ──

function geoRectFromPerimeter(lang) {
  const half = rnd(10, 40);
  const a = rnd(2, half - 2);
  const b = half - a;
  const area = a * b;
  const P = half * 2;
  const statement = lang === 'kk'
    ? `Тіктөртбұрыштың периметрі ${P} см, ал бір қабырғасы ${a} см. Осы тіктөртбұрыштың ауданын табыңыз.`
    : `Периметр прямоугольника равен ${P} см, одна из сторон — ${a} см. Найдите площадь этого прямоугольника.`;
  const solution = lang === 'kk'
    ? `Периметр — барлық қабырғалардың қосындысы: 2·(a+b) = ${P}, сондықтан a+b = ${half}. Бір қабырға ${a} см болғандықтан, екіншісі ${half} − ${a} = ${b} см. Ауданы = ${a}·${b} = ${area} см².`
    : `Периметр — сумма всех сторон: 2·(a+b) = ${P}, значит a+b = ${half}. Одна сторона ${a} см, вторая — ${half} − ${a} = ${b} см. Площадь = ${a}·${b} = ${area} см².`;
  return { topic: 'geo', difficulty: 2, statement, answer: String(area), solution };
}

function geoTriangleArea(lang) {
  const h = rnd(2, 20);
  const base = rnd(2, 20) * 2; // чётное, чтобы (base*h)/2 было целым при любом h
  const area = (base * h) / 2;
  const statement = lang === 'kk'
    ? `Үшбұрыштың табаны ${base} см, ал осы табанға түсірілген биіктігі ${h} см. Үшбұрыштың ауданын табыңыз.`
    : `Основание треугольника ${base} см, высота, проведённая к этому основанию, — ${h} см. Найдите площадь треугольника.`;
  const solution = lang === 'kk'
    ? `Үшбұрыш ауданы = (табан · биіктік) : 2 = (${base} · ${h}) : 2 = ${area} см².`
    : `Площадь треугольника = (основание · высота) : 2 = (${base} · ${h}) : 2 = ${area} см².`;
  return { topic: 'geo', difficulty: 1, statement, answer: String(area), solution };
}

function geoSquareFromArea(lang) {
  const s = rnd(4, 20);
  const area = s * s;
  const perim = 4 * s;
  const statement = lang === 'kk'
    ? `Шаршының ауданы ${area} см². Осы шаршының периметрін табыңыз.`
    : `Площадь квадрата равна ${area} см². Найдите периметр этого квадрата.`;
  const solution = lang === 'kk'
    ? `Шаршының қабырғасын a десек, a² = ${area}, бұдан a = ${s} см (себебі ${s}·${s} = ${area}). Периметрі = 4·${s} = ${perim} см.`
    : `Пусть сторона квадрата — a, тогда a² = ${area}, откуда a = ${s} см (так как ${s}·${s} = ${area}). Периметр = 4·${s} = ${perim} см.`;
  return { topic: 'geo', difficulty: 1, statement, answer: String(perim), solution };
}

// ── frac: дроби и вычисления ──

function fracSum(lang) {
  const d1 = pick([2, 3, 4, 5, 6]);
  const d2 = pick([2, 3, 4, 5, 6].filter((x) => x !== d1));
  const n1 = rnd(1, d1 - 1);
  const n2 = rnd(1, d2 - 1);
  const den = lcm(d1, d2);
  const num = n1 * (den / d1) + n2 * (den / d2);
  const [rn, rd] = reduceFraction(num, den);
  const ansStr = rd === 1 ? String(rn) : `${rn}/${rd}`;
  const statement = lang === 'kk'
    ? `${n1}/${d1} және ${n2}/${d2} бөлшектерінің қосындысын табыңыз (жауапты қысқартылған түрде жазыңыз).`
    : `Найдите сумму дробей ${n1}/${d1} и ${n2}/${d2} (ответ запишите в сокращённом виде).`;
  const solution = lang === 'kk'
    ? `Ортақ бөлімі ${den} (${d1} мен ${d2} сандарының ЕКОК). ${n1}/${d1} = ${n1 * (den / d1)}/${den}, ал ${n2}/${d2} = ${n2 * (den / d2)}/${den}. Қосындысы: ${num}/${den}${rd !== den ? ` = ${ansStr} (қысқарту арқылы)` : ''}.`
    : `Общий знаменатель — ${den} (НОК чисел ${d1} и ${d2}). ${n1}/${d1} = ${n1 * (den / d1)}/${den}, а ${n2}/${d2} = ${n2 * (den / d2)}/${den}. Сумма: ${num}/${den}${rd !== den ? ` = ${ansStr} (после сокращения)` : ''}.`;
  return { topic: 'frac', difficulty: 2, statement, answer: ansStr, solution };
}

function fracOrder(lang) {
  const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9), d = rnd(2, 9);
  const inner = b + c;
  const result = a * inner - d;
  const statement = lang === 'kk'
    ? `Мәнін табыңыз: ${a} · (${b} + ${c}) − ${d}.`
    : `Найдите значение выражения: ${a} · (${b} + ${c}) − ${d}.`;
  const solution = lang === 'kk'
    ? `Әрекеттер ретін сақтаймыз: алдымен жақша ішін есептейміз — ${b} + ${c} = ${inner}. Одан кейін көбейтеміз: ${a} · ${inner} = ${a * inner}. Соңында азайтамыз: ${a * inner} − ${d} = ${result}.`
    : `Соблюдаем порядок действий: сначала скобка — ${b} + ${c} = ${inner}. Затем умножение: ${a} · ${inner} = ${a * inner}. И вычитание: ${a * inner} − ${d} = ${result}.`;
  return { topic: 'frac', difficulty: 1, statement, answer: String(result), solution };
}

// ── pct: проценты ──

function pctCompound(lang) {
  const p1 = pick([5, 10, 15, 20]);
  const p2 = pick([5, 10, 15, 20]);
  const k = (1 + p1 / 100) * (1 + p2 / 100);
  const pct = Math.round((k - 1) * 10000) / 100;
  const statement = lang === 'kk'
    ? `Бағаны алдымен ${p1}%-ға, содан кейін жаңа бағаны тағы ${p2}%-ға көтерді. Бастапқы бағамен салыстырғанда баға неше пайызға өсті?`
    : `Цену сначала повысили на ${p1}%, а затем новую цену — ещё на ${p2}%. На сколько процентов выросла первоначальная цена?`;
  const solution = lang === 'kk'
    ? `Бірінші өсуден кейін баға бастапқысының (1 + ${p1}/100) = ${(1 + p1 / 100).toFixed(2)} бөлігін құрайды. Екінші өсуден кейін — (1 + ${p1}/100)·(1 + ${p2}/100) = ${k.toFixed(4)} бөлігін, яғни бастапқыдан ${pct}% артық.`
    : `После первого повышения цена составляет (1 + ${p1}/100) = ${(1 + p1 / 100).toFixed(2)} от исходной. После второго — (1 + ${p1}/100)·(1 + ${p2}/100) = ${k.toFixed(4)} от исходной, то есть рост на ${pct}%.`;
  return { topic: 'pct', difficulty: 2, statement, answer: `${pct}%`, solution };
}

function pctDiscount(lang) {
  // цена — кратна 20: тогда price·d/100 всегда целое число для d из набора ниже (НОК знаменателей 5%,10%,15%,20%,25% = 20)
  const price = rnd(4, 40) * 20;
  const d = pick([5, 10, 15, 20, 25]);
  const sale = price - price * d / 100;
  const statement = lang === 'kk'
    ? `Тауардың бағасы ${price} теңге. Оған ${d}% жеңілдік жасалды. Тауардың жаңа бағасы қанша теңге болады?`
    : `Товар стоит ${price} тенге. На него сделали скидку ${d}%. Сколько будет стоить товар после скидки?`;
  const solution = lang === 'kk'
    ? `Жеңілдік сомасы: ${price} · ${d}/100 = ${price * d / 100} теңге. Жаңа баға: ${price} − ${price * d / 100} = ${sale} теңге.`
    : `Сумма скидки: ${price} · ${d}/100 = ${price * d / 100} тенге. Новая цена: ${price} − ${price * d / 100} = ${sale} тенге.`;
  return { topic: 'pct', difficulty: 1, statement, answer: String(sale), solution };
}

function pctOfNumber(lang) {
  // N кратно 20: тогда N·w/100 всегда целое для всех w из набора ниже (НОК знаменателей = 20)
  const N = rnd(2, 30) * 20;
  const w = pick([10, 20, 25, 40, 50, 60, 75]);
  const part = N * w / 100;
  const statement = lang === 'kk'
    ? `${N} санының ${w}%-ын табыңыз.`
    : `Найдите ${w}% от числа ${N}.`;
  const solution = lang === 'kk'
    ? `${w}% — бұл ${w}/100 бөлігі. ${N} · ${w}/100 = ${part}.`
    : `${w}% — это ${w}/100 от числа. ${N} · ${w}/100 = ${part}.`;
  return { topic: 'pct', difficulty: 1, statement, answer: String(part), solution };
}

// ── sys: системы, неравенства, множества ──

function sysHeadsLegs(lang) {
  const chickens = rnd(5, 25);
  const animals = rnd(3, 20);
  const heads = chickens + animals;
  const legs = chickens * 2 + animals * 4;
  const statement = lang === 'kk'
    ? `Аулада ${heads} бас және ${legs} аяқ бар (тек тауықтар мен төрт аяқты малдар). Тауықтар нешеу?`
    : `Во дворе ${heads} голов и ${legs} ног (только куры и четвероногие животные). Сколько кур?`;
  const solution = lang === 'kk'
    ? `Тауықтар саны — c, малдар саны — d деп алайық. Бастар: c + d = ${heads}. Аяқтар: 2c + 4d = ${legs}. Бірінші теңдеуді 2-ге көбейтіп ((2c+2d=${heads * 2})) екіншіден алып тастаймыз: 2d = ${legs} − ${heads * 2} = ${legs - heads * 2}, d = ${animals}. Онда c = ${heads} − ${animals} = ${chickens}.`
    : `Пусть кур — c, животных — d. Головы: c + d = ${heads}. Ноги: 2c + 4d = ${legs}. Умножим первое на 2: 2c+2d=${heads * 2}, вычтем из второго: 2d = ${legs} − ${heads * 2} = ${legs - heads * 2}, откуда d = ${animals}. Тогда c = ${heads} − ${animals} = ${chickens}.`;
  return { topic: 'sys', difficulty: 2, statement, answer: String(chickens), solution };
}

function sysVenn(lang) {
  const a = rnd(15, 30), b = rnd(15, 30);
  const both = rnd(3, Math.min(a, b) - 2);
  const eitherOrBoth = a + b - both;
  const neither = rnd(2, 10);
  const total = eitherOrBoth + neither;
  const statement = lang === 'kk'
    ? `Сыныпта ${total} оқушы бар. Олардың ${a}-і футболды, ${b}-і баскетболды жақсы көреді, ал ${both}-і екеуін де жақсы көреді. Осы екі спорт түрінің ешқайсысын жақсы көрмейтін оқушылар нешеу?`
    : `В классе ${total} учеников. Из них ${a} любят футбол, ${b} — баскетбол, а ${both} любят оба вида спорта. Сколько учеников не любят ни один из этих видов спорта?`;
  const solution = lang === 'kk'
    ? `Кемінде біреуін жақсы көретіндер саны: ${a} + ${b} − ${both} (екеуін де жақсы көретіндерді екі рет қоспау үшін) = ${eitherOrBoth}. Ешқайсысын жақсы көрмейтіндер: ${total} − ${eitherOrBoth} = ${neither}.`
    : `Любят хотя бы один вид спорта: ${a} + ${b} − ${both} (чтобы не посчитать дважды тех, кто любит оба) = ${eitherOrBoth}. Не любят ни один: ${total} − ${eitherOrBoth} = ${neither}.`;
  return { topic: 'sys', difficulty: 2, statement, answer: String(neither), solution };
}

// ── seq: последовательности ──

function seqArithmetic(lang) {
  const a1 = rnd(1, 20);
  const d = rnd(2, 9);
  const n = rnd(6, 12);
  const an = a1 + (n - 1) * d;
  const shown = Array.from({ length: 5 }, (_, k) => a1 + k * d).join(', ');
  const statement = lang === 'kk'
    ? `Тізбек берілген: ${shown}, ... Осы тізбектің ${n}-ші мүшесін табыңыз.`
    : `Дана последовательность: ${shown}, ... Найдите ${n}-й член этой последовательности.`;
  const solution = lang === 'kk'
    ? `Тізбектің әр келесі мүшесі алдыңғысынан ${d}-ге артық (арифметикалық прогрессия). n-ші мүше формуласы: aₙ = a₁ + (n−1)·d = ${a1} + (${n}−1)·${d} = ${a1} + ${(n - 1) * d} = ${an}.`
    : `Каждый следующий член на ${d} больше предыдущего (арифметическая прогрессия). Формула n-го члена: aₙ = a₁ + (n−1)·d = ${a1} + (${n}−1)·${d} = ${a1} + ${(n - 1) * d} = ${an}.`;
  return { topic: 'seq', difficulty: 2, statement, answer: String(an), solution };
}

function seqGeometric(lang) {
  const a1 = pick([1, 2, 3]);
  const r = pick([2, 3]);
  const n = rnd(4, 6);
  const terms = [];
  let v = a1;
  for (let k = 0; k < n; k++) { terms.push(v); v *= r; }
  const shown = terms.slice(0, n - 1).join(', ');
  const answer = terms[n - 1];
  const statement = lang === 'kk'
    ? `Тізбек берілген: ${shown}, ... Заңдылықты байқап, келесі санды табыңыз.`
    : `Дана последовательность: ${shown}, ... Определите закономерность и найдите следующее число.`;
  const solution = lang === 'kk'
    ? `Әр келесі сан алдыңғысынан ${r} есе үлкен. Демек келесі сан: ${terms[n - 2]}·${r} = ${answer}.`
    : `Каждое следующее число в ${r} раз больше предыдущего. Значит следующее число: ${terms[n - 2]}·${r} = ${answer}.`;
  return { topic: 'seq', difficulty: 2, statement, answer: String(answer), solution };
}

// ── comb: комбинаторика ──

function combCountingRule(lang) {
  const a = rnd(3, 8), b = rnd(3, 6);
  const total = a * b;
  const statement = lang === 'kk'
    ? `Дүкенде ${a} түрлі көйлек және ${b} түрлі шалбар бар. Бір көйлек пен бір шалбарды неше түрлі тәсілмен таңдауға болады?`
    : `В магазине ${a} видов рубашек и ${b} видов брюк. Сколькими способами можно выбрать одну рубашку и одни брюки?`;
  const solution = lang === 'kk'
    ? `Әр көйлекті кез келген шалбармен қиыстыруға болады, сондықтан тәсілдер саны — көбейту ережесі бойынша: ${a} · ${b} = ${total}.`
    : `Каждую рубашку можно скомбинировать с любыми брюками, поэтому по правилу умножения число способов: ${a} · ${b} = ${total}.`;
  return { topic: 'comb', difficulty: 1, statement, answer: String(total), solution };
}

function combHandshakes(lang) {
  const n = rnd(6, 15);
  const total = (n * (n - 1)) / 2;
  const statement = lang === 'kk'
    ? `Кездесуге ${n} адам келді. Әрбір екі адам бір-бірімен бір рет қана қол алысты. Барлығы неше қол алысу болды?`
    : `На встречу пришли ${n} человек. Каждые два человека пожали друг другу руки ровно один раз. Сколько всего было рукопожатий?`;
  const solution = lang === 'kk'
    ? `Әрбір адам қалған ${n - 1} адаммен қол алысады, бірақ әр қол алысу екі рет саналмауы керек. Формула: n·(n−1)/2 = ${n}·${n - 1}/2 = ${total}.`
    : `Каждый человек жмёт руку остальным ${n - 1}, но каждое рукопожатие не должно посчитаться дважды. Формула: n·(n−1)/2 = ${n}·${n - 1}/2 = ${total}.`;
  return { topic: 'comb', difficulty: 1, statement, answer: String(total), solution };
}

// ── kolzar: сандық салыстыру (только кк — тема исторически казахоязычная) ──

function kolzarDecimalCompare() {
  const p = rnd(11, 95);
  const q = rnd(2, 9);
  let decA, decB;
  do { decA = rnd(2, 6); decB = rnd(2, 6); } while (decA === decB);
  const decA1 = rnd(1, decA - 1) || 1, decA2 = decA - decA1;
  const decB1 = rnd(1, decB - 1) || 1, decB2 = decB - decB1;
  const factorA1 = fmtDecimal(p, decA1), factorA2 = fmtDecimal(q, decA2);
  const factorB1 = fmtDecimal(p, decB1), factorB2 = fmtDecimal(q, decB2);
  const bigger = decA < decB ? 'А' : 'В';
  const statement = `Салыстыр (қайсысы үлкен?):\nА) ${factorA1} · ${factorA2} =\nВ) ${factorB1} · ${factorB2} =`;
  const solution = `А бөлігінде ${factorA1} · ${factorA2} көбейтіндісін табу үшін алдымен ${p}·${q}=${p * q} санын аламыз, содан кейін екі көбейткіштің үтірден кейінгі таңбаларының қосындысын (${decA1}+${decA2}=${decA}) санаймыз. В бөлігінде де ${p}·${q}=${p * q} санын аламыз, бірақ үтірден кейінгі таңба саны (${decB1}+${decB2}=${decB}) басқаша. Үтірден кейінгі таңбасы аз сан үлкенірек болады (нөлдер аз), сондықтан ${bigger} бөлігіндегі сан үлкенірек, дұрыс жауап — ${bigger}.`;
  return {
    topic: 'kolzar', difficulty: 2, statement, answer: bigger, solution,
    options: ['А', 'В', 'Тең'],
  };
}

// ── реестр шаблонов по темам ──

const TEMPLATES = {
  eq: [eqThinkOfNumber, eqSumRatio],
  num: [numGCD, numLCM],
  work: [workPipes, workWall],
  ratio: [ratioParts, ratioMeeting, ratioCatchUp],
  geo: [geoRectFromPerimeter, geoTriangleArea, geoSquareFromArea],
  frac: [fracSum, fracOrder],
  pct: [pctCompound, pctDiscount, pctOfNumber],
  sys: [sysHeadsLegs, sysVenn],
  seq: [seqArithmetic, seqGeometric],
  comb: [combCountingRule, combHandshakes],
  kolzar: [kolzarDecimalCompare], // всегда на казахском, lang игнорируется
};

const SUBJECT_BY_TOPIC = {
  eq: 'math', num: 'math', work: 'math', ratio: 'math', geo: 'math', frac: 'math', pct: 'math', sys: 'math',
  seq: 'logic', comb: 'logic',
  kolzar: 'kolzar',
};

export const GENERATABLE_TOPICS = Object.keys(TEMPLATES);

const SIMILAR_LABEL = { kk: 'Ұқсас есеп', ru: 'Похожая задача', en: 'Similar problem' };

// Сгенерировать count свежих задач по теме topicId на языке lang.
// schoolLabel — если передан, ставится в поле school вместо надписи
// «похожая задача» (используется в мок-тестах, чтобы задача выглядела
// органично среди настоящих задач той же школы).
export function generateFor(topicId, lang, count, schoolLabel = null) {
  const bank = TEMPLATES[topicId];
  if (!bank || !bank.length) return [];
  if (topicId === 'kolzar' && lang && lang !== 'kk') return []; // тема исторически только кк

  const out = [];
  for (let k = 0; k < count; k++) {
    const fn = pick(bank);
    const g = fn(lang || 'kk');
    const effLang = topicId === 'kolzar' ? 'kk' : (lang || 'kk');
    out.push({
      id: `gen_${topicId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${k}`,
      generated: true,
      topic: g.topic,
      subject: SUBJECT_BY_TOPIC[g.topic] || null,
      difficulty: g.difficulty ?? 2,
      lang: effLang,
      statement: g.statement,
      answer: g.answer,
      solution: g.solution,
      options: g.options || null,
      image: null,
      school: schoolLabel || SIMILAR_LABEL[effLang] || SIMILAR_LABEL.ru,
    });
  }
  return out;
}
