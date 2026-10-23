import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {courseTaskTopic} from '../scripts/zerek-course-topic.mjs';

test('fractional sequences and simplification belong to their learning skills', () => {
  assert.equal(courseTaskTopic('4.12. Бөлшектерден тұратын сандар тізбектері'), 'seq');
  assert.equal(courseTaskTopic('1.9. Өрнектерді ықшамдау'), 'eq');
});

test('explicit questions take precedence over the source chapter context', () => {
  assert.equal(courseTaskTopic('Ондық бөлшекті натурал санға көбейту', 'Фигура бірдей квадраттардан құралған.\nФигураның периметрі неше сантиметр?'), 'geo');
  assert.equal(courseTaskTopic('Ондық бөлшектерді көбейту', 'Теңдеуді шешіңдер: 3,46y − 1,46y + 0,5 · 4 = 19.'), 'eq');
  assert.equal(courseTaskTopic('Рационал сандар', 'Теңсіздікті шешіңдер: 2x < 4.'), 'sys');
  assert.equal(courseTaskTopic('Рационал сандар', 'Теңсіздіктерді шешіңдер: 2x < 4.'), 'sys');
  assert.equal(courseTaskTopic('Ондық бөлшектерді салыстыру', 'a мен b — әртүрлі цифрлар.\nНеше реттелген жұп бар?'), 'comb');
});

test('operation chains, pool capacities and decimal comparisons retain their subject', () => {
  assert.equal(courseTaskTopic('Ондық бөлшектерді көбейту', 'Суретте амалдар тізбегі берілген.\nСұрақ белгісінің орнына қандай сан жазылады?'), 'frac');
  assert.equal(courseTaskTopic('Бірлесіп орындалатын жұмыстарға есептер', 'Бассейннің көлемі 1200 л.\nЕкі құбыр оны бірге неше сағатта толтырады?'), 'work');
  assert.equal(courseTaskTopic('Ондық бөлшектерді салыстыру', 'Сандардың ең үлкенін табыңдар: 0,75; 0,8; 0,799; 0,09.'), 'frac');
  assert.equal(courseTaskTopic('Қозғалыстың орташа жылдамдығы'), 'ratio');
});


test('set relations, arithmetic means and coordinate rays keep their mathematical meaning', () => {
  assert.equal(courseTaskTopic('Жиындар арасындағы қатынас'), 'sets');
  assert.equal(courseTaskTopic('Бірнеше санның арифметикалық ортасы'), 'stats');
  assert.equal(courseTaskTopic('Берілген сандар қатарының өзгеру құлашы, медианасы, модасы'), 'stats');
  assert.equal(courseTaskTopic('Координаталық сәуле. Натурал сандарды кескіндеу'), 'num');
  assert.equal(courseTaskTopic('Жай бөлшектерді координаталық сәуледе кескіндеу'), 'frac');
  assert.equal(courseTaskTopic('Координаталық жазықтық'), 'geo');
  assert.equal(courseTaskTopic('Бірлескен жұмыс', 'Екі жұмысшы t уақыт жұмыс істеді. Атқарылған жұмыстың көлемін табатын формуланы таңдаңдар.'), 'work');
  assert.equal(courseTaskTopic('Сандық өрнектер. Әріпті өрнектер', 'Пойыз t сағат 80 км/сағ жылдамдықпен жүрді. Барлығы неше километр жол жүрді?'), 'eq');
});

test('rounding and largest-number questions do not match circle or width words', () => {
  const title = '1.3. Миллиондар класы. Сандарды дөңгелектеу';
  assert.equal(courseTaskTopic(title, '352 140 906 санындағы 5 цифры қай разрядта тұр?'), 'num');
  assert.equal(courseTaskTopic(title, '3 451 609 санын миллионға дейін дөңгелектеңдер.'), 'num');
  assert.equal(courseTaskTopic(title, 'Бір санды жүздікке дейін дөңгелектегенде 4 500, ал ондыққа дейін дөңгелектегенде 4 450 шықты. Осындай сандардың ең үлкенін табыңдар.'), 'num');
  assert.equal(courseTaskTopic('Ондық бөлшектерді дөңгелектеу', '3,457 санын жүздік үлеске дейін дөңгелектеңдер.'), 'frac');
  assert.equal(courseTaskTopic('Шеңбер. Дөңгелек'), 'geo');
  assert.equal(courseTaskTopic('Натурал сандар', 'Қорапта 7, 12 және 20 сандары жазылған карточкалар бар. Сандардың ең үлкенін табыңдар.'), 'num');
  assert.equal(courseTaskTopic('Натурал сандар', 'Қораптың ұзындығы 8 см, биіктігі 3 см. Енін табыңдар.'), 'geo');
});

