import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='collection-controls13to14',sources={W13:'2a7f35b6-bddc-49c4-9d3a-0fe1ec163a94',W14:'0ee72591-f61a-4b77-a3a4-6fd3c658fb4b'};
export const SPECS=[
  [
    "W13",
    1,
    "geo",
    "three-central-angle-ratios-middle",
    "Үш сәуле шеңберді толық қамтитын, бір-бірімен қабаттаспайтын үш орталық бұрышқа бөледі. Біріншісінің екіншісіне қатынасы 5:7, екіншісінің үшіншісіне қатынасы 7:8. Шамасы бойынша ортада тұрған бұрыш неше градус?",
    "126",
    "Үш бұрыштың қатынасы 5:7:8. Барлығы 20 бөлік, бір бөлік 360 ÷ 20 = 18°. Бұрыштар 90°, 126° және 144°. Қосындысы 360°, ал ортаншысы 126°."
  ],
  [
    "W13",
    2,
    "num",
    "joint-work-apprentice-total-including-shared",
    "Баспа шебері тапсырысты жалғыз 16 сағатта, көмекшісі 24 сағатта орындайды. Екеуі 8 сағат бірге істеген соң, қалғанын көмекші өзі аяқтады. Көмекші бірге істеген уақытты қоса алғанда барлығы неше сағат жұмыс істеді?",
    "12 сағ",
    "Бір сағатта екеуі (1/16) + (1/24) = (5/48) жұмыс орындайды. 8 сағатта (5/6) бөлігі дайын. Қалған (1/6) бөлікті көмекші 24 × (1/6) = 4 сағатта бітіреді. Оның толық жұмыс уақыты 8 + 4 = 12 сағат.",
    [
      "4 сағ",
      "12 сағ",
      "9,6 сағ",
      "16 сағ"
    ]
  ],
  [
    "W13",
    3,
    "alg",
    "scaled-absolute-linear-all-roots",
    "«48 × |8 × x + 3,5| = 24» теңдеуінің барлық түбірі қай қатарда берілген?",
    "x = −(3/8) немесе x = −(1/2)",
    "Екі жағын 48-ге бөлсек, |8 × x + 3,5| = 0,5. Сондықтан 8 × x + 3,5 = 0,5 немесе 8 × x + 3,5 = −0,5. Бұдан x = −(3/8) немесе x = −(1/2). Екеуін де қойғанда модуль ішінің мәні 0,5 не −0,5 болып, бастапқы сол жақ 24-ке тең.",
    [
      "x = −(3/8)",
      "x = (3/8) немесе x = (1/2)",
      "x = (41/16) немесе x = −(55/16)",
      "x = −(3/8) немесе x = −(1/2)"
    ]
  ],
  [
    "W13",
    4,
    "num",
    "difference-consecutive-natural-prefix-sums",
    "Есептеңіз: «(1 + 2 + … + 799) − (1 + 2 + … + 499)».",
    "194850",
    "1-ден 499-ға дейінгі мүшелер қысқарады. 500-ден 799-ға дейін 300 сан қалады. Шеттерін жұптасақ әр жұпта 1299 шығады, 150 жұп бар. Сондықтан 150 × 1299 = 194850."
  ],
  [
    "W13",
    5,
    "logic",
    "permutations-five-distinct-nonzero-digits",
    "2, 3, 5, 7, 9 цифрларының әрқайсысын дәл бір рет қолданып, неше бес таңбалы сан жазуға болады?",
    "120",
    "Алғашқы орынға 5 цифрдың кез келгенін қоюға болады, өйткені нөл жоқ. Қалған орындарға 4, 3, 2, 1 мүмкіндік қалады. Көбейту ережесі бойынша 5 × 4 × 3 × 2 × 1 = 120."
  ],
  [
    "W13",
    6,
    "motion",
    "equal-distance-return-average-speed",
    "Шағын автобус екі елді мекеннің арасындағы 432 км жолды барарда 72 км/сағ, қайтарда 48 км/сағ жылдамдықпен өтті. Екі бағыттағы орташа жылдамдығын км/сағ-пен табыңыз.",
    "57,6",
    "Барар уақыт 432 ÷ 72 = 6 сағат, қайтар уақыт 432 ÷ 48 = 9 сағат. Толық жол 864 км, толық уақыт 15 сағат. Орташа жылдамдық 864 ÷ 15 = 57,6 км/сағ. Жылдамдықтарды жай орташалау дұрыс болмайды."
  ],
  [
    "W13",
    7,
    "motion",
    "lake-upstream-times-downstream-target",
    "Катер белгілі қашықтықты тынық суда 8 сағатта, ал өзен ағысына қарсы 12 сағатта өтеді. Сол қашықтықты ағыс бойымен өтуге неше сағат қажет?",
    "6 сағ",
    "Қашықтықты бірлік деп аламыз. Меншікті жылдамдық (1/8), қарсы жылдамдық (1/12). Ағыс жылдамдығы (1/8) − (1/12) = (1/24). Ағыс бойымен жылдамдық (1/8) + (1/24) = (1/6). Демек, жол уақыты 6 сағат.",
    [
      "4 сағ",
      "(6 + (2/3)) сағ",
      "6 сағ",
      "10 сағ"
    ]
  ],
  [
    "W13",
    8,
    "num",
    "two-distributions-one-recipient-extra",
    "Айша қолындағы жапсырмаларды үйірмедегі достарына таратпақ. Біреуіне 3, қалғандарының әрқайсысына 2 жапсырмадан берсе, бәрі дәл жетеді. Тағы 19 жапсырма алса, сол достарының әрқайсысына 3-тен бере алады. Бастапқыда неше жапсырмасы болған?",
    "41",
    "Достар саны n болсын. Алғашқы жапсырма саны 3 + 2 × (n − 1) = 2 × n + 1. Екінші таратуда 2 × n + 1 + 19 = 3 × n, сондықтан n = 20. Бастапқы саны 2 × 20 + 1 = 41. Тексеру: 3 + 19 × 2 = 41, ал 41 + 19 = 20 × 3."
  ],
  [
    "W14",
    1,
    "geo",
    "four-unequal-parts-midpoint-distance-invariant",
    "Ұзындығы 42 см кесінді өзара тең емес төрт бөлікке бөлінді. Бірінші және соңғы бөліктердің орталарының арасы 34 см. Екі ортаңғы бөліктің орталарының арасы неше см?",
    "13",
    "Шеткі бөліктердің ұзындықтарын a және d, ортаңғыларын b және c дейік. Толық ұзындық 42, ал шеткі орталар арасы 34. Айырмасы (a + d) ÷ 2 = 8, сондықтан a + d = 16. Ортаңғылар қосындысы b + c = 26. Олардың орталарының арасы (b + c) ÷ 2 = 13 см."
  ],
  [
    "W14",
    2,
    "alg",
    "successive-block-sums-in-terms-original",
    "Тізбектес 5 натурал санның қосындысы S. Сол бесеуінен кейін бірден келетін 5 санның қосындысын және сол бастапқы бесеуінен кейін бірден келетін 10 санның қосындысын ретімен S арқылы өрнектеңіз.",
    "S + 25; 2 × S + 75",
    "Келесі бес санның әрқайсысы бастапқы сәйкес саннан 5-ке артық. Сондықтан қосынды S + 25. Одан кейінгі бес санның әрқайсысы бастапқыдан 10-ға артық, олардың қосындысы S + 50. Бастапқы бесеуден кейінгі он санның қосындысы (S + 25) + (S + 50) = 2 × S + 75.",
    [
      "S + 5; 2 × S + 10",
      "S + 25; 2 × S + 25",
      "S + 25; 2 × S + 75",
      "S + 30; 2 × S + 90"
    ]
  ],
  [
    "W14",
    3,
    "alg",
    "mixed-fraction-proportion-variable-denominator",
    "«(3 + (3/5)) ÷ (3 × x − 4) = (18/25) ÷ 4» теңдеуін шешіңіз.",
    "8",
    "Мұнда 3 × x − 4 нөл емес. Айқыш көбейтсек, 0,72 × (3 × x − 4) = 3,6 × 4 = 14,4. Сондықтан 3 × x − 4 = 20, x = 8. Тексеру: 3,6 ÷ 20 = 0,18 және 0,72 ÷ 4 = 0,18. Бөлім 20 болғандықтан түбір жарамды."
  ],
  [
    "W14",
    4,
    "motion",
    "current-percent-own-speed-round-trip-time",
    "Қайық өзен ағысымен 28,8 км жүзіп, сол жолмен кері қайтты. Ағыс жылдамдығы 2,4 км/сағ, бұл қайықтың тынық судағы жылдамдығының 40%-ы. Барып-қайту уақыты неше сағат?",
    "(11 + (3/7))",
    "Меншікті жылдамдық 2,4 ÷ 0,4 = 6 км/сағ. Ағыс бойымен 8,4 км/сағ, қарсы 3,6 км/сағ. Төмен қарай уақыт 28,8 ÷ 8,4 = (24/7) сағат, кері уақыт 28,8 ÷ 3,6 = 8 сағат. Қосынды (24/7) + 8 = (80/7), яғни (11 + (3/7)) сағат."
  ],
  [
    "W14",
    5,
    "geo",
    "rectangular-solid-exact-cube-partition",
    "Өлшемдері 8 см, 6 см және 14 см болатын тікбұрышты параллелепипед қыры 2 см бірдей кубтарға қалдықсыз бөлінді. Неше куб шықты?",
    "84",
    "Әр бағыттағы кубтар саны: 8 ÷ 2 = 4, 6 ÷ 2 = 3, 14 ÷ 2 = 7. Барлығы 4 × 3 × 7 = 84 куб. Көлеммен тексеру: 8 × 6 × 14 = 672, ал 2 × 2 × 2 = 8. Сонда 672 ÷ 8 = 84."
  ],
  [
    "W14",
    6,
    "alg",
    "coordinate-distances-symbolic-absolute-triple",
    "Координаталық түзуде A нүктесінің координатасы «4 × t + 7», B нүктесінкі «t − 2», C нүктесінкі «t − 5». t — кез келген нақты сан. AB, AC және BC арақашықтықтарын ретімен көрсетіңіз.",
    "|3 × t + 9|; |3 × t + 12|; 3",
    "Арақашықтық координаталар айырымының модуліне тең. AB = |4 × t + 7 − (t − 2)| = |3 × t + 9|. AC = |4 × t + 7 − (t − 5)| = |3 × t + 12|. BC = |t − 2 − (t − 5)| = |3| = 3. Модульдер t-нің барлық мәнінде арақашықтықтың теріс болмауын қамтамасыз етеді.",
    [
      "|3 × t + 5|; |3 × t + 2|; 3",
      "|3 × t + 9|; |3 × t + 12|; 3",
      "|5 × t + 5|; |5 × t + 2|; |2 × t − 7|",
      "|3 × t + 9|; |3 × t + 12|; −3"
    ]
  ],
  [
    "W14",
    7,
    "alg",
    "two-equations-reciprocals-complete-ordered-pair",
    "«(4/x) − (3/y) = 1» және «(5/x) + (6/y) = 4,5» теңдеулер жүйесін шешіңіз. x пен y нөлден өзгеше. Жауапта алдымен x, одан кейін y берілген.",
    "(2; 3)",
    "Бірінші теңдеуді 2-ге көбейтсек, (8/x) − (6/y) = 2. Оған екіншісін қоссақ, (13/x) = 6,5, сондықтан x = 2. Біріншісіне қойсақ, 2 − (3/y) = 1, демек y = 3. Тексеру: 4 ÷ 2 − 3 ÷ 3 = 1 және 5 ÷ 2 + 6 ÷ 3 = 4,5. Екі белгісіз де нөлден өзгеше.",
    [
      "(3; 2)",
      "(2; −3)",
      "(2; (1/3))",
      "(2; 3)"
    ]
  ]
];
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:6,topic,difficulty:'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All15 frozen control13/14 full source conditions, full official solutions and all6 MCQ sets read. New numbers and contexts preserve each target, method, difficulty and alternative error roles. Source open keys recomputed independently. Native MathML only; no archived raster or traced figures.','W13-1 explicitly describes three nonoverlapping central sectors covering360degrees. W14-2 explicitly anchors both following blocks after original5numbers. Symbolic distances checked for every real t up to absolute affine sign, not one sample. Full denominator domains and complete root sets checked.','Same root author with separate exact computational check, no separate human reviewer. Local Standard+ only,15editions not15newsemanticstories.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all15source/new full conditions and full official/new solutions/all6MCQsets read','exact ratios/work/allroots/prefix sums/permutations/roundtrip conservation and universal absolute-affine/block identities/domain checks','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,15);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'All15frozen controls13+14 tasks rewritten, localStandard+, not15semanticstories.',sourceOccurrences:15,distinctModels:15,editions},null,2)+'\n');console.log(JSON.stringify({authored:15,figures:0}));}
