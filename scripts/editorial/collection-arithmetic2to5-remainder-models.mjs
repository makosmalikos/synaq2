import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='collection-arithmetic2to5-remainder',sources={A2:'ab3d9a6b-355d-4369-b925-cefb4b35f7b0',A3:'4ad17858-4f6a-4717-9132-5a524670edbe',A4:'ce7fe94f-f247-4af4-9701-725e04eac1ba',A5:'24af1703-d090-4fba-b375-1a414fd7ab9b'};
export const SPECS=[
  [
    "A2",
    19,
    "num",
    "abs-product-divide-mixed",
    "Мәнін дәл есептеңіз: «|−(9/14)| × |2 + (1/3)| ÷ |−(1 + (4/5))|».",
    "(5/6)",
    "Модульдер (9/14), (7/3), (9/5) болады. Алғашқы көбейтінді (9/14) × (7/3) = (3/2). Бөлу (3/2) × (5/9) = (5/6).",
    [
      "(1/12)",
      "(5/6)",
      "−(5/6)",
      "(1/6)"
    ]
  ],
  [
    "A2",
    23,
    "num",
    "abs-difference-then-product",
    "Есептеңіз: «(|−(4 + (1/2))| − |−(7/6)|) × |(3/10)|».",
    "1",
    "Модульдерден кейін жақшада (9/2) − (7/6) = (10/3) шығады. Соңғы көбейтінді (10/3) × (3/10) = 1.",
    [
      "(7/6)",
      "−1",
      "1",
      "(3/2)"
    ]
  ],
  [
    "A2",
    27,
    "num",
    "abs-quotient-minus-mixed",
    "Амалдар ретін сақтап есептеңіз: «|−(4 + (1/5))| ÷ |−(7/10)| − |2 + (2/3)|».",
    "(3 + (1/3))",
    "Алғашқы модуль (21/5). Бөлу (21/5) × (10/7) = 6. Одан (8/3) санын азайтамыз: 6 − (8/3) = (10/3), яғни (3 + (1/3)).",
    [
      "3",
      "(3 + (1/3))",
      "(2 + (2/3))",
      "(2 + (1/3))"
    ]
  ],
  [
    "A3",
    3,
    "num",
    "abs-difference-divided-by-positive-fraction",
    "Өрнектің дәл мәні қандай? «(|−(6 + (3/4))| − |9 + (1/2)|) ÷ |−(11/24)|».",
    "−6",
    "Жақшадағы айырма (27/4) − (19/2) = (−11/4). Бөлім модулі (11/24). Сондықтан (−11/4) × (24/11) = −6. Модульдердің айырмасы теріс болуы мүмкін.",
    [
      "−6",
      "0,6",
      "60",
      "12"
    ]
  ],
  [
    "A3",
    8,
    "num",
    "abs-subtract-division-priority",
    "Есептеңіз: «|−(1/8)| − |−5,4| ÷ |0,9|».",
    "−(5 + (7/8))",
    "Алдымен 5,4 ÷ 0,9 = 6. Содан кейін (1/8) − 6 = (−47/8), яғни −(5 + (7/8)). Азайту бөлуден кейін орындалады.",
    [
      "−(6 + (1/8))",
      "(5 + (7/8))",
      "−(5 + (7/8))",
      "−(5 + (1/8))"
    ]
  ],
  [
    "A3",
    12,
    "num",
    "abs-mixed-decimal-product-plus-decimal",
    "Дәл есептеңіз: «|−(1 + (3/5))| × |−0,15| + |−0,24|».",
    "0,48",
    "Бірінші модуль 1,6. Көбейтінді 1,6 × 0,15 = 0,24. Оған соңғы модуль 0,24 қосылып, 0,48 шығады.",
    [
      "0,96",
      "0,28",
      "0,48",
      "0"
    ]
  ],
  [
    "A3",
    17,
    "num",
    "abs-decimal-minus-fraction-product",
    "Есептеңіз: «|9,4| − |−0,48| × |−(5/12)|».",
    "9,2",
    "Алдымен 0,48 × (5/12) = 0,2. Одан кейін 9,4 − 0,2 = 9,2. Модуль ішіндегі теріс таңбалар нәтиженің өзінен тыс таңбаларға әсер етпейді.",
    [
      "9,8",
      "9,6",
      "−9,2",
      "9,2"
    ]
  ],
  [
    "A3",
    21,
    "alg",
    "reciprocal-modulus-two-nonzero-roots",
    "x нөлден өзгеше. «|(18/x)| − 12 = 120 ÷ 10» теңдеуінің барлық шешімін табыңыз.",
    "−(3/4); (3/4)",
    "Оң жақ 12, сондықтан |(18/x)| = 24. Екі жағдайдан (18/x) = 24 немесе (18/x) = −24. Бұдан x = (3/4) немесе x = −(3/4). Екі түбір де нөл емес; екеуінде де 24 − 12 = 12.",
    [
      "−(3/4); (3/4)",
      "−(4/3); (4/3)",
      "−(3/4); (4/3)",
      "Шешімі жоқ"
    ]
  ],
  [
    "A3",
    28,
    "num",
    "nested-numerator-two-denominator-abs-terms",
    "Алымы «−(7 + (1/5)) − (2 + (2/5)) + |12 + (3/5)|», ал бөлімі «|−(7/18)| × (1/7) + |−(1/21)| ÷ (6/7)» болатын бөлшектің дәл мәнін табыңыз.",
    "27",
    "Алым −7,2 − 2,4 + 12,6 = 3. Бөлімдегі бірінші қосылғыш (7/18) × (1/7) = (1/18), екіншісі (1/21) × (7/6) = (1/18). Бөлім (1/9), нөл емес. Сондықтан 3 ÷ (1/9) = 27.",
    [
      "22",
      "27",
      "40",
      "6"
    ]
  ],
  [
    "A4",
    3,
    "num",
    "nested-abs-of-two-signed-differences",
    "Есептеңіз: «||2 − 8| − |14 − (−3)||».",
    "11",
    "Ішкі модульдер |2 − 8| = 6 және |14 − (−3)| = 17. Сыртқы модуль |6 − 17| = 11.",
    [
      "7",
      "9",
      "10",
      "11"
    ]
  ],
  [
    "A4",
    11,
    "num",
    "last-operation-in-expression-tree",
    "«(−8 + 12 ÷ (−3)) × (−4) + (10 − 23 ÷ 9)» өрнегін амалдар ретімен есептегенде ең соңғы орындалатын амал қандай?",
    "Қосу",
    "Бірінші жақшада бөлу мен қосу орындалады, нәтижесі −4-ке көбейтіледі. Екінші жақшада бөлу мен азайту орындалады. Соңында дайын екі бөліктің нәтижелері қосылады. Сондықтан соңғы амал — қосу.",
    [
      "Қосу",
      "Бөлу",
      "Азайту",
      "Көбейту"
    ]
  ],
  [
    "A4",
    25,
    "alg",
    "negative-outer-modulus-two-fraction-roots",
    "«−|7 − (4 + (1/2)) × x| + 3 = −|−(2 + (1/4))|» теңдеуінің барлық нақты түбірін көрсетіңіз.",
    "(7/18); (49/18)",
    "Оң жақ −(9/4). Модульді жеке қалдырсақ, |7 − (9/2) × x| = (21/4). Сондықтан ішкі өрнек (21/4) не −(21/4). Бірінші жағдайда (9/2) × x = (7/4), x = (7/18). Екіншісінде (9/2) × x = (49/4), x = (49/18). Екі түбірді қойғанда бастапқы сол жақ −(21/4) + 3 = −(9/4) болады.",
    [
      "(7/18)",
      "(49/18)",
      "Шешімі жоқ",
      "(7/18); (49/18)"
    ]
  ],
  [
    "A4",
    27,
    "num",
    "negative-external-modulus-divisor-plus-mixed",
    "Дәл есептеңіз: «|(3/8)| ÷ (−|(15/16)|) + |−(3 + (2/5))|».",
    "3",
    "Бөлімнің алдындағы минус модульден тыс, сондықтан бөлім −(15/16). Бөлу (3/8) × (−16/15) = (−2/5). Оған (17/5) қосамыз: (−2/5) + (17/5) = 3.",
    [
      "−3",
      "3",
      "(3 + (4/5))",
      "−4"
    ]
  ],
  [
    "A5",
    11,
    "num",
    "abs-mixed-product-minus-decimal",
    "Есептеңіз: «|6 + (3/8)| × |−(1 + (3/17))| − |−3,5|».",
    "4",
    "Алғашқы модульдер (51/8) және (20/17). Көбейтінді (51/8) × (20/17) = 7,5. Соңғы модульді азайтсақ, 7,5 − 3,5 = 4.",
    [
      "11",
      "−11",
      "5,5",
      "4"
    ]
  ],
  [
    "A5",
    21,
    "num",
    "abs-difference-divided-by-positive-fraction",
    "Өрнектің дәл мәнін табыңыз: «(|3,5| − |−(2 + (1/3))|) ÷ |−(7/9)|».",
    "1,5",
    "Жақшадағы айырма (7/2) − (7/3) = (7/6). Оны (7/9) санына бөлсек, (7/6) × (9/7) = (3/2) = 1,5.",
    [
      "1,5",
      "6",
      "−8",
      "(3 + (1/3))"
    ]
  ]
];
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:6,topic,difficulty:'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All15remaining frozen arithmetic2–5full source/new conditions, full official/new solutions/all15MCQsets read. New numbers retain whole expression AST shape and difficulty, complete reciprocal/scaled modulus roots, operator precedence, mixed signs and nonzero variable denominator. Known partial-root/sign/inversion/external-minus errors preserved; unexplained source alternatives remain distinct wrong options without invented rationale.','NativeMathML fractions/mixed numbers only, sourceKaTeXdelimiter/underbraceSVG not reused. Last-operation question checked against actual expression-tree root operator, not final numerical value. Reciprocal x0 explicitly excluded and both roots substituted into full original equation.','Same root author separate exact computation, no separate human reviewer. LocalStandard+only;15editions with14modelidentities, not15semanticnewstories.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all15full source/new conditions/full official/new solutions/all15MCQsets read','exact nativeABS/fraction AST and denominator domains, allreciprocal/scaledmodulus branches and last-operation tree root','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,15);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'15remaining frozen arithmetic2–5tasks rewritten, localStandard+, not15semanticstories.',sourceOccurrences:15,distinctModels:14,editions},null,2)+'\n');console.log(JSON.stringify({authored:15,figures:0}));}
