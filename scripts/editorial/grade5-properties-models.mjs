/** All captured nonvisual grade5 topic2.3 occurrences. Separate drafts, no publication. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-3').map(q=>[q.sourceId,q]));
const range=(lo,hi)=>Array.from({length:Math.max(0,hi-lo+1)},(_,i)=>lo+i);
const gcd=(a,b)=>b?gcd(b,a%b):a;
const show=xs=>xs.join(', ');
const value=e=>typeof e==='number'?e:e[0]==='add'?value(e[1])+value(e[2]):e[0]==='subtract'?value(e[1])-value(e[2]):e[0]==='multiply'?value(e[1])*value(e[2]):assert.fail('Unknown safe arithmetic operator');
function expression(e,parent=0){if(typeof e==='number')return String(e);const prec=e[0]==='multiply'?2:1;const op={add:' + ',subtract:' − ',multiply:' × '}[e[0]];assert.ok(op);const s=expression(e[1],prec)+op+expression(e[2],e[0]==='subtract'?prec+1:prec);return prec<parent?'('+s+')':s;}
const mul=(...xs)=>xs.reduce((a,b)=>a*b,1);
function cancelFactors(factors,divisor){let remaining=divisor;const reduced=factors.slice(),steps=[],parts=[];for(let i=reduced.length-1;i>=0;i--){const d=gcd(reduced[i],remaining);if(d>1){parts.push(d);steps.push(`${reduced[i]} : ${d} = ${reduced[i]/d}`);reduced[i]/=d;remaining/=d;}}assert.equal(remaining,1);return{reduced,steps,parts};}
function primeFactors(n){const out=[];for(let d=2;d*d<=n;d++)while(n%d===0){out.push(d);n/=d;}if(n>1)out.push(n);return out;}
function render(k,p){let a,s,z,options;switch(k){
 case'difference-quotient':
  assert.ok(p.left%p.divisor===0&&p.right%p.divisor===0&&p.left>p.right);a=(p.left-p.right)/p.divisor;
  s=`Қалдықсыз бөлуді айырманың қасиетімен орындаңдар: (${p.left} − ${p.right}) : ${p.divisor}.`;
  z=`Екі мүшені бөлек бөлеміз: ${p.left} : ${p.divisor} = ${p.left/p.divisor}, ${p.right} : ${p.divisor} = ${p.right/p.divisor}. Сонда бөлінді ${p.left/p.divisor} − ${p.right/p.divisor} = ${a}.`;break;
 case'sum-nondivisible-explanation':
  assert.equal(p.first%p.divisor,0);assert.notEqual(p.last%p.divisor,0);a=`бөлінбейді: ${p.first} бөлінеді, ал ${p.last} бөлінбейді`;
  options=[a,`бөлінеді, өйткені ${p.first} бөлінеді`,`бөлінеді, өйткені қосынды ${p.first+p.last}`,`бөлінбейді, өйткені ${p.last} жұп сан`];assert.equal((p.first+p.last)%2,0);
  s=`${p.first} + ${p.last} қосындысы ${p.divisor} санына қалдықсыз бөліне ме? Жауаппен бірге дұрыс себебін таңдаңдар.`;
  z=`Бірінші қосылғыш ${p.divisor} санының еселігі. Екіншісі бөлгенде ${p.last%p.divisor} қалдық береді; қосынды да осы қалдықты сақтайды. Сондықтан ${p.first+p.last} саны ${p.divisor} санына бөлінбейді. Қосындының жұп не тақ болуы бұл шешімнің себебі емес.`;break;
 case'universal-product-rule':
  a=`a саны ${p.divisor} санына бөлінсе, a × b көбейтіндісі де бөлінеді`;
  options=[`a + b қосындысы ${p.divisor} санына бөлінсе, a мен b де бөлінеді`,`a × b көбейтіндісі ${p.composite} санына бөлінсе, a немесе b де сол санға бөлінеді`,`a − b айырмасы ${p.divisor} санына бөлінсе, a да бөлінеді`,a];
  s='a және b — натурал сандар, a > b. Қай ереже осы шарттағы барлық a мен b үшін дұрыс?';
  z=`a = ${p.divisor} × k болса, a × b = ${p.divisor} × (k × b), сондықтан көбейтінді де бөлінеді. Кері тұжырымдар дұрыс емес: ${p.divisor-1} + 1 = ${p.divisor}; ${p.compositeFactors.join(' × ')} = ${p.composite}; ${p.divisor+1} − 1 = ${p.divisor}. Бұларда тиісті жеке сандардың бөлінуі орындалмайды.`;break;
 case'both-terms-choice':{
  const good=p.pairs.filter(([x,y])=>x%p.divisor===0&&y%p.divisor===0);assert.equal(good.length,1);const sign=p.operation==='add'?'+':'−';a=good[0].join(' '+sign+' ');options=p.pairs.map(xs=>xs.join(' '+sign+' '));
  s=`Қай ${p.operation==='add'?'қосындының екі қосылғышы':'айырманың азайғышы да, азайтқышы'} да ${p.divisor} санына қалдықсыз бөлінеді?`;
  z=`${good[0][0]} : ${p.divisor} = ${good[0][0]/p.divisor}; ${good[0][1]} : ${p.divisor} = ${good[0][1]/p.divisor}. Сондықтан дұрыс жазу ${a}. Басқа нұсқаларда мүшелердің кемінде біреуі бөлінбейді.`;break;
 }
 case'smallest-positive-addend':{
  a=1;while((p.base+a)%p.divisor!==0)a++;
  s=`${p.base} + x қосындысы ${p.divisor} санына бөлінсін. x — нөлден үлкен бүтін сан. Ең кіші x мәнін табыңдар.`;
  z=`${p.base} саны ${p.divisor} санына бөлінеді. Сондықтан x те осы санның еселігі болуы керек. Нөл рұқсат етілмегендіктен, ең кіші оң еселік ${a}. Тексеру: ${p.base} + ${a} = ${p.base+a}.`;break;
 }
 case'guaranteed-product-divisor':{
  const good=p.candidates.filter(d=>p.base%d===0);assert.equal(good.length,1);a=good[0];options=p.candidates.map(String);
  s=`${p.base} × n зат саны кез келген натурал n үшін қай ұсынылған санға міндетті түрде бөлінеді?`;
  z=`${p.base} = ${a} × ${p.base/a}, сондықтан көбейтінді ${a} × (${p.base/a} × n) түрінде жазылады. Өзге нұсқалар n = 1 кезінде-ақ ${p.base} санын бөлмейді.`;break;
 }
 case'product-choice':{
  const good=p.pairs.filter(([x,y])=>(x*y)%p.divisor===0);assert.equal(good.length,1);a=good[0].join(' × ');options=p.pairs.map(xs=>xs.join(' × '));
  s=`Қай көбейтінді ${p.divisor} санына қалдықсыз бөлінеді? Көбейткіштердің бөліну қасиетін пайдаланыңдар.`;
  z=`${good[0][0]} саны ${p.divisor} санына бөлінеді. Сондықтан ${a} көбейтіндісі де бөлінеді. Басқа нұсқалардың көбейтінділері ретімен тексерілгенде қалдық береді.`;break;
 }
 case'symbolic-one-term':
  assert.equal(p.coefficient%p.divisor,0);a=`${p.coefficient/p.divisor} × a`;options=[`${p.coefficient-p.divisor} × a`,a,String(p.coefficient/p.divisor),`${p.coefficient*p.divisor} × a`];
  s=`a — кез келген натурал сан. (${p.coefficient} × a) : ${p.divisor} өрнегін a арқылы ықшамдаңдар.`;
  z=`${p.coefficient} = ${p.divisor} × ${p.coefficient/p.divisor}. Сондықтан (${p.coefficient} × a) : ${p.divisor} = ${p.coefficient/p.divisor} × a. a көбейткіші жоғалмайды; ол жалпы натурал мәнді білдіреді.`;break;
 case'symbolic-two-terms':{
  assert.ok(p.first%p.divisor===0&&p.last%p.divisor===0);const left=p.first/p.divisor,right=p.last/p.divisor,sign=p.operation==='add'?'+':'−',variables=p.operation==='add'?['x','y']:['m','n'];
  const[v,w]=variables;a=`${left} × ${v} ${sign} ${right} × ${w}`;options=[a,`${left} × ${v} ${sign} ${p.last} × ${w}`,p.operation==='add'?`${p.first} × ${v} + ${right} × ${w}`:`${left} × ${v} + ${right} × ${w}`,`${p.operation==='add'?left+right:left-right} × ${v} × ${w}`];
  s=`(${p.first} × ${v} ${sign} ${p.last} × ${w}) : ${p.divisor} өрнегін ықшамдаңдар. ${v}, ${w} — натурал сандар${p.operation==='subtract'?`; ${p.first} × ${v} ≥ ${p.last} × ${w}`:''}.`;
  z=`Әр мүшенің коэффициентін ${p.divisor} санына бөлеміз: ${p.first} : ${p.divisor} = ${left}; ${p.last} : ${p.divisor} = ${right}. Айнымалылар мен ${sign} таңбасы сақталады. Нәтиже ${a}.`;break;
 }
 case'product-quotient':{
  const full=mul(...p.factors);assert.equal(full%p.divisor,0);a=full/p.divisor;
  s=`Көбейтіндіні бірден есептемей, бөліндіні табыңдар: (${p.factors.join(' × ')}) : ${p.divisor}.`;
  const{reduced,steps,parts}=cancelFactors(p.factors,p.divisor);z=`${parts.length>1?`Бөлгіш ${p.divisor} = ${parts.join(' × ')}. `:''}Бөлгішті көбейткіштер арасында қысқартамыз: ${steps.join('; ')}. Қалған көбейтінді ${reduced.join(' × ')} = ${a}. Кері тексеруде ${p.divisor} × ${a} = ${full}.`;break;
 }
 case'sum-quotient':
  assert.ok(p.first%p.divisor===0&&p.last%p.divisor===0);a=(p.first+p.last)/p.divisor;
  s=`Қосындының қасиетімен бөлуді орындаңдар: (${p.first} + ${p.last}) : ${p.divisor}.`;
  z=`Қосылғыштарды бөлек бөлсек, ${p.first/p.divisor} және ${p.last/p.divisor} шығады. Нәтиже ${p.first/p.divisor} + ${p.last/p.divisor} = ${a}; тексеру ${a} × ${p.divisor} = ${p.first+p.last}.`;break;
 case'divisible-expression-choice':{
  const valid=p.choices.filter(e=>value(e)%p.divisor===0);assert.equal(valid.length,1);a=expression(valid[0]);options=p.choices.map(e=>expression(e));
  s=`Қай өрнектің мәні ${p.divisor} санына бөлінеді? Ортақ көбейткішті байқауға тырысыңдар.`;
  assert.equal(value(p.factorised),value(valid[0]));z=`Ортақ көбейткішті шығарсақ, ${a} = ${expression(p.factorised)}. Сондықтан өрнек ${p.divisor} санына бөлінеді. Нұсқалардың мәндері ${show(p.choices.map(value))}; тек ${value(valid[0])} осы бөлгішке еселік.`;break;
 }
 case'value-divisor-choice':{
  const v=value(p.expr);const good=p.candidates.filter(d=>p.invert?v%d!==0:v%d===0);assert.equal(good.length,1);a=good[0];options=p.candidates.map(String);
  s=`${expression(p.expr)} өрнегінің мәні қай ұсынылған санға ${p.invert?'бөлінбейді':'қалдықсыз бөлінеді'}?`;
  assert.equal(value(p.factorised),v);z=`Ортақ көбейткішпен жазсақ, ${expression(p.expr)} = ${expression(p.factorised)} = ${v}. Нұсқалардағы сандарға бөлгендегі қалдықтар ретімен ${show(p.candidates.map(d=>v%d))}. ${p.invert?'Нөлден өзге жалғыз қалдық':'Нөлге тең жалғыз қалдық'} ${a} санына сәйкес келеді.`;break;
 }
 case'addend-choice':{
  const good=p.candidates.filter(n=>(p.base+n)%p.divisor===0);assert.equal(good.length,1);a=String(good[0]);options=p.candidates.map(String);
  s=`${p.base} + x қосындысы ${p.divisor} санына бөлінуі үшін x орнына қай нұсқаны қою керек?`;
  z=`${p.base} санының өзі ${p.divisor} санына бөлінеді, сондықтан x те бөлінуі керек. Нұсқалардан ${a} ғана жарайды. Тексеру: (${p.base} + ${a}) : ${p.divisor} = ${(p.base+Number(a))/p.divisor}.`;break;
 }
 case'nondivisible-expression-choice':{
  const good=p.choices.filter(e=>value(e)%p.divisor!==0);assert.equal(good.length,1);a=expression(good[0]);options=p.choices.map(e=>expression(e));
  s=`Қай өрнектің мәні ${p.divisor} санына бөлінбейді?`;
  z=`Нұсқалардың мәндері ретімен ${show(p.choices.map(value))}. Алғашқы үш мән ${p.divisor} санының еселігі, ал ${value(good[0])} мәні ${value(good[0])%p.divisor} қалдық береді. Сондықтан ${a} бөлінбейді.`;break;
 }
 case'equal-teams':
  assert.ok(p.first%p.groups===0&&p.last%p.groups===0);a=(p.first+p.last)/p.groups;
  s=`Роботехника үйірмесінде жаңадан қосылған ${p.first} оқушы және тәжірибелі ${p.last} оқушы бар. Оларды ${p.groups} топқа бөлгенде, жаңа оқушылар әр топта тең, тәжірибелілер де әр топта тең болсын. Бір топта барлығы неше оқушы болады?`;
  z=`Әр топқа ${p.first} : ${p.groups} = ${p.first/p.groups} жаңа және ${p.last} : ${p.groups} = ${p.last/p.groups} тәжірибелі оқушы келеді. Барлығы ${p.first/p.groups} + ${p.last/p.groups} = ${a} оқушы.`;break;
 case'product-plus-remainder':
  assert.ok(p.base%p.divisor===0&&0<=p.added&&p.added<p.divisor);a=p.added;
  s=`Өрнектің толық мәнін есептемей, ${p.base} × ${p.multiplier} + ${p.added} санын ${p.divisor} санына бөлгендегі қалдықты табыңдар.`;
  z=`${p.base} саны ${p.divisor} санына бөлінеді, демек ${p.base} × ${p.multiplier} көбейтіндісі де бөлінеді. Қосылған ${p.added} бөлгіштен кіші, сондықтан қалдық дәл ${a}.`;break;
 case'divisor-transitivity':
  assert.equal(p.base%p.must,0);a=`a саны ${p.must} санына бөлінеді`;options=[`a саны ${p.double} санына бөлінеді`,a,`a саны ${p.falseDivisor} санына бөлінеді`,`a + 1 қосындысы ${p.base} санына бөлінеді`];
  s=`a — ${p.base} санына бөлінетін кез келген натурал сан. Қай тұжырым әрқашан дұрыс?`;
  z=`a = ${p.base} × k = ${p.must} × (${p.base/p.must} × k), сондықтан ${p.must} санына бөлінеді. Өзге нұсқаларды a = ${p.base} мысалы жоққа шығарады; a + 1 санын ${p.base} санына бөлгенде 1 қалдық қалады.`;break;
 case'bounded-difference-count':{
  const xs=range(1,p.upper-1).filter(n=>(p.base-n)%p.divisor===0);a=xs.length;
  s=`${p.base} − x айырмасы ${p.divisor} санына бөлінсін. ${p.upper} санынан кіші оң бүтін x мәндері нешеу?`;
  z=`${p.base} саны бөлгіштің еселігі болғандықтан, x те еселік болуы керек. Шектегі мәндер ${show(xs)}. Нөл мен ${p.upper} кірмейді. Барлығы ${a} мән.`;break;
 }
 case'consecutive-product-quotient':{
  const ns=range(p.first,p.last);const full=mul(...ns);assert.equal(full%p.divisor,0);a=full/p.divisor;
  s=`(${ns.join(' × ')}) : ${p.divisor} бөліндісін тиімді жолмен табыңдар.`;
  const{reduced,steps,parts}=cancelFactors(ns,p.divisor);z=`${parts.length>1?`Бөлгіш ${p.divisor} = ${parts.join(' × ')}. `:''}Көбейткіштерден қысқартамыз: ${steps.join('; ')}. Қалған көбейтінді ${reduced.join(' × ')} = ${a}. Тексеру: ${p.divisor} × ${a} = ${full}.`;break;
 }
 case'not-guaranteed-shift':
  assert.ok(p.shift%p.divisor!==0);a=`a + ${p.shift}`;options=['a + b',a,'a − b',`${p.multiplier} × a`];
  s=`a мен b натурал сандары ${p.divisor} санына бөлінеді және a > b. Қай өрнектің ${p.divisor} санына бөлінуіне кепіл жоқ?`;
  z=`a + b, a − b және ${p.multiplier} × a өрнектері берілген еселікті сақтайды. a + ${p.shift} мәні бөлгенде ${p.shift%p.divisor} қалдық береді. Сондықтан жауап ${a}.`;break;
 case'append-digit-count':{
  const xs=range(0,9).filter(d=>d%p.divisor===0);a=xs.length;
  s=`Үш таңбалы n саны ${p.divisor} санына бөлінеді. Оң жағына бір цифр жалғап, төрт таңбалы сан жасайды. Жаңа сан да ${p.divisor} санына бөлінуі үшін неше түрлі цифр жарайды? 0 цифрына да рұқсат. Мысалы, ${p.example} санына ${p.illustrationDigit} цифрын жалғасақ, ${10*p.example+p.illustrationDigit} шығады.`;
  z=`Цифр жалғау 10 × n + d санын береді. 10 × n бөлгішке бөлінеді, сондықтан d де ${p.divisor} санына бөлінуі керек. 0–9 цифрларының ішінен ${show(xs)} жарайды. Цифр саны ${a}.`;break;
 }
 case'two-digit-addend-count':{
  const xs=range(10,99).filter(n=>(p.base+n)%p.divisor===0);a=xs.length;
  s=`${p.base} + x қосындысы ${p.divisor} санына бөлінетін неше екі таңбалы x бар?`;
  z=`${p.base} саны ${p.divisor} санының еселігі. Екі таңбалы x те осы санның еселігі болуы керек: ${show(xs)}. Барлығы ${a} мән.`;break;
 }
 case'one-divisible-one-not':
  a=`a + b қосындысы ${p.divisor} санына бөлінбейді`;options=[a,`a + b қосындысы ${p.divisor} санына бөлінеді`,`a + b қосындысы ${p.divisor} санына бөлінуі де, бөлінбеуі де мүмкін`,`a × b көбейтіндісі ${p.divisor} санына бөлінбейді`];
  s=`a натурал саны ${p.divisor} санына бөлінеді, b натурал саны бөлінбейді. Осыдан қай тұжырым міндетті түрде шығады?`;
  z=`a бөлгіштің еселігі; b санын осы бөлгішке бөлгенде нөлден өзге қалдық қалады. Қосқанда сол қалдық сақталады, демек a + b бөлінбейді. Ал көбейтінді a × b әрқашан бөлінеді, өйткені a көбейткіші бөлінеді.`;break;
 case'multiplied-remainder':
  assert.ok(p.remainder>=0&&p.remainder<p.divisor);a=(p.multiplier*p.remainder)%p.divisor;
  s=`Бір санды ${p.divisor} санына бөлгенде ${p.remainder} қалдық қалады. Осы санның ${p.multiplier} есесін сол бөлгішке бөлгендегі қалдықты табыңдар.`;
  z=`Бастапқы сан ${p.divisor} × q + ${p.remainder} түрінде. Оны ${p.multiplier} еселесек, бөлгішке еселік бөліктен тыс ${p.multiplier} × ${p.remainder} = ${p.multiplier*p.remainder} қалады. Оны да бөлгішпен жіктейміз: ${p.multiplier*p.remainder} = ${p.divisor} × ${Math.floor(p.multiplier*p.remainder/p.divisor)} + ${a}. Қалдық ${a}, ол ${p.divisor} санынан кіші.`;break;
 case'consecutive-product-rule':
  a=2;options=p.candidates.map(String);s='Екі көршілес натурал нөмір n және n + 1 көбейтілді. Қай ұсынылған сан осы көбейтіндіні кез келген n үшін қалдықсыз бөледі?';
  z='Көршілес екі санның біреуі міндетті түрде жұп. Сондықтан n × (n + 1) көбейтіндісі 2 санына бөлінеді. Басқа ұсынылған сандар n = 1 кезіндегі 1 × 2 = 2 көбейтіндісін бөлмейді.';break;
 case'repeated-two-digit-block':
  a=101;options=p.candidates.map(String);s=`Екі таңбалы кодты екі рет қатар жазды: мысалы, ${p.example} → ${101*p.example}. Кез келген екі таңбалы код осылай қайталанса, шыққан төрт таңбалы сан ұсынылған қай санға міндетті түрде бөлінеді?`;
  z=`Бастапқы екі таңбалы санды c десек, жаңа сан 100 × c + c = 101 × c болады. Сондықтан 101 бөлгіші әрқашан бар. Мысалдағы ${101*p.example} саны қалған үш нұсқаға бөлінбейді.`;break;
 case'three-consecutive-sum':
  a=3;options=p.candidates.map(String);s='Үш қатар тұрған натурал нөмірдің қосындысы кез келген жағдайда қай ұсынылған санға бөлінеді?';
  z='Нөмірлер n, n + 1, n + 2 болса, қосынды 3 × n + 3 = 3 × (n + 1). Сондықтан 3 бөлгіші міндетті. Ал 2 + 3 + 4 = 9 қосындысы 2 санына бөлінбейді; 1 + 2 + 3 = 6 қосындысы 5 пен 9 сандарына бөлінбейді. Демек, басқа нұсқалар әрқашан орындалмайды.';break;
 case'four-consecutive-sum':
  a='4 санына ешқашан бөлінбейді';options=['4 санына әрқашан бөлінеді','5 санына әрқашан бөлінеді',a,'12 санына әрқашан бөлінеді'];
  s='Бірінен кейін бірі тұрған төрт натурал нөмірдің қосындысы туралы дұрыс тұжырымды таңдаңдар.';
  z='Қосынды n + (n + 1) + (n + 2) + (n + 3) = 4 × (n + 1) + 2. Сондықтан оны 4 санына бөлгенде әрдайым 2 қалдық қалады. Ол ешқашан 4 санына бөлінбейді. Ал 2 + 3 + 4 + 5 = 14 қосындысы 5 санына бөлінбейді; 1 + 2 + 3 + 4 = 10 қосындысы 12 санына бөлінбейді. Сондықтан бұл екі бөлгіш те барлық жағдайда жарамайды.';break;
 case'range-multiple-count':{
  const xs=range(p.lower,p.upper).filter(n=>n%p.divisor===0);a=xs.length;
  s=`${p.lower}–${p.upper} аралығындағы, екі шетін қоса алғандағы, ${p.divisor} санының еселіктері нешеу?`;
  z=`Алғашқы еселік ${xs[0]}, соңғысы ${xs.at(-1)}. Барлық мәндер ${show(xs)}. Саны ${a}.`;break;
 }
 case'universal-sum-greatest-divisor':{
  a=gcd(p.first,p.last);const x=p.first+p.last,y=2*p.first+p.last;const common=range(1,Math.min(x,y)).filter(d=>x%d===0&&y%d===0);
  s=`a саны ${p.first} санына, b саны ${p.last} санына бөлінеді; екеуі де натурал сан. Кез келген осындай a мен b үшін a + b қосындысын бөлетін ең үлкен натурал сан қандай?`;
  z=`${p.first} және ${p.last} сандары ${a} санына бөлінеді, сондықтан барлық қосынды бөлінеді. Екі рұқсат етілген қосынды ${x} және ${y}; олардың ортақ оң бөлгіштері ${show(common)}. Сол себепті ${a} санынан үлкен бөлгіш барлық қосындыға бірдей жарамайды.`;break;
 }
 case'decomposition-choice':{
  const good=p.pairs.filter(([x,y])=>x+y===p.number&&x%p.divisor===0&&y%p.divisor===0);assert.equal(good.length,1);a=good[0].join(' + ');options=p.pairs.map(xs=>xs.join(' + '));
  s=`${p.number} санының ${p.divisor} санына бөлінуін толық бөлмей дәлелдеу керек. Қай жіктеуде екі қосылғыш та ${p.divisor} санына бөлінеді?`;
  z=`${good[0][0]} : ${p.divisor} = ${good[0][0]/p.divisor}; ${good[0][1]} : ${p.divisor} = ${good[0][1]/p.divisor}. Сондықтан ${a} қосындысы да бөлінеді. Басқа жіктеулерде екі қосылғыш та бұл қасиетке қатар ие емес.`;break;
 }
 case'nearby-known-quotient':{
  const known=p.divisor*p.knownQuotient,target=known+p.divisor*p.extra;a=p.knownQuotient+p.extra;
  s=`${known} = ${p.divisor} × ${p.knownQuotient} екені белгілі. Осы теңдікті пайдаланып, ${target} : ${p.divisor} бөліндісін табыңдар.`;
  z=`${target} = ${known} + ${p.divisor*p.extra}. Бөлгенде ${p.knownQuotient} + ${p.extra} = ${a} шығады. Тексеру: ${p.divisor} × ${a} = ${target}.`;break;
 }
 case'multiplier-guarantee':{
  const form=([op,c])=>op==='multiply'?`${c} × a`:`a + ${c}`;
  const good=p.choices.filter(([op,c])=>op==='multiply'?(p.base*c)%p.target===0:p.base%p.target===0&&c%p.target===0);assert.equal(good.length,1);a=form(good[0]);options=p.choices.map(form);assert.equal(good[0][0],'multiply');
  s=`a натурал саны ${p.base} санына бөлінеді. Қай өрнек кез келген осындай a үшін ${p.target} санына міндетті түрде бөлінеді?`;
  z=`a = ${p.base} × k болса, ${a} = ${p.base*good[0][1]} × k. Бұл ${p.target} санының еселігі. Қалған нұсқалар a = ${p.base} кезінде-ақ ${p.target} санына бөлінбейді: олардың мәндері ${show(p.choices.filter(c=>c!==good[0]).map(([op,c])=>op==='multiply'?p.base*c:p.base+c))}. Бөлгішті қосу оны көбейткіш ретінде енгізумен бірдей емес.`;break;
 }
 case'small-divisors-product-count':{
  const prod=mul(...p.factors),xs=range(1,p.limit).filter(d=>prod%d===0);a=xs.length;
  s=`1–${p.limit} тізіміндегі неше сан ${p.factors.join(' × ')} көбейтіндісін қалдықсыз бөледі? Үлкен көбейтіндіні бірден есептемей, көбейткіштерін пайдалануға болады.`;
  z=`Бастапқы көбейтіндінің жай көбейткіштері ${p.factors.flatMap(primeFactors).sort((a,b)=>a-b).join(' × ')}. Тізімнен жарайтын бөлгіштер ${show(xs)}. Олардың әрқайсысының жай көбейткіштері көбейтінді құрамында жеткілікті. Басқа сандарда жетіспейтін жай көбейткіш не оның дәрежесі бар. Бөлгіштер саны ${a}.`;break;
 }
 case'nondivisible-summands-counterexample':
  assert.ok(p.first%p.divisor!==0&&p.last%p.divisor!==0&&(p.first+p.last)%p.divisor===0);a=`қорытынды қате: ${p.first} + ${p.last} = ${p.first+p.last}, бұл сан бөлінеді`;
  options=[a,'қорытынды дұрыс: бөлінбейтін екі санның қосындысы да бөлінбейді',`қорытынды қате: ${p.first} саны бөлгішке бөлінеді`,`қорытынды дұрыс, себебі ${p.first} жұп сан`];assert.ok(p.last%2===1&&p.first%2===0);
  s=`Нұр: «${p.first} және ${p.last} сандары ${p.divisor} санына бөлінбейді, сондықтан олардың қосындысы да бөлінбейді», — деді. Дұрыс бағалауды таңдаңдар.`;
  z=`Қосылғыштардың қалдықтары ${p.first%p.divisor} және ${p.last%p.divisor}; қосындысы ${p.divisor}. Олар қосылғанда толық бір еселік жасайды: ${p.first} + ${p.last} = ${p.first+p.last} = ${p.divisor} × ${(p.first+p.last)/p.divisor}. Демек, тұжырым қате.`;break;
 case'two-stores-count':{
  const xs=range(p.lower+1,p.upper-1).filter(second=>second<p.total&&(p.total-second)%p.group===0);assert.equal(xs.length,1);a=xs[0];
  s=`Екі бөлмеде барлығы ${p.total} тұқым қорабы бар. Бірінші бөлмедегі қораптарды ${p.group} данадан толық жинақтарға бөлуге болады. Екінші бөлмеде ${p.lower} санынан көп, ${p.upper} санынан аз қорап бар. Екінші бөлмедегі санды табыңдар.`;
  z=`Барлығы ${p.group} санына бөлінеді және бірінші бөлмедегі сан да бөлінеді. Сондықтан екінші сан да бөлінеді. Аралықтағы жалғыз еселік ${a}; бірінші бөлмеде ${p.total-a} қорап қалады, ол ${p.group} санына бөлінеді.`;break;
 }
 case'infer-other-summand':
  a=`b саны ${p.divisor} санына бөлінеді`;options=[`b саны ${p.divisor} санына бөлінбейді`,`b саны ${2*p.divisor} санына бөлінеді`,a,`a × b көбейтіндісі ${p.divisor*p.divisor} санына бөлінбейді`];
  s=`a + b қосындысы да, a саны да ${p.divisor} санына бөлінеді; a, b — натурал сандар. Қай тұжырым әрқашан дұрыс?`;
  z=`b = (a + b) − a. Екі азайтылатын мән де ${p.divisor} санының еселігі, сондықтан b саны да бөлінеді. Екі есе үлкен бөлгішке бөлінуі міндетті емес: a = b = ${p.divisor} мысалы жеткілікті. Ал a × b ${p.divisor*p.divisor} санына бөлінеді.`;break;
 case'erased-summand':{
  const sum=p.last*(p.last+1)/2,xs=range(p.lower+1,p.last).filter(n=>(sum-n)%p.divisor===0);assert.equal(sum%p.divisor,0,'The saved task requires a difference of two multiples');assert.equal(xs.length,1);a=xs[0];
  s=`Карталарда 1–${p.last} сандары бір реттен жазылған. Бір картаны алып тастағанда, қалған сандардың қосындысы ${p.divisor} санына бөлінді. Алынған карта нөмірі ${p.lower} санынан үлкен. Оның нөмірін табыңдар.`;
  z=`Толық қосынды ${p.last} × ${p.last+1} : 2 = ${sum} = ${p.divisor} × ${sum/p.divisor}. Толық қосынды да, қалған қосынды да ${p.divisor} санына бөлінеді. Олардың айырмасы — алынған карта нөмірі де осы санға бөлінуі керек. ${p.lower+1}–${p.last} аралығындағы жалғыз еселік ${a}. Қалған қосынды ${sum-a} = ${p.divisor} × ${(sum-a)/p.divisor}.`;break;
 }
 default:throw Error('Unsupported divisibility property '+k);
 }
 return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const spec=(id,kind,params)=>({id,kind,params});
const SPECS=[
 spec('cc9372a5e7999147','difference-quotient',{left:216,right:72,divisor:18}),
 spec('b7201c26c8a60125','sum-nondivisible-explanation',{first:66,last:20,divisor:11}),
 spec('ed962b50268d1ad3','universal-product-rule',{divisor:7,composite:10,compositeFactors:[5,2]}),
 spec('162cee0bfd96a169','both-terms-choice',{operation:'subtract',divisor:8,pairs:[[72,24],[80,30],[64,27],[88,35]]}),
 spec('37625b2c15aa70e4','smallest-positive-addend',{base:24,divisor:8}),
 spec('8dfbda5077817802','guaranteed-product-divisor',{base:30,candidates:[4,7,12,15]}),
 spec('4bec37cbfae8a877','product-choice',{divisor:11,pairs:[[22,17],[15,23],[14,25],[16,9]]}),
 spec('655639c8c9c31c01','symbolic-one-term',{coefficient:72,divisor:8}),
 spec('8699c4acbdc6cde2','difference-quotient',{left:196,right:56,divisor:14}),
 spec('33ea64b3a1bbf296','symbolic-two-terms',{operation:'add',first:70,last:42,divisor:14}),
 spec('29f4af7e948f946a','product-quotient',{factors:[12,17,26],divisor:13}),
 spec('a044e890a7143ec7','sum-quotient',{first:88,last:66,divisor:11}),
 spec('12525a9118cecc0f','both-terms-choice',{operation:'add',divisor:8,pairs:[[24,50],[40,72],[48,30],[16,62]]}),
 spec('19b99ee1a2d089ad','product-quotient',{factors:[56,19],divisor:8}),
 spec('b1329d1e924db79b','product-quotient',{factors:[6,25,22],divisor:55}),
 spec('e5cd87f67a9af98d','divisible-expression-choice',{divisor:12,factorised:['multiply',17,['add',5,7]],choices:[['add',['multiply',17,5],['multiply',17,7]],['add',['multiply',17,5],7],['add',['multiply',18,5],4],['add',31,['multiply',17,2]]]}),
 spec('fd99fce80215423a','value-divisor-choice',{expr:['add',['multiply',35,12],28],factorised:['multiply',7,['add',['multiply',5,12],4]],candidates:[3,7,25,9],invert:false}),
 spec('0b064fcbc316f1c7','addend-choice',{base:60,divisor:12,candidates:[16,18,36,42]}),
 spec('96cf378afe87b6a4','nondivisible-expression-choice',{divisor:17,choices:[['multiply',17,23],['add',34,85],['subtract',136,51],['add',51,35]]}),
 spec('cce10da0f844158b','equal-teams',{first:28,last:42,groups:7}),
 spec('461499999acd5deb','value-divisor-choice',{expr:['subtract',['multiply',90,17],90],factorised:['multiply',90,['subtract',17,1]],candidates:[16,90,9,17],invert:true}),
 spec('8306c257c50d9dab','product-plus-remainder',{base:63,multiplier:11,added:4,divisor:9}),
 spec('cd1367880c0cbfec','divisor-transitivity',{base:14,must:7,double:28,falseDivisor:4}),
 spec('7271793c4d841b4a','bounded-difference-count',{base:180,divisor:15,upper:65}),
 spec('27e63c3f6a35dfb6','consecutive-product-quotient',{first:4,last:8,divisor:56}),
 spec('a8a74285aa0256ff','symbolic-two-terms',{operation:'subtract',first:110,last:66,divisor:22}),
 spec('69f5aa38e3ec6bb6','not-guaranteed-shift',{divisor:11,shift:6,multiplier:4}),
 spec('82e2e8b35a161774','append-digit-count',{divisor:4,example:132,illustrationDigit:6}),
 spec('78d2e94a4cc01fc0','value-divisor-choice',{expr:['subtract',['multiply',54,80],['multiply',80,9]],factorised:['multiply',80,['subtract',54,9]],candidates:[600,70,45,80],invert:true}),
 spec('32baf0f1b3796c94','two-digit-addend-count',{base:132,divisor:11}),
 spec('10ff29740db37d8e','one-divisible-one-not',{divisor:6}),
 spec('46b1ef61328c8a8d','multiplied-remainder',{divisor:11,remainder:8,multiplier:4}),
 spec('f6b4dea38f2afdea','consecutive-product-rule',{candidates:[2,3,8,10]}),
 spec('2c4c3ab95c0324ba','repeated-two-digit-block',{example:36,candidates:[11,13,101,1001]}),
 spec('2c99d7d55f6aaf25','three-consecutive-sum',{candidates:[2,3,5,9]}),
 spec('9e43b94df9ed8ac8','four-consecutive-sum',{}),
 spec('97d83e3c414dbfbf','range-multiple-count',{lower:3000,upper:3120,divisor:19}),
 spec('11ad2267270bda20','universal-sum-greatest-divisor',{first:20,last:35}),
 spec('09be16c684465b5b','decomposition-choice',{number:882,divisor:9,pairs:[[810,72],[800,82],[880,2],[700,182]]}),
 spec('5165371175cbcd08','nearby-known-quotient',{divisor:17,knownQuotient:101,extra:1}),
 spec('9ce414067008c664','multiplier-guarantee',{base:7,target:28,choices:[['multiply',7],['add',28],['multiply',2],['multiply',4]]}),
 spec('a9b3681cbfea63e5','small-divisors-product-count',{factors:[9,10,11],limit:12}),
 spec('548e133b0352b4f6','nondivisible-summands-counterexample',{first:46,last:17,divisor:7}),
 spec('ac667d44d061c6cf','two-stores-count',{total:154,group:11,lower:40,upper:50}),
 spec('b6ea4ac60a1adc7c','infer-other-summand',{divisor:11}),
 spec('a5c61f68033fd059','erased-summand',{last:32,lower:20,divisor:11})
];
const byId=new Map(SPECS.map(s=>['grade5-properties-'+s.id,s]));
export function renderEdition(row){const s=byId.get(row.editionId);assert.ok(s);assert.equal(row.modelId,'grade5-properties-'+s.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(s.params));return render(s.kind,row.params);}
export function buildEditions(){return SPECS.map(s=>{const src=sources.get(s.id);assert.ok(src,'Missing nonvisual property source '+s.id);return{editionId:'grade5-properties-'+s.id,modelId:'grade5-properties-'+s.kind,grade:5,topic:'num',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(s.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Әр sourceId үшін бөлінгіштіктің бастапқы бағыты, кез келген сан туралы шарты, қалдық не шектеулі санау дағдысы жеке сақталды.',
 'Сандық мысалдар мен қазақша жағдай қайта жазылды; жалпы теоремалардағы 2, 3, 4, 101 инварианттары жалған өзгертілмеді.',
 'Жауаптар жаңа деректерден есептеліп, формулалар мен нұсқалар параметрлерге толық байланды. Бір дағдының нұсқасы жаңа мағына деп саналмайды.'
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(s.kind,s.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const k of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges'])assert.equal(canonicalEdition(row[k]),canonicalEdition(e[k]));const result=renderEdition(row);for(const k of['statement','solution','options'])assert.equal(canonicalEdition(row[k]),canonicalEdition(result[k]),'Unbound divisibility text '+k);assert.equal(row.answer,result.answer);return{answer:result.answer,checks:['individual source divisibility implication or counting goal preserved','exact integer operations and explicit positive-domain constraints','universal claims justified algebraically and false converses countered','native expression tree and full text/options bound to fixed parameters','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const r of editions)verifyEdition(r);const out={schemaVersion:1,scope:'All 46 captured nonvisual grade5 topic2.3 sources rewritten separately. Universal invariants retained, no new meaning claimed from numerical variants. Pending independent review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-properties.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
