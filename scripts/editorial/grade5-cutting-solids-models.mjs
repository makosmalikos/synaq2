/** Frozen topic 9.2: 27 individual nonvisual adaptations. No capture or publication. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {grade5Sources} from './grade5-inventory.mjs';
import {canonicalEdition} from './edition-review.mjs';

const name='grade5-cutting-solids', prefix=name+'-';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='9-2').map(q=>[q.sourceId,q]));
const spec=(id,kind,params,note)=>({id,kind,params,note});
export const SPECS=[
 spec('1bf20fc472f20d87','perimeter-row-of-squares',{side:6,count:5},'External perimeter, not sum of individual square perimeters.'),
 spec('bbfd3118433d8fc4','minimum-fixed-cube-saw-planes',{edge:12,small:3},'Full parallel cuts, three directions, no moving/stacking pieces; minimum cuts not piece count.'),
 spec('955ac6b7866b723f','rectangular-tiling-count',{length:10,width:6,tileLength:2,tileWidth:1},'Area quotient AND an actual fitting tiling; distractors board area, sum of dimensions, one direction.'),
 spec('0b84e6dcb3941b9a','connected-cube-net-cut-edges',{},'Invariant seven cut edges, five remaining hinges; this fact is not a new semantic story.'),
 spec('b5836e1287c3354c','two-glued-cubes-surface',{edge:5},'Remove TWO hidden faces; distractors none removed, one removed, four removed.'),
 spec('1c175dbac6a275f9','pieces-from-two-parallel-cut-families',{cuts:[4,5]},'Two perpendicular families; add one to each cut count before multiplying.'),
 spec('b35e175d44c801df','wire-left-after-cube-frame',{metres:2,edge:9},'Normalize metres to centimetres, twelve edges, answer remaining material.'),
 spec('0a5b1635f52c9c98','square-area-from-strip-perimeter',{strips:3,perimeter:40},'Reconstruct square side from perimeter of one equal strip, then square it.'),
 spec('8c9bdad9ff4f3765','minimum-cubes-completing-fixed-cuboid',{dimensions:[3,4,6]},'Keep block intact, align cube grid, smallest surrounding cube uses longest dimension.'),
 spec('4f26026f0345d66d','impossible-polygon-pair-single-rectangle-cut',{},'Two pentagons impossible; give constructions of all three other choices.'),
 spec('524507b41c685002','pieces-from-three-perpendicular-cut-families',{cuts:[3,2,2]},'Multiply three layer counts, not cut count/sum or two-dimensional pieces.'),
 spec('c965ad5e21bd4540','total-surfaces-after-cube-bisection',{edge:6},'Original six faces plus two newly exposed section faces, not one.'),
 spec('a61627502000b9c1','maximum-grid-triomino-strips',{side:10,strip:3},'Upper bound area AND explicit row/last-column construction, not area bound alone.'),
 spec('db7ad82e0960418a','integer-corner-cut-box-max-volume',{side:18},'Enumerate ALL positive integer cuts with positive base; requested volume not height.'),
 spec('5b428f1856f0a700','minimum-surface-integer-cuboid-with-fixed-cubes',{count:18},'Enumerate all positive factor triples, all MCQ volumes equal, compare external surfaces.'),
 spec('5f982f5e46bc99af','cut-length-from-three-perimeters',{original:70,parts:[40,50]},'Internal cut contributes twice; construct positive original and two subrectangles.'),
 spec('358a1a538a5e6b29','surface-sum-ratio-after-subdivision',{edge:12,small:3},'New separate pieces total surface / original surface; distractors piece count, face-grid count, unchanged.'),
 spec('a172d64190c3d590','cube-volume-from-net-boundary',{perimeter:168},'Net boundary has fourteen edges; distractors divide by12/6 then cube, or report face area.'),
 spec('2ba03501bbd1d0d2','opposite-corner-domino-color-obstruction',{side:10},'Even board; opposite corners same color, even area alone does not prove tileability.'),
 spec('086b7b717c552d6e','maximum-regions-general-circle-lines',{cuts:5},'Maximum straight cuts in general position, no moving pieces; distinguish concurrent-center cuts.'),
 spec('0b2fcf0d128e528f','area-after-two-perpendicular-half-folds',{side:14},'Unfold BEFORE cutting two crease lines; four equal squares.'),
 spec('d9f5d7c2262ccb6b','shape-pair-after-parallel-cube-cut',{edge:8,offset:3},'One internal plane parallel to face; two cuboids, no cubes/third piece/prisms.'),
 spec('67b51ea7a3470835','regions-from-distinct-diameters',{cuts:4},'Explicitly distinct diameters, all concurrent at center, 2n not general-position maximum.'),
 spec('1eebc31ba6fcb1a8','impossible-square-from-two-scalene-right-triangles',{legs:[5,12]},'Unequal right legs; square requires two isosceles right triangles. No flawed integer-square-area argument.'),
 spec('8c9c196833ab89c4','surface-after-corner-unit-cube-removal',{countPerAxis:4,small:2},'Lose three exposed faces and reveal three equal hidden faces, net surface unchanged.'),
 spec('d5bf598e722c16ce','square-side-from-sum-grid-piece-perimeters',{cuts:[2,2],sumPerimeters:180},'Original boundary counted once, every full internal cut twice; equal spacing unnecessary.'),
 spec('20339656aafad325','grid-cells-crossed-by-diagonal',{length:9,width:6},'Count interiors only, handle every internal grid vertex once, gcd correction.'),
];
const surface=(a,b,c)=>2*(a*b+a*c+b*c), gcd=(a,b)=>b?gcd(b,a%b):a;
function render(kind,p){let statement,solution,answer,wrong;
 switch(kind){
 case'perimeter-row-of-squares':{
  const L=p.side*p.count;answer=2*(L+p.side);
  statement=`Қабырғасы ${p.side} см болатын ${p.count} бірдей шаршы жапсырманы бір қатарға орналастырды. Көршілері толық қабырғалары бойымен жанасады, араларында саңылау жоқ. Шыққан тіктөртбұрыштың сыртқы периметрі неше сантиметр?`;
  solution=`Қатардың ұзындығы ${p.count} × ${p.side} = ${L} см, ені ${p.side} см. Сыртқы шекараның ұзындығы 2 × (${L} + ${p.side}) = ${answer} см. Жеке периметрлердің қосындысы ${4*p.side*p.count} см болар еді, бірақ ${p.count-1} түйіскен қабырға әрқайсысы екі рет ішке кетеді: ${4*p.side*p.count} − 2 × ${p.count-1} × ${p.side} = ${answer} см.`;break;}
 case'minimum-fixed-cube-saw-planes':{
  const n=p.edge/p.small;assert.ok(Number.isInteger(n)&&n>1);answer=3*(n-1);
  statement=`Қыры ${p.edge} см тұтас ағаш блоктан қыры ${p.small} см бірдей кубиктер алу керек. Әр аралау блоктың жағына параллель жазықтықпен оны толық кесіп өтеді. Бөліктерді жылжытуға не қабаттап қоюға болмайды. Ең аз неше рет аралау қажет?`;
  solution=`Әр бағытта ${p.edge} ÷ ${p.small} = ${n} қабат керек. ${n} қабатты ажыратуға ${n-1} ішкі қима қажет. Үш бағыттағы қималар саны ${n-1} + ${n-1} + ${n-1} = ${answer}. Бұдан аз болса, кемінде бір бағытта қажетті қабат саны жетпейді. Осы қималар ${n} × ${n} × ${n} = ${n**3} кубик береді. Кубиктер саны мен аралау саны екі түрлі шама.`;break;}
 case'rectangular-tiling-count':{
  const area=p.length*p.width,tile=p.tileLength*p.tileWidth;answer=area/tile;assert.ok(Number.isInteger(answer)&&p.length%p.tileLength===0&&p.width%p.tileWidth===0);
  wrong=[area,p.length+p.width,p.length];
  statement=`Шеберханадағы ${p.length} дм × ${p.width} дм тікбұрышты панельді ${p.tileLength} дм × ${p.tileWidth} дм тақташалармен жабады. Тақташалар кесілмейді, қабаттаспайды және бос орын қалмайды. Қанша тақташа керек?`;
  solution=`Панель ауданы ${p.length} × ${p.width} = ${area} дм², бір тақташа ауданы ${p.tileLength} × ${p.tileWidth} = ${tile} дм². Саны ${area} ÷ ${tile} = ${answer}. Мұндай төсеу мүмкін: әр қатарда ${p.length/p.tileLength} тақташа, барлығы ${p.width/p.tileWidth} қатар. ${area} — бөлінбеген аудан; ${p.length+p.width} — екі өлшемнің қосындысы; ${p.length} — тек ұзындықтың сандық мәні.`;break;}
 case'connected-cube-net-cut-edges':{
  answer=7;wrong=[12,5,6];statement='Жабық қағаз кубты тек қырлары бойымен қиып, жазық жайылған алты шаршыдан тұратын біртұтас жазба жасады. Шаршылар бір-бірін жаппайды. Кубтың неше қыры қиылған?';
  solution='Алты шаршыны жазбада біріктіріп тұратын бес бүктеу қыры қалады: бір шаршыдан бастап қалған бесеуін бір-бір байланыспен қосамыз. Жазық куб жазбасындағы байланыстар тұйық айналым құрмайды. Кубта барлығы 12 қыр, сондықтан 12 − 5 = 7 қыр қиылады. 12 қырды қиса, алты бөлек шаршы шығады; 5 — сақталған бүктеу қырлары, 6 — жақтар саны. Бұл сандар кубтың өлшеміне тәуелді емес.';break;}
 case'two-glued-cubes-surface':{
  const f=p.edge**2;answer=10*f;wrong=[12*f,11*f,8*f];
  statement=`Қыры ${p.edge} см болатын екі ойыншық куб бір-біріне толық жақтарымен жапсырылды. Жапсырылған жерде саңылау жоқ. Құрастырылған дененің сыртқы бетінің ауданын см²-пен таңдаңыз.`;
  solution=`Әр жақ ${p.edge} × ${p.edge} = ${f} см². Екі бөлек кубта 12 жақ бар, бірақ түйіскен екі жақ ішке кетеді. Сыртта 12 − 2 = 10 жақ қалады: 10 × ${f} = ${answer} см². Тексеру: жаңа дене ${2*p.edge} × ${p.edge} × ${p.edge}, беті 2 × (${2*f} + ${2*f} + ${f}) = ${answer} см². ${12*f} жасырын жақтарды алмайды; ${11*f} біреуін ғана алады; ${8*f} төрт жақты қате алып тастайды.`;break;}
 case'pieces-from-two-parallel-cut-families':{
  const[a,b]=p.cuts;answer=(a+1)*(b+1);statement=`Тікбұрышты бәліште бір қабырғаға параллель ${a} толық кесу, оған перпендикуляр бағытта ${b} толық кесу жасалды. Бір бағыттағы кесулер әртүрлі орыннан өтеді; бөліктер орнынан қозғалмайды. Барлығы неше бөлік шығады?`;
  solution=`Бірінші бағытта ${a} кесу ${a+1} жолақ береді. Екінші бағыт әр жолақты ${b+1} бөлікке бөледі. Сондықтан (${a} + 1) × (${b} + 1) = ${answer} бөлік. ${a*b} деп көбейту кесулерді бөліктермен шатастырады; ${a+b} тек кесулердің жалпы саны.`;break;}
 case'wire-left-after-cube-frame':{
  const used=12*p.edge;answer=100*p.metres-used;assert.ok(answer>0);statement=`Ұзындығы ${p.metres} м сымнан қыры ${p.edge} см кубтың он екі қырына арналған қаңқа жасалды. Түйіндерге қосымша сым жұмсалмады. Неше сантиметр сым пайдаланылмай қалды?`;
  solution=`Бастапқы сым ${p.metres} × 100 = ${100*p.metres} см. Қаңқаға 12 × ${p.edge} = ${used} см кетеді. Қалғаны ${100*p.metres} − ${used} = ${answer} см. Тексеру: ${used} + ${answer} = ${100*p.metres} см. Кубтың алты жағын он екі қырымен шатастырмау керек.`;break;}
 case'square-area-from-strip-perimeter':{
  const a=p.perimeter*p.strips/(2*(p.strips+1)),w=a/p.strips;assert.ok(Number.isInteger(a));answer=a*a;
  statement=`Шаршы сәндік қағазды өзара параллель екі түзу бойымен ${p.strips} бірдей тікбұрышты жолаққа бөлді. Әр жолақтың периметрі ${p.perimeter} см. Бастапқы шаршының ауданы неше см²?`;
  solution=`Бір жолақтың қысқа қабырғасы x болса, ұзын қабырғасы ${p.strips}x. Оның периметрі 2 × (${p.strips}x + x) = ${2*(p.strips+1)}x. Сондықтан x = ${p.perimeter} ÷ ${2*(p.strips+1)} = ${w} см. Шаршының қабырғасы ${p.strips} × ${w} = ${a} см, ауданы ${a} × ${a} = ${answer} см². Жолақтың ${a} × ${w} өлшемдері периметрдің ${p.perimeter} см екенін растайды.`;break;}
 case'minimum-cubes-completing-fixed-cuboid':{
  const[a,b,c]=p.dimensions,side=Math.max(...p.dimensions),old=a*b*c;answer=side**3-old;
  statement=`Қыры 1 см текшелерден ${a} см × ${b} см × ${c} см тұтас блок жасалды. Оны бөлшектемей, тағы текшелер қосып тұтас куб жасау керек. Барлық текшенің қырлары бірдей үш бағытқа параллель қалады. Ең аз қанша текше қосылады?`;
  solution=`Бастапқы блокта ${a} × ${b} × ${c} = ${old} текше бар. Оны қамтитын кубтың қыры ең ұзын өлшемнен, яғни ${side} см-ден кем болмайды. Қыры ${side} см кубтың ${side**3} орнынан бастапқы ${old} орын толы, қалған ${side**3} − ${old} = ${answer} орынға текше қосамыз. Бұл толықтыруға болады және одан кіші куб блокты қамтымайды.`;break;}
 case'impossible-polygon-pair-single-rectangle-cut':{
  answer='Екі бесбұрыш';wrong=['Екі үшбұрыш','Үшбұрыш пен бесбұрыш','Екі төртбұрыш'];statement='Тікбұрышты картонды бір ғана түзу бойымен екі бөлікке бөледі. Төмендегі жұптардың қайсысы алынбайды?';
  solution='Қию түзуінің шекарадағы екі ұшы жаңа төбе болса, олар екі бөлікте де есептеледі. Бастапқы төрт төбемен бірге ең көбі 4 + 2 × 2 = 8 төбе болады; қима төбеден өтсе, бұл сан азаяды. Екі бесбұрышқа 5 + 5 = 10 төбе керек, сондықтан олар шықпайды. Қалғандары мүмкін: диагональ екі үшбұрыш береді; қарсы қабырғаларды қосатын қима екі төртбұрыш береді; көршілес қабырғаларды қосып бір бұрышты кесу үшбұрыш пен бесбұрыш береді.';break;}
 case'pieces-from-three-perpendicular-cut-families':{
  const[a,b,c]=p.cuts;answer=(a+1)*(b+1)*(c+1);wrong=[a+b+c,a+b+c+3,(a+1)*(b+1)];
  statement=`Тікбұрышты сабын блогын үш өзара перпендикуляр бағытта кесті: бірінші бағытта ${a} рет, екіншісінде ${b} рет, үшіншісінде ${c} рет. Әр кесу тиісті жаққа параллель болып, блокты толық өтеді; бір бағыттағы қималар беттеспейді, бөліктер жылжытылмайды. Неше бөлік алынады?`;
  solution=`Қабаттар саны ${a+1}, ${b+1}, ${c+1}. Олардың барлық қиылысуы жеке бөлік береді: ${a+1} × ${b+1} × ${c+1} = ${answer}. ${a+b+c} — кесулердің саны, ${a+b+c+3} — үш бағыттағы қабат сандарын көбейтудің орнына қосу, ${(a+1)*(b+1)} — үшінші бағытты ескермеу.`;break;}
 case'total-surfaces-after-cube-bisection':{
  const f=p.edge**2;answer=8*f;wrong=[6*f,7*f,4*f];statement=`Қыры ${p.edge} см тұтас кубты бір жағына параллель қимамен дәл екі тең бөлікке бөлді. Бөліктерді ажыратқаннан кейін олардың барлық беттерінің аудандарының қосындысы неше см²?`;
  solution=`Бастапқы алты жақтың ауданы 6 × ${p.edge} × ${p.edge} = ${6*f} см². Қима орнында ауданы ${f} см² болатын екі жаңа жақ ашылады. Барлығы ${6*f} + 2 × ${f} = ${answer} см². Әр жартының өлшемдері ${p.edge} × ${p.edge} × ${p.edge/2}, біреуінің беті ${4*f} см², екеуінікі ${answer} см². ${7*f} бір ғана жаңа жақты, ${6*f} ешбір жаңа жақты санамайды.`;break;}
 case'maximum-grid-triomino-strips':{
  const n=p.side,k=p.strip;assert.equal(n%k,1);const perRow=Math.floor(n/k),col=Math.floor(n/k);answer=n*perRow+col;
  statement=`${n} × ${n} торкөзді қағаздан тор сызықтары бойымен 1 × ${k} торкөздік түзу жолақтар қиып алады. Жолақтарды көлденең де, тік те орналастыруға болады, олар қабаттаспайды. Ең көп неше жолақ алынады?`;
  solution=`Қағазда ${n*n} торкөз. Бір жолақ ${k} торкөз алады, сондықтан ${answer+1} жолаққа ${(answer+1)*k} торкөз керек — бұл тым көп. Демек, ең көбі ${Math.floor(n*n/k)}. Осы санға жетеміз: әр қатардың алғашқы ${perRow*k} торкөзінен ${perRow} көлденең жолақ, ${n} қатардан ${n*perRow} жолақ аламыз. Қалған соңғы бағанда ${n} торкөз бар, одан ${col} тік жолақ шығады. Барлығы ${n*perRow} + ${col} = ${answer}, бір торкөз қалады. Жоғарғы шек пен нақты құрастыру сәйкес келді.`;break;}
 case'integer-corner-cut-box-max-volume':{
  const values=Array.from({length:Math.floor((p.side-1)/2)},(_,i)=>{const x=i+1;return[x,p.side-2*x,x*(p.side-2*x)**2];});answer=Math.max(...values.map(v=>v[2]));
  statement=`Қабырғасы ${p.side} см шаршы картонның төрт бұрышынан қабырғалары бірдей шаршылар қиылды. Жиектерін бүктеп, үсті ашық қорап жасайды. Қиылатын шаршының қабырғасы сантиметрмен натурал сан, қораптың түбі мен биіктігі оң болуы керек. Қораптың ең үлкен көлемі неше см³?`;
  solution=`Қиылатын шаршының қабырғасы x болса, қораптың биіктігі x, түбінің қабырғасы ${p.side} − 2x. Сондықтан V = x × (${p.side} − 2x) × (${p.side} − 2x). Рұқсат етілген барлық мәндерді тексереміз: ${values.map(([x,b,v])=>`x = ${x}: ${b} × ${b} × ${x} = ${v} см³`).join('; ')}. Ең үлкен көлем ${answer} см³, ол x = ${values.find(v=>v[2]===answer)[0]} см кезінде алынады. Бұдан үлкен бүтін x түбі нөл немесе теріс болатын қорап береді, сондықтан басқа жарамды жағдай жоқ.`;break;}
 case'minimum-surface-integer-cuboid-with-fixed-cubes':{
  const triples=[];for(let a=1;a<=p.count;a++)for(let b=a;b<=p.count;b++){const c=p.count/(a*b);if(Number.isInteger(c)&&c>=b)triples.push([a,b,c]);}
  assert.equal(triples.length,4);const best=triples.reduce((a,b)=>surface(...a)<surface(...b)?a:b);answer=best.join(' × ');wrong=triples.filter(t=>t!==best).map(t=>t.join(' × '));
  statement=`Қыры 1 см болатын ${p.count} бірдей текшеден бос қуысы жоқ тікбұрышты қорап құрастырылды. Оны толық қаптауға ең аз қағаз кетуі үшін қай өлшемдерді таңдау керек? Өлшемдер сантиметрмен берілген.`;
  solution=`Өлшемдерді өсу ретімен жазсақ, көбейтіндісі ${p.count} болатын барлық оң бүтін үштік: ${triples.map(t=>`${t.join(' × ')} — бет ауданы 2 × (${t[0]*t[1]} + ${t[0]*t[2]} + ${t[1]*t[2]}) = ${surface(...t)} см²`).join('; ')}. Ең аз аудан ${surface(...best)} см², сондықтан ${answer} таңдалады. Барлық нұсқаның көлемі ${p.count} см³, салыстырылатыны көлем емес, сыртқы бет ауданы.`;break;}
 case'cut-length-from-three-perimeters':{
  const[a,b]=p.parts;answer=(a+b-p.original)/2;const x=a/2-answer,y=b/2-answer;assert.ok(Math.min(answer,x,y)>0);
  statement=`Периметрі ${p.original} см тікбұрышты мата қабырғасына параллель бір түзу бойымен екі тікбұрышқа бөлінді. Жаңа бөліктердің периметрлері ${a} см және ${b} см. Қию сызығының ұзындығы неше сантиметр?`;
  solution=`Екі жаңа периметрдің қосындысы ${a} + ${b} = ${a+b} см. Онда бастапқы сыртқы шекара бір рет, ішкі қима екі рет саналған. Қиманың екі есесі ${a+b} − ${p.original} = ${2*answer}, демек ұзындығы ${answer} см. Нақты тексеру: бастапқы ${(x+y)} × ${answer} тіктөртбұрышты ${x} × ${answer} және ${y} × ${answer} етіп бөлуге болады; периметрлері тиісінше ${p.original}, ${a}, ${b} см.`;break;}
 case'surface-sum-ratio-after-subdivision':{
  const r=p.edge/p.small;assert.ok(Number.isInteger(r));answer=`${r} есе артады`;wrong=[`${r**3} есе артады`,`${r**2} есе артады`,'Өзгермейді'];
  statement=`Қыры ${p.edge} см ағаш кубты қыры ${p.small} см бірдей текшелерге толық бөліп, текшелерді бір-бірінен ажыратты. Барлық кіші текшелердің бет аудандарының қосындысы бастапқы кубтың бет ауданына қарағанда қалай өзгереді?`;
  solution=`Әр бағытта ${p.edge} ÷ ${p.small} = ${r} текше, барлығы ${r**3}. Бір кіші текшенің беті 6 × ${p.small} × ${p.small} = ${6*p.small**2} см², қосындысы ${r**3} × ${6*p.small**2} = ${r**3*6*p.small**2} см². Бастапқы бет 6 × ${p.edge} × ${p.edge} = ${6*p.edge**2} см². Қатынас ${r**3*6*p.small**2} ÷ ${6*p.edge**2} = ${r}. ${r**3} — текшелер саны, ${r**2} — бір жақтағы ұяшықтар саны; жаңа ашылған беттерді ескермесек қана қате «өзгермейді» дейміз.`;break;}
 case'cube-volume-from-net-boundary':{
  const a=p.perimeter/14;assert.ok(Number.isInteger(a));answer=a**3;wrong=[(p.perimeter/12)**3,(p.perimeter/6)**3,a*a];assert.ok(wrong.every(Number.isInteger));
  statement=`Кубты қырлары бойымен қиып, бір-бірін жаппайтын алты шаршыдан тұратын біртұтас жазба алды. Жазбаның сыртқы периметрі ${p.perimeter} см. Бастапқы кубтың көлемін см³-пен таңдаңыз.`;
  solution=`Алты шаршыда жеке-жеке 6 × 4 = 24 қабырға бар. Жазбаны біріктіретін бес ортақ бүктеу қыры сыртқы шекараға кірмейді, әрқайсысы екі қабырғаны алып тастайды. Сыртта 24 − 2 × 5 = 14 қыр қалады. Куб қыры ${p.perimeter} ÷ 14 = ${a} см; көлемі ${a} × ${a} × ${a} = ${answer} см³. 12-ге бөліп кубтау ${wrong[0]}, 6-ға бөліп кубтау ${wrong[1]} береді; ${a*a} — бір жақтың ауданының саны, көлем емес.`;break;}
 case'opposite-corner-domino-color-obstruction':{
  const n=p.side;assert.equal(n%2,0);const left=n*n-2,dom=left/2;
  answer='Жабу мүмкін емес';wrong=[`Жабуға болады: ${left} ÷ 2 = ${dom}`,`${left} саны 3-ке бөлінбегендіктен ғана жабылмайды`,'Барлық доминоны көлденең қойса, жабылады'];
  statement=`${n} × ${n} торкөзді тақта шахматша боялған. Қарама-қарсы екі бұрышындағы бір-бір торкөз алынып тасталды. Қалған ${left} торкөзді 1 × 2 өлшемді ${dom} доминомен, кесусіз, қабаттаспай және бос орынсыз жабуға бола ма? Дұрыс тұжырымды таңдаңыз.`;
  solution=`Бастапқыда әр түстен ${n*n/2} торкөз бар. Жұп өлшемді тақтаның қарама-қарсы бұрыштары бір түсті: олардың қатар-баған нөмірлерінің қосындыларының жұптылығы бірдей. Екі бұрышты алып тастаған соң түстер саны ${n*n/2-2} және ${n*n/2}. Әр домино көршілес бір қара және бір ақ торкөзді жабады, сондықтан ${dom} домино әр түстен ${dom} торкөзді қажет етеді. Сандар тең емес, жабу мүмкін емес. ${left} ÷ 2 = ${dom} тек ауданның жеткілікті екенін көрсетеді; 3-ке бөліну бұл жерде критерий емес, доминоны бұру да түстер теңсіздігін өзгертпейді.`;break;}
 case'maximum-regions-general-circle-lines':{
  const k=p.cuts;answer=1+k*(k+1)/2;statement=`Дөңгелек жұқа қамырды ${k} түзу кесумен ең көп неше бөлікке бөлуге болады? Әр кесу қамырды бір шетінен екінші шетіне дейін өтеді. Кесулер арасында бөліктерді жылжытуға не қабаттауға болмайды.`;
  solution=`Бастапқыда бір бөлік бар. k-нші кесу алдыңғы k − 1 түзуді ең көбі k − 1 нүктеде қиып, ең көбі k жаңа бөлік қосады. Сондықтан 1 + ${Array.from({length:k},(_,i)=>i+1).join(' + ')} = ${answer}. Осы шекке жету үшін түзулердің барлық жұп қиылысуын дөңгелектің ішінде, әртүрлі нүктелерге орналастырамыз; ешбір үшеуі бір нүктеден өтпейді. Мұндай орналасу мүмкін: центр маңындағы әртүрлі бағыттағы түзулерді аздап ығыстыру жеткілікті. Бәрін центрден өткізу тек ${2*k} бөлік берер еді, ол ең үлкен сан емес.`;break;}
 case'area-after-two-perpendicular-half-folds':{
  assert.equal(p.side%2,0);answer=(p.side/2)**2;statement=`Қабырғасы ${p.side} см шаршы парақты қақ ортасынан бүктеді. Сосын бірінші бүктеуге перпендикуляр бағытта тағы қақ ортасынан бүктеді. Парақты толық жазғаннан кейін екі бүктеу сызығы бойымен қиды. Әр бөліктің ауданы неше см²?`;
  solution=`Жазылған екі бүктеу сызығы шаршыны төрт тең шаршыға бөледі. Әр кішісінің қабырғасы ${p.side} ÷ 2 = ${p.side/2} см, ауданы ${p.side/2} × ${p.side/2} = ${answer} см². Барлық бөліктің ауданы 4 × ${answer} = ${p.side**2} см², бастапқы ауданмен бірдей. Қағаз бүктеулі күйінде емес, толық жазылған соң кесілді.`;break;}
 case'shape-pair-after-parallel-cube-cut':{
  assert.ok(p.offset>0&&p.offset<p.edge);answer='Екі тікбұрышты параллелепипед';wrong=['Екі куб','Үш тікбұрышты параллелепипед','Екі үшбұрышты призма'];
  statement=`Қыры ${p.edge} см кубтың бір жағына параллель, сол жақтан ${p.offset} см қашықтықтағы жазықтықпен бір толық қима жасалды. Қандай екі дене шығады?`;
  solution=`Бір бөліктің өлшемдері ${p.edge} × ${p.edge} × ${p.offset} см, екіншісінікі ${p.edge} × ${p.edge} × ${p.edge-p.offset} см. Екеуінің де барлық жақтары тікбұрыш, сондықтан олар тікбұрышты параллелепипедтер. Үшінші өлшемдері ${p.edge} см-ге тең емес, демек куб емес. Бір жазық қима екі ғана бөлік береді; үшбұрышты жақ пайда болмайды, сондықтан үшбұрышты призмалар да шықпайды.`;break;}
 case'regions-from-distinct-diameters':{
  answer=2*p.cuts;statement=`Дөңгелек пиццада центр арқылы өтетін ${p.cuts} әртүрлі түзу кесу жасалды. Әр кесу екі шетіне дейін жетеді; ешбір кесу алдыңғысымен беттеспейді. Неше бөлік пайда болады?`;
  solution=`Әр диаметр центрден екі бөлек сәуле шығарады. ${p.cuts} әртүрлі диаметр ${p.cuts} × 2 = ${answer} сәуле береді. Көршілес сәулелердің арасындағы әр сектор бір бөлік, сондықтан ${answer} бөлік бар. Барлық түзу бір центрде қиылысатындықтан, еркін орналасқан кесулердің ең үлкен санын қолданбаймыз.`;break;}
 case'impossible-square-from-two-scalene-right-triangles':{
  const[a,b]=p.legs;assert.ok(a!==b);answer='Шаршы';wrong=['Шаршы емес тіктөртбұрыш','Үшбұрыш','Тіктөртбұрыш емес төртбұрыш'];
  statement=`Катеттері ${a} см және ${b} см болатын екі бірдей тікбұрышты үшбұрыш бар. Оларды бұруға және аударуға болады. Үшбұрыштар қабаттаспай, ұзындықтары тең толық қабырғалары бойымен жанасуы керек. Қай фигураны құрастыру мүмкін емес?`;
  solution=`Егер шаршы екі үшбұрыштан тұрса, олардың ортақ толық қабырғасы шаршының диагоналі болуы керек: шаршыны бір кесіндімен екі үшбұрышқа тек қарама-қарсы төбелерін қосып бөлуге болады. Диагональ шаршыны катеттері тең екі тікбұрышты үшбұрышқа бөледі, ал бізде ${a} ≠ ${b}. Сондықтан шаршы мүмкін емес. Қалғандары мүмкін: гипотенузалары бойымен қосу ${a} × ${b} тіктөртбұрыш береді; ${b} см катеттерін беттестіріп, үшінші төбелерін ортақ катеттің бір ұшынан екі жаққа орналастыру табаны ${2*a} см, биіктігі ${b} см үшбұрыш береді. Сол үшінші төбелерді катеттің әртүрлі ұшынан екі жаққа орналастырсақ, тік емес бұрыштары бар параллелограмм шығады. Екі үшбұрыштың аудандарының қосындысы барлық құрастыруда ${a*b} см² болып сақталады.`;break;}
 case'surface-after-corner-unit-cube-removal':{
  const n=p.countPerAxis,e=p.small,L=n*e;assert.ok(n>=2);answer=6*L*L;wrong=[answer-3*e*e,answer+3*e*e,answer-6*e*e];
  statement=`Қыры ${e} см болатын ${n**3} текшені ${n} × ${n} × ${n} ретімен қойып, тұтас үлкен куб жасады. Оның дәл бір бұрышындағы бір кіші текшені алып тастады. Қалған дененің сыртқы бетінің ауданын см²-пен таңдаңыз.`;
  solution=`Үлкен куб қыры ${n} × ${e} = ${L} см, бастапқы беті 6 × ${L} × ${L} = ${answer} см². Бұрыш текшесінің сыртта тұрған үш жағы жоғалады: 3 × ${e} × ${e} = ${3*e*e} см² кемиді. Бірақ көршілес үш текшенің дәл сондай үш жағы жаңадан ашылады, ${3*e*e} см² қосылады. Нәтиже ${answer} − ${3*e*e} + ${3*e*e} = ${answer} см². ${answer-3*e*e} тек жоғалған жақтарды, ${answer+3*e*e} тек ашылған жақтарды есептейді; алты жақты түгел шегеру де дұрыс емес.`;break;}
 case'square-side-from-sum-grid-piece-perimeters':{
  const[h,v]=p.cuts,coef=4+2*(h+v);answer=p.sumPerimeters/coef;assert.ok(Number.isInteger(answer));
  statement=`Шаршы қағазды ${h} көлденең және ${v} тік толық түзу қимамен ${(h+1)*(v+1)} тікбұрышқа бөлді. Бір бағыттағы кесулер әртүрлі орыннан өтеді, арақашықтықтарының бірдей болуы міндетті емес. Бөліктердің барлық периметрлерінің қосындысы ${p.sumPerimeters} см. Шаршының қабырғасы неше сантиметр?`;
  solution=`Қабырғаны a дейік. Сыртқы төрт қабырға қосындыға бір рет кіреді: 4a. Ішкі ${h+v} толық қиманың әрқайсысы a ұзындықта, екі жағындағы бөліктерде екі рет саналады: 2 × ${h+v} × a = ${2*(h+v)}a. Барлығы ${coef}a = ${p.sumPerimeters}, сондықтан a = ${p.sumPerimeters} ÷ ${coef} = ${answer} см. Қай жерден кескеніміз бұл қосындыға әсер етпейді. Мысалы, әр бағытта ені 3, 5 және 7 см болатын үш жолақ алсақ, 9 тіктөртбұрыштың периметрлерін қосу да ${p.sumPerimeters} см береді.`;break;}
 case'grid-cells-crossed-by-diagonal':{
  const[a,b]=[p.length,p.width],g=gcd(a,b);answer=a+b-g;
  statement=`Торкөз қағазда ${a} × ${b} торкөздік тікбұрыш белгіленді. Бір диагоналі бойымен қиғанда қанша торкөздің іші арқылы өтеді? Тек төбесіне тиіп өтетін, бірақ іші қиылмайтын торкөздер саналмайды.`;
  solution=`Ішкі тік тор сызықтары ${a-1}, көлденең сызықтар ${b-1}. Диагональ олардың ортақ ${g-1} ішкі түйінінен өтеді, себебі ${a} пен ${b} сандарының ең үлкен ортақ бөлгіші ${g}. Әр түйінде екі қиылысты біреу деп санау керек. Бастапқы торкөзді қосамыз: 1 + ${a-1} + ${b-1} − ${g-1} = ${answer}. Тексеру: диагональ ${g} бірдей ${a/g} × ${b/g} бөлікке бөлінеді; әр бөлікте ${a/g+b/g-1} торкөз, барлығы ${g} × ${a/g+b/g-1} = ${answer}.`;break;}
 default:throw Error(kind);
 }
 if(!wrong){statement+=' Жауапқа тек санды жазыңыз.';assert.match(String(answer),/^\d+$/);}
 const out={statement,solution,answer:String(answer)};
 if(wrong){out.options=[String(answer),...wrong.map(String)];assert.equal(new Set(out.options).size,4);}
 assert.ok(!/[\\$]/.test(statement+solution));return out;
}
function makeRow(s,index){const source=sources.get(s.id);assert.ok(source);const content=render(s.kind,s.params);
 if(content.options){const shift=index%4;content.options=[...content.options.slice(shift),...content.options.slice(0,shift)];}
 return {editionId:prefix+s.id,modelId:prefix+s.kind,grade:5,topic:s.kind.includes('domino')?'logic':'geo',difficulty:source.level===1?'basic':source.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(s.params),sourceRefs:[{sourceFile:source.sourceFile,sourceId:source.sourceId}],adaptationChanges:[
 'Толық сақталған шарт, ресми шешім және барлық жауап нұсқасы жеке оқылды. Жаңа мәтіндер мен өлшемдер берілді, бастапқы математикалық мақсат пен жауаптардың қате пайымдау рөлдері сақталды. Куб жазбасының қыр саны сияқты өзгермейтін фактілер жаңа мағына деп саналмайды.',
 'Кесулердің толықтығы, бағыттары, бөліктерді қозғалтпау және оң өлшемдер ашық көрсетілді. Ең үлкен/кіші мәндерге жоғарғы не төменгі шекпен бірге нақты құрастыру немесе барлық жарамды бүтін жағдай берілді. Екі үшбұрыштан шаршының мүмкін еместігі дұрыс диагональ дәлелімен түсіндірілді.',
 'Растр көшірілмеді. Ашық жауаптар бүтін сан, мәтіндік жауаптар төрт нұсқалы. Авторлық есептеуге қоса бөлек геометриялық/дәл арифметикалық тексеру қажет; адам рецензенттен өтті деген мәлімдеме жоқ.',s.note],editorialStatus:'awaiting_independent_computational_review',...content};
}
const byId=new Map(SPECS.map((s,i)=>[prefix+s.id,{s,i}]));
export const buildEditions=()=>SPECS.map(makeRow);
export function verifyEdition(row){const item=byId.get(row.editionId);assert.ok(item);const expected=makeRow(item.s,item.i);assert.equal(canonicalEdition(row),canonicalEdition(expected),'Changed cutting-solids text, key, options, params or source');return{answer:expected.answer,checks:['source-specific mathematical target and distractors','complete source and authored text bound','parallel cuts, positive dimensions, existence and extremum','separate computational checker required; no separate human reviewer claimed']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const r of editions)verifyEdition(r);fs.writeFileSync(new URL('../../problems/editorial/batches/'+name+'.json',import.meta.url),JSON.stringify({schemaVersion:1,scope:'All 27 saved nonvisual grade5 9.2 occurrences. Local Standard+ adaptations; no source capture or publication. Fixed facts and numerical variants are not semantic novelty counts.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions},null,2)+'\n');console.log(JSON.stringify({authored:editions.length}));}
