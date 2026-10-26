import assert from 'node:assert/strict';

// Exact rational arithmetic: no rounded intermediate values in fractions,
// percentages, mixtures, decimal resources or changing-age ratios.
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const sum=a=>a.reduce((n,x)=>n+x,0);
const Q=(n,d=1)=>{assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d!==0);if(d<0){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];};
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const sub=(a,b)=>add(a,[-b[0],b[1]]);
const mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>{assert.notEqual(b[0],0);return Q(a[0]*b[1],a[1]*b[0]);};
const qsum=a=>a.reduce(add,Q(0));
const cmp=(a,b)=>a[0]*b[1]-b[0]*a[1];
const int=a=>{assert.equal(a[1],1,'An integer is required for this count');return a[0];};
const text=a=>{if(!Array.isArray(a))a=Q(a);if(a[1]===1)return String(a[0]);return `${a[0]}/${a[1]}`;};
const dec=a=>{
 if(!Array.isArray(a))a=Q(a);let[n,d]=a;const sign=n<0?'−':'';n=Math.abs(n);
 let out=sign+Math.floor(n/d),r=n%d;if(!r)return out;out+=',';
 for(let i=0;i<16&&r;i++){r*=10;out+=Math.floor(r/d);r%=d;}
 assert.equal(r,0,'A nonterminating decimal must be offered as an exact fraction');return out;
};
const ratio=a=>{assert.ok(a.every(n=>Number.isSafeInteger(n)&&n>0));const g=a.reduce(gcd);return a.map(n=>n/g).join(' : ');};
const join=a=>a.join(' : ');
const tuple=a=>'('+a.map(text).join('; ')+')';
const open=(answer,statement,solution)=>({answer:dec(answer),statement,solution});
const mcq=(answer,options,statement,solution)=>({answer,options,statement,solution});
const shares=(total,weights)=>{assert.ok(Number.isSafeInteger(total)&&total>0&&weights.length>=2);const w=weights.map(v=>Array.isArray(v)?Q(...v):Q(v));assert.ok(w.every(v=>v[0]>0));return w.map(v=>mul(Q(total),div(v,qsum(w))));};
const tupleQuestion=(values,statement,solution)=>mcq(tuple(values),[
 tuple(values),tuple([...values].reverse()),tuple(values.map(q=>mul(q,Q(2)))),tuple(values.map(q=>div(q,Q(2))))
],statement,solution);
const ratioQuestion=(a,b,statement,solution)=>mcq(ratio([a,b]),[ratio([a,b]),ratio([b,a]),ratio([a,a+b]),ratio([a+b,b])],statement,solution);
const unitSolution=(total,weights,values)=>{
 const unit=div(Array.isArray(total)?total:Q(total),Q(sum(weights)));
 return `Барлық үлес саны: ${weights.join(' + ')} = ${sum(weights)}. Бір үлес: ${dec(total)} : ${sum(weights)} = ${dec(unit)}. Бөліктер: ${weights.map((w,i)=>`${dec(unit)} · ${w} = ${dec(values[i])}`).join('; ')}.`;
};

function totalPrompt(p){
 const r=join(p.weights);
 switch(p.context){
 case'cord':return `Сәндік панноға арналған ${p.total} см бауды ${r} қатынасымен екі бөлікке бөлді. Қысқа бөліктің ұзындығын сантиметрмен табыңдар.`;
 case'prize':return `Мектеп байқауының ${p.total} теңгелік сыйақысы үш топқа ${r} қатынасында берілді. Ең үлкен сыйақы алған топқа неше теңге тиеді?`;
 case'mineral':return `Керамикаға арналған ${p.total} г құрғақ қоспада кварц пен саз массалары ${r} қатынасында. Кварц массасы неше грамм?`;
 case'class':return `Сыныптағы ${p.total} оқушының ұлдары мен қыздарының саны ${r} қатынасында. Осы сыныпта неше қыз бар?`;
 case'cement':return `Жөндеу қоспасындағы цемент пен құм массаларының қатынасы ${r}. ${p.total} кг қоспаға неше килограмм құм жұмсалады?`;
 case'books':return `Сөрелердегі ғылыми және көркем кітаптар санының қатынасы ${r}. Бұл екі түрдегі кітаптардың жалпы саны ${p.total}. Ғылыми кітаптар нешеу?`;
 case'larger':return `${p.total} саны ${r} қатынасымен екі қосылғышқа жіктелді. Үлкен қосылғыштың мәнін табыңдар.`;
 case'recycling':return `Үш үйірме қайта өңдеуге барлығы ${p.total} кг қағаз өткізді. Олардың қағаз массалары бірінші, екінші, үшінші үйірме ретімен ${r} қатынасында. Екінші үйірме неше килограмм қағаз өткізді?`;
 default:throw Error('Unknown individually selected total context '+p.context);
 }
}

