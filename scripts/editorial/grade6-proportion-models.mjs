import assert from 'node:assert/strict';
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const Q=(n,d=1)=>{assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d!==0);if(d<0){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];};
function q(n){
 if(Array.isArray(n))return Q(...n);if(Number.isInteger(n))return Q(n);assert.equal(typeof n,'string');
 if(/^\d+ \d+\/\d+$/.test(n)){const[w,a,b]=n.split(/[ /]/).map(Number);assert.ok(a>0&&a<b);return Q(w*b+a,b);}
 if(/^-?\d+\/\d+$/.test(n))return Q(...n.split('/').map(Number));
 assert.match(n,/^-?\d+(?:\.\d+)?$/);const negative=n.startsWith('-');n=n.replace('-','');const[a,b='']=n.split('.');return Q((negative?-1:1)*Number(a+b),10**b.length);
}
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const sub=(a,b)=>add(a,[-b[0],b[1]]);
const mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>{assert.notEqual(b[0],0);return Q(a[0]*b[1],a[1]*b[0]);};
const cmp=(a,b)=>a[0]*b[1]-b[0]*a[1];
const positive=(...xs)=>xs.forEach(x=>assert.ok(q(x)[0]>0));
const int=a=>{assert.equal(a[1],1,'A count must be integral');return a[0];};
const fraction=a=>{a=q(a);return a[1]===1?String(a[0]):`${a[0]}/${a[1]}`;};
const decimal=a=>{a=q(a);let[n,d]=a,sign=n<0?'−':'';n=Math.abs(n);let out=sign+Math.floor(n/d),r=n%d;if(!r)return out;out+=',';for(let i=0;i<15&&r;i++){r*=10;out+=Math.floor(r/d);r%=d;}assert.equal(r,0,'Use exact MCQ for a nonterminating fraction');return out;};
const display=a=>typeof a==='string'&&a.includes(' ')?a.replace(' ',' бүтін '):typeof a==='string'&&a.includes('/')?a:decimal(q(a));
const term=a=>a===null?'x':display(a);
const prop=a=>`${term(a[0])} : ${term(a[1])} = ${term(a[2])} : ${term(a[3])}`;
const fracProp=a=>`(${term(a[0])})/(${term(a[1])}) = (${term(a[2])})/(${term(a[3])})`;
const truth=a=>cmp(mul(q(a[0]),q(a[3])),mul(q(a[1]),q(a[2])))===0;
const pair=a=>a.map(display).join(' және ');
const sum=a=>a.reduce((s,n)=>s+n,0);
const open=(a,statement,solution)=>({answer:decimal(a),statement:statement+' Жауапты тек санмен жазыңыз.',solution});
const choices=(answer,options,statement,solution)=>({answer,options,statement,solution});
const numericChoices=(a,options,statement,solution)=>choices(fraction(a),options.map(x=>fraction(q(x))),statement,solution);
const ratio=a=>{const g=a.reduce(gcd);return a.map(n=>n/g).join(' : ');};
function missing(terms){
 assert.equal(terms.length,4);const missing=terms.flatMap((v,i)=>v===null?[i]:[]);assert.equal(missing.length,1);const i=missing[0];positive(...terms.filter(v=>v!==null));
 // Solve the cross-product equation: positions0&3 versus1&2.
 const left=[0,3],right=[1,2],known=(left.includes(i)?left:right).find(k=>k!==i),other=left.includes(i)?right:left;
 const product=mul(q(terms[other[0]]),q(terms[other[1]])),a=div(product,q(terms[known]));const restored=[...terms];restored[i]=a;assert.ok(truth(restored));return {a,index:i,known,other,product};
}
function permutations(a){if(!a.length)return[[]];return a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(xs=>[v,...xs]));}
function correctProportion(options){const good=options.filter(truth);assert.equal(good.length,1);return prop(good[0]);}
function authored(row){
 const p=row.params,k=row.modelId.replace('grade6-proportion-','');
 switch(k){
 case'missing-member':{
  const{a,index,known,other,product}=missing(p.terms),members=p.terms.map(term),fractional=p.format==='fraction';
  let statement=fractional?`${fracProp(p.terms)} бөлшектер теңдігіндегі x мәнін табыңыз.`:`${prop(p.terms)} пропорциясында x неге тең?`;
  const conversion=p.format==='mixed'?p.terms.filter(v=>typeof v==='string'&&v.includes(' ')).map(v=>`${display(v)} = ${fraction(q(v))}`).join('; ')+'. ':'';
  const solution=conversion+`x — ${[0,3].includes(index)?'шеткі':'ортаңғы'} мүше. Айқас көбейтінділер тең: x · ${members[known]} = ${members[other[0]]} · ${members[other[1]]} = ${fraction(product)}. Сондықтан x = ${fraction(product)} : ${members[known]} = ${fraction(a)}${p.format==='decimal'&&a[1]!==1?' = '+decimal(a):''}. Мәнін бастапқы пропорцияға қойғанда айқас көбейтінділер тең болады.`;
  if(p.choices)return p.format==='decimal'?choices(decimal(a),p.choices.map(v=>decimal(q(v))),statement+' Дәл мәні бар нұсқаны таңдаңыз.',solution):numericChoices(a,p.choices,statement+' Дәл мәні бар нұсқаны таңдаңыз.',solution);
  return open(a,statement,solution);}
 case'named-members':{
  assert.ok(truth(p.terms));assert.equal(p.target,'extremes');const[a,b,c,d]=p.terms;
  return choices(pair([a,d]),[pair([b,c]),pair([a,d]),pair([a,b]),pair([c,d])],`${prop(p.terms)} жазуындағы шеткі мүшелердің екеуін таңдаңыз.`,`Шеткі мүшелер — жазуда бірінші және төртінші тұрған сандар: ${a} және ${d}. Екінші және үшінші тұрған ${b} пен ${c} — ортаңғы мүшелер.`);}
 case'other-extreme':{
  positive(p.known,...p.middles);const product=p.middles[0]*p.middles[1],a=Q(product,p.known);
  return open(a,`Пропорцияның бір шеткі мүшесі ${p.known}. Екі ортаңғы мүшесі ${pair(p.middles)} болса, екінші шеткі мүшесін табыңыз.`,`Екі шеткі мүшенің көбейтіндісі ${p.middles.join(' · ')} = ${product} санына тең. Сондықтан белгісіз шеткі мүше ${product} : ${p.known} = ${fraction(a)}.`);}
 case'choose-proportion':{
  const answer=correctProportion(p.candidates);
  if(p.numbers){assert.equal(new Set(p.numbers).size,4);p.candidates.forEach(a=>assert.deepEqual([...a].sort((a,b)=>a-b),[...p.numbers].sort((a,b)=>a-b)));}
  return choices(answer,p.candidates.map(prop),p.numbers?`${p.numbers.join(', ')} сандарын пайдаланып жазылған теңдіктердің қайсысы дұрыс пропорция?`:'Қай жазуда екі қатынас өзара тең, яғни пропорция құрайды?',p.candidates.map(a=>`${prop(a)}: ${a[0]} · ${a[3]} = ${a[0]*a[3]}, ал ${a[1]} · ${a[2]} = ${a[1]*a[2]}`).join('; ')+`. Айқас көбейтінділері тең жалғыз жазу: ${answer}.`);}
 case'middle-product':{
  assert.ok(truth(p.terms));const a=mul(q(p.terms[1]),q(p.terms[2]));
  return open(a,`${prop(p.terms)} пропорциясының ортаңғы мүшелерінің көбейтіндісін табыңыз.`,`Ортаңғы мүшелер — ${pair(p.terms.slice(1,3))}. Көбейтінді ${display(p.terms[1])} · ${display(p.terms[2])} = ${fraction(a)}. Шеткі мүшелердің көбейтіндісі де осыған тең.`);}
 case'equivalent-ratio':{
  positive(...p.base);const good=p.candidates.filter(a=>truth([...p.base,...a]));assert.equal(good.length,1);const answer=good[0].map(display).join(' : ');
  return choices(answer,p.candidates.map(a=>a.map(display).join(' : ')),`${p.base.join(' : ')} қатынасына тең қатынасты таңдаңыз.`,`${answer} қатынасының екі мүшесін де бірдей санға қысқартқанда ${p.base.join(' : ')} шығады. Қатынастың мүшелеріне бірдей сан қосу немесе тек біреуін көбейту оны сақтамайды.`);}
 case'swap-middle':{
  assert.ok(truth(p.terms));const[a,b,c,d]=p.terms,changed=[a,c,b,d];
  return choices(prop(changed),[[b,a,d,c],changed,[d,b,c,a],[c,d,a,b]].map(prop),`${prop(p.terms)} пропорциясында ТЕК екі ортаңғы мүшенің орнын ауыстырды. Қай жазу алынады?`,`Ортаңғы мүшелер ${b} пен ${c} орын ауыстырады; ${a} мен ${d} өз орындарында қалады. Нәтиже: ${prop(changed)}. Басқа жауаптар да дұрыс пропорция болуы мүмкін, бірақ олар сұралған орын ауыстыруға сәйкес келмейді.`);}
 case'product-to-proportion':{
  const[a,d]=p.first,[b,c]=p.second;assert.equal(a*d,b*c);const options=[[a,d,b,c],[a,c,d,b],[b,a,c,d],[a,b,c,d]],answer=correctProportion(options);
  return choices(answer,options.map(prop),`${a} · ${d} = ${b} · ${c} теңдігіне сәйкес дұрыс пропорцияны таңдаңыз.`,`Бір көбейтіндінің мүшелері шеткі, екіншісінікі ортаңғы орындарға орналасуы керек. ${answer} жазуында шеткі көбейтінді ${a} · ${d}, ортаңғысы ${b} · ${c}. Екеуі де ${a*d}.`);}
 case'justify-proportion':{
  const[a,b,c,d]=p.terms;assert.ok(truth(p.terms));const answer=`Иә: ${a} · ${d} = ${b} · ${c}`;
  return choices(answer,[`Жоқ: ${a} · ${b} ≠ ${c} · ${d}`,`Иә: ${a} + ${d} = ${b} + ${c}`,answer,`Жоқ: ${a} ≠ ${c}`],`${prop(p.terms)} теңдігі пропорция бола ма? Дұрыс негіздемені таңдаңыз.`,`Айқас көбейтінділерді салыстырамыз: ${a} · ${d} = ${a*d}, ${b} · ${c} = ${b*c}. Олар тең, демек бұл — пропорция. Қатынастардағы сандардың жеке-жеке тең болуы талап етілмейді.`);}
 case'equal-products':{
  positive(p.product);return open(Q(p.product),`Дұрыс пропорцияның шеткі мүшелерінің көбейтіндісі ${p.product}. Ортаңғы мүшелердің көбейтіндісі қандай?`,`Пропорцияның негізгі қасиеті бойынша шеткі және ортаңғы мүшелердің көбейтінділері тең. Сондықтан сұралған көбейтінді ${p.product}.`);}
 case'factor-pair-count':{
  positive(...p.middles);const product=p.middles[0]*p.middles[1],pairs=[];
  for(let x=1;x*x<product;x++)if(product%x===0)pairs.push([x,product/x]);assert.equal(Math.sqrt(product)%1,0,'Retain the excluded equal-factor case');
  return open(Q(pairs.length),`x : ${p.middles[0]} = ${p.middles[1]} : y. x пен y — натурал сандар және x < y. Шартқа сәйкес келетін реттелген (x; y) жұптары нешеу?`,`Айқас көбейтіндіден xy = ${product}. x < y болатын барлық бөлгіш жұптар: ${pairs.map(a=>'('+a.join('; ')+')').join(', ')}. (${Math.sqrt(product)}; ${Math.sqrt(product)}) жарамайды: онда x = y. Барлығы ${pairs.length} жұп.`);}
 case'not-permuted-proportion':{
  assert.ok(truth(p.terms));const[a,b,c,d]=p.terms,options=[[b,a,d,c],[a,c,b,d],[a,d,b,c],[d,b,c,a]],bad=options.filter(a=>!truth(a));assert.equal(bad.length,1);
  return choices(prop(bad[0]),options.map(prop),`${prop(p.terms)} пропорциясының мүшелерінен құрастырылған қай теңдік пропорция ЕМЕС?`,options.map(a=>`${prop(a)}: айқас көбейтінділер ${a[0]*a[3]} және ${a[1]*a[2]}`).join('; ')+`. Тек ${prop(bad[0])} үшін олар тең емес.`);}
 case'right-sum':{
  positive(...p.weights,p.total);const[a,b]=p.weights,unit=Q(p.total,a+b),d=mul(unit,Q(b));int(d);int(mul(unit,Q(a)));
  return open(d,`${a} : ${b} = c : d пропорциясында c + d = ${p.total}. Төртінші мүше d неге тең?`,`c және d ${a} : ${b} қатынасында. Барлығы ${a+b} үлес, бір үлес ${p.total} : ${a+b} = ${fraction(unit)}. d = ${b} · ${fraction(unit)} = ${fraction(d)}.`);}
 case'scale-photo':{
  const[a,b]=p.sides;positive(a,b,p.newShort);assert.ok(a<b&&p.newShort>a);const out=Q(p.newShort*b,a);
  return open(out,`Суреттің бастапқы қабырғалары ${a} см және ${b} см. Пішінін сақтап үлкейткеннен кейін қысқа қабырғасы ${p.newShort} см болды. Жаңа ұзын қабырғаны сантиметрмен табыңыз.`,`Қабырғалардың қатынасы өзгермейді: ${a} : ${b} = ${p.newShort} : x. Айқас көбейтінді бойынша x = ${p.newShort} · ${b} : ${a} = ${fraction(out)} см. Екі қабырғаға бірдей ұзындық қосу пішінді сақтамайды.`);}
 case'recipe-comparison':{
  assert.equal(p.names.length,2);positive(...p.liquid,...p.powder);const rates=p.powder.map((n,i)=>Q(n,p.liquid[i]));assert.notEqual(cmp(...rates),0);assert.notEqual(p.liquid[0],p.liquid[1]);
  const winner=cmp(...rates)>0?0:1,answer=p.names[winner]+' дайындаған сусын';
  return choices(answer,[p.names[0]+' дайындаған сусын','Қоюлығы бірдей',p.names[1]+' дайындаған сусын','Ақпарат жеткіліксіз'],`${p.names[0]} ${p.liquid[0]} стақан сүтке ${p.powder[0]} қасық какао, ${p.names[1]} ${p.liquid[1]} стақан сүтке ${p.powder[1]} қасық какао қосты. Стақандар мен қасықтар бірдей. Бір стақан сүтке шаққанда қай сусын қоюлау?`,`Бірінші сусында бір стақанға ${fraction(rates[0])} қасық, екіншісінде ${fraction(rates[1])} қасық келеді. Салыстырғанда ${fraction(rates[winner])} үлкен, сондықтан ${answer} қоюлау. Тек қасық сандарын салыстыру жеткіліксіз.`);}
 case'permutation-count':{
  assert.equal(new Set(p.values).size,4);positive(...p.values);const good=permutations(p.values).filter(truth);assert.equal(good.length,8);
  return numericChoices(Q(good.length),[2,8,4,24],`${p.values.join(', ')} сандарының әрқайсысын бір рет қолданып a : b = c : d түріндегі неше дұрыс жазу құрастыруға болады? Мүшелердің орны өзгеше жазуларды бөлек санаңыз.`,`Төрт санның барлық орналасуы ${permutations(p.values).length}. Айқас көбейтінділері тең жазулар: ${good.map(prop).join('; ')}. Саны ${good.length}. Сандық қатынас мәні бірдей болса да, мүшелердің басқа орындары бұл сұрақта бөлек жазу болып есептеледі.`);}
 case'units-proportion':{
  positive(p.metresTenths,p.minutes,p.hours);assert.ok(p.minutes<60*p.hours);const centimetres=p.metresTenths*10,totalMinutes=p.hours*60,a=Q(centimetres*p.minutes,totalMinutes);
  return open(a,`x см : ${decimal(Q(p.metresTenths,10))} м = ${p.minutes} мин : ${p.hours} сағ пропорциясы берілген. x мәнін сантиметрмен табыңыз.`,`${decimal(Q(p.metresTenths,10))} м = ${centimetres} см; ${p.hours} сағ = ${totalMinutes} мин. Бірліктерді теңестіргенде x : ${centimetres} = ${p.minutes} : ${totalMinutes}. Сондықтан x = ${centimetres} · ${p.minutes} : ${totalMinutes} = ${fraction(a)} см.`);}
 case'two-unknown-sum':{
  positive(p.product,p.first,p.third);const b=Q(p.product,p.third),d=Q(p.product,p.first),a=add(b,d);
  return open(a,`a : b = c : d пропорциясында bc = ${p.product}, a = ${p.first}, c = ${p.third}. b + d мәнін табыңыз.`,`ad = bc = ${p.product}. b = ${p.product} : ${p.third} = ${fraction(b)}; d = ${p.product} : ${p.first} = ${fraction(d)}. Қосынды ${fraction(b)} + ${fraction(d)} = ${fraction(a)}. Әр белгісіз өзінің айқас жұбындағы белгілі мүшеге бөлініп табылады.`);}
 case'coefficient-numerator':{
  positive(p.coefficient,p.denominator,p.rightNumerator,p.rightDenominator);assert.ok(p.coefficient>1);const numerator=Q(p.denominator*p.rightNumerator,p.rightDenominator),a=div(numerator,Q(p.coefficient));assert.ok(a[1]>1);
  return numericChoices(a,[a,numerator,Q(p.coefficient*p.rightDenominator*p.denominator,p.rightNumerator),Q(p.rightNumerator,p.rightDenominator)],`(${p.coefficient}x)/${p.denominator} = ${p.rightNumerator}/${p.rightDenominator} теңдеуіндегі x-тің дәл мәнін таңдаңыз.`,`Алдымен ${p.coefficient}x = ${p.denominator} · ${p.rightNumerator} : ${p.rightDenominator} = ${fraction(numerator)}. Енді ${p.coefficient}-ке бөлеміз: x = ${fraction(numerator)} : ${p.coefficient} = ${fraction(a)}. Алымның мәнін x мәнімен шатастырмаймыз.`);}
 case'denominators-sum':{
  positive(p.first,p.third,p.total);assert.notEqual(p.first,p.third);const unit=Q(p.total,p.first+p.third),b=mul(unit,Q(p.first)),d=mul(unit,Q(p.third));
  return open(d,`a : b = c : d пропорциясында a = ${p.first}, c = ${p.third}, b + d = ${p.total}. d мәнін табыңыз.`,`Ортаңғы мүшелерді орын ауыстырсақ, a : c = b : d. Сондықтан b : d = ${p.first} : ${p.third} = ${ratio([p.first,p.third])}. d = ${p.total} · ${p.third} : (${p.first} + ${p.third}) = ${fraction(d)}. b = ${fraction(b)}; екеуінің қосындысы ${p.total}.`);}
 case'same-class-ratio':{
  positive(p.boys,p.girls,p.firstGirls);assert.ok(p.firstGirls<p.girls);const boys=Q(p.boys*p.firstGirls,p.girls);int(boys);assert.ok(p.boys-int(boys)>0);
  return open(boys,`6 «Б» және 6 «В» сыныптарында ұлдар санының қыздар санына қатынасы бірдей. Екеуінде барлығы ${p.boys} ұл және ${p.girls} қыз бар. 6 «Б» сыныбында ${p.firstGirls} қыз болса, осы сыныпта неше ұл бар?`,`Бірдей қатынасты топтарды қосқанда қатынас сақталады. Ортақ ұлдар : қыздар қатынасы ${p.boys} : ${p.girls} = ${ratio([p.boys,p.girls])}. 6 «Б» сыныбында ұлдар саны ${p.firstGirls} · ${p.boys} : ${p.girls} = ${fraction(boys)}. Қалған сыныпта ${p.boys-int(boys)} ұл және ${p.girls-p.firstGirls} қыз; олардың қатынасы да бірдей.`);}
 case'affine-numerator':{
  positive(p.added,p.denominator,p.rightNumerator,p.rightDenominator);const whole=Q(p.denominator*p.rightNumerator,p.rightDenominator),a=sub(whole,Q(p.added));assert.ok(a[0]>0);
  return open(a,`(x + ${p.added})/${p.denominator} = ${p.rightNumerator}/${p.rightDenominator} теңдеуін шешіңіз.`,`x + ${p.added} өрнегін тұтас мүше деп аламыз: x + ${p.added} = ${p.denominator} · ${p.rightNumerator} : ${p.rightDenominator} = ${fraction(whole)}. Бұдан x = ${fraction(whole)} − ${p.added} = ${fraction(a)}.`);}
 case'sum-over-second':{
  positive(...p.weights);const[a,b]=p.weights,out=Q(a+b,b);
  return numericChoices(out,[Q(a+b,a),Q(a,a+b),Q(a+1,b),out],`x және y — оң сандар, x/y = ${a}/${b}. (x + y)/y қатынасының дәл мәнін таңдаңыз.`,`x/y = ${a}/${b} болғандықтан, x — ${a}k, y — ${b}k, мұндағы k > 0. (x + y)/y = (${a}k + ${b}k)/(${b}k) = ${fraction(out)}. Ортақ k қысқарады.`);}
 case'first-third-multiple':{
  positive(p.multiple,p.sum);assert.ok(p.multiple>1);const d=Q(p.sum,p.multiple+1);
  return open(d,`a : b = c : d пропорциясының барлық мүшесі оң. a = ${p.multiple}c және b + d = ${p.sum}. Төртінші мүше d-ны табыңыз.`,`Пропорциядан a : c = b : d = ${p.multiple} : 1. Демек b = ${p.multiple}d. Қосынды (${p.multiple} + 1)d = ${p.sum}, сондықтан d = ${fraction(d)}.`);}
 case'change-member-factor':{
  positive(p.firstFactor,p.secondFactor);assert.ok(p.firstFactor>p.secondFactor&&p.secondFactor>1);const factor=Q(p.firstFactor,p.secondFactor),answer=`${decimal(factor)} есе арттыру`;
  return choices(answer,[`${p.firstFactor*p.secondFactor} есе арттыру`,answer,`${p.firstFactor} есе арттыру`,`${decimal(factor)} есе кеміту`],`a : b = c : d, мұндағы барлық мүшелер оң. a-ны ${p.firstFactor} есе, b-ны ${p.secondFactor} есе арттырды, d өзгермеді. Пропорция сақталу үшін c-ны қалай өзгерту керек?`,`Жаңа сол қатынас (${p.firstFactor}a)/(${p.secondFactor}b) = (${p.firstFactor}/${p.secondFactor}) · (a/b). Сондықтан оң қатынас та ${decimal(factor)} есе артуы керек. d өзгермегендіктен, c ${decimal(factor)} есе артады.`);}
 case'affine-denominator':{
  positive(p.left,p.coefficient,p.subtracted,p.rightNumerator,p.rightDenominator);const denominator=div(mul(q(p.left),Q(p.rightDenominator)),q(p.rightNumerator)),twostep=add(denominator,Q(p.subtracted)),a=div(twostep,Q(p.coefficient));assert.ok(a[0]>0&&denominator[0]>0);
  return numericChoices(a,[a,denominator,twostep,div(sub(denominator,Q(p.subtracted)),Q(p.coefficient))],`${display(p.left)}/(${p.coefficient}x − ${p.subtracted}) = ${display(p.rightNumerator)}/${p.rightDenominator}. Бөлім нөлге тең емес. x мәнін таңдаңыз.`,`Айқас көбейтіндіден ${p.coefficient}x − ${p.subtracted} = ${display(p.left)} · ${p.rightDenominator} : ${display(p.rightNumerator)} = ${fraction(denominator)}. Олай болса ${p.coefficient}x = ${fraction(twostep)}, x = ${fraction(a)}. Тексергенде бөлім ${fraction(denominator)}, нөл емес.`);}
 case'add-one-property':{
  assert.ok(truth(p.terms));const[a,b,c,d]=p.terms,left=Q(a+b,b),right=Q(c+d,d);assert.equal(cmp(left,right),0);const answer=`Иә, екі жағы да ${fraction(left)}`;
  return choices(answer,[answer,'Жоқ, сол жағы үлкен',`Иә, екі жағы да ${fraction(Q(a,b))}`,`Жоқ, оң жағы ${fraction(Q(c+d,c))}`],`Оқушы a/b = c/d болса, (a + b)/b = (c + d)/d деп тұжырымдады. ${prop(p.terms)} үшін оның тұжырымы дұрыс па?`,`Сол жағы (${a} + ${b})/${b} = ${fraction(left)}. Оң жағы (${c} + ${d})/${d} = ${fraction(right)}. Екеуі тең. Жалпы әр жақ бастапқы қатынасқа 1 қосады, сондықтан теңдік сақталады.`);}
 case'combined-common-ratios':{
  positive(...p.weights);assert.equal(p.weights.length,3);const[a,b,c]=p.weights,out=[a+b,b+c],answer=ratio(out),options=[ratio([a,c]),answer,ratio([...out].reverse()),ratio([a+c,b])];
  return choices(answer,options,`x, y, z — нөлге тең емес сандар және x/${a} = y/${b} = z/${c}. (x + y) : (y + z) қатынасын қысқартып таңдаңыз.`,`Ортақ қатынасты k ≠ 0 деп белгілесек, x = ${a}k, y = ${b}k, z = ${c}k. Қосындылар ${a+b}k және ${b+c}k. k қысқарғаннан кейін қатынас ${answer} болады.`);}
 case'difference-middle-members':{
  positive(...p.extremes,p.difference);const product=p.extremes[0]*p.extremes[1],pairs=[];for(let n=1;n*n<product;n++)if(product%n===0&&product/n-n===p.difference)pairs.push([n,product/n]);assert.equal(pairs.length,1);const[a,b]=pairs[0];
  return open(Q(b),`Пропорцияның шеткі мүшелері ${pair(p.extremes)}. Ортаңғы мүшелері натурал сандар, олардың айырмасы ${p.difference}. Үлкен ортаңғы мүшені табыңыз.`,`Ортаңғы мүшелердің көбейтіндісі ${p.extremes.join(' · ')} = ${product}. Бөлгіш жұптардың ішінен айырмасы ${p.difference} болатыны тек ${a} және ${b}: ${a} · ${b} = ${product}, ${b} − ${a} = ${p.difference}. Үлкені ${b}.`);}
 case'chained-prices':{
  positive(p.firstKg,p.secondKg,p.secondBatchKg,p.thirdKg,p.thirdPrice);const secondPrice=Q(p.thirdKg*p.thirdPrice,p.secondBatchKg),firstPrice=div(mul(Q(p.secondKg),secondPrice),Q(p.firstKg));
  return open(firstPrice,`${p.firstKg} кг алма мен ${p.secondKg} кг алмұрттың бағасы тең. Сондай-ақ ${p.secondBatchKg} кг алмұрт пен ${p.thirdKg} кг өріктің бағасы тең. Өріктің 1 килограмы ${p.thirdPrice} теңге болса, алманың 1 килограмы неше теңге?`,`Алдымен 1 кг алмұрт бағасы ${p.thirdKg} · ${p.thirdPrice} : ${p.secondBatchKg} = ${fraction(secondPrice)} теңге. Содан кейін 1 кг алма бағасы ${p.secondKg} · ${fraction(secondPrice)} : ${p.firstKg} = ${fraction(firstPrice)} теңге. Екі қадамда да тең бағалардағы массалар ескеріледі.`);}
 case'fractional-speed-gap':{
  positive(...p.weights,p.gap);const[a,b]=p.weights.map(q);assert.ok(cmp(a,b)>0);const factor=div(Q(p.gap),sub(a,b)),speed=mul(a,factor),walk=mul(b,factor);
  return open(speed,`Велосипедші жылдамдығының жаяу жүргінші жылдамдығына қатынасы ${p.weights.join(' : ')}. Велосипедші ${p.gap} км/сағ жылдамырақ. Оның жылдамдығын км/сағ-пен табыңыз.`,`Жылдамдықтар (${p.weights[0]}) · k және (${p.weights[1]}) · k. Айырмасы (${p.weights[0]} − ${p.weights[1]}) · k = ${p.gap}, сондықтан k = ${fraction(factor)}. Велосипедші ${fraction(speed)} км/сағ, жаяу жүргінші ${fraction(walk)} км/сағ; айырмасы ${p.gap}.`);}
 case'successive-proportions':{
  positive(p.firstNumerator,...p.firstRight,...p.secondRight);const a=div(mul(q(p.firstNumerator),Q(p.firstRight[1])),Q(p.firstRight[0])),b=div(mul(a,Q(p.secondRight[1])),Q(p.secondRight[0]));
  const tuple=(a,b)=>`a = ${fraction(a)}; b = ${fraction(b)}`;return choices(tuple(a,b),[tuple(a,div(mul(a,Q(p.secondRight[0])),Q(p.secondRight[1]))),tuple(mul(a,Q(4)),mul(b,Q(4))),tuple(a,b),tuple(div(Q(p.firstRight[1]),Q(p.firstRight[0])),Q(3))],`${display(p.firstNumerator)}/a = ${p.firstRight[0]}/${p.firstRight[1]} және a/b = ${p.secondRight[0]}/${p.secondRight[1]}. Екі пропорцияны да қанағаттандыратын a мен b-ны таңдаңыз.`,`Біріншіден a = ${display(p.firstNumerator)} · ${p.firstRight[1]} : ${p.firstRight[0]} = ${fraction(a)}. Осы мәнді екіншісіне қойып, b = ${fraction(a)} · ${p.secondRight[1]} : ${p.secondRight[0]} = ${fraction(b)} аламыз. Екі белгісізді бір ғана пропорциядан қатар табуға болмайды.`);}
 case'general-cross-products':return choices('m · v = n · u',['m · n = u · v','m · u = n · v','m · v = n · u','m + v = n + u'],'m, n, u, v — нөлге тең емес сандар, m/n = u/v. Қай теңдік әрқашан орындалады?','Бөлімдері нөлге тең емес теңдіктің екі жағын nv санына көбейтеміз: m · v = n · u. Бұл — шеткі және ортаңғы мүшелер көбейтінділерінің теңдігі.');
 case'count-equivalent':{
  positive(...p.base);const flags=p.ratios.map(a=>truth([...p.base,...a]));assert.ok(flags.some(Boolean)&&flags.some(v=>!v));
  return open(Q(flags.filter(Boolean).length),`${p.ratios.map(a=>a.map(display).join(' : ')).join('; ')} қатынастары берілген. Олардың нешеуі ${p.base.join(' : ')} қатынасына тең?`,p.ratios.map((a,i)=>`${a.map(display).join(' : ')} — ${flags[i]?'тең':'тең емес'}`).join('; ')+`. Әр жұпты айқас көбейтінділермен тексергенде ${flags.filter(Boolean).length} қатынас сәйкес келеді.`);}
 case'nonzero-convention':return choices('0',['1','0,02','200','0'],'Осы тапсырмада пропорция деп барлық төрт мүшесі нөлге тең емес екі қатынастың теңдігін аламыз. Осы анықтама бойынша қай сан оның мүшесі бола алмайды?','Берілген анықтамада әр мүше нөлден өзгеше болуы талап етілген. Нұсқалардағы жалғыз нөл — 0. Бұл шектеу пропорция мүшелерінің орнын ауыстырғанда нөлге бөлуді болдырмайды.');
 case'equal-middle':{
  positive(...p.extremes);const product=p.extremes[0]*p.extremes[1],a=Math.sqrt(product);assert.ok(Number.isInteger(a));return open(Q(a),`Пропорцияның екі ортаңғы мүшесі бірдей оң санға тең. Шеткі мүшелері ${pair(p.extremes)} болса, ортаңғы мүшені табыңыз.`,`Ортаңғы мүшені x десек, x² = ${p.extremes.join(' · ')} = ${product}. x > 0 болғандықтан, x = ${a}; ${a} · ${a} = ${product}. Оң сан шарты теріс шешімді алып тастайды.`);}
 case'four-member-product':{
  positive(p.product);const a=Math.sqrt(p.product);assert.ok(Number.isInteger(a));return open(Q(a),`Дұрыс пропорцияның төрт мүшесі натурал сандар. Олардың барлығының көбейтіндісі ${p.product}. Шеткі мүшелердің көбейтіндісін табыңыз.`,`Шеткі мүшелердің көбейтіндісін P десек, ортаңғы мүшелердің көбейтіндісі де P. Барлық төрт мүшенің көбейтіндісі P² = ${p.product}. P оң, сондықтан P = ${a}. Төрт мүшенің көбейтіндісін екіге бөлуге болмайды.`);}
 case'target-root-choice':{
  positive(p.root);const results=p.candidates.map(a=>missing(a).a),good=p.candidates.filter((a,i)=>cmp(results[i],Q(p.root))===0);assert.equal(good.length,1);
  return choices(prop(good[0]),p.candidates.map(prop),`Қай пропорцияның белгісіз мүшесі x = ${p.root} болады?`,p.candidates.map((a,i)=>`${prop(a)} үшін x = ${fraction(results[i])}`).join('; ')+`. Сұралған мәнді тек ${prop(good[0])} береді.`);}
 case'detect-inversion-error':{
  positive(p.denominator,p.rightNumerator,p.rightDenominator);const good=Q(p.denominator*p.rightNumerator,p.rightDenominator),bad=Q(p.denominator*p.rightDenominator,p.rightNumerator);assert.notEqual(cmp(good,bad),0);
  const answer=`Ортаңғы мүшелер көбейтіндісін белгілі шеткі мүшеге бөлу керек: x = ${fraction(good)}`;
  return choices(answer,[`Қате жоқ: x = ${fraction(bad)}`,answer,`x = ${fraction(Q(p.rightNumerator*p.rightDenominator,p.denominator))}`,`Үш белгілі санды көбейту керек: x = ${p.denominator*p.rightNumerator*p.rightDenominator}`],`Оқушы x : ${p.denominator} = ${p.rightNumerator} : ${p.rightDenominator} есебін «x = ${p.denominator} · ${p.rightDenominator} : ${p.rightNumerator} = ${fraction(bad)}» деп шешті. Оның қадамы туралы дұрыс тұжырымды таңдаңыз.`,`x — шеткі мүше. Дұрысы x · ${p.rightDenominator} = ${p.denominator} · ${p.rightNumerator}, сондықтан x = ${fraction(good)}. Оқушы шеткі мүшені ортаңғымен көбейтіп, айқас жұптарды шатастырған. Оның ${fraction(bad)} жауабы бастапқы теңдікті қанағаттандырмайды.`);}
 case'variable-both-ratio':{
  const[a,b]=p.weights;positive(a,b,p.difference);assert.ok(a<b);const unit=Q(p.difference,b-a),x=mul(unit,Q(a));assert.notEqual(add(x,Q(p.difference))[0],0);
  return open(x,`x/(x + ${p.difference}) = ${a}/${b} теңдеуін шешіңіз. Бөлім нөлге тең емес.`,`x пен x + ${p.difference} шамалары ${a} : ${b} қатынасында. Айырмасы ${p.difference} саны ${b-a} үлеске тең. Бір үлес ${fraction(unit)}, сондықтан x = ${a} · ${fraction(unit)} = ${fraction(x)}. Тексеру: ${fraction(x)}/${fraction(add(x,Q(p.difference)))} = ${a}/${b}.`);}
 case'impossible-fourth':{
  positive(...p.given,...p.choices);assert.equal(p.given.length,3);const[a,b,c]=p.given,possible=[Q(a*b,c),Q(a*c,b),Q(b*c,a)],bad=p.choices.filter(x=>!possible.some(v=>cmp(q(x),v)===0));assert.equal(bad.length,1);
  return choices(fraction(q(bad[0])),p.choices.map(x=>fraction(q(x))),`${p.given.join(', ')} сандарының әрқайсысын және тағы бір санды пайдаланып пропорция құру керек. Қай төртінші санмен мұны жасау МҮМКІН ЕМЕС?`,`Төртінші сан белгілі үш санның біреуімен айқас көбейтіндіде жұптасады. Сондықтан оның мүмкін мәндері ${a} · ${b} : ${c} = ${fraction(possible[0])}; ${a} · ${c} : ${b} = ${fraction(possible[1])}; ${b} · ${c} : ${a} = ${fraction(possible[2])}. Нұсқалардағы ${fraction(q(bad[0]))} бұлардың ешқайсысына тең емес.`);}
 case'max-distinct-digit-product':{
  assert.ok(Number.isInteger(p.lower)&&Number.isInteger(p.upper)&&1<=p.lower&&p.lower<p.upper&&p.upper<=9);const digits=Array.from({length:p.upper-p.lower+1},(_,i)=>p.lower+i);
  const solutions=[];for(const a of digits)for(const b of digits)for(const c of digits)for(const d of digits)if(new Set([a,b,c,d]).size===4&&a*d===b*c)solutions.push([a,b,c,d]);assert.ok(solutions.length);const maximum=Math.max(...solutions.map(a=>a[0]*a[3])),example=solutions.find(a=>a[0]*a[3]===maximum);
  const products=new Map();for(let i=0;i<digits.length;i++)for(let j=i+1;j<digits.length;j++){const n=digits[i]*digits[j];if(n>maximum){if(!products.has(n))products.set(n,[]);products.get(n).push([digits[i],digits[j]]);}}
  const exclusions=[...products].sort((a,b)=>b[0]-a[0]).map(([product,pairs])=>`${product} = ${pairs.map(a=>a.join(' · ')).join(' = ')}`).join('; ');
  return open(Q(maximum),`Пропорцияның төрт мүшесі ${p.lower}-ден ${p.upper}-ға дейінгі төрт әртүрлі натурал сан. Екі шеткі мүшесінің көбейтіндісі ең көп дегенде қандай болады?`,`Әр көбейтінді ортақ цифры жоқ екі жұптан шығуы керек. ${prop(example)} мысалында айқас көбейтінді ${maximum}. Одан үлкен мүмкін көбейтінділердің барлық жұптары: ${exclusions}. Бұл тізімде ортақ саны жоқ екі түрлі жұп бір көбейтіндіні бермейді. Сондықтан максимум ${maximum}.`);}
 default:throw Error('Unknown source-specific proportion model '+k);
 }
}
export function renderEdition(row){
 assert.equal(row.grade,6);const out=authored(row);assert.ok(out.statement&&out.solution&&out.answer);
 if(out.options){assert.equal(out.options.length,4);assert.equal(new Set(out.options).size,4);assert.equal(out.options.filter(v=>v===out.answer).length,1);const offset=parseInt(row.editionId.slice(-2),16)%4;out.options=[...out.options.slice(offset),...out.options.slice(0,offset)];}
 assert.doesNotMatch(out.statement+out.solution,/[\\$]/);return out;
}
export function verifyEdition(row){
 const expected=renderEdition(row);for(const k of['statement','solution','answer','options'])assert.deepEqual(row[k],expected[k],'Unbound proportion '+k);
 assert.equal(row.sourceRefs.length,1);return {answer:expected.answer,checks:['exact reduced fractions and denominator domains','individual source target retained, including member positions and requested transformations','complete finite domains for counts and global distinct-digit maximum','whole text/options/math binding; independent review still required']};
}
