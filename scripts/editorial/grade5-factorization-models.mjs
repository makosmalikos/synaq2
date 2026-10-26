/** Source-complete, offline authored draft for grade5 topic2.7. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-factorization-specs.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-7').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const sum=xs=>xs.reduce((a,b)=>a+b,0),product=xs=>xs.reduce((a,b)=>a*b,1);
const one=xs=>{assert.equal(xs.length,1,'Exactly one required answer');return xs[0];};
const int=n=>assert.ok(Number.isSafeInteger(n)&&n>0,'Positive safe integer required');
const supers='⁰¹²³⁴⁵⁶⁷⁸⁹',sup=n=>String(n).split('').map(c=>supers[Number(c)]).join('');
const pow=(b,e)=>e===1?String(b):`${b}${sup(e)}`;
const list=xs=>xs.join(', '),times=xs=>xs.join(' × ');
function prime(n){if(!Number.isSafeInteger(n)||n<2)return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;}
function factors(n){int(n);const result=[];for(let d=2;d*d<=n;d++)while(n%d===0){result.push(d);n/=d;}if(n>1)result.push(n);return result;}
function powers(n){const map=new Map();for(const p of factors(n))map.set(p,(map.get(p)||0)+1);return[...map];}
const repr=ps=>ps.map(([b,e])=>pow(b,e)).join(' × ');
const pv=ps=>product(ps.map(([b,e])=>b**e));
const expanded=ps=>ps.flatMap(([b,e])=>Array(e).fill(b));
function divisionProof(n){let remaining=n;return factors(n).map(p=>{const next=remaining/p,line=`${remaining} : ${p} = ${next}`;remaining=next;return line;}).join('; ');}
function decomposition(n){const fs=factors(n);assert.equal(product(fs),n);return `${n} = ${times(fs)}${powers(n).some(([,e])=>e>1)?' = '+repr(powers(n)):''}`;}
const divisors=n=>range(1,n).filter(d=>n%d===0);
const sign=(a,b)=>a<b?'<':a>b?'>':'=';
const tuple=xs=>xs.join('; ');
function render(k,p){let a,s,z,options;switch(k){
 case'largest-prime-small':case'largest-prime-odd':{
  const fs=factors(p.number);assert.ok(fs.length>=3);if(k==='largest-prime-odd')assert.ok(p.number%2&&new Set(fs).size===3);a=Math.max(...fs);
  s=k==='largest-prime-small'?`Құрылғы ${p.number} бөлшектен тұрады. Осы санды жай көбейткіштерге жіктеп, жіктелудегі ең үлкен жай санды табыңдар.`:`Архивтегі ${p.number} нөмірін жай көбейткіштерге жіктеңдер. Қай жай көбейткіш ең үлкен?`;
  z=`Санды жай бөлгіштерге біртіндеп бөлеміз: ${divisionProof(p.number)}. Сондықтан ${decomposition(p.number)}. Барлық жай көбейткіштер ${list(fs)}; олардың ең үлкені ${a}. Тексеру: ${times(fs)} = ${p.number}.`;break;
 }
 case'factor-list-choice':{
  const valid=p.products.map(fs=>product(fs)===p.number&&fs.every(prime));const index=one(valid.flatMap((v,i)=>v?[i]:[]));options=p.products.map(times);a=options[index];
  s=`Жинақта ${p.number} ұсақ бөлшек бар. ${p.number} санын тек жай сандардың көбейтіндісі түрінде толық көрсеткен нұсқаны таңдаңдар.`;
  z=`Бағанмен бөлу: ${divisionProof(p.number)}. Толық жіктеу ${decomposition(p.number)}. Нұсқаларды жеке тексереміз: ${p.products.map((fs,i)=>`${options[i]} = ${product(fs)}${fs.some(n=>!prime(n))?'; '+fs.filter(n=>!prime(n)).map(n=>n===1?'1 жай сан емес':`${n} — құрама сан`).join(', '):'; барлық көбейткіш жай'}`).join('. ')}. Мәннің тең болуы жеткіліксіз: көбейткіштердің бәрі жай және көбейтіндісі ${p.number} болуы керек.`;break;
 }
 case'only-prime-factors-choice':{
  const index=one(p.products.flatMap((fs,i)=>fs.every(prime)?[i]:[]));options=p.products.map(times);a=options[index];
  s='Есеп парағындағы көбейтінділердің қайсысы бір санның аяқталған жай көбейткіштерге жіктелуі бола алады?';
  z=`Әрбір көбейткіш жай сан болуы қажет. ${p.products.map((fs,i)=>`${options[i]}: ${fs.every(prime)?fs.map(n=>`${n} жай сан`).join(', '):fs.filter(n=>!prime(n)).map(n=>n===1?'1 саны жай да, құрама да емес':`${n} = ${times(factors(n))}, яғни құрама сан`).join('; ')}`).join('. ')}. Сондықтан тек ${a} жарайды.`;break;
 }
 case'least-prime-basic':case'least-prime-long-search':{
  a=factors(p.number)[0];const checked=range(2,a).filter(prime);assert.ok(checked.length>=5);
  s=`Жинақта ${p.number} бөлшек бар. Осы санның ең кіші жай бөлгішін анықтаңдар.`;
  z=`Жай сандарды өсу ретімен тексереміз: ${checked.map(d=>`${p.number} = ${d} × ${Math.floor(p.number/d)}${p.number%d?' + '+p.number%d:''}`).join('; ')}. ${a} санынан кіші тексерілген жай сандардың барлығында қалдық нөл емес. Ал ${p.number} : ${a} = ${p.number/a}, қалдық 0. Демек, ең кіші жай бөлгіш ${a}; ${decomposition(p.number)}.`;break;
 }
 case'cancel-listed-factors':{
  assert.ok([...p.numerator,...p.denominator].every(prime));const left=[...p.numerator];for(const f of p.denominator){const i=left.indexOf(f);assert.ok(i>=0);left.splice(i,1);}a=product(left);
  s=`Екі топтама саны a = ${times(p.numerator)} және b = ${times(p.denominator)} түрінде берілген. a : b бөліндісін табыңдар.`;
  z=`a ішінде b санының барлық жай көбейткіштері бар. Оларды топтасақ, a = (${times(p.denominator)}) × ${times(left)} = b × ${a}. Сондықтан a : b = ${a}. Санмен тексеру: a = ${product(p.numerator)}, b = ${product(p.denominator)}, ${product(p.denominator)} × ${a} = ${product(p.numerator)}.`;break;
 }
 case'power-factor-choice':{
  assert.ok(p.products.every(ps=>ps.every(([b,e])=>Number.isInteger(b)&&b>1&&Number.isInteger(e)&&e>=1)));
  const index=one(p.products.flatMap((ps,i)=>pv(ps)===p.number&&ps.every(([b])=>prime(b))?[i]:[]));options=p.products.map(repr);a=options[index];
  s=`${p.number} санын жай көбейткіштердің дәрежелері арқылы толық әрі дұрыс көрсеткен жазуды таңдаңдар.`;
  z=`Жай санға бөлгендегі тізбек: ${divisionProof(p.number)}. Демек, ${decomposition(p.number)}. Әр нұсқаның мәні мен негіздерін тексереміз: ${p.products.map((ps,i)=>`${options[i]} = ${pv(ps)}${ps.some(([b])=>!prime(b))?'; '+ps.filter(([b])=>!prime(b)).map(([b])=>`${b} негізі құрама`).join(', '):'; барлық негіз жай сан'}`).join('. ')}. Дәреженің негізі құрама болса, мәні дұрыс шықса да, бұл толық жай көбейткіштерге жіктеу емес.`;break;
 }
 case'reconstruct-listed-primes':{
  assert.ok(p.factors.every(prime));a=product(p.factors);s=`Қойма кодының жай көбейткіштері ретімен ${list(p.factors)} деп жазылған. Бұл қандай натурал сан?`;
  const intermediate=[];let v=1;for(const f of p.factors){const next=v*f;intermediate.push(`${v} × ${f} = ${next}`);v=next;}
  z=`Жіктелген сан барлық көбейткіштердің көбейтіндісі: ${intermediate.join('; ')}. Сондықтан сан ${a}. Қайталанған жай сан жеке көбейткіш ретінде қайта алынады. Кері тексеру: ${divisionProof(a)}.`;break;
 }
 case'factor-order-uniqueness':{
  assert.ok(p.factors.every(prime));const reverse=[...p.factors].reverse(),n=product(p.factors);a='Екеуі де дұрыс: жай көбейткіштердің реті ғана өзгеше';options=['Тек Меруерттің жазуы дұрыс','Тек Арсеннің жазуы дұрыс','Екі жазу да қате',a];
  s=`Меруерт ${n} = ${times(p.factors)} деп, Арсен ${n} = ${times(reverse)} деп жазды. Екі жай көбейткіштерге жіктеу туралы дұрыс тұжырымды таңдаңдар.`;
  z=`Меруерттің көбейткіштері: ${list(p.factors)}. Арсенде дәл сол жай сандар дәл сондай қайталану санымен бар: ${list(reverse)}. Орындарын ауыстыру көбейтіндіні өзгертпейді: екі мән де ${n}. Жай жіктеудің бірегейлігі көбейткіштердің ретіне қатысты емес, олардың құрамы мен қайталану санына қатысты. Сондықтан екі жазу да дұрыс.`;break;
 }
 case'reconstruct-powered-primes':{
  assert.ok(p.factors.every(([b])=>prime(b)));a=pv(p.factors);s=`Санның жай жіктеуі ${repr(p.factors)} түрінде берілген. Санның өзін жазыңдар.`;
  z=`Дәрежелерді ашамыз: ${repr(p.factors)} = ${times(expanded(p.factors))}. Олардың мәндері ${p.factors.map(([b,e])=>`${pow(b,e)} = ${b**e}`).join('; ')}. Барлық көбейткіштің көбейтіндісі ${a}. Тексеру: ${divisionProof(a)}.`;break;
 }
 case'prime-square-side':{
  a=one(range(2,p.area).filter(n=>prime(n)&&n*n===p.area));s=`Шаршы ағаш тақтайдың ауданы ${p.area} см². Қабырғасының сантиметрмен алынған ұзындығы — жай сан. Бір қабырғасының ұзындығы неше сантиметр?`;
  z=`Шаршы ауданы қабырға ұзындығын өзіне көбейткенге тең. ${divisionProof(p.area)}. Сондықтан ${p.area} = ${a} × ${a} = ${pow(a,2)}. ${a} — жай сан. Қабырға ${a} см, ал ${a} × ${a} = ${p.area} см² бастапқы ауданды береді. Ауданның өлшемін ұзындықтың өлшемімен шатастырмаймыз.`;break;
 }
 case'smallest-odd-prime-product':{
  const ps=range(3,100).filter(n=>prime(n)&&n%2).slice(0,p.count);assert.equal(ps.length,p.count);a=product(ps);
  s=`Белгісіз санның жай жіктеуінде ең кіші ${p.count} тақ жай санның әрқайсысы бір реттен кездеседі, басқа көбейткіш жоқ. Белгісіз санды табыңдар.`;
  z=`Жай сандардың басы 2, 3, 5, 7, 11, 13, … . 2 — жұп, оны алмаймыз. Қажетті тақ жай сандар ${list(ps)}. Әрқайсысы бір реттен болғандықтан, сан ${times(ps)} = ${a}. Кері тексеру: ${divisionProof(a)}. 2 санын қосу «тақ» талабын, ал бір жай санды қайталау «әрқайсысы бір рет» талабын бұзады.`;break;
 }
 case'prime-box-dimensions':{
  const index=one(p.choices.flatMap((xs,i)=>xs.length===3&&xs.every(prime)&&product(xs)===p.volume?[i]:[]));options=p.choices.map(xs=>xs.map(n=>`${n} дм`).join('; '));a=options[index];
  s=`Тікбұрышты жәшіктің ішкі көлемі ${p.volume} дм³. Ұзындығы, ені мен биіктігінің дециметрмен алынған мәндері — жай сандар. Үш өлшемді таңдаңдар; олардың өзара реті маңызды емес.`;
  z=`Көлем үш өлшемнің көбейтіндісі, сондықтан ${decomposition(p.volume)}. Нұсқалардың көлемдері ретімен ${list(p.choices.map(product))} дм³. Ал алғашқы екі нұсқада 1 және құрама өлшемдер бар; 1 жай сан емес. Дұрыс өлшемдер ${a}: ${times(p.choices[index])} = ${p.volume} дм³, үшеуі де жай сан.`;break;
 }
 case'count-distinct-primes':case'sum-distinct-primes':{
  const fs=factors(p.number),unique=[...new Set(fs)];a=k==='count-distinct-primes'?unique.length:sum(unique);
  s=k==='count-distinct-primes'?`${p.number} санын жай көбейткіштерге жіктеңдер. Онда неше әртүрлі жай сан бар?`:`Техникалық тізімдегі ${p.number} санын жай көбейткіштерге жіктеп, әртүрлі жай көбейткіштерінің қосындысын табыңдар. Әр жай санды бір рет қана қосыңдар.`;
  z=`Бөлу тізбегі: ${divisionProof(p.number)}. ${decomposition(p.number)}. Әртүрлі жай көбейткіштер ${list(unique)}. ${k==='count-distinct-primes'?`Олардың саны ${a}. Қайталану санына емес, бөлек жай сандарға қараймыз.`:`Сондықтан қосынды ${unique.join(' + ')} = ${a}. Барлық қайталанғандарын қоссақ, ${fs.join(' + ')} = ${sum(fs)} шығар еді; ол сұралған қосынды емес.`}`;break;
 }
 case'restricted-prime-support':{
  assert.ok(p.allowed.every(prime));const supports=p.numbers.map(n=>[...new Set(factors(n))]),index=one(supports.flatMap((ps,i)=>canonicalEdition([...ps].sort((a,b)=>a-b))===canonicalEdition([...p.allowed].sort((a,b)=>a-b))?[i]:[]));a=p.numbers[index];options=p.numbers.map(String);
  s=`Қай санның жай жіктеуінде ${p.allowed[0]} және ${p.allowed[1]} жай сандарының екеуі де бар, ал басқа жай көбейткіш жоқ?`;
  z=`Төрт санды жіктейміз: ${p.numbers.map(decomposition).join('; ')}. ${a} санында тек ${p.allowed.join(' мен ')} бар. Қалған нұсқалардың әрқайсысында бөтен жай көбейткіш кездеседі: ${supports.filter((_,i)=>i!==index).map(ps=>ps.filter(n=>!p.allowed.includes(n)).join(', ')).join('; ')}. Қажетті екі жай санның тек біреуінің болуы да жеткіліксіз.`;break;
 }
 case'compare-prime-products':{
  const left=repr(p.first),right=repr(p.second),x=pv(p.first),y=pv(p.second),rel=sign(x,y);assert.ok(p.first[0][1]>p.second[1][1]&&x<y);a=`${left} ${rel} ${right}`;options=[`${left} > ${right}`,`${left} = ${right}`,a,'Салыстыру мүмкін емес'];
  const shared=product(p.first.filter(([b])=>p.second.some(([c])=>c===b)).map(([b,e])=>b**Math.min(e,p.second.find(([c])=>b===c)[1])));
  s=`${left} және ${right} көбейтінділерін салыстырыңдар.`;
  z=`Дәрежелерді жеке есептесек, ${left} = ${x}, ${right} = ${y}. Демек, ${x} ${rel} ${y}. Ортақ ${shared} көбейткішін шығарсақ, қалған мәндер ${x/shared} және ${y/shared}; олар да осы ретпен салыстырылады. Көрсеткіштердің өздерін ғана салыстыруға болмайды: негіздер әртүрлі.`;break;
 }
 case'ordered-prime-array':{
  const fs=factors(p.total);assert.equal(fs.length,2);assert.ok(fs[0]<fs[1]);a=fs[1];
  s=`Көрмеде ${p.total} шағын мүсін тіктөртбұрышты тор болып қойылды. Қатар саны да, әр қатардағы мүсін саны да — жай сандар. Қатар саны бір қатардағы мүсін санынан аз. Әр қатарда неше мүсін бар?`;
  z=`Жалпы сан = қатар саны × бір қатардағы мүсін саны. ${decomposition(p.total)}. Екі жай өлшем ${fs[0]} және ${fs[1]}. Қатар саны кішісі болғандықтан, ${fs[0]} қатардың әрқайсысында ${fs[1]} мүсін бар. Тексеру: ${times(fs)} = ${p.total}. 1 × ${p.total} нұсқасы жай өлшемдер талабына сай емес.`;break;
 }
 case'cancel-powered-factors':{
  const left=expanded(p.numerator),right=expanded(p.denominator),remaining=[...left];for(const f of right){const i=remaining.indexOf(f);assert.ok(i>=0);remaining.splice(i,1);}a=product(remaining);assert.equal(new Set(remaining).size,2);
  s=`a = ${repr(p.numerator)}, b = ${repr(p.denominator)}. a : b бөліндісін көбейткіштерді топтастыру арқылы табыңдар.`;
  z=`a = ${times(left)}, b = ${times(right)}. a ішінен b құрамындағы әр көбейткішті бір реттен алып топтасақ, ${times(remaining)} қалады. Сондықтан a = b × (${times(remaining)}), a : b = ${a}. Есеппен тексеру: a = ${pv(p.numerator)}, b = ${pv(p.denominator)}; ${pv(p.denominator)} × ${a} = ${pv(p.numerator)}.`;break;
 }
 case'specified-prime-multiplicity':{
  assert.ok(prime(p.prime));const fs=factors(p.number);a=fs.filter(n=>n===p.prime).length;assert.ok(a>=3);
  s=`${p.number} санын жай көбейткіштерге жіктегенде ${p.prime} көбейткіші неше рет кездеседі? Қайталанғандарын жеке санаңдар.`;
  z=`Толық бөлу: ${divisionProof(p.number)}. Сондықтан ${decomposition(p.number)}. ${p.prime} саны ${a} рет жазылған. ${p.prime} санына бірінші рет бөліну тек оның бар екенін көрсетеді; неше рет кездесетінін білу үшін бөлуді сол жай санға бөлінбей қалғанша жалғастырамыз.`;break;
 }
 case'nondivisor-prime-budget':case'divisor-prime-budget':{
  const n=pv(p.factors),want=k==='divisor-prime-budget',index=one(p.numbers.flatMap((d,i)=>(n%d===0)===want?[i]:[]));a=p.numbers[index];options=p.numbers.map(String);const budget=new Map(p.factors);
  s=`n = ${repr(p.factors)}. Төмендегі сандардың қайсысы n санының ${want?'натурал бөлгіші болады':'бөлгіші болмайды'}?`;
  z=`n = ${n}. Әр санның жай жіктеуіндегі көбейткіштер n ішінде кемінде сонша рет болуы қажет. ${p.numbers.map(d=>{const need=powers(d),bad=need.filter(([b,e])=>e>(budget.get(b)||0));return `${decomposition(d)}: ${bad.length?bad.map(([b,e])=>`${b} саны ${e} рет керек, n ішінде ${budget.get(b)||0} рет бар`).join('; '):`${n} : ${d} = ${n/d}, қалдықсыз бөлінеді`}`;}).join('. ')}. Сондықтан сұралған сан ${a}.`;break;
 }
 case'prime-speed-time':{
  const index=one(p.choices.flatMap(([v,t],i)=>prime(v)&&prime(t)&&v>t&&v*t===p.distance?[i]:[]));options=p.choices.map(([v,t])=>`${v} км/сағ; ${t} сағ`);a=options[index];
  s=`Велотоп тұрақты жылдамдықпен ${p.distance} км жүрді. Жылдамдықтың км/сағ-пен және уақыттың сағатпен алынған мәндері — жай сандар; жылдамдықтың сандық мәні уақыттың сандық мәнінен үлкен. Дұрыс жылдамдық пен уақыт жұбын таңдаңдар.`;
  z=`Жол жылдамдық пен уақыттың көбейтіндісі: ${decomposition(p.distance)}. Жай көбейткіштерді шарттағы ретпен алсақ, ${a}. Барлық нұсқаның жолдары ${p.choices.map(([v,t])=>`${v} × ${t} = ${v*t}`).join('; ')} км. 1 жай сан емес; кері жазылған жұпта жылдамдықтың сандық мәні кіші. Дұрыс жұпта екі мән де жай және көбейтінді ${p.distance}.`;break;
 }
 case'not-semiprime':{
  const fs=p.numbers.map(factors),index=one(fs.flatMap((xs,i)=>xs.length!==2?[i]:[]));assert.equal(fs[index].length,3);a=p.numbers[index];options=p.numbers.map(String);
  s='Қай санды дәл екі жай санның көбейтіндісі ретінде жазу мүмкін емес? Екі жай санның бірдей болуына рұқсат.';
  z=`Жіктеулер: ${p.numbers.map(decomposition).join('; ')}. Жай жіктеу бірегей болғандықтан, дәл екі жай санның көбейтіндісінде қайталануымен санағанда екі жай көбейткіш болады. ${a} ішінде олардың саны ${fs[index].length}. Оны екі көбейткішке топтастырсақ та, бір топ құрама болып қалады. Қалған үш нұсқада дәл екі жай көбейткіш бар.`;break;
 }
 case'trailing-zero-pairs':{
  assert.ok(p.twos>p.fives&&p.threes>0);a=Math.min(p.twos,p.fives);const coefficient=2**(p.twos-a)*3**p.threes*5**(p.fives-a),n=2**p.twos*3**p.threes*5**p.fives;
  s=`${pow(2,p.twos)} × ${pow(3,p.threes)} × ${pow(5,p.fives)} көбейтіндісінің жазылуы дәл неше нөлмен аяқталады?`;
  z=`Әр соңғы нөл үшін 10 = 2 × 5 жұбы керек. Екілер саны ${p.twos}, бестіктер саны ${p.fives}; жұп саны ${a}. Қалған бөлік ${pow(2,p.twos-a)} × ${pow(3,p.threes)} = ${coefficient}, оның соңғы цифры нөл емес. Бүкіл сан ${coefficient} × ${10**a} = ${n}. Сондықтан дәл ${a} нөл бар; көрсеткіштерді қосу дұрыс емес.`;break;
 }
 case'least-cube-multiplier':{
  const ps=powers(p.number),needed=ps.map(([b,e])=>[b,(3-e%3)%3]).filter(([,e])=>e>0);a=pv(needed);const total=p.number*a,root=one(range(1,total).filter(n=>n*n*n===total));assert.ok(needed.length===2&&needed.every(([,e])=>e>0));
  s=`${p.number} × k көбейтіндісі натурал санның кубы болсын. Осыны орындайтын ең кіші натурал k санын табыңдар.`;
  z=`${decomposition(p.number)}. Кубта әр жай санның қайталану саны 3-ке еселі болуы керек. ${ps.map(([b,e])=>`${b} саны ${e} рет бар, келесі үш еселікке жеткізу үшін тағы ${(3-e%3)%3} рет керек`).join('; ')}. Ең кіші толықтыру k = ${repr(needed)} = ${a}. Сонда ${p.number} × ${a} = ${total} = ${pow(root,3)}. Бұдан кіші k жетіспейтін міндетті көбейткіштердің бәрін қамти алмайды; артық жай көбейткіш қосу k мәнін тек үлкейтеді.`;break;
 }
 case'smallest-odd-prime-length':{
  a=3**p.count;options=p.numbers.map(String);assert.equal(p.numbers.filter(n=>n%2&&factors(n).length===p.count).sort((x,y)=>x-y)[0],a);
  s=`Жай жіктеуінде қайталанатындарын жеке санағанда дәл ${p.count} көбейткіш бар. Осы талапты орындайтын ең кіші тақ натурал санды таңдаңдар.`;
  z=`Тақ санда 2 жай көбейткіші болмайды. Ең кіші тақ жай сан 3, сондықтан ${p.count} көбейткіштің әрқайсысы кемінде 3. Барлығы 3 болса, ең кіші мүмкін сан ${pow(3,p.count)} = ${times(Array(p.count).fill(3))} = ${a}. Нұсқаларды тексеру: ${p.numbers.map(n=>`${decomposition(n)}; ${factors(n).length} көбейткіш, ${n%2?'тақ':'жұп'}`).join('. ')}. Үлкенірек жарамды тақ сан минималдық талабына сай емес.`;break;
 }
 case'distinct-age-product':{
  const fs=factors(p.product);assert.equal(fs.length,3);assert.equal(new Set(fs).size,3);a=sum(fs);
  s=`Отбасындағы үш баланың жастары — 1-ден үлкен, өзара әртүрлі натурал сандар. Үш жастың көбейтіндісі ${p.product}. Жастарының қосындысын табыңдар.`;
  z=`${decomposition(p.product)}. Көбейтіндіде дәл үш жай көбейткіш бар. Үш жастың әрқайсысы 1-ден үлкен болғандықтан, әр жас кемінде бір жай көбейткіш алуы тиіс. Сондықтан жай сандар бір-бірден бөлінеді: ${list(fs)} жас. Олардың бәрі әртүрлі. Қосынды ${fs.join(' + ')} = ${a}. Тексеру: ${times(fs)} = ${p.product}. Екі жай көбейткішті бір жасқа біріктірсек, қалған бір балаға тек 1 қалар еді; бұл тыйым салынған.`;break;
 }
 case'square-factor-parity':{
  assert.ok(p.products.every(ps=>ps.every(([b])=>prime(b))));const index=one(p.products.flatMap((ps,i)=>ps.every(([,e])=>e%2===0)?[i]:[]));options=p.products.map(repr);a=options[index];const root=product(p.products[index].map(([b,e])=>b**(e/2)));
  s='Берілген жай жіктеулердің қайсысы натурал санның квадратына тең?';
  z=`Квадрат — бірдей екі санның көбейтіндісі, сондықтан оның жай жіктеуінде әр көрсеткіш жұп. Нұсқалар: ${p.products.map((ps,i)=>`${options[i]} = ${pv(ps)}; көрсеткіштер ${ps.map(([,e])=>e).join(', ')}${ps.every(([,e])=>e%2===0)?' — бәрі жұп':' — кемінде бірі тақ'}`).join('. ')}. Дұрыс жазу ${a} = ${root} × ${root} = ${pow(root,2)}.`;break;
 }
 case'consecutive-product-triple':{
  const candidates=range(1,Math.ceil(Math.cbrt(p.product))).filter(n=>n*(n+1)*(n+2)===p.product);const start=one(candidates),wanted=[start,start+1,start+2];options=p.choices.map(tuple);a=one(options.filter((_,i)=>canonicalEdition(p.choices[i])===canonicalEdition(wanted)));assert.ok(p.choices.some(xs=>product(xs)===p.product&&xs[1]!==xs[0]+1));
  s=`Қатар келген үш натурал санның көбейтіндісі ${p.product}. Осы үш санды өсу ретімен таңдаңдар.`;
  z=`Алдымен ${decomposition(p.product)}. Көбейткіштерді ${wanted.join(', ')} сандарына топтастырамыз: ${times(wanted)} = ${p.product}. Барлық нұсқаның көбейтінділері: ${p.choices.map(xs=>`${times(xs)} = ${product(xs)}`).join('; ')}. Соңғы нұсқаның көбейтіндісі де дұрыс, бірақ сандары қатар келмейді. Өсу ретімен қатар келген үш санның көбейтіндісі бастапқы сан артқанда қатаң өседі, сондықтан дұрыс үштік біреу ғана.`;break;
 }
 case'prime-cube-grid-dimensions':{
  const fs=factors(p.count);assert.equal(fs.length,3);assert.equal(new Set(fs).size,3);const lengths=fs.map(n=>n*p.edge);options=p.choices.map(xs=>xs.map(n=>`${n} см`).join('; '));a=one(options.filter((_,i)=>canonicalEdition([...p.choices[i]].sort((a,b)=>a-b))===canonicalEdition(lengths)));
  s=`Тікбұрышты қорап қыры ${p.edge} см болатын ${p.count} бірдей текшемен саңылаусыз толтырылған. Ұзындығы, ені және биіктігі бойындағы текшелердің саны — жай сандар. Қораптың үш ішкі өлшемін таңдаңдар; реті маңызды емес.`;
  z=`Текшелер саны үш бағыттағы текше сандарының көбейтіндісі. ${decomposition(p.count)}, демек бағыттарда ${list(fs)} текше бар. Әр санды бір текшенің ${p.edge} см қырына көбейтеміз: ${fs.map(n=>`${n} × ${p.edge} = ${n*p.edge} см`).join('; ')}. Сондықтан ${a}. Көлемді тексеру: ${times(lengths)} = ${product(lengths)} см³; бір текше ${pow(p.edge,3)} = ${p.edge**3} см³; ${product(lengths)} : ${p.edge**3} = ${p.count}. Текше санын сантиметр деп алу немесе бір бағытты ғана көбейту дұрыс емес.`;break;
 }
 case'factorial-prime-multiplicity':{
  assert.ok(prime(p.prime));const ns=range(1,p.last),counts=ns.map(n=>factors(n).filter(f=>f===p.prime).length);a=sum(counts);options=p.numbers.map(String);const total=product(ns);int(total);
  s=`1-ден ${p.last} санына дейінгі барлық натурал санның көбейтіндісін жай көбейткіштерге жіктегенде ${p.prime} көбейткіші неше рет кездеседі?`;
  z=`Әр көбейткіш ішіндегі ${p.prime} санын жеке санаймыз: ${ns.flatMap((n,i)=>counts[i]?[`${n} = ${repr(powers(n))} — ${counts[i]} рет`]:[]).join('; ')}. Барлығы ${counts.filter(Boolean).join(' + ')} = ${a}. Тек ${p.prime} санына бөлінетін мүшелердің санын алу жеткіліксіз: олардың кейбірінде ол бірнеше рет қайталанады. Толық көбейтінді ${total}; ${total} : ${p.prime**a} = ${total/(p.prime**a)}, бұл ${p.prime} санына енді бөлінбейді.`;break;
 }
 case'count-all-divisors':{
  assert.ok(p.factors.every(([b])=>prime(b)));const n=pv(p.factors),ds=divisors(n);a=ds.length;assert.equal(a,product(p.factors.map(([,e])=>e+1)));
  s=`${n} = ${repr(p.factors)} жіктеуін қолданып, ${n} санының барлық натурал бөлгіштерінің санын табыңдар. 1 мен ${n} санының өзін де санаңдар.`;
  z=`Бөлгіште әр жай санның көрсеткіші 0-ден берілген шекке дейін өзгереді: ${p.factors.map(([b,e])=>`${b} үшін ${range(0,e).join(', ')} — ${e+1} мүмкіндік`).join('; ')}. Әр таңдау тәуелсіз, сондықтан ${p.factors.map(([,e])=>e+1).join(' × ')} = ${a} бөлгіш. Олардың толық тізімі: ${list(ds)}. Әрқайсысы ${n} санын қалдықсыз бөледі және басқа жай көбейткіш қолданылмайды.`;break;
 }
 case'largest-single-prime-power':{
  assert.ok(prime(p.prime)&&p.digits>=2);const optionsP=[];let v=p.prime,e=1;while(String(v).length<=p.digits){optionsP.push([v,e]);v*=p.prime;e++;}const candidates=optionsP.filter(([n])=>String(n).length===p.digits);assert.ok(candidates.length>=2);a=candidates.at(-1)[0];
  s=`Жай жіктеуінде тек ${p.prime} саны бір немесе бірнеше рет кездесетін ең үлкен ${p.digits} таңбалы натурал санды табыңдар.`;
  z=`Мұндай сандар тек ${p.prime} жай санының дәрежелері болады. Ретімен: ${[...optionsP,[v,e]].map(([n,k])=>`${pow(p.prime,k)} = ${n}`).join('; ')}. ${p.digits} таңбалы мәндер ${list(candidates.map(([n])=>n))}. Олардың ең үлкені ${a}; келесі дәреже ${v}, онда ${String(v).length} цифр бар. Тек ${p.prime} санына бөліну жеткіліксіз: басқа жай көбейткіштің болуына тыйым салынған.`;break;
 }
 case'factor-guarantee':{
  assert.ok(prime(p.prime)&&p.prime>2);a=`${p.prime} санына бөлінеді`;options=[a,'тақ сан',`${2*p.prime} санына бөлінеді`,'жай сан'];
  s=`n натурал санының жай жіктеуінде ${p.prime} көбейткіші бар. Қай тұжырым n үшін әрқашан дұрыс?`;
  z=`Жіктеуден n = ${p.prime} × m, мұндағы m — натурал сан. Сондықтан n міндетті түрде ${p.prime} санына бөлінеді. Қалғандары әрқашан дұрыс емес: ${2*p.prime} = 2 × ${p.prime} — жұп, сондықтан «тақ» емес; ${3*p.prime} = 3 × ${p.prime} саны ${2*p.prime} санына бөлінбейді; ${3*p.prime} құрама, сондықтан міндетті түрде жай сан деу де қате.`;break;
 }
 case'exact-prime-count-choice':{
  assert.ok(prime(p.prime));const counts=p.numbers.map(n=>factors(n).filter(f=>f===p.prime).length);a=p.numbers[one(counts.flatMap((c,i)=>c===p.count?[i]:[]))];options=p.numbers.map(String);assert.ok(counts.some(c=>c>p.count)&&counts.some(c=>c<p.count));
  s=`Қай санның жай жіктеуінде ${p.prime} көбейткіші дәл ${p.count} рет кездеседі?`;
  z=`Әр санды толық жіктейміз: ${p.numbers.map((n,i)=>`${decomposition(n)} — ${p.prime} саны ${counts[i]} рет`).join('; ')}. Дәл ${p.count} рет кездесетіні ${a}. ${pow(p.prime,p.count)} санына бөлінетін басқа сандарда ${p.prime} көбейткіші одан көп рет кездесуі мүмкін; сондықтан тек осы бөлінуді тексеру жеткіліксіз.`;break;
 }
 case'count-largest-prime-two-digits':{
  assert.ok(prime(p.prime));const multiples=range(10,99).filter(n=>n%p.prime===0),good=multiples.filter(n=>Math.max(...factors(n))===p.prime),bad=multiples.filter(n=>!good.includes(n));a=good.length;assert.ok(bad.length>=2);
  s=`Жай жіктеуіндегі ең үлкен жай көбейткіші ${p.prime} болатын екі таңбалы натурал сандар нешеу?`;
  z=`Мұндай сан ${p.prime} санына міндетті түрде бөлінеді. Екі таңбалы еселіктері: ${list(multiples)} — ${multiples.length} сан. Үлкен жай көбейткіші барларын алып тастаймыз: ${bad.map(decomposition).join('; ')}. Қалғандары ${list(good)}; олардың әрқайсысының ең үлкен жай көбейткіші ${p.prime}. Саны ${multiples.length} − ${bad.length} = ${a}.`;break;
 }
 case'greatest-odd-divisor':{
  const fs=factors(p.number),odd=fs.filter(n=>n!==2);assert.ok(fs.filter(n=>n===2).length>=3);a=product(odd);const checks=[];let v=p.number;while(v%2===0){checks.push(`${v} : 2 = ${v/2}`);v/=2;}assert.equal(v,a);
  s=`${p.number} санының ең үлкен тақ натурал бөлгішін табыңдар.`;
  z=`Тақ бөлгіште 2 көбейткіші болмайды. Барлық екілерді алып тастаймыз: ${checks.join('; ')}. Қалған ${a} тақ сан, ${decomposition(a)}. Әр тақ бөлгіш осы қалған жай көбейткіштердің бір бөлігінен құралады, сондықтан ${a} санынан үлкен бола алмайды. ${a} өзі бөлгіш: ${a} × ${p.number/a} = ${p.number}. Бір рет қана 2-ге бөлу жұп нәтижені қалдырар еді.`;break;
 }
 case'prime-product-sum-multiple':{
  assert.ok(prime(p.multiplier)&&p.choices.every(xs=>xs.length===3&&xs.every(prime)));const index=one(p.choices.flatMap((xs,i)=>product(xs)===p.multiplier*sum(xs)?[i]:[]));options=p.choices.map(tuple);a=options[index];assert.ok(p.choices.some(xs=>!xs.includes(p.multiplier)));
  s=`Үш жай санның көбейтіндісі олардың қосындысын ${p.multiplier} санына көбейткенге тең. Қай үштік осы шартты орындайды? Сандардың қайталануына рұқсат.`;
  z=`Көбейтінді ${p.multiplier} жай санына бөлінетіндіктен, үш жай санның біреуі ${p.multiplier} болуы керек. Бірақ оның болуының өзі жеткіліксіз. Әр нұсқада: ${p.choices.map(xs=>`${times(xs)} = ${product(xs)}, ал (${xs.join(' + ')}) × ${p.multiplier} = ${sum(xs)*p.multiplier}`).join('; ')}. Тек ${a} үштігінде мәндер тең. ${p.multiplier} жоқ нұсқа бөлінгіштіктен-ақ шығарылып тасталады.`;break;
 }
 case'zero-free-factor-pair':{
  int(p.exponent);const n=10**p.exponent;int(n);const first=2**p.exponent,second=5**p.exponent;assert.ok(!String(first).includes('0')&&!String(second).includes('0'));a=first+second;
  s=`Екі натурал санның көбейтіндісі ${n}. Екі санның да ондық жазуында 0 цифры мүлде жоқ. Осы сандардың қосындысын табыңдар.`;
  z=`${n} = ${pow(2,p.exponent)} × ${pow(5,p.exponent)}. Бір санға 2 мен 5 қатар түссе, ол 10-ға бөлініп, соңында 0 пайда болады. Сондықтан барлық ${p.exponent} дана 2 бір санға, барлық ${p.exponent} дана 5 екінші санға берілуі керек. Сандар ${first} және ${second}; олардың ішінде де 0 цифры жоқ екенін тексереміз. Қосынды ${first} + ${second} = ${a}. Тексеру: ${first} × ${second} = ${n}. Бір санды 1 деп алу екінші санның ${n} болуына әкеледі, ол 0-і жоқ деген шартты бұзады.`;break;
 }
 default:throw Error('Unsupported source factorization skill '+k);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{assert.match(String(a),/^\d+$/);s+=' Жауапқа тек санды жазыңыз.';}
 assert.ok(!/[\\$]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const byId=new Map(SPECS.map(spec=>['grade5-factorization-'+spec.id,spec]));
export function renderEdition(row){const spec=byId.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,'grade5-factorization-'+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src,'Unknown read canonical source '+spec.id);const topic=['prime-square-side','prime-box-dimensions','prime-cube-grid-dimensions'].includes(spec.kind)?'geo':spec.kind==='prime-speed-time'?'motion':['cancel-listed-factors','cancel-powered-factors','least-cube-multiplier','distinct-age-product','consecutive-product-triple','prime-product-sum-multiple','zero-free-factor-pair'].includes(spec.kind)?'eq':'num';return{editionId:'grade5-factorization-'+spec.id,modelId:'grade5-factorization-'+spec.kind,grade:5,topic,difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Бастапқы 47 шарттың әрқайсысы, толық шешімі және барлық нұсқасы жеке оқылды. Мәні тең көбейтінді мен тек жай негіздерден тұратын аяқталған жіктеудің айырмасы, көбейткіштің қайталануы мен әртүрлі жай сандардың саны ажыратылды.',
 'Әр дереккөз үшін қазақша шарт пен сандар қайта жазылды; бөлімдегі әртүрлі бастапқы қабылдаулар — ең кіші/үлкен жай бөлгіш, дәрежелер, жай өлшем, толық бөлгіш жиыны, нөл жұптары, кубты толықтыру және жастың көбейтіндісі — сақталды.',
 'Сандық редакциялар жаңа математикалық мағына деп есептелмейді. Ашық жауаптар бүтін санмен ғана енгізіледі; жіктеу, формула, өлшем үштігі және салыстыру MCQ арқылы бағаланады.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(row=>[row.editionId,row]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const rendered=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(rendered[field]),'Unbound factorization '+field);assert.equal(row.answer,rendered.answer);assert.ok(!/[\\$]/.test(row.statement+row.solution));return{answer:rendered.answer,checks:['individual saved factorization skill and fixed parameters linked to canonical source','exact prime multiplicities, all option values and primality verified','whole natural-number domains, units and smallest/largest claims explained','native power notation and complete statement/solution/MCQ binding','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All 47 already captured nonvisual grade5 topic2.7 sources individually rewritten. Multiple source rows share decomposition forms; occurrence coverage is not semantic uniqueness. Awaiting independent review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-factorization.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
