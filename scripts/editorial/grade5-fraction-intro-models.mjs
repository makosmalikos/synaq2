/** Source-specific fraction-reading drafts; no collection or publication. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-fraction-intro-specs.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-1').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=ns=>ns.reduce((a,b)=>a+b,0),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const div=(a,b)=>{assert.ok(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>0&&a%b===0,`Noninteger fraction-intro quantity ${a}/${b}`);return a/b;};
const frac=(n,d)=>`${n}/${d}`,show=([n,d])=>frac(n,d),part=(whole,[n,d])=>{assert.ok(n>0&&d>n);return div(whole,d)*n;};
// Explicit canonical groups tell MathText to render a native stacked fraction.
// This is presentation only: even the intentionally invalid 7/0 is not evaluated.
const nativeFractions=text=>String(text).replace(/(?<![\p{L}\p{N}_])(\d+|[a-z□])\/(\d+|[a-z□])(?![\p{L}\p{N}_])/gu,(token,_n,_d,offset,whole)=>whole[offset-1]==='('&&whole[offset+token.length]===')'?token:`(${token})`);
const gcd=(a,b)=>b?gcd(b,a%b):a,lcm=(a,b)=>a/gcd(a,b)*b,reduce=(n,d)=>frac(n/gcd(n,d),d/gcd(n,d));
const word={1:'бір',2:'екі',3:'үш',4:'төрт',5:'бес',6:'алты',7:'жеті',8:'сегіз',9:'тоғыз',10:'он',11:'он бір',12:'он екі',13:'он үш',16:'он алты',17:'он жеті',19:'он тоғыз'};
const ablative={1:'бірден',2:'екіден',3:'үштен',4:'төрттен',5:'бестен',6:'алтыдан',7:'жетіден',8:'сегізден',9:'тоғыздан',10:'оннан',11:'он бірден',12:'он екіден',13:'он үштен',16:'он алтыдан',17:'он жетіден',19:'он тоғыздан'};
const spoken=(n,d)=>{assert.ok(word[n]&&ablative[d]);return `${ablative[d]} ${word[n]}`;};
const partProof=(whole,[n,d],unit='')=>{const one=div(whole,d),value=one*n;return  `Бүтін шама — ${whole}${unit?' '+unit:''}. Оны ${d} тең бөлікке бөлеміз: ${whole} : ${d} = ${one}. Оның ${n} бөлігін аламыз: ${one} × ${n} = ${value}${unit?' '+unit:''}.`;};
const prime=n=>n>1&&range(2,Math.floor(Math.sqrt(n))).every(d=>n%d!==0);
function render(kind,p){let s,z,a,options;switch(kind){
 case'spoken-fraction-to-symbol':{
  s=`«${spoken(p.numerator,p.denominator)}» деп оқылатын жай бөлшекті таңдаңдар.`;a=frac(p.numerator,p.denominator);options=p.choices.map(show);
  z=`«${ablative[p.denominator]}» сөзі бүтіннің ${p.denominator} тең бөлікке бөлінгенін білдіреді, бұл — бөлім. «${word[p.numerator]}» алынған бөліктер саны, бұл — алым. Сондықтан жазылуы ${a}. Кері ${p.denominator}/${p.numerator} бөлшегінде осы екі рөл ауысар еді; сандарды қосып бөлім құруға болмайды.`;break;
 }
 case'zero-numerator-value':{
  s=`${frac(0,p.denominator)} бөлшегінің мәнін таңдаңдар. Оның бөлімі ${p.denominator}, яғни нөл емес.`;a='0';options=[String(p.denominator),'0','1',frac(1,p.denominator)];
  z=`Бөлшек бөлу амалын білдіреді: 0/${p.denominator} = 0 : ${p.denominator} = 0. Бірде-бір бөлік алынған жоқ. Тексеру: 0 × ${p.denominator} = 0. Нөл алымға рұқсат етіледі; бұл бөлімге нөл жазуға рұқсат дегенді білдірмейді.`;break;
 }
 case'division-ask-numerator':{
  a=p.dividend;s=`${p.dividend} : ${p.divisor} бөліндісін қысқартпай жай бөлшекпен жазды. Сол жазудағы алым қандай сан?`;
  z=`Бөлінгіш алымға, бөлгіш бөлімге жазылады: ${p.dividend} : ${p.divisor} = ${frac(p.dividend,p.divisor)}. Жоғарыдағы сан — алым ${p.dividend}; төмендегі ${p.divisor} — бөлім. Сұралғаны бөлшектің мәні емес, жазудағы алым.`;break;
 }
 case'unit-fraction-of-number':{
  a=div(p.whole,p.denominator);s=`${p.whole} санының ${frac(1,p.denominator)} бөлігін табыңдар.`;z=`Бүтін ${p.denominator} тең бөлікке бөлінді, біреуінің мәні ${p.whole} : ${p.denominator} = ${a}. Алым 1 болғандықтан бір бөлік қана алынады. Тексеру: ${a} × ${p.denominator} = ${p.whole}.`;break;
 }
 case'catalogue-fraction-count':case'seedling-fraction-count':{
  a=part(p.whole,p.fraction);s=kind==='catalogue-fraction-count'?`Оқушылар жасаған каталогта ${p.whole} далалық есеп бар. Олардың ${show(p.fraction)} бөлігінде өсімдіктер зерттелген. Өсімдіктер туралы есептер нешеу?`:`Мектеп бағына ${p.whole} көшет әкелінді. Оның ${show(p.fraction)} бөлігі қылқанжапырақты ағаштар. Осындай көшет саны нешеу?`;
  z=partProof(p.whole,p.fraction,kind==='catalogue-fraction-count'?'есеп':'көшет')+` Қалғаны ${p.whole-a}, тексеру: ${a} + ${p.whole-a} = ${p.whole}. Сұраққа таңдалған санаттың өзі беріледі, қалғаны емес.`;break;
 }
 case'denominator-definition':{
  s='a/b жай бөлшегі бүтіннің тең бөліктерін сипаттайды, b > 0. Бұл жазудағы b саны нені көрсетеді?';a='Бүтіннің неше тең бөлікке бөлінгенін';options=['Бүтіннен неше бөлік алынғанын','Алынбай қалған бөліктер санын','Бүтіннің неше рет қайталанғанын',a];
  z='b — бөлшектің бөлімі, ол бүтіннің неше тең бөлікке бөлінгенін көрсетеді. a — алынған осындай бөліктер саны. Мысалы, 7/15 жазуында бүтін 15 тең бөлікке бөлініп, 7 бөлігі алынған. Таңдалған санды бөліммен шатастырмаймыз.';break;
 }
 case'symbol-fraction-to-spoken':{
  s=`${frac(p.numerator,p.denominator)} бөлшегін дұрыс оқыған нұсқаны таңдаңдар.`;a=spoken(p.numerator,p.denominator);options=[spoken(p.denominator,p.numerator),a,`${word[p.numerator]} бүтін ${word[p.denominator]}`,spoken(1,p.denominator)];
  z=`Алдымен бөлім ${p.denominator} шығыс септігінде «${ablative[p.denominator]}», содан соң алым ${p.numerator} «${word[p.numerator]}» деп оқылады. Сондықтан «${a}». «${options[0]}» кері бөлшектің оқылуы; бүтін сан бөлігі бұл жазуда жоқ.`;break;
 }
 case'ask-given-denominator':{
  a=p.denominator;s=`${frac(p.numerator,p.denominator)} жазуындағы жай бөлшектің бөлімі неше?`;
  z=`Бөлім — бөлшек сызығының астындағы сан ${p.denominator}. Ол бүтіннің тең бөліктер санын көрсетеді. ${p.numerator} жоғарыда, бұл — алым. Бөлшекті бөліндіге айналдыру сұралмаған.`;break;
 }
 case'fraction-to-division':{
  a=`${p.numerator} : ${p.denominator}`;options=[`${p.denominator} : ${p.numerator}`,`${p.numerator} × ${p.denominator}`,a,`${p.numerator} − ${p.denominator}`];s=`${frac(p.numerator,p.denominator)} бөлшегін қай бөлу амалы дәл көрсетеді?`;
  z=`Бөлшек сызығы алымды бөлімге бөлуді білдіреді. Алым ${p.numerator} — бөлінгіш, бөлім ${p.denominator} — бөлгіш, сондықтан ${frac(p.numerator,p.denominator)} = ${a}. Ретті кері ауыстыру басқа сан береді; көбейту мен азайту бұл жазудың мағынасы емес.`;break;
 }
 case'whole-from-unit-part':{
  a=p.part*p.denominator;s=`Белгісіз санның ${frac(1,p.denominator)} бөлігі ${p.part} болды. Бастапқы санды табыңдар.`;
  z=`Бір тең бөліктің мәні ${p.part}. Бүтін сондай ${p.denominator} бөліктен тұрады: ${p.part} × ${p.denominator} = ${a}. Кері тексеру: ${a} : ${p.denominator} = ${p.part}. Белгілі бөлікпен бүтіннің орындарын ауыстырмаймыз.`;break;
 }
 case'nonunit-fraction-of-number':{
  a=part(p.whole,p.fraction);s=`${p.whole} санының ${show(p.fraction)} бөлігін есептеңдер.`;z=partProof(p.whole,p.fraction)+` Бұл дұрыс бөлшек болғандықтан, алынған ${a} саны ${p.whole} бүтіннен кіші. Қалған бірлік бөліктермен тексеру: ${a} + ${p.whole-a} = ${p.whole}.`;break;
 }
 case'missing-numerator-natural-value':{
  a=p.whole*p.denominator;s=`${p.whole} = □/${p.denominator} теңдігінде бос торға қандай сан жазылады?`;
  z=`Тордағы санды ${p.denominator} санына бөлгенде ${p.whole} шығуы керек. Белгісіз бөлінгіш ${p.whole} × ${p.denominator} = ${a}. Тексеру: ${a}/${p.denominator} = ${a} : ${p.denominator} = ${p.whole}.`;break;
 }
 case'missing-category-share':{
  const known=p.first+p.second,remaining=p.total-known;assert.ok(remaining>0);a=frac(remaining,p.total);options=p.choices.map(show);
  s=`Себетте барлығы ${p.total} жеміс: ${p.first} апельсин, ${p.second} алма және бірнеше алмұрт бар. Алмұрттар себеттегі барлық жемістің қандай бөлігін құрайды?`;
  z=`Апельсин мен алма ${p.first} + ${p.second} = ${known}. Алмұрт саны ${p.total} − ${known} = ${remaining}. Алымға алмұрт ${remaining}, бөлімге барлық жеміс ${p.total} жазылады: ${a}. Алма мен апельсиннің жалпы саны бөлімнің орнына жүрмейді. Тексеру: ${known} + ${remaining} = ${p.total}.`;break;
 }
 case'untravelled-route-share':{
  const left=p.whole-p.travelled;assert.ok(left>0);a=frac(left,p.whole);options=p.choices.map(show);s=`Велосаяхат маршруты ${p.whole} км. Топ ${p.travelled} км жүрді. Әлі жүрілмеген жол бүкіл маршруттың қандай бөлігі?`;
  z=`Қалған жол ${p.whole} − ${p.travelled} = ${left} км. Оны толық ${p.whole} км маршрутпен салыстырамыз: ${a}. ${p.travelled}/${p.whole} — жүрілген бөлік, ол сұралмаған. Бүтін ретінде қалған жолды емес, бастапқы маршрутты аламыз.`;break;
 }
 case'spoken-fraction-from-offset':{
  const d=p.numerator+p.extra;a=spoken(p.numerator,d);options=[spoken(d,p.numerator),spoken(p.numerator,p.extra),spoken(p.extra,d),a];s=`Бөлшектің алымы ${p.numerator}. Бөлімі алымынан ${p.extra} санға артық. Осы бөлшектің дұрыс оқылуын таңдаңдар.`;
  z=`Бөлім ${p.numerator} + ${p.extra} = ${d}. Демек бөлшек ${frac(p.numerator,d)}. Алдымен бөлім «${ablative[d]}», кейін алым «${word[p.numerator]}»: «${a}». Айырма ${p.extra} бөлімнің өзі емес.`;break;
 }
 case'compare-shares-different-wholes':{
  const x=part(p.firstWhole,p.firstFraction),y=part(p.secondWhole,p.secondFraction);assert.ok(x<y);const first=`${p.firstWhole} санының ${show(p.firstFraction)} бөлігі`,second=`${p.secondWhole} санының ${show(p.secondFraction)} бөлігі`;a=second;options=[first,'Екі шама тең',second,'Салыстыру мүмкін емес'];s=`Қай шама үлкен: ${first} ме, әлде ${second} ме?`;
  z=`Біріншісі: ${p.firstWhole} : ${p.firstFraction[1]} × ${p.firstFraction[0]} = ${x}. Екіншісі: ${p.secondWhole} : ${p.secondFraction[1]} × ${p.secondFraction[0]} = ${y}. ${y} > ${x}, демек екінші шама үлкен. Бөлшектер әртүрлі бүтіндерден алынған, тек алым не бөлімге қарап салыстыруға болмайды.`;break;
 }
 case'two-original-whole-sales-remainder':{
  const first=part(p.whole,p.first),second=part(p.whole,p.second);a=p.whole-first-second;assert.ok(a>0);
  s=`Қоймаға ${p.whole} кг дән әкелінді. Бірінші күні БАСТАПҚЫ барлық дәннің ${show(p.first)} бөлігі, екінші күні де БАСТАПҚЫ барлық дәннің ${show(p.second)} бөлігі берілді. Қоймада неше килограмм дән қалды?`;
  z=`Екі бөлшектің де бүтіні ${p.whole} кг. Бірінші күні ${p.whole} : ${p.first[1]} × ${p.first[0]} = ${first} кг, екінші күні ${p.whole} : ${p.second[1]} × ${p.second[0]} = ${second} кг берілді. Қалғаны ${p.whole} − ${first} − ${second} = ${a} кг. Екінші үлесті бірінші күннен қалған дәннен есептемейміз.`;break;
 }
 case'hour-fraction-to-minutes':{
  a=part(60,p.fraction);s=`Шеберлік сабағы бір сағаттың ${show(p.fraction)} бөлігіне созылды. Сабақ неше минут жүрді?`;
  z=`Бір сағат 60 минут, 100 минут емес. ${partProof(60,p.fraction,'минут')} Қалған ${60-a} минутпен қосқанда ${a} + ${60-a} = 60.`;break;
 }
 case'unread-pages-count':{
  const read=part(p.pages,p.fraction);a=p.pages-read;s=`Айару ${p.pages} беттік кітаптың ${show(p.fraction)} бөлігін оқыды. Кітапты аяқтау үшін әлі неше бет оқуы керек?`;
  z=`Оқылғаны ${p.pages} : ${p.fraction[1]} × ${p.fraction[0]} = ${read} бет. Қалғаны ${p.pages} − ${read} = ${a} бет. Тексеру: ${read} + ${a} = ${p.pages}. Сұралғаны оқып қойған беттер емес.`;break;
 }
 case'daily-share-time-difference':{
  const sleep=part(24,p.first),school=part(24,p.second);a=sleep-school;assert.ok(a>0);s=`Тәулік 24 сағат. Оқушы оның ${show(p.first)} бөлігін ұйқыға, ${show(p.second)} бөлігін мектепте болуға жұмсайды. Ұйқы уақыты мектептегі уақыттан неше сағат артық?`;
  z=`Ұйқы ${24} : ${p.first[1]} × ${p.first[0]} = ${sleep} сағат. Мектепте ${24} : ${p.second[1]} × ${p.second[0]} = ${school} сағат. Екі уақыт та бір тәуліктен алынды. Айырма ${sleep} − ${school} = ${a} сағат.`;break;
 }
 case'whole-from-nonunit-count':{
  const unit=div(p.part,p.fraction[0]);a=unit*p.fraction[1];s=`Жапсырмалар жинағының ${show(p.fraction)} бөлігінде жануарлар бейнеленген. Осындай жапсырма ${p.part} дана. Жинақта барлығы неше жапсырма бар?`;
  z=`${p.fraction[0]} бөлік ${p.part} дана болса, бір бөлік ${p.part} : ${p.fraction[0]} = ${unit}. Бүтін ${p.fraction[1]} бөлік: ${unit} × ${p.fraction[1]} = ${a}. Тексеру: ${a} : ${p.fraction[1]} × ${p.fraction[0]} = ${p.part}. Белгілі ${p.part} бүтін емес, оның бір бөлігі.`;break;
 }
 case'unspent-share':{
  const [n,d]=p.spent;a=frac(d-n,d);options=p.choices.map(show);s=`Әділ жинаған ақшасының ${show(p.spent)} бөлігін кітап сатып алуға жұмсады. Ақшасының қандай бөлігі жұмсалмай қалды?`;
  z=`Бастапқы ақша ${d} тең бөліктен тұрады. Оның ${n} бөлігі жұмсалып, ${d} − ${n} = ${d-n} бөлігі қалды. Бүтіннің бөлінуі өзгермейді, сондықтан бөлім ${d}, жауап ${a}. Жұмсалған мен қалған бөліктердің өзара қатынасы сұралмаған.`;break;
 }
 case'centimetres-share-of-metre':{
  a=frac(p.cm,100);options=p.choices.map(show);s=`${p.cm} см ұзындық бір метрдің қандай бөлігін құрайды?`;
  z=`Бір метр 100 см, сондықтан бүтінді 100 тең сантиметрлік бөлік деп аламыз. ${p.cm} осындай бөлік таңдалды, үлесі ${a}. Бөлім 10 болса бүтін дециметр болар еді, ал бұл сұрақ метр туралы.`;break;
 }
 case'equal-rope-piece-length':{
  a=frac(p.metres,p.pieces)+' м';options=p.choices.map(xs=>show(xs)+' м');s=`Ұзындығы ${p.metres} м сәндік таспа ${p.pieces} тең бөлікке бөлінді. Әр бөліктің ұзындығы неше метр?`;
  z=`Бүкіл ұзындық бөліктер санына бөлінеді: ${p.metres} : ${p.pieces} = ${frac(p.metres,p.pieces)} м. Бір метр ғана емес, барлық ${p.metres} метр бөлінді. ${p.pieces} осындай бөлік бірге ${p.metres} м береді; бөлінгіш пен бөлгішті кері ауыстырмаймыз.`;break;
 }
 case'fraction-sequence-index':{
  const terms=range(0,p.index-1).map(i=>[p.firstNumerator+p.numeratorStep*i,p.firstDenominator+p.denominatorStep*i]);a=show(terms.at(-1));options=p.choices.map(show);
  s=`Тізбектің алғашқы мүшелері ${terms.slice(0,4).map(show).join(', ')}, … . Ереже: келесі мүшеге өткен сайын алым ${p.numeratorStep} санға, бөлім ${p.denominatorStep} санға артады. Осы ереже бойынша ${p.index}-мүшені таңдаңдар.`;
  z=`Алымдар ${terms.map(x=>x[0]).join(', ')}; бөлімдер ${terms.map(x=>x[1]).join(', ')}. Бірінші мүшеден ${p.index}-мүшеге дейін ${p.index-1} қадам бар. Алым ${p.firstNumerator} + ${p.numeratorStep} × ${p.index-1} = ${terms.at(-1)[0]}, бөлім ${p.firstDenominator} + ${p.denominatorStep} × ${p.index-1} = ${terms.at(-1)[1]}. Жауап ${a}; алым мен бөлім бірдей нөмірдегі мүшеден алынуы керек.`;break;
 }
 case'denominator-from-sum-ratio':{
  const n=div(p.sum,p.ratio+1);a=n*p.ratio;s=`Бөлшектің алымы мен бөлімінің қосындысы ${p.sum}. Бөлімі алымының ${p.ratio} есесіне тең. Осы бөлшектің бөлімін табыңдар.`;
  z=`Алым 1 бөлік болса, бөлім ${p.ratio} бөлік. Бірге ${1+p.ratio} бөлік: ${p.sum} : ${1+p.ratio} = ${n}. Бұл алым, ал бөлім ${n} × ${p.ratio} = ${a}. Тексеру: ${n} + ${a} = ${p.sum}, ${a} : ${n} = ${p.ratio}.`;break;
 }
 case'elapsed-day-fraction':{
  const hour=div(24,p.remainingMultiple+1);a=`${hour}:00`;options=p.choices.map(([h,m])=>`${h}:${String(m).padStart(2,'0')}`);s=`Түн ортасынан бері өткен уақыт тәуліктің қалған уақытынан ${p.remainingMultiple} есе кем. Тәулік 24 сағат деп алынса, қазір 24 сағаттық пішімде сағат неше?`;
  z=`Өткені 1 бөлік, қалғаны ${p.remainingMultiple} бөлік, барлығы ${p.remainingMultiple+1} бөлік. Өткен уақыт ${24} : ${p.remainingMultiple+1} = ${hour} сағат. Қалғаны ${24-hour}, тексеру: ${24-hour} : ${hour} = ${p.remainingMultiple}. Сондықтан қазір ${a}; қалған уақыт сағаттағы көрсеткіш емес.`;break;
 }
 case'whole-route-from-share-gap':{
  const [n,d]=p.travelled,gapParts=d-2*n;assert.ok(gapParts>0);const unit=div(p.gap,gapParts);a=unit*d;s=`Зерттеу тобы маршруттың ${show(p.travelled)} бөлігін жүрді. Сол сәтте жүрген жолы әлі қалған жолынан ${p.gap} км қысқа болды. Маршруттың толық ұзындығы неше километр?`;
  z=`Жүрілгені ${n} бөлік, қалғаны ${d} − ${n} = ${d-n} бөлік. Айырма ${d-n} − ${n} = ${gapParts} бөлік, осысы ${p.gap} км. Бір бөлік ${p.gap} : ${gapParts} = ${unit}, толық жол ${unit} × ${d} = ${a} км. Тексеру: қалған ${unit*(d-n)} км мен жүрген ${unit*n} км айырмасы ${p.gap}.`;break;
 }
 case'sequential-budget-inverse':{
  const [n2,d2]=p.second,[n1,d1]=p.first,afterFirst=div(p.left,d2-n2)*d2; a=div(afterFirst,d1-n1)*d1;
  s=`Жобаға бөлінген ақшаның ${show(p.first)} бөлігі материалға жұмсалды. Одан кейін ҚАЛҒАН ақшаның ${show(p.second)} бөлігі баспаға төленді. Соңында ${p.left} теңге қалды. Бастапқы қаржы неше теңге болған?`;
  z=`Баспадан соң ${d2-n2} бөлік ${p.left} теңге қалды, сондықтан материалдан кейінгі ақша ${p.left} : ${d2-n2} × ${d2} = ${afterFirst}. Бұл бастапқы ақшаның ${d1-n1} бөлігі. Бастапқы ақша ${afterFirst} : ${d1-n1} × ${d1} = ${a}. Кері тексеру: материалға ${part(a,p.first)}, қалды ${afterFirst}; баспаға ${part(afterFirst,p.second)}, қалды ${p.left}. Екінші бөлшектің бүтіні бастапқы ақша емес.`;break;
 }
 case'third-successive-share-count':{
  let remaining=p.initial;const events=[];for(let i=0;i<p.children;i++){const take=part(remaining,p.fraction);events.push({before:remaining,take,after:remaining-take});remaining-=take;}a=events.at(-1).take;
  s=`Қорапта ${p.initial} кәмпит бар. ${p.children} бала кезекпен келді, әрқайсысы СОЛ СӘТТЕ қалған кәмпиттердің ${show(p.fraction)} бөлігін алды. Үшінші бала неше кәмпит алды?`;
  z=events.map((e,i)=>`${i+1}-бала: ${e.before} : ${p.fraction[1]} × ${p.fraction[0]} = ${e.take} алады, ${e.after} қалады`).join('; ')+`. Үшінші баланың үлесі ${a}. Тексеру: алынған ${events.map(e=>e.take).join(' + ')} және қалған ${remaining} қосындысы ${p.initial}. Әр үлесті бастапқы қораптан қайта есептемейміз.`;break;
 }
 case'natural-quotient-numerator-count':{
  const values=range(1,p.upper-1).filter(n=>n%p.denominator===0);a=values.length;s=`n/${p.denominator} бөлшегі оң натурал санға тең болсын. n де оң натурал сан және n < ${p.upper}. Осындай n мәндері нешеу?`;
  z=`n саны ${p.denominator} санына қалдықсыз бөлінуі керек. Қатаң шекке кіретіндері ${values.join(', ')} — ${a} сан. ${p.upper} шеті есептелмейді; 0 оң натурал сан емес. Әр тізімдегі n үшін n : ${p.denominator} оң бүтін сан болады.`;break;
 }
 case'greatest-time-share':{
  const labels=p.choices.map(c=>`${c.label} ${show(c.fraction)} бөлігі`),values=p.choices.map(c=>part(c.whole,c.fraction)),max=Math.max(...values);a=labels[one(values.flatMap((n,i)=>n===max?[i]:[]))];options=labels;
  s='Қай уақыт аралығы ең ұзақ? Бір сағат 60 минут, бір тәулік 1440 минут. Әр бөлшек нұсқада көрсетілген өз бүтінінен алынады.';
  z=p.choices.map((c,i)=>`${labels[i]}: ${c.whole} : ${c.fraction[1]} × ${c.fraction[0]} = ${values[i]} минут`).join('; ')+`. Ең ұзақ ${max} минут. Кішкентай бөлшек үлкен бүтіннен алынуы мүмкін, сондықтан тек бөлшектердің өзін салыстырмаймыз.`;break;
 }
 case'equal-shares-two-collections':{
  const knownPart=part(p.known,p.knownFraction),[n,d]=p.unknownFraction;a=div(knownPart,n)*d;
  s=`Әлинұрда ${p.known} ашықхат бар. Оның ашықхаттарының ${show(p.knownFraction)} бөлігі Мәдинаның ашықхаттарының ${show(p.unknownFraction)} бөлігіне тең. Мәдинада барлығы неше ашықхат бар?`;
  z=`Белгілі жинақтың үлесі ${p.known} : ${p.knownFraction[1]} × ${p.knownFraction[0]} = ${knownPart}. Мәдинаның ${n} бөлігі осы ${knownPart}, бір бөлігі ${knownPart} : ${n} = ${knownPart/n}. Бүкіл жинағы ${knownPart/n} × ${d} = ${a}. Тексеру: ${a} : ${d} × ${n} = ${knownPart}; екі үлес тең.`;break;
 }
 case'nested-subgroup-share-of-all':{
  const boys=part(p.total,p.boys),club=part(boys,p.club);a=frac(club,p.total);options=p.choices.map(show);
  s=`Экологиялық лагерьде ${p.total} оқушы бар. Олардың ${show(p.boys)} бөлігі ұлдар. Ұлдардың ${show(p.club)} бөлігі фотоүйірмеге қатысады. Үйірмедегі ұлдар лагерьдегі БАРЛЫҚ оқушының қандай бөлігі?`;
  z=`Ұлдар ${p.total} : ${p.boys[1]} × ${p.boys[0]} = ${boys}. Үйірмедегі ұлдар ${boys} : ${p.club[1]} × ${p.club[0]} = ${club}. Соңғы сұрақтың бүтіні барлық ${p.total} оқушы, сондықтан үлес ${a}. ${show(p.club)} тек ұлдар тобына қатысты, лагерьге түгел қатысты емес.`;break;
 }
 case'boys-share-from-total-excess':{
  const girls=p.totalMinusBoys,boys=p.totalMinusGirls,total=boys+girls;a=frac(boys,total);options=p.choices.map(show);
  s=`Топтағы барлық бала саны ұлдар санынан ${p.totalMinusBoys} балаға, қыздар санынан ${p.totalMinusGirls} балаға артық. Ұлдар бүкіл топтың қандай бөлігін құрайды?`;
  z=`Барлығы = ұлдар + қыздар. Сондықтан барлығы ұлдардан ${girls} артық болса, қыздар ${girls}. Барлығы қыздардан ${boys} артық болса, ұлдар ${boys}. Жалпы ${boys} + ${girls} = ${total}, ұлдар үлесі ${a}. Тексеру: ${total} − ${boys} = ${girls}, ${total} − ${girls} = ${boys}.`;break;
 }
 case'invalid-zero-denominator':{
  a=frac(p.base,0);options=[frac(0,p.base),frac(p.base,p.base),frac(1,p.base),a];s='Қай жазу жай бөлшек БОЛЫП ТАБЫЛМАЙДЫ? Бөлім оң натурал сан болуы керек.';
  z=`${frac(0,p.base)} жазуында алым 0 болуы мүмкін, мәні 0. ${frac(p.base,p.base)} = 1 және ${frac(1,p.base)} — бөлімдері оң сандар болатын жай бөлшектер. Ал ${a} жазуында бөлім 0: нөлге бөлу анықталмаған, сондықтан бұл жай бөлшек емес. ${a} мәнін есептемейміз; қате жазуды таңдау тапсырманың өзі.`;break;
 }
 case'kilometre-share-metres':{
  a=part(1000,p.fraction);s=`Бір километрдің ${show(p.fraction)} бөлігі неше метр болады?`;
  z=`Алдымен бірлікті ауыстырамыз: 1 км = 1000 м. ${partProof(1000,p.fraction,'метр')} Қалған ${1000-a} метрмен қосындысы ${1000}. Километрдің санын емес, метрмен алынған бүтінді бөлеміз.`;break;
 }
 case'natural-quotient-denominator-count':{
  const values=range(1,p.numerator).filter(b=>p.numerator%b===0);a=values.length;s=`${p.numerator}/b бөлшегі оң натурал санға тең болсын. b — оң натурал сан. b үшін неше түрлі мән бар?`;
  z=`b саны ${p.numerator} санының бөлгіші болуы керек. Толық тізімі ${values.join(', ')} — ${a} мән. b > ${p.numerator} болса бөлінді 0 мен 1 арасында жатады, ол оң натурал сан емес. Әр тізімдегі мән үшін ${p.numerator} : b қалдықсыз орындалады; b = 0 бастапқы шарттан шығарылған.`;break;
 }
 case'equal-bulk-store-share':{
  const kg=p.bags*p.kgPerBag;a=frac(kg,p.stores)+' кг';options=p.choices.map(xs=>show(xs)+' кг');s=`Наубайхана желісіне әрқайсысы ${p.kgPerBag} кг болатын ${p.bags} қап ұн келді. Ұнның бәрін ${p.stores} дүкенге тең бөліп жіберді. Әр дүкенге неше килограмм ұн тиеді?`;
  z=`Жалпы масса ${p.kgPerBag} × ${p.bags} = ${kg} кг. Бір дүкеннің үлесі ${kg} : ${p.stores} = ${frac(kg,p.stores)} кг. Бір қаптың массасын ғана немесе қаптардың санын бөлуге болмайды. ${p.stores} бірдей үлес қайта қосылғанда ${kg} кг береді.`;break;
 }
 case'prime-extrema-fraction':{
  const loA=10**(p.numeratorDigits-1),hiA=10**p.numeratorDigits-1,loB=10**(p.denominatorDigits-1),hiB=10**p.denominatorDigits-1,n=Math.max(...range(loA,hiA).filter(prime)),d=range(loB,hiB).find(prime);a=frac(n,d);options=p.choices.map(show);
  s=`a/b бөлшегінде a — ${p.numeratorDigits} таңбалы ең үлкен жай сан, b — ${p.denominatorDigits} таңбалы ең кіші жай сан. Осы бөлшекті таңдаңдар.`;
  z=`Алым үшін ${hiA} құрама, ${hiA-1} жұп, одан кейін ${n}. ${n} саны 2, 3, 5, 7 сандарына бөлінбейді. Екі көбейткіш те 10 санынан кем болмаса, олардың көбейтіндісі кемінде 100 болар еді. Сондықтан ${n} құрама болса, 10 санынан кіші жай бөлгіші болар еді; ондай бөлгіші жоқ, демек жай. Бөлімнің ең кіші мүмкін саны ${loB} құрама, келесі ${d} де 2, 3, 5, 7 сандарына бөлінбейді және 11² = 121 санынан кіші, сондықтан жай. Алым ${n}, бөлім ${d}, жауап ${a}. Жай сан болу талабын ең үлкен не ең кіші санның өзімен шатастырмаймыз.`;break;
 }
 case'library-share-offset-whole':{
  const[n,d]=p.fiction,remainingParts=d-2*n;assert.ok(remainingParts>0);const unit=div(p.referenceExtra+p.dictionaries,remainingParts);a=unit*d;const fiction=unit*n,reference=fiction+p.referenceExtra;
  s=`Оқу орталығындағы кітаптардың ${show(p.fiction)} бөлігі көркем әдебиет. Анықтамалықтар көркем әдебиет кітаптарынан ${p.referenceExtra} дана көп. Қалған ${p.dictionaries} кітап — сөздіктер. Басқа кітап түрі жоқ. Орталықта барлығы неше кітап бар?`;
  z=`Бүтінді ${d} бөлік десек, көркем әдебиет ${n} бөлік, анықтамалықтар ${n} бөлік және ${p.referenceExtra} кітап. Сөздіктер тағы ${p.dictionaries}. Екі ${n} бөліктен кейін ${d} − ${n} − ${n} = ${remainingParts} бөлік қалады, ол ${p.referenceExtra} + ${p.dictionaries} = ${p.referenceExtra+p.dictionaries} кітап. Бір бөлік ${unit}, барлығы ${unit} × ${d} = ${a}. Тексеру: ${fiction} көркем, ${reference} анықтамалық, ${p.dictionaries} сөздік; қосындысы ${a}.`;break;
 }
 case'superposed-rope-cuts':{
  const common=lcm(...p.partitions),marks=p.partitions.map(d=>range(1,d-1).map(i=>i*common/d)),all=[...new Set(marks.flat())].sort((a,b)=>a-b);a=all.length+1;
  s=`Бір метр жіпке екі түрлі белгі салынды: оны ${p.partitions[0]} тең бөлікке бөлетін ішкі белгілер және ${p.partitions[1]} тең бөлікке бөлетін ішкі белгілер. Бір орында беттескен белгі біреу саналады. Жіптің екі ұшы қию белгісі емес. Барлық бөлек белгі бойынша қиғанда неше кесек шығады?`;
  z=`Бір метрді ойша ${common} тең ұсақ бөлікке келтіреміз. Бірінші белгілер орындары ${marks[0].join(', ')}, екіншісі ${marks[1].join(', ')}. Біріккен ішкі орындар ${all.join(', ')} — ${all.length} белгі. Бірдей ${marks[0].filter(n=>marks[1].includes(n)).map(n=>reduce(n,common)).join(', ')} орнын екі рет санамаймыз. ${all.length} ішкі қию ${all.length} + 1 = ${a} кесек береді; 0 мен ${common} ұштары қосымша қию емес.`;break;
 }
 case'age-share-now-and-future':{
  const[n,d]=p.now,[n2,d2]=p.after,index=one(p.choices.filter(child=>child*d%n===0&&(child+p.years)*d2===(child*d/n+p.years)*n2));a=`${index} жас`;options=p.choices.map(x=>`${x} жас`);
  s=`Әлидің қазіргі жасы әкесінің қазіргі жасының ${show(p.now)} бөлігі. ${p.years} жылдан кейін оның жасы әкесінің СОЛ КЕЗДЕГІ жасының ${show(p.after)} бөлігі болады. Әли қазір неше жаста?`;
  z=p.choices.map(child=>{const parent=div(child*d,n),futureChild=child+p.years,futureParent=parent+p.years;return`Бала ${child} болса, әке ${parent}; ${p.years} жылдан кейін ${futureChild} және ${futureParent}. Тексеру: ${futureChild} × ${d2} = ${futureChild*d2}, ${futureParent} × ${n2} = ${futureParent*n2}${futureChild*d2===futureParent*n2?' — тең':' — тең емес'}`;}).join('; ')+`. Тек ${index} жас екі шартты да орындайды. Уақыт екі адамға да бірдей қосылады; болашақ қатынасқа әкенің қазіргі жасын қолданбаймыз.`;break;
 }
 default:throw Error('Unsupported saved fraction-intro model '+kind);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{assert.match(String(a),/^\d+$/);s+=' Жауапқа тек санды жазыңыз.';}
 assert.ok(!/[\\$]/.test(s+z));return{statement:nativeFractions(s),answer:nativeFractions(a),solution:nativeFractions(z),...(options?{options:options.map(nativeFractions)}:{})};
}
const specs=new Map(SPECS.map(spec=>['grade5-fraction-intro-'+spec.id,spec]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,'grade5-fraction-intro-'+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:'grade5-fraction-intro-'+spec.id,modelId:'grade5-fraction-intro-'+spec.kind,grade:5,topic:'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Барлық 44 сақталған бастапқы шарт, толық шешім және барлық жауап нұсқалары жеке оқылды. Алым/бөлім, бөлінді/бөлшек, белгілі бөліктен бүтін және бүтіннен бөлік, қалған үлес пен алынған үлес бөлек сақталды.',
 'Әр дереккөз үшін жаңа қазақша редакция мен сандар жазылды. Бастапқы бүтін мен кейінгі қалдықтың негіздері, екі топтың ішкі үлесі мен толық топтың үлесі, қатаң шектер, өлшем бірлігі және болашақта екі адамның да жас өзгерісі айқындалды.',
 'Сандық нұсқалар мен 44 model ID 44 бөлек математикалық мағына деп саналмайды. Бөлшектік/сөздік жауаптар MCQ, ашық жауаптар тек бүтін сан. Бөлім 0 қате мысалы тек оны тану тапсырмасында әдейі беріліп, есептелмейді.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...(spec.kind==='invalid-zero-denominator'?{intentionalIncorrectExample:true}:{}),...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan','intentionalIncorrectExample'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const r=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(r[field]),'Unbound fraction-intro '+field);assert.equal(row.answer,r.answer);return{answer:r.answer,checks:['individual saved fraction-intro skill and source-specific numeric/word parameters bound','exact unit-share and inverse whole ledgers, changing bases explicitly retained','native fraction MCQ avoid equivalent free-input grading ambiguity','zero numerator allowed; intentional invalid denominator identified without division','full condition solution MCQ answer and metadata exact-bound','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All44 saved nonvisual grade5 topic3.1 sources individually rewritten offline. Numeric variants/modelIDs are source coverage, not semantic uniqueness. Awaiting independent content review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-fraction-intro.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
