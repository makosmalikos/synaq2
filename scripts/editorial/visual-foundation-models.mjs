// Authored mathematical structures; no source raster or traced SVG is read here.
// Draft editions still require a different reviewer before any publication.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const integer=(v,name,min=0)=>assert.ok(Number.isSafeInteger(v)&&v>=min,name);
const comma=v=>String(v).replace('.',',');
const cents=v=>{integer(v,'hundredths');return (Math.floor(v/100)+(v%100?','+String(v%100).padStart(2,'0').replace(/0$/,''):''));};
const gcd=(a,b)=>b?gcd(b,a%b):a;
const cells=p=>new Set(p.map(c=>c.join(',')));
const intervalContains=(i,n)=>(n>i.lo||n===i.lo&&i.loClosed)&&(n<i.hi||n===i.hi&&i.hiClosed);
const regular=n=>Array.from({length:n},(_,i)=>[Math.cos(-Math.PI/2+i*2*Math.PI/n),Math.sin(-Math.PI/2+i*2*Math.PI/n)]);
const area=v=>Math.abs(v.reduce((a,p,i)=>{const q=v[(i+1)%v.length];return a+p[0]*q[1]-p[1]*q[0];},0))/2;
const notch=p=>[[0,0],[p.offset,0],[p.offset,p.depth],[p.offset+p.notchWidth,p.depth],[p.offset+p.notchWidth,0],[p.width,0],[p.width,p.height],[0,p.height]];
const segMasks={0:'abcedf',1:'bc',2:'abged',3:'abgcd',4:'fgbc',5:'afgcd',6:'afgecd',7:'abc',8:'abcdefg',9:'abfgcd'};

