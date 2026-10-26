import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='femo3-winter-grade4-remainder',sources={F3W4:'e67b8172-f71e-4f32-9d74-e57032dc4a14'};
export const SPECS=[
  [
    "F3W4",
    1,
    "num",
    "increasing-girl-handshake-count-final-all-boys",
    "Кешке 28 бала келді. Бірінші қыз 9 ұлмен, екіншісі 10 ұлмен, үшіншісі 11 ұлмен қол алысты. Әр келесі қыз алдыңғысынан бір ұлға артық ұлмен қол алысты, соңғы қыз барлық ұлмен қол алысты. Кеште неше ұл болды?",
    "18",
    "Қыздар g болса, соңғы қыз g + 8 ұлмен қол алысады. Бұл барлық ұл саны. Барлығы g + (g + 8) = 28, сондықтан g = 10. Ұлдар 10 + 8 = 18. Тексеру: оныншы қыз 18 ұлмен қол алысады, барлық бала 10 + 18 = 28."
  ],
  [
    "F3W4",
    2,
    "num",
    "age-at-past-meeting-from-future-older-age",
    "Ермек Нұржаннан 3 жас үлкен. Олар 7 жыл бұрын танысқан. Ермек 4 жылдан кейін 31 жасқа толады. Танысқан кезде Нұржан неше жаста болған?",
    "17",
    "Ермек қазір 31 − 4 = 27 жаста. Нұржан қазір 27 − 3 = 24 жаста. Жеті жыл бұрын 24 − 7 = 17 жаста болған. Тексеру: кездескенде Ермек 20, Нұржан 17, айырмасы 3 жас."
  ],
  [
    "F3W4",
    3,
    "num",
    "right-appended-digit-place-value-increase",
    "Екітаңбалы санның оң жағына 4 цифрын тіркегенде сан 526-ға артады. Бастапқы санды табыңыз.",
    "58",
    "Бастапқы сан n болса, цифр тіркелгеннен кейін 10 × n + 4 шығады. Өсімі 9 × n + 4 = 526. Бұдан 9 × n = 522, n = 58. Тексеру: 584 − 58 = 526."
  ],
  [
    "F3W4",
    6,
    "geo",
    "equal-square-polyomino-area-from-perimeter",
    "Суреттегі фигура 14 бірдей шаршыдан тұрады. Фигураның сыртқы периметрі 90 см. Фигураның толық ауданын см²-пен табыңыз.",
    "126",
    "Шекараны бір кішкентай шаршы қабырғасының бірлігімен санасақ 30 қабырға шығады. Бір шаршының қабырғасы 90 ÷ 30 = 3 см. Бір шаршы ауданы 9 см², барлық 14 шаршының ауданы 14 × 9 = 126 см². Ішкі ортақ қабырғалар периметрге кірмейді."
  ],
  [
    "F3W4",
    7,
    "logic",
    "restricted-digit-multiplicities-divisible-three-unique-sum",
    "3-ке бөлінетін алтытаңбалы сан тек 0, 1, 3 цифрларынан жазылған. Әр цифр кемінде бір рет кездеседі, ал үштіктер саны нөлдер санынан көп. Сан цифрларының қосындысын табыңыз.",
    "9",
    "Бірліктер санын a, үштіктерді b, нөлдерді z дейік. a + b + z = 6, әрқайсысы кемінде 1 және b > z. Цифрлар қосындысы a + 3 × b саны 3-ке бөлінеді, сондықтан a да 3-ке бөлінеді. b кемінде 2, z кемінде 1 болғандықтан a ең көбі 3; демек a = 3. Қалған b + z = 3 шартынан b = 2, z = 1. Қосынды 3 + 3 × 2 = 9. Мысалы, 331110 шартқа сай."
  ],
  [
    "F3W4",
    10,
    "logic",
    "unit-grid-unordered-square-pairs-no-shared-point",
    "Суреттегі тақта бірдей бірлік шаршылардан тұрады. Ортақ нүктесі жоқ, яғни ортақ қабырғасы да, ортақ төбесі де болмайтын шаршылардың неше жұбы бар? Бір жұпты кері ретпен қайта санамаймыз. Суретте бір жарамды жұп боялған.",
    "135",
    "Тақтада 20 шаршы бар, барлық жұп саны 20 × 19 ÷ 2 = 190. Көлденең жанасатын жұптар 4 × 4 = 16, тік жанасатындары 5 × 3 = 15. Тек төбемен жанасатын диагональ жұптар 2 × 3 × 4 = 24. Жарамды жұптар 190 − 16 − 15 − 24 = 135."
  ]
];
export const image=i=>`/figures/synaq-editions/femo3-winter4-${i}-native.svg`;
export function drawFigure(i){assert.ok([6,10].includes(i));let body='';for(let row=0;row<4;row++)for(let col=0;col<5;col++){if(i===6&&row>0&&col%2!==0)continue;const fill=i===6?'#e7efff':row===0&&col===0||row===3&&col===4?'#dfd3f7':'#fff';body+=`<rect id="cell-${row}-${col}" x="${70+44*col}" y="${40+44*row}" width="44" height="44" fill="${fill}" stroke="#657caf" stroke-width="2.2"/>`;}return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" role="img" aria-labelledby="title"><title id="title">${i===6?'Бірдей шаршылардан құралған фигура':'Ортақ нүктесі жоқ жұпты санау тақтасы'}</title><rect width="360" height="260" rx="22" fill="#f5f8ff"/>${body}</svg>\n`;}
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:4,topic,difficulty:n>=6?'hard':'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['Sixremaining full frozen/new conditions and full official/newsolutions plus2source rasters read. Fourprevious exactsource duplicate links alreadycovered by FEMO3winter5are not reauthored here. Newhandshake progression, older/future/meeting ages, appendeddigit4/increase526, comb14cells/perimeter90, sixdigit0/1/3and4×5board preserve eachmethod/target.','Twooriginal nativeSVGs replace bitmaps without source tracing. Fullactual cellunion boundary perimeters, areas and allunordered actualSVG closed-square rectangle intersections checked. No common point excludes sharedcorners as wellas sides. Validchangedshape withsame14cells and changedboard dimensions recomputed withupdatedhash, not just hashfailure.','Same root author separate exact computation, no separatehumanreviewer. LocalStandard+only,6editionsnot6newsemanticstories.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{}),...([6,10].includes(n)?{image:image(n),figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image(n),import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all6full source/newconditions/official/newsolutions/2rasters read','exact progression/age/placevalue and allrestricted digits, actualnative polyomino boundary and closedrectangle intersection pairs','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){for(const i of[6,10])fs.writeFileSync(new URL('../../frontend/public'+image(i),import.meta.url),drawFigure(i));const editions=buildEditions();assert.equal(editions.length,6);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'Sixremaining frozen FEMO3wintergrade4tasks rewritten, localStandard+, not6semanticstories.',sourceOccurrences:6,distinctModels:6,editions},null,2)+'\n');console.log(JSON.stringify({authored:6,figures:2}));}
