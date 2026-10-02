// Авторское расширение SYNAQ. Задания повторяют структуру и уровень разделов,
// но не выдаются за реальные вопросы прошлых экзаменов.

const letters = ['A', 'B', 'C', 'D'];
const numericOptions = (answer, step = 1, shift = 0) => {
  const correct = (shift % 4 + 4) % 4;
  const values = [answer - step, answer + step, answer + 2 * step];
  const out = [];
  for (let i = 0; i < 4; i++) out.push(String(i === correct ? answer : values.shift()));
  return { options: out, answer: out[correct] };
};

function open(id, school, subject, topic, statement, answer, solution) {
  return { id, school, subject, topic, difficulty: 2, statement, answer: String(answer), solution, options: null, source: 'SYNAQ original' };
}

function choice(id, school, subject, topic, statement, options, answer, solution) {
  return { id, school, subject, topic, difficulty: 2, statement, options, answer, solution, source: 'SYNAQ original' };
}

function buildOpenMath(prefix, school, count, offset = 0) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1 + offset;
    const kind = n % 5;
    if (kind === 0) {
      const price = 200 + 20 * n, pct = 10 + 5 * (n % 5), answer = price * pct / 100;
      return open(`${prefix}_${n}`, school, 'math', 'pct', `Товар стоит ${price} тенге. Скидка составляет ${pct}%. Сколько тенге составляет скидка?`, answer, `${price} · ${pct}/100 = ${answer}.`);
    }
    if (kind === 1) {
      const a = 2 + n % 7, b = 3 + n % 6, unit = 4 + n % 9, answer = (a + b) * unit;
      return open(`${prefix}_${n}`, school, 'math', 'ratio', `Две части величины относятся как ${a}:${b}. Одна доля равна ${unit}. Найдите всю величину.`, answer, `Всего ${a + b} долей, поэтому ${a + b} · ${unit} = ${answer}.`);
    }
    if (kind === 2) {
      const first = 3 + n, diff = 2 + n % 8, pos = 8 + n % 9, answer = first + (pos - 1) * diff;
      return open(`${prefix}_${n}`, school, 'math', 'seq', `Арифметическая последовательность начинается с ${first}, каждый следующий член на ${diff} больше. Найдите ${pos}-й член.`, answer, `${first} + (${pos} - 1) · ${diff} = ${answer}.`);
    }
    if (kind === 3) {
      const divisor = 3 + n % 8, top = divisor * (12 + n % 15), answer = Math.floor(top / divisor) - 1;
      return open(`${prefix}_${n}`, school, 'math', 'num', `Сколько положительных чисел меньше ${top} делятся на ${divisor} без остатка?`, answer, `Это ${divisor}, ${2 * divisor}, ..., ${top - divisor}: всего ${answer}.`);
    }
    const x = 4 + n % 12, mult = 2 + n % 7, add = 5 + n % 13, total = mult * x + add;
    return open(`${prefix}_${n}`, school, 'math', 'eq', `Решите уравнение: ${mult}x + ${add} = ${total}.`, x, `${mult}x = ${total - add}, поэтому x = ${x}.`);
  });
}

function buildNishMath(count) {
  return buildOpenMath('nis_synaq_math', 'НИШ', count, 300).map((q, index) => {
    const correct = Number(q.answer), set = numericOptions(correct, Math.max(1, (index % 4) + 1), index);
    return { ...q, options: set.options, answer: set.answer };
  });
}

function buildKolzar(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1, x = 7 + n % 31, y = 3 + n % 17;
    const relation = n % 3;
    const a = x * y + (relation === 0 ? 0 : relation === 1 ? n % 9 + 1 : 0);
    const b = x * y + (relation === 2 ? n % 9 + 1 : 0);
    const answer = a > b ? 'А' : b > a ? 'В' : 'Тең';
    return choice(`nis_synaq_kolzar_${n}`, 'НИШ', 'kolzar', 'kolzar',
      `Салыстырыңыз.\nА) ${x} · ${y}${a === x * y ? '' : ` + ${a - x * y}`}\nВ) ${x * y}${b === x * y ? '' : ` + ${b - x * y}`}`,
      ['А', 'В', 'Тең'], answer, `А = ${a}, В = ${b}. Сондықтан дұрыс жауап: ${answer}.`);
  });
}

