// Exact tick-index diagrams: native axes, thermometers, signed bars and sets.
// No traced source assets. Values are reconstructed from scale origin/step.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave4-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fmt=v=>String(v).replace('.',',');
const signed=v=>v>0?'+'+fmt(v):fmt(v);
const val=(p,r)=>p.min+r.tick*p.step;
const named=(p,label)=>{const r=p.points.find(r=>r.label===label);assert.ok(r,'Known point '+label);return val(p,r);};
const readings=p=>p.readings.map(r=>val(p,r));
const walk=(start,delta)=>{assert.ok(Number.isInteger(start)&&Number.isInteger(delta));let x=start;for(let i=0;i<Math.abs(delta);i++)x+=Math.sign(delta);return x;};
const distance=(a,b)=>{assert.ok(Number.isInteger(a)&&Number.isInteger(b));let n=0;for(let x=Math.min(a,b);x<Math.max(a,b);x++)n++;return n;};
const cancel=values=>{let positive=0,negative=0;for(const n of values){assert.ok(Number.isInteger(n));for(let i=0;i<Math.abs(n);i++)n>0?positive++:negative++;}while(positive&&negative){positive--;negative--;}return positive-negative;};
const addTerm=n=>n<0?'('+n+')':String(n);
const additionEquation=(a,b)=>addTerm(a)+' + '+addTerm(b)+' = '+(a+b);
const pointPair=(a,b)=>a+' және '+b;
function validate(q){
 const p=q.params;assert.ok(['axis','thermo','vertical','bars','cards','sets'].includes(p.scene));
 if(['axis','thermo','vertical'].includes(p.scene)){
  assert.ok(Number.isInteger(p.min)&&Number.isInteger(p.max)&&p.min<p.max&&p.min<=0&&p.max>=1);
  assert.ok([.5,1,2,3,5,10,30,50,60].includes(p.step));
  assert.ok(Number.isInteger((p.max-p.min)/p.step)&&(p.max-p.min)/p.step<=40,'Bounded exact scale');
  const rows=p.scene==='thermo'?p.readings:p.points;
  assert.ok(rows.length>=1&&rows.length<=8);
  assert.equal(new Set(rows.map(r=>r.label)).size,rows.length);
  for(const r of rows){assert.ok(Number.isInteger(r.tick)&&r.tick>=0&&r.tick<=(p.max-p.min)/p.step);assert.ok(typeof r.label==='string');}
  if(p.scene!=='thermo')assert.equal(new Set(rows.map(r=>r.tick)).size,rows.length,'Distinct point positions');
  if(p.labels)for(const n of p.labels)assert.ok(Number.isInteger((n-p.min)/p.step)&&n>=p.min&&n<=p.max,'Every given scale label lies on its actual tick');
  if(p.arrows)for(const a of p.arrows){assert.ok(Number.isInteger(a.from)&&Number.isInteger(a.to)&&a.from>=p.min&&a.from<=p.max&&a.to>=p.min&&a.to<=p.max&&a.from!==a.to);}
 }
 if(p.scene==='bars'){assert.ok(p.ticks.length>=5&&p.ticks.length<=7);p.ticks.forEach(n=>assert.ok(Number.isInteger(n)&&Math.abs(n)<=12));assert.equal(p.step,5);}
 if(p.scene==='cards'){assert.equal(p.values.length,5);p.values.forEach(n=>assert.ok(Number.isInteger(n)&&Math.abs(n)<=30));}
 if(kind(q)==='number-set-region')assert.ok(p.numerator<0&&p.denominator===1,'This addressed source classifies a negative integer');
 if(p.startLabel){assert.equal(p.arrows[0].from,named(p,p.startLabel),'The arrow starts at its named point');assert.equal(p.arrows.at(-1).to,named(p,p.endLabel),'The arrow ends at its named point');}
 return p;
}
export function independentlyCalculate(q){
 const p=validate(q),k=kind(q),checks=['Every plotted value is reconstructed from its exact tick index and the labelled scale origin/step'];let answer;
 switch(k){
 case 'loss-days':answer=String(p.ticks.filter(n=>n<0).length);checks.push('Only individual below-zero bars are counted');break;
 case 'net-profit':answer=String(cancel(p.ticks.map(n=>n*p.step)));checks.push('Positive/negative unit tokens are paired and cancelled');break;
 case 'cumulative-loss':{
  let balance=0,count=0;for(const n of p.ticks){balance=walk(balance,n*p.step);if(balance<0)count++;}
  answer=String(count);checks.push('Every daily prefix balance is tested, not just each daily loss or the final balance');break;
 }
 case 'thermo-reading':answer=fmt(readings(p)[0]);break;
 case 'depth-point':{
  const matches=p.points.filter(r=>val(p,r)===-p.depth);assert.equal(matches.length,1);answer=matches[0].label;break;
 }
 case 'signed-statement':{
  const matches=p.candidates.filter(c=>named(p,c.label)===c.value);assert.equal(matches.length,1);answer=matches[0].label+': '+signed(matches[0].value)+' м';break;
 }
 case 'warm-excess':{
  const end=walk(readings(p)[0],p.change);assert.ok(end>0);answer=String(end);checks.push('Warming first crosses zero and only the above-zero remainder is requested');break;
 }
 case 'warming-temperature':answer=String(walk(readings(p)[0],p.change));break;
 case 'frost-depth':{
  const end=walk(readings(p)[0],-p.drop);assert.ok(end<0);answer=String(distance(end,0));checks.push('The requested frost magnitude is positive, whereas the final temperature is negative');break;
 }
 case 'mine-dual':{
  const a=named(p,p.upper),b=named(p,p.lower);assert.ok(a>0&&b<0);
  answer=distance(a,b)+' м; '+b+' м';checks.push('Travel distance and signed final height are checked as different quantities');break;
 }
 case 'variation-total':{
  const a=readings(p);let total=0;for(let i=1;i<a.length;i++)total+=distance(a[i-1],a[i]);answer=String(total);checks.push('Every consecutive absolute change is counted rather than just first-to-last change');break;
 }
 case 'integer-count':answer=String(p.points.filter(r=>Number.isInteger(val(p,r))).length);checks.push('Zero counts as an integer; half-unit ticks do not automatically count as integers');break;
 case 'number-set-region':{
  const v=p.numerator/p.denominator;assert.ok(Number.isSafeInteger(p.numerator)&&Number.isSafeInteger(p.denominator)&&p.denominator>0);
  const group=Number.isInteger(v)?v>0?'natural':'integerOther':'rationalOther';answer=p.regions[group];assert.equal(new Set(Object.values(p.regions)).size,3);break;
 }
 case 'neighbor-integers':{
  const x=named(p,p.target);assert.ok(!Number.isInteger(x));const candidates=[];for(let n=p.min-1;n<=p.max;n++)if(n<x&&x<n+1)candidates.push([n,n+1]);assert.equal(candidates.length,1);answer=fmt(candidates[0][0])+' және '+fmt(candidates[0][1]);break;
 }
 case 'greatest-negative':{
  const a=p.points.filter(r=>val(p,r)<0).sort((a,b)=>a.tick-b.tick);assert.ok(a.length>=2);answer=a.at(-1).label;break;
 }
 case 'strict-interval':{
  const a=p.points.filter(r=>val(p,r)>p.lower&&val(p,r)<p.upper);assert.equal(a.length,1);answer=a[0].label;checks.push('Both endpoint inequalities are strict');break;
 }
 case 'strict-count':answer=String(p.points.filter(r=>val(p,r)<p.bound).length);assert.ok(p.points.some(r=>val(p,r)===p.bound));checks.push('The point exactly at the threshold is explicitly excluded');break;
 case 'coldest-city':{
  const a=readings(p),min=Math.min(...a);assert.equal(a.filter(v=>v===min).length,1);answer=p.names[a.indexOf(min)];break;
 }
 case 'arrow-displacement':{
  const a=p.arrows[0];let d=0,x=a.from;while(x!==a.to){const step=Math.sign(a.to-x);d+=step;x+=step;}answer=String(d);checks.push('Direction gives a signed displacement rather than an unsigned distance');break;
 }
 case 'arrow-endpoint-read':
 case 'arrow-endpoint-given':
 case 'mixed-arrow-endpoint':{
  const a=p.arrows[0];answer=String(walk(a.from,p.change));assert.equal(Number(answer),a.to);checks.push('The shown arrow endpoint must agree with the directed unit-step walk');break;
 }
 case 'arrow-equality':{
  const a=p.arrows[0],delta=a.to-a.from;assert.equal(walk(a.from,delta),a.to);answer=additionEquation(a.from,delta);checks.push('The equation starts where the arrow starts, not at its endpoint');break;
 }
 case 'two-negative-equation':{
  assert.equal(p.arrows.length,2);const [a,b]=p.arrows;assert.equal(a.from,0);assert.equal(a.to,b.from);assert.ok(a.to<0&&b.to<b.from);const delta=b.to-b.from;
  assert.equal(a.to,named(p,'A'));assert.equal(b.to,named(p,'B'));
  assert.equal(walk(a.to,delta),b.to);answer=additionEquation(a.to,delta);break;
 }
 case 'negative-coordinate-sum':{
  const a=p.points.map(r=>val(p,r));assert.ok(a.every(v=>v<0));answer=String(cancel(a));checks.push('Both negative magnitudes accumulate; they are not subtracted');break;
 }
 case 'undersea-descent':answer=String(walk(named(p,p.target),-p.drop));assert.ok(Number(answer)<0);break;
 case 'cancellation-cards':answer=String(cancel(p.values));checks.push('Opposite unit tokens cancel in the five explicitly displayed cards');break;
 case 'coordinate-cancellation':answer=String(cancel(p.points.map(r=>val(p,r))));checks.push('Coordinates must first be read before their opposite pairs can cancel');break;
 case 'distance-crosszero':
 case 'distance-unit':
 case 'distance-scaled':answer=String(distance(named(p,p.first),named(p,p.second)));checks.push('Distance is counted in coordinate units, not raw tick gaps and not a signed coordinate');break;
 case 'subtraction-equality':{
  const a=p.arrows[0];assert.ok(a.to<a.from);const length=distance(a.from,a.to);answer=a.from+' − '+length+' = '+a.to;checks.push('A leftward arrow is expressed as subtraction from its actual starting point');break;
 }
 case 'rise-two-readings':{
  const a=readings(p);assert.equal(a.length,2);assert.ok(a[1]>a[0]);answer=String(distance(...a));break;
 }
 case 'altitude-gap':answer=String(distance(named(p,p.upper),named(p,p.lower)));assert.ok(named(p,p.upper)>0&&named(p,p.lower)<0);break;
 case 'restore-coordinate':{
  const known=named(p,p.known),unknown=named(p,p.unknown);assert.ok(unknown<known);
  const candidates=[];for(let x=-100;x<known;x++)if(distance(x,known)===p.distance)candidates.push(x);assert.equal(candidates.length,1);assert.equal(candidates[0],unknown);answer=String(candidates[0]);break;
 }
 case 'pair-distance':{
  const matches=[];for(let i=0;i<p.points.length;i++)for(let j=i+1;j<p.points.length;j++)if(distance(val(p,p.points[i]),val(p,p.points[j]))===p.goal)matches.push([p.points[i].label,p.points[j].label]);
  assert.equal(matches.length,1);answer=pointPair(...matches[0]);checks.push('All unordered point pairs are tested and the matching pair is unique');break;
 }
 default:throw new Error('Unknown tick-index skill '+k);
 }
 return {answer,checks};
}

