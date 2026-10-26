/** Individually authored, source-complete grade5 topic2.5 drafts. No publication. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-digit-sums-specs.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-5').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const digits=n=>String(n).split('').map(Number);
const ds=n=>sum(digits(n));
const show=xs=>xs.join(', ');
const one=xs=>{assert.equal(xs.length,1,'Exactly one mathematical response is required');return xs[0];};
const distinct=n=>new Set(String(n)).size===String(n).length;
function permutations(values,length){const out=[];function walk(a,used){if(a.length===length){out.push(Number(a.join('')));return;}for(const d of values)if(!used.has(d)&&(a.length||d!==0))walk([...a,d],new Set([...used,d]));}walk([],new Set());return out.sort((a,b)=>a-b);}
function subsets(values,length){const out=[];function walk(start,a){if(a.length===length){out.push(a);return;}for(let i=start;i<values.length;i++)walk(i+1,[...a,values[i]]);}walk(0,[]);return out;}
const list=xs=>show(xs);
const classText=(total,three,nine)=>`${total}; 3 санына ${three?'бөлінеді':'бөлінбейді'}, 9 санына ${nine?'бөлінеді':'бөлінбейді'}`;
function render(k,p){let a,s,z,options;switch(k){
 case'digit-sum-and-nine':{
  a=classText(ds(p.number),p.number%3===0,p.number%9===0);
  options=[classText(45,true,false),a,classText(36,true,true),classText(36,false,false)];
  s=`Роботтың экранында ${p.number} коды тұр. Оның цифрларының қосындысын және 3 пен 9 сандарына бөлінетін-бөлінбейтінін бірге дұрыс көрсеткен нұсқаны таңдаңдар.`;
  z=`Кодтағы цифрларды қосамыз: ${digits(p.number).join(' + ')} = ${ds(p.number)}. ${ds(p.number)} саны 3 санына да, 9 санына да бөлінеді. Цифрлар қосындысының белгісі бойынша кодтың өзі де екеуіне бөлінеді.`;break;
 }
 case'minimum-length-nine':case'minimum-length-three':{
  const divisor=k==='minimum-length-nine'?9:3,start=10**(p.digits-1);a=Math.ceil(start/divisor)*divisor;
  s=`Жаңа каталогта ${p.digits} таңбалы натурал кодтар қолданылады. ${divisor} санына бөлінетін ең кіші кодты табыңдар.`;
  z=`${p.digits} таңбалы сандар ${start} санынан басталады. Осы шектен бастап алғашқы ${divisor} еселігі ${a}: ${a} = ${divisor} × ${a/divisor}. Оның цифрларының қосындысы ${ds(a)}, бұл ${divisor} санына бөлінеді. Алдыңғы еселік ${a-divisor} берілген разрядтық шектен кіші, сондықтан жауап ең кіші.`;break;
 }
 case'three-choice':case'nine-choice':case'not-three-choice':case'three-not-nine-choice':case'six-choice':case'fortyfive-choice':{
  const predicate=n=>k==='three-choice'?n%3===0:k==='nine-choice'?n%9===0:k==='not-three-choice'?n%3!==0:k==='three-not-nine-choice'?n%3===0&&n%9!==0:k==='six-choice'?n%6===0:n%45===0;
  a=one(p.numbers.filter(predicate));options=p.numbers.map(String);
  const ask=k==='three-choice'?'3 санына бөлінетін':k==='nine-choice'?'9 санына бөлінетін':k==='not-three-choice'?'3 санына бөлінбейтін':k==='three-not-nine-choice'?'3 санына бөлінетін, бірақ 9 санына бөлінбейтін':k==='six-choice'?'6 санына бөлінетін':'45 санына бөлінетін';
  s=`Жапсырмалардағы нөмірлердің ішінен ${ask} жалғыз нөмірді таңдаңдар.`;
  z=`Нұсқалардың цифрлар қосындылары ретімен ${show(p.numbers.map(ds))}. ${k==='six-choice'?'6 санына бөліну үшін сан жұп әрі цифрлар қосындысы 3 санына бөлінуі керек.':k==='fortyfive-choice'?'45 = 5 × 9. Соңғы цифр 0 не 5 болуы және цифрлар қосындысы 9 санына бөлінуі керек.':k==='three-not-nine-choice'?'Қосынды 3 санына бөлініп, 9 санына бөлінбеуі керек.':k==='not-three-choice'?'3 санына бөлінбейтін қосындысы бар нөмірді іздейміз.':`${k==='nine-choice'?9:3} белгісін цифрлар қосындысына қолданамыз.`} ${a} ғана барлық сұралған шартқа сай келеді.`;break;
 }
 case'soil-packets-three':
  assert.equal(p.total%p.size,0);a=p.total/p.size;
  s=`Жылыжайға ${p.total} кг топырақ жеткізілді. Оны әрқайсысына ${p.size} кг салып, бірдей қаптарға толық бөлді. Неше қап толды?`;
  z=`Цифрлар қосындысы ${digits(p.total).join(' + ')} = ${ds(p.total)}, ол 3 санына бөлінеді. Сондықтан ${p.total} кг топырақ 3 килограмнан қалдықсыз бөлінеді. ${p.total} : ${p.size} = ${a} қап. Тексеру: ${a} × ${p.size} = ${p.total} кг.`;break;
 case'total-candidate-three':{
  a=one(p.numbers.filter(n=>n%p.groups===0));options=p.numbers.map(String);
  s=`Көркемөнер құралдарын ${p.groups} үйірмеге теңдей, ештеңе артылмайтындай бөліп берді. Құралдардың жалпы саны ұсынылған қай сан болуы мүмкін?`;
  z=`Жалпы сан ${p.groups} санына бөлінуі тиіс. Нұсқалардың цифрлар қосындылары ${show(p.numbers.map(ds))}; тек ${ds(a)} саны 3 санына бөлінеді. Жалпы саны ${a} болса, әр үйірмеге ${a/p.groups} құралдан тиеді.`;break;
 }
 case'minimum-append-digit-three':{
  const choices=range(0,9).filter(d=>(p.prefix*10+d)%3===0);a=choices[0];
  s=`Билетте ${p.prefix}□ нөмірі жазылған. □ — бір цифр. Нөмір 3 санына бөлінуі үшін □ орнына қоюға болатын ең кіші цифрды табыңдар. Толық нөмірді емес, тек сол цифрды жазыңдар.`;
  z=`Белгілі цифрлардың қосындысы ${ds(p.prefix)}. ${ds(p.prefix)} + □ қосындысы 3 санына бөлінуі керек. Мүмкін цифрлар ${show(choices)}; ең кішісі ${a}. Сонда толық нөмір ${p.prefix*10+a}, оның цифрларының қосындысы ${ds(p.prefix*10+a)}.`;break;
 }
 case'interior-digit-nine':{
  a=one(range(0,9).filter(d=>(100*p.first+10*d+p.last)%9===0));options=p.choices.map(String);
  s=`Зертхана жәшігінің коды ${p.first}□${p.last}. Код 9 санына бөлінеді. □ орнына қай цифр қойылады?`;
  z=`Белгілі цифрлар қосындысы ${p.first+p.last}. Оған ${a} қоссақ, ${p.first+p.last+a} шығады, бұл 9 еселігі. Қалған 0–9 цифрларының ешқайсысы осы қосындыны басқа 9 еселігіне жеткізбейді. Толық код ${100*p.first+10*a+p.last}.`;break;
 }
 case'nine-implies-three':
  assert.ok(p.threeNotNine%3===0&&p.threeNotNine%9!==0&&p.endingThreeNotThree%10===3&&p.endingThreeNotThree%3!==0&&p.endingNineNotNine%10===9&&p.endingNineNotNine%9!==0);
  a='9 санына бөлінетін әр натурал сан 3 санына да бөлінеді';options=['3 санына бөлінетін әр натурал сан 9 санына да бөлінеді','Соңғы цифры 3 болса, сан міндетті түрде 3 санына бөлінеді',a,'Соңғы цифры 9 болса, сан міндетті түрде 9 санына бөлінеді'];
  s='Сандар клубының ережелерін тексеріңдер. Қай тұжырым барлық натурал сандар үшін дұрыс?';
  z=`9 = 3 × 3, сондықтан кез келген 9 еселігі 3 еселігі де болады. Кері бағыт дұрыс емес: ${p.threeNotNine} саны 3 санына бөлінеді, 9 санына бөлінбейді. Соңғы цифрға ғана қарау да жеткіліксіз: ${p.endingThreeNotThree} саны 3 санына, ал ${p.endingNineNotNine} саны 9 санына бөлінбейді.`;break;
 case'possible-digit-sum-nine':
  a=one(p.choices.filter(n=>n%9===0));assert.equal(ds(p.example),a);options=p.choices.map(String);
  s='Құпия натурал нөмірдің 9 санына бөлінетіні белгілі. Оның цифрлар қосындысы берілген мәндердің қайсысына тең болуы мүмкін?';
  z=`Цифрлар қосындысының өзі 9 еселігі болуы керек. Ұсынылған ${show(p.choices)} мәндерінің ішінде тек ${a} жарайды. Мұндай қосынды іске асады: ${p.example} санының цифрлар қосындысы ${a}, әрі сан 9 санына бөлінеді. 3 еселігі болу ғана жеткіліксіз.`;break;
 case'maximum-internal-digit-three':{
  const base=100*p.before+p.last,choices=range(0,9).filter(d=>(base+10*d)%3===0);a=choices.at(-1);
  s=`Құрылғының нөмірі ${p.before}□${p.last} түрінде. □ орнына бір цифр қойылады. 3 санына бөлінетін нөмір шығару үшін қоюға болатын ең үлкен цифрды табыңдар. Толық нөмірді емес, цифрды жазыңдар.`;
  z=`Белгілі цифрлардың қосындысы ${ds(p.before)+p.last}. Мүмкін цифрлар ${show(choices)}, олардың ең үлкені ${a}. ${base+10*a} нөмірінің цифрларының қосындысы ${ds(base+10*a)}, ол 3 санына бөлінеді. 9 цифрын қойсақ, қосынды ${ds(p.before)+p.last+9}, ол 3 санына бөлінбейді.`;break;
 }
 case'all-append-digits-six':{
  const d=range(0,9).filter(d=>(10*p.prefix+d)%6===0);assert.deepEqual(d,[0,6]);a=list(d);options=['0, 3, 6, 9',a,'6','2, 4, 8'];
  s=`${p.prefix}□ кодын 6 санына бөлуге болады. □ орнына жарайтын цифрлардың толық тізімін таңдаңдар.`;
  z=`6 = 2 × 3: соңғы цифр жұп болуы және ${ds(p.prefix)} + □ қосындысы 3 санына бөлінуі керек. Тек 3 белгісін қолдансақ, 0, 3, 6, 9 шығады. Оның жұптары 0 және 6. Екеуі де жарайды: ${10*p.prefix} : 6 = ${10*p.prefix/6}, ${10*p.prefix+6} : 6 = ${(10*p.prefix+6)/6}.`;break;
 }
 case'fifteen-count':{
  const valid=p.numbers.filter(n=>n%15===0);a=valid.length;
  s=`Сақтау ұяшықтарының нөмірлері: ${show(p.numbers)}. Осылардың нешеуі 15 санына қалдықсыз бөлінеді?`;
  z=`15 = 3 × 5. Соңы 0 не 5 болып, цифрлар қосындысы 3 еселігі болатын нөмірлер ғана жарайды: ${show(valid)}. Мысалы, ${p.numbers.find(n=>n%3===0&&n%5!==0)} үшін 3 белгісі орындалғанымен, 5 белгісі орындалмайды. Барлығы ${a} нөмір.`;break;
 }
 case'inclusive-nine-count':{
  const first=Math.ceil(p.lower/9)*9,last=Math.floor(p.upper/9)*9;a=(last-first)/9+1;
  s=`Мұрағат карточкалары ${p.lower}–${p.upper} аралығындағы барлық бүтін нөмірмен белгіленген, екі шеті де кіреді. 9 санына бөлінетін неше карточка бар?`;
  z=`Аралықтағы бірінші 9 еселігі ${first}, соңғысы ${last}. Олар 9 қадаммен орналасқан. Екі шетін де санағандағы саны (${last} − ${first}) : 9 + 1 = ${a}. Соңғы +1 алғашқы карточканы да есепке қосады.`;break;
 }
 case'fortyfive-product-choice':{
  const pair=one(p.factors.filter(([x,y])=>x*y%45===0));a=pair.join(' × ');options=p.factors.map(xs=>xs.join(' × '));
  s='Қай көбейтіндіні 45 санына қалдықсыз бөлуге болады? Екі бөлінгіштік шартын бірге тексеріңдер.';
  z=`45 = 5 × 9. Көбейтінділер ретімен ${show(p.factors.map(([x,y])=>x*y))}. ${a} = ${pair[0]*pair[1]} ғана 5 санына да, 9 санына да бөлінеді. Қалғандары осы екі шарттың кемінде бірін орындамайды.`;break;
 }
 case'shelf-total-candidates-nine':{
  const total=one(p.numbers.filter(n=>n%p.shelves===0));a=total/p.shelves;
  s=`Кітап қоймасындағы кітаптардың жалпы саны ${show(p.numbers)} сандарының біріне тең. Барлық кітап ${p.shelves} сөреге теңдей, қалдықсыз орналастырылды. Әр сөреде неше кітап бар?`;
  z=`Жалпы сан 9 санына бөлінуі керек. Үш мүмкін санның цифрлар қосындылары ${show(p.numbers.map(ds))}; тек ${total} жарайды. Содан кейін сөрелерге бөлеміз: ${total} : ${p.shelves} = ${a} кітап. Жауап жалпы сан емес, бір сөредегі кітап саны.`;break;
 }
 case'six-equal-classes':
  assert.equal(p.total%p.groups,0);a=p.total/p.groups;
  s=`Баспаханада ${p.total} жұмыс дәптері бар. Оларды ${p.groups} сыныпқа теңдей, дәптер артылмайтындай бөлуге бола ма? Егер бөлуге болса, бір сыныпқа тиетін дәптер санын жазыңдар.`;
  z=`${p.total} жұп, ал цифрлар қосындысы ${ds(p.total)} — 3 еселігі. Демек, сан 6 санына бөлінеді. ${p.total} : ${p.groups} = ${a}. Тексеру: ${a} × ${p.groups} = ${p.total}; тең бөлу қалдықсыз орындалады.`;break;
 case'minimum-distinct-nine':{
  const lower=Math.max(10**(p.digits-1),p.lower);a=range(lower,10**p.digits-1).find(n=>distinct(n)&&n%9===0);assert.ok(a);
  s=`Төрт таңбалы қорап кодтары ${p.lower} санынан кем емес. Кодтың цифрлары әртүрлі және ол 9 санына бөлінеді. Осындай ең кіші код қандай?`;
  assert.equal(p.digits,4);assert.equal(Math.floor(a/1000),2);
  z=`Ең кіші кодты алу үшін алдымен 2 цифрын, одан кейін қайталанбайтын ең кіші 0 және 1 цифрларын қоямыз. Олардың қосындысы 3; 9 еселігіне жеткізетін соңғы цифр 6. ${a} барлық шартқа сай. Одан кіші 2000–2015 нөмірлерінде не цифр қайталанады, не цифрлар қосындысы 9 еселігі емес. Сондықтан ${a} — ең кіші код.`;break;
 }
 case'maximum-distinct-nine':{
  a=range(10**(p.digits-1),Math.min(p.upperExclusive-1,10**p.digits-1)).filter(n=>distinct(n)&&n%9===0).at(-1);assert.ok(a);
  const inspected=[];for(let n=Math.floor((p.upperExclusive-1)/9)*9;n>=a;n-=9)inspected.push(n);
  const rejected=inspected.slice(0,-1);assert.ok(rejected.length>0&&rejected.every(n=>!distinct(n)),'Distinctness must reject at least one greater nine-multiple');
  s=`Үш таңбалы билет нөмірі ${p.upperExclusive} санынан кіші. Цифрлары қайталанбайды және нөмір 9 санына бөлінеді. Мүмкін болатын ең үлкен нөмірді табыңдар.`;
  z=`${p.upperExclusive} санынан кіші 9 еселіктерін үлкенінен бастап қараймыз: ${show(inspected)}. ${show(rejected)} нөмірінде цифр қайталанады, сондықтан ол жарамайды. ${a} нөмірінің цифрлары ${show(digits(a))}, бәрі әртүрлі, ал қосындысы ${ds(a)}. Одан үлкен 9 еселіктерін тексеріп болдық; қалғандары кіші. Сондықтан ең үлкен жарамды нөмір ${a}.`;break;
 }
 case'all-internal-digits-fifteen':{
  const valid=range(0,9).filter(d=>(100*p.first+10*d+p.last)%15===0);assert.deepEqual(valid,[0,3,6,9]);a=list(valid);options=['3, 6, 9','0',a,'1, 4, 7'];
  s=`${p.first}□${p.last} нөмірі 15 санына бөлінеді. □ орнына қоюға болатын цифрларды ешқайсысын қалдырмай көрсетіңдер.`;
  z=`Соңғы цифр 5 болғандықтан, 5 санына бөліну шарты дайын. Енді ${p.first+p.last} + □ қосындысы 3 санына бөлінуі керек. Оған ${a} цифрлары жарайды. 0 ортаңғы орынға келе алады: ${100*p.first+p.last} — үш таңбалы жарамды сан. Толық нөмірлер ${show(valid.map(d=>100*p.first+10*d+p.last))}.`;break;
 }
 case'coprime-combination-rule':
  assert.ok(p.threeSixNotEighteen%6===0&&p.threeSixNotEighteen%18!==0&&p.nineNotEighteen%9===0&&p.nineNotEighteen%18!==0&&p.fifteenNotFortyfive%15===0&&p.fifteenNotFortyfive%45!==0);
  a='3 санына да, 5 санына да бөлінсе, 15 санына бөлінеді';options=['3 санына да, 6 санына да бөлінсе, 18 санына бөлінеді','9 санына бөлінсе, 18 санына бөлінеді',a,'15 санына бөлінсе, 45 санына бөлінеді'];
  s='Қойма нөмірлері туралы төрт жалпы ереже айтылды. Барлық натурал нөмір үшін дұрыс болатын ережені таңдаңдар.';
  z=`3 пен 5 өзара жай, сондықтан екеуіне қатар бөлінетін сан 3 × 5 = 15 санына бөлінеді. Ал 3 пен 6 өзара жай емес: ${p.threeSixNotEighteen} екеуіне бөлінеді, 18 санына бөлінбейді. ${p.nineNotEighteen} саны 9 санына бөлінгенімен 18 санына, ${p.fifteenNotFortyfive} саны 15 санына бөлінгенімен 45 санына бөлінбейді.`;break;
 case'bounded-even-nine-share':{
  const total=one(range(p.lower+1,p.upper-1).filter(n=>n%2===0&&n%p.groups===0));a=total/p.groups;
  s=`Жапсырмалар саны ${p.lower} санынан көп, ${p.upper} санынан аз және жұп санға тең. Оларды ${p.groups} топқа теңдей бөлгенде ештеңе артылмады. Әр топқа неше жапсырма тиді?`;
  z=`Қатаң шектер арасындағы 9 еселіктері ${show(range(p.lower+1,p.upper-1).filter(n=>n%9===0))}. Оның жұп болғаны ғана жарайды: ${total}. Әр топқа ${total} : ${p.groups} = ${a} жапсырмадан беріледі. Жауап жалпы сан емес, бір топтың үлесі.`;break;
 }
 case'remainder-nine':{
  a=p.number%9;options=p.choices.map(String);assert.ok(ds(p.number)>9&&a>0&&p.number%10!==a);
  const d=digits(p.number);assert.equal(d.length,4);
  s=`${p.number} бөлшекті 9 данадан толық жинақтарға бөлді. Соңында неше бөлшек артық қалады?`;
  z=`${p.number} = ${d[0]} × 999 + ${d[1]} × 99 + ${d[2]} × 9 + (${d.join(' + ')}). Алғашқы үш қосылғыш 9 санына бөлінеді. Цифрлар қосындысы ${ds(p.number)}, бірақ ол дайын қалдық емес: ${ds(p.number)} = 9 × ${Math.floor(ds(p.number)/9)} + ${a}. Сондықтан қалдық ${a}, ол 0–8 аралығында. Тексеру: ${p.number} = 9 × ${Math.floor(p.number/9)} + ${a}.`;break;
 }
 case'repdigit-five-fortyfive':{
  assert.equal(p.digit,5);assert.ok(p.minimumLength>9&&p.minimumLength<18);a=Math.ceil(p.minimumLength/9)*9;
  s=`Таблода тек ${p.digit} цифры қайталанып жазылады. Жазу кемінде ${p.minimumLength} таңбалы болуы және 45 санына бөлінуі керек. Осындай ең кіші сан неше таңбадан тұрады?`;
  z=`Соңғы цифр 5 болғандықтан, сан 5 санына бөлінеді. 45 = 5 × 9, сондықтан цифрлар қосындысы да 9 еселігі болуы керек. n таңбада қосынды 5 × n; 5 пен 9 өзара жай болғандықтан, n өзі 9 еселігі. Ұзындықтар 9, 18, 27, …, бірақ 9 таңба ${p.minimumLength} таңбалық төменгі шекке жетпейді. Ең кіші жарамды ұзындық ${a}; цифрлар қосындысы 5 × ${a} = ${5*a}.`;break;
 }
 case'long-repdigit-remainder-nine':
  a=p.digit*p.count%9;options=p.choices.map(String);assert.equal(p.count%9,0);
  s=`Электрондық жазуда ${p.digit} цифры ${p.count} рет қатар қайталанған. Осы өте ұзын санды 9 санына бөлгендегі қалдықты табыңдар.`;
  z=`Санды түгел жазудың қажеті жоқ. Цифрлар қосындысы ${p.digit} × ${p.count} = ${p.digit*p.count}. ${p.count} = 9 × ${p.count/9}, сондықтан бұл қосынды да 9 еселігі. Санның өзі 9 санына бөлінеді, қалдық ${a}. Соңғы цифрға ғана қарап қалдықты анықтауға болмайды.`;break;
 case'possible-sums-length-nine':{
  const valid=range(1,p.digits*9).filter(n=>n%9===0);assert.equal(p.examples.length,valid.length);p.examples.forEach((n,i)=>{assert.equal(String(n).length,p.digits);assert.equal(ds(n),valid[i]);});a=list(valid);options=[list(valid.slice(0,-1)),a,list([0,...valid]),list([...valid,p.digits*9+9])];
  s=`${p.digits} таңбалы натурал код 9 санына бөлінеді. Оның цифрларының қосындысы қабылдай алатын барлық мәнді толық көрсетіңдер.`;
  z=`Бірінші цифр 0 емес, сондықтан қосынды кемінде 1. Ең үлкен қосынды ${p.digits} × 9 = ${9*p.digits}. Осы шектегі 9 еселіктері ${a}. Барлығы іске асады: ${p.examples.map((n,i)=>`${n} → ${valid[i]}`).join('; ')}. Қосынды 0 бола алмайды және ${p.digits*9+9} берілген шектен асады.`;break;
 }
 case'maximum-two-blanks-fortyfive':{
  const valid=[];for(const x of range(1,9))for(const y of [0,5]){const n=1000*x+100*p.middle[0]+10*p.middle[1]+y;if(n%45===0)valid.push(n);}assert.ok(valid.length>=2);a=Math.max(...valid);
  s=`□${p.middle.join('')}□ түріндегі төрт таңбалы код 45 санына бөлінеді. Бірінші □ орнына 0 қойылмайды, екі □ әртүрлі цифр болуы да мүмкін. Осындай ең үлкен толық кодты табыңдар.`;
  z=`Соңғы цифр 0 не 5. Белгілі цифрлар қосындысы ${sum(p.middle)}. Соңы 0 болса, алғашқы цифр ${Math.floor(valid.find(n=>n%10===0)/1000)}; соңы 5 болса, алғашқы цифр ${Math.floor(valid.find(n=>n%10===5)/1000)} болуы керек: цифрлар қосындысы 9 еселігіне тең болады. Жарамды кодтар ${show(valid)}. Ең үлкені ${a}. Екі бос орынды бірдей цифр деп қабылдамаймыз.`;break;
 }
 case'neither-three-nor-five-count':{
  const threes=Math.floor(p.last/3),fives=Math.floor(p.last/5),both=Math.floor(p.last/15);a=p.last-threes-fives+both;
  options=[String(threes+fives-both),String(a),String(p.last-threes),String(p.last-fives)];
  s=`Шкафтар 1–${p.last} аралығындағы барлық натурал нөмірмен белгіленген, екі шеті де кіреді. 3 санына бөлінбейтін әрі 5 санына да бөлінбейтін шкафтар нешеу?`;
  z=`3 еселіктері ${threes}, 5 еселіктері ${fives}. Екеуіне де бөлінетін 15 еселіктері ${both} рет екі тізімге кіріп кеткен. Ең болмағанда біреуіне бөлінетіндері ${threes} + ${fives} − ${both} = ${threes+fives-both}. Қалғандары ${p.last} − ${threes+fives-both} = ${a}.`;break;
 }
 case'descending-fortyfive-nonzero':{
  assert.equal(p.digits,4);const possible=permutations([5,6,7,8,9],4).filter(n=>n%10===5&&digits(n).every((d,i,arr)=>i===0||arr[i-1]>d));a=one(possible.filter(n=>n%45===0));
  s=`Құлыптың ${p.digits} таңбалы кодының цифрлары солдан оңға қарай қатаң кемиді: әр келесі цифр алдыңғысынан кіші. Код 45 санына бөлінеді және соңғы цифры 0 емес. Толық кодты табыңдар.`;
  z=`45 белгісі бойынша соңғы цифр 0 не 5; нөлге тыйым салынғандықтан, ол 5. Алдыңғы үш цифр 5 цифрынан үлкен және кему ретімен тұрады. Барлық мүмкін кодтар ${show(possible)}; цифрлар қосындылары ${show(possible.map(ds))}. Тек ${a} үшін қосынды ${ds(a)}, ол 9 санына бөлінеді. Соңы 5 болғандықтан, бұл код 45 санына да бөлінеді.`;break;
 }
 case'number-minus-digit-sum':
  assert.ok(p.difference%9===0&&p.difference/9>=1&&p.difference/9<=9);a=p.difference/9;assert.equal(p.example-ds(p.example),p.difference);
  s=`Екі таңбалы құпия нөмірден оның екі цифрының қосындысын азайтқанда ${p.difference} шықты. Нөмірдің ондықтар цифры қандай? Бірліктер цифрын табу қажет емес.`;
  z=`Ондықтар цифры a, бірліктер цифры b болса, нөмір 10 × a + b. Айырма (10 × a + b) − (a + b) = 9 × a = ${p.difference}. Сондықтан a = ${p.difference} : 9 = ${a}. Бірліктер цифры қысқарып кетеді; толық нөмір жалғыз емес. Мысалы, ${p.example} − ${ds(p.example)} = ${p.difference}.`;break;
 case'repeated-digit-universal':{
  const values=range(1,9).map(d=>Number(String(d).repeat(p.length)));a=one(p.choices.filter(divisor=>values.every(n=>n%divisor===0)));options=p.choices.map(String);assert.equal(p.length,3);
  const ex=Number(String(p.exampleDigit).repeat(3));
  s='Нөлден басқа бір цифрды үш рет қатар жазып, үш таңбалы нөмір құрады. Цифрдың орнына 1–9 аралығындағы кез келген мән алынады. Осындай нөмірлердің барлығын қалдықсыз бөлетін санды таңдаңдар.';
  z=`Қайталанатын цифр a болса, цифрлар қосындысы a + a + a = 3 × a. Ол әрдайым 3 санына бөлінеді, сондықтан нөмірдің өзі де бөлінеді. Басқа нұсқалар міндетті емес: ${ex} санының цифрлар қосындысы ${ds(ex)}, бұл 9 еселігі емес; сан тақ әрі соңы 0 не 5 емес, сондықтан 6 және 15 сандарына да бөлінбейді. Үш бірдей цифрды жазу a × a × a көбейтіндісі дегенді білдірмейді.`;break;
 }
 case'concatenated-digit-sum-classify':{
  assert.equal(p.first,1);const text=range(p.first,p.last).join(''),total=sum([...text].map(Number));a=classText(total,total%3===0,total%9===0);
  options=[classText(total,true,true),classText(total,false,false),a,classText(total-2,false,false)];assert.ok(total%3===0&&total%9!==0);
  s=`1 санынан ${p.last} санына дейінгі барлық натурал сандарды ретімен, арасына бос орын қоймай тіркеп жазды: 123456789101112…${p.last}. Шыққан ұзын санның цифрлар қосындысын және 3 пен 9 сандарына бөлінетін-бөлінбейтінін бірге көрсетіңдер.`;
  const twenties=range(20,p.last).reduce((acc,n)=>acc+ds(n),0);
  z=`1–9 цифрларының қосындысы 45. 10–19 сандарында ондықтар он рет 1 береді, ал бірліктер 0 + 1 + … + 9 = 45, барлығы 55. 20–${p.last} үшін ондықтар ${p.last-19} × 2, бірліктер 0 + 1 + … + ${p.last-20}; бұл бөліктің қосындысы ${twenties}. Толық қосынды 45 + 55 + ${twenties} = ${total}. Ол 3 санына бөлінеді, 9 санына бөлінбейді. Ұзын сан да дәл осы қасиеттерге ие.`;break;
 }
 case'minimum-digit-sum-six':{
  assert.ok(p.digitSum>27&&p.digitSum<=35&&p.digitSum%3===0);a=range(1,9999).find(n=>ds(n)===p.digitSum&&n%6===0);assert.ok(a);
  s=`Кодтың цифрлар қосындысы ${p.digitSum}, ал код 6 санына бөлінеді. Осындай ең кіші натурал кодты табыңдар. Таңбалар саны алдын ала берілмеген.`;
  z=`Үш таңбаның ең үлкен қосындысы 27, сондықтан кемінде төрт таңба керек. ${p.digitSum} саны 3 еселігі болғандықтан, 6 белгісін аяқтау үшін соңғы цифр жұп болуы тиіс. Соңғы цифр ең көбі 8, ортадағы екеуі ең көбі 9 және 9: олар барлығы 26 береді. Демек, бірінші цифр кемінде ${p.digitSum-26}. Осы шекке жететін код ${a}: цифрлар қосындысы ${p.digitSum}, соңғы цифры 8. Бірінші цифрды кішірейту мүмкін емес, ал одан арғы цифрлар осы қосынды үшін 9, 9, 8 болуға тиіс. Сондықтан барлық натурал кодтар арасында ең кішісі — ${a}.`;break;
 }
 case'two-blanks-six-nine-count':{
  const pairs=[];for(const x of range(0,9))for(const y of range(0,9)){const n=1000*p.first+100*x+10*p.third+y;if(n%6===0&&n%9===0)pairs.push([x,y]);}a=pairs.length;options=p.choices.map(String);
  const known=p.first+p.third,targets=range(0,18).filter(t=>(known+t)%9===0);assert.equal(targets.length,2);
  s=`overline(${p.first}a${p.third}b) жазуы төрт таңбалы нөмірді білдіреді: a мен b — 0–9 аралығындағы цифрлар. Олар бір-біріне немесе белгілі цифрларға тең болуы мүмкін. Нөмір 6 санына да, 9 санына да бөлінеді. (a; b) жұбы неше түрлі болады?`;
  z=`9 белгісі бойынша ${known} + a + b қосындысы 9 еселігі, сондықтан a + b = ${targets.join(' немесе ')}. 6 белгісінің 3 шарты бұдан орындалады, қосымша b жұп болуы керек. ${targets.map(t=>`a + b = ${t} үшін жұптар ${pairs.filter(([x,y])=>x+y===t).map(([x,y])=>`(${x}; ${y})`).join(', ')} (${pairs.filter(([x,y])=>x+y===t).length} жұп)`).join('; ')}. Екі жағдайды да есептегенде барлығы ${a} жұп.`;break;
 }
 case'digitwise-nine-misconception':
  assert.ok(digits(p.number).every(d=>d%3===0)&&p.number%3===0&&p.number%9!==0&&p.number%2===1&&p.counterexampleOddNine%2===1&&p.counterexampleOddNine%9===0);
  a=`Тұжырым қате: цифрлар қосындысы ${ds(p.number)}, ол 9 санына бөлінбейді`;
  options=['Тұжырым дұрыс: әр цифрдың 3 санына бөлінуі жеткілікті',a,`${p.number} тақ болғандықтан, ол 9 санына бөлінбейді`,`${p.number} саны 3 санына да бөлінбейді`];
  s=`Данияр «${p.number} санының әр цифры 3 санына бөлінеді, демек санның өзі 9 санына бөлінеді» деді. Қай талдау дұрыс?`;
  z=`Цифрларды жеке тексеру 9 белгісін алмастырмайды. ${digits(p.number).join(' + ')} = ${ds(p.number)}, бұл 3 еселігі, бірақ 9 еселігі емес. Сондықтан ${p.number} саны 3 санына бөлінеді, 9 санына бөлінбейді. Себеп оның тақ болуы емес: ${p.counterexampleOddNine} — тақ сан әрі 9 санына бөлінеді.`;break;
 case'grandmother-age-nine':{
  const ages=range(10,99).filter(n=>n%9===0&&Math.floor(n/10)-n%10===p.difference);a=one(ages);
  s=`Әжемнің жасы екі таңбалы санмен жазылады және 9 санына бөлінеді. Ондықтар цифры бірліктер цифрынан ${p.difference} артық. Әжем неше жаста?`;
  z=`Екі цифрдың қосындысы 9 не 18 болуы мүмкін. Қосынды 18 болса, екеуі де 9 болар еді, ал айырмасы 0; бұл шартқа сай емес. Сондықтан қосынды 9. Бірліктерді b десек, ондықтар b + ${p.difference}; 2 × b + ${p.difference} = 9. Бірліктер ${(9-p.difference)/2}, ондықтар ${(9+p.difference)/2}, жас ${a}.`;break;
 }
 case'bounded-six-nine-remainder':{
  const sixes=range(p.lower+1,p.upper-1).filter(n=>n%6===0);a=one(sixes.filter(n=>n%9===p.remainderNine));
  s=`Мектеп шеберханасында ${p.lower} санынан көп, ${p.upper} санынан аз бөлшек бар. Оларды 6 данадан толық қораптарға салса, ештеңе артылмайды. 9 данадан салғанда ${p.remainderNine} бөлшек артық қалады. Барлығы неше бөлшек?`;
  z=`Қатаң аралықтағы 6 еселіктері ${show(sixes)}. Оларды 9 санына бөлгендегі қалдықтар ретімен ${show(sixes.map(n=>n%9))}. Берілген ${p.remainderNine} қалдыққа тек ${a} сәйкес. Тексеру: ${a} = 6 × ${a/6} = 9 × ${Math.floor(a/9)} + ${p.remainderNine}.`;break;
 }
 case'one-digit-replacement-nine':{
  const original=digits(p.number);assert.equal(new Set(original).size,original.length);
  const changed=p.replacements.map(({index,to})=>{assert.ok(index>=0&&index<original.length&&to>=0&&to<=9&&to!==original[index]&&(index||to!==0));const d=[...original];d[index]=to;return Number(d.join(''));});
  const good=one(range(0,changed.length-1).filter(i=>changed[i]%9===0));options=p.replacements.map(({index,to})=>`${original[index]} цифрын ${to} цифрына ауыстыру`);a=options[good];
  s=`${p.number} кодындағы дәл бір цифрды өзгертуге болады. Қалған орындар сол күйінде қалады. Қай өзгерістен кейін нөмір 9 санына бөлінеді?`;
  z=`Бастапқы цифрлар қосындысы ${ds(p.number)}. Ұсынылған өзгерістерден кейін нөмірлер ${show(changed)}, цифрлар қосындылары ${show(changed.map(ds))} болады. Тек ${changed[good]} үшін қосынды ${ds(changed[good])} — 9 еселігі. Сондықтан дұрыс өзгеріс: ${a}.`;break;
 }
 case'minimum-positive-add-six':
  a=range(1,6).find(x=>(p.number+x)%6===0);
  s=`Қойма есебінде ${p.number} зат көрсетілген. Осы санға ең аз қандай оң натурал сан қоссақ, нәтиже 6 санына бөлінеді?`;
  z=`${p.number} = 6 × ${Math.floor(p.number/6)} + ${p.number%6}. Келесі 6 еселігі ${p.number+a}, айырмасы ${a}. Аз оң қосындыларды тексерсек: ${range(1,a-1).map(x=>`${p.number+x} ${((p.number+x)%2===1)?'тақ':'жұп, бірақ цифрлар қосындысы 3 еселігі емес'}`).join('; ')}. ${p.number+a} жұп әрі цифрлар қосындысы ${ds(p.number+a)}; ең аз қосылатын сан ${a}.`;break;
 case'fortyfive-not-guaranteed':
  a=one(p.choices.filter(d=>45%d!==0));options=p.choices.map(String);assert.equal(p.sometimes%45,0);assert.equal(p.sometimes%a,0);
  s='Натурал нөмір 45 санына бөлінеді. Осы деректен оның берілген қай санға бөлінетіні міндетті түрде шықпайды?';
  z=`45 саны 9, 5 және 15 сандарына бөлінеді, сондықтан кез келген 45 еселігі де оларға бөлінеді. Ал 45 санының өзі ${a} санына бөлінбейді; сондықтан бұл қасиет міндетті емес. Бұл «ешқашан бөлінбейді» деген сөз емес: ${p.sometimes} саны 45 санына да, ${a} санына да бөлінеді.`;break;
 case'distinct-odd-nine-count':{
  const groups=subsets([1,3,5,7,9],p.digits),valid=groups.filter(xs=>sum(xs)%9===0);assert.equal(p.digits,4);assert.equal(valid.length,1);a=permutations(valid[0],p.digits).length;
  s=`Төрт таңбалы көрме кодында тек тақ цифрлар қолданылады, бір цифр қайталанбайды. Код 9 санына бөлінуі керек. Осындай неше түрлі код бар?`;
  z=`Төрт түрлі тақ цифрдан құралған жиындардың қосындылары ${show(groups.map(sum))}. 9 еселігі тек ${sum(valid[0])}, оған ${show(valid[0])} цифрлары сәйкес. Бұл цифрлардың бәрі нөлден өзгеше, сондықтан кез келген реті төрт таңбалы код береді. Орындарға ретімен 4, 3, 2, 1 таңдау бар: 4 × 3 × 2 × 1 = ${a}.`;break;
 }
 case'digit-set-three-count':{
  const groups=subsets(p.digits,p.length).filter(xs=>sum(xs)%3===0);assert.equal(groups.length,2);assert.equal(groups.filter(xs=>xs.includes(0)).length,1);const ns=permutations(p.digits,p.length).filter(n=>n%3===0);a=ns.length;
  s=`${show(p.digits)} цифрлары жазылған төрт карточканың дәл үшеуін алып, үш таңбалы нөмір жасайды. Бір карточка екі рет қолданылмайды, алғашқы орынға 0 қойылмайды. 3 санына бөлінетін неше түрлі нөмір құралады?`;
  z=`Үш цифрды алдымен қосындысы бойынша таңдаймыз. 3 еселігін беретін жиындар: ${groups.map(xs=>`{${show(xs)}} (қосынды ${sum(xs)})`).join('; ')}. ${groups.map(xs=>`{${show(xs)}} үшін жарамды нөмірлер ${show(permutations(xs,p.length))}: ${permutations(xs,p.length).length} нөмір`).join('; ')}. Нөлден басталатын жазу есептелмейді. Барлығы ${groups.map(xs=>permutations(xs,p.length).length).join(' + ')} = ${a}.`;break;
 }
 case'reverse-six-rule':{
  const rev=n=>Number(String(n).split('').reverse().join(''));assert.ok(p.counterexample%6===0&&p.counterexample%10!==0&&rev(p.counterexample)%6!==0&&rev(p.counterexample)%9!==0&&p.positiveExample%6===0&&rev(p.positiveExample)%6===0);
  a='Жаңа нөмір міндетті түрде 3 санына бөлінеді, ал 6 санына бөлінуі міндетті емес';options=['Жаңа нөмір міндетті түрде 6 санына бөлінеді','Жаңа нөмір міндетті түрде 9 санына бөлінеді',a,'Жаңа нөмірдің 3 санына бөлінетіні де міндетті емес'];
  s='Натурал нөмір 6 санына бөлінеді және соңғы цифры 0 емес. Оның цифрларын кері ретпен жазып, жаңа нөмір алды. Қай қорытынды әрқашан дұрыс?';
  z=`Бастапқы нөмір 3 санына бөлінеді. Кері жазғанда цифрлар қосындысы өзгермейді, демек жаңа нөмір де 3 санына бөлінеді. Бірақ жұптық сақталмауы мүмкін: ${p.counterexample} → ${rev(p.counterexample)}, соңғысы тақ, сондықтан 6 санына бөлінбейді; цифрлар қосындысы ${ds(p.counterexample)} болғандықтан, 9 санына да бөлінбейді. Ал ${p.positiveExample} → ${rev(p.positiveExample)} мысалында 6 санына бөліну сақталады. Сондықтан ол кейде бар, кейде жоқ; 3 белгісі әрдайым сақталады.`;break;
 }
 default:throw Error('Unsupported digit-sum skill '+k);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{s+=' Жауапқа тек санды жазыңыз.';assert.match(String(a),/^\d+$/);}
 return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const byId=new Map(SPECS.map(s=>['grade5-digit-sums-'+s.id,s]));
export function renderEdition(row){const spec=byId.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,'grade5-digit-sums-'+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src,'Missing canonical grade5 topic2.5 source '+spec.id);return{editionId:'grade5-digit-sums-'+spec.id,modelId:'grade5-digit-sums-'+spec.kind,grade:5,topic:'num',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Бастапқы шарт, толық шешім және жауап нұсқалары оқылды. Цифрлар қосындысы, бір мезетте орындалатын белгілер, нөлдің орны, шекара мен кері жазудың сақтайтын қасиеті әр дереккөзге жеке байланыстырылды.',
 'Мәтін, қолдану жағдайы мен берілген сандар авторлық түрде қайта жазылды; кей іздеулерде таңбалар саны немесе нақты рұқсат етілген аралық өзгертілді. 3/9, 6/15/45 белгілері мен жалпы логикалық заңдар математикалық инвариант ретінде сақталды.',
 'Ұқсас сандық редакция жаңа математикалық мағына деп саналмайды. Көп бөлімді жауаптар толық тұжырымды MCQ арқылы бағаланады; ашық жауап тек бүтін саннан тұрады.'
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const k of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[k]),canonicalEdition(e[k]));const result=renderEdition(row);for(const k of['statement','solution','options'])assert.equal(canonicalEdition(row[k]),canonicalEdition(result[k]),'Unbound digit-sum text '+k);assert.equal(row.answer,result.answer);return{answer:result.answer,checks:['individual canonical digit-sum/divisibility source and skill bound','integer arithmetic, all digit candidates, leading zero and simultaneous conditions checked','long-number remainder and finite combinatorial constraints checked','full condition/solution/options bound to fixed per-source parameters','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All 48 captured nonvisual grade5 topic2.5 sources separately rewritten. Structural invariants retained; numerical variants do not claim semantic uniqueness. Independent review pending.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-digit-sums.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