function authored(row){
 const p=row.params,model=row.modelId.replace('grade6-division-','');
 assert.ok(p&&typeof p==='object');
 switch(model){
 case'total-share':{
  const values=shares(p.total,p.weights);values.forEach(int);assert.ok(p.target>=0&&p.target<values.length);
  if(p.context==='cord')assert.equal(p.weights[p.target],Math.min(...p.weights));
  if(['prize','larger'].includes(p.context))assert.equal(p.weights[p.target],Math.max(...p.weights));
  const fixedTargets={mineral:0,class:1,cement:1,books:0,recycling:1};if(Object.hasOwn(fixedTargets,p.context))assert.equal(p.target,fixedTargets[p.context]);
  return open(values[p.target],totalPrompt(p),unitSolution(p.total,p.weights,values)+` Сұралған бөлік — ${dec(values[p.target])}.`);}
 case'total-tuple':{
  const values=shares(p.total,p.weights);values.forEach(int);const count=p.weights.length;
  return tupleQuestion(values,`${p.total} саны ${join(p.weights)} қатынасында ${count===3?'үш':'екі'} бөлікке бөлінді. Бөліктерді қатынас мүшелерінің ретімен көрсететін нұсқаны таңдаңдар.`,unitSolution(p.total,p.weights,values)+` Ретін сақтаймыз: ${tuple(values)}.`);}
 case'total-gap':{
  const v=shares(p.total,p.weights);v.forEach(int);assert.ok(cmp(v[0],v[1])>0);const gap=sub(v[0],v[1]);
  return open(gap,`Екі топ ${p.total} пазл бөлшегін ${join(p.weights)} қатынасында бөлісті. Бірінші топ екіншіден неше бөлшек артық алды?`,unitSolution(p.total,p.weights,v)+` Айырмасы: ${dec(v[0])} − ${dec(v[1])} = ${dec(gap)} бөлшек.`);}
 case'straight-share':{
  const v=shares(180,p.weights);v.forEach(int);
  if(p.context==='smaller')assert.equal(p.weights[p.target],Math.min(...p.weights));else assert.equal(p.target,1);
  const statement=p.context==='smaller'?`Жазыңқы бұрышты оның ішінен жүргізілген сәуле ${join(p.weights)} қатынасындағы екі бұрышқа бөлді. Кіші бұрыштың градус өлшемі қандай?`:`M, O және N бір түзудің бойында, O олардың арасында жатыр. OP сәулесі жазыңқы ∠MON бұрышын ∠MOP : ∠PON = ${join(p.weights)} қатынасында бөледі. ∠PON бұрышын градуспен табыңдар.`;
  return open(v[p.target],statement,unitSolution(180,p.weights,v)+` Сұралған бұрыш ${dec(v[p.target])}°.`);}
 case'segment-share':{
  assert.equal(p.target,0);
  const v=shares(p.total,p.weights);v.forEach(int);
  return open(v[0],`MN кесіндісінің ұзындығы ${p.total} см. Оның ішіндегі P нүктесі MP : PN = ${join(p.weights)} шартын қанағаттандырады. MP ұзындығы неше сантиметр?`,unitSolution(p.total,p.weights,v)+` MP — бірінші бөлік: ${dec(v[0])} см.`);}
 case'litre-share':{
  assert.equal(p.target,1);
  const ml=p.litresTenths*100,v=shares(ml,p.weights);v.forEach(int);
  return open(v[p.target],`Жеміс шырыны мен су көлемдерінің қатынасы ${join(p.weights)} болатын сусыннан ${dec(Q(p.litresTenths,10))} л дайындалды. Осы сусындағы су көлемін миллилитрмен есептеңдер.`,`${dec(Q(p.litresTenths,10))} л = ${ml} мл. `+unitSolution(ml,p.weights,v)+` Су — екінші бөлік: ${dec(v[1])} мл.`);}
 case'fractional-share':{
  assert.equal(p.weights[p.target],Math.min(...p.weights));
  const v=shares(p.total,p.weights),a=v[p.target];assert.notEqual(a[1],1);
  const options=[a,v[1-p.target],Q(p.total,p.weights[0]),Q(p.total,p.weights[1])].map(text);
  return mcq(text(a),options,`${p.total} м лентаны ${join(p.weights)} қатынасындағы екі бөлікке қиды. Кіші бөліктің ұзындығын дәл бөлшекпен көрсететін нұсқаны таңдаңдар.`,`Кіші бөлік бүкіл ұзындықтың ${p.weights[p.target]}/${sum(p.weights)} бөлігіне тең: ${p.total} · ${p.weights[p.target]}/${sum(p.weights)} = ${text(a)} м. Қалған бөлік ${text(v[1-p.target])} м; қосындысы ${p.total} м.`);}
 case'known-part-total':{
  const unit=Q(p.known,p.weights[p.knownIndex]),total=mul(unit,Q(sum(p.weights)));assert.ok(unit[0]>0);
  let statement;
  if(p.context==='number')assert.equal(p.weights[p.knownIndex],Math.min(...p.weights));
  if(p.context==='drink')assert.equal(p.knownIndex,1);
  if(p.context==='recipe')assert.equal(p.knownIndex,2);
  if(p.context==='number')statement=`Белгісіз сан ${join(p.weights)} қатынасымен екі бөлікке бөлінді. Кіші бөлігі ${p.known}. Бастапқы санды табыңдар.`;
  else if(p.context==='drink')statement=`Гүлге арналған қоректік ерітіндіде концентрат пен су көлемдерінің қатынасы ${join(p.weights)}. Оған ${p.known} мл су жұмсалды. Дайын ерітіндінің жалпы көлемі неше миллилитр?`;
  else if(p.context==='recipe')statement=`Печенье қоспасына ұн, какао және май ${join(p.weights)} қатынасында алынады. Майдың массасы ${p.known} г болса, қоспаның жалпы массасы неше грамм?`;
  else throw Error('Unknown known-part context');
  return open(total,statement,`${p.known} — бүтін шама емес, оның ${p.weights[p.knownIndex]} үлесінің мәні. Бір үлес: ${p.known} : ${p.weights[p.knownIndex]} = ${dec(unit)}. Барлығы ${sum(p.weights)} үлес: ${dec(unit)} · ${sum(p.weights)} = ${dec(total)}.`);}
 case'unit-operation':{
  const s=sum(p.weights),answer=`${p.total} : (${p.weights.join(' + ')})`;
  return mcq(answer,[answer,`${p.total} : ${p.weights[0]}`,`${p.total} : (${p.weights.join(' · ')})`,`${p.total} · (${p.weights.join(' + ')})`],`${p.total} санын ${join(p.weights)} қатынасында бөлгенде бір үлесті табу үшін қай өрнек қолданылады?`,`Бір үлесті алу үшін берілген санды қатынас мүшелерінің қосындысына бөлеміз. ${p.weights.join(' + ')} = ${s}, сондықтан ${answer} = ${dec(Q(p.total,s))}.`);}
 case'difference-larger':{
  assert.ok(p.weights[0]>p.weights[1]);const k=Q(p.gap,p.weights[0]-p.weights[1]),large=mul(k,Q(p.weights[0]));int(large);
  return open(large,`Екі оң сан ${join(p.weights)} қатынасында, ал үлкені кішісінен ${p.gap} артық. Үлкен сан қандай?`,`Айырмаға ${p.weights[0]} − ${p.weights[1]} = ${p.weights[0]-p.weights[1]} үлес сәйкес. Бір үлес ${p.gap} : ${p.weights[0]-p.weights[1]} = ${dec(k)}. Үлкен сан: ${dec(k)} · ${p.weights[0]} = ${dec(large)}.`);}
 case'rectangle-perimeter-area':{
  const k=Q(p.perimeter,2*sum(p.weights)),length=mul(k,Q(p.weights[0])),width=mul(k,Q(p.weights[1])),area=mul(length,width);assert.ok(cmp(length,width)>0);
  return open(area,`Тік төртбұрышты карточканың периметрі ${p.perimeter} см. Ұзындығы мен енінің қатынасы ${join(p.weights)}. Карточканың ауданын см²-пен табыңдар.`,`Ұзындық пен еннің қосындысы ${p.perimeter} : 2 = ${dec(Q(p.perimeter,2))} см. Бір үлес ${dec(Q(p.perimeter,2))} : ${sum(p.weights)} = ${dec(k)} см. Қабырғалар ${dec(length)} см және ${dec(width)} см; аудан ${dec(length)} · ${dec(width)} = ${dec(area)} см².`);}
 case'age-sum-future':{
  const v=shares(p.total,p.weights);v.forEach(int);assert.ok(int(v[0])>=25&&int(v[1])>=5);const future=add(v[0],Q(p.years));
  return open(future,`Әкесі мен қызының қазіргі жастарының қосындысы ${p.total}. Әкесінің жасының қызының жасына қатынасы ${join(p.weights)}. ${p.years} жылдан кейін әкесі неше жаста болады?`,unitSolution(p.total,p.weights,v)+` Әкесі қазір ${dec(v[0])} жаста. Кейінгі жасы ${dec(v[0])} + ${p.years} = ${dec(future)}. Қатынасты қазіргі жастарға ғана қолданамыз.`);}
 case'fraction-ratio-tuple':{
  const v=shares(p.total,p.weights);v.forEach(int);
  return fractionTuple(p,v);}
 case'chain-matched-tuple':{
  assert.equal(p.first[1],p.second[0]);const weights=[p.first[0],p.first[1],p.second[1]],v=shares(p.total,weights);v.forEach(int);
  return tupleQuestion(v,`Үш санның қосындысы ${p.total}. Біріншінің екіншіге қатынасы ${join(p.first)}, ал екіншінің үшіншіге қатынасы ${join(p.second)}. Сандарды бірінші, екінші, үшінші ретімен көрсетіңдер.`,`Ортақ екінші мүше екі қатынаста да ${p.first[1]}, сондықтан біріккен қатынас ${join(weights)}. `+unitSolution(p.total,weights,v)+` Жауап: ${tuple(v)}.`);}
 case'decimal-ratio-smaller':{
  const v=shares(p.total,p.tenths),index=p.tenths.indexOf(Math.min(...p.tenths)),g=p.tenths.reduce(gcd),weights=p.tenths.map(n=>n/g);
  return open(v[index],`Екі өлшемнің сан мәндері ${dec(Q(p.tenths[0],10))} : ${dec(Q(p.tenths[1],10))} қатынасында. Олардың қосындысы ${p.total}. Кіші санды табыңдар.`,`Екі мүшені де 10-ға көбейтеміз: ${join(p.tenths)} = ${ratio(p.tenths)}. `+unitSolution(p.total,weights,v)+` Кіші сан ${dec(v[index])}.`);}
 case'investment-share':{
  assert.equal(p.target,1);
  const v=shares(p.profit,p.investments);v.forEach(int);
  return open(v[p.target],`Айым жобаға ${p.investments[0]} теңге, ал Нұрсая ${p.investments[1]} теңге салды. ${p.profit} теңге пайданы салымдарына тура пропорционал бөлуге келісті. Нұрсаяға неше теңге тиеді?`,`Салымдардың қатынасы ${join(p.investments)} = ${ratio(p.investments)}. Нұрсаяның үлесі ${p.investments[1]}/${sum(p.investments)}. Оның пайдасы ${p.profit} · ${p.investments[1]} : ${sum(p.investments)} = ${dec(v[1])} теңге.`);}
 case'kilogram-share':{
  assert.equal(p.target,0);
  const grams=p.kilograms*1000,v=shares(grams,p.weights);
  return open(v[p.target],`Тұз массасының су массасына қатынасы ${join(p.weights)} болатын ерітіндінің жалпы массасы ${p.kilograms} кг. Оның құрамында неше грамм тұз бар?`,`${p.kilograms} кг = ${grams} г. `+unitSolution(grams,p.weights,v)+` Тұз бірінші мүшеге сәйкес: ${dec(v[0])} г.`);}
 case'triangle-tuple':{
  const sorted=[...p.weights].sort((a,b)=>a-b);assert.ok(sorted[0]+sorted[1]>sorted[2],'Triangle must exist');const v=shares(p.perimeter,p.weights);v.forEach(int);
  return tupleQuestion(v,`Үшбұрыштың периметрі ${p.perimeter} см, ал қабырғалары ${join(p.weights)} қатынасында. Қабырғаларды осы ретімен сантиметрмен көрсететін нұсқаны таңдаңдар.`,unitSolution(p.perimeter,p.weights,v)+` Қабырғалар ${tuple(v)} см. Екі қысқа қабырғаның қосындысы үшіншісінен үлкен.`);}
 case'remaining-percent-share':{
  assert.equal(p.target,1);
  assert.ok(p.removedPercent>0&&p.removedPercent<100);const rem=Q(p.total*(100-p.removedPercent),100),target=mul(rem,Q(p.weights[p.target],sum(p.weights)));
  return open(target,`Аумағы ${p.total} га бақтың ${p.removedPercent}%-іне шие отырғызылды. Қалған жердегі алма мен алмұрт алқаптарының аудандары ${join(p.weights)} қатынасында. Алмұртқа неше гектар жер бөлінді?`,`Қалған аудан: ${p.total} · ${100-p.removedPercent}/100 = ${dec(rem)} га. Оның ${p.weights[1]}/${sum(p.weights)} бөлігі алмұртқа тиеді: ${dec(rem)} · ${p.weights[1]} : ${sum(p.weights)} = ${dec(target)} га.`);}
 case'three-difference-total':{
  assert.equal(p.firstIndex,0);assert.equal(p.lastIndex,2);
  const gapParts=p.weights[p.lastIndex]-p.weights[p.firstIndex];assert.ok(gapParts>0);const unit=Q(p.gap,gapParts),total=mul(unit,Q(sum(p.weights)));int(total);
  return open(total,`Үш бригаданың жинаған қызылша массалары ${join(p.weights)} қатынасында. Үшінші бригада біріншіден ${p.gap} кг артық жинады. Үшеуі барлығы неше килограмм қызылша жинаған?`,`Айырма ${p.weights[p.lastIndex]} − ${p.weights[p.firstIndex]} = ${gapParts} үлес. Бір үлес ${p.gap} : ${gapParts} = ${dec(unit)} кг. Барлығы ${sum(p.weights)} үлес: ${dec(unit)} · ${sum(p.weights)} = ${dec(total)} кг.`);}
 case'percent-difference-total':{
  const part=Q(p.weights[0]*p.percent,100),delta=sub(Q(p.weights[1]),part);assert.ok(delta[0]>0);const unit=div(Q(p.gap),delta),total=mul(unit,Q(sum(p.weights)));
  return open(total,`Екі оң санның қатынасы ${join(p.weights)}. Бірінші санның ${p.percent}%-і екінші саннан ${p.gap}-ге кем. Осы сандардың қосындысы қандай?`,`Бірінші сан ${p.weights[0]} үлес, оның ${p.percent}%-і ${dec(part)} үлес. Екінші саннан айырмасы ${p.weights[1]} − ${dec(part)} = ${dec(delta)} үлес. Бір үлес ${p.gap} : ${dec(delta)} = ${dec(unit)}. Қосынды ${sum(p.weights)} · ${dec(unit)} = ${dec(total)}.`);}
 case'chain-unmatched-share':{
  assert.equal(p.target,2);assert.ok(p.first[1]%p.second[0]!==0&&p.second[0]%p.first[1]!==0,'Both pairs must require scaling to retain the saved LCM skill');const l=p.first[1]*p.second[0]/gcd(p.first[1],p.second[0]),weights=[p.first[0]*(l/p.first[1]),l,p.second[1]*(l/p.second[0])],v=shares(p.total,weights);v.forEach(int);
  return open(v[p.target],`Үш оқу орталығына барлығы ${p.total} қорап дәптер жеткізілді. Бірінші орталықтағы қорап санының екіншідегіге қатынасы ${join(p.first)}, ал екіншідегінің үшіншідегіге қатынасы ${join(p.second)}. Үшінші орталық неше қорап алды?`,`Ортақ екінші мүше ретінде ${p.first[1]} және ${p.second[0]} сандарының ЕКОЕ-і ${l} алынады. Бірінші қатынасты ${l/p.first[1]} есе, екінші қатынасты ${l/p.second[0]} есе кеңейтеміз: ${join(p.first)} = ${weights[0]} : ${l}; ${join(p.second)} = ${l} : ${weights[2]}. Біріккен қатынас ${join(weights)}. `+unitSolution(p.total,weights,v)+` Үшінші орталық ${dec(v[2])} қорап алды.`);}
 case'rectangle-area-perimeter':{
  const square=Q(p.area,p.weights[0]*p.weights[1]),k=Math.sqrt(int(square));assert.ok(Number.isSafeInteger(k)&&k>0);const a=p.weights[0]*k,b=p.weights[1]*k,perimeter=2*(a+b);
  return open(perimeter,`Тік төртбұрышты суреттің ұзындығының еніне қатынасы ${join(p.weights)}, ауданы ${p.area} см². Периметрі неше сантиметр?`,`Ұзындық ${p.weights[0]}k, ені ${p.weights[1]}k болсын. Онда ${p.weights[0]*p.weights[1]}k² = ${p.area}, k² = ${dec(square)}. ${k} · ${k} = ${dec(square)}, сондықтан k = ${k} см. Қабырғалар ${a} см және ${b} см. Периметр 2 · (${a} + ${b}) = ${perimeter} см.`);}
 case'worker-days-payment':{
  assert.equal(p.target,1);
  assert.equal(p.workers.length,3);assert.equal(p.days.length,3);const weights=p.workers.map((n,i)=>n*p.days[i]),unit=Q(p.payment,sum(weights)),payment=mul(unit,Q(weights[p.target]));int(payment);
  return open(payment,`Жөндеуде бірінші бригададағы ${p.workers[0]} адам ${p.days[0]} күн, екінші бригададағы ${p.workers[1]} адам ${p.days[1]} күн, үшінші бригададағы ${p.workers[2]} адам ${p.days[2]} күн еңбек етті. Бір адамның бір күндік ақысы бәріне бірдей. Жалпы төлем ${p.payment} теңге. Екінші бригадаға неше теңге төленеді?`,`Адам-күн саны: ${p.workers.map((n,i)=>`${n} · ${p.days[i]} = ${weights[i]}`).join('; ')}. Барлығы ${sum(weights)} адам-күн. Бір адам-күн ақысы ${p.payment} : ${sum(weights)} = ${dec(unit)} теңге. Екінші бригада: ${weights[1]} · ${dec(unit)} = ${dec(payment)} теңге.`);}
 case'combined-mixtures':{
  const v1=shares(p.firstGrams,p.first),v2=shares(p.secondKilograms*1000,p.second),salt=add(v1[0],v2[0]),water=add(v1[1],v2[1]);v1.concat(v2).forEach(int);const a=int(salt),b=int(water);
  return mcq(ratio([a,b]),[ratio([a,b]),ratio([b,a]),ratio([a,a+b]),ratio([p.first[0]+p.second[0],p.first[1]+p.second[1]])],`Бірінші тұзды ерітіндідегі тұз : су массаларының қатынасы ${join(p.first)}, екіншісінде ${join(p.second)}. Біріншісінен ${p.firstGrams} г, екіншісінен ${p.secondKilograms} кг араластырды. Жаңа қоспадағы тұз массасының су массасына қатынасын таңдаңдар.`,`Бірінші ерітіндіде ${dec(v1[0])} г тұз және ${dec(v1[1])} г су бар. Екінші ерітінді ${p.secondKilograms*1000} г: тұзы ${dec(v2[0])} г, суы ${dec(v2[1])} г. Барлық тұз ${a} г, барлық су ${b} г. Қатынас ${a} : ${b} = ${ratio([a,b])}. Бастапқы қатынастардың мүшелерін жай қосуға болмайды.`);}
 case'remaining-difference-total':{
  const difference=p.weights[0]-p.weights[1];assert.ok(difference>0&&p.removedPercent>0&&p.removedPercent<100);const unit=Q(p.gap,difference),rem=mul(unit,Q(sum(p.weights))),total=div(rem,Q(100-p.removedPercent,100));
  return open(total,`Турист жолдың ${p.removedPercent}%-ін автобуспен өтті. Қалған жолдың пойызбен және таксимен жүрген бөліктері ${join(p.weights)} қатынасында. Пойызбен жүргені таксимен жүргенінен ${p.gap} км артық. Бүкіл бағыттың ұзындығы неше километр?`,`Қалған бөлікте айырма ${difference} үлеске тең. Бір үлес ${p.gap} : ${difference} = ${dec(unit)} км. Қалған жол ${dec(unit)} · ${sum(p.weights)} = ${dec(rem)} км. Бұл бүкіл жолдың ${100-p.removedPercent}%-і: толық жол ${dec(rem)} · 100 : ${100-p.removedPercent} = ${dec(total)} км.`);}
 case'transfer-equal-total':{
  const gapParts=p.weights[0]-p.weights[1];assert.ok(gapParts>0);const unit=Q(2*p.moved,gapParts),v=p.weights.map(w=>mul(unit,Q(w))),total=qsum(v);v.forEach(int);
  return open(total,`Екі қораптағы ойын текшелерінің саны ${join(p.weights)} қатынасында. Біріншіден екіншісіне ${p.moved} текше салғанда, олардың саны тең болды. Бастапқыда екі қорапта барлығы неше текше болған?`,`Ауыстыру кезінде бірінші қорап ${p.moved} текшеге азайып, екіншісі ${p.moved} текшеге көбейді. Бастапқы айырма 2 · ${p.moved} = ${2*p.moved} текше. Бұл ${gapParts} үлес: бір үлес ${dec(unit)}. Бастапқы сандар ${v.map(dec).join(' және ')}; барлығы ${dec(total)}. Ауыстырғаннан кейін екеуінде де ${dec(sub(v[0],Q(p.moved)))} текше.`);}
 case'meeting-distance':{
  assert.equal(p.target,1);
  const v=shares(p.distance,p.weights);v.forEach(int);const speeds=v.map(x=>div(x,Q(p.hours)));assert.ok(speeds.every(s=>cmp(s,Q(30))<=0));
  return open(v[p.target],`Екі велосипедші ${p.distance} км аралықтағы елді мекендерден бір мезгілде бір-біріне қарсы шықты. Олардың жылдамдықтары ${join(p.weights)} қатынасында. ${p.hours} сағаттан соң кездесті. Екінші велосипедші кездескенге дейін неше километр жүрді?`,`Уақыттары бірдей, сондықтан жүрген жолдары да ${join(p.weights)} қатынасында. `+unitSolution(p.distance,p.weights,v)+` Екіншісі ${dec(v[1])} км жүрді. Жылдамдықтарды тексеру: ${speeds.map(dec).join(' және ')} км/сағ.`);}
 case'partial-sum-total':{
  assert.deepEqual(p.selected,[1,3]);
  assert.equal(new Set(p.selected).size,p.selected.length);const parts=sum(p.selected.map(i=>p.weights[i])),unit=Q(p.known,parts),total=mul(unit,Q(sum(p.weights)));int(total);
  return open(total,`Төрт оң сан ${join(p.weights)} қатынасында. Екінші және төртінші сандардың қосындысы ${p.known}. Төрт санның жалпы қосындысын табыңдар.`,`Белгілі қосынды ${p.weights[1]} + ${p.weights[3]} = ${parts} үлеске сәйкес. Бір үлес ${p.known} : ${parts} = ${dec(unit)}. Төрт санның барлық үлесі ${sum(p.weights)}; жалпы қосынды ${dec(unit)} · ${sum(p.weights)} = ${dec(total)}.`);}
 case'add-second-component':{
  const v=shares(p.total,p.before),required=mul(v[0],Q(p.after[1],p.after[0])),added=sub(required,v[1]);assert.ok(added[0]>0);
  return open(added,`Қызыл және ақ балауыздан тұратын ${p.total} г қоспада қызыл массасының ақ массаға қатынасы ${join(p.before)}. Осы қатынас ${join(p.after)} болу үшін неше грамм ақ балауыз қосу керек?`,`Бастапқы қызыл масса ${dec(v[0])} г, ақ масса ${dec(v[1])} г. Қызыл масса өзгермейді. Жаңа қатынас үшін ақ масса ${dec(v[0])} · ${p.after[1]} : ${p.after[0]} = ${dec(required)} г болуы керек. Қосылатын масса ${dec(required)} − ${dec(v[1])} = ${dec(added)} г.`);}
 case'equal-bundles-tuple':{
  const v=shares(p.total,p.bundleSizes);v.forEach(int);const count=Q(p.total,sum(p.bundleSizes));int(count);
  return tupleQuestion(v,`Дана, Іңкәр және Мирас жапсырмаларын пакеттерге салды. Олардың әр пакетінде тиісінше ${p.bundleSizes[0]}, ${p.bundleSizes[1]} және ${p.bundleSizes[2]} жапсырма бар. Әр баладағы пакеттер саны бірдей, барлығы ${p.total} жапсырма бар. Балалардағы жапсырма сандарын Дана, Іңкәр, Мирас ретімен таңдаңдар.`,`Әрқайсысында n пакет болса, жапсырмалар ${p.bundleSizes.map(w=>`${w}n`).join(', ')} болады. Қатынас ${join(p.bundleSizes)}. Бірдей пакет саны ${p.total} : ${sum(p.bundleSizes)} = ${dec(count)}. Жапсырма сандары ${tuple(v)}.`);}
 case'ages-changing-ratio':{
  const[a,b]=p.before,[c,d]=p.after,coefficient=d*a-c*b;assert.ok(coefficient>0&&c>d);const unit=Q((c-d)*p.years,coefficient),ages=[mul(unit,Q(a)),mul(unit,Q(b))];ages.forEach(int);assert.ok(int(ages[0])-int(ages[1])>=18&&int(ages[1])>=5);
  return tupleQuestion(ages,`Анасы мен ұлының қазіргі жастарының қатынасы ${join(p.before)}. ${p.years} жылдан кейін бұл қатынас ${join(p.after)} болады. Олардың қазіргі жастарын анасы, ұлы ретімен таңдаңдар.`,`Қазіргі жастар ${a}k және ${b}k. Кейінгі қатынас: ${d} · (${a}k + ${p.years}) = ${c} · (${b}k + ${p.years}). Осыдан ${coefficient}k = ${(c-d)*p.years}, k = ${dec(unit)}. Қазіргі жастар ${tuple(ages)}. Тексеру: ${dec(add(ages[0],Q(p.years)))} : ${dec(add(ages[1],Q(p.years)))} = ${join(p.after)}.`);}
 case'larger-whole-fraction':{
  const a=Math.max(...p.weights),b=Math.min(...p.weights),correct=text(Q(a,a+b));
  return mcq(correct,[correct,text(Q(a,b)),text(Q(b,a)),text(Q(b,a+b))],`Кесінді ${join(p.weights)} қатынасындағы екі бөлікке бөлінді. Ұзын бөлік бүкіл кесіндінің қандай бөлігін құрайды?`,`Бүтін кесіндіде ${sum(p.weights)} үлес бар, ұзын бөлікте ${a} үлес бар. Сондықтан ізделген бөлшек ${correct}. Бұл екі бөліктің өзара қатынасы емес, бөліктің бүтінге қатынасы.`);}
 case'bounded-class-size':{
  const g=p.weights.reduce(gcd),step=sum(p.weights)/g,possible=[];for(let n=p.lowerExclusive+1;n<p.upperExclusive;n++)if(n%step===0)possible.push(n);assert.equal(possible.length,1,'A unique class size is required');
  return open(possible[0],`Сыныптағы ұлдар мен қыздар саны ${join(p.weights)} қатынасында. Барлық оқушы саны ${p.lowerExclusive}-дан көп, ${p.upperExclusive}-ден аз. Сыныпта неше оқушы бар?`,`Қысқартылған қатынас ${ratio(p.weights)}; оқушылар саны ${step}-ге еселік. ${p.lowerExclusive} < n < ${p.upperExclusive} аралығында жарамды жалғыз сан — ${possible[0]}. Тексеру: ұлдар ${possible[0]*p.weights[0]/sum(p.weights)}, қыздар ${possible[0]*p.weights[1]/sum(p.weights)}.`);}
 case'recover-ratio':{
  const second=p.total-p.first;assert.ok(p.first>0&&second>0);
  return ratioQuestion(p.first,second,`${p.total} саны екі қосылғышқа жіктелді, біріншісі ${p.first}. Бірінші қосылғыштың екіншісіне қатынасын қысқартып таңдаңдар.`,`Екінші қосылғыш ${p.total} − ${p.first} = ${second}. Қатынас ${p.first} : ${second} = ${ratio([p.first,second])}. Бөлімге бүкіл санды қоюға болмайды.`);}
 case'limiting-mixture':{
  const available=p.availableTenths.map(n=>Q(n,10)),limits=available.map((q,i)=>div(q,Q(p.weights[i]))),unit=cmp(limits[0],limits[1])<0?limits[0]:limits[1],used=p.weights.map(w=>mul(unit,Q(w))),total=qsum(used);assert.ok(used.every((q,i)=>cmp(q,available[i])<=0));
  return open(total,`Күлгін бояуда көк және қызыл бояу көлемдерінің қатынасы ${join(p.weights)} болуы керек. Шеберханада ${dec(available[0])} л көк және ${dec(available[1])} л қызыл бояу бар. Ең көбі неше литр күлгін бояу дайындауға болады?`,`Көк бояу бойынша бір үлестің шегі ${dec(available[0])} : ${p.weights[0]} = ${dec(limits[0])} л, қызыл бойынша ${dec(available[1])} : ${p.weights[1]} = ${dec(limits[1])} л. Екі шектің кішісі ${dec(unit)} л. Жұмсалатын көлемдер ${used.map(dec).join(' және ')} л; барлығы ${dec(total)} л. Барлық қолдағы бояуды араластыру қатынасты бұзады.`);}
 case'sector-proportion':{
  const last=360-p.firstAngle-p.secondAngle;assert.ok(last>0);const first=Q(p.lastCount*p.firstAngle,last);int(first);
  return open(first,`Спорт сауалнамасының дөңгелек диаграммасында жүзу секторы ${p.firstAngle}°, футбол секторы ${p.secondAngle}°, ал қалған сектор — теннис. Сектор бұрыштары оқушылар санына тура пропорционал. Теннисті ${p.lastCount} оқушы таңдаса, жүзуді неше оқушы таңдаған?`,`Теннис секторы 360° − ${p.firstAngle}° − ${p.secondAngle}° = ${last}°. Бір градусқа ${p.lastCount}/${last} оқушы сәйкес. Жүзуді таңдағандар саны ${p.lastCount} · ${p.firstAngle} : ${last} = ${dec(first)}.`);}
 case'weighted-coins':{
  const groupValue=p.weights.reduce((n,w,i)=>n+w*p.denominations[i],0),groups=Q(p.money,groupValue);int(groups);const count=mul(groups,Q(sum(p.weights)));
  return open(count,`Жинақ қорабында тек ${p.denominations[0]} және ${p.denominations[1]} теңгелік тиындар бар. Олардың сандары ${join(p.weights)} қатынасында. Жалпы ақша ${p.money} теңге. Қорапта барлығы неше тиын бар?`,`Бір қатынас тобының ақшасы ${p.weights[0]} · ${p.denominations[0]} + ${p.weights[1]} · ${p.denominations[1]} = ${groupValue} теңге. Топ саны ${p.money} : ${groupValue} = ${dec(groups)}. Әр топта ${sum(p.weights)} тиын, сондықтан барлығы ${dec(groups)} · ${sum(p.weights)} = ${dec(count)} тиын.`);}
 case'sum-difference-ratio':{
  assert.ok(p.sumParts>p.differenceParts&&p.differenceParts>0);const a=p.sumParts+p.differenceParts,b=p.sumParts-p.differenceParts;
  return mcq(ratio([a,b]),[ratio([a,b]),ratio([b,a]),ratio([p.sumParts,p.differenceParts]),ratio([a,p.sumParts])],`Екі оң санның қосындысының олардың оң айырмасына қатынасы ${p.sumParts} : ${p.differenceParts}. Үлкен санның кіші санға қатынасы қандай?`,`Үлкен сан қосынды мен айырманың жарты қосындысына, кішісі жарты айырмасына тең. Қатынас (${p.sumParts} + ${p.differenceParts}) : (${p.sumParts} − ${p.differenceParts}) = ${a} : ${b} = ${ratio([a,b])}. Екі мүшедегі бірдей 2 бөлгіші қысқарады.`);}
 case'participating-fractions':{
  const parts=p.weights.map((w,i)=>mul(Q(w),Q(...p.fractions[i]))),partSum=qsum(parts),unit=div(Q(p.participants),partSum),total=mul(unit,Q(sum(p.weights)));int(total);const sizes=p.weights.map(w=>mul(unit,Q(w)));sizes.forEach(int);
  return open(total,`Сыныптағы ұлдар мен қыздар саны ${join(p.weights)} қатынасында. Ұлдардың ${text(Q(...p.fractions[0]))} бөлігі және қыздардың ${text(Q(...p.fractions[1]))} бөлігі ғылыми жобаға қатысты. Қатысушылар барлығы ${p.participants} болса, сыныптағы оқушы саны нешеу?`,`Қатысқан ұлдар ${p.weights[0]} · ${text(Q(...p.fractions[0]))} = ${dec(parts[0])} үлес, қыздар ${p.weights[1]} · ${text(Q(...p.fractions[1]))} = ${dec(parts[1])} үлес. Барлығы ${dec(partSum)} үлес. Бір үлес ${p.participants} : ${dec(partSum)} = ${dec(unit)}. Сынып ${sum(p.weights)} · ${dec(unit)} = ${dec(total)} оқушыдан тұрады.`);}
 case'two-division-points':{
  const c=Q(p.first[0],sum(p.first)),d=Q(p.second[0],sum(p.second));assert.ok(cmp(d,c)>0&&cmp(d,Q(1))<0);const fraction=sub(d,c),length=div(Q(p.gap),fraction);
  return open(length,`P және Q нүктелері MN кесіндісінің ішінде жатыр. MP : PN = ${join(p.first)}, ал MQ : QN = ${join(p.second)}. PQ ұзындығы ${p.gap} см болса, MN ұзындығын сантиметрмен табыңдар.`,`MP бүкіл MN-нің ${text(c)} бөлігіне, MQ ${text(d)} бөлігіне тең. Q нүктесі P-ден әрі орналасады. PQ бүтіннің ${text(d)} − ${text(c)} = ${text(fraction)} бөлігі. Сондықтан MN = ${p.gap} : (${text(fraction)}) = ${dec(length)} см.`);}
 case'successive-cuts':{
  const first=shares(p.total,p.first);assert.ok(cmp(first[1],first[0])>0);const secondary=p.second.map(w=>mul(first[1],Q(w,sum(p.second)))),v=[first[0],...secondary];v.forEach(int);const smallest=v.reduce((a,b)=>cmp(a,b)<0?a:b);
  return open(smallest,`Ұзындығы ${p.total} м тросты алдымен ${join(p.first)} қатынасында бөлді. Ұзын бөлікті кейін ${join(p.second)} қатынасымен тағы қиды. Үш дайын бөліктің ең қысқасы неше метр?`,`Алғашқы бөліктер ${first.map(dec).join(' және ')} м. Ұзын бөлік ${dec(first[1])} м; оны қайта бөлгенде ${secondary.map(dec).join(' және ')} м шығады. Үш ұзындықты салыстырамыз: ${v.map(dec).join('; ')}. Ең қысқасы ${dec(smallest)} м.`);}
 default:throw Error('Unknown division model '+model);
 }
}

