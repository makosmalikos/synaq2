/** Offline source-specific draft for every saved nonvisual grade5 topic2.8. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-gcd-specs.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-8').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=xs=>xs.reduce((a,b)=>a+b,0);
const one=xs=>{assert.equal(xs.length,1,'One answer required');return xs[0];};
const supers='⁰¹²³⁴⁵⁶⁷⁸⁹',power=(b,e)=>e===1?String(b):String(b)+String(e).split('').map(c=>supers[Number(c)]).join('');
const repr=ps=>ps.length?ps.map(([b,e])=>power(b,e)).join(' × '):'1';
const pv=ps=>ps.reduce((a,[b,e])=>a*b**e,1),list=xs=>xs.join(', '),set=xs=>'{'+list(xs)+'}';
const gcd=(a,b)=>b?gcd(b,a%b):a,gg=ns=>ns.reduce(gcd);
const ds=n=>range(1,n).filter(d=>n%d===0),cd=ns=>ds(Math.min(...ns)).filter(d=>ns.every(n=>n%d===0));
function factors(n){assert.ok(Number.isSafeInteger(n)&&n>0);const out=[];for(let p=2;p*p<=n;p++)while(n%p===0){out.push(p);n/=p;}if(n>1)out.push(n);return out;}
function powers(n){const map=new Map();for(const f of factors(n))map.set(f,(map.get(f)||0)+1);return[...map];}
const decompositions=ns=>ns.map(n=>`${n} = ${repr(powers(n))}`).join('; ');
function proof(ns){const maps=ns.map(n=>new Map(powers(n))),shared=[...maps[0]].flatMap(([p,e])=>{const m=Math.min(e,...maps.slice(1).map(map=>map.get(p)||0));return m?[[p,m]]:[];}),g=pv(shared);assert.equal(g,gg(ns));return `${decompositions(ns)}. Барлық санға ортақ жай көбейткіштер әрқайсысының ең кіші көрсеткішімен алынады: ЕҮОБ = ${repr(shared)} = ${g}. Қалған жай көбейткішті не артық қайталануды қосу кемінде бір санның бөлгіші болу талабын бұзады. Тексеру: ${ns.map(n=>`${n} : ${g} = ${n/g}`).join('; ')}.`;}
const pairLabel=xs=>xs.join(' және '),teamLabel=([n,m])=>`${n} команда, әрқайсысында ${m} оқушы`,cargoLabel=([m,n])=>`${m} т, ${n} цистерна`;
const factorLabel=([g,coeff],variables)=>`${g} × (${coeff.map((n,i)=>`${n}${variables[i]}`).join(' + ')})`;
function render(k,p){let s,z,a,options;switch(k){
 case'smallest-divides-pair':case'smallest-divides-triple':{
  const low=Math.min(...p.numbers);assert.ok(p.numbers.every(n=>n%low===0));a=low;s=`${p.numbers.length===2?'Екі':'Үш'} топтағы бөлшектердің саны ${list(p.numbers)}. Осы сандардың ең үлкен ортақ бөлгішін табыңдар.`;
  z=`Ең кіші сан ${low}. ${p.numbers.filter(n=>n!==low).map(n=>`${n} : ${low} = ${n/low}`).join('; ')} — қалдықсыз бөлінеді. ${low} өзінің де бөлгіші, демек барлық санға ортақ. Одан үлкен ортақ бөлгіш ${low} санының бөлгіші бола алмайды. Сондықтан ЕҮОБ(${list(p.numbers)}) = ${a}.`;break;
 }
 case'gcd-factor-pair':case'gcd-min-exponent-pair':case'gcd-large-factor-pair':case'gcd-three-shared-primes':{
  a=gg(p.numbers);s=`${list(p.numbers)} сандарын жай көбейткіштерге жіктеу арқылы олардың ЕҮОБ-ін табыңдар.`;z=proof(p.numbers);break;
 }
 case'common-divisor-set':{
  const common=cd(p.numbers);options=p.choices.map(list);a=one(options.filter((_,i)=>canonicalEdition(p.choices[i])===canonicalEdition(common)));
  s=`Б(${p.numbers[0]}) = ${set(ds(p.numbers[0]))}, Б(${p.numbers[1]}) = ${set(ds(p.numbers[1]))}. Екі санның барлық ортақ бөлгіштері толық жазылған нұсқаны таңдаңдар.`;
  z=`Екі тізімде қатар тұрған элементтерді аламыз: ${list(common)}. ${ds(p.numbers[0]).map(d=>`${d}: ${p.numbers[1]%d===0?'екіншісінің де бөлгіші':'екінші сан оған қалдықсыз бөлінбейді'}`).join('; ')}. 1 барлық натурал санды бөледі, оны қалдырмаймыз. Ортақ бөлгіш екі санның кішісінен үлкен бола алмайды.`;break;
 }
 case'gcd-divisor-lists':case'gcd-short-list':{
  const common=cd(p.numbers);a=Math.max(...common);s=`ЕҮОБ(${list(p.numbers)}) мәнін бөлгіштерді іріктеу арқылы табыңдар.`;
  z=`Бөлгіштер: ${p.numbers.map(n=>`Б(${n}) = ${set(ds(n))}`).join('; ')}. Ортақтары ${set(common)}, олардың ең үлкені ${a}. Тексеру: ${p.numbers.map(n=>`${n} : ${a} = ${n/a}`).join('; ')}. Тізімдер толық болғандықтан, үлкенірек ортақ бөлгіш жоқ.`;break;
 }
 case'coprime-composite-pair':case'coprime-hidden-composite-pair':case'not-coprime-pair':case'gcd-equals-smaller-pair':case'largest-pair-gcd':{
  const gs=p.pairs.map(gg);let index;if(k==='largest-pair-gcd')index=one(gs.flatMap((g,i)=>g===Math.max(...gs)?[i]:[]));else index=one(gs.flatMap((g,i)=>(k==='not-coprime-pair'?g>1:k==='gcd-equals-smaller-pair'?g===Math.min(...p.pairs[i]):g===1)?[i]:[]));options=p.pairs.map(pairLabel);a=options[index];
  s=k==='not-coprime-pair'?`${list(p.numbers)} сандарынан алынған қай жұп өзара жай емес?`:k==='gcd-equals-smaller-pair'?'Қай жұптың ең үлкен ортақ бөлгіші сол жұптағы кіші санға тең?':k==='largest-pair-gcd'?'Төрт жұптың қайсысында ЕҮОБ ең үлкен болады?':'Қай жұптағы екі натурал сан өзара жай?';
  z=`Әр жұпты тексереміз: ${p.pairs.map((xs,i)=>`${decompositions(xs)}; ЕҮОБ(${list(xs)}) = ${gs[i]}`).join('. ')}. ${k==='not-coprime-pair'?`Тек ${a} жұбында 1-ден үлкен ортақ бөлгіш бар.`:k==='gcd-equals-smaller-pair'?`Тек ${a} жұбында үлкен сан кішісіне қалдықсыз бөлінеді; сондықтан кіші сан ортақ бөлгіштердің ең үлкені болады.`:k==='largest-pair-gcd'?`ЕҮОБ мәндерін салыстырсақ, ең үлкені ${gs[index]}. Бастапқы сандардың үлкендігіне ғана қарап шешуге болмайды.`:`Тек ${a} жұбында ортақ жай көбейткіш жоқ, ЕҮОБ 1. Екі санның өзі құрама болуы олардың өзара жай болуына кедергі емес.`}`;break;
 }
 case'powered-gcd-choice':case'powered-gcd-unshared':case'three-powered-gcd':{
  const ns=p.products.map(pv);a=gg(ns);options=p.choices?.map(String);const names=ns.length===3?['a','b','c']:['a','b'];s=`${p.products.map((ps,i)=>`${names[i]} = ${repr(ps)}`).join(', ')}. Осы ${ns.length===3?'үш':'екі'} санның ең үлкен ортақ бөлгішін табыңдар.`;
  z=`Алдымен берілген жіктеулердегі барлық санға ортақ негіздерді қараймыз. ${proof(ns)} ${ns.length===3?'Екі санға ғана ортақ жай көбейткіш үшінші санда жоқ болса, оны алмаймыз.':'Ең үлкен көрсеткіштерді немесе әр ортақ жай санды бір-ақ рет алу дұрыс емес; берілген қайталану шектерінің кішісі қажет.'}`;break;
 }
 case'coprime-to-semiprime':case'coprime-to-repeated-primes':{
  const gs=p.numbers.map(n=>gcd(n,p.target));a=p.numbers[one(gs.flatMap((g,i)=>g===1?[i]:[]))];options=p.numbers.map(String);
  s=`Қай сан ${p.target} санымен өзара жай?`;
  z=`${p.target} = ${repr(powers(p.target))}. Өзара жай сан осы жіктеудегі жай сандардың ешқайсысына бөлінбеуі керек. ${p.numbers.map((n,i)=>`${n} = ${repr(powers(n))}; ЕҮОБ(${n}, ${p.target}) = ${gs[i]}`).join('; ')}. Сондықтан жалғыз дұрыс жауап ${a}. Жай сандардың біреуін ғана тексеру жеткіліксіз.`;break;
 }
 case'prime-vs-composite-gcd':{
  a=gg(p.numbers);assert.equal(a,1);options=p.choices.map(String);const prime=p.numbers[0],other=p.numbers[1];assert.equal(factors(prime).length,1);
  s=`ЕҮОБ(${prime}, ${other}) мәнін таңдаңдар.`;
  z=`${prime} — жай сан, оның бөлгіштері 1 және ${prime} ғана. ${other} = ${prime} × ${Math.floor(other/prime)} + ${other%prime}, сондықтан ${prime} екінші санның бөлгіші емес. Ортақ бөлгіш тек 1. Айырма ${other-prime} ЕҮОБ емес; 0 санына бөлу анықталмаған, ол бөлгіш бола алмайды.`;break;
 }
 case'coprime-definition':{
  a='Өзара жай натурал сандардың ең үлкен ортақ бөлгіші 1 болады';options=['Өзара жай сандардың әрқайсысы міндетті түрде жай сан','Бірі жұп, бірі тақ болса, олар әрқашан өзара жай',a,'Екі натурал санның ЕҮОБ-і әрқашан олардың кішісіне тең'];
  s='Натурал сандардың өзара жай болуы туралы барлық жағдайда дұрыс анықтаманы таңдаңдар.';
  z='Өзара жай дегеніміз — ортақ натурал бөлгіші тек 1 болатын сандар, яғни олардың ЕҮОБ-і 1. Басқа тұжырымдарға қарсы мысалдар: 25 пен 36 құрама, бірақ ЕҮОБ(25, 36) = 1; 10 жұп, 15 тақ, бірақ ЕҮОБ(10, 15) = 5; ЕҮОБ(14, 21) = 7, ол кіші сан 14-ке тең емес.';break;
 }
 case'common-divisor-count-small':case'common-divisor-count-factor':{
  const common=cd(p.numbers);a=common.length;s=`${list(p.numbers)} сандарының барлық ортақ натурал бөлгіштерін санаңдар. Олардың саны нешеу?`;
  z=`${proof(p.numbers)} ЕҮОБ-тің бөлгіштері екі санға да ортақ: ${list(common)}. Толық тізімде ${a} сан бар. 1 де есепке кіреді. Сұралғаны ең үлкен ортақ бөлгіштің мәні ${gg(p.numbers)} емес, барлық ортақ бөлгіштердің саны.`;break;
 }
 case'not-common-divisor':{
  a=one(p.choices.filter(d=>!p.numbers.every(n=>n%d===0)));options=p.choices.map(String);s=`Қай сан ${p.numbers[0]} және ${p.numbers[1]} сандарының ортақ бөлгіші емес?`;
  z=`Әр нұсқаға екі санды да бөлеміз: ${p.choices.map(d=>p.numbers.map(n=>`${n} = ${d} × ${Math.floor(n/d)}${n%d?' + '+n%d:''}`).join(', ')).join('; ')}. ${a} үшін кемінде бір бөлуде нөл емес қалдық шықты. Қалған үш санға екі бастапқы сан да қалдықсыз бөлінеді.`;break;
 }
 case'choose-exact-gcd':{
  const gs=p.numbers.map(n=>gcd(n,p.fixed));a=p.numbers[one(gs.flatMap((g,i)=>g===p.target?[i]:[]))];options=p.numbers.map(String);
  s=`Қай x натурал саны үшін ЕҮОБ(x, ${p.fixed}) = ${p.target} теңдігі орындалады?`;
  z=`${p.fixed} = ${repr(powers(p.fixed))}. Нұсқалар үшін: ${p.numbers.map((n,i)=>`${decompositions([n])}; ЕҮОБ(${n}, ${p.fixed}) = ${gs[i]}`).join('; ')}. Сондықтан x = ${a}. Тек ${p.target} санына бөліну жеткіліксіз: ортақ бөлгіш одан артық болып кетпеуі керек. Бірақ x ішіндегі барлық артық жай көбейткішке тыйым салынбайды: ${a} : 16 = ${a/16}, алайда ЕҮОБ тек ${p.target}, себебі екінші санда екілердің қайталануы шектеулі.`;assert.equal(a%16,0);break;
 }
 case'triple-min-powers':{
  a=gg(p.numbers);options=p.choices.map(String);s=`ЕҮОБ(${list(p.numbers)}) мәнін таңдаңдар.`;z=proof(p.numbers)+' ЕҮОБ барлық үш санды бөлуі тиіс; соңғы санның бір үлкен бөлгішін ғана алу жеткіліксіз.';break;
 }
 case'factor-out-two':case'factor-out-three':{
  const g=gg(p.coefficients),inner=p.coefficients.map(c=>c/g);options=p.choices.map(choice=>factorLabel(choice,p.variables));a=one(options.filter((_,i)=>p.choices[i][0]===g&&canonicalEdition(p.choices[i][1])===canonicalEdition(inner)));
  s=`${p.coefficients.map((c,i)=>`${c}${p.variables[i]}`).join(' + ')} өрнегінде коэффициенттердің ең үлкен ортақ бөлгішін жақша сыртына шығарған нұсқаны таңдаңдар.`;
  z=`${proof(p.coefficients)} Әр коэффициентті ${g} санына бөлеміз: ${p.coefficients.map(c=>`${c} : ${g} = ${c/g}`).join('; ')}. Дұрыс түрі ${a}. Нұсқаларды ашқанда коэффициенттер: ${p.choices.map(([outside,inside])=>`сыртқы ${outside} үшін (${inside.map(c=>outside*c).join(', ')})`).join('; ')}. Бастапқы коэффициенттер шыққанның өзінде сыртқа одан кіші ортақ бөлгіш шығарылса, ЕҮОБ-ті шығару талабы орындалмайды.`;break;
 }
 case'maximum-two-type-bundles':case'maximum-gifts-ask-first-item':case'maximum-teams-members':{
  const groups=gg(p.amounts),each=p.amounts.map(n=>n/groups);
  if(k==='maximum-two-type-bundles'){a=groups;s=`Шеберханада ${p.amounts[0]} қызыл және ${p.amounts[1]} көк жалауша бар. Барлығын бірдей жиынтықтарға бөлмек: әр жиынтықтағы әр түстің саны бөлек-бөлек бірдей болсын. Ешбір жалауша артылмаса, ең көп неше жиынтық шығады?`;}
  else if(k==='maximum-gifts-ask-first-item'){a=each[0];s=`Сыйлықтарға ${p.amounts[0]} маркер, ${p.amounts[1]} ашықхат, ${p.amounts[2]} жапсырма алынды. Барлығы бірдей құрамды сыйлықтарға артылмай бөлінді. Сыйлық саны мүмкіндігінше көп. Бір сыйлықта неше маркер бар?`;}
  else{options=p.choices.map(teamLabel);a=teamLabel([groups,sum(each)]);s=`Спорт мерекесінде ${p.amounts[0]} ұл және ${p.amounts[1]} қыз түгел командаларға бөлінді. Әр командадағы ұл саны бірдей, қыз саны да бірдей. Командалар саны ең көп болғанда неше команда шығады және әрқайсысында барлығы неше оқушы болады?`;}
  z=`Топ саны әр бастапқы мөлшердің бөлгіші болуы керек. Ең көбі — олардың ЕҮОБ-і. ${proof(p.amounts)} Сондықтан ${groups} топ шығады. Әр топтағы жеке мөлшерлер: ${p.amounts.map((n,i)=>`${n} : ${groups} = ${each[i]}`).join('; ')}. ${k==='maximum-two-type-bundles'?`Барлық жиынтықтың әрқайсысында ${each[0]} қызыл және ${each[1]} көк жалауша бар. Әр түс барлық жиынтыққа бірдей бөлініп, ешбір жалауша артылмады.`:k==='maximum-gifts-ask-first-item'?`Маркер саны ${each[0]}; топтар санын ${groups} деп жауап беруге болмайды, өйткені сұрақ бір сыйлықтың құрамына қатысты.`:`Бір командадағы барлық оқушы ${each.join(' + ')} = ${sum(each)}. Тексеру: ${groups} × ${sum(each)} = ${sum(p.amounts)}, барлық бала есептелді.`}`;break;
 }
 case'maximum-separate-bus-capacity':{
  a=gg(p.amounts);s=`Үш мектептен ${list(p.amounts)} оқушы бөлек-бөлек саяхатқа шықты. Әр мектептің оқушылары тек сол мектепке бөлінген автобустарда отырады; мектептер араласпайды. Автобустардың орын саны бірдей және бәрі толық. Бір автобустағы орын саны ең көп неше болуы мүмкін?`;
  z=`Орын саны үш мектептің әрқайсысындағы оқушы санын қалдықсыз бөледі. Сондықтан ең үлкен мүмкін орын саны — ЕҮОБ. ${proof(p.amounts)} Автобус сандары ${p.amounts.map(n=>`${n} : ${a} = ${n/a}`).join('; ')}. Автобустар саны емес, бір автобустың орын саны ${a} сұралған.`;break;
 }
 case'gcd-ratio-sum-pair':{
  const ratio=gg(p.ratioInputs),total=gg(p.sumInputs);assert.equal(total%(ratio+1),0);const small=total/(ratio+1),large=ratio*small;options=p.choices.map(pairLabel);a=pairLabel([large,small]);
  s=`Екі натурал санның үлкенін кішісіне бөлгендегі бөлінді ЕҮОБ(${list(p.ratioInputs)}) мәніне, ал қосындысы ЕҮОБ(${list(p.sumInputs)}) мәніне тең. Үлкені мен кішісін осы ретпен таңдаңдар.`;
  z=`Бөлінді үшін: ${proof(p.ratioInputs)} Қосынды үшін: ${proof(p.sumInputs)} Кіші санды x десек, үлкені ${ratio}x, сондықтан x + ${ratio}x = ${total}. ${ratio+1}x = ${total}, x = ${small}. Үлкені ${ratio} × ${small} = ${large}. Тексеру: ${large} : ${small} = ${ratio}, ${large} + ${small} = ${total}. Екі шарт қатар орындалуы керек.`;break;
 }
 case'two-digit-exact-gcd-count':{
  const candidates=range(10,99).filter(n=>n%p.target===0),valid=candidates.filter(n=>gcd(n,p.fixed)===p.target);a=valid.length;
  s=`ЕҮОБ(n, ${p.fixed}) = ${p.target} болатын екі таңбалы натурал n сандары нешеу?`;
  z=`n саны ${p.target} санына бөлінуі тиіс. Екі таңбалы еселіктер ${list(candidates)}. Әрқайсысының ЕҮОБ-і: ${candidates.map(n=>`ЕҮОБ(${n}, ${p.fixed}) = ${gcd(n,p.fixed)}`).join('; ')}. Қалған жарамды сандар ${list(valid)}, саны ${a}. Қосымша екілердің болуы автоматты түрде қате емес; олардың екінші сандағы қайталану саны да ескеріледі.`;break;
 }
 case'largest-square-tile-count':{
  const length=100*p.lengthMetres+p.lengthCm,width=100*p.widthMetres+p.widthCm,side=gcd(length,width),columns=length/side,rows=width/side;a=columns*rows;
  s=`Тікбұрышты залдың ішкі ұзындығы ${p.lengthMetres} м ${p.lengthCm} см, ені ${p.widthMetres} м ${p.widthCm} см. Еденді қабырғаларға параллель қатарлармен бірдей шаршы тақталармен толық қаптайды. Тақталар кесілмейді, бір-бірін жаппайды және мүмкіндігінше үлкен. Барлығы неше тақта керек?`;
  z=`Өлшемдер ${length} см және ${width} см. Тақта қыры екі өлшемнің де бөлгіші, ең үлкені ЕҮОБ. ${proof([length,width])} Бір бағытта ${length} : ${side} = ${columns}, екіншісінде ${width} : ${side} = ${rows} тақта бар. Барлығы ${columns} × ${rows} = ${a}. Ауданмен тексеру: ${length} × ${width} = ${length*width} см²; ${side} × ${side} = ${side*side} см²; ${length*width} : ${side*side} = ${a}.`;break;
 }
 case'composite-base-powered-gcd':{
  const first=p.prime**p.firstExponent,second=p.composite**p.secondExponent;assert.ok(p.composite%p.prime===0);const g=gcd(first,second);options=p.choices.map(([b,e])=>power(b,e));a=one(options.filter((_,i)=>p.choices[i][0]**p.choices[i][1]===g));
  s=`ЕҮОБ(${power(p.prime,p.firstExponent)}, ${power(p.composite,p.secondExponent)}) мәнін таңдаңдар.`;
  z=`Құрама негізді ашамыз: ${p.composite} = ${repr(powers(p.composite))}, сондықтан ${power(p.composite,p.secondExponent)} = ${repr(powers(second))}. Ал ${power(p.prime,p.firstExponent)} ішінде тек ${p.prime} жай саны бар. ${proof([first,second])} Дәрежелік жауап ${a}. Құрама негіздегі басқа жай санды қосуға немесе үлкен көрсеткішті алуға болмайды.`;break;
 }
 case'largest-remainder-divisor':{
  const clean=p.numbers.map((n,i)=>n-p.remainders[i]);a=gg(clean);assert.ok(p.remainders.every(r=>r<a)&&p.numbers.every((n,i)=>n%a===p.remainders[i]));
  s=`${p.numbers[0]} санын n натурал санына бөлгенде қалдық ${p.remainders[0]}, ал ${p.numbers[1]} санын сол n санына бөлгенде қалдық ${p.remainders[1]}. n ең үлкен неше болуы мүмкін?`;
  z=`Әр саннан қалдықты аламыз: ${p.numbers.map((n,i)=>`${n} − ${p.remainders[i]} = ${clean[i]}`).join('; ')}. Екі айырма n санына бөлінеді, сондықтан ең үлкен кандидат — олардың ЕҮОБ-і. ${proof(clean)} Қалдықтар бөлгіштен кіші: ${p.remainders.map(r=>`${r} < ${a}`).join('; ')}. Тексеру: ${p.numbers.map((n,i)=>`${n} = ${a} × ${(n-p.remainders[i])/a} + ${p.remainders[i]}`).join('; ')}. Қалдықты азайтпай бастапқы сандардың ЕҮОБ-ін алу дұрыс емес.`;break;
 }
 case'unordered-sum-gcd-pairs':{
  assert.equal(p.total%p.gcd,0);const reduced=p.total/p.gcd,candidates=range(1,Math.floor(reduced/2)).map(x=>[x,reduced-x]),valid=candidates.filter(xs=>gg(xs)===1);a=valid.length;
  s=`Екі натурал санның ЕҮОБ-і ${p.gcd}, ал қосындысы ${p.total}. Сандардың орындарын ауыстыру жаңа жұп болып саналмайды. Неше түрлі жұп бар?`;
  z=`Сандарды ${p.gcd}x және ${p.gcd}y деп аламыз. x + y = ${reduced}, әрі ЕҮОБ(x, y) = 1 болуы керек; әйтпесе бастапқы ЕҮОБ ${p.gcd} мәнінен үлкен болады. x ≤ y бойынша барлық жұп: ${candidates.map(xs=>`(${pairLabel(xs)}), ЕҮОБ ${gg(xs)}`).join('; ')}. Жарамдылары ${valid.map(xs=>pairLabel(xs.map(n=>n*p.gcd))).join('; ')}. Барлығы ${a}; сандардың кері ретін қайта санамаймыз.`;break;
 }
 case'impossible-difference-gcd':{
  a=one(p.numbers.filter(n=>p.difference%n!==0));options=p.numbers.map(String);
  s=`n — натурал сан. ЕҮОБ(n, n + ${p.difference}) қай мәнге тең бола алмайды?`;
  z=`Екі санның ортақ бөлгіші олардың айырмасын да бөледі: (n + ${p.difference}) − n = ${p.difference}. Сондықтан мүмкін ЕҮОБ мәндері ${list(ds(p.difference))}. ${a} бұл айырманы бөлмейді. Қалған нұсқаларға нақты мысал: ${p.numbers.filter(n=>n!==a).map(n=>`n = ${n} болса, ЕҮОБ(${n}, ${n+p.difference}) = ${n}`).join('; ')}. Демек, тек ${a} мүмкін емес.`;break;
 }
 case'maximum-tank-and-count':{
  const mass=gg(p.amounts),counts=p.amounts.map(n=>n/mass),count=sum(counts);options=p.choices.map(cargoLabel);a=cargoLabel([mass,count]);
  s=`Үш пойызбен ${list(p.amounts)} т сұйық жүк әкелінді. Барлық цистернаның ішіндегі жүк массасы бірдей, әр цистерна толық және осы масса мүмкіндігінше үлкен бүтін тоннамен алынады. Бір цистернада неше тонна және үш пойызда барлығы неше цистерна бар?`;
  z=`Бір цистернадағы масса барлық үш жүк мөлшерінің ең үлкен ортақ бөлгіші. ${proof(p.amounts)} Цистерна саны пойыздар бойынша ${p.amounts.map((n,i)=>`${n} : ${mass} = ${counts[i]}`).join('; ')}. Барлығы ${counts.join(' + ')} = ${count}. Пойыз саны 3 — цистерна саны емес. Кішірек ортақ бөлгішке бөлуге болады, бірақ ол максимал масса талабына сай келмейді.`;break;
 }
 case'consecutive-coprime-theorem':{
  a='Айырмасы 1 болатын екі натурал сан әрқашан өзара жай';options=['Кез келген екі тақ натурал сан өзара жай','Екі құрама санның ЕҮОБ-і әрқашан 1-ден үлкен','Бір сан жай болса, ол кез келген құрама санмен өзара жай',a];
  s='Қай тұжырым барлық көрсетілген натурал сандар үшін дұрыс?';
  z='Алғашқы үш тұжырымға қарсы мысал: 15 пен 21 тақ, бірақ ЕҮОБ 3; 25 пен 36 құрама, бірақ ЕҮОБ 1; 7 жай және 21 құрама, бірақ ЕҮОБ 7. Соңғы тұжырымды дәлелдейік: n мен n + 1 ортақ d натурал санына бөлінсе, олардың айырмасы 1 де d санына бөлінеді. 1 санының жалғыз натурал бөлгіші 1 болғандықтан, d = 1. Бұл бір мысалға емес, кез келген n санына қатысты дәлел.';break;
 }
 case'greatest-two-digit-gcd-input':{
  const candidates=range(10,99).filter(n=>gcd(n,p.fixed)===p.fixed);a=Math.max(...candidates);s=`ЕҮОБ(a, ${p.fixed}) = ${p.fixed} болатын ең үлкен екі таңбалы натурал a санын табыңдар.`;
  z=`ЕҮОБ екінші санға тең болса, a сол ${p.fixed} санына қалдықсыз бөлінеді. Екі таңбалы еселіктер ${list(candidates)}. Ең үлкені ${a}, одан кейінгі еселік ${a+p.fixed} — үш таңбалы. Тексеру: ${a} : ${p.fixed} = ${a/p.fixed}; демек, ЕҮОБ ${p.fixed}.`;break;
 }
 case'unknown-prime-exponent':{
  assert.ok(p.targetExponent<p.bound);a=p.targetExponent;options=p.choices.map(String);s=`k — натурал сан. ЕҮОБ(${p.prime}ᵏ × ${p.firstOther}, ${power(p.prime,p.bound)} × ${p.secondOther}) = ${p.prime**p.targetExponent} болса, k мәнін таңдаңдар.`;
  z=`Ортақ жай негіз тек ${p.prime}; ${p.firstOther} және ${p.secondOther} ортақ емес. ЕҮОБ-тегі оның көрсеткіші k мен ${p.bound} сандарының кішісіне тең. ${p.prime**p.targetExponent} = ${power(p.prime,p.targetExponent)}, ал ${p.targetExponent} < ${p.bound}. Сондықтан k = ${p.targetExponent}. k ≥ ${p.bound} болса, ортақ дәреже ${power(p.prime,p.bound)} = ${p.prime**p.bound} болып кетер еді. Тексеру: бірінші сан ${p.prime**a*p.firstOther}, екіншісі ${p.prime**p.bound*p.secondOther}; ЕҮОБ ${p.prime**p.targetExponent}.`;break;
 }
 case'product-and-gcd-sum':{
  assert.equal(p.product%(p.gcd*p.gcd),0);const reduced=p.product/(p.gcd*p.gcd),pairs=range(1,Math.floor(Math.sqrt(reduced))).flatMap(x=>reduced%x===0&&gcd(x,reduced/x)===1?[[x,reduced/x]]:[]),pair=one(pairs).map(n=>n*p.gcd);a=sum(pair);
  s=`Екі натурал санның көбейтіндісі ${p.product}, ал ЕҮОБ-і ${p.gcd}. Осы екі санның қосындысын табыңдар.`;
  z=`Сандар ${p.gcd}m және ${p.gcd}n түрінде жазылады, ЕҮОБ(m, n) = 1. Көбейтіндіде ${p.gcd} × ${p.gcd} = ${p.gcd*p.gcd} ортақ көбейткіші бар, сондықтан mn = ${p.product} : ${p.gcd*p.gcd} = ${reduced}. ${reduced} — жай сан, оның натурал көбейткіш жұбы 1 және ${reduced} ғана. Бастапқы сандар ${pairLabel(pair)}. Қосынды ${pair.join(' + ')} = ${a}. Тексеру: ${pair.join(' × ')} = ${p.product}, ЕҮОБ(${list(pair)}) = ${p.gcd}.`;assert.equal(factors(reduced).length,1);break;
 }
 case'greatest-guaranteed-common-divisor':{
  a=gcd(p.firstMultiple,p.secondMultiple);options=p.choices.map(String);s=`a натурал саны ${p.firstMultiple} санына, b натурал саны ${p.secondMultiple} санына бөлінеді. ЕҮОБ(a, b) міндетті түрде бөлінетін ең үлкен натурал санды таңдаңдар.`;
  z=`${proof([p.firstMultiple,p.secondMultiple])} ${a} саны берілген екі бөлгішті де бөледі, сондықтан a мен b сандарының да ортақ бөлгіші болады. Кез келген ортақ бөлгіш ЕҮОБ(a, b) санын бөледі; демек, ЕҮОБ(a, b) міндетті түрде ${a} санына бөлінеді. Үлкенірек санға кепіл жоқ: a = ${p.firstMultiple}, b = ${p.secondMultiple} алсақ, ЕҮОБ дәл ${a}. Осы мысал барлық үлкен кепілді жоққа шығарады.`;break;
 }
 case'remove-one-max-package':{
  const results=p.amounts.map((_,i)=>gg(p.amounts.filter((_,j)=>i!==j)));a=Math.max(...results);const index=one(results.flatMap((n,i)=>n===a?[i]:[])),remaining=p.amounts.filter((_,i)=>i!==index);
  s=`Қоймада ${list(p.amounts)} кг алма салынған бес жәшік бар. Бір жәшікті бөлек жіберіп, қалған әр жәшіктегі алманы массасы бірдей толық пакеттерге салмақ. Жәшіктердің алмасы араласпайды, қалдық қалмайды, пакет массасы бүтін килограмм. Жіберілетін жәшікті тиімді таңдаса, бір пакеттің ең үлкен массасы неше килограмм?`;
  z=`Қалған төрт жәшік үшін пакет массасы — олардың ЕҮОБ-і. Барлық бес таңдауды тексереміз: ${p.amounts.map((n,i)=>`${n} кг жәшік жіберілсе, қалғандарының ЕҮОБ-і ${results[i]}`).join('; ')}. Ең тиімдісі ${p.amounts[index]} кг жәшікті жіберу. ${proof(remaining)} Пакеттер саны ${remaining.map(n=>`${n} : ${a} = ${n/a}`).join('; ')}. Барлық бес санның ЕҮОБ-ін ғана алу ${gg(p.amounts)} береді, бірақ бір жәшікті жіберу мүмкіндігін ескермейді.`;break;
 }
 case'coprime-initial-segment-count':{
  const primeFactors=[...new Set(factors(p.last))],valid=range(1,p.last).filter(n=>gcd(n,p.last)===1);a=valid.length;s=`1-ден ${p.last} санына дейінгі, екі шеті де кіретін натурал сандардың нешеуі ${p.last} санымен өзара жай?`;
  z=`${p.last} = ${repr(powers(p.last))}. Онымен өзара жай сан ${primeFactors.join(' және ')} жай сандарының ешқайсысына бөлінбеуі керек. Барлық жарамды сандар ${list(valid)}. Олардың саны ${a}. 1 де қосылады: ЕҮОБ(1, ${p.last}) = 1. Құрама санның өзі де өзара жай болуы мүмкін, сондықтан тек жай сандарды санау қате.`;break;
 }
 case'gcd-scaling-law':{
  a=p.gcd*p.multiplier;options=p.choices.map(String);s=`a және b — натурал сандар, ЕҮОБ(a, b) = ${p.gcd}. ЕҮОБ(${p.multiplier}a, ${p.multiplier}b) мәнін таңдаңдар.`;
  z=`a = ${p.gcd}m, b = ${p.gcd}n деп жазамыз; m мен n өзара жай. Екі санды ${p.multiplier} санына көбейтсек, ${p.multiplier}a = ${a}m және ${p.multiplier}b = ${a}n. Жіктеулердегі ортақ міндетті бөлік ${a}; m мен n-де қосымша ортақ жай көбейткіш жоқ. Сондықтан ЕҮОБ ${a}. Жалпы ереже: екі натурал санды бір оң натурал санға көбейткенде, ЕҮОБ те сол санға көбейеді; оны қосуға немесе екі рет көбейтуге болмайды.`;break;
 }
 default:throw Error('Unsupported saved gcd skill '+k);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{assert.match(String(a),/^\d+$/);s+=' Жауапқа тек санды жазыңыз.';}
 assert.ok(!/[\\$]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(spec=>['grade5-gcd-'+spec.id,spec]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,'grade5-gcd-'+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);const topic=spec.kind==='largest-square-tile-count'?'geo':['factor-out-two','factor-out-three','gcd-ratio-sum-pair','largest-remainder-divisor','unordered-sum-gcd-pairs','unknown-prime-exponent','product-and-gcd-sum'].includes(spec.kind)?'eq':'num';return{editionId:'grade5-gcd-'+spec.id,modelId:'grade5-gcd-'+spec.kind,grade:5,topic,difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Барлық 48 бастапқы шарт, толық ресми шешім және нұсқалар жеке оқылды. ЕҮОБ мәні мен ортақ бөлгіштер саны, шамалар мен топтар саны, ең үлкен және жай ғана жарамды бөлгіштің айырмасы сақталды.',
 'Қазақша шарттар мен деректер әр дереккөзге байланыстырылып қайта жазылды. Қалған төрт жәшік үшін барлық бес таңдау, ретсіз жұптар үшін толық шек, қалдықтың бөлгіштен кішілігі және жай көбейткіштердің ең кіші қайталануы тексеріледі.',
 'Сандық нұсқа жаңа математикалық мағына болып саналмайды. Ашық жауаптар бүтін санмен ғана; көп санды жауап, толық тізім және өрнек MCQ арқылы беріледі. Кез келген натурал сандарға арналған тұжырымға мысалдан бөлек жалпы дәлел қосылды.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const rendered=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(rendered[field]),'Unbound gcd '+field);assert.equal(row.answer,rendered.answer);assert.ok(!/[\\$]/.test(row.statement+row.solution));return{answer:rendered.answer,checks:['saved source-specific gcd, coprimality and requested-quantity skills bound','exact factor multiplicities, full natural candidate domains and maxima','universal claims have general proofs and false claims have counterexamples','full native statement solution MCQ keys and fixed parameter binding','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const r of editions)verifyEdition(r);const out={schemaVersion:1,scope:'All 48 already saved nonvisual grade5 topic2.8 sources individually rewritten. Repeated numerical forms do not imply semantic uniqueness. Awaiting independent review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-gcd.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
