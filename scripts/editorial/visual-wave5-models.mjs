// Newly authored native rational-number diagrams; coordinates use integer
// numerators, so thirds/ninths are never rounded to place a point.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave5-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
const frac=(n,d)=>{assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d>0);const g=gcd(n,d);return {n:n/g,d:d/g};};
const fstr=(n,d)=>{const r=frac(n,d);return r.d===1?String(r.n):r.n+'/'+r.d;};
const fmt=n=>String(n).replace('.',',');
const term=n=>n<0?'('+n+')':String(n);
const mul=(a,b)=>{assert.ok(Number.isInteger(a)&&Number.isInteger(b));let s=0;for(let i=0;i<Math.abs(b);i++)s+=a;return b<0?-s:s;};
const tick=(p,label)=>{const r=p.points.find(r=>r.label===label);assert.ok(r,'Known point '+label);return r.tick;};
const vstr=(p,label)=>fstr(tick(p,label),p.denominator);
const mixed=p=>'('+p.whole+' + ('+p.numerator+'/'+p.denominator+'))';
const eq=(a,b)=>term(a)+' · '+b+' = '+mul(a,b);
export function divisionTrace(n,d){
 assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&n>0&&n<d);
 const seen=new Map(),digits=[],trace=[];let r=n;
 while(r&&!seen.has(r)){assert.ok(trace.length<40);seen.set(r,trace.length);const expanded=r*10,digit=Math.floor(expanded/d),next=expanded%d;trace.push([r,digit,next]);digits.push(digit);r=next;}
 return {trace,digits,cycleStart:r?seen.get(r):null,period:r?digits.length-seen.get(r):0};
}
function validate(q){
 const p=q.params,k=kind(q);assert.ok(['axis','thermo','grid','cards','division','sectors','mixed'].includes(p.scene));
 if(p.scene==='axis'){
  assert.ok(Number.isSafeInteger(p.denominator)&&p.denominator>0&&p.denominator<=12);
  assert.ok(Number.isInteger(p.minTick)&&Number.isInteger(p.maxTick)&&p.minTick<p.maxTick&&p.maxTick-p.minTick<=40);
  assert.ok(Number.isInteger(p.tickEvery)&&p.tickEvery>0);
  assert.ok(p.points.length>0&&p.points.length<=8);assert.equal(new Set(p.points.map(r=>r.label)).size,p.points.length);assert.equal(new Set(p.points.map(r=>r.tick)).size,p.points.length);
  for(const r of p.points)assert.ok(Number.isInteger(r.tick)&&r.tick>=p.minTick&&r.tick<=p.maxTick);
  for(const n of p.labels){assert.ok(Number.isInteger(n)&&n>=p.minTick&&n<=p.maxTick);}
  if(p.jumpCount){assert.ok(Number.isInteger(p.delta)&&p.delta<0);assert.ok(Number.isInteger(p.jumpCount)&&p.jumpCount>=2&&p.jumpCount<=8);assert.equal(p.jumpStart,0);assert.equal(p.jumpStart+mul(p.delta,p.jumpCount),tick(p,p.finalLabel));}
 }
 if(p.scene==='thermo'){assert.ok(Number.isInteger(p.min)&&Number.isInteger(p.max)&&p.min<0&&p.max>0&&p.min<p.reading&&p.reading<0);assert.ok(Number.isInteger(p.step)&&p.step>0);assert.ok(Number.isInteger((p.reading-p.min)/p.step));}
 if(p.scene==='grid')assert.ok(Number.isInteger(p.rows)&&Number.isInteger(p.cols)&&p.rows>=2&&p.rows<=7&&p.cols>=2&&p.cols<=8&&p.rows!==p.cols);
 if(p.scene==='cards'){assert.ok(p.values.length===3||p.values.length===4);assert.equal(new Set(p.values).size,p.values.length);p.values.forEach(n=>assert.ok(Number.isSafeInteger(n)&&n!==0&&Math.abs(n)<=125));}
 if(p.scene==='division'){const r=divisionTrace(p.numerator,p.denominator);assert.deepEqual(p.trace,r.trace,'Every displayed long-division remainder and digit is exact');assert.equal(r.cycleStart,0,'This source form has a purely repeating decimal');}
 if(p.scene==='sectors'){assert.equal(p.parts,9);assert.ok(Number.isInteger(p.repeatDigit)&&p.repeatDigit>0&&p.repeatDigit<9&&Number.isInteger(p.colored)&&p.colored>0&&p.colored<p.repeatDigit);}
 if(p.scene==='mixed'){assert.ok(Number.isInteger(p.whole)&&p.whole>0&&p.numerator>0&&p.numerator<p.denominator&&Number.isInteger(p.numerator)&&Number.isInteger(p.denominator));}
 if(k==='equal-parts-coordinate'){assert.equal(p.denominator,1);assert.equal(tick(p,p.target),p.delta);assert.equal(tick(p,p.finalLabel),mul(p.delta,p.jumpCount));}
 if(['integer-coordinate','half-coordinate','opposite-number','coordinate-absolute','bracket-negative'].includes(k))assert.ok(tick(p,p.target)<0,'This addressed source reads a negative plotted point');
 if(['coordinate-product','coordinate-quotient','unit-length','minor-gap-count','opposite-absolutes-sum'].includes(k))assert.ok(tick(p,p.first)<0&&tick(p,p.second)>0,'Preserve opposite-signed point operands');
 if(k==='two-label-calibration')assert.deepEqual(p.labels,p.calibration.map(r=>r.value*p.denominator),'The two calibration numbers are the actually printed labels');
 if(k==='repeat-axis')assert.equal(p.denominator,9);
 return p;
}
export function independentlyCalculate(q){
 const p=validate(q),k=kind(q),checks=['Native point positions use exact integer numerators or explicitly verified elementary cells/remainders'];let answer;
 switch(k){
 case 'jump-product':answer=eq(p.delta,p.jumpCount);checks.push('Jump length and number of jumps stay in the shown order even if a reversed factor pair has the same product');break;
 case 'coordinate-product':assert.equal(p.denominator,1);answer=String(mul(tick(p,p.first),tick(p,p.second)));break;
 case 'commutation-grid':{const cells=[];for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++)cells.push([r,c]);assert.equal(new Set(cells.map(r=>r.join(':'))).size,mul(p.rows,p.cols));answer=p.rows+' · '+p.cols+' = '+p.cols+' · '+p.rows;break;}
 case 'round-pair':{const pairs=[];for(let i=0;i<p.values.length;i++)for(let j=i+1;j<p.values.length;j++)if(mul(p.values[i],p.values[j])===p.roundTarget)pairs.push([p.values[i],p.values[j]]);assert.equal(pairs.length,1);answer=pairs[0].join(' және ');break;}
 case 'card-product':{let a=1;for(const n of p.values)a=mul(a,n);answer=String(a);break;}
 case 'cooling-rate':assert.ok(Number.isInteger(p.hours)&&p.hours>0);assert.equal(Math.abs(p.reading)%p.hours,0);answer=String(Math.abs(p.reading)/p.hours);checks.push('The requested amount of cooling is positive, unlike the signed hourly change');break;
 case 'equal-parts-coordinate':{const endpoint=tick(p,p.finalLabel);assert.equal(Math.abs(endpoint)%p.jumpCount,0);answer=String(endpoint/p.jumpCount);assert.equal(Number(answer),tick(p,p.target));checks.push('Divide the whole negative endpoint by equal parts, rather than returning the part count');break;}
 case 'coordinate-quotient':{const a=tick(p,p.first),b=tick(p,p.second);assert.notEqual(b,0);answer=b<0?fstr(-a,-b):fstr(a,b);checks.push('Divide the first named point by the second in the requested order');break;}
 case 'period-length':answer=String(divisionTrace(p.numerator,p.denominator).period);break;
 case 'period-notation':{const r=divisionTrace(p.numerator,p.denominator);answer='0,('+r.digits.join('')+')';break;}
 case 'repeat-axis':{const target=frac(p.repeatDigit,9),matches=p.points.filter(r=>r.tick*target.d===target.n*p.denominator);assert.equal(matches.length,1);answer=matches[0].label;break;}
 case 'repeat-sector':{let required=0;for(let i=0;i<p.parts;i++)if(i<p.repeatDigit)required++;answer=String(required-p.colored);break;}
 case 'integer-coordinate':answer=vstr(p,p.target);assert.equal(p.denominator,1);break;
 case 'half-coordinate':assert.equal(p.denominator,2);assert.ok(tick(p,p.target)<0&&Math.abs(tick(p,p.target))%2===1);answer=fmt(tick(p,p.target)/2);break;
 case 'opposite-number':answer=fstr(-tick(p,p.target),p.denominator);break;
 case 'unit-length':{assert.equal(p.denominator,1);let n=0;for(let i=Math.min(tick(p,p.first),tick(p,p.second));i<Math.max(tick(p,p.first),tick(p,p.second));i++)n++;answer=String(n);break;}
 case 'opposite-pair':{const pairs=[];for(let i=0;i<p.points.length;i++)for(let j=i+1;j<p.points.length;j++)if(p.points[i].tick===-p.points[j].tick)pairs.push([p.points[i].label,p.points[j].label]);assert.equal(pairs.length,1);answer=pairs[0].join(' және ');break;}
 case 'minor-gap-count':{assert.ok(p.denominator>1);let n=0;for(let i=Math.min(tick(p,p.first),tick(p,p.second));i<Math.max(tick(p,p.first),tick(p,p.second));i++)n++;answer=String(n);checks.push('Count small gaps, not full coordinate units or endpoint marks');break;}
 case 'two-label-calibration':{const [a,b]=p.calibration;assert.equal(a.value*p.denominator,tick(p,a.label));assert.equal(b.value*p.denominator,tick(p,b.label));assert.equal(p.labels.length,2);const dx=tick(p,b.label)-tick(p,a.label),dy=b.value-a.value;assert.ok(dx>0&&dy>0);const n=a.value*dx+(tick(p,p.target)-tick(p,a.label))*dy;assert.equal(n%dx,0);answer=String(n/dx);break;}
 case 'thermo-absolute':answer=String(Math.abs(p.reading));break;
 case 'mixed-absolute':{const n=mul(p.whole,p.denominator)+p.numerator;assert.equal(frac(n,p.denominator).n,n);answer=mixed(p);checks.push('The minus sign applies to the complete mixed number, not just its whole part');break;}
 case 'bracket-negative':assert.ok(tick(p,p.target)<0);assert.equal(Math.abs(tick(p,p.target)),p.bracket);answer=vstr(p,p.target);break;
 case 'coordinate-absolute':answer=fstr(Math.abs(tick(p,p.target)),p.denominator);break;
 case 'opposite-absolutes-sum':{const a=tick(p,p.first),b=tick(p,p.second);assert.ok(a<0&&b>0&&a===-b);answer=fstr(Math.abs(a)+Math.abs(b),p.denominator);break;}
 case 'greatest-absolute':{const a=p.points.map(r=>({...r,magnitude:Math.abs(r.tick)})).sort((a,b)=>a.magnitude-b.magnitude);assert.notEqual(a.at(-1).magnitude,a.at(-2).magnitude);answer=a.at(-1).label;break;}
 default:throw Error('Unknown addressed visual form '+k);
 }
 return {answer,checks};
}
function conditionCore(q){
 const p=q.params;switch(kind(q)){
 case 'jump-product':return 'Сандық түзудегі қозғалыс 0 нүктесінен басталады. Бір доға — бір секіру. Әр секірудегі таңбалы өзгеріс пен секіру санына сәйкес көбейтіндіні таңдаңыз.';
 case 'coordinate-product':return 'Сызбадағы '+p.first+' және '+p.second+' нүктелерінің координаталарын оқыңыз. Осы екі координатаның көбейтіндісі неге тең?';
 case 'commutation-grid':return 'Мозаиканың шаршыларын жолдар бойынша және бағандар бойынша санаңыз. Дәл осы мозаика үшін көбейтудің ауыстырымдылық қасиетін қай теңдік көрсетеді?';
 case 'round-pair':return 'Карточкалардағы барлық сан көбейтіледі. Есептеуді ыңғайлау үшін алдымен көбейтіндісі '+p.roundTarget+' болатын екі көбейткішті таңдаңыз.';
 case 'card-product':return 'Үш карточкадағы сандардың көбейтіндісін табыңыз. Алдымен дөңгелек сан беретін көбейткіштерді топтастыруға болады.';
 case 'cooling-rate':return 'Салқындатқыштағы температура 0 °C-тан бастап '+p.hours+' сағат бойы бірқалыпты төмендеді. Термометр соңғы температураны көрсетеді. Әр сағатта температура неше градусқа төмендеген?';
 case 'equal-parts-coordinate':return '0 мен '+p.finalLabel+' арасындағы кесінді сызбадағы доғалармен тең бөліктерге бөлінген. '+p.target+' — 0-ден солға қарай бірінші бөлу нүктесі. Оның координатасын табыңыз.';
 case 'coordinate-quotient':return 'Түзуден '+p.first+' және '+p.second+' нүктелерінің координаталарын оқыңыз. '+p.first+' координатасын '+p.second+' координатасына бөліңіз.';
 case 'period-length':return 'Бөлу қадамдарының кестесінде бастапқы қалдық қайталанғанға дейінгі барлық қадам көрсетілген. Алынатын ондық бөлшектің периодында неше цифр бар?';
 case 'period-notation':return 'Кестеде '+p.numerator+' санын '+p.denominator+' санына бөлудің қадамдары берілген. Қалдық қайта пайда болғанда цифрлар да қайталанады. Нәтиженің дұрыс периодты жазылуын таңдаңыз.';
 case 'repeat-axis':return '0 мен 1 аралығындағы сызбаға қараңыз. Координатасы 0,('+p.repeatDigit+') периодты бөлшегіне тең нүктені таңдаңыз.';
 case 'repeat-sector':return 'Дана төсбелгінің 0,('+p.repeatDigit+') бөлігін көк түспен белгілеуі керек. Төсбелгі тең секторларға бөлінген; қазір көк түспен белгіленген секторлар сызбада берілген. Ол тағы неше секторды бояуы керек?';
 case 'integer-coordinate':case 'half-coordinate':return 'Шкаланың 0 және 1 белгілерін пайдаланып, '+p.target+' нүктесінің координатасын анықтаңыз.';
 case 'opposite-number':return 'Сызбадағы '+p.target+' нүктесінің координатасына қарама-қарсы санды жазыңыз.';
 case 'unit-length':return p.first+' пен '+p.second+' арасында ұзындығы бір бірлікке тең неше кесінді бар? Нүктелердің өздерін емес, аралықтарды санаңыз.';
 case 'opposite-pair':return 'Қай екі нүктенің координаталары қарама-қарсы сандар? Олардың санақ басының екі жағында бірдей қашықтықта жататынын тексеріңіз.';
 case 'minor-gap-count':return '0 мен 1 аралығы тең кіші бөліктерге бөлінген. '+p.first+' пен '+p.second+' арасында осындай неше кіші бөлік бар?';
 case 'two-label-calibration':return 'Түзудегі көрші сызықшалар бірдей аралықта орналасқан. Тек '+p.calibration[0].label+' және '+p.calibration[1].label+' координаталары берілген. '+p.target+' нүктесінің координатасын анықтаңыз.';
 case 'thermo-absolute':return 'Көкшетаудағы таңғы температура термометрде көрсетілген. Осы температураны білдіретін санның модулін табыңыз.';
 case 'mixed-absolute':return 'Тақтада модуль белгісінің ішінде теріс аралас сан жазылған. Осы өрнектің мәнін таңдаңыз.';
 case 'bracket-negative':return 'Сызбада '+p.target+' нүктесінің санақ басынан қашықтығы көрсетілген. Нүктенің қай жақта жатқанын ескеріп, оның координатасын табыңыз.';
 case 'coordinate-absolute':return p.target+' нүктесінің координатасын оқып, оның модулін жазыңыз.';
 case 'opposite-absolutes-sum':return 'Сызбадағы '+p.first+' және '+p.second+' координаталарының модульдерін қосыңыз.';
 case 'greatest-absolute':return 'Қай белгіленген нүктенің координатасының модулі ең үлкен?';
 default:throw Error('Unknown condition form');
 }
}
export function statementFor(q){return conditionCore(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');}
export function solutionFor(q){
 const p=q.params,answer=independentlyCalculate(q).answer;let s;
 switch(kind(q)){
 case 'jump-product':s='Әр доға солға '+Math.abs(p.delta)+' бірлікке жылжытады: таңбалы өзгеріс '+p.delta+'. Доғалар саны '+p.jumpCount+'. Сондықтан '+eq(p.delta,p.jumpCount)+'. Көбейткіштердің орындарын ауыстыру сол мәнді берсе де, секіру ұзындығы мен санының ретін өзгертеді.';break;
 case 'coordinate-product':s=p.first+'('+vstr(p,p.first)+'), '+p.second+'('+vstr(p,p.second)+'). Таңбалары әртүрлі, сондықтан көбейтінді теріс: '+term(tick(p,p.first))+' · '+term(tick(p,p.second))+' = '+answer+'.';break;
 case 'commutation-grid':s='Сызбада '+p.rows+' жол, әр жолда '+p.cols+' шаршы бар. Басқа бағытпен санағанда '+p.cols+' баған, әрқайсысында '+p.rows+' шаршы. Екі тәсіл де '+mul(p.rows,p.cols)+' шаршы береді: '+answer+'.';break;
 case 'round-pair':s='Берілген сандар: '+p.values.map(term).join(' · ')+'. '+answer+' сандарын топтастырсақ, олардың көбейтіндісі '+p.roundTarget+' болады. Көбейткіштерді ауыстыру мен топтастыру көбейтіндінің мәнін өзгертпейді.';break;
 case 'card-product':s='Карточкалар: '+p.values.join(', ')+'. Шеткі екі теріс санды топтастырамыз: '+term(p.values[0])+' · '+term(p.values[2])+' = '+mul(p.values[0],p.values[2])+'. Оны '+p.values[1]+' санына көбейтеміз: '+mul(p.values[0],p.values[2])+' · '+p.values[1]+' = '+answer+'.';break;
 case 'cooling-rate':s='Шкала бойынша соңғы температура '+p.reading+' °C. Таңбалы өзгеріс '+p.reading+' °C, ал төмендеу шамасы '+Math.abs(p.reading)+' градус. '+Math.abs(p.reading)+' : '+p.hours+' = '+answer+' градус/сағ. Таңбалы сағаттық өзгеріс -'+answer+' °C/сағ болады.';break;
 case 'equal-parts-coordinate':s=p.finalLabel+'('+tick(p,p.finalLabel)+'). Барлығы '+p.jumpCount+' тең бөлік. Бір бөліктегі таңбалы өзгеріс: ('+tick(p,p.finalLabel)+') : '+p.jumpCount+' = '+answer+'. '+p.target+' нүктесі 0-ден бірінші сол жақ бөлу нүктесінде: '+p.target+'('+answer+').';break;
 case 'coordinate-quotient':s=p.first+'('+vstr(p,p.first)+'), '+p.second+'('+vstr(p,p.second)+'). Сұралған ретпен бөлеміз: '+term(tick(p,p.first))+' : '+term(tick(p,p.second))+' = '+answer+'. Кері ретпен бөлу басқа нәтиже береді.';break;
 case 'period-length':case 'period-notation':{const r=divisionTrace(p.numerator,p.denominator);s=p.numerator+' : '+p.denominator+' бөлуінде қалдықтар '+r.trace.map(t=>t[0]).concat(r.trace.at(-1)[2]).join(' → ')+'. Бастапқы қалдық қайта шықты. Цифрлар: '+r.digits.join(', ')+'. Сондықтан '+p.numerator+'/'+p.denominator+' = 0,('+r.digits.join('')+'); период ұзындығы '+r.period+'.';break;}
 case 'repeat-axis':s='0,('+p.repeatDigit+') = '+p.repeatDigit+'/9. 0 мен 1 арасында '+p.denominator+' тең бөлік бар. 0-ден '+p.repeatDigit+'-бөлікке сәйкес нүкте — '+answer+'.';break;
 case 'repeat-sector':s='0,('+p.repeatDigit+') = '+p.repeatDigit+'/9, демек '+p.parts+' сектордың '+p.repeatDigit+' секторы көк болуы керек. Қазір '+p.colored+' сектор көк. Қалғаны: '+p.repeatDigit+' − '+p.colored+' = '+answer+' сектор.';break;
 case 'integer-coordinate':case 'half-coordinate':s='0 мен 1 арасы '+p.denominator+' тең бөлік. '+p.target+' нүктесі 0-ден солға '+Math.abs(tick(p,p.target))+' кіші аралықта жатыр. Координатасы '+vstr(p,p.target)+(p.denominator===2?' = '+answer:'')+'.';break;
 case 'opposite-number':s=p.target+'('+vstr(p,p.target)+'). Қарама-қарсы санның модулі бірдей, таңбасы кері: '+answer+'.';break;
 case 'unit-length':s=p.first+'('+vstr(p,p.first)+'), '+p.second+'('+vstr(p,p.second)+'). Санақ басына дейін '+Math.abs(tick(p,p.first))+' және одан кейін '+Math.abs(tick(p,p.second))+' бірлік: '+Math.abs(tick(p,p.first))+' + '+Math.abs(tick(p,p.second))+' = '+answer+'. Ұштарын қоса сызықша санасақ, біреуі артық болады.';break;
 case 'opposite-pair':s=p.points.map(r=>r.label+'('+fstr(r.tick,p.denominator)+')').join(', ')+'. Қосындысы нөл болатын жалғыз жұп — '+answer+'. Олардың 0-ден қашықтықтары тең.';break;
 case 'minor-gap-count':s='Бірлік '+p.denominator+' тең кіші бөлікке бөлінген. '+p.first+' нүктесіне дейін солға '+Math.abs(tick(p,p.first))+' бөлік, '+p.second+' нүктесіне дейін оңға '+tick(p,p.second)+' бөлік бар. Барлығы '+Math.abs(tick(p,p.first))+' + '+tick(p,p.second)+' = '+answer+' кіші аралық. Толық бірлікпен қашықтық '+answer+'/'+p.denominator+' болады.';break;
 case 'two-label-calibration':{const [a,b]=p.calibration,gaps=(tick(p,b.label)-tick(p,a.label))/p.tickEvery,step=(b.value-a.value)/gaps,targetGaps=(tick(p,p.target)-tick(p,b.label))/p.tickEvery;s=a.label+'('+a.value+'), '+b.label+'('+b.value+'); олардың арасында '+gaps+' бірдей аралық бар. Бір аралық: ('+b.value+' − ('+a.value+')) : '+gaps+' = '+step+'. '+p.target+' нүктесі '+b.label+'-дан оңға '+targetGaps+' аралықта: '+b.value+' + '+targetGaps+' · '+step+' = '+answer+'.';break;}
 case 'thermo-absolute':s='Термометрдегі кіші бөлік '+p.step+' °C. Бағана '+p.reading+' °C-қа жеткен. Теріс температураның модулі — оның 0-ден қашықтығы: |'+p.reading+'| = '+answer+'.';break;
 case 'mixed-absolute':s='Модуль ішіндегі сан толықтай теріс: -'+mixed(p)+'. Оның модулі бүтін бөлігі мен бөлшек бөлігін өзгертпей, оң сан береді: '+mixed(p)+'. Бұл '+(p.whole*p.denominator+p.numerator)+'/'+p.denominator+' санына тең.';break;
 case 'bracket-negative':s=p.target+' нүктесі 0-ден '+p.bracket+' бірлік қашықтықта, сол жақта жатыр. Сондықтан модулі '+p.bracket+', ал координатасы '+answer+'.';break;
 case 'coordinate-absolute':s=p.target+'('+vstr(p,p.target)+'). Модуль — санақ басынан қашықтық: |'+vstr(p,p.target)+'| = '+answer+'.';break;
 case 'opposite-absolutes-sum':s=p.first+'('+vstr(p,p.first)+'), '+p.second+'('+vstr(p,p.second)+'). Олардың модульдері '+fstr(Math.abs(tick(p,p.first)),p.denominator)+' және '+fstr(Math.abs(tick(p,p.second)),p.denominator)+'. Қосындысы '+answer+'. Координаталардың өздерін қоссақ нөл болады, бірақ модульдер қосылады.';break;
 case 'greatest-absolute':s=p.points.map(r=>r.label+': |'+fstr(r.tick,p.denominator)+'| = '+fstr(Math.abs(r.tick),p.denominator)).join('; ')+'. Ең алыс нүкте — '+answer+'.';break;
 default:throw Error('Unknown solution form');
 }
 return s+'\nЖауап: '+answer+'.';
}
export function descriptionFor(q){
 const p=q.params;let s=statementFor(q)+' ';
 if(p.scene==='axis')s+='Нүктелер: '+p.points.map(r=>(p.hiddenLabels||[]).includes(r.label)?r.label+' — белгісіз координата':r.label+'('+fstr(r.tick,p.denominator)+')').join(', ')+'. '+(p.jumpCount?p.jumpCount+' бірдей солға бағытталған доға. ':'')+(p.bracket?'0-ден '+p.target+'-ге дейінгі қашықтық '+p.bracket+'. ':'');
 if(p.bracket)s+=p.target+' санақ басының сол жағында. ';
 if(p.calibration){const [a,b]=p.calibration;s+=a.label+' мен '+b.label+' арасында '+((tick(p,b.label)-tick(p,a.label))/p.tickEvery)+' тең аралық; '+p.target+' нүктесі '+b.label+' нүктесінен оңға '+((tick(p,p.target)-tick(p,b.label))/p.tickEvery)+' сондай аралықта. ';}
 if(p.scene==='thermo')s+='Берілген температура '+p.reading+' °C; кіші бөлік '+p.step+' °C. ';
 if(p.scene==='grid')s+=p.rows+' жол және '+p.cols+' баған шаршы. ';
 if(p.scene==='cards')s+='Карточкалардағы сандар: '+p.values.join(', ')+'. ';
 if(p.scene==='division')s+='Берілген бөлу '+p.numerator+' : '+p.denominator+'. Қадамдар [қалдық; цифр; жаңа қалдық]: '+p.trace.map(t=>t.join('; ')).join(' | ')+'. ';
 if(p.scene==='sectors')s+='Тең секторлар саны '+p.parts+', көк секторлар саны '+p.colored+'. ';
 if(p.scene==='mixed')s+='Модуль ішіндегі берілген сан -'+mixed(p)+'. ';
 return s;
}
export function svgFor(q){
 const p=validate(q),scene=p.scene,base=scene==='axis'?(p.jumpCount?155:95):0,height=scene==='axis'?(p.jumpCount?230:p.bracket?190:165):scene==='division'?(p.trace.length>3?360:245):scene==='cards'||scene==='mixed'?220:scene==='grid'?300:360;
 const n=x=>Number(x.toFixed(3)),text=(x,y,v,size=22,color='#345076')=>'<text x="'+n(x)+'" y="'+n(y)+'" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="'+size+'" fill="'+color+'" stroke="white" stroke-width="2.8" paint-order="stroke" stroke-linejoin="round">'+esc(v)+'</text>';
 const line=(x,y,a,b,attrs='')=>'<line x1="'+n(x)+'" y1="'+n(y)+'" x2="'+n(a)+'" y2="'+n(b)+'" '+attrs+'/>';
 let art='';
 if(scene==='axis'){
  const at=t=>48+384*(t-p.minTick)/(p.maxTick-p.minTick);
  art+=line(35,base,447,base,'stroke="#456487" stroke-width="2" marker-end="url(#tip)"');
  if(!p.hideTicks)for(let i=p.minTick;i<=p.maxTick;i++)if(i%p.tickEvery===0){const major=i%p.denominator===0;art+=line(at(i),base-(major?6:4),at(i),base+(major?6:4),'stroke="#6a88ac" stroke-width="'+(major?1.5:1)+'" data-scale-tick="'+i+'"');}
  for(const i of p.labels)art+=text(at(i),base+26,fstr(i,p.denominator),20);
  for(const r of p.points)art+='<circle cx="'+n(at(r.tick))+'" cy="'+base+'" r="4.3" fill="#6651c7" data-point="'+r.label+'" data-numerator="'+r.tick+'" data-denominator="'+p.denominator+'"/>'+text(at(r.tick),base-25,r.label,23,'#4e42b8');
  if(p.jumpCount)for(let i=0;i<p.jumpCount;i++){const a=p.jumpStart+mul(p.delta,i),b=a+p.delta,m=(at(a)+at(b))/2,h=45;art+='<path d="M'+n(at(a))+','+base+' Q'+n(m)+','+(base-2*h)+' '+n(at(b))+','+base+'" fill="none" stroke="#7862d7" stroke-width="2.5" marker-end="url(#tip)" data-jump-from="'+a+'" data-jump-to="'+b+'"/>';}
  if(p.bracket){const a=at(tick(p,p.target)),b=at(0);art+=line(a,base+56,b,base+56,'stroke="#5d83b0" stroke-width="1.5"')+line(a,base+50,a,base+62,'stroke="#5d83b0"')+line(b,base+50,b,base+62,'stroke="#5d83b0"')+text((a+b)/2,base+42,p.bracket+' бірлік',20);}
 }else if(scene==='thermo'){
  const x=256,bottom=278,top=40,at=v=>bottom-(v-p.min)*238/(p.max-p.min),count=(p.max-p.min)/p.step;
  art+='<rect x="'+(x-8)+'" y="'+top+'" width="16" height="'+(bottom-top)+'" rx="8" fill="#edf3ff" stroke="#6683a6" stroke-width="1.4"/>';
  for(let i=0;i<=count;i++){const v=p.min+i*p.step,y=at(v),major=i%p.labelEvery===0;art+=line(x-14,y,x+13,y,'stroke="#7189a6" stroke-width="'+(major?1.5:.9)+'"');if(major)art+=text(x-40,y,fmt(v),20);}
  art+='<rect x="'+(x-5)+'" y="'+n(at(p.reading))+'" width="10" height="'+n(bottom-at(p.reading))+'" rx="4" fill="#de6880" data-reading="'+p.reading+'"/><circle cx="'+x+'" cy="292" r="14" fill="#de6880" stroke="#9f5970" stroke-width="1.2"/>'+text(x,333,'Температура, °C',20);
 }else if(scene==='grid'){
  const size=Math.min(43,330/p.cols,210/p.rows),left=(480-p.cols*size)/2,top=(300-p.rows*size)/2;
  for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++)art+='<rect x="'+n(left+c*size)+'" y="'+n(top+r*size)+'" width="'+n(size)+'" height="'+n(size)+'" fill="'+((r+c)%2?'#d9e7ff':'#c9dafb')+'" stroke="white" stroke-width="3" data-cell="'+r+':'+c+'"/>';
 }else if(scene==='cards'){
  const step=410/p.values.length,w=Math.min(100,step-12),left=(480-step*p.values.length)/2;
  p.values.forEach((v,i)=>{const x=left+i*step+(step-w)/2;art+='<rect x="'+n(x)+'" y="64" width="'+n(w)+'" height="92" rx="14" fill="'+(v<0?'#fff0e9':'#e7edff')+'" stroke="'+(v<0?'#dba88c':'#8ba1d9')+'" stroke-width="1.5"/>'+text(x+w/2,110,v,32,v<0?'#a9543d':'#4a59af');});
 }else if(scene==='division'){
  art+=text(240,30,p.numerator+' : '+p.denominator,28,'#263f65');const x=[100,240,380],headers=['Қалдық','Цифр','Келесі қалдық'];headers.forEach((v,i)=>art+=text(x[i],72,v,19));
  art+=line(37,89,443,89,'stroke="#a3b8d8"');
  p.trace.forEach((t,r)=>{const y=113+r*32;t.forEach((v,c)=>art+=text(x[c],y,v,23,c===2&&r===p.trace.length-1?'#c34e6b':'#335a86'));art+=line(45,y+17,435,y+17,'stroke="#e1eaf8"');});
  art+=text(240,height-30,'Бастапқы қалдық қайта пайда болды',19,'#a74d69');
 }else if(scene==='sectors'){
  const cx=240,cy=175,r=125;
  for(let i=0;i<p.parts;i++){const a=-Math.PI/2+i*2*Math.PI/p.parts,b=a+2*Math.PI/p.parts,pt=t=>[cx+r*Math.cos(t),cy+r*Math.sin(t)].map(n).join(',');art+='<path d="M'+cx+','+cy+' L'+pt(a)+' A'+r+','+r+' 0 0,1 '+pt(b)+' Z" fill="'+(i<p.colored?'#779ee7':'#fff2db')+'" stroke="white" stroke-width="2.6" data-sector="'+i+'" data-colored="'+(i<p.colored)+'"/>';}
  art+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#6582ae" stroke-width="1.7"/>';
 }else if(scene==='mixed'){
  art+=line(125,55,125,163,'stroke="#4e62a0" stroke-width="3"')+line(355,55,355,163,'stroke="#4e62a0" stroke-width="3"')+text(164,110,'−',44)+text(210,110,p.whole,47)+text(280,84,p.numerator,31)+line(251,109,309,109,'stroke="#345076" stroke-width="2.5"')+text(280,136,p.denominator,31);
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="'+height+'" viewBox="0 0 480 '+height+'" role="img" aria-labelledby="title desc"><title id="title">'+esc(q.figureTitle)+'</title><desc id="desc">'+esc(q.figureDescription)+'</desc><defs><marker id="tip" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7Z" fill="#6778ae"/></marker></defs><rect width="480" height="'+height+'" fill="white"/>'+art+'</svg>\n';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(q.answer,r.answer,'Independent rational-model answer');
 assert.equal(q.statement,statementFor(q),'Exact source-specific condition');assert.equal(q.solution,solutionFor(q),'Exact source-specific worked solution');assert.equal(q.figureDescription,descriptionFor(q),'Accessible description matches givens');assert.equal(q.image,'/figures/synaq-editions/'+q.editionId+'.svg');assert.equal(q.figureSha256,sha(svgFor(q)),'Exact native SVG digest');
 if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(o=>o===q.answer).length,1);}
 return {...r,checks:[...r.checks,'Native SVG, given data, solution, accessible description and canonical answer are exactly bound']};
}
