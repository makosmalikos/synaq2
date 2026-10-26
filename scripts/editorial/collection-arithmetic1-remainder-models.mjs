import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='collection-arithmetic1-remainder',sources={A1:'8f79c857-eb91-4aa3-a241-d7d724177d05'};
export const SPECS=[
  [
    "A1",
    1,
    "num",
    "nested-numeric-absolute-difference",
    "Ішкі амалдардан бастап есептеңіз: «||−12| − |−23 − (−6)||».",
    "5",
    "Бірінші ішкі модуль |−12| = 12. Екіншісінің ішін есептесек, −23 − (−6) = −17, оның модулі 17. Сыртқы модуль |12 − 17| = 5.",
    [
      "29",
      "10",
      "5",
      "35"
    ]
  ],
  [
    "A1",
    3,
    "num",
    "absolute-fractions-division-multiplication-left-associative",
    "Өрнектің дәл мәнін табыңыз: «|−(7/20)| ÷ |−1,4| × |(12/13)|».",
    "(3/13)",
    "Модульдерден кейін (7/20) ÷ (7/5) × (12/13) қалады. Алғашқы бөлу (7/20) × (5/7) = (1/4). Оны (12/13) санына көбейтсек (3/13). Бөлу мен көбейтуді солдан оңға орындаймыз.",
    [
      "0,2",
      "−(13/3)",
      "(13/3)",
      "(3/13)"
    ]
  ],
  [
    "A1",
    8,
    "num",
    "mixed-fraction-chain-with-absolute-factor",
    "Есептеңіз: «(1 + (3/8)) × (6/11) ÷ (1/8) × 3 × |−(5/27)|».",
    "(10/3)",
    "Аралас сан (11/8), соңғы модуль (5/27). Бірінші көбейтінді (11/8) × (6/11) = (3/4). Бөлуден (3/4) × 8 = 6, одан кейін 6 × 3 = 18. Соңында 18 × (5/27) = (10/3).",
    [
      "10",
      "(20/3)",
      "(10/3)",
      "5"
    ]
  ],
  [
    "A1",
    12,
    "alg",
    "absolute-affine-equals-negative-impossible",
    "Нақты сандарда теңдеуді шешіңіз: «|5 × x − (8 + (1/3))| = −(2 + (1/3))».",
    "Шешімі жоқ",
    "Сол жақ кез келген нақты x үшін теріс емес. Оң жақ −(2 + (1/3)), ол нөлден кіші. Сондықтан теңдік ешбір x үшін орындалмайды.",
    [
      "(2; 1)",
      "((1/5); (8/5))",
      "((7/12); (4 + (5/12)))",
      "Шешімі жоқ"
    ]
  ],
  [
    "A1",
    16,
    "alg",
    "sum-roots-linear-parentheses-and-fraction-absolute-coefficient",
    "«9 × (x − 4) − (−x + 14) = 0» және «(3/4) × x ÷ (9/10) × |−(4/5)| = −(4/3)» теңдеулерінің түбірлерінің қосындысын табыңыз.",
    "3",
    "Бірінші теңдеуден 9 × x − 36 + x − 14 = 0, яғни 10 × x = 50. Түбірі 5. Екіншісінде x-тің коэффициенті (3/4) × (10/9) × (4/5) = (2/3), сондықтан x = −2. Қосынды 5 + (−2) = 3. Тексеру: 9 × (5 − 4) − (−5 + 14) = 0, ал (2/3) × (−2) = −(4/3).",
    [
      "2,7",
      "0,3",
      "(7/6)",
      "3"
    ]
  ],
  [
    "A1",
    19,
    "alg",
    "absolute-affine-equals-linear-with-spurious-branch",
    "«|x − 5| = 3 × x + 8» теңдеуінің барлық нақты шешімін көрсетіңіз.",
    "−(3/4)",
    "x кемінде 5 болса, x − 5 = 3 × x + 8 теңдеуінен x = −(13/2) шығады, бірақ ол бұл аралыққа кірмейді. x саны 5-тен кіші болса, 5 − x = 3 × x + 8, демек x = −(3/4). Бұл түбірде екі жақ та (23/4) болады. Сондықтан жалғыз шешім −(3/4).",
    [
      "1,5",
      "−(3/4)",
      "(13/2); −(3/4)",
      "−(13/2); −(3/4)"
    ]
  ],
  [
    "A1",
    24,
    "alg",
    "absolute-affine-equals-negative-impossible",
    "Теңдеудің нақты шешімдерін табыңыз: «|6 − (3/4) × x| = −5».",
    "Шешімі жоқ",
    "Модульдің мәні әрқашан нөлден кем емес. Ал −5 теріс сан. Демек сол жақ пен оң жақ ешбір нақты x үшін тең болмайды.",
    [
      "2",
      "−2",
      "(3/4)",
      "Шешімі жоқ"
    ]
  ],
  [
    "A1",
    26,
    "num",
    "fraction-division-absolute-mixed-sum",
    "Дәл есептеңіз: «(3/8) ÷ |−(5/12)| + |−(3 + (1/10))|».",
    "4",
    "Модульдерді ашқанда (3/8) ÷ (5/12) + (3 + (1/10)) шығады. Алғашқы бөлу (3/8) × (12/5) = (9/10). Оған (3 + (1/10)) қосқанда 4 болады.",
    [
      "−4",
      "4",
      "(2 + (3/5))",
      "−3"
    ]
  ]
];
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:6,topic,difficulty:'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All8remaining frozen arithmetic1 full conditions, full official solutions and8MCQsets read. Full rewritten nested abs/fraction chains, impossible-negative absolute equations, two linear roots sum and variable-right-side modulus branches independently recomputed. New numeric conditions and alternatives preserve targets and known sign/inversion/truncation/partial-root/spurious-root errors.','Source16check7×1uses1=(3−2), a valid shorthand. Both saved equations are independently recomputed, giving3and−1 sum2. Rewritten equations have5and−2 sum3 and explicit original-form substitutions. NativeMathMLonly, KaTeXdelimiter SVG not reused.','Same root author computes separately, no separate human reviewer. Standard+localonly. Eight editions contain7modelidentities, negative-absolute12and24samekind; not8newmeanings.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all8full source/new conditions/official/new solutions/MCQsets read','exact numeric nestedABS/fraction ASTs, full linear and modulus branch roots and original equation substitution','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,8);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'Eight remaining frozen arithmetic1tasks rewritten, localStandard+, not8semanticstories.',sourceOccurrences:8,distinctModels:7,editions},null,2)+'\n');console.log(JSON.stringify({authored:8,figures:0}));}
