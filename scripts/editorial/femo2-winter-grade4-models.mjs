import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='femo2-winter-grade4',sources={F2W4:'99db4368-ec9a-4ae9-9e93-e3312e0aa8ed'};
export const SPECS=[
  [
    "F2W4",
    1,
    "num",
    "two-fruit-mass-balances-added-target-combination",
    "Үш өрік пен үш алманың массасы бес алмұрттың массасына тең. Бір өрік пен бес алманың массасы жеті алмұрттың массасына тең. Бір өрік пен екі алма неше алмұртпен теңеседі? Бір түрдегі жемістердің массалары бірдей.",
    "3",
    "Екі теңдікті қоссақ, төрт өрік пен сегіз алма он екі алмұртқа тең. Екі жақты төртке бөлгенде бір өрік пен екі алма үш алмұртқа тең болады."
  ],
  [
    "F2W4",
    2,
    "num",
    "grandmother-years-equal-grandchild-months-sum",
    "Айсәуленің әжесі неше жыл жаста болса, Айсәуле сонша ай жаста. Екеуінің жастарының қосындысы 78 жыл. Әжесі неше жаста?",
    "72",
    "Әженің жылмен жасы немеренің жылмен жасынан 12 есе көп. Барлығы 13 бірдей үлес 78 жылға тең. Немере 78 ÷ 13 = 6 жаста, әжесі 12 × 6 = 72 жаста. Тексеру: немере 72 айда, ал 72 + 6 = 78."
  ],
  [
    "F2W4",
    3,
    "num",
    "largest-of-consecutive-natural-block-given-sum",
    "Тізбектес бес натурал санның қосындысы 1260. Сол сандардың ең үлкенін табыңыз.",
    "254",
    "Ең кішісі n болса, қосынды 5 × n + 10 = 1260. Бұдан 5 × n = 1250, n = 250. Сандар 250, 251, 252, 253, 254; ең үлкені 254. Олардың қосындысы 1260."
  ],
  [
    "F2W4",
    4,
    "num",
    "parent-attendance-student-union-with-none-intersection",
    "Сыныптағы 36 оқушының 5-еуінің ата-анасы жиналысқа келмеді. 18 оқушының әкесі, 28 оқушының анасы келді. Әкесі де, анасы да келген оқушы нешеу?",
    "15",
    "Кемінде бір ата-анасы келген оқушылар 36 − 5 = 31. Екі тізімдегі жазба саны 18 + 28 = 46. Екеуіне де кіргендер 46 − 31 = 15. Тек әкесі келгендер 3, тек анасы келгендер 13; 3 + 13 + 15 + 5 = 36."
  ],
  [
    "F2W4",
    5,
    "logic",
    "two-digit-reversal-multiple-minus-offset",
    "«overline(ab)» екітаңбалы саны берілген. «overline(ba)» саны бастапқы санның 3 есесінен 16-ға кем. a және b — нөлден өзгеше цифрлар. Бастапқы санды табыңыз.",
    "26",
    "Шарт 10 × b + a = 3 × (10 × a + b) − 16 түрінде жазылады. Бұдан 7 × b = 29 × a − 16. a = 2 болғанда b = 6 шығады, ал басқа нөл емес цифрлар жарамайды. Сан 26. Тексеру: 3 × 26 − 16 = 62."
  ],
  [
    "F2W4",
    6,
    "geo",
    "grid-shaded-polygon-area-from-cell-area",
    "Суреттегі әр кішкентай шаршының ауданы 2 см². Боялған көпбұрыштың ауданын см²-пен табыңыз.",
    "36",
    "Тордың толық ауданы 20 кішкентай шаршы. Төрт бұрышта бір шаршының жартысынан ақ бөлік бар, олардың барлығы екі шаршыға тең. Боялған бөлік 20 − 2 = 18 шаршыға тең. Әр шаршы 2 см² болғандықтан аудан 18 × 2 = 36 см²."
  ],
  [
    "F2W4",
    7,
    "num",
    "equal-cake-slices-one-each-fraction-remains",
    "Мерекелік торт 20 тең бөлікке бөлінді. Әр қонақ бір бөліктен алған соң торттың (1/4) бөлігі қалды. Торттан неше қонақ алды?",
    "15",
    "Төрттен бірі 20 ÷ 4 = 5 бөлік, бұл — қалғаны. Алынған бөліктер 20 − 5 = 15. Әр қонақ бір бөліктен алғандықтан, қонақ саны 15."
  ],
  [
    "F2W4",
    8,
    "logic",
    "triangles-from-points-on-two-parallel-lines",
    "Суреттегі екі параллель түзуде белгіленген нүктелер берілген. Төбелері осы нүктелерде болатын неше үшбұрыш салуға болады? Бір үштікті төбелерінің ретіне қарай қайта санамаймыз.",
    "45",
    "Жоғарғы түзуде 3, төменгісінде 5 нүкте бар. Жоғарыдан екі, төменнен бір нүкте алу 3 × 5 = 15 тәсіл береді. Жоғарыдан бір, төменнен екі нүкте алу 3 × 10 = 30 тәсіл береді. Бір түзудегі үш нүкте үшбұрыш емес. Барлығы 15 + 30 = 45."
  ],
  [
    "F2W4",
    9,
    "logic",
    "paper-grid-shared-corners-minimum-packed-rows",
    "Бірдей тіктөртбұрыш парақтарды тор түрінде орналастырамыз. Әр бұрышты кнопка ұстайды, бір жерге сәйкес келген бұрыштар бір кнопкамен бекітіледі. Суреттегі 4 параққа 9 кнопка керек. 18 парақты ұзындығы бірдей толық қатарларға, қажет болса соңғы бір қысқа қатарға орналастырамыз; қысқа қатар сол жақтан басталады. Ең аз неше кнопка керек?",
    "28",
    "Осындай орналасуда кнопка саны парақ санына қатар санын, баған санын және 1-ді қосқанға тең. Қатар мен баған санының қосындысы 8-ден аспаса, ең көбі 4 × 4 = 16 парақ сыяды. Сондықтан 18 парақ үшін қосынды кемінде 9, кнопка кемінде 18 + 9 + 1 = 28. Бұл санға жетуге болады: 3 қатар, 6 баған жасағанда 4 × 7 = 28 кнопка керек."
  ]
];
export const image=i=>`/figures/synaq-editions/femo2-winter4-${i}-native.svg`;
export function drawFigure(i){assert.ok([6,8,9].includes(i));let body='',height=270;
if(i===6){body='<polygon id="shade" points="114,40 246,40 290,84 290,172 246,216 114,216 70,172 70,84" fill="#e0d3f8" stroke="#7b6eae" stroke-width="1.5"/>';for(let r=0;r<4;r++)for(let c=0;c<5;c++)body+=`<rect id="grid-${r}-${c}" x="${70+44*c}" y="${40+44*r}" width="44" height="44" fill="none" stroke="#8a96b7" stroke-width="1.5"/>`;}
else if(i===8){height=235;for(const[name,y,xs]of[['top',70,[80,180,280]],['bottom',165,[50,115,180,245,310]]]){body+=`<line id="line-${name}" x1="20" y1="${y}" x2="340" y2="${y}" stroke="#9caccd" stroke-width="2"/>`;for(let k=0;k<xs.length;k++)body+=`<circle id="point-${name}-${k}" cx="${xs[k]}" cy="${y}" r="4.5" fill="#5267ce"/>`;}}
else{height=260;for(let r=0;r<2;r++)for(let c=0;c<2;c++)body+=`<rect id="paper-${r}-${c}" x="${92+88*c}" y="${46+68*r}" width="88" height="68" fill="#fff" stroke="#8193ba" stroke-width="2.3"/>`;for(let r=0;r<3;r++)for(let c=0;c<3;c++)body+=`<circle id="pin-${r}-${c}" cx="${92+88*c}" cy="${46+68*r}" r="4.8" fill="#5264cb"/>`;body+='<text id="example-caption" x="180" y="221" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#3c548d">4 парақ · 9 кнопка</text>';}
return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" role="img" aria-labelledby="title"><title id="title">${{6:'Тордағы боялған көпбұрыш',8:'Екі параллель түзудегі белгіленген нүктелер',9:'Бұрыштарда ортақ бекіткіштері бар парақтар'}[i]}</title><rect width="360" height="${height}" rx="22" fill="#f5f8ff"/>${body}</svg>\n`;}
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:4,topic,difficulty:[5,6,8,9].includes(n)?'hard':'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All9full frozen/new conditions and full official/new solutions/3archivedrasters read. Newfruitmass balances, year/month78, consecutive5sum1260, student-basedparent counts36/5/18/28, reversedigits3multipleminus16, newoctagon5×4unitarea2, cake20with1/4remaining, 3+5parallelpoints and18paperpins replace originalnumbers/words/geometries. All askedtargets/methods retained.','Threeoriginal nativeSVGs replace bitmaps without source tracing. Actualpolygoncellclipping+shoelace, alltriangletriples and allsharedpaper corners checked. Sourceparents wording countsphysicalparents while assumesonefamilyperchild; newexplicitcountschildren avoidssiblingsambiguity. Sourcepaper incomplete-row placement notfullyspecified; newfullrows+leftalignedlastpartial stated, allallowedwidths andlowerboundchecked.','Same root author separate exact computation, no separatehumanreviewer. LocalStandard+only;9editionsnot9claimednewmeanings.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{}),...([6,8,9].includes(n)?{image:image(n),figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image(n),import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all9full source/newconditions/full official/newsolutions/3rasters read','exact nativepolygonallcellclipping, allactual triangletriples, sharedcornerlayoutminimum and fulloriginal arithmetic/digit domains','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){for(const i of[6,8,9])fs.writeFileSync(new URL('../../frontend/public'+image(i),import.meta.url),drawFigure(i));const editions=buildEditions();assert.equal(editions.length,9);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'Nine frozen FEMO2wintergrade4tasks rewritten, localStandard+, not9semanticstories.',sourceOccurrences:9,distinctModels:9,editions},null,2)+'\n');console.log(JSON.stringify({authored:9,figures:3}));}
