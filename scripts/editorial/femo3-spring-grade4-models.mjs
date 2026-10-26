import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='femo3-spring-grade4',sources={F3S4:'0de75f40-4c47-4154-b2d0-49f2d3040ffd'};
export const SPECS=[
  [
    "F3S4",
    1,
    "logic",
    "maximal-distinct-seven-digit-two-threshold-counts",
    "Жетітаңбалы натурал санның цифрлары әртүрлі. Дәл бес цифры 7-ден артық емес, дәл төрт цифры 4-тен үлкен. Осындай сандардың ең үлкенін табыңыз.",
    "9876432",
    "7-ден үлкен екі цифр міндетті түрде 8 және 9. 4-тен үлкендер саны төрт болғандықтан, 5, 6, 7 ішінен тағы екеуін алу керек: ең үлкендері 7 мен 6. Қалған үш цифр 4-тен аспайды, олардың ең үлкендері 4, 3, 2. Барлығын кему ретімен жазсақ 9876432 шығады."
  ],
  [
    "F3S4",
    2,
    "num",
    "two-consecutive-story-pages-first-index",
    "Динара оқыған әңгіме қатар тұрған екі бетті толық алады. Осы екі беттің нөмірлерінің қосындысы 319. Әңгіме нешінші беттен басталған?",
    "159",
    "Бірінші бет n болса, келесісі n + 1. Қосынды 2 × n + 1 = 319. Бұдан 2 × n = 318, n = 159. Тексеру: 159 + 160 = 319."
  ],
  [
    "F3S4",
    3,
    "logic",
    "circular-knights-liars-opposite-neighbor-types",
    "Дөңгелек үстелде 12 адам отыр. Әрқайсысы не әрқашан шындық айтатын рыцарь, не әрқашан өтірік айтатын өтірікші. Әр адам: «Екі көршімнің бірі — рыцарь, екіншісі — өтірікші», — деді. Барлығы бірдей өтірікші емес. Неше рыцарь бар?",
    "8",
    "Рыцарьдың екі көршісі әртүрлі, сондықтан рыцарьлар дәл екеуден қатар отырады. Жұптың жанындағы өтірікшінің бір көршісі рыцарь; оның сөзі жалған болуы үшін екінші көршісі де рыцарь болуы керек. Отыру реті екі рыцарь, бір өтірікші болып қайталанады. 12 адам төрт осындай үштікті құрайды, рыцарь саны 4 × 2 = 8."
  ],
  [
    "F3S4",
    4,
    "num",
    "paired-desks-same-sex-student-count-boys-total",
    "34 оқушы 17 екіорындық партаға толық отырды. 16 ұлдың әрқайсысының парталасы — ұл, 8 қыздың әрқайсысының парталасы — қыз. Қалған парталардың әрқайсысында бір ұл мен бір қыз отыр. Сыныпта барлығы неше ұл бар?",
    "21",
    "Екі ұлдан отырған парталар 16 ÷ 2 = 8, екі қыздан отырғандары 8 ÷ 2 = 4. Аралас парталар 17 − 8 − 4 = 5. Оларда бес ұл бар, сондықтан барлық ұл саны 16 + 5 = 21. Қыздар 8 + 5 = 13, барлығы 34."
  ],
  [
    "F3S4",
    5,
    "geo",
    "rectangle-one-dimension-area-factor-perimeter-change",
    "Тіктөртбұрыштың бір бағыттағы қарама-қарсы екі қабырғасын ұзартқанда екінші өлшемі өзгермеді. Ауданы 3 есе, периметрі 50 см-ден 82 см-ге артты. Бастапқы екі өлшемін табыңыз.",
    "8 см және 17 см",
    "Ұзартылған өлшем a, өзгермегені b болсын. Аудан үш есе артса, жаңа өлшем 3 × a. Периметр айырмасы 2 × (3 × a + b) − 2 × (a + b) = 4 × a. Сондықтан 4 × a = 32, a = 8. Бастапқы жарты периметр 25, b = 25 − 8 = 17. Жаңа өлшемдер 24 және 17; периметрі 82, ауданы бастапқыдан үш есе.",
    [
      "24 см және 17 см",
      "10 см және 15 см",
      "8 см және 17 см",
      "5 см және 20 см"
    ]
  ],
  [
    "F3S4",
    6,
    "logic",
    "opaque-overlap-discs-order-to-color",
    "Сызбадағы әр әріп бір мөлдір емес дискіні белгілейді. Көк диск қызыл дисктің үстінде, бірақ қалған үшеуінің астында. Сары диск жасыл дисктің үстінде, бірақ күлгін дисктің астында. N әрпі тұрған диск қандай түсті?",
    "Жасыл",
    "Түстер төменнен жоғары қарай: қызыл, көк, жасыл, сары, күлгін. Сызбадағы жабылулар дискілердің төменнен жоғары ретін L, M, N, P, Q деп береді. N — төменнен үшінші, сондықтан оның түсі жасыл.",
    [
      "Күлгін",
      "Жасыл",
      "Сары",
      "Көк"
    ]
  ],
  [
    "F3S4",
    7,
    "num",
    "two-tree-populations-removal-planting-equality",
    "Бақтағы алма ағаштары алмұрт ағаштарынан 4 есе көп. 14 алма ағашын алып, 10 алмұрт ағашын отырғызғаннан кейін екі түрдің саны теңесті. Бастапқыда барлығы неше ағаш болған?",
    "40",
    "Алмұрт x болса, алма 4 × x. Өзгерістен кейін 4 × x − 14 = x + 10. Бұдан 3 × x = 24, x = 8. Бастапқы алма 32, барлығы 32 + 8 = 40 ағаш. Соңында әр түрден 18 ағаш қалды."
  ],
  [
    "F3S4",
    8,
    "logic",
    "minimal-distinct-natural-sum-any-four-product-even",
    "9 әртүрлі оң натурал санның кез келген төртеуінің көбейтіндісі жұп, ал тоғыз санның қосындысы тақ. Осы қосындының ең кіші мүмкін мәнін табыңыз.",
    "51",
    "Төрт тақ сан алуға болмайды, сондықтан тақ сандар ең көбі үшеу. Қосынды тақ болуы үшін олардың саны бір немесе үш. Үш тақ санды алғанда ең кішілері 1, 3, 5; алты жұп сан 2, 4, 6, 8, 10, 12. Қосынды 9 + 42 = 51. Бір ғана тақ сан болса, ең аз қосынды 1 + 2 + 4 + 6 + 8 + 10 + 12 + 14 + 16 = 73. Демек ең кішісі 51."
  ],
  [
    "F3S4",
    9,
    "alg",
    "overlapping-triple-products-outer-target-identity",
    "«P × Q × R = 42», «Q × R × S = 126» және «R × S × T = 252» екені белгілі. «P × R × T» көбейтіндісін табыңыз.",
    "84",
    "Бірінші және үшінші теңдіктерді көбейтсек, (P × R × T) × (Q × R × S) = 42 × 252. Екінші көбейтінді 126 болғандықтан, ізделетіні 42 × 252 ÷ 126 = 84. 126 нөл емес, сондықтан бөлуге болады."
  ],
  [
    "F3S4",
    10,
    "logic",
    "grid-streets-shortest-closed-cover-parity-eulerization",
    "Көшелер 3 × 3 шаршы тор құрайды. Әр кішкентай шаршы қабырғасының ұзындығы сызбада берілген, барлық көше кесінділері бірдей. Тазалаушы P нүктесінен шығып, барлық көшені толық өтіп, P-ге қайтады. Мүмкін болатын ең қысқа жол неше метр?",
    "5040",
    "Торда 24 көше кесіндісі бар. Шекарадағы бұрыш емес сегіз қиылыстың әрқайсысында үш көше тоғысады. Тұйық жүрісте кіріп-шығулар жұп болуы үшін кемінде төрт кесіндіні қайталау қажет. Әр сыртқы қабырғадағы екі ортаңғы қиылыстың арасындағы кесіндіні қайталау осыған жеткілікті. Сондықтан ең аз жүріс 24 + 4 = 28 кесінді, қашықтық 28 × 180 = 5040 м."
  ]
];
export const image=i=>`/figures/synaq-editions/femo3-spring4-${i}-native.svg`;
export function drawFigure(i){assert.ok([6,10].includes(i));let body='',height=300;
if(i===6){for(const[l,x,y]of[['L',95,185],['M',80,100],['N',165,75],['P',250,110],['Q',245,200]])body+=`<g id="disc-${l}"><circle id="circle-${l}" cx="${x}" cy="${y}" r="70" fill="#fff" stroke="#6276a7" stroke-width="2.8"/><text id="label-${l}" x="${x}" y="${y+7}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#253e71">${l}</text></g>`;}
else{height=350;for(let row=0;row<4;row++)for(let col=0;col<3;col++)body+=`<line id="edge-h-${row}-${col}" x1="${63+78*col}" y1="${42+78*row}" x2="${141+78*col}" y2="${42+78*row}" stroke="#617cae" stroke-width="3"/>`;for(let col=0;col<4;col++)for(let row=0;row<3;row++)body+=`<line id="edge-v-${row}-${col}" x1="${63+78*col}" y1="${42+78*row}" x2="${63+78*col}" y2="${120+78*row}" stroke="#617cae" stroke-width="3"/>`;body+='<circle id="start" cx="63" cy="276" r="6" fill="#5366d8"/><text id="start-label" x="42" y="293" font-family="Arial, sans-serif" font-size="21" fill="#324e82">P</text><text id="unit" x="102" y="311" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="#657da8">180 м</text>';}
return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">${i===6?'Беттескен бес диск':'Тең көше кесінділерінің торы'}</title><rect width="360" height="${height}" rx="22" fill="#f5f8ff"/>${body}</svg>\n`;}
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:4,topic,difficulty:[1,3,6,8,10].includes(n)?'hard':'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All10full frozen/new conditions, completeofficial/new solutions/all2MCQsets and2archivedrasters read. Newdigit thresholds, pages, circular residents, desks, rectanglefactor/perimeters, color/letterorders, treecounts, parityminimum, variableproducts and roadunit preserveeachskill/target/difficulty. Fullnumerical and universal proofs separately checked.','Two new nativeSVGs replace originalmonochrome overlap/grid bitmaps without tracing. Allvisiblejunctions determineunique totaldiscorder, colorconstraints separately determineunique colororder. Actualstreetgraph decoded, optimal oddvertexmatching lowerbound matched by fullEulerwalk through everyedge endingatstart. NativeMathMLonly.','Same root author separately computes, no separatehumanreviewer. LocalStandard+10editions not10claimednewsemanticstories.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{}),...([6,10].includes(n)?{image:image(n),figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image(n),import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all10full source/newconditions/full official/newsolutions/all2MCQsets/2rasters read','exact allmaximaldigitsets/alltruthassignments/paritycases, nativeoverlap order, graphmatchingandEulerization plus arithmetic and universalproduct identity','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){for(const i of[6,10])fs.writeFileSync(new URL('../../frontend/public'+image(i),import.meta.url),drawFigure(i));const editions=buildEditions();assert.equal(editions.length,10);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'Ten frozen FEMO3springgrade4tasks rewritten, localStandard+, not10semanticstories.',sourceOccurrences:10,distinctModels:10,editions},null,2)+'\n');console.log(JSON.stringify({authored:10,figures:2}));}