function buildScience(count) {
  const builders = [
    (n) => { const v = 4 + n % 12, t = 3 + n % 9, a = v * t; return [`Тело движется со скоростью ${v} м/с в течение ${t} секунд. Какой путь оно проходит?`, a, 'м']; },
    (n) => { const m = 120 + 20 * (n % 15), v = 20 + 5 * (n % 9), a = m / v; return [`Масса образца ${m} г, объём ${v} см³. Найдите плотность в г/см³.`, a, 'г/см³']; },
    (n) => { const scale = 2 + n % 8, cm = 3 + n % 9, a = scale * cm; return [`На карте 1 см соответствует ${scale} км. Чему соответствует отрезок ${cm} см?`, a, 'км']; },
    (n) => { const p = 40 + 10 * (n % 10), h = 2 + n % 7, a = p * h; return [`Прибор мощностью ${p} Вт работал ${h} часов. Сколько ватт-часов энергии он использовал?`, a, 'Вт·ч']; },
    (n) => { const start = 8 + n % 11, rise = 3 + n % 9, a = start + rise; return [`Температура была ${start}°C и повысилась на ${rise}°C. Какой стала температура?`, a, '°C']; },
    (n) => { const total = 100 + 20 * (n % 15), pct = 10 + 10 * (n % 5), a = total * pct / 100; return [`В экосистеме ${total} растений, ${pct}% из них цветущие. Сколько цветущих растений?`, a, '']; },
    (n) => { const initial = 200 + 25 * (n % 12), loss = 5 + 5 * (n % 6), a = initial * (100 - loss) / 100; return [`В сосуде было ${initial} г воды. Испарилось ${loss}%. Сколько граммов осталось?`, a, 'г']; },
    (n) => { const parts = 2 + n % 5, each = 30 + 10 * (n % 8), a = parts * each; return [`В пищевой цепи рассматривают ${parts} одинаковые группы по ${each} организмов. Сколько организмов всего?`, a, '']; },
    (n) => { const liters = 2 + n % 8, a = liters * 1000; return [`Переведите ${liters} литров воды в миллилитры.`, a, 'мл']; },
    (n) => { const distance = 300 + 50 * (n % 10), speed = 300 + 10 * (n % 5), a = distance / speed; return [`Звук прошёл ${distance} м со скоростью ${speed} м/с. Сколько секунд занял путь?`, a, 'с']; },
    (n) => { const force = 10 + 2 * (n % 11), arm = 2 + n % 5, other = 1 + n % 4, a = force * arm / other; return [`На рычаг действует сила ${force} Н на плече ${arm} м. Какая сила уравновесит её на плече ${other} м?`, a, 'Н']; },
    (n) => { const rain = 2 + n % 9, area = 10 + 5 * (n % 8), a = rain * area; return [`На участок площадью ${area} м² выпало ${rain} л осадков на 1 м². Сколько литров выпало всего?`, a, 'л']; },
    (n) => { const panels = 2 + n % 7, each = 50 + 10 * (n % 9), a = panels * each; return [`Солнечная установка состоит из ${panels} панелей по ${each} Вт. Какова общая мощность?`, a, 'Вт']; },
    (n) => { const mass = 20 + 5 * (n % 9), c = 4, dt = 2 + n % 6, a = mass * c * dt; return [`Для нагрева ${mass} г вещества на ${dt}°C требуется ${c} Дж на каждый грамм и градус. Сколько энергии нужно?`, a, 'Дж']; },
    (n) => { const waves = 10 + n % 15, sec = 2 + n % 5, a = waves / sec; return [`За ${sec} секунд произошло ${waves} одинаковых колебаний. Найдите частоту колебаний в герцах.`, a, 'Гц']; },
  ];
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1, [statement, raw, unit] = builders[index % builders.length](n);
    const answer = Number.isInteger(raw) ? raw : +raw.toFixed(2);
    const step = Number.isInteger(answer) ? Math.max(1, (n % 5) + 1) : 0.5;
    const set = numericOptions(answer, step, n);
    return choice(`nis_synaq_science_${n}`, 'НИШ', 'science', 'science', statement, set.options, set.answer,
      `Используем данные из условия и получаем ${answer}${unit ? ` ${unit}` : ''}.`);
  });
}

