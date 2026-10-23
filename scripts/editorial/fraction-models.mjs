// Seventeen reviewed skill-transfer editions, not a bulk numeric-variant feed.
// Raw source references are archival. This module never edits/imports a source bank.
import assert from 'node:assert/strict';

const BASE = 'problems/sources/zerek/courses/';
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
function rational(n, d = 1n) {
  n = BigInt(n); d = BigInt(d); assert.notEqual(d, 0n, 'Zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d); return { n: n / g, d: d / g };
}
const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => rational(a.n * b.n, a.d * b.d);
const div = (a, b) => rational(a.n * b.d, a.d * b.n);
const show = a => a.d === 1n ? String(a.n) : `${a.n}/${a.d}`;
const pos = (a, label) => assert.ok(a.n > 0n, `${label} must be positive`);
const integer = (a, label) => { assert.equal(a.d, 1n, `${label} must be an exact integer`); return a; };
const natural = (a, label) => { pos(a, label); return integer(a, label); };
const value = n => rational(n);
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fraction = (n, d) => `${n}/${d}`;
function params(p, keys) {
  assert.deepEqual(Object.keys(p).sort(), keys.split(' ').sort(), 'Unexpected/missing model parameters');
  for (const [key, val] of Object.entries(p)) {
    assert.equal(Array.isArray(val), key === 'weights', `Unexpected parameter type ${key}`);
    for (const n of Array.isArray(val) ? val : [val]) assert.ok(Number.isSafeInteger(n) && n > 0 && n <= 1_000_000, `Invalid positive integer parameter ${key}`);
  }
}
function proper(n, d) { assert.ok(n > 0 && n < d, 'Expected a proper positive fraction'); return rational(n, d); }
function percent(n) { assert.ok(n > 0 && n < 100, 'Expected a percentage strictly between 0 and 100'); return rational(n, 100); }
const result = (answer, statement, solution, checks) => ({ answer: show(natural(answer, 'Answer')), statement, solution, checks });
const info = (editionId, grade, topic, difficulty, sourceFile, sourceId, adaptationChanges, render) => ({
  editionId, grade, topic, difficulty, sourceRefs: [{ sourceId, sourceFile: BASE + sourceFile }], adaptationChanges, render,
});

const MODELS = {
  'fraction-unit-capacity': info('synaq-standard-led-signs', 5, 'frac', 'medium', '5-math-3-14-level1.json', 'ef7b6d02181aa44e', [
    'Үй саны туралы бастапқы жағдайдың орнына жарық белгісін құрастыруға арналған дербес есеп жазылды.',
    'Табылған үлесті бір бұйымға қажет материалға бөлу қадамы қосылды; сұрақ дайын бұйым санын сұрайды.',
  ], p => {
    params(p, 'total numerator denominator perUnit');
    const allocated = natural(mul(value(p.total), proper(p.numerator, p.denominator)), 'Allocated LEDs');
    const answer = natural(div(allocated, value(p.perUnit)), 'Complete signs');
    return result(answer,
      `Роботтехника үйірмесінде ${p.total} жарықдиод бар. Олардың ${fraction(p.numerator, p.denominator)} бөлігі көрмеге арналған жарық белгілерін құрастыруға бөлінді. Бір белгіге ${p.perUnit} жарықдиод қажет. Бөлінген жарықдиодтардың бәрін қалдықсыз пайдаланып, неше белгі құрастыруға болады?`,
      `1) Белгілерге бөлінген жарықдиодтар: ${p.total} · ${fraction(p.numerator, p.denominator)} = ${show(allocated)}.\n2) Белгілер саны: ${show(allocated)} : ${p.perUnit} = ${show(answer)}.\nТексеру: ${show(answer)} · ${p.perUnit} = ${show(allocated)} жарықдиод.`,
      ['proper allocation fraction', 'allocated stock and complete-sign count are integers', 'no unused allocated stock']);
  }),
  'inverse-fraction-remaining': info('synaq-standard-eco-route-map', 5, 'frac', 'medium', '5-math-3-14-level1.json', '084106fa017e439b', [
    'Жалаң белгісіз санның орнына экобағыт картасындағы аялдамаларды аяқтау жағдайы құрылды.',
    'Белгілі бөлік арқылы бүтінді табудан кейін белгіленбеген аялдамаларды есептеу қажет.',
  ], p => {
    params(p, 'knownPart numerator denominator');
    const whole = natural(div(value(p.knownPart), proper(p.numerator, p.denominator)), 'All stops');
    const remaining = sub(whole, value(p.knownPart));
    return result(remaining,
      `Экологиялық бағыт картасында жоспарланған аялдамалардың ${fraction(p.numerator, p.denominator)} бөлігі белгіленді. Бұл — ${p.knownPart} аялдама. Картаға тағы неше аялдаманы белгілеу керек?`,
      `1) Бүтін картаның бір үлесіне ${p.knownPart} : ${p.numerator} = ${show(rational(p.knownPart, p.numerator))} аялдама сәйкес келеді.\n2) Барлық аялдама: ${p.knownPart} · ${p.denominator} : ${p.numerator} = ${show(whole)}.\n3) Белгіленбегені: ${show(whole)} − ${p.knownPart} = ${show(remaining)} аялдама.`,
      ['known fraction is proper', 'whole and remaining stops are positive integers', 'known plus remaining equals whole']);
  }),
  'same-whole-two-shares-capacity': info('synaq-standard-plastic-thread', 5, 'frac', 'hard', '5-math-3-1-level2.json', '7dfe1cadd684683f', [
    'Картоп сату жағдайы қолданылмай, модельдеу үйірмесіндегі пластик жіп туралы жаңа шарт жазылды.',
    'Екі үлестің де бастапқы қордан алынатыны нақтыланды; қалдықтан бірдей дайындамалар жасау қадамы қосылды.',
  ], p => {
    params(p, 'total firstNumerator firstDenominator secondNumerator secondDenominator pieceLength');
    const first = proper(p.firstNumerator, p.firstDenominator), second = proper(p.secondNumerator, p.secondDenominator);
    const used = add(first, second), leftFraction = sub(value(1), used); pos(leftFraction, 'Remaining fraction');
    const left = natural(mul(value(p.total), leftFraction), 'Remaining thread metres');
    const count = natural(div(left, value(p.pieceLength)), 'Complete pieces');
    return result(count,
      `Модельдеу үйірмесіне ${p.total} м пластик жіп алынды. Бірінші макетке барлық жіптің ${fraction(p.firstNumerator, p.firstDenominator)} бөлігі, ал екінші макетке барлық жіптің ${fraction(p.secondNumerator, p.secondDenominator)} бөлігі жұмсалды. Қалған жіпті әрқайсысы ${p.pieceLength} м болатын дайындамаларға қалдықсыз бөлді. Неше дайындама шықты?`,
      `1) Екі макетке бастапқы жіптің ${fraction(p.firstNumerator, p.firstDenominator)} + ${fraction(p.secondNumerator, p.secondDenominator)} = ${show(used)} бөлігі жұмсалды.\n2) Қалған үлес: 1 − ${show(used)} = ${show(leftFraction)}.\n3) Қалған жіп: ${p.total} · ${show(leftFraction)} = ${show(left)} м.\n4) Дайындамалар саны: ${show(left)} : ${p.pieceLength} = ${show(count)}.`,
      ['both shares refer to the original stock', 'sum of shares is strictly below one', 'remaining metres and piece count are positive integers']);
  }),
  'mixed-mass-consumption-conversion': info('synaq-standard-ceramic-clay', 5, 'frac', 'medium', '5-math-3-9-level1.json', 'b488d9dbeb883dc0', [
    'Екі жәшіктегі өнімді қосу орнына керамика үйірмесінің саз қоры мен шығыны туралы дербес жағдай берілді.',
    'Аралас сандарды қосу, бірнеше бұйымға кеткен массаны азайту және килограмды грамға ауыстыру біріктірілді.',
  ], p => {
    params(p, 'blueWhole blueNumerator blueDenominator whiteWhole whiteNumerator whiteDenominator items perItemNumerator perItemDenominator');
    const blue = add(value(p.blueWhole), proper(p.blueNumerator, p.blueDenominator));
    const white = add(value(p.whiteWhole), proper(p.whiteNumerator, p.whiteDenominator));
    const stock = add(blue, white), used = mul(value(p.items), proper(p.perItemNumerator, p.perItemDenominator));
    const left = sub(stock, used); pos(left, 'Clay remaining');
    const grams = mul(left, value(1000));
    return result(grams,
      `Керамика үйірмесінде ${p.blueWhole} ${fraction(p.blueNumerator, p.blueDenominator)} кг көк және ${p.whiteWhole} ${fraction(p.whiteNumerator, p.whiteDenominator)} кг ақ саз бар. Осы қордан ${p.items} шағын бұйым жасалды, әр бұйымға ${fraction(p.perItemNumerator, p.perItemDenominator)} кг саз жұмсалды. Қанша грамм саз қалды? 1 кг = 1000 г.`,
      `1) Бастапқы саз: ${show(blue)} + ${show(white)} = ${show(stock)} кг.\n2) Бұйымдарға жұмсалғаны: ${p.items} · ${fraction(p.perItemNumerator, p.perItemDenominator)} = ${show(used)} кг.\n3) Қалғаны: ${show(stock)} − ${show(used)} = ${show(left)} кг.\n4) Граммен: ${show(left)} · 1000 = ${show(grams)} г.`,
      ['mixed-number fractional parts are proper', 'consumption is less than available clay', 'kilogram-to-gram conversion is exact']);
  }),
  'different-wholes-share-comparison': info('synaq-standard-reading-pages', 5, 'frac', 'hard', '5-math-3-7-leveltest.json', 'f58a3408ff57ca9d', [
    'Бірдей құмыралардың үлестерін салыстырудан ұзындығы әртүрлі екі кітаптағы оқылған бет санын салыстыруға көшірілді.',
    'Бүтіндер тең емес: алдымен әр үлестің нақты мәні табылады, кейін олардың айырмасы есептеледі.',
  ], p => {
    params(p, 'firstPages firstNumerator firstDenominator secondPages secondNumerator secondDenominator');
    const first = natural(mul(value(p.firstPages), proper(p.firstNumerator, p.firstDenominator)), 'First pages read');
    const second = natural(mul(value(p.secondPages), proper(p.secondNumerator, p.secondDenominator)), 'Second pages read');
    const difference = sub(second, first);
    return result(difference,
      `Аружан ${p.firstPages} беттік кітаптың ${fraction(p.firstNumerator, p.firstDenominator)} бөлігін, ал Данияр ${p.secondPages} беттік кітаптың ${fraction(p.secondNumerator, p.secondDenominator)} бөлігін оқыды. Данияр Аружаннан неше бет артық оқыды?`,
      `1) Кітаптардың бет саны әртүрлі, сондықтан тек үлестерді салыстыру жеткіліксіз.\n2) Аружан ${p.firstPages} · ${fraction(p.firstNumerator, p.firstDenominator)} = ${show(first)} бет оқыды.\n3) Данияр ${p.secondPages} · ${fraction(p.secondNumerator, p.secondDenominator)} = ${show(second)} бет оқыды.\n4) Айырмасы: ${show(second)} − ${show(first)} = ${show(difference)} бет.`,
      ['each read fraction is proper', 'page counts are integral', 'second actual quantity exceeds first despite unequal wholes']);
  }),
  'complementary-shares-difference': info('synaq-standard-fair-tickets', 5, 'frac', 'hard', '5-math-3-1-level3.json', 'd9daef1bc5137d8b', [
    'Жол ұзындығы туралы шарттың орнына жәрмеңкенің сатылған және сатылмаған билеттері туралы жаңа есеп құрылды.',
    'Бүтін белгісіз; толықтырушы екі үлестің айырмасы арқылы қалпына келтіріледі.',
  ], p => {
    params(p, 'partNumerator partDenominator unsoldExcess');
    const soldFraction = proper(p.partNumerator, p.partDenominator);
    const unsoldFraction = sub(value(1), soldFraction), differenceFraction = sub(unsoldFraction, soldFraction);
    pos(differenceFraction, 'Unsold excess fraction');
    const total = natural(div(value(p.unsoldExcess), differenceFraction), 'All tickets');
    const sold = natural(mul(total, soldFraction), 'Sold tickets'), unsold = natural(mul(total, unsoldFraction), 'Unsold tickets');
    return result(total,
      `Қайырымдылық жәрмеңкесіне шығарылған билеттердің ${fraction(p.partNumerator, p.partDenominator)} бөлігі алдын ала сатылды. Сатылмаған билеттер саны сатылған билеттер санынан ${p.unsoldExcess}-ге артық. Жәрмеңкеге барлығы неше билет шығарылды?`,
      `1) Сатылмаған үлес: 1 − ${fraction(p.partNumerator, p.partDenominator)} = ${show(unsoldFraction)}.\n2) Екі топтың айырмасы бүтіннің ${show(unsoldFraction)} − ${fraction(p.partNumerator, p.partDenominator)} = ${show(differenceFraction)} бөлігіне тең.\n3) Барлық билет: ${p.unsoldExcess} : ${show(differenceFraction)} = ${show(total)}.\nТексеру: ${show(unsold)} − ${show(sold)} = ${p.unsoldExcess} билет.`,
      ['sold fraction is below one half', 'sold and unsold quantities are positive integers', 'difference and conservation of total tickets verified']);
  }),
  'nested-percent-selection': info('synaq-standard-science-festival', 5, 'pct', 'medium', '5-math-6-2-level1.json', 'bc7f8ac30cf68126', [
    'Кітап сөресіндегі бір үлестің орнына ғылым фестиваліндегі екі сатылы таңдау жағдайы жасалды.',
    'Екінші пайыз барлық қатысушыдан емес, бірінші топтың ішінен алынатыны шартта анық айтылды.',
  ], p => {
    params(p, 'total firstPercent secondPercent');
    const first = natural(mul(value(p.total), percent(p.firstPercent)), 'Robotics group');
    const second = natural(mul(first, percent(p.secondPercent)), 'Competition group');
    return result(second,
      `Ғылым фестиваліне ${p.total} оқушы тіркелді. Олардың ${p.firstPercent}%-ы роботтехника аймағын таңдады. Осы роботтехника тобының ${p.secondPercent}%-ы шағын жарысқа қатысады. Шағын жарысқа неше оқушы қатысады?`,
      `1) Роботтехника тобы: ${p.total} · ${p.firstPercent}/100 = ${show(first)} оқушы.\n2) Екінші пайыз осы ${show(first)} оқушыдан алынады: ${show(first)} · ${p.secondPercent}/100 = ${show(second)} оқушы.`,
      ['two percentages are conditional stages', 'both group sizes are integers', 'final group is a subset of the first group']);
  }),
  'inverse-discount-fixed-fee': info('synaq-standard-study-kit-delivery', 6, 'pct', 'medium', '6-math-2-16-level1.json', '4a2a33f0f1daab78', [
    'Зейнетақы өсімі орнына оқу жинағына жеңілдік және бөлек жеткізу ақысы бар жаңа сатып алу жағдайы құрылды.',
    'Пайыздық негізді табудан бұрын тұрақты жеткізу ақысын ажырату қажет; бастапқы баға кері есептеледі.',
  ], p => {
    params(p, 'discountPercent delivery paid');
    const retained = sub(value(1), percent(p.discountPercent));
    const discounted = sub(value(p.paid), value(p.delivery)); pos(discounted, 'Discounted kit price');
    const original = div(discounted, retained);
    return result(original,
      `Кітап дүкені оқу жинағының бағасын ${p.discountPercent}%-ға арзандатты. Жеткізу ақысы ${fmt(p.delivery)} теңге болды. Жеңілдікпен алынған жинақ пен жеткізуге барлығы ${fmt(p.paid)} теңге төленді. Жинақтың жеңілдікке дейінгі бағасы неше теңге еді?`,
      `1) Жеткізусіз жинақтың бағасы: ${fmt(p.paid)} − ${fmt(p.delivery)} = ${show(discounted)} теңге.\n2) Бұл бастапқы бағаның ${100 - p.discountPercent}%-ы.\n3) Бастапқы баға: ${show(discounted)} : ${show(retained)} = ${show(original)} теңге.\nТексеру: ${show(original)} · ${show(retained)} + ${p.delivery} = ${p.paid}.`,
      ['delivery is a separate fixed fee', 'discount is between zero and 100 percent', 'inverse price exactly reproduces amount paid']);
  }),
  'sequential-relative-price-changes': info('synaq-standard-skating-pass', 6, 'pct', 'hard', '6-math-2-16-level1.json', '4b1ec0906f346c7b', [
    'Суреттегі көйлек бағасы қолданылмай, мұз айдыны абонементінің толық мәтіндік жағдайы жазылды.',
    'Барлық бастапқы дерек өзгертілді; сұрақ соңғы бағаны емес, бастапқы бағамен теңгелік айырмасын сұрайды.',
  ], p => {
    params(p, 'originalPrice increasePercent discountPercent');
    const up = add(value(1), percent(p.increasePercent)), down = sub(value(1), percent(p.discountPercent));
    const raised = natural(mul(value(p.originalPrice), up), 'Raised price');
    const final = natural(mul(raised, down), 'Final price');
    const excess = sub(final, value(p.originalPrice));
    return result(excess,
      `Мұз айдынының айлық абонементі бастапқыда ${fmt(p.originalPrice)} теңге тұрды. Оның бағасы алдымен ${p.increasePercent}%-ға өсті. Кейін оқушыларға жаңа бағадан ${p.discountPercent}% жеңілдік берілді. Оқушы төлейтін соңғы баға бастапқы бағадан неше теңгеге қымбат?`,
      `1) Өскен баға: ${p.originalPrice} · ${100 + p.increasePercent}/100 = ${show(raised)} теңге.\n2) Жеңілдік осы жаңа бағадан есептеледі: ${show(raised)} · ${100 - p.discountPercent}/100 = ${show(final)} теңге.\n3) Бастапқы бағамен айырмасы: ${show(final)} − ${p.originalPrice} = ${show(excess)} теңге.\nПайыздарды жай азайтуға болмайды: екі өзгерістің негізі әртүрлі.`,
      ['percentage changes use successive bases', 'both intermediate prices are exact integer tenge', 'final price is above original as stated']);
  }),
  'dilution-solute-conservation': info('synaq-standard-lab-dilution', 6, 'pct', 'medium', '6-math-2-16-level1.json', 'c627c7b1e7c1d8fe', [
    'Тұз қосылатын бастапқы тәжірибенің орнына таза сумен сұйылту туралы жаңа тәжірибе берілді.',
    'Массалар мен бастапқы концентрация өзгертілді; тұз массасының сақталуы мен жалпы массаның өсуі пайдаланылды.',
  ], p => {
    params(p, 'initialMass initialPercent addedWater');
    const salt = natural(mul(value(p.initialMass), percent(p.initialPercent)), 'Salt mass');
    const finalMass = add(value(p.initialMass), value(p.addedWater));
    const concentration = mul(div(salt, finalMass), value(100));
    assert.ok(concentration.n < BigInt(p.initialPercent) * concentration.d, 'Dilution must reduce concentration');
    return result(concentration,
      `Мектеп зертханасында ${p.initialMass} г ${p.initialPercent}%-дық тұзды ерітіндіге ${p.addedWater} г таза су қосылды. Қоспа толық араластырылды, тұз жоғалған жоқ және су буланбады. Жаңа ерітіндідегі тұздың пайыздық мөлшері қанша?`,
      `1) Бастапқы тұз массасы: ${p.initialMass} · ${p.initialPercent}/100 = ${show(salt)} г.\n2) Су қосылғанда тұз массасы өзгермейді. Жаңа жалпы масса: ${p.initialMass} + ${p.addedWater} = ${show(finalMass)} г.\n3) Жаңа концентрация: ${show(salt)} : ${show(finalMass)} · 100% = ${show(concentration)}%.`,
      ['pure-water addition conserves salt mass', 'total mass increases', 'new concentration is positive and below initial concentration']);
  }),
  'three-way-ratio-budget-difference': info('synaq-standard-podcast-budget', 6, 'ratio', 'medium', '6-math-1-2-level1.json', '73ee7a974ad093d1', [
    'Үш досқа ақша бөлу орнына мектеп подкастының үш шығын бабы бойынша бюджеті құрылды.',
    'Деректер өзгертілді; ең үлкен үлесті табудың орнына екі мақсатқа бөлінген сомалардың айырмасы сұралды.',
  ], p => {
    params(p, 'total weights'); assert.equal(p.weights.length, 3); assert.ok(p.weights[1] > p.weights[0]);
    const sum = p.weights.reduce((a, b) => a + b, 0), unit = natural(rational(p.total, sum), 'One budget share');
    const sound = mul(unit, value(p.weights[0])), poster = mul(unit, value(p.weights[1])), light = mul(unit, value(p.weights[2]));
    const difference = sub(poster, sound);
    return result(difference,
      `Мектеп подкастын таныстыруға ${fmt(p.total)} теңге бөлінді. Ақша дыбыс жабдығына, плакаттарға және жарыққа тиісінше ${p.weights.join(':')} қатынасында жұмсалады. Плакаттарға бөлінген ақша дыбыс жабдығына бөлінген ақшадан неше теңгеге артық?`,
      `1) Барлық үлес: ${p.weights.join(' + ')} = ${sum}.\n2) Бір үлес: ${p.total} : ${sum} = ${show(unit)} теңге.\n3) Дыбысқа ${show(sound)}, плакаттарға ${show(poster)}, жарыққа ${show(light)} теңге бөлінеді.\n4) Айырмасы: ${show(poster)} − ${show(sound)} = ${show(difference)} теңге.`,
      ['three positive ratio weights', 'all budget shares are integer tenge', 'three allocations conserve total budget']);
  }),
  'ratio-scale-from-difference': info('synaq-standard-paper-collection', 6, 'ratio', 'medium', '6-math-1-2-level2.json', '78538f5d524cf442', [
    'Екі жалаң санның орнына экоакциядағы екі үйірменің қағаз жинауы туралы жағдай жазылды.',
    'Қатынас пен айырма жаңартылды; үлкен санның орнына жалпы жиналған масса сұралады.',
  ], p => {
    params(p, 'smallerWeight largerWeight difference'); assert.ok(p.largerWeight > p.smallerWeight);
    const unit = natural(rational(p.difference, p.largerWeight - p.smallerWeight), 'One mass share');
    const small = mul(unit, value(p.smallerWeight)), large = mul(unit, value(p.largerWeight)), total = add(small, large);
    return result(total,
      `Экоакцияда екі үйірме қағаз жинады. Бірінші және екінші үйірме жинаған қағаз массаларының қатынасы ${p.smallerWeight}:${p.largerWeight}. Екінші үйірме біріншіден ${p.difference} кг артық жинады. Екі үйірме барлығы неше килограмм қағаз жинады?`,
      `1) Айырма ${p.largerWeight} − ${p.smallerWeight} = ${p.largerWeight - p.smallerWeight} үлеске тең.\n2) Бір үлес: ${p.difference} : ${p.largerWeight - p.smallerWeight} = ${show(unit)} кг.\n3) Бірінші үйірме ${show(small)} кг, екіншісі ${show(large)} кг жинаған.\n4) Барлығы: ${show(small)} + ${show(large)} = ${show(total)} кг.`,
      ['larger ratio weight is strictly greater', 'difference fixes a unique positive scale', 'both masses and their sum are integers']);
  }),
  'inverse-resource-after-elapsed-use': info('synaq-standard-camp-water', 6, 'ratio', 'hard', '6-math-1-6-level1.json', 'b5790358b2ca3a31', [
    'Жылқы жемінің орнына лагерьдің ауызсу қоры туралы жаңа жағдай берілді.',
    'Қордың бір бөлігі жұмсалып болғаннан кейін адам саны өзгеретін қосымша кезең енгізілді.',
  ], p => {
    params(p, 'initialPeople initialDays elapsedDays addedPeople'); assert.ok(p.elapsedDays < p.initialDays);
    const initial = p.initialPeople * p.initialDays, used = p.initialPeople * p.elapsedDays, remaining = initial - used, people = p.initialPeople + p.addedPeople;
    const days = rational(remaining, people);
    return result(days,
      `Лагерьдегі ауызсу қоры ${p.initialPeople} оқушыға ${p.initialDays} күнге жетеді. Алғашқы ${p.elapsedDays} күнде лагерьде осы ${p.initialPeople} оқушы ғана болды. Содан кейін тағы ${p.addedPeople} оқушы келді. Әр оқушы күн сайын бірдей мөлшерде су ішеді. Жаңа оқушылар келгеннен кейін қалған су неше толық күнге дәл жетеді?`,
      `1) Қорды бір оқушының бір күнде ішетін суымен өлшейік. Бастапқы қор: ${p.initialPeople} · ${p.initialDays} = ${initial} үлес.\n2) Алғашқы күндері ${p.initialPeople} · ${p.elapsedDays} = ${used} үлес жұмсалды. Қалғаны: ${initial} − ${used} = ${remaining} үлес.\n3) Енді ${p.initialPeople} + ${p.addedPeople} = ${people} оқушы бар.\n4) Қалған қор ${remaining} : ${people} = ${show(days)} күнге жетеді.`,
      ['elapsed time is below initial reserve duration', 'per-person daily consumption is constant', 'remaining reserve exactly covers an integer number of days']);
  }),
  'piecewise-joint-production': info('synaq-standard-cap-sorting', 4, 'work', 'medium', '4-math-6-2-level1.json', '7ed683ff0e9f3375', [
    'Жұмысшылардың сағаттық өнімділігі орнына қайта өңдеуге арналған қақпақ сұрыптайтын екі құрылғы сипатталды.',
    'Бірге істеген кезеңнен кейін бір құрылғы тоқтайтын кезең қосылды; барлық өңделген қақпақ саны сұралды.',
  ], p => {
    params(p, 'firstRate secondRate togetherMinutes secondAloneMinutes');
    const together = (p.firstRate + p.secondRate) * p.togetherMinutes, alone = p.secondRate * p.secondAloneMinutes, total = together + alone;
    return result(value(total),
      `Қайта өңдеу бекетінде бірінші құрылғы минутына ${p.firstRate} қақпақ, екіншісі минутына ${p.secondRate} қақпақ сұрыптайды. Алғашқы ${p.togetherMinutes} минутта екі құрылғы қатар жұмыс істеді. Содан кейін бірінші құрылғы тоқтап, екіншісі тағы ${p.secondAloneMinutes} минут жұмыс істеді. Барлығы неше қақпақ сұрыпталды?`,
      `1) Екеуі бірге минутына ${p.firstRate} + ${p.secondRate} = ${p.firstRate + p.secondRate} қақпақ сұрыптайды.\n2) Бірге істегенде: ${p.firstRate + p.secondRate} · ${p.togetherMinutes} = ${together} қақпақ.\n3) Екінші құрылғы жалғыз өзі: ${p.secondRate} · ${p.secondAloneMinutes} = ${alone} қақпақ.\n4) Барлығы: ${together} + ${alone} = ${total} қақпақ.`,
      ['positive constant rates', 'two disjoint time phases', 'only the second device operates in the final phase']);
  }),
  'unit-price-from-two-differences': info('synaq-standard-exhibition-markers', 4, 'ratio', 'medium', '4-math-6-4-level1.json', '24bdbb5a2629d99f', [
    'Альбом сатып алу орнына көрме дайындайтын екі топтың маркерлері туралы жаңа шарт құрылды.',
    'Барлық сома мен зат санының айырмасы өзгертілді; сатып алынған зат саны емес, бір маркердің бағасы сұралды.',
  ], p => {
    params(p, 'largerPayment smallerPayment countDifference'); assert.ok(p.largerPayment > p.smallerPayment);
    const paymentDifference = p.largerPayment - p.smallerPayment, price = natural(rational(paymentDifference, p.countDifference), 'Unit price');
    const firstCount = natural(div(value(p.largerPayment), price), 'First marker count'), secondCount = natural(div(value(p.smallerPayment), price), 'Second marker count');
    assert.equal(show(sub(firstCount, secondCount)), String(p.countDifference));
    return result(price,
      `Көрме дайындайтын екі топ бірдей бағалы маркерлер сатып алды. Бірінші топ ${fmt(p.largerPayment)} теңге, ал екінші топ ${fmt(p.smallerPayment)} теңге төледі. Бірінші топ екіншісінен ${p.countDifference} маркер артық алды. Бір маркердің бағасы неше теңге?`,
      `1) Бірінші топ ${p.largerPayment} − ${p.smallerPayment} = ${paymentDifference} теңге артық төлеген.\n2) Бұл ${p.countDifference} артық маркердің құны. Бір маркер: ${paymentDifference} : ${p.countDifference} = ${show(price)} теңге.\nТексеру: топтар ${show(firstCount)} және ${show(secondCount)} маркер алған; айырмасы ${p.countDifference}.`,
      ['identical unit price for both groups', 'both purchased counts are positive integers', 'payment and quantity differences agree']);
  }),
  'meeting-with-delayed-departure': info('synaq-standard-delayed-walkers', 6, 'ratio', 'hard', '4-math-6-6-level1.json', '123d7e820a0e0e7a', [
    'Бір уақытта шыққан жолаушылардың теңдеуін таңдау орнына біреуі кеш шығатын туристер туралы жаңа есеп берілді.',
    'Кешіккен уақытты сағатқа ауыстыру, алдын ала жүрген жолды шегеру және жауапты минутпен беру қадамдары енгізілді.',
  ], p => {
    params(p, 'distance firstSpeed secondSpeed delayMinutes');
    const advance = mul(value(p.firstSpeed), rational(p.delayMinutes, 60)), remaining = sub(value(p.distance), advance); pos(remaining, 'Gap at second departure');
    const hours = div(remaining, value(p.firstSpeed + p.secondSpeed)), minutes = mul(hours, value(60));
    return result(minutes,
      `Екі турист арасы ${p.distance} км болатын екі демалыс орнынан бір-біріне қарсы жүреді. Бірінші туристің жылдамдығы ${p.firstSpeed} км/сағ, екіншісінікі ${p.secondSpeed} км/сағ. Екінші турист біріншісінен ${p.delayMinutes} минут кеш шығады. Екеуі де тоқтамай, тұрақты жылдамдықпен жүреді. Екінші турист жолға шыққаннан кейін неше минутта кездеседі?`,
      `1) Кешігу уақыты: ${p.delayMinutes} : 60 = ${show(rational(p.delayMinutes, 60))} сағ. Осы кезде бірінші турист ${show(advance)} км жүрген.\n2) Екінші турист шыққан сәттегі арақашықтық: ${p.distance} − ${show(advance)} = ${show(remaining)} км.\n3) Жақындасу жылдамдығы: ${p.firstSpeed} + ${p.secondSpeed} = ${p.firstSpeed + p.secondSpeed} км/сағ.\n4) Кездесуге дейін ${show(remaining)} : ${p.firstSpeed + p.secondSpeed} = ${show(hours)} сағ, яғни ${show(minutes)} минут өтеді.`,
      ['first walker has not already reached the other start', 'constant speeds and opposite directions', 'meeting time is measured from second departure and is an integer number of minutes']);
  }),
  'river-round-trip-time': info('synaq-standard-river-return', 6, 'ratio', 'medium', '6-math-2-6-level1.json', '6907fa557e9a73e4', [
    'Тек ағысқа қарсы жылдамдықты табудан өзенмен барып-қайту уақыты туралы толық маршрутқа көшірілді.',
    'Қашықтық қосылды, екі бағыттың уақыты бөлек есептеледі; ағыс жылдамдығы қай бағытта қосылып, қай бағытта азайтылады деген дағды сақталды.',
  ], p => {
    params(p, 'stillSpeed currentSpeed distanceEachWay'); assert.ok(p.stillSpeed > p.currentSpeed);
    const downstream = p.stillSpeed + p.currentSpeed, upstream = p.stillSpeed - p.currentSpeed;
    const downHours = rational(p.distanceEachWay, downstream), upHours = rational(p.distanceEachWay, upstream), total = add(downHours, upHours);
    return result(total,
      `Катердің тынық судағы жылдамдығы ${p.stillSpeed} км/сағ, ал өзен ағысының жылдамдығы ${p.currentSpeed} км/сағ. Катер айлақтан ағыс бойымен ${p.distanceEachWay} км жүзіп, кейін сол жолмен бастапқы айлаққа қайтады. Екі бағытта да жылдамдықтар тұрақты, аялдау уақыты есепке алынбайды. Барлық жолға неше сағат кетеді?`,
      `1) Ағыс бойымен жылдамдық: ${p.stillSpeed} + ${p.currentSpeed} = ${downstream} км/сағ. Бару уақыты: ${p.distanceEachWay} : ${downstream} = ${show(downHours)} сағ.\n2) Ағысқа қарсы жылдамдық: ${p.stillSpeed} − ${p.currentSpeed} = ${upstream} км/сағ. Қайту уақыты: ${p.distanceEachWay} : ${upstream} = ${show(upHours)} сағ.\n3) Барлық уақыт: ${show(downHours)} + ${show(upHours)} = ${show(total)} сағ.`,
      ['still-water speed is greater than current speed', 'equal outward and return distances', 'direction-specific times are added instead of averaging speeds']);
  }),
};

export const MODEL_IDS = Object.freeze(Object.keys(MODELS));

// Used only when authoring these seventeen fixed editions. The reviewed JSON
// contains the full text; the publisher must compare that text/hash, not generate variants.
export function buildEdition(modelId, parameters) {
  const definition = MODELS[modelId]; assert.ok(definition, 'Unknown editorial model');
  const { render, ...metadata } = definition;
  const { checks, ...rendered } = render(parameters);
  return { ...metadata, modelId, params: structuredClone(parameters), ...rendered };
}

export function verifyEdition(row) {
  const definition = MODELS[row?.modelId]; assert.ok(definition, 'Unknown editorial model');
  for (const key of ['editionId', 'grade', 'topic', 'difficulty']) assert.equal(row[key], definition[key], `Unexpected editorial ${key}`);
  assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.editionId));
  assert.deepEqual(row.sourceRefs, definition.sourceRefs, 'Archival source references changed');
  assert.deepEqual(row.adaptationChanges, definition.adaptationChanges, 'Adaptation disclosure changed');
  assert.ok(typeof row.answer === 'string' && /^\d+$/.test(row.answer), 'This pilot uses canonical positive integer answers');
  assert.equal(row.options, undefined, 'This edition is an open-response question');
  const rendered = definition.render(row.params);
  assert.equal(row.statement, rendered.statement, 'Statement no longer matches the reviewed parameter model');
  assert.equal(row.solution, rendered.solution, 'Solution no longer matches the reviewed parameter model');
  return { answer: rendered.answer, checks: [...rendered.checks, 'full statement and solution bound to parameters', 'new authored scenario with immutable archival references'] };
}
