import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='bil14-final',source='519d9601-52f3-4921-a641-97727807c89a',fmt=n=>Number(n.toFixed(9)),polar=(o,r,a)=>[fmt(o[0]+r*Math.cos(a*Math.PI/180)),fmt(o[1]+r*Math.sin(a*Math.PI/180))];
const text=(id,x,y,t,size=16)=>`<text id="${id}" x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#365483">${t}</text>`;
const poly=(id,ps,fill='#d5e2f8')=>`<polygon id="${id}" points="${ps.map(p=>p.map(fmt).join(',')).join(' ')}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const line=(id,a,b)=>`<line id="${id}" x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}" stroke="#7294c5" stroke-width="1.6"/>`;
const arc=(id,c,r,a,b,sweep=1)=>`<path id="${id}" d="M ${polar(c,r,a).join(' ')} A ${r} ${r} 0 0 ${sweep} ${polar(c,r,b).join(' ')}" fill="none" stroke="#8967bf" stroke-width="1.6"/>`;
const circle=(id,x,y,r,fill='#fff')=>`<circle id="${id}" cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const rect=(id,x,y,w,h,fill='#d5e2f8',rx=0)=>`<rect id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
function frame(title,h,b){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${h}" role="img" aria-labelledby="title"><title id="title">${title}</title><rect width="360" height="${h}" rx="22" fill="#f5f8ff"/>${b}</svg>\n`;}
export function draw(n){
 if(n===31){let b='';for(const[k,x,y,w,h,values]of[[0,94,24,148,114,[9,6,8,12]],[1,266,24,148,114,[7,5,15,21]],[2,180,178,192,148,[10,4,'x',20]]]){const T=[x,y],L=[x-w/2,y+h],R=[x+w/2,y+h],ML=[x-w/4,y+h/2],MR=[x+w/4,y+h/2],BM=[x,y+h];b+=poly('outer-'+k,[T,L,R],'#e1ebff')+poly('middle-'+k,[ML,MR,BM],'#d7c8f4')+line('divider-left-'+k,ML,BM)+line('divider-right-'+k,MR,BM);for(const[j,tx,ty,v]of[[0,x,y+h/3,values[0]],[1,x-w/4,y+5*h/6,values[1]],[2,x+w/4,y+5*h/6,values[2]],[3,x,y+2*h/3,values[3]]])b+=text('value-'+k+'-'+j,tx,ty+6,v,20);}return frame('Үшбұрыштағы төрт санның байланысы',350,b);}
 if(n===36){return frame('Ақ ортақ бөлігі бар екі пішін',240,rect('square',25,45,120,120,'#d8c8f1')+rect('rectangle',85,105,240,60,'#c8def8')+rect('intersection',85,105,60,60,'#fff')+text('square-side',85,31,'10 см',18)+text('rectangle-width',210,191,'20 см',18)+text('rectangle-height',300,94,'5 см',18));}
 throw Error(n);
}
export const SPECS=[
  [
    31,
    "logic",
    "three-native-triangle-product-quotient-unknown-right",
    "Әр үшбұрышта ортадағы сан жоғарғы сан мен оң жақтағы санның көбейтіндісін сол жақтағы санға бөлгенге тең. Суреттегі x мәнін табыңыз.",
    "8",
    "Алғашқы үлгілер: 9 × 8 ÷ 6 = 12 және 7 × 15 ÷ 5 = 21. Соңғысында 10 × x ÷ 4 = 20. Демек x = 20 × 4 ÷ 10 = 8.",
    [
      "2",
      "7",
      "4",
      "8"
    ]
  ],
  [
    36,
    "geo",
    "native-square-rectangle-sum-exclusive-areas",
    "Суретте қабырғалары 5 см және 20 см тіктөртбұрыш пен қабырғасы 10 см шаршы берілген. Ақ ортақ бөліктің ауданы 25 см². Күлгін және көк бөліктер аудандарының қосындысын табыңыз.",
    "150 см²",
    "Әр пішіннің толық ауданы 100 см². Әрқайсысынан ортақ 25 см² бөлікті алып тастаймыз. Қосынды (100 − 25) + (100 − 25) = 150 см².",
    [
      "150 см²",
      "175 см²",
      "200 см²",
      "205 см²"
    ]
  ]
];
function row(s){const[n,topic,kind,statement,answer,solution,options]=s,image=[31,36].includes(n)?`/figures/synaq-editions/${name}-${n}-native.svg`:null;return{editionId:`${name}-bil-${n}`,modelId:`${name}-${kind}`,grade:6,topic,difficulty:'hard',minimumPlan:'pro',params:{work:'BIL14',number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${source}.json`,sourceId:String(n)}],sourceAnswerAvailability:'captured_official_visual_key_and_givens_reviewed_new_geometry_independently_recomputed',adaptationChanges:['Full source and rewritten conditions, official and new solutions and all choices read. Own native SVGs with changed dimensions, orientation and contour replace source artwork. Actual geometry independently recomputed; Standard+ only; no semantic uniqueness claim. Same author computational review, not another human reviewer.','New dimensions and native geometry retain the source mathematical method; all answers recomputed and signed separately.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,options,...(image?{image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-bil-${s[0]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed nativecorefullrow');return{answer:r.answer,checks:['allsource/newconditions solutions/options read','actualnativegeometry physicalgivens independentlychecked','localStandard+ nosemanticuniquenessclaim']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){for(const[n]of SPECS.filter(s=>[31,36].includes(s[0])))fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${n}-native.svg`,import.meta.url),draw(n));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'Last two BIL14 tasks: original native triangle arithmetic and square/rectangle intersection diagrams, local Standard+.',sourceOccurrences:2,distinctModels:2,editions},null,2)+'\n');console.log(JSON.stringify({authored:2,nativeFigures:2}));}
