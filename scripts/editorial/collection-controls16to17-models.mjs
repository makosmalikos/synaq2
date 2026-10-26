import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='collection-controls16to17',sources={W16:'40fbca17-3130-47e1-a688-e7e4b77b1a24',W17:'4e274d3b-8ca3-4610-896b-5f9170a913d0'};
export const SPECS=[
  [
    "W16",
    1,
    "num",
    "symbolic-percent-of-positive-whole",
    "Қорапта q дәптер бар, оның p данасы торкөз. p және q — оң сандар, p ≤ q. Торкөз дәптерлер барлық дәптердің неше пайызы екенін өрнектеңіз.",
    "((100 × p)/q)%",
    "Алдымен бөлік пен толық санның қатынасы (p/q) табылады. Пайызбен жазғанда оны 100-ге көбейтеміз: ((100 × p)/q)%. Бөлімдегі q нөлден өзгеше.",
    [
      "((100 × q)/p)%",
      "(p/(100 × q))%",
      "100 × p × q%",
      "((100 × p)/q)%"
    ]
  ],
  [
    "W16",
    2,
    "geo",
    "two-map-scales-same-distance",
    "Масштабы 1:24000000 картада екі ауылдың арасы 4,5 см. Масштабы 1:36000000 басқа картада сол арақашықтық неше см болады?",
    "3",
    "Нақты аралық 4,5 × 24000000 = 108000000 см. Екінші картадағы ұзындық 108000000 ÷ 36000000 = 3 см. Екі картаның да өлшем бірлігі бірдей."
  ],
  [
    "W16",
    3,
    "num",
    "joint-payment-inverse-three-solo-times",
    "Үш шебер бірдей жұмысты жеке тиісінше 4, 6, 12 сағатта бітіреді. Құны 48000 теңге болатын жұмысты үшеуі бірге, басынан аяғына дейін атқарды. Ақшаны істеген жұмыстарына сәйкес бірінші, екінші, үшінші шеберге ретімен бөліңіз.",
    "24000; 16000; 8000",
    "Өнімділіктер (1/4):(1/6):(1/12) = 3:2:1. Алты бөліктің біреуі 48000 ÷ 6 = 8000 теңге. Сондықтан үлестері 24000, 16000, 8000 теңге. Қосындысы 48000; жеке уақыт пен алынған үлестің көбейтінділері тең.",
    [
      "24000; 16000; 8000",
      "8000; 16000; 24000",
      "16000; 16000; 16000",
      "12000; 18000; 18000"
    ]
  ],
  [
    "W16",
    4,
    "num",
    "equal-count-power-sums-adjacent-exponents",
    "Бөлшектің алымында 7²⁰²⁸ саны алты рет қосылған, бөлімінде 7²⁰²⁷ саны алты рет қосылған. Бөлшектің мәнін табыңыз.",
    "7",
    "Алым 6 × 7²⁰²⁸, бөлім 6 × 7²⁰²⁷. Екеуіндегі 6 қысқарады. 7²⁰²⁸ саны 7²⁰²⁷ санынан бір 7 көбейткішіне артық, сондықтан бөлінді 7. Бөлім оң болғандықтан қысқарту жарамды."
  ],
  [
    "W16",
    5,
    "num",
    "reverse-percent-whole-compared-to-subsubcategory",
    "Дүкендегі барлық өнімнің 25%-ы сүт өнімі. Сүт өнімдерінің 32%-ы йогурт. Барлық өнім саны йогурт санының неше пайызына тең?",
    "1250",
    "Йогурттың бүкіл өнім ішіндегі үлесі 0,25 × 0,32 = 0,08. Бүкіл өнім саны йогурттан 1 ÷ 0,08 = 12,5 есе көп. Пайызбен 12,5 × 100 = 1250%. Сұрақ йогурттың толыққа үлесін емес, толықтың йогуртқа қатынасын сұрайды."
  ],
  [
    "W16",
    6,
    "num",
    "three-year-compound-growth-reverse",
    "Жас ағаштың биіктігі үш жыл қатарынан жыл сайын алдыңғы жылғы биіктігінің 5%-ына өсті. Қазір биіктігі 138,915 см. Үш жыл бұрынғы биіктігі неше см болған?",
    "120",
    "Үш өсімнің көбейткіші 1,05 × 1,05 × 1,05 = 1,157625. Бастапқы биіктік 138,915 ÷ 1,157625 = 120 см. Жылдар бойынша 120 → 126 → 132,3 → 138,915. Әр пайыз өзгеріп отыратын биіктікке есептеледі."
  ],
  [
    "W16",
    7,
    "alg",
    "three-linear-equations-express-dependent-variable",
    "Әр теңдіктен y-ті x арқылы өрнектеңіз. Жауаптар шарттағы ретпен берілсін: «x = 4 × y», «x = (1/5) × y − 3», «8 × x = 20 − 4 × y».",
    "y = 0,25 × x; y = 5 × x + 15; y = 5 − 2 × x",
    "Біріншісінде екі жағын 4-ке бөлеміз: y = 0,25 × x. Екіншісінде x + 3 = (1/5) × y, сондықтан y = 5 × x + 15. Үшіншісінде 4 × y = 20 − 8 × x, демек y = 5 − 2 × x.",
    [
      "y = 0,25 × x; y = 5 × x + 15; y = 5 − 2 × x",
      "y = 4 × x; y = 5 × x + 15; y = 5 − 2 × x",
      "y = 0,25 × x; y = 5 × x + 3; y = 5 − 2 × x",
      "y = 0,25 × x; y = 5 × x + 15; y = 2 × x − 5"
    ]
  ],
  [
    "W17",
    1,
    "num",
    "repeated-sums-and-repeated-subtractions-product",
    "Бірінші жақшада (1/5) саны 120 рет қосылып, шыққан қосындыдан (1/3) саны 24 рет азайтылды. Екінші жақшада (1/96) саны 30 рет қосылған. Екі жақшаның мәндерінің көбейтіндісін табыңыз.",
    "5",
    "Бірінші қосынды 120 × (1/5) = 24. Азайтылатын жалпы сан 24 × (1/3) = 8. Бірінші жақша 24 − 8 = 16. Екінші жақша 30 × (1/96) = (5/16). Көбейтінді 16 × (5/16) = 5."
  ],
  [
    "W17",
    2,
    "alg",
    "nested-numeric-fractions-scaled-modulus-complete-roots",
    "«(|9 − 3 × x|/((8 + (1/3)) − (2 + (1/6)))) = ((960,5 − (600 + (1/2)))/(13² − 21))» теңдеуінің барлық шешімін көрсетіңіз.",
    "x = −2 немесе x = 8",
    "Сол жақ бөлім (8 + (1/3)) − (2 + (1/6)) = (37/6). Оң жақ алым 360, бөлім 148. Сондықтан модуль (37/6) × (360/148) = 15. Бұдан 9 − 3 × x = 15 немесе 9 − 3 × x = −15. Түбірлер x = −2 және x = 8. Екеуінде де модуль 15, екі тұрақты бөлім де нөлден өзгеше.",
    [
      "x = −2",
      "x = 2 немесе x = −8",
      "x = −2 немесе x = 8",
      "x = 8"
    ]
  ],
  [
    "W17",
    3,
    "geo",
    "rectangle-midline-perimeter-ratio",
    "Сызбада ABCD тіктөртбұрышы берілген. Оның AD ені толық периметрінің 15%-ына тең. E — AB-ның, F — CD-ның ортасы. AB ұзындығы AEFD тіктөртбұрышы периметрінің қандай бөлігі?",
    "(7/13)",
    "Толық периметр P болсын. AD = 0,15 × P, ал AB = 0,5 × P − 0,15 × P = 0,35 × P. AE = 0,175 × P. Кіші периметр 2 × (0,175 × P + 0,15 × P) = 0,65 × P. Сондықтан қатынас 0,35 ÷ 0,65 = (7/13).",
    [
      "(7/10)",
      "(7/13)",
      "(3/13)",
      "(14/13)"
    ]
  ],
  [
    "W17",
    4,
    "motion",
    "downstream-upstream-journey-times-raft-target",
    "Катер екі айлақтың арасын ағыс бойымен 6 сағатта, ағысқа қарсы 10 сағатта өтеді. Тек ағыспен қозғалатын сал осы аралықты неше сағатта өтеді?",
    "30",
    "Ағыс бойымен және қарсы жылдамдықтардың айырмасы ағыс жылдамдығының екі есесіне тең. Жолды бірлік деп алсақ, айырма (1/6) − (1/10) = (1/15). Ағыс жылдамдығы (1/30). Салдың да жылдамдығы осыған тең, сондықтан уақыты 30 сағат."
  ],
  [
    "W17",
    5,
    "geo",
    "triangle-side-percent-perimeter-linear-whole",
    "Үшбұрыштың AB қабырғасы периметрінің 35%-ы, BC қабырғасы AB-ның 80%-ы. AC қабырғасы BC-дан 3,6 см ұзын. BC ұзындығын см-мен табыңыз.",
    "11,2 см",
    "Периметр P болсын. AB = 0,35 × P, BC = 0,28 × P, AC = 0,28 × P + 3,6. Қосындыдан 0,91 × P + 3,6 = P, сондықтан P = 40. Ізделетін BC = 0,28 × 40 = 11,2 см. Қалған қабырғалар 14 және 14,8 см; олармен үшбұрыш құруға болады.",
    [
      "14 см",
      "14,8 см",
      "40 см",
      "11,2 см"
    ]
  ],
  [
    "W17",
    6,
    "motion",
    "two-approaching-trains-remainder-speed-difference",
    "Бір-біріне қарай бір уақытта шыққан екі пойыздың бастапқы арасы 456 км. 3 сағаттан кейін кездесуге дейін 36 км қалды. Бірінің жылдамдығы екіншісінен 8 км/сағ артық. Баяу және жылдам пойыздардың жылдамдықтарын осы ретпен табыңыз.",
    "66 және 74 км/сағ",
    "Жүрілген жалпы жол 456 − 36 = 420 км. Жылдамдықтар қосындысы 420 ÷ 3 = 140. Айырмасы 8 болғандықтан баяуы (140 − 8) ÷ 2 = 66, жылдамы 74 км/сағ. Тексеру: 3 × (66 + 74) + 36 = 456.",
    [
      "72 және 80 км/сағ",
      "66 және 74 км/сағ",
      "140 және 148 км/сағ",
      "64 және 72 км/сағ"
    ]
  ],
  [
    "W17",
    7,
    "num",
    "salt-mass-fraction-dilution-added-water",
    "Массасы 24 кг ерітіндінің 6%-ы тұз. Концентрациясы массасы бойынша 2% болуы үшін қанша кг таза су қосу керек? Тұз жоғалмайды.",
    "48",
    "Тұз массасы 24 × 0,06 = 1,44 кг. Бұл жаңа ерітіндінің 2%-ы, сондықтан толық жаңа масса 1,44 ÷ 0,02 = 72 кг. Қосылатын су 72 − 24 = 48 кг. Тексеру: 1,44 ÷ (24 + 48) = 0,02."
  ]
];
export const figurePath='/figures/synaq-editions/control17-midline-native.svg';
export function drawFigure(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" role="img" aria-labelledby="title"><title id="title">Орталарымен бөлінген тіктөртбұрыш</title><rect width="360" height="220" rx="22" fill="#f5f8ff"/><rect id="half-fill" x="40" y="50" width="140" height="120" fill="#e8defa"/><rect id="outline" x="40" y="50" width="280" height="120" fill="none" stroke="#5266bd" stroke-width="2.5"/><line id="midline" x1="180" y1="50" x2="180" y2="170" stroke="#9563c4" stroke-width="2.5" stroke-dasharray="6 4"/><g font-family="Arial, sans-serif" font-size="21" text-anchor="middle" fill="#273e69"><text id="A" x="40" y="34">A</text><text id="E" x="180" y="34">E</text><text id="B" x="320" y="34">B</text><text id="D" x="40" y="199">D</text><text id="F" x="180" y="199">F</text><text id="C" x="320" y="199">C</text></g></svg>\n`;}
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:6,topic,difficulty:'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All14 frozen source/new full conditions, official/new solutions and7MCQsets read. New numbers/context preserve reciprocal percent base, two map scales, inverse-productivity payment, adjacent powers repeated sums, reverse subcategory percent, compound growth, global dependent-variable expressions, repeated fractions, nested modulus roots, rectangle midline perimeter, raft flow, triangle shape, train closing speed and dilution target.','W17-1 underbrace subtraction is ambiguous in source display; intended repeated subtraction from full official solution is explicitly stated in words. W17-7 original masspercent/litres lacks density; new condition consistently uses kg and massfraction. W16-6 human growth is replaced by measured tree growth.','W17-3 source archived raster is inspected but never reused/traced. One new nativeSVG with independently checked rectangle, endpoints/midpoints, dimensions and correct ratio. Others nativeMathML only. Same root author separate computational check, no separate human reviewer. LocalStandard+14editions not14newmeanings.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{}),...(w==='W17'&&n===3?{image:figurePath,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+figurePath,import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all14full source/new conditions/full official/new solutions/all7MCQsets and1source raster read','exact symbolic identities, native geometry, complete rootsets, compound percentages and flow/shape/transport/mass conservation','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){fs.writeFileSync(new URL('../../frontend/public'+figurePath,import.meta.url),drawFigure());const editions=buildEditions();assert.equal(editions.length,14);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'All14frozen controls16+17 tasks rewritten, localStandard+, not14semanticstories.',sourceOccurrences:14,distinctModels:14,editions},null,2)+'\n');console.log(JSON.stringify({authored:14,figures:1}));}
