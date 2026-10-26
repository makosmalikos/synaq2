import assert from 'node:assert/strict';

// Authored grade-4 curriculum models. A successful calculation is not an
// independent editorial review; the accompanying batch remains a draft.
const n = x => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const exact = (a,b) => { assert(b>0 && a%b===0, 'A whole-number quotient is required'); return a/b; };
const result = (answer, statement, solution, checks=[]) => ({answer:String(answer),statement,solution,checks});
const positive = x => assert(Number.isSafeInteger(x)&&x>0, 'Positive safe integer required');
const permute = values => values.length ? values.flatMap((v,i)=>permute(values.filter((_,j)=>i!==j)).map(t=>[v,...t])) : [[]];

const models = {
  'grade4-joined-ribbons': p => {
    const a=p.firstM*100+p.firstCm,b=p.secondM*100+p.secondCm;
    assert(p.firstCm<100&&p.secondCm<100);
    return result(a+b,`Сахнаны безендіруге ұзындығы ${p.firstM} м ${p.firstCm} см және ${p.secondM} м ${p.secondCm} см екі таспа алынды. Таспалар ұштарынан жалғанды, ұзындықтары қысқарған жоқ. Жалпы ұзындықты сантиметрмен жазыңдар.`,`${p.firstM} м ${p.firstCm} см = ${a} см, ал ${p.secondM} м ${p.secondCm} см = ${b} см. Жалпы ұзындық: ${a} + ${b} = ${a+b} см.`,['metres converted to centimetres before addition']);
  },
  'grade4-quarter-hour-finish': p => {
    assert(p.hour>=10&&p.hour<23&&p.afterMinutes<45);
    const mins=15+p.afterMinutes,answer=`${p.hour}:${String(mins).padStart(2,'0')}`;
    return result(answer,`24 сағаттық уақыт есебімен сағат ${p.hour}-тен ширек өткенде робототехника үйірмесінің таныстырылымы басталды. Ол ${p.afterMinutes} минутқа созылды. Таныстырылым нешеде аяқталды? Жауапты сағат:минут түрінде жазыңдар.`,`Ширек сағат — 60 : 4 = 15 минут. Басталуы — ${p.hour}:15. ${p.afterMinutes} минуттан кейін ${p.hour}:${String(mins).padStart(2,'0')} болады.`,['quarter hour is 15 minutes','no day or hour ambiguity']);
  },
  'grade4-banknote-change': p => {
    const answer=exact(p.total-p.large,p.small);
    assert(p.total>p.large);
    return result(answer,`Кассир ${n(p.total)} теңгені ұсақтады: бір ${n(p.large)} теңгелік банкнот беріп, қалған соманы тек ${n(p.small)} теңгелік банкноттармен қайтарды. Неше ${n(p.small)} теңгелік банкнот берілді?`,`Алдымен қалған соманы табамыз: ${n(p.total)} − ${n(p.large)} = ${n(p.total-p.large)} теңге. Банкнот саны: ${n(p.total-p.large)} : ${n(p.small)} = ${answer}.`,['banknotes sum back to the original total']);
  },
  'grade4-euro-cent-change': p => {
    const a=p.firstEuro*100+p.firstCent,b=p.secondEuro*100+p.secondCent,paid=p.paidEuro*100;
    assert(p.firstCent<100&&p.secondCent<100&&paid>a+b);
    return result(paid-a-b,`Оқу ойынында 1 еуро 100 центке тең. Бір ашықхат ${p.firstEuro} еуро ${p.firstCent} цент, екіншісі ${p.secondEuro} еуро ${p.secondCent} цент тұрады. Екі ашықхат үшін ${p.paidEuro} еуро берілді. Қайтарылатын ақша неше цент?`,`Бағаларды центке ауыстырамыз: ${a} және ${b}. Екі ашықхат: ${a} + ${b} = ${a+b} цент. Төленгені ${paid} цент, сондықтан қайтарым ${paid} − ${a+b} = ${paid-a-b} цент.`,['currency conversion is an explicit fictional-game given']);
  },
  'grade4-place-value-assembly': p => {
    assert(p.thousands<100&&p.hundreds<10&&p.ones<10);
    const a=p.thousands*1000+p.hundreds*100+p.ones;
    return result(a,`Құпия сан ${p.thousands} мыңнан, ${p.hundreds} жүздіктен және ${p.ones} бірліктен құралған. Оның ондықтар разрядында 0 тұр. Құпия санды цифрлармен жазыңдар.`,`${p.thousands} мың = ${n(p.thousands*1000)}, ${p.hundreds} жүздік = ${p.hundreds*100}. Қосамыз: ${n(p.thousands*1000)} + ${p.hundreds*100} + ${p.ones} = ${n(a)}.`,['empty tens place retained']);
  },
  'grade4-digit-contribution': p => {
    const text=String(p.number),positions=[...text].flatMap((v,i)=>Number(v)===p.digit?[text.length-i-1]:[]);
    assert.equal(positions.length,1,'The requested digit must occur once');
    const a=p.digit*10**positions[0];
    return result(a,`${n(p.number)} санындағы ${p.digit} цифрының разрядтық мәнін санмен жазыңдар.`,`Оң жақтан санағанда ${p.digit} цифры ${positions[0]+1}-орында тұр. Оның разрядтық мәні: ${p.digit} · ${n(10**positions[0])} = ${n(a)}.`,['unique occurrence of the target digit']);
  },
  'grade4-checkpoint-sequence': p => {
    assert(p.position>=4);
    const a=p.start+(p.position-1)*p.step;
    return result(a,`Бақылау нүктелерінің кодтары әр жолы бірдей санға артады: ${n(p.start)}, ${n(p.start+p.step)}, ${n(p.start+2*p.step)}, … . Осы рет сақталса, ${p.position}-нүктенің коды қандай?`,`Кодтардың айырмасы: ${n(p.start+p.step)} − ${n(p.start)} = ${n(p.step)}. Бірінші нүктеден ${p.position}-нүктеге дейін ${p.position-1} қадам бар. Код: ${n(p.start)} + ${p.position-1} · ${n(p.step)} = ${n(a)}.`,['index is one-based and the equal increment is explicit']);
  },
  'grade4-extreme-codes-zero': p => {
    assert.equal(new Set(p.digits).size,p.digits.length);
    assert(p.digits.includes(0)&&p.digits.length===4&&p.digits.every(v=>v>=0&&v<=9));
    const values=permute(p.digits).filter(t=>t[0]!==0).map(t=>Number(t.join(''))),lo=Math.min(...values),hi=Math.max(...values);
    return result(hi-lo,`${p.digits.join(', ')} цифрларының әрқайсысын бір рет қолданып, ең үлкен және ең кіші төрттаңбалы код құрыңдар. Код 0-ден басталмайды. Үлкен кодтан кіші кодты азайтқанда қандай сан шығады?`,`Ең үлкен код — ${n(hi)}. Ең кіші кодтың басына ең кіші нөлден өзге цифр, содан кейін қалған цифрлар өсу ретімен жазылады: ${n(lo)}. Айырмасы: ${n(hi)} − ${n(lo)} = ${n(hi-lo)}.`,['all 24 digit permutations enumerated; leading zero rejected']);
  },
  'grade4-mixed-freight-mass': p => {
    assert(p.centners<10);
    const a=p.tonnes*1000+p.centners*100;
    return result(a,`Жүк көлігі ${p.tonnes} т ${p.centners} ц құрылыс қоспасын жеткізді. Жүктің массасын килограммен жазыңдар.`,`1 т = 1000 кг, 1 ц = 100 кг. Сондықтан ${p.tonnes} · 1000 + ${p.centners} · 100 = ${n(a)} кг.`,['both tonne and centner scale factors applied']);
  },
  'grade4-cube-wire-frame': p => result(12*p.edge,`Ұзындығы ${p.edge} см болатын сым кесінділерінен текшенің қаңқасы жасалады. Әр қырына бір кесінді кетеді. Сымды жалғауға қосымша ұзындық қажет емес. Барлығы неше сантиметр сым керек?`,`Текшенің жоғарғы жағында 4 қыр, төменгі жағында 4 қыр және оларды қосатын 4 қыр бар: барлығы 12 қыр. Сым ұзындығы: 12 · ${p.edge} = ${12*p.edge} см.`,['cube edges counted as 4 + 4 + 4']),
  'grade4-park-area-remainder': p => {
    const whole=p.squareKm*1000*1000;assert(whole>p.reservedM2);
    return result(whole-p.reservedM2,`Табиғат бағының ауданы ${p.squareKm} км². Оның ${n(p.reservedM2)} м² аумағы зерттеу алаңына бөлінді. Қалған аумақ неше шаршы метр?`,`1 км² = 1000 · 1000 = 1 000 000 м². Бақтың ауданы ${n(whole)} м². Қалғаны: ${n(whole)} − ${n(p.reservedM2)} = ${n(whole-p.reservedM2)} м².`,['area conversion squares the length conversion']);
  },
  'grade4-sum-of-squares': p => {
    const a=p.small*p.small,b=p.large*p.large;
    return result(a+b,`Тақтадағы ${p.small}² + ${p.large}² өрнегінің мәнін есептеңдер.`,`${p.small}² = ${p.small} · ${p.small} = ${a}, ${p.large}² = ${p.large} · ${p.large} = ${b}. Қосындысы: ${a} + ${b} = ${a+b}.`,['exponents evaluated before addition']);
  },
  'grade4-product-comparison-gap': p => {
    const product=p.factor*p.times;assert(product>p.reference);
    return result(product-p.reference,`${n(p.factor)} · ${p.times} көбейтіндісі ${n(p.reference)} санынан қаншаға артық?`,`Көбейтінді: ${n(p.factor)} · ${p.times} = ${n(product)}. Айырма: ${n(product)} − ${n(p.reference)} = ${product-p.reference}.`,['comparison requests an additive gap, not a ratio']);
  },
  'grade4-zero-quotient-packages': p => {
    const a=exact(p.items,p.groups);assert(String(a).includes('0'));
    return result(a,`Қоймадағы ${n(p.items)} бекіткіш ${p.groups} шеберханаға тең бөлінді. Әр шеберхана неше бекіткіш алды?`,`${n(p.items)} : ${p.groups} = ${n(a)}. Бөліндідегі нөлдерді түсірмейміз. Тексеру: ${n(a)} · ${p.groups} = ${n(p.items)}.`,['whole equal groups and zero places retained']);
  },
  'grade4-divisible-code-extremum': p => {
    assert.equal(new Set(p.digits).size,p.digits.length);assert(p.digits.includes(0)&&p.digits.length===4);
    const candidates=permute(p.digits).filter(t=>t[0]!==0).map(t=>Number(t.join(''))).filter(v=>v%2===0&&v%5===0),a=Math.max(...candidates);
    return result(a,`${p.digits.join(', ')} цифрларын әрқайсысын бір рет қолданыңдар. Солардан құралатын, 2-ге де, 5-ке де бөлінетін ең үлкен төрттаңбалы санды табыңдар.`,`2-ге де, 5-ке де бөлінетін сан 0-мен аяқталады. Қалған цифрларды кему ретімен орналастырамыз: ${a}. Барлық цифр бір рет қолданылды.`,['all distinct four-digit candidates tested for both divisibilities']);
  },
  'grade4-thousand-sheet-order': p => {
    const total=p.bundles*1000;assert(total>p.used);
    return result(total-p.used,`Баспахана әрқайсысында 1000 парақ бар ${p.bundles} бума қағаз алды. Соның ${p.used} парағы жұмсалды. Неше парақ қалды?`,`Барлық қағаз: ${p.bundles} · 1000 = ${n(total)} парақ. Қалғаны: ${n(total)} − ${p.used} = ${n(total-p.used)} парақ.`,['multiplication by a power of ten precedes stock subtraction']);
  },
  'grade4-complete-hundreds-reconstruction': p => {
    assert(p.remainder<100);
    const a=p.full*100+p.remainder;
    return result(a,`Ашықхаттарды 100-ден буғанда ${p.full} толық бума жиналып, ${p.remainder} ашықхат артылды. Бастапқыда неше ашықхат болған?`,`Толық бумаларда ${p.full} · 100 = ${n(p.full*100)} ашықхат бар. Қалдықты қосамыз: ${n(p.full*100)} + ${p.remainder} = ${n(a)}.`,['Euclidean remainder is less than the bundle size']);
  },
  'grade4-multiple-ticket-count': p => {
    assert(p.lower<=p.upper);
    const values=[];for(let v=p.lower;v<=p.upper;v++)if(v%p.multiple===0)values.push(v);
    return result(values.length,`Ойын билеттері ${p.lower}-тен ${p.upper}-ке дейін, екі шеткі нөмірді де қоса нөмірленген. Нөмірі ${p.multiple}-ға еселік билеттерге белгі қойылады. Неше билет белгіленеді?`,`Шартқа сай нөмірлер: ${values.join(', ')}. Олардың саны — ${values.length}. Екі шеткі нөмір де тексерілді.`,['inclusive integer interval exhaustively enumerated']);
  },
  'grade4-ski-trip-with-rest': p => {
    const h=exact(p.distance,p.speed),a=h*60+p.rest;
    return result(a,`Шаңғышы ${p.speed} км/сағ тұрақты жылдамдықпен ${p.distance} км жол жүрді. Жолда ол қозғалыс уақытынан бөлек ${p.rest} минут демалды. Жолға шығудан мәреге жетуге дейін барлығы неше минут өтті?`,`Қозғалыс уақыты: ${p.distance} : ${p.speed} = ${h} сағ, яғни ${h*60} минут. Демалысты қосамыз: ${h*60} + ${p.rest} = ${a} минут.`,['moving time and stopped time are explicitly separate']);
  },
  'grade4-three-speed-gap': p => {
    const first=exact(p.kmHour*1000,60),second=p.metresSecond*60,fastest=Math.max(first,second,p.metresMinute);
    assert(fastest>second&&[first,second,p.metresMinute].filter(v=>v===fastest).length===1);
    return result(fastest-second,`Сынақта бірінші құрылғы ${p.kmHour} км/сағ, екіншісі ${p.metresSecond} м/с, үшіншісі ${p.metresMinute} м/мин жылдамдықпен қозғалды. Ең жылдам құрылғының жылдамдығы екінші құрылғының жылдамдығынан неше м/мин артық?`,`Бірінші жылдамдық: ${p.kmHour*1000} : 60 = ${first} м/мин. Екінші: ${p.metresSecond} · 60 = ${second} м/мин. Үшінші: ${p.metresMinute} м/мин. Ең үлкені ${fastest} м/мин, айырмасы ${fastest} − ${second} = ${fastest-second} м/мин.`,['all three units converted before comparison','unique fastest speed']);
  },
  'grade4-union-of-word-letters': p => {
    assert(p.first===p.first.toUpperCase()&&p.second===p.second.toUpperCase());
    const letters=[...new Set([...p.first,...p.second])];
    return result(letters.length,`Бірінші жиын «${p.first}» сөзіндегі әріптерден, екіншісі «${p.second}» сөзіндегі әріптерден құралған. Екі жиынның бірігуінде неше әріп болады? Қайталанатын әріп бір рет қана есептеледі.`,`Екі сөзден кездесетін әртүрлі әріптер: ${letters.join(', ')}. Қайталанған әріптерді қайта санамаймыз. Бірігуде ${letters.length} элемент бар.`,['Unicode letter sets deduplicated']);
  },
  'grade4-cubic-container-volume': p => {
    const a=p.edge**3;
    return result(a,`Қыры ${p.edge} дм болатын текше пішінді жәшіктің ішкі көлемін табыңдар. Берілген өлшем — ішкі қырының ұзындығы. Жауапты дм³-пен жазыңдар.`,`Текшенің ұзындығы, ені және биіктігі бірдей. Көлемі: ${p.edge} · ${p.edge} · ${p.edge} = ${a} дм³.`,['all three orthogonal dimensions equal the given inner edge']);
  },
  'grade4-free-floor-area': p => {
    assert(p.carpetLength<=p.length&&p.carpetWidth<=p.width);
    const whole=p.length*p.width,covered=p.carpetLength*p.carpetWidth;
    return result(whole-covered,`Ұзындығы ${p.length} м, ені ${p.width} м тік төртбұрышты бөлменің еденіне ұзындығы ${p.carpetLength} м, ені ${p.carpetWidth} м кілем төселді. Кілем еденнің ішіне толық сыйды. Кілем жабылмаған еденнің ауданы неше м²?`,`Бөлме ауданы ${p.length} · ${p.width} = ${whole} м². Кілем ауданы ${p.carpetLength} · ${p.carpetWidth} = ${covered} м². Ашық қалған аудан: ${whole} − ${covered} = ${whole-covered} м².`,['contained carpet area subtracted without overlap ambiguity']);
  },
  'grade4-adjacent-square-posters': p => {
    const a=p.count*p.side*p.side;
    return result(a,`Қабырғасы ${p.side} дм болатын ${p.count} бірдей шаршы плакат бір қатарға қатарластырылды. Плакаттар бірінің үстін бірі жаппайды. Олардың жалпы ауданы неше дм²?`,`Бір плакаттың ауданы: ${p.side} · ${p.side} = ${p.side*p.side} дм². ${p.count} плакаттың жалпы ауданы: ${p.side*p.side} · ${p.count} = ${a} дм².`,['areas add because there is no overlap']);
  },
  'grade4-three-level-packing': p => {
    const first=p.trays*p.boxes,a=first*p.items;
    const answer=`(${p.trays} · ${p.boxes}) · ${p.items}`;
    const options=[answer,`(${p.trays} + ${p.boxes}) · ${p.items}`,`${p.trays} · ${p.boxes} + ${p.items}`,`${p.trays} · (${p.boxes} + ${p.items})`];
    const values=[a,(p.trays+p.boxes)*p.items,p.trays*p.boxes+p.items,p.trays*(p.boxes+p.items)];
    assert.equal(values.filter(v=>v===a).length,1,'Only the associative regrouping may equal the original product');
    return {...result(answer,`Көрмеге ${p.trays} сөре дайындалды. Әр сөреге ${p.boxes} қорап, әр қорапқа ${p.items} белгі салынды. Барлық белгі саны ${p.trays} · (${p.boxes} · ${p.items}) өрнегімен жазылады. Жақшаны басқаша қойып, көбейтіндінің мәнін өзгертпейтін жазуды таңдаңдар.`,`Көбейтудің терімділік қасиеті бойынша ${p.trays} · (${p.boxes} · ${p.items}) = (${p.trays} · ${p.boxes}) · ${p.items}. Екі жазудың да мәні ${n(a)}. Қалған нұсқалардың мәндері ${values.slice(1).map(n).join(', ')}; бұлар ${n(a)} санына тең емес.`,['associative regrouping preserves all factors and operations','exactly one offered expression equals the original product']),options};
  },
  'grade4-triple-digit-unknown-factor': p => {
    const a=exact(p.total,p.each);assert(p.each>=100&&p.each<=999);
    return result(a,`Бірдей қораптардың әрқайсысына ${p.each} суретті карточка салынды. Барлық қорапта ${n(p.total)} карточка бар. Қорап санын табыңдар.`,`${p.each} · x = ${n(p.total)}. Сондықтан x = ${n(p.total)} : ${p.each} = ${a}. Тексеру: ${a} · ${p.each} = ${n(p.total)}.`,['unknown factor checked by inverse multiplication']);
  },
  'grade4-production-equal-distribution': p => {
    const total=p.daily*p.days,a=exact(total,p.destinations);
    return result(a,`Шеберхана күн сайын ${p.daily} ойыншық бөлшек дайындайды. ${p.days} күнде дайындалған барлық бөлшек ${p.destinations} үйірмеге тең бөлінді. Әр үйірме неше бөлшек алды?`,`Барлық бөлшек: ${p.daily} · ${p.days} = ${n(total)}. Әр үйірмеге: ${n(total)} : ${p.destinations} = ${a} бөлшек. Тексеру: ${a} · ${p.destinations} = ${n(total)}.`,['production conserved in exact destination groups']);
  },
  'grade4-tens-package-division': p => {
    const a=exact(p.total,p.capacity);assert(p.total%10===0&&p.capacity%10===0);
    return result(a,`Құрастыру жиынтығына арналған ${n(p.total)} тетік бар. Әр пакетке ${p.capacity} тетік салынады. Барлық тетік қалдықсыз салынуы үшін неше пакет керек?`,`Пакет саны: ${n(p.total)} : ${p.capacity} = ${p.total/10} : ${p.capacity/10} = ${a}. Тексеру: ${a} · ${p.capacity} = ${n(p.total)}.`,['equal factor of ten removed from dividend and divisor']);
  },
  'grade4-daily-stock-remainder': p => {
    const total=p.daily*p.days;assert(total>p.shipped);
    return result(total-p.shipped,`Мектеп шеберханасы күніне ${n(p.daily)} қағаз белгі жасайды. ${p.days} күндегі белгілердің ${n(p.shipped)} данасы жарысқа жіберілді, өзгесі қоймада қалды. Қоймада неше белгі қалды?`,`Барлығы: ${n(p.daily)} · ${p.days} = ${n(total)} белгі. Қоймада: ${n(total)} − ${n(p.shipped)} = ${n(total-p.shipped)} белгі.`,['daily accumulation minus a single shipment']);
  },
  'grade4-equal-budget-price-count': p => {
    const first=exact(p.budget,p.firstPrice),second=exact(p.budget,p.secondPrice);assert(second>first);
    return result(second-first,`Екі сыныптың әрқайсысы жапсырмаға ${n(p.budget)} теңгеден жұмсады. Бірінші сынып бір жапсырманы ${p.firstPrice} теңгеден, екіншісі ${p.secondPrice} теңгеден алды. Екінші сынып неше жапсырма артық алды?`,`Бірінші сынып: ${n(p.budget)} : ${p.firstPrice} = ${first} жапсырма. Екінші: ${n(p.budget)} : ${p.secondPrice} = ${second}. Айырма: ${second} − ${first} = ${second-first}.`,['separate equal budgets each purchase whole items']);
  },
  'grade4-full-seats-total': p => {
    const a=p.rows*p.seats;
    return result(a,`Қойылым залындағы ${p.rows} қатардың әрқайсысында ${p.seats} орын бар. Бос орын қалған жоқ. Қойылымды неше көрермен тамашалады?`,`${p.rows} қатардың әрқайсысында ${p.seats} көрермен: ${p.rows} · ${p.seats} = ${a}.`,['all seats occupied exactly once']);
  },
  'grade4-three-digit-quotient-selection': p => {
    const quotients=p.pairs.map(([a,b])=>exact(a,b)),matches=quotients.filter(q=>q>=100&&q<=999);assert.equal(matches.length,1);
    return result(matches[0],`Мына бөлінділерді қарастырыңдар: ${p.pairs.map(([a,b])=>`${n(a)} : ${b}`).join('; ')}. Олардың тек біреуі үштаңбалы санға тең. Сол үштаңбалы санды жазыңдар.`,`Бөлінділер ретімен: ${quotients.join(', ')}. Осылардың ішіндегі жалғыз үштаңбалы сан — ${matches[0]}.`,['all candidate quotients exact; one and only one has three digits']);
  },
  'grade4-full-crates-remainder': p => {
    const q=Math.floor(p.total/p.capacity),r=p.total%p.capacity;assert(r>0);
    return result(q,`Жәрмеңкеде ${n(p.total)} алма бар. Бір жәшікке ${p.capacity} алма сыяды. Толық жәшіктер ғана жөнелтіледі, артылған алма бөлек қалады. Неше толық жәшік жөнелтіледі?`,`${n(p.total)} : ${p.capacity} = ${q}, қалдық ${r}. ${q} толық жәшікке ${p.capacity*q} алма салынады. Қалған ${r} алма тағы бір жәшікті толтырмайды.`,['0 < remainder < capacity; next full crate is impossible']);
  },
  'grade4-unit-price-repeat-purchase': p => {
    const price=exact(p.total,p.count),a=price*p.wanted;assert(String(price).includes('0'));
    return result(a,`Бірдей ${p.count} сызғыш үшін ${n(p.total)} теңге төленді. Баға өзгермесе, сондай ${p.wanted} сызғыш неше теңге тұрады?`,`Бір сызғыштың бағасы: ${n(p.total)} : ${p.count} = ${price} теңге. ${p.wanted} сызғыш: ${price} · ${p.wanted} = ${n(a)} теңге.`,['same unit price used for both purchases; quotient zero retained']);
  },
  'grade4-three-digit-product': p => {
    assert(p.first>=100&&p.first<=999&&p.second>=100&&p.second<=999);
    const digits=[p.second%10,Math.floor(p.second/10)%10,Math.floor(p.second/100)];
    const pieces=digits.map((d,i)=>p.first*d*10**i),a=p.first*p.second;
    assert.equal(pieces.reduce((s,v)=>s+v,0),a);
    return result(a,`Бір бетке ${p.first} түрлі өрнек басылған. Осындай ${p.second} бетте барлығы неше өрнек бар?`,`${p.first} · ${p.second} көбейтіндісін разрядтарға бөліп есептейміз: ${pieces.map(n).join(' + ')} = ${n(a)}.`,['partial products shifted by their actual place values']);
  },
  'grade4-productivity-comparison-gap': p => {
    const a=exact(p.firstItems,p.firstMinutes),b=exact(p.secondItems,p.secondMinutes);assert(a>b);
    return result(a-b,`Айша ${p.firstMinutes} минутта ${p.firstItems} қағаз гүл, Меруерт ${p.secondMinutes} минутта ${p.secondItems} қағаз гүл жасады. Әрқайсысы бірқалыпты жұмыс істейді. Айшаның бір минуттағы өнімділігі Меруерттікінен неше гүлге артық?`,`Айша: ${p.firstItems} : ${p.firstMinutes} = ${a} гүл/мин. Меруерт: ${p.secondItems} : ${p.secondMinutes} = ${b} гүл/мин. Айырмасы: ${a} − ${b} = ${a-b} гүл/мин.`,['rates, rather than raw total outputs, compared']);
  },
  'grade4-parallel-printer-time': p => {
    const a=exact(p.total,p.firstRate+p.secondRate);
    return result(a,`Бірінші принтер минутына ${p.firstRate} бет, екіншісі минутына ${p.secondRate} бет басады. Олар бір уақытта қосылып, үзіліссіз жұмыс істейді. Екеуі бірге ${p.total} бетті неше минутта басып бітіреді?`,`Бір минутта екеуі ${p.firstRate} + ${p.secondRate} = ${p.firstRate+p.secondRate} бет басады. Қажет уақыт: ${p.total} : ${p.firstRate+p.secondRate} = ${a} минут.`,['independent simultaneous rates add; total is divisible by combined rate']);
  },
  'grade4-shared-unit-price': p => {
    const count=p.firstCount+p.secondCount,a=exact(p.total,count);
    return result(a,`Көрмеге бірдей бағамен ${p.firstCount} жасыл және ${p.secondCount} көк папка алынды. Барлығына ${n(p.total)} теңге төленді. Бір папка неше теңге тұрады?`,`Барлық папка саны: ${p.firstCount} + ${p.secondCount} = ${count}. Бір папканың бағасы: ${n(p.total)} : ${count} = ${a} теңге.`,['both colours explicitly share the same unit price']);
  },
  'grade4-equal-speed-time-difference': p => {
    assert(p.longer>p.shorter);const speed=exact(p.extraDistance,p.longer-p.shorter),a=speed*p.shorter;
    return result(a,`Екі туристік автобус бірдей тұрақты жылдамдықпен жүрді. Біріншісі ${p.longer} сағат, екіншісі ${p.shorter} сағат қозғалды. Бірінші автобус ${p.extraDistance} км артық жол жүрді. Екінші автобус неше километр жүрді?`,`Уақыт айырмасы ${p.longer} − ${p.shorter} = ${p.longer-p.shorter} сағат. Бірдей жылдамдық: ${p.extraDistance} : ${p.longer-p.shorter} = ${speed} км/сағ. Екінші автобус: ${speed} · ${p.shorter} = ${a} км.`,['distance difference belongs to the difference in travel times']);
  },
  'grade4-closing-route-length': p => {
    const first=p.firstSpeed*p.time,second=p.secondSpeed*p.time;
    return result(first+second,`Екі ауылдан бір уақытта бір-біріне қарсы екі велосипедші шықты. Бірі ${p.firstSpeed} км/сағ, екіншісі ${p.secondSpeed} км/сағ жылдамдықпен жүріп, ${p.time} сағаттан кейін кездесті. Олар бір жолдың бойымен жүрді. Ауылдардың арасы неше километр?`,`Кездескенге дейін біріншісі ${p.firstSpeed} · ${p.time} = ${first} км, екіншісі ${p.secondSpeed} · ${p.time} = ${second} км жүрді. Екі жол бірге ауылдардың арақашықтығын береді: ${first} + ${second} = ${first+second} км.`,['simultaneous start and one connecting route make distances add']);
  },
  'grade4-bracket-equation': p => {
    const bracket=exact(p.product,p.factor);assert(bracket>p.addend);const a=bracket-p.addend;
    return result(a,`(x + ${p.addend}) · ${p.factor} = ${p.product} теңдеуіндегі x санын табыңдар.`,`Алдымен жақшадағы мәнді табамыз: x + ${p.addend} = ${p.product} : ${p.factor} = ${bracket}. Сондықтан x = ${bracket} − ${p.addend} = ${a}. Тексеру: (${a} + ${p.addend}) · ${p.factor} = ${p.product}.`,['both inverse operations applied and substituted back']);
  },
  'grade4-separation-rate-from-distance': p => {
    const a=exact(p.distance,p.hours);
    return result(a,`Екі пойыз бір стансадан бір мезгілде қарама-қарсы бағытта шықты. ${p.hours} сағаттан кейін олардың арасы ${n(p.distance)} км болды. Пойыздардың арақашықтығы бір сағатта неше километрге ұлғайып отырған?`,`Қашықтау жылдамдығы: ${n(p.distance)} : ${p.hours} = ${a} км/сағ. Бір сағаттағы арақашықтық өсімі — ${a} км.`,['separation grows from zero at a constant combined rate']);
  },
  'grade4-meeting-unknown-speed': p => {
    const combined=exact(p.distance,p.time);assert(combined>p.firstSpeed);const a=combined-p.firstSpeed;
    return result(a,`Арақашықтығы ${p.distance} м екі қақпадан бір уақытта бір-біріне қарсы екі робот қозғалды. Олар ${p.time} секундтан кейін кездесті. Бірінші роботтың жылдамдығы ${p.firstSpeed} м/с. Екіншісінің жылдамдығын м/с-пен табыңдар.`,`Жақындау жылдамдығы: ${p.distance} : ${p.time} = ${combined} м/с. Екінші робот: ${combined} − ${p.firstSpeed} = ${a} м/с. Тексеру: (${p.firstSpeed} + ${a}) · ${p.time} = ${p.distance} м.`,['positive second speed satisfies the full meeting-distance equation']);
  },
};

