/** All captured grade5 topic2.6 nonvisual sources: individual authored drafts. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-powers-specs.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-6').map(q=>[q.sourceId,q]));
const seq=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const one=xs=>{assert.equal(xs.length,1,'Exactly one response required');return xs[0];};
const supers='⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup=n=>String(n).split('').map(c=>supers[Number(c)]).join('');
const power=(b,e)=>`${b}${sup(e)}`;
const mul=(b,e)=>Array(e).fill(String(b)).join(' × ');
const value=([b,e])=>b**e;
const values=ps=>ps.map(value);
const join=xs=>xs.join(', ');
const square=n=>Number.isInteger(Math.sqrt(n));
const cube=n=>seq(1,Math.ceil(Math.cbrt(n))).some(x=>x*x*x===n);
function render(k,p){let a,s,z,options;switch(k){
 case'natural-cube-root':case'natural-square-root':{
  const exponent=k==='natural-cube-root'?3:2,root=one(seq(1,p.value).filter(n=>n**exponent===p.value));a=root;
  s=exponent===3?`Құрылыс ойынында бір қабырғадағы текшелер санын үш рет көбейткіш етіп алғанда ${p.value} шығады. Қай натурал санның кубы ${p.value} санына тең?`:`Екі бірдей натурал көбейткіштің көбейтіндісі ${p.value}. Қай натурал санның квадраты осы мәнге тең?`;
  z=`${exponent===3?'Куб':'Квадрат'} дегеніміз — бір санды ${exponent===3?'үш':'екі'} рет көбейткіш етіп алу. ${power(root-1,exponent)} = ${(root-1)**exponent} < ${p.value}, ал ${power(root,exponent)} = ${mul(root,exponent)} = ${p.value}. Сондықтан натурал сан ${a}. Көрсеткішке жай бөлу осы кері есепті шешпейді.`;break;
 }
 case'square-plus':{
  a=p.base*p.base+p.added;options=[String(p.base*2+p.added),String((p.base+p.added)**2),String(a+p.base),String(a)];
  s=`Электрондық есеп парағындағы ${power(p.base,2)} + ${p.added} өрнегінің мәнін таңдаңдар.`;
  z=`Алдымен дәреже: ${power(p.base,2)} = ${p.base} × ${p.base} = ${p.base*p.base}. Содан кейін ${p.base*p.base} + ${p.added} = ${a}. ${p.base} × 2 + ${p.added} = ${p.base*2+p.added} дәрежені көбейтумен шатастырады. (${p.base} + ${p.added})² болса, мүлде басқа өрнек болар еді.`;break;
 }
 case'first-power-plus-one-power':
  a=p.base+1;s=`Екі ерекше дәреже берілді: ${power(p.base,1)} + ${power(1,p.onesExponent)}. Өрнектің мәнін табыңдар.`;
  z=`Бірінші дәреже санды өзгертпейді: ${power(p.base,1)} = ${p.base}. Бір санын неше рет өзіне көбейтсек те 1: ${power(1,p.onesExponent)} = 1. Сондықтан ${p.base} + 1 = ${a}. Көрсеткіштің өзі дәреженің мәні болмайды.`;break;
 case'ten-power-value':
  assert.ok(p.exponent>=2&&p.exponent<=9);a=10**p.exponent;s=`Ғылыми жазбадағы ${power(10,p.exponent)} дәрежесін кәдімгі натурал сан түрінде жазыңдар.`;
  z=`${power(10,p.exponent)} — ${mul(10,p.exponent)} көбейтіндісі. Әр 10 көбейткіші ондық разрядты бір орынға жылжытады. Нәтиже 1 цифрынан және ${p.exponent} нөлден тұрады: ${a}. Барлық цифр саны ${p.exponent+1}, ал нөл саны ${p.exponent}.`;break;
 case'coefficient-square':
  a=p.coefficient*p.base*p.base;s=`${p.coefficient} × ${power(p.base,2)} өрнегін есептеңдер. Дәреже қай көбейткішке қатысты екенін ескеріңдер.`;
  z=`Дәреже тек ${p.base} санына қатысты: ${power(p.base,2)} = ${p.base*p.base}. Оны сырттағы ${p.coefficient} санына көбейтеміз: ${p.coefficient} × ${p.base*p.base} = ${a}. Ал (${p.coefficient} × ${p.base})² = ${(p.coefficient*p.base)**2}, бұл берілген өрнек емес.`;break;
 case'name-cube':
  a=power(p.base,3);options=[power(3,p.base),power(p.base,2),a,`${p.base} × 3`];
  s=`«${p.base} санының кубы» деген математикалық жазуды таңдаңдар.`;
  z=`Куб — үшінші дәреже. Негізі ${p.base}, көрсеткіші 3, сондықтан ${a}. Ол ${mul(p.base,3)} көбейтіндісін білдіреді. ${power(3,p.base)} жазуында негіз бен көрсеткіш ауысып кеткен; ${power(p.base,2)} — квадрат, ал ${p.base} × 3 — жай көбейтінді.`;break;
 case'write-ten-power':
  a=power(10,p.exponent);options=[power(10,p.exponent-1),power(10,p.exponent+1),a,power(p.exponent,10)];
  s=`${10**p.exponent} санын негізі 10 болатын бір дәреже түрінде дұрыс жазған нұсқаны таңдаңдар.`;
  z=`1 цифрынан кейін ${p.exponent} нөл тұр. Сондықтан сан ${a} түрінде жазылады. Көршілес көрсеткіштер тиісінше ${10**(p.exponent-1)} және ${10**(p.exponent+1)} береді; оларда бір нөл кем не артық. Көрсеткіш пен негіздің орындарын ауыстыруға болмайды.`;break;
 case'identify-base-exponent':
  a=`негізі ${p.base}, көрсеткіші ${p.exponent}`;options=[`негізі ${p.exponent}, көрсеткіші ${p.base}`,a,`негізі ${p.base}, көрсеткіші ${p.base**p.exponent}`,`негізі ${p.base*p.exponent}, көрсеткіші ${p.exponent}`];
  s=`${power(p.base,p.exponent)} жазуындағы негіз бен дәреже көрсеткішін бірге дұрыс атаңдар.`;
  z=`Қайталанатын көбейткіш ${p.base}, сондықтан ол негіз. Бұл көбейткіш ${p.exponent} рет алынады, сондықтан жоғарғы ${p.exponent} — көрсеткіш. ${power(p.base,p.exponent)} = ${mul(p.base,p.exponent)} = ${p.base**p.exponent}; соңғы мәнді көрсеткішпен шатастырмаймыз.`;break;
 case'expand-power':
  a=mul(p.base,p.exponent);options=[a,`${p.base} × ${p.exponent}`,mul(p.exponent,p.base),Array(p.exponent).fill(p.base).join(' + ')];
  s=`${power(p.base,p.exponent)} дәрежесінің мағынасын қайталанатын көбейткіштермен дәл берген жазуды таңдаңдар.`;
  z=`Негіз ${p.base} саны, ол ${p.exponent} рет көбейткіш болады: ${power(p.base,p.exponent)} = ${a}. Негізді көрсеткішке көбейту, сандардың орындарын ауыстыру немесе көбейтудің орнына қосу дәреженің анықтамасына сәйкес емес.`;break;
 case'scaled-swapped-equality':{
  assert.equal(p.a**p.b,p.b**p.a);const left=`${p.multiplier} × ${power(p.a,p.b)}`,right=`${p.multiplier} × ${power(p.b,p.a)}`;a=`${left} = ${right}`;options=[a,`${left} > ${right}`,`${left} < ${right}`,'Салыстыру мүмкін емес'];
  s=`${left} және ${right} мәндерін салыстырыңдар. Негіз бен көрсеткіштің ауысуы осы жағдайда не береді?`;
  z=`${power(p.a,p.b)} = ${mul(p.a,p.b)} = ${p.a**p.b}. ${power(p.b,p.a)} = ${mul(p.b,p.a)} = ${p.b**p.a}. Екі мән де ${p.multiplier} санына көбейтіледі: ${p.multiplier} × ${p.a**p.b} = ${p.multiplier*p.a**p.b}. Сондықтан олар тең. Бұл барлық ауыстырылған негіздерге ортақ ереже емес: 2³ = 8, 3² = 9.`;break;
 }
 case'power-value':
  a=p.base**p.exponent;s=`Бірдей көбейткіштерден құралған көбейтіндінің ықшам жазуы ${power(p.base,p.exponent)}. Оның мәнін табыңдар.`;
  z=`${power(p.base,p.exponent)} = ${mul(p.base,p.exponent)}. Біртіндеп есептегендегі аралық мәндер ${join(seq(1,p.exponent).map(e=>p.base**e))}. Соңғысы ${a}. ${p.base} × ${p.exponent} = ${p.base*p.exponent} — негіз бен көрсеткіштің көбейтіндісі, дәреженің мәні емес.`;break;
 case'coefficient-ten-power':
  a=p.coefficient*10**p.exponent;s=`Разрядтық мөлшер ${p.coefficient} × ${power(10,p.exponent)} түрінде берілген. Кәдімгі сан түріндегі мәнін жазыңдар.`;
  z=`Алдымен ${power(10,p.exponent)} = ${10**p.exponent}. Сосын ${p.coefficient} × ${10**p.exponent} = ${a}. Дәреже тек 10 санына қатысты; (${p.coefficient} × 10)${sup(p.exponent)} деп бүкіл көбейтіндіні дәрежеге шығармаймыз. Соңында ${p.exponent} нөл сақталады.`;break;
 case'compress-product':
  a=power(p.base,p.count);options=[power(p.count,p.base),`${p.base} × ${p.count}`,String(p.base*p.count),a];
  s=`${mul(p.base,p.count)} көбейтіндісін бір дәреже түрінде жазыңдар.`;
  z=`Бірдей көбейткіш ${p.base}; оның саны ${p.count}. Сондықтан негіз ${p.base}, көрсеткіш ${p.count}: ${a}. ${p.base} × ${p.count} және ${p.base*p.count} қайталанатын көбейткіштердің орнына қайталанатын қосылғыштарды есептеп кетеді.`;break;
 case'power-place-expansion':
  a=1000*p.thousands+10*p.tens+p.units;options=[String(1000*p.thousands+100*p.tens+p.units),String(100*p.thousands+10*p.tens+p.units),String(a),String(10000*p.thousands+10*p.tens+p.units)];
  s=`${p.thousands} × 10³ + ${p.tens} × 10 + ${p.units} разрядтық жазуына сәйкес санды таңдаңдар.`;
  z=`${p.thousands} × 10³ = ${1000*p.thousands}, ${p.tens} × 10 = ${10*p.tens}. Барлығы ${1000*p.thousands} + ${10*p.tens} + ${p.units} = ${a}. Жүздіктер қосылғышы берілмеген, сондықтан жүздіктер орнына 0 жазылады. Нөлді алып тастау не ондықтарды жүздік орнына қою санды өзгертеді.`;break;
 case'division-power-plus-cube':{
  const divisor=p.divisorBase**2,other=p.cubeBase**3;assert.equal(p.numerator%divisor,0);a=p.numerator/divisor+other;
  s=`${p.numerator} : ${power(p.divisorBase,2)} + ${power(p.cubeBase,3)} өрнегінің мәнін табыңдар.`;
  z=`Алдымен екі дәреже: ${power(p.divisorBase,2)} = ${divisor}, ${power(p.cubeBase,3)} = ${other}. Бөлгіш тұтас ${divisor} саны: ${p.numerator} : (${p.divisorBase} × ${p.divisorBase}) = ${p.numerator/divisor}. Содан кейін ${p.numerator/divisor} + ${other} = ${a}. ${p.numerator} : ${p.divisorBase} × ${p.divisorBase} деп жақшаны жоғалту бастапқы бөлгішті өзгертеді.`;break;
 }
 case'sum-square':
  a=(p.first+p.second)**2;options=[String(p.first**2+p.second**2),String(a),String(2*(p.first+p.second)),String(p.first+p.second+2)];
  s=`(${p.first} + ${p.second})² өрнегінің мәнін таңдаңдар.`;
  z=`Алдымен жақша: ${p.first} + ${p.second} = ${p.first+p.second}. Одан кейін бүкіл қосындының квадраты: ${p.first+p.second} × ${p.first+p.second} = ${a}. Әр қосылғышты бөлек квадраттау ${p.first**2+p.second**2} береді, бірақ бұл ${power(p.first,2)} + ${power(p.second,2)} деген басқа өрнек.`;break;
 case'collect-coefficient-power':{
  const coefficient=p.first*p.second;a=`${coefficient}${p.variable}${sup(p.copies)}`;options=[`${p.first+p.second}${p.variable}${sup(p.copies)}`,a,`${coefficient}${p.variable}`,`${coefficient*p.copies}${p.variable}`];
  s=`${p.first} × ${p.variable} × ${p.second} × ${p.variable} × ${p.variable} көбейтіндісін ықшамдаңдар. Қай өрнек барлық натурал ${p.variable} мәндері үшін тең?`;
  z=`Көбейткіштердің орындарын ауыстыруға болады. Сандық көбейткіштер ${p.first} × ${p.second} = ${coefficient}. ${p.variable} үш рет көбейткіш: ${p.variable} × ${p.variable} × ${p.variable} = ${p.variable}³. Нәтиже ${a}. Мысалы, ${p.variable} = 2 болғанда екі өрнек те ${coefficient*8} береді. Сандық көбейткіштерді қосу немесе үш бірдей әріпті жай 3 көбейткішімен алмастыру дұрыс емес.`;assert.equal(p.copies,3);break;
 }
 case'both-square-cube':{
  a=one(p.numbers.filter(n=>square(n)&&cube(n)));options=p.numbers.map(String);const sr=Math.sqrt(a),cr=one(seq(1,a).filter(n=>n**3===a));
  s='Қай сан бір натурал санның квадраты да, басқа бір натурал санның кубы да болады? Екі шартты қатар тексеріңдер.';
  z=`Квадрат болу үшін екі бірдей көбейткіш, куб болу үшін үш бірдей көбейткіш керек. ${a} = ${power(sr,2)} = ${power(cr,3)}. Қалғандары үшін ${p.numbers.filter(n=>n!==a).map(n=>`${n}: ${square(n)?'квадрат, бірақ куб емес':cube(n)?'куб, бірақ квадрат емес':'екеуі де емес'}`).join('; ')}. Тек бір тізімде болуы жеткіліксіз.`;break;
 }
 case'largest-power':{
  const vs=values(p.powers),max=Math.max(...vs);a=power(...one(p.powers.filter((_,i)=>vs[i]===max)));options=p.powers.map(([b,e])=>power(b,e));
  s='Төрт дәреженің қайсысының мәні ең үлкен? Негізге немесе көрсеткішке жеке қарап қорытынды жасамаңдар.';
  z=`Дәрежелердің мәндері ретімен ${join(vs)}. Ең үлкені ${max}, оған ${a} сәйкес. Ең үлкен көрсеткіш не ең үлкен негіз бір өзі шешуші емес. ${power(...p.powers[1])} = ${power(...p.powers[3])} = ${vs[1]}, бірақ бұлар максимумнан кіші.`;break;
 }
 case'product-two-powers':{
  const x=value(p.first),y=value(p.second);a=x*y;options=[String(p.first[0]**2*y),String(p.first[0]*p.first[1]*y),String(x+y),String(a)];
  s=`${power(...p.first)} × ${power(...p.second)} өрнегінің мәнін таңдаңдар.`;
  z=`Әртүрлі негіздерге тиісті дәрежелерді бөлек есептейміз: ${power(...p.first)} = ${x}, ${power(...p.second)} = ${y}. Содан кейін ${x} × ${y} = ${a}. Екі дәрежені жай қоссақ ${x+y}; бұл көбейтудің орнына қосу қатесі. Әр көрсеткіш тек өзінің негізіне қатысты.`;break;
 }
 case'nested-archive-count':
  a=p.cabinets*p.branch**3;s=`Мектеп мұрағатында ${p.cabinets} шкаф бар. Әр шкафта ${p.branch} сөре, әр сөреде ${p.branch} папка, әр папкада ${p.branch} карточка сақталады. Барлық шкафтарда неше карточка бар?`;
  z=`Бір папкада ${p.branch} карточка. Бір сөреде ${p.branch} × ${p.branch} = ${p.branch**2}, бір шкафта ${p.branch} × ${p.branch**2} = ${p.branch**3} карточка, яғни ${power(p.branch,3)}. ${p.cabinets} шкафта ${p.cabinets} × ${p.branch**3} = ${a}. Шкафтар саны — бөлек көбейткіш; ішкі үш деңгейдің біреуін түсіріп қалдырмаймыз.`;break;
 case'sum-two-squares':
  a=p.first**2+p.second**2;s=`${p.first} және ${p.second} сандарының квадраттарының қосындысын есептеңдер.`;
  z=`Сұралған өрнек ${power(p.first,2)} + ${power(p.second,2)}. Әрқайсысын квадраттаймыз: ${p.first**2} және ${p.second**2}. Қосынды ${p.first**2} + ${p.second**2} = ${a}. Ал (${p.first} + ${p.second})² = ${(p.first+p.second)**2} — қосындының квадраты, бұл басқа сұрақ.`;break;
 case'coefficient-square-minus-cube':{
  const sq=p.squareBase**2,cu=p.cubeBase**3;a=p.coefficient*sq-cu;assert.ok(a>0);
  s=`${p.coefficient} × ${power(p.squareBase,2)} − ${power(p.cubeBase,3)} өрнегін есептеңдер.`;
  z=`Алдымен дәрежелер ${power(p.squareBase,2)} = ${sq}, ${power(p.cubeBase,3)} = ${cu}. Одан кейін көбейту ${p.coefficient} × ${sq} = ${p.coefficient*sq}. Соңында ${p.coefficient*sq} − ${cu} = ${a}. Сырттағы ${p.coefficient} көбейткішін квадраттың ішіне енгізбейміз.`;break;
 }
 case'find-exponent':{
  a=one(seq(1,12).filter(e=>p.base**e===p.value));s=`${p.base}ⁿ = ${p.value} теңдігі дұрыс болатындай натурал n көрсеткішін табыңдар.`;
  z=`${p.base} санын өзіне біртіндеп көбейтеміз: ${seq(1,a).map(e=>`${power(p.base,e)} = ${p.base**e}`).join('; ')}. Қажетті мән ${a} көбейткіштен кейін алынды, сондықтан n = ${a}. Кері тексеру: ${p.value} санын ${p.base} санына ${a} рет бөлсек, 1 қалады. ${p.value} : ${p.base} мәнін бірден көрсеткіш деуге болмайды.`;break;
 }
 case'nested-square-times':{
  const inner=p.innerBase**p.innerExponent,left=p.before-inner;assert.ok(left>0);a=left**2*p.multiplier;
  options=[String((left*p.multiplier)**2),String(a),String(left*2*p.multiplier),String((p.before-p.innerBase)**2*p.multiplier)];
  s=`(${p.before} − ${power(p.innerBase,p.innerExponent)})² × ${p.multiplier} өрнегінің мәнін таңдаңдар.`;
  z=`Жақша ішіндегі дәреже ${power(p.innerBase,p.innerExponent)} = ${inner}. Айырма ${p.before} − ${inner} = ${left}. Бүкіл жақшаның квадраты ${power(left,2)} = ${left**2}; соңғы көбейту ${left**2} × ${p.multiplier} = ${a}. Көбейткіш ${p.multiplier} квадраттан кейін тұр, оны жақшаға енгізіп квадраттау басқа нәтиже береді.`;break;
 }
 case'difference-two-powers':
  a=value(p.first)-value(p.second);assert.ok(a>0);s=`${power(...p.first)} − ${power(...p.second)} өрнегін есептеңдер.`;
  z=`${power(...p.first)} = ${mul(...p.first)} = ${value(p.first)}. ${power(...p.second)} = ${mul(...p.second)} = ${value(p.second)}. Екі дәрежеден кейін ғана азайтамыз: ${value(p.first)} − ${value(p.second)} = ${a}. Кері тексеру: ${value(p.second)} + ${a} = ${value(p.first)}.`;break;
 case'coefficient-missing-ten-exponent':
  assert.notEqual(p.coefficient%10,0);a=p.exponent;s=`${p.coefficient*10**p.exponent} = ${p.coefficient} × 10ⁿ теңдігінде n орнына қандай натурал сан қойылады?`;
  z=`${p.coefficient} коэффициентінің соңында нөл жоқ. Берілген сан ${p.coefficient} жазуынан кейін ${p.exponent} нөл тіркеу арқылы алынған. Демек, көбейткіш ${10**p.exponent} = ${power(10,p.exponent)}, n = ${a}. Тексеру: ${p.coefficient} × ${10**p.exponent} = ${p.coefficient*10**p.exponent}. Барлық цифр санын көрсеткіш деп алмаймыз.`;break;
 case'square-sum-discrepancy':{
  a=(p.first+p.second)**2-p.first**2-p.second**2;options=[String(a),'0',String(p.first**2+p.second**2),String(p.first*p.second)];
  s=`a = ${p.first}, b = ${p.second} болғанда (a + b)² − (a² + b²) өрнегінің мәнін таңдаңдар.`;
  z=`(a + b)² = (${p.first} + ${p.second})² = ${(p.first+p.second)**2}. Екінші жақша a² + b² = ${p.first**2} + ${p.second**2} = ${p.first**2+p.second**2}. Айырмасы ${(p.first+p.second)**2} − ${p.first**2+p.second**2} = ${a}. Бұл оң a мен b үшін нөл емес; осы сандарда 2 × ${p.first} × ${p.second} = ${a} арқылы да тексеріледі.`;break;
 }
 case'count-natural-squares':{
  const squares=seq(1,Math.ceil(Math.sqrt(p.last))).map(n=>n*n).filter(n=>n<=p.last);a=squares.length;options=p.choices.map(String);
  s=`1–${p.last} аралығындағы барлық натурал сандар қарастырылды, екі шеті де кіреді. Олардың нешеуі бір натурал санның квадраты?`;
  z=`1², 2², …, ${power(a,2)} квадраттары шектен аспайды: соңғысы ${a*a}. Келесі ${power(a+1,2)} = ${(a+1)**2}, ол ${p.last} санынан үлкен. Негіздер 1–${a} аралығында, сондықтан барлығы ${a} квадрат. 0 аралыққа кірмейді; келесі квадратты да қоспаймыз.`;break;
 }
 case'nine-divisible-ten-power-sum':{
  const ns=p.terms.map(([e,b])=>10**e+b),idx=one(seq(0,3).filter(i=>ns[i]%9===0));options=p.terms.map(([e,b])=>`${power(10,e)} + ${b}`);a=options[idx];
  s='Қай өрнектің мәні 9 санына қалдықсыз бөлінеді? Разрядтық жазудан цифрлар қосындысына өтіңдер.';
  z=`Өрнектердің кәдімгі мәндері ретімен ${join(ns)}. Цифрлар қосындылары ${join(ns.map(n=>sum([...String(n)].map(Number))))}. Тек ${a} = ${ns[idx]} үшін қосынды 9 еселігі. Тексеру: ${ns[idx]} : 9 = ${ns[idx]/9}. ${p.terms[idx][1]} қосылғанда тек соңғы цифрға қарап қалмай, оның екі цифрын да есепке аламыз.`;break;
 }
 case'odd-sum-square':{
  assert.equal(p.last%2,1);const count=(p.last+1)/2;assert.equal(count%2,0);a=count**2;
  s=`Алғашқы тақ сандардың 1 + 3 + 5 + … + ${p.last} қосындысын табыңдар. 1–${p.last} аралығындағы барлық тақ сан бір реттен алынады.`;
  z=`Мұнда (${p.last} + 1) : 2 = ${count} тақ сан бар. Алғашқы n тақ санның қосындысы n²: жауап ${power(count,2)} = ${a}. Жұптап тексерсек, 1 + ${p.last} = ${p.last+1}, 3 + ${p.last-2} = ${p.last+1}; осындай ${count/2} жұп бар. ${p.last+1} × ${count/2} = ${a}.`;break;
 }
 case'nines-digit-sum':
  a=9*p.exponent;s=`${power(10,p.exponent)} − 1 санының цифрларының қосындысын табыңдар.`;
  z=`${power(10,p.exponent)} = ${10**p.exponent}. Бірді азайтқанда ${p.exponent} дана 9 цифры шығады: ${10**p.exponent-1}. Цифрлар қосындысы 9 × ${p.exponent} = ${a}. Тексеру үшін ${10**p.exponent-1} + 1 = ${10**p.exponent}.`;break;
 case'square-boundary-code':{
  const last=seq(0,9).filter(d=>d*d%10===p.lastSquareDigit);assert.equal(last.length,2);const candidates=last.map(d=>10*p.tens+d);a=one(candidates.filter(n=>String(n*n)[0]===String(p.firstSquareDigit)&&String(n*n).length===4));
  s=`Екі таңбалы overline(${p.tens}a) кодының квадраты төрт таңбалы сан. Оның бірінші цифры ${p.firstSquareDigit}, соңғы цифры ${p.lastSquareDigit}. Мұнда a — бір цифр. Толық екі таңбалы кодты табыңдар.`;
  z=`Квадраттың соңғы цифры ${p.lastSquareDigit} болуы үшін a цифры ${last.join(' немесе ')} болуы керек: ${last.map(d=>`${d} × ${d} = ${d*d}`).join('; ')}. Сондықтан тек ${join(candidates)} кодтарын тексереміз: ${candidates.map(n=>`${power(n,2)} = ${n*n}`).join('; ')}. ${a*a} саны ${p.firstSquareDigit} цифрынан басталады; қалған үміткер бірінші цифр шартын орындамайды. Код ${a}.`;break;
 }
 case'power-last-digit':{
  const cycle=[];let d=1;do{d=d*p.base%10;cycle.push(d);}while(d*p.base%10!==cycle[0]);assert.equal(cycle.length,4);assert.notEqual(p.exponent%4,0);a=Number((BigInt(p.base)**BigInt(p.exponent))%10n);options=p.choices.map(String);
  s=`Толық мәнін жазбай, ${power(p.base,p.exponent)} санының соңғы цифрын табыңдар.`;
  z=`${p.base} дәрежелерінің соңғы цифрлары ${join(cycle)}, содан кейін осы төрттік қайталанады. ${p.exponent} = 4 × ${Math.floor(p.exponent/4)} + ${p.exponent%4}. Толық циклдерден кейін ${p.exponent%4}-орындағы цифр алынады: ${a}. Көрсеткіштің тек соңғы цифрына қарау циклдегі орынды дұрыс анықтамайды.`;break;
 }
 case'long-power-order':{
  const x=value(p.first),y=value(p.second),d=value(p.divisor),q=value(p.added),b=value(p.subtracted);assert.equal(x*y%d,0);assert.equal((x*y/d+q)%p.outerDivisor,0);a=(x*y/d+q)/p.outerDivisor-b;assert.ok(a>0);
  s=`(${power(...p.first)} × ${power(...p.second)} : ${power(...p.divisor)} + ${power(...p.added)}) : ${p.outerDivisor} − ${power(...p.subtracted)} өрнегін амалдардың ретімен есептеңдер.`;
  z=`Дәрежелер: ${power(...p.first)} = ${x}, ${power(...p.second)} = ${y}, ${power(...p.divisor)} = ${d}, ${power(...p.added)} = ${q}, ${power(...p.subtracted)} = ${b}. Жақша ішіндегі көбейту мен бөлуді солдан оңға орындаймыз: ${x} × ${y} = ${x*y}; ${x*y} : ${d} = ${x*y/d}. Қосу ${x*y/d} + ${q} = ${x*y/d+q}. Содан кейін ${x*y/d+q} : ${p.outerDivisor} = ${(x*y/d+q)/p.outerDivisor}; соңғы айырма ${(x*y/d+q)/p.outerDivisor} − ${b} = ${a}. Дәреже негізді көрсеткішке көбейту арқылы есептелмейді.`;break;
 }
 case'impossible-square':{
  const sq=p.numbers.filter(square);a=one(p.numbers.filter(n=>!square(n)));options=p.numbers.map(String);assert.ok([2,3,7,8].includes(a%10)&&sq.length===3);
  s='Қай сан ешбір натурал санның квадраты бола алмайды? Алдымен мүмкін болатын соңғы цифрларды қараңдар.';
  z=`0–9 цифрларының квадраттарының соңғы цифрлары тек 0, 1, 4, 5, 6, 9 бола алады. ${a} саны ${a%10} цифрымен аяқталады, сондықтан квадрат емес. Қалғандары шынымен квадрат: ${sq.map(n=>`${n} = ${power(Math.sqrt(n),2)}`).join('; ')}. Рұқсат етілген соңғы цифрдың өзі жеткілікті дәлел емес: мысалы, 21 квадрат емес.`;break;
 }
 case'compare-close-powers':{
  const first=power(...p.first),second=power(...p.second),x=value(p.first),y=value(p.second);assert.ok(p.first[0]<p.second[0]&&x>y);a=`${first} > ${second}`;options=[a,`${first} < ${second}`,`${first} = ${second}`,'Салыстыру мүмкін емес'];
  s=`${first} және ${second} сандарын салыстырыңдар.`;
  z=`Алдымен дәрежелерді есептейміз: ${first} = ${x}, ${second} = ${y}. ${x} > ${y}, айырмасы ${x-y}; сондықтан ${a}. Негізі кіші дәреженің көрсеткіші үлкен болуы мүмкін, сондықтан негіздерді ғана салыстыру дұрыс емес.`;break;
 }
 case'consecutive-power-gap':{
  const ns=seq(p.firstBase,p.firstBase+p.count-1),terms=ns.map(n=>n*n);a=terms[p.gapIndex];options=p.choices.map(String);
  s=`Қатардағы мүшелер ${p.firstBase}, ${p.firstBase+1}, …, ${ns.at(-1)} натурал сандарын бірдей белгісіз натурал дәрежеге шығару арқылы алынған. Қатар: ${terms.map((n,i)=>i===p.gapIndex?'□':n).join(', ')}. □ орнына қандай сан келеді?`;
  z=`Бірінші мән ${terms[0]} = ${power(ns[0],2)}, демек ортақ натурал көрсеткіш 2. Қалған көрінген мүшелер де сол сандардың квадраттары. Бос орындағы негіз ${ns[p.gapIndex]}, оның квадраты ${power(ns[p.gapIndex],2)} = ${a}. Тексеру: қатардың көршілес квадраттары арасындағы айырмалар ${join(terms.slice(1).map((n,i)=>n-terms[i]))} — бірінен кейін бірі келетін тақ сандар.`;break;
 }
 case'square-minus-double':
  a=p.base*p.base-2*p.base;s=`${power(p.base,2)} мәнінен ${p.base} × 2 мәнін азайтыңдар. Айырманы табыңдар.`;
  z=`Дәреже ${power(p.base,2)} = ${p.base} × ${p.base} = ${p.base*p.base}. Көбейтінді ${p.base} × 2 = ${2*p.base}. Айырма ${p.base*p.base} − ${2*p.base} = ${a}. Екі амалдың мәнін бірдей деп алу қате нөл береді.`;break;
 case'true-power-equality':{
  const index=one(seq(0,3).filter(i=>p.claims[i][0]**p.claims[i][1]===p.claims[i][2]));options=p.claims.map(([b,e,n])=>`${power(b,e)} = ${n}`);a=options[index];
  s='Дәрежелер жазылған төрт теңдіктің жалғыз дұрысын таңдаңдар.';
  z=`Сол жақтардың дұрыс мәндері ретімен ${join(p.claims.map(([b,e])=>b**e))}. Сондықтан ${a} ғана дұрыс. Негізді көрсеткішке көбейту, 1 дәрежесін көрсеткішке теңеу немесе бірінші дәрежені 1 деп алу — үш бөлек қате.`;break;
 }
 case'wrong-power-representation':{
  const vs=values(p.powers),index=one(seq(0,3).filter(i=>vs[i]!==p.target));options=p.powers.map(([b,e])=>power(b,e));a=options[index];
  s=`${p.target} санын дәреже түрінде көрсеткен жазулардың қайсысы қате?`;
  z=`Дәрежелердің мәндері ретімен ${join(vs)}. ${a} = ${vs[index]}, ол ${p.target} санына тең емес. Қалған үш жазу бір санның әртүрлі дәрежелік көріністері: квадрат, басқа жоғары дәреже және бірінші дәреже.`;break;
 }
 case'square-area-factor':
  assert.equal(p.larger%p.smaller,0);a=p.larger**2/p.smaller**2;s=`Екі шаршы әшекейдің қабырғалары ${p.larger} см және ${p.smaller} см. Үлкен шаршының ауданы кіші шаршының ауданынан неше есе үлкен?`;
  z=`Аудандар ${power(p.larger,2)} = ${p.larger**2} см² және ${power(p.smaller,2)} = ${p.smaller**2} см². Қатынасы ${p.larger**2} : ${p.smaller**2} = ${a}. Қабырғалар ${p.larger/p.smaller} есе өзгеше, бірақ аудан осы қатынастың квадраты: ${power(p.larger/p.smaller,2)} = ${a}. Жауап — өлшемсіз есе саны.`;break;
 case'cube-box-volume':
  a=p.edge**3;s=`Ойыншықтарды сақтайтын текше қораптың ішкі қыры ${p.edge} см. Қораптың ішкі көлемін текше сантиметрмен табыңдар.`;
  z=`Текшенің көлемі үш бағыттағы ұзындықтардың көбейтіндісі: ${p.edge} × ${p.edge} × ${p.edge} = ${power(p.edge,3)}. Алдымен ${p.edge} × ${p.edge} = ${p.edge**2}, содан кейін ${p.edge**2} × ${p.edge} = ${a} см³. ${p.edge**2} — бір жақтың ауданы ғана, көлем емес.`;break;
 case'fresh-information-tree':{
  const daily=seq(1,p.days).map(d=>p.branch**d);a=1+sum(daily);options=[String(daily.at(-1)),String(a),String(1+sum(daily.slice(0,-1))),String(p.branch**(p.days+1))];
  s=`Айсұлу бірінші күні хабарды ${p.branch} жаңа адамға айтты. Келесі әр күні хабарды кеше естіген әр адам оны тағы ${p.branch} жаңа адамға айтады. Бұл адамдардың ешқайсысы хабарды бұрын білмеген және бір адамға екі рет айтылмайды. ${p.days}-күннің соңында Айсұлудың өзін қоса алғанда барлығы неше адам хабарды біледі?`;
  z=`Күндер бойынша жаңадан естігендер ${seq(1,p.days).map(d=>`${power(p.branch,d)} = ${p.branch**d}`).join('; ')}. Әр күннің тобы бөлек, бастапқы Айсұлу да бір адам болып қосылады. Барлығы 1 + ${daily.join(' + ')} = ${a}. Тек соңғы күнгі ${daily.at(-1)} адамды алу алдыңғы күндер мен бастапқы адамды есептемей қалады.`;break;
 }
 case'unmatched-two-five-digit-count':{
  assert.ok(p.fives>p.twos&&p.twos>0);const spare=p.fives-p.twos,coefficient=5**spare;a=String(coefficient).length+p.twos;
  s=`${power(2,p.twos)} × ${power(5,p.fives)} көбейтіндісінің мәні неше цифрмен жазылады?`;
  z=`Әр 2 көбейткішін бір 5 көбейткішімен жұптаймыз: ${p.twos} жұптан ${power(10,p.twos)} шығады. ${p.fives} − ${p.twos} = ${spare} дана 5 артылады; ${power(5,spare)} = ${coefficient}. Көбейтінді ${coefficient} × ${10**p.twos} = ${coefficient*10**p.twos}. ${coefficient} коэффициентінде ${String(coefficient).length} цифр бар, оған ${p.twos} нөл тіркеледі. Барлығы ${String(coefficient).length} + ${p.twos} = ${a} цифр. Көрсеткіштерді жай қосу цифр санын бермейді.`;break;
 }
 case'least-square-above':{
  a=seq(1,p.threshold).find(n=>n*n>p.threshold);options=p.choices.map(String);
  s=`Квадраты ${p.threshold} санынан қатаң үлкен болатын ең кіші натурал санды таңдаңдар.`;
  z=`${power(a-1,2)} = ${(a-1)**2}, ол ${p.threshold} санына тең, сондықтан қатаң > шартын орындамайды. Келесі ${power(a,2)} = ${a*a} > ${p.threshold}. Натурал сандардың квадраттары өсе береді, сондықтан ${a} — ең кіші жарамды сан; одан үлкен жауаптар минималдықты бұзады.`;assert.equal((a-1)**2,p.threshold);break;
 }
 default:throw Error('Unsupported captured power skill '+k);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{assert.match(String(a),/^\d+$/);s+=' Жауапқа тек санды жазыңыз.';}
 return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const byId=new Map(SPECS.map(s=>['grade5-powers-'+s.id,s]));
export function renderEdition(row){const spec=byId.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,'grade5-powers-'+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src,'No read canonical source '+spec.id);const topic=['collect-coefficient-power','find-exponent','coefficient-missing-ten-exponent'].includes(spec.kind)?'eq':spec.kind==='consecutive-power-gap'?'seq':['square-area-factor','cube-box-volume'].includes(spec.kind)?'geo':'num';return{editionId:'grade5-powers-'+spec.id,modelId:'grade5-powers-'+spec.kind,grade:5,topic,difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Әр сақталған шарт, толық шешім және барлық нұсқа оқылды. Дәреже анықтамасы, негіз бен көрсеткіш, амал реті, разрядтық нөл, геометриялық өлшем не қайталану циклі дереккөзге жеке байланыстырылды.',
 'Қазақша мәтін мен деректер қайта жазылды. Тұрақты 2⁴ = 4² теңдігі сияқты математикалық инварианттар ашық сақталды; көпмағыналы тізбекке анық ортақ дәреже ережесі, хабар таратуға адамдардың қайталанбауы қосылды.',
 'Жаңа сандық редакция дербес жаңа математикалық мағына деп саналмайды. Ашық жауаптар бүтін сан; формулалар, жіктеулер мен салыстырулар толық MCQ ретінде бағаланады.',
 spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(row=>[row.editionId,row]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const k of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[k]),canonicalEdition(e[k]));const result=renderEdition(row);for(const k of['statement','solution','options'])assert.equal(canonicalEdition(row[k]),canonicalEdition(result[k]),'Unbound power text '+k);assert.equal(row.answer,result.answer);assert.ok(!/[\\$]/.test(row.statement+row.solution));return{answer:result.answer,checks:['individual captured power skill bound to fixed source-specific parameters','exact natural-power arithmetic, complete finite domains and strict bounds','whole coefficient/power grouping, base/exponent notation and unit dimensions retained','full condition, solution, numeric key and every MCQ option bound','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All 47 already captured nonvisual grade5 topic2.6 sources individually rewritten. Structural equalities retained, numerical variants do not imply independent semantic meanings. Awaiting independent content review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-powers.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