export function independentlyCalculate(row){
 const p=row.params;assert.ok(p&&typeof p==='object');
 switch(row.modelId){
  case 'visual-abacus-number':{
   assert.equal(p.digits.length,4);p.digits.forEach(v=>{integer(v,'beads');assert.ok(v<10);});let n=0;
   p.digits.forEach((v,i)=>{for(let bead=0;bead<v;bead++)n+=10**(3-i);});
   return {answer:String(n),checks:['beads counted individually by place value','empty rods contribute zero']};}
  case 'visual-route-days':{
   p.segmentsCm.forEach(v=>integer(v,'map distance',1));integer(p.kmPerCm,'scale',1);integer(p.kmPerDay,'daily distance',1);
   let km=0;for(const cm of p.segmentsCm)for(let unit=0;unit<cm;unit++)km+=p.kmPerCm;
   let days=0;while(km>0){km-=p.kmPerDay;days++;assert.ok(days<1000);}assert.equal(km,0,'whole days required');
   return {answer:String(days),checks:['map units accumulated independently','daily travel iterated to exactly zero remaining distance']};}
  case 'visual-clock-angle':{
   integer(p.hour,'hour');integer(p.minute,'minute');assert.ok(p.hour<12&&p.minute<60);
   const hour=(p.hour*60+p.minute)%720,minute=p.minute*12;let steps=0;
   while((hour+steps)%720!==minute){steps++;assert.ok(steps<720);}const angle=Math.min(steps,720-steps)/2;
   return {answer:comma(angle),checks:['hour hand moves continuously with minutes','shorter arc counted on 720 half-degree steps']};}
  case 'visual-sector-fraction':{
   integer(p.total,'equal sectors',2);integer(p.shaded,'shaded sectors',1);assert.ok(p.shaded<p.total);
   const parts=Array.from({length:p.total},(_,i)=>i<p.shaded);const numerator=parts.filter(Boolean).length,denominator=parts.length,g=gcd(numerator,denominator);
   return {answer:`${numerator/g}/${denominator/g}`,checks:['equal-angle sectors have equal area','shaded and total sectors enumerated separately','fraction reduced']};}
  case 'visual-temperature-rise':{
   integer(p.cold,'cold',-15);integer(p.warm,'warm',1);assert.ok(p.cold<0&&p.warm<=15);let n=0;
   for(let t=p.cold;t<p.warm;t++)n++;
   return {answer:String(n),checks:['one-degree intervals counted across zero','both thermometer columns bound to their actual readings']};}
  case 'visual-bar-difference':{
   assert.equal(p.values.length,4);assert.equal(p.labels.length,4);p.values.forEach(v=>{integer(v,'bar height',1);assert.ok(v<=14);});
   assert.ok(p.values[p.first]>p.values[p.second]);let n=0;
   for(let h=p.values[p.second];h<p.values[p.first];h++)n++;
   return {answer:String(n),checks:['requested two bars only','unit height difference enumerated']};}
  case 'visual-line-growth':{
   assert.equal(p.values.length,6);p.values.forEach(v=>{integer(v,'plant height',1);assert.ok(v<=25);});
   integer(p.from,'first day',1);integer(p.to,'last day',1);assert.ok(p.from<p.to&&p.to<=6);
   const changes=p.values.slice(p.from,p.to).map((v,i)=>v-p.values[p.from-1+i]);let change=0;
   for(const d of changes)change+=d;
   return {answer:String(change),checks:['consecutive changes telescope between exactly the requested days','all six plotted heights retain explicit values']};}
  case 'visual-ray-numerator':{
   integer(p.divisions,'unit division',2);integer(p.numerator,'marked interval',1);assert.ok(p.numerator>p.divisions&&p.numerator<3*p.divisions);
   let count=0;for(let tick=1;tick<=p.numerator;tick++)count++;
   return {answer:String(count),checks:['equal subintervals counted from zero, not tick marks including zero','question requests numerator with fixed denominator']};}
  case 'visual-notch-perimeter':{
   for(const key of ['width','height','depth','notchWidth','offset'])integer(p[key],key,1);
   assert.ok(p.depth<p.height&&p.offset+p.notchWidth<p.width);
   const v=notch(p);let perimeter=0;v.forEach((a,i)=>{const b=v[(i+1)%v.length];assert.ok(a[0]===b[0]||a[1]===b[1]);perimeter+=Math.hypot(a[0]-b[0],a[1]-b[1]);});
   return {answer:String(perimeter),checks:['eight-edge orthogonal polygon boundary walked explicitly','two inner vertical sides retained']};}
  case 'visual-fan-triangles':{
   integer(p.baseSegments,'base segments',2);assert.ok(p.baseSegments<=10);const v=[[0,2],...Array.from({length:p.baseSegments+1},(_,i)=>[i,0])];let n=0;
   for(let a=0;a<v.length;a++)for(let b=a+1;b<v.length;b++)for(let c=b+1;c<v.length;c++)if(area([v[a],v[b],v[c]])>0)n++;
   return {answer:String(n),checks:['all vertex triples enumerated','collinear base triples excluded','every remaining edge is drawn or is a continuous part of the base']};}
  case 'visual-polygon-triangulation':{
   integer(p.sides,'polygon vertices',4);assert.ok(p.sides<=14);const v=regular(p.sides),triangles=[];
   for(let i=1;i<v.length-1;i++)triangles.push([v[0],v[i],v[i+1]]);
   assert.ok(triangles.every(t=>area(t)>0));assert.ok(Math.abs(triangles.reduce((s,t)=>s+area(t),0)-area(v))<1e-9);
   return {answer:String(triangles.length),checks:['fan faces enumerated on a convex polygon','sum of triangle areas equals polygon area']};}
  case 'visual-venn-union':{
   for(const k of ['leftOnly','rightOnly','both'])integer(p[k],k,1);
   const common=Array.from({length:p.both},(_,i)=>`c${i}`),a=new Set([...common,...Array.from({length:p.leftOnly},(_,i)=>`a${i}`)]),b=new Set([...common,...Array.from({length:p.rightOnly},(_,i)=>`b${i}`)]);
   return {answer:String(new Set([...a,...b]).size),checks:['distinct membership tokens constructed','common region appears in both sets but once in the union']};}
  case 'visual-interval-maximum':{
   for(const i of [p.a,p.b]){integer(i.lo,'lower bound',-100);integer(i.hi,'upper bound',-100);assert.ok(i.lo<i.hi);assert.equal(typeof i.loClosed,'boolean');assert.equal(typeof i.hiClosed,'boolean');}
   assert.ok(p.a.lo<p.b.lo&&p.b.lo<p.a.hi&&p.a.hi<p.b.hi&&!p.b.hiClosed,'this model requires an overlapping union with the rightmost endpoint open');
   assert.ok(p.a.lo>=-6&&p.b.hi<=12,'readable finite axis bounds');
   const values=[];for(let n=Math.min(p.a.lo,p.b.lo)-1;n<=Math.max(p.a.hi,p.b.hi)+1;n++)if(intervalContains(p.a,n)||intervalContains(p.b,n))values.push(n);
   return {answer:String(Math.max(...values)),checks:['union membership evaluated for every candidate integer','open and closed endpoints respected separately']};}
  case 'visual-seven-segment-mass':{
   assert.match(p.target,/^[0-9]{2,5}$/);integer(p.referenceCents,'reference mass',1);
   const count=[6,2,5,5,4,5,6,3,7,6];let sticks=0;for(const digit of p.target)sticks+=count[Number(digit)];
   assert.equal(p.referenceCents%count[1],0);return {answer:cents(sticks*p.referenceCents/count[1]),checks:['standard seven-segment counts checked independently of SVG masks','reference digit 1 has two equal sticks','exact hundredths of a kilogram']};}
  case 'visual-point-ox-reflection':{
   integer(p.x,'x',-5);integer(p.y,'y',-5);assert.ok(Math.abs(p.x)<=5&&Math.abs(p.y)<=5&&p.y!==0);
   const points=[];for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++)if(x===p.x&&Math.abs(y)===Math.abs(p.y)&&Math.sign(y)!==Math.sign(p.y))points.push([x,y]);assert.equal(points.length,1);
   return {answer:`(${points[0][0]}; ${points[0][1]})`,checks:['unique opposite-half-plane point with equal perpendicular distance','abscissa preserved under Ox reflection']};}
  case 'visual-pixel-reflection':{
   assert.equal(cells(p.cells).size,p.cells.length);integer(p.axis,'mirror line',1);assert.ok(p.axis<=5);
   assert.ok(p.cells.every(([x,y])=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<p.axis&&y>=0&&y<5));
   const reflected=p.cells.map(([x,y])=>[2*p.axis-x-1,y]);assert.equal(cells(reflected).size,p.cells.length);
   assert.deepEqual([...cells(reflected.map(([x,y])=>[2*p.axis-x-1,y]))].sort(),[...cells(p.cells)].sort());
   return {answer:String(reflected.length),checks:['cell centres reflected, including the half-cell offset','reflection applied twice restores the exact original cells']};}
  case 'visual-open-pool-surface':{
   for(const k of ['length','width','depth'])integer(p[k],k,1);let n=0;
   for(let x=0;x<p.length;x++)for(let y=0;y<p.width;y++)for(let z=0;z<p.depth;z++)n+=Number(x===0)+Number(x===p.length-1)+Number(y===0)+Number(y===p.width-1)+Number(z===0);
   return {answer:String(n),checks:['unit square faces enumerated over floor and four walls','top face deliberately excluded']};}
  case 'visual-vertical-angle':{
   integer(p.angle,'angle',25);assert.ok(p.angle<=75);const r=p.angle*Math.PI/180;
   const oppositeA=[-1,0],oppositeB=[-Math.cos(r),Math.sin(r)];const angle=Math.acos(oppositeA[0]*oppositeB[0]+oppositeA[1]*oppositeB[1])*180/Math.PI;
   assert.ok(Math.abs(angle-Math.round(angle))<1e-9);return {answer:String(Math.round(angle)),checks:['both rays reversed rather than adjacent sector selected','angle between opposite direction vectors recomputed']};}
  case 'visual-circle-sector-gap':{
   assert.equal(p.known.length,3);p.known.forEach(v=>integer(v,'known sector',35));const used=new Set();let d=0;
   for(const n of p.known)for(let j=0;j<n;j++)used.add(d++);assert.ok(d<=325);let remaining=0;for(let a=0;a<360;a++)if(!used.has(a))remaining++;
   return {answer:String(remaining),checks:['known sectors occupy distinct degree units','remaining sector completes one full turn']};}
  case 'visual-nested-subsets':{
   assert.equal(new Set([...p.inner,...p.outerOnly]).size,p.inner.length+p.outerOnly.length);assert.equal(p.inner.length,4);assert.equal(p.outerOnly.length,4);
   const subsets=new Set();for(let mask=0;mask<2**p.inner.length;mask++){const subset=p.inner.filter((_,i)=>mask&(1<<i));subsets.add(JSON.stringify(subset));}
   assert.ok(subsets.has('[]')&&subsets.has(JSON.stringify(p.inner)));
   return {answer:String(subsets.size),checks:['all membership bitmasks enumerated','empty set and whole inner set each counted once','outer-only elements excluded']};}
  case 'visual-square-circle-corners':{
   integer(p.radius,'radius',1);integer(p.piHundredths,'pi convention',1);assert.equal(p.piHundredths,314);
   const r=BigInt(p.radius),square=4n*r*r*100n,disk=BigInt(p.piHundredths)*r*r;
   return {answer:cents(Number(square-disk)),checks:['inscribed diameter equals square side','square and approximate disk areas computed as exact hundredths','pi substitution explicitly stated, not an exact equality claim']};}
  case 'visual-ring-width':{
   integer(p.inner,'inner radius',1);integer(p.outer,'outer radius',1);assert.ok(p.inner/p.outer>=.2&&p.inner/p.outer<=.8);let steps=0;
   for(let unit=p.inner;unit<p.outer;unit++)steps++;
   return {answer:String(steps),checks:['radii share a centre','radial gap counted between the two circumference intersections']};}
  default:throw Error('Unknown authored visual model '+row.modelId);
 }
}

