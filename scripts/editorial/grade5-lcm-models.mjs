/** Source-complete authored draft; no network, publication or self-review. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-lcm-specs.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-9').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=xs=>xs.reduce((a,b)=>a+b,0),prod=xs=>xs.reduce((a,b)=>a*b,1);
const one=xs=>{assert.equal(xs.length,1,'Exactly one correct answer');return xs[0];},list=xs=>xs.join(', '),pair=xs=>xs.join(' және ');
const gcd=(a,b)=>b?gcd(b,a%b):a,lcm=(a,b)=>a/gcd(a,b)*b,lc=ns=>ns.reduce(lcm);
const supers='⁰¹²³⁴⁵⁶⁷⁸⁹',power=(b,e)=>e===1?String(b):String(b)+String(e).split('').map(c=>supers[Number(c)]).join('');
const repr=ps=>ps.length?ps.map(([b,e])=>power(b,e)).join(' × '):'1',pv=ps=>prod(ps.map(([b,e])=>b**e));
const clock=minutes=>`${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}`;
const weekdays=['дүйсенбі','сейсенбі','сәрсенбі','бейсенбі','жұма','сенбі','жексенбі'];
const initial=s=>s[0].toUpperCase()+s.slice(1);
function factors(n){assert.ok(Number.isSafeInteger(n)&&n>0);const out=[];for(let p=2;p*p<=n;p++)while(n%p===0){out.push(p);n/=p;}if(n>1)out.push(n);return out;}
function powers(n){const m=new Map();for(const p of factors(n))m.set(p,(m.get(p)||0)+1);return[...m];}
function proof(ns){const max=new Map();for(const n of ns)for(const[p,e]of powers(n))max.set(p,Math.max(max.get(p)||0,e));const ps=[...max].sort((a,b)=>a[0]-b[0]),n=pv(ps);assert.equal(n,lc(ns));return `${ns.map(n=>`${n} = ${repr(powers(n))}`).join('; ')}. ЕКОЕ-де кез келген бастапқы санда кездесетін әр жай көбейткіш ең үлкен қайталану санымен алынады: ${repr(ps)} = ${n}. Осы міндетті көбейткіштердің біреуі жетіспесе, нәтиже кемінде бір бастапқы санға бөлінбейді; артық көбейткіш қосу мәнді тек үлкейтеді. Тексеру: ${ns.map(d=>`${n} : ${d} = ${n/d}`).join('; ')}.`;}
const multiplesUntil=(step,last)=>range(1,Math.floor(last/step)).map(k=>k*step);
function render(k,p){let s,z,a,options;switch(k){
 case'lcm-first-large-multiple':case'lcm-repeated-larger-multiples':case'lcm-nested-triple':{
  a=lc(p.numbers);const max=Math.max(...p.numbers),ms=multiplesUntil(max,a);s=`ЕКОЕ(${list(p.numbers)}) мәнін еселіктерді іріктеу арқылы табыңдар.`;
  z=`Ең үлкен сан ${max}. Оның өсу ретімен еселіктері ${list(ms)}, … . Оларды қалған сандарға тексереміз: ${ms.map(n=>`${n}: ${p.numbers.filter(d=>d!==max).map(d=>`${d} санына ${n%d===0?'бөлінеді':'бөлінбейді, қалдық '+n%d}`).join(', ')}`).join('; ')}. Бәріне бөлінетін бірінші мән ${a}. Сондықтан ортақ еселіктердің ең кішісі ${a}; бірінші кезіккен жарамды мәнге дейінгі барлық еселік тексерілді.`;break;
 }
 case'lcm-larger-divides':{
  a=lc(p.numbers);options=p.choices.map(String);const small=Math.min(...p.numbers),large=Math.max(...p.numbers);assert.equal(a,large);s=`ЕКОЕ(${list(p.numbers)}) мәнін таңдаңдар.`;
  z=`${large} : ${small} = ${large/small}, сондықтан үлкен сан кіші санға да бөлінеді. Ол өзінің де еселігі. ${large} санынан кіші оң сан ${large} санына бөлінбейді, демек ең кіші ортақ еселік ${large}. ${small} — бұл сандардың ЕҮОБ-і; көбейтінді мен одан кейінгі ортақ еселікті алу минималдық талабын орындамайды.`;break;
 }
 case'lcm-divisibility-property':{
  const n=lc(p.numbers),g=gcd(...p.numbers);a=`ЕКОЕ(${list(p.numbers)}) саны ${p.numbers[0]} және ${p.numbers[1]} сандарына қалдықсыз бөлінеді`;options=[a,`ЕКОЕ(${list(p.numbers)}) = ${g}`,`ЕКОЕ(${list(p.numbers)}) = ${p.numbers.join(' × ')}`,`ЕКОЕ(${list(p.numbers)}) саны ${Math.min(...p.numbers)} санынан кіші`];
  s='Ең кіші ортақ еселіктің мағынасын дұрыс сипаттаған жалғыз тұжырымды таңдаңдар.';
  z=`${proof(p.numbers)} ЕКОЕ ${n} екі санға да бөлінеді, бұл — ортақ еселіктің анықтамасы. ${g} — ЕҮОБ; ${p.numbers.join(' × ')} = ${prod(p.numbers)} ортақ еселік болғанымен, ең кішісі емес. ЕКОЕ ең үлкен бастапқы саннан кіші болмайды.`;break;
 }
 case'common-multiple-choice':{
  a=one(p.choices.filter(n=>p.numbers.every(d=>n%d===0)));options=p.choices.map(String);s=`Қай сан ${p.numbers[0]} және ${p.numbers[1]} сандарының ортақ еселігі болады? Ең кіші болуы міндетті емес.`;
  z=`Әр нұсқа екі санға да бөлінуі керек. ${p.choices.map(n=>`${n}: ${p.numbers.map(d=>`${n} = ${d} × ${Math.floor(n/d)}${n%d?' + '+n%d:''}`).join(', ')}`).join('; ')}. Тек ${a} екі талапты орындайды. ЕКОЕ ${lc(p.numbers)}, ал ${a} — оның ${a/lc(p.numbers)} еселенген мәні; сұрақ кез келген ортақ еселік туралы.`;break;
 }
 case'lcm-equals-product-pair':case'pair-with-fixed-lcm':{
  const values=p.pairs.map(lc);let index=k==='lcm-equals-product-pair'?one(values.flatMap((n,i)=>n===prod(p.pairs[i])?[i]:[])):one(values.flatMap((n,i)=>n===p.target?[i]:[]));options=p.pairs.map(pair);a=options[index];
  s=k==='lcm-equals-product-pair'?'Қай жұптың ЕКОЕ-і сол екі санның көбейтіндісіне тең?':`Қай жұптағы екі натурал санның ең кіші ортақ еселігі ${p.target} болады?`;
  z=`Барлық жұпты тексереміз: ${p.pairs.map((xs,i)=>`${xs.map(n=>`${n} = ${repr(powers(n))}`).join(', ')}; ЕКОЕ = ${values[i]}, көбейтінді ${prod(xs)}, ЕҮОБ ${gcd(...xs)}`).join('; ')}. ${k==='lcm-equals-product-pair'?`Тек ${a} жұбы өзара жай, ортақ жай көбейткіш жоқ. ЕҮОБ × ЕКОЕ = көбейтінді болғандықтан, ЕҮОБ 1 кезінде ғана ЕКОЕ көбейтіндіге тең.`:`Жалғыз сәйкес жұп ${a}. Ортақ жай көбейткіш бар болса, ЕКОЕ көбейтіндіден кіші болуы мүмкін; сондықтан көбейтіндіге қарап қана таңдауға болмайды.`}`;break;
 }
 case'lcm-three-distinct-primes':case'lcm-two-primes':case'lcm-missing-prime-completion':case'lcm-two-shared-prime':case'lcm-prime-maxima-large':case'lcm-three-overlap-support':{
  a=lc(p.numbers);s=`${list(p.numbers)} сандарының ең кіші ортақ еселігін жай көбейткіштерге жіктеп табыңдар.`;z=proof(p.numbers);if(k==='lcm-three-overlap-support')z+=' Бір жай сан екі жіктеуде кездескені үшін оның дәрежелерін қоспаймыз: ең үлкенін ғана аламыз.';break;
 }
 case'listed-factor-lcm':{
  const ns=p.products.map(prod);a=lc(ns);options=p.choices.map(String);s=`a = ${p.products[0].join(' × ')}, b = ${p.products[1].join(' × ')}. ЕКОЕ(a, b) мәнін таңдаңдар.`;
  z=`Берілген көбейткіштерден a = ${ns[0]}, b = ${ns[1]}. ${proof(ns)} Үлкен санның жіктеуін екіншісінде жетіспейтін қайталанумен толықтырамыз; бар көбейткіштерді түгел екінші рет көбейтіп жібермейміз.`;break;
 }
 case'lcm-two-multiple-lists':{
  a=lc(p.numbers);s=`${p.numbers[0]} және ${p.numbers[1]} сандарының еселіктерін жазып, алғашқы ортақ натурал санды табыңдар.`;
  z=`Е(${p.numbers[0]}) = {${list(multiplesUntil(p.numbers[0],a))}, …}; Е(${p.numbers[1]}) = {${list(multiplesUntil(p.numbers[1],a))}, …}. Екі тізімдегі бірінші ортақ мән ${a}. Көбейтінді ${prod(p.numbers)} саны да ортақ еселік, бірақ ${a} санынан үлкен. Еселіктер жиыны шексіз, сондықтан тізімдерде көп нүкте сақталады.`;break;
 }
 case'lcm-definition':{
  a='Берілген натурал сандардың әрқайсысына бөлінетін ең кіші оң натурал сан';options=['Берілген сандардың әрқайсысын бөлетін ең үлкен натурал сан',a,'Берілген сандардың көбейтіндісі','Берілген сандардың ең үлкені'];s='Екі немесе бірнеше натурал санның ең кіші ортақ еселігіне қай анықтама сәйкес келеді?';
  z='Еселік — бастапқы санға бөлінетін сан, ортақ — барлық бастапқы санға бөлінетін, ең кіші — сол оң мәндердің ең кішісі. Мысалы, 6 және 10 үшін ортақ еселіктер 30, 60, 90, …; ең кішісі 30. ЕҮОБ(6, 10) = 2 — басқа ұғым; көбейтінді 60 ең кіші емес, ал ең үлкен бастапқы сан 10 саны 6-ға бөлінбейді.';break;
 }
 case'powered-lcm-choice':case'lcm-power-representation':{
  const ns=p.products.map(pv),n=lc(ns);if(k==='powered-lcm-choice'){a=n;options=p.choices.map(String);}else{options=p.choices.map(repr);a=one(options.filter((_,i)=>pv(p.choices[i])===n));}
  s=`a = ${repr(p.products[0])}, b = ${repr(p.products[1])}. ${k==='lcm-power-representation'?'ЕКОЕ(a, b) жіктелуін жай көбейткіштердің дәрежелерімен таңдаңдар.':'ЕКОЕ(a, b) мәнін таңдаңдар.'}`;
  z=`${proof(ns)} ЕҮОБ үшін тек ортақ негіздердің ең кіші көрсеткіші алынса, ЕКОЕ үшін екі жіктеудің кез келгенінде кездескен барлық негіз ең үлкен көрсеткішпен алынады. Көрсеткіштерді қосу көбейтіндіні береді; жеке бір сандағы негізді тастау да ортақ еселік талабын бұзады.`;break;
 }
 case'least-fixed-digit-common-multiple':case'least-three-digit-common-multiple':{
  const step=lc(p.numbers),lower=10**(p.digits-1),upper=10**p.digits-1,candidates=multiplesUntil(step,upper).filter(n=>n>=lower);a=candidates[0];options=p.choices.map(String);assert.ok(a&&a-step<lower);
  s=`${list(p.numbers)} сандарының әрқайсысына бөлінетін ең кіші ${p.digits} таңбалы натурал санды таңдаңдар.`;
  z=`${proof(p.numbers)} Ортақ еселіктер ${step} санының еселіктері. ${p.digits} таңбалы сандар ${lower} санынан басталады. ${a-step>0?`Алдыңғы ортақ еселік ${a-step} бұл шектен кіші, келесісі ${a}.`:`Алғашқы оң ортақ еселік ${a}, ол осы разрядтық шектен кем емес.`} Сондықтан ең кіші жарамды мән ${a}. Тексеру: ${p.numbers.map(d=>`${a} : ${d} = ${a/d}`).join('; ')}. Одан үлкен жарамды нұсқа минималдықты орындамайды.`;break;
 }
 case'common-multiple-strict-range':{
  const step=lc(p.numbers),valid=range(p.lower+1,p.upper-1).filter(n=>p.numbers.every(d=>n%d===0));a=one(valid);s=`Жинақтағы карточкаларды ${p.numbers[0]} данадан да, ${p.numbers[1]} данадан да қалдықсыз топтастыруға болады. Карточка саны ${p.lower} санынан үлкен және ${p.upper} санынан кіші. Неше карточка бар?`;
  z=`${proof(p.numbers)} Мүмкін сандар ${list(multiplesUntil(step,a+step))}, … . Қатаң ${p.lower} < n < ${p.upper} аралығында тек ${a} бар. Алдыңғысы ${a-step}, келесісі ${a+step} шекарадан тыс. Тексеру: ${p.numbers.map(d=>`${a} : ${d} = ${a/d}`).join('; ')}.`;break;
 }
 case'choose-lcm-input':{
  const values=p.numbers.map(n=>lcm(n,p.fixed));a=p.numbers[one(values.flatMap((n,i)=>n===p.target?[i]:[]))];options=p.numbers.map(String);s=`ЕКОЕ(x, ${p.fixed}) = ${p.target}. Қай x натурал саны осы шартты орындайды?`;
  z=`Нұсқаларды толық тексереміз: ${p.numbers.map((n,i)=>`${n} = ${repr(powers(n))}; ЕКОЕ(${n}, ${p.fixed}) = ${values[i]}`).join('; ')}. Тек ${a} үшін нәтиже ${p.target}. x саны ${p.target} санының бөлгіші болуы қажет, бірақ бұл жалғыз талап емес: барлық жетіспейтін жай көбейткішті де қамтуы керек.`;break;
 }
 case'least-alternative-purchase-budget':{
  a=lc(p.prices);s=`Бір сызғыш ${p.prices[0]} теңге, бір қылқалам ${p.prices[1]} теңге тұрады. Дана бір соманы не тек сызғыштарға, не тек қылқаламдарға түгел жұмсай алады. Екі тауарды араластырып алмайды. Ең кіші оң сома неше теңге?`;
  z=`Екі баламада да сома тиісті бағаға қалдықсыз бөлінеді, сондықтан ең кішісі ЕКОЕ болады. ${proof(p.prices)} ${a} теңгеге ${a/p.prices[0]} сызғыш немесе ${a/p.prices[1]} қылқалам алынады. Бұл екі бөлек балама сатып алу, бір мезгілде екі тауарға төленетін қосынды емес.`;break;
 }
 case'next-departure-clock':case'three-runners-next-clock':case'next-departure-elapsed':{
  const elapsed=lc(p.periods),next=p.startMinutes+elapsed;assert.ok(next<1440);
  if(k==='next-departure-elapsed')a=elapsed;else{options=p.choices.map(clock);a=clock(next);}
  s=k==='three-runners-next-clock'?`Үш жүгіруші ${clock(p.startMinutes)} уақытында бір бастапқы нүктеден қатар жүгіре бастады. Олардың бір айналым уақыты тиісінше ${list(p.periods)} минут және өзгермейді. Үшеуі сол бастапқы нүктеде алғаш рет қайта болғанда сағат неше болады?`:`Екі оқу автобусы ${p.periods[0]} және ${p.periods[1]} минут сайын тұрақты кестемен шығады. Олар ${clock(p.startMinutes)} уақытында бірге шықты. ${k==='next-departure-elapsed'?'Келесі бірлескен шығу неше минуттан кейін болады?':'Келесі рет бірге шыққанда сағат неше болады?'}`;
  z=`Бастапқы сәттен кейінгі бірлескен оқиға әр периодқа бөлінетін оң минут санынан кейін болады. Ең жақыны — ЕКОЕ. ${proof(p.periods)} Өткен уақыт ${elapsed} мин = ${Math.floor(elapsed/60)} сағ ${elapsed%60} мин. Сағат ${clock(p.startMinutes)} + ${elapsed} мин = ${clock(next)}. ${k==='next-departure-elapsed'?`Сұралған жауап сағат емес, өткен минут саны ${elapsed}.`:'Бастапқы сәт қайта кездесу болып саналмайды; барлық периодқа бөлінетін бірінші оң уақыт алынды.'}`;break;
 }
 case'count-common-multiples-below':case'count-common-excluding-prime':{
  const step=lc(p.numbers),all=multiplesUntil(step,p.upper-1),removed=k==='count-common-excluding-prime'?all.filter(n=>n%p.excluded===0):[],valid=all.filter(n=>!removed.includes(n));a=valid.length;
  s=`${p.upper} санынан қатаң кіші, ${p.numbers[0]} және ${p.numbers[1]} сандарына бөлінетін${k==='count-common-excluding-prime'?', бірақ '+p.excluded+' санына бөлінбейтін':''} оң натурал сандар нешеу?`;
  z=`${proof(p.numbers)} ${p.upper} санынан кіші ортақ еселіктер ${list(all)} — ${all.length} сан. ${k==='count-common-excluding-prime'?`Олардың ішінен ${p.excluded} санына да бөлінетіндері ${list(removed)} — ${removed.length} сан. Қалған саны ${all.length} − ${removed.length} = ${a}.`:`Саны ${a}. ${step*(all.length+1)} келесі еселік болып, қатаң шекке кірмейді.`} 0 оң натурал сан емес, оны есептемейміз.`;break;
 }
 case'least-common-plus-remainder':{
  const step=lc(p.divisors);a=step+p.remainder;options=p.choices.map(String);assert.ok(p.divisors.every(d=>p.remainder<d));s=`Карточкаларды ${list(p.divisors)} данадан бөліп салғанда әр жолы ${p.remainder} карточка артылады. Карточка саны ${p.remainder} санынан үлкен. Ең аз неше карточка болуы мүмкін?`;
  z=`Артық ${p.remainder} карточканы алып қойғанда, қалған оң сан барлық бөлгішке бөлінеді. ${proof(p.divisors)} Ең кіші қалдықсыз бөлік ${step}, демек карточка саны ${step} + ${p.remainder} = ${a}. Тексеру: ${p.divisors.map(d=>`${a} = ${d} × ${step/d} + ${p.remainder}`).join('; ')}. ${p.remainder} санының өзі шарттағы төменгі шектен шығарылған.`;break;
 }
 case'recurrence-weekday':{
  const days=lc(p.periods),offset=days%7,end=(p.startWeekday+offset)%7;options=p.choices.map(i=>weekdays[i]);a=weekdays[end];s=`Үш дос кітапханаға тиісінше ${list(p.periods)} күн сайын барады. Кестелері өзгермейді. ${initial(weekdays[p.startWeekday])} күні үшеуі бірге барды. Одан кейін алғаш рет қайта бірге барған күн аптаның қай күні болады?`;
  z=`Бірге бару аралығы ЕКОЕ(${list(p.periods)}) күнге тең. ${proof(p.periods)} ${days} = 7 × ${Math.floor(days/7)} + ${offset}, яғни толық апталардан кейін тағы ${offset} күн өтеді. ${initial(weekdays[p.startWeekday])} күнінен ${offset} күн кейін ${a} болады. Бастапқы күн өткен күндердің бірі ретінде қосылмайды.`;break;
 }
 case'footprints-inclusive-path':{
  const distance=p.distanceMetres*100,step=lc(p.stepsCm),points=range(0,Math.floor(distance/step)).map(i=>i*step);assert.equal(distance%step,0);a=points.length;
  s=`Екі адам бір бастапқы нүктеден бір бағытта түзу ${p.distanceMetres} м жол жүрді. Қадам ұзындықтары тұрақты: ${p.stepsCm[0]} см және ${p.stepsCm[1]} см. Олардың іздері сәйкес келетін нүктелерді бастапқы және соңғы нүктені де қосып санағанда неше нүкте болады?`;
  z=`Қашықтық ${distance} см. Іздер сәйкес келу аралығы ЕКОЕ(${list(p.stepsCm)}) см. ${proof(p.stepsCm)} Барлық сәйкес нүктелер ${list(points)} см. Аралық саны ${distance} : ${step} = ${points.length-1}, ал екі шетімен нүктелер саны ${points.length-1} + 1 = ${a}. Соңғы нүктеде де екі із бар: ${p.stepsCm.map(d=>`${distance} : ${d} = ${distance/d}`).join('; ')}.`;break;
 }
 case'gcd-from-product-lcm':{
  assert.equal(prod(p.witness),p.product);assert.equal(lc(p.witness),p.lcm);a=p.product/p.lcm;assert.equal(a,gcd(...p.witness));options=p.choices.map(String);s=`Екі натурал санның көбейтіндісі ${p.product}, ал ЕКОЕ-і ${p.lcm}. Олардың ең үлкен ортақ бөлгішін таңдаңдар.`;
  z=`Әр жай санның екі көрсеткіші үшін ең кішісі мен ең үлкенінің қосындысы бастапқы екі көрсеткіштің қосындысына тең. Сондықтан ЕҮОБ(a, b) × ЕКОЕ(a, b) = a × b. ЕҮОБ = ${p.product} : ${p.lcm} = ${a}. Мұндай сандар шынымен бар: ${pair(p.witness)}; көбейтіндісі ${p.product}, ЕҮОБ ${gcd(...p.witness)}, ЕКОЕ ${lc(p.witness)}. Қосымша тексеру: ${a} × ${p.lcm} = ${p.product}.`;break;
 }
 case'least-one-below-divisors':{
  const step=lc(p.divisors);a=step-1;options=p.choices.map(String);s=`Натурал санды ${p.divisors.map(d=>`${d} санына бөлгенде ${d-1}`).join(', ')} қалдық қалады. Осы талапты орындайтын ең кіші санды таңдаңдар.`;
  z=`Әр қалдық өз бөлгішінен 1-ге кем. Санға 1 қоссақ, ол барлық бөлгішке қалдықсыз бөлінеді. ${proof(p.divisors)} Ең кіші сан ${step} − 1 = ${a}. Тексеру: ${p.divisors.map(d=>`${a} = ${d} × ${(a-(d-1))/d} + ${d-1}`).join('; ')}. ${2*step-1} да жарамды, бірақ ең кішісі емес.`;break;
 }
 case'count-all-lcm-inputs':{
  const divisors=range(1,p.target).filter(n=>p.target%n===0),valid=divisors.filter(n=>lcm(n,p.fixed)===p.target);a=valid.length;options=p.choices.map(String);s=`ЕКОЕ(x, ${p.fixed}) = ${p.target} болатын натурал x сандары нешеу?`;
  z=`ЕКОЕ x санына бөлінеді, сондықтан x тек ${p.target} санының бөлгіші бола алады. Толық бөлгіштер тізімі ${list(divisors)}. Әрқайсысын тексергенде ЕКОЕ ${p.target} беретіндері ${list(valid)}. Барлығы ${a}. Қалған бөлгіштерде бастапқы ${p.fixed} санын ${p.target} мәніне жеткізетін жай көбейткіш жетіспейді немесе оның қажетті қайталануы жоқ. Тек ең кіші x мәнін табу бұл сұраққа толық жауап емес.`;break;
 }
 case'other-input-from-gcd-lcm':{
  a=p.gcd*p.lcm/p.known;assert.equal(gcd(p.known,a),p.gcd);assert.equal(lcm(p.known,a),p.lcm);options=p.choices.map(String);s=`a = ${p.known}, ЕҮОБ(a, b) = ${p.gcd}, ЕКОЕ(a, b) = ${p.lcm}. b натурал санын таңдаңдар.`;
  z=`Кез келген жай сан үшін min(r, s) + max(r, s) = r + s. Сондықтан ЕҮОБ × ЕКОЕ = a × b. Мұнда ${p.gcd} × ${p.lcm} = ${p.gcd*p.lcm}, демек b = ${p.gcd*p.lcm} : ${p.known} = ${a}. Екі шартты бөлек тексереміз: ${p.known} = ${repr(powers(p.known))}, ${a} = ${repr(powers(a))}; ең кіші ортақ көрсеткіштер ЕҮОБ ${p.gcd}, ең үлкендері ЕКОЕ ${p.lcm} береді. ЕКОЕ дұрыс шыққанының өзі жеткіліксіз: қалған нұсқалардың ЕҮОБ-і де талапқа сай болуы керек.`;break;
 }
 case'three-schedules-inclusive-window':case'three-lights-inclusive-seconds':{
  const step=lc(p.periods),duration=k==='three-lights-inclusive-seconds'?p.durationMinutes*60:p.endMinutes-p.startMinutes,points=range(0,Math.floor(duration/step)).map(i=>i*step);assert.equal(duration%step,0);a=points.length;
  s=k==='three-lights-inclusive-seconds'?`Үш шам бастапқы сәтте бірге жанды. Содан кейін олар тиісінше ${list(p.periods)} секунд сайын жанады. ${p.durationMinutes} минут ішінде, алғашқы сәт пен соңғы секундты да қосқанда, үшеуі неше рет бірге жанады?`:`Үш оқу автобусы ${list(p.periods)} минут сайын шығады. Олар ${clock(p.startMinutes)} уақытында бірге шықты және осы кестемен ${clock(p.endMinutes)} уақытына дейін жүреді. Екі шеткі сәтті де қоса, осы аралықта үшеуі неше рет бірге шығады?`;
  z=`${proof(p.periods)} Ортақ оқиға аралығы ${step} ${k==='three-lights-inclusive-seconds'?'секунд':'минут'}. Бақылау ұзақтығы ${duration} сол бірлікпен. Бастапқы сәтке қатысты ығысулар ${list(points)}. ${duration} : ${step} = ${points.length-1} аралық, нүктелер саны ${points.length-1} + 1 = ${a}. Алғашқы сәт те, ең соңғы сәт те ортақ оқиғаға сәйкес келеді; оларды қалдырмаймыз.`;break;
 }
 case'minimum-items-exact-coin-payment':{
  const budget=lcm(p.price,p.coin);a=budget/p.price;s=`Бір бетбелгі ${p.price} теңге тұрады. Әлиде тек ${p.coin} теңгелік тиындар бар, сатушы қайтарым бере алмайды. Ақшаны дәл төлеп, кемінде бір бетбелгі алу үшін ең аз неше бетбелгі сатып алу керек?`;
  z=`Жалпы төлем бетбелгі бағасына да, тиын құнына да бөлінеді. Ең кіші төлем ЕКОЕ(${p.price}, ${p.coin}). ${proof([p.price,p.coin])} Бетбелгі саны ${budget} : ${p.price} = ${a}, тиын саны ${budget} : ${p.coin} = ${budget/p.coin}. Сұралғаны төлем не тиын емес, бетбелгі саны. Тексеру: ${a} × ${p.price} = ${budget/p.coin} × ${p.coin} = ${budget}.`;break;
 }
 case'least-remainder-with-extra-divisor':{
  const step=lc(p.divisors),candidates=[];let n=p.remainder;while(true){if(n>0)candidates.push(n);if(n>0&&n%p.extra===0)break;n+=step;assert.ok(candidates.length<=p.extra+1);}a=n;options=p.choices.map(String);assert.ok(p.divisors.every(d=>p.remainder<d));
  s=`Натурал санды ${list(p.divisors)} сандарының әрқайсысына бөлгенде ${p.remainder} қалдық қалады. Ал ${p.extra} санына қалдықсыз бөлінеді. Осындай ең кіші санды таңдаңдар.`;
  z=`Артық ${p.remainder} санын алып қойсақ, қалғаны барлық алғашқы бөлгішке бөлінеді. ${proof(p.divisors)} Үміткерлер ${step}k + ${p.remainder}, k — теріс емес бүтін сан. Кезекпен тексереміз: ${candidates.map(v=>`${v} = ${p.extra} × ${Math.floor(v/p.extra)}${v%p.extra?' + '+v%p.extra:''}`).join('; ')}. Бірінші қалдықсыз мән ${a}. Бұған дейінгі барлық үміткер тексерілді. Тексеру: ${p.divisors.map(d=>`${a} = ${d} × ${(a-p.remainder)/d} + ${p.remainder}`).join('; ')}.`;break;
 }
 case'lcm-equals-first-guarantee':{
  a='a саны b санына қалдықсыз бөлінеді';options=['a және b міндетті түрде өзара жай','b саны a санына қалдықсыз бөлінеді','a = b²',a];s='a және b — натурал сандар, ЕКОЕ(a, b) = a. Қай тұжырым міндетті түрде дұрыс?';
  z='ЕКОЕ анықтамасы бойынша b санына да бөлінеді. ЕКОЕ a санының өзіне тең, сондықтан a міндетті түрде b санына бөлінеді. Қалғандарына бір қарсы мысал жеткілікті: a = 30, b = 10 болса, ЕКОЕ 30, бірақ ЕҮОБ 10 болғандықтан өзара жай емес; 10 саны 30-ға бөлінбейді; 30 саны 10² = 100 мәніне тең емес. Дұрыс қорытынды бір мысалдан емес, анықтамадан шықты.';break;
 }
 case'lcm-minus-gcd':{
  const large=lc(p.numbers),small=p.numbers.reduce(gcd);a=large-small;s=`${p.numbers[0]} және ${p.numbers[1]} сандарының ЕКОЕ-і олардың ЕҮОБ-інен қаншаға артық?`;
  z=`${proof(p.numbers)} ЕҮОБ үшін тек ортақ жай негіздердің ең кіші көрсеткіштері алынады: ЕҮОБ = ${small}. Сұралған айырма ${large} − ${small} = ${a}. Көбейтінді ${prod(p.numbers)} ЕКОЕ-нің орнына жүрмейді, өйткені сандар өзара жай емес.`;break;
 }
 case'same-origin-sequence-intersection':{
  const step=lc(p.steps),points=range(0,Math.floor((p.upper-p.start)/step)).map(i=>p.start+i*step);a=points.length;
  s=`Мұрат ${p.start} санынан бастап әр жолы ${p.steps[0]} қосады: ${list(range(0,3).map(i=>p.start+i*p.steps[0]))}, … . Аружан да ${p.start} санынан бастап әр жолы ${p.steps[1]} қосады: ${list(range(0,3).map(i=>p.start+i*p.steps[1]))}, … . Екеуі де ${p.upper} санынан аспайтын мүшелерді ғана жазады. Екі тізімде қатар кездесетін сан нешеу?`;
  z=`Әр ортақ саннан ${p.start} алғанда, екі қадамға да бөлінетін сан немесе 0 шығады. ${proof(p.steps)} Ортақ сандар ${list(points)}. Келесісі ${points.at(-1)+step} шектен асады. Барлығы ${a}; алғашқы ${p.start} саны да екі тізімде бар. «Аспайтын» деген шарт ${p.upper} шеткі мәнін де қосады.`;break;
 }
 case'least-all-initial-divisors':{
  const ns=range(1,p.last);a=lc(ns);s=`1-ден ${p.last} санына дейінгі барлық натурал сандардың әрқайсысына қалдықсыз бөлінетін ең кіші оң натурал санды табыңдар.`;
  z=`Ізделетін мән ЕКОЕ(1, 2, …, ${p.last}). ${proof(ns)} Барлық жай сандарды бір реттен ғана алу жеткіліксіз: олардың жоғарғы дәрежелері де қамтылуы керек. Барлық сандарды түгел көбейту ортақ еселік береді, бірақ қайталанатын көбейткіштерді артық қосып, минималдықты бұзады.`;break;
 }
 case'unknown-lcm-prime-exponent':{
  const target=p.prime**p.targetExponent*p.firstOther**p.otherExponent;a=p.targetExponent;options=p.choices.map(String);s=`k — натурал сан. ЕКОЕ(${p.prime}ᵏ × ${p.firstOther}, ${p.prime} × ${power(p.firstOther,p.otherExponent)}) = ${target}. k неге тең?`;
  z=`${target} = ${repr(powers(target))}. ${p.firstOther} негізінің ең үлкен көрсеткіші ${p.otherExponent}; ол екінші саннан алынады. ${p.prime} негізінің ең үлкен көрсеткіші k мен 1 арасынан алынады және ${p.targetExponent} болуы керек. ${p.targetExponent} > 1 болғандықтан, k = ${p.targetExponent}. Нұсқалар бойынша ЕКОЕ мәндері: ${p.choices.map(v=>`k = ${v} кезінде ${lcm(p.prime**v*p.firstOther,p.prime*p.firstOther**p.otherExponent)}`).join('; ')}. Тек дұрыс көрсеткіш берілген ${target} мәнін береді.`;break;
 }
 case'consecutive-lcm-sum':{
  const first=one(range(1,Math.floor(Math.sqrt(p.lcm))).filter(n=>n*(n+1)===p.lcm));a=2*first+1;options=p.choices.map(String);s=`Қатар келген екі натурал санның ЕКОЕ-і ${p.lcm}. Осы екі санның қосындысын таңдаңдар.`;
  z=`Қатар келген n және n + 1 сандарының ортақ бөлгіші айырма 1 санын да бөледі, сондықтан олар өзара жай. ЕКОЕ олардың көбейтіндісі болады: n × (n + 1) = ${p.lcm}. ${first-1} × ${first} = ${(first-1)*first}, ал ${first} × ${first+1} = ${p.lcm}. Көбейтінді n артқанда қатаң өседі, сондықтан жұп біреу. Қосынды ${first} + ${first+1} = ${a}. ЕКОЕ ${p.lcm} сұралған қосынды емес.`;break;
 }
 case'two-alarm-union-window':{
  const duration=p.endMinutes-p.startMinutes,first=range(0,Math.floor(duration/p.periods[0])).map(i=>i*p.periods[0]),second=range(0,Math.floor(duration/p.periods[1])).map(i=>i*p.periods[1]),both=first.filter(n=>second.includes(n));a=new Set([...first,...second]).size;
  s=`Екі дабыл ${clock(p.startMinutes)} уақытында қатар шылдырлады. Біріншісі әр ${p.periods[0]}, екіншісі әр ${p.periods[1]} минут сайын шылдырлайды. ${clock(p.startMinutes)} мен ${clock(p.endMinutes)} аралығында, екі шеткі сәтті де қосқанда, кемінде бір дабылдың дыбысы естілген сәттер нешеу? Екеуі қатар шылдырласа, ол бір сәт деп саналады.`;
  z=`Бақылау ұзақтығы ${duration} минут. Бірінші дабыл ығысулары ${list(first)} — ${first.length} сәт. Екіншісінікі ${list(second)} — ${second.length} сәт. ${proof(p.periods)} Қатар шылдырлау ығысулары ${list(both)} — ${both.length} сәт; олар екі тізімде де саналды. Барлық бөлек сәт саны ${first.length} + ${second.length} − ${both.length} = ${a}. Тек бірге шылдырлау саны емес, екі тізімнің бірігуі сұралған.`;break;
 }
 case'interval-without-common-multiple':{
  const step=lc(p.divisors),values=p.intervals.map(([a,b])=>range(a+1,b-1).filter(n=>p.divisors.every(d=>n%d===0))),index=one(values.flatMap((xs,i)=>xs.length===0?[i]:[]));options=p.intervals.map(([a,b])=>`${a} мен ${b} арасында`);a=options[index];
  s=`${list(p.divisors)} сандарының әрқайсысына бөлінетін натурал сан қай аралықта жоқ? Барлық аралық ашық: екі шеткі сан есептелмейді.`;
  z=`${proof(p.divisors)} Мүмкін сандар ${step} санының еселіктері. Аралықтарды тексерсек: ${p.intervals.map(([lo,hi],i)=>`${lo} < n < ${hi}: ${values[i].length?list(values[i]):'бірде-бір еселік жоқ'}`).join('; ')}. Бірінші аралықтағы ${p.intervals[0][0]} және ${p.intervals[0][1]} шеттері өздері ортақ еселік болғанымен, ашық аралыққа кірмейді.`;break;
 }
 default:throw Error('Unsupported saved lcm skill '+k);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{assert.match(String(a),/^\d+$/);s+=' Жауапқа тек санды жазыңыз.';}
 assert.ok(!/[\\$]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(spec=>['grade5-lcm-'+spec.id,spec]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,'grade5-lcm-'+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);const topic=['choose-lcm-input','gcd-from-product-lcm','least-one-below-divisors','least-remainder-with-extra-divisor','count-all-lcm-inputs','other-input-from-gcd-lcm','unknown-lcm-prime-exponent','consecutive-lcm-sum'].includes(spec.kind)?'eq':spec.kind==='same-origin-sequence-intersection'?'seq':'num';return{editionId:'grade5-lcm-'+spec.id,modelId:'grade5-lcm-'+spec.kind,grade:5,topic,difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Барлық 48 бастапқы шарт, толық шешім және барлық нұсқа жеке оқылды. Ортақ еселік пен ең кіші еселік, ЕҮОБ пен ЕКОЕ, өткен уақыт пен сағаттағы уақыт, нүкте саны мен аралық саны жеке ажыратылды.',
 'Қазақша шарт пен сандар әр дереккөз үшін қайта жазылды. Қалдықты алып тастау не 1 қосу, қатаң сан шектері, басталу/аяқталу сәттері, барлық мүмкін x, әр дабылдың сәттерінің бірігуі және бастапқы нүктедегі кездесу сақталды.',
 'Сандық редакция жаңа математикалық мағына деп саналмайды. Ашық жауаптар бүтін санмен ғана; сағат, апта күні, толық жіктеу, жұп және аралық MCQ арқылы беріледі. Минималдық үшін барлық алдыңғы үміткер не міндетті жай көрсеткіштер дәлелі көрсетілді.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const rendered=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(rendered[field]),'Unbound lcm '+field);assert.equal(row.answer,rendered.answer);assert.ok(!/[\\$]/.test(row.statement+row.solution));return{answer:rendered.answer,checks:['individual saved lcm and recurrence skill linked to exact source parameters','max prime exponents, exact remainder and complete bounded candidate domains','start/end inclusion, union versus intersection and requested quantity retained','native conditions solutions MCQ keys and metadata exactly bound','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All 48 already saved nonvisual grade5 topic2.9 sources individually rewritten. Numerical variants and named model forms are not independent semantic meanings. Awaiting independent content review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-lcm.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
