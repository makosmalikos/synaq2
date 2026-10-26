import assert from 'node:assert/strict';
const ints = p => Object.values(p).forEach(n => assert.ok(Number.isSafeInteger(n)));
const pos = (...xs) => xs.forEach(n => assert.ok(Number.isSafeInteger(n) && n > 0));
const dec = (n, places = 1) => { assert.ok(Number.isSafeInteger(n)); const d = 10 ** places; return (n < 0 ? '-' : '') + Math.floor(Math.abs(n) / d) + ',' + String(Math.abs(n) % d).padStart(places, '0'); };
const frac = (a, b) => `(${a}/${b})`;
const choose = (statement, options, answer, solution) => { options = options.map(String); answer = String(answer); assert.equal(options.length, 4); assert.equal(new Set(options).size, 4); assert.equal(options.filter(x => x === answer).length, 1); return { statement, options, answer, solution }; };
const open = (statement, answer, solution) => { assert.ok(Number.isSafeInteger(answer)); return { statement: statement + ' Жауапқа тек санды жазыңыз.', answer: String(answer), solution }; };

export function renderEdition(row) {
 const p = row.params; ints(p); const k = row.modelId.replace('grade6-numeric-inequalities-', '');
 switch (k) {
  case 'strict-product-largest-natural': {
   pos(p.factor, p.bound); assert.ok(p.bound > p.factor);
   const a = Math.ceil(p.bound / p.factor) - 1;
   return open(`${p.factor}n < ${p.bound} шарты орындалатын ең ҮЛКЕН натурал n санын табыңыз.`, a, `Көбейткіш ${p.factor} оң болғандықтан, n өскенде көбейтінді де өседі. n = ${a}: ${p.factor} × ${a} = ${p.factor * a} < ${p.bound}. Келесі n = ${a + 1}: ${p.factor} × ${a + 1} = ${p.factor * (a + 1)} ≥ ${p.bound}, сондықтан жарамайды. Ең үлкені ${a}. Қатаң < белгісі шекараға тең мәнді қоспайды.`);
  }
  case 'true-negative-decimal-comparison': {
   pos(p.den, p.leftNum, p.rightNum, p.negativeLeft, p.negativeRight, p.decimalHundredths, p.fractionDen);
   assert.ok(p.leftNum < p.rightNum && p.negativeLeft > p.negativeRight && p.leftTenths < p.rightTenths && p.rightTenths < 0 && p.decimalHundredths * p.fractionDen < 100);
   const a = `${dec(p.leftTenths)} < ${dec(p.rightTenths)}`;
   return choose('Төмендегі салыстырулардың қайсысы ТУРА санды теңсіздік?', [`${frac(p.leftNum,p.den)} > ${frac(p.rightNum,p.den)}`, `-${p.negativeLeft} > -${p.negativeRight}`, a, `${dec(p.decimalHundredths,2)} > ${frac(1,p.fractionDen)}`], a, `Теріс сандарда модулі үлкені кіші: ${dec(p.leftTenths)} < ${dec(p.rightTenths)}. Олардың айырмасы ${dec(p.leftTenths - p.rightTenths)} < 0. Бірінші нұсқада бөлімдері бірдей, ал ${p.leftNum} < ${p.rightNum}, сондықтан > қате. Екіншісінде -${p.negativeLeft} < -${p.negativeRight}. Соңғысында ${frac(p.decimalHundredths,100)} пен ${frac(1,p.fractionDen)} салыстырамыз: ${p.decimalHundredths} × ${p.fractionDen} = ${p.decimalHundredths * p.fractionDen} < 100, демек берілген > белгісі қате.`);
  }
  case 'difference-recovers-minuend': {
   pos(p.difference); assert.ok(p.subtrahend < 0 && p.difference > -p.subtrahend);
   const a = p.difference + p.subtrahend;
   return open(`a - b = ${p.difference}, ал b = ${p.subtrahend}. a санының мәнін табыңыз.`, a, `a - b = ${p.difference} теңдігінің екі жағына да b қосамыз: a = ${p.difference} + b. Сондықтан a = ${p.difference} + (${p.subtrahend}) = ${a}. Тексеру: ${a} - (${p.subtrahend}) = ${p.difference}. Айырма оң, сондықтан a > b: ${a} > ${p.subtrahend}. a = b - ${p.difference} деп алу азайғыштың рөлін өзгертеді.`);
  }
  case 'numeric-inequality-writing-classification': {
   pos(p.factor, p.multiplier, p.bound); assert.ok(p.factor * p.multiplier > p.bound);
   const product = p.factor * p.multiplier, a = `${p.factor} × ${p.multiplier} > ${p.bound}`;
   return choose('Қай жазуда екі САНДЫ өрнек теңсіздік белгісімен салыстырылған?', [a, `${p.factor} × ${p.multiplier} = ${product}`, `x > ${p.bound}`, `${p.factor} × ${p.multiplier} + ${p.bound}`], a, `Санды теңсіздіктің екі жағында санды өрнектер және олардың арасында салыстыру белгісі болады. ${a} — санды теңсіздік; ${product} > ${p.bound} болғандықтан, ол тура да болады. = белгісі бар нұсқа — санды теңдік. x қатысқан нұсқа — айнымалысы бар теңсіздік. Соңғы жазу — салыстыру белгісі жоқ санды өрнек.`);
  }
  case 'strict-decimal-smallest-natural': {
   pos(p.boundTenths); assert.ok(p.boundTenths % 10);
   const lower = Math.floor(p.boundTenths / 10), a = lower + 1;
   return open(`x > ${dec(p.boundTenths)} теңсіздігін қанағаттандыратын ең КІШІ натурал x санын табыңыз.`, a, `${lower} < ${dec(p.boundTenths)}, сондықтан ${lower} және одан кіші натурал сандар жарамайды. Келесі ${a} саны ${dec(p.boundTenths)} санынан үлкен. Ең кіші жарамды натурал сан ${a}. Бөлшектің бүтін бөлігін ғана алу шекарадан асырмайды.`);
  }
  case 'negative-difference-orders-two-unknowns': {
   assert.ok(p.differenceTenths < 0 && p.differenceTenths % 10);
   return choose(`Екі сан үшін a - b = ${dec(p.differenceTenths)}. Қай қорытынды міндетті түрде дұрыс?`, ['a > b', 'a = b', 'a мен b-ны салыстыруға болмайды', 'a < b'], 'a < b', `Айырма теріс: a - b < 0. Екі жағына b қосқанда a < b шығады. Нақты a мен b белгісіз болса да, айырмасының таңбасы оларды салыстыруға жеткілікті. Мысалы, a = 0, b = ${dec(-p.differenceTenths)}: 0 - ${dec(-p.differenceTenths)} = ${dec(p.differenceTenths)}.`);
  }
  case 'six-truth-values-including-equality': {
   pos(p.leftNumerator,p.rightNumerator,p.denominator,p.epsilonHundredths,p.leftPowerBase,p.leftPower,p.rightPowerBase,p.rightPower,p.equalHundredths,p.equalNumerator,p.equalDenominator,p.leftNegativeNumerator,p.leftNegativeDenominator,p.rightNegativeNumerator,p.rightNegativeDenominator);
   assert.ok(p.leftNumerator > p.rightNumerator && p.negativeTenths < p.negativeWhole * 10 && p.equalHundredths * p.equalDenominator === p.equalNumerator * 100 && p.leftPowerBase ** p.leftPower < p.rightPowerBase ** p.rightPower && p.leftNegativeNumerator * p.rightNegativeDenominator > p.rightNegativeNumerator * p.leftNegativeDenominator);
   const list = [`${frac(p.leftNumerator,p.denominator)} > ${frac(p.rightNumerator,p.denominator)}`,`${dec(p.negativeTenths)} > ${p.negativeWhole}`,`0 > -${dec(p.epsilonHundredths,2)}`,`${p.leftPowerBase}² < ${p.rightPowerBase}⁴`,`${dec(p.equalHundredths,2)} < ${frac(p.equalNumerator,p.equalDenominator)}`,`-${frac(p.leftNegativeNumerator,p.leftNegativeDenominator)} < -${frac(p.rightNegativeNumerator,p.rightNegativeDenominator)}`];
   assert.equal(p.leftPower,2);assert.equal(p.rightPower,4);
   return open(`Берілген алты салыстырудың НЕШЕУІ тура?\n${list.join(';  ')}.`, 4, `1) Бөлімдер бірдей: ${p.leftNumerator} > ${p.rightNumerator}, тура. 2) ${dec(p.negativeTenths)} < ${p.negativeWhole}, сондықтан берілген > жалған. 3) Нөл кез келген теріс саннан үлкен, тура. 4) Дәрежелер ${p.leftPowerBase ** p.leftPower} және ${p.rightPowerBase ** p.rightPower}, < тура. 5) ${dec(p.equalHundredths,2)} = ${frac(p.equalNumerator,p.equalDenominator)}; сандар тең болса, қатаң < жалған. 6) Модульдер үшін ${p.leftNegativeNumerator} × ${p.rightNegativeDenominator} = ${p.leftNegativeNumerator * p.rightNegativeDenominator} > ${p.rightNegativeNumerator} × ${p.leftNegativeDenominator} = ${p.rightNegativeNumerator * p.leftNegativeDenominator}; теріс таңбалар салыстыру бағытын кері етеді, сондықтан соңғы < тура. Туралары 1, 3, 4, 6 — барлығы 4.`);
  }
  case 'count-sign-types-not-truth-values': {
   pos(p.a,p.b,p.c,p.upper,p.numerator,p.denominator); assert.ok(p.a < p.b && p.negativeLeft > p.negativeRight && p.negativeLeft < 0 && p.numerator < p.denominator && p.equalNegative < 0);
   return open(`Тура не жалған болуын емес, БЕЛГІСІН ескеріңіз. Қатаң ЕМЕС теңсіздіктер нешеу?\n${p.a} < ${p.b};  ${p.c} ≥ ${p.c};  ${p.negativeLeft} > ${p.negativeRight};  0 ≤ ${p.upper};  ${frac(p.numerator,p.denominator)} < 1;  ${p.equalNegative} ≤ ${p.equalNegative}.`, 3, `Қатаң емес белгілер ≥ немесе ≤: ${p.c} ≥ ${p.c}, 0 ≤ ${p.upper}, ${p.equalNegative} ≤ ${p.equalNegative}. Саны 3. < және > белгілері — қатаң. Мұнда теңсіздіктің тура болуы емес, белгісінің түрі сұралады; теңдік жағдайын қамтитын ≥ мен ≤ де теңсіздік белгілері.`);
  }
  case 'double-inequality-open-left-closed-right': {
   assert.ok(p.lower < 0 && p.upper > 0);
   const a = `y саны ${p.lower}-тен үлкен, бірақ ${p.upper}-ден артық емес`;
   return choose(`${p.lower} < y ≤ ${p.upper} қос теңсіздігіне дәл сәйкес сөйлемді таңдаңыз.`, [a,`y саны ${p.lower}-тен кем емес, бірақ ${p.upper}-ден кіші`,`y саны ${p.lower}-тен кіші, бірақ ${p.upper}-ден үлкен`,`y саны ${p.lower}-тен үлкен және ${p.upper}-ден кіші`], a, `Сол жақтағы < қатаң: y > ${p.lower}, төменгі шекара кірмейді. Оң жақтағы ≤ теңдікке рұқсат етеді: y ≤ ${p.upper}, жоғарғы шекара кіреді. Мысалы, y = ${p.upper} жарайды, y = ${p.lower} жарамайды. Сондықтан «үлкен, бірақ артық емес» дәл сәйкес. Екі шетте де қатаң белгі алу жоғарғы шекараны жоғалтады.`);
  }
  case 'not-more-than-includes-boundary': {
   pos(p.limit); const a = `x ≤ ${p.limit}`;
   return choose(`Сәлемдеменің массасы x кг. Ол ${p.limit} кг-нан АРТЫҚ ЕМЕС болуы тиіс. Осы жоғарғы шектеуді қалай жазамыз?`, [`x < ${p.limit}`,`x ≥ ${p.limit}`,a,`x > ${p.limit}`], a, `«Артық емес» — кіші немесе тең: ${a}. Дәл ${p.limit} кг да рұқсат етіледі; x < ${p.limit} оны қате алып тастайды. x ≥ ${p.limit} — кем емес, x > ${p.limit} — артық деген басқа шектеулер.`);
  }
  case 'positive-minus-negative-tenths': {
   assert.ok(p.leftTenths > 0 && p.rightTenths < 0 && p.leftTenths % 10 && p.rightTenths % 10 && (p.leftTenths - p.rightTenths) % 10 === 0);
   const a = (p.leftTenths - p.rightTenths) / 10;
   return open(`a = ${dec(p.leftTenths)} және b = ${dec(p.rightTenths)}. a - b айырмасын табыңыз.`, a, `Теріс санды азайту — оның қарама-қарсысын қосу: a - b = ${dec(p.leftTenths)} - (${dec(p.rightTenths)}) = ${dec(p.leftTenths)} + ${dec(-p.rightTenths)} = ${a}. Айырма оң, демек a > b. Азайтқыштың теріс таңбасын ескермей ${dec(p.leftTenths)} - ${dec(-p.rightTenths)} деп алу басқа амал болар еді.`);
  }
  case 'same-direction-pair-not-signs-of-values': {
   assert.ok(p.a>p.b&&p.c<p.d&&p.e<p.f&&p.g>p.h&&p.j<p.k&&p.l>p.m&&p.n>p.o&&p.n<0);
   const a = `${p.a} > ${p.b} және ${p.n} > ${p.o}`;
   return choose('Қай жұптағы екі теңсіздіктің салыстыру БАҒЫТЫ бірдей?', [`${p.a} > ${p.b} және ${p.c} < ${p.d}`,`${p.e} < ${p.f} және ${p.g} > ${p.h}`,`${p.j} < ${p.k} және ${p.l} > ${p.m}`,a], a, `Соңғы жұпта екі белгі де >: ${a}. Қалған жұптарда бір белгі >, екіншісі <. Сандардың оң не теріс таңбасы салыстыру белгісінің бағытын анықтамайды. Мысалы, ${p.n} > ${p.o} тура болса да, екі санның өзі теріс.`);
  }
  default: throw Error('Unknown individually read numeric inequality ' + k);
 }
}
export function verifyEdition(row) {
 const out = renderEdition(row);
 for (const k of ['statement','answer','options','solution']) assert.deepEqual(row[k],out[k],`Changed ${k}`);
 return {answer:out.answer,checks:['All12saved nonvisual5.1 fullconditions/officialsolutions/everyMCQ individually read','Strict endpoints, actualnegative/decimal/fraction comparisons, signs versus truth and writingclassification retained','Unknown minuend, full mixed comparison truthvector, double boundary openness and total difference checked','Closed Standard draft pending independent fullcontent hash review; numeric/contextvariants not additional distinct meanings']};
}
