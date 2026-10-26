import assert from 'node:assert/strict';

// Reduced fractions throughout: percent bases, mixed masses and decimal inputs
// must never be rounded before the requested final rounding operation.
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const Q=(n,d=1)=>{assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d!==0);if(d<0){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];};
const asQ=a=>Array.isArray(a)?Q(...a):Q(a);
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const sub=(a,b)=>add(a,[-b[0],b[1]]);
const mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>{assert.notEqual(b[0],0);return Q(a[0]*b[1],a[1]*b[0]);};
const cmp=(a,b)=>a[0]*b[1]-b[0]*a[1];
const sum=a=>a.reduce((s,n)=>s+n,0);
const positive=(...a)=>a.forEach(n=>assert.ok(Number.isSafeInteger(n)&&n>0));
const natural=q=>{assert.equal(q[1],1,'A person/item count must be integral');return q[0];};
const rate=(part,whole)=>mul(div(asQ(part),asQ(whole)),Q(100));
const portion=(whole,percent)=>mul(asQ(whole),Q(percent,100));
const decimal=q=>{
 q=asQ(q);let[n,d]=q;const sign=n<0?'−':'';n=Math.abs(n);let s=sign+Math.floor(n/d),r=n%d;
 if(!r)return s;s+=',';for(let i=0;i<15&&r;i++){r*=10;s+=Math.floor(r/d);r%=d;}
 assert.equal(r,0,'A nonterminating percent requires an exact fraction choice');return s;
};
const exact=q=>{q=asQ(q);try{return decimal(q);}catch{return `(${q[0]}/${q[1]})`;}};
const fraction=q=>`${q[0]}/${q[1]}`;
const pct=q=>`${exact(q)}%`;
const choice=(value,options,statement,solution)=>({answer:value,options,statement,solution});
const result=(p,value,statement,solution)=>p.choices?
 choice(pct(value),p.choices.map(q=>pct(asQ(q))),statement,solution):
 {answer:decimal(value),statement,solution};
const partSolution=(part,whole,a)=>`Салыстыру негізі — ${exact(whole)}. Ізделген процент: ${exact(part)} : ${exact(whole)} · 100 = ${exact(a)}. Жауабы: ${pct(a)}.`;
const validRate=p=>assert.ok(Number.isInteger(p)&&p>0&&p<100);