export function statementFor(q){
 const p=q.params,k=kind(q);
 switch(k){
 case 'loss-days':return 'Шеберхананың бес күндік кірісі мен шығыны диаграммада берілген. Нөлден жоғары бағаналар — пайда, төменгілері — зиян. Неше күннің нәтижесі зиян болды?';
 case 'net-profit':return 'Диаграмма шағын дүкеннің алты күндегі нәтижесін мың теңгемен көрсетеді. Пайда оң, зиян теріс санмен белгіленген. Алты күннің таза нәтижесі неше мың теңге?';
 case 'cumulative-loss':return 'Клуб күн сайын диаграммадағы кірісті не шығынды ортақ есепке қосады. Есеп алғашқы күні нөлден басталады. Неше күннің соңында жиналған жалпы нәтиже теріс болды?';
 case 'thermo-reading':return 'Метеобекеттегі термометрдің бағанасы суреттегідей тұр. Қандай температура көрсетілген? Жауапта санның таңбасын сақтаңдар, өлшем бірлігі — °C.';
 case 'depth-point':return 'Үзік көлденең сызық — теңіз деңгейі, шкала метрмен берілген. Белгіленген қай нүкте теңіз деңгейінен '+p.depth+' м төмен орналасқан?';
 case 'signed-statement':return 'Зерттеуші төрт нүктенің теңіз деңгейіне қатысты белгілерін жазып алды. Шкаладағы кіші бөліктерді ескеріп, дұрыс жазылған бір нұсқаны таңдаңдар.';
 case 'warm-excess':return 'Таңғы температура термометрде берілген. Түске дейін ауа '+p.change+' градусқа жылынды. Түсте температура нөлден неше градус жоғары болды?';
 case 'warming-temperature':return 'Суреттегі таңғы өлшеуден кейін ауа '+p.change+' °C-қа жылынды. Соңғы температураның сандық мәнін жазыңдар.';
 case 'frost-depth':return 'Термометр таңғы ауаны көрсетіп тұр. Кейін температура тағы '+p.drop+' °C-қа төмендеді. Соңғы аяз нөлден неше градус төмен болды? Жауапта төмендегі градус санын оң санмен көрсетіңдер.';
 case 'mine-dual':return 'Тік шахтадағы лифт '+p.upper+' деңгейінен '+p.lower+' деңгейіне түседі. Үзік сызық теңіз деңгейін білдіреді. Лифт жүрген қашықтық пен төменгі деңгейдің таңбалы биіктігін дұрыс көрсететін жұпты таңдаңдар.';
 case 'variation-total':return 'Термометрлер тәуліктегі төрт кезекті өлшеуді көрсетеді. Әр көрші екі өлшеу арасындағы өзгерістің шамасын тауып, үшеуін қосыңдар. Температура жоғарыласа да, төмендесе де сол өзгерістің градус саны есептеледі.';
 case 'integer-count':return 'Сызбада бірлік кесінді екі тең бөлікке бөлінген. Бес белгіленген нүктенің нешеуінің координатасы бүтін сан? Нөлді де ескеріңдер.';
 case 'number-set-region':return 'Сызбада N = {1, 2, 3, ...}, Z — бүтін сандар, Q — рационал сандар жиындары көрсетілген. '+p.numerator+' саны әріппен белгіленген қай бөлікке тиісті? Ең кіші сәйкес аймақтың әрпін таңдаңдар.';
 case 'neighbor-integers':return 'A нүктесі бірлік кесінділері екіге бөлінген координаталық түзуде тұр. Оның сол және оң жағындағы ең жақын көрші бүтін сандарды таңдаңдар.';
 case 'greatest-negative':return 'Белгіленген нүктелердің координаталарының ішінде ең үлкен теріс сан қай нүктеге сәйкес келеді? Оң координаталарды бұл салыстыруға қоспаңдар.';
 case 'strict-interval':return 'Қай нүктенің координатасы '+p.lower+' < x < '+p.upper+' шартын қанағаттандырады? Екі шекараның өзі аралыққа кірмейді.';
 case 'strict-count':return 'Сызбадағы неше нүктенің координатасы '+p.bound+' санынан қатаң кіші? Шекарадағы нүктені санамаңдар.';
 case 'coldest-city':return 'Бір мезгілдегі өлшеулер: A — '+p.names[0]+', B — '+p.names[1]+', C — '+p.names[2]+'. Қай қалада ауа ең суық болды?';
 case 'arrow-displacement':return 'Нүкте сызбадағы нұсқар бойымен бастапқы орнынан соңғы орнына көшті. Бастапқы координатаға қандай таңбалы сан қосылған?';
 case 'arrow-endpoint-read':return 'A нүктесінің координатасын шкаладан оқыңдар. Нұсқардағы '+signed(p.change)+' өзгерісінен кейінгі нүктенің координатасын табыңдар.';
 case 'arrow-endpoint-given':return 'Нүкте '+p.arrows[0].from+' координатасынан басталып, нұсқардағыдай '+signed(p.change)+' бірлікке жылжыды. Сұрақ белгісінің орнындағы координата қандай?';
 case 'mixed-arrow-endpoint':return 'M нүктесін шкаладан тауып, көрсетілген '+signed(p.change)+' секірісін орындаңдар. Соңғы нүктенің координатасын жазыңдар.';
 case 'arrow-equality':return 'Сызбадағы бастапқы нүктені, нұсқар бағытын және жылжу шамасын сақтайтын қосу теңдігін таңдаңдар.';
 case 'two-negative-equation':return 'Санақ басынан A нүктесіне, одан B нүктесіне екі рет солға жылжу орындалған. Бірінші және екінші жылжуды қосу арқылы көрсететін теңдікті таңдаңдар.';
 case 'negative-coordinate-sum':return 'Санақ басының сол жағындағы M және N нүктелерінің координаталарын оқып, екеуін қосыңдар.';
 case 'undersea-descent':return 'Зерттеу датчигі бастапқыда A деңгейінде тұр. Шкаладағы нөл — су беті. Датчик '+p.drop+' м төмен түсірілсе, оның жаңа таңбалы биіктігі неше метр болады?';
 case 'cancellation-cards':return 'Бес сан карточкасының барлығының қосындысын табыңдар. Қарама-қарсы сандарды жұптап топтауға болады.';
 case 'coordinate-cancellation':return 'Бес нүктенің координаталарын шкаладан оқып, қосындысын табыңдар. Санақ басынан бірдей қашықтықтағы қарама-қарсы координаталарды пайдаланыңдар.';
 case 'distance-crosszero':return 'A және B санақ басының екі жағында орналасқан. AB кесіндісінің ұзындығы неше бірлік? Жауап — қашықтық, таңбалы координата емес.';
 case 'distance-unit':return 'Координаталық түзудегі A мен B нүктелерінің арақашықтығын бірлік кесінділермен табыңдар.';
 case 'distance-scaled':return 'Түзудегі сызықшалар бірдей аралықта тұр. Белгіленген сандардан бір аралықтың мәнін анықтап, A мен B арақашықтығын табыңдар.';
 case 'subtraction-equality':return 'Солға бағытталған нұсқарды бастапқы координатадан оң санды азайту арқылы көрсететін теңдікті таңдаңдар.';
 case 'rise-two-readings':return 'Екі термометр '+p.readings[0].label+' және '+p.readings[1].label+' уақыттарындағы өлшеулерді көрсетеді. Осы аралықта ауа неше градусқа жылынды?';
 case 'altitude-gap':return 'A — су бетінен жоғары алаңша, B — суасты бақылау нүктесі. A нүктесі B нүктесінен неше метр жоғары орналасқан?';
 case 'restore-coordinate':return 'K нүктесінің координатасы мен MK арақашықтығы берілген. M нүктесі K-дан сол жақта жатыр. M координатасын табыңдар.';
 case 'pair-distance':return 'Белгіленген төрт нүктенің қай екеуінің арақашықтығы '+p.goal+' бірлікке тең?';
 default:throw new Error('No tick-index condition '+k);
 }
}

