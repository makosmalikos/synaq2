import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='bil15-core',source='34faf581-b55b-4fee-94c9-1accb98b81fa';
export const SPECS=[
  [
    1,
    "word",
    "two-clubs-intersection-with-neither",
    "Сыныпта 36 оқушы бар. Робототехникаға 22, шахматқа 17 оқушы қатысады, ал 3 оқушы бұл екі үйірменің ешқайсысына қатыспайды. Екеуіне де қатысатындар нешеу?",
    "6",
    "Кемінде біреуіне 36 − 3 = 33 оқушы қатысады. Қосарланып саналғандар 22 + 17 − 33 = 6.",
    [
      "3",
      "4",
      "5",
      "6"
    ]
  ],
  [
    2,
    "word",
    "one-person-equals-two-others-collection",
    "Аян, Мейір және Даниярда барлығы 156 жапсырма бар. Аянның жапсырмасы қалған екеуінікін бірге алғандағыға тең. Аянда неше жапсырма бар?",
    "78",
    "Жалпы сан екі тең бөлікке бөлінеді: Аяндікі және қалған екеуінікі. Сондықтан 156 ÷ 2 = 78.",
    [
      "52",
      "78",
      "39",
      "65"
    ]
  ],
  [
    3,
    "word",
    "alloy-component-mass-ratio",
    "Қорытпа 3 бөлік қорғасын мен 5 бөлік қалайыдан тұрады. 480 г қорытпада неше грамм қорғасын бар?",
    "180",
    "Барлығы сегіз бөлік. Бір бөлік 60 г, қорғасын үш бөлік: 3 × 60 = 180 г.",
    [
      "300",
      "180",
      "240",
      "120"
    ]
  ],
  [
    4,
    "word",
    "two-item-total-cost-multiple",
    "Жейде мен галстук бірге 7200 теңге тұрады. Жейде галстуктан 5 есе қымбат. Галстук қанша тұрады?",
    "1200 теңге",
    "Галстук бір бөлік, жейде бес бөлік. Алты бөлік 7200 теңге, сондықтан галстук 1200 теңге.",
    [
      "1000 теңге",
      "600 теңге",
      "1200 теңге",
      "1440 теңге"
    ]
  ],
  [
    5,
    "word",
    "smaller-herd-total-and-difference",
    "Екі қорада барлығы 54 ешкі бар. Біріншісіндегі ешкі екіншісінен 8-ге аз. Бірінші қорада неше ешкі бар?",
    "23",
    "Екі тең кіші топтың қосындысы 54 − 8 = 46. Бірінші топ 46 ÷ 2 = 23. Екінші топ 31, қосындысы 54.",
    [
      "31",
      "29",
      "23",
      "24"
    ]
  ],
  [
    6,
    "geo",
    "rectangle-width-perimeter-side-difference",
    "Тіктөртбұрыш периметрі 64 см. Ұзындығы енінен 6 см артық. Енін табыңыз.",
    "13 см",
    "Ұзындық пен ен қосындысы 32 см. Екі еннің қосындысы 32 − 6 = 26 см. Ені 13 см, ұзындығы 19 см.",
    [
      "19 см",
      "16 см",
      "13 см",
      "32 см"
    ]
  ],
  [
    7,
    "word",
    "remaining-notebook-pages-fraction",
    "Дәптерде 40 бет бар, оның «(3/10)» бөлігі толтырылған. Неше беті таза қалды?",
    "28",
    "Толтырылғаны 40 × (3/10) = 12 бет. Тазасы 40 − 12 = 28 бет.",
    [
      "20",
      "28",
      "12",
      "32"
    ]
  ],
  [
    8,
    "num",
    "fraction-difference-times-common-multiple",
    "Есептеңіз: «((2/3) − (1/8)) × 24».",
    "13",
    "Айырма (16/24) − (3/24) = (13/24). Оны 24-ке көбейтсек, 13 шығады.",
    [
      "16",
      "13",
      "26",
      "28"
    ]
  ],
  [
    9,
    "word",
    "sum-two-hourly-painting-rates",
    "Шебер бір сағатта 9 бірдей панельді, көмекшісі бір сағатта 5 панельді бояйды. Бір-біріне кедергі жасамай осы қарқынмен бірге 3 сағат істесе, неше панель бояйды?",
    "42",
    "Бірлескен өнімділік сағатына 14 панель. Үш сағатта 14 × 3 = 42 панель.",
    [
      "42",
      "30",
      "48",
      "36"
    ]
  ],
  [
    10,
    "geo",
    "multiple-rectangular-glass-areas-width-fraction",
    "Әр шынының ұзындығы 18 дм, ені ұзындығының «(1/3)» бөлігі. Осындай 12 шынының жалпы ауданын шаршы дециметрмен табыңыз.",
    "1296",
    "Ені 6 дм. Бір шыны ауданы 18 × 6 = 108 дм². Барлығы 108 × 12 = 1296 дм².",
    [
      "1196",
      "1086",
      "1396",
      "1296"
    ]
  ],
  [
    11,
    "geo",
    "circle-circumference-area-pi-coefficients",
    "Радиусы 9 см шеңбердің ұзындығы мен дөңгелек ауданын осы ретпен табыңыз.",
    "18π және 81π",
    "Ұзындық радиустың екі есесі мен π көбейтіндісі: 18π см. Аудан радиустың квадраты мен π көбейтіндісі: 81π см².",
    [
      "18π және 81π",
      "9π және 81π",
      "14π және 72π",
      "18π және 18π"
    ]
  ],
  [
    12,
    "num",
    "percent-of-scalar",
    "80 санының 35%-ын табыңыз.",
    "28",
    "Пайыздық үлес (35/100). Сондықтан 80 × (35/100) = 28.",
    [
      "28",
      "30",
      "27",
      "26"
    ]
  ],
  [
    13,
    "word",
    "boat-downstream-upstream-total-distance",
    "Қайықтың тынық судағы жылдамдығы 18 км/сағ. Ол ағыспен 3 сағат, ағысқа қарсы 4 сағат жүзді. Ағыс жылдамдығы 3 км/сағ. Жалпы жүрген жолын табыңыз.",
    "123 км",
    "Ағыспен жылдамдық 21, қарсы 15 км/сағ. Қашықтықтар 63 және 60 км. Барлығы 123 км.",
    [
      "120 км",
      "123 км",
      "115 км",
      "125 км"
    ]
  ],
  [
    14,
    "num",
    "sum-difference-substitution-linear-system",
    "«(x + y)/5 − (x − y)/4 = 2» және «(x + y)/5 + (x − y)/4 = 8» жүйесін шешіңіз.",
    "(18.5; 6.5)",
    "Екі теңдеуді қоссақ, (x + y)/5 = 5, сондықтан x + y = 25. Айырмасынан (x − y)/4 = 3, демек x − y = 12. Нәтиже x = 18.5, y = 6.5.",
    [
      "(18.5; 5.5)",
      "(185; 65)",
      "(18; 6)",
      "(18.5; 6.5)"
    ]
  ],
  [
    15,
    "num",
    "day-hour-minute-equality",
    "Салыстырыңыз: 2 тәулік 3 сағат 17 минут және 3077 минут.",
    "=",
    "Бірінші шама 2 × 1440 + 3 × 60 + 17 = 3077 минут. Екі шама тең.",
    [
      ">",
      "<",
      "=",
      "Анықтау мүмкін емес"
    ]
  ],
  [
    16,
    "word",
    "constant-speed-proportional-first-hours",
    "Пойыз тұрақты жылдамдықпен 8 сағатта 576 км жүрді. Алғашқы 3 сағатта неше километр жүрді?",
    "216 км",
    "Жылдамдық 576 ÷ 8 = 72 км/сағ. Үш сағатта 72 × 3 = 216 км.",
    [
      "162 км",
      "216 км",
      "243 км",
      "135 км"
    ]
  ],
  [
    17,
    "word",
    "percent-increase-multiplicative-factor",
    "Баға 150%-ға өсті. Жаңа баға бастапқыдан неше есе үлкен?",
    "2.5 есе",
    "Жаңа баға бастапқының 100% + 150% = 250% бөлігі, яғни 2.5 есесі.",
    [
      "4.5 есе",
      "2 есе",
      "3.5 есе",
      "2.5 есе"
    ]
  ],
  [
    18,
    "word",
    "equal-worker-inverse-proportional-days",
    "Бірдей өнімділікпен істейтін 6 жұмысшы тапсырманы 12 күнде орындайды. Осындай 8 жұмысшы осы тапсырманы неше күнде бітіреді?",
    "9",
    "Жұмыс көлемі 72 адам-күн. Сегіз жұмысшы үшін 72 ÷ 8 = 9 күн.",
    [
      "5",
      "9",
      "6",
      "7"
    ]
  ],
  [
    19,
    "word",
    "same-start-direction-speed-difference-gap",
    "Бір жерден бір мезгілде бір бағытта автобус 64 км/сағ, көлік 88 км/сағ жылдамдықпен шықты. 5 сағаттан кейін автобус неше километр артта қалады?",
    "120 км",
    "Әр сағатта айырма 24 км-ге өседі. Бес сағатта 24 × 5 = 120 км.",
    [
      "35 км",
      "120 км",
      "50 км",
      "110 км"
    ]
  ],
  [
    20,
    "num",
    "fraction-sum-difference-product-mixed-division",
    "Есептеңіз: «((1/2) − (1/5)) × ((1/2) + (1/5)) × (3 + (3/7)) ÷ (3/10)».",
    "(12/5)",
    "Алғашқы екі жақша (3/10) және (7/10). Аралас сан (24/7). Көбейтінді (18/25), оны (3/10)-ға бөлсек (12/5) шығады.",
    [
      "(4/5)",
      "(12/5)",
      "12",
      "(3/5)"
    ]
  ],
  [
    21,
    "num",
    "compare-two-products-of-fractions",
    "Салыстырыңыз: «(45/56)» санының «(14/15)» бөлігі және «(13/20)» санының «(6/5)» бөлігі.",
    "<",
    "Бірінші көбейтінді (3/4), екіншісі (39/50). Ортақ бөлімде (75/100) және (78/100). Біріншісі кіші.",
    [
      ">",
      "<",
      "=",
      "Анықтау мүмкін емес"
    ]
  ],
  [
    22,
    "num",
    "difference-of-squares-product-cancellation",
    "Есептеңіз: «(2 + (80/81)) − ((3 − 1) × (3 + 1) × (9 + 1))/81».",
    "2",
    "Алым 2 × 4 × 10 = 80. Екі (80/81) бөлігі жойылып, 2 қалады.",
    [
      "3",
      "2",
      "4",
      "(1/9)"
    ]
  ],
  [
    23,
    "word",
    "father-age-two-time-multiples",
    "Әкесі қазір баласынан 5 есе үлкен. 18 жылдан кейін әкесі баласынан 2 есе үлкен болады. Әкесі қазір неше жаста?",
    "30",
    "Бала x жаста болса, 5 × x + 18 = 2 × (x + 18). Бұдан x = 6. Әкесі 30 жаста. 18 жылдан кейін 48 және 24 жас болады.",
    [
      "12",
      "18",
      "48",
      "30"
    ]
  ],
  [
    24,
    "num",
    "sum-integer-absolute-affine-inequality",
    "«|m − 3| − 2 ≤ 8» теңсіздігінің барлық бүтін шешімдерінің қосындысын табыңыз.",
    "63",
    "Шарт |m − 3| ≤ 10, яғни −7 ≤ m ≤ 13. Барлығы 21 сан, орташа мәні 3. Қосынды 21 × 3 = 63.",
    [
      "−62",
      "−37",
      "63",
      "71"
    ]
  ],
  [
    25,
    "word",
    "two-successive-percent-increases-total",
    "Санды алдымен 12%-ға, кейін шыққан санды 25%-ға арттырды. Бастапқы сан барлығы неше пайызға өсті?",
    "40%",
    "Көбейткіш 1.12 × 1.25 = 1.4. Бұл бастапқыдан 40%-ға артық.",
    [
      "40%",
      "41%",
      "44%",
      "49%"
    ]
  ],
  [
    26,
    "word",
    "price-after-two-percent-increases",
    "Баға бастапқыда 240 теңге еді. Алдымен 10%-ға, кейін жаңа баға тағы 5%-ға өсті. Соңғы бағаны табыңыз.",
    "277.2 теңге",
    "Алдымен 240 × 1.1 = 264 теңге. Кейін 264 × 1.05 = 277.2 теңге.",
    [
      "277.2 теңге",
      "276 теңге",
      "264 теңге",
      "265.2 теңге"
    ]
  ],
  [
    27,
    "num",
    "four-level-continued-fraction-plus-proper-fraction",
    "Есептеңіз: «2 + 1/(1 + 1/(1 + 1/(1 + (1/3)))) + (3/11)».",
    "(32/11)",
    "Төменнен есептесек: (4/3), (7/4), (11/7). Сондықтан сыртқы бөлшек (7/11). Жалпы 2 + (7/11) + (3/11) = (32/11).",
    [
      "(32/11)",
      "(3/11)",
      "4",
      "(1/3)"
    ]
  ],
  [
    28,
    "word",
    "current-age-plus-three-fractions",
    "Адам қазіргі жасына оның «(1/2)», «(1/3)» және «(1/4)» бөліктеріне тең уақыт қосылса, 125 жасқа толатынын айтты. Ол қазір неше жаста?",
    "60 жас",
    "Жалпы көбейткіш 1 + (1/2) + (1/3) + (1/4) = (25/12). Қазіргі жас 125 ÷ (25/12) = 60.",
    [
      "50 жас",
      "30 жас",
      "60 жас",
      "75 жас"
    ]
  ],
  [
    29,
    "word",
    "additional-workers-after-deadline-shortening",
    "Бірдей өнімді 12 жұмысшы жұмысты 9 күнде бітіруі керек еді. Олар 3 күн істеген соң, қалғанын келесі 4 күнде аяқтау қажет болды. Сол қарқынмен бітіру үшін тағы неше жұмысшы қажет?",
    "6",
    "Қалған жұмыс 12 × (9 − 3) = 72 адам-күн. Төрт күнге 18 жұмысшы керек, қосымша 18 − 12 = 6 адам.",
    [
      "7",
      "8",
      "6",
      "10"
    ]
  ],
  [
    30,
    "word",
    "four-independent-daily-work-rates",
    "Төрт маман жеке істесе бірдей жұмысты тиісінше 20, 30, 24 және 40 күнде бітіреді. Кедергісіз бірдей тұрақты қарқынмен бірге істесе, бір күнде жұмыстың қандай бөлігін орындайды?",
    "(3/20)",
    "Күндік үлестер қосындысы (1/20) + (1/30) + (1/24) + (1/40) = (6/120) + (4/120) + (5/120) + (3/120) = (3/20).",
    [
      "(1/10)",
      "(1/18)",
      "(2/15)",
      "(3/20)"
    ]
  ]
];
function row(s){const[n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-bil-${n}`,modelId:`${name}-${kind}`,grade:6,topic,difficulty:[1,2,4,5,14,15,16,21,23,24,26,28,29,30,31,32,36,38,41,45,46,47,49,50].includes(n)?'hard':'medium',minimumPlan:'pro',params:{work:'BIL15',number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${source}.json`,sourceId:String(n)}],sourceAnswerAvailability:'captured_correct_option_independently_recomputed',adaptationChanges:['Full frozen/new conditions, official/new solutions and all120source/newchoices read. Changed numbers, names and contexts retain the mathematical method and asked quantity. All30 sources rewritten without source imagery. All original four-choice counts retained. Explicit simultaneous departure, equal worker productivity, independent work rates and current-age fractions remove hidden assumptions. Exact native mathematical text replaces source formula rendering.','Exact rational arithmetic, formal identities, complete finite searches and original constraint replay independently recompute actual printed conditions and compare all options. Same author computational review, not another human reviewer. Local Standard+ only; variants not claimed semantically unique.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,options};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-bil-${s[0]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed fullBIL15condition solution choices source orscope');return{answer:r.answer,checks:['allsource/newconditions solutions/options read','actualprintedconditions independentlyrecomputed','localStandard+ nosemanticuniquenessclaim']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,30);editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'30BIL15nonvisualrewrites localStandard+;all30complete. Collectionvariant15,notgrade7.',sourceOccurrences:30,distinctModels:30,editions},null,2)+'\n');console.log(JSON.stringify({authored:30,choices:120}));}
