/** All saved3.3 fractional classification skills rewritten offline, pending review. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-fraction-types-specs.mjs';
const prefix='grade5-fraction-types-',sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-3').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=ns=>ns.reduce((a,b)=>a+b,0),one=ns=>{assert.equal(ns.length,1);return ns[0];};
const div=(a,b)=>{assert.ok(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>0&&a%b===0);return a/b;};
const side=x=>/^[0-9A-Za-z]+$/.test(String(x))?String(x):`(${x})`,F=(n,d)=>`(${side(n)}/${side(d)})`,show=([n,d])=>F(n,d),list=ns=>ns.join(', ');
const gcd=(a,b)=>b?gcd(b,a%b):a,reduce=([n,d])=>[n/gcd(n,d),d/gcd(n,d)],proper=([n,d])=>{assert.ok(n>0&&d>0);return n<d;},improper=q=>!proper(q);
const type=q=>proper(q)?'дұрыс':'бұрыс',relation=([n,d])=>n<d?'<':n>d?'>':'=',describe=q=>`${show(q)}: ${q[0]} ${relation(q)} ${q[1]} — ${type(q)}`,divisors=n=>range(1,n).filter(d=>n%d===0);
function render(kind,p){let s,z,a,options;switch(kind){
 case'improper-integer-value':{
  a=div(p.numerator,p.denominator);s=`${F(p.numerator,p.denominator)} бөлшегін бөлу амалы ретінде есептеңдер. Ол қай натурал санға тең?`;
  z=`Бөлшек сызығы бөлу амалын білдіреді: ${F(p.numerator,p.denominator)} = ${p.numerator} : ${p.denominator} = ${a}. Кері тексеру: ${a} × ${p.denominator} = ${p.numerator}. Алым бөлімнен үлкен, сондықтан бөлшек бұрыс және мәні 1 санынан үлкен.`;break;
 }
 case'integer-to-given-denominator':{
  a=F(p.whole*p.denominator,p.denominator);options=p.choices.map(show);s=`Бөлімі ${p.denominator} болатын бөлшек арқылы ${p.whole} бүтін санын көрсетіңдер. Дұрыс жазуды таңдаңдар.`;
  z=`Бір бүтін ${p.denominator} бірлік бөліктен тұрады. ${p.whole} бүтінде ${p.whole} × ${p.denominator} = ${p.whole*p.denominator} осындай бөлік бар. Сондықтан ${p.whole} = ${a}. Тексеру: ${p.whole*p.denominator} : ${p.denominator} = ${p.whole}. Қосу, тек бүтін санды алымға жазу немесе екі мүшенің орнын ауыстыру бұл теңдікті сақтамайды.`;break;
 }
 case'least-improper-numerator':{
  a=p.denominator;s=`${F('n',p.denominator)} жазуы бұрыс бөлшек болуы керек. n — оң натурал сан. Ең кіші жарамды n мәнін табыңдар.`;
  z=`Бұрыс бөлшекте алым бөлімнен кем болмайды: n ≥ ${p.denominator}. ${F(p.denominator-1,p.denominator)} дұрыс, ал ${F(p.denominator,p.denominator)} = 1 — бұрыс. Тең жағдай да кіретіндіктен, ең кіші алым ${a}, ${a+1} емес.`;break;
 }
 case'true-relation-to-one':{
  const labels=p.choices.map(c=>`${show(c.fraction)} ${c.op} 1`),i=one(p.choices.flatMap((c,i)=>relation(c.fraction)===c.op?[i]:[]));a=labels[i];options=labels;s='Бөлшек пен 1 санын салыстырған төрт жазудың қайсысы дұрыс?';
  z=p.choices.map(c=>`${show(c.fraction)} үшін ${c.fraction[0]} ${relation(c.fraction)} ${c.fraction[1]}, сондықтан ${show(c.fraction)} ${relation(c.fraction)} 1`).join('; ')+`. Алым мен бөлім тең болса мәні дәл 1. Сондықтан дұрыс жазу ${a}.`;break;
 }
 case'proper-choice':case'improper-equality-choice':{
  const q=one(p.choices.filter(kind==='proper-choice'?proper:improper));a=show(q);options=p.choices.map(show);s=kind==='proper-choice'?'Ұсынылған жазулардың ішінен ДҰРЫС бөлшекті белгілеңдер.':'Төрт нұсқаның ішінен БҰРЫС бөлшекті таңдаңдар.';
  z=p.choices.map(describe).join('; ')+`. ${kind==='proper-choice'?'Тек алымы бөлімінен кіші бөлшек дұрыс.':'Алым бөлімге тең болса да бөлшек бұрыс, оның мәні 1.'} Жауап ${a}.`;break;
 }
 case'proper-equal-portion':case'improper-equal-liquid-share':{
  const target=kind==='proper-equal-portion'?[p.litres,p.containers]:reduce([p.litres,p.containers]);a=show(target)+' л';options=p.choices.map(q=>show(q)+' л');
  s=kind==='proper-equal-portion'?`Шеберханадағы ${p.litres} л бояуды ${p.containers} бірдей ыдысқа тең бөліп құйды. Әр ыдысқа неше литр бояу түсті?`:`Саяхатшылар ${p.litres} л суды ${p.containers} бірдей канистрге тең бөліп құйды. Бір канистрдегі су көлемін қысқармайтын бөлшекпен таңдаңдар.`;
  z=`Бүкіл көлемді ыдыс санына бөлеміз: ${p.litres} : ${p.containers} = ${F(p.litres,p.containers)} л${kind==='improper-equal-liquid-share'?` = ${a}`:''}. ${p.litres} ${p.litres<p.containers?'<':'>'} ${p.containers}, сондықтан бөлшек ${p.litres<p.containers?'дұрыс, әр ыдыста 1 л-ден аз':'бұрыс, әр ыдыста 1 л-ден көп'}. Бөлінгіш пен бөлгішті ауыстырмаймыз; екі санды қосу не азайту тең бөлу амалы емес.`;break;
 }
 case'count-improper-list':case'count-proper-list':case'reduce-then-count-improper':{
  const wantProper=kind==='count-proper-list',selected=p.fractions.filter(wantProper?proper:improper);a=selected.length;
  s=kind==='reduce-then-count-improper'?`Әр бөлшекті толық қысқартып тексеріңдер: ${p.fractions.map(show).join(', ')}. Олардың нешеуі БҰРЫС бөлшек?`:`${p.fractions.map(show).join(', ')} тізімінде ${wantProper?'ДҰРЫС':'БҰРЫС'} бөлшектер нешеу?`;
  z=kind==='reduce-then-count-improper'?p.fractions.map(q=>`${show(q)} = ${show(reduce(q))} — ${type(q)}`).join('; ')+'. ':p.fractions.map(describe).join('; ')+'. ';
  z+=`Талапқа сай жазулар: ${selected.map(show).join(', ')} — ${a} бөлшек. Алым мен бөлімнің теңдігі бұрыс түрге кіреді. Қысқарту бөлшектің мәнін және дұрыс не бұрыс түрін өзгертпейді.`;break;
 }
 case'equal-symbolic-terms':{
  a='Әрдайым бұрыс бөлшек, мәні 1';options=['Әрдайым дұрыс бөлшек','t мәніне қарай түрі өзгереді','Әрдайым бұрыс бөлшек, мәні 1-ден үлкен',a];s=`t — оң натурал сан. ${F('t','t')} жазуының түрі мен мәнін қатар дұрыс сипаттаған тұжырымды таңдаңдар.`;
  z=`Алым мен бөлім бірдей t санына тең, сондықтан анықтама бойынша бөлшек бұрыс. t нөл емес, демек t : t = 1. Бұл t санының үлкен-кішілігіне тәуелсіз. Мысалдар: ${p.examples.map(t=>`${F(t,t)} = 1`).join(', ')}. Бұрыс бөлшек міндетті түрде 1-ден ҮЛКЕН емес, 1-ге тең де бола алады.`;break;
 }
 case'make-proper-from-two-numbers':{
  const[lo,hi]=p.numbers;assert.ok(lo<hi);a=F(lo,hi);options=[F(lo,hi),F(hi,lo),F(lo,lo),F(hi,hi)];s=`${lo} және ${hi} сандарын әрқайсысын дәл бір рет қолданып, дұрыс бөлшек жазыңдар.`;
  z=`Дұрыс бөлшекте алым бөлімнен кіші. ${lo} < ${hi}, сондықтан алым ${lo}, бөлім ${hi}: ${a}. Кері ${F(hi,lo)} — бұрыс. ${F(lo,lo)} және ${F(hi,hi)} бір санды екі рет қолданады әрі екеуі де 1-ге тең бұрыс бөлшектер.`;break;
 }
 case'greatest-proper-numerator':{
  a=p.denominator-1;s=`${F('x',p.denominator)} — дұрыс бөлшек, x — оң натурал сан. Алымның ең үлкен мүмкін мәнін табыңдар.`;
  z=`Шарт x < ${p.denominator}, сондықтан толық мүмкін алымдар ${list(range(1,a))}. Ең үлкені ${a}. ${F(a,p.denominator)} < 1, бірақ келесі ${F(p.denominator,p.denominator)} = 1 — бұрыс бөлшек, ол кірмейді.`;break;
 }
 case'greatest-improper-denominator':{
  a=p.numerator;s=`${F(p.numerator,'y')} — бұрыс бөлшек, y — оң натурал сан. Бөлімнің ең үлкен мүмкін мәні қандай?`;
  z=`Алым бөлімнен кем емес: ${p.numerator} ≥ y. Сондықтан y = ${list(range(1,a))}. Ең үлкені ${a}, өйткені ${F(a,a)} = 1 — бұрыс. y = ${a+1} болса ${F(a,a+1)} дұрыс болып кетеді. Бөлімдегі белгісіз үшін салыстыру бағытын шатастырмаймыз.`;break;
 }
 case'count-fixed-denominator-proper':{
  const values=range(1,p.denominator-1);a=values.length;s=`Алымы оң натурал сан, бөлімі ${p.denominator} болатын барлық ДҰРЫС бөлшектерді санап шығыңдар. Неше түрлі жазу бар?`;
  z=`Дұрыс болу үшін алым ${p.denominator} санынан кіші: ${list(values)}. Бөлшектер ${values.map(n=>F(n,p.denominator)).join(', ')} — ${a} жазу. 0 алымы шарттағы оң натурал сан емес, ${p.denominator} алымы теңдік беріп, бұрыс түрге өтер еді. Қысқартқанда тең мән шығуы жазуларды біріктіруге себеп емес.`;break;
 }
 case'all-improper-denominators':{
  const values=range(1,p.numerator);a=list(values);options=[a,list(range(1,p.numerator-1)),`${p.numerator+1}, ${p.numerator+2}, ${p.numerator+3}, …`,`Тек ${p.numerator}`];s=`${F(p.numerator,'y')} бөлшегі бұрыс болсын, y — оң натурал сан. y-тің БАРЛЫҚ жарамды мәндерін қамтитын нұсқаны таңдаңдар.`;
  z=`Бұрыс болу шарты ${p.numerator} ≥ y. Демек ${list(values)} мәндерінің бәрі кіреді. y = ${p.numerator} кезінде ${F(p.numerator,p.numerator)} = 1 — әлі бұрыс. y = ${p.numerator+1} басталғанда бөлім алымнан үлкен болады, бөлшек дұрыс. Сондықтан жоғарғы тең шекті де, төменгі 1 мәнін де аламыз.`;break;
 }
 case'minutes-as-improper-hours':{
  const target=reduce([p.minutes,60]);a=show(target)+' сағ';options=p.choices.map(q=>show(q)+' сағ');s=`Сурет салу шеберлік сабағы ${p.minutes} минутқа созылды. Осы уақытты сағатпен толық қысқартылған бөлшек түрінде көрсетіңдер.`;
  z=`Бір сағат 60 минут. Сондықтан ${p.minutes} минут = ${F(p.minutes,60)} сағ. Екі мүшені ${gcd(p.minutes,60)} санына бөліп, ${a} аламыз. Алым бөлімнен үлкен: бұл 1 сағаттан ұзақ бұрыс бөлшек. 100 минутты бір сағат деп алу және бөлінгіш пен бөлгішті ауыстыру қате.`;break;
 }
 case'improper-with-bounded-numerator':{
  const values=range(p.denominator,p.upperInclusive);a=values.length;s=`Оқушы бөлімі ${p.denominator} болатын бөлшектердің алымына 1–${p.upperInclusive} аралығындағы әр натурал санды бір реттен жазды. Екі шет те кіреді. Қанша БҰРЫС бөлшек шықты?`;
  z=`Бұрыс түр үшін алым кемінде ${p.denominator}. Сондықтан жарамды алымдар ${list(values)}. Саны ${p.upperInclusive} − ${p.denominator} + 1 = ${a}. Тең ${F(p.denominator,p.denominator)} бөлшегі де кіреді; оны ұмытсақ жауап біреуге кем болар еді.`;break;
 }
 case'proper-numerator-sum':{
  const values=range(1,p.denominator-1);a=sum(values);s=`${F('x',p.denominator)} дұрыс бөлшек болатындай БАРЛЫҚ оң натурал x мәндерінің қосындысын есептеңдер.`;
  const pairs=Math.floor(values.length/2),mid=values.length%2?values[Math.floor(values.length/2)]:0;
  z=`Алым x < ${p.denominator}, сондықтан ${list(values)}. Шеттерін жұптасақ әр жұп ${p.denominator} береді; ${pairs} жұп${mid?`, ортасында ${mid} қалады`:''}. Қосынды ${pairs} × ${p.denominator}${mid?' + '+mid:''} = ${a}. ${p.denominator} кірмейді, себебі тең алым мен бөлім дұрыс бөлшек бермейді. Сұралғаны мәндер саны емес, олардың қосындысы.`;break;
 }
 case'whole-to-unit-portions':{
  a=p.sheets*p.partsPerSheet;s=`Көркем еңбек сабағында ${p.sheets} бірдей қағаз парағы алынды. Әр парақ ${p.partsPerSheet} тең бөлікке бөлінді. Бір парақтың ${F(1,p.partsPerSheet)} бөлігіне тең кішкентай бөліктер барлығы нешеу?`;
  z=`Бір парақта ${p.partsPerSheet} бөлік, ${p.sheets} парақта ${p.sheets} × ${p.partsPerSheet} = ${a} бөлік. Бүтіндерге қатысты жазсақ, ${p.sheets} = ${F(a,p.partsPerSheet)}. Тексеру: ${a} : ${p.partsPerSheet} = ${p.sheets}. Парақ саны мен бір парақтағы бөлік саны қосылмайды, көбейтіледі. Барлық парақ бірдей болғандықтан бірлік бөліктердің өлшемі де бірдей.`;break;
 }
 case'reciprocal-of-proper':{
  a='Бұрыс бөлшек, мәні 1-ден үлкен';options=['Дұрыс бөлшек','Бұрыс бөлшек, мәні 1',a,'Кейде дұрыс, кейде бұрыс'];s=`m және n — оң натурал сандар, ${F('m','n')} дұрыс бөлшек. Алым мен бөлімді ауыстырған ${F('n','m')} жазуына қай сипаттама міндетті түрде сай келеді?`;
  z=`Бастапқы дұрыс бөлшекте m < n. Орын ауысқанда алым n бөлім m санынан қатаң үлкен, сондықтан ${F('n','m')} бұрыс және 1-ден үлкен. Теңдік болуы мүмкін емес, өйткені бастапқы шарт m ≠ n дейді. Мысалдар: ${p.examples.map(q=>`${show(q)} дұрыс, ${F(q[1],q[0])} бұрыс`).join('; ')}.`;break;
 }
 case'strictly-over-one-bounded-numerator':{
  const values=range(p.denominator+1,p.upperExclusive-1);a=values.length;s=`${F('a',p.denominator)} бөлшегінің мәні 1-ден ҚАТАҢ ҮЛКЕН, ал a — ${p.upperExclusive} санынан кіші оң натурал сан. Осы екі шартқа сай жазулар нешеу?`;
  z=`1-ден қатаң үлкен болуы үшін a > ${p.denominator}, ал a < ${p.upperExclusive}. Жарамдылары ${list(values)}. Саны ${values.at(-1)} − ${values[0]} + 1 = ${a}. ${F(p.denominator,p.denominator)} бұрыс болғанымен, 1-ге тең, сондықтан бұл сұраққа кірмейді. Жоғарғы ${p.upperExclusive} шеті де кірмейді.`;break;
 }
 case'integer-fraction-term-sum':{
  const n=p.whole*p.denominator;a=n+p.denominator;s=`Бөлімі ${p.denominator} болатын бөлшектің мәні ${p.whole} бүтін санға тең. Осы бөлшектің алымы мен бөлімінің қосындысын табыңдар.`;
  z=`Белгісіз алым ${p.whole} × ${p.denominator} = ${n}. Бөлшек ${F(n,p.denominator)} = ${p.whole}. Енді екі мүшенің қосындысы ${n} + ${p.denominator} = ${a}. ${p.whole} — алым емес, бөлшектің мәні; оны бөлімге қоса салуға болмайды.`;break;
 }
 case'two-natural-fraction-unknowns':{
  const x=p.whole*p.firstDenominator,y=div(p.secondNumerator,p.whole);a=x+y;s=`${F('a',p.firstDenominator)} = ${p.whole} және ${F(p.secondNumerator,'b')} = ${p.whole}. a мен b — оң натурал сандар. a + b қосындысы неше?`;
  z=`Алғашқы теңдікте белгісіз — бөлінгіш: a = ${p.whole} × ${p.firstDenominator} = ${x}. Екіншісінде белгісіз — бөлгіш: b = ${p.secondNumerator} : ${p.whole} = ${y}. Сондықтан a + b = ${x} + ${y} = ${a}. Тексеру: ${F(x,p.firstDenominator)} = ${p.whole}, ${F(p.secondNumerator,y)} = ${p.whole}. Екі белгісіз бірдей амалмен табылмайды.`;break;
 }
 case'count-distinct-term-improper':{
  const pairs=p.numbers.flatMap(d=>p.numbers.filter(n=>n>d).map(n=>[n,d]));a=pairs.length;s=`Алым мен бөлім ${list(p.numbers)} сандарының ішінен алынады, бірақ бір жазуда олар әртүрлі болуы тиіс. Неше БҰРЫС бөлшек жазуға болады? Мәні тең болса да, жазуы бөлек бөлшектер жеке саналады.`;
  z=p.numbers.map(d=>{const ns=p.numbers.filter(n=>n>d);return`Бөлім ${d}: ${ns.length?ns.map(n=>F(n,d)).join(', '):'жарамды алым жоқ'} — ${ns.length} жазу`;}).join('; ')+`. Барлығы ${p.numbers.map(d=>p.numbers.filter(n=>n>d).length).join(' + ')} = ${a}. Бірдей мүшелерге тыйым салынғандықтан теңдік жағдайы жоқ. Мысалы, ${F(4,2)} және ${F(6,3)} екеуі де 2-ге тең, бірақ екі түрлі жазу ретінде есептеледі.`;break;
 }
 case'proper-after-reduction-choice':{
  a=show(one(p.choices.filter(proper)));options=p.choices.map(show);s='Әр нұсқаны толық қысқартып қараңдар. Қай бастапқы бөлшек қысқартылғаннан кейін ДҰРЫС түрге жатады?';
  z=p.choices.map(q=>`${show(q)} = ${show(reduce(q))} — ${type(q)}`).join('; ')+`. Жауап нұсқасында бастапқы ${a} жазуы таңдалады. Қысқарту мәнді өзгертпейді, алым мен бөлім тең болған бөлшек қысқарғаннан кейін де 1-ге тең бұрыс түр болып қалады.`;break;
 }
 case'piece-shorter-than-unit':{
  a=`${one(p.choices.filter(n=>p.metres<n))} бөлік`;options=p.choices.map(n=>`${n} бөлік`);s=`Безендіру үшін ${p.metres} м таспа тең ұзындықтағы кесектерге кесіледі. Қай бөлік саны таңдалса, ӘР кесек 1 м-ден қысқа болады?`;
  z=p.choices.map(n=>`${n} бөлік болса ${F(p.metres,n)} м: ${p.metres} ${p.metres<n?'<':p.metres>n?'>':'='} ${n}, демек ${p.metres<n?'1 м-ден қысқа':p.metres>n?'1 м-ден ұзын':'дәл 1 м'}`).join('; ')+`. Тек ${a} талабы орындалады. 1 м-ге тең кесек «қысқа» шартына кірмейді.`;break;
 }
 case'shared-numerator-two-types':{
  const values=range(p.improperDenominator,p.properDenominator-1);a=list(values);options=[`Тек ${values[1]}`,a,list(range(p.improperDenominator,p.properDenominator)),list(range(p.improperDenominator+1,p.properDenominator))];s=`${F('n',p.improperDenominator)} — бұрыс, ал ${F('n',p.properDenominator)} — дұрыс бөлшек. Екеуіне ортақ оң натурал n мәндерінің толық тізімін таңдаңдар.`;
  z=`Біріншісі n ≥ ${p.improperDenominator}, екіншісі n < ${p.properDenominator} шартын береді. Қиылысу ${list(values)}. Төменгі ${p.improperDenominator} мәні теңдік арқылы бұрыс түрге кіреді; жоғарғы ${p.properDenominator} теңдік беріп, екінші бөлшекті бұрыс қылатындықтан кірмейді.`;break;
 }
 case'improper-fixed-term-sum-count':{
  const pairs=range(1,p.sum-1).flatMap(d=>p.sum-d>=d?[[p.sum-d,d]]:[]);a=pairs.length;s=`Алымы мен бөлімі оң натурал сандар, олардың қосындысы ${p.sum}. Осы талапқа сай БҰРЫС бөлшектердің жазылуы нешеу?`;
  z=`Бөлім b болса алым ${p.sum} − b. Бұрыс болу үшін ${p.sum} − b ≥ b, сондықтан бөлім 1–${Math.floor(p.sum/2)} аралығында. Жазулар ${pairs.map(show).join(', ')} — ${a} бөлшек. Тең ${F(p.sum/2,p.sum/2)} жағдайы да кіреді. Келесі бөлімде алым кішірейіп, бөлшек дұрыс болады.`;break;
 }
 case'proper-transitivity':{
  a='Дұрыс бөлшек, мәні 1-ден кіші';options=['Бұрыс бөлшек','Мәні 1',a,'Мәлімет жеткіліксіз'];s=`Оң натурал x, y, z сандары үшін ${F('x','y')} және ${F('y','z')} дұрыс бөлшектер екені белгілі. ${F('x','z')} жазуы туралы қандай қорытынды міндетті?`;
  const[x,y,zv]=p.example;assert.ok(x<y&&y<zv);z=`Бірінші шарттан x < y, екіншісінен y < z. Демек x < y < z, соның ішінде x < z. Сондықтан ${F('x','z')} дұрыс және 1-ден кіші. Кез келген осындай сандар үшін салыстыру тізбегі орындалады. Мысал: x = ${x}, y = ${y}, z = ${zv}; ${F(x,y)}, ${F(y,zv)}, ${F(x,zv)} — бәрі дұрыс. Мысал тұжырымның жалпы дәлелін алмастырмайды, тек көрсетеді.`;break;
 }
 case'improper-numerator-increase':{
  a='Әрдайым бұрыс бөлшек және 1-ден үлкен';options=['Кейде дұрыс бөлшек болады',a,'Әрдайым 1-ге тең','Әрдайым натурал сан болады'];s=`${F('m','n')} бұрыс бөлшегінде m мен n — оң натурал сандар. Тек алымға ${p.added} қосып ${F(`m + ${p.added}`,'n')} алынды. Қай сипаттама барлық жағдайда дұрыс?`;
  const[c,d]=p.counterexample,[x,y]=p.example;assert.ok(c>=d&&x>=y&&(c+p.added)%d!==0);z=`Бастапқы шарт m ≥ n. ${p.added} оң сан болғандықтан m + ${p.added} > m ≥ n, демек жаңа алым бөлімнен қатаң үлкен. Жаңа бөлшек әрқашан бұрыс және 1-ден үлкен, тіпті m = n болса да. Бірақ ол міндетті түрде натурал емес: ${F(c,d)} → ${F(c+p.added,d)}; ${c+p.added} саны ${d} санына қалдықсыз бөлінбейді. Тағы бір мысал ${F(x,y)} → ${F(x+p.added,y)}. 1-ге теңдік пен дұрыс түр жаңа қатаң салыстыруға қайшы.`;break;
 }
 case'three-type-constraints-sum':{
  const values=range(Math.max(p.firstDenominator,p.properNumerator+1),p.secondNumerator);a=sum(values);s=`x — оң натурал сан. ${F('x',p.firstDenominator)} және ${F(p.secondNumerator,'x')} бұрыс бөлшектер, ал ${F(p.properNumerator,'x')} дұрыс бөлшек болуы керек. Барлық жарамды x мәндерінің ҚОСЫНДЫСЫН табыңдар.`;
  z=`Үш шарт: x ≥ ${p.firstDenominator}; x ≤ ${p.secondNumerator}; x > ${p.properNumerator}. Бірге ${list(values)}. Бірінші төменгі шек соңғы шарттан әлсіз, бірақ бәрібір орындалады. Қосынды ${values.join(' + ')} = ${a}. Жоғарғы ${p.secondNumerator} теңдік арқылы бұрыс түрге кіреді; ${p.properNumerator} болса соңғы бөлшек 1-ге тең болып, дұрыс болмай қалады.`;break;
 }
 case'linear-ratio-proper-domain':{
  const diff=p.numeratorCoefficient-p.denominatorCoefficient;assert.ok(diff>0);const max=Math.ceil(p.denominatorAdd/diff)-1,values=range(1,max);a=list(values);options=[list(range(1,max+1)),`Тек ${max+1}`,'Тек 1',a];s=`x — оң натурал сан. ${F(`${p.numeratorCoefficient}x`,`${p.denominatorCoefficient}x + ${p.denominatorAdd}`)} дұрыс бөлшек болатындай x мәндерінің толық тізімін таңдаңдар.`;
  z=`Дұрыс түр шарты ${p.numeratorCoefficient}x < ${p.denominatorCoefficient}x + ${p.denominatorAdd}. Екі жағынан ортақ ${p.denominatorCoefficient}x бөлігін алсақ, ${diff===1?'x':diff+'x'} < ${p.denominatorAdd}. Сондықтан ${list(values)}. x = ${max+1} кезінде ${F(p.numeratorCoefficient*(max+1),p.denominatorCoefficient*(max+1)+p.denominatorAdd)} = 1 — бұрыс; x өскен сайын екі мүшенің айырмасы да өседі, сондықтан кейін жаңа жарамды мән жоқ.`;break;
 }
 case'affine-numerator-proper-domain':{
  const max=Math.ceil((p.denominator-p.added)/p.coefficient)-1,values=range(1,max);a=list(values);options=[a,list(range(1,max+1)),list(range(1,p.denominator)),`${max+1}, ${max+2}, ${max+3}, …`];s=`${F(`${p.coefficient}n + ${p.added}`,p.denominator)} жазуы ДҰРЫС бөлшек болуы тиіс. n — оң натурал сан. Барлық жарамды n мәндері қай нұсқада?`;
  z=`Алым бөлімнен кіші болуы керек: ${p.coefficient}n + ${p.added} < ${p.denominator}, яғни ${p.coefficient}n < ${p.denominator-p.added}. Жарамдылары ${list(values)}. Соңғы мән n = ${max} кезінде алым ${p.coefficient*max+p.added} < ${p.denominator}; келесі n = ${max+1} кезінде алым ${p.coefficient*(max+1)+p.added} = ${p.denominator}, бұл бұрыс түр. n одан әрі өссе алым да өседі.`;break;
 }
 case'proper-full-square-domain':{
  const counts=range(1,p.upperInclusive).map(d=>d-1);a=sum(counts);s=`Алым мен бөлімнің әрқайсысы 1–${p.upperInclusive} аралығындағы оң натурал сан. ДҰРЫС бөлшектің неше түрлі жазуын жасауға болады? Екі шет кіреді; мәндері тең жазулар біріктірілмейді.`;
  z=`Бөлім 1 болса жарамды алым жоқ, бөлім 2 болса 1 алым, бөлім 3 болса 2 алым. Жалпы бөлім d үшін d − 1 алым бар. Қосынды ${counts.join(' + ')} = ${a}. Тексеру: барлық ${p.upperInclusive} × ${p.upperInclusive} = ${p.upperInclusive**2} жұптың ${p.upperInclusive} жұбында мүшелер тең. Қалған ${p.upperInclusive**2-p.upperInclusive} жұпта алым-бөлім орнын ауыстыру дұрыс пен бұрыс түрді жұптайды, жартысы ${a}.`;break;
 }
 case'affine-denominator-improper-domain':{
  const max=p.numerator-p.added,values=range(1,max);a=list(values);options=[list(range(1,max-1)),a,`${max}, ${max+1}, ${max+2}, …`,list(range(1,p.numerator))];s=`${F(p.numerator,`n + ${p.added}`)} бұрыс бөлшек болатындай оң натурал n мәндерінің БАРЛЫҒЫН таңдаңдар.`;
  z=`Бөлім алымнан аспауы керек: n + ${p.added} ≤ ${p.numerator}. Сондықтан n ≤ ${max}, толық тізім ${list(values)}. n = ${max} кезінде ${F(p.numerator,p.numerator)} = 1 — бұрыс, жоғарғы шек кіреді. Келесі n = ${max+1} кезінде ${F(p.numerator,p.numerator+1)} дұрыс болады. Белгісіз бөлімде тұрғанын ескеру қажет.`;break;
 }
 case'fraction-between-integers':{
  const lo=p.denominator*p.lowerExclusive,hi=p.denominator*p.upperExclusive,values=range(lo+1,hi-1);a=values.length;s=`Алымы оң натурал сан, бөлімі ${p.denominator} болатын бөлшектің мәні ${p.lowerExclusive} санынан ҚАТАҢ ҮЛКЕН және ${p.upperExclusive} санынан ҚАТАҢ КІШІ. Неше түрлі алым жарайды?`;
  z=`Шекаралар ${p.lowerExclusive} = ${F(lo,p.denominator)} және ${p.upperExclusive} = ${F(hi,p.denominator)}. Бөлімдер бірдей болғандықтан, алым ${lo} санынан үлкен, ${hi} санынан кіші: ${values[0]}, …, ${values.at(-1)}. Саны ${values.at(-1)} − ${values[0]} + 1 = ${a}. Екі тең шет те шарттағы қатаң сөздерге байланысты кірмейді.`;break;
 }
 case'affine-numerator-proper-count':{
  const values=range(1,p.denominator-p.added-1);a=values.length;s=`${F(`n + ${p.added}`,p.denominator)} дұрыс бөлшек болатындай оң натурал n мәндері НЕШЕУ?`;
  z=`n + ${p.added} < ${p.denominator}, сондықтан n < ${p.denominator-p.added}. Толық жарамды тізім ${list(values)} — ${a} мән. Соңғы n = ${values.at(-1)} алымы ${p.denominator-1} болатын дұрыс бөлшек береді, ал келесі мән ${F(p.denominator,p.denominator)} = 1 беріп, кірмейді. Алымдағы қосымша ${p.added} санын елемеуге болмайды.`;break;
 }
 case'anti-diagonal-improper-count':{
  const pairs=range(1,p.count).map(n=>[n,p.count+1-n]),wrong=pairs.filter(improper);a=wrong.length;s=`${p.count} бөлшек мына ережемен жазылды: ${pairs.slice(0,3).map(show).join(', ')}, …, ${pairs.at(-1)&&show(pairs.at(-1))}. Әр келесі жазуда алым 1-ге артып, бөлім 1-ге кемиді. Тізімде неше БҰРЫС бөлшек бар?`;
  z=`Әр мүшенің алымы мен бөлімінің қосындысы ${p.count+1}. Бұл тақ сан болғандықтан, алым мен бөлім бірдей бола алмайды. Шекарада ${show(pairs[Math.floor(p.count/2)-1])} дұрыс, одан кейін ${show(pairs[Math.floor(p.count/2)])} бұрыс. Бұрыс мүшелердің алымдары ${wrong[0][0]}, …, ${wrong.at(-1)[0]}; саны ${wrong.at(-1)[0]} − ${wrong[0][0]} + 1 = ${a}. Қалған ${p.count-a} мүшемен қосқанда ${p.count} шығады.`;break;
 }
 case'possible-proper-denominator':{
  a=one(p.choices.filter(d=>p.numerator<d));options=p.choices.map(String);s=`Дұрыс бөлшектің алымы ${p.numerator}. Төмендегі сандардың қайсысын бөлімге қоюға болады?`;
  z=p.choices.map(d=>describe([p.numerator,d])).join('; ')+`. Дұрыс түр үшін бөлім алымнан қатаң үлкен болуы керек. Сондықтан жауап ${a}; бөлім ${p.numerator} болса мәні 1 болатын бұрыс бөлшек шығар еді.`;break;
 }
 case'adjacent-proper-terms':{
  a=p.denominator-1;s=`Бөлімі ${p.denominator} болатын дұрыс бөлшектің алымы мен бөлімі — көршілес натурал сандар. Алымын табыңдар.`;
  z=`${p.denominator} санының көршілері ${p.denominator-1} және ${p.denominator+1}. Дұрыс бөлшекте алым кіші, сондықтан ${a}. Тексеру: ${F(a,p.denominator)} дұрыс және ${p.denominator} − ${a} = 1. Үлкен көрші алым болса бұрыс бөлшек шыққан болар еді.`;break;
 }
 case'incomplete-definition-counterexample':{
  a=F(p.base,p.base);options=[F(p.base+1,p.base),F(p.base-1,p.base),F(p.base,p.base+1),a];s=`Жанай «Бұрыс бөлшек болу үшін алым бөлімнен міндетті түрде ҮЛКЕН болуы керек» деген толық емес ереже айтты. Оның ұмытқан жағдайын қай мысал көрсетеді?`;
  z=`Дұрыс анықтама: бұрыс бөлшекте алым бөлімнен үлкен НЕМЕСЕ оған тең. ${a} = 1 жазуында алым үлкен емес, тең; бірақ бұл да бұрыс бөлшек. Сондықтан ол толық емес ереженің қарсы мысалы. ${F(p.base+1,p.base)} үлкен алымды болғандықтан ереженің кемшілігін ашпайды, қалған екі дұрыс бөлшек бұл тұжырымға қарсы мысал емес. Дәйексөздегі толық емес ереже әдейі қате мысал ретінде берілген.`;break;
 }
 case'natural-improper-under-upper':{
  const ns=range(p.denominator,p.upperExclusive-1).filter(n=>n%p.denominator===0);a=ns.length;s=`Бөлімі ${p.denominator}, алымы ${p.upperExclusive} санынан КІШІ бұрыс бөлшек натурал санға тең болуы керек. Алымы оң натурал сан. Осындай жазулар нешеу?`;
  z=`Бұрыс түр үшін алым кемінде ${p.denominator}, натурал мән үшін ол ${p.denominator} санына қалдықсыз бөлінуі керек. Жарамды алымдар ${list(ns)} — ${a} мән. ${F(p.denominator,p.denominator)} = 1 де кіреді, ал келесі ${p.upperExclusive} алымы қатаң жоғарғы шекке кірмейді. Әрқайсысы ${list(range(1,a))} натурал мәндерінің бірін береді.`;break;
 }
 case'universal-improper-expression':{
  a=F(`${p.firstCoefficient}u + v`,'v');options=[a,F(`u + ${p.added}`,'v'),F(`${p.otherCoefficient}u`,'v'),F('v','u + v')];s=`u және v — оң натурал сандар, ${F('u','v')} дұрыс бөлшек. Қай өрнек u мен v-дің БАРЛЫҚ осындай мәнінде бұрыс бөлшек болады?`;
  const[u,v]=p.counterexample;assert.ok(u<v&&u+p.added<v&&p.otherCoefficient*u<v);z=`${p.firstCoefficient}u + v саны v санынан ${p.firstCoefficient}u оң шамасына үлкен, сондықтан ${a} әрдайым бұрыс және 1-ден үлкен. Екінші және үшінші нұсқаға қарсы мысал u = ${u}, v = ${v}: ${F(u+p.added,v)} және ${F(p.otherCoefficient*u,v)} дұрыс бөлшектер. Соңғы ${F('v','u + v')} үшін v < u + v, сондықтан ол әрдайым дұрыс. Жеке мысал қалғандарын жоққа шығарады, ал бірінші нұсқа жалпы оңдық арқылы дәлелденді.`;break;
 }
 case'natural-denominator-divisor-count':{
  const ds=divisors(p.numerator);a=ds.length;s=`${F(p.numerator,'b')} жазуының мәні натурал сан болуы керек, b — оң натурал сан. Бөлімге қойылатын әртүрлі b мәндері нешеу?`;
  z=`b саны ${p.numerator} санының бөлгіші болуы тиіс. Толық тізім ${list(ds)} — ${a} мән. Жұптасақ ${ds.filter(d=>d*d<=p.numerator).map(d=>`${d} × ${p.numerator/d}`).join(', ')}. 1 және ${p.numerator} шеттері де кіреді; b = 0 рұқсат етілмейді. Кез келген осындай бөлгіш алымнан аспайды, сондықтан бөлшек бұрыс, бірақ натурал мәнге ие.`;break;
 }
 case'both-reciprocals-improper':{
  a='u = v';options=['u > v',a,'u < v','Мұндай оң сандар жоқ'];s=`u және v — оң натурал сандар. ${F('u','v')} мен ${F('v','u')} екеуі де бұрыс бөлшек. u мен v арасында қай байланыс міндетті?`;
  z=`Бірінші шарт u ≥ v, екінші шарт v ≥ u. Екі қарама-қарсы кем емес салыстыру тек u = v болғанда бірге орындалады. Мысал u = v = ${p.example}: екі жазу да ${F(p.example,p.example)} = 1, бұрыс түрге жатады. Демек тең жағдайды жоққа шығарып «мұндай сандар жоқ» деуге болмайды.`;break;
 }
 case'irreducible-improper-under-upper':{
  const values=range(p.denominator,p.upperExclusive-1).filter(n=>gcd(n,p.denominator)===1);a=values.length;s=`Бөлімі ${p.denominator} болатын ҚЫСҚАРМАЙТЫН бұрыс бөлшектің алымы ${p.upperExclusive} санынан кіші оң натурал сан. Осындай бөлшектер нешеу?`;
  z=`Алым ${p.denominator} ≤ a < ${p.upperExclusive} шартын орындайды. Қысқармау үшін ЕҮОБ(a, ${p.denominator}) = 1 қажет. ${p.denominator} = 2² × 3, сондықтан жұп алымдар мен 3-ке бөлінетін алымдарды алып тастаймыз. Қалғандары ${list(values)} — ${a} сан. ${p.denominator} тең шеті бұрыс болғанымен, қысқарады; тек жіктеу талабын орындау жеткіліксіз.`;break;
 }
 case'gcd-lcm-nonnatural-improper':{
  const qualifies=([n,d])=>gcd(n,d)===p.gcd&&n*d/gcd(n,d)===p.lcm&&n>=d&&n%d!==0;const pair=one(p.choices.filter(qualifies));a=`a = ${pair[0]}, b = ${pair[1]}`;options=p.choices.map(([n,d])=>`a = ${n}, b = ${d}`);
  s=`${F('a','b')} бұрыс бөлшек, бірақ мәні натурал сан ЕМЕС. a мен b — оң натурал сандар, ЕҮОБ(a, b) = ${p.gcd}, ЕКОЕ(a, b) = ${p.lcm}. Барлық шартқа сай жұпты таңдаңдар.`;
  z=p.choices.map(([n,d])=>`${F(n,d)}: ЕҮОБ ${gcd(n,d)}, ЕКОЕ ${n*d/gcd(n,d)}, түрі ${n>=d?'бұрыс':'дұрыс'}, мәні ${n%d===0?'натурал':'натурал емес'}`).join('; ')+`. Төрт талапты бірдей орындайтын жалғыз жұп ${a}. Мысалы, ${F(p.choices[0][0],p.choices[0][1])} бұрыс және ЕҮОБ пен ЕКОЕ шарттары дұрыс болғанымен, натурал мән бергендіктен жарамайды.`;break;
 }
 case'bounded-integer-fraction-writings':{
  const counts=range(1,p.upperInclusive).map(d=>Math.floor(p.upperInclusive/d));a=sum(counts);s=`Алым да, бөлім де 1–${p.upperInclusive} аралығындағы оң натурал сандар, екі шет те кіреді. Неше түрлі бөлшек жазуының мәні натурал санға тең? Мәндері бірдей әртүрлі алым-бөлім жұптары жеке саналады.`;
  z=`Натурал мән алу үшін алым бөлімге қалдықсыз бөлінеді. Бөлімдер 1, …, ${p.upperInclusive} болғанда жарамды алым саны тиісінше ${list(counts)}. Мысалы, бөлім 1 болса барлық ${p.upperInclusive} алым жарайды, бөлім 2 болса ${list(range(1,Math.floor(p.upperInclusive/2)).map(n=>2*n))}, ал бөлім ${p.upperInclusive} болса тек алым ${p.upperInclusive}. Барлығын қоссақ ${counts.join(' + ')} = ${a}. Тең алым мен бөлімдер де, 1 алымы бар ${F(1,1)} жазуы да есептеледі; қысқартылған мәндер бойынша біріктірмейміз.`;break;
 }
 default:throw Error('Unsupported saved fraction-type model '+kind);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{assert.match(String(a),/^\d+$/);s+=' Жауапқа тек санды жазыңыз.';}
 assert.ok(!/[\\$^]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(s=>[prefix+s.id,s]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,prefix+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:prefix+spec.id,modelId:prefix+spec.kind,grade:5,topic:'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Барлық 50 сақталған бастапқы шарт, толық шешім және барлық жауап нұсқалары жеке оқылды. Дұрыс/бұрыс түрлердің тең шекарасы, натурал сан мәні, барлық мәнді санау/қосу және екі белгісіздің алымда не бөлімде орналасуы бөлек сақталды.',
 'Жеке дереккөзге жаңа қазақша шарт пен өзгертілген сандар жазылды. Шеберхана бояуы, саяхат суы, қағаз парақтары, көркем сабақ, таспа және тапсырма жазулары қайта құрастырылды. Анықтамалар мен жалпы дәлелдер өзгермейтін математикалық фактілерге сүйенеді.',
 '50 model ID немесе сандық нұсқа 50 жаңа математикалық мағына деп саналмайды. Шектеулі жазуларды санағанда мәні тең бөлшектер бөлек сақталады. Бөлшектік, тізімдік және сөздік жауаптар MCQ, ашық жауаптар тек бүтін сан. Барлық бөлшек native canonical топпен жазылды.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...(spec.kind==='incomplete-definition-counterexample'?{intentionalIncorrectExample:true}:{}),...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(row=>[row.editionId,row]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan','intentionalIncorrectExample'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const r=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(r[field]),'Unbound fraction types '+field);assert.equal(row.answer,r.answer);return{answer:r.answer,checks:['source3.3-specific parameters and requested fraction classification bound','equality improper versus strictly>1 kept distinct; positive numerator/denominator domains','full finite numerator denominator pair-count and divisibility domains enumerable','universal claims explained symbolically with explicit distractor counterexamples','all printed statement solution choices answer and metadata bound; native fractions','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const r of editions)verifyEdition(r);const out={schemaVersion:1,scope:'All50 saved nonvisual grade5 topic3.3 sources individually rewritten offline. Source variants/model counts are not semantic uniqueness. Awaiting independent content review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-fraction-types.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
