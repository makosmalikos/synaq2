import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='collection-algebra-gauge-remainders',sources={S:'0af1b4c8-e4a5-44fc-be2c-a84bb579f9d6',E:'5501ac47-8683-4d41-b8e0-f367faa6935c',R:'b20e44ff-fb29-4273-8b42-de067aeca247'};
export const SPECS=[
  [
    "S",
    4,
    "alg",
    "fraction-linear-system-ordered-pair",
    "Теңдеулер жүйесін шешіңіз: «((2 + 4 × y)/5) + ((x − 2)/5) = 8» және «((3 × x − 6)/10) + ((2 × y)/10) = (18/5)». Жауапта x пен y осы ретпен берілген.",
    "(8,8; 7,8)",
    "Біріншісін 5-ке көбейтсек, x + 4 × y = 40. Екіншісін 10-ға көбейтсек, 3 × x + 2 × y = 42. Бірінші теңдікті 3-ке көбейтіп, екіншісін азайтқанда 10 × y = 78, y = 7,8. Бұдан x = 40 − 31,2 = 8,8. Тексеру: 8,8 + 4 × 7,8 = 40 және 3 × 8,8 + 2 × 7,8 = 42.",
    [
      "(−2; 5)",
      "(6,4; 7,6)",
      "(9,3; 2,4)",
      "(8,8; 7,8)"
    ]
  ],
  [
    "E",
    4,
    "alg",
    "constant-denominator-proportion-quotient-domain",
    "y нөлден өзгеше және «x ÷ ((7/9) − (2 + (1/6))) = y ÷ (|−(3/4)| ÷ (9/10))» теңдігі орындалады. «(x/y)» мәнін табыңыз.",
    "−(1 + (2/3))",
    "Сол жақ тұрақты бөлім (7/9) − (13/6) = (−25/18). Оң жақ бөлім (3/4) ÷ (9/10) = (5/6). Екі тұрақты бөлім де нөл емес. Сондықтан (x/y) = (−25/18) ÷ (5/6) = (−5/3), яғни −(1 + (2/3)). y нөл емес деген шарт қатынасты анықтайды.",
    [
      "(3/8)",
      "−1,6",
      "(2 + (3/5))",
      "−(1 + (2/3))"
    ]
  ],
  [
    "R",
    23,
    "geo",
    "semicircle-gauge-whole-tick-fraction",
    "Жанармай көрсеткішінде 0 — бос, 1 — толық бак. Негізгі белгілердің аралықтары тең. Тілше көрсеткен толу деңгейін бөлшекпен жазыңыз.",
    "(7/10)",
    "Негізгі белгілер 0-ден 1-ге дейінгі шкаланы 10 тең аралыққа бөледі. Тілше нөлден жетінші аралықтың соңына дәл келіп тұр. Сондықтан толу деңгейі (7/10).",
    [
      "(15/7)",
      "(7/10)",
      "(4/5)",
      "(3/4)"
    ]
  ],
  [
    "R",
    24,
    "geo",
    "semicircle-gauge-half-tick-fraction",
    "Шкалада 0 — бос бак, 1 — толық бак. Негізгі белгілердің аралықтары тең. Тілше екі негізгі белгінің дәл ортасында тұр. Бактың қандай бөлігі толған?",
    "(5/16)",
    "Нөлден толыққа дейін 8 тең аралық бар. Тілше нөлден екінші және үшінші аралықтардың соңын көрсететін белгілердің дәл ортасында, яғни 2,5 аралықта тұр. Толу деңгейі 2,5 ÷ 8 = (5/16). Жақын белгіге дөңгелектеудің қажеті жоқ.",
    [
      "(5/16)",
      "(3/8)",
      "(5/8)",
      "(3/16)"
    ]
  ]
];
const fmt=n=>String(Math.round(n*10000)/10000);export const image=i=>`/figures/synaq-editions/ratio-gauge-${i}-native.svg`;
export function drawFigure(i){assert.ok([23,24].includes(i));const count=i===23?10:8,step=i===23?7:2.5;const point=(k,r)=>{const t=Math.PI*(1-k/count);return[fmt(180+r*Math.cos(t)),fmt(180-r*Math.sin(t))]};let ticks='';for(let k=0;k<=count;k++){const[a,b]=point(k,125),[c,d]=point(k,139);ticks+=`<line id="tick-${k}" x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#667aad" stroke-width="2.4" stroke-linecap="round"/>`;}const[px,py]=point(step,104);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 238" role="img" aria-labelledby="title"><title id="title">Жанармай деңгейінің тең аралықты шкаласы</title><rect width="360" height="238" rx="22" fill="#f3f7ff"/><text x="180" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" letter-spacing="1.5" fill="#596d9d">ЖАНАРМАЙ</text><path id="arc" d="M 50 180 A 130 130 0 0 1 310 180" fill="none" stroke="#c5d3f2" stroke-width="3"/>${ticks}<line id="pointer" x1="180" y1="180" x2="${px}" y2="${py}" stroke="#5168dc" stroke-width="4" stroke-linecap="round"/><circle id="hub" cx="180" cy="180" r="7" fill="#5168dc"/><g font-family="Arial, sans-serif" text-anchor="middle"><text id="zero" x="43" y="205" font-size="21" fill="#223a6a">0</text><text id="one" x="317" y="205" font-size="21" fill="#223a6a">1</text><text x="43" y="224" font-size="13" fill="#6c7e9e">Бос</text><text x="317" y="224" font-size="13" fill="#6c7e9e">Толық</text></g></svg>\n`;}
function row(s){const[w,n,topic,kind,statement,answer,solution,options]=s;return{editionId:`${name}-${w.toLowerCase()}-${n}`,modelId:name+'-'+kind,grade:6,topic,difficulty:'medium',minimumPlan:'pro',params:{work:w,number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${sources[w]}.json`,sourceId:String(n)}],sourceAnswerAvailability:options?'captured_mcq_key_cross_checked_with_full_official_solution':'not_captured_answer_recomputed_from_full_official_solution',adaptationChanges:['All4remaining full frozen/new conditions, full official/new solutions/all4MCQsets and2archived gauge rasters read. New linear system coefficients/constant fractions and full orderedpair checked, proportion quotient explicitly excludesy0, newnative exactequal-interval gauges replace source bitmap with10ticksat7and8ticksat2.5.','SourceE4omits y0domain although x/yasked; newcondition clarifies yneq0. SourceR23pointerrasterapproximate, official8/12intention is recorded without claimingexactpixelangle. Bothnativegauges independently decoded fromallactual ticks andpointer, not source trace. R24halfintervalprecision preserved. Nativefractions only.','Same root author separate exact computation no separatehumanreviewer. All4localStandard+only, not4newsemanticstories.'],editorialStatus:'awaiting_independent_computational_review',statement:statement+(options?'':' Жауапқа тек санды жазыңыз.'),answer,solution,...(options?{options}:{}),...(w==='R'?{image:image(n),figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image(n),import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-${s[0].toLowerCase()}-${s[1]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed full condition/target/solution/key/MCQ/source');return{answer:r.answer,checks:['all4full source/newconditions/solutions/MCQsets and2rasters read','exact original linear system and nonzero quotient domain plus actual native gauge tick and pointer decoding','same author not separate human reviewer; localStandard+']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){for(const i of[23,24])fs.writeFileSync(new URL('../../frontend/public'+image(i),import.meta.url),drawFigure(i));const editions=buildEditions();assert.equal(editions.length,4);editions.forEach(verifyEdition);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'Four remaining frozen algebra+gauge tasks rewritten, localStandard+, not4semanticstories.',sourceOccurrences:4,distinctModels:4,editions},null,2)+'\n');console.log(JSON.stringify({authored:4,figures:2}));}