test('known algebra, geometry, interval and fraction lessons have explicit fallbacks', () => {
  for (const title of ['Жақшаларды ашу. Коэффициент', 'Ұқсас қосылғыштар', 'Теңбе-теңдіктер. Теңбе-тең түрлендірулер']) {
    assert.equal(courseTaskTopic(title), 'eq', title);
  }
  for (const title of ['Жазықтық. Қиылысатын түзулер', 'Вектор ұғымы']) {
    assert.equal(courseTaskTopic(title), 'geo', title);
  }
  for (const title of ['Сан аралықтары', 'Сан аралықтарының бірігуі мен қиылысуы', 'Екі айнымалысы бар сызықтық теңдеулер және олардың жүйелері']) {
    assert.equal(courseTaskTopic(title), 'sys', title);
  }
  for (const title of ['Өзара кері сандар', 'Санның бөлігін табу. Бөлігі бойынша санды табу']) {
    assert.equal(courseTaskTopic(title), 'frac', title);
  }
  assert.equal(courseTaskTopic('Ұқсас қосылғыштар', 'Пойыз t сағат бойы v км/сағ жылдамдықпен жүрді. Жолды өрнекпен жазыңдар.'), 'eq');
});

test('union cardinality and numeral-system symbols are distinct from subset choices', () => {
  assert.equal(courseTaskTopic('Жиындар арасындағы қатынас', 'Эйлер-Венн диаграммасында A шеңберінде 11 элемент, B шеңберінде 8 элемент бар. Ортақ бөлікте 3 элемент.\nЕкі шеңберде барлығы неше түрлі элемент бар?'), 'sets');
  assert.equal(courseTaskTopic('Жиындардың қиылысуы мен бірігуі және олардың қасиеттері', 'Әлияның сөресінде 12 кітап, Айнаның сөресінде 9 кітап бар. Олардың 4 кітабы бірдей. Екі сөреде барлығы неше түрлі кітап бар?'), 'sets');
  assert.equal(courseTaskTopic('Натурал сандар және нөл', 'Ондық санау жүйесінде кез келген натурал санды жазу үшін неше түрлі цифр жеткілікті?'), 'num');
  assert.equal(courseTaskTopic('Ішкі жиын', 'Дүкенде 5 түрлі жеміс бар. Айгерім кемінде бір түр жеміс алмақшы (әр түрден не алады, не алмайды). Ол таңдаған жемістер жиыны неше түрлі болуы мүмкін?'), 'comb');
  assert.equal(courseTaskTopic('Координаталық сәуле', 'Сәуледе A(1), B(4), C(7), D(12), E(15) берілген. Нүктелердің әр екеуінің арасындағы қашықтықтар жазылды. Барлығы неше түрлі сан жазылды?'), 'comb');
});

test('choosing, constructing and counting roots of equations precedes their story context', () => {
  assert.equal(courseTaskTopic('Көптаңбалы сандарды екі таңбалы санға жазбаша көбейту', 'Теңдеудің түбірін таңдаңдар: x : 18 = 1 206.'), 'eq');
  assert.equal(courseTaskTopic('Натурал санның бөлгіштері', 'Теңдеудің натурал түбірін табыңдар: x · (x - 3) = 70.'), 'eq');
  assert.equal(courseTaskTopic('Қозғалысқа берілген есептер', 'Біреуінің жылдамдығы 5 км/сағ. x — екіншісінің жылдамдығы. Есепке сәйкес теңдеуді таңдаңдар.'), 'eq');
  assert.equal(courseTaskTopic('Екі айырма бойынша белгісізді табу', 'Армандағы ақшаны екі түрлі жазып, қай теңдеуді құруға болады?'), 'eq');
  assert.equal(courseTaskTopic('Жай бөлшектерді көбейту', '(x - (2 + (1/4))) · (x - (8/15)) = 0 теңдеуінің барлық түбірлерінің көбейтіндісін табыңдар.'), 'eq');
  assert.equal(courseTaskTopic('Санның модулі', '|x| = 7 теңдеуінің неше шешімі бар?'), 'eq');
  assert.equal(courseTaskTopic('Санның модулі', 'Қай теңдеудің шешімі жоқ?'), 'eq');
  assert.equal(courseTaskTopic('Теңдеулер', 'Теңдеулердің жүйесін шешіңдер.'), 'sys');
});