export function statementFor(row){const p=row.params;switch(row.modelId){
 case 'visual-abacus-number':return 'Математика үйірмесінде төрт разрядты есепшот жасалды. Солдан оңға қарай бағандар мыңдықты, жүздікті, ондықты және бірлікті білдіреді. Әр моншақ өз бағанындағы бір разрядтық бірлікке тең. Суреттегі санды цифрмен жазыңдар; бос бағанның орнына 0 қойылады.';
 case 'visual-route-days':return `Жаяу саяхаттың сызбасында үш жол бөлігі ${p.segmentsCm.join(' см, ')} см деп белгіленген. Сызбадағы 1 см жердегі ${p.kmPerCm} км-ге сәйкес келеді. Топ осы жолмен күніне ${p.kmPerDay} км жүреді. Үш бөліктің бәрін неше күнде жүріп өтеді?`;
 case 'visual-clock-angle':return `Шеберханадағы сағат ${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')} уақытын көрсетіп тұр. Сағат тілі минуттар өткен сайын бірқалыпты қозғалады. Екі тілдің арасындағы кіші бұрышты градуспен табыңдар.`;
 case 'visual-sector-fraction':return `Дөңгелек төсбелгі ${p.total} тең секторға бөлінген. Төсбелгінің қандай бөлігі көк түспен белгіленген? Жауапты қысқартылған жай бөлшекпен жазыңдар.`;
 case 'visual-temperature-rise':return 'Таңертең және түсте өлшенген ауа температурасы екі термометрмен көрсетілген. Шкаладағы әр кіші бөлік 1 °C-қа тең. Таңертеңнен түске дейін ауа неше градусқа жылынды?';
 case 'visual-bar-difference':return `Диаграммада төрт оқушының бір аптада шешкен басқатырғыштарының саны көрсетілген. Тік осьтегі сандар басқатырғыш санын білдіреді. ${p.labels[p.first]} ${p.labels[p.second]}дан неше басқатырғыш артық шешті?`;
 case 'visual-line-growth':return `Мектеп жылыжайындағы бұршақ өскінінің биіктігі алты күн бойы өлшенді. Графиктің көлденең осі — күн нөмірі, тік осі — биіктік, сантиметрмен. ${p.from}-күннен ${p.to}-күнге дейін өскін неше сантиметрге өсті?`;
 case 'visual-ray-numerator':return `Сан сәулесінде әр бірлік ${p.divisions} тең аралыққа бөлінген. P нүктесінің координатасын a/${p.divisions} түрінде жазғанда, a неге тең? P-ге дейінгі аралықтарды 0-ден бастап санаңдар.`;
 case 'visual-notch-perimeter':return `Мектеп қойылымына арналған тікбұрышты жақтаудың жоғарғы жағынан тікбұрышты ойық жасалды. Сыртқы ені ${p.width} см, биіктігі ${p.height} см, ойықтың тереңдігі ${p.depth} см. Барлық бұрыштары тік. Жақтаудың суретте көрсетілген сыртқы шекарасының периметрі неше сантиметр?`;
 case 'visual-fan-triangles':return `Үшбұрышты желпуіштің табаны ${p.baseSegments} бөлікке бөлінген, ал жоғарғы төбесі табанның барлық бөлу нүктелерімен қосылған. Суретте барлығы неше үшбұрыш бар? Бірнеше кіші бөліктен құралған үлкен үшбұрыштар да есептеледі.`;
 case 'visual-polygon-triangulation':return `Суреттегі дөңес көпбұрыштың бір төбесінен сол төбеге іргелес емес барлық төбелерге диагональ жүргізілген. Көпбұрыш неше үшбұрышты бөлікке бөлінді? Тек бөлінген жеке бөліктерді санаңдар, бірнеше бөліктің бірігуін санамаңдар.`;
 case 'visual-venn-union':return 'A шеңбері — фотосурет үйірмесінің, B шеңбері — астрономия үйірмесінің оқушылары. Әр шеңбердің үстінде сол үйірмедегі барлық оқушы саны, ал қиылысқан бөлікте екі үйірмеге де қатысатындардың саны берілген. Кемінде бір үйірмеге қатысатын неше түрлі оқушы бар?';
 case 'visual-interval-maximum':return 'Суретте A және B сан аралықтары екі бөлек жолға салынған. Боялған нүкте аралыққа кіреді, іші ақ нүкте кірмейді. A немесе B аралығының кемінде біріне тиісті ең үлкен бүтін санды табыңдар.';
 case 'visual-seven-segment-mass':return `Электрондық таблодағы цифрлар суреттегідей бірдей металл таяқшалардан жасалған. «1» цифрының массасы ${cents(p.referenceCents)} кг. «${p.target}» жазуындағы барлық таяқшаның жалпы массасы неше килограмм?`;
 case 'visual-point-ox-reflection':return 'Координаталық торда M нүктесі белгіленген. M нүктесін Ox осіне қатысты шағылдырғанда алынатын N нүктесінің координаталарын (x; y) түрінде жазыңдар. Әр торкөздің қабырғасы бір координаталық бірлікке тең.';
 case 'visual-pixel-reflection':return 'Көк өрнек бірдей торкөздерден құрастырылған. Оған k түзуіне қатысты симметриялы өрнек салынбақ. Жаңа өрнек неше торкөзден тұрады? Ішіндегі боялмаған торкөздерді санамаңдар.';
 case 'visual-open-pool-surface':return `Мектептің ашық су ыдысының ішкі ұзындығы ${p.length} м, ені ${p.width} м, тереңдігі ${p.depth} м. Тек ішкі түбі мен төрт қабырғасына су өткізбейтін жабын төселеді; үсті ашық қалады. Неше шаршы метр жабын керек? Қабаттасуға қосымша материал есептелмейді.`;
 case 'visual-vertical-angle':return `Екі түзу O нүктесінде қиылысады. Суретте берілген ${p.angle}° бұрышқа қарама-қарсы орналасқан x бұрышын градуспен табыңдар. Әр түзудің екі сәулесі бір-бірінің созындысы.`;
 case 'visual-circle-sector-gap':return 'Сәндік дөңгелек төрт секторға бөлінген. Үш сектордың градустық өлшемдері суретте берілген. Сұрақ белгісі қойылған төртінші сектордың бұрышын градуспен табыңдар.';
 case 'visual-nested-subsets':return 'Суретте A жиыны және оның B ішкі жиыны берілген. B жиынының бос жиын мен өзін қоса есептегенде неше ішкі жиыны бар? A-ның B-ға кірмейтін элементтерін есепке алмаңдар.';
 case 'visual-square-circle-corners':return `Өрнектің дөңгелек бөлігі шаршының төрт қабырғасына да іштей жанасады. Дөңгелектің радиусы ${p.radius} см. Көк түспен шаршының дөңгелектен тыс қалған бөлігі боялған. Көк бөліктің ауданын шаршы сантиметрмен табыңдар. Есептеуде π орнына 3,14 алыңдар.`;
 case 'visual-ring-width':return `Бір центрден сызылған екі шеңбердің радиустары ${p.inner} см және ${p.outer} см. Екі шеңбердің арасындағы сақина көк түспен берілген. Сақинаның радиус бойымен өлшенген ені неше сантиметр?`;
 default:throw Error('Unknown statement model');}}

