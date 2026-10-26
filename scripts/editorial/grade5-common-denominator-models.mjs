/** Saved3.6 source-specific drafts; author calculation is not external review. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-common-denominator-specs.mjs';
const prefix='grade5-common-denominator-',sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-6').map(q=>[q.sourceId,q]));
const gcd=(a,b)=>b?gcd(b,a%b):a,lcm=(a,b)=>a/gcd(a,b)*b,range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=xs=>xs.reduce((a,b)=>a+b,0),list=xs=>xs.join(', '),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const div=(a,b)=>{assert.ok(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>0&&a%b===0);return a/b;};
const side=x=>/^[0-9A-Za-z□]+$/.test(String(x))?String(x):`(${x})`,F=(n,d)=>`(${side(n)}/${side(d)})`,M=(w,n,d)=>`(${w} + ${F(n,d)})`,show=q=>q.length===3?M(...q):F(...q),tuple=qs=>qs.map(show).join(qs.length===2?' және ':'; '),D=qs=>qs.map(q=>q.at(-1)).reduce(lcm,1),expand=([n,d],target)=>[n*div(target,d),target],mixedExpand=([w,n,d],target)=>[w,n*div(target,d),target];
const factors=n=>{const out=new Map();for(let p=2;p*p<=n;p++)while(n%p===0){out.set(p,(out.get(p)||0)+1);n/=p;}if(n>1)out.set(n,(out.get(n)||0)+1);return out;},sup=n=>String(n).replace(/[0-9]/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]),factorText=m=>[...m].sort((a,b)=>a[0]-b[0]).map(([p,e])=>String(p)+(e===1?'':sup(e))).join(' × ')||'1';
function minimumProof(ds){if(new Set(ds).size===1)return `Берілген бөлімдердің бәрі ${ds[0]}, сондықтан ең кіші ортақ бөлім де ${ds[0]}.`;const n=ds.reduce(lcm,1),fm=new Map();for(const d of ds)for(const[p,e]of factors(d))fm.set(p,Math.max(e,fm.get(p)||0));assert.equal([...fm].reduce((v,[p,e])=>v*p**e,1),n);return`${ds.map(d=>factors(d).size===1&&factors(d).get(d)===1?`${d} — жай сан`:`${d} = ${factorText(factors(d))}`).join('; ')}. Ортақ еселік әр жай көбейткіштің ең үлкен дәрежесін қамтуы керек. Сондықтан ең кіші ортақ бөлім ${factorText(fm)} = ${n}.`;}
const conversionProof=(qs,d)=>qs.map(q=>{const next=q.length===3?M(...mixedExpand(q,d)):F(...expand(q,d));return show(q)===next?`${show(q)} өзгеріссіз қалады`:`${show(q)} = ${next}`;}).join('; '),factorsAt=(qs,d)=>qs.map(q=>div(d,q.at(-1)));
function render(kind,p){let s,z,a,options;switch(kind){
 case'first-supplement-at-minimum':case'new-first-numerator-at-minimum':{
  const d=D(p.fractions),k=div(d,p.fractions[0][1]);a=kind==='first-supplement-at-minimum'?k:p.fractions[0][0]*k;s=kind==='first-supplement-at-minimum'?`${tuple(p.fractions)} бөлшектерін ең кіші ортақ бөлімге ауыстырады. Бірінші бөлшектің толықтауыш көбейткіші неше?`:`${tuple(p.fractions)} жұбын ең кіші ортақ бөлімге келтіргеннен кейін тек БІРІНШІ бөлшектің жаңа алымын табыңдар.`;
  z=`${minimumProof(p.fractions.map(q=>q[1]))} Бірінші бөлшектің толықтауыш көбейткіші ${d} : ${p.fractions[0][1]} = ${k}. Жаңа алым ${p.fractions[0][0]} × ${k} = ${p.fractions[0][0]*k}. ${conversionProof(p.fractions,d)}. Сұралғаны ${kind==='first-supplement-at-minimum'?`көбейткіш ${k}, жаңа алым емес`:`жаңа алым ${a}, көбейткіш ${k} емес`}.`;break;
 }
 case'blank-new-numerator':case'large-decimal-denominator-numerator':case'supplement-for-given-denominator':case'fixed-expanded-term-sum':{
  const[n,d]=p.fraction,k=div(p.target,d),newN=n*k;a=kind==='supplement-for-given-denominator'?k:kind==='fixed-expanded-term-sum'?newN+p.target:newN;
  s=kind==='blank-new-numerator'?`${F(...p.fraction)} = ${F('□',p.target)} теңдігі орындалуы керек. Бос алымға қандай сан жазылады?`:kind==='large-decimal-denominator-numerator'?`${F(...p.fraction)} мәнін өзгертпей, бөлімін ${p.target} етіп жазды. Жаңа бөлшектің алымы неше?`:kind==='supplement-for-given-denominator'?`${F(...p.fraction)} бөлшегіне тең жазудың бөлімі ${p.target} болуы тиіс. Осы ауысудағы толықтауыш көбейткішті табыңдар.`:`${F(...p.fraction)} бөлшегіне тең, бөлімі ${p.target} болатын бөлшек жазылды. Оның ЖАҢА алымы мен бөлімінің қосындысы қандай?`;
  z=`Бөлім ${p.target} : ${d} = ${k} есе үлкейеді. Бөлшек өзгермеуі үшін алым да ${n} × ${k} = ${newN} болады: ${F(n,d)} = ${F(newN,p.target)}. `+(kind==='fixed-expanded-term-sum'?`Сұралған қосынды ${newN} + ${p.target} = ${a}. Кері тексеру: бастапқы ${n} + ${d} = ${n+d} қосындысын да ${k} санына көбейтсек ${a} шығады.`:kind==='supplement-for-given-denominator'?`Толықтауыш көбейткіш ${k}; оны алымның ${newN} жаңа мәнімен шатастырмаймыз.`:`Кері тексеру: жаңа алым мен бөлімді ${k} санына бөлгенде бастапқы ${F(n,d)} шығады. Тек бөлімді өзгертуге болмайды.`);break;
 }
 case'any-common-denominator':{
  const ds=p.fractions.map(q=>q[1]);a=one(p.choices.filter(n=>ds.every(d=>n%d===0)));options=p.choices.map(String);s=`${tuple(p.fractions)} бөлшектерін БІРДЕЙ бөліммен жазуға болатын санды таңдаңдар. Ең кіші болу талабы жоқ.`;
  z=`Ортақ бөлім ${list(ds)} бөлімдерінің екеуіне де бөлінуі керек. ${p.choices.map(n=>`${n}: ${ds.map(d=>`${d} санына ${n%d===0?'бөлінеді':'бөлінбейді'}`).join(', ')}`).join('; ')}. Сондықтан ${a} жарайды. ${conversionProof(p.fractions,a)}. Ең кіші ортақ бөлім ${D(p.fractions)} болса да, одан үлкен ортақ бөлім де шартқа сай.`;break;
 }
 case'fraction-at-fixed-denominator':{
  const[n,d]=p.fraction,k=div(p.target,d);a=F(n*k,p.target);options=p.choices.map(show);s=`${F(n,d)} бөлшегін бөлімін ${p.target} етіп, мәнін сақтап жазыңдар. Қай нұсқа дұрыс?`;
  z=`Толықтауыш көбейткіш ${p.target} : ${d} = ${k}. Алым да ${n} × ${k} = ${n*k} болып өзгереді. Демек ${F(n,d)} = ${a}. ${F(n,p.target)} алымды өзгеріссіз қалдырады; ${F(k,p.target)} көбейткіштің өзін алымға жазады. Екеуі бастапқы мәнді сақтамайды.`;break;
 }
 case'minimum-two-denominators':case'nested-denominator-minimum':case'three-denominator-minimum':case'large-common-minimum':{
  a=D(p.fractions);s=`${tuple(p.fractions)} сандарын бөлшектердің мәнін сақтап, ең кіші ортақ бөліммен жазу керек. Сол ЕҢ КІШІ бөлім неше?`;
  z=`${minimumProof(p.fractions.map(q=>q[1]))} Тексеру: ${p.fractions.map(q=>`${a} : ${q[1]} = ${a/q[1]}`).join('; ')} — барлық көбейткіш бүтін. ${conversionProof(p.fractions,a)}. `+(kind==='nested-denominator-minimum'?`Үлкен бөлімнің өзі кіші бөлімге бөлінеді, сондықтан бір бөлшекті өзгертпеуге болады.`:`Бөлімдердің көбейтіндісі ${p.fractions.map(q=>q[1]).reduce((a,b)=>a*b,1)} де ортақ, бірақ ортақ жай көбейткіштерді бірнеше рет артық алудың қажеті жоқ.`);break;
 }
 case'mixed-fixed-denominator':{
  const[w,n,d]=p.mixed,k=div(p.target,d);a=M(w,n*k,p.target);options=[a,M(w,n,p.target),M(w*k,n*k,p.target),M(w,n+d,p.target)];s=`${M(w,n,d)} санын бөлшек бөлігінің бөлімі ${p.target} болатын тең аралас санмен жазыңдар. Дұрыс нұсқаны таңдаңдар.`;
  z=`Бүтін ${w} сол күйі қалады. Бөлшек бөлікте ${p.target} : ${d} = ${k}, сондықтан ${F(n,d)} = ${F(n*k,p.target)}. Нәтиже ${a}. Бүтін бөлікті ${k} санына көбейту бастапқы санды өзгертеді. Кері тексеру: ${F(n*k,p.target)} бөлігін ${k} санына қысқартқанда ${F(n,d)} шығады.`;break;
 }
 case'supplement-given-minimum':{
  const d=D(p.fractions);assert.equal(d,p.minimum);const k=div(d,p.fractions[0][1]);a=k;s=`${tuple(p.fractions)} бөлшектерінің ең кіші ортақ бөлімі ${p.minimum} екені белгілі. Осы бөлімге көшкенде БІРІНШІ бөлшекке қолданылатын толықтауыш көбейткіш неше?`;
  z=`Берілген ортақ бөлімді бірінші бөлімге бөлеміз: ${p.minimum} : ${p.fractions[0][1]} = ${k}. Екінші бөлшектің көбейткіші басқа: ${p.minimum} : ${p.fractions[1][1]} = ${p.minimum/p.fractions[1][1]}. ${conversionProof(p.fractions,p.minimum)}. Ортақ бөлімнің ең кіші екенін де тексерсек: ${minimumProof(p.fractions.map(q=>q[1]))}`;break;
 }
 case'two-mixed-minimum-conversion':case'hard-two-mixed-minimum':{
  const d=D(p.mixed),ks=factorsAt(p.mixed,d),correct=p.mixed.map(q=>mixedExpand(q,d));a=tuple(correct);
  const old=p.mixed.map(([w,n])=>[w,n,d]),whole=p.mixed.map(([w,n],i)=>[w*ks[i],n*ks[i],d]),swap=p.mixed.map(([w,n],i)=>[w,n*ks[1-i],d]);
  options=kind==='two-mixed-minimum-conversion'?[tuple(old),a,tuple(whole),tuple(swap)]:[a,tuple(p.mixed.map(q=>mixedExpand(q,p.mixed[0][2]*p.mixed[1][2]))),tuple(old),tuple(whole)];
  s=`${tuple(p.mixed)} аралас сандарын бөлшек бөліктерінің ЕҢ КІШІ ортақ бөлімімен жазыңдар. Сандардың берілген ретін сақтаңдар.`;
  z=`Бүтін бөліктер ${p.mixed.map(q=>q[0]).join(' және ')} өзгермейді. ${minimumProof(p.mixed.map(q=>q[2]))} Толықтауыш көбейткіштер ретімен ${list(ks)}. ${conversionProof(p.mixed,d)}. Сондықтан ${a}. Бөлшек бөліктердің алымдарын ғана тиісті көбейткішке көбейтеміз. Екі көбейткішті ауыстыру немесе бүтіндерді көбейту теңдікті бұзады; ортақ бөлімнің одан үлкен еселігі ең кіші талапқа сай емес.`;break;
 }
 case'blank-new-denominator':{
  const[n,d]=p.fraction,k=div(p.newNumerator,n);a=d*k;s=`${F(n,d)} = ${F(p.newNumerator,'□')} теңдігіндегі бос бөлімді табыңдар.`;
  z=`Алым ${p.newNumerator} : ${n} = ${k} есе артқан. Бөлім де ${k} есе артуы тиіс: ${d} × ${k} = ${a}. Демек ${F(n,d)} = ${F(p.newNumerator,a)}. Тексеру: ${p.newNumerator} × ${d} = ${n} × ${a} = ${n*a}; екі бөлшектің мәні бірдей.`;break;
 }
 case'three-unit-fractions-minimum':{
  const d=D(p.fractions),correct=p.fractions.map(q=>expand(q,d));a=tuple(correct);options=[tuple(p.fractions.map(()=>[1,d])),tuple(p.fractions.map(q=>expand(q,d*2))),tuple(p.fractions.map(q=>[q[1],d])),a];s=`${tuple(p.fractions)} бөлшектерін ең кіші ортақ бөлімге келтірген дұрыс қатарды таңдаңдар. Реті өзгермейді.`;
  z=`${minimumProof(p.fractions.map(q=>q[1]))} Толықтауыш көбейткіштер ${list(factorsAt(p.fractions,d))}. ${conversionProof(p.fractions,d)}. Сондықтан ${a}. ${2*d} бөлімімен дұрыс көбейтілген қатар сандық мәндерді сақтайды, бірақ ең кіші бөлім бермейді. Ескі бөлімді жаңа алым деп жазу да дұрыс емес.`;break;
 }
 case'ordered-supplement-pair':{
  const d=D(p.fractions),ks=factorsAt(p.fractions,d),[n,m]=p.fractions.map((q,i)=>q[0]*ks[i]);a=ks.join(' және ');options=[ks.toReversed().join(' және '),a,p.fractions.map(q=>q[1]).toReversed().join(' және '),`${n} және ${m}`];s=`${tuple(p.fractions)} жұбын ең кіші ортақ бөлімге көшіргенде толықтауыш көбейткіштер қандай болады? БІРІНШІ, содан кейін ЕКІНШІ бөлшектің көбейткішін көрсетіңдер.`;
  z=`${minimumProof(p.fractions.map(q=>q[1]))} Біріншіге ${d} : ${p.fractions[0][1]} = ${ks[0]}, екіншіге ${d} : ${p.fractions[1][1]} = ${ks[1]}. Жауап ${a}. ${conversionProof(p.fractions,d)}. Жаңа ${n} және ${m} алымдары көбейткіштердің өздері емес; рет те сақталуы керек.`;break;
 }
 case'blank-original-denominator':{
  const k=div(p.newNumerator,p.numerator);a=div(p.newDenominator,k);s=`${F(p.numerator,'□')} = ${F(p.newNumerator,p.newDenominator)} жазуындағы бастапқы бөлімді табыңдар.`;
  z=`Оң жақтағы алым ${p.newNumerator} : ${p.numerator} = ${k} есе үлкен. Демек оң жақтағы бөлім де бастапқыдан ${k} есе үлкен: бастапқы бөлім ${p.newDenominator} : ${k} = ${a}. ${F(p.numerator,a)} = ${F(p.newNumerator,p.newDenominator)}. Алымдардың айырмасын бөлімнен азайтуға болмайды; екі шама бірдей көбейткішпен өзгереді.`;break;
 }
 case'equivalent-denominator-open-window':{
  const[n,d]=p.fraction;assert.equal(gcd(n,d),1);const den=one(range(p.lower+1,p.upper-1).filter(t=>t%d===0)),k=div(den,d);a=n*k;s=`Мәні ${F(n,d)} болатын бөлшектің бөлімі ${p.lower} санынан ҮЛКЕН, ${p.upper} санынан КІШІ. Алымы мен бөлімі натурал сандар. Сол бөлшектің алымын табыңдар.`;
  z=`${F(n,d)} қысқартылмайды, сондықтан тең бөлшектің бөлімі ${d} санына еселік. Аралықтағы жалғыз осындай сан ${den}; көршілес еселіктер ${den-d} және ${den+d} шартқа келмейді. Толықтауыш көбейткіш ${den} : ${d} = ${k}. Жаңа алым ${n} × ${k} = ${a}. Тексеру: ${F(a,den)} бөлшегін ${k} санына қысқартқанда ${F(n,d)} шығады.`;break;
 }
 case'two-fractions-minimum-conversion':{
  const d=D(p.fractions),ks=factorsAt(p.fractions,d),product=p.fractions[0][1]*p.fractions[1][1];a=tuple(p.fractions.map(q=>expand(q,d)));options=[tuple(p.fractions.map(q=>expand(q,product))),tuple(p.fractions.map(([n])=>[n,d])),a,tuple(p.fractions.map(([n],i)=>[n*ks[1-i],d]))];s=`${tuple(p.fractions)} сандары үшін ЕҢ КІШІ ортақ бөліммен алынған дұрыс жұпты таңдаңдар. Бірінші және екінші орындары ауыспайды.`;
  z=`${minimumProof(p.fractions.map(q=>q[1]))} Толықтауыш көбейткіштер ${list(ks)}. ${conversionProof(p.fractions,d)}. ${product} бөлімімен алынған тең бөлшектер де бар, бірақ ол ең кіші емес. Алымдарды өзгеріссіз қалдыру не көбейткіштерді ауыстыру мәндерді бұзады.`;break;
 }
 case'three-fractions-fixed-denominator':{
  const ks=factorsAt(p.fractions,p.target),correct=p.fractions.map(q=>expand(q,p.target));a=tuple(correct);options=[tuple(ks.map(k=>[k,p.target])),tuple(p.fractions.map(([n])=>[n,p.target])),tuple(correct.map((q,i)=>i===2?[p.fractions[2][0],p.target]:q)),a];s=`${tuple(p.fractions)} сандарын ретімен бөлімі ДӘЛ ${p.target} болатын тең бөлшектермен жазыңдар. Дұрыс қатар қайсысы?`;
  z=`Әр бөлшекке жеке көбейткіш табамыз: ${p.fractions.map(q=>`${p.target} : ${q[1]} = ${p.target/q[1]}`).join('; ')}. ${conversionProof(p.fractions,p.target)}. Жауап ${a}. Толықтауыш көбейткіштің өзі жаңа алым емес: бастапқы алымды да оған көбейту қажет. Үшінші бөлшекті өзгертпей қалдыру да бүкіл қатарды қате етеді.`;break;
 }
 case'three-fractions-minimum-conversion':case'three-large-minimum-conversion':{
  const d=D(p.fractions),ks=factorsAt(p.fractions,d),correct=p.fractions.map(q=>expand(q,d));a=tuple(correct);
  options=kind==='three-fractions-minimum-conversion'?[tuple(correct.map((q,i)=>i===2?[p.fractions[2][0],d]:q)),a,tuple(p.fractions.map(q=>expand(q,2*d))),tuple(p.fractions.map(([n])=>[n,d]))]:[a,tuple(correct.map(([n])=>[n,2*d])),tuple(p.fractions.map(q=>expand(q,2*d))),tuple(p.fractions.map(([n],i)=>[n*ks[i===0?1:i===1?0:i],d]))];
  s=`${tuple(p.fractions)} бөлшектерін ретін сақтап, ең кіші ортақ бөлімге келтірген қатарды таңдаңдар.`;
  z=`${minimumProof(p.fractions.map(q=>q[1]))} Толықтауыш көбейткіштер ретімен ${list(ks)}. ${conversionProof(p.fractions,d)}. Дұрыс қатар ${a}. ${d*2} ортақ бөлімімен мәндер дұрыс сақталса да, ең кіші талап орындалмайды. Бөлімді ғана үлкейтіп, алымдарды сақтап қою не екі көбейткішті ауыстыру мәнді өзгертеді.`;break;
 }
 case'garden-progress-common-minimum':{
  a=D(p.fractions);s=`Екі топ бір гүлзарды безендіруге көмектесті. Дина тобы толық жұмыстың ${F(...p.fractions[0])} бөлігін, Мерей тобы сол толық жұмыстың ${F(...p.fractions[1])} бөлігін орындады. Осы екі үлесті ең кіші ортақ бөліммен жазғанда бөлім неше болады?`;
  z=`Екі үлес бір толық гүлзарға қатысты, сондықтан ортақ бөлім арқылы жазылады. ${minimumProof(p.fractions.map(q=>q[1]))} ${conversionProof(p.fractions,a)}. Ортақ бөлім ${a}. Бастапқы бөлімдерді қосу немесе көбейтіп тоқтау ең кіші ортақ бөлімді міндетті түрде бермейді.`;break;
 }
 case'first-mixed-fractional-numerator':{
  const d=D(p.mixed),k=div(d,p.mixed[0][2]);a=p.mixed[0][1]*k;s=`${tuple(p.mixed)} аралас сандарының бөлшек бөліктерін ең кіші ортақ бөлімге келтірді. Бірінші санның тек БӨЛШЕК бөлігінің жаңа алымы неше?`;
  z=`Бүтін бөліктер өзгермейді. ${minimumProof(p.mixed.map(q=>q[2]))} Бірінші бөлшек бөлік үшін көбейткіш ${d} : ${p.mixed[0][2]} = ${k}; жаңа алым ${p.mixed[0][1]} × ${k} = ${a}. ${conversionProof(p.mixed,d)}. Сұралған бөлшек бөліктің алымына ${p.mixed[0][0]} бүтін бөлігі қосылмайды.`;break;
 }
 case'choose-false-expansion-equality':{
  options=p.equations.map(([left,right])=>`${show(left)} = ${show(right)}`);const bad=one(p.equations.map(([l,r],i)=>l[0]*r[1]!==r[0]*l[1]?i:null).filter(x=>x!==null));a=options[bad];s='Шебер бөлшектерді жаңа бөліммен жазып шықты. Тек БІР теңдік қате. Сол қате жолды таңдаңдар.';
  z=p.equations.map(([l,r],i)=>{const k=div(r[1],l[1]);return`${options[i]}: бөлім ${k} есе артқан, дұрыс жаңа алым ${l[0]} × ${k} = ${l[0]*k}; ${i===bad?`берілген ${r[0]} алымға тең емес, сондықтан қате. Дұрысы ${show(l)} = ${F(l[0]*k,r[1])}`:'ол берілген алымға тең, теңдік дұрыс'}`;}).join('. ')+'. Теңдік үшін алым мен бөлім бірдей көбейткішпен өзгеруі керек.';break;
 }
 case'natural-and-mixed-improper-pair':{
  const[w,n,d]=p.mixed,first=p.natural*d,second=w*d+n;a=tuple([[first,d],[second,d]]);options=[tuple([[p.natural,d],[second,d]]),tuple([[first,d],[w*n+d,d]]),a,tuple([[first,d],[n*d+w,d]])];s=`${p.natural} натурал саны мен ${M(w,n,d)} аралас санын осы ретпен бөлімі ${d} болатын БҰРЫС бөлшектер түрінде жазыңдар.`;
  z=`Әр бір бүтін ${F(d,d)} болғандықтан, ${p.natural} = ${F(first,d)}. Аралас санның алымы ${w} × ${d} + ${n} = ${second}; ${M(w,n,d)} = ${F(second,d)}. Жауап ${a}. Натурал санға бөлімді жай тіркей салу оның мәнін өзгертеді; аралас санның бүтіні алымға емес, бөлімге көбейтіледі.`;break;
 }
 case'reduce-before-common-denominator':{
  const reduced=p.fractions.map(([n,d])=>{const g=gcd(n,d);return[n/g,d/g];}),d=D(reduced),original=D(p.fractions);a=tuple(reduced.map(q=>expand(q,d)));options=[a,tuple(p.fractions.map(q=>expand(q,original))),tuple(p.fractions.map(([n])=>[n,d])),tuple(reduced.map(([n])=>[n,p.fractions[1][1]]))];s=`${tuple(p.fractions)} бөлшектерін АЛДЫМЕН толық қысқартыңдар. Содан кейін қысқартылған жазулардың ең кіші ортақ бөлімімен алынған жұпты таңдаңдар.`;
  z=p.fractions.map(([n,d],i)=>`${F(n,d)} алымы мен бөлімін ЕҮОБ ${gcd(n,d)} санына бөлсек, ${F(...reduced[i])} шығады`).join('; ')+`. ${minimumProof(reduced.map(q=>q[1]))} Дұрыс жұп ${a}. Алғашқы бөлімдердің ${original} ортақ еселігін алу мәнді сақтағанмен, қысқартқаннан кейінгі ең кіші бөлім талабын орындамайды. Тек бөлімдерді қысқарту да мәндерді сақтамайды.`;break;
 }
 case'three-mixed-hard-minimum':{
  const d=D(p.mixed),ks=factorsAt(p.mixed,d),converted=p.mixed.map(q=>mixedExpand(q,d));a=tuple(converted);const half=d/2;
  options=[tuple(converted.map(([w,n])=>[w,n,d*2])),tuple(p.mixed.map(([w,n,den],i)=>[w,i===2?converted[i][1]:n*div(half,den),half])),tuple(converted.map(([w,n],i)=>[w*ks[i],n,d])),a];s=`${tuple(p.mixed)} аралас сандарын берілген ретпен ең кіші ортақ бөлімге келтіріңдер. Дұрыс үштік қайсысы?`;
  z=`Бүтіндер ${list(p.mixed.map(q=>q[0]))} сақталады. ${minimumProof(p.mixed.map(q=>q[2]))} Көбейткіштер ${list(ks)}. ${conversionProof(p.mixed,d)}. Жауап ${a}. ${half} саны ${p.mixed[2][2]} бөліміне бөлінбейді, сондықтан алғашқы екі сан дұрыс келсе де, үшінші санмен бүкіл қатар дұрыс болмайды. ${2*d} бөліміне алымдарды сол күйі көшіріп қою да теңдікті бұзады.`;break;
 }
 case'coprime-composite-denominator-pair':{
  const good=one(p.pairs.filter(qs=>D(qs)===qs[0][1]*qs[1][1]));a=tuple(good);options=p.pairs.map(tuple);s='Қай жұпта ең кіші ортақ бөлім екі берілген бөлімнің КӨБЕЙТІНДІСІНЕ тең? Бөлшектер қысқартылмайды.';
  z=p.pairs.map(qs=>{const[b,d]=qs.map(q=>q[1]);return`${tuple(qs)}: ЕҮОБ(${b}, ${d}) = ${gcd(b,d)}, ең кіші ортақ бөлім ${D(qs)}, ал көбейтінді ${b*d}`;}).join('; ')+`. Жалғыз дұрыс жұп ${a}. Оның бөлімдері ${good[0][1]} және ${good[1][1]} — екеуі де құрама, бірақ өзара жай. Өзара жай болу екі санның да жай болуын талап етпейді.`;break;
 }
 case'mixed-expanded-improper-numerator':{
  const[w,n,d]=p.mixed,k=div(p.target,d),improper=w*d+n;a=improper*k;s=`${M(w,n,d)} санын бөлімі ДӘЛ ${p.target} болатын БҰРЫС бөлшекке айналдырды. Сол бұрыс бөлшектің алымы неше?`;
  z=`Алдымен бүтінді қосамыз: ${M(w,n,d)} = ${F(improper,d)}, себебі ${w} × ${d} + ${n} = ${improper}. Бөлім ${p.target} : ${d} = ${k} есе өскенде алым ${improper} × ${k} = ${a} болады. ${F(improper,d)} = ${F(a,p.target)}. Бөлшек бөлікті ғана ${F(n*k,p.target)} деп жазу бүтінді жоғалтады. ${M(w,n*k,p.target)} мәні дұрыс, бірақ сұралған бұрыс бөлшектің алымы емес.`;break;
 }
 case'common-denominators-strict-window':{
  const d=D(p.fractions),values=range(p.lower+1,p.upper-1).filter(n=>n%d===0);a=values.length;s=`${tuple(p.fractions)} бөлшектеріне ортақ бола алатын бөлімдердің ${p.lower} санынан ҮЛКЕН және ${p.upper} санынан КІШІ неше мәні бар? Екі шет есепке кірмейді.`;
  z=`${minimumProof(p.fractions.map(q=>q[1]))} Барлық ортақ бөлім осы ${d} санына еселік. Ашық аралықтағы мәндер ${list(values)} — ${a} сан. ${p.lower} және ${p.upper} екеуі де ортақ бөлім бола алады, бірақ шарт бойынша шеттер саналмайды. Мысалы, ${values[0]} : ${p.fractions[0][1]} = ${values[0]/p.fractions[0][1]} және ${values[0]} : ${p.fractions[1][1]} = ${values[0]/p.fractions[1][1]}.`;break;
 }
 case'equivalent-fractions-denominator-limit':{
  const[n,d]=p.fraction;assert.equal(gcd(n,d),1);const ks=range(1,Math.floor((p.upperExclusive-1)/d));a=ks.length;s=`${F(n,d)} мәніне тең, бөлімі ${p.upperExclusive} санынан ҚАТАҢ КІШІ болатын неше оң бөлшек жазылады? Алымы мен бөлімі натурал сандар; бастапқы бөлшек те саналады.`;
  z=`Бастапқы бөлшек қысқартылмайды. Оған тең жазулардың бөлімдері ${d} × k түрінде, k — оң натурал сан. Шарт ${d} × k < ${p.upperExclusive}. k мәндері ${list(ks)}, бөлімдері ${list(ks.map(k=>d*k))}. Барлығы ${a} жазу. Келесі бөлім ${d*(ks.length+1)} шекке тең болғандықтан кірмейді; k = 1 бастапқы бөлшекті береді.`;break;
 }
 case'least-numerator-for-new-denominator':{
  const candidates=range(1,p.oldDenominator).filter(n=>n*p.newDenominator%p.oldDenominator===0);a=Math.min(...candidates);options=p.choices.map(String);const g=gcd(a,p.oldDenominator),n=a/g,d=p.oldDenominator/g,newN=div(n*p.newDenominator,d);s=`${F('a',p.oldDenominator)} мәнін алымы натурал сан болатын ${p.newDenominator} бөлімді бөлшекпен жазуға болады. a — оң натурал сан. a-ның МҮМКІН ЕҢ КІШІ мәні қайсысы?`;
  z=`${p.newDenominator} саны ${p.oldDenominator} санына бөлінбейді, сондықтан алдымен қысқарту қажет. a = ${a} алсақ, ${F(a,p.oldDenominator)} = ${F(n,d)} = ${F(newN,p.newDenominator)}. Бұдан кіші оң a мәндері ${list(range(1,a-1))}; олар үшін жаңа алым ${F(`${p.newDenominator} × a`,p.oldDenominator)} бүтін шықпайды. Сондықтан тек нұсқалардың ішінде емес, барлық оң натурал сандар арасында ең кішісі ${a}.`;break;
 }
 case'equivalent-fraction-fixed-term-sum':{
  const[n,d]=p.fraction,k=div(p.sum,n+d);a=F(n*k,d*k);options=p.choices.map(show);assert.ok(p.choices.every(q=>sum(q)===p.sum));s=`Мәні ${F(n,d)} болатын бөлшектің алымы мен бөлімінің қосындысы ${p.sum}. Сол бөлшектің берілген түрін таңдаңдар.`;
  z=`Тең бөлшек ${F(`${n} × k`,`${d} × k`)} түрінде. Екі мүшесінің қосындысы (${n} + ${d}) × k = ${n+d} × k = ${p.sum}, сондықтан k = ${k}. Бөлшек ${a}. Тексеру: ${n*k} + ${d*k} = ${p.sum}; екеуін де ${k} санына қысқартсақ ${F(n,d)} шығады. Қалған нұсқалардың да қосындысы ${p.sum}, бірақ олардың мәні берілген бөлшекке тең емес.`;break;
 }
 case'recover-ordered-denominators':{
  const ds=p.supplements.map(k=>div(p.minimum,k));assert.equal(ds.reduce(lcm,1),p.minimum);a=ds.join(' және ');options=[p.supplements.join(' және '),p.supplements.map(k=>p.minimum*k).join(' және '),a,p.supplements.map(k=>p.minimum-k).join(' және ')];s=`Екі бөлшекті ең кіші ортақ бөлімге келтіргенде бөлім ${p.minimum} болды. Бірінші толықтауыш көбейткіш ${p.supplements[0]}, екіншісі ${p.supplements[1]}. Бастапқы бөлімдерді осы ретпен табыңдар.`;
  z=`Толықтауыш көбейткіш = ортақ бөлім : бастапқы бөлім, сондықтан кері амал қолданамыз. Біріншісі ${p.minimum} : ${p.supplements[0]} = ${ds[0]}, екіншісі ${p.minimum} : ${p.supplements[1]} = ${ds[1]}. Жауап ${a}. ${minimumProof(ds)} Көбейткіштердің өзін жауапқа көшіру, ортақ бөлімге көбейту не азайту бастапқы бөлімдерді бермейді.`;break;
 }
 case'count-third-denominator-preserving-minimum':{
  assert.equal(p.firstDenominators.reduce(lcm,1),p.minimum);const values=range(p.lowerExclusive+1,p.minimum).filter(n=>p.minimum%n===0);a=values.length;s=`${F(1,p.firstDenominators[0])}, ${F(1,p.firstDenominators[1])} және ${F(1,'n')} бөлшектерінің ең кіші ортақ бөлімі ${p.minimum}. n — ${p.lowerExclusive} санынан үлкен натурал сан. n неше түрлі мән қабылдайды?`;
  z=`${minimumProof(p.firstDenominators)} Жаңа n бөлімі қосылғанда ортақ бөлім ${p.minimum} болып қалуы үшін n осы санның бөлгіші болуы керек. Толық жарамды тізім ${list(values)} — ${a} мән. n = 1 шартқа кірмейді; ${p.minimum} санынан үлкен n оны бөле алмайды. Әр аталған n үшін ${p.minimum} : n бүтін, сондықтан жаңа жай көбейткіш қажет болмайды.`;break;
 }
 case'two-unknown-expansion-term-sum':{
  const[n,d]=p.fraction,k=div(p.newDenominator,d),j=div(p.newNumerator,n),first=n*k,second=d*j;a=first+second;s=`${F(n,d)} = ${F('a',p.newDenominator)} = ${F(p.newNumerator,'b')} тең бөлшектер берілген. a + b мәнін табыңдар.`;
  z=`Бірінші ауысуда бөлім ${p.newDenominator} : ${d} = ${k} есе артты, сондықтан a = ${n} × ${k} = ${first}. Екінші ауысуда алым ${p.newNumerator} : ${n} = ${j} есе артты, сондықтан b = ${d} × ${j} = ${second}. Қосынды ${first} + ${second} = ${a}. ${F(first,p.newDenominator)} және ${F(p.newNumerator,second)} бөлшектерін тиісінше ${k} және ${j} сандарына қысқартқанда ${F(n,d)} шығады.`;break;
 }
 case'sum-three-supplements':{
  const d=D(p.fractions),ks=factorsAt(p.fractions,d);a=sum(ks);s=`${tuple(p.fractions)} бөлшектерін ең кіші ортақ бөлімге келтірді. Үш толықтауыш көбейткіштің ҚОСЫНДЫСЫ неше?`;
  z=`${minimumProof(p.fractions.map(q=>q[1]))} Көбейткіштер ${p.fractions.map((q,i)=>`${d} : ${q[1]} = ${ks[i]}`).join('; ')}. Қосынды ${ks.join(' + ')} = ${a}. ${conversionProof(p.fractions,d)}. Жаңа алымдарды емес, көбейткіштердің өздерін қостық.`;break;
 }
 case'product-versus-minimum-factor':{
  const product=p.fractions[0][1]*p.fractions[1][1],minimum=D(p.fractions);a=div(product,minimum);s=`Дина мен Мерей ${tuple(p.fractions)} жұбын ортақ бөліммен жазды. Дина бөлімдердің КӨБЕЙТІНДІСІН, Мерей ЕҢ КІШІ ортақ бөлімін алды. Динаның бөлімі Мерейдікінен неше есе үлкен?`;
  z=`Дина алған бөлім ${p.fractions[0][1]} × ${p.fractions[1][1]} = ${product}. ${minimumProof(p.fractions.map(q=>q[1]))} Қатынас ${product} : ${minimum} = ${a} есе. Екі тәсіл де тең бөлшектер береді: ${conversionProof(p.fractions,product)}; ал ең кіші бөлімде ${conversionProof(p.fractions,minimum)}. Үлкен ортақ бөлім қате емес, бірақ ең кіші де емес.`;break;
 }
 case'recover-original-numerator-at-minimum':{
  const d=p.denominators.reduce(lcm,1),k=div(d,p.denominators[0]);a=div(p.newNumerator,k);s=`${F('a',p.denominators[0])} және ${F('b',p.denominators[1])} бөлшектерін АЛДЫМЕН ҚЫСҚАРТПАЙ, берілген бөлімдерінің ең кіші ортақ еселігіне келтірді. Бірінші бөлшектің жаңа алымы ${p.newNumerator} болды. Бастапқы a неше?`;
  z=`${minimumProof(p.denominators)} Бірінші бөлшекке көбейткіш ${d} : ${p.denominators[0]} = ${k}. Жаңа алым a × ${k} = ${p.newNumerator}, сондықтан a = ${p.newNumerator} : ${k} = ${a}. Тексеру: ${F(a,p.denominators[0])} = ${F(p.newNumerator,d)}. Екінші бөлшектің b алымын білу қажет емес: қажетті көбейткіш берілген бөлімдерден анықталады.`;break;
 }
 case'locate-conversion-error-step':{
  const d=D(p.fractions),ks=factorsAt(p.fractions,d),first=p.fractions[0][0]*ks[0],correct=p.fractions[1][0]*ks[1];assert.notEqual(correct,p.wrongSecondNumerator);a='3-қадамда';options=['1-қадамда','2-қадамда',a,'Қате жоқ'];s=`Айбар ${tuple(p.fractions)} жұбын ең кіші ортақ бөлімге келтірді.\n1) Ортақ бөлім ${d}.\n2) Көбейткіштер: ${d} : ${p.fractions[0][1]} = ${ks[0]}, ${d} : ${p.fractions[1][1]} = ${ks[1]}.\n3) ${F(...p.fractions[0])} = ${F(first,d)}, ${F(...p.fractions[1])} = ${F(p.wrongSecondNumerator,d)}.\nЕң бірінші қате қай қадамда пайда болды?`;
  z=`Бірінші қадам дұрыс: ${minimumProof(p.fractions.map(q=>q[1]))} Екінші қадамдағы ${list(ks)} көбейткіштері де дұрыс. Үшінші қадамда алғашқы алым ${p.fractions[0][0]} × ${ks[0]} = ${first} дұрыс табылған. Бірақ екінші алым ${p.fractions[1][0]} × ${ks[1]} = ${correct} болуы керек, ${p.wrongSecondNumerator} емес. Айбар екінші бөлшекке бірінші көбейткішті қолданған. Дұрысы ${F(...p.fractions[1])} = ${F(correct,d)}; қате ${a}.`;break;
 }
 case'fraction-convertible-to-both-targets':{
  const good=one(p.choices.filter(([n,d])=>p.targets.every(t=>n*t%d===0)));a=F(...good);options=p.choices.map(show);s=`Қай бөлшекті бөлімі ${p.targets[0]} болатын бөлшекке ДЕ, бөлімі ${p.targets[1]} болатын бөлшекке ДЕ келтіруге болады? Екі жаңа алым да натурал сан болуы керек.`;
  z=`Нұсқалар қысқартылмайды. Сондықтан олардың бөлімдері ${p.targets[0]} санына да, ${p.targets[1]} санына да бөлгіш болуы керек. ${p.choices.map(([n,d])=>`${F(n,d)}: ${p.targets.map(t=>`${t} саны ${d} санына ${t%d===0?'бөлінеді':'бөлінбейді'}`).join(', ')}`).join('; ')}. Жалғыз жауап ${a}: ${p.targets.map(t=>`${a} = ${F(...expand(good,t))}`).join('; ')}.`;break;
 }
 case'irreducible-increments-recover-factor':{
  const g=gcd(p.numeratorGain,p.denominatorGain),n=p.numeratorGain/g,d=p.denominatorGain/g;a=g+1;const divisors=range(1,g).filter(t=>p.numeratorGain%t===0&&p.denominatorGain%t===0);s=`Қысқартылмайтын оң бөлшектің алымы мен бөлімін бір толықтауыш көбейткішке көбейтті. Нәтижесінде алымы ${p.numeratorGain} санына, бөлімі ${p.denominatorGain} санына артты. Сол толықтауыш көбейткіш неше?`;
  z=`Бастапқы алым u, бөлім v, көбейткіш k болсын. Өсімдер u × (k − 1) = ${p.numeratorGain} және v × (k − 1) = ${p.denominatorGain}. Демек k − 1 екі өсімнің ортақ бөлгіші, мүмкіндері ${list(divisors)}. ${divisors.map(t=>`k − 1 = ${t} болса, бастапқы бөлшек ${F(p.numeratorGain/t,p.denominatorGain/t)}, оның ЕҮОБ-і ${gcd(p.numeratorGain/t,p.denominatorGain/t)}`).join('; ')}. Қысқартылмайтын жағдай тек k − 1 = ${g}, сондықтан k = ${a}. Тексеру: ${F(n,d)} = ${F(n*a,d*a)}; ${n*a} − ${n} = ${p.numeratorGain}, ${d*a} − ${d} = ${p.denominatorGain}.`;break;
 }
 case'all-unit-denominators-minimum':{
  const ds=range(p.from,p.to);a=ds.reduce(lcm,1);options=p.choices.map(String);s=`${F(1,p.from)}, ${F(1,p.from+1)}, …, ${F(1,p.to)} бөлшектерінің ең кіші ортақ бөлімін таңдаңдар. Бөлімдерге ${p.from}–${p.to} аралығындағы БАРЛЫҚ натурал сан кіреді.`;
  z=`${minimumProof(ds)} Бұл сан барлық ${p.from}–${p.to} бөлімдерге қалдықсыз бөлінеді. ${a*2} да ортақ, бірақ екі есе үлкен. ${a/2} саны 8-ге бөлінбейді. Барлық бөлімдердің көбейтіндісі ${ds.reduce((v,d)=>v*d,1)} ортақ болғанмен, қайталанған жай көбейткіштерді артық алады. Ең азын табу үшін әр жай санның тек ең үлкен қажетті дәрежесін алу жеткілікті.`;break;
 }
 case'infer-nonminimal-common-denominator':{
  const[n,d]=p.fractions[0],k=div(p.newFirstNumerator,n),common=d*k,second=expand(p.fractions[1],common),minimum=D(p.fractions);assert.ok(common>minimum);a=F(...second);options=[F(p.fractions[1][0]*k,common),a,F(p.fractions[1][0]*div(minimum,p.fractions[1][1]),common),F(p.newFirstNumerator,common)];s=`${tuple(p.fractions)} жұбын ортақ бөлімге келтірді, бірақ ЕҢ КІШІ ортақ бөлімді алған жоқ. Бірінші бөлшектің жаңа алымы ${p.newFirstNumerator}. Екінші бөлшектің жаңа жазуы қайсысы?`;
  z=`Бірінші көбейткіш ${p.newFirstNumerator} : ${n} = ${k}. Ол ортақ бөлімді ${d} × ${k} = ${common} деп анықтайды. Екінші көбейткіш ${common} : ${p.fractions[1][1]} = ${common/p.fractions[1][1]}, сондықтан екінші бөлшек ${a}. ${conversionProof(p.fractions,common)}. Ең кіші бөлім ${minimum} болса да, шарттағы жаңа алым басқа ${common} бөлімін бекітеді. Бірінші көбейткішті екінші бөлшекке көшірмейміз.`;break;
 }
 default:throw Error('Unknown common-denominator model '+kind);
 }
 if(!options)s+=' Жауапқа тек санды жазыңыз.';
 if(options){assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(x=>x===String(a)).length,1);}else assert.match(String(a),/^\d+$/);
 assert.ok(!/[\\$^]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(s=>[prefix+s.id,s]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,prefix+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:prefix+spec.id,modelId:prefix+spec.kind,grade:5,topic:'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Сақталған 3.6 тақырыбының 48 невизуалды бастапқы шарты, толық шешімі және барлық MCQ нұсқалары жеке оқылды. Әр дерекке бөлек қазақша редакция мен жаңа деректер жазылды. Көбейткіш пен жаңа алым, кез келген ортақ бөлім мен ең кіші бөлім, берілген рет және бүтін бөлікті сақтау талаптары ажыратылды.',
 'Шарттар гүлзар жобасы, екі оқушының тәсілі, жазбадағы алғашқы қате және кері түрлендіру арқылы жаңадан баяндалды. Математикалық қасиеттер сақталады. Алдын ала қысқарту қажет болатын тапсырмалар бөлек көрсетілді; белгісіз алымдардағы берілген бөлімдердің ЕКОЕ-сі қысқартусыз қолданылатыны нақтыланды.',
 '48 редакция мен model ID 48 тәуелсіз жаңа математикалық мағына деп саналмайды. Жауаптардың берілген бөлімі/реті тексеріледі: сандық мәні тең, бірақ ең кіші емес бөлімді нұсқалар дұрыс деп есептелмейді. Бөлшек/аралас/жұп/үштік жауаптар MCQ, ашық жауаптар тек бүтін сан. Барлық бөлшек пен аралас жазу native canonical түрде.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...(['choose-false-expansion-equality','locate-conversion-error-step'].includes(spec.kind)?{intentionalIncorrectExample:true}:{}),...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(row=>[row.editionId,row]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan','intentionalIncorrectExample'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const r=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(r[field]),'Unbound common-denominator '+field);assert.equal(row.answer,r.answer);return{answer:r.answer,checks:['all48 savedsource3.6 skills retained after complete source/fullsolution/options reading','statement/fullsolution/choices/answer and all fixedparams/source metadata exactbound','primepower proof of minimum, fixed/nonminimal denominators distinguished','wholeparts and ordered tuple positions preserved; strict bounds/irreducibility explicit','native canonical fractions/mixed/unicodepowers; integer-only free response','external independent review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All48 saved nonvisual grade5 topic3.6 sources individually rewritten offline; model/source variants not semantic uniqueness. Independent review pending.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-common-denominator.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
