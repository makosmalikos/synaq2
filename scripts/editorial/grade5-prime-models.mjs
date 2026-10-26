/** Source-complete, independently reviewable drafts for captured grade5 topic2.2. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-2').map(q=>[q.sourceId,q]));
const range=(lo,hi)=>Array.from({length:Math.max(0,hi-lo+1)},(_,i)=>lo+i);
const isPrime=n=>{if(n<2)return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;};
const ds=n=>range(1,n).filter(d=>n%d===0);
const primes=(lo,hi)=>range(lo,hi).filter(isPrime);
const show=xs=>xs.join(', ');
const pair=xs=>xs.join(' және ');
const digitSum=n=>[...String(n)].reduce((s,d)=>s+Number(d),0);
function factorisation(n){const result=[];for(let d=2;d*d<=n;d++)while(n%d===0){result.push(d);n/=d;}if(n>1)result.push(n);return result;}
function sums(n){return primes(2,n).filter(a=>a<=n-a&&isPrime(n-a)).map(a=>[a,n-a]);}
function listOptions(xs){const extra=range(1,100).find(n=>!xs.includes(n));return[show(xs),show(xs.slice(0,-1)),show([...xs,extra]),show([extra,...xs.slice(1)])];}
function render(k,p){let a,s,z,options;switch(k){
 case'twin-choice':{
  const valid=p.pairs.filter(([a,b])=>isPrime(a)&&isPrime(b)&&Math.abs(a-b)===2);assert.equal(valid.length,1);a=pair(valid[0]);options=p.pairs.map(pair);
  s='Клубтың сан карталарындағы қай жұп егіз жай сандардан тұрады? Егіз жұпта екі сан да жай, айырмасы 2 болуы керек.';
  const composites=[...new Set(p.pairs.flat())].filter(n=>!isPrime(n));const nonTwin=p.pairs.filter(([x,y])=>isPrime(x)&&isPrime(y)&&Math.abs(x-y)!==2);z=`${a} — жай сандар; айырмасы ${valid[0][1]} − ${valid[0][0]} = 2. ${composites.map(n=>`${n} = ${ds(n)[1]} × ${n/ds(n)[1]}`).join('; ')} — құрама мүшелер, сондықтан олар бар жұптар жарамайды. ${nonTwin.map(([x,y])=>`${x} және ${y} жұбының айырмасы ${Math.abs(x-y)}`).join('; ')}, яғни 2 емес.`;break;
 }
 case'unique-prime-between':{
  const xs=primes(p.lower+1,p.upper-1);assert.equal(xs.length,1);a=xs[0];
  s=`Құлып коды ${p.lower} санынан үлкен, ${p.upper} санынан кіші жай сан. Осы аралықта бір ғана жай сан бар. Кодты табыңдар.`;
  const composites=range(p.lower+1,p.upper-1).filter(n=>!isPrime(n));
  z=`Аралықтағы ${show(composites)} сандары құрама. ${a} санының оң бөлгіштері тек 1 мен ${a}; сондықтан жалғыз жарамды код — ${a}.`;break;
 }
 case'one-classification':
  a='жай сан да, құрама сан да емес';options=['жай сан','құрама сан',a,'жұп жай сан'];
  s=`Сан карталарын «жай», «құрама» және «екеуіне де жатпайды» деп сұрыптайды. ${p.number} жазылған картаға қай сипаттама сәйкес келеді?`;
  z=`${p.number} санының жалғыз оң бөлгіші — 1. Жай санға дәл екі, құрама санға екіден көп оң бөлгіш қажет. Бір бөлгіші бар сан екі топқа да жатпайды.`;break;
 case'composite-count':{
  const xs=range(p.lower,p.upper).filter(n=>n>1&&!isPrime(n));a=xs.length;
  s=`Сөре ұяшықтары ${p.lower}–${p.upper} аралығындағы сандармен нөмірленген, екі шеті де кіреді. Құрама нөмірлі ұяшықтар нешеу?`;
  z=`Құрама нөмірлер: ${show(xs)}. Әрқайсысының 1 мен өзінен өзге бөлгіші бар. 1 құрамаға жатпайды; жай нөмірлер де саналмайды. Барлығы ${a} ұяшық.`;break;
 }
 case'choose-prime':{
  const xs=p.candidates.filter(isPrime);assert.equal(xs.length,1);a=xs[0];options=p.candidates.map(String);
  s='Қай билет нөмірі дәл екі оң бөлгіші бар сан?';
  z=`${a} санының бөлгіштері тек 1 және ${a}. Басқа нөмірлер құрама: ${p.candidates.filter(n=>n!==a).map(n=>{const d=ds(n)[1];return`${n} = ${d} × ${n/d}`;}).join('; ')}. Сондықтан ${a} — жалғыз жай нөмір.`;break;
 }
 case'largest-prime-bounded':{
  const xs=primes(10,p.upper);a=xs.at(-1);
  s=`Екі таңбалы жай нөмір ${p.upper} санынан аспайды. Осы шарттағы ең үлкен нөмірді табыңдар.`;
  z=`${a+1}–${p.upper} аралығындағы әр сан құрама. ${a} санының 1 мен өзінен басқа бөлгіші жоқ. Демек, жоғарғы шектен аспайтын ең үлкен жай нөмір ${a}.`;break;
 }
 case'prime-count-list':{
  const xs=p.candidates.filter(isPrime);a=xs.length;
  s=`Үйірме тізіміндегі нөмірлер: ${show(p.candidates)}. Осылардың нешеуі жай сан? Әр нөмір бір рет саналады.`;
  z=`Жай нөмірлер ${show(xs)}. 1 жай сан емес; қалған нөмірлердің қосымша бөлгіштері бар. Жай сандар саны ${a}.`;break;
 }
 case'composite-reason':{
  const div=ds(p.number);a=`оң бөлгіштері ${show(div)} — екіден көп`;
  options=[a,'тақ болғандықтан','екі таңбалы болғандықтан',`оң бөлгіштері тек 1 мен ${p.number} болғандықтан`];
  s=`${p.number} нөмірлі карта «құрама» тобына қойылды. Қай түсіндіру осы шешімді дәлелдейді?`;
  z=`${p.number} = ${p.factors[0]} × ${p.factors[1]}. Барлық оң бөлгіштері: ${show(div)}. Олардың саны ${div.length}, яғни екіден көп. Тақтық пен таңба саны өздігінен құрамалықты дәлелдемейді.`;break;
 }
 case'smallest-prime-after':{
  a=primes(p.lower+1,99)[0];
  s=`Екі таңбалы жай нөмір ${p.lower} санынан үлкен болуы керек. Ең кіші жарамды нөмір қандай?`;
  z=`${p.lower+1} санынан бастап тексереміз. Алғашқы жай сан ${a}; оған дейінгі осы аралықтағы сандар құрама. ${a} санының оң бөлгіштері тек 1 және ${a}.`;break;
 }
 case'prime-count-interval':{
  const xs=primes(p.lower,p.upper);a=xs.length;
  s=`${p.lower}–${p.upper} аралығындағы, екі шетін қоса алғандағы, жай сандардың санын табыңдар.`;
  z=`Тек 1 мен өзіне ғана бөлінетін сандар: ${show(xs)}. Тізімдегі ${a} санның әрқайсысы бір рет саналды; 1 жай санға жатпайды.`;break;
 }
 case'only-even-prime':
  a='жұп жай сан тек 2 болады';options=[a,'кез келген жұп сан жай болады','кез келген тақ сан жай болады','1 саны жай сан болады'];
  s=`Сан карталарының нөмірлері 1–${p.upper} аралығында. Жай сандарды жұп және тақ топтарға бөлгенде қай ереже әрқашан дұрыс?`;
  z='2 санының дәл екі оң бөлгіші бар. 2 санынан үлкен кез келген жұп сан 1, 2 және өзіне бөлінеді, сондықтан құрама. Тақ сандар арасында да құрама сандар бар: мысалы, 9 = 3 × 3. Демек, жалғыз жұп жай сан — 2.';break;
 case'minimum-composite':
  assert.ok(p.upper>=4);a=4;s=`${p.upper} ұяшыққа 1-ден бастап ретімен нөмір берілді. Құрама нөмір кездескен алғашқы ұяшықтың нөмірін табыңдар.`;
  z='1 саны құрама емес. 2 мен 3 сандарының дәл екі оң бөлгіші бар, екеуі де жай. 4 саны 1, 2, 4 сандарына бөлінеді, демек бірінші құрама нөмір — 4.';break;
 case'select-primes':{
  const xs=p.candidates.filter(isPrime);a=show(xs);options=listOptions(xs);
  s=`${show(p.candidates)} карталарының ішінен жай нөмірлерді ғана қалдырды. Толық әрі артық саны жоқ тізімді таңдаңдар.`;
  z=`Бөлгіштерді тексергенде жай нөмірлер ${a} болады. 1 санының бөлгіші біреу; өзге алынып тасталған нөмірлер құрама. Тізімнен тыс жаңа нөмір қосылмайды.`;break;
 }
 case'choose-composite':{
  const xs=p.candidates.filter(n=>n>1&&!isPrime(n));assert.equal(xs.length,1);a=xs[0];options=p.candidates.map(String);
  s='Төрт нөмірдің үшеуі жай сан. Құрама нөмірді таңдаңдар.';
  const d=ds(a)[1];z=`${a} = ${d} × ${a/d}; екі көбейткіш те 1 санынан үлкен. Сондықтан ${a} құрама, ал қалған үш нөмірде 1 мен өзінен басқа оң бөлгіш жоқ.`;break;
 }
 case'minimum-prime':
  a=2;options=p.candidates.map(String);s='Нөмірлеу 1-ден басталады. Жай нөмірлі ең алғашқы орынды нұсқалардан таңдаңдар.';
  z='1 санының оң бөлгіші біреу, сондықтан жай емес. 2 саны 1 мен 2 сандарына ғана бөлінеді. Одан кіші натурал жай сан жоқ, сондықтан бірінші жай нөмір — 2.';break;
 case'hidden-composite':
  assert.equal(p.factors[0]*p.factors[1],p.number);a=`құрама, себебі ${p.number} = ${p.factors[0]} × ${p.factors[1]}`;
  options=['жай, себебі тақ сан','жай, себебі 2, 3, 5 сандарына бөлінбейді',`құрама, себебі ${p.falseDivisor} санына бөлінеді`,a];
  s=`Робот ${p.number} нөмірін тек 2, 3, 5 сандарына бөліп тексерді. Нөмірдің жай не құрама екені туралы дұрыс қорытындыны таңдаңдар.`;
  z=`${p.number} саны 2, 3, 5 сандарына бөлінбегенімен, ${p.factors[0]} санына бөлінеді: ${p.number} : ${p.factors[0]} = ${p.factors[1]}. Сондықтан ол құрама. Ал ${p.falseDivisor} санына бөлгенде қалдық ${p.number%p.falseDivisor} қалады; тек үш кіші жай санды тексеру жеткіліксіз.`;break;
 case'prime-product-below':{
  const xs=primes(2,p.limit-1);a=xs.reduce((a,b)=>a*b,1);
  s=`Құпия кілт ${p.limit} санынан кіші барлық жай сандардың көбейтіндісіне тең. Кілттің мәнін есептеңдер.`;
  z=`Жай көбейткіштер ${show(xs)}. Оларды бір реттен көбейтеміз: ${xs.join(' × ')} = ${a}. 1 жай сан емес, шекке тең сан да тізімге кірмейді.`;break;
 }
 case'prime-sum-choice':{
  const valid=p.pairs.filter(([x,y])=>x+y===p.sum&&isPrime(x)&&isPrime(y));assert.equal(valid.length,1);a=valid[0].join(' + ');options=p.pairs.map(xs=>xs.join(' + '));
  s=`Қай жазуда ${p.sum} саны екі жай санның қосындысы ретінде дұрыс берілген? Тек берілген нұсқаларды салыстырыңдар.`;
  z=`${valid[0][0]} және ${valid[0][1]} — жай сандар, ал ${a} = ${p.sum}. Өзге жазуларда қосынды сәйкес емес немесе қосылғыштардың кемінде біреуі құрама.`;break;
 }
 case'larger-prime-factor':{
  const fs=factorisation(p.number);assert.equal(fs.length,2);a=Math.max(...fs);
  s=`Қораптағы зат саны ${p.number}. Оны екі жай санның көбейтіндісі түрінде жазғанда үлкен көбейткіш қандай болады?`;
  z=`Жай көбейткіштерге жіктесек, ${p.number} = ${fs.join(' × ')}. Екі көбейткіш те жай; олардың үлкені ${a}. Қайта көбейткенде зат саны дәл қалпына келеді.`;break;
 }
 case'exact-four-divisors-choice':{
  const xs=p.candidates.filter(n=>ds(n).length===4);assert.equal(xs.length,1);a=xs[0];options=p.candidates.map(String);
  s='Қай нөмірдің дәл төрт түрлі оң бөлгіші бар?';
  z=`Нұсқалардағы бөлгіш саны ретімен ${show(p.candidates.map(n=>ds(n).length))}. ${a} санының бөлгіштері ${show(ds(a))}; дәл төртеу болғандықтан, осы нөмір таңдалады.`;break;
 }
 case'odd-prime-sum-pair':{
  const valid=sums(p.sum);assert.ok(p.sum%2===1);assert.equal(valid.length,1);a=pair(valid[0]);options=[a,...p.distractors.map(pair)];
  s=`Екі жай нөмірдің қосындысы ${p.sum}. Қосылғыштардың ретін есептемей, осы екі нөмірді көрсетіңдер.`;
  z=`Қосынды тақ болғандықтан, бір жай қосылғыш жұп болуы керек. Жалғыз жұп жай сан — 2. Екіншісі ${p.sum} − 2 = ${p.sum-2}, ол да жай. Сондықтан жұп ${a}.`;break;
 }
 case'sieve-first-new':{
  assert.ok(isPrime(p.next));const newly=range(p.next+1,p.limit).filter(n=>n%p.next===0&&p.previous.every(q=>n%q!==0));assert.ok(newly.length);a=newly[0];
  s=`1–${p.limit} сан кестесінде Эратосфен елегі қолданылды. ${show(p.previous)} жай сандарының өзінен өзге еселіктері сызылды. Енді ${p.next} санының өзінен өзге еселіктерін сызады. Алғаш рет сызылатын ең кіші сан қандай?`;
  z=`${p.next} санының ${p.next*p.next} санынан кіші құрама еселігінде ${p.next} санынан кіші жай көбейткіш бар, сондықтан ол бұрын сызылған. ${p.next*p.next} бұрынғы жай сандарға бөлінбейді және шектен аспайды. Бірінші жаңа сан ${a}; ${p.next} санының өзі сызылмайды.`;break;
 }
 case'noncomposite-remainder':{
  const xs=range(1,p.limit).filter(n=>n===1||isPrime(n));a=xs.length;
  s=`Дәптерде 1–${p.limit} сандары толық жазылды. Оқушы барлық құрама санды өшірді. Еш өшірілмеген сан нешеу? 1 санын жай сан деп есептемеңдер.`;
  z=`Жай сандар ${show(primes(2,p.limit))}; олардың саны ${xs.length-1}. Бұларға 1 саны қосылады, өйткені ол құрама емес. Барлығы ${xs.length-1} + 1 = ${a} сан қалды.`;break;
 }
 case'twin-pair-count':{
  const pairs=range(2,p.limit-3).filter(n=>isPrime(n)&&isPrime(n+2)).map(n=>[n,n+2]);a=pairs.length;
  s=`Екі мүшесі де ${p.limit} санынан кіші болатын егіз жай сандардың неше жұбы бар? Бір сан әртүрлі екі жұпқа кірсе, ол жұптар бөлек саналады.`;
  z=`Айырмасы 2 болатын жай жұптар: ${pairs.map(xs=>`(${xs.join('; ')})`).join(', ')}. Әр жұп кіші мүшесі бойынша бір рет жазылды. Жұп саны ${a}.`;break;
 }
 case'sieve-stop':{
  const xs=primes(2,Math.floor(Math.sqrt(p.limit)));a=xs.at(-1);const next=primes(a+1,p.limit)[0];
  s=`1–${p.limit} сан кестесінде жай сандарды Эратосфен елегімен табады. Жай сандар өсу ретімен алынады. Қай жай санның өзінен өзге еселіктерін сызғаннан кейін барлық құрама сан сызылып бітеді?`;
  z=`${a} × ${a} = ${a*a} шектен аспайды, сондықтан осы жай санға дейін тексеру керек. Келесі жай сан ${next}; оның квадраты ${next*next} > ${p.limit}. Кез келген құрама санның квадрат түбірінен аспайтын жай бөлгіші бар. Соңғы қажет жай сан ${a}.`;break;
 }
 case'prime-expression':{
  const exprValue=([x,y,b,operation='add'])=>operation==='divide'?x/y:operation==='subtract'?x*y-b:x*y+b;const exprText=([x,y,b,operation='add'])=>operation==='divide'?`${x} : ${y}`:`${x} × ${y} ${operation==='subtract'?'−':'+'} ${b}`;const values=p.expressions.map(exprValue);assert.ok(values.every(Number.isInteger));const valid=values.filter(isPrime);assert.equal(valid.length,1);a=exprText(p.expressions[values.indexOf(valid[0])]);options=p.expressions.map(exprText);
  s='Қай өрнектің мәні жай сан болады? Амалдардың орындалу ретін сақтаңдар.';
  z=`Әр өрнекте амалдардың орындалу ретін сақтаймыз. Нұсқалардың мәндері ретімен ${show(values)}. Бұлардың ішінде тек ${valid[0]} саны жай, сондықтан дұрыс өрнек ${a}.`;break;
 }
 case'prime-count-strict':{
  const xs=primes(p.lower+1,p.upper-1);a=xs.length;
  s=`${p.lower} санынан үлкен, ${p.upper} санынан кіші жай сандар нешеу? Екі шеткі сан саналмайды.`;
  z=`Осы ашық аралықтағы жай сандар ${show(xs)}. Әрқайсысының тек екі оң бөлгіші бар. Барлығы ${a} сан.`;break;
 }
 case'prime-sum-interval':{
  const xs=primes(p.lower+1,p.upper-1);a=xs.reduce((a,b)=>a+b,0);
  s=`${p.lower} және ${p.upper} сандарының арасындағы барлық жай сандардың қосындысын табыңдар. Шеткі мәндер қосылмайды.`;
  z=`Аралықтағы жай сандар ${show(xs)}. Қосынды ${xs.join(' + ')} = ${a}. Әр жай сан бір рет қосылды.`;break;
 }
 case'least-prime-above':
  a=p.lower+1;while(!isPrime(a))a++;
  s=`Жеткізу коды жай сан және ${p.lower} санынан үлкен. Осы шартқа сай ең кіші кодты табыңдар.`;
  z=`${p.lower+1} санынан өсу ретімен тексергенде, алғашқы жай сан ${a}. Оған дейінгі ${p.lower+1}–${a-1} сандары құрама; ${a} санының 1 мен өзінен басқа бөлгіші жоқ.`;break;
 case'sieve-new-count':{
  const xs=range(p.next+1,p.limit).filter(n=>n%p.next===0&&p.previous.every(q=>n%q!==0));a=xs.length;
  s=`1–${p.limit} кестесінде 1 саны және ${show(p.previous)} жай сандарының өзінен өзге еселіктері сызылды. Енді ${p.next} санының өзінен өзге еселіктерін сызады. Бұрын сызылмаған неше сан жаңадан сызылады?`;
  z=`${p.next} санына бөлініп, ${show(p.previous)} сандарына бөлінбейтін жаңа құрама мәндер ${show(xs)}. ${p.next} санының өзі сызылмайды. Жаңа сандар саны ${a}.`;break;
 }
 case'digit-sum-primes':{
  const xs=primes(2,10**p.maxDigits-1).filter(n=>digitSum(n)===p.sum);a=show(xs);options=listOptions(xs);
  s=`Цифрларының қосындысы ${p.sum} болатын, ең көбі ${p.maxDigits} таңбалы барлық жай сандарды қамтитын нұсқаны таңдаңдар. Бастапқы нөлдер жазылмайды.`;
  const oddCandidates=range(1,10**p.maxDigits-1).filter(n=>n%2===1&&digitSum(n)===p.sum);const oddComposite=oddCandidates.filter(n=>!isPrime(n));assert.ok(p.sum!==2);z=`Цифрларының қосындысы ${p.sum} болатын, ең көбі ${p.maxDigits} таңбалы тақ кандидаттар ${show(oddCandidates)}. Жұп кандидаттардың бәрі 2 санынан үлкен, сондықтан құрама. Тақтардан ${oddComposite.map(n=>`${n} = ${factorisation(n).join(' × ')}`).join('; ')} мәндері де құрама. Қалған жай сандардың толық тізімі: ${a}.`;break;
 }
 case'odd-prime-sum-product':{
  const valid=sums(p.sum);assert.ok(p.sum%2);assert.equal(valid.length,1);a=valid[0][0]*valid[0][1];
  s=`a және b — жай сандар, a + b = ${p.sum}. a × b көбейтіндісін табыңдар.`;
  z=`Тақ қосындыда жай қосылғыштардың біреуі 2 болуы керек. Екіншісі ${p.sum} − 2 = ${p.sum-2}, ол жай. Көбейтінді 2 × ${p.sum-2} = ${a}; қосылғыштардың орны нәтижеге әсер етпейді.`;break;
 }
 case'prime-times-natural':
  assert.ok(isPrime(p.prime));a=1;
  s=`Сөрелердің әрқайсысында ${p.prime} кітап бар. Сөре саны x — оң бүтін сан. Кітаптардың жалпы саны ${p.prime} × x жай сан болуы үшін x неге тең болуы керек?`;
  z=`x = 1 болса, жалпы сан ${p.prime} — жай. x > 1 болса, ${p.prime} × x көбейтіндісіндегі екі көбейткіш те 1 санынан үлкен, сондықтан жалпы сан құрама болады. Жалғыз жарамды мән x = 1.`;break;
 case'three-primes-residues':{
  assert.deepEqual(p.offsets.map(n=>n%3).sort(),[1,2]);assert.ok(p.offsets.every(n=>n>3));a=3;assert.ok(p.offsets.every(n=>isPrime(3+n)));
  s=`p — жай сан. p + ${p.offsets[0]} және p + ${p.offsets[1]} сандары да жай. p мәнін табыңдар.`;
  z=`Үш санның 3 санына бөлгендегі қалдықтары әртүрлі: 0, 1, 2. Сондықтан біреуі 3 санына бөлінеді. p + ${p.offsets[0]} және p + ${p.offsets[1]} сандары 3 санынан үлкен; олар 3 санына бөлінсе, құрама болар еді. Демек, p = 3. Тексеру: ${[3,...p.offsets.map(n=>n+3)].join(', ')} — бәрі жай.`;break;
 }
 case'maximum-of-three-primes':{
  const triples=[];for(const x of primes(2,p.sum))for(const y of primes(x+1,p.sum)){const last=p.sum-x-y;if(last>y&&isPrime(last))triples.push([x,y,last]);}assert.ok(triples.length);a=Math.max(...triples.map(xs=>xs[2]));
  s=`Үш түрлі жай нөмірдің қосындысы ${p.sum}. Үшеуінің ең үлкені қабылдай алатын ең үлкен мән қандай?`;
  assert.equal(p.sum%2,0);z=`Үш тақ жай санның қосындысы тақ болар еді, ал ${p.sum} жұп. Сондықтан үштікте 2 міндетті түрде бар. Жарамды үштіктерді кіші мүшеден бастап бір реттен жазамыз: ${triples.map(xs=>xs.join(' + ')).join('; ')}; әрқайсысының қосындысы ${p.sum}. Үштіктердегі ең үлкен мүшелерді салыстырсақ, ең жоғары мән ${a}. Ретті ауыстыру жаңа үштік бермейді.`;break;
 }
 case'sufficient-composite-factor':{
  const [x,y]=p.factors;assert.equal(x*y,p.number);a=`${p.number} = ${x} × ${y}, сондықтан құрама`;
  options=[`${p.number} жай сан`,`${p.number} = ${p.wrongPairs[0][0]} × ${p.wrongPairs[0][1]}, сондықтан құрама`,a,`${p.number} = ${p.wrongPairs[1][0]} × ${p.wrongPairs[1][1]}, сондықтан құрама`];
  s=`${p.number} коды жай ма, құрама ма? Нақты көбейтумен расталатын дұрыс тұжырымды таңдаңдар.`;
  z=`${x} × ${y} = ${p.number}; екі көбейткіш те 1 санынан үлкен. Сондықтан 1 мен кодтың өзінен басқа бөлгіш бар, яғни код құрама. Басқа көбейтінділер ${p.wrongPairs.map(([a,b])=>a*b).join(' және ')} мәндерін береді, олар кодқа тең емес.`;break;
 }
 case'prime-digit-permutations':{
  const all=[];for(const x of p.digits)for(const y of p.digits)if(x!==0&&x!==y)all.push(10*x+y);const xs=all.filter(isPrime);a=xs.length;
  s=`${show(p.digits)} цифрларынан цифрлары қайталанбайтын барлық екі таңбалы нөмір жасалды. Неше нөмір жай сан болады? Әр нөмір бір рет саналады; 13 пен 31 әртүрлі нөмірлер.`;
  z=`Жалпы ${p.digits.length} × ${p.digits.length-1} = ${all.length} нөмір құрылады. Олардың ішіндегі жай сандар ${show(xs.sort((a,b)=>a-b))}. Жай нөмір саны ${a}; әр нөмір жеке тексерілді.`;break;
 }
 case'distinct-prime-product-divisors':
  assert.ok(p.examplePrimes.every(isPrime));assert.notEqual(...p.examplePrimes);a=4;
  s=`a және b — екі әртүрлі жай сан; мысал ретінде ${p.examplePrimes.join(' және ')} алуға болады. Жалпы жағдайда a × b санының неше түрлі оң бөлгіші бар?`;
  z=`Оң бөлгіште a және b көбейткіштерінің әрқайсысы алынуы не алынбауы мүмкін. Төрт мүмкіндік: 1, a, b, a × b. a мен b әртүрлі жай сандар болғандықтан, осы төрт сан әртүрлі, ал өзге жай көбейткіш жоқ. Оң бөлгіш саны 4.`;break;
 case'three-divisors-count':{
  const xs=range(10**(p.digits-1),10**p.digits-1).filter(n=>ds(n).length===3);a=xs.length;
  s=`Дәл үш түрлі оң бөлгіші бар ${p.digits} таңбалы натурал сандар нешеу?`;
  z=`Үш оң бөлгіші бар сан жай санның квадраты болады: бөлгіштері 1, q, q². Осы разрядтағы жарамды квадраттар ${show(xs)}. Олардың саны ${a}. Құрама негіздің квадраты қосымша бөлгіштерге ие болады.`;break;
 }
 case'odd-offset-prime':
  assert.ok(p.shift%2===1&&isPrime(2+p.shift));a=2;
  s=`p және p + ${p.shift} сандарының екеуі де жай. p мәнін табыңдар.`;
  z=`p тақ болса, p + ${p.shift} жұп әрі 2 санынан үлкен, сондықтан құрама болар еді. Демек, p — жұп жай сан, яғни 2. Тексеру: 2 + ${p.shift} = ${2+p.shift}, бұл сан да жай.`;break;
 case'composite-proof-choice':
  a=`${p.number} = ${p.factors[0]} × ${p.factors[1]}`;options=[`${p.number} = 1 × ${p.number}`,`${p.number} = ${p.addend} + ${p.number-p.addend}`,a,`${p.number} = ${p.divisor} × ${Math.floor(p.number/p.divisor)} + ${p.number%p.divisor}`];
  s=`Қай жазу ${p.number} санының 1 мен өзінен өзге бөлгіші барын бірден дәлелдейді?`;
  z=`${a}: екі көбейткіш те 1 санынан үлкен және ${p.number} санынан кіші. Сондықтан бұл жазу құрамалықты дәлелдейді. 1-ге көбейту кез келген натурал санға жарайды; қосынды не қалдықты бөлу жаңа бөлгішті дәлелдемейді.`;break;
 case'nth-prime':{
  const xs=[];for(let n=2;xs.length<p.index;n++)if(isPrime(n))xs.push(n);a=xs.at(-1);
  s=`Жай сандар өсу ретімен 1-орыннан бастап жазылды. ${p.index}-орындағы жай сан қандай? 1 саны бұл тізімге кірмейді.`;
  z=`Алғашқы ${p.index} жай сан: ${show(xs)}. Ретімен санасақ, ${p.index}-орында ${a} тұрады.`;break;
 }
 case'classify-divisor-list':
  a='құрама сан';options=['жай сан',a,'жай да, құрама да емес','оң бүтін сан емес'];
  s=`Белгісіз санның барлық оң бөлгіші толық жазылған: ${show(ds(p.number))}. Осы сан қай топқа жатады?`;
  z=`Тізімде ${ds(p.number).length} түрлі оң бөлгіш бар. Бұл екіден көп болғандықтан, сан құрама. Ең үлкен бөлгіш ${p.number} санының өзіне тең; ${p.number} = ${p.prime} × ${p.prime}.`;break;
 case'distinct-semiprime-count':{
  const xs=[];for(let n=2;n<p.limit;n++){const fs=factorisation(n);if(fs.length===2&&fs[0]!==fs[1])xs.push(n);}a=xs.length;
  s=`${p.limit} санынан кіші неше натурал сан екі әртүрлі жай санның көбейтіндісі түрінде жазылады? Бір сан тек бір рет саналады; жай санның квадраты есептелмейді.`;
  z=`Екі әртүрлі жай көбейткіші бар мәндер ${show(xs)}. Олар ${xs.map(n=>`${n} = ${factorisation(n).join(' × ')}`).join('; ')} түрінде жіктеледі. Барлығы ${a} сан; квадраттар мен үш жай көбейткіші бар сандар кірмейді.`;break;
 }
 case'impossible-prime-sum':{
  const xs=p.candidates.filter(n=>sums(n).length===0);assert.equal(xs.length,1);a=xs[0];options=p.candidates.map(String);
  s='Қай санды екі жай санның қосындысы ретінде жазуға болмайды? Бірдей жай қосылғыштарды алуға да рұқсат.';
  z=`${a} тақ болғандықтан, жай қосылғыштардың бірі 2 болуы керек. Бірақ ${a} − 2 = ${a-2} құрама, сондықтан бұл сан жарамайды. Қалған нұсқалар: ${p.candidates.filter(n=>n!==a).map(n=>`${n} = ${sums(n)[0].join(' + ')}`).join('; ')}.`;break;
 }
 case'reversed-prime-count':{
  const reverse=n=>Number(String(n).split('').reverse().join(''));const xs=primes(p.lower,p.upper).filter(n=>isPrime(reverse(n)));a=xs.length;
  s=`${p.lower}–${p.upper} аралығындағы, екі шеті де кіретін, екі таңбалы жай сандар қаралды. Цифрларының орнын ауыстырғанда да жай сан шығатын неше сан бар? Кері санға бұл аралық шегі қойылмайды. Әр бастапқы сан бөлек саналады; 11 → 11 жазуы да есептеледі.`;
  z=`Жарамды бастапқы сандар ${show(xs)}. Тексеру: ${xs.map(n=>`${n} → ${reverse(n)}`).join('; ')}; оң жақтағы мәндердің бәрі жай. Қалған бастапқы жай сандардан құрама сан шығады. Барлығы ${a} сан.`;break;
 }
 case'prime-factor-sum':{
  const fs=factorisation(p.product);assert.equal(fs.length,3);a=fs.reduce((a,b)=>a+b,0);
  s=`Үш жай санның көбейтіндісі ${p.product}. Осы үш көбейткіштің қосындысын табыңдар.`;
  z=`Жай көбейткіштерге жіктеу ${p.product} = ${fs.join(' × ')}. Көбейткіштер жай және реті қосындыға әсер етпейді. Қосынды ${fs.join(' + ')} = ${a}.`;break;
 }
 case'five-prime-even-total':
  assert.ok(p.total%2===0&&p.example.length===5&&new Set(p.example).size===5&&p.example.every(isPrime)&&p.example.reduce((a,b)=>a+b)===p.total);
  a='бұл сандардың біреуі міндетті түрде 2';options=[a,'бес санның бәрі тақ','мұндай бес түрлі жай сан жоқ','бес санның бәрі 3 санына бөлінеді'];
  s=`Бес түрлі жай санның қосындысы ${p.total}. Қай қорытынды міндетті түрде дұрыс?`;
  z=`Егер 2 болмаса, бес жай санның бәрі тақ болар еді. Бес тақ санның қосындысы тақ, ал ${p.total} жұп. Сондықтан 2 міндетті түрде бар. Мысал: ${p.example.join(' + ')} = ${p.total}; бұл шарттың орындалатынын көрсетеді.`;break;
 case'twin-sum-larger':{
  assert.ok(p.sum%2===0);const small=(p.sum-2)/2;a=small+2;assert.ok(isPrime(small)&&isPrime(a));
  s=`Егіз жай сандардың қосындысы ${p.sum}. Екі санның үлкенін табыңдар.`;
  z=`Екі санның айырмасы 2. Кішісі (${p.sum} − 2) : 2 = ${small}, үлкені ${small} + 2 = ${a}. Екеуі де жай; қосындысы ${p.sum}, айырмасы 2.`;break;
 }
 case'square-composite-rule':
  a='әрқашан құрама сан';options=[a,'әрқашан жай сан','әрқашан 2 санына бөлінеді','әрқашан тақ сан'];
  s=`Шаршы торда әр қатарда n белгі және n қатар бар, мұндағы n — кемінде 2 болатын натурал сан. n × n белгілер саны туралы қай тұжырым әрқашан дұрыс?`;
  z=`1 < n < n × n. Сондықтан белгілер санының кемінде үш түрлі оң бөлгіші бар: 1, n, n × n. Ол әрқашан құрама. Мысалы, n = ${p.example} болса, ${p.example} × ${p.example} = ${p.example**2}; жұптыққа сүйену жалпы дәлел емес.`;break;
 default:throw Error('Unknown prime model '+k);
 }
 return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const spec=(id,kind,params)=>({id,kind,params});
const SPECS=[
 spec('cb1b532383e1d693','twin-choice',{pairs:[[11,13],[21,23],[39,41],[17,23]]}),
 spec('974732f32d20b66e','unique-prime-between',{lower:80,upper:88}),
 spec('eafe5095b4530848','one-classification',{number:1}),
 spec('fc35a41c4c5eeb03','composite-count',{lower:1,upper:18}),
 spec('c1b4036a6cc075fb','choose-prime',{candidates:[29,33,35,39]}),
 spec('bcd1d52cda6ba177','largest-prime-bounded',{upper:95}),
 spec('bf30925139c658e4','prime-count-list',{candidates:[1,3,8,19,25,29,33,37]}),
 spec('02ee1ee509f62db7','composite-reason',{number:77,factors:[7,11]}),
 spec('4d0e0ab48036a7a4','smallest-prime-after',{lower:32}),
 spec('a7645fd352088e77','prime-count-interval',{lower:1,upper:25}),
 spec('622082f28e6f0cf0','only-even-prime',{upper:200}),
 spec('4c3d7d89286009bd','minimum-composite',{upper:30}),
 spec('3f1921b3f839d7b6','select-primes',{candidates:[1,9,13,19,27,35]}),
 spec('40cd00d15899e062','choose-composite',{candidates:[31,37,49,41]}),
 spec('4e277ff3cb8f1eff','minimum-prime',{candidates:[1,2,4,6]}),
 spec('1c0c79546331b626','hidden-composite',{number:143,factors:[11,13],falseDivisor:3}),
 spec('8d71a342ba8b826b','prime-product-below',{limit:15}),
 spec('bd4b821cb86b5fce','prime-sum-choice',{sum:36,pairs:[[17,19],[15,21],[11,27],[13,17]]}),
 spec('e34f22fea69e2d9c','larger-prime-factor',{number:187}),
 spec('7166c779036e9d00','prime-count-interval',{lower:40,upper:70}),
 spec('e86540b85dc142a8','exact-four-divisors-choice',{candidates:[15,16,25,36]}),
 spec('451b245888c39198','odd-prime-sum-pair',{sum:21,distractors:[[3,18],[5,16],[7,14]]}),
 spec('10da568e44d6edcf','sieve-first-new',{previous:[2,3,5,7],next:11,limit:150}),
 spec('08cc95d78bffefc3','noncomposite-remainder',{limit:40}),
 spec('84d793eb385bef15','twin-pair-count',{limit:150}),
 spec('d48e5bbe36d723be','sieve-stop',{limit:200}),
 spec('3069f80714d95239','prime-expression',{expressions:[[4,7,1],[5,5,2],[7,4,3,'subtract'],[99,3,0,'divide']]}),
 spec('2a6ba3edbb2a8c79','prime-count-strict',{lower:300,upper:340}),
 spec('29ecb9ede647d489','prime-sum-interval',{lower:40,upper:65}),
 spec('e0fe7b805615ed74','least-prime-above',{lower:140}),
 spec('522d9985f1188921','sieve-new-count',{previous:[2,3,5],next:7,limit:200}),
 spec('8a2242b768f715e1','digit-sum-primes',{sum:4,maxDigits:3}),
 spec('ff47f6f4ca5a7042','odd-prime-sum-product',{sum:39}),
 spec('ffd6b8b9204a8534','prime-times-natural',{prime:31}),
 spec('c61a9c1f0a87c72b','three-primes-residues',{offsets:[4,8]}),
 spec('e72aa8f4814f249f','maximum-of-three-primes',{sum:32}),
 spec('b88e40dc11c18797','hidden-composite',{number:4181,factors:[37,113],falseDivisor:7}),
 spec('e5313ee2447aa6ec','sufficient-composite-factor',{number:323,factors:[17,19],wrongPairs:[[7,46],[3,107]]}),
 spec('6441b8f73b1ff40f','prime-digit-permutations',{digits:[1,3,4,7]}),
 spec('75a66bd810936af3','distinct-prime-product-divisors',{examplePrimes:[5,11]}),
 spec('9a39391c6b972608','three-divisors-count',{digits:3}),
 spec('f4b4a210bbb58942','odd-offset-prime',{shift:21}),
 spec('436040866e06a3ef','composite-proof-choice',{number:57,factors:[3,19],addend:8,divisor:4}),
 spec('14ec2994942e8a13','nth-prime',{index:12}),
 spec('a72ac763d89be867','classify-divisor-list',{number:25,prime:5}),
 spec('16045d424739b191','distinct-semiprime-count',{limit:40}),
 spec('ff09d9451849e1a4','impossible-prime-sum',{candidates:[17,15,19,28]}),
 spec('8c10c0260adb7cc4','reversed-prime-count',{lower:10,upper:80}),
 spec('386652cd67c6dc84','prime-factor-sum',{product:165}),
 spec('fb556de43ef12a1c','five-prime-even-total',{total:60,example:[2,3,5,19,31]}),
 spec('0a80e2ed5933c926','twin-sum-larger',{sum:144}),
 spec('7115e2781bef97b1','square-composite-rule',{example:8})
];
const byId=new Map(SPECS.map(s=>['grade5-prime-'+s.id,s]));
export function renderEdition(row){const s=byId.get(row.editionId);assert.ok(s);assert.equal(row.modelId,'grade5-prime-'+s.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(s.params));return render(s.kind,row.params);}
export function buildEditions(){return SPECS.map(s=>{
 const src=sources.get(s.id);assert.ok(src,'Missing captured nonvisual prime source '+s.id);
 const definition=['one-classification','only-even-prime','minimum-composite','minimum-prime','distinct-prime-product-divisors','square-composite-rule'].includes(s.kind);
 return{editionId:'grade5-prime-'+s.id,modelId:'grade5-prime-'+s.kind,grade:5,topic:'num',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(s.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
  'Әр sourceId бойынша бастапқы жай/құрама сан дағдысы, жалпы дәлел не толық санау талабы жеке сақталды.',
  definition?'Анықтамалық инварианттар 1, 2, 4 және жалпы заңдар өзгертілмейді; қазақша жағдайы, мысалы немесе даулы нұсқалары жаңадан редакцияланды.':'Жаңа деректер мен қазақша жағдай енгізілді; шеткі мән, өздігінен бөліну, жұп реті және бұрын сызылған мәндер нақты ажыратылды.',
  'Жауап пен түсіндірме жаңа деректерден есептелді. Бір дағдының нұсқалары жаңа мағына санына автоматты қосылмайды.'
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(s.kind,s.params)};
});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const k of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges'])assert.equal(canonicalEdition(row[k]),canonicalEdition(e[k]));const result=renderEdition(row);for(const k of['statement','solution','options'])assert.equal(canonicalEdition(row[k]),canonicalEdition(result[k]),'Unbound prime text '+k);assert.equal(row.answer,result.answer);return{answer:result.answer,checks:['individual source skill, quantifier and counting domain preserved','exact primality, factorisation or finite complete enumeration','unbounded parity/mod3 arguments stated explicitly where needed','native complete text and options bound to fixed parameters','external editorial review required']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const editions=buildEditions();assert.equal(editions.length,sources.size);for(const r of editions)verifyEdition(r);
 const out={schemaVersion:1,scope:'All 52 captured nonvisual sources of grade5 topic2.2, separately authored drafts. Definition invariants retained honestly; independent review still required.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};
 fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-prime.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));
}