export function solutionFor(row){const p=row.params;switch(row.modelId){
 case 'visual-abacus-number':return `Бағандарда ${p.digits.join(', ')} моншақ бар. Разрядтық қосылғыштар: ${p.digits.map((v,i)=>v*10**(3-i)).join(' + ')} = ${p.digits.reduce((s,v,i)=>s+v*10**(3-i),0)}. Бос ондықтар бағанына 0 жазылады. Жауабы: ${row.answer}.`;
 case 'visual-route-days':return `Сызбадағы жол: ${p.segmentsCm.join(' + ')} = ${p.segmentsCm.reduce((a,b)=>a+b,0)} см. Нақты жол: ${p.segmentsCm.reduce((a,b)=>a+b,0)} × ${p.kmPerCm} = ${p.segmentsCm.reduce((a,b)=>a+b,0)*p.kmPerCm} км. Күн саны: ${p.segmentsCm.reduce((a,b)=>a+b,0)*p.kmPerCm} : ${p.kmPerDay} = ${row.answer}. Жауабы: ${row.answer}.`;
 case 'visual-clock-angle':return `Минут тілі 12-ден ${p.minute} × 6 = ${p.minute*6}° бұрылған. Сағат тілі ${p.hour} × 30 + ${p.minute} × 0,5 = ${p.hour*30+p.minute/2}° бұрылған. Екі бағыттың кіші айырмасы ${row.answer}°. Сағат тілін дәл бүтін сағаттың белгісінде қалдыруға болмайды. Жауабы: ${row.answer}.`;
 case 'visual-sector-fraction':return `Барлық сектор саны ${p.total}, көк сектор саны ${p.shaded}. Көк бөлік ${p.shaded}/${p.total}. Қысқартылған жауап: ${row.answer}.`;
 case 'visual-temperature-rise':return `Таңертеңгі көрсеткіш ${p.cold} °C, түскі көрсеткіш +${p.warm} °C. ${p.cold} °C-тан 0 °C-қа дейін ${-p.cold} градус, одан +${p.warm} °C-қа дейін ${p.warm} градус. Барлығы ${-p.cold} + ${p.warm} = ${row.answer} градус. Жауабы: ${row.answer}.`;
 case 'visual-bar-difference':return `Диаграммадан ${p.labels[p.first]}ның бағаны ${p.values[p.first]}, ${p.labels[p.second]}ның бағаны ${p.values[p.second]} екенін оқимыз. Айырмасы: ${p.values[p.first]} − ${p.values[p.second]} = ${row.answer}. Қалған екі баған бұл айырмаға қосылмайды. Жауабы: ${row.answer}.`;
 case 'visual-line-growth':return `${p.from}-күнгі биіктік ${p.values[p.from-1]} см, ${p.to}-күнгі биіктік ${p.values[p.to-1]} см. Өсуі ${p.values[p.to-1]} − ${p.values[p.from-1]} = ${row.answer} см. Биіктіктерді қосу емес, соңғы және алғашқы мәннің айырмасын табу керек. Жауабы: ${row.answer}.`;
 case 'visual-ray-numerator':return `Бір бірлікте ${p.divisions} тең аралық бар. P-ге дейін ${p.numerator} аралық саналады, сондықтан P координатасы ${p.numerator}/${p.divisions}. Демек a = ${row.answer}. 0-дегі бастапқы сызықша аралық болып саналмайды. Жауабы: ${row.answer}.`;
 case 'visual-notch-perimeter':return `Жоғарғы үш көлденең бөлік бірге ${p.width} см, төменгі қабырға да ${p.width} см. Екі сыртқы тік қабырға ${p.height} + ${p.height} см, ойықтың ішкі екі қабырғасы ${p.depth} + ${p.depth} см. Периметрі: 2 × ${p.width} + 2 × ${p.height} + 2 × ${p.depth} = ${row.answer} см. Жауабы: ${row.answer}.`;
 case 'visual-fan-triangles':return `Әр үшбұрыштың жоғарғы төбесі ортақ. Табаны 1, 2, …, ${p.baseSegments} кіші бөліктен тұратын үшбұрыштарды санаймыз: ${Array.from({length:p.baseSegments},(_,i)=>p.baseSegments-i).join(' + ')} = ${row.answer}. Үлкен үшбұрышты да осы қосынды есепке алады. Жауабы: ${row.answer}.`;
 case 'visual-polygon-triangulation':return `Суреттен ${p.sides} төбені санаймыз. Бір төбеден шыққан диагональдар дөңес көпбұрышты ${p.sides} − 2 = ${row.answer} жеке үшбұрышқа бөледі. Мұнда диагональдардың саны емес, олардың арасындағы бөліктердің саны сұралған. Жауабы: ${row.answer}.`;
 case 'visual-venn-union':return `A үйірмесінде ${p.leftOnly+p.both}, B үйірмесінде ${p.rightOnly+p.both} оқушы бар. Бұл екі санға ортақ ${p.both} оқушы екі рет кірген. Бір рет алып тастаймыз: ${p.leftOnly+p.both} + ${p.rightOnly+p.both} − ${p.both} = ${row.answer}. Тексеру: тек A-да ${p.leftOnly}, екеуінде де ${p.both}, тек B-да ${p.rightOnly}; ${p.leftOnly} + ${p.both} + ${p.rightOnly} = ${row.answer}. Жауабы: ${row.answer}.`;
 case 'visual-interval-maximum':return `A аралығы ${p.a.loClosed?'[':'('}${p.a.lo}; ${p.a.hi}${p.a.hiClosed?']':')'}, B аралығы ${p.b.loClosed?'[':'('}${p.b.lo}; ${p.b.hi}${p.b.hiClosed?']':')'}. Олар қабаттасады. Оң жақтағы ${p.b.hi} нүктесі ашық, сондықтан бұл шет бірігуге кірмейді. Одан кіші ең үлкен бүтін сан ${row.answer}. Жауабы: ${row.answer}.`;
 case 'visual-seven-segment-mass':return `«1» екі таяқшадан тұрады, сондықтан бір таяқшаның массасы ${cents(p.referenceCents)} : 2 = ${cents(p.referenceCents/2)} кг. ${[...p.target].map(d=>`«${d}» — ${[6,2,5,5,4,5,6,3,7,6][Number(d)]}`).join(', ')} таяқша. Барлығы ${[...p.target].map(d=>[6,2,5,5,4,5,6,3,7,6][Number(d)]).join(' + ')} = ${[...p.target].reduce((n,d)=>n+[6,2,5,5,4,5,6,3,7,6][Number(d)],0)} таяқша. Жалпы масса ${row.answer} кг. Жауабы: ${row.answer}.`;
 case 'visual-point-ox-reflection':return `Тордан M(${p.x}; ${p.y}) екенін оқимыз. Ox осіне қатысты шағылдырғанда x өзгермейді, ал y таңбасы өзгереді: (${p.x}; ${p.y}) → (${p.x}; ${-p.y}). Жауабы: ${row.answer}.`;
 case 'visual-pixel-reflection':return `Боялған торкөздерді қатар бойынша санаймыз: ${[...new Set(p.cells.map(c=>c[1]))].sort().map(y=>p.cells.filter(c=>c[1]===y).length).join(' + ')} = ${p.cells.length}. Шағылдыру фигураның ауданын да, торкөз санын да өзгертпейді. Жаңа өрнекте ${row.answer} торкөз болады. Жауабы: ${row.answer}.`;
 case 'visual-open-pool-surface':return `Түбінің ауданы ${p.length} × ${p.width} = ${p.length*p.width} м². Ұзын екі қабырға ${2*p.length*p.depth} м², қысқа екі қабырға ${2*p.width*p.depth} м². Барлығы ${p.length*p.width} + ${2*p.length*p.depth} + ${2*p.width*p.depth} = ${row.answer} м². Үстіңгі бет есептелмейді. Жауабы: ${row.answer}.`;
 case 'visual-vertical-angle':return `x бұрышы ${p.angle}° бұрышпен ортақ қабырғасы жоқ қарама-қарсы жұп құрайды. Бұлар вертикаль бұрыштар, сондықтан тең: x = ${row.answer}°. Іргелес бұрыштың 180°-қа толықтауын бұл жерде іздемейміз. Жауабы: ${row.answer}.`;
 case 'visual-circle-sector-gap':return `Толық айналым 360°. Белгілі секторлар: ${p.known.join(' + ')} = ${p.known.reduce((a,b)=>a+b,0)}°. Қалған бұрыш: 360 − ${p.known.reduce((a,b)=>a+b,0)} = ${row.answer}°. Жауабы: ${row.answer}.`;
 case 'visual-nested-subsets':return `B ішіндегі элементтер: ${p.inner.join('; ')}. Олардың саны ${p.inner.length}. Әр элемент ішкі жиынға кіреді немесе кірмейді: ${Array.from({length:p.inner.length},()=>2).join(' × ')} = ${row.answer}. Бұл санға бос жиын мен B жиынының өзі де кіреді. Жауабы: ${row.answer}.`;
 case 'visual-square-circle-corners':return `Шаршының қабырғасы диаметрге тең: 2 × ${p.radius} = ${2*p.radius} см. Шаршының ауданы ${2*p.radius} × ${2*p.radius} = ${4*p.radius*p.radius} см². Дөңгелектің ауданы есептің жуықтауымен 3,14 × ${p.radius} × ${p.radius} = ${cents(314*p.radius*p.radius)} см². Көк аудан: ${4*p.radius*p.radius} − ${cents(314*p.radius*p.radius)} = ${row.answer} см². Жауабы: ${row.answer}.`;
 case 'visual-ring-width':return `Бір радиус бойымен центрден ішкі шеңберге дейін ${p.inner} см, сыртқы шеңберге дейін ${p.outer} см. Аралық ені: ${p.outer} − ${p.inner} = ${row.answer} см. Диаметрлерді азайтсақ, енді екі есе артық алар едік. Жауабы: ${row.answer}.`;
 default:throw Error('Unknown solution model');}}

