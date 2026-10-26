// Independently measured endpoints and native arrows: direction is not length.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave12-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export const displacement=v=>[v.end[0]-v.start[0],v.end[1]-v.start[1]];
export function squaredLength(v){return displacement(v).reduce((s,n)=>s+n*n,0);}
const length=v=>{const n=Math.sqrt(squaredLength(v));assert.ok(Number.isInteger(n),'Integer unit length in this elementary vector model');return n;};
export function independentlyCalculate(q){
 const p=q.params,k=kind(q);let answer,checks;
 switch(k){
 case 'scaled-speed':{const gaps=Math.abs(p.end-p.start);assert.ok(p.start>0&&p.end>p.start&&p.unitScale>0);answer=String(gaps*p.unitScale);checks={gaps,unitScale:p.unitScale};break;}
 case 'opposite-vectors':{const [a,b]=p.vectors;assert.deepEqual(a.start,b.end);assert.deepEqual(a.end,b.start);assert.ok(squaredLength(a)>0);answer='Модульдері тең, бағыттары қарама-қарсы';checks={squaredLengths:p.vectors.map(squaredLength),directions:p.vectors.map(displacement)};break;}
 case 'equal-length-count':{assert.ok(p.vectors.every(v=>displacement(v).includes(0)));const lengths=p.vectors.map(length);answer=String(lengths.filter(n=>n===p.targetLength).length);checks={lengths};break;}
 case 'compass-direction':{const [dx,dy]=displacement(p.vector);assert.notEqual(dx,0);assert.notEqual(dy,0);answer=(dy>0?'солтүстік':'оңтүстік')+'-'+(dx>0?'шығысқа':'батысқа');checks={dx,dy};break;}
 case 'endpoint-abscissa':answer=String(p.vector.end[0]);checks={tail:p.vector.start,head:p.vector.end};break;
 case 'horizontal-length':assert.equal(p.vector.start[1],p.vector.end[1]);answer=String(length(p.vector));checks={signedDisplacement:displacement(p.vector)};break;
 case 'vector-name':answer='vector('+p.vector.startLabel+p.vector.endLabel+')';checks={tail:p.vector.startLabel,head:p.vector.endLabel};break;
 case 'vertical-length':assert.equal(p.vector.start[0],p.vector.end[0]);answer=String(length(p.vector));checks={signedDisplacement:displacement(p.vector)};break;
 case 'longest-vector':{const squares=p.vectors.map(squaredLength),max=Math.max(...squares),good=p.vectors.filter(v=>squaredLength(v)===max);assert.equal(good.length,1);answer='vector('+good[0].label+')';checks={squaredLengths:squares};break;}
 case 'ray-direction':{const v=p.vector;assert.ok(squaredLength(v)>0);answer=v.startLabel+' басынан '+v.endLabel+' нүктесі арқылы өтетін сәулеге';checks={tail:v.start,head:v.end};break;}
 default:throw Error('Known vector model '+k);
 }
 return {answer,checks};
}
function core(q){
 const p=q.params;
 switch(kind(q)){
 case 'scaled-speed':return 'Сызбада самокатшының жылдамдық векторы берілген. Бірлік кесінді '+p.unitScale+' км/сағ-қа сәйкес келеді. Самокатшының жылдамдығы неше км/сағ?';
 case 'opposite-vectors':return 'Сызбалардағы PQ және QP бағытталған кесінділерінің модульдері мен бағыттарын салыстырыңыз. Қай тұжырым дұрыс?';
 case 'equal-length-count':return 'Бірдей шаршы торларда a, b, c, d, e, f векторлары салынған. Неше вектордың ұзындығы дәл '+p.targetLength+' торкөзге тең? Бағытты ұзындықпен шатастырмаңыз.';
 case 'compass-direction':return 'Тордың жоғары жағы — солтүстік, оң жағы — шығыс. Дронның қозғалысы нұсқармен көрсетілген. Дрон қай бағытқа ұшады?';
 case 'endpoint-abscissa':return 'Координаталық жазықтықта p векторы берілген. Нұсқар орналасқан ұшының абсциссасын табыңыз.';
 case 'horizontal-length':return 'Бірлік координаталық тордағы AB векторының ұзындығы неше бірлік?';
 case 'vector-name':return 'Суреттегі бағытталған кесіндінің белгіленуін таңдаңыз: алдымен басы, одан кейін ұшы жазылады.';
 case 'vertical-length':return 'Бірлік координаталық торда M және N нүктелері көрсетілген. MN векторының ұзындығын табыңыз.';
 case 'longest-vector':return 'Төрт вектор бірдей шаршы торларда салынған. Қай вектордың модулі ең үлкен?';
 case 'ray-direction':return 'Сызбадағы PQ векторының бағыты қай сәуленің бағытына сәйкес келеді?';
 default:throw Error('Known condition');
 }
}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,k=kind(q),r=independentlyCalculate(q);
 switch(k){
 case 'scaled-speed':return 'Вектор '+p.start+' белгісінен '+p.end+' белгісіне дейін барады, сондықтан ұзындығы '+p.end+' − '+p.start+' = '+r.checks.gaps+' бірлік. Жылдамдық '+r.checks.gaps+' × '+p.unitScale+' = '+r.answer+' км/сағ. Ұшының белгісін ғана масштабқа көбейтпейміз.';
 case 'opposite-vectors':return 'Екі бағытталған кесіндінің ұштары бірдей екі нүктеде, сондықтан модульдері тең. Бірі P-дан Q-ға, екіншісі Q-дан P-ға бағытталған. Демек, бағыттары қарама-қарсы, бірақ ұзындықтары бірдей.';
 case 'equal-length-count':return 'Векторлардың ұзындықтары a-дан f-ке дейін ретімен '+r.checks.lengths.join(', ')+'. '+p.targetLength+' бірлікке теңдері '+p.vectors.filter(v=>length(v)===p.targetLength).map(v=>v.label).join(', ')+', барлығы '+r.answer+'. Басқа бағытта тұру модульді өзгертпейді.';
 case 'compass-direction':return 'Нұсқар басынан ұшына қарай '+Math.abs(r.checks.dx)+' торкөз солға және '+Math.abs(r.checks.dy)+' торкөз жоғары бағытталған. Солға — батыс, жоғары — солтүстік: '+r.answer+'. Нұсқардың бағытын кері оқуға болмайды.';
 case 'endpoint-abscissa':return 'Басы ('+p.vector.start.join('; ')+'), ұшы ('+p.vector.end.join('; ')+'). Абсцисса — бірінші координата, сондықтан '+r.answer+'. Басының координатасын немесе ұшының ординатасын алмау керек.';
 case 'horizontal-length':return 'A('+p.vector.start.join('; ')+'), B('+p.vector.end.join('; ')+'). Ординаталары тең. Ұзындық — абсциссалар айырмасының модулі: |'+p.vector.end[0]+' − ('+p.vector.start[0]+')| = '+r.answer+'.';
 case 'vector-name':return 'Басы P нүктесінде, ал нұсқар Q нүктесіне қарайды. Векторда басының әрпі бірінші: '+r.answer+'. Кері QP бағыты басқа вектор береді.';
 case 'vertical-length':return 'M('+p.vector.start.join('; ')+'), N('+p.vector.end.join('; ')+'). Абсциссалары тең. Ұзындық |'+p.vector.end[1]+' − ('+p.vector.start[1]+')| = '+r.answer+'. Минус таңбаларын сақтау керек; ұзындық теріс болмайды.';
 case 'longest-vector':return 'a, b, c, d ұзындықтары ретімен '+p.vectors.map(length).join(', ')+' бірлік. Ең үлкені c векторында: '+length(p.vectors[2])+' бірлік. Сондықтан '+r.answer+'.';
 case 'ray-direction':return 'PQ векторы P-дан басталып, Q-ға бағытталған. P басынан Q арқылы өтетін сәуле де сол бағытпен жалғасады. Q басынан P-ға өтетін сәуленің бағыты кері, ал түзуге бір ғана бағыт бекітілмейді.';
 default:throw Error('Known solution');
 }
}
export function descriptionFor(q){
 const p=q.params;
 if(p.scene==='ray-scale')return 'Бірдей аралықты сандық сәуле '+p.min+'–'+p.max+' белгілерімен берілген. Жылдамдық векторы '+p.start+' белгісінен '+p.end+' белгісіне бағытталған. Бір аралық '+p.unitScale+' км/сағ.';
 if(p.scene==='gallery')return 'Әр панельде бірдей шаршы тор. Бағытталған кесінділер: '+p.vectors.map(v=>v.label+': ('+v.start.join('; ')+') басынан ('+v.end.join('; ')+') ұшына').join('; ')+'.';
 if(p.scene==='opposite')return 'Екі панельде бірдей P('+p.vectors[0].start.join('; ')+') және Q('+p.vectors[0].end.join('; ')+') нүктелері. Бірінші нұсқар P-дан Q-ға, екіншісі Q-дан P-ға.';
 const v=p.vector;return (p.scene==='compass'?'Тордың жоғарысы солтүстік, оң жағы шығыс. ':'Бірлік тор. ')+(v.startLabel||'Басы')+'('+v.start.join('; ')+') нүктесінен '+(v.endLabel||'ұшы')+'('+v.end.join('; ')+') нүктесіне нұсқар жүргізілген.';
}
export function svgFor(q){
 const p=q.params,blue='#315ce8',purple='#8459ce',ink='#203549',soft='#dbe5f1';let body='';
 const line=(x1,y1,x2,y2,color=ink,width=2,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,t,size=23,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';
 const center=(x,y,t,size=23,color=ink)=>text(x,y,t,size,color,'text-anchor="middle" stroke="#fff" stroke-width="4" paint-order="stroke"');
 const grid=(min,max,P)=>{let s='';for(let n=min;n<=max;n++){s+=line(...P([min,n]),...P([max,n]),soft,1)+line(...P([n,min]),...P([n,max]),soft,1);}return s;};
 function arrow(v,P,color=blue){
  const a=P(v.start),b=P(v.end),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);assert.ok(len>0);const ux=dx/len,uy=dy/len,tip=10,base=[b[0]-tip*ux,b[1]-tip*uy],head=[[b[0],b[1]],[base[0]+5*uy,base[1]-5*ux],[base[0]-5*uy,base[1]+5*ux]];
  return line(...a,...base,color,3,'data-vector="'+(v.label||'v')+'" data-start="'+v.start.join(',')+'" data-end="'+v.end.join(',')+'"')+'<polygon data-arrow-tip="'+v.end.join(',')+'" points="'+head.map(v=>v.join(',')).join(' ')+'" fill="'+color+'"/><circle cx="'+a[0]+'" cy="'+a[1]+'" r="4" fill="'+color+'"/>';
 }
 if(p.scene==='ray-scale'){
  const X=v=>35+(v-p.min)*410/(p.max-p.min),y=220;body+=line(28,y,453,y)+'<path d="M 453 220 L 444 215 L 444 225 Z" fill="'+ink+'"/>';
  for(let n=p.min;n<=p.max;n++)body+=line(X(n),y-7,X(n),y+7,ink,1.4)+center(X(n),y+31,n,18);
  const v={label:'v',start:[p.start,0],end:[p.end,0]},P=([x])=>[X(x),160];body+=arrow(v,P)+center((X(p.start)+X(p.end))/2,130,'v',28,blue)+line(X(p.start),167,X(p.start),211,soft,1.5)+line(X(p.end),167,X(p.end),211,soft,1.5);
 }else if(p.scene==='gallery'){
  const cols=p.vectors.length===6?3:2,rows=Math.ceil(p.vectors.length/cols),size=18;
  p.vectors.forEach((v,i)=>{const cx=(i%cols+0.5)*480/cols,cy=(Math.floor(i/cols)+0.5)*360/rows+10,P=([x,y])=>[cx+x*size,cy-y*size],extent=p.gridExtent||3;body+=grid(-extent,extent,P)+text(cx-extent*size,cy-extent*size-10,v.label,21,purple)+arrow(v,P);});
 }else if(p.scene==='opposite'){
  p.vectors.forEach((v,i)=>{const P=([x,y])=>[60+x*48,115+i*145-y*35];body+=text(35,45+i*145,i+1,18,purple)+arrow(v,P);for(const [n,xy]of [[v.startLabel,v.start],[v.endLabel,v.end]]){const a=P(xy);body+=center(a[0],a[1]+25,n,23);}});
 }else{
  const P=([x,y])=>[240+x*26,180-y*26];body+=grid(-6,6,P);
  if(p.scene==='plane'){
   body+=line(...P([-6,0]),...P([6,0]),ink,1.7)+line(...P([0,-6]),...P([0,6]),ink,1.7);
   for(let n=-5;n<=5;n++)if(n){const a=P([n,0]),b=P([0,n]);body+=line(a[0],a[1]-4,a[0],a[1]+4,ink,1.1)+center(a[0],a[1]+18,n,15)+line(b[0]-4,b[1],b[0]+4,b[1],ink,1.1)+text(b[0]-10,b[1]+5,n,15,ink,'text-anchor="end"');}
   body+=text(250,198,0,15)+text(408,187,'x',19)+text(247,22,'y',19);
  }
  body+=arrow(p.vector,P);
  for(const [name,xy,delta]of [[p.vector.startLabel,p.vector.start,p.vector.startLabelOffset||[-13,22]],[p.vector.endLabel,p.vector.end,p.vector.endLabelOffset||[13,-14]]])if(name){const a=P(xy);body+=center(a[0]+delta[0],a[1]+delta[1],name,24);}
  if(p.scene==='compass')body+=center(240,17,'Солтүстік',18,purple)+text(407,187,'Шығыс',18,purple);
  if(p.scene==='plane'&&kind(q)==='endpoint-abscissa'){const a=P(p.vector.end),base=P([p.vector.end[0],0]);body+=line(...a,...base,purple,1.3,'stroke-dasharray="5 4"');}
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Бағытталған кесінділер</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent vector answer');assert.equal(statementFor(q),q.statement,'Exact parameter-bound statement');assert.equal(solutionFor(q),q.solution,'Exact parameter-bound solution');assert.equal(descriptionFor(q),q.figureDescription,'Exact accessible description');assert.equal(sha(svgFor(q)),q.figureSha256,'Exact native SVG digest');if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
 return {answer:r.answer,checks:Object.entries(r.checks).map(([k,v])=>k+': '+JSON.stringify(v))};
}
