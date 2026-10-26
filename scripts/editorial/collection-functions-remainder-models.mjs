import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='collection-functions-remainder',sources={F:'ed236cec-97d1-4b0a-a45d-4b00e907459f'};
export const SPECS=[
  [
    "F",
    1,
    "alg",
    "slope-of-implicit-affine-line",
    "«6 × x + 4 × y − 7 = 0» түзуінің бұрыштық коэффициентін табыңыз.",
    "−1,5",
    "Теңдікті y арқылы жазамыз: 4 × y = −6 × x + 7. Екі жағын 4-ке бөлгенде y = −1,5 × x + 1,75. x-тің алдындағы коэффициент −1,5.",
    [
      "1,5",
      "6",
      "−1,5",
      "(2/3)"
    ]
  ],
  [
    "F",
    2,
    "alg",
    "both-points-on-given-affine-line",
    "«y = 4 − 2 × x − 1» түзуінде екі нүктесі де жататын қатарды таңдаңыз.",
    "(−1; 5), (2; −1)",
    "Формула y = 3 − 2 × x түріне келеді. x = −1 болса y = 5, ал x = 2 болса y = −1. Сондықтан осы екі нүкте де түзуде жатады. Қатардағы жалғыз нүктенің сәйкес келуі жеткіліксіз.",
    [
      "(−1; 5), (2; −1)",
      "(−1; 6), (2; −5,5)",
      "(−1; −2), (0; −2)",
      "(1; −5), (2; −3)"
    ]
  ],
  [
    "F",
    3,
    "alg",
    "rational-affine-function-exact-evaluation",
    "«f(x) = (6/(x − 2)) + 3 × x + 2» функциясы берілген. «f((1/2))» мәнін табыңыз.",
    "−0,5",
    "x = 0,5 қойғанда бөлім −1,5, бөлшек 6 ÷ (−1,5) = −4. Қалған мүшелер 3 × 0,5 + 2 = 3,5. Қосынды −4 + 3,5 = −0,5. x = 2 функцияның анықталу облысына кірмейді, берілген 0,5 оған тең емес.",
    [
      "3,5",
      "−0,5",
      "7,5",
      "−4"
    ]
  ],
  [
    "F",
    4,
    "alg",
    "rational-affine-function-exact-evaluation",
    "«f(x) = 5 × x − 2 + (4/(x + 2))» берілген. «f(−3)» мәнін табыңыз.",
    "−21",
    "Сызықтық бөлік 5 × (−3) − 2 = −17. Бөлім −3 + 2 = −1, сондықтан бөлшек −4. Жалпы мән −17 − 4 = −21. Анықталмайтын x = −2 нүктесі қолданылмайды.",
    [
      "21",
      "−17",
      "−9",
      "−21"
    ]
  ],
  [
    "F",
    5,
    "alg",
    "rational-affine-function-exact-evaluation",
    "«f(x) = (7,5/(x − 7)) + 4 × x − 2,5» берілген. «f(4)» мәні қандай?",
    "11",
    "Бөлім 4 − 7 = −3, бөлшек 7,5 ÷ (−3) = −2,5. Қалғаны 4 × 4 − 2,5 = 13,5. Қосынды −2,5 + 13,5 = 11. x = 7 ғана алынып тасталады.",
    [
      "−11",
      "33",
      "16",
      "11"
    ]
  ],
  [
    "F",
    7,
    "alg",
    "rational-affine-function-exact-evaluation",
    "«f(x) = (0,08/x) − 6 × x + 0,2» берілген. «f(0,4)» мәнін табыңыз.",
    "−2",
    "Бөлшек 0,08 ÷ 0,4 = 0,2. Сызықтық мүше −6 × 0,4 = −2,4. Барлығы 0,2 − 2,4 + 0,2 = −2. Бөлімдегі x нөл емес.",
    [
      "−2",
      "2,8",
      "−2,8",
      "2,88"
    ]
  ],
  [
    "F",
    8,
    "alg",
    "rational-affine-function-exact-evaluation",
    "«f(x) = 3 × x + 2 + (6/(3 × x − 2))» берілген. «f(0,5)» мәнін табыңыз.",
    "−8,5",
    "Сызықтық бөлік 3 × 0,5 + 2 = 3,5. Бөлім 3 × 0,5 − 2 = −0,5, бөлшек −12. Қосынды 3,5 − 12 = −8,5. x = (2/3) кезінде ғана бөлім нөл болады.",
    [
      "8,5",
      "−8,5",
      "15,5",
      "−6"
    ]
  ],
  [
    "F",
    9,
    "alg",
    "rational-affine-function-exact-evaluation",
    "«f(x) = 5 × x + (6/(4 × x + 2))» берілген. «f(0,5)» мәнін табыңыз.",
    "4",
    "Алғашқы мүше 2,5. Бөлім 4 × 0,5 + 2 = 4, бөлшек 1,5. Сондықтан f(0,5) = 2,5 + 1,5 = 4. x = −(1/2) анықталу облысына кірмейді.",
    [
      "2,5",
      "1",
      "4",
      "−4"
    ]
  ],
  [
    "F",
    10,
    "alg",
    "rational-affine-function-exact-evaluation",
    "«f(x) = (x/4) + (8/(x − 6))» берілген. «f(−2)» мәнін табыңыз.",
    "−1,5",
    "Бірінші бөлшек (−2/4) = −0,5. Екінші бөлім −2 − 6 = −8, бөлшек −1. Қосынды −0,5 − 1 = −1,5. x = 6 мәні анықталу облысынан шығарылады.",
    [
      "−1",
      "−1,3",
      "−1,5",
      "1,5"
    ]
  ],
  [
    "F",
    11,
    "alg",
    "rational-affine-function-exact-evaluation",
    "«f(x) = x + 3 − (2/(3 × x − 4))» берілген. «f(−(2/3))» мәнін табыңыз.",
    "(2 + (2/3))",
    "x + 3 = (7/3). Бөлім 3 × (−2/3) − 4 = −6, бөлшек (−1/3). Оның алдындағы минус сақталады: (7/3) − (−1/3) = (8/3), яғни (2 + (2/3)). x = (4/3) ғана рұқсат етілмейді.",
    [
      "2",
      "3",
      "−(2 + (2/3))",
      "(2 + (2/3))"
    ]
  ],
  [
    "F",
    12,
    "alg",
    "rational-affine-function-exact-evaluation",
    "«f(x) = 4 × x + (6/(3 × x + 2))» берілген. «f(−1)» мәнін табыңыз.",
    "−10",
    "Сызықтық бөлік −4. Бөлім 3 × (−1) + 2 = −1, бөлшек −6. Қосынды −4 − 6 = −10. Бөлім x = −(2/3) болғанда нөлге айналады, ал −1 рұқсат етілген.",
    [
      "2",
      "−3",
      "−10",
      "−2"
    ]
  ],
  [
    "F",
    13,
    "alg",
    "both-points-on-given-affine-line",
    "«y = −3,5 × x − 2» түзуінде екі нүктесі де жататын қатарды таңдаңыз.",
    "(−2; 5), (2; −9)",
    "x = −2 болса y = 7 − 2 = 5. x = 2 болса y = −7 − 2 = −9. Дұрыс қатарда екі координаталық жұп та теңдеуді қанағаттандыруы керек.",
    [
      "(−2; 6), (2; −7)",
      "(−2; 5), (2; −9)",
      "(−2; 6), (0; −2)",
      "(−2; 5), (2; −5)"
    ]
  ]
];
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:6,topic,difficulty:'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All12remaining frozen function conditions, full official/new solutions/all12MCQsets read. New function coefficients, constants and arguments are recomputed with exact rationals. Allpoints in every pair option checked, every denominator pole found and shown to be forbidden, every supplied argument shown allowed. NativeMathML only, noimages.','Targets/method/difficulty preserved: implicit line slope, bothpoints of affine line and nineevaluations of affine plus simple-pole functions. Known signflip/only-polynomial/only-fraction/wrongaddition/partial-point roles retained; unexplained alternatives kept distinct without fabricated rationale.','Twelve editions intentionally share3modelIDs,9numeric evaluation variants do not count as9newsemanticstories. Same root author separately computes, no separate human reviewer. LocalStandard+only.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all12full source/newconditions/official/newsolutions/all12MCQsets read','universal affine slope and allpointmembership checks plus exact rational evaluation and every denominator pole','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,12);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'Twelve remaining frozen functiontasks rewritten, localStandard+, not12semanticstories.',sourceOccurrences:12,distinctModels:3,editions},null,2)+'\n');console.log(JSON.stringify({authored:12,figures:0}));}