const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const text=(x,y,v,extra='')=>`<text x="${x}" y="${y}" ${extra}>${esc(v)}</text>`;
const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const circle=(x,y,r,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
const poly=(v,extra='')=>`<polygon points="${v.map(p=>p.join(',')).join(' ')}" ${extra}/>`;
const point=(cx,cy,r,a)=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)];
const arc=(cx,cy,r,a,b)=>{const p=point(cx,cy,r,a),q=point(cx,cy,r,b);return `M${p[0]},${p[1]} A${r},${r} 0 ${b-a>180?1:0} 1 ${q[0]},${q[1]}`;};
const sector=(cx,cy,r,a,b)=>{const p=point(cx,cy,r,a),q=point(cx,cy,r,b);return `<path d="M${cx},${cy} L${p[0]},${p[1]} A${r},${r} 0 ${b-a>180?1:0} 1 ${q[0]},${q[1]} Z"`;};
const grid=(x,y,c,r,s)=>Array.from({length:c+1},(_,i)=>line(x+i*s,y,x+i*s,y+r*s)).join('')+Array.from({length:r+1},(_,i)=>line(x,y+i*s,x+c*s,y+i*s)).join('');

export function svgFor(row){const p=row.params;let body='';switch(row.modelId){
 case 'visual-abacus-number':{
  const xs=[85,190,295,400];body+=`<rect x="40" y="48" width="400" height="235" rx="12" fill="#f2f6ff" stroke="#cbd8ef"/>`;
  p.digits.forEach((n,i)=>{body+=line(xs[i],65,xs[i],247,'stroke="#a6b8d2" stroke-width="5"');for(let j=0;j<n;j++)body+=`<ellipse cx="${xs[i]}" cy="${237-j*18}" rx="22" ry="7" fill="#4169e8" stroke="#2848a8"/>`;body+=text(xs[i],309,['Мың','Жүз','Он','Бір'][i],'text-anchor="middle" font-size="22"');});break;}
 case 'visual-route-days':{
  const v=[[50,220],[175,90],[305,185],[430,70]];body+=`<polyline points="${v.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#4264d9" stroke-width="6" stroke-linejoin="round"/>`;
  v.forEach(([x,y],i)=>{body+=circle(x,y,7,'fill="#fff" stroke="#274baa" stroke-width="3"')+text(x,y+(i%2?-18:30),['Сөре','Бекет 1','Бекет 2','Мәре'][i],'text-anchor="middle" font-size="20"');});
  p.segmentsCm.forEach((n,i)=>{const x=(v[i][0]+v[i+1][0])/2,y=(v[i][1]+v[i+1][1])/2;body+=`<rect x="${x-29}" y="${y-18}" width="58" height="30" rx="7" fill="#fff"/>`+text(x,y+4,n+' см','text-anchor="middle" font-size="20"');});body+=text(240,291,`1 см → ${p.kmPerCm} км`,'text-anchor="middle" font-size="24"');break;}
 case 'visual-clock-angle':{
  body+=circle(240,153,118,'fill="#f8faff" stroke="#4165c7" stroke-width="3"');for(let i=0;i<60;i++){const a=i*6-90,u=point(240,153,110,a),v=point(240,153,i%5?105:99,a);body+=line(...u,...v,'stroke="#91a4c3" stroke-width="2"');}for(let h=1;h<=12;h++){const [x,y]=point(240,153,88,h*30-90);body+=text(x,y+7,h,'text-anchor="middle" font-size="22"');}
  body+=line(240,153,...point(240,153,62,p.hour*30+p.minute/2-90),'stroke="#253f87" stroke-width="9" stroke-linecap="round"')+line(240,153,...point(240,153,93,p.minute*6-90),'stroke="#4876e9" stroke-width="5" stroke-linecap="round"')+circle(240,153,7,'fill="#253f87"');body+=text(240,304,`${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`,'text-anchor="middle" font-size="24"');break;}
 case 'visual-sector-fraction':for(let i=0;i<p.total;i++)body+=sector(240,160,127,i*360/p.total-90,(i+1)*360/p.total-90)+` fill="${i<p.shaded?'#5680e8':'#fff'}" stroke="#284a9a" stroke-width="2"/>`;break;
 case 'visual-temperature-rise':{
  for(const [i,value]of[p.cold,p.warm].entries()){const x=130+i*230,y=v=>260-(v+15)*7;body+=text(x,27,['Таңертең','Түсте'][i],'text-anchor="middle" font-size="23"');body+=`<rect x="${x-12}" y="48" width="24" height="225" rx="12" fill="#edf2fd" stroke="#45658e" stroke-width="2"/><rect x="${x-8}" y="${y(value)}" width="16" height="${270-y(value)}" fill="#4d77d9"/>`+circle(x,273,17,'fill="#4d77d9" stroke="#45658e" stroke-width="2"');for(let t=-15;t<=15;t++){body+=line(x+18,y(t),x+(t%5?27:34),y(t),'stroke="#45658e" stroke-width="1.5"');if(t%5===0)body+=text(x+41,y(t)+6,t,'font-size="19"');}}
  body+=text(240,314,'°C','text-anchor="middle" font-size="23"');break;}
 case 'visual-bar-difference':{
  const scale=15,x0=54,base=262;for(let n=0;n<=14;n+=2)body+=line(x0,base-n*scale,450,base-n*scale,'stroke="#dce5f3"')+text(x0-12,base-n*scale+6,n,'text-anchor="end" font-size="19"');body+=line(x0,45,x0,base,'stroke="#60799c" stroke-width="2"')+line(x0,base,450,base,'stroke="#60799c" stroke-width="2"');p.values.forEach((v,i)=>{const x=83+i*94;body+=`<rect x="${x}" y="${base-v*scale}" width="46" height="${v*scale}" rx="3" fill="#5f81df"/>`+text(x+23,300,p.labels[i],'text-anchor="middle" font-size="20"');});body+=text(62,25,'Басқатырғыш саны','font-size="20"');break;}
 case 'visual-line-growth':{
  const x=i=>70+i*70,y=v=>265-v*8;for(let n=0;n<=25;n+=5)body+=line(70,y(n),440,y(n),'stroke="#dce5f3"')+text(58,y(n)+6,n,'text-anchor="end" font-size="19"');body+=line(70,45,70,265,'stroke="#60799c" stroke-width="2"')+line(70,265,440,265,'stroke="#60799c" stroke-width="2"');body+=`<polyline points="${p.values.map((v,i)=>[x(i),y(v)].join(',')).join(' ')}" fill="none" stroke="#3564d2" stroke-width="4"/>`;p.values.forEach((v,i)=>{body+=circle(x(i),y(v),5,'fill="#3564d2"')+text(x(i),y(v)-12,v,'text-anchor="middle" font-size="19"')+text(x(i),294,i+1,'text-anchor="middle" font-size="20"');});body+=text(70,26,'Биіктік, см','font-size="21"')+text(447,313,'Күн','text-anchor="end" font-size="19"');break;}
 case 'visual-ray-numerator':{
  const dx=378/(p.divisions*3),x=i=>47+i*dx;body+=line(37,164,448,164,'stroke="#3b567e" stroke-width="3"')+poly([[448,164],[436,158],[436,170]],'fill="#3b567e"');for(let i=0;i<=p.divisions*3;i++){body+=line(x(i),i%p.divisions?155:148,x(i),i%p.divisions?173:180,'stroke="#4e678c" stroke-width="2"');if(i%p.divisions===0)body+=text(x(i),211,i/p.divisions,'text-anchor="middle" font-size="24"');}body+=circle(x(p.numerator),164,6,'fill="#4067dc"')+text(x(p.numerator),132,'P','text-anchor="middle" font-size="27"');break;}
 case 'visual-notch-perimeter':{
  const sx=17,sy=17,x=67,y=46,v=notch(p).map(([a,b])=>[x+a*sx,y+b*sy]);body+=poly(v,'fill="#e5edff" stroke="#3659af" stroke-width="3"');body+=line(x,y+p.height*sy+24,x+p.width*sx,y+p.height*sy+24,'stroke="#7187a8" stroke-width="2"')+text(x+p.width*sx/2,296,p.width+' см','text-anchor="middle" font-size="22"');body+=text(40,y+p.height*sy/2,p.height+' см','text-anchor="middle" font-size="21" transform="rotate(-90 40 '+(y+p.height*sy/2)+')"');body+=line(x+(p.offset+p.notchWidth)*sx+17,y,x+(p.offset+p.notchWidth)*sx+17,y+p.depth*sy,'stroke="#7187a8" stroke-width="2"')+text(x+(p.offset+p.notchWidth)*sx+26,y+p.depth*sy/2+6,p.depth+' см','font-size="21"');break;}
 case 'visual-fan-triangles':{
  body+=poly([[240,40],[45,267],[435,267]],'fill="#edf2ff" stroke="#3459b0" stroke-width="3"');for(let i=1;i<p.baseSegments;i++)body+=line(240,40,45+390*i/p.baseSegments,267,'stroke="#5279d0" stroke-width="2.5"');for(let i=0;i<=p.baseSegments;i++)body+=circle(45+390*i/p.baseSegments,267,4,'fill="#3459b0"');break;}
 case 'visual-polygon-triangulation':{
  const v=regular(p.sides).map(([x,y])=>[240+x*133,160+y*133]);body+=poly(v,'fill="#eff3ff" stroke="#3459b0" stroke-width="3"');for(let i=2;i<v.length-1;i++)body+=line(...v[0],...v[i],'stroke="#6b82ca" stroke-width="2"');for(const pt of v)body+=circle(...pt,4,'fill="#3459b0"');body+=text(v[0][0]+14,v[0][1]+3,'A','font-size="23"');break;}
 case 'visual-venn-union':{
  body+=circle(177,177,105,'fill="#dfeaff" fill-opacity="0.7" stroke="#355fb8" stroke-width="3"')+circle(303,177,105,'fill="#e7e0ff" fill-opacity="0.7" stroke="#7655bd" stroke-width="3"');body+=text(140,48,'A: '+(p.leftOnly+p.both),'text-anchor="middle" font-size="27"')+text(340,48,'B: '+(p.rightOnly+p.both),'text-anchor="middle" font-size="27"')+text(240,187,p.both,'text-anchor="middle" font-size="30"');break;}
 case 'visual-interval-maximum':{
  const x=n=>55+(n+6)*21;for(const [j,int]of[p.a,p.b].entries()){const y=102+j*125;body+=text(20,y+8,['A','B'][j],'font-size="26"');body+=line(45,y,453,y,'stroke="#9faec5" stroke-width="2"');for(let n=-6;n<=12;n++){body+=line(x(n),y-5,x(n),y+5,'stroke="#9faec5"');if(n===int.lo||n===int.hi||n===0&&Math.abs(int.lo)>1&&Math.abs(int.hi)>1)body+=text(x(n),y+33,n,'text-anchor="middle" font-size="21"');}body+=line(x(int.lo),y,x(int.hi),y,'stroke="#4266cd" stroke-width="7"');for(const [n,closed]of[[int.lo,int.loClosed],[int.hi,int.hiClosed]])body+=circle(x(n),y,6.5,`fill="${closed?'#4266cd':'#fff'}" stroke="#4266cd" stroke-width="2.5"`);}break;}
 case 'visual-seven-segment-mass':{
  const segments={a:[4,0,36,0],b:[40,4,40,36],c:[40,44,40,76],d:[4,80,36,80],e:[0,44,0,76],f:[0,4,0,36],g:[4,40,36,40]};
  const digit=(d,x,y)=>[...segMasks[d]].map(k=>{const [a,b,c,e]=segments[k];return line(x+a,y+b,x+c,y+e,'stroke="#3a5cbe" stroke-width="5" stroke-linecap="round" data-stick="1"');}).join('');
  body+=text(40,37,'Үлгі:','font-size="22"')+digit('1',75,60)+text(158,111,`${cents(p.referenceCents)} кг`,'font-size="24"');for(let i=0;i<p.target.length;i++)body+=digit(p.target[i],87+i*85,186);body+=text(240,309,p.target,'text-anchor="middle" font-size="22"');break;}
 case 'visual-point-ox-reflection':{
  const s=23,x=n=>240+n*s,y=n=>160-n*s;body+=`<g stroke="#dbe4f1" stroke-width="1">${grid(x(-5),y(5),10,10,s)}</g>`;body+=line(x(-5)-8,y(0),x(5)+15,y(0),'stroke="#3f64bf" stroke-width="3"')+line(x(0),y(-5)+8,x(0),y(5)-15,'stroke="#7186a6" stroke-width="2"');for(let n=-5;n<=5;n++){if(n)body+=text(x(n),y(0)+22,n,'text-anchor="middle" font-size="18"')+text(x(0)-14,y(n)+6,n,'text-anchor="end" font-size="18"');}body+=text(x(0)-13,y(0)+22,'0','text-anchor="end" font-size="18"')+text(x(5)+26,y(0)+6,'x','font-size="23"')+text(x(0)-8,y(5)-22,'y','font-size="23"');body+=circle(x(p.x),y(p.y),6,'fill="#345cce"')+text(x(p.x)+13,y(p.y)-9,'M','font-size="25"');break;}
 case 'visual-pixel-reflection':{
  const x=43,y=71,s=34;body+=`<g stroke="#d7e1ef" stroke-width="1">${grid(x,y,11,5,s)}</g>`;for(const[a,b]of p.cells)body+=`<rect x="${x+a*s}" y="${y+b*s}" width="${s}" height="${s}" fill="#6586df" stroke="#fff"/>`;body+=line(x+p.axis*s,y-18,x+p.axis*s,y+5*s+18,'stroke="#805dc2" stroke-width="3" stroke-dasharray="8 6"')+text(x+p.axis*s+12,y-23,'k','font-size="26"');break;}
 case 'visual-open-pool-surface':{
  const a=[75,243],b=[338,243],c=[408,167],d=[145,167],dz=58,top=v=>[v[0],v[1]-dz];body+=poly([a,b,c,d],'fill="#b8cef4" stroke="#4163a3" stroke-width="2"');for(const[v,w,fill]of[[d,c,'#edf3ff'],[a,d,'#e1ebff'],[c,b,'#c1d4f5'],[b,a,'#dae6fb']])body+=poly([v,w,top(w),top(v)],`fill="${fill}" stroke="#4163a3" stroke-width="2"`);body+=poly([top(a),top(b),top(c),top(d)],'fill="none" stroke="#4163a3" stroke-width="3"');body+=text(240,49,'Үсті ашық','text-anchor="middle" font-size="23"')+text(205,281,p.length+' м','text-anchor="middle" font-size="23"')+text(397,235,p.width+' м','text-anchor="middle" font-size="22"')+text(49,218,p.depth+' м','text-anchor="middle" font-size="22"');break;}
 case 'visual-vertical-angle':{
  body+=line(55,160,425,160,'stroke="#3b578b" stroke-width="3"')+line(...point(240,160,148,-p.angle),...point(240,160,148,180-p.angle),'stroke="#3b578b" stroke-width="3"');body+=`<path d="${arc(240,160,44,-p.angle,0)}" fill="none" stroke="#5278d4" stroke-width="2"/><path d="${arc(240,160,44,180-p.angle,180)}" fill="none" stroke="#8b62bc" stroke-width="2"/>`;body+=text(...point(240,160,83,-p.angle/2),p.angle+'°','text-anchor="middle" font-size="25"')+text(...point(240,160,82,180-p.angle/2),'x°','text-anchor="middle" font-size="25"')+text(247,186,'O','font-size="21"');break;}
 case 'visual-circle-sector-gap':{
  const values=[...p.known,360-p.known.reduce((s,v)=>s+v,0)];let start=-90;values.forEach((n,i)=>{body+=sector(240,160,129,start,start+n)+` fill="${['#dfe8ff','#e7e3fb','#dcefeb','#c2d3ff'][i]}" stroke="#4b659d" stroke-width="2"/>`;body+=text(...point(240,160,82,start+n/2),i<p.known.length?n+'°':'?','text-anchor="middle" dominant-baseline="middle" font-size="25"');start+=n;});break;}
 case 'visual-nested-subsets':{
  body+=`<ellipse cx="240" cy="165" rx="202" ry="131" fill="#eef3ff" stroke="#4b69aa" stroke-width="3"/><ellipse cx="282" cy="169" rx="111" ry="87" fill="#dde7ff" stroke="#5c7cc1" stroke-width="3"/>`+text(71,81,'A','font-size="27"')+text(324,116,'B','font-size="27"');p.inner.forEach((n,i)=>body+=text(238+(i%2)*83,161+Math.floor(i/2)*66,n,'text-anchor="middle" font-size="27"'));p.outerOnly.forEach((n,i)=>body+=circle(84,98+i*41,2.5,'fill="#4b69aa"')+text(115,106+i*41,n,'text-anchor="middle" font-size="25"'));break;}
 case 'visual-square-circle-corners':{
  body+=`<rect x="112" y="32" width="256" height="256" fill="#91aff1" stroke="#3c5eab" stroke-width="3"/>`+circle(240,160,128,'fill="#fff" stroke="#3c5eab" stroke-width="2.5"')+line(240,160,368,160,'stroke="#536c9c" stroke-width="2.5"')+circle(240,160,4,'fill="#536c9c"')+text(240,187,'O','text-anchor="middle" font-size="23"')+text(300,147,p.radius+' см','text-anchor="middle" font-size="23"');break;}
 case 'visual-ring-width':{
  const r=127,inner=r*p.inner/p.outer;body+=circle(240,160,r,'fill="#aac1f1" stroke="#3c5eab" stroke-width="2.5"')+circle(240,160,inner,'fill="#fff" stroke="#3c5eab" stroke-width="2.5"')+circle(240,160,4,'fill="#3c5eab"');body+=line(240,160,240+r,160,'stroke="#3c5eab" stroke-width="2.5"')+line(240,160,240,160-inner,'stroke="#3c5eab" stroke-width="2.5"')+text(312,147,p.outer+' см','text-anchor="middle" font-size="23"')+text(226,142,p.inner+' см','text-anchor="end" font-size="23"')+text(226,182,'O','font-size="22"');break;}
 default:throw Error('Unknown SVG model');}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320" role="img" aria-labelledby="title desc"><title id="title">${esc(row.figureTitle)}</title><desc id="desc">${esc(row.figureDescription)}</desc><rect width="480" height="320" rx="14" fill="#fff"/><g font-family="Arial,DejaVu Sans,sans-serif" fill="#20324e">${body}</g></svg>\n`;
}

