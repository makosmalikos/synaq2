/** Individually rewritten saved3.5 nonvisual sources; no collection/publication. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-fraction-ray-specs.mjs';
const prefix='grade5-fraction-ray-',sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-5').map(q=>[q.sourceId,q]));
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a),lcm=(a,b)=>a/gcd(a,b)*b,range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),list=xs=>xs.join(', ');
const div=(a,b)=>{assert.ok(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>0&&a%b===0);return a/b;};
const Q=(n,d=1)=>{assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d>0);const g=gcd(n,d);return[n/g,d/g];},raw=q=>q.length===3?[q[0]*q[2]+q[1],q[2]]:q,rat=q=>Q(...raw(q)),add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),sub=(a,b)=>Q(a[0]*b[1]-b[0]*a[1],a[1]*b[1]),times=(a,n)=>Q(a[0]*n,a[1]),cmp=(a,b)=>a[0]*b[1]-b[0]*a[1],integer=q=>div(q[0],q[1]);
const side=x=>/^[0-9A-Za-z□]+$/.test(String(x))?String(x):`(${x})`,F=(n,d)=>`(${side(n)}/${side(d)})`,M=(w,n,d)=>n===0?String(w):w===0?F(n,d):`(${w} + ${F(n,d)})`,show=q=>q.length===3?M(...q):q[1]===1?String(q[0]):F(...q),reduced=q=>{const[n,d]=rat(q);return d===1?String(n):F(n,d);},asMixed=q=>{const[n,d]=rat(q);return M(Math.floor(n/d),n%d,d);};
const one=xs=>{assert.equal(xs.length,1);return xs[0];},rationalChoices=(p,target)=>{const choices=p.choices.map(show);return{options:choices,answer:one(choices.filter((_,i)=>cmp(rat(p.choices[i]),target)===0))};};
function render(kind,p){let s,z,a,options;switch(kind){
 case'remaining-unit-steps':{
  assert.ok(0<p.numerator&&p.numerator<p.denominator);a=p.denominator-p.numerator;s=`Сан сәулесіндегі P белгісінің координатасы ${F(p.numerator,p.denominator)}. P-ден 1 нүктесіне дейін әрқайсысы ${F(1,p.denominator)} бірлік болатын неше аралық қалады?`;
  z=`0 мен 1 арасы ${p.denominator} тең аралықтан тұрады. P-ге дейін ${p.numerator} аралық өткенбіз. Қалғаны ${p.denominator} − ${p.numerator} = ${a}. Бұл нүктелердің саны емес, аралықтар саны. Тексеру: ${p.numerator} + ${a} = ${p.denominator}, яғни бірлік толық толады.`;break;
 }
 case'minimal-fraction-partition':{
  assert.equal(gcd(p.numerator,p.denominator),1);a=p.denominator;s=`Дина 0 мен 1 арасын тең аралықтарға бөліп, ${F(p.numerator,p.denominator)} координаталы белгіні бөлу сызықшасына дәл түсіргісі келеді. Тең аралықтардың ЕҢ АЗ саны қандай?`;
  z=`${F(p.numerator,p.denominator)} қысқартылмайды, себебі ${p.numerator} мен ${p.denominator} өзара жай. Бірлікті ${p.denominator} тең аралыққа бөлсек, белгі ${p.numerator} аралықтан кейін түседі. Аз бөлікпен дәл келуі үшін ${p.denominator} саны сол бөлік санын бөлуі керек, ал ${p.denominator} санынан кіші оң еселік жоқ. Сондықтан ең азы ${a}. Алымдағы ${p.numerator} белгіге дейінгі аралық санын, бөлім толық бірліктегі аралық санын көрсетеді.`;break;
 }
 case'improper-point-to-mixed':{
  const q=Math.floor(p.numerator/p.denominator),r=p.numerator%p.denominator;assert.ok(r>0);({options,answer:a}=rationalChoices(p,Q(p.numerator,p.denominator)));s=`Сәуледегі R нүктесіне ${F(p.numerator,p.denominator)} саны жазылған. Оның орнын неше толық бірлік және қандай дұрыс бөлшек құрайды? Аралас жазуды таңдаңдар.`;
  z=`${p.numerator} : ${p.denominator} = ${q}, қалдық ${r}; ${q} × ${p.denominator} + ${r} = ${p.numerator}. Демек 0-ден ${q} толық бірлік, одан кейін тағы ${F(r,p.denominator)} бірлік оңға жүреміз. Координата ${M(q,r,p.denominator)}. ${r} < ${p.denominator}, сондықтан қалдық жаңа бүтін бірлік құрамайды.`;break;
 }
 case'right-offset-from-integer':{
  assert.ok(p.steps>0&&p.steps<p.denominator);const target=Q(p.whole*p.denominator+p.steps,p.denominator);({options,answer:a}=rationalChoices(p,target));s=`Әр бірлік ${p.denominator} тең қадамға бөлінген сан сәулесінде робот ${p.whole} белгісінен оңға ${p.steps} қадам жылжыды. Тоқтаған нүктесінің координатасын таңдаңдар.`;
  z=`Бір қадам ${F(1,p.denominator)} бірлік. Робот бастапқы ${p.whole} бірлікке ${F(p.steps,p.denominator)} бірлік қосты: ${p.whole} + ${F(p.steps,p.denominator)} = ${M(p.whole,p.steps,p.denominator)}. Бұл сан ${p.whole} және ${p.whole+1} сандарының арасында. Тек ${F(p.steps,p.denominator)} деп жазу бастапқы орынды ұмытады.`;break;
 }
 case'fraction-to-equal-grid':case'unit-fraction-to-grid':case'proper-fraction-to-centimetres':{
  const n=kind==='unit-fraction-to-grid'?1:p.numerator,scale=kind==='proper-fraction-to-centimetres'?p.centimetres:p.cells,step=div(scale,p.denominator);a=n*step;
  s=kind==='proper-fraction-to-centimetres'?`Өлшеу жолағындағы 0 мен 1 белгілерінің арасы ${scale} см. ${F(n,p.denominator)} координаталы белгі 0-ден неше сантиметр оңда орналасады?`:`Дәптердегі сан сәулесінде бірлік ${scale} торкөзге тең. ${F(n,p.denominator)} координаталы белгі бастапқы 0 нүктесінен неше торкөз оңға түседі?`;
  z=`Бірлік ${p.denominator} тең бөлікке бөлінеді. Бір бөлік ${scale} : ${p.denominator} = ${step} ${kind==='proper-fraction-to-centimetres'?'см':'торкөз'}. ${n} бөлік ${n} × ${step} = ${a}. Тексеру: барлық ${p.denominator} бөлік ${p.denominator} × ${step} = ${scale} болады; координата ${F(n,p.denominator)} бірліктен кіші.`;break;
 }
 case'lower-natural-neighbour':case'sum-natural-neighbours':{
  const q=Math.floor(p.numerator/p.denominator),r=p.numerator%p.denominator;assert.ok(q>0&&r>0);a=kind==='lower-natural-neighbour'?q:q+q+1;s=kind==='lower-natural-neighbour'?`Қашықтық шкаласындағы белгі ${F(p.numerator,p.denominator)} координатасында тұр. Ол екі көршілес натурал санның арасында. Сол екі санның тек КІШІСІН табыңдар.`:`${F(p.numerator,p.denominator)} координаталы белгі екі көршілес натурал санның арасында орналасқан. Белгіні екі жағынан қоршаған сол натурал сандардың ҚОСЫНДЫСЫ неше?`;
  z=`${q} × ${p.denominator} = ${q*p.denominator} < ${p.numerator} < ${(q+1)*p.denominator} = ${q+1} × ${p.denominator}. Сондықтан ${q} < ${F(p.numerator,p.denominator)} < ${q+1}. Координата ${M(q,r,p.denominator)}. ${kind==='lower-natural-neighbour'?`Сұралған кішісі ${q}, қалдық ${r} емес.`:`Екі көрші сан ${q} және ${q+1}; олардың қосындысы ${q} + ${q+1} = ${a}. Тек бүтін бөлікті жазу жеткіліксіз.`}`;break;
 }
 case'mixed-point-construction':{
  const build=(w,n,d)=>`0-ден ${w} толық бірлік, одан кейін бірлікті ${d} тең бөлікке бөліп, ${n} бөлігін оңға алу`;
  a=build(p.whole,p.numerator,p.denominator);options=[build(p.numerator,p.whole,p.denominator),build(p.whole,p.denominator,p.numerator),a,`Бірлікті ${p.denominator} тең бөлікке бөліп, 0-ден тек ${p.numerator} бөлігін алу`];s=`Шебер ${M(p.whole,p.numerator,p.denominator)} координатасына белгі қояды. Бұл аралас санды сан сәулесінде орналастырудың толық әрі дұрыс нұсқауын таңдаңдар.`;
  z=`Алдымен бүтін бөлікке сай 0-ден ${p.whole} бірлік оңға жылжимыз. Келесі бірлікті ${p.denominator} тең бөлікке бөліп, соның ${p.numerator} бөлігін аламыз. Осылай ${p.whole} + ${F(p.numerator,p.denominator)} = ${M(p.whole,p.numerator,p.denominator)} нүктесіне жетеміз. Бүтін бөлікті тастап кету не алым мен бөлімнің орындарын алмастыру басқа орынды береді.`;break;
 }
 case'coarsen-coordinate-grid':{
  const n=div(p.numerator,p.group),d=div(p.denominator,p.group);({options,answer:a}=rationalChoices(p,Q(n,d)));s=`Бірлік бастапқыда ${p.denominator} тең аралыққа бөлінген, K белгісі ${F(p.numerator,p.denominator)} орнында тұр. Енді қатар тұрған әр ${p.group} аралықты бір жаңа аралыққа біріктірді. Белгі қозғалмаса, оның координатасын жаңа бөліммен қалай жазады?`;
  z=`Жаңа аралықтардың толық саны ${p.denominator} : ${p.group} = ${d}. K-ге дейінгі жаңа аралық саны ${p.numerator} : ${p.group} = ${n}. Екі сан да бірдей ${p.group} есе азайды: ${F(p.numerator,p.denominator)} = ${F(n,d)}. ${n} жаңа аралық бұрынғы ${p.numerator} аралықты дәл жабады; нүктенің орны өзгермейді.`;break;
 }
 case'unit-midpoint':{
  assert.equal(p.left,0);assert.equal(p.right,1);({options,answer:a}=rationalChoices(p,Q(1,2)));s=`Калибрлеу жолағының сол шетіне 0, оң шетіне 1 жазылды. Екі шеттен бірдей қашықтықтағы ортаңғы белгіге қандай координата жазылады?`;
  z=`Жолақтың толық ұзындығы бір бірлік. Екі шетке дейінгі қашықтық бірдей болғандықтан, бірлік екі тең бөлікке бөлінеді. Ортаңғы белгі 0-ден бір осындай бөлік алыс: ${F(1,2)}. Тексеру: ${F(1,2)} + ${F(1,2)} = 1. Екі бөлік бар дегені координата 2 дегенді білдірмейді.`;break;
 }
 case'interior-division-marks':{
  a=p.parts-1;s=`0 және 1 шеттері бұрыннан белгіленген. Олардың арасын ${p.parts} тең аралық ету үшін тек ІШІНЕ неше жаңа сызықша қою қажет?`;
  z=`Әр көршілес екі аралықтың арасында бір сызықша болады. Шеткі екі белгі жаңа сызықшаға саналмайды, сондықтан ${p.parts} − 1 = ${a}. Ішкі белгілердің координаталары ${range(1,a).map(n=>F(n,p.parts)).join(', ')} — барлығы ${a}. Соңғы 1 белгісі тізімге кірмейді.`;break;
 }
 case'physical-distance-to-proper-coordinate':case'physical-distance-to-mixed-coordinate':{
  const q=Q(p.distance,p.unit);({options,answer:a}=rationalChoices(p,q));s=kind==='physical-distance-to-proper-coordinate'?`Мөлдір сызғыштағы сан сәулесінде 1 бірлік ${p.unit} см-ге тең. Бояулы белгі 0-ден ${p.distance} см оңда. Оның координатасы қандай?`:`Сызбада бір бірлік ${p.unit} см болып алынған. Т белгісі 0-ден оңға қарай ${p.distance} см қашықтықта тұр. Оның координатасын аралас санмен көрсетіңдер.`;
  const w=Math.floor(p.distance/p.unit),r=p.distance%p.unit;z=`Сантиметр санын бір бірліктің ұзындығына бөлеміз: ${p.distance} : ${p.unit} = ${F(p.distance,p.unit)}. `+(kind==='physical-distance-to-proper-coordinate'?`Бұл ${p.distance} рет ${F(1,p.unit)} бірлік, сондықтан координата ${a}. `:`${p.distance} = ${w} × ${p.unit} + ${r}; толық ${w} бірлік және тағы ${F(r,p.unit)} бірлік бар. Координата ${a}. `)+`Тексеру: ${F(p.distance,p.unit)} бірлікке ${p.unit} см-ден алсақ, бастапқы ${p.distance} см шығады. Сантиметр санының өзі координата емес.`;break;
 }
 case'equal-days-progress-grid':{
  const daily=div(p.cells,p.days);a=daily*p.elapsed;s=`Қабырға суреті ${p.days} күнде аяқталды, күн сайын бірдей үлесі боялды. Толық жұмысты бірлік деп алып, оны сан сәулесінде ${p.cells} торкөзбен көрсетті. ${p.elapsed} күндік жұмыстың белгісі 0-ден неше торкөз оңға түседі?`;
  z=`Бір күнгі жұмыс толық суреттің ${F(1,p.days)} бөлігі, шкалада ${p.cells} : ${p.days} = ${daily} торкөз. ${p.elapsed} күнде ${F(p.elapsed,p.days)} бөлігі дайын, оған ${p.elapsed} × ${daily} = ${a} торкөз сәйкес. Тексеру: ${p.days} × ${daily} = ${p.cells}, яғни толық мерзім толық бірлікті береді.`;break;
 }
 case'order-labelled-fraction-points':{
  const entries=p.points.map(([name,q])=>[name,integer(times(rat(q),p.cells))]);a=entries.toSorted((a,b)=>a[1]-b[1]).map(([name])=>name).join(', ');options=['A, B, C','B, A, C','C, A, B','C, B, A'];assert.equal(new Set(entries.map(e=>e[1])).size,3);s=`Бірлігі ${p.cells} торкөз болатын ортақ сәуледе ${p.points.map(([name,q])=>`${name}: ${show(q)}`).join('; ')} белгілері бар. 0-ден оңға жүргенде осы белгілер қай ретпен кездеседі?`;
  z=`Әр координатаны ${p.cells} торкөздік бірлікпен өлшейміз: ${entries.map(([name,c])=>`${name} — ${c} торкөз`).join('; ')}. Қашықтықтардың өсу реті ${entries.map(e=>e[1]).toSorted((a,b)=>a-b).join(' < ')}. Сондықтан солдан оңға ${a}. Аралас санның толық бірлігі есептен шығарылмайды.`;break;
 }
 case'same-denominator-grid-gap':{
  const left=integer(times(rat(p.left),p.cells)),right=integer(times(rat(p.right),p.cells));assert.ok(right>left);a=right-left;s=`Бір бірлік ${p.cells} торкөзге тең шкалада P координатасы ${show(p.left)}, Q координатасы ${show(p.right)}. Екі белгінің арасындағы ұзындық неше торкөз?`;
  z=`P 0-ден ${show(p.left)} × ${p.cells} = ${left} торкөз алыс. Q үшін бүтін бөліктегі ${p.right[0]} × ${p.cells} = ${p.right[0]*p.cells} торкөзге тағы ${p.right[1]} торкөз қосылады, барлығы ${right}. Аралығы ${right} − ${left} = ${a} торкөз. Екі орынның 0-ге дейінгі қашықтықтарын қоспаймыз.`;break;
 }
 case'infer-partition-from-two-sides':{
  const d=p.leftSteps+p.rightSteps;({options,answer:a}=rationalChoices(p,Q(p.whole*d+p.leftSteps,d)));s=`${p.whole} пен ${p.whole+1} белгілерінің арасы тең аралықтарға бөлінген. M нүктесіне дейін сол жақ шеттен ${p.leftSteps} аралық, M-нен оң жақ шетке дейін ${p.rightSteps} аралық бар. M координатасын табыңдар.`;
  z=`Толық бірлікте ${p.leftSteps} + ${p.rightSteps} = ${d} тең аралық бар. Сол жақтағы ${p.whole} белгісінен M-ге дейін олардың ${p.leftSteps} данасы өтеді. Сондықтан координата ${M(p.whole,p.leftSteps,d)}. Бөлімге тек ${p.rightSteps} санын жазу толық бірлікті емес, қалған бөлікті ғана есептер еді. Тексеру: ${p.leftSteps} және ${p.rightSteps} аралық қосылып дәл бірлік береді.`;break;
 }
 case'count-distinct-fraction-positions':{
  const positions=p.values.map(q=>integer(times(rat(q),p.cells))),distinct=[...new Set(positions)].toSorted((a,b)=>a-b);a=distinct.length;s=`Бірлігі ${p.cells} торкөз болатын бір сәулеге мына сандардың әрқайсысын белгіледі: ${p.values.map(show).join('; ')}. Бір орынға түскен жазулар бір ғана нүкте болып саналады. Неше бөлек нүкте шығады?`;
  z=`Жазулардың ретімен 0-ден қашықтықтары ${list(positions)} торкөз болады. Қайталанбайтын орындар ${list(distinct)} — ${a} орын. Атап айтқанда, ${F(8,12)} = ${F(2,3)} және ${M(1,1,4)} = ${F(15,12)} жұптары ортақ орындарға түседі. Жазулар саны ${p.values.length}, ал әртүрлі нүктелер саны ${a}; бұл екеуі бір ұғым емес.`;break;
 }
 case'grid-distance-to-reduced-coordinate':{
  const g=gcd(p.cells,p.distance);({options,answer:a}=rationalChoices(p,Q(p.distance,p.cells)));s=`Бірлік ${p.cells} торкөзге тең сан сәулесінде бояулы белгі 0-ден ${p.distance} торкөз оңда. Осы белгінің координатасын ҚЫСҚАРТЫЛМАЙТЫН бөлшек түрінде таңдаңдар.`;
  z=`Әр торкөз бірліктің ${F(1,p.cells)} бөлігі. Сондықтан координата ${F(p.distance,p.cells)}. Алым мен бөлімнің ЕҮОБ-і ${g}, екеуін де ${g} санына бөлеміз: ${F(p.distance,p.cells)} = ${F(p.distance/g,p.cells/g)}. Кері тексеру: бірлік ${p.cells} торкөз болса, осы үлес ${p.distance} торкөз береді. Бірлікке дейінгі қалған бөлікті жауап деп алмаймыз.`;break;
 }
 case'minimal-common-coordinate-scale':{
  const ds=p.fractions.map(q=>rat(q)[1]);a=ds.reduce(lcm,1);const positions=p.fractions.map(q=>integer(times(rat(q),a)));s=`Бір сәулеге ${p.fractions.map(show).join(', ')} координаталарын салу керек. Әр белгі дәптердің торкөз шекарасына дәл түсуі үшін бірліктің ЕҢ АЗ ұзындығы неше торкөз болады?`;
  z=`Бөлшектер қысқартылмайды. Бірліктегі торкөз саны ${list(ds)} сандарының әрқайсысына бөлінуі қажет. Ең үлкен бөлім ${Math.max(...ds)} санының еселіктерін тексереміз: ${list(range(1,a/Math.max(...ds)).map(k=>k*Math.max(...ds)))}. Осы тізімде барлық бөлімге бірдей бөлінетін алғашқысы ${a}, демек ең кіші ортақ еселік ${a}. ${a} торкөздік бірлікте белгілер тиісінше ${list(positions)} торкөзден кейін түседі. Бұдан кіші оң ортақ еселік болмағандықтан, бұл жай жарамды өлшем ғана емес, ең азы.`;break;
 }
 case'real-road-coordinate-distance':{
  const part=div(p.meters,p.denominator);a=part*p.numerator;s=`Лагерьден бақылау мұнарасына дейін ${p.meters} м. Осы түзу бағыттағы жолды бірлік деп, лагерьді 0, мұнараны 1 деп белгіледі. Бұлақ ${F(p.numerator,p.denominator)} координатасында тұр. Лагерьден бұлаққа дейін неше метр?`;
  z=`Бірлік ${p.meters} м болғандықтан, оның ${F(1,p.denominator)} бөлігі ${p.meters} : ${p.denominator} = ${part} м. Бұлаққа дейін ${p.numerator} осындай бөлік, ${part} × ${p.numerator} = ${a} м. Қалған ${p.meters-a} м мен жүрген ${a} м қосылып ${p.meters} м болады. Координатадағы бөлім метрдің өзін емес, бірліктің бөлінуін білдіреді.`;break;
 }
 case'left-offset-across-integer':{
  const n=p.denominator-p.steps;assert.ok(n>0&&n<p.denominator);({options,answer:a}=rationalChoices(p,Q(p.integer*p.denominator-p.steps,p.denominator)));s=`Сан сәулесінде әр бірлік ${p.denominator} тең қадамнан тұрады. Белгі ${p.integer} орнынан СОЛҒА ${p.steps} қадам көшірілді. Жаңа орнын көрсететін аралас санды таңдаңдар.`;
  z=`Солға жүргенде сан кемиді. Белгі ${p.integer-1} және ${p.integer} сандарының арасында қалады. Төменгі ${p.integer-1} белгісінен бастап санағанда ${p.denominator} − ${p.steps} = ${n} қадам бар, сондықтан координата ${M(p.integer-1,n,p.denominator)}. Кері тексеру: осы нүктеден оңға ${p.steps} қадам жүргенде ${p.integer} белгісіне жетеміз.`;break;
 }
 case'completed-route-coordinate':{
  const g=gcd(p.total,p.completed);({options,answer:a}=rationalChoices(p,Q(p.completed,p.total)));s=`Велокоманда ${p.total} км жаттығу бағытының ${p.completed} км бөлігін өтті. Сызбада старт 0, мәреге дейінгі толық жол 1 деп алынған. Команданың қазіргі орнына қандай қысқартылған координата сәйкес?`;
  z=`Жүрілген жолды толық жолға бөлеміз: ${F(p.completed,p.total)}. Екеуін де ${g} санына қысқартсақ, ${F(p.completed/g,p.total/g)} шығады. Тексеру: ${p.total} : ${p.total/g} × ${p.completed/g} = ${p.completed}. Қалған жол ${p.total-p.completed} км, сондықтан оның үлесі жүрген жолдың координатасы бола алмайды.`;break;
 }
 case'mixed-coordinate-to-centimetres':case'mixed-coordinate-to-equal-grid':{
  const scale=p.unit??p.cells,part=div(scale,p.denominator)*p.numerator;a=p.whole*scale+part;const u=kind==='mixed-coordinate-to-centimetres'?'см':'торкөз';s=kind==='mixed-coordinate-to-centimetres'?`Көрме сызбасындағы бір бірлік ${scale} см. ${M(p.whole,p.numerator,p.denominator)} координаталы белгі 0-ден неше сантиметр қашық орналасқан?`:`Бірлігі ${scale} торкөз болатын сәуледе ${M(p.whole,p.numerator,p.denominator)} координаталы белгі бар. Оған дейін 0-ден неше торкөз санау керек?`;
  z=`${p.whole} толық бірлік ${p.whole} × ${scale} = ${p.whole*scale} ${u}. Бөлшек бөлік ${scale} : ${p.denominator} × ${p.numerator} = ${part} ${u}. Барлығы ${p.whole*scale} + ${part} = ${a} ${u}. Нүкте ${p.whole*scale} және ${(p.whole+1)*scale} ${u} аралығында, бұл аралас санның бүтін бөлігіне сай.`;break;
 }
 case'internal-ratio-fraction-point':{
  const left=rat(p.left),right=rat(p.right),d=lcm(left[1],right[1]),L=integer(times(left,d)),R=integer(times(right,d)),part=div(R-L,p.ratio+1),m=L+part;({options,answer:a}=rationalChoices(p,Q(m,d)));s=`Бір сәуледе A координатасы ${show(p.left)}, B координатасы ${show(p.right)}. M нүктесі A мен B АРАСЫНДА, әрі MB ұзындығы AM ұзындығынан ${p.ratio} есе үлкен. M координатасын аралас санмен таңдаңдар.`;
  z=`Бірлікті ${d} тең бөлік десек, A — ${L}-ші, B — ${R}-ші бөліктің ұшы. AB ұзындығы ${R} − ${L} = ${R-L} бөлік. AM бір үлес, MB ${p.ratio} үлес, барлығы ${p.ratio+1} үлес. AM = ${R-L} : ${p.ratio+1} = ${part} бөлік. M орны ${L} + ${part} = ${m}, координатасы ${F(m,d)} = ${a}. Тексеру: MB ${R-m} бөлік, ${R-m} = ${p.ratio} × ${part}. AM мен MB орындарын ауыстырмаймыз.`;break;
 }
 case'farthest-from-half-grid':{
  const target=integer(times(rat(p.target),p.cells)),positions=p.fractions.map(q=>integer(times(rat(q),p.cells))),gaps=positions.map(x=>Math.abs(x-target));a=Math.max(...gaps);assert.equal(gaps.filter(x=>x===a).length,1);s=`Бірлік ${p.cells} торкөзге тең. Сол сәуледегі ${p.fractions.map(show).join('; ')} белгілерін ${show(p.target)} координаталы тірек белгімен салыстырды. Тіректен ең алыс белгінің оған дейінгі қашықтығы неше торкөз?`;
  z=`Тірек 0-ден ${target} торкөз алыс. Берілген белгілердің орындары ${list(positions)} торкөз. Тірекке дейінгі қашықтықтар ${list(gaps)} торкөз; оң жақта болса да, сол жақта болса да ұзындық оң санмен алынады. Ең үлкені ${a}, ол ${show(p.fractions[gaps.indexOf(a)])} белгісіне сәйкес. Ең үлкен координата әрқашан тіректен ең алыс нүкте бола бермейді.`;break;
 }
 case'farthest-from-whole-coordinate':{
  const positions=p.choices.map(q=>integer(times(rat(q),p.cells))),origin=p.target*p.cells,gaps=positions.map(x=>Math.abs(x-origin)),max=Math.max(...gaps);a=show(p.choices[one(gaps.map((x,i)=>x===max?i:null).filter(x=>x!==null))]);options=p.choices.map(show);s=`Бірлігі ${p.cells} торкөз болатын сәуледе нұсқалардағы төрт координата белгіленді. Олардың қайсысы ${p.target} координаталы нүктеден ең алыс орналасады?`;
  z=`Барлық нұсқа ${p.target} пен ${p.target+1} арасында. ${p.target} белгісі ${origin} торкөзде, ал төрт нұсқа ${list(positions)} торкөзде тұр. Оған дейінгі қашықтықтары ${list(gaps)} торкөз. Ең үлкені ${max}, сондықтан жауап ${a}. Бөлім неғұрлым үлкен болса, бірлік үлес соғұрлым кішірейеді; бөлімді ғана салыстыру жеткіліксіз.`;break;
 }
 case'infer-unit-from-fraction-gap':{
  const left=rat(p.left),right=rat(p.right),gap=sub(right,left);a=div(p.gap*gap[1],gap[0]);const L=integer(times(left,a)),R=integer(times(right,a));s=`Ортақ сан сәулесінде A координатасы ${show(p.left)}, B координатасы ${show(p.right)}. Екі белгінің арасы ${p.gap} торкөз екені өлшенді. Осы сәуленің бірлігі неше торкөзге тең?`;
  z=`Координаталардың айырмасы ${show(p.right)} − ${show(p.left)} = ${F(...gap)} бірлік. Осы ${gap[0]} үлес ${p.gap} торкөз болса, бір үлес ${p.gap} : ${gap[0]} = ${p.gap/gap[0]} торкөз. Толық бірлік ${gap[1]} × ${p.gap/gap[0]} = ${a} торкөз. Тексеру: A — ${L}, B — ${R} торкөз; ${R} − ${L} = ${p.gap}.`;break;
 }
 case'repeated-fractional-motion':{
  const n=p.numerator*p.minutes,target=Q(n,p.denominator);({options,answer:a}=rationalChoices(p,target));s=`Робот 0-ден сәуле бойымен тек оңға жылжиды. Әр минутта бірліктің ${F(p.numerator,p.denominator)} бөлігін өтеді. ${p.minutes} минуттан кейін қандай координатаға жетеді? Қысқартылған аралас санды таңдаңдар.`;
  z=`Әр минутта бірліктің ${F(1,p.denominator)} бөлігіндей ${p.numerator} үлес өтеді. ${p.minutes} минутта ${p.numerator} × ${p.minutes} = ${n} үлес, координата ${F(n,p.denominator)}. Бүтін бөлігі ${Math.floor(n/p.denominator)}, қалдығы ${n%p.denominator}: ${F(n,p.denominator)} = ${M(Math.floor(n/p.denominator),n%p.denominator,p.denominator)} = ${a}. Уақыттың ${p.minutes} санын бүтін бөлікке бірден жазуға болмайды.`;break;
 }
 case'infer-scale-then-second-coordinate':{
  const first=rat(p.first),unit=div(p.firstCells*first[1],first[0]),target=Q(p.secondCells,unit);({options,answer:a}=rationalChoices(p,target));s=`A белгісінің координатасы ${show(p.first)}, ол 0-ден ${p.firstCells} торкөз оңда. Осы сәуледе B 0-ден ${p.secondCells} торкөз оңға қойылды. B координатасын қысқартылған аралас санмен таңдаңдар.`;
  z=`${show(p.first)} бірлік ${p.firstCells} торкөзге тең. Бір ${F(1,first[1])} үлес ${p.firstCells} : ${first[0]} = ${p.firstCells/first[0]} торкөз, толық бірлік ${p.firstCells/first[0]} × ${first[1]} = ${unit} торкөз. Сондықтан B координатасы ${F(p.secondCells,unit)} = ${a}. Тексеру: A үшін ${unit} : ${first[1]} × ${first[0]} = ${p.firstCells}; бірлік ретінде ${p.firstCells} санын қате алмаймыз.`;break;
 }
 case'strict-between-mixed-count':{
  const left=integer(times(rat(p.left),p.denominator)),right=integer(times(rat(p.right),p.denominator)),inside=range(left+1,right-1);a=inside.length;const wholes=inside.filter(n=>n%p.denominator===0);s=`${show(p.left)} және ${show(p.right)} белгілерінің АРАСЫНА бөлімі дәл ${p.denominator}, алымы оң натурал сан болатын бөлшектерді белгіледі. Шеткі екі белгі есепке кірмейді. Алымы бөлімге еселік болатын жазулар да саналады. Неше белгі бар?`;
  z=`Шеттерді сол бөліммен жазамыз: ${show(p.left)} = ${F(left,p.denominator)}, ${show(p.right)} = ${F(right,p.denominator)}. Ішкі белгілердің алымдары ${left+1}–${right-1}, саны ${right-1} − ${left+1} + 1 = ${a}. ${wholes.map(n=>`${F(n,p.denominator)} = ${n/p.denominator}`).join('; ')} бүтін орындары да шартқа сай. Шеттердің ${left} және ${right} алымдары қосылмайды.`;break;
 }
 case'union-denominator-grid-count':{
  const [d,e]=p.denominators,step1=div(p.cells,d),step2=div(p.cells,e),first=range(1,p.cells-1).filter(k=>k%step1===0),second=range(1,p.cells-1).filter(k=>k%step2===0),both=first.filter(k=>second.includes(k));a=new Set([...first,...second]).size;s=`Бірлік ${p.cells} торкөзге тең. 0 мен 1 арасындағы барлық ішкі торкөз белгілері, яғни ${F(1,p.cells)}, ${F(2,p.cells)}, …, ${F(p.cells-1,p.cells)} қойылды. Олардың нешеуін бөлімі ${d} НЕМЕСЕ ${e} болатын бөлшекпен жазуға болады? Екі бөлімге де келетін белгі бір рет саналады.`;
  z=`Бөлімі ${d} болатын белгі әр ${step1} торкөз сайын түседі: ${list(first)} — ${first.length} белгі. Бөлімі ${e} үшін әр ${step2} торкөз: ${list(second)} — ${second.length} белгі. Екі тізімде ортақ ${list(both)} бар, оны ${both.length} рет шегереміз. Барлығы ${first.length} + ${second.length} − ${both.length} = ${a}. 0 және ${p.cells} торкөздегі шеттер бастапқы тізімге кірмейді.`;break;
 }
 case'unit-internal-distance-ratio':{
  ({options,answer:a}=rationalChoices(p,Q(p.ratio,p.ratio+1)));s=`O координатасы 0, U координатасы 1. X нүктесі O мен U арасында жатыр. OX кесіндісінің ұзындығы XU ұзындығынан ${p.ratio} есе үлкен. X координатасын таңдаңдар.`;
  z=`XU бір үлес болса, OX ${p.ratio} осындай үлес болады. Толық OU бірлігі ${p.ratio} + 1 = ${p.ratio+1} үлестен тұрады. Бір үлес ${F(1,p.ratio+1)}, сондықтан OX ${F(p.ratio,p.ratio+1)} бірлік. Тексеру: X-тен U-ге қалған ${F(1,p.ratio+1)} бөлікпен салыстырғанда OX шынымен ${p.ratio} есе үлкен. X бірліктің ішінде, сондықтан координата 1-ден кіші.`;break;
 }
 case'minimal-scale-then-gap':{
  const left=rat(p.left),right=rat(p.right),unit=lcm(left[1],right[1]),L=integer(times(left,unit)),R=integer(times(right,unit));a=R-L;s=`A координатасы ${show(p.left)}, B координатасы ${show(p.right)}. Екеуін торкөз сызықтарына дәл түсіру үшін бірлік МҮМКІН БОЛҒАН ЕҢ АЗ бүтін торкөз санымен алынды. Осы сызбада A мен B арасы неше торкөз?`;
  z=`Қысқартылған координаталардың бөлімдері ${left[1]} және ${right[1]}. Бірлік екеуіне де бөлінуі керек. ${Math.max(left[1],right[1])} санының еселіктері ${list(range(1,unit/Math.max(left[1],right[1])).map(k=>k*Math.max(left[1],right[1])))}; екі бөлімге де бөлінетін алғашқысы ${unit}. Осы өлшемде A — ${L}, B — ${R} торкөзде. Аралығы ${R} − ${L} = ${a}. Үлкен ортақ еселік те белгілерді торкөзге түсірер еді, бірақ шарт ең аз өлшемді талап етеді.`;break;
 }
 case'one-step-left-of-unit':{
  ({options,answer:a}=rationalChoices(p,Q(p.denominator-1,p.denominator)));s=`0 мен 1 арасы ${p.denominator} тең аралыққа бөлінді. 1 белгісінен бір аралық СОЛҒА тұрған жұлдызшаның координатасы қайсысы?`;
  z=`1-ге дейін ${p.denominator} аралық бар, біреуін кері шегерсек ${p.denominator} − 1 = ${p.denominator-1} аралық қалады. Сондықтан координата ${F(p.denominator-1,p.denominator)}. ${F(p.denominator+1,p.denominator)} оңға жылжуды, ал ${F(1,p.denominator)} 0-ден бір ғана аралықты көрсетер еді.`;break;
 }
 case'select-point-inside-unit':{
  const index=one(p.choices.map((q,i)=>cmp(rat(q),[0,1])>0&&cmp(rat(q),[1,1])<0?i:null).filter(x=>x!==null));a=show(p.choices[index]);options=p.choices.map(show);s=`Датчик белгісін сан сәулесінде 0-ден ОҢҒА, бірақ 1-ге ЖЕТКІЗБЕЙ орналастыру қажет. Қай координата осы талапты орындайды?`;
  z=`Талап 0 < x < 1 дегенді білдіреді. ${a} дұрыс бөлшегінде алым бөлімнен кіші, сондықтан ол екі шеттің арасында. Қалған ${p.choices.filter((_,i)=>i!==index).map(show).join('; ')} сандары 1-ден үлкен. Шеткі 0 не 1 де ашық аралыққа жатпайды.`;break;
 }
 case'midpoint-of-fraction-points':{
  const left=rat(p.left),right=rat(p.right),sum=add(left,right),target=Q(sum[0],sum[1]*2),d=lcm(left[1],right[1]),L=integer(times(left,d)),R=integer(times(right,d)),step=div(R-L,2);({options,answer:a}=rationalChoices(p,target));s=`Бір сәуледегі A координатасы ${show(p.left)}, B координатасы ${show(p.right)}. A мен B-ден бірдей қашықтықта, екеуінің арасында тұрған M координатасын таңдаңдар.`;
  z=`Бірлікті ${d} бөлікпен санасақ, A-ға дейін ${L}, B-ге дейін ${R} бөлік бар. Аралық ${R} − ${L} = ${R-L} бөлік. Оның жартысы ${step} бөлік, сондықтан орта 0-ден ${L} + ${step} = ${L+step} бөлік оңда. Координатасы ${F(L+step,d)===a?a:F(L+step,d)+' = '+a}. Тексеру: M-нің екі шетке дейінгі аралықтары да ${step} бөлік. ${reduced(sub(right,left))} — AB ұзындығы, M координатасы емес.`;break;
 }
 case'real-place-map-grid-gap':{
  const first=integer(times(rat(p.first),p.cells)),second=integer(times(rat(p.second),p.cells));a=second-first;s=`Серуен картасында музей 0 нүктесінде. Көрме музейден ${show(p.first)} км, спорт алаңы ${show(p.second)} км қашықтықта, екеуі де бір түзу бағытта. Картада 1 км ${p.cells} торкөзге тең. Көрме мен спорт алаңы арасы неше торкөз?`;
  z=`Көрме 0-ден ${p.cells} : ${p.first[1]} × ${p.first[0]} = ${first} торкөз алыс. Спорт алаңы ${p.cells} + ${p.cells} : ${p.second[2]} × ${p.second[1]} = ${second} торкөзде. Бір бағытта тұрғандықтан, аралық ${second} − ${first} = ${a} торкөз. Қашықтықтарды қосу ${second+first} берер еді, ол екі нүктенің арасын көрсетпейді.`;break;
 }
 case'irreducible-points-in-upper-half':{
  const ns=range(p.lower,p.upper),valid=ns.filter(n=>gcd(n,p.denominator)===1);a=valid.length;s=`Сәуледегі ${ns.map(n=>F(n,p.denominator)).join('; ')} координаталы белгілер қаралды. Олардың нешеуінің координатасы бастапқы қалпында ҚЫСҚАРТЫЛМАЙТЫН бөлшек?`;
  z=`${p.denominator} = 2 × 7, сондықтан алым 2-ге де, 7-ге де бөлінбесе бөлшек қысқармайды. ${ns.filter(n=>!valid.includes(n)).map(n=>`${F(n,p.denominator)} = ${reduced([n,p.denominator])}`).join('; ')} қысқарады. Қысқармайтындары ${valid.map(n=>F(n,p.denominator)).join('; ')} — ${a} белгі. Алымның жай сан болуы міндетті емес: 9 құрама болса да, 14-пен өзара жай.`;break;
 }
 case'different-units-physical-farthest':{
  const ds=p.points.map(([name,unit,q])=>[name,integer(times(rat(q),unit))]),max=Math.max(...ds.map(e=>e[1]));a=one(ds.filter(e=>e[1]===max))[0];options=[...p.points.map(e=>e[0]),`${p.points[0][0]} мен ${p.points[1][0]} (бірдей)`];s=`Үш оқушы жеке сәуле сызды: ${p.points.map(([name,unit,q])=>`${name} бірлікті ${unit} см алып, ${show(q)} координатасын белгіледі`).join('; ')}. Өз сызбасындағы 0-ден белгісіне дейінгі НАҚТЫ ұзындық кімде ең үлкен?`;
  z=`Сәулелердің бірлік ұзындықтары әртүрлі, сондықтан тек координаталарды салыстырмаймыз. Координатаны өз бірлігінің сантиметріне көбейтеміз: ${p.points.map(([name,unit,q],i)=>`${name}: ${show(q)} × ${unit} = ${ds[i][1]} см`).join('; ')}. Ең үлкені ${max} см, жауап ${a}. Алғашқы екі ұзындық тең болғанымен, олар ең алыс емес. Ең үлкен координатаға ең үлкен сантиметрлік ұзындық әрқашан сәйкес келмейді.`;break;
 }
 case'noninteger-tick-index':{
  const per=p.denominator-1,q=Math.floor((p.index-1)/per),r=(p.index-1)%per+1;a=q*p.denominator+r;s=`Әр бірлігі ${p.denominator} тең аралыққа бөлінген сәуледе БҮТІН координаталы белгілер саналмайды. Қалған сызықшалар 0-ден оңға қарай нөмірленеді: ${F(1,p.denominator)} — бірінші, …, ${F(per,p.denominator)} — ${per}-ші, ${M(1,1,p.denominator)} — ${per+1}-ші. ${p.index}-ші сызықшаны ${F('a',p.denominator)} түрінде жазғанда a неше?`;
  z=`Әр бірлікте бүтін емес ${per} сызықша бар. Алғашқы ${q} бірлікте ${q} × ${per} = ${q*per} сызықша саналады. Қажетті белгі келесі бірліктің ${p.index} − ${q*per} = ${r}-ші ішкі орнында. Координатасы ${M(q,r,p.denominator)} = ${F(a,p.denominator)}, сондықтан a = ${a}. Тексеру: 1–${a} алымдарының ${Math.floor(a/p.denominator)} данасы ${p.denominator} санына еселік, олар алынып тасталады: ${a} − ${Math.floor(a/p.denominator)} = ${p.index}. Бүтін координаталы сызықшаларды қосу нөмірді өзгертеді.`;break;
 }
 default:throw Error('Unknown fraction-ray model '+kind);
 }
 if(!options)s+=' Жауапқа тек санды жазыңыз.';
 if(options){assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(x=>x===a).length,1);}else assert.match(String(a),/^\d+$/);
 assert.ok(!/[\\$^]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(s=>[prefix+s.id,s]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,prefix+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:prefix+spec.id,modelId:prefix+spec.kind,grade:5,topic:'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 '3.5 тақырыбының сақталған 44 невизуалды бастапқы шарты, толық шешімі мен барлық нұсқалары жеке оқылды. Әр дерекке бөлек қазақша редакция жазылды; сызықша мен аралық, координата мен сантиметр/торкөз, оң/сол бағыт, ең аз масштаб және ашық шектер ажыратылды.',
 'Жаңа сандық деректер мен жағдайлар қолданылды: робот, қабырға суретінің дайындығы, калибрлеу жолағы, лагерь жолы, велобағыт, музей картасы. Сызбаға тәуелсіз барлық мәлімет шартта толық берілген. Математикалық анықтамалар өзгермейді; бастапқы түсініксіз салыстыру OX және XU ұзындықтары арқылы нақтыланды.',
 '44 редакция немесе model ID 44 жаңа математикалық мағына деп жарияланбайды. Тең бөлшектер бір нүкте, бірақ берілген бөліммен жазу міндеті сақталады; бүтінге тең бөлшектер қажет жерде саналады. Бөлшек/аралас/рет/атау жауаптары MCQ, ашық жауаптар тек бүтін сан. Бөлшектер native canonical жақшалармен, аралас сандар қосындының explicit canonical жазуымен беріледі.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(row=>[row.editionId,row]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const r=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(r[field]),'Unbound fraction-ray '+field);assert.equal(row.answer,r.answer);return{answer:r.answer,checks:['all44individual savedsource3.5skills read; no inferred missingdiagram data','all statement/solution/choices and fixedparams exactbound','exact rational coordinate/grid/physical units and shortestscale constraints','strict internalpoint/endpoint/whole-number count conditions explicit','native canonical fractions and numericmixed groups','external independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All44 saved nonvisual grade5 topic3.5 sources individually rewritten offline; variants/models are not semantic uniqueness. Independent review pending.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-fraction-ray.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