export function solutionFor(q){
 const p=q.params,k=kind(q),pv=p.points?.map(r=>r.label+'('+fmt(val(p,r))+')').join(', '),tv=p.readings?readings(p):[],bars=p.ticks?.map(n=>n*p.step);
 switch(k){
 case 'loss-days':return 'Күндердің нәтижелері: '+bars.map(signed).join(', ')+' мың теңге. Нөлден төмен тұрған '+bars.filter(v=>v<0).length+' бағана — зиян күндері.';
 case 'net-profit':return 'Пайда '+bars.filter(v=>v>0).join(' + ')+' = '+bars.filter(v=>v>0).reduce((a,b)=>a+b,0)+' мың. Зиян шамалары '+bars.filter(v=>v<0).map(Math.abs).join(' + ')+' = '+bars.filter(v=>v<0).reduce((a,b)=>a-b,0)+' мың. Айырмасы '+bars.reduce((a,b)=>a+b,0)+' мың теңге.';
 case 'cumulative-loss':{
  let total=0;const prefix=bars.map(v=>total+=v);return 'Күндер бойынша жиналған нәтижелер: '+prefix.map(signed).join(', ')+' мың теңге. Теріс болғандары '+prefix.filter(v=>v<0).length+' күн. Жеке күннің зияны мен жиналған зиянды шатастырмаймыз.';
 }
 case 'thermo-reading':return 'Екі жазылған белгі арасындағы кіші бөліктерді санап, бір бөліктің '+p.step+' °C екенін табамыз. Бағананың ұшы '+signed(tv[0])+' °C-қа сәйкес. Таңбасы нөлге қатысты орнына сай алынады.';
 case 'depth-point':return 'Теңізден төмен '+p.depth+' м — '+(-p.depth)+' м. Сызбадағы белгілер: '+pv+'. Ізделген белгі '+p.points.find(r=>val(p,r)===-p.depth).label+' нүктесінде.';
 case 'signed-statement':return 'Бір кіші бөлік '+p.step+' м. Нүктелердің дұрыс координаталары: '+pv+'. Ұсынылған жазулардан соған сәйкес келетін бір нұсқаны таңдаймыз.';
 case 'warm-excess':case 'warming-temperature':return 'Таңғы көрсеткіш '+signed(tv[0])+' °C. Жылыну оң өзгеріс: '+tv[0]+' + '+p.change+' = '+(tv[0]+p.change)+' °C. '+(k==='warm-excess'?'Бұл нөлден '+(tv[0]+p.change)+' градус жоғары.':'Соңғы температураның таңбасын сақтаймыз.');
 case 'frost-depth':return 'Таңертең '+tv[0]+' °C. Төмендеу тағы '+p.drop+' градус: '+tv[0]+' − '+p.drop+' = '+(tv[0]-p.drop)+' °C. Бұл нөлден '+Math.abs(tv[0]-p.drop)+' градус төмен, сондықтан сұралған аяз шамасы '+Math.abs(tv[0]-p.drop)+'.';
 case 'mine-dual':return 'Шкаладан '+pv+' оқылады. Жол ұзындығы '+named(p,p.upper)+' − ('+named(p,p.lower)+') = '+(named(p,p.upper)-named(p,p.lower))+' м. Төменгі деңгейдің координатасы '+named(p,p.lower)+' м болып қалады; ол жүрілген жолдың таңбасы емес.';
 case 'variation-total':{
  const changes=tv.slice(1).map((v,i)=>Math.abs(v-tv[i]));return 'Өлшеулер '+tv.map(signed).join(', ')+' °C. Өзгеріс шамалары '+changes.join(', ')+' градус. Қосындысы '+changes.join(' + ')+' = '+changes.reduce((a,b)=>a+b,0)+' градус.';
 }
 case 'integer-count':return 'Нүктелер: '+pv+'. Бүтін координаталар '+p.points.filter(r=>Number.isInteger(val(p,r))).map(r=>fmt(val(p,r))).join(', ')+'. Барлығы '+p.points.filter(r=>Number.isInteger(val(p,r))).length+' нүкте. Нөл де бүтін сан.';
 case 'number-set-region':return p.numerator+' — теріс бүтін сан, сондықтан Z-ке тиісті, бірақ N-ге кірмейді. Z-тің N-нен тыс бөлігі '+p.regions.integerOther+' әрпімен белгіленген. Q-ге де тиісті болғанымен, сұралған ең кіші тиісті аймақ осы.';
 case 'neighbor-integers':return 'A координатасы '+fmt(named(p,p.target))+'. Оны қоршаған көрші бүтіндер '+Math.floor(named(p,p.target))+' және '+Math.ceil(named(p,p.target))+'. Екеуінің айырмасы 1-ге тең.';
 case 'greatest-negative':return 'Координаталар '+pv+'. Нөлден сол жақтағы нүктелердің ең оң жақтағысы ең үлкен теріс санды береді: '+p.points.filter(r=>val(p,r)<0).sort((a,b)=>b.tick-a.tick)[0].label+'.';
 case 'strict-interval':return 'Координаталар '+pv+'. '+p.lower+' санынан үлкен әрі '+p.upper+' санынан кіші координата '+p.points.filter(r=>val(p,r)>p.lower&&val(p,r)<p.upper).map(r=>r.label+'('+fmt(val(p,r))+')').join('')+' нүктесінде ғана.';
 case 'strict-count':return 'Шкаладан '+pv+' оқылады. '+p.bound+' белгісінен сол жақта '+p.points.filter(r=>val(p,r)<p.bound).length+' нүкте бар. Координатасы '+p.bound+' нүктенің өзі есептелмейді.';
 case 'coldest-city':return 'Температуралар '+p.names.map((name,i)=>name+': '+signed(tv[i])+' °C').join('; ')+'. Ең кіші көрсеткіш '+Math.min(...tv)+' °C, демек ең суық қала '+p.names[tv.indexOf(Math.min(...tv))]+'.';
 case 'arrow-displacement':return 'Бастапқы '+p.arrows[0].from+'-тен соңғы '+p.arrows[0].to+'-ке жылжу '+(p.arrows[0].to<p.arrows[0].from?'солға':'оңға')+' бағытталған. Айырма '+p.arrows[0].to+' − ('+p.arrows[0].from+') = '+(p.arrows[0].to-p.arrows[0].from)+'.';
 case 'arrow-endpoint-read':case 'arrow-endpoint-given':case 'mixed-arrow-endpoint':return 'Бастапқы координата '+p.arrows[0].from+'. Өзгеріс '+signed(p.change)+'. '+additionEquation(p.arrows[0].from,p.change)+'. Нұсқардың бағыты қосылатын санның таңбасына сай.';
 case 'arrow-equality':return 'Нұсқардың бастапқы координатасы '+p.arrows[0].from+'. Өзгеріс '+signed(p.arrows[0].to-p.arrows[0].from)+' бірлік. Сондықтан '+additionEquation(p.arrows[0].from,p.arrows[0].to-p.arrows[0].from)+'. Кері бағыттағы теңдік осы суретке сәйкес емес.';
 case 'two-negative-equation':return 'Бірінші жылжу '+p.arrows[0].to+', екіншісі '+(p.arrows[1].to-p.arrows[1].from)+'. Екеуі де солға, сондықтан модульдер қосылып, минус сақталады: '+additionEquation(p.arrows[0].to,p.arrows[1].to-p.arrows[1].from)+'.';
 case 'negative-coordinate-sum':return 'Координаталар '+pv+'. Теріс сандардың модульдерін қосып, минус қоямыз: '+p.points.map(r=>addTerm(val(p,r))).join(' + ')+' = '+p.points.reduce((sum,r)=>sum+val(p,r),0)+'.';
 case 'undersea-descent':return 'Бастапқы биіктік '+named(p,p.target)+' м. Төмен түсу — теріс өзгеріс: '+named(p,p.target)+' − '+p.drop+' = '+(named(p,p.target)-p.drop)+' м. Теріс белгі датчиктің су астына өткенін білдіреді.';
 case 'cancellation-cards':case 'coordinate-cancellation':{
  const a=k==='cancellation-cards'?p.values:p.points.map(r=>val(p,r)),pairs=[],remaining=[...a];
  for(let i=0;i<remaining.length;i++){const v=remaining[i],j=remaining.findIndex((n,index)=>index>i&&n===-v);if(j>=0){pairs.push(v+' + ('+(-v)+') = 0');remaining.splice(j,1);remaining.splice(i,1);i--;}}
  return (k==='coordinate-cancellation'?'Координаталар '+pv+'. ':'Карточкалар '+a.map(signed).join(', ')+'. ')+pairs.join('; ')+'. Қалған сандардың қосындысы '+remaining.reduce((x,y)=>x+y,0)+'.';
 }
 case 'distance-crosszero':case 'distance-unit':case 'distance-scaled':return 'Бір аралық '+p.step+' бірлік. Нүктелер '+pv+'. Арақашықтық '+Math.max(named(p,p.first),named(p,p.second))+' − ('+Math.min(named(p,p.first),named(p,p.second))+') = '+Math.abs(named(p,p.first)-named(p,p.second))+' бірлік. '+(p.step===1?'Мұнда бір аралық бір бірлікке тең, сондықтан аралықтарды санау да осы ұзындықты береді.':'Тек кіші аралықтардың санын жазу жеткіліксіз: оны '+p.step+' санына көбейтеміз.');
 case 'subtraction-equality':return 'Нұсқар '+p.arrows[0].from+' нүктесінен солға '+Math.abs(p.arrows[0].to-p.arrows[0].from)+' бірлік жүреді. Азайту теңдігі '+p.arrows[0].from+' − '+Math.abs(p.arrows[0].to-p.arrows[0].from)+' = '+p.arrows[0].to+'.';
 case 'rise-two-readings':return 'Көрсеткіштер '+tv.map(signed).join(' және ')+' °C. Жылыну '+tv[1]+' − ('+tv[0]+') = '+(tv[1]-tv[0])+' градус.';
 case 'altitude-gap':return 'Суреттен '+pv+' оқылады. Екі деңгей арасы '+named(p,p.upper)+' − ('+named(p,p.lower)+') = '+(named(p,p.upper)-named(p,p.lower))+' м.';
 case 'restore-coordinate':return 'K координатасы '+named(p,p.known)+', M сол жағында және арасы '+p.distance+' бірлік. Сондықтан M: '+named(p,p.known)+' − '+p.distance+' = '+named(p,p.unknown)+'. Айырманың модулі '+p.distance+' екені тексеріледі.';
 case 'pair-distance':return 'Координаталар '+pv+'. '+p.candidates.map(([a,b])=>a+b+' = '+Math.abs(named(p,a)-named(p,b))).join('; ')+'. '+p.goal+' бірлік беретін жұпты таңдаймыз.';
 default:throw new Error('No tick-index solution '+k);
 }
}

