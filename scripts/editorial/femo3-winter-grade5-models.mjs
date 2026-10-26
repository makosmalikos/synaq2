import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='femo3-winter-grade5',sources={F3W5:'0737eb8c-05cf-4d46-b9d1-e6a932776346'};
export const SPECS=[
  [
    "F3W5",
    1,
    "num",
    "successive-spending-fractions-reverse-original",
    "Әмина ақшасының (1/3) бөлігіне бояулар алды. Қалғанының (3/4) бөлігіне қылқаламдар сатып алды. Соңында қалған 3000 теңгесі сурет дәптеріне дәл жетті. Бастапқыда неше теңгесі болған?",
    "18000",
    "Бірінші сатып алудан соң ақшаның (2/3) бөлігі қалды. Одан соң сол қалдықтың (1/4) бөлігі қалды. Бүкіл ақшаның қалған үлесі (2/3) × (1/4) = (1/6). Сондықтан бастапқы ақша 3000 × 6 = 18000 теңге. Тексеру: 18000 → 12000 → 3000."
  ],
  [
    "F3W5",
    2,
    "logic",
    "rectangular-lineup-position-and-side-count",
    "Оқушылар әр қатарында адам саны бірдей тіктөртбұрыш сапқа тұрды. Данияр өз колоннасында алдынан 11-ші, артынан 14-ші. Өз қатарында оның сол жағында 12, оң жағында 16 оқушы бар. Саптағы барлық оқушы санын табыңыз.",
    "696",
    "Колоннада 11 + 14 − 1 = 24 оқушы бар: Данияр екі рет саналмауы керек. Бір қатарда 12 + 1 + 16 = 29 оқушы бар. Саптың толық саны 24 × 29 = 696."
  ],
  [
    "F3W5",
    3,
    "geo",
    "rectangle-complement-two-white-squares",
    "Сызбадағы ABCD тіктөртбұрышында ақ AMND және PQRS шаршылары орналасқан. Олардың аудандары тиісінше 36 см² және 9 см². PQRS шаршысының сол және оң қабырғалары тіктөртбұрыштың оң жақ жолағының шеттерінде жатыр. Екі күлгін бөліктің аудандарының қосындысын см²-пен табыңыз.",
    "9",
    "Үлкен шаршы қабырғасы 6 см, кіші шаршынікі 3 см. Оң жолақтың биіктігі 6 см, ені кіші шаршы қабырғасына тең 3 см. Жолақ ауданы 6 × 3 = 18 см². Одан ақ шаршының 9 см² ауданын алсақ, 18 − 9 = 9 см² қалады."
  ],
  [
    "F3W5",
    4,
    "num",
    "two-drink-price-system-difference",
    "Кафеде 1 кесе шай мен 3 кесе кофе 9600 теңге, ал 2 кесе шай мен 1 кесе кофе 6200 теңге тұрады. Кофе шайдан неше теңге қымбат?",
    "800",
    "Екінші сатып алуды 3 есе алсақ, 6 кесе шай мен 3 кесе кофе 18600 теңге. Бірінші сатып алуды азайтқанда 5 кесе шай 9000 теңге, бір шай 1800 теңге болады. Бір кофе 6200 − 2 × 1800 = 2600 теңге. Айырмасы 2600 − 1800 = 800 теңге."
  ],
  [
    "F3W5",
    5,
    "num",
    "two-balance-ratios-target-cylinder-in-cubes",
    "Бір түрдегі денелердің массалары бірдей. 4 шардың массасы 3 цилиндрге, ал 7 шардың массасы 8 кубқа тең. 21 цилиндрдің массасы неше кубтың массасына тең?",
    "32",
    "4 шар 3 цилиндрге тең болса, 21 цилиндр 28 шарға тең. 7 шар 8 кубқа тең болғандықтан, 28 шар 32 кубқа тең. Демек 21 цилиндрдің массасы 32 кубтың массасындай."
  ],
  [
    "F3W5",
    6,
    "num",
    "six-family-ages-linear-relations-grandfather-target",
    "Ата, әже, әке, ана, ұл және қыздың жастарының қосындысы 308. Ата әжеден 4 жас, әке анадан 4 жас, ұл қыздан 4 жас үлкен. Әке қызынан 2 есе үлкен, ал қыз атасынан 3 есе кіші. Атаның жасын табыңыз.",
    "78",
    "Қыздың жасы d болсын. Жастар: d, d + 4, 2 × d, 2 × d − 4, 3 × d, 3 × d − 4. Қосындысы 12 × d − 4 = 308, сондықтан d = 26. Ата 3 × 26 = 78 жаста. Тексеру: 26 + 30 + 52 + 48 + 78 + 74 = 308."
  ],
  [
    "F3W5",
    7,
    "logic",
    "calendar-date-restricted-digits-valid-month-lengths",
    "2030 жылдың күндерін күн.ай.жыл пішімінде жазамыз: күн мен ай міндетті түрде екі таңбамен, қажет болса алдынан нөл қойылады. Жазбадағы барлық цифр тек 0, 2, 3 жиынынан алынатын неше нақты күн бар?",
    "11",
    "2030 жылының цифрлары шартқа сай. Рұқсат етілген айлар 02 және 03. Ақпанда жарамды күндер 02, 03, 20, 22, 23 — бесеу. Наурызда осы бесеуіне 30 қосылады — алтау. 00 мен 32 күн емес, ақпанда 30-күн жоқ. Барлығы 5 + 6 = 11 күн."
  ],
  [
    "F3W5",
    8,
    "logic",
    "two-missing-code-digits-divisible-by-three-and-five",
    "Сегізтаңбалы код 3-ке де, 5-ке де бөлінеді. Оның алғашқы алты цифры ретімен 6, 3, 7, 0, 2, 8 екені белгілі. Қалған екі цифрын тексеріп табу үшін ең нашар жағдайда неше түрлі толық кодты тексеру қажет? Бір кодты қайта тексермейді.",
    "6",
    "Белгілі цифрлардың қосындысы 26. Соңғы цифр 0 не 5 болуы керек. Соңғысы 0 болса, жетінші цифр 1, 4, 7 бола алады. Соңғысы 5 болса, қосынды 31-ге жетеді, жетінші цифр 2, 5, 8 болуы керек. Екі топта үштен, барлығы 6 ықтимал код бар."
  ],
  [
    "F3W5",
    9,
    "logic",
    "choose-three-clubs-one-incompatible-pair",
    "Мектепте 7 үйірме бар. Айдос дәл 3 үйірме таңдайды. Белгілі екі үйірме бір уақытта өтеді, сондықтан екеуін бірге алуға болмайды; екеуін де алмауға болады. Қалған үйірмелердің уақыттары бір-бірімен қайшы келмейді. Неше түрлі таңдау бар?",
    "30",
    "Барлық үштіктер саны 7 × 6 × 5 ÷ 6 = 35. Тыйым салынған екі үйірме қатар алынғанда үшінші үйірмеге қалған 5-тің бірі келеді, сондықтан 5 үштік жарамсыз. Жарамдысы 35 − 5 = 30. Таңдалу реті есептелмейді."
  ],
  [
    "F3W5",
    10,
    "logic",
    "fibonacci-modular-pair-period-count",
    "1, 1, 2, 3, 5, 8, 13, 21, … тізбегінде үшінші мүшеден бастап әр мүше алдындағы екеуінің қосындысы. Алғашқы 2047 мүшенің нешеуі 8-ге бөлінеді?",
    "341",
    "8-ге бөлгендегі алғашқы он екі қалдық: 1, 1, 2, 3, 5, 0, 5, 5, 2, 7, 1, 0. Келесі екі қалдық қайтадан 1, 1, сондықтан осы он екілік қайталанады. Әр толық топта екі нөл бар. 2047 = 12 × 170 + 7: толық топтарда 340 нөл, соңғы жетіліктің алтыншы орнында тағы бір нөл. Барлығы 341."
  ]
];
export const figurePath='/figures/synaq-editions/femo3-winter5-two-squares-native.svg';
export function drawFigure(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 270" role="img" aria-labelledby="title"><title id="title">Екі ақ шаршы мен күлгін қалдық бөліктер</title><rect width="360" height="270" rx="22" fill="#f5f8ff"/><rect id="big-square" x="40" y="45" width="180" height="180" fill="#fff"/><rect id="right-strip" x="220" y="45" width="90" height="180" fill="#e3d7f7"/><rect id="small-square" x="220" y="90" width="90" height="90" fill="#fff" stroke="#7161a9" stroke-width="2.2"/><rect id="outline" x="40" y="45" width="270" height="180" fill="none" stroke="#4e659e" stroke-width="2.5"/><line id="divider" x1="220" y1="45" x2="220" y2="225" stroke="#4e659e" stroke-width="2.5"/><g font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#2d4270"><text id="A" x="40" y="248">A</text><text id="M" x="220" y="248">M</text><text id="B" x="310" y="248">B</text><text id="D" x="40" y="31">D</text><text id="N" x="220" y="31">N</text><text id="C" x="310" y="31">C</text><text id="P" x="205" y="96">P</text><text id="Q" x="205" y="186">Q</text><text id="S" x="326" y="96">S</text><text id="R" x="326" y="186">R</text></g></svg>\n`;}
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:5,topic,difficulty:n>=7?'hard':'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All10full frozen/new conditions and full official/new solutions read. Sourceopenanswer keys independently recomputed from original conditions. New Kazakh stories/numbers preserve successive fraction spending, rectangular ranks, complementary square areas, elimination difference, chained massratios, sixages, fullcalendar digitcount, bounded missingdigits, incompatible-pair combinations and modular recurrence periods.','Newrectangle nativeSVG is original, sourcearchivedPNG inspected but not reused/traced. Sourceclub wording permits ambiguity exactlyone versus atmostone; newwording explicitly matches officialatmostone model, including neither. Newcalendar2030anddigits0/2/3requiresactualmonthlength checks, not invalid rectangular product. FullFibonacci pairperiod validated thenall2047exactterms crosschecked.','Same root author separately recomputes, no separatehumanreviewer. Standard+localonly,10editions not10claimednewsemanticstories.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{}),...(n===3?{image:figurePath,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+figurePath,import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all10full source/new conditions/full official/newsolutions/onearchivedraster read','exact allcalendar dates/missingcode options/clubsubsets/fullrecurrence and original native square geometry plus arithmetic conservation','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){fs.writeFileSync(new URL('../../frontend/public'+figurePath,import.meta.url),drawFigure());const editions=buildEditions();assert.equal(editions.length,10);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'Ten frozen FEMO3wintergrade5tasks rewritten, localStandard+, not10semanticstories.',sourceOccurrences:10,distinctModels:10,editions},null,2)+'\n');console.log(JSON.stringify({authored:10,figures:1}));}