function authored(row){
 const p=row.params,model=row.modelId.replace('grade6-percent-','');
 switch(model){
 case'direct-part':{
  positive(p.part,p.whole);const a=rate(p.part,p.whole);let statement;
  if(p.context==='improper'){assert.ok(p.part>p.whole);statement=`${p.part} санын ${p.whole} санымен салыстырғанда ол неше процент болады?`;}
  else {assert.ok(p.part<p.whole);const prompts={
   beans:`Тәжірибе үшін ${p.whole} бұршақ тұқымын екті. Оның ${p.part}-і өніп шықты. Өнген тұқымдар егілген тұқымдардың неше проценті?`,
   seedlings:`Көгалдандыру тобы ${p.whole} көшет отырғызды. Біраз уақыттан кейін ${p.part} көшеттің жерсінгені анықталды. Көшеттердің неше проценті жерсінді?`,
   'ordered-numbers':`${p.part} саны ${p.whole} санының неше процентін құрайды?`,
   numeric:`Бірінші мөлшер ${p.part}, салыстыруға алынған екінші мөлшер ${p.whole}. Бірінші мөлшер екіншінің неше проценті?`,
   theatre:`${p.whole} орындық залға ${p.part} көрермен келіп, әрқайсысы бір орынға отырды. Орындардың неше проценті бос емес?`,
   spending:`Меруерттің ${p.whole} теңгесі болды. Ол сурет салуға керек қағазға ${p.part} теңге жұмсады. Бастапқы ақшасының неше процентін жұмсады?`,
   club:`Шеберханадағы ${p.whole} оқушының ${p.part}-і модель жасау үйірмесіне жазылды. Олар барлық оқушының неше процентін құрайды?`,
   salt:`Массасы ${p.whole} г тұзды ерітіндінің құрамында ${p.part} г тұз бар. Ерітіндінің неше проценті тұз?`,
  };statement=prompts[p.context];assert.ok(statement,'Unknown direct-part context');}
  return result(p,a,statement,partSolution(p.part,p.whole,a));}
 case'fraction-percent':{
  positive(p.numerator,p.denominator);assert.ok(p.numerator<p.denominator);const a=rate(p.numerator,p.denominator);
  return result(p,a,`${p.numerator}/${p.denominator} қатынасын процентпен көрсететін нұсқаны таңдаңдар.`,`${p.numerator}/${p.denominator} = ${exact(Q(p.numerator,p.denominator))}. Процент алу үшін 100-ге көбейтеміз: ${p.numerator} · 100 : ${p.denominator} = ${exact(a)}, яғни ${pct(a)}.`);}
 case'minutes-hour':{
  positive(p.minutes);assert.ok(p.minutes<60);const a=rate(p.minutes,60);
  return result(p,a,`Баланың оқу таймері ${p.minutes} минут жұмыс істеді. Бұл бір сағаттың неше проценті?`,`Бір сағатта 60 минут бар. Бірдей бірліктерді салыстырамыз: ${p.minutes} : 60 · 100 = ${exact(a)}. Демек, ${pct(a)}.`);}
 case'decimal-ratio':{
  positive(p.partTenths,p.whole);const part=Q(p.partTenths,10),a=rate(part,p.whole);assert.ok(cmp(part,Q(p.whole))<0);
  return result(p,a,`${decimal(part)} саны ${p.whole} санының неше проценті?`,`${decimal(part)} : ${p.whole} = ${decimal(div(part,Q(p.whole)))}. Бұл қатынасты 100-ге көбейтсек, ${pct(a)} шығады.`);}
 case'general-formula':{
  const a='(m/n) · 100%';return choice(a,[a,'(n/m) · 100%','(m/n)%','(m + n) · 100%'],`m және n — кез келген оң сандар. m шамасының n шамасына шаққандағы процентін қай формула әрқашан дұрыс береді?`,`Алдымен сұралған m шамасын салыстыру негізі n-ге бөлеміз. Бірліктің 1/100 бөлігі бір процент болғандықтан, қатынасты 100-ге көбейтеміз: (m/n) · 100%. Бөлімдегі сан — n.`);}
 case'grams-kilograms':{
  positive(p.grams,p.kilograms);const whole=p.kilograms*1000;assert.ok(p.grams<whole);const a=rate(p.grams,whole);
  return result(p,a,`${p.grams} г салмақ ${p.kilograms} кг салмақтың неше процентін құрайды?`,`${p.kilograms} кг = ${whole} г. Енді бірдей бірліктермен есептейміз: ${p.grams} : ${whole} · 100 = ${exact(a)}. Жауабы: ${pct(a)}.`);}
 case'hundred-percent':{
  return choice('u = v',['u > v','u < v','u = v','u = 100v'],`u және v — оң сандар. u шамасы v шамасының дәл 100%-ына тең екені белгілі. Қандай қорытынды дұрыс?`,`100% = 1, сондықтан u = 1 · v = v. Екі шама тең.`);}
 case'decimal-length':{
  positive(p.whole,p.partTenths);const part=Q(p.partTenths,10),a=rate(part,p.whole);assert.ok(cmp(part,Q(p.whole))<0&&part[1]>1);
  return result(p,a,`${p.whole} м баудан ${decimal(part)} м бөлік қиып алынды. Қиылған бөлік бастапқы ұзындықтың неше проценті?`,partSolution(part,p.whole,a));}
 case'price-discount':case'price-growth':case'savings-growth':{
  positive(p.before,p.after);const discount=model==='price-discount';assert.ok(discount?p.after<p.before:p.after>p.before);
  const change=Math.abs(p.after-p.before),a=rate(change,p.before);let statement;
  if(discount)statement=`Үстел шамының бағасы ${p.before} теңгеден ${p.after} теңгеге түсті. Жеңілдік бастапқы бағаның неше процентіне тең?`;
  else if(model==='price-growth')statement=`Бір қап қоректік қоспа бұрын ${p.before} теңге тұрды, кейін бағасы ${p.after} теңге болды. Баға неше процентке өсті?`;
  else statement=`Жинақ шотындағы ${p.before} теңге бір жылда ${p.after} теңгеге жетті. Шот иесі сырттан ақша салмады және шоттан ақша алмады. Бір жылдық өсім бастапқы соманың неше проценті?`;
  return result(p,a,statement,`Өзгеріс ${Math.max(p.before,p.after)} − ${Math.min(p.before,p.after)} = ${change} теңге. Проценттің негізі — бастапқы ${p.before} теңге: ${change} : ${p.before} · 100 = ${exact(a)}. ${discount?'Жеңілдік':'Өсім'} ${pct(a)}.`);}
 case'inverse-decimal':{
  validRate(p.hundredths);const r=Q(p.hundredths,100),a=rate(1,r);
  return result(p,a,`x/y = ${decimal(r)}, мұндағы x пен y оң сандар. y шамасы x шамасының неше проценті?`,`Кері қатынас y/x = 1 : ${decimal(r)} = ${decimal(div(Q(1),r))}. Процентпен: ${exact(div(Q(1),r))} · 100 = ${exact(a)}, яғни ${pct(a)}. Берілген қатынасты кері айналдыру қажет.`);}
 case'ratio-share':{
  assert.ok(p.weights.length===2||p.weights.length===3);positive(...p.weights);assert.ok(p.target>=0&&p.target<p.weights.length);const total=sum(p.weights),a=rate(p.weights[p.target],total);let statement;
  if(p.context==='boys'){assert.equal(p.target,0);assert.equal(p.weights.length,2);statement=`Сыныптағы ұлдар санының қыздар санына қатынасы ${p.weights.join(' : ')}. Ұлдар бүкіл сыныптың неше процентін құрайды?`;}
  else {assert.equal(p.context,'fruit');assert.equal(p.weights.length,3);assert.equal(p.target,1);statement=`Жәшіктегі шабдалы, алмұрт және өрік сандары осы ретпен ${p.weights.join(' : ')} қатынасында. Алмұрт барлық жемістің неше проценті?`;}
  return result(p,a,statement,`Барлық үлес саны ${p.weights.join(' + ')} = ${total}. Сұралған бөлік ${p.weights[p.target]} үлес, сондықтан ${p.weights[p.target]} : ${total} · 100 = ${exact(a)}. Жауабы ${pct(a)}. Бөлімге бір ғана басқа бөлікті емес, барлық үлесті қоямыз.`);}
 case'paired-defects':{
  positive(...p.totals,...p.defects);assert.equal(p.totals.length,2);assert.equal(p.defects.length,2);assert.notEqual(p.totals[0],p.totals[1]);p.defects.forEach((n,i)=>assert.ok(n<p.totals[i]));
  const a=p.defects.map((n,i)=>rate(n,p.totals[i]));assert.notEqual(cmp(a[0],a[1]),0);const pair=a=>`I: ${pct(a[0])}; II: ${pct(a[1])}`;
  const answer=pair(a),options=[answer,pair([...a].reverse()),pair(p.defects.map(asQ)),pair(a.map(q=>div(q,Q(100))))];
  return choice(answer,options,`I шеберханада жасалған ${p.totals[0]} бұйымның ${p.defects[0]} данасы, II шеберханада жасалған ${p.totals[1]} бұйымның ${p.defects[1]} данасы тексеруден өтпеді. Әр шеберханадағы ақаулы бұйым процентін I, II ретімен көрсететін толық нұсқаны таңдаңдар.`,`I үшін ${p.defects[0]} : ${p.totals[0]} · 100 = ${exact(a[0])}; II үшін ${p.defects[1]} : ${p.totals[1]} · 100 = ${exact(a[1])}. Тиісті жауап: ${answer}. Жалпы өндіріс көлемдері әртүрлі болғандықтан, ақау сандарын ғана салыстыру жеткіліксіз.`);}
 case'less-than':case'greater-than':{
  positive(p.small,p.large);assert.ok(p.small<p.large);const less=model==='less-than',base=less?p.large:p.small,gap=p.large-p.small,a=rate(gap,base);
  const statement=less?`Бірінші қоймада ${p.small}, екінші қоймада ${p.large} қорап бар. Бірінші қоймадағы қорап саны екіншіден неше процентке кем?`:`Бірінші қоймада ${p.large}, екінші қоймада ${p.small} қорап бар. Бірінші қоймадағы қорап саны екіншіден неше процентке артық?`;
  return result(p,a,statement,`Айырмасы ${p.large} − ${p.small} = ${gap} қорап. Салыстыру негізі — екінші қоймадағы ${base} қорап. ${gap} : ${base} · 100 = ${exact(a)}. Біріншісі ${pct(a)} ${less?'кем':'артық'}.`);}
 case'correct-complement':{
  positive(p.total,p.wrong);assert.ok(p.wrong<p.total);const correct=p.total-p.wrong,a=rate(correct,p.total);
  return result(p,a,`Жаттығу тестінде ${p.total} сұрақ болды. Айбар ${p.wrong} сұраққа қате, қалғанының бәріне дұрыс жауап берді. Дұрыс жауаптар барлық сұрақтың неше проценті?`,`Дұрыс жауап саны ${p.total} − ${p.wrong} = ${correct}. Қате жауап үлесін емес, дұрыс жауап үлесін есептейміз: ${correct} : ${p.total} · 100 = ${exact(a)}, яғни ${pct(a)}.`);}
 case'travel-share':{
  positive(p.distance,p.speed,p.hours);const travelled=p.speed*p.hours;assert.ok(travelled<p.distance);const a=rate(travelled,p.distance);
  return result(p,a,`Бағыттың толық ұзындығы ${p.distance} км. Көлік алғашқы ${p.hours} сағатта тұрақты ${p.speed} км/сағ жылдамдықпен жүрді. Осы уақытта бүкіл жолдың неше процентін өтті?`,`Өткен жол: ${p.speed} · ${p.hours} = ${travelled} км. Бұл бүкіл ${p.distance} км жолдың ${travelled} : ${p.distance} · 100 = ${exact(a)} проценті. Жауабы ${pct(a)}.`);}
 case'area-share':{
  assert.equal(p.rectangle.length,2);positive(...p.rectangle,p.side);const rectangle=p.rectangle[0]*p.rectangle[1],square=p.side*p.side;assert.ok(square<rectangle);const a=rate(square,rectangle);
  return result(p,a,`Тік төртбұрыштың қабырғалары ${p.rectangle[0]} см және ${p.rectangle[1]} см. Екінші фигура — қабырғасы ${p.side} см шаршы. Шаршының ауданы тік төртбұрыш ауданының неше проценті?`,`Тік төртбұрыш ауданы ${p.rectangle[0]} · ${p.rectangle[1]} = ${rectangle} см², шаршы ауданы ${p.side} · ${p.side} = ${square} см². Аудандарды салыстырамыз: ${square} : ${rectangle} · 100 = ${exact(a)}. Жауабы ${pct(a)}; қабырғаларды тікелей салыстыруға болмайды.`);}
 case'combine-salt-water':{
  positive(p.water,p.salt);const total=p.water+p.salt,a=rate(p.salt,total);
  return result(p,a,`${p.water} г суға ${p.salt} г тұз толық ерітілді. Зат жоғалған жоқ. Дайын ерітіндінің неше проценті тұз?`,`Ерітіндінің жалпы массасы ${p.water} + ${p.salt} = ${total} г. Тұз үлесі ${p.salt} : ${total} · 100 = ${exact(a)}, яғни ${pct(a)}. Салыстыру негізі тек су массасы емес, дайын ерітінді массасы.`);}
 case'salt-complement':{
  positive(p.solution,p.water);assert.ok(p.water<p.solution);const salt=p.solution-p.water,a=rate(salt,p.solution);
  return result(p,a,`Тұз бен судан ғана тұратын ${p.solution} г ерітіндіде ${p.water} г су бар. Ерітінді құрамындағы тұздың процентін табыңдар.`,`Тұз массасы ${p.solution} − ${p.water} = ${salt} г. ${salt} : ${p.solution} · 100 = ${exact(a)}, сондықтан ерітіндідегі тұз ${pct(a)}.`);}
 case'third-category':{
  positive(p.total,p.first,p.second);const last=p.total-p.first-p.second;assert.ok(last>0);const a=rate(last,p.total);
  return result(p,a,`${p.total} оқушының әрқайсысы тек бір спорт үйірмесін таңдады. ${p.first}-і жүзуді, ${p.second}-і волейболды, қалғандары үстел теннисін таңдады. Үстел теннисін таңдағандар барлық оқушының неше проценті?`,`Топтар қиылыспайды. Үстел теннисін таңдағандар ${p.total} − ${p.first} − ${p.second} = ${last}. Олардың үлесі ${last} : ${p.total} · 100 = ${exact(a)}, яғни ${pct(a)}.`);}
 case'drying-yield':{
  positive(p.fresh,p.dried);assert.ok(p.dried<p.fresh);const a=rate(p.dried,p.fresh);
  return result(p,a,`${p.fresh} кг жаңа өрікті кептіргенде ${p.dried} кг қақ алынды. Дайын қақ бастапқы жеміс массасының неше процентін құрайды?`,`${p.dried} : ${p.fresh} · 100 = ${exact(a)}. Дайын өнімнің шығымы ${pct(a)}. Сұрақ жоғалған масса туралы емес.`);}
 case'over-plan':{
  positive(p.planned,p.actual);assert.ok(p.actual>p.planned);const extra=p.actual-p.planned,a=rate(extra,p.planned);
  return result(p,a,`Шеберхана айына ${p.planned} қобдиша жасауды жоспарлап, ${p.actual} қобдиша жасады. Жоспар неше процентке артық орындалды?`,`Жоспардан артық жасалғаны ${p.actual} − ${p.planned} = ${extra}. Артық орындалу проценті ${extra} : ${p.planned} · 100 = ${exact(a)}. Жауабы ${pct(a)}; барлық жасалған өнімнің проценті сұралған жоқ.`);}
 case'weighted-concentration':{
  assert.equal(p.masses.length,2);assert.equal(p.rates.length,2);positive(...p.masses);p.rates.forEach(validRate);assert.notEqual(p.masses[0],p.masses[1]);assert.notEqual(p.rates[0],p.rates[1]);
  const amounts=p.masses.map((m,i)=>portion(m,p.rates[i])),component=add(...amounts),mass=sum(p.masses),a=rate(component,mass),cream=p.context==='cream';assert.ok(cream||p.context==='solutions');
  const statement=cream?`Майлылығы ${p.rates[0]}% болатын ${p.masses[0]} кг қаймақты майлылығы ${p.rates[1]}% болатын ${p.masses[1]} кг қаймақпен араластырды. Масса жоғалған жоқ. Қоспаның майлылығы неше процент?`:`Қант мөлшері ${p.rates[0]}% болатын ${p.masses[0]} г ерітіндіге қанты ${p.rates[1]}% болатын ${p.masses[1]} г ерітінді қосылды. Масса жоғалған жоқ. Дайын қоспаның қант проценті қандай?`;
  const unit=cream?'кг':'г';return result(p,a,statement,`Бірінші бөліктегі ${cream?'май':'қант'} ${p.masses[0]} · ${p.rates[0]} : 100 = ${decimal(amounts[0])} ${unit}; екіншісінде ${p.masses[1]} · ${p.rates[1]} : 100 = ${decimal(amounts[1])} ${unit}. Барлығы ${decimal(component)} ${unit}, жалпы масса ${mass} ${unit}. ${decimal(component)} : ${mass} · 100 = ${exact(a)}, яғни ${pct(a)}. Массалар тең емес, сондықтан екі проценттің жай арифметикалық ортасы жарамайды.`);}
 case'nested-attendance':{
  [p.groupPercent,p.firstRate,p.secondRate].forEach(validRate);const first=portion(p.groupPercent,p.firstRate),second=portion(100-p.groupPercent,p.secondRate),both=add(first,second),a=rate(first,both);
  return result(p,a,`Сыныптың ${p.groupPercent}%-ы қыздар. Қыздардың ${p.firstRate}%-ы және ұлдардың ${p.secondRate}%-ы ғылыми жобаға қатысты. Қатысушылардың неше проценті қыздар?`,`Бүкіл сыныпты 100 шартты үлес деп аламыз. Қыздардан қатысқаны ${p.groupPercent} · ${p.firstRate} : 100 = ${decimal(first)} үлес. Ұлдардан қатысқаны ${100-p.groupPercent} · ${p.secondRate} : 100 = ${decimal(second)} үлес. Барлық қатысушы ${decimal(both)} үлес. Солардың ішіндегі қыздар проценті ${decimal(first)} : ${decimal(both)} · 100 = ${exact(a)}. Жауабы ${pct(a)}. Соңғы салыстыру негізі — қатысушылар ғана.`);}
 case'square-growth':{
  positive(p.before,p.after);assert.ok(p.after>p.before);const before=p.before**2,after=p.after**2,a=rate(after-before,before);
  return result(p,a,`Шаршы үлгінің қабырғасы ${p.before} см-ден ${p.after} см-ге дейін ұзартылды. Оның ауданы бастапқы ауданнан неше процентке өсті?`,`Бастапқы аудан ${p.before}² = ${before} см², кейінгі аудан ${p.after}² = ${after} см². Аудан өсімі ${after} − ${before} = ${after-before} см². ${after-before} : ${before} · 100 = ${exact(a)}. Аудан ${pct(a)} өсті; қабырға өсімін екі еселеу дұрыс емес.`);}
 case'return-price':{
  positive(p.initial,p.peak);assert.ok(p.peak>p.initial);const drop=p.peak-p.initial,a=rate(drop,p.peak);
  return result(p,a,`Жиынтықтың бағасы алдымен ${p.initial} теңгеден ${p.peak} теңгеге көтерілді. Кейін баға қайтадан ${p.initial} теңге болды. Соңғы арзандау неше процент?`,`Соңғы арзандаудың негізі — ${p.peak} теңге. Түскен сома ${p.peak} − ${p.initial} = ${drop} теңге. ${drop} : ${p.peak} · 100 = ${exact(a)}, яғни ${pct(a)}. Алғашқы қымбаттау процентін қолдануға болмайды, өйткені оның негізі басқа.`);}
 case'dilution':{
  positive(p.mass,p.water);validRate(p.rate);const sugar=portion(p.mass,p.rate),total=p.mass+p.water,a=rate(sugar,total);
  return result(p,a,`Құрамында ${p.rate}% қант бар ${p.mass} г шәрбатқа ${p.water} г таза су қосылды. Булану болған жоқ. Дайын сусынның неше проценті қант?`,`Қант массасы өзгермейді: ${p.mass} · ${p.rate} : 100 = ${decimal(sugar)} г. Жаңа масса ${p.mass} + ${p.water} = ${total} г. Қанттың жаңа үлесі ${decimal(sugar)} : ${total} · 100 = ${exact(a)}, яғни ${pct(a)}.`);}
 case'third-class':{
  assert.equal(p.sizes.length,3);positive(...p.sizes,p.first,p.second);validRate(p.allRate);const total=sum(p.sizes),attend=natural(portion(total,p.allRate)),third=attend-p.first-p.second;
  assert.ok(p.first<=p.sizes[0]&&p.second<=p.sizes[1]&&third>0&&third<=p.sizes[2]);const a=rate(third,p.sizes[2]);assert.notEqual(cmp(a,Q(p.allRate)),0,'Do not make the local answer accidentally equal the global rate');
  return result(p,a,`Үш алтыншы сыныпта тиісінше ${p.sizes.join(', ')} оқушы бар. Осы үш сыныптағы барлық оқушының ${p.allRate}%-ы ғылыми көрмеге қатысты. Бірінші сыныптан ${p.first}, екіншісінен ${p.second} оқушы келді. Үшінші сыныптың неше проценті көрмеге қатысты?`,`Барлық оқушы ${p.sizes.join(' + ')} = ${total}. Қатысушылар ${total} · ${p.allRate} : 100 = ${attend}. Үшінші сыныптан ${attend} − ${p.first} − ${p.second} = ${third} оқушы қатысты. Соңғы негіз — үшінші сыныптағы ${p.sizes[2]} оқушы: ${third} : ${p.sizes[2]} · 100 = ${exact(a)}, яғни ${pct(a)}.`);}
 case'compound-growth':{
  assert.equal(p.values.length,3);positive(...p.values);const[b,m,e]=p.values;assert.ok(b<m&&m<e);assert.equal(cmp(Q(m,b),Q(e,m)),0,'The two annual growth multipliers must agree');const a=rate(e-b,b);
  return result(p,a,`${b} теңгелік жинақ бір жылдан кейін ${m} теңге, екінші жылдан кейін ${e} теңге болды. Шот иесі ақша алмады және сырттан ақша салмады; екі жылдағы жылдық өсім мөлшерлемесі бірдей. Бастапқы сомамен салыстырғанда екі жылдық жалпы өсім неше процент?`,`Жалпы өсім ${e} − ${b} = ${e-b} теңге. Бастапқы негіз бойынша ${e-b} : ${b} · 100 = ${exact(a)}. Жауабы ${pct(a)}. Әр жылғы өсім ${pct(rate(m-b,b))}, бірақ екінші жылы ол көбейген сомаға есептеледі; екі жылдық проценттерді жай қосуға болмайды.`);}
 case'inverse-percent':{
  positive(p.givenPercent);assert.ok(p.givenPercent>100);const a=Q(10000,p.givenPercent);
  return result(p,a,`r шамасы s шамасының ${p.givenPercent}%-ына тең, екеуі де оң. s шамасы r шамасының неше проценті?`,`r/s = ${decimal(Q(p.givenPercent,100))}. Кері қатынас s/r = 100/${p.givenPercent}. Оны процентке айналдырсақ, 100 · 100 : ${p.givenPercent} = ${exact(a)}. Жауабы ${pct(a)}.`);}
 case'chain-ratio':{
  assert.equal(p.hundredths.length,2);p.hundredths.forEach(validRate);const[a,b]=p.hundredths,r=Q(a*b,10000),answer=mul(r,Q(100));
  return result(p,answer,`a/b = ${decimal(Q(a,100))}, b/c = ${decimal(Q(b,100))}; a, b, c — оң сандар. a шамасы c шамасының неше процентін құрайды?`,`a/c = (a/b) · (b/c) = ${decimal(Q(a,100))} · ${decimal(Q(b,100))} = ${decimal(r)}. Демек, a шамасы c шамасының ${pct(answer)}-ын құрайды. Қатынастар қосылмайды, көбейтіледі.`);}
 case'class-changes':{
  positive(p.total,p.addedBoys,p.leftGirls);validRate(p.boyPercent);assert.notEqual(p.addedBoys,p.leftGirls);const boys=natural(portion(p.total,p.boyPercent)),girls=p.total-boys;assert.ok(p.leftGirls<girls);const newBoys=boys+p.addedBoys,newTotal=p.total+p.addedBoys-p.leftGirls,a=rate(newBoys,newTotal);
  return result(p,a,`Сыныпта ${p.total} оқушы болды, оның ${p.boyPercent}%-ы ұлдар. Кейін сыныпқа ${p.addedBoys} ұл қосылып, ${p.leftGirls} қыз басқа сыныпқа ауысты. Жаңа сынып құрамындағы ұлдардың процентін табыңдар.`,`Бастапқы ұлдар ${p.total} · ${p.boyPercent} : 100 = ${boys}. Жаңа ұлдар саны ${boys} + ${p.addedBoys} = ${newBoys}. Барлық оқушы да өзгереді: ${p.total} + ${p.addedBoys} − ${p.leftGirls} = ${newTotal}. Ізделген процент ${newBoys} : ${newTotal} · 100 = ${exact(a)}, яғни ${pct(a)}.`);}
 case'select-pair':{
  validRate(p.targetPercent);assert.equal(p.pairs.length,4);p.pairs.forEach(pair=>{assert.equal(pair.length,2);positive(...pair);});const selected=p.pairs.filter(([a,b])=>cmp(rate(a,b),Q(p.targetPercent))===0);assert.equal(selected.length,1);
  const pair=a=>`(${a.join('; ')})`,answer=pair(selected[0]);
  return choice(answer,p.pairs.map(pair),`Қай реттелген жұпта бірінші сан екінші санның ${p.targetPercent}%-ына тең?`,`Әр жұпта бірінші санды екіншіге бөліп, 100-ге көбейтеміз: ${p.pairs.map(([a,b])=>`${a} : ${b} · 100 = ${exact(rate(a,b))}`).join('; ')}. Шартты тек ${answer} қанағаттандырады. Жұптағы сандардың орнын ауыстыруға болмайды.`);}
 case'fraction-complement':{
  assert.equal(p.fractions.length,2);const f=p.fractions.map(asQ);f.forEach(q=>assert.ok(cmp(q,Q(0))>0&&cmp(q,Q(1))<0));const used=add(...f),left=sub(Q(1),used);assert.ok(left[0]>0);const a=mul(left,Q(100));
  const common=f[0][1]/gcd(f[0][1],f[1][1])*f[1][1];
  return result(p,a,`Қоймадағы ұнның ${fraction(f[0])} бөлігі тоқашқа, ал бастапқы ұнның ${fraction(f[1])} бөлігі нанға жұмсалды. Қалған ұн бастапқы ұнның неше проценті?`,`Екі бөлшек те бастапқы мөлшерден алынған. Ортақ бөлім ${common}: ${fraction(f[0])} + ${fraction(f[1])} = ${f[0][0]*common/f[0][1]}/${common} + ${f[1][0]*common/f[1][1]}/${common} = ${fraction(used)}. Қалғаны 1 − ${fraction(used)} = ${fraction(left)}; процентпен ${fraction(left)} · 100 = ${exact(a)}, яғни ${pct(a)}.`);}
 case'grid-product':{
  positive(p.rows,p.columns,p.eaten);const total=p.rows*p.columns;assert.ok(p.eaten<total);const a=rate(p.eaten,total);
  return result(p,a,`Бір шоколад тақтасында ${p.rows} қатар, әр қатарда ${p.columns} бірдей бөлік бар. Балалар ${p.eaten} бөлігін жеді. Желінгені бүкіл тақтаның неше проценті?`,`Барлық бөлік ${p.rows} · ${p.columns} = ${total}. Желінген үлес ${p.eaten} : ${total} · 100 = ${exact(a)}, яғни ${pct(a)}. Қатар саны немесе бір қатардағы бөлік саны жеке өзі бүтін бола алмайды.`);}
 case'speed-comparison':{
  assert.equal(p.distances.length,2);assert.equal(p.hours.length,2);positive(...p.distances,...p.hours);assert.notEqual(p.hours[0],p.hours[1]);const speeds=p.distances.map((n,i)=>Q(n,p.hours[i])),a=rate(speeds[0],speeds[1]);assert.notEqual(cmp(a,rate(...p.distances)),0);
  return result(p,a,`Бірінші велосипедші ${p.distances[0]} км жолды ${p.hours[0]} сағатта, екіншісі ${p.distances[1]} км жолды ${p.hours[1]} сағатта жүрді. Әрқайсысының жылдамдығы тұрақты. Біріншінің жылдамдығы екіншінікінің неше проценті?`,`Жылдамдықтарды бөлек табамыз: ${p.distances[0]} : ${p.hours[0]} = ${decimal(speeds[0])} км/сағ және ${p.distances[1]} : ${p.hours[1]} = ${decimal(speeds[1])} км/сағ. Содан кейін ${decimal(speeds[0])} : ${decimal(speeds[1])} · 100 = ${exact(a)}, яғни ${pct(a)}. Жолдарды ғана салыстыруға болмайды, уақыттар әртүрлі.`);}
 case'sum-first-relative':{
  positive(p.sum,p.first);const second=p.sum-p.first;assert.ok(second>0);const a=rate(p.first,second);assert.ok(a[1]>1&&gcd(a[1],10)===1,'Preserve an exact nonterminating percentage');
  return result(p,a,`Екі санның қосындысы ${p.sum}, біріншісі ${p.first}. Бірінші сан екінші санның неше проценті? Дәл мәні бар нұсқаны таңдаңдар.`,`Екінші сан ${p.sum} − ${p.first} = ${second}. Салыстыру негізі қосынды емес, осы екінші сан: ${p.first} : ${second} · 100 = ${exact(a)}. Жауап ${pct(a)}; оны жуықтап дөңгелектемейміз.`);}
 case'second-sale-base':{
  positive(p.total,p.second);validRate(p.firstPercent);const first=natural(portion(p.total,p.firstPercent)),remaining=p.total-first;assert.ok(p.second<remaining);const a=rate(p.second,remaining);
  return result(p,a,`Дүкенге ${p.total} кг алма әкелінді. Таңертең бастапқы алманың ${p.firstPercent}%-ы, түстен кейін тағы ${p.second} кг алма сатылды. Түстен кейін сатылған алма таңертеңгі сатылымнан кейін қалған алманың неше проценті?`,`Таңертең ${p.total} · ${p.firstPercent} : 100 = ${first} кг сатылды. Қалғаны ${p.total} − ${first} = ${remaining} кг. Екінші сатылым процентінің негізі — осы қалдық: ${p.second} : ${remaining} · 100 = ${exact(a)}, яғни ${pct(a)}.`);}
 case'rounded-wins':{
  positive(p.games,p.wins);assert.ok(p.wins<p.games);const precise=rate(p.wins,p.games);assert.notEqual(precise[1],1);const rounded=Math.floor((2*precise[0]+precise[1])/(2*precise[1]));
  return result(p,Q(rounded),`Команда ${p.games} ойынның ${p.wins}-інде жеңді. Жеңіс процентін ең жақын бүтін процентке дейін дөңгелектеңдер.`,`Дәл процент ${p.wins} · 100 : ${p.games} = ${exact(precise)}. Ең жақын бүтінге дөңгелектеу үшін ${precise[0]} санын ${precise[1]} санына бөлеміз: бүтін бөлік ${Math.floor(precise[0]/precise[1])}, қалдық ${precise[0]%precise[1]}. Қалдықтың екі есесін бөліммен салыстырамыз: ${2*(precise[0]%precise[1])} ${2*(precise[0]%precise[1])>=precise[1]?'≥':'<'} ${precise[1]}. Сондықтан дөңгелектелген жауап ${rounded}%.`);}
 case'mixed-sales-profit':{
  positive(p.quantity,p.costEach,p.firstQuantity,p.firstPrice,p.lastPrice);assert.ok(p.firstQuantity<p.quantity&&p.lastPrice<p.costEach&&p.firstPrice>p.costEach);const last=p.quantity-p.firstQuantity,cost=p.quantity*p.costEach,revenue=p.firstQuantity*p.firstPrice+last*p.lastPrice,profit=revenue-cost;assert.ok(profit>0);const a=rate(profit,cost);
  return result(p,a,`Жәрмеңке тобы ${p.quantity} күнделік сатып алды, әрқайсысына ${p.costEach} теңге төледі. Оның ${p.firstQuantity} данасын ${p.firstPrice} теңгеден, қалғанын ${p.lastPrice} теңгеден сатты. Жалпы пайда сатып алуға кеткен ақшаның неше проценті?`,`Шығын ${p.quantity} · ${p.costEach} = ${cost} теңге. Қалған күнделік саны ${p.quantity} − ${p.firstQuantity} = ${last}. Түсім ${p.firstQuantity} · ${p.firstPrice} + ${last} · ${p.lastPrice} = ${revenue} теңге. Пайда ${revenue} − ${cost} = ${profit} теңге. Пайданы шығынға бөлеміз: ${profit} : ${cost} · 100 = ${exact(a)}, яғни ${pct(a)}. Соңғы бөліктегі залалды да жалпы есепке қосамыз.`);}
 case'successes-added-total':{
  validRate(p.initialPercent);validRate(p.finalPercent);positive(p.added);assert.ok(p.finalPercent>p.initialPercent);const initial=natural(Q(p.added*(100-p.finalPercent),p.finalPercent-p.initialPercent)),final=initial+p.added,initialHits=natural(portion(initial,p.initialPercent)),finalHits=natural(portion(final,p.finalPercent));assert.equal(initialHits+p.added,finalHits);
  const g=gcd(100-p.finalPercent,100-p.initialPercent),oldParts=(100-p.finalPercent)/g,newParts=(100-p.initialPercent)/g,difference=newParts-oldParts,unit=Q(p.added,difference);assert.equal(natural(mul(unit,Q(newParts))),final);
  return result(p,Q(final),`Ойыншының бастапқы дәл лақтыру үлесі ${p.initialPercent}% болды. Одан кейінгі ${p.added} лақтырудың бәрі дәл тиіп, барлық лақтыру бойынша дәлдік ${p.finalPercent}%-ға жетті. Ойыншы соңында барлығы неше рет лақтырды?`,`Дәл тимеген лақтырулар саны өзгермейді. Бастапқыда олар ${100-p.initialPercent}%, соңында ${100-p.finalPercent}%. Сондықтан бастапқы және соңғы жалпы сандардың қатынасы ${100-p.finalPercent} : ${100-p.initialPercent} = ${oldParts} : ${newParts}. Қосылған ${p.added} лақтыру ${difference} үлеске тең; бір үлес ${p.added} : ${difference} = ${decimal(unit)}. Соңғы жалпы сан ${decimal(unit)} · ${newParts} = ${final}. Тексеру: бастапқысы ${initial}, оның ${initialHits}-і дәл; соңында ${finalHits}/${final} = ${p.finalPercent}%.`);}
 case'neither-divisor':{
  positive(p.last,...p.divisors);assert.equal(p.divisors.length,2);const[a,b]=p.divisors;assert.ok(a>1&&b>1&&a!==b&&p.last>=a*b);const lcm=a/gcd(a,b)*b,ca=Math.floor(p.last/a),cb=Math.floor(p.last/b),both=Math.floor(p.last/lcm),neither=p.last-ca-cb+both,answer=rate(neither,p.last);
  return result(p,answer,`1-ден ${p.last}-ге дейінгі барлық натурал сан алынды, екі шеткі сан да кіреді. Осы сандардың неше проценті ${a}-ке де бөлінбейді және ${b}-ке де бөлінбейді?`,`${a}-ке бөлінетіндер ${ca}, ${b}-ке бөлінетіндер ${cb}. Екеуіне қатар бөлінетіндер ЕКОЕ(${a}, ${b}) = ${lcm} санына еселік, олардың саны ${both}. Кемінде біреуіне бөлінетіндер ${ca} + ${cb} − ${both} = ${ca+cb-both}. Екеуіне де бөлінбейтіндер ${p.last} − ${ca+cb-both} = ${neither}. Процент ${neither} : ${p.last} · 100 = ${exact(answer)}, яғни ${pct(answer)}.`);}
 default:throw Error('Unknown grade6 percent model '+model);
 }
}

