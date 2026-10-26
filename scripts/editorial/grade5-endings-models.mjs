/** Source-complete authored drafts for grade5 topic2.4; no network/publication. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-4').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const show=xs=>xs.join(', ');
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const product=xs=>xs.reduce((a,b)=>a*b,1);
const oddFive=n=>n%5===0&&n%2===1;
function fromDigits(digits,length){
 assert.equal(new Set(digits).size,digits.length);assert.ok(digits.every(d=>Number.isInteger(d)&&d>=0&&d<=9));assert.ok(length>0&&length<=digits.length);
 const out=[];function walk(prefix,used){if(prefix.length===length){out.push(Number(prefix.join('')));return;}for(const d of digits)if(!used.has(d)&&(prefix.length>0||d!==0))walk([...prefix,d],new Set([...used,d]));}
 walk([],new Set());return out.sort((a,b)=>a-b);
}
const one=xs=>{assert.equal(xs.length,1,'Question must have one valid response');return xs[0];};
const expr=([m,b])=>m===1?`x + ${b}`:b===0?`${m} × x`:`${m} × x + ${b}`;
const divList=ds=>ds.length===1?`${ds[0]} санына ғана`:`${ds.join(' және ')} сандарына`;
function render(k,p){let a,s,z,options;switch(k){
 case'odd-choice':case'even-choice':{
  const parity=k==='odd-choice'?1:0;a=one(p.numbers.filter(n=>n%2===parity));options=p.numbers.map(String);
  s=`Математика бұрышындағы карточкалардан ${parity?'тақ':'жұп'} нөмірлі бір карточканы таңдаңдар.`;
  z=`Жұп-тақтықты бірінші цифр емес, соңғы цифр анықтайды. Нұсқалардың соңғы цифрлары ретімен ${show(p.numbers.map(n=>n%10))}. ${a} санының соңғы цифры ${a%10}, сондықтан ол ${parity?'тақ':'жұп'}.`;break;
 }
 case'five-not-two-ending':{
  const ns=range(0,9).map(d=>10*p.prefix+d).filter(oddFive);a=one(ns);
  s=`Қоймадағы бір жәшіктің нөмірі ${p.prefix}□ түрінде жазылған. □ — бір цифр. Нөмір 5 санына бөлінеді, ал 2 санына бөлінбейді. Жәшіктің толық нөмірін табыңдар.`;
  z=`5 санына бөлінетін нөмірдің соңғы цифры 0 не 5. Соңы 0 болса, ол жұп болады, бұл екінші шартқа қайшы. Сондықтан соңғы цифр 5, толық нөмір ${a}.`;break;
 }
 case'all-even-digits':
  a='0, 2, 4, 6, 8';options=['2, 4, 6, 8',a,'1, 3, 5, 7, 9','0, 2, 4, 6, 8, 10'];
  s='Цифрлар жинағынан барлық жұп цифрларды жазу керек. Қай тізім ешбір жұп цифрды қалдырмайды және артық таңба қоспайды?';
  z='Ондық жүйенің цифрлары 0–9 аралығында. 0 : 2 = 0, сондықтан 0 да жұп цифр. Толық тізім: 0, 2, 4, 6, 8. 10 — жеке цифр емес, екі таңбалы сан.';break;
 case'five-choice':case'ten-choice':case'five-not-ten-choice':{
  const predicate=n=>k==='five-choice'?n%5===0:k==='ten-choice'?n%10===0:n%5===0&&n%10!==0;
  a=one(p.numbers.filter(predicate));options=p.numbers.map(String);
  s=k==='five-choice'?'Дәптер нөмірлерінің қайсысын 5 санына қалдықсыз бөлуге болады?':k==='ten-choice'?'Сөре нөмірлерінің арасынан 10 санына қалдықсыз бөлінетін нөмірді таңдаңдар.':'Қай билет нөмірі 5 санына бөлінеді, бірақ 10 санына бөлінбейді?';
  z=`Нұсқалардың соңғы цифрлары ${show(p.numbers.map(n=>n%10))}. ${k==='five-choice'?'5 санына бөліну үшін соңғы цифр 0 не 5 болуы керек.':k==='ten-choice'?'10 санына бөліну үшін тек соңғы цифр 0 болуы керек; санның ортасындағы нөл жеткіліксіз.':'Екі шартты бірге орындау үшін соңғы цифр 5 болуы керек; 0 жарамайды.'} Дұрыс нөмір ${a}.`;break;
 }
 case'classify-divisors':{
  const ds=[2,5,10].filter(d=>p.number%d===0);a=divList(ds);options=p.choices.map(divList);assert.equal(options.filter(o=>o===a).length,1);
  s=`${p.number} нөмірін тексеріңдер. 2, 5, 10 тізімінен оны қалдықсыз бөлетін сандардың барлығын толық көрсеткен нұсқа қайсысы?`;
  z=`Соңғы цифр ${p.number%10}. 2 санына ${p.number%2===0?'бөлінеді':'бөлінбейді'}, 5 санына ${p.number%5===0?'бөлінеді':'бөлінбейді'}, 10 санына ${p.number%10===0?'бөлінеді':'бөлінбейді'}. Сондықтан толық жауап: ${a}.`;break;
 }
 case'inclusive-odd-count':{
  const ns=range(p.lower,p.upper).filter(n=>n%2===1);a=ns.length;
  s=`Тапсырма карталары ${p.lower}–${p.upper} аралығындағы барлық бүтін нөмірлермен белгіленген, екі шеті де кіреді. Тақ нөмірлі карталар нешеу?`;
  z=`Тақ нөмірлер ${show(ns)}. Көршілес тақ нөмірлердің айырмасы 2. Екі шетін де есептегенде (${ns.at(-1)} − ${ns[0]}) : 2 + 1 = ${a} карта.`;break;
 }
 case'largest-even-append':{
  const digits=range(0,9).filter(d=>(10*p.prefix+d)%2===0);a=10*p.prefix+digits.at(-1);
  s=`Сандар ойынында ${p.prefix}□ жазуы берілді. Шыққан сан 2 санына бөлінуі керек. □ орнына мүмкін болатын ең үлкен цифрды қойып, толық санды жазыңдар.`;
  z=`Соңғы орынға ${show(digits)} цифрлары жарайды. Ең үлкені ${digits.at(-1)}; одан үлкен 9 цифры тақ. Демек, толық сан ${a}.`;break;
 }
 case'digit-length-ten-count':{
  assert.equal(p.digits,3);a=9*10**(p.digits-2);
  s=`Көрмедегі шкафтарға ${p.digits} таңбалы натурал нөмірлердің ішінен 10 санына бөлінетіндері ғана беріледі. Осындай неше түрлі нөмір бар?`;
  z=`Соңғы цифр міндетті түрде 0. Жүздіктер орнына 1–9 цифрларының бірі, ондықтар орнына 0–9 цифрларының бірі қойылады. Бірінші орынға 9, екінші орынға 10 таңдау: 9 × 10 = ${a}. Басында 0 тұрған жазу үш таңбалы сан емес.`;break;
 }
 case'largest-digit-length-five':{
  const upper=10**p.digits-1;a=upper-upper%5;
  s=`${p.digits} таңбалы натурал сандардың ішінен 5 санына қалдықсыз бөлінетін ең үлкен санды табыңдар.`;
  z=`Ең үлкен ${p.digits} таңбалы сан ${upper}. Одан төмен қарай қарағанда, 0 не 5 цифрымен аяқталатын алғашқы сан ${a}. Сондықтан бұл — ізделген ең үлкен сан.`;break;
 }
 case'last-digit-ten':{
  const ds=range(0,9).filter(d=>(p.prefix*10+d)%10===0);a=one(ds);options=p.choices.map(String);
  s=`${p.prefix}□ нөмірі 10 санына бөлінуі керек. □ орнына қай цифрды жазу қажет?`;
  z=`10 санына бөлінгіштік соңғы орынға тәуелді: ол жерде тек 0 тұрады. Толық нөмір ${p.prefix*10}; оны 10 санына бөлсек, ${p.prefix} шығады.`;break;
 }
 case'universal-ten-parity':
  a='10 санына бөлінетін кез келген натурал сан жұп';
  options=['5 санына бөлінетін әр натурал сан тақ','2 санына бөлінетін әр натурал сан 10 санына бөлінеді',`Соңғы цифры ${p.falseEnding} болатын әр сан 5 санына бөлінеді`,a];
  s='Төрт ереже ұсынылды. Қай ереже барлық натурал сандар үшін дұрыс?';
  assert.ok(p.evenFive%5===0&&p.evenFive%2===0&&p.evenNotTen%2===0&&p.evenNotTen%10!==0&&p.falseEnding%5!==0);
  z=`10 еселігінің соңғы цифры 0, ол жұп цифр. Қалған тұжырымдарға қарсы мысалдар: ${p.evenFive} саны 5 санына бөлінеді, бірақ жұп; ${p.evenNotTen} жұп, бірақ 10 санына бөлінбейді; ${10+p.falseEnding} саны 5 санына бөлінбейді.`;break;
 case'smallest-odd-digit-length-five':{
  const start=10**(p.digits-1);a=one(range(start,start+9).filter(oddFive));
  s=`Ретімен жазылған ${p.digits} таңбалы сандардан тақ әрі 5 санына бөлінетін ең бірінші санды табыңдар.`;
  z=`Мұндай санның соңғы цифры 5 болуы керек. ${p.digits} таңбалы сандар ${start} санынан басталады, бірақ ол жұп. Одан кейінгі 5 цифрымен аяқталатын алғашқы сан ${a}.`;break;
 }
 case'digit-set-five-count':{
  const ns=fromDigits(p.digits,p.length).filter(n=>n%5===0);a=ns.length;
  s=`${show(p.digits)} цифрларымен ${p.length} таңбалы нөмірлер құрылады. Әр нөмірде бір цифр екі рет қолданылмайды, бірінші цифр 0 бола алмайды. 5 санына бөлінетін нөмірлер нешеу?`;
  const zero=ns.filter(n=>n%10===0),five=ns.filter(n=>n%10===5);
  z=`Соңғы цифр тек 0 не 5. Соңы 0 болатын нөмірлер: ${show(zero)} (${zero.length} нөмір). Соңы 5 болатындары: ${show(five)} (${five.length} нөмір). Басында 0 тұрған жазулар мен қайталанған цифрлар есептелмейді. Барлығы ${zero.length} + ${five.length} = ${a}.`;break;
 }
 case'remainder-five':
  a=p.number%5;options=p.choices.map(String);assert.ok(a>0&&a!==p.number%10);
  s=`${p.number} жапсырманы 5 данадан толық жинақтарға бөледі. Соңғы толық жинақтан кейін неше жапсырма артық қалады?`;
  z=`${p.number} = ${p.number-a} + ${a} = 5 × ${Math.floor(p.number/5)} + ${a}. Қалдық ${a}; ол 5 санынан кіші. Соңғы цифр ${p.number%10} — 10 санына бөлгендегі қалдық, оны 5 санының қалдығымен шатастырмаңдар.`;break;
 case'even-input-odd-expression':case'odd-input-even-expression':{
  const input=k==='even-input-odd-expression'?0:1,target=1-input;
  const valid=p.expressions.filter(([m,b])=>(m*input+b)%2===target);a=expr(one(valid));options=p.expressions.map(expr);
  s=`x — ${input?'тақ':'жұп'} натурал сан. Қай өрнектің мәні барлық осындай x үшін ${target?'тақ':'жұп'} болады?`;
  z=`x санын 2 санына бөлгендегі қалдық ${input}. Нұсқалардың жұп-тақтық қалдықтары ретімен ${show(p.expressions.map(([m,b])=>(m*input+b)%2))}. ${a} өрнегі ғана ${target?'тақ':'жұп'} мән береді. Көбейткенде коэффициенттің, қосқанда қосылатын санның жұп-тақтығы ескеріледі.`;break;
 }
 case'odd-summand-count-parity':
  assert.ok(p.count%2===1&&p.count>=3);assert.equal(p.counterexample.length,p.count);assert.ok(p.counterexample.every(n=>n%2===1)&&sum(p.counterexample)%5!==0);
  a='әрқашан тақ';options=['әрқашан жұп',a,'әрқашан 5 санына бөлінеді','бірде жұп, бірде тақ'];
  s=`${p.count} топтың әрқайсысының жинаған ұпай саны тақ. Барлық топтың ұпайларын қосқанда нәтиженің жұп-тақтығы қандай болады?`;
  z=`Алғашқы ${p.count-1} тақ қосылғышты екі-екіден жұптасақ, әр жұптың қосындысы жұп. Соңғы бір тақ санды қосқанда нәтиже тақ болады. 5 санына міндетті бөлінбейді: ${p.counterexample.join(' + ')} = ${sum(p.counterexample)}.`;break;
 case'largest-even-permutation':{
  assert.equal(Number(p.digits.slice().sort((a,b)=>b-a).join(''))%2,1,'Naive descending order must fail the saved evenness constraint');
  const ns=fromDigits(p.digits,p.digits.length).filter(n=>n%2===0);a=ns.at(-1);
  const endings=p.digits.filter(d=>d%2===0).map(d=>Number(p.digits.filter(x=>x!==d).sort((a,b)=>b-a).join('')+d));
  s=`${show(p.digits)} цифрларының әрқайсысын дәл бір рет қолданып, ең үлкен ${p.digits.length} таңбалы жұп нөмірді құрыңдар.`;
  z=`Соңғы орынға тек жұп цифр тұрады. Әр мүмкін соңғы цифр үшін қалғандарын кему ретімен орналастырсақ, ${show(endings)} сандары шығады. Олардың ең үлкені ${a}. Барлық цифрды бірден кему ретімен жазу жұп сан береді деп ойлауға болмайды.`;break;
 }
 case'last-digit-two-and-five':
  a='0';options=['5','0 немесе 5',a,'кез келген жұп цифр'];
  s='Бір натурал нөмірді 2 санына да, 5 санына да қалдықсыз бөлуге болады. Оның соңғы орнына қандай цифр ғана келе алады?';
  z='2 белгісі бойынша соңғы цифр 0, 2, 4, 6, 8 тізімінде болуы керек. 5 белгісі бойынша ол 0 не 5 болуы керек. Екі тізімнің ортақ жалғыз цифры 0.';break;
 case'neither-two-nor-five-count':{
  const ns=range(1,p.last).filter(n=>n%2!==0&&n%5!==0);a=ns.length;
  s=`Жарыста нөмірлер 1–${p.last} аралығынан берілді, екі шеті де кіреді. 2 санына бөлінбейтін әрі 5 санына да бөлінбейтін нөмірлерге ерекше белгі қойылады. Неше нөмірге белгі қойылады?`;
  const odds=Math.ceil(p.last/2),oddFiveCount=range(1,p.last).filter(oddFive).length;
  z=`Алдымен ${odds} тақ нөмірді аламыз. Олардың ${oddFiveCount} данасы 5 цифрымен аяқталады, сондықтан оларды шығарамыз. Белгі қойылатын нөмірлер саны ${odds} − ${oddFiveCount} = ${a}.`;break;
 }
 case'internal-placeholder-impossible':{
  const ns=range(0,9).map(d=>100*p.firstDigit+10*d+p.lastDigit);assert.ok(ns.every(n=>n%2===1));
  a='мұндай цифр жоқ';options=['0','5','кез келген жұп цифр',a];
  s=`Бұйым коды ${p.firstDigit}□${p.lastDigit} түрінде. □ орнына бір цифр қойып, 2 санына бөлінетін код алуға бола ма? Дұрыс жауапты таңдаңдар.`;
  z=`□ ондықтар орнында тұр, ал соңғы цифр барлық жағдайда ${p.lastDigit}. Бұл цифр тақ болғандықтан, ортаға қандай цифр қойылса да сан жұп болмайды.`;break;
 }
 case'bounded-groups-and-pairs':{
  const ns=range(p.lower+1,p.upper-1).filter(n=>n%5===0&&n%2===1);a=one(ns);
  s=`Үйірмедегі оқушы саны ${p.lower} санынан көп, ${p.upper} санынан аз. Оларды 5 адамнан толық топтарға бөлуге болады. Жұпқа тұрғызса, бір оқушы жұпсыз қалады. Үйірмеде неше оқушы бар?`;
  z=`Оқушы саны 5 санына бөлінетін әрі тақ болуы керек. Шектегі жалғыз жарамды сан ${a}. ${a} : 5 = ${a/5} топ; ${a} = 2 × ${Math.floor(a/2)} + 1. Аралықтың екі шеті кірмейді.`;break;
 }
 case'product-ten-choice':{
  a=one(p.factors.filter(xs=>product(xs)%10===0)).join(' × ');options=p.factors.map(xs=>xs.join(' × '));
  s='Толық көбейтіндіні есептемей, 10 санына бөлінетін өрнекті таңдаңдар.';
  z=`10 = 2 × 5. ${a} көбейтіндісінде жұп көбейткіш те, 5 санына бөлінетін көбейткіш те бар. Қалған үш нұсқаның барлық көбейткіштері тақ, сондықтан олардың көбейтінділері жұп болмайды.`;break;
 }
 case'next-odd-five-multiple':{
  a=range(p.after+1,p.after+10).find(oddFive);assert.ok(a);
  s=`Кітапхана жаңа билеттерді ${p.after} нөмірінен кейін береді. 5 санына бөлінетін, бірақ 10 санына бөлінбейтін ең кіші келесі нөмірді табыңдар.`;
  z=`Нөмір 5 цифрымен аяқталуы керек: 0 цифрымен аяқталса, 10 санына да бөлінеді. ${p.after} санынан үлкен осындай алғашқы нөмір ${a}.`;break;
 }
 case'open-range-odd-five-count':{
  const ns=range(p.lower+1,p.upper-1).filter(n=>n%5===0&&n%10!==0);a=ns.length;
  s=`${p.lower} < n < ${p.upper}. Осы шарттағы 5 санына бөлінетін, 10 санына бөлінбейтін бүтін n мәндері нешеу?`;
  z=`Жарамды мәндер тек 5 цифрымен аяқталады: ${show(ns)}. Екі шет те кірмейді. Барлығы ${a} сан.`;break;
 }
 case'corrected-price':{
  assert.equal(p.count,5);assert.notEqual(p.reported%5,0);const correct=Math.floor((p.reported-1)/5)*5;a=correct/p.count;
  s=`Шеберхана бағасы бірдей 5 қағаз жинағын алды, бір жинақтың бағасы бүтін теңге. Түбіртекте қате ${p.reported} теңге көрсетілді. Дұрыс сома — көрсетілген сомадан кіші, 5 санына бөлінетін ең жақын сан екені белгілі. Бір жинақ неше теңге тұрады?`;
  z=`Бес бірдей жинақтың толық құны 5 санына бөлінеді. ${p.reported} санынан кіші ең жақын еселік ${correct}. Қате артық сома ${p.reported-correct} теңге. Бір жинақтың бағасы ${correct} : 5 = ${a} теңге.`;break;
 }
 case'sum-five-choice':{
  const pair=one(p.pairs.filter(xs=>sum(xs)%5===0));a=pair.join(' + ');options=p.pairs.map(xs=>xs.join(' + '));
  s='Қай қосынды 5 санына бөлінеді? Соңғы цифрларды және қосындының бөлінгіштік қасиетін пайдаланыңдар.';
  z=`Соңғы цифрларды қосқанда нұсқалардың соңғы цифрлары ${show(p.pairs.map(xs=>sum(xs.map(n=>n%10))%10))} болады. ${a} қосындысының екі қосылғышы да 5 санына бөлінеді, сондықтан қосынды да бөлінеді.`;break;
 }
 case'distinct-prefix-ten-count':{
  assert.equal(new Set(p.prefix).size,2);assert.ok(p.prefix.every(d=>d>0&&d<10));
  const ns=range(0,99).map(n=>100*Number(p.prefix.join(''))+n).filter(n=>n%2===0&&n%5===0&&new Set(String(n)).size===4);a=ns.length;
  s=`${p.prefix.join('')}□□ түріндегі төрт таңбалы нөмір 2 санына да, 5 санына да бөлінуі керек. Нөмірдің барлық цифрлары әртүрлі. Осындай неше нөмір бар? □ орындарына цифрлар жазылады.`;
  const tens=range(0,9).filter(d=>d!==0&&!p.prefix.includes(d));
  z=`Соңғы цифр міндетті түрде 0. Ондықтар орнына 0 және берілген ${show(p.prefix)} цифрлары қайталанбайды. Қалған цифрлар ${show(tens)}. Олар ${a} нөмір береді: ${show(ns)}.`;break;
 }
 case'either-two-or-five-count':{
  a=range(1,p.last).filter(n=>n%2===0||n%5===0).length;
  s=`1–${p.last} аралығындағы барлық натурал нөмірлерді тексерді, екі шеті де кіреді. 2 санына немесе 5 санына, ең болмағанда біреуіне бөлінетін нөмірлер нешеу?`;
  const twos=Math.floor(p.last/2),fives=Math.floor(p.last/5),tens=Math.floor(p.last/10);
  z=`2 санына бөлінетін ${twos} нөмір, 5 санына бөлінетін ${fives} нөмір бар. 10 еселіктері екі тізімде де тұр: олардың саны ${tens}. Сондықтан ${twos} + ${fives} − ${tens} = ${a}. Бір нөмір екі рет саналмайды.`;break;
 }
 case'minimum-two-bottle-sizes':{
  assert.ok(p.large%2===1&&p.small===2&&p.total%2===1);
  const choices=[];for(let large=1;large*p.large<p.total;large++){const left=p.total-large*p.large;if(left>0&&left%p.small===0)choices.push({large,small:left/p.small,count:large+left/p.small});}
  assert.ok(choices.length>=2);a=Math.min(...choices.map(c=>c.count));
  s=`Тәжірибе үшін дәл ${p.total} л су керек. Су ${p.large} литрлік және ${p.small} литрлік бөтелкелермен әкелінеді, екі көлемнен де кемінде бір бөтелке алу қажет. Ең аз неше бөтелке керек?`;
  const nextOdd=choices.at(-1).large+2;
  z=`${p.small} литрлік бөтелкелер беретін көлем жұп. Жалпы ${p.total} л тақ болғандықтан, ${p.large} литрлік бөтелке саны тақ болуы керек. ${nextOdd} үлкен бөтелкенің өзі ${nextOdd*p.large} л береді, бұл қажетті көлемнен артық. Барлық мүмкін жинақтар: ${choices.map(c=>`${c.large} үлкен + ${c.small} кіші = ${c.count} бөтелке`).join('; ')}. Ең аз саны ${a}.`;break;
 }
 case'combined-remainder-digit':{
  const ds=range(0,9).filter(d=>d%2===p.remainderTwo&&d%5===p.remainderFive);a=one(ds);options=p.choices.map(String);
  s=`Бір натурал нөмірді 2 санына бөлгенде ${p.remainderTwo}, 5 санына бөлгенде ${p.remainderFive} қалдық қалады. Нөмірдің соңғы цифры қандай?`;
  z=`5 санына бөлгендегі қалдық бойынша соңғы цифр ${p.remainderFive} не ${p.remainderFive+5}. 2 санына бөлгендегі қалдық ${p.remainderTwo} болғандықтан, осы екеуінен тек ${a} жарайды.`;break;
 }
 case'largest-distinct-odd-five':{
  assert.ok(p.digits>=3&&p.digits<=7);const prefix=range(0,9).filter(d=>d!==5).sort((a,b)=>b-a).slice(0,p.digits-1);a=Number(prefix.join('')+'5');
  s=`0–9 цифрларымен ${p.digits} таңбалы нөмір құрылады. Цифрлар қайталанбайды. Нөмір 5 санына бөлінеді, бірақ 2 санына бөлінбейді. Осындай ең үлкен нөмір қандай?`;
  z=`Соңғы цифр міндетті түрде 5, оны басқа орынға қайталамаймыз. Алдыңғы орындарға қалған ең үлкен цифрларды кему ретімен қоямыз: ${show(prefix)}. Шыққан нөмір ${a}. Ертерек тұрған цифрды кішірейту кейінгі орындармен өтелмейді.`;break;
 }
 case'equal-partition-impossible':{
  const total=p.last*(p.last+1)/2;assert.ok(p.last%2===0&&total%2===1&&total%5===0);
  a=`бөлуге болмайды, себебі жалпы қосынды ${total} — тақ`;
  options=[`бөлуге болады, әр топқа ${p.last/2} карточка түседі`,a,`бөлуге болады, өйткені ${total} саны 5 санына бөлінеді`,`бөлуге болмайды, себебі ${p.last} — жұп сан`];
  s=`1–${p.last} нөмірлі карточкалар бір реттен берілген. Оларды екі топтағы нөмірлердің қосындылары бірдей болатындай бөлуге бола ма? Дұрыс қорытынды мен оның себебін таңдаңдар.`;
  z=`Барлық нөмірдің қосындысы ${p.last} × ${p.last+1} : 2 = ${total}. Егер екі топтың қосындысы бірдей бүтін сан болса, толық қосынды жұп болар еді. ${total} тақ, сондықтан мұндай бөлу мүмкін емес. Карточка санының жұп болуы не қосындының 5 санына бөлінуі жеткіліксіз.`;break;
 }
 case'consecutive-sum-classification':{
  const total=p.last*(p.last+1)/2;assert.ok(total%2===1&&total%5===0);
  a='тақ және 5 санына бөлінеді';options=[a,'жұп және 5 санына бөлінеді','тақ және 5 санына бөлінбейді','10 санына бөлінеді'];
  s=`1 + 2 + 3 + … + ${p.last} қосындысының екі қасиетін дұрыс сипаттаған нұсқаны таңдаңдар.`;
  z=`Қосынды ${p.last} × ${p.last+1} : 2 = ${total}. Соңғы цифр 5 болғандықтан, ол тақ әрі 5 санына бөлінеді. Соңы 0 емес, сондықтан 10 санына бөлінбейді.`;break;
 }
 case'inclusive-odd-five-sum':{
  const ns=range(p.lower,p.upper).filter(oddFive);a=sum(ns);
  s=`${p.lower}–${p.upper} аралығындағы, екі шетін қоса алғандағы, 5 санына бөлінетін және 2 санына бөлінбейтін барлық нөмірлердің қосындысын табыңдар.`;
  z=`Мұндай нөмірлер ${show(ns)}; тек 5 цифрымен аяқталады. Барлығы ${ns.length} нөмір, орташа мәні (${ns[0]} + ${ns.at(-1)}) : 2 = ${(ns[0]+ns.at(-1))/2}. Қосынды ${ns.length} × ${(ns[0]+ns.at(-1))/2} = ${a}.`;break;
 }
 case'impossible-ten-remainder':{
  a=one(p.choices.filter(d=>d%2!==p.remainderTwo));options=p.choices.map(String);assert.ok(p.choices.every(d=>d>=0&&d<10));
  s=`Натурал санды 2 санына бөлгенде ${p.remainderTwo} қалдық қалады. Оны 10 санына бөлгендегі қалдық ұсынылған қай мәнге тең бола алмайды?`;
  z=`10 санына бөлгендегі қалдық — соңғы цифр. Ол бастапқы санның жұп-тақтығын сақтайды. ${a} цифрының жұп-тақтығы берілген қалдыққа сәйкес келмейді. Қалған ұсынылған цифрлар осы шартқа сай сандардың соңында кездеседі.`;break;
 }
 case'possible-multiple-endings':
  assert.ok(p.packSize%5===0&&p.packSize%2===1);a='0 немесе 5';options=[a,'тек 5','тек 0','кез келген цифр'];
  s=`Әр бумада ${p.packSize} жапсырма бар. Кемінде бір толық бума алынады, бума саны белгісіз. Жапсырмалардың жалпы санының соңында қандай цифрлар болуы мүмкін? Мүмкіндіктерді толық көрсетіңдер.`;
  z=`Жалпы сан ${p.packSize} × n, демек 5 санының еселігі. Оның соңы тек 0 не 5. Екеуі де мүмкін: 1 бумада ${p.packSize}, 2 бумада ${2*p.packSize} жапсырма. Сондықтан тек бір цифрды таңдау толық жауап емес.`;break;
 case'missing-book-leaves':{
  const digits=String(p.firstPage).split('').map(Number);assert.ok(p.firstPage%2===1&&new Set(digits).size===3);
  const last=one(fromDigits(digits,3).filter(n=>n>p.firstPage&&n%2===0));a=last-p.firstPage+1;assert.equal(a%2,0);
  s=`Анықтамалық кітаптың әр парағы тақ нөмірлі беттен басталып, келесі жұп нөмірлі бетпен аяқталады: 1 және 2, 3 және 4, әрі қарай осылай. Қатар тұрған бірнеше толық парақ түсіп қалды. Түскен бөліктің бірінші беті ${p.firstPage}. Соңғы беті де сол үш цифрдан басқа ретпен құралады. Неше бет түсіп қалған?`;
  z=`Соңғы бет алғашқы беттен үлкен және жұп болуы керек. Осы цифрлардан жасалған жұп нөмірлер: ${show(fromDigits(digits,3).filter(n=>n%2===0))}. ${p.firstPage} санынан үлкен жалғыз нөмір ${last}. Екі шетін қоса есептегенде ${last} − ${p.firstPage} + 1 = ${a} бет. Бұл ${a/2} толық парақ.`;break;
 }
 case'needed-even-factor':{
  assert.ok(p.fixed.every(n=>n%2===1)&&product(p.fixed)%5===0);a=one(p.choices.filter(n=>(product(p.fixed)*n)%10===0));options=p.choices.map(String);
  s=`${p.fixed.join(' × ')} × x көбейтіндісі 10 санына бөлінсін. x орнына ұсынылған қай санды қоюға болады?`;
  z=`${p.fixed.join(' × ')} көбейтіндісі 5 санына бөлінеді, бірақ барлық берілген көбейткіштер тақ. Сондықтан 10 санына бөліну үшін x жұп болуы керек. Нұсқалардың ішінде жұп сан тек ${a}. Бөлінгіштікке 2 және 5 көбейткіштері бірге қажет.`;break;
 }
 case'smallest-odd-shifted-five':{
  const start=10**(p.digits-1),ns=range(start,start+9).filter(n=>n%2===1&&(n+p.added)%5===0);assert.equal(ns.length,1);a=ns[0];
  s=`${p.digits} таңбалы архив коды тақ сан. Оған ${p.added} қосқанда шыққан сан 5 санына бөлінеді. Осындай ең кіші код қандай?`;
  const endingCandidates=range(0,9).filter(d=>(d+p.added)%5===0);
  z=`Қосқаннан кейінгі соңғы цифр 0 не 5 болуы керек. Сондықтан кодтың соңғы цифры ${endingCandidates.join(' не ')} болуы мүмкін. Бірақ код тақ: жұп цифр жарамайды, тек ${a%10} қалады. ${p.digits} таңбалы сандар ішіндегі ең кішісі ${a}. Тексеру: ${a} + ${p.added} = ${a+p.added}, бұл 5 санына бөлінеді.`;break;
 }
 case'any-prefix-ending-five':
  a='тақ және 5 санына бөлінеді';options=['10 санына бөлінеді',a,'2 санына бөлінеді','тақ, бірақ 5 санына бөлінбеуі мүмкін'];
  s=`${'□'.repeat(p.digits-1)}5 жазуы ${p.digits} таңбалы санды білдіреді. □ орындарына кез келген цифрлар қойылады, тек бірінші цифр 0 емес. Қай қасиет барлық осындай сандарға ортақ?`;
  z='Алдыңғы орындар соңғы цифрды өзгертпейді: ол 5. Сондықтан сан әрқашан тақ әрі 5 санына бөлінеді; 2 және 10 сандарына бөлінбейді.';break;
 case'erased-zero-inverse':{
  assert.ok(p.decrease>0&&p.decrease%9===0);const after=p.decrease/9;a=after*10;
  s=`Таблодағы натурал сан 10 санына бөлінеді. Оның соңғы бір 0 цифрын өшіргенде, мәні ${p.decrease} бірлікке кеміді. Бастапқы санды табыңдар.`;
  z=`Нөлді өшіргеннен кейінгі сан m болса, бастапқысы 10 × m. Айырма 10 × m − m = 9 × m = ${p.decrease}. Сондықтан m = ${p.decrease} : 9 = ${after}, бастапқы сан ${a}. Тексеру: ${a} − ${after} = ${p.decrease}.`;break;
 }
 case'infer-odd-addend':
  assert.ok(p.firstExample%2===1&&p.secondExample%2===1&&p.secondExample%5!==0);
  a=`${p.secondName} жинаған ұпай саны тақ`;options=[`${p.secondName} жинаған ұпай саны жұп`,a,`${p.secondName} жинаған ұпай саны міндетті түрде 5 санына бөлінеді`,'жұп-тақтығын анықтау мүмкін емес'];
  s=`${p.firstName} мен ${p.secondName} жинаған ұпай сандары — натурал сандар. ${p.firstName} жинаған ұпай саны тақ, ал екеуінің ұпайларының қосындысы жұп. ${p.secondName} жинаған ұпай туралы қай қорытынды міндетті?`;
  z=`Тақ санға жұп санды қоссақ, тақ сан шығар еді, бұл берілген шартқа қайшы. Сондықтан екінші қосылғыш та тақ: тақ + тақ = жұп. 5 санына бөліну міндетті емес: ${p.firstExample} + ${p.secondExample} = ${p.firstExample+p.secondExample}, ал ${p.secondExample} саны 5 санына бөлінбейді.`;break;
 case'odd-product-last-digit':
  assert.ok(p.factors.every(n=>n%2===1)&&p.factors.some(n=>n%5===0));a=5;
  s=`${p.factors.join(' × ')} көбейтіндісін толық есептемей, оның соңғы цифрын табыңдар.`;
  z=`${p.factors.find(n=>n%5===0)} көбейткіші 5 санына бөлінеді, сондықтан бүкіл көбейтінді де бөлінеді. Барлық көбейткіштер тақ, демек көбейтінді тақ. Соңғы цифр 0 не 5 ішінен 0 жұп болғандықтан жарамайды. Соңғы цифр 5.`;break;
 default:throw Error('Unsupported source-specific ending skill '+k);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}
 if(!options&&/^\d+$/.test(String(a)))s+=' Жауапқа тек санды жазыңыз.';
 return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const spec=(id,kind,params)=>({id,kind,params});
const SPECS=[
 spec('6654e2f014614d6a','odd-choice',{numbers:[5730,4028,9002,4867]}),
 spec('ba90dbd9e65714b4','five-not-two-ending',{prefix:81}),
 spec('c1b7a756b502786c','all-even-digits',{}),
 spec('5599353dc27bfcf2','five-choice',{numbers:[2512,7405,5553,9154]}),
 spec('92b69f3541afd060','classify-divisors',{number:8245,choices:[[2],[5],[5,10],[2,5]]}),
 spec('339ee1e8dbaff04f','inclusive-odd-count',{lower:31,upper:57}),
 spec('bbef9ae3847b27ec','largest-even-append',{prefix:36}),
 spec('dabef047e0bce0b1','digit-length-ten-count',{digits:3}),
 spec('1db4d0c35e864c93','largest-digit-length-five',{digits:3}),
 spec('118093ad261ff840','last-digit-ten',{prefix:64,choices:[2,5,0,8]}),
 spec('2f9d774e423f6cff','universal-ten-parity',{evenFive:30,evenNotTen:26,falseEnding:8}),
 spec('0c9287fda56d8fdf','ten-choice',{numbers:[4005,3003,6270,7105]}),
 spec('1751aea16961b70a','smallest-odd-digit-length-five',{digits:5}),
 spec('afbb85e45b5acc3d','even-choice',{numbers:[425,2319,7428,853]}),
 spec('db539585baa4a512','digit-set-five-count',{digits:[0,3,5,8],length:2}),
 spec('f24d1ebb424f1d35','remainder-five',{number:5868,choices:[3,8,2,0]}),
 spec('ae5cc1b5384674fd','even-input-odd-expression',{expressions:[[1,6],[5,0],[1,9],[8,0]]}),
 spec('958f182adf0e7916','odd-summand-count-parity',{count:5,counterexample:[1,1,1,1,3]}),
 spec('9780faf1136bee58','largest-even-permutation',{digits:[1,3,6,8]}),
 spec('4bc47f40b738719f','last-digit-two-and-five',{}),
 spec('f49eea17aa69e522','neither-two-nor-five-count',{last:90}),
 spec('fdce316f17943604','internal-placeholder-impossible',{firstDigit:7,lastDigit:5}),
 spec('dd73408613da4aa8','bounded-groups-and-pairs',{lower:20,upper:30}),
 spec('bfd4a13b5400f952','product-ten-choice',{factors:[[25,9,7],[35,11],[13,17,15],[6,45]]}),
 spec('91095c7c5344d5c3','next-odd-five-multiple',{after:4868}),
 spec('04a9c5d46d4f3d1c','open-range-odd-five-count',{lower:320,upper:470}),
 spec('7ee406d0bf348449','corrected-price',{count:5,reported:2468}),
 spec('8ea3f60374145181','sum-five-choice',{pairs:[[485,216],[632,401],[340,725],[815,304]]}),
 spec('173970e30ab98fca','distinct-prefix-ten-count',{prefix:[6,3]}),
 spec('14fdaeac9d29e879','digit-set-five-count',{digits:[0,2,5,9],length:3}),
 spec('e6344ee2b8e6f37e','either-two-or-five-count',{last:350}),
 spec('248445f35302f8bf','minimum-two-bottle-sizes',{large:5,small:2,total:31}),
 spec('99394294b357800d','combined-remainder-digit',{remainderTwo:1,remainderFive:2,choices:[2,7,3,5]}),
 spec('26a5a76ffab3821e','odd-input-even-expression',{expressions:[[7,4],[9,8],[4,5],[5,9]]}),
 spec('ce537416318840a8','largest-distinct-odd-five',{digits:5}),
 spec('6d32297dd515ba65','equal-partition-impossible',{last:14}),
 spec('cda6e190c1d141aa','consecutive-sum-classification',{last:29}),
 spec('19c2c73b9b1a1c87','inclusive-odd-five-sum',{lower:45,upper:125}),
 spec('32d49d49a6b80131','impossible-ten-remainder',{remainderTwo:1,choices:[1,5,8,7]}),
 spec('251bcaa625267e73','five-not-ten-choice',{numbers:[6380,2602,9100,4755]}),
 spec('e9a8eeef0d461770','possible-multiple-endings',{packSize:25}),
 spec('43cec582c9bb58a6','missing-book-leaves',{firstPage:725}),
 spec('bd922efb0b249c26','needed-even-factor',{fixed:[29,35],choices:[25,55,18,65]}),
 spec('7532c2662793d99b','smallest-odd-shifted-five',{digits:3,added:3}),
 spec('07caae5b4809e1ad','any-prefix-ending-five',{digits:4}),
 spec('e6e8536cacb97ba3','erased-zero-inverse',{decrease:2376}),
 spec('8ffe43938842de47','infer-odd-addend',{firstName:'Аян',secondName:'Іңкәр',firstExample:7,secondExample:11}),
 spec('65934d86e898aa07','odd-product-last-digit',{factors:[15,17,19,21,23]})
];
const byId=new Map(SPECS.map(s=>['grade5-endings-'+s.id,s]));
export function renderEdition(row){const s=byId.get(row.editionId);assert.ok(s);assert.equal(row.modelId,'grade5-endings-'+s.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(s.params));return render(s.kind,row.params);}
export function buildEditions(){return SPECS.map(s=>{const src=sources.get(s.id);assert.ok(src,'Missing captured nonvisual ending source '+s.id);return{editionId:'grade5-endings-'+s.id,modelId:'grade5-endings-'+s.kind,grade:5,topic:'num',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(s.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Бастапқы шарт пен толық шешім оқылып, соңғы цифр, қатар қолданылатын белгілер, шекара, цифрды қайталамау не ең аз жинақ іздеу дағдысы жеке сақталды.',
 'Қазақша мәтін мен сандық деректер қайта жазылды; 0 цифрының жұптығы, 2/5/10 белгілері және жалпы жұп-тақтық ережелері математикалық инварианттар ретінде сақталды.',
 'Жаңа сандық нұсқа жаңа математикалық мағына деп саналмайды. Әр sourceId жеке редакциямен, параметрге байланған шешіммен және тексерілетін жауаппен белгіленді.'
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(s.kind,s.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const k of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[k]),canonicalEdition(e[k]));const result=renderEdition(row);for(const k of['statement','solution','options'])assert.equal(canonicalEdition(row[k]),canonicalEdition(result[k]),'Unbound ending text '+k);assert.equal(row.answer,result.answer);return{answer:result.answer,checks:['individual captured ending/parity skill preserved','integer arithmetic, zero/leading-zero and strict/inclusive bounds checked','small complete digit sets or resource choices exhaustively checked','condition/solution/MCQ bound to fixed per-source parameters','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const r of editions)verifyEdition(r);const data={schemaVersion:1,scope:'All 48 captured nonvisual grade5 topic2.4 sources rewritten separately. Mathematical invariants retained; no semantic uniqueness claimed for numerical variants. Drafts await independent review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-endings.json',import.meta.url),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:data.distinctModels}));}
