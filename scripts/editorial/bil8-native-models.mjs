import{renderVoxels}from'./bil1-native-solids-models.mjs';
import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='bil8-native',source='692f19ad-e538-4e5d-b409-7a0424e9c804',fmt=n=>Number(n.toFixed(9)),polar=(o,r,a)=>[fmt(o[0]+r*Math.cos(a*Math.PI/180)),fmt(o[1]+r*Math.sin(a*Math.PI/180))];
const text=(id,x,y,t,size=16)=>`<text id="${id}" x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#365483">${t}</text>`;
const poly=(id,ps,fill='#d5e2f8')=>`<polygon id="${id}" points="${ps.map(p=>p.map(fmt).join(',')).join(' ')}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const line=(id,a,b)=>`<line id="${id}" x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}" stroke="#7294c5" stroke-width="1.6"/>`;
const arc=(id,c,r,a,b,sweep=1)=>`<path id="${id}" d="M ${polar(c,r,a).join(' ')} A ${r} ${r} 0 0 ${sweep} ${polar(c,r,b).join(' ')}" fill="none" stroke="#8967bf" stroke-width="1.6"/>`;
const circle=(id,x,y,r,fill='#fff')=>`<circle id="${id}" cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const rect=(id,x,y,w,h,fill='#d5e2f8',rx=0)=>`<rect id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
function frame(title,h,b){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${h}" role="img" aria-labelledby="title"><title id="title">${title}</title><rect width="360" height="${h}" rx="22" fill="#f5f8ff"/>${b}</svg>\n`;}
export function draw(n){
 if(n===7){let b='';for(const[j,x,y,top,left,right,result]of[[0,95,72,5,8,6,53],[1,265,72,7,5,4,27],[2,180,235,6,9,3,'?']]){b+=poly('triangle-'+j,[[x,y-42],[x-48,y+34],[x+48,y+34]],'#fff')+text('top-'+j,x,y-50,String(top))+text('left-'+j,x-61,y+40,String(left))+text('right-'+j,x+61,y+40,String(right))+text('result-'+j,x,y+12,String(result),21);}return frame('Бірдей амал ережесі бар үш үшбұрыш',325,b);}
 if(n===10){let b=rect('whole',60,45,240,240,'#fff')+'<path id="sector-left" d="M 60 285 L 60 165 A 120 120 0 0 1 180 285 Z" fill="#c5d8f7" stroke="#7294c5" stroke-width="1.6"/><path id="sector-right" d="M 300 285 L 180 285 A 120 120 0 0 1 300 165 Z" fill="#c5d8f7" stroke="#7294c5" stroke-width="1.6"/>'+text('side-label',180,30,'20 см');return frame('Шаршыдағы ақ аймақтың шекарасы',315,b);}
 if(n===17){let b=poly('square-0',[[75,70],[155,70],[155,150],[75,150]],'#fff')+poly('square-1',[[75,150],[155,150],[155,230],[75,230]],'#fff');for(let j=0;j<2;j++)b+=poly('triangle-'+j,[[155,70+j*80],[155,150+j*80],[fmt(155+40*Math.sqrt(3)),110+j*80]],'#d8caf0');b+=text('side-label',48,115,'10 см');return frame('Екі шаршы мен екі теңқабырғалы үшбұрыш',285,b);}
 if(n===22){const cells=[];for(let x=0;x<7;x++)for(let y=0;y<7;y++)for(let z=0;z<2;z++)if(x===0||y===0||x===6||y===6)cells.push([x,y,z]);return frame('Төрт білеушеден құралған қуысы бар жақтау',290,renderVoxels(cells,[42,255],[27,0],[12,-14],[0,-23],'frame')+text('bar-dimensions',180,42,'1 × 2 × 6 см',19));}
 if(n===23){const lengths=[10,18,8],map=([x,y])=>[54+7*x,260-7*y];let b='',x=0;for(let j=0;j<3;j++){let a=lengths[j];b+=poly('square-'+j,[[x,0],[x+a,0],[x+a,a],[x,a]].map(map),'#fff');b+=text('side-'+j,54+7*(x+a/2),260-7*a-12,a+' см');x+=a;}b+=poly('shaded',[[0,10],[10,10],[10,18],[36,0],[28,0]].map(map),'#d8caf0');return frame('Үш көршілес шаршы арасындағы боялған аймақ',300,b);}
 if(n===26){let b=poly('square',[[120,45],[240,45],[240,165],[120,165]],'#e3ecfb')+poly('rectangle',[[60,220],[300,220],[300,280],[60,280]],'#d8caf0');for(const[k,x,y]of[['A',106,42],['B',253,42],['C',253,184],['D',106,184],['K',46,217],['L',314,217],['M',314,299],['N',46,299]])b+=text('label-'+k,x,y,k);b+=text('width-label',180,208,'20 см')+text('height-label',36,254,'5 см')+text('asked-label',95,110,'?');return frame('Аудандары тең шаршы мен тіктөртбұрыш',330,b);}
 if(n===37){let b='';for(let j=0;j<=6;j++)b+=line('vertical-'+j,[60+40*j,40],[60+40*j,280])+line('horizontal-'+j,[60,40+40*j],[300,40+40*j]);return frame('Бірдей бірлік ұяшықтар торы',315,b);}
 throw Error(n);
}
export const SPECS=[
  [
    7,
    "logic",
    "triangle-product-plus-third-vertex",
    "Әр үшбұрышта бір төбедегі сан қалған екі төбедегі сандардың көбейтіндісіне қосылады. Барлық үшбұрышта қосылатын санның орны бірдей. Сұрақ белгісін табыңыз.",
    "33",
    "Алғашқы екі мысалда жоғарғы сан қосылады: 8 × 6 + 5 = 53 және 5 × 4 + 7 = 27. Сондықтан соңғы нәтиже 9 × 3 + 6 = 33.",
    [
      "36",
      "35",
      "34",
      "33",
      "37"
    ]
  ],
  [
    10,
    "geo",
    "unshaded-perimeter-two-quarter-disc-cuts",
    "Көк бөліктер — центрлері шаршының төменгі екі төбесінде орналасқан тең ширек дөңгелектер. Радиустары шаршы қабырғасының жартысына тең. «π = 3.14» деп алып, ақ бөліктің периметрін табыңыз.",
    "71.4 см",
    "Екі доғаның жалпы ұзындығы π × 10 = 31.4 см. Ақ шекараның түзу бөліктері жоғарғы 20 см қабырға мен екі бүйірдегі 10 см-ден тұрады: 40 см. Периметр 40 + 31.4 = 71.4 см.",
    [
      "71.4 см",
      "93.4 см",
      "79.4 см",
      "75.4 см",
      "85.4 см"
    ]
  ],
  [
    17,
    "geo",
    "two-squares-two-equilateral-triangles-union-perimeter",
    "Фигура екі бірдей шаршы мен олардың оң жағына жапсарлас екі теңқабырғалы үшбұрыштан тұрады. Үшбұрыш қабырғасы шаршы қабырғасына тең. Сыртқы периметрді табыңыз.",
    "80 см",
    "Сыртқы шекарада шаршының қабырғасына тең сегіз кесінді бар: сол жақта екеу, үстінде және астында бір-бірден, үшбұрыштардың сыртқы жақтарында төртеу. Периметр 8 × 10 = 80 см.",
    [
      "80 см",
      "90 см",
      "100 см",
      "120 см",
      "130 см"
    ]
  ],
  [
    22,
    "geo",
    "four-bars-square-ring-total-surface",
    "Өлшемдері «1 × 2 × 6» см болатын төрт бірдей білеушеден суреттегі жақтау жасалған. Жақтау жазықтығындағы ені 1 см, қалыңдығы 2 см. Білеушелер қуысты шаршы жақтау құрайды: сыртқы қабырғасы 7 см, ішкі тесігі 5 см. Астыңғы және ішкі беттерді қоса, толық бетінің ауданын табыңыз.",
    "144 см²",
    "Үсті мен астының жалпы ауданы 2 × (7^2 − 5^2) = 48 см². Сыртқы бүйір беттер 4 × 7 × 2 = 56 см². Ішкі бүйір беттер 4 × 5 × 2 = 40 см². Барлығы 48 + 56 + 40 = 144 см².",
    [
      "140 см²",
      "144 см²",
      "148 см²",
      "136 см²",
      "132 см²"
    ]
  ],
  [
    23,
    "geo",
    "three-adjacent-squares-shaded-polygon-area",
    "Үш шаршының төменгі қабырғалары бір түзуде жатыр. Ұзындықтар суретте берілген. Күлгін аймақтың ауданын табыңыз.",
    "194 см²",
    "Жоғарғы шекара астындағы аудан: сол шаршы 10^2 = 100 см² және катеттері 18, 26 болатын үшбұрыш 18 × 26 ÷ 2 = 234 см². Төменгі қиғаш шекара астындағы үшбұрыш 10 × 28 ÷ 2 = 140 см². Боялған аудан 100 + 234 − 140 = 194 см².",
    [
      "187.5 см²",
      "185.5 см²",
      "179.5 см²",
      "194 см²",
      "175.5 см²"
    ]
  ],
  [
    26,
    "geo",
    "equal-area-square-side-from-rectangle",
    "ABCD шаршысы мен KLMN тіктөртбұрышының аудандары тең. Тіктөртбұрыштың өлшемдері суретте көрсетілген. AD қабырғасының ұзындығын табыңыз.",
    "10 см",
    "Тіктөртбұрыш ауданы 20 × 5 = 100 см². Шаршы ауданы да 100 см². 10 × 10 = 100 болғандықтан, AD = 10 см.",
    [
      "8 см",
      "9 см",
      "10 см",
      "11 см",
      "12 см"
    ]
  ],
  [
    37,
    "logic",
    "fixed-area-squares-in-complete-native-grid",
    "Суреттегі үлкен шаршы ауданы 1 см² болатын 36 бірдей ұяшыққа бөлінген. Тор сызықтары бойымен салынған, ауданы 9 см² болатын неше шаршы бар?",
    "16",
    "Ауданы 9 см² шаршы 3 × 3 ұяшықтан тұрады. 6 × 6 торда оның сол жақ шетін төрт бағаннан, жоғарғы шетін төрт жолдан таңдауға болады. Барлығы 4 × 4 = 16 шаршы.",
    [
      "14",
      "15",
      "16",
      "17",
      "18"
    ]
  ]
];
function row(s){const[n,topic,kind,statement,answer,solution,options]=s,image=`/figures/synaq-editions/${name}-${n}-native.svg`;return{editionId:`${name}-bil-${n}`,modelId:`${name}-${kind}`,grade:6,topic,difficulty:'hard',minimumPlan:'pro',params:{work:'BIL8',number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${source}.json`,sourceId:String(n)}],sourceAnswerAvailability:'captured_official_visual_key_and_givens_reviewed_new_geometry_independently_recomputed',adaptationChanges:['Full source and rewritten conditions, official and new solutions and all choices read. Own native SVGs with changed dimensions, orientation and contour replace source artwork. Actual geometry independently recomputed; Standard+ only; no semantic uniqueness claim. Same author computational review, not another human reviewer.','New dimensions and native geometry retain the source mathematical method; all answers recomputed and signed separately.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,options,image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-bil-${s[0]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed nativecorefullrow');return{answer:r.answer,checks:['allsource/newconditions solutions/options read','actualnativegeometry physicalgivens independentlychecked','localStandard+ nosemanticuniquenessclaim']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){for(const[n]of SPECS)fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${n}-native.svg`,import.meta.url),draw(n));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'Seven final BIL8 diagrams with own native geometry; local Standard+.',sourceOccurrences:7,distinctModels:7,editions},null,2)+'\n');console.log(JSON.stringify({authored:7,nativeFigures:7}));}
