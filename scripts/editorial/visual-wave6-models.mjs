// Native diagrams of river motion and successive percentage changes.
// Checks use signed unit walks, integer candidate searches and exact rationals.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave6-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const R=(n,d=1)=>{n=BigInt(n);d=BigInt(d);assert.ok(d>0n);const g=gcd(n,d);return {n:n/g,d:d/g};};
const times=(a,b)=>R(a.n*b.n,a.d*b.d);
const integer=r=>{assert.equal(r.n%r.d,0n,'Exact whole-number quantity');return Number(r.n/r.d);};
const fmt=n=>String(n).replace('.',',');
function groundVelocity(p){
 let x=0;for(let i=0;i<p.boatSpeed;i++)x+=p.boatDirection;for(let i=0;i<p.current;i++)x+=p.currentDirection;return x;
}
function candidateDivision(total,unit){
 const a=[];for(let n=1;n<=total;n++){let x=0;for(let i=0;i<n;i++)x+=unit;if(x===total)a.push(n);if(x>total)break;}
 assert.equal(a.length,1,'One exact positive integer quotient');return a[0];
}
function validate(q){
 const p=q.params,k=kind(q);assert.ok(['river','mixture','price','interest','rectangle'].includes(p.scene));
 if(p.scene==='river'){
  assert.equal(p.currentDirection,1);assert.ok(p.boatDirection===1||p.boatDirection===-1);assert.ok(Number.isInteger(p.boatSpeed)&&p.boatSpeed>=0&&p.boatSpeed<=30);
  if(k==='raft-current')assert.equal(p.current,null);else assert.ok(Number.isInteger(p.current)&&p.current>0&&p.current<10);
  if(p.raft)assert.equal(p.boatSpeed,0);else assert.ok(p.boatSpeed>p.current);
  if(p.distance!==undefined)assert.ok(Number.isInteger(p.distance)&&p.distance>0&&p.distance<=100);
  if(p.hours!==undefined)assert.ok(Number.isInteger(p.hours)&&p.hours>0&&p.hours<=12);
 }
 if(p.scene==='mixture')assert.ok(Number.isInteger(p.mass)&&p.mass>0&&p.mass<=1000&&Number.isInteger(p.saltPercent)&&p.saltPercent>0&&p.saltPercent<100);
 if(p.scene==='price')assert.ok(Number.isInteger(p.initial)&&p.initial>0&&Number.isInteger(p.discount)&&p.discount>0&&p.discount<100&&Number.isInteger(p.increase)&&p.increase>0&&p.increase<100);
 if(p.scene==='interest')assert.ok(Number.isInteger(p.initial)&&Number.isInteger(p.afterOne)&&p.afterOne>p.initial&&p.initial>0);
 if(p.scene==='rectangle'){assert.ok(Number.isInteger(p.length)&&Number.isInteger(p.width)&&p.length>p.width&&p.width>0);assert.ok(Number.isInteger(p.lengthPercent)&&Number.isInteger(p.widthPercent)&&p.lengthPercent>0&&p.widthPercent>0);assert.ok(p.length*(100+p.lengthPercent)>p.length*100&&p.width*(100+p.widthPercent)>p.width*100);}
 return p;
}
export function independentlyCalculate(q){
 const p=validate(q),k=kind(q),checks=['Directed motion, percent bases and all diagram quantities are checked with exact arithmetic'];let answer;
 switch(k){
 case 'boat-time':assert.equal(p.boatDirection,p.currentDirection);answer=String(candidateDivision(p.distance,groundVelocity(p)));break;
 case 'raft-time':assert.equal(p.raft,true);answer=String(candidateDivision(p.distance,p.current));checks.push('A raft has no own propulsion: only current speed is used');break;
 case 'boat-distance':{assert.equal(p.boatDirection,p.currentDirection);let x=0;const v=groundVelocity(p);for(let h=0;h<p.hours;h++)x+=v;answer=String(x);break;}
 case 'upstream-direction-speed':assert.equal(p.boatDirection,-p.currentDirection);assert.ok(groundVelocity(p)<0);answer='Ағысқа қарсы, '+Math.abs(groundVelocity(p))+' км/сағ';checks.push('Boat and current arrows oppose; their speed magnitudes must be subtracted');break;
 case 'raft-current':{assert.equal(p.raft,true);const candidates=[];for(let v=1;v<=p.distance;v++){let x=0;for(let h=0;h<p.hours;h++)x+=v;if(x===p.distance)candidates.push(v);}assert.equal(candidates.length,1);answer=String(candidates[0]);break;}
 case 'water-mass':answer=String(integer(times(R(p.mass),R(100-p.saltPercent,100))));checks.push('Water is the complement of the salt mass percentage; total solution mass is conserved');break;
 case 'successive-price':answer=String(integer(times(times(R(p.initial),R(100-p.discount,100)),R(100+p.increase,100))));checks.push('The increase is applied to the discounted price, not to the original base');break;
 case 'compound-second-year':answer=String(integer(times(R(p.afterOne),R(p.afterOne,p.initial))));checks.push('The same multiplicative ratio applies to each year, not the same additive amount');break;
 case 'expanded-rectangle-area':{
  const a=integer(times(R(p.length),R(100+p.lengthPercent,100))),b=integer(times(R(p.width),R(100+p.widthPercent,100)));let area=0;for(let r=0;r<b;r++)for(let c=0;c<a;c++)area++;answer=String(area);checks.push('New dimensions are derived separately; unit-square enumeration verifies their area and prevents adding the two percentage increases');break;
 }
 default:throw Error('Unknown source-specific form '+k);
 }
 return {answer,checks};
}
function conditionCore(q){
 const p=q.params;switch(kind(q)){
 case 'boat-time':return 'Сызбадағы A және B айлақтарының арақашықтығы мен екі жылдамдықты оқыңыз. Қайық көрсетілген бағытпен A-дан B-ға неше сағатта жетеді?';
 case 'raft-time':return 'Сал A айлағынан ағыспен қозғалып, B айлағына барады. Қашықтық пен ағыс жылдамдығы сызбада берілген. Сал жолға неше сағат жұмсайды?';
 case 'boat-distance':return 'Катер сызбадағы бағытпен '+p.hours+' сағат жүзді. Екі жылдамдық та км/сағ бірлігімен берілген. Катер осы уақытта неше километр жүреді?';
 case 'upstream-direction-speed':return 'Қайық пен ағыс нұсқарларының бағыттарын салыстырыңыз. Қайық ағыспен бе, әлде ағысқа қарсы ма қозғалып барады? Оның жағаға қатысты жылдамдығын таңдаңыз.';
 case 'raft-current':return 'A-дан жіберілген сал сызбадағы қашықтықты '+p.hours+' сағатта өтті. Өзеннің ағыс жылдамдығын км/сағ бірлігімен табыңыз.';
 case 'water-mass':return 'Ыдыстағы ерітінді тек тұз бен судан тұрады. Сызбада ерітіндінің толық массасы және тұздың массалық үлесі берілген. Ыдыста неше грамм су бар?';
 case 'successive-price':return 'Жейденің бағасы сызбадағы ретпен екі рет өзгерді. Екінші пайыздық өзгеріс сол кездегі жаңа бағадан есептеледі. Соңғы баға неше теңге болады?';
 case 'compound-second-year':return 'Салымға әр жылдың соңында бірдей пайызбен күрделі өсім қосылады. Сызбада бастапқы сома мен бір жылдан кейінгі сома берілген. Екі жылдан кейін салым неше теңге болады?';
 case 'expanded-rectangle-area':return 'Көк тік төртбұрыштың өлшемдері сантиметрмен берілген. Оның ұзындығы мен ені көрсетілген пайыздарға артты; жаңа шекарасы үзік сызықпен салынған. Жаңа аудан неше см² болады?';
 default:throw Error('Unknown condition form');
 }
}
export function statementFor(q){return conditionCore(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');}
export function solutionFor(q){
 const p=q.params,answer=independentlyCalculate(q).answer;let s;
 switch(kind(q)){
 case 'boat-time':s='Қайық та, ағыс та A-дан B-ға бағытталған. Жағаға қатысты жылдамдық: '+p.boatSpeed+' + '+p.current+' = '+(p.boatSpeed+p.current)+' км/сағ. Уақыт: '+p.distance+' : '+(p.boatSpeed+p.current)+' = '+answer+' сағ.';break;
 case 'raft-time':s='Салдың меншікті жылдамдығы жоқ; ол ағыс жылдамдығымен қозғалады: '+p.current+' км/сағ. Уақыт: '+p.distance+' : '+p.current+' = '+answer+' сағ.';break;
 case 'boat-distance':s='Нұсқарлар бір бағытта: жылдамдық '+p.boatSpeed+' + '+p.current+' = '+(p.boatSpeed+p.current)+' км/сағ. Жол: '+(p.boatSpeed+p.current)+' · '+p.hours+' = '+answer+' км.';break;
 case 'upstream-direction-speed':s='Қайық солға, ал ағыс оңға бағытталған. Демек, қайық ағысқа қарсы жүзеді. Жағаға қатысты жылдамдық: '+p.boatSpeed+' − '+p.current+' = '+(p.boatSpeed-p.current)+' км/сағ. Ағыс жылдамдығын қосу бұл жағдайда дұрыс емес.';break;
 case 'raft-current':s='Салдың жылдамдығы ағыс жылдамдығына тең. '+p.distance+' км жолды '+p.hours+' сағатта жүрді: '+p.distance+' : '+p.hours+' = '+answer+' км/сағ.';break;
 case 'water-mass':{const salt=p.mass*p.saltPercent/100;s='Тұз массасы: '+p.mass+' · '+p.saltPercent+'/100 = '+salt+' г. Су массасы: '+p.mass+' − '+salt+' = '+answer+' г. Тексеру: '+answer+' + '+salt+' = '+p.mass+' г.';break;}
 case 'successive-price':{const discount=p.initial*p.discount/100,after=p.initial-discount,growth=after*p.increase/100;s='Бірінші өзгеріс: '+p.initial+' · '+p.discount+'/100 = '+discount+' теңге жеңілдік. Жаңа баға '+p.initial+' − '+discount+' = '+after+' теңге. Екінші өсім осы сомадан: '+after+' · '+p.increase+'/100 = '+growth+' теңге. Соңғы баға: '+after+' + '+growth+' = '+answer+' теңге. Пайыздарды бірден қосып-азайтуға болмайды: есептеу негіздері әртүрлі.';break;}
 case 'compound-second-year':{const delta=p.afterOne-p.initial,rate=delta/p.initial,next=p.afterOne*rate;s='Бірінші жылғы өсім: '+p.afterOne+' − '+p.initial+' = '+delta+' теңге. Жылдық үлесі '+delta+'/'+p.initial+' = '+fmt(rate)+' = '+fmt(rate*100)+'%. Екінші жылы өсім жаңа сомадан есептеледі: '+p.afterOne+' · '+fmt(rate)+' = '+next+' теңге. Сондықтан '+p.afterOne+' + '+next+' = '+answer+' теңге. Жыл сайын бастапқы өсімді ғана қосу күрделі өсімді есептемейді.';break;}
 case 'expanded-rectangle-area':{const a=p.length*(100+p.lengthPercent)/100,b=p.width*(100+p.widthPercent)/100;s='Ұзындық: '+p.length+' · '+(100+p.lengthPercent)+'/100 = '+a+' см. Ені: '+p.width+' · '+(100+p.widthPercent)+'/100 = '+b+' см. Жаңа аудан: '+a+' · '+b+' = '+answer+' см². Әр өлшемнің өзгерісі бөлек қолданылады; ауданға пайыздарды жай қосу дұрыс емес.';break;}
 default:throw Error('Unknown solution form');
 }
 return s+'\nЖауап: '+answer+'.';
}
export function descriptionFor(q){
 const p=q.params;let s=statementFor(q)+' ';
 if(p.scene==='river'){if(p.distance)s+='A солда, B оңда; AB = '+p.distance+' км. ';s+='Ағыс оңға бағытталған, жылдамдығы '+(p.current===null?'белгісіз':p.current+' км/сағ')+'. ';s+=p.raft?'Сал ағыспен қозғалады. ':'Қайық '+(p.boatDirection===1?'оңға':'солға')+' бағытталған; меншікті жылдамдығы '+p.boatSpeed+' км/сағ. ';}
 if(p.scene==='mixture')s+='Ерітінді массасы '+p.mass+' г; тұздың массалық үлесі '+p.saltPercent+'%. ';
 if(p.scene==='price')s+='Бастапқы баға '+p.initial+' теңге; алдымен -'+p.discount+'%, одан кейін +'+p.increase+'%. Аралық және соңғы сомалар белгісіз. ';
 if(p.scene==='interest')s+='Бастапқы сома '+p.initial+' теңге; 1 жылдан кейін '+p.afterOne+' теңге; 2 жылдан кейінгі сома белгісіз. ';
 if(p.scene==='rectangle')s+='Бастапқы өлшемдер '+p.length+' см және '+p.width+' см; ұзындығы +'+p.lengthPercent+'%, ені +'+p.widthPercent+'%. Сызбалардың төменгі сол жақ төбелері ортақ. Жаңа өлшемдер санмен берілмеген. ';
 return s;
}
export function svgFor(q){
 const p=validate(q),scene=p.scene,height=scene==='price'||scene==='interest'?245:360;
 const n=x=>Number(x.toFixed(3)),text=(x,y,v,size=22,color='#345076')=>'<text x="'+n(x)+'" y="'+n(y)+'" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="'+size+'" fill="'+color+'" stroke="white" stroke-width="2.7" paint-order="stroke" stroke-linejoin="round">'+esc(v)+'</text>';
 const line=(x,y,a,b,attrs='')=>'<line x1="'+n(x)+'" y1="'+n(y)+'" x2="'+n(a)+'" y2="'+n(b)+'" '+attrs+'/>';
 const arrow=(x,y,a,b,color='#5f7fba',attrs='')=>line(x,y,a,b,'stroke="'+color+'" stroke-width="2.8" marker-end="url(#tip)" '+attrs);
 let art='';
 if(scene==='river'){
  art+='<rect x="25" y="91" width="430" height="179" rx="20" fill="#e4f1ff"/>';
  for(let y=110;y<260;y+=34)art+='<path d="M40,'+y+' Q60,'+(y-8)+' 80,'+y+' T120,'+y+' T160,'+y+' T200,'+y+' T240,'+y+' T280,'+y+' T320,'+y+' T360,'+y+' T400,'+y+' T440,'+y+'" fill="none" stroke="#c2ddf3" stroke-width="1.4"/>';
  if(p.distance){art+=text(63,58,'A',24)+text(417,58,'B',24)+line(92,58,388,58,'stroke="#7b95b7" stroke-width="1.4"')+text(240,32,p.distance+' км',24);}
  if(p.raft){for(let i=0;i<5;i++)art+='<rect x="'+(195+i*18)+'" y="169" width="17" height="48" rx="7" fill="#e0b07d" stroke="#ac8059" stroke-width="1.4"/>';art+=line(195,179,284,179,'stroke="#895d3e" stroke-width="2"')+line(195,207,284,207,'stroke="#895d3e" stroke-width="2"')+text(240,141,'Сал',23);}
  else{const transform=p.boatDirection<0?'transform="translate(480 0) scale(-1 1)"':'';art+='<g '+transform+'><path d="M178,185 L298,185 L278,216 L197,216 Z" fill="#8c83da" stroke="#5c63a9" stroke-width="1.8"/><rect x="211" y="155" width="47" height="30" rx="5" fill="#fff2cf" stroke="#b99d69" stroke-width="1.5"/><rect x="220" y="162" width="24" height="15" rx="2" fill="#9cc9ee"/></g>'+text(240,120,'Меншікті: '+p.boatSpeed+' км/сағ',22);art+=arrow(p.boatDirection>0?155:325,239,p.boatDirection>0?325:155,239,'#7d69c7','data-boat-direction="'+p.boatDirection+'"');}
  art+=arrow(150,294,330,294,'#558fb6','data-current-direction="1"')+text(240,326,'Ағыс: '+(p.current===null?'?':p.current)+' км/сағ',23);
 }else if(scene==='mixture'){
  art+='<path d="M130,61 L130,276 Q130,297 151,297 L329,297 Q350,297 350,276 L350,61" fill="#f4f9ff" stroke="#7799bb" stroke-width="2.2"/><path d="M132,150 L348,150 L348,275 Q348,295 328,295 L152,295 Q132,295 132,275 Z" fill="#b9d9ee"/><path d="M132,150 Q185,141 240,150 T348,150" fill="none" stroke="#75a9cc" stroke-width="2"/>';
  art+=text(240,105,'Ерітінді: '+p.mass+' г',27)+text(240,209,'Тұз: '+p.saltPercent+'%',28)+text(240,333,'Тек тұз бен су',21);
 }else if(scene==='price'||scene==='interest'){
  const values=scene==='price'?[p.initial,'?','?']:[p.initial,p.afterOne,'?'],labels=scene==='price'?['Бастапқы','Жеңілдіктен соң','Соңғы']:['Бастапқы','1 жылдан соң','2 жылдан соң'],xs=[81,240,399];
  xs.forEach((x,i)=>{art+='<rect x="'+(x-66)+'" y="87" width="132" height="82" rx="13" fill="'+(i===2?'#f0eaff':'#eaf2ff')+'" stroke="#93a9cf" stroke-width="1.5"/>'+text(x,58,labels[i],18)+text(x,127,values[i],28);});
  art+=arrow(149,128,171,128)+arrow(308,128,330,128)+text(240,214,'Барлық сомалар теңгемен',20);
  if(scene==='price')art+=text(160,191,'−'+p.discount+'%',21,'#b05b45')+text(319,191,'+'+p.increase+'%',21,'#5478bd');
 }else if(scene==='rectangle'){
  const scale=24,left=104,bottom=271,w=p.length*scale,h=p.width*scale,newW=p.length*(100+p.lengthPercent)/100*scale,newH=p.width*(100+p.widthPercent)/100*scale;
  art+='<rect x="'+left+'" y="'+n(bottom-newH)+'" width="'+n(newW)+'" height="'+n(newH)+'" fill="#fff4df" stroke="#d4a15b" stroke-width="2" stroke-dasharray="7 5" data-new-width="'+n(newW)+'" data-new-height="'+n(newH)+'"/><rect x="'+left+'" y="'+n(bottom-h)+'" width="'+n(w)+'" height="'+n(h)+'" fill="#bfd4f7" stroke="#6283b5" stroke-width="2" data-original-width="'+n(w)+'" data-original-height="'+n(h)+'"/>';
  art+=text(left+w/2,bottom+28,p.length+' см',23)+text(left-36,bottom-h/2,p.width+' см',23);
  art+=text(240,42,'Ұзындығы +'+p.lengthPercent+'%',23)+text(380,184,'Ені',21)+text(380,214,'+'+p.widthPercent+'%',23);
  art+=arrow(left+w,bottom-h-17,left+newW,bottom-h-17,'#bd8c47')+arrow(left-17,bottom-h,left-17,bottom-newH,'#bd8c47');
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="'+height+'" viewBox="0 0 480 '+height+'" role="img" aria-labelledby="title desc"><title id="title">'+esc(q.figureTitle)+'</title><desc id="desc">'+esc(q.figureDescription)+'</desc><defs><marker id="tip" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7Z" fill="#6b80ae"/></marker></defs><rect width="480" height="'+height+'" fill="white"/>'+art+'</svg>\n';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(q.answer,r.answer,'Independent signed-motion/rational answer');assert.equal(q.statement,statementFor(q),'Exact condition');assert.equal(q.solution,solutionFor(q),'Exact worked solution');assert.equal(q.figureDescription,descriptionFor(q),'Exact accessible givens');assert.equal(q.image,'/figures/synaq-editions/'+q.editionId+'.svg');assert.equal(q.figureSha256,sha(svgFor(q)),'Native SVG digest');if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(s=>s===q.answer).length,1);}return {...r,checks:[...r.checks,'Condition, units, diagram directions, hidden unknown quantities, worked solution and SVG digest are bound']};
}
