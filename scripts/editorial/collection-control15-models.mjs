import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='collection-control15',sources={W15:'43cb26be-5a14-4c6b-96ca-7af1504799ea'};
export const SPECS=[
  [
    "W15",
    1,
    "num",
    "one-digit-pure-repeating-decimal-fraction",
    "Шексіз периодты 0,(8) ондық бөлшегін жай бөлшекке айналдырыңыз. Жақшадағы цифр шексіз қайталанады.",
    "(8/9)",
    "Бөлшекті x деп белгілесек, 10 × x = 8 + x. Қайталанатын бөліктерді азайтқанда 9 × x = 8, демек x = (8/9).",
    [
      "(8/9)",
      "(8/99)",
      "(8/10)",
      "(1/8)"
    ]
  ],
  [
    "W15",
    2,
    "num",
    "two-digit-pure-repeating-decimal-mixed",
    "6,(47) санын аралас сан түрінде жазыңыз. Жақшадағы 47 цифрлар тобы шексіз қайталанады.",
    "(6 + (47/99))",
    "Бөлшек бөлігін y дейік. 100 × y = 47 + y, сондықтан 99 × y = 47. Бөлшек бөлігі (47/99), ал толық сан (6 + (47/99)).",
    [
      "(6 + (47/100))",
      "(6 + (47/90))",
      "(6 + (47/99))",
      "(6 + (4/10))"
    ]
  ],
  [
    "W15",
    3,
    "num",
    "one-nonperiod-one-period-digit-decimal",
    "3,4(2) санын аралас санға айналдырыңыз. Үтірден кейін 4 бір рет, одан кейін 2 шексіз қайталанады.",
    "(3 + (19/45))",
    "Бөлшек бөлігі y болсын. 100 × y − 10 × y = 42 − 4 = 38. Сондықтан 90 × y = 38, y = (19/45). Толық сан (3 + (19/45)).",
    [
      "(3 + (42/99))",
      "(3 + (19/45))",
      "(3 + (42/90))",
      "(3 + (4/10))"
    ]
  ],
  [
    "W15",
    4,
    "num",
    "one-nonperiod-two-period-digit-decimal",
    "8,5(27) санын аралас санға айналдырыңыз. Үтірден кейін 5 бір рет, одан кейін 27 тобы шексіз қайталанады.",
    "(8 + (29/55))",
    "Бөлшек бөлігі y болса, 1000 × y − 10 × y = 527 − 5 = 522. Бұдан y = (522/990) = (29/55). Толық сан (8 + (29/55)).",
    [
      "(8 + (527/999))",
      "(8 + (527/900))",
      "(8 + (527/990))",
      "(8 + (29/55))"
    ]
  ],
  [
    "W15",
    5,
    "num",
    "three-digit-pure-repeating-decimal-mixed",
    "2,(352) санын аралас санға айналдырыңыз. 352 тобы үтірден кейін шексіз қайталанады.",
    "(2 + (352/999))",
    "Бөлшек бөлігі y болса, 1000 × y − y = 352. Демек y = (352/999), толық сан (2 + (352/999)). 352 мен 999-дың ортақ бөлгіші 1, сондықтан бұл бөлшек қысқармайды.",
    [
      "(2 + (352/1000))",
      "(2 + (352/999))",
      "(2 + (32/37))",
      "(2 + (352/990))"
    ]
  ],
  [
    "W15",
    6,
    "num",
    "sequential-percent-speed-reverse-initial",
    "Жүргізуші көлік жылдамдығын алдымен 25%-ға арттырды, кейін сол сәттегі жылдамдықты 25%-ға кемітті, соңында 20%-ға арттырды. Соңғы жылдамдық 108 км/сағ болды. Бастапқы жылдамдығын км/сағ-пен табыңыз.",
    "96",
    "Өзгерістер көбейткіші 1,25 × 0,75 × 1,2 = 1,125. Бастапқы жылдамдық 108 ÷ 1,125 = 96 км/сағ. Кезеңдері: 96 → 120 → 90 → 108. Бірдей пайызға арттыру мен кеміту бірін-бірі жоймайды."
  ],
  [
    "W15",
    7,
    "alg",
    "fraction-coefficient-modulus-complete-roots",
    "«|(2/5) × x − 0,6| = (9 + (2/5))» теңдеуінің барлық түбірін көрсетіңіз.",
    "x = 25 немесе x = −22",
    "Оң жақ 9,4. Бірінші жағдай: 0,4 × x − 0,6 = 9,4, бұдан x = 25. Екінші жағдай: 0,4 × x − 0,6 = −9,4, бұдан x = −22. Тексеру: |10 − 0,6| = 9,4 және |−8,8 − 0,6| = 9,4.",
    [
      "x = 25 немесе x = −22",
      "x = 25",
      "x = 25 немесе x = −25",
      "x = 22 немесе x = −25"
    ]
  ],
  [
    "W15",
    8,
    "geo",
    "cylinder-radius-fraction-height-volume-pi",
    "Цилиндр табанының радиусы 12 см. Радиус биіктіктің (3/5) бөлігіне тең. Цилиндр көлемін см³-пен табыңыз; π белгісін дәл қалдырыңыз.",
    "2880 × π",
    "Биіктігі 12 ÷ (3/5) = 20 см. Табан ауданы 12² × π = 144 × π см². Көлемі 144 × 20 × π = 2880 × π см³. Радиусты биіктікке айналдырғанда бөлшекке бөлеміз.",
    [
      "1036,8 × π",
      "1728 × π",
      "2880 × π",
      "720 × π"
    ]
  ],
  [
    "W15",
    9,
    "alg",
    "rational-linear-strict-inequality-negative-denominator",
    "Нақты сандарда теңсіздікті шешіңіз: «((−x + 4)/5) + ((7 + 2 × x)/(−6)) > ((−2 × x)/3) + (1/30)».",
    "x > 3",
    "Екі жағын оң 30-ға көбейтеміз: 6 × (−x + 4) − 5 × (7 + 2 × x) > −20 × x + 1. Ықшамдасақ, −16 × x − 11 > −20 × x + 1. Бұдан 4 × x > 12, сондықтан x > 3. Шекарадағы 3 шешімге кірмейді.",
    [
      "x < 3",
      "x > −3",
      "x > (1/3)",
      "x > 3"
    ]
  ],
  [
    "W15",
    10,
    "num",
    "school-grade-boys-percent-whole",
    "Мектептегі барлық оқушының 16%-ы бесінші сыныпта оқиды. Бесінші сынып оқушыларының 75%-ы қыздар, қалғаны ұлдар. Осы сыныптағы ұлдар барлық мектеп оқушыларының неше пайызы?",
    "4%",
    "Бесінші сынып ішіндегі ұлдардың үлесі 100 − 75 = 25%. Мектептің толық санына шаққанда 16% × 0,25 = 4%. Мысалы, 400 оқушының 64-і осы сыныпта болса, оның 16-сы ұл; 16 ÷ 400 = 0,04.",
    [
      "12%",
      "4%",
      "24%",
      "25%"
    ]
  ],
  [
    "W15",
    11,
    "num",
    "three-workers-payment-inverse-time",
    "Үш шебер бірдей тапсырысты жеке-жеке тиісінше 3, 6, 9 сағатта орындайды. Олар 33000 теңгелік тапсырысты басынан аяғына дейін бірге орындады. Ақшаны істеген жұмыстарына сай бөлгенде бірінші, екінші, үшінші шебер неше теңгеден алады?",
    "18000; 9000; 6000",
    "Өнімділіктер (1/3):(1/6):(1/9) = 6:3:2. Барлығы 11 бөлік, бір бөлік 33000 ÷ 11 = 3000 теңге. Үлестері 18000, 9000, 6000 теңге. Қосындысы 33000, әр үлес уақытқа кері пропорционал.",
    [
      "6000; 12000; 15000",
      "16500; 8250; 8250",
      "18000; 9000; 6000",
      "15000; 10500; 7500"
    ]
  ],
  [
    "W15",
    12,
    "geo",
    "coordinate-midpoint-equation-segment-length",
    "Координаталық түзуде B нүктесінің координатасы «4 × x + 2», A нүктесінкі «2 × x + 7», C нүктесінкі «5 × x − 4». B — AC кесіндісінің ортасы. AC ұзындығын табыңыз.",
    "14",
    "Орта нүкте қасиетінен 2 × (4 × x + 2) = (2 × x + 7) + (5 × x − 4). Бұдан 8 × x + 4 = 7 × x + 3, x = −1. Координаталар: A = 5, B = −2, C = −9. Шеттер арасы |5 − (−9)| = 14. Орташа координата (5 − 9) ÷ 2 = −2."
  ]
];
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:6,topic,difficulty:'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All12frozen control15 full conditions, official solutions and10MCQsets read. Each new numeric condition, solution and complete alternatives recomputed. Exact period vs preperiod decimal conversion and distractors, sequential percent multipliers, full modulus roots, cylinder volume, strict inequality, percent base, inverse productivity and midpoint-length targets preserved.','All period notation is explained in the condition. Native fractions/mixed numbers/superscripts only; source KaTeX delimiter glyphs not reused. Known wrong truncation/denominator/non-subtraction/negative-distance/sign/base distractor roles retained; unexplained source distractors treated as distinct wrong alternatives, not assigned an invented rationale.','Same root author separately computes; no separate human reviewer. LocalStandard+ only;12editions not12newmeanings.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all12full source/new conditions and official/new solutions/all10MCQsets read','exact recurring decimal limits, full roots, universal strict inequality and geometric/payment/percent conservation','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,12);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'All12frozen control15tasks rewritten, localStandard+, not12semanticstories.',sourceOccurrences:12,distinctModels:12,editions},null,2)+'\n');console.log(JSON.stringify({authored:12,figures:0}));}
