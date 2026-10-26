/** Saved3.7 drafts, independent publication/review remains a separate step. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-fraction-comparison-specs.mjs';
const prefix='grade5-fraction-comparison-',sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-7').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),list=xs=>xs.join(', '),sum=xs=>xs.reduce((a,b)=>a+b,0),one=xs=>{assert.equal(xs.length,1);return xs[0];},gcd=(a,b)=>b?gcd(b,a%b):a,lcm=(a,b)=>a/gcd(a,b)*b;
const side=x=>/^[0-9A-Za-z□]+$/.test(String(x))?String(x):`(${x})`,F=(n,d)=>`(${side(n)}/${side(d)})`,M=(w,n,d)=>`(${w} + ${F(n,d)})`,show=q=>q.length===3?M(...q):F(...q),raw=q=>q.length===3?[q[0]*q[2]+q[1],q[2]]:q,cmp=(a,b)=>{const[n,d]=raw(a),[m,e]=raw(b);return n*e-m*d;},order=qs=>qs.toSorted(cmp),row=qs=>qs.map(show).join('; '),minD=qs=>qs.map(q=>q.at(-1)).reduce(lcm,1);
const div=(a,b)=>{assert.ok(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>0&&a%b===0);return a/b;};
const common=(qs,d)=>qs.map(q=>{const[n,b]=raw(q);return[n*div(d,b),d];}),factors=n=>{const m=new Map();for(let p=2;p*p<=n;p++)while(n%p===0){m.set(p,(m.get(p)||0)+1);n/=p;}if(n>1)m.set(n,(m.get(n)||0)+1);return m;},sup=n=>String(n).replace(/\d/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);
function minProof(qs){const ds=qs.map(q=>q.at(-1)),ps=new Map();for(const d of ds)for(const[p,e]of factors(d))ps.set(p,Math.max(e,ps.get(p)||0));const product=[...ps].toSorted((a,b)=>a[0]-b[0]).map(([p,e])=>`${p}${e===1?'':sup(e)}`).join(' × ');return`Бөлімдердің ең кіші ортақ еселігі ${product} = ${minD(qs)}: әр жай көбейткіштің ең үлкен қажетті дәрежесі алынды.`;}
const crossProof=(a,b)=>{const[n,d]=raw(a),[m,e]=raw(b),op=cmp(a,b)>0?'>':cmp(a,b)<0?'<':'=';return`${n} × ${e} = ${n*e} ${op} ${d*m} = ${d} × ${m}, сондықтан ${show(a)} ${op} ${show(b)}.`;};
function relation(left,right){const c=cmp(left,right);assert.notEqual(c,0);const op=c>0?'>':'<',wrong=c>0?'<':'>';return{answer:`${show(left)} ${op} ${show(right)}`,options:[`${show(left)} ${wrong} ${show(right)}`,`${show(left)} = ${show(right)}`,`${show(left)} ${op} ${show(right)}`,`${show(right)} ${op} ${show(left)}`]};}
function orderingOptions(qs){const sorted=order(qs);return{answer:row(sorted),options:[row(sorted.toReversed()),row([sorted[0],sorted[2],sorted[1],sorted[3]]),row(sorted),row([sorted[1],sorted[0],sorted[2],sorted[3]])]};}
function render(kind,p){let s,z,a,options;switch(kind){
 case'count-above-half':{
  const good=p.fractions.filter(q=>cmp(q,[1,2])>0);a=good.length;s=`${row(p.fractions)} сандарының нешеуі ${F(1,2)} санынан ҚАТАҢ үлкен? Тең болып шыққан сан есепке кірмейді.`;
  z=p.fractions.map(([n,d])=>`${F(n,d)} үшін ${n} × 2 = ${n*2} ${n*2>d?'>':n*2<d?'<':'='} ${d}`).join('; ')+`. Үлкендері ${row(good)} — ${a} сан. ${F(9,18)} = ${F(1,2)} болғандықтан саналмайды. Алымның екі есесін бөліммен салыстыру ортақ бөлімге көшірмей-ақ дұрыс шешім береді.`;break;
 }
 case'equal-whole-mixed-comparison':case'different-whole-mixed-comparison':case'improper-versus-mixed-comparison':case'near-unit-crossproduct-comparison':case'near-large-crossproduct-comparison':{
  ({answer:a,options}=relation(p.left,p.right));s=`${show(p.left)} және ${show(p.right)} сандарын салыстырған ДҰРЫС жазуды таңдаңдар.`;
  if(kind==='different-whole-mixed-comparison')z=`Бүтін бөліктер ${p.left[0]} < ${p.right[0]}. Бірінші сан ${p.left[0]+1} санынан кіші, екіншісі ${p.right[0]} санынан үлкен; сондықтан ${a}. Бөлшек бөліктерді ғана салыстыру бүтін бөліктің басымдығын ескермейді.`;
  else if(kind==='equal-whole-mixed-comparison'){const qs=[p.left.slice(1),p.right.slice(1)],d=minD(qs),converted=common(qs,d);z=`Бүтін бөліктері бірдей ${p.left[0]}, сондықтан тек бөлшек бөліктерін салыстырамыз. ${minProof(qs)} ${show(qs[0])} = ${show(converted[0])}, ${show(qs[1])} = ${show(converted[1])}. ${converted[0][0]} > ${converted[1][0]}, демек ${a}. Алымдарды бастапқы күйінде ғана салыстырмаймыз.`;}
  else if(kind==='improper-versus-mixed-comparison'){const[n,d]=p.left,w=Math.floor(n/d),r=n%d;z=`${n} = ${w} × ${d} + ${r}, сондықтан ${F(n,d)} = ${M(w,r,d)}. Бүтіндер бірдей ${w}; бөлімдері де бірдей ${d}, ал ${r} > ${p.right[1]}. Демек ${a}. Кері тексеру: екінші аралас сан ${F(p.right[0]*d+p.right[1],d)} болып жазылады.`;}
  else z=`Екі бөлім де оң болғандықтан, айқас көбейтеміз. ${crossProof(p.left,p.right)} Көбейтінділердің айырмасы бар болғаны ${Math.abs(cmp(p.left,p.right))}, бірақ ол нөл емес. Алымдарды не бөлімдерді жеке салыстыру жеткіліксіз.`;break;
 }
 case'greater-same-denominator-original-numerator':{
  const q=one(p.fractions.filter(q=>p.fractions.every(t=>cmp(q,t)>=0)));a=q[0];s=`${p.fractions.map(show).join(' және ')} бөлшектерінің үлкенін анықтаңдар. Жауапқа сол БЕРІЛГЕН бөлшектің алымын ғана жазыңдар.`;
  z=`Екі бөлшектің бөлімі ${q[1]}, яғни бірлік бірдей бөліктерге бөлінген. Алымдар ${p.fractions[0][0]} < ${p.fractions[1][0]}, сондықтан ${show(p.fractions[0])} < ${show(p.fractions[1])}. Үлкен бөлшектің алымы ${a}; бөлім ${q[1]} сұралған жоқ.`;break;
 }
 case'unique-strict-same-denominator-numerator':{
  a=one(range(p.lower+1,p.upper-1));s=`${F(p.lower,p.denominator)} < ${F('x',p.denominator)} < ${F(p.upper,p.denominator)} шартындағы x — натурал сан. x неше?`;
  z=`Бөлімдер бірдей әрі оң, сондықтан ${p.lower} < x < ${p.upper}. Осы ашық аралықтағы жалғыз натурал сан ${a}. Тексеру: ${p.lower} < ${a} < ${p.upper}; шеттер теңсіздікті қатаң орындамайды.`;break;
 }
 case'first-new-numerator-for-comparison':{
  const d=minD(p.fractions),converted=common(p.fractions,d);a=converted[0][0];s=`${p.fractions.map(show).join(' және ')} сандарын салыстыру үшін ЕҢ КІШІ ортақ бөлімге келтіреді. Бірінші бөлшектің ЖАҢА алымы неше болады?`;
  z=`${minProof(p.fractions)} Бірінші көбейткіш ${d} : ${p.fractions[0][1]} = ${d/p.fractions[0][1]}. Сондықтан ${show(p.fractions[0])} = ${show(converted[0])}, жаңа алым ${a}. Екінші бөлшек ${show(converted[1])}. Салыстыру ${converted[0][0]} > ${converted[1][0]} екенін көрсетеді, бірақ жауапқа сұралған жаңа ${a} алымы жазылады.`;break;
 }
 case'unique-strict-equal-numerator-denominator':{
  a=one(range(p.lowerDenominator+1,p.upperDenominator-1));s=`${F(p.numerator,p.upperDenominator)} < ${F(p.numerator,'n')} < ${F(p.numerator,p.lowerDenominator)}. n — оң натурал сан. n мәнін табыңдар.`;
  z=`Алымдары бірдей оң бөлшектердің бөлімі кішісі үлкен. Сондықтан бөлімдер кері ретпен ${p.lowerDenominator} < n < ${p.upperDenominator} болады. Жалғыз мән ${a}. ${F(p.numerator,p.upperDenominator)} < ${F(p.numerator,a)} < ${F(p.numerator,p.lowerDenominator)}; екі шет те теңдік бергендіктен кірмейді.`;break;
 }
 case'select-fraction-above-one':{
  const q=one(p.choices.filter(q=>cmp(q,[1,1])>0));a=show(q);options=p.choices.map(show);s='Қай берілген бөлшектің мәні бір бүтіннен ҚАТАҢ үлкен?';z=p.choices.map(([n,d])=>`${F(n,d)} үшін ${n} ${n>d?'>':n<d?'<':'='} ${d}`).join('; ')+`. Бірден үлкен бөлшекте алым бөлімнен үлкен болады, сондықтан жауап ${a}. Алым бөлімге тең болса мәні дәл 1 болып, қатаң шартқа кірмес еді.`;break;
 }
 case'order-common-denominator-fractions':{
  const qs=p.numerators.map(n=>[n,p.denominator]);({answer:a,options}=orderingOptions(qs));s=`${row(qs)} бөлшектерін кішіден үлкенге қарай реттеген дұрыс қатарды таңдаңдар.`;
  z=`Барлық бөлім ${p.denominator}, сондықтан алымдардың өсу реті ${p.numerators.toSorted((a,b)=>a-b).join(' < ')}. Бөлшектер де осы ретпен орналасады: ${order(qs).map(show).join(' < ')}. Кері тізім кему ретін береді, ал бір жұптың орнын ауыстыру өсу ретін бұзады.`;break;
 }
 case'rightmost-equal-numerator-denominator':{
  a=Math.min(...p.denominators);s=`Ортақ сан сәулесіне ${p.denominators.map((d,i)=>`${'ABC'[i]}: ${F(p.numerator,d)}`).join('; ')} белгілері қойылды. Ең ОҢДА тұрған белгінің координатасының БӨЛІМІ неше?`;
  z=`Оң жақтағы нүктеге ең үлкен сан сәйкес. Алымдары бірдей ${p.numerator}, сондықтан ең кіші бөлім ${a} ең үлкен ${F(p.numerator,a)} бөлшегін береді. Реті ${p.denominators.toSorted((a,b)=>a-b).map(d=>F(p.numerator,d)).join(' > ')}. Жауап ${a} — бөлім, алым не әріп емес.`;break;
 }
 case'greatest-fixed-denominator-below':{
  const[n,d]=p.upper,valid=range(1,p.denominator).filter(a=>a*d<n*p.denominator);a=Math.max(...valid);s=`Бөлімі ДӘЛ ${p.denominator} болатын оң бөлшектердің ішінен ${F(n,d)} санынан кіші ең үлкенін алды. Сол бөлшектің алымы неше?`;
  const bound=n*div(p.denominator,d);z=`Шекті ортақ бөліммен жазамыз: ${F(n,d)} = ${F(bound,p.denominator)}. Сондықтан алым ${bound} санынан қатаң кіші болуы керек. Ең үлкен натурал мән ${a}. ${F(a,p.denominator)} < ${F(bound,p.denominator)}, ал алым ${bound} болса теңдік шығып, талап орындалмайды. Қысқармайтын болу талабы жоқ.`;break;
 }
 case'greatest-equal-numerator-fraction':{
  const d=Math.min(...p.denominators);a=F(p.numerator,d);options=p.denominators.map(d=>F(p.numerator,d));s=`Төрт бөлшектің ең үлкенін таңдаңдар: ${options.join('; ')}.`;
  z=`Барлық алым ${p.numerator}. Бір бүтінді аз бөлікке бөлгенде әр бөлік үлкенірек болады. Сондықтан ең кіші бөлім ${d} ең үлкен ${a} мәнін береді. Ең үлкен бөлім ${Math.max(...p.denominators)} керісінше ең кіші бөлшекке сәйкес.`;break;
 }
 case'machine-output-rate-comparison':{
  const first=[p.firstPieces,p.firstMinutes],second=[p.secondPieces,p.secondMinutes];assert.ok(cmp(first,second)>0&&p.firstPieces<p.secondPieces);a='Бірінші құрылғы';options=['Екінші құрылғы','Өнімділіктері тең',a,'Мәлімет жеткіліксіз'];s=`Бірінші құрылғы ${p.firstMinutes} минутта ${p.firstPieces} бөлшек, екіншісі ${p.secondMinutes} минутта ${p.secondPieces} бөлшек дайындайды. Екеуінің де өнімділігі тұрақты. Минутына көбірек бөлшек дайындайтын құрылғы қайсы?`;
  z=`Минуттық өнімділіктер ${F(...first)} және ${F(...second)}. ${crossProof(first,second)} Сондықтан бірінші құрылғы өнімдірек. Дайын бөлшектердің ${p.firstPieces} және ${p.secondPieces} сандарын ғана салыстыру қате: жұмыс уақыттары әртүрлі. Тең уақытқа келтіргендегі айырма аз болса да, бірінші өнімділік үлкен.`;break;
 }
 case'new-numerator-of-smallest-fraction':case'original-numerator-of-largest-fraction':{
  const sorted=order(p.fractions),chosen=kind==='new-numerator-of-smallest-fraction'?sorted[0]:sorted.at(-1),d=minD(p.fractions),converted=common(p.fractions,d);a=kind==='new-numerator-of-smallest-fraction'?chosen[0]*div(d,chosen[1]):chosen[0];s=kind==='new-numerator-of-smallest-fraction'?`${row(p.fractions)} бөлшектерін ең кіші ортақ бөлімге келтіріп, ең кішісін тапты. Ең кіші бөлшектің осы ортақ бөлімдегі ЖАҢА алымын жазыңдар.`:`${row(p.fractions)} бөлшектерінің ең үлкенін табыңдар. Жауапқа сол БЕРІЛГЕН бөлшектің бастапқы алымын жазыңдар.`;
  z=`${minProof(p.fractions)} ${p.fractions.map((q,i)=>`${show(q)} = ${show(converted[i])}`).join('; ')}. ${kind==='new-numerator-of-smallest-fraction'?'Ең кіші':'Ең үлкен'} мән ${show(chosen)}, ортақ бөлімдегі алымы ${chosen[0]*div(d,chosen[1])}. Сұралғаны ${kind==='new-numerator-of-smallest-fraction'?'жаңа':'бастапқы'} алым, сондықтан жауап ${a}.`;break;
 }
 case'fractional-hours-versus-minutes':{
  const[n,d]=p.fraction,minutes=div(60,d)*n;assert.ok(minutes>p.minutes);a=`${F(n,d)} сағ > ${p.minutes} мин`;options=[a,`${F(n,d)} сағ < ${p.minutes} мин`,`${F(n,d)} сағ = ${p.minutes} мин`,'Бірліктер әртүрлі, салыстыру мүмкін емес'];s=`${F(n,d)} сағат пен ${p.minutes} минутты бірдей бірлікке келтіріп салыстырыңдар. Қай жазу дұрыс?`;
  z=`1 сағат 60 минут. Оның ${F(1,d)} бөлігі ${60} : ${d} = ${60/d} минут; ${n} бөлігі ${60/d} × ${n} = ${minutes} минут. ${minutes} > ${p.minutes}, сондықтан ${a}. Алым мен бөлімнің цифрларын қатар жазып, ${p.minutes} минут деп алу уақытты түрлендіру емес.`;break;
 }
 case'order-two-whole-groups':{
  ({answer:a,options}=orderingOptions(p.mixed));s=`${row(p.mixed)} аралас сандарын ӨСУ ретімен көрсететін қатарды таңдаңдар.`;
  const qs=[p.mixed[0].slice(1),p.mixed[2].slice(1)],d=minD(qs),converted=common(qs,d);z=`Алдымен бүтін бөліктерді салыстырамыз: ${p.mixed[0][0]} бүтінді сандар ${p.mixed[1][0]} бүтінді сандардан кіші. Бірінші топта ${show(qs[0])} = ${show(converted[0])} < ${show(converted[1])} = ${show(qs[1])}. Екінші топта алымдары 1, сондықтан ${show(p.mixed[3].slice(1))} < ${show(p.mixed[1].slice(1))}: бөлім үлкен болған сайын үлес азаяды. Толық өсу реті ${order(p.mixed).map(show).join(' < ')}.`;break;
 }
 case'greatest-natural-variable-numerator':{
  const[n,d]=p.upper,values=range(1,p.denominator*n).filter(x=>x*d<n*p.denominator);a=Math.max(...values);s=`${F('n',p.denominator)} < ${F(n,d)} болатындай ең үлкен натурал n санын табыңдар.`;
  z=`Бөлімдер оң, айқас көбейтсек n × ${d} < ${n*p.denominator}. n = ${a} кезінде ${a*d} < ${n*p.denominator}, шарт орындалады. Келесі ${a+1} үшін ${(a+1)*d} > ${n*p.denominator}, шарт бұзылады. n артқан сайын сол көбейтінді де өсетіндіктен, ең үлкен жарамдысы ${a}.`;break;
 }
 case'best-class-share-total':{
  const winning=one(p.classes.filter(([,total,hits])=>p.classes.every(([,other,top])=>hits*other>=top*total)));a=winning[1];s=`Бақылау нәтижелері берілген: A сыныбында барлығы ${p.classes[0][1]} оқушы, барлығын дұрыс орындағаны ${p.classes[0][2]}; B сыныбында барлығы ${p.classes[1][1]}, дұрыс орындағаны ${p.classes[1][2]}; C сыныбында барлығы ${p.classes[2][1]}, дұрыс орындағаны ${p.classes[2][2]}. Дұрыс орындағандардың ҮЛЕСІ ең үлкен сыныпта барлығы неше оқушы бар?`;
  z=`Үлестер: ${p.classes.map(([name,total,hits])=>`${name}: ${F(hits,total)}`).join('; ')}. ${p.classes.filter(e=>e!==winning).map(([,total,hits])=>crossProof([winning[2],winning[1]],[hits,total])).join(' ')} Ең үлкен үлес ${winning[0]} сыныбында, сондықтан жауап жалпы саны ${a}. Дұрыс орындаған ${winning[2]} оқушы саны сұралған жоқ; дұрыс орындағандар саны ең көп болған сыныпта үлес ең үлкен бола бермейді.`;break;
 }
 case'best-hit-share-total-attempts':{
  const best=one(p.players.filter(([,tries,hits])=>p.players.every(([,t,h])=>hits*t>=h*tries)));a=best[1];s=`Доп лақтыруда ${p.players.map(([name,tries,hits])=>`${name} ${tries} рет лақтырып, ${hits} рет дәл тигізді`).join('; ')}. Дәл тигізу ҮЛЕСІ ең жоғары оқушы барлығы неше рет лақтырды?`;
  z=`Дәлдік үлестері ${p.players.map(([name,tries,hits])=>`${name}: ${F(hits,tries)}`).join('; ')}. ${p.players.filter(e=>e!==best).map(([,t,h])=>crossProof([best[2],best[1]],[h,t])).join(' ')} Ең жоғары үлесті көрсеткен оқушы — ${best[0]}. Оның барлық лақтыру саны ${a}, тигізу саны ${best[2]} емес. Ең көп тигізгеннің өзі көбірек әрекет жасағандықтан, үлесі міндетті түрде жоғары болмайды.`;break;
 }
 case'largest-numerator-between-mixed':{
  const L=raw(p.lower),R=raw(p.upper),values=range(1,raw(p.upper)[0]*p.denominator).filter(n=>cmp([n,p.denominator],L)>0&&cmp([n,p.denominator],R)<0);a=Math.max(...values);s=`${show(p.lower)} < ${F('x',p.denominator)} < ${show(p.upper)} қос теңсіздігінде x — натурал сан. Оның ең үлкен мәнін табыңдар.`;
  z=`Шеттерді берілген бөліммен жазсақ ${show(p.lower)} = ${show(L)}, ${show(p.upper)} = ${show(R)}. Сондықтан ${L[0]} < x < ${R[0]}. Мүмкіндері ${list(values)}, ең үлкені ${a}. ${F(a,p.denominator)} = ${a/p.denominator} бүтін санға тең болса да жарамды: бөлшекті қысқартылмайтын ету талабы жоқ. Жоғарғы ${R[0]} теңдік беріп, қатаң шартқа кірмейді.`;break;
 }
 case'order-unlike-denominator-fractions':{
  ({answer:a,options}=orderingOptions(p.fractions));const d=minD(p.fractions),converted=common(p.fractions,d);s=`${row(p.fractions)} бөлшектерін өсу ретімен орналастырған дұрыс нұсқаны таңдаңдар.`;
  z=`${minProof(p.fractions)} ${p.fractions.map((q,i)=>`${show(q)} = ${show(converted[i])}`).join('; ')}. Жаңа алымдардың өсуі ${converted.map(q=>q[0]).toSorted((a,b)=>a-b).join(' < ')}. Демек ${order(p.fractions).map(show).join(' < ')}. Бастапқы алымдар әртүрлі бөлімдерге қатысты, сондықтан оларды жеке реттеуге болмайды.`;break;
 }
 case'greatest-improper-mixed-same-whole':{
  const best=one(p.values.filter(q=>p.values.every(r=>cmp(q,r)>=0)));a=show(best);options=p.values.map(show);s=`${row(p.values)} сандарының ең үлкенін таңдаңдар.`;
  z=`Бұрыс бөлшектерді аралас түрге келтіреміз: ${p.values.filter(q=>q.length===2).map(([n,d])=>`${F(n,d)} = ${M(Math.floor(n/d),n%d,d)}`).join('; ')}. Барлық бүтін бөліктер 5. Бөлшек бөліктерді түгел салыстырамыз: ${p.values.filter(q=>q!==best).map(q=>{const[n,d]=raw(q);return crossProof(best.slice(1),[n%d,d]);}).join(' ')} Сондықтан толық сан ${a} ең үлкен.`;break;
 }
 case'order-fictional-mixture-water-shares':{
  const sorted=p.mixtures.toSorted((a,b)=>cmp(b[1],a[1]));a=sorted.map(q=>q[0]).join(', ');options=['A, B, C','C, A, B',a,'B, C, A'];s=`Оқу тәжірибесінде үш қоспаның су үлестері берілген: ${p.mixtures.map(([name,q])=>`${name}: ${show(q)}`).join('; ')}. Бұл — есепке берілген шартты деректер. Су ҮЛЕСІН көптен азға қарай реттегенде қоспалар қалай орналасады?`;
  z=`A мен B бөлімдері бірдей: ${show(p.mixtures[1][1])} > ${show(p.mixtures[0][1])}, себебі ${p.mixtures[1][1][0]} > ${p.mixtures[0][1][0]}. A мен C үшін ${crossProof(p.mixtures[0][1],p.mixtures[2][1])} Сондықтан үлестердің кему реті ${sorted.map(q=>show(q[1])).join(' > ')}, жауап ${a}.`;break;
 }
 case'sum-variable-denominators-between-unit-fractions':case'count-variable-denominators-between':{
  const lowBound=div(p.numerator*p.upper[1],p.upper[0]),highBound=div(p.numerator*p.lower[1],p.lower[0]),values=range(lowBound+1,highBound-1);a=kind==='sum-variable-denominators-between-unit-fractions'?sum(values):values.length;const name=kind==='sum-variable-denominators-between-unit-fractions'?'a':'n';s=`${show(p.lower)} < ${F(p.numerator,name)} < ${show(p.upper)}, мұндағы ${name} — оң натурал сан. ${kind==='sum-variable-denominators-between-unit-fractions'?'Осы санның барлық мүмкін мәндерінің ҚОСЫНДЫСЫН табыңдар.':'Осы сан неше түрлі мән қабылдайды?'}`;
  z=`Шеттерді бірдей ${p.numerator} алымымен жазамыз: ${show(p.lower)} = ${F(p.numerator,highBound)}, ${show(p.upper)} = ${F(p.numerator,lowBound)}. Бірдей алымдарда бөлімдер кері реттеледі: ${lowBound} < ${name} < ${highBound}. Толық тізім ${list(values)}. ${kind==='sum-variable-denominators-between-unit-fractions'?`Қосынды ${values.join(' + ')} = ${a}.`:`Саны ${a}.`} ${lowBound} және ${highBound} шеттері теңдік беретіндіктен есепке кірмейді.`;break;
 }
 case'order-three-ray-labels':{
  const sorted=p.points.toSorted((a,b)=>cmp(a[1],b[1]));a=sorted.map(q=>q[0]).join(', ');options=['A, B, C','B, A, C','C, B, A',a];s=`Бір координаталық сәуледе ${p.points.map(([name,q])=>`${name}: ${show(q)}`).join('; ')}. Нүктелер солдан оңға қалай реттеледі?`;
  const qs=p.points.map(q=>q[1]),d=minD(qs),converted=common(qs,d);z=`Солдан оңға координаталар өседі. ${minProof(qs)} ${p.points.map(([name,q],i)=>`${name}: ${show(q)} = ${show(converted[i])}`).join('; ')}. Сондықтан ${sorted.map(q=>show(q[1])).join(' < ')}, әріптер реті ${a}.`;break;
 }
 case'count-fixed-denominator-between':case'sum-mixed-fractional-numerators-between':case'count-variable-numerators-unlike-bounds':{
  const lower=p.lower,upper=p.upper,values=range(1,p.denominator).filter(n=>cmp([n,p.denominator],lower)>0&&cmp([n,p.denominator],upper)<0);a=kind==='sum-mixed-fractional-numerators-between'?sum(values):values.length;
  s=kind==='count-fixed-denominator-between'?`Бөлімі ДӘЛ ${p.denominator} болатын, ${show(lower)} санынан үлкен және ${show(upper)} санынан кіші оң бөлшектер нешеу? Қысқармайтын болу талабы жоқ.`:kind==='sum-mixed-fractional-numerators-between'?`${M(p.whole,...lower)} < ${M(p.whole,'a',p.denominator)} < ${M(p.whole,...upper)} болатындай натурал a мәндерінің ҚОСЫНДЫСЫН табыңдар. Бүтін мен бөлшек қосылады.`:`${show(lower)} < ${F('a',p.denominator)} < ${show(upper)} шартын орындайтын натурал a мәндері нешеу?`;
  const d=minD([lower,upper,[1,p.denominator]]),L=common([lower],d)[0][0],R=common([upper],d)[0][0],k=div(d,p.denominator);z=(kind==='sum-mixed-fractional-numerators-between'?`Бүтін бөліктер бірдей ${p.whole}, оларды алып тек бөлшектерді салыстырамыз. `:'')+`${minProof([lower,upper,[1,p.denominator]])} Шарт ${L} < ${k} × a < ${R} түріне келеді. Толық жарамды тізім ${list(values)}. `+(kind==='sum-mixed-fractional-numerators-between'?`Қосынды ${values.join(' + ')} = ${a}.`:`Саны ${a}.`)+` Төменгі көрші ${values[0]-1} және жоғарғы көрші ${values.at(-1)+1} шартқа кірмейді. Теңдік шығатын шекара да қатаң салыстыруда қабылданбайды.`;break;
 }
 case'count-one-digit-irreducible-above':{
  const values=[];for(let d=1;d<=p.maximumDigit;d++)for(let n=1;n<d;n++)if(cmp([n,d],p.threshold)>0&&gcd(n,d)===1)values.push([n,d]);a=values.length;s=`Алымы мен бөлімі 1–${p.maximumDigit} аралығындағы натурал сандар болатын, ${show(p.threshold)} санынан ҮЛКЕН және 1-ден КІШІ қысқартылмайтын бөлшектер нешеу?`;
  z=`Дұрыс бөлшек үшін 1 ≤ алым < бөлім ≤ ${p.maximumDigit}. Әр бөлімде алымды айқас көбейтумен тексереміз: ${p.threshold[1]} × алым > ${p.threshold[0]} × бөлім. Толық жарамды тізім ${row(values)} — ${a} бөлшек. Бөлімі 4 болғандағы ${F(3,4)} шекке тең, сондықтан кірмейді. Бөлімі 9 болғанда ${F(7,9)} және ${F(8,9)} екеуі де жарамды; тек көршілес алым-бөлімдерді ғана санауға болмайды. Әр көрсетілген жұп өзара жай.`;break;
 }
 case'repeated-two-digit-fraction-comparison':{
  const left=[p.numeratorBlock*101,p.denominatorBlock*101],right=[p.numeratorBlock,p.compareDenominator];({answer:a,options}=relation(left,right));s=`${show(left)} және ${show(right)} бөлшектерін салыстырған дұрыс жазуды таңдаңдар.`;
  z=`Екі таңбалы блоктың қайталануы 101 көбейткішін береді: ${left[0]} = ${p.numeratorBlock} × 101, ${left[1]} = ${p.denominatorBlock} × 101. Сондықтан ${show(left)} = ${F(p.numeratorBlock,p.denominatorBlock)}. Енді алымдары бірдей, ал ${p.denominatorBlock} < ${p.compareDenominator}, сондықтан ${F(p.numeratorBlock,p.denominatorBlock)} > ${show(right)}. Жауап ${a}. Үлкен төрт таңбалы сандардың өзін салыстыру емес, ортақ көбейткішті қысқарту қолданылды.`;break;
 }
 case'same-addition-changes-proper-fraction':{
  const[n,d]=p.fraction,newQ=[n+p.added,d+p.added];assert.ok(cmp(newQ,p.fraction)>0);a='Үлкен';options=['Кіші','Тең',a,'Мәлімет жеткіліксіз'];s=`${F(n,d)} бөлшегінің алымына да, бөліміне де ${p.added} қосты. Жаңа бөлшектің мәні бастапқы мәнмен салыстырғанда қандай?`;
  z=`Жаңа бөлшек ${F(`${n} + ${p.added}`,`${d} + ${p.added}`)} = ${show(newQ)}. ${crossProof(newQ,p.fraction)} Тағы бір тексеру: 1-ге дейінгі жетпейтін үлестер бастапқыда ${F(d-n,d)}, жаңасында ${F(d-n,d+p.added)}. Екінші жетіспейтін үлес аз, сондықтан жаңа сан 1-ге жақынырақ әрі үлкен. Бірдей сан қосу алым мен бөлімді бір санға көбейтумен бірдей емес.`;break;
 }
 case'least-two-digit-variable-denominator':{
  const values=range(10,99).filter(n=>cmp([p.numerator,n],p.upper)<0);a=Math.min(...values);s=`${F(p.numerator,'n')} < ${show(p.upper)} теңсіздігін орындайтын ең кіші ЕКІ ТАҢБАЛЫ натурал n санын табыңдар.`;
  z=`Бөлімдер оң. Айқас көбейту ${p.numerator*p.upper[1]} < ${p.upper[0]} × n шартын береді. n = ${a-1} кезінде ${(a-1)*p.upper[0]} < ${p.numerator*p.upper[1]} — жарамайды. n = ${a} кезінде ${a*p.upper[0]} > ${p.numerator*p.upper[1]} — жарайды. n артқанда оң жақ өседі, сондықтан ең кіші екі таңбалы жарамдысы ${a}.`;break;
 }
 case'choose-fraction-between-close-bounds':{
  const good=one(p.choices.filter(q=>cmp(q,p.lower)>0&&cmp(q,p.upper)<0));a=show(good);options=p.choices.map(show);s=`Шеттерді қоспағанда, ${show(p.lower)} және ${show(p.upper)} сандарының арасында жатқан бөлшекті таңдаңдар.`;
  const numerator=lcm(p.lower[0],good[0]),lowD=div(p.lower[1]*numerator,p.lower[0]),highD=div(p.upper[1]*numerator,p.upper[0]),goodD=div(good[1]*numerator,good[0]);z=`Бірдей ${numerator} алымымен жазсақ, шектер ${F(numerator,lowD)} және ${F(numerator,highD)}, ал ${a} = ${F(numerator,goodD)}. ${highD} < ${goodD} < ${lowD}, сондықтан бөлшектер кері ретпен ${show(p.lower)} < ${a} < ${show(p.upper)}. Қалған ${row(p.choices.filter(q=>q!==good))} нұсқалары осы ашық аралықтан тыс.`;break;
 }
 case'same-route-arrival-order':{
  const sorted=p.runners.toSorted((a,b)=>cmp(a[1],b[1]));a=sorted.map(q=>q[0]).join(', ');options=[p.runners.map(q=>q[0]).join(', '),[p.runners[1][0],p.runners[0][0],p.runners[2][0]].join(', '),[p.runners[2][0],p.runners[1][0],p.runners[0][0]].join(', '),a];s=`Үш оқушы бірдей жолға бір мезгілде жүгіріп шықты. ${p.runners.map(([name,q])=>`${name} жолды ${show(q)} минутта аяқтады`).join('; ')}. Мәреге келу реті қандай?`;
  const qs=p.runners.map(q=>q[1]),d=minD(qs),converted=common(qs,d);z=`Бір мезгілде шыққандықтан ең аз уақыт жұмсаған бірінші келеді. ${minProof(qs)} Уақыттар ретімен ${row(converted)} минут. Өсу реті ${sorted.map(q=>show(q[1])).join(' < ')}. Сондықтан мәреге ${a} болып келеді; ең ұзақ уақытты ең жылдам жүгіру деп алмау керек.`;break;
 }
 case'adjacent-near-one-fraction-comparison':{
  const k=p.base,left=[k,k+1],right=[k+1,k+2];({answer:a,options}=relation(left,right));s=`${show(left)} және ${show(right)} сандарын үлкен көбейтулерді түгел орындамай салыстырыңдар. Қай жазу дұрыс?`;
  z=`Айқас көбейтінділерді ортақ бөлікпен жазамыз: ${k} × ${k+2} = ${k} × ${k+1} + ${k}; ${k+1} × ${k+1} = ${k} × ${k+1} + ${k+1}. Ортақ ${k} × ${k+1} бөліктері тең, ал ${k} < ${k+1}. Екінші айқас көбейтінді дәл 1-ге үлкен. Сондықтан ${a}. Дәлдік үшін мәндерді ондық жуықтаумен тең деп алмаймыз.`;break;
 }
 case'least-natural-near-one-variable':{
  const[n,d]=p.threshold;assert.equal(d-n,1);a=n+1;s=`${F('n','n + 1')} > ${show(p.threshold)} болатындай ең кіші натурал n санын табыңдар.`;
  z=`n оң болғандықтан екі бөлім де оң. Айқас көбейту n × ${d} > ${n} × (n + 1) береді. Оң жақ ${n} × n + ${n}; екі жақтан ${n} × n шамасын алып тастасақ n > ${n}. Ең кіші натурал шешім ${a}. n = ${n} болса бастапқы шекке теңдік шығады; n = ${a} үшін ${a*d} > ${(a+1)*n}.`;break;
 }
 case'choose-true-mixed-comparison-rules':{
  options=p.relations.map(([l,op,r])=>`${show(l)} ${op} ${show(r)}`);a=one(options.filter((_,i)=>{const[l,op,r]=p.relations[i],c=cmp(l,r);return op==='>'?c>0:c<0;}));s='Бөлімдері бірдей, алымдары бірдей және аралас сандарға қатысты ережелерді қолданып, жалғыз ДҰРЫС теңсіздікті таңдаңдар.';
  z=p.relations.map(([l,op,r],i)=>{const correct=cmp(l,r)>0?'>':'<';const reason=l.length===3?`Бүтін бөліктер ${l[0]} < ${r[0]}, сондықтан ${show(l)} < ${show(r)}.`:l[1]===r[1]?`Бөлім ${l[1]} бірдей, алымдар ${l[0]} ${correct} ${r[0]}, сондықтан ${show(l)} ${correct} ${show(r)}.`:`Алым ${l[0]} бірдей; бөлімдері ${l[1]} және ${r[1]}, бөлімі үлкені кіші. Сондықтан ${show(l)} ${correct} ${show(r)}.`;return`${options[i]} — ${a===options[i]?'дұрыс':'қате'}. ${reason}`;}).join(' ')+` Бүтін бөліктер әртүрлі болса алдымен солар қаралады; бірдей алымда бөлім кіші болған сайын бөлшек үлкен. Жалғыз дұрыс жол ${a}.`;break;
 }
 case'count-natural-between-improper-bounds':{
  const values=range(1,raw(p.upper)[0]).filter(n=>cmp([n,1],p.lower)>0&&cmp([n,1],p.upper)<0);a=values.length;s=`${show(p.lower)} санынан үлкен, бірақ ${show(p.upper)} санынан кіші натурал сандар нешеу?`;
  z=`Шектер аралас түрінде ${M(Math.floor(p.lower[0]/p.lower[1]),p.lower[0]%p.lower[1],p.lower[1])} және ${M(Math.floor(p.upper[0]/p.upper[1]),p.upper[0]%p.upper[1],p.upper[1])}. Аралықтағы натурал сандар ${list(values)} — ${a} сан. Төменгі ${values[0]-1} де, жоғарғы ${values.at(-1)+1} де аралыққа түспейді. Қатаң шектердің өзін қоспаймыз.`;break;
 }
 case'equal-wholes-equal-piece-count':{
  assert.ok(p.taken<Math.min(p.firstParts,p.secondParts)&&p.firstParts>p.secondParts);a=p.secondName;options=[a,p.firstName,'Екеуі бірдей','Мәлімет жеткіліксіз'];s=`${p.firstName} мен ${p.secondName} ұзындықтары БІРДЕЙ екі таспа алды. ${p.firstName} өз таспасын ${p.firstParts}, ${p.secondName} өзінікін ${p.secondParts} тең бөлікке кесті. Әрқайсысы ${p.taken} бөліктен пайдаланды. Кім көбірек ұзындық пайдаланды?`;
  z=`Пайдаланған үлестері ${p.firstName}: ${F(p.taken,p.firstParts)}, ${p.secondName}: ${F(p.taken,p.secondParts)}. Алымдары бірдей, ${p.secondParts} < ${p.firstParts}, сондықтан ${F(p.taken,p.secondParts)} > ${F(p.taken,p.firstParts)}. Бастапқы таспалар тең болғандықтан үлкен үлес үлкен ұзындық береді. Жауап ${a}; бөліктер саны бірдей болғанымен өлшемдері әртүрлі.`;break;
 }
 case'equal-containers-most-filled-index':{
  const i=one(p.fractions.map((q,i)=>p.fractions.every(t=>cmp(q,t)>=0)?i:null).filter(x=>x!==null));a=i+1;s=`Бірдей сыйымдылықтағы үш бояу ыдысы ретімен ${row(p.fractions)} үлестеріне дейін толтырылған. Бояуы ең көп ыдыстың НӨМІРІН жазыңдар.`;
  const d=minD(p.fractions),converted=common(p.fractions,d);z=`Ыдыстар бірдей, сондықтан үлестерді салыстыру жеткілікті. ${minProof(p.fractions)} Толған үлестер ${row(converted)}. Ең үлкені ${show(p.fractions[i])}, бұл ${a}-нөмірлі ыдыс. Бөлшектің алымы емес, шарттағы реттік нөмір сұралды.`;break;
 }
 case'greatest-proper-digit-fraction-term-sum':{
  const qs=[];for(const n of p.digits)for(const d of p.digits)if(n<d)qs.push([n,d]);const best=one(qs.filter(q=>qs.every(t=>cmp(q,t)>=0)));a=sum(best);s=`${list(p.digits)} цифрларының екі ӘРТҮРЛІСІ алым мен бөлімге жазылады. Шыққан дұрыс бөлшектердің ең үлкенінің алымы мен бөлімінің ҚОСЫНДЫСЫН табыңдар.`;
  const candidates=p.digits.slice(1).map((d,i)=>[p.digits[i],d]);z=`Дұрыс бөлшекте алым бөлімнен кіші. Әр бөлім үшін ең үлкен мүмкін алымды алсақ, үміткерлер ${row(candidates)}. ${candidates.filter(q=>q!==best&&cmp(q,best)!==0).map(q=>crossProof(best,q)).join(' ')} Ең үлкені ${show(best)}. Қосынды ${best[0]} + ${best[1]} = ${a}. Бір бөлімдегі қалған кіші алымдар одан үлкен мән бере алмайды.`;break;
 }
 case'progress-share-chain':{
  const qs=p.students.map(q=>q[1]),sorted=order(qs);a=sorted.map(show).join(' < ');const orderings=[[1,0,2],[2,1,0],[0,2,1],[0,1,2]];options=orderings.map(ns=>ns.map(i=>show(qs[i])).join(' < '));s=`Үш оқушыға тапсырмалары БІРДЕЙ жинақтар берілді. ${p.students.map(([name,q])=>`${name} жинақтың ${show(q)} бөлігін шығарды`).join('; ')}. Шығарылған ҮЛЕСТЕРДІ салыстырған дұрыс қос теңсіздікті таңдаңдар.`;
  z=`Әр үлес бірдей көлемдегі жинаққа қатысты. ${crossProof(sorted[0],sorted[1])} ${crossProof(sorted[1],sorted[2])} Сондықтан ${a}. Екі көршілес айқас көбейтіндінің айырмасы небәрі 1 болса да, ретті ауыстыруға болмайды.`;break;
 }
 case'largest-near-half-fraction':{
  const above=p.choices.filter(q=>cmp(q,[1,2])>0),best=one(above.filter(q=>above.every(t=>cmp(q,t)>=0)));a=show(best);options=p.choices.map(show);const sorted=order(above);s=`${options.join('; ')} бөлшектерінің ең үлкенін таңдаңдар. Жуық ондық мәндердің орнына дәл салыстыру қолданылады.`;
  z=`Алдымен ${F(1,2)} санымен салыстырамыз: ${p.choices.map(([n,d])=>`${n} × 2 = ${n*2} ${n*2>d?'>':'<'} ${d}`).join('; ')}. ${row(p.choices.filter(q=>cmp(q,[1,2])<0))} жартыдан кіші, ол ең үлкен бола алмайды. Қалғандары үшін ${crossProof(sorted[0],sorted[1])} ${crossProof(sorted[1],sorted[2])} Ең үлкені ${a}. Ең үлкен алымға не бөлімге қарап таңдау дұрыс емес.`;break;
 }
 case'minimum-denominator-inside-bounds':{
  const states=[];for(let d=1;d<=100&&!states.length;d++)for(let n=1;n<d;n++)if(cmp([n,d],p.lower)>0&&cmp([n,d],p.upper)<0)states.push([n,d]);const best=one(states);a=best[1];s=`${show(p.lower)} санынан ҮЛКЕН, ${show(p.upper)} санынан КІШІ оң бөлшек жазу керек. Оның натурал бөлімі ең аз неше болуы мүмкін?`;
  const candidates=range(2,a-1).map(d=>[Math.ceil(p.upper[0]*d/p.upper[1])-1,d]);z=`Әр бөлімде алдымен жоғарғы шектен қатаң кіші ең үлкен алымды қараймыз. 1 бөлімінде оң дұрыс бөлшек жоқ. 2–${a-1} бөлімдерінің ең үлкен үміткерлері ${row(candidates)}; әрқайсысы ${show(p.lower)} санынан кіші не оған тең. Одан кіші алымдар да жарамайды. ${a} бөлімінде ${show(best)} үшін ${crossProof(best,p.lower)} ${crossProof(best,p.upper)} Сондықтан алғаш жарамды бөлім ${a}; шекараға тең бөлшектер қабылданбайды.`;break;
 }
 case'sum-variable-self-reciprocal-domain':{
  const product=p.leftDenominator*p.rightNumerator,values=range(1,product).filter(n=>n*n<product);a=sum(values);s=`${F('n',p.leftDenominator)} < ${F(p.rightNumerator,'n')} теңсіздігін орындайтын барлық натурал n сандарының ҚОСЫНДЫСЫН табыңдар.`;
  z=`n оң болғандықтан екі бөлім де оң. Ортақ бөлім ${p.leftDenominator} × n: ${F('n',p.leftDenominator)} = ${F('n × n',`${p.leftDenominator} × n`)}, ${F(p.rightNumerator,'n')} = ${F(product,`${p.leftDenominator} × n`)}. Сондықтан n × n < ${product}. ${values.at(-1)}² = ${values.at(-1)**2} < ${product}, бірақ ${values.at(-1)+1}² = ${(values.at(-1)+1)**2} > ${product}. Жарамды тізім ${list(values)}, қосынды ${values.join(' + ')} = ${a}. Оң n өскен сайын квадраты да өседі, сондықтан басқа натурал шешім жоқ.`;break;
 }
 default:throw Error('Unknown fraction-comparison model '+kind);
 }
 if(!options)s+=' Жауапқа тек санды жазыңыз.';
 if(options){assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else assert.match(String(a),/^\d+$/);
 assert.ok(!/[\\$^]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(s=>[prefix+s.id,s]));
export function renderEdition(r){const spec=specs.get(r.editionId);assert.ok(spec);assert.equal(r.modelId,prefix+spec.kind);assert.equal(canonicalEdition(r.params),canonicalEdition(spec.params));return render(spec.kind,r.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:prefix+spec.id,modelId:prefix+spec.kind,grade:5,topic:'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Сақталған 3.7 тақырыбының 50 невизуалды бастапқы шарты, толық шешімі мен барлық нұсқалары жеке оқылды. Бөлек жаңа қазақша редакциялар мен деректер жазылды. Бірдей алым/бөлім, аралас санның бүтін бөлігі, 1 не жартымен салыстыру, қатаң шектер және сұралған бастапқы/жаңа алым рөлдері сақталды.',
 'Жаңа жағдайлар: бірдей таспалар, тұрақты өнімді құрылғылар, доп лақтыру үлесі, сыныптардың толық нәтижесі, бояу ыдыстары, бір мезгілде басталған жүгіру және оқу қоспалары. Нақты тағам құрамы туралы расталмаған мәлімет енгізілмейді; салыстырылатын толық шамалардың теңдігі шартта ашық берілді.',
 '50 редакция немесе model ID 50 бөлек жаңа математикалық мағына деп саналмайды. Жақын бөлшектерде айқас көбейтінді айырмасы 1 сақталған. Барлық бөлшек/аралас/рет/қатынас жауаптары MCQ, ашық жауаптар тек бүтін сан. Native canonical бөлшектер, explicit mixed топтар және Unicode дәрежелер қолданылады.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(r){const e=expected.get(r.editionId);assert.ok(e);for(const k of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(r[k]),canonicalEdition(e[k]));const actual=renderEdition(r);for(const k of['statement','solution','options'])assert.equal(canonicalEdition(r[k]),canonicalEdition(actual[k]),'Unbound comparison '+k);assert.equal(r.answer,actual.answer);return{answer:actual.answer,checks:['all50 individual source3.7 skills read; separate new givens/contexts','exactrational comparison, strict natural/one-digit/minimum denominator domains','original/new requestedroles, rawcounts vsrates, equalwhole and unitconversion explicit','full statement/solution/options/answer/source metadata exactbound','nativecanonical fractions and mixedgroups, noTeX/caret','external independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const r of editions)verifyEdition(r);const out={schemaVersion:1,scope:'All50 saved nonvisual grade5 topic3.7 sources rewritten offline. Model/source variants not semantic uniqueness; independent review pending.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-fraction-comparison.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
