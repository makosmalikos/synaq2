/** Individually rewritten saved3.2 fractions; offline drafts, never self-published. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-fraction-equivalence-specs.mjs';
const prefix='grade5-fraction-equivalence-';
const sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-2').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=ns=>ns.reduce((a,b)=>a+b,0),product=ns=>ns.reduce((a,b)=>a*b,1);
const one=ns=>{assert.equal(ns.length,1);return ns[0];};
const div=(a,b)=>{assert.ok(Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>0&&a%b===0,`Noninteger exact quantity ${a}:${b}`);return a/b;};
const gcd=(a,b)=>b?gcd(b,a%b):a,reduce=([n,d])=>{assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&n>0&&d>0);const g=gcd(n,d);return[n/g,d/g];};
const eq=([a,b],[c,d])=>b>0&&d>0&&a*d===c*b;
const side=x=>/^[0-9A-Za-z□⁰¹²³⁴⁵⁶⁷⁸⁹]+$/u.test(String(x))?String(x):`(${x})`,F=(n,d)=>`(${side(n)}/${side(d)})`,show=([n,d])=>F(n,d);
const superscript='⁰¹²³⁴⁵⁶⁷⁸⁹',pow=(base,e)=>String(base)+(e===1?'':String(e).split('').map(n=>superscript[n]).join(''));
const powerProduct=ps=>ps.map(([b,e])=>pow(b,e)).join(' × '),powerValue=ps=>product(ps.map(([b,e])=>b**e));
const fractionChoices=ps=>ps.map(show),divisors=n=>range(1,n).filter(d=>n%d===0);
function render(kind,p){let s,z,a,options;switch(kind){
 case'equivalent-choice':{
  a=show(one(p.choices.filter(q=>eq(q,p.fraction))));options=fractionChoices(p.choices);
  s=`Көрме сөресінің ${show(p.fraction)} бөлігіне оқушылар жасаған үлгілер қойылды. Осы үлесті басқа алым мен бөлім арқылы дұрыс көрсететін бөлшекті таңдаңдар.`;
  const[n,d]=p.fraction,[x,y]=one(p.choices.filter(q=>eq(q,p.fraction))),scale=div(x,n);assert.equal(d*scale,y);
  z=`Алым мен бөлімді БІРДЕЙ нөлден өзге санға көбейтсек, үлес өзгермейді. Мұнда ${n} × ${scale} = ${x}, ${d} × ${scale} = ${y}, сондықтан ${show(p.fraction)} = ${a}. Айқыш тексеру: ${n} × ${y} = ${n*y}, ${d} × ${x} = ${d*x}. Екі жаққа бір санды қосу немесе тек алымды көбейту бұл қасиетке жатпайды.`;break;
 }
 case'invalid-cancellation-factor':{
  const[n,d]=p.fraction;a=one(p.choices.filter(k=>n%k!==0||d%k!==0));options=p.choices.map(String);
  s=`${show(p.fraction)} бөлшегін қысқартқанда алым мен бөлім бірдей натурал санға қалдықсыз бөлінуі керек. Төмендегі сандардың қайсысына қысқартуға БОЛМАЙДЫ?`;
  z=p.choices.map(k=>n%k===0&&d%k===0?`${k}: ${n} : ${k} = ${n/k}, ${d} : ${k} = ${d/k}, екеуі де бүтін`:`${k}: ${d} : ${k} = ${d/k}, бірақ ${n} = ${k} × ${Math.floor(n/k)} + ${n%k}, алым қалдықсыз бөлінбейді`).join('; ')+`. Демек жауап ${a}. Бір ғана мүшенің бөлінуі жеткіліксіз.`;break;
 }
 case'greatest-cancellation-factor':case'hidden-common-prime':{
  const[n,d]=p.fraction,g=gcd(n,d);a=g;const common=divisors(n).filter(k=>d%k===0);
  s=kind==='hidden-common-prime'?`Жоба сызбасындағы ${show(p.fraction)} қатынасын мүмкіндігінше бірден қысқарту қажет. Алым мен бөлімді қандай ЕҢ ҮЛКЕН натурал санға бөлуге болады?`:`${show(p.fraction)} бөлшегінің алымы мен бөліміне ортақ бөлгіштердің ең үлкенін табыңдар. Яғни бөлшекті бір қадамда толық қысқартатын сан қандай?`;
  z=`${n} санының бөлгіштері: ${divisors(n).join(', ')}. Олардың ішінен ${d} санына да бөлгіш болатындары ${common.join(', ')}. Ең үлкені ${g}. ${n} = ${g} × ${n/g}, ${d} = ${g} × ${d/g}; ${n/g} және ${d/g} өзара жай. Сондықтан бірден ${g} санына бөлеміз, алынатыны ${show(reduce(p.fraction))}.`;break;
 }
 case'irreducible-choice':{
  const q=one(p.choices.filter(([n,d])=>gcd(n,d)===1));a=show(q);options=fractionChoices(p.choices);
  s='Қай бөлшектің алымы мен бөлімі өзара жай, яғни бөлшек қысқармайды?';
  z=p.choices.map(([n,d])=>`${F(n,d)}: ЕҮОБ(${n}, ${d}) = ${gcd(n,d)}`).join('; ')+`. Тек ${a} үшін ЕҮОБ 1. Оның екі мүшесінің де құрама болуы қысқаруға жеткіліксіз: ортақ жай бөлгіш қажет.`;break;
 }
 case'unknown-numerator-denominator-scale':case'equivalent-ask-numerator':case'equivalent-missing-numerator':{
  const[n,d]=p.fraction,scale=div(p.newDenominator,d);a=n*scale;
  s=kind==='unknown-numerator-denominator-scale'?`${F('x',p.newDenominator)} = ${show(p.fraction)} теңдігі орындалсын. x қандай сан?`:kind==='equivalent-ask-numerator'?`Өлшеу кестесіндегі ${show(p.fraction)} үлесі бөлімі ${p.newDenominator} болатын тең бөлшекпен жазылды. Жаңа бөлшектің алымы қандай?`:`${show(p.fraction)} = ${F('a',p.newDenominator)} теңдігіндегі a санын табыңдар.`;
  z=`Бөлім ${d} санынан ${p.newDenominator} санына ${p.newDenominator} : ${d} = ${scale} есе артты. Алым да сонша есе артады: ${n} × ${scale} = ${a}. Алынған теңдік ${F(a,p.newDenominator)} = ${show(p.fraction)}. Айқыш көбейтінділер ${a} × ${d} = ${a*d} және ${p.newDenominator} × ${n} = ${p.newDenominator*n} бірдей. Алымға бөлімдердің айырмасын қоспаймыз.`;break;
 }
 case'unknown-denominator-numerator-scale':{
  const[n,d]=p.fraction,scale=div(p.newNumerator,n);a=d*scale;s=`${show(p.fraction)} = ${F(p.newNumerator,'x')} теңдігіндегі x — оң натурал сан. Оның мәнін табыңдар.`;
  z=`Алым ${p.newNumerator} : ${n} = ${scale} есе артқан. Бөлім де ${d} × ${scale} = ${a} болуы керек. Тексеру: ${n} × ${a} = ${n*a}, ${d} × ${p.newNumerator} = ${d*p.newNumerator}. Тек бір мүшені өзгертуге болмайды.`;break;
 }
 case'reduce-selected-fraction':case'common-five-reduction':case'successive-halving-reduction':case'multi-prime-reduction':{
  const[n,d]=p.fraction,[rn,rd]=reduce(p.fraction),g=gcd(n,d);a=F(rn,rd);options=fractionChoices(p.choices);
  s=kind==='common-five-reduction'?`${show(p.fraction)} бөлшегінің екі мүшесі де 5 цифрымен аяқталады. Бөлшекті толық қысқартқан дұрыс жауапты таңдаңдар.`:kind==='successive-halving-reduction'?`Таспаның боялған үлесі ${show(p.fraction)} деп берілген. Оны қысқармайтын жай бөлшекпен жазыңдар.`:kind==='multi-prime-reduction'?`Экологиялық есепте ${show(p.fraction)} үлесі шықты. Осы үлестің толық қысқартылған түрін таңдаңдар.`:`${show(p.fraction)} бөлшегін толық қысқартқан нұсқаны таңдаңдар.`;
  if(kind==='successive-halving-reduction'){let x=n,y=d;const lines=[F(x,y)];while(x%2===0&&y%2===0){x/=2;y/=2;lines.push(F(x,y));}assert.equal(F(x,y),a);z=`Алым мен бөлімді бірге 2 санына бөлеміз: ${lines.join(' = ')}. Бірден ${g} санына бөлу де осы нәтиже береді.`;}
  else z=`Ортақ ең үлкен бөлгіш ${g}. Екі мүшені соған бөлеміз: ${n} : ${g} = ${rn}, ${d} : ${g} = ${rd}. Сондықтан ${show(p.fraction)} = ${a}.`;
  z+=` Соңғы ${rn} және ${rd} өзара жай, ЕҮОБ(${rn}, ${rd}) = 1. Бір мүшені ғана немесе екі мүшені әртүрлі санға бөліп қысқартуға болмайды.`;break;
 }
 case'fully-reduced-denominator':{
  const[n,d]=p.fraction,g=gcd(n,d),[rn,rd]=reduce(p.fraction);a=rd;s=`${show(p.fraction)} бөлшегі толық қысқартылды. Қысқармайтын бөлшектің бөлімі неше?`;
  z=`ЕҮОБ(${n}, ${d}) = ${g}. Екі мүшені ${g} санына бөлсек, ${show(p.fraction)} = ${F(rn,rd)}. ${rn} және ${rd} өзара жай болғандықтан әрі қарай қысқармайды. Сұралғаны соңғы бөлім ${rd}, қысқарту коэффициенті ${g} немесе соңғы алым ${rn} емес.`;break;
 }
 case'expansion-scale':{
  const[n,d]=p.fraction,[x,y]=p.expanded;a=div(x,n);assert.equal(d*a,y);s=`${show(p.fraction)} бөлшегін ${show(p.expanded)} бөлшегіне айналдырғанда алымын да, бөлімін де бірдей санға көбейтті. Ол қандай сан?`;
  z=`Алым бойынша ${x} : ${n} = ${a}; бөлім бойынша да ${y} : ${d} = ${a}. Сондықтан ортақ көбейткіш ${a}. Тексеру: ${n} × ${a} = ${x}, ${d} × ${a} = ${y}. Алымдардың немесе бөлімдердің айырмасы көбейткішті білдірмейді.`;break;
 }
 case'fraction-property-equation':{
  const[n,d]=p.fraction,k=p.factor;a=`${F(n,d)} = ${F(`${n} × ${k}`,`${d} × ${k}`)}`;options=[`${F(n,d)} = ${F(`${n} + ${k}`,`${d} + ${k}`)}`,`${F(n,d)} = ${F(`${n} × ${k}`,d)}`,a,`${F(n,d)} = ${F(`${n} − 1`,`${d} − 1`)}`];
  s='Қай теңдік бөлшектің негізгі қасиетін дұрыс қолданады?';
  z=`Негізгі қасиет: алым мен бөлімді бірдей нөлден өзге санға көбейту не бөлу керек. Сондықтан ${a}. Оның оң жағы ${F(n*k,d*k)} болып, ${k} санына қысқарғанда қайта ${F(n,d)} шығады. Басқа нұсқаларда екі мүшеге сан қосылған, тек алым көбейтілген немесе екі мүшеден сан азайтылған; бұлар үлесті сақтамайды.`;break;
 }
 case'crossed-prime-powers-denominator':{
  const n=powerValue(p.top),d=powerValue(p.bottom),[rn,rd]=reduce([n,d]);a=rd;
  s=`${F(powerProduct(p.top),powerProduct(p.bottom))} бөлшегін толық қысқартқанда бөлімінде қандай сан қалады?`;
  const factors=p.top.filter(([base])=>p.bottom.some(([b])=>b===base)).map(([base,e])=>[base,Math.min(e,p.bottom.find(([b])=>b===base)[1])]);
  z=`Екі жақта ортақ ${powerProduct(factors)} көбейткіші бар. Оны тек тұтас көбейтінділерден қысқартамыз. Алымда ${p.top.filter(([b,e])=>e>(p.bottom.find(([c])=>c===b)?.[1]||0)).map(([b,e])=>pow(b,e-(p.bottom.find(([c])=>c===b)?.[1]||0))).join(' × ')}, бөлімде ${p.bottom.filter(([b,e])=>e>(p.top.find(([c])=>c===b)?.[1]||0)).map(([b,e])=>pow(b,e-(p.top.find(([c])=>c===b)?.[1]||0))).join(' × ')} қалады. Нәтиже ${F(rn,rd)}. ${rn} және ${rd} өзара жай, сондықтан сұралған бөлім ${rd}. Тікелей тексеру: ${n} × ${rd} = ${d} × ${rn}.`;break;
 }
 case'equivalent-sum-denominator':{
  const[n,d]=reduce(p.fraction),scale=div(p.sum,n+d);a=d*scale;s=`Бөлшек ${show(p.fraction)} бөлшегіне тең. Оның алымы мен бөлімінің қосындысы ${p.sum}. Осы бөлшектің бөлімін табыңдар.`;
  z=`Тең бөлшектің алымы ${n} × k, бөлімі ${d} × k. Қосынды ${n+d} × k = ${p.sum}, сондықтан k = ${p.sum} : ${n+d} = ${scale}. Бөлім ${d} × ${scale} = ${a}, алым ${n*scale}. Тексеру: ${n*scale} + ${a} = ${p.sum} және ${F(n*scale,a)} = ${show(p.fraction)}.`;break;
 }
 case'whole-sum-fraction':{
  const n=sum(p.top),d=sum(p.bottom);a=show(reduce([n,d]));options=fractionChoices(p.choices);
  s=`${F(p.top.join(' + '),p.bottom.join(' + '))} өрнегін есептеп, қысқармайтын бөлшекті таңдаңдар.`;
  z=`Алымдағы толық қосынды ${p.top.join(' + ')} = ${n}, бөлімдегі толық қосынды ${p.bottom.join(' + ')} = ${d}. Сондықтан өрнек ${F(n,d)} = ${a}. Қосындыларда қайталанатын ${p.top[0]} қосылғышын жеке сызып тастауға болмайды: қысқартылатын нәрсе — екі тұтас санның ортақ көбейткіші. ${F(p.top[1],p.bottom[1])} бастапқы өрнекке тең емес.`;break;
 }
 case'all-three-equivalent-row':{
  const labels=p.choices.map(qs=>qs.map(show).join('; ')),correct=one(p.choices.flatMap((qs,i)=>qs.every(q=>eq(q,qs[0]))?[i]:[]));a=labels[correct];options=labels;
  s='Қай қатардағы ҮШ бөлшектің барлығы өзара тең? Бір ғана жұптың тең болуы жеткіліксіз.';
  z=p.choices.map((qs,i)=>`${i+1}-қатар: ${qs.map(q=>`${show(q)} = ${show(reduce(q))}`).join('; ')}`).join('. ')+`. Тек ${correct+1}-қатардың үш мүшесі бірдей қысқартылған бөлшек береді. Басқа қатарларда алғашқы екеуі тең болған күннің өзінде үшінші мүшені де тексереміз.`;break;
 }
 case'category-reduced-term-sum':{
  const[n,d]=reduce([p.selected,p.total]);a=n+d;s=`Жас зерттеушілер ${p.total} бақылау жазбасын жинады. Оның ${p.selected} жазбасы құстарға қатысты. Құстар туралы жазбалардың жалпы жинақтағы үлесін толық қысқартыңдар. Шыққан бөлшектің алымы мен бөлімінің қосындысы неше?`;
  z=`Ізделген үлес ${F(p.selected,p.total)}. ЕҮОБ(${p.selected}, ${p.total}) = ${gcd(p.selected,p.total)}, сондықтан толық қысқартылған түрі ${F(n,d)}. Содан кейін ғана ${n} + ${d} = ${a}. Қосылатыны бастапқы үлкен сандар емес, соңғы бөлшектің мүшелері.`;break;
 }
 case'least-denominator-strict-bound':{
  const[n,d]=reduce(p.fraction),scale=Math.floor(p.lowerExclusive/d)+1;a=d*scale;s=`${show(p.fraction)} бөлшегіне тең бөлшектің бөлімі ${p.lowerExclusive} санынан ҚАТАҢ ҮЛКЕН болсын. Осындай бөлімдердің ең кішісін табыңдар.`;
  z=`Бастапқы бөлшек қысқармайды, сондықтан кез келген тең бөлшектің мүшелері ${n} × k және ${d} × k, мұнда k — оң бүтін сан. Бөлімдер: ${range(1,scale).map(k=>k*d).join(', ')}. ${p.lowerExclusive} шеті рұқсат етілмейді. Алғашқы жарамды бөлім ${a}; оның алымы ${n*scale}. Тексеру: ${F(n*scale,a)} = ${show(p.fraction)} және ${a} > ${p.lowerExclusive}.`;break;
 }
 case'two-unknown-equivalences':{
  const[n,d]=p.fraction,x=div(p.middleDenominator,d)*n,y=div(p.lastNumerator,n)*d;a=`a = ${x}, b = ${y}`;options=p.choices.map(([x,y])=>`a = ${x}, b = ${y}`);
  s=`${show(p.fraction)} = ${F('a',p.middleDenominator)} = ${F(p.lastNumerator,'b')} теңдіктері орындалсын. a және b мәндерін бірге таңдаңдар.`;
  z=`Бірінші ауысуда бөлім ${p.middleDenominator} : ${d} = ${p.middleDenominator/d} есе өседі, сондықтан a = ${n} × ${p.middleDenominator/d} = ${x}. Екінші бөлшекте берілген алым ${p.lastNumerator} : ${n} = ${p.lastNumerator/n} есе өседі, сондықтан b = ${d} × ${p.lastNumerator/n} = ${y}. Тексеру: ${F(x,p.middleDenominator)} және ${F(p.lastNumerator,y)} екеуі де ${show(p.fraction)} бөлшегіне қысқарады. Екі белгісізді бірдей көбейткішпен табу шарт емес.`;break;
 }
 case'product-fraction-reduction':{
  const n=product(p.top),d=product(p.bottom),g=gcd(n,d);a=show(reduce([n,d]));options=fractionChoices(p.choices);
  s=`${F(p.top.join(' × '),p.bottom.join(' × '))} бөлшегін қысқармайтын түрде жазыңдар.`;
  z=`Алым ${p.top.join(' × ')} = ${n}, бөлім ${p.bottom.join(' × ')} = ${d}. ЕҮОБ(${n}, ${d}) = ${g}. Екі мүшені ${g} санына бөлсек, ${a} шығады. Балама қысқарту: ${p.top[0]} және ${p.bottom[0]} ортақ ${gcd(p.top[0],p.bottom[0])} көбейткішінен, ${p.top[1]} және ${p.bottom[1]} ортақ ${gcd(p.top[1],p.bottom[1])} көбейткішінен арылады; қалған ортақ көбейткіш те қысқартылады. Бөлшектің мәнін сақтайтын ортақ бөлуді ғана қолданамыз.`;break;
 }
 case'complement-reduced-numerator':{
  const left=p.total-p.selected,[n,d]=reduce([left,p.total]);assert.ok(left>0);a=n;
  s=`Мозаикада ${p.total} тақтайша бар: ${p.selected} көк, қалғанының бәрі ақ. Ақ тақтайшалардың барлық мозаикадағы үлесін толық қысқартыңдар. Соңғы бөлшектің алымы неше?`;
  z=`Алдымен ақ тақтайшалар: ${p.total} − ${p.selected} = ${left}. Бүтін мозаика ${p.total} тақтайша болғандықтан үлесі ${F(left,p.total)}. Алым мен бөлімді ${gcd(left,p.total)} санына бөлеміз: ${F(left,p.total)} = ${F(n,d)}. Жауап — соңғы алым ${n}, ақ тақтайшалардың бастапқы саны ${left} емес.`;break;
 }
 case'equivalence-and-sum-choice':{
  const[n,d]=reduce(p.fraction),scale=div(p.sum,n+d),target=[n*scale,d*scale];assert.ok(p.choices.every(q=>sum(q)===p.sum));a=show(target);options=fractionChoices(p.choices);
  s=`Алымы мен бөлімінің қосындысы ${p.sum} болатын және ${show(p.fraction)} бөлшегіне тең бөлшекті таңдаңдар. ЕКІ шарт та орындалуы керек.`;
  z=`Алдымен ${show(p.fraction)} = ${F(n,d)}. Тең бөлшекте алым ${n} × k, бөлім ${d} × k, қосынды ${n+d} × k = ${p.sum}. Демек k = ${scale}, сондықтан ${a}. Барлық нұсқада мүшелер қосындысы ${p.sum}, бірақ тек ${a} қажетті қатынасты сақтайды. Айқыш тексеру: ${target[0]} × ${p.fraction[1]} = ${target[0]*p.fraction[1]}, ${target[1]} × ${p.fraction[0]} = ${target[1]*p.fraction[0]}.`;break;
 }
 case'expanded-term-difference':{
  const[n,d]=p.fraction,scale=div(p.newDenominator,d),x=n*scale;a=p.newDenominator-x;
  s=`${show(p.fraction)} бөлшегіне тең бөлшектің бөлімі ${p.newDenominator}. Сол бөлшектің бөлімі алымынан неше санға артық?`;
  z=`Көбейткіш ${p.newDenominator} : ${d} = ${scale}. Алым ${n} × ${scale} = ${x}, демек жаңа бөлшек ${F(x,p.newDenominator)}. Сұралған айырма ${p.newDenominator} − ${x} = ${a}. Бастапқы ${d} − ${n} = ${d-n} айырмасын алу жеткіліксіз, өйткені екі мүше де ${scale} есе өзгерді.`;break;
 }
 case'equivalent-term-product':{
  const[n,d]=reduce(p.fraction),scale=one(range(1,p.product).filter(k=>n*d*k*k===p.product));a=d*scale;
  s=`Бөлшек ${show(p.fraction)} бөлшегіне тең. Алымы мен бөлімінің көбейтіндісі ${p.product}. Осы бөлшектің бөлімін табыңдар.`;
  z=`Қысқармайтын қатынас ${F(n,d)}, сондықтан мүшелер ${n} × k және ${d} × k. Көбейтінді ${n*d} × k² = ${p.product}, яғни k² = ${div(p.product,n*d)}. Оң бүтін k = ${scale}, өйткені ${scale} × ${scale} = ${scale*scale}. Бөлім ${d} × ${scale} = ${a}, алым ${n*scale}. Тексеру: ${n*scale} × ${a} = ${p.product}. Көбейтіндідегі коэффициентті k орнына алуға болмайды.`;break;
 }
 case'sequence-sum-strict-threshold':{
  const step=p.numeratorStep+p.denominatorStep;a=Math.floor(p.threshold/step)+1;s=`Ереже бойынша n-мүшенің алымы ${p.numeratorStep} × n, бөлімі ${p.denominatorStep} × n болатын бөлшектер жазылды: ${range(1,3).map(n=>F(p.numeratorStep*n,p.denominatorStep*n)).join(', ')}, … . Алымы мен бөлімінің қосындысы ${p.threshold} санынан ҚАТАҢ ҮЛКЕН болатын алғашқы мүшенің нөмірін табыңдар.`;
  z=`n-мүшедегі қосынды ${p.numeratorStep} × n + ${p.denominatorStep} × n = ${step} × n. ${a-1}-мүшеде қосынды ${step} × ${a-1} = ${step*(a-1)}, ол талапқа кірмейді. Келесі ${a}-мүшеде ${step} × ${a} = ${step*a} > ${p.threshold}. Қосынды әр қадамда ${step} санға өсетіндіктен, ең алғашқы нөмір ${a}. Мұндағы қосынды қысқартылған бөлшекте емес, берілген тізбектегі жазуда алынады.`;break;
 }
 case'gcd-known-reduced-lcm':{
  const[n,d]=p.reduced;assert.equal(gcd(n,d),1);const x=n*p.gcd,y=d*p.gcd;a=div(x*y,p.gcd);options=p.choices.map(String);
  s=`Оң натурал a және b сандары үшін ЕҮОБ(a, b) = ${p.gcd}. ${F('a','b')} бөлшегін толық қысқартқанда ${show(p.reduced)} шықты. ЕКОЕ(a, b) мәнін таңдаңдар.`;
  z=`Қысқартылған мүшелер ${n} және ${d} өзара жай. Ортақ көбейткіш дәл ЕҮОБ ${p.gcd}, сондықтан a = ${n} × ${p.gcd} = ${x}, b = ${d} × ${p.gcd} = ${y}. ЕКОЕ = ${x} × ${y} : ${p.gcd} = ${a}. Кері тексеру: ${a} : ${x} = ${a/x}, ${a} : ${y} = ${a/y}, көбейтіндіде ортақ ${p.gcd} көбейткіші екі рет ескерілгендіктен, оны бір рет қысқартамыз. ${x*y} жай көбейтіндісі ең кіші ортақ еселік емес.`;break;
 }
 case'odd-even-sums-ratio':{
  const odds=range(1,p.count).map(k=>2*k-1),evens=range(1,p.count).map(k=>2*k),n=sum(odds),d=sum(evens);a=show(reduce([n,d]));options=fractionChoices(p.choices);
  s=`A — алғашқы ${p.count} оң тақ санның қосындысы: ${odds.slice(0,3).join(' + ')} + … + ${odds.at(-1)}. B — алғашқы ${p.count} оң жұп санның қосындысы: ${evens.slice(0,3).join(' + ')} + … + ${evens.at(-1)}. ${F('A','B')} бөлшегінің толық қысқартылған мәнін таңдаңдар.`;
  z=`Тақ сандарды шетінен жұптаймыз: 1 + ${odds.at(-1)} = ${2*p.count}, 3 + ${odds.at(-2)} = ${2*p.count}; барлығы ${p.count/2} жұп, қосынды ${p.count/2} × ${2*p.count} = ${n}. Жұп сандарда 2 + ${evens.at(-1)} = ${2*p.count+2}; ${p.count/2} жұптың қосындысы ${p.count/2} × ${2*p.count+2} = ${d}. Демек ${F(n,d)} = ${a}. Қосылғыштарды бір-бірлеп сызып қысқартпаймыз.`;break;
 }
 case'factored-sum-over-product':{
  const n=p.common*sum(p.addends),d=product(p.denominatorFactors);a=show(reduce([n,d]));options=fractionChoices(p.choices);
  s=`${F(p.addends.map(v=>`${p.common} × ${v}`).join(' + '),p.denominatorFactors.join(' × '))} бөлшегін толық қысқартыңдар.`;
  const[b,c]=p.denominatorFactors;assert.equal(c%p.common,0);
  z=`Алымның ЕКІ қосылғышында да ${p.common} бар: ${p.addends.map(v=>`${p.common} × ${v}`).join(' + ')} = ${p.common} × (${p.addends.join(' + ')}) = ${p.common} × ${sum(p.addends)}. Бөлімдегі ${c} = ${c/p.common} × ${p.common}. Енді ортақ ${p.common} көбейткішін толық алым мен бөлімнен қысқартамыз: ${F(sum(p.addends),`${b} × ${c/p.common}`)} = ${a}. ${p.common} санын тек бір қосылғыштан қысқарту мәнді бұзар еді.`;break;
 }
 case'preserve-value-after-numerator-add':{
  const[n,d]=p.fraction,newN=n+p.numeratorAdded,newD=div(newN*d,n);a=newD-d;
  s=`${show(p.fraction)} бөлшегінің алымына ${p.numeratorAdded} қосылды. Бөлшектің мәні өзгермеуі үшін бөліміне неше қосу керек?`;
  z=`Жаңа алым ${n} + ${p.numeratorAdded} = ${newN}. Ол бастапқыдан ${newN} : ${n} = ${newN/n} есе үлкен. Жаңа бөлім де ${d} × ${newN/n} = ${newD} болуы керек. Демек бөлімге қосылатыны ${newD} − ${d} = ${a}. Тексеру: ${F(newN,newD)} = ${show(p.fraction)}. Алымға да, бөлімге де бірдей сан қосу жалпы жағдайда мәнді сақтамайды.`;break;
 }
 case'irreducible-offset-variable':{
  a=one(p.choices.filter(n=>gcd(n,n+p.offset)===1));options=p.choices.map(String);s=`${F('n',`n + ${p.offset}`)} бөлшегі қысқармайтын болуы үшін n орнына төмендегі сандардың қайсысын қою керек?`;
  z=p.choices.map(n=>`${F(n,n+p.offset)}: ЕҮОБ(${n}, ${n+p.offset}) = ${gcd(n,n+p.offset)}`).join('; ')+`. Тек n = ${a} үшін ортақ бөлгіш 1. Жалпы ортақ бөлгіш n және n + ${p.offset} сандарының айырмасы ${p.offset} санын да бөлуі керек; сондықтан n мен ${p.offset} өзара жай болуы жеткілікті. Алымның жай сан болуы міндетті емес.`;break;
 }
 case'linear-numerator-equivalence':{
  const[rn,rd]=reduce(p.right),target=div(p.denominator,rd)*rn;a=div(target+p.subtract,p.coefficient);
  s=`${F(`${p.coefficient}x − ${p.subtract}`,p.denominator)} = ${show(p.right)} теңдігіндегі x — оң натурал сан. x мәнін табыңдар.`;
  z=`Оң жақты қысқартамыз: ${show(p.right)} = ${F(rn,rd)} = ${F(target,p.denominator)}. Бөлімдер бірдей, сондықтан ${p.coefficient}x − ${p.subtract} = ${target}. Онда ${p.coefficient}x = ${target} + ${p.subtract} = ${target+p.subtract}, x = ${target+p.subtract} : ${p.coefficient} = ${a}. Бастапқы теңдікке қою: ${p.coefficient} × ${a} − ${p.subtract} = ${target}, ${F(target,p.denominator)} = ${show(p.right)}. Қысқарту тек бір жақтағы алымды өзгерту емес.`;break;
 }
 case'composite-base-power-reduction':{
  const n=p.base**p.exponent,d=powerValue(p.denominator);a=show(reduce([n,d]));options=fractionChoices(p.choices);
  s=`${F(pow(p.base,p.exponent),powerProduct(p.denominator))} бөлшегін толық қысқартыңдар.`;
  assert.equal(p.base,10);const e2=p.denominator.find(([b])=>b===2)[1],e5=p.denominator.find(([b])=>b===5)[1];assert.ok(e2>=p.exponent&&e5>=p.exponent);
  z=`10 = 2 × 5, сондықтан ${pow(10,p.exponent)} = ${pow(2,p.exponent)} × ${pow(5,p.exponent)}. Ортақ дәрежелерді қысқартқанда бөлімде ${pow(2,e2-p.exponent)} × ${pow(5,e5-p.exponent)} = ${d/n} қалады. Нәтиже ${a}. Тексеру: бастапқы алым ${n}, бөлім ${d}, ${d} : ${n} = ${d/n}. Дәрежелерді қысқартпас бұрын құрама негізді жай көбейткіштерге жіктейміз.`;break;
 }
 case'irreducible-numerator-domain':{
  const values=range(1,p.denominator-1).filter(k=>gcd(k,p.denominator)===1);a=values.length;
  s=`k — оң натурал сан, 1 ≤ k < ${p.denominator}. ${F('k',p.denominator)} дұрыс бөлшегі қысқармайтын болатындай k мәндері нешеу?`;
  z=`${p.denominator} = 2 × 3 × 5. Сондықтан k саны 2, 3, 5 сандарының ешбіріне бөлінбеуі керек. Толық 1–${p.denominator-1} аралығында жарамдылары ${values.join(', ')} — ${a} сан. 0 оң сан емес, ал ${p.denominator} жоғарғы шекке кірмейді әрі дұрыс бөлшек бермейді. Әр қалған мәннің бөліммен ЕҮОБ-ы 1.`;break;
 }
 case'repeated-two-digit-blocks':{
  assert.equal(p.repetitions,2);const n=p.topBlock*101,d=p.bottomBlock*101;a=show(reduce([n,d]));options=fractionChoices(p.choices);
  s=`${F(n,d)} бөлшегінің алымында ${p.topBlock} блогы, бөлімінде ${p.bottomBlock} блогы екі рет қайталанған. Бөлшекті толық қысқартыңдар.`;
  z=`${n} = ${p.topBlock} × 100 + ${p.topBlock} = ${p.topBlock} × 101; ${d} = ${p.bottomBlock} × 101. Ортақ 101 көбейткішін қысқартамыз: ${F(n,d)} = ${F(p.topBlock,p.bottomBlock)}. Қалған екі санның ЕҮОБ-ы ${gcd(p.topBlock,p.bottomBlock)}, сондықтан толық нәтиже ${a}. Бірдей цифрларды жай өшіру емес, 101 ортақ көбейткішін бөлу қолданылды.`;break;
 }
 case'correct-reduction-equation':{
  const labels=p.choices.map(({before,after})=>`${show(before)} = ${show(after)}`),i=one(p.choices.flatMap(({before,after},i)=>eq(before,after)?[i]:[]));a=labels[i];options=labels;
  s='Бөлшектерді қысқарту туралы қай теңдік дұрыс?';
  z=p.choices.map(({before,after},i)=>`${i+1}-нұсқада сол жақтың толық қысқарған түрі ${show(reduce(before))}; ұсынылған оң жақ ${show(after)}${eq(before,after)?' — сәйкес':' — сәйкес емес'}`).join('. ')+`. Дұрыс теңдік ${a}. Әр нұсқада алым мен бөлімнің айқыш көбейтінділері бірдей болуы қажет.`;break;
 }
 case'original-denominator-after-cancel':{
  const[n,d]=p.reduced;a=d*p.factor;s=`Бір бөлшектің алымы мен бөлімін ${p.factor} санына бөліп қысқартқанда ${show(p.reduced)} шықты. БАСТАПҚЫ бөлшектің бөлімі қандай сан еді?`;
  z=`Қысқарту амалына кері әрекет жасаймыз: бастапқы бөлім ${d} × ${p.factor} = ${a}, бастапқы алым ${n} × ${p.factor} = ${n*p.factor}. Тексеру: ${F(n*p.factor,a)} бөлшегінің екі мүшесін ${p.factor} санына бөлсек, ${show(p.reduced)} шығады. Сұралғаны бастапқы бөлім, соңғы бөлім ${d} емес.`;break;
 }
 case'two-stage-cancel-original-sum':{
  const[n,d]=p.reduced,scale=product(p.factors),x=n*scale,y=d*scale;a=x+y;s=`Бөлшектің алымы мен бөлімін алдымен ${p.factors[0]} санына, одан кейін алынған бөлшектің алымы мен бөлімін ${p.factors[1]} санына бөліп қысқартты. Соңында ${show(p.reduced)} шықты. Бастапқы бөлшектің алымы мен бөлімінің қосындысы неше?`;
  z=`Екі кезекті қысқартудың ортақ коэффициенті ${p.factors.join(' × ')} = ${scale}, олардың қосындысы емес. Бастапқы алым ${n} × ${scale} = ${x}, бөлім ${d} × ${scale} = ${y}; қосынды ${x} + ${y} = ${a}. Кері тізбек: ${F(x,y)} = ${F(div(x,p.factors[0]),div(y,p.factors[0]))} = ${show(p.reduced)}. Әр қадамда екі мүше бірдей санға бөлінді.`;break;
 }
 case'different-category-fraction':{
  const reduced=p.parts.map(reduce),i=one(reduced.flatMap((q,i)=>reduced.filter(r=>eq(q,r)).length===1?[i]:[]));a=p.names[i];options=[...p.names,'Үшеуінің үлесі де бірдей'];
  s=`Үш оқушы тапсырмаларын орындап жатыр. ${p.names.map((name,i)=>`${name} ${p.parts[i][1]} тапсырманың ${p.parts[i][0]} тапсырмасын`).join(', ')} орындады. Кімнің орындаған ҮЛЕСІ қалған екеуінің үлесінен өзгеше?`;
  z=p.names.map((name,i)=>`${name}: ${show(p.parts[i])} = ${show(reduced[i])}`).join('; ')+`. Алғашқы екі үлес тең, ${p.names[i]} орындаған үлес өзгеше. Мұнда орындалған тапсырмалардың жай сандары емес, әр оқушының ӨЗ жинағына қатысты бөлшектері салыстырылды.`;break;
 }
 case'equivalent-denominator-upper-count':{
  const[n,d]=reduce(p.fraction),max=Math.floor((p.upperExclusive-1)/d);a=max;
  s=`${show(p.fraction)} бөлшегіне тең, алымы мен бөлімі оң натурал сандар болатын бөлшектердің бөлімі ${p.upperExclusive} санынан КІШІ болуы керек. Осындай бөлшектер нешеу? Бірдей жазу бір рет саналады.`;
  z=`Бастапқы бөлшек ${F(n,d)} түріне қысқарады. Сондықтан барлық жазу ${F(`${n}k`,`${d}k`)} түрінде, k — оң бүтін сан. Бөлімдер ${range(1,max).map(k=>d*k).join(', ')} — ${max} мән. Келесі ${d*(max+1)} саны ${p.upperExclusive} шегіне жетеді немесе асады, сондықтан кірмейді. Нөл және теріс масштаб жоқ. Әр бөлімге дәл бір ${n}k алымы сәйкес.`;break;
 }
 case'overlapping-product-ranges':{
  const ns=range(...p.numerator),ds=range(...p.denominator),common=ns.filter(n=>ds.includes(n)),leftN=ns.filter(n=>!common.includes(n)),leftD=ds.filter(n=>!common.includes(n));a=show(reduce([product(ns),product(ds)]));options=fractionChoices(p.choices);
  s=`${F(ns.join(' × '),ds.join(' × '))} бөлшегін толық қысқартыңдар.`;
  z=`Алымда да, бөлімде де ${common.join(' × ')} тұтас көбейтіндісі бар. Оны қысқартқанда алымда ${leftN.join(' × ')}, бөлімде ${leftD.join(' × ')} қалады: ${F(product(leftN),leftD.join(' × '))} = ${a}. Бөлімнің соңғы екі көбейткішін де сақтау керек; біреуін ғана қалдыру бастапқы үлесті өзгертеді. Соңғы алым мен бөлім өзара жай.`;break;
 }
 case'same-addition-changes-value':{
  const[n,d]=p.before,[rn,rd]=p.after,denom=d*rn-n*rd,scale=div(p.added*(rd-rn),denom);
  a=d*scale;const x=n*scale,y=d*scale;
  s=`Бастапқы бөлшек ${show(p.before)} бөлшегіне тең. Оның алымына да, бөліміне де ${p.added} қосқанда ${show(p.after)} шықты. Бастапқы бөлшектің бөлімін табыңдар.`;
  z=`Бастапқы алым ${n} × k, бөлім ${d} × k. Екеуіне ${p.added} қоссақ, ${F(`${n}k + ${p.added}`,`${d}k + ${p.added}`)} = ${show(p.after)}. Айқыш көбейтеміз: ${rd} × (${n}k + ${p.added}) = ${rn} × (${d}k + ${p.added}), яғни ${rd*n}k + ${rd*p.added} = ${rn*d}k + ${rn*p.added}. Сонда ${rd*p.added-rn*p.added} = ${rn*d-rd*n===1?'k':String(rn*d-rd*n)+'k'}, k = ${scale}. Бастапқы бөлім ${d} × ${scale} = ${a}. Тексеру: бастапқы ${F(x,y)} = ${show(p.before)}, өзгергені ${F(x+p.added,y+p.added)} = ${show(p.after)}. Бірдей санды қосу мәнді сақтамайтыны осыдан көрінеді.`;break;
 }
 case'geometric-power-sums-ratio':{
  const n=sum(p.top.map(e=>p.base**e)),d=sum(p.bottom.map(e=>p.base**e));a=show(reduce([n,d]));options=fractionChoices(p.choices);
  s=`${F(p.top.map(e=>pow(p.base,e)).join(' + '),p.bottom.map(e=>pow(p.base,e)).join(' + '))} бөлшегін толық қысқартыңдар.`;
  const loN=Math.min(...p.top),loD=Math.min(...p.bottom);assert.ok(p.top.includes(loN+1)&&p.bottom.includes(loD+1)&&loD>loN);
  z=`Алымдағы ең кіші ортақ дәреже ${pow(p.base,loN)}: толық алым ${pow(p.base,loN)} × (${p.base} + 1). Бөлім ${pow(p.base,loD)} × (${p.base} + 1). Екі тұтас көбейтіндінің ортақ (${p.base} + 1) және ${pow(p.base,loN)} көбейткіштері қысқарады. Бөлімде ${pow(p.base,loD-loN)} = ${p.base**(loD-loN)} қалады, сондықтан жауап ${a}. Қосылғыштарды бір-бірімен жеке қысқартуға болмайды.`;break;
 }
 case'both-terms-digit-bound-count':{
  const[n,d]=p.reduced,lo=10**(p.digits-1),hi=10**p.digits-1;assert.equal(gcd(n,d),1);const min=Math.max(Math.ceil(lo/n),Math.ceil(lo/d)),max=Math.min(Math.floor(hi/n),Math.floor(hi/d));a=max-min+1;
  s=`Алымы да, бөлімі де ${p.digits} таңбалы оң натурал сандар болатын бөлшек толық қысқартылғанда ${show(p.reduced)} шығады. Осындай бастапқы бөлшектер нешеу? Әр түрлі алым-бөлім жұбы бір рет саналады.`;
  z=`Әр жұп ${F(`${n}k`,`${d}k`)} түрінде, k — оң бүтін сан. Алым мен бөлімнің ЕКЕУІ де ${lo}–${hi} аралығында болуы керек. k = ${min-1} болса, алым ${n*(min-1)} төменгі шекке жетпейді; k = ${min} болса, мүшелер ${n*min} және ${d*min}, екеуі де жарамды. k = ${max} кезінде ${n*max} және ${d*max} әлі жарамды; k = ${max+1} кезінде бөлім ${d*(max+1)} жоғарғы шектен асады. Сондықтан k = ${min}, …, ${max}; саны ${max} − ${min} + 1 = ${a}. Екі шет те есепке алынады.`;break;
 }
 default:throw Error('Unsupported saved fraction equivalence '+kind);
 }
 assert.ok(s&&z);if(options){options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else{assert.match(String(a),/^\d+$/);s+=' Жауапқа тек санды жазыңыз.';}
 assert.ok(!/[\\$^]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(spec=>[prefix+spec.id,spec]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,prefix+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:prefix+spec.id,modelId:prefix+spec.kind,grade:5,topic:spec.kind==='sequence-sum-strict-threshold'?'seq':'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Барлық 47 сақталған бастапқы шарт, толық шешім және барлық жауап нұсқалары жеке оқылды. Тең бөлшекті кеңейту, толық қысқарту, қосылғыш пен көбейткішті ажырату, екі белгісізді бөлек табу, қатаң шек және екі мүшенің де цифрлық шектері сақталды.',
 'Әр дереккөз үшін жаңа қазақша редакция және өзгертілген деректер жазылды; бақылау жазбалары, мозаика, көрме секторы мен оқушы тапсырмалары сияқты жағдайлар жаңартылды. Математикалық анықтамалар мен бірдей мәнді сақтау қасиеті өзгермейді.',
 '47 редакция мен model ID 47 бөлек математикалық мағына дегенді білдірмейді. Бөлшек пен бірнеше саннан тұратын жауаптар MCQ арқылы беріледі; ашық жауаптар тек бүтін сан. Барлық бөлшек MathText үшін айқын native canonical топпен, дәрежелер Unicode жоғары индекспен жазылған.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(row=>[row.editionId,row]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const field of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[field]),canonicalEdition(e[field]));const r=renderEdition(row);for(const field of['statement','solution','options'])assert.equal(canonicalEdition(row[field]),canonicalEdition(r[field]),'Unbound equivalence '+field);assert.equal(row.answer,r.answer);return{answer:r.answer,checks:['individual source3.2 skill and exact numeric parameters bound','full numerator and denominator grouping; common FACTORS not addends cancelled','strict and inclusive scale domains independently enumerable','integer-only free keys; canonical native fraction choices and Unicode powers','all condition solution choices and source metadata exact-bound','independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All47 saved nonvisual grade5 topic3.2 sources individually rewritten offline; source coverage/model counts are not semantic uniqueness. Awaiting independent review.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(row=>row.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-fraction-equivalence.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