export function descriptionFor(row){
 const p=row.params;let text=statementFor(row)+' ';
 if(p.points)text+='Көрсетілген нүктелер: '+p.points.map(r=>(p.hiddenLabels||[]).includes(r.label)?r.label+' — белгісіз координата':r.label+'('+fmt(val(p,r))+')').join(', ')+'. ';
 if(p.readings)text+='Берілген өлшеулер: '+p.readings.map(r=>r.label+': '+signed(val(p,r))+' °C').join('; ')+'. ';
 if(p.ticks)text+='Күндер: '+p.ticks.map(t=>signed(t*p.step)).join(', ')+' мың теңге. ';
 if(p.values)text+='Карточкалар: '+p.values.map(signed).join(', ')+'. ';
 if(p.scene==='sets')text+='Ең ішкі N аймағы '+p.regions.natural+', Z ішінде N-нен тыс '+p.regions.integerOther+', Q ішінде Z-тен тыс '+p.regions.rationalOther+'. ';
 return text;
}

export function svgFor(q){
 const p=validate(q),scene=p.scene,height=scene==='axis'?(p.arrows?.length?300:190):scene==='cards'?220:scene==='bars'||scene==='sets'?340:360;
 const text=(x,y,value,size=21,color='#243b54',attrs='')=>'<text x="'+Number(x.toFixed(3))+'" y="'+Number(y.toFixed(3))+'" font-family="Arial,sans-serif" font-size="'+size+'" text-anchor="middle" dominant-baseline="middle" fill="'+color+'" stroke="white" stroke-width="3" paint-order="stroke" stroke-linejoin="round" '+attrs+'>'+esc(value)+'</text>';
 const num=n=>Number(n.toFixed(3));
 const line=(x,y,a,b,attrs='')=>'<line x1="'+num(x)+'" y1="'+num(y)+'" x2="'+num(a)+'" y2="'+num(b)+'" '+attrs+'/>';
 const ticks=p.max!==undefined?(p.max-p.min)/p.step:0;
 let art='';
 if(scene==='axis'){
  const x=t=>50+380*t/ticks,at=v=>x((v-p.min)/p.step),base=p.arrows?.length?210:100;
  art+=line(40,base,444,base,'stroke="#38557d" stroke-width="2" marker-end="url(#tip)"');
  if(!p.hideTicks)for(let i=0;i<=ticks;i++)art+=line(x(i),base-5,x(i),base+5,'stroke="#6782a7" stroke-width="'+(Number.isInteger(p.min+i*p.step)?1.5:1)+'" data-tick="'+i+'"');
  for(const v of p.labels||[0,p.step])art+=text(at(v),base+25,fmt(v),21,'#335b9b','data-scale-value="'+v+'"');
  for(const r of p.points)art+='<circle cx="'+num(x(r.tick))+'" cy="'+base+'" r="4" fill="#4b5ed3"/>'+text(x(r.tick),base-24,r.label,23,'#394fc5','data-point="'+esc(r.label)+'" data-tick-index="'+r.tick+'"');
  for(const [i,a]of(p.arrows||[]).entries()){
   const h=i?115:70,m=(at(a.from)+at(a.to))/2;
   art+='<path d="M'+num(at(a.from))+','+base+' Q'+num(m)+','+(base-2*h)+' '+num(at(a.to))+','+base+'" fill="none" stroke="'+(i?'#d84f70':'#6c54cf')+'" stroke-width="2.7" marker-end="url(#tip)" data-arrow-from="'+a.from+'" data-arrow-to="'+a.to+'"/>';
   if(a.showDelta)art+=text(m,base-h-18,signed(a.to-a.from),23,i?'#bd315c':'#6246bc');
  }
  if(p.distance){const a=at(named(p,p.unknown)),b=at(named(p,p.known));
   art+=line(a,base+54,b,base+54,'stroke="#5579aa" stroke-width="1.5"')+line(a,base+48,a,base+60,'stroke="#5579aa"')+line(b,base+48,b,base+60,'stroke="#5579aa"')+text((a+b)/2,base+41,p.distance+' бірлік',20);
  }
 }else if(scene==='thermo'){
  const bottom=268,top=48,spacing=440/p.readings.length;
  p.readings.forEach((r,index)=>{
   const cx=256+(index-(p.readings.length-1)/2)*spacing,yy=t=>bottom-t*220/ticks;
   art+='<rect x="'+num(cx-7)+'" y="'+top+'" width="14" height="'+(bottom-top)+'" rx="7" fill="#edf3ff" stroke="#7186a4" stroke-width="1.3"/>';
   for(let i=0;i<=ticks;i++){const y=yy(i),major=i%(p.labelEvery||2)===0;
    art+=line(cx-14,y,cx+(major?9:6),y,'stroke="#677f9c" stroke-width="'+(major?1.4:1)+'" data-thermo-tick="'+index+':'+i+'"');
    if(major)art+=text(cx-37,y,fmt(p.min+i*p.step),19,p.min+i*p.step===0?'#1e66bc':'#3c526f');
   }
   art+='<rect x="'+num(cx-4)+'" y="'+num(yy(r.tick))+'" width="8" height="'+num(bottom-yy(r.tick))+'" rx="4" fill="#dd5772" data-reading-tick="'+r.tick+'"/><circle cx="'+num(cx)+'" cy="280" r="12" fill="#dd5772" stroke="#8b5062" stroke-width="1.2"/>';
   art+=text(cx,310,r.label,21,'#3450a0');
  });art+=text(240,345,'Температура, °C',18,'#49698d');
 }else if(scene==='vertical'){
  const yy=t=>274-220*t/ticks,yv=v=>yy((v-p.min)/p.step),zero=yv(0);
  art+='<rect x="25" y="38" width="430" height="'+num(zero-38)+'" fill="#f3f7ff"/><rect x="25" y="'+num(zero)+'" width="430" height="'+num(292-zero)+'" fill="#e3efff"/>';
  art+=line(28,zero,450,zero,'stroke="#57a0c8" stroke-width="1.5" stroke-dasharray="6 5"');
  art+=line(191,282,191,42,'stroke="#536f94" stroke-width="1.5" marker-end="url(#tip)"');
  for(let i=0;i<=ticks;i++){const y=yy(i),major=i%(p.labelEvery||2)===0;
   art+=line(185,y,197,y,'stroke="#6583a7" stroke-width="'+(major?1.5:1)+'" data-height-tick="'+i+'"');
   if(major)art+=text(151,y,signed(p.min+i*p.step),20,'#375b82');
  }
  for(const r of p.points){const y=yy(r.tick);art+=line(200,y,309,y,'stroke="#9bafd0" stroke-dasharray="4 4"')+'<circle cx="309" cy="'+num(y)+'" r="4.5" fill="#6853ca"/>'+text(330,y,r.label,23,'#5540a9','data-point="'+esc(r.label)+'" data-tick-index="'+r.tick+'"');}
  art+=text(75,zero-13,'0 — су беті',17,'#3c809e')+text(240,332,'Биіктік, м',19,'#49698d');
 }else if(scene==='bars'){
  const values=p.ticks.map(n=>n*p.step),min=-40,max=60,y=v=>260-(v-min)*215/(max-min),zero=y(0),w=342/p.ticks.length;
  for(let v=min;v<=max;v+=5){const yy=y(v);art+=line(76,yy,446,yy,'stroke="'+(v===0?'#4d749f':'#e4eaf4')+'" stroke-width="'+(v===0?1.8:.8)+'"');if(v%10===0)art+=text(48,yy,signed(v),19,'#47617c');}
  values.forEach((v,i)=>{const x=90+i*w;art+='<rect x="'+num(x)+'" y="'+num(Math.min(zero,y(v)))+'" width="'+num(w*.62)+'" height="'+num(Math.abs(y(v)-zero))+'" rx="3" fill="'+(v<0?'#df7d92':'#719de8')+'" data-bar-ticks="'+p.ticks[i]+'"/>'+text(x+w*.31,285,i+1,20);});
  art+=text(245,317,'Күндер · нәтиже мың теңгемен',18,'#49698d');
 }else if(scene==='cards'){
  p.values.forEach((v,i)=>{const x=39+i*82;art+='<rect x="'+x+'" y="66" width="73" height="89" rx="12" fill="'+(v<0?'#fff0e8':'#e9edff')+'" stroke="'+(v<0?'#d8a58b':'#8b9fd8')+'" stroke-width="1.5"/>'+text(x+36.5,111,signed(v),31,v<0?'#a75438':'#4e5fba');});
 }else if(scene==='sets'){
  art+='<ellipse cx="240" cy="169" rx="174" ry="112" fill="#edf4ff" stroke="#8ea7c5" stroke-width="2"/><ellipse cx="210" cy="169" rx="116" ry="79" fill="#dce8ff" stroke="#7a94bc" stroke-width="2"/><ellipse cx="175" cy="169" rx="64" ry="44" fill="#bfd2ff" stroke="#6888bd" stroke-width="2"/>';
  art+=text(338,86,'Q',25,'#476591')+text(260,114,'Z',25,'#476591')+text(175,140,'N',25,'#476591');
  art+=text(175,181,p.regions.natural,27,'#5c45b5')+text(283,176,p.regions.integerOther,27,'#5c45b5')+text(377,174,p.regions.rationalOther,27,'#5c45b5');
  art+=text(240,316,'N ⊂ Z ⊂ Q',22,'#476591');
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="'+height+'" viewBox="0 0 480 '+height+'" role="img" aria-labelledby="title desc"><title id="title">'+esc(q.figureTitle)+'</title><desc id="desc">'+esc(q.figureDescription)+'</desc><defs><marker id="tip" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7Z" fill="#6574b1"/></marker></defs><rect width="480" height="'+height+'" fill="white"/>'+art+'</svg>\n';
}
export function verifyEdition(q){
 const result=independentlyCalculate(q);
 assert.equal(q.answer,result.answer,'Independent tick-index answer');
 assert.equal(q.statement,statementFor(q),'Exact condition bound to visible/given quantities');
 assert.equal(q.solution,solutionFor(q),'Exact solution bound to tick-index quantities');
 assert.equal(q.figureDescription,descriptionFor(q),'Exact accessible description bound to visible givens');
 assert.equal(q.image,'/figures/synaq-editions/'+q.editionId+'.svg');
 assert.equal(q.figureSha256,sha(svgFor(q)),'Exact native tick-index SVG digest');
 if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(x=>x===q.answer).length,1,'Unique matching choice');}
 return {...result,checks:[...result.checks,'The authored source occurrence, visible givens, answer and native SVG digest remain bound']};
}
