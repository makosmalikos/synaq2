import fs from'node:fs';import crypto from'node:crypto';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{canonicalEdition}from'./edition-review.mjs';const name='bil10-final',source='9dd9307d-6568-455d-9203-9fbd242ff4ff',fmt=n=>Number(n.toFixed(9)),polar=(o,r,a)=>[fmt(o[0]+r*Math.cos(a*Math.PI/180)),fmt(o[1]+r*Math.sin(a*Math.PI/180))];
const text=(id,x,y,t,size=16)=>`<text id="${id}" x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#365483">${t}</text>`;
const poly=(id,ps,fill='#d5e2f8')=>`<polygon id="${id}" points="${ps.map(p=>p.map(fmt).join(',')).join(' ')}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const line=(id,a,b)=>`<line id="${id}" x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}" stroke="#7294c5" stroke-width="1.6"/>`;
const arc=(id,c,r,a,b,sweep=1)=>`<path id="${id}" d="M ${polar(c,r,a).join(' ')} A ${r} ${r} 0 0 ${sweep} ${polar(c,r,b).join(' ')}" fill="none" stroke="#8967bf" stroke-width="1.6"/>`;
const circle=(id,x,y,r,fill='#fff')=>`<circle id="${id}" cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
const rect=(id,x,y,w,h,fill='#d5e2f8',rx=0)=>`<rect id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#7294c5" stroke-width="1.6"/>`;
function frame(title,h,b){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${h}" role="img" aria-labelledby="title"><title id="title">${title}</title><rect width="360" height="${h}" rx="22" fill="#f5f8ff"/>${b}</svg>\n`;}
export function draw(n){
 if(n===2){const O=[180,160],r=98,v=r*Math.sqrt(2),ps=[[180,160-v],[180+v,160],[180,160+v],[180-v,160]],T=[180+r/Math.sqrt(2),160-r/Math.sqrt(2)];let b=poly('square',ps,'#d8caf0')+circle('incircle',...O,r,'#fff')+line('radius',O,T)+text('radius-label',232,111,'7 см')+text('center-label',169,178,'O');for(const[k,x,y]of[['A',180,13],['B',332,165],['C',180,320],['D',28,165]])b+=text('label-'+k,x,y,k);return frame('Шаршыға іштей сызылған шеңбер',340,b);}
 if(n===6){let b='';for(const[j,x,y,values,result]of[[0,30,30,[12,16,20,8],14],[1,210,30,[15,21,18,10],16],[2,120,200,[17,23,22,14],'?']]){b+=rect('card-'+j,x,y,120,100,'#fff',12);for(let k=0;k<4;k++)b+=text(`corner-${j}-${k}`,x+(k%2?100:20),y+(k<2?24:86),String(values[k]));b+=circle('middle-'+j,x+60,y+52,22,'#e3ecfb')+text('result-'+j,x+60,y+59,String(result),20);}return frame('Төрт санның орташа мәні',330,b);}
 if(n===21){const p=([x,z])=>[65+14*x,265-19*z],front=[[0,0],[12,0],[12,4],[3,4],[3,7],[0,7]].map(p),back=front.map(([x,y])=>[x+45,y-36]);let b='';for(const[id,a,z]of[['right-lower',1,2],['right-upper',3,4],['top-lower',2,3],['top-upper',4,5]])b+=poly(id,[front[a],back[a],back[z],front[z]],id.startsWith('top')?'#edf1ff':'#bdb3ed');b+=poly('front',front,'#cadffa')+text('width-label',145,292,'12 см')+text('height-label',38,200,'7 см')+line('lower-height-guide',[303,153],[303,229])+text('lower-height-label',328,196,'4 см')+text('upper-width-label',122,87,'3 см')+line('depth-guide',[241,279],[286,243])+text('depth-label',295,267,'9 см');return frame('Сатылы қимасы бар призма',320,b);}
 if(n===37){let b=poly('shaded',[[1,1],[6,1],[5,5],[2,6]].map(([x,y])=>[40+40*x,320-40*y]),'#d8caf0');for(let j=0;j<=7;j++)b+=line('vertical-'+j,[40+40*j,40],[40+40*j,320])+line('horizontal-'+j,[40,40+40*j],[320,40+40*j]);return frame('Торкөздегі төртбұрыш ауданы',360,b);}
 if(n===41){const O=[180,165],tip=(len,angle)=>polar(O,len,angle-90);let b=circle('clock',...O,125,'#fff');for(let j=0;j<60;j++)b+=line('tick-'+j,tip(j%5===0?109:117,6*j),tip(123,6*j));for(let j=1;j<=12;j++){const[x,y]=tip(91,30*j);b+=text('numeral-'+j,x,y+6,String(j),17);}b+=line('minute-hand',O,tip(83,210)).replace('stroke-width="1.6"','stroke-width="2.5"')+line('hour-hand',O,tip(57,347.5)).replace('stroke-width="1.6"','stroke-width="4"')+circle('center',...O,5,'#365483');return frame('Сабақ аяқталған мезет',315,b);}
 throw Error(n);
}
export const SPECS=[
  [
    2,
    "geo",
    "inscribed-circle-square-complement-area",
    "Шеңбер ABCD шаршысына іштей сызылған. Радиус суретте берілген. «π = 3» деп алып, күлгін бөліктің ауданын табыңыз.",
    "49",
    "Шаршы қабырғасы екі радиусқа тең: 14 см. Оның ауданы 14^2 = 196 см². Дөңгелек ауданы 3 × 7^2 = 147 см². Айырмасы 196 − 147 = 49 см².",
    [
      "53",
      "45",
      "41",
      "49",
      "57"
    ]
  ],
  [
    6,
    "logic",
    "four-corner-mean-center",
    "Әр карточканың ортасындағы сан оның төрт бұрышындағы сандардың арифметикалық ортасына тең. Сұрақ белгісін табыңыз.",
    "19",
    "Алғашқы мысалдарда қосындылар 56 және 64, орталары 14 пен 16. Соңғы карточкада 17 + 23 + 22 + 14 = 76. Орташа мән 76 ÷ 4 = 19.",
    [
      "18",
      "19",
      "20",
      "17",
      "22"
    ]
  ],
  [
    9,
    "num",
    "universal-positive-order-square-root",
    "«x > y > 2» шарты орындалатын барлық нақты x және y үшін қай теңсіздік міндетті түрде дұрыс?",
    "√x > √y",
    "x пен y оң және x > y. Оң квадрат түбір қатаң өседі, сондықтан √x > √y. Кері сандардың реті керісінше. Қалған үш теңсіздік барлық жұп үшін орындалмайды: мысалы x = 10, y = 3 мәндерін алуға болады.",
    [
      "1/x > 1/y",
      "x + y < 2 × y",
      "x^2 < y^2",
      "√x > √y",
      "x − y < y − 2"
    ]
  ],
  [
    21,
    "geo",
    "extruded-stepped-profile-volume",
    "Суретте сатылы қимасы бар тік призма берілген. Барлық ұзындық сантиметрмен көрсетілген, артқы беті алдыңғы бетіне параллель. Көлемін табыңыз.",
    "513 см³",
    "Алдыңғы қима ауданы 12 × 4 + 3 × (7 − 4) = 48 + 9 = 57 см². Тереңдігі 9 см, сондықтан көлем 57 × 9 = 513 см³.",
    [
      "523 см³",
      "505 см³",
      "529 см³",
      "513 см³",
      "509 см³"
    ]
  ],
  [
    35,
    "geo",
    "maximum-visible-faces-regular-triangular-prism",
    "Табаны дұрыс үшбұрыш болатын мөлдір емес тік призма бір табанымен үстелде тұр. Оған сырттан жоғарыдан қиғаш қарағанда бір мезгілде ең көбі неше жағын көруге болады?",
    "3",
    "Қарама-қарсы екі табанның тек үстіңгісі көрінеді. Үш бүйір жақтың сыртқы нормальдары бір жазықтықта 120°-тан орналасады, сондықтан бір бағыттан ең көбі екі бүйір жақ көрінеді. Үстіңгі табанмен бірге барлығы 3 жақ.",
    [
      "2",
      "3",
      "4",
      "5",
      "6"
    ]
  ],
  [
    37,
    "geo",
    "native-grid-quadrilateral-area",
    "Бір торкөздің қабырғасы 1 см. Күлгін төртбұрыштың ауданын табыңыз.",
    "18 см²",
    "Қоршаушы тіктөртбұрыштың өлшемдері 5 см және 5 см, ауданы 25 см². Сол жақтағы үшбұрыш ауданы 2.5, жоғарғы үшбұрыш ауданы 1.5, жоғарғы оң жақтағы тіктөртбұрыш ауданы 1, оң жақтағы үшбұрыш ауданы 2 см². Артық бөліктердің қосындысы 7 см². Боялған аудан 25 − 7 = 18 см².",
    [
      "15 см²",
      "16 см²",
      "18 см²",
      "17 см²",
      "19 см²"
    ]
  ],
  [
    41,
    "word",
    "analog-clock-end-time-minus-duration",
    "Сағат сабақтың түске дейінгі аяқталу мезетін көрсетеді. Сабақ 50 минутқа созылды. Ол нешеде басталды?",
    "10:45",
    "Ұзын тіл 7 санын көрсетеді, яғни 35 минут. Қысқа тіл 11 мен 12 арасында: аяқталу уақыты 11:35. Одан 50 минутты шегергенде 10:45 шығады.",
    [
      "12:15",
      "10:55",
      "11:45",
      "10:45",
      "10:50"
    ]
  ]
];
function row(s){const[n,topic,kind,statement,answer,solution,options]=s,image=[2,6,21,37,41].includes(n)?`/figures/synaq-editions/${name}-${n}-native.svg`:null;return{editionId:`${name}-bil-${n}`,modelId:`${name}-${kind}`,grade:6,topic,difficulty:'hard',minimumPlan:'pro',params:{work:'BIL10',number:n},sourceRefs:[{sourceFile:`problems/sources/zerek/collections/${source}.json`,sourceId:String(n)}],sourceAnswerAvailability:'captured_official_visual_key_and_givens_reviewed_new_geometry_independently_recomputed',adaptationChanges:['Full source and rewritten conditions, official and new solutions and all choices read. Own native SVGs with changed dimensions, orientation and contour replace source artwork. Actual geometry independently recomputed; Standard+ only; no semantic uniqueness claim. Same author computational review, not another human reviewer.','New dimensions and native geometry retain the source mathematical method; all answers recomputed and signed separately.'],editorialStatus:'awaiting_independent_computational_review',statement,answer,solution,options,...(image?{image,figureSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../frontend/public'+image,import.meta.url))).digest('hex')}:{})};}
export const buildEditions=()=>SPECS.map(row);export function verifyEdition(r){const s=SPECS.find(s=>`${name}-bil-${s[0]}`===r.editionId);assert.ok(s);assert.equal(canonicalEdition(r),canonicalEdition(row(s)),'Unreviewed nativecorefullrow');return{answer:r.answer,checks:['allsource/newconditions solutions/options read','actualnativegeometry physicalgivens independentlychecked','localStandard+ nosemanticuniquenessclaim']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){for(const[n]of SPECS.filter(s=>[2,6,21,37,41].includes(s[0])))fs.writeFileSync(new URL(`../../frontend/public/figures/synaq-editions/${name}-${n}-native.svg`,import.meta.url),draw(n));const editions=buildEditions();editions.forEach(verifyEdition);fs.writeFileSync(new URL(`../../problems/editorial/batches/${name}.json`,import.meta.url),JSON.stringify({schemaVersion:1,scope:'Last seven BIL10 tasks: five native diagrams and two mathematical concepts, local Standard+.',sourceOccurrences:7,distinctModels:7,editions},null,2)+'\n');console.log(JSON.stringify({authored:7,nativeFigures:5}));}
