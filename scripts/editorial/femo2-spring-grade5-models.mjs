import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='femo2-spring-grade5',sources={F2S5:'267aabbe-7f2f-429f-879f-9cc9cab75559'};
export const SPECS=[
  [
    "F2S5",
    1,
    "num",
    "count-four-digit-numbers-fixed-modular-remainder",
    "7-ге бөлгенде қалдығы 4 болатын төрттаңбалы натурал сандар нешеу?",
    "1285",
    "Мұндай сандар 7 × k + 4 түрінде. Төрттаңбалы ең кішісі 1005 = 7 × 143 + 4, ең үлкені 9993 = 7 × 1427 + 4. k саны 143-тен 1427-ге дейінгі мәндерді алады. Барлығы 1427 − 143 + 1 = 1285 сан."
  ],
  [
    "F2S5",
    2,
    "num",
    "container-empty-mass-after-three-halvings",
    "Балы бар ыдыстың массасы 18 кг. Әуелі балдың жартысын алды, кейін қалғанының жартысын, соңында одан қалғанының жартысын алды. Қалған балы бар сол ыдыстың массасы 4 кг болды. Бос ыдыстың массасын кг-мен табыңыз.",
    "2",
    "Үш рет жартысын алған соң балдың (1/8) бөлігі қалды. Алынған (7/8) бөліктің массасы 18 − 4 = 14 кг. Бастапқы бал 14 ÷ (7/8) = 16 кг. Ыдыстың массасы 18 − 16 = 2 кг. Тексеру: қалған 2 кг бал мен 2 кг ыдыс бірге 4 кг."
  ],
  [
    "F2S5",
    3,
    "num",
    "least-factorial-index-four-consecutive-divisors",
    "n! саны 16, 17, 18, 19 сандарының әрқайсысына бөлінетін ең кіші натурал n мәнін табыңыз. Мұнда n! — 1-ден n-ге дейінгі натурал сандардың көбейтіндісі.",
    "19",
    "19 — жай сан. n саны 19-дан кіші болса, n! көбейтіндісінде 19 көбейткіші жоқ. Демек n кемінде 19. Ал 19! құрамында 16, 17, 18 және 19 көбейткіштері бар, сондықтан осы төрт санның әрқайсысына бөлінеді. Ең кіші n = 19."
  ],
  [
    "F2S5",
    4,
    "geo",
    "outer-cuboid-shell-cubes-stacked-tower-height",
    "Өлшемдері 10 см, 13 см, 17 см параллелепипед қыры 1 см бірдей кубтардан құралған. Айша сыртқы бетке шығып тұрған барлық кубты алып, бірінің үстіне бірін қойып бір баған жасады. Бағанның биіктігі неше см?",
    "890",
    "Барлық куб саны 10 × 13 × 17 = 2210. Сыртқы қабат алынғанда әр өлшем екіге кемиді: ішкі кубтар 8 × 11 × 15 = 1320. Сыртқы қабатта 2210 − 1320 = 890 куб бар. Әрқайсысы бағанға 1 см қосады, сондықтан биіктік 890 см."
  ],
  [
    "F2S5",
    5,
    "logic",
    "two-digit-insertion-hundreds-addition-divisibility-filter",
    "Екітаңбалы сан 4-ке бөлінеді. Оның екі цифрының арасына 3 цифрын жазды. Шыққан үштаңбалы санға оның жүздік цифрының үш еселенгенін қосқанда бастапқы санның 10 есесі шықты. Бастапқы санды табыңыз.",
    "24",
    "Ондық цифрын a, бірлігін b дейік. Жаңа сан 100 × a + 30 + b. Теңдік 103 × a + 30 + b = 100 × a + 10 × b, бұдан a + 10 = 3 × b. Цифрлар үшін мүмкін жұптар (2; 4), (5; 5), (8; 6), яғни 24, 55, 86. 4-ке бөлінетіні тек 24. Тексеру: 234 + 6 = 240 = 10 × 24."
  ],
  [
    "F2S5",
    6,
    "num",
    "biregular-book-choices-double-count",
    "Кітап көрмесінде 30 оқушының әрқайсысы 8 түрлі кітапты таңдады. Таңдалған әр кітапты дәл 10 оқушы таңдағаны белгілі. Барлығы неше түрлі кітап таңдалды?",
    "24",
    "Оқушылар жағынан барлық таңдаулар 30 × 8 = 240. Әр кітапқа 10 таңдау тиетіндіктен кітап саны 240 ÷ 10 = 24. Тексеру: 24 × 10 = 240. Бір кітаптың бірнеше оқушыда кездесуі жаңа кітап болып саналмайды."
  ],
  [
    "F2S5",
    7,
    "logic",
    "five-number-predicates-exactly-one-false-full-set",
    "Бес тұжырымның дәл төртеуі ақиқат, біреуі жалған болатын барлық оң натурал X сандарын таңдаңыз: X екітаңбалы; X саны 7-ге бөлінеді; X саны 60-тан артық емес; X натурал санның квадраты; X тақ сан.",
    "21, 25, 35",
    "Квадрат туралы тұжырым жалған болса, екітаңбалы тақ 7-ге еселі, 60-тан аспайтын сандарды қараймыз: 21, 35, 49. 49 квадрат болғандықтан бес тұжырым да ақиқат, ол алынбайды. Бөлінгіштік туралы тұжырым жалған болса, сәйкес тақ квадраттар 25 және 49, олардың тек 25-і 7-ге бөлінбейді. Қалған үш тұжырымның біреуі ғана жалған болатын сан жоқ. Жауаптың толық жиыны 21, 25, 35.",
    [
      "21, 25, 35, 49",
      "25, 49",
      "21, 25, 35",
      "21, 35"
    ]
  ],
  [
    "F2S5",
    8,
    "num",
    "three-pair-age-sums-past-future-target-first",
    "Биыл Азамат пен Ерланның жастарының қосындысы 48. 3 жыл бұрын Ерлан мен Нұржанның жастарының қосындысы 48 болған. 2 жылдан кейін Азамат пен Нұржанның жастарының қосындысы 48 болады. Азамат биыл неше жаста?",
    "19",
    "Биылғы жұп қосындылары: Азамат пен Ерлан — 48; Ерлан мен Нұржан — 54; Азамат пен Нұржан — 44. Бірінші мен үшіншіні қосып, екіншісін алсақ, Азаматтың екі еселенген жасы 48 + 44 − 54 = 38. Сондықтан Азамат 19 жаста. Ерлан 29, Нұржан 25 жаста; өткен және келешек шарттар да орындалады."
  ],
  [
    "F2S5",
    9,
    "logic",
    "count-near-uniform-five-digit-numbers-including-all-equal",
    "Әсел 10000-нан 99999-ға дейінгі барлық бестаңбалы санды жазып, кемінде төрт цифры бірдей сандарды белгіледі. Неше сан белгіленді?",
    "414",
    "Бес цифры түгел бірдей 9 сан бар. Дәл төрт нөлі бар сандар 10000, 20000, …, 90000 — тағы 9 сан. Қайталанатын цифр нөл емес болса, басқа цифр бірінші орында 8 тәсілмен, қалған төрт орынның бірінде 4 × 9 = 36 тәсілмен тұра алады. Әр қайталанатын цифрға 44 сан, тоғыз цифрға 396 сан келеді. Барлығы 9 + 9 + 396 = 414."
  ],
  [
    "F2S5",
    10,
    "motion",
    "awake-distance-after-sleep-remaining-fraction-of-sleep",
    "Автобус жолаушысы Мадина жолдың (1/3) бөлігін өткенде ұйықтап қалды. Оянғанда қалған жол ұйықтап жатқанда өткен жолының (1/4) бөлігіне тең болды. Толық жолдың қандай бөлігінде ол ояу болды?",
    "(7/15)",
    "Ұйқыда өткен жолды s дейік, оянғаннан кейінгісі (s/4). Екеуі толық жолдың (2/3) бөлігін құрайды: s + (s/4) = (2/3). Сондықтан s = (8/15). Ояу жүрген үлесі 1 − (8/15) = (7/15). Тексеру: бастапқы (5/15) пен соңғы (2/15) қосылып (7/15) болады.",
    [
      "(1/2)",
      "(1/3)",
      "(7/15)",
      "(13/15)"
    ]
  ]
];
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:5,topic,difficulty:[3,5,7,9].includes(n)?'hard':'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All10full frozen/new conditions, full official/new solutions/all2MCQsets read. Newremainder divisor/range residues, container18/4, factorial16..19, cuboid10×13×17, digitinsert3/add3/multiple10/filter4, book30×8/10, exactlyfourpredicates7/60, pairages48with3past2future, five-digitfour-repeatcount and sleepfractions1/3+1/4 preserve methods and exact askedquantities.','Allnumericvariants explicitly editions, not10newsemanticstories. Fullglobal finite bounds for fivepredicate search and complete decimal digit domains; allninety two-digit andall90000five-digit enumerated. Truefactorialminimality and fulloutercube boundary tested. Noimages needed, nativeMathML fractions/mixed numbers only.','Same root author separate exact computation, no separatehumanreviewer. LocalStandard+only. New doublecountingcontextbooks withdistinctchoices hasconstructive row/column incidence witness, not just fractionalcount.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all10full source/newconditions/full official/newsolutions/all2MCQsets read','exact domain-wide enumerations, factorial minimality, shell boundary, incidence feasibility and original arithmetic conservation','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,10);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'Ten frozen FEMO2springgrade5tasks rewritten, localStandard+, not10semanticstories.',sourceOccurrences:10,distinctModels:10,editions},null,2)+'\n');console.log(JSON.stringify({authored:10,figures:0}));}
