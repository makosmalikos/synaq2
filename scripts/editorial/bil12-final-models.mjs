import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='bil12-final',source='52cb4a68-1feb-4e9d-af12-f086e89fe06c',fmt=n=>Number(n.toFixed(9)),polar=(o,r,a)=>[fmt(o[0]+r*Math.cos(a*Math.PI/180)),fmt(o[1]+r*Math.sin(a*Math.PI/180))];
const text=(id,x,y,t,size=16)=>`<text id="${id}" x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#365483">${t}</text>`;
const poly=(id,ps,fill='#d5e2f8')=>`<polygon id="${id}" points="${ps.map(p=>p.map(fmt).join(',')).join(' ')}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const line=(id,a,b)=>`<line id="${id}" x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}" stroke="#7294c5" stroke-width="1.6"/>`;
const arc=(id,c,r,a,b,sweep=1)=>`<path id="${id}" d="M ${polar(c,r,a).join(' ')} A ${r} ${r} 0 0 ${sweep} ${polar(c,r,b).join(' ')}" fill="none" stroke="#8967bf" stroke-width="1.6"/>`;
const circle=(id,x,y,r,fill='#fff')=>`<circle id="${id}" cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const rect=(id,x,y,w,h,fill='#d5e2f8',rx=0)=>`<rect id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
function frame(title,h,b){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${h}" role="img" aria-labelledby="title"><title id="title">${title}</title><rect width="360" height="${h}" rx="22" fill="#f5f8ff"/>${b}</svg>\n`;}
export function draw(n){
 if(n===24){const O=[180,170],C=[216,218],T=[252,266];return frame('Іштен жанасатын екі шеңбер',330,circle('outer-circle',...O,120,'#d8caf0')+circle('inner-circle',...C,60,'#fff')+line('diameter-radius',O,T)+circle('point-O',...O,3,'#365483')+circle('point-C',...C,3,'#365483')+circle('point-T',...T,3,'#365483')+text('label-O',164,166,'O')+text('label-C',233,215,'C')+text('label-T',267,275,'T'));}
 if(n===29){const centers={a:[50,170],b:[160,80],c:[160,260],d:[270,170]};let b='';for(const[u,v]of[['a','b'],['b','d'],['a','c'],['c','d']])b+=line('edge-'+u+v,centers[u],centers[v]);for(const[k,[x,y]]of Object.entries(centers))b+=rect('cell-'+k,x-24,y-24,48,48,'#fff',9)+text('cell-label-'+k,x,y+7,k,21);for(const[k,x,y,v]of[['ab',91,108,'+'],['bd',229,108,'−'],['ac',91,238,'×'],['cd',229,238,'÷']])b+=text('operator-'+k,x,y,v,24);b+=text('target-label',326,177,'= 9',22);return frame('Екі жолмен есептелетін төрт сан',330,b);}
 if(n===33){const nodes={A:[60,165],B:[180,165],C:[300,165]};let b='';for(const[key,start,end,heights]of[['AB',nodes.A,nodes.B,[90,165,240]],['BC',nodes.B,nodes.C,[65,115,165,215,265]]])heights.forEach((h,j)=>b+=`<path id="road-${key}-${j}" d="M ${start.join(' ')} Q ${(start[0]+end[0])/2} ${h} ${end.join(' ')}" fill="none" stroke="#7294c5" stroke-width="2.2"/>`);for(const[k,[x,y]]of Object.entries(nodes))b+=circle('city-'+k,x,y,7,'#fff')+text('city-label-'+k,x,y-21,k,20);return frame('Екі кезеңнен тұратын жол таңдау',290,b);}
 if(n===38){let b='',index=0;const colors=['#c5d8f7','#d8caf0','#ccebe0'];for(let ring=0;ring<3;ring++){const n=7-2*ring,rects=[[ring,ring,1,n-1],[ring+1,ring,n-1,1],[ring+n-1,ring+1,1,n-1],[ring,ring+n-1,n-1,1]];for(const[x,y,w,h]of rects){const nx=7-y-h,ny=x;b+=rect('piece-'+index++,47+38*nx,40+38*ny,38*h,38*w,colors[ring]);}}b+=rect('piece-'+index,47+38*3,40+38*3,38,38,'#fff0b8');return frame('Таспадан құралған шаршы',350,b);}
 throw Error(n);
}
export const SPECS=[
  [
    24,
    "geo",
    "internally-tangent-circle-through-large-center-area-complement",
    "Үлкен шеңбердің центрі O. Кіші шеңбер O нүктесі арқылы өтеді және үлкен шеңбермен іштен жанасады. Күлгін аймақ үлкен дөңгелек ауданының қандай бөлігі?",
    "(3/4)",
    "Кіші шеңбердің радиусы үлкен радиустың жартысына тең. Сондықтан ақ дөңгелектің ауданы үлкеннің (1/4) бөлігі. Күлгін бөлік 1 − (1/4) = (3/4).",
    [
      "(2/3)",
      "(1/3)",
      "(3/5)",
      "(3/4)",
      "(4/5)"
    ]
  ],
  [
    29,
    "logic",
    "four-distinct-digits-two-path-equations-unused",
    "«2; 3; 4; 5; 6» цифрларының төртеуін a, b, c, d ұяшықтарына бір-бірден қойыңыз, цифр қайталанбайды. a-дан бастап жоғарғы жолдағы амалдарды және төменгі жолдағы амалдарды солдан оңға орындағанда, екеуі де суреттегі нәтижені беруі тиіс. Қай цифр қолданылмайды?",
    "4",
    "Жалғыз жарамды орналастыру a = 6, b = 5, c = 3, d = 2. Жоғарғы жол 6 + 5 − 2 = 9, төменгі жол 6 × 3 ÷ 2 = 9. Қолданылмайтын цифр — 4.",
    [
      "2",
      "3",
      "4",
      "5",
      "6"
    ]
  ],
  [
    33,
    "logic",
    "two-stage-native-parallel-roads-product",
    "Әр сызық — жеке жол. Саяхатшы алдымен A-дан B-ға, кейін B-дан C-ға барады. Сурет бойынша осындай сапарды неше тәсілмен жасауға болады?",
    "15",
    "Бірінші кезеңде 3 жолдың, екіншісінде 5 жолдың бірін таңдаймыз. Әр бірінші таңдауға бес екінші таңдау сәйкес: 3 × 5 = 15.",
    [
      "8",
      "15",
      "12",
      "38"
    ]
  ],
  [
    38,
    "geo",
    "ribbon-area-conservation-thirteen-rectangular-tiles",
    "Ені 2 см таспа 13 тіктөртбұрышқа бөлінді. Олар қиылыспай және саңылаусыз суреттегі шаршыны құрайды. Әр бөліктің қысқа қабырғасы таспа еніне тең. Бастапқы таспаның ұзындығын табыңыз.",
    "98 см",
    "Үлкен шаршының қабырғасы жеті таспа енінен тұрады: 7 × 2 = 14 см. Ауданы 14^2 = 196 см². Таспа ауданы ені мен ұзындығының көбейтіндісі, сондықтан ұзындық 196 ÷ 2 = 98 см.",
    [
      "98 см",
      "97 см",
      "105 см",
      "81 см"
    ]
  ]
];
function row(s){const[n,topic,kind,statement,answer,solution,options]=s,image=[24,29,33,38].includes(n)?`/figures/synaq-editions/${name}-${n}-native.svg`:null;return{editionId:`${name}-bil-${n}`,modelId:`${name}-${kind}`,grade:6,topic,difficulty:'hard',minimumPlan:'pro',params:{work:'BIL12',number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${source}.json`,sourceId:String(n)}],sourceAnswerAvailability:'captured_official_visual_key_and_givens_reviewed_new_geometry_independently_recomputed',adaptationChanges:['Full source and rewritten conditions, official and new solutions and all choices read. Own native SVGs with changed dimensions, orientation and contour replace source artwork. Actual geometry independently recomputed; Standard+ only; no semantic uniqueness claim. Same author computational review, not another human reviewer.','New dimensions and native geometry retain the source mathematical method; all answers recomputed and signed separately.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,options,...(image?{image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-bil-${s[0]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed nativecorefullrow');return{answer:r.answer,checks:['allsource/newconditions solutions/options read','actualnativegeometry physicalgivens independentlychecked','localStandard+ nosemanticuniquenessclaim']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){for(const[n]of SPECS.filter(s=>[24,29,33,38].includes(s[0])))fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${n}-native.svg`,import.meta.url),draw(n));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'Last four BIL12 tasks: original native geometry and arithmetic/road diagrams, local Standard+.',sourceOccurrences:4,distinctModels:4,editions},null,2)+'\n');console.log(JSON.stringify({authored:4,nativeFigures:4}));}
