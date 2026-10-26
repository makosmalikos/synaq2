/** Source-specific saved3.4 mixed-number drafts. No collection or publication. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-mixed-numbers-specs.mjs';
const prefix='grade5-mixed-numbers-',sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-4').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=ns=>ns.reduce((a,b)=>a+b,0),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const gcd=(a,b)=>b?gcd(b,a%b):a,reduce=(n,d)=>{const g=gcd(n,d);return[n/g,d/g];};
const div=(a,b)=>{assert.ok(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>0&&a%b===0);return a/b;};
const side=x=>/^[0-9A-Za-z□]+$/u.test(String(x))?String(x):`(${x})`,F=(n,d)=>`(${side(n)}/${side(d)})`,M=(w,n,d)=>n===0?String(w):`(${w} + ${F(n,d)})`,show=([w,n,d])=>M(w,n,d),list=xs=>xs.join(', ');
const converted=(w,n,d)=>w*d+n,toMixed=(n,d)=>{const w=Math.floor(n/d),r=n%d,[rn,rd]=reduce(r,d);return[w,rn,rd];};
const words={1:'бір',2:'екі',3:'үш',4:'төрт',5:'бес',6:'алты',7:'жеті',8:'сегіз',9:'тоғыз',10:'он',11:'он бір',12:'он екі',13:'он үш'},cases={1:'бірден',2:'екіден',3:'үштен',4:'төрттен',5:'бестен',6:'алтыдан',7:'жетіден',8:'сегізден',9:'тоғыздан',10:'оннан',11:'он бірден',12:'он екіден',13:'он үштен'};
const spoken=(w,n,d)=>{assert.ok(words[w]&&words[n]&&cases[d]);return `${words[w]} бүтін ${cases[d]} ${words[n]}`;};
const proof=(w,n,d)=>`${M(w,n,d)} = ${F(`${w} × ${d} + ${n}`,d)} = ${F(converted(w,n,d),d)}`;
function render(kind,p){let s,z,a,options;switch(kind){
 case'greatest-converted-numerator':{
  const max=p.denominator-1;a=converted(p.whole,max,p.denominator);s=`Аралас санның бүтін бөлігі ${p.whole}, бөлшек бөлігінің бөлімі ${p.denominator}. Оны сол бөліммен бұрыс бөлшекке айналдырғанда алымы ЕҢ КӨП неше болуы мүмкін?`;
  z=`Аралас санның бөлшек бөлігі оң дұрыс бөлшек, сондықтан оның алымы 1–${max} аралығында. Ең үлкені ${max}, сан ${M(p.whole,max,p.denominator)}. ${proof(p.whole,max,p.denominator)}; ең үлкен алым ${a}. Алымды ${p.denominator} деп алу бөлшек бөлікті 1-ге теңестіріп, бастапқы бүтін бөлікті өзгертеді.`;break;
 }
 case'count-unit-shares':case'unit-mass-package-count':{
  a=converted(p.whole,p.numerator,p.denominator);s=kind==='count-unit-shares'?`${M(p.whole,p.numerator,p.denominator)} санында неше ${F(1,p.denominator)} үлес бар?`:`Мектеп бағына ${M(p.whole,p.numerator,p.denominator)} кг тұқым дайындалды. Оны әрқайсысы ${F(1,p.denominator)} кг болатын пакеттерге түгел бөліп салды. Неше пакет толды?`;
  z=`Әр бүтінде ${p.denominator} бірлік үлес бар. ${p.whole} бүтін ${p.whole} × ${p.denominator} = ${p.whole*p.denominator} үлес, бөлшек бөлікте тағы ${p.numerator} үлес. Барлығы ${p.whole*p.denominator} + ${p.numerator} = ${a}. ${proof(p.whole,p.numerator,p.denominator)}. Тексеру: ${a} : ${p.denominator} = ${p.whole}, қалдық ${p.numerator}. Сұралғаны үлестер саны, бүтіннің саны ғана емес.`;break;
 }
 case'spoken-to-mixed':{
  a=M(p.whole,p.numerator,p.denominator);options=[M(p.whole,p.denominator,p.numerator),M(p.numerator,p.whole,p.denominator),M(p.denominator,p.numerator,p.whole),a];s=`«${spoken(p.whole,p.numerator,p.denominator)}» деген оқылымға сәйкес санды таңдаңдар. Нұсқадағы бүтін мен бөлшек қосылады.`;
  z=`«${words[p.whole]} бүтін» бүтін бөлік ${p.whole} екенін айтады. «${cases[p.denominator]}» — бөлім ${p.denominator}, соңғы «${words[p.numerator]}» — алым ${p.numerator}. Сондықтан сан ${a}. Алым мен бөлімді ауыстырғанда бөлшек бөлігі бұрыс болар еді; бүтін бөлікті де оқылымдағы бірінші саннан алу қажет.`;break;
 }
 case'ask-mixed-whole':case'ask-fractional-remainder':{
  const w=Math.floor(p.numerator/p.denominator),r=p.numerator%p.denominator;assert.ok(w>0&&r>0);a=kind==='ask-mixed-whole'?w:r;
  s=kind==='ask-mixed-whole'?`${F(p.numerator,p.denominator)} бөлшегін аралас санға айналдырыңдар. Осы аралас санның тек БҮТІН бөлігін жазыңдар.`:`${F(p.numerator,p.denominator)} бөлшегінен бүтін бөлікті бөліп алғанда, бөлшек бөлігінің АЛЫМЫ неше болады? Берілген бөлімді сақтаңдар.`;
  z=`${p.numerator} : ${p.denominator} = ${w}, қалдық ${r}, себебі ${p.denominator} × ${w} + ${r} = ${p.numerator} және 0 < ${r} < ${p.denominator}. Демек ${F(p.numerator,p.denominator)} = ${M(w,r,p.denominator)}. Толымсыз бөлінді ${w} — бүтін бөлік, қалдық ${r} — бөлшек бөлігінің алымы. Сұралған жауап ${a}.`;break;
 }
 case'mixed-to-improper-choice':case'mixed-to-numerator':{
  const n=converted(p.whole,p.numerator,p.denominator);a=kind==='mixed-to-improper-choice'?F(n,p.denominator):n;if(p.choices)options=p.choices.map(([n,d])=>F(n,d));
  s=kind==='mixed-to-improper-choice'?`${M(p.whole,p.numerator,p.denominator)} санын бұрыс бөлшекке айналдырып, дұрыс нұсқаны таңдаңдар.`:`${M(p.whole,p.numerator,p.denominator)} санын бөлімін өзгертпей бұрыс бөлшекке айналдырды. Шыққан бөлшектің алымы неше?`;
  z=`Бір бүтінде ${p.denominator} бірлік бөлік бар. Бүтін бөліктегі үлестер ${p.whole} × ${p.denominator} = ${p.whole*p.denominator}, оған ${p.numerator} үлес қосылады: ${n}. Сондықтан ${proof(p.whole,p.numerator,p.denominator)}. Бөлім өзгермейді. Бүтін санды алымға емес, бөлімге көбейтеміз; цифрларды тіркеп жазбаймыз.`;break;
 }
 case'improper-to-mixed-choice':case'reduce-improper-to-mixed':{
  const mixed=toMixed(p.numerator,p.denominator);a=show(mixed);options=p.choices.map(show);const w=Math.floor(p.numerator/p.denominator),r=p.numerator%p.denominator,[rn,rd]=reduce(r,p.denominator);
  s=kind==='reduce-improper-to-mixed'?`${F(p.numerator,p.denominator)} бөлшегін толық қысқартып, аралас санға айналдырған дұрыс жауапты таңдаңдар.`:`${F(p.numerator,p.denominator)} бөлшегіне тең аралас санды таңдаңдар.`;
  const[n,d]=reduce(p.numerator,p.denominator);z=(kind==='reduce-improper-to-mixed'?`Алдымен ${F(p.numerator,p.denominator)} = ${F(n,d)}. `:'')+`Алымды бөлімге бөлгенде бүтін бөлік ${mixed[0]}, бөлшек бөлік ${F(mixed[1],mixed[2])}, сондықтан ${a}. ${p.numerator} : ${p.denominator} = ${w}, қалдық ${r}. `+(kind==='reduce-improper-to-mixed'?`Қалдықты бастапқы бөліммен жазып қысқартсақ та ${F(r,p.denominator)} = ${F(rn,rd)} болады. `:'')+`Тексеру: ${w} × ${p.denominator} + ${r} = ${p.numerator}. Толымсыз бөлінді, қалдық және бөлімнің орындарын ауыстырмаймыз.`;break;
 }
 case'recognize-canonical-mixed':{
  a=show(p.correct);options=[a,show(p.invalid),F(...p.otherFractions[0]),F(...p.otherFractions[1])];s='Бүтін және бөлшек бөліктері дұрыс жазылған аралас санды таңдаңдар. Қатардағы бүтін мен бөлшек қосылады, көбейтілмейді.';
  const[w,n,d]=p.correct,[bad,bn,bd]=p.invalid;z=`${a} санында бүтін бөлік ${w}, бөлшек бөлік ${F(n,d)} дұрыс: 0 < ${n} < ${d}. ${show(p.invalid)} қосындысында ${F(bn,bd)} бұрыс болғандықтан, оны қосымша бүтінін бөліп қайта жазу қажет; бұл берілген қалпында қалыпты аралас жазу емес. Қалған ${p.otherFractions.map(q=>F(...q)).join(' және ')} жазуларында бөлек бүтін бөлік көрсетілмеген. Аралас санның бөлшек бөлігі дұрыс болуы шарт.`;break;
 }
 case'motion-mixed-whole':{
  const w=Math.floor(p.meters/p.seconds),r=p.meters%p.seconds;a=w;s=`Шағын дрон ${p.seconds} секундта ${p.meters} м ұшты. Орташа жылдамдықты м/с-пен аралас сан түрінде жазғанда оның БҮТІН бөлігі неше?`;
  z=`Жылдамдық ${p.meters} : ${p.seconds} = ${F(p.meters,p.seconds)} м/с. ${p.meters} = ${w} × ${p.seconds} + ${r}, сондықтан жылдамдық ${M(w,r,p.seconds)} м/с. Бүтін бөлігі ${w}; ${r} — қалдық, жылдамдықтың толық мәні емес. Тексеру: ${w} × ${p.seconds} + ${r} = ${p.meters}.`;break;
 }
 case'integer-fraction-numerator':{
  a=p.whole*p.denominator;s=`${p.whole} бүтін санын бөлімі ${p.denominator} болатын бөлшекпен жазу керек. Оның алымы қандай?`;
  z=`Бір бүтінде ${p.denominator} бірлік үлес бар. ${p.whole} бүтін үшін ${p.whole} × ${p.denominator} = ${a}. Сондықтан ${p.whole} = ${F(a,p.denominator)}. Кері тексеру: ${a} : ${p.denominator} = ${p.whole}. Қосынды ${p.whole} + ${p.denominator} бұл үлестер санын бермейді.`;break;
 }
 case'division-as-mixed-equality':{
  const{numerator:n,denominator:d,quotient:w,remainder:r}=p;assert.equal(w*d+r,n);assert.ok(0<r&&r<d);a=`${F(n,d)} = ${M(w,r,d)}`;options=[`${F(n,d)} = ${M(r,w,d)}`,a,`${F(n,w)} = ${M(d,r,w)}`,`${F(n,d)} = ${M(w,d,r)}`];
  s=`${n} : ${d} = ${w}, қалдық ${r}. Осы деректерді бұрыс бөлшек пен аралас санның дұрыс теңдігіне айналдырған жазуды таңдаңдар. Бүтін мен бөлшек бөліктер қосылады.`;
  z=`Бөлінгіш ${n} — бұрыс бөлшектің алымы, бөлгіш ${d} — бөлімі. Толымсыз бөлінді ${w} бүтін бөлікке, қалдық ${r} бөлшек бөлігінің алымына өтеді; бөлім ${d} сақталады. Демек ${a}. Тексеру ${w} × ${d} + ${r} = ${n}. Басқа нұсқаларда осы рөлдердің орны ауысқан.`;break;
 }
 case'mixed-component-description':{
  a=`Бүтін бөлігі ${p.whole}, бөлшек бөлігі ${F(p.numerator,p.denominator)}`;options=[a,`Бүтін бөлігі ${p.numerator}, бөлшек бөлігі ${F(p.whole,p.denominator)}`,`Бүтін бөлігі ${p.denominator}, бөлшек бөлігі ${F(p.whole,p.numerator)}`,`Бүтін бөлігі ${p.whole}, бөлшек бөлігі ${F(p.denominator,p.numerator)}`];s=`${M(p.whole,p.numerator,p.denominator)} санын құрайтын бүтін және бөлшек бөліктерді қатар дұрыс атаған нұсқаны таңдаңдар.`;
  z=`Бұл сан ${p.whole} және ${F(p.numerator,p.denominator)} қосындысынан тұрады: ${M(p.whole,p.numerator,p.denominator)} = ${p.whole} + ${F(p.numerator,p.denominator)}. Сондықтан бүтін бөлік ${p.whole}, ал бөлшек бөлік — тұтас ${F(p.numerator,p.denominator)}, оның алымы ғана емес. Кері ${F(p.denominator,p.numerator)} бұрыс болғандықтан, қалыпты аралас санның бөлшек бөлігі бола алмайды.`;break;
 }
 case'hours-minutes-as-mixed':{
  const[n,d]=reduce(p.minutes,60);a=M(p.hours,n,d)+' сағ';options=p.choices.map(q=>show(q)+' сағ');s=`Музыка дайындығы ${p.hours} сағат ${p.minutes} минут болды. Осы уақытты сағатпен қысқартылған аралас сан арқылы көрсетіңдер.`;
  z=`Бір сағат 60 минут, сондықтан ${p.minutes} минут = ${F(p.minutes,60)} сағ = ${F(n,d)} сағ. Бүтін ${p.hours} сағат сақталады: ${a}. 100 минутты бір сағат деп алу немесе минут санын бөлімге жазу дұрыс түрлендіру емес.`;break;
 }
 case'digit-sum-fractional-numerator':{
  const digits=String(p.whole).split('').map(Number),n=sum(digits);assert.ok(n<p.denominator);a=F(converted(p.whole,n,p.denominator),p.denominator);options=p.choices.map(q=>F(...q));s=`Айбар бір аралас сан сипаттады: бүтін бөлігі ${p.whole}, бөлшек бөлігінің бөлімі ${p.denominator}, ал алымы бүтін бөліктің цифрларының қосындысы. Бұл санға тең бұрыс бөлшекті таңдаңдар.`;
  z=`Цифрлар қосындысы ${digits.join(' + ')} = ${n}. ${n} < ${p.denominator}, демек бөлшек бөлігі дұрыс. Бастапқы сан ${M(p.whole,n,p.denominator)}. ${proof(p.whole,n,p.denominator)}. Цифрларды қатар тіркемейміз, бүтін бөлікті алымға емес, бөлімге көбейтеміз.`;break;
 }
 case'expand-mixed-fractional-part':{
  const scale=div(p.newDenominator,p.denominator),n=p.numerator*scale;a=M(p.whole,n,p.newDenominator);options=p.choices.map(show);s=`${M(p.whole,p.numerator,p.denominator)} санын бөлшек бөлігінің бөлімі ${p.newDenominator} болатын тең аралас санға ауыстырыңдар. Қай нұсқа дұрыс? Нұсқалардағы бүтін мен бөлшек қосылады.`;
  z=`Бүтін ${p.whole} өзгермейді. Бөлім ${p.newDenominator} : ${p.denominator} = ${scale} есе үлкейді, алым да ${p.numerator} × ${scale} = ${n} болуы керек. ${F(p.numerator,p.denominator)} = ${F(n,p.newDenominator)}, сондықтан ${a}. Тек бөлімді өзгертуге болмайды; бөлшек бөлігі бөлімнен кіші алыммен жазылады.`;break;
 }
 case'blank-mixed-numerator':case'inverse-fractional-numerator':{
  a=p.improperNumerator-p.whole*p.denominator;assert.ok(a>0&&a<p.denominator);s=kind==='blank-mixed-numerator'?`${M(p.whole,'□',p.denominator)} = ${F(p.improperNumerator,p.denominator)} теңдігінде бүтін мен бөлшек қосылады. Бос торға қандай сан жазылады?`:`Бүтін бөлігі ${p.whole}, бөлшек бөлігінің бөлімі ${p.denominator} болатын аралас санды сол бөліммен бұрыс бөлшекке айналдырғанда алым ${p.improperNumerator} шықты. Бөлшек бөлігінің алымын табыңдар.`;
  z=`Бүтін бөлікте ${p.whole} × ${p.denominator} = ${p.whole*p.denominator} бірлік үлес бар. Қалғаны ${p.improperNumerator} − ${p.whole*p.denominator} = ${a}. Бұл бөлшек бөлігінің алымы. 0 < ${a} < ${p.denominator}, яғни дұрыс бөлшек. ${proof(p.whole,a,p.denominator)}. Бөлім сақталып, белгісіз қосылғыш азайту арқылы табылды.`;break;
 }
 case'square-side-mixed':{
  const m=toMixed(p.perimeter,4);a=show(m)+' см';options=p.choices.map(q=>show(q)+' см');s=`Квадрат пішінді қағаздың периметрі ${p.perimeter} см. Оның бір қабырғасының ұзындығын қысқартылған аралас санмен таңдаңдар.`;
  z=`Квадраттың төрт қабырғасы тең, сондықтан бір қабырғасы ${p.perimeter} : 4 = ${F(p.perimeter,4)} см. ${p.perimeter} = ${Math.floor(p.perimeter/4)} × 4 + ${p.perimeter%4}. Бөлшек бөлікті қысқартамыз: ${F(p.perimeter%4,4)} = ${F(m[1],m[2])}. Нәтиже ${a}. Төрт осындай қабырғаның бүтін бөліктері ${m[0]*4} см, бөлшек бөліктері қалған ${p.perimeter-m[0]*4} см периметр береді. 2-ге ғана бөлу бір қабырғаны бермейді.`;break;
 }
 case'noninteger-quotient-count':case'count-fixed-whole-denominator':{
  const rems=range(1,p.denominator-1);a=rems.length;s=kind==='noninteger-quotient-count'?`${F('n',p.denominator)} бөлшегінен бүтін бөлікті алғанда бүтіні ${p.whole}, бөлшек бөлігі НӨЛДЕН ӨЗГЕ аралас сан шығуы керек. n — оң натурал сан. n неше түрлі мән қабылдайды?`:`Бүтін бөлігі ${p.whole}, бөлшек бөлігінің бөлімі ${p.denominator} болатын неше аралас сан жазылады? Бөлшек бөлігінің алымы оң натурал сан.`;
  z=`Бөлшек бөлігінің алымы r үшін 1 ≤ r < ${p.denominator}. Толық тізім ${list(rems)} — ${a} мән. ${kind==='noninteger-quotient-count'?`n = ${p.whole*p.denominator} + r, яғни ${list(rems.map(r=>p.whole*p.denominator+r))}. `:''}r = 0 болса сан тек ${p.whole} бүтінге тең; r = ${p.denominator} болса тағы бір бүтін қосылады. Екеуі де берілген қалыптағы аралас санға кірмейді. Шеткі жарамды сандар ${M(p.whole,1,p.denominator)} және ${M(p.whole,p.denominator-1,p.denominator)}.`;break;
 }
 case'metres-centimetres-as-mixed':{
  const[n,d]=reduce(p.centimeters,100);a=M(p.meters,n,d)+' м';options=p.choices.map(q=>show(q)+' м');s=`Көрме тақтасының ені ${p.meters} м ${p.centimeters} см. Оны метрмен қысқартылған аралас сан түрінде таңдаңдар.`;
  z=`1 м = 100 см. ${p.centimeters} см = ${F(p.centimeters,100)} м = ${F(n,d)} м. Бүтін ${p.meters} метрмен бірге ${a}. Тексеру: ${F(n,d)} = ${F(p.centimeters,100)}; метрді сантиметрге қайта айналдырсақ бастапқы ${100*p.meters+p.centimeters} см шығады. Бөлшек бөлікте 100 см негізі қолданылады.`;break;
 }
 case'mixed-hours-to-minutes':{
  const frac=div(60,p.denominator)*p.numerator;a=p.whole*60+frac;s=`Ғылыми кездесу ${M(p.whole,p.numerator,p.denominator)} сағатқа созылды. Бұл барлығы неше минут?`;
  z=`Бүтін бөлік ${p.whole} × 60 = ${p.whole*60} минут. Сағаттың ${F(p.numerator,p.denominator)} бөлігі ${60} : ${p.denominator} × ${p.numerator} = ${frac} минут. Барлығы ${p.whole*60} + ${frac} = ${a}. Басқа тексеру: ${converted(p.whole,p.numerator,p.denominator)} бірлік үлестің әрқайсысы ${60/p.denominator} минут, сондықтан ${converted(p.whole,p.numerator,p.denominator)} × ${60/p.denominator} = ${a}.`;break;
 }
 case'boat-mixed-rate':{
  const m=toMixed(p.kilometers,p.hours);a=show(m)+' км/сағ';options=p.choices.map(q=>show(q)+' км/сағ');s=`Зерттеу кемесі ${p.hours} сағатта ${p.kilometers} км жүзді. Орташа жылдамдықты км/сағ-пен қысқартылған аралас сан түрінде таңдаңдар.`;
  z=`Жылдамдық = жол : уақыт, ${p.kilometers} : ${p.hours} = ${F(p.kilometers,p.hours)} км/сағ. Толымсыз бөлінді ${m[0]}, бастапқы қалдық ${p.kilometers%p.hours}. Алдымен ${M(m[0],p.kilometers%p.hours,p.hours)}, бөлшек бөлікті қысқартсақ ${a}. Тексеру: ${m[0]} × ${p.hours} + ${p.kilometers%p.hours} = ${p.kilometers}. Бөлшек бөліктегі бөлімді уақыттан аламыз, қалдықтың өзінен емес.`;break;
 }
 case'normalize-improper-fractional-part':{
  a=p.whole+Math.floor(p.numerator/p.denominator);const r=p.numerator%p.denominator;s=`Әлия санды ${M(p.whole,p.numerator,p.denominator)} деп жазды, мұнда бүтін мен бөлшек ҚОСЫЛАДЫ. Бөлшек бөлігі бұрыс болғандықтан, бұл қалыпты аралас жазу емес. Оны қалыпты аралас санға айналдырғанда бүтін бөлігі неше болады?`;
  z=`${F(p.numerator,p.denominator)} = ${M(Math.floor(p.numerator/p.denominator),r,p.denominator)}. Осыдан қосымша ${Math.floor(p.numerator/p.denominator)} бүтін бөлініп шығады, оны бұрынғы ${p.whole} бүтінге қосамыз: ${p.whole} + ${Math.floor(p.numerator/p.denominator)} = ${a}. Қалыпты сан ${M(a,r,p.denominator)}. Тексеру: жалпы үлестер ${p.whole} × ${p.denominator} + ${p.numerator} = ${p.whole*p.denominator+p.numerator}; ${a} × ${p.denominator} + ${r} сол санға тең. Бастапқы қалыпты емес жазудағы қосындының сандық мәні өзгермеді; оның бүтін бөлігі мен дұрыс бөлшек бөлігі қайта бөлінді.`;break;
 }
 case'recover-dividend-from-mixed':{
  a=converted(p.whole,p.numerator,p.divisor);s=`Белгісіз x санын ${p.divisor} санына бөлгенде нақты бөлінді ${M(p.whole,p.numerator,p.divisor)} болды. x неше?`;
  z=`${F('x',p.divisor)} = ${M(p.whole,p.numerator,p.divisor)} = ${F(a,p.divisor)}. Бөлімдер бірдей, сондықтан x = ${a}. Тікелей кері амал: ${p.whole} × ${p.divisor} + ${p.numerator} = ${a}. Тексеру: ${a} : ${p.divisor} = ${p.whole}, қалдық ${p.numerator}. Бұл нақты бөлінді мен қалдықпен бөлудің өзара байланысы.`;break;
 }
 case'count-symbolic-mixed-products':{
  const product=p.improperNumerator-p.fractionalNumerator,pairs=range(1,product).filter(b=>product%b===0).map(b=>[product/b,b]),valid=pairs.filter(([_a,b])=>p.fractionalNumerator<b);a=valid.length;
  s=`Бүтін бөлігі a, бөлшек бөлігі ${F(p.fractionalNumerator,'b')} болатын аралас сан ${F(p.improperNumerator,'b')} бөлшегіне тең. a және b — оң натурал сандар. Неше жарамды аралас сан бар?`;
  z=`Түрлендіру бойынша a × b + ${p.fractionalNumerator} = ${p.improperNumerator}, сондықтан a × b = ${product}. Барлық (a; b) жұптар: ${pairs.map(q=>'('+q.join('; ')+')').join(', ')}. Бөлшек бөлігі дұрыс болуы үшін b > ${p.fractionalNumerator}; жарамдылары ${valid.map(([w,d])=>M(w,p.fractionalNumerator,d)).join(', ')} — ${a} сан. Қалған жұптарда бөлшек бөлігі дұрыс емес, олар берілген жазудың талабына сай келмейді.`;break;
 }
 case'three-distinct-digit-mixed-count':{
  const states=p.digits.flatMap(w=>p.digits.filter(n=>n!==w).flatMap(n=>p.digits.filter(d=>d!==w&&d>n).map(d=>[w,n,d])));a=states.length;s=`${list(p.digits)} цифрларының үшеуін алып аралас сан жазыңдар: бүтін бөлік, бөлшек бөлігінің алымы мен бөлімі — әрқайсысы бір цифр және үшеуі әртүрлі. Бөлшек бөлігі дұрыс болуы тиіс. Неше түрлі жазу шығады?`;
  z=p.digits.map(w=>`Бүтін ${w}: ${states.filter(q=>q[0]===w).map(show).join(', ')}`).join('; ')+`. Әр бүтін таңдауынан кейін қалған үш цифрдан алым-бөлімге екі цифрды таңдаймыз, кішісі міндетті түрде алым. Әр бүтінге 3 жазу, барлығы ${p.digits.length} × 3 = ${a}. Бір цифр екі орында қайталанбайды; 0 цифры берілмеген, сондықтан бүтін мен бөлім оң.`;break;
 }
 case'irreducible-remainder-dividend-list':{
  const rs=range(1,p.denominator-1).filter(r=>gcd(r,p.denominator)===1),values=rs.map(r=>p.whole*p.denominator+r);a=list(values);const odds=range(1,p.denominator-1).filter(r=>r%2).map(r=>p.whole*p.denominator+r);options=[list(odds),a,list(values.filter(n=>n!==65)),list(values.slice(1))];
  s=`x — оң натурал сан. ${F('x',p.denominator)} бөліндісі бүтін бөлігі ${p.whole} болатын аралас санға тең. Берілген ${p.denominator} бөлімдегі бөлшек бөлігі қысқармайтын болуы керек. Барлық жарамды x мәндерін таңдаңдар.`;
  z=`x = ${p.whole*p.denominator} + r, мұнда 1 ≤ r < ${p.denominator}. Қысқармау үшін ЕҮОБ(r, ${p.denominator}) = 1. Қалдықтар ${list(rs)}, сондықтан x мәндері ${a}. Тек тақ болу жеткіліксіз: ${F(3,p.denominator)} қысқарады. x санының өзі жай болуы шарт емес: мысалы 65 жарамды, өйткені қалдық ${65-p.whole*p.denominator} бөліммен өзара жай. Нөл қалдық нақты бөлшек бөлігі бар аралас сан бермейді.`;break;
 }
 case'large-near-multiple-mixed':{
  const r=p.numerator-p.baseMultiple,w=div(p.baseMultiple,p.denominator);assert.ok(r>0&&r<p.denominator);a=M(w,r,p.denominator);options=p.choices.map(show);s=`${F(p.numerator,p.denominator)} үлкен бөлшегіне тең аралас санды таңдаңдар.`;
  z=`Жақын толық еселік ${p.baseMultiple} = ${p.denominator} × ${w}. ${p.numerator} = ${p.baseMultiple} + ${r}, 0 < ${r} < ${p.denominator}. Сондықтан ${F(p.numerator,p.denominator)} = ${a}. Тексеру: ${w} × ${p.denominator} + ${r} = ${p.numerator}. Бүтін бөліктегі барлық цифр сақталады, қалдықты не бөліндіні біреуге өзгертуге болмайды.`;break;
 }
 case'incorrect-conversion-numerator-gap':{
  const correct=converted(p.whole,p.numerator,p.denominator),wrong=p.whole*p.numerator+p.denominator;a=correct-wrong;assert.ok(a>0);s=`Данияр ${M(p.whole,p.numerator,p.denominator)} санын бұрыс бөлшекке айналдыруда қателесіп, ${F(`${p.whole} × ${p.numerator} + ${p.denominator}`,p.denominator)} деп жазды. Оның қате жауабының АЛЫМЫ дұрыс алымнан неше санға кем?`;
  z=`Дұрыс алым ${p.whole} × ${p.denominator} + ${p.numerator} = ${correct}, яғни ${F(correct,p.denominator)}. Қате алым ${p.whole} × ${p.numerator} + ${p.denominator} = ${wrong}. Сұралған айырма ${correct} − ${wrong} = ${a}. Бөлімдері бірдей, бірақ бұл жерде бөлшек мәндерінің емес, алымдардың айырмасы сұралды. Қате формула бүтін бөлікті бөлімге емес, алымға көбейткен.`;break;
 }
 case'recover-then-new-divisor':{
  const n=p.whole*p.firstDivisor+p.remainder,m=toMixed(n,p.secondDivisor);a=show(m);options=p.choices.map(show);s=`x санын ${p.firstDivisor} санына бөлгенде нақты бөлінді ${M(p.whole,p.remainder,p.firstDivisor)} шықты. Сол x санын ${p.secondDivisor} санына бөлгендегі аралас бөліндіні таңдаңдар.`;
  z=`Алдымен бірдей x санын қайта құрамыз: x = ${p.whole} × ${p.firstDivisor} + ${p.remainder} = ${n}. Енді ${n} : ${p.secondDivisor} = ${m[0]}, қалдық ${n%p.secondDivisor}, сондықтан ${a}. Тексеру: ${m[0]} × ${p.secondDivisor} + ${n%p.secondDivisor} = ${n}. Жаңа бөлуде бүтін бөлік те, бөлім де өзгеруі мүмкін; ескісін жай көшіруге болмайды.`;break;
 }
 case'irreducible-mixed-fixed-sum':{
  const states=range(1,p.sum-1).map(d=>({d,n:p.sum-d,w:Math.floor((p.sum-d)/d),r:(p.sum-d)%d})).filter(v=>v.w===p.whole&&v.r>0),valid=states.filter(v=>gcd(v.n,v.d)===1),v=one(valid);a=M(v.w,v.r,v.d);options=p.choices.map(show);
  s=`a және b — оң натурал сандар. Қысқармайтын ${F('a','b')} бөлшегінен бүтін бөлікті бөліп алғанда бүтін ${p.whole} болды және нөлден өзге бөлшек бөлігі қалды. a + b = ${p.sum}. Осы аралас санды таңдаңдар.`;
  z=`a = ${p.whole}b + r, 0 < r < b; қосынды a + b = ${p.whole+1}b + r = ${p.sum}. Осы шарттарға сай барлық (a; b; r) үштіктері ${states.map(v=>`(${v.n}; ${v.d}; ${v.r})`).join(', ')}. `+states.map(v=>`${F(v.n,v.d)} үшін ЕҮОБ ${gcd(v.n,v.d)}${gcd(v.n,v.d)>1?' — қысқарады, жарамайды':' — қысқармайды, жарамды'}`).join('; ')+`. Сондықтан ${a}. Бастапқы бөлшектің қысқармайтын болуы міндетті; тек бүтін бөлік пен қосындыны тексеру жеткіліксіз.`;break;
 }
 case'equal-whole-remainder-largest-numerator':{
  const k=p.denominator-1;a=k*p.denominator+k;s=`${F('n',p.denominator)} бөлшегін бөлімін өзгертпей аралас санға айналдырғанда бүтін бөлік бөлшек бөлігінің алымына тең болды. n — оң натурал сан. Ең үлкен n неше?`;
  z=`Екі бірдей бөлік санын k десек, сан ${M('k','k',p.denominator)} түрінде: n = k × ${p.denominator} + k = ${p.denominator+1}k. Бөлшек бөлігі оң дұрыс болу үшін 1 ≤ k < ${p.denominator}; ең үлкені ${k}. Сондықтан n = ${p.denominator+1} × ${k} = ${a}. Тексеру ${F(a,p.denominator)} = ${M(k,k,p.denominator)}. k = ${p.denominator} болса бөлшек бөлігі дұрыс болмас еді.`;break;
 }
 case'false-mixed-equality':{
  const rational=v=>v.fraction||[converted(...v.mixed),v.mixed[2]],equal=(a,b)=>{const[n,d]=rational(a),[x,y]=rational(b);return n*y===d*x;},label=v=>v.fraction?F(...v.fraction):show(v.mixed);const labels=p.choices.map(c=>`${label(c.left)} = ${label(c.right)}`),bad=one(p.choices.flatMap((c,i)=>!equal(c.left,c.right)?[i]:[]));a=labels[bad];options=labels;s='Түрлендірулердің төртеуін тексеріңдер. Қай теңдік қате жазылған?';
  z=p.choices.map((c,i)=>`${i+1}-нұсқа: ${label(c.left)}${i===bad?' ≠ ':' = '}${label(c.right)}`).join('; ')+`. Қате нұсқаның сол жағын қалдықпен бөлсек, ${p.choices[bad].left.fraction[0]} : ${p.choices[bad].left.fraction[1]} = ${Math.floor(p.choices[bad].left.fraction[0]/p.choices[bad].left.fraction[1])}, қалдық ${p.choices[bad].left.fraction[0]%p.choices[bad].left.fraction[1]}. Дұрысы ${show(toMixed(...p.choices[bad].left.fraction))}. Басқа нұсқаларда бұрыс бөлшек пен аралас санның мәні тең немесе бөлшек бөлігі бірдей санға қысқартылған.`;break;
 }
 case'mixed-duration-arrival-clock':{
  const minutes=p.whole*60+div(60,p.denominator)*p.numerator,total=p.startHour*60+p.startMinute+minutes,h=Math.floor(total/60)%24,m=total%60;a=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;options=p.choices.map(([h,m])=>`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);s=`Пойыз ${String(p.startHour).padStart(2,'0')}:${String(p.startMinute).padStart(2,'0')} кезінде шықты. Сапар ${M(p.whole,p.numerator,p.denominator)} сағатқа созылса, сол күні сағат нешеде жетеді?`;
  z=`${F(p.numerator,p.denominator)} сағ = 60 : ${p.denominator} × ${p.numerator} = ${minutes-p.whole*60} минут. Барлық уақыт ${p.whole} сағ ${minutes-p.whole*60} мин. Бастапқы минут ${p.startMinute} үстіне ${minutes-p.whole*60} қоссақ ${p.startMinute+minutes-p.whole*60} минут; оның толық 60 минуты тағы бір сағатқа өтеді. Нәтиже ${a}. Бөлшек бөлігінің цифрларын минут деп қатар тіркеу немесе алымды минут деп алу дұрыс емес.`;break;
 }
 case'consecutive-mixed-components':{
  const w=one(range(1,p.improperNumerator).filter(w=>w*(w+2)+(w+1)===p.improperNumerator));a=w;s=`Аралас санның бүтін бөлігі, бөлшек бөлігінің алымы және бөлімі осы ретпен үш тізбектес оң натурал сан. Оны бұрыс бөлшекке айналдырғанда алым ${p.improperNumerator} болды. Бүтін бөлігі неше?`;
  z=`Бүтін w десек, алым w + 1, бөлім w + 2. Бұрыс бөлшек алымы w × (w + 2) + (w + 1). w = ${w-1} кезінде ${((w-1)*(w+1)+w)}, w = ${w} кезінде ${p.improperNumerator}, w = ${w+1} кезінде ${(w+1)*(w+3)+w+2}. Бұл өрнек оң бүтін w өскен сайын қатаң өседі, сондықтан жалғыз бүтін бөлік ${w}. Сан ${M(w,w+1,w+2)}; ${w} × ${w+2} + ${w+1} = ${p.improperNumerator}.`;break;
 }
 case'mixed-to-spoken':{
  a=spoken(p.whole,p.numerator,p.denominator);options=[spoken(p.whole,p.denominator,p.numerator),spoken(p.numerator,p.whole,p.denominator),a,`${cases[p.denominator]} алпыс үш`];s=`${M(p.whole,p.numerator,p.denominator)} санының толық әрі дұрыс оқылуын таңдаңдар.`;
  z=`Алдымен бүтін ${p.whole} «${words[p.whole]} бүтін», содан кейін бөлім ${p.denominator} «${cases[p.denominator]}», соңында алым ${p.numerator} «${words[p.numerator]}» оқылады. Дұрысы «${a}». «${options[3]}» бөлшегінің алымы 63 болар еді, ол аралас санның бүтін мен бөлшек бөліктерін дұрыс атамайды.`;break;
 }
 case'specific-fractional-part-choice':{
  const matches=p.choices.filter(([n,d])=>{const r=n%d;return r*p.fraction[1]===p.fraction[0]*d;});a=F(...one(matches));options=p.choices.map(q=>F(...q));s=`Қай бұрыс бөлшектен бүтін бөлікті бөліп алғанда бөлшек бөлігінің МӘНІ ${F(...p.fraction)} болады?`;
  z=p.choices.map(([n,d])=>`${F(n,d)} = ${show(toMixed(n,d))}`).join('; ')+`. Тек ${a} жазуындағы бөлшек бөлік ${F(...p.fraction)}. Қалдықтың алымы бірдей болғанымен, бөлімі басқа болса бөлшек бөліктер тең болмауы мүмкін. Қажет болса қалдық бөлшегі толық қысқартылады.`;break;
 }
 case'reduce-part-then-convert':{
  const[n,d]=reduce(p.numerator,p.denominator);a=F(converted(p.whole,n,d),d);options=p.choices.map(q=>F(...q));s=`${M(p.whole,p.numerator,p.denominator)} санының бөлшек бөлігін толық қысқартып, содан кейін бұрыс бөлшекке айналдырған жауапты таңдаңдар.`;
  z=`Алдымен ${F(p.numerator,p.denominator)} = ${F(n,d)}. Бүтін ${p.whole} өзгермейді. Содан кейін ${proof(p.whole,n,d)}. Кері тексеруде алым ${converted(p.whole,n,d)} санын ${d} санына бөлсек, бүтін ${p.whole}, қалдық ${n} шығады. Бастапқы ${p.denominator} бөлімін қысқартылған алыммен бірге қалдыруға болмайды.`;break;
 }
 case'invariant-numerator-remainder-gap':{
  a=p.whole*p.denominator;s=`${F('a',p.denominator)} бөлшегі ${M(p.whole,'b',p.denominator)} аралас санына тең, мұнда 1 ≤ b < ${p.denominator}. a − b айырмасын табыңдар. Бүтін мен бөлшек қосылады.`;
  z=`Бөлім сақталады, сондықтан a = ${p.whole} × ${p.denominator} + b = ${a} + b. Онда a − b = ${a}, b-нің нақты мәнін білу қажет емес. Барлық b = ${list(range(1,p.denominator-1))} үшін бұл бірдей. Мысалы b = 3 болса a = ${a+3}, ${F(a+3,p.denominator)} = ${M(p.whole,3,p.denominator)} және ${a+3} − 3 = ${a}.`;break;
 }
 case'select-given-improper-numerator':{
  a=show(one(p.choices.filter(q=>converted(...q)===p.target)));options=p.choices.map(show);s=`Қай аралас санды БЕРІЛГЕН бөлімін өзгертпей бұрыс бөлшекке айналдырғанда алым ${p.target} болады?`;
  z=p.choices.map(([w,n,d])=>`${M(w,n,d)} үшін алым ${w} × ${d} + ${n} = ${converted(w,n,d)}`).join('; ')+`. Сәйкес нұсқа ${a}. Бірінші нұсқада бүтінді алымға көбейтіп бөлімді қосу ${p.choices[0][0]} × ${p.choices[0][1]} + ${p.choices[0][2]} = ${p.target} деген қате нәтиже берер еді. Соңғысында барлық үш санды қосу да қате. Салыстырылатыны берілген бөлімдегі дұрыс алым.`;break;
 }
 case'largest-remainder-with-divisibility':{
  const rs=range(1,p.denominator-1).filter(r=>converted(p.whole,r,p.denominator)%p.divisor===0);a=Math.max(...rs);s=`${M(p.whole,'x',p.denominator)} аралас санын БӨЛІМІН ӨЗГЕРТПЕЙ бұрыс бөлшекке айналдырғанда алым ${p.divisor} санына қалдықсыз бөлінеді. x — бөлшек бөліктің оң натурал алымы. Ең үлкен жарамды x неше?`;
  z=`Жаңа алым ${p.whole} × ${p.denominator} + x = ${p.whole*p.denominator} + x. Дұрыс бөлшек бөлік үшін x = 1, …, ${p.denominator-1}. Алымдар ${p.whole*p.denominator+1}–${p.whole*p.denominator+p.denominator-1} аралығында. ${p.divisor} санына бөлінетіндері ${list(rs.map(r=>converted(p.whole,r,p.denominator)))}, сәйкес x = ${list(rs)}. Ең үлкені ${a}; жай ең үлкен рұқсат етілген ${p.denominator-1} мәнін таңдау жеткіліксіз.`;break;
 }
 case'sum-denominators-fixed-whole':{
  const ds=range(1,p.numerator).filter(d=>Math.floor(p.numerator/d)===p.whole&&p.numerator%d>0);a=sum(ds);s=`${F(p.numerator,'b')} бөлшегінен бүтін бөлікті бөліп алғанда бүтін ${p.whole} және нөлден өзге бөлшек бөлігі шығады. b — оң натурал сан. Барлық мүмкін b мәндерінің ҚОСЫНДЫСЫН табыңдар.`;
  z=`Қалдық оң әрі b санынан кіші: ${p.whole}b < ${p.numerator} < ${p.whole+1}b. Барлық жарамды бөлімдер ${list(ds)}. Тексеру: ${ds.map(d=>`${F(p.numerator,d)} = ${show(toMixed(p.numerator,d))}`).join('; ')}. Кіші көрші бөлім ${ds[0]-1} басқа ${Math.floor(p.numerator/(ds[0]-1))} бүтін, үлкен көрші ${ds.at(-1)+1} басқа ${Math.floor(p.numerator/(ds.at(-1)+1))} бүтін береді. Қосынды ${ds.join(' + ')} = ${a}.`;break;
 }
 case'mixed-sequence-converted-numerator':{
  const term=k=>[p.wholeCoefficient*k,p.numeratorCoefficient*k,k+p.denominatorOffset],t=term(p.index);assert.ok(t[1]<t[2]);a=converted(...t);s=`Тізбектің n-мүшесі ережемен берілген: бүтін бөлігі ${p.wholeCoefficient}n, бөлшек бөлігінің алымы ${p.numeratorCoefficient===1?'n':p.numeratorCoefficient+'n'}, бөлімі n + ${p.denominatorOffset}. Алғашқы мүшелер ${range(1,4).map(k=>show(term(k))).join(', ')}, … . ${p.index}-мүшені берілген бөліммен бұрыс бөлшекке айналдырғанда алымы неше?`;
  z=`Ережеге n = ${p.index} қоямыз: бүтін ${t[0]}, алым ${t[1]}, бөлім ${t[2]}, аралас сан ${show(t)}. ${proof(...t)}. Ізделген алым ${a}. Әр компонент бірдей n нөмірінен алынуы керек; бүтін бөлікті бөлшек бөлігінің алымымен шатастырмаймыз. Ереже шартта ашық берілген, қысқа тізімнен бірнеше мүмкін заңдылықтың бірін жорамалдау талап етілмейді.`;break;
 }
 case'symbolic-euclidean-mixed':{
  assert.ok(p.remainder>0&&p.remainder<p.denominator);a=`Бүтін бөлігі n, бөлшек бөлігі ${F(p.remainder,p.denominator)}`;options=[`Бүтін бөлігі ${p.denominator}n, бөлшек бөлігі ${F(p.remainder,p.denominator)}`,`Бүтін бөлігі n, бөлшек бөлігі ${F(p.denominator,p.remainder)}`,a,`Бүтін бөлігі n + 1, бөлшек бөлігі ${F(p.remainder,p.denominator)}`];s=`n — оң натурал сан. ${F(`${p.denominator}n + ${p.remainder}`,p.denominator)} бөлшегін аралас санға айналдырғанда бүтін және бөлшек бөліктері қандай болады?`;
  z=`Алым ${p.denominator} × n + ${p.remainder} түрінде берілген. Бұл бөлгіш × толымсыз бөлінді + қалдық, мұнда 0 < ${p.remainder} < ${p.denominator}. Сондықтан бүтін бөлік n, бөлшек бөлік ${F(p.remainder,p.denominator)}. Мысал n = ${p.example}: ${F(p.denominator*p.example+p.remainder,p.denominator)} = ${M(p.example,p.remainder,p.denominator)}. Жалпы кері түрлендіру n × ${p.denominator} + ${p.remainder} бастапқы алымды дәл қайтарады. n-ді бөлімге тағы көбейтпейміз, қалдық пен бөлімнің орнын ауыстырмаймыз.`;break;
 }
 default:throw Error('Unsupported saved mixed-number model '+kind);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{assert.match(String(a),/^\d+$/);s+=' Жауапқа тек санды жазыңыз.';}
 assert.ok(!/[\\$^]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(s=>[prefix+s.id,s]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,prefix+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:prefix+spec.id,modelId:prefix+spec.kind,grade:5,topic:spec.kind==='mixed-sequence-converted-numerator'?'seq':spec.kind==='square-side-mixed'?'geo':'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Барлық 48 сақталған бастапқы шарт, толық шешім және барлық жауап нұсқалары жеке оқылды. Аралас санның оң дұрыс бөлшек бөлігі, қалдық пен толымсыз бөліндінің рөлдері, бөлімді сақтау/қысқарту, белгісіз алым мен бөлім және нөл емес бөлшек бөлік шектері сақталды.',
 'Дереккөзге жеке жаңа қазақша мәтін мен сандар жазылды: музыка, зерттеу кемесі, қағаз, тұқым, көрме тақтасы, шағын дрон және уақыт жағдайлары жаңартылды. Бүтін/алым/бөлім не алымның ғана айырмасы сұралғаны ашық көрсетілді. Шын математикалық анықтамалар өзгермейді.',
 '48 нұсқа мен model ID 48 жаңа математикалық мағына деп саналмайды. Сандық аралас жазулар native canonical (whole + (n/d)) түрінде; қате бөлшек бөлігі бар жазуда қосылу мағынасы ашық айтылады. Бөлшек/аралас/тізім/уақыт/сөздік жауаптар MCQ, ашық жауаптар тек бүтін сан. Символдық бүтін бөлік сөзбен сипатталып, жасырын көбейтуге жол берілмейді.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...(['normalize-improper-fractional-part','incorrect-conversion-numerator-gap','false-mixed-equality'].includes(spec.kind)?{intentionalIncorrectExample:true}:{}),...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(row=>[row.editionId,row]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan','intentionalIncorrectExample'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const r=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(r[field]),'Unbound mixed-number '+field);assert.equal(row.answer,r.answer);return{answer:r.answer,checks:['individual source3.4 skills and full numeric/reading/positional givens bound','nonzero proper mixed fractionalpart; given versus reduced denominator explicitly distinguished','all finite remainder/divisor/digit/irreducibility/clock/sequence domains independently checkable','native canonical numeric mixed/fraction groups, symbolic parts stated without implicitmultiplication','all printed statement fullsolution choices answer and source metadata exact-bound','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All48 saved nonvisual grade5 topic3.4 sources individually rewritten offline; source variants/models are not semantic uniqueness. Awaiting independent editorial review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-mixed-numbers.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