const EN_NAMES = ['Amina', 'Daniel', 'Mira', 'Alex', 'Sofia', 'Tim', 'Eva', 'Leo'];
function buildEnglish(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1, name = EN_NAMES[index % EN_NAMES.length], books = 3 + n % 14, extra = 2 + n % 7;
    const kind = index % 4;
    if (kind === 0) return choice(`nis_synaq_eng_${n}`, 'НИШ', 'eng', 'lang_eng',
      `${name} had ${books} books and received ${extra} more. How many books does ${name} have now?`,
      [String(books + extra - 1), String(books + extra), String(books), String(extra)], String(books + extra), 'Add the books already owned and the books received.');
    if (kind === 1) return choice(`nis_synaq_eng_${n}`, 'НИШ', 'eng', 'lang_eng',
      `Choose the correct form: Yesterday ${name} ___ to the library.`, ['go', 'goes', 'went', 'going'], 'went', '“Yesterday” requires the past-tense form “went”.');
    if (kind === 2) return choice(`nis_synaq_eng_${n}`, 'НИШ', 'eng', 'lang_eng',
      `Choose the correct word: This puzzle is ___ than the previous one.`, ['difficult', 'more difficult', 'most difficult', 'difficulty'], 'more difficult', 'A comparison with “than” requires the comparative form.');
    return choice(`nis_synaq_eng_${n}`, 'НИШ', 'eng', 'lang_eng',
      `${name} studies every evening because there is a test on Friday. Why does ${name} study every evening?`,
      ['There is a test on Friday.', 'The library is closed.', 'It is the weekend.', 'There is no homework.'], 'There is a test on Friday.', 'The reason is stated directly in the sentence.');
  });
}

const RU_NAMES = ['Алия', 'Данияр', 'Мира', 'Арман', 'София', 'Тимур', 'Ева', 'Леон'];
function buildRussian(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1, name = RU_NAMES[index % RU_NAMES.length], pages = 12 + n % 25, days = 2 + n % 6;
    const kind = index % 3;
    if (kind === 0) return choice(`nis_synaq_rus_${n}`, 'НИШ', 'rus', 'lang_rus',
      `${name} читал(а) по ${pages} страниц в день в течение ${days} дней. Сколько страниц было прочитано?`,
      [String(pages * days), String(pages + days), String(pages * days - pages), String(pages)], String(pages * days), 'Нужно умножить число страниц в день на количество дней.');
    if (kind === 1) return choice(`nis_synaq_rus_${n}`, 'НИШ', 'rus', 'lang_rus',
      `Выберите предложение, в котором причина названа прямо.`,
      [`${name} остался дома, потому что шёл сильный дождь.`, `${name} посмотрел в окно.`, `${name} взял книгу.`, `${name} улыбнулся.`], `${name} остался дома, потому что шёл сильный дождь.`, 'Союз «потому что» прямо указывает причину.');
    return choice(`nis_synaq_rus_${n}`, 'НИШ', 'rus', 'lang_rus',
      `В понедельник ${name} пришёл в библиотеку, а во вторник вернул книгу. Когда была возвращена книга?`,
      ['В понедельник', 'Во вторник', 'В среду', 'В воскресенье'], 'Во вторник', 'Это прямо сказано во второй части предложения.');
  });
}

