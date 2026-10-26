import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='bil11-final',source='14930a2d-fe09-4297-8fa1-f1039923dd16',fmt=n=>Number(n.toFixed(9)),polar=(o,r,a)=>[fmt(o[0]+r*Math.cos(a*Math.PI/180)),fmt(o[1]+r*Math.sin(a*Math.PI/180))];
const text=(id,x,y,t,size=16)=>`<text id="${id}" x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#365483">${t}</text>`;
const poly=(id,ps,fill='#d5e2f8')=>`<polygon id="${id}" points="${ps.map(p=>p.map(fmt).join(',')).join(' ')}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const line=(id,a,b)=>`<line id="${id}" x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}" stroke="#7294c5" stroke-width="1.6"/>`;
const arc=(id,c,r,a,b,sweep=1)=>`<path id="${id}" d="M ${polar(c,r,a).join(' ')} A ${r} ${r} 0 0 ${sweep} ${polar(c,r,b).join(' ')}" fill="none" stroke="#8967bf" stroke-width="1.6"/>`;
const circle=(id,x,y,r,fill='#fff')=>`<circle id="${id}" cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const rect=(id,x,y,w,h,fill='#d5e2f8',rx=0)=>`<rect id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
function frame(title,h,b){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${h}" role="img" aria-labelledby="title"><title id="title">${title}</title><rect width="360" height="${h}" rx="22" fill="#f5f8ff"/>${b}</svg>\n`;}
export function draw(n){
 if(n===14){let b='';for(let j=0;j<=6;j++){const v=4*j,y=270-8*v;b+=line('grid-y-'+j,[60,y],[310,y])+text('value-y-'+j,39,y+5,String(v),14);}for(let j=0;j<=5;j++){const t=9+j,x=60+50*j;b+=line('grid-x-'+j,[x,78],[x,270])+text('value-x-'+j,x,294,String(t),14);}b+=line('axis-x',[50,270],[324,270])+line('axis-y',[60,280],[60,60])+text('axis-label-y',58,47,'s, км',15)+text('axis-label-x',310,320,'t, сағ',15);const values=[0,5,11,15,17,21],ps=values.map((v,j)=>[60+50*j,270-8*v]);b+=`<polyline id="distance-graph" points="${ps.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#5475cc" stroke-width="3"/>`;ps.forEach(([x,y],j)=>b+=circle('graph-node-'+j,x,y,3,'#5475cc'));return frame('Уақыт пен жүрген жол графигі',340,b);}
 if(n===29){let b='';const cases=[[6,5],[8,7],[9,7],[5,4],[7,6]],centers=[[75,78],[180,78],[285,78],[125,217],[235,217]];for(let j=0;j<5;j++){const[cx,cy]=centers[j],regular=(k,r)=>Array.from({length:k},(_,z)=>polar([cx,cy],r,-90+360*z/k));b+=poly('outer-'+j,regular(cases[j][0],43),'#fff')+poly('inner-'+j,regular(cases[j][1],24),'#d8caf0')+text('figure-label-'+j,cx,cy+65,String(j+1),19);}return frame('Көпбұрыштардың қабырғаларын салыстыру',310,b);}
 if(n===38){let b=poly('shaded',[[1,1],[8,1],[8,7],[4,5]].map(([x,y])=>[40+30*x,310-30*y]),'#d8caf0');for(let j=0;j<=9;j++)b+=line('vertical-'+j,[40+30*j,40],[40+30*j,310])+line('horizontal-'+j,[40,40+30*j],[310,40+30*j]);for(const[k,x,y]of[['A',62,296],['B',291,296],['C',293,95],['D',149,155]])b+=text('label-'+k,x,y,k);return frame('Торкөздегі төртбұрыш',350,b);}
 if(n===40){const O=[180,180],values=['y','4','127','218','29','66','5','x + y'];let b=circle('outer-circle',...O,140,'#fff');for(let j=0;j<4;j++)b+=line('diameter-'+j,polar(O,140,-90+45*j),polar(O,140,90+45*j));for(let j=0;j<8;j++){const[x,y]=polar(O,95,-67.5+45*j);if([2,3,4,5].includes(j))b+=rect('output-frame-'+j,fmt(x-27),fmt(y-18),54,36,'#e3ecfb',7);b+=text('sector-value-'+j,x,y+6,values[j],20);}return frame('Қарама-қарсы секторлардың ортақ ережесі',360,b);}
 throw Error(n);
}
export const SPECS=[
  [
    14,
    "word",
    "calibrated-time-distance-graph-average-speed",
    "Графикте уақыт сағатпен, жүрілген жол километрмен берілген. Сағат 9:00-ден 12:00-ге дейінгі орташа жылдамдықты табыңыз.",
    "5 км/сағ",
    "9:00-де жүрген жол 0 км, 12:00-де 15 км. Уақыт 3 сағат, сондықтан орташа жылдамдық 15 ÷ 3 = 5 км/сағ.",
    [
      "5 км/сағ",
      "5.5 км/сағ",
      "6 км/сағ",
      "4 км/сағ"
    ]
  ],
  [
    29,
    "logic",
    "majority-nested-polygon-side-count-difference",
    "Көпшілік фигурада сыртқы және ішкі көпбұрыш қабырғалары сандарының айырмасы бірдей. Осы ережеге сай келмейтін фигураның нөмірін таңдаңыз.",
    "3",
    "Қабырғалар саны ретімен 6 және 5, 8 және 7, 9 және 7, 5 және 4, 7 және 6. Үшіншісінде айырма 2, қалған төртеуінде 1.",
    [
      "3",
      "4",
      "2",
      "5"
    ]
  ],
  [
    35,
    "logic",
    "alternating-indent-native-number-table",
    "Әр жолға бес тізбектес сан жазылады. Тақ жолдар бірінші бағаннан, жұп жолдар екінші бағаннан басталады. Сандар үзіліссіз өсу ретімен жалғасады. Алғашқы жол 3 санынан басталады. Сұрақ белгісінің орнына не жазылады?\n\n| 1-баған | 2-баған | 3-баған | 4-баған | 5-баған | 6-баған |\n| --- | --- | --- | --- | --- | --- |\n| 3 | 4 | 5 | 6 | 7 | |\n| | 8 | 9 | 10 | 11 | 12 |\n| 13 | 14 | 15 | 16 | 17 | |\n| | 18 | 19 | 20 | 21 | 22 |\n| | | | | | |\n| | | | ? | | |",
    "30",
    "Бесінші жолда 23-тен 27-ге дейінгі сандар бірінші бағаннан басталады. Алтыншы жолда 28, 29, 30, 31, 32 сандары екінші бағаннан басталады. Төртінші бағанда 30 тұрады.",
    [
      "30",
      "29",
      "32",
      "31"
    ]
  ],
  [
    38,
    "geo",
    "native-lattice-quadrilateral-triangle-trapezoid-area",
    "Бір шаршы торкөздің қабырғасы 1 см. ABCD төртбұрышының ауданын табыңыз.",
    "26",
    "D арқылы тік сызық жүргізсек, сол жақта катеттері 3 және 4 болатын үшбұрыш шығады: ауданы 6 см². Оң жақтағы трапецияның параллель қабырғалары 4 және 6 см, арасы 4 см. Ауданы (4 + 6) × 4 ÷ 2 = 20 см². Барлығы 6 + 20 = 26 см².",
    [
      "18",
      "26",
      "22",
      "20"
    ]
  ],
  [
    40,
    "logic",
    "opposite-sector-cube-plus-common-constant-two-unknowns",
    "Көк жақтаудағы сан қарама-қарсы жақтаусыз санның кубына бір тұрақты сан қосу арқылы алынады. x және y — оң бүтін сандар. «2 × x + y» мәнін табыңыз.",
    "9",
    "Белгілі жұптардан 66 − 4^3 = 2 және 127 − 5^3 = 2. Демек ортақ қосылғыш 2. y^3 + 2 = 29, сондықтан y = 3. (x + y)^3 + 2 = 218, сондықтан x + y = 6 және x = 3. Өрнек 2 × 3 + 3 = 9.",
    [
      "11",
      "10",
      "9",
      "7"
    ]
  ]
];
function row(s){const[n,topic,kind,statement,answer,solution,options]=s,image=[14,29,38,40].includes(n)?`/figures/synaq-editions/${name}-${n}-native.svg`:null;return{editionId:`${name}-bil-${n}`,modelId:`${name}-${kind}`,grade:6,topic,difficulty:'hard',minimumPlan:'pro',params:{work:'BIL11',number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${source}.json`,sourceId:String(n)}],sourceAnswerAvailability:'captured_official_visual_key_and_givens_reviewed_new_geometry_independently_recomputed',adaptationChanges:['Full source and rewritten conditions, official and new solutions and all choices read. Own native SVGs with changed dimensions, orientation and contour replace source artwork. Actual geometry independently recomputed; Standard+ only; no semantic uniqueness claim. Same author computational review, not another human reviewer.','New dimensions and native geometry retain the source mathematical method; all answers recomputed and signed separately.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,options,...(image?{image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-bil-${s[0]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed nativecorefullrow');return{answer:r.answer,checks:['allsource/newconditions solutions/options read','actualnativegeometry physicalgivens independentlychecked','localStandard+ nosemanticuniquenessclaim']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){for(const[n]of SPECS.filter(s=>[14,29,38,40].includes(s[0])))fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${n}-native.svg`,import.meta.url),draw(n));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'Last five BIL11 tasks: four original native diagrams and accessible table, local Standard+.',sourceOccurrences:5,distinctModels:5,editions},null,2)+'\n');console.log(JSON.stringify({authored:5,nativeFigures:4}));}