function validateParams(value) {
  if (typeof value==='number') { assert(Number.isSafeInteger(value)&&value>=0&&value<=1e9); return; }
  if (typeof value==='string') { assert(value.length>0&&value.length<100); return; }
  if (Array.isArray(value)) { assert(value.length>0&&value.length<=20); value.forEach(validateParams);return; }
  assert(value&&typeof value==='object');Object.values(value).forEach(validateParams);
}

export const modelIds=Object.freeze(Object.keys(models));
export function renderEdition(row) {
  assert.equal(row.grade,4);assert(models[row.modelId],`Unknown grade-4 model: ${row.modelId}`);
  validateParams(row.params);
  const rendered=models[row.modelId](row.params);
  assert(rendered.statement&&rendered.solution&&rendered.answer);
  return rendered;
}
export function verifyEdition(row) {
  const rendered=renderEdition(row);
  for(const key of ['statement','answer','solution'])assert.equal(row[key],rendered[key],`${row.editionId}: ${key} must remain bound to the model givens`);
  assert.deepEqual(row.options,rendered.options,`${row.editionId}: answer options must remain bound to the model givens`);
  assert(row.sourceRefs?.length>0);assert(row.adaptationChanges?.length>=2);
  return {answer:rendered.answer,checks:['exact model result','condition and solution bound to all model givens',...rendered.checks]};
}