test('dependency tables follow the actual requested skill, not one chapter-wide topic', () => {
  const source = JSON.parse(readFileSync(new URL('../problems/sources/zerek/courses/6-math-9-2-level1.json', import.meta.url)));
  const questions = new Map(source.questions.map(q => [q.id, q.statement]));
  for (const [id, expected] of [
    ['bc1432ae348e4a5d', 'eq'], // Substitute x = 5 into y = 4x + 3.
    ['649d62998546e0ed', 'stats'], // Read the already listed price of four notebooks.
    ['c4a4dec9b970a672', 'ratio'], // Derive one pen's price from columns for 2, 4, 6, 8.
    ['c62de94e9f557f0b', 'seq'], // Complete the constant-step independent variable.
    ['4635e73ae4028a2c', 'stats'], // Read which time has the maximum temperature.
    ['0982a2d0315067f4', 'eq'], // Identify the formula represented by the table.
    ['6ec12c243376cdd7', 'eq'], // Check table entries against y = 3x + 1.
    ['877229e90e49a23a', 'seq'], // Determine the step of the listed decimal inputs.
  ]) {
    assert.ok(questions.has(id), id);
    assert.equal(courseTaskTopic(source.title, questions.get(id)), expected, id);
  }
  const extrapolated = questions.get('649d62998546e0ed').replace('$4$ дәптер неше', '$7$ дәптер неше');
  assert.equal(courseTaskTopic(source.title, extrapolated), 'ratio', 'seven is absent from the table, so a proportional calculation is required');
});

test('published Markdown tables retain lookup versus unit-rate classification', () => {
  const title = 'Шамалар арасындағы тәуелділіктердің кестемен берілуі';
  const cost = 'Кестеде дәптерлердің құнының олардың санына тәуелділігі берілген.\n\n| n | 1 | 2 | 3 | 4 |\n| --- | --- | --- | --- | --- |\n| C | 140 | 280 | 420 | 560 |\n';
  assert.equal(courseTaskTopic(title, cost + '4 дәптер неше теңге тұрады?'), 'stats');
  assert.equal(courseTaskTopic(title, cost + '7 дәптер неше теңге тұрады?'), 'ratio');
  const pens = 'Кестеде қаламдардың құнының олардың санына тәуелділігі берілген.\n\n| n | 2 | 4 | 6 | 8 |\n| --- | --- | --- | --- | --- |\n| C | 360 | 720 | 1080 | 1440 |\nБір қалам неше теңге тұрады?';
  assert.equal(courseTaskTopic(title, pens), 'ratio');
  assert.equal(courseTaskTopic('Ондық бөлшектерді көбейту', cost + '4 дәптер неше теңге тұрады?'), 'frac');
  assert.equal(courseTaskTopic('Ондық бөлшектерді көбейту', 'Тәуелділік y = 0,5x формуласымен берілген.\nКестедегі «?» орнына қандай сан жазылады?'), 'frac');
});

test('a requested productivity ratio differs from a given ratio in a joint-work question', () => {
  const source = JSON.parse(readFileSync(new URL('../problems/sources/zerek/courses/6-math-1-1-level3.json', import.meta.url)));
  const question = source.questions.find(q => q.id === '26742f9d34e15c38');
  assert.ok(question);
  assert.equal(courseTaskTopic(source.title, question.statement), 'ratio');
  const work = 'Екі құбырдың өнімділіктерінің қатынасы 3:2. Бірінші құбыр бассейнді 10 сағатта толтырады.\nЕкі құбыр бірге бассейнді неше сағатта толтырады?';
  assert.equal(courseTaskTopic('Бірлескен жұмыс', work), 'work');
  assert.equal(courseTaskTopic('Қатынас', work.replace('\n', ' ')), 'work');
  assert.equal(courseTaskTopic('Қатынас', 'Мектеп принтері 9 минутта 126 бет басып шығарды.\nПринтердің өнімділігі минутына неше бет?'), 'work');
});

test('equal-rate allocation and a later worker joining require different targets', () => {
  const root = new URL('../problems/sources/zerek/courses/', import.meta.url);
  const sources = ['6-math-1-5-leveltest.json', '6-math-1-5-level3.json']
    .map(file => JSON.parse(readFileSync(new URL(file, root))));
  const byId = new Map(sources.flatMap(source => source.questions.map(q => [q.id, [source.title, q.statement]])));
  for (const [id, expected] of [['44e5b9145feb8d36', 'ratio'], ['7fe40e7fe0c20449', 'work']]) {
    assert.ok(byId.has(id), id);
    assert.equal(courseTaskTopic(...byId.get(id)), expected, id);
  }
  const givenRatio = 'Бригадалардың өнімділіктерінің қатынасы 3:2. Бірінші бригада жалғыз 2 сағат жұмыс істеді, содан кейін екіншісі қосылды.\nЖұмыс басталғаннан неше сағаттан кейін тапсырыс бітеді?';
  assert.equal(courseTaskTopic('Тура пропорционал тәуелділік', givenRatio), 'work');
  assert.equal(courseTaskTopic('Бірлескен жұмыс', 'Өнімділігі бірдей екі бригада жұмыс істейді. Бірінші бригада неше сағатта жұмысты бітіреді?'), 'work');
});