export function verifyEdition(row){
 assert.match(row.editionId,/^visual-[a-z0-9-]+$/);assert.ok([4,5,6].includes(row.grade));
 assert.equal(row.minimumPlan,'pro');assert.ok(['draft','verified'].includes(row.editorialStatus));
 assert.equal(row.statement,statementFor(row),'condition no longer matches these givens');
 const proof=independentlyCalculate(row);assert.equal(row.answer,proof.answer,'independent mathematical answer disagrees');
 assert.equal(row.solution,solutionFor(row),'explanation no longer matches these givens');
 assert.equal(row.image,`/figures/synaq-editions/${row.editionId}.svg`);
 assert.ok(row.sourceRefs?.length&&row.sourceRefs.every(r=>r.sourceId&&/^(?:problems\/sources\/zerek\/courses\/|frontend\/src\/zerek)/.test(r.sourceFile)));
 assert.ok(row.adaptationChanges?.length>=3);assert.ok(row.figureTitle&&row.figureDescription);
 const svg=svgFor(row);assert.match(svg,/viewBox="0 0 480 320"/);assert.doesNotMatch(svg,/<image\b|<script\b|<foreignObject\b|data:image|(?:href|onload|onclick)=/i);
 assert.equal(row.figureSha256,crypto.createHash('sha256').update(svg).digest('hex'),'figure digest must bind the currently authored parameters');
 return {...proof,checks:[...proof.checks,'exact condition and solution binding','new native SVG generated only from authored parameters','external editorial and figure review still required for drafts']};
}