export function renderEdition(row){
 assert.equal(row.grade,6);assert.match(row.modelId,/^grade6-percent-[a-z-]+$/);assert.ok(row.params&&typeof row.params==='object');const rendered=authored(row);
 if(rendered.options){assert.equal(rendered.options.length,4);assert.equal(new Set(rendered.options).size,4);assert.equal(rendered.options.filter(v=>v===rendered.answer).length,1);const offset=parseInt(row.editionId.slice(-2),16)%4;rendered.options=[...rendered.options.slice(offset),...rendered.options.slice(0,offset)];}
 else rendered.statement+=row.modelId==='grade6-percent-successes-added-total'?' Жауапқа тек лақтыру санын жазыңыз.':' Жауапқа процент таңбасын қоспай, тек санды жазыңыз.';
 return rendered;
}
export function verifyEdition(row){
 const expected=renderEdition(row);for(const field of['statement','solution','answer','options'])assert.deepEqual(row[field],expected[field],`Percent edition ${field} differs from its exact calculation`);
 assert.equal(row.sourceRefs.length,1);
 return {answer:expected.answer,checks:['author exact reduced-fraction arithmetic, no intermediate rounding','source-specific percent base, count integrality and domain constraints','whole ordered MCQs, exact nonterminating choice and explicit numeric-only open input','independent content review required before local Standard publication']};
}
