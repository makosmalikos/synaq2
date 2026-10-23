const algebraTitle = /теңдеу|айнымалы|әріпті|ықшамдау|жақша|коэффициент|ұқсас\s+қосылғыш|теңбе[-‐‑–]тең/i;

function dependencyTableTopic(text, request) {
  if (/формула/i.test(text)) return 'eq';
  if (/кесте(?:нің)?\s+қадам/i.test(text)) return 'seq';
  // Reading an existing price column differs from deriving a new unit price.
  // Accept both captured TeX tables and their published Markdown presentation.
  const priceQuestion = request.replaceAll('$', '').match(/^(бір|\d+)\s+\p{L}+\s+(?:неше|қанша)\s+теңге/iu);
  if (priceQuestion && /құнының/i.test(text) && /санына/i.test(text)) {
    const row = text.match(/^\|\s*n\s*\|([^\n]+)/im)?.[1] || text.match(/\bn\s*&([^\\\n]+)/)?.[1];
    if (row) {
      const columns = row.split(/[|&]/).map(value => value.trim()).filter(Boolean);
      if (columns.length && columns.every(value => /^\d+$/.test(value))) {
        const count = /^бір$/i.test(priceQuestion[1]) ? 1 : Number(priceQuestion[1]);
        return columns.some(value => Number(value) === count) ? 'stats' : 'ratio';
      }
    }
  }
  if (/ең\s+(?:жоғары|төмен)|қай\s+(?:шаманы|тұжырым)/i.test(request)) return 'stats';
  return null;
}

// Classify the requested skill, retaining the original course title as provenance.
export function courseTaskTopic(title, statement = '') {
  const text = statement.normalize('NFKC');
  const request = text.split(/\n+/).map(s => s.trim()).filter(Boolean).at(-1) || '';
  if (/теңдеулер(?:дің)?\s+жүйе|теңсіздік(?:ті|терді)\s+шеш/i.test(text)) return 'sys';
  if (/теңдеу(?:ді|лерді)\s+(?:шеш|тап|табы|таңда|құр)|теңдеу(?:дің|інің)\s+(?:(?:натурал|барлық|неше)\s+)?(?:түбір|шешім)/i.test(text)) return 'eq';
  if (/сандар(?:дың)?\s+тізбег|тізбектің.*мүш|келесі(?:\s+(?:екі|үш|төрт))?\s+мүш|заңдылықты\s+(?:тап|табы|анықта)/i.test(text)) return 'seq';
  // Cardinality of a known union and the symbols of a numeral system are not
  // counts of ways to construct or choose something. Keep subset choices in comb.
  if (/жиын/i.test(title) && /барлығы\s+неше\s+(?:түрлі|әртүрлі|әр\s+түрлі)\s+(?:элемент|кітап)\s+бар/i.test(request)) return 'sets';
  if (/санау\s+жүйес/i.test(text) && /цифр\s+жеткілікті/i.test(request)) return 'num';
  if (/неше\s+(?:түрлі|әртүрлі|әр\s+түрлі|реттелген\s+жұп|тәсіл)|қанша\s+тәсіл/i.test(request)) return 'comb';
  if (/орташа\s+арифметикалық|медианасын|модасын|өзгеріс\s+ауқымын/i.test(request)) return 'stats';
  // Rounding shares a stem with дөңгелек (circle); classify the rounding lesson
  // before geometric keywords in its title or its conditions can match that stem.
  if (/дөңгелектеу/i.test(title)) return /бөлшек/i.test(title) ? 'frac' : 'num';
  const geometricMeasure = /(?:периметр(?:і|ін|ді)|аудан(?:ы|ын|ды))\s+(?:неше|қанша|таб|есепте|анықта)|аудандарын\s+салыстыр|неше\s+градус/i;
  const shape = /тік\s*төртбұрыш|үшбұрыш|фигура|квадрат|текше|параллелепипед|шеңбер|дөңгелек|цилиндр|конус|пирамида|қорап/i;
  const dimension = /қабырғасының\s+ұзынды(?:ғы\s+неше|ғын)|(?:^|[^\p{L}\p{N}_])ен(?:і\s+неше|ін\s+таб)|ұзындығын\s+таб/iu;
  if (geometricMeasure.test(request) || shape.test(text) && (dimension.test(request) || /көлем(?:і|ін|ді)\s+(?:неше|қанша|таб|есепте|анықта)/i.test(request))) return 'geo';
  if (!/пайыз|процент|%/i.test(request) && !algebraTitle.test(title)) {
    if (/қосыл/i.test(text) && /жұмыс\s+басталғаннан\s+(?:неше|қанша)\s+(?:сағат|минут|күн|секунд)/i.test(request)) return 'work';
    if (/өнімділі[кг][^.!?\n]*қатынас(?:ы\s+(?:қандай|неше)|ын\s+(?:тап|таб|анықта|есепте))/i.test(request)) return 'ratio';
    const share = request.match(/(?:бірінші|екінші)\s+(?:бригада|жұмысшы|шебер)\s+(?:неше|қанша)\s+(\p{L}+)/iu);
    if (/тура\s+пропорционал/i.test(title) && /өнімділі(?:гі|ктері)\s+бірдей/i.test(text) && share && !/^(?:сағат|минут|күн|секунд)/i.test(share[1])) return 'ratio';
    if (/өнімділі[кг]/i.test(request)) return 'work';
    if (/жылдамды[қғ]/i.test(request)) return 'ratio';
  }
  if (/тәуелділі[кг]/i.test(title) && /кесте/i.test(title)) {
    const tableTopic = dependencyTableTopic(text, request);
    if (tableTopic) return tableTopic;
  }
  if (/координаталық (?:сәуле|түзу)/i.test(title) && !/бөлшек|аралас сан/i.test(title)) return 'num';
  const rules = [
    ['seq', /тізбе[кг]|заңдылық/i],
    ['pct', /процент|пайыз/i],
    ['sets', /жиын/i],
    ['ratio', /қатынас|пропорци|қозғалыс|жылдамдық|масштаб/i],
    ['stats', /орташа|арифметикалық орта|медиана|мода|статистик|диаграмм|өзгеріс ауқым/i],
    ['work', /өнімділі[кг]|жұмыс/i],
    ['sys', /теңсіздік|теңдеулер(?:\s+және\s+олардың)?\s+жүйе|сан\s+аралық/i],
    ['eq', algebraTitle],
    ['frac', /бөлшек|аралас сан|өзара\s+кері\s+сандар|санның\s+бөлігін\s+табу|бөлігі\s+бойынша\s+санды\s+табу/i],
    ['geo', /аудан|геометр|фигура|симметри|көлем|текше|параллелеп|параллель|перпендикуляр|периметр|бұрыш|координат|шеңбер|дөңгелек|жазықтық|түзулер|вектор/i],
    ['comb', /ықтимал|комбинатор/i],
  ];
  return rules.find(([, re]) => re.test(title))?.[0] || 'num';
}