function fractionTuple(p,values){
 const denominator=p.weights.map(([,d])=>d).reduce((a,b)=>a*b/gcd(a,b),1),weights=p.weights.map(([n,d])=>n*denominator/d);
 const ratioText=p.weights.map(a=>text(Q(...a))).join(' : ');
 const statement=p.context==='wire'?`${p.total} м электр сымы ${ratioText} қатынасында екі бөлікке бөлінді. Ұзындықтарды бірінші, екінші ретімен метрмен көрсетіңдер.`:`Үш топ ${p.total} көшетті ${ratioText} қатынасымен отырғызды. Бірінші, екінші, үшінші топ отырғызған көшет сандарын ретімен таңдаңдар.`;
 return tupleQuestion(values,statement,`Қатынас мүшелерін бөлімдердің ЕКОЕ-і ${denominator} санына көбейтеміз: ${join(weights)}. `+unitSolution(p.total,weights,values)+` Жауап: ${tuple(values)}.`);
}

export function renderEdition(row){
 assert.equal(row.grade,6);assert.match(row.modelId,/^grade6-division-[a-z-]+$/);
 const result=authored(row);
 if(result.options){
  assert.equal(result.options.length,4);assert.equal(new Set(result.options).size,4,'Four genuinely distinct choices');assert.equal(result.options.filter(v=>v===result.answer).length,1);
  const offset=parseInt(row.editionId.slice(-2),16)%4;result.options=[...result.options.slice(offset),...result.options.slice(0,offset)];
 }else result.statement+=' Жауапты тек санмен жазыңдар.';
 assert.doesNotMatch(result.statement+result.solution,/[\\$]/);
 return result;
}
export function verifyEdition(row){
 const expected=renderEdition(row);
 for(const key of['statement','answer','solution','options'])assert.deepEqual(row[key],expected[key],row.editionId+': altered authored '+key);
 assert.equal(row.sourceRefs.length,1);
 return{answer:expected.answer,checks:['exact rational calculations, integer count and explicit unit constraints','individual source skill retained in an authored condition','multiple answers offered as ordered choices rather than ambiguous text input','independent reviewer required before local Standard publication']};
}