const KK_NAMES = ['Алия', 'Данияр', 'Мира', 'Арман', 'София', 'Тимур', 'Әли', 'Аружан'];
function buildKazakh(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1, name = KK_NAMES[index % KK_NAMES.length], pages = 10 + n % 21, days = 2 + n % 6;
    const kind = index % 3;
    if (kind === 0) return choice(`nis_synaq_kaz_${n}`, 'НИШ', 'kaz', 'lang_kaz',
      `${name} ${days} күн бойы күніне ${pages} беттен кітап оқыды. Барлығы неше бет оқыды?`,
      [String(pages * days), String(pages + days), String(pages), String(pages * days - pages)], String(pages * days), 'Күн санын бір күнде оқылған бет санына көбейтеміз.');
    if (kind === 1) return choice(`nis_synaq_kaz_${n}`, 'НИШ', 'kaz', 'lang_kaz',
      `${name} жаңбыр жауғандықтан үйде қалды. Оның үйде қалу себебі қандай?`,
      ['Жаңбыр жауды', 'Күн ашық болды', 'Сабақ аяқталды', 'Кітап жоғалды'], 'Жаңбыр жауды', 'Себеп сөйлемде тікелей берілген.');
    return choice(`nis_synaq_kaz_${n}`, 'НИШ', 'kaz', 'lang_kaz',
      `${name} дүйсенбіде кітапханаға барды, ал сейсенбіде кітапты қайтарды. Кітап қашан қайтарылды?`,
      ['Дүйсенбіде', 'Сейсенбіде', 'Сәрсенбіде', 'Жексенбіде'], 'Сейсенбіде', 'Мәтінде кітаптың сейсенбіде қайтарылғаны айтылған.');
  });
}

function buildLogic(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1, start = 2 + n % 12, diff = 2 + n % 9;
    if (index % 2 === 0) {
      const seq = Array.from({ length: 5 }, (_, k) => start + k * diff), answer = start + 5 * diff;
      const set = numericOptions(answer, diff, index);
      return choice(`bil_synaq_logic_${n}`, 'БИЛ', 'logic', 'seq', `Қатарды жалғастырыңыз: ${seq.join(', ')}, ...`, set.options, set.answer, `Әр санға ${diff} қосылады. Келесі сан: ${answer}.`);
    }
    const a = 3 + n % 9, b = 2 + n % 7, answer = a * b + b;
    const set = numericOptions(answer, b, index);
    return choice(`bil_synaq_logic_${n}`, 'БИЛ', 'logic', 'mtx', `Ереже: x ◇ y = xy + y. ${a} ◇ ${b} мәнін табыңыз.`, set.options, set.answer, `${a} · ${b} + ${b} = ${answer}.`);
  });
}

function buildReading(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1, trees = 20 + n % 31, extra = 5 + n % 16;
    const passage = `Школьная команда участвовала в экологическом проекте. В первый день ученики посадили ${trees} деревьев, а во второй - ещё ${extra}. После работы они записали результаты и полили все саженцы.`;
    if (index % 3 === 0) {
      const set = numericOptions(trees + extra, Math.max(1, n % 5 + 1), n);
      return choice(`bil_synaq_reading_${n}`, 'БИЛ', 'reading', 'reading', `${passage}\n\nСколько деревьев посадила команда за два дня?`,
        set.options, set.answer, 'Складываем результаты двух дней.');
    }
    if (index % 3 === 1) return choice(`bil_synaq_reading_${n}`, 'БИЛ', 'reading', 'reading', `${passage}\n\nЧто ученики сделали после посадки?`,
      ['Записали результаты и полили саженцы.', 'Уехали домой, не закончив работу.', 'Срубили старые деревья.', 'Отменили проект.'], 'Записали результаты и полили саженцы.', 'Ответ содержится в последнем предложении текста.');
    return choice(`bil_synaq_reading_${n}`, 'БИЛ', 'reading', 'reading', `${passage}\n\nКакова основная тема текста?`,
      ['Участие школьников в экологическом проекте.', 'Покупка школьных учебников.', 'Подготовка к спортивному турниру.', 'Поездка в другой город.'], 'Участие школьников в экологическом проекте.', 'Все события текста связаны со школьным экологическим проектом.');
  });
}

export const expandedQuestions = [
  ...buildOpenMath('rfmsh_synaq', 'РФМШ', 100, 500),
  ...buildNishMath(60),
  ...buildKolzar(420),
  ...buildScience(180),
  ...buildEnglish(160),
  ...buildRussian(130),
  ...buildKazakh(110),
  ...buildOpenMath('bil_synaq_math', 'БИЛ', 10, 900),
  ...buildLogic(80),
  ...buildReading(90),
];
