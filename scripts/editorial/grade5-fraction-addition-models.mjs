/** Saved3.8 source-specific drafts. External editorial review required before publication. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {canonicalEdition} from './edition-review.mjs';
import {grade5Sources} from './grade5-inventory.mjs';
import {SPECS} from './grade5-fraction-addition-specs.mjs';
const prefix='grade5-fraction-addition-',sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-8').map(q=>[q.sourceId,q]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=xs=>xs.reduce((a,b)=>a+b,0),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a),lcm=(a,b)=>a/gcd(a,b)*b,div=(a,b)=>{assert.equal(a%b,0);return a/b;};
const norm=([n,d])=>{assert.ok(Number.isInteger(n)&&Number.isInteger(d)&&d>0);const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>norm([a[0]*b[1]+b[0]*a[1],a[1]*b[1]]),sub=(a,b)=>norm([a[0]*b[1]-b[0]*a[1],a[1]*b[1]]),scale=(q,k)=>norm([q[0]*k,q[1]]),cmp=(a,b)=>a[0]*b[1]-b[0]*a[1];
const side=x=>/^[0-9A-Za-z□]+$/.test(String(x))?String(x):`(${x})`,F=(n,d)=>`(${side(n)}/${side(d)})`,Q=q=>F(...q),M=(w,n,d)=>`(${w} + ${F(n,d)})`,mixed=q=>q[0]%q[1]===0?String(q[0]/q[1]):q[0]>q[1]?M(Math.floor(q[0]/q[1]),q[0]%q[1],q[1]):Q(q);
const expression=([a,op,b])=>`${Q(a)} ${op} ${Q(b)}`,evaluate=([a,op,b])=>op==='+'?add(a,b):sub(a,b),list=xs=>xs.join(', ');
function commonProof(qs,ops=qs.slice(1).map(()=>'+')){
 const d=qs.map(q=>q[1]).reduce(lcm,1),ns=qs.map(([n,b])=>n*div(d,b));let n=ns[0];for(let i=1;i<ns.length;i++)n+=ops[i-1]==='+'?ns[i]:-ns[i];const value=norm([n,d]);
 return{d,ns,value,text:`Ортақ бөлім ${d}. ${qs.map((q,i)=>`${Q(q)} = ${F(ns[i],d)}`).join('; ')}. ${ns.map((n,i)=>(i?` ${ops[i-1]} `:'')+n).join('')} = ${n}, сондықтан нәтиже ${F(n,d)}${gcd(n,d)>1?` = ${Q(value)}`:''}.`};
}
const uniqueOptions=(correct,others)=>{const opts=[correct,...others];assert.equal(opts.length,4);assert.equal(new Set(opts).size,4);return opts;};
const fractionOptions=(q,others,asMixed=false)=>uniqueOptions(asMixed?mixed(q):Q(q),others.map(x=>Array.isArray(x)?Q(x):String(x)));
function render(kind,p){
 let s,z,a,options,flags={};
 switch(kind){
 case'same-denominator-difference-numerator':{
  const n=p.first-p.second;assert.ok(n>0&&gcd(n,p.denominator)===1);a=n;s=`${F(p.first,p.denominator)} − ${F(p.second,p.denominator)} амалын орындаңыз. Нәтижені қысқартылмайтын бөлшекпен жазғанда оның АЛЫМЫ неше?`;
  z=`Бөлім ${p.denominator} өзгермейді, алымдар азайтылады: ${p.first} − ${p.second} = ${n}. Айырма ${F(n,p.denominator)}. ${n} мен ${p.denominator} сандарының 1-ден өзге ортақ бөлгіші жоқ. Сұралған алым ${n}; бөлімді жауапқа қоспаймыз.`;break;
 }
 case'mixed-sum-fractional-numerator':{
  const proof=commonProof(p.fractions),[n,d]=proof.value,w=Math.floor(n/d);assert.ok(w>0&&n%d>0);a=n%d;s=`${p.fractions.map(Q).join(' + ')} қосындысын қысқартылмайтын бөлшек бөлігі бар аралас санға айналдырыңыз. Тек БӨЛШЕК БӨЛІКТІҢ алымын табыңыз.`;
  z=`${proof.text} ${n} = ${d} × ${w} + ${a}, демек ${Q(proof.value)} = ${M(w,a,d)}. Сұрақ толық алым ${n} туралы емес, аралас санның бөлшек бөлігіндегі ${a} туралы.`;break;
 }
 case'choose-true-fraction-operation':{
  options=p.equations.map(([l,op,r,result])=>`${expression([l,op,r])} = ${Q(result)}`);a=one(options.filter((_,i)=>{const[l,op,r,result]=p.equations[i];return cmp(evaluate([l,op,r]),result)===0;}));s='Әр жолдағы қосу не азайтуды тексеріңіз. Тек бір теңдік шын, қалғандарына қате нәтижелер әдейі жазылған. Шын теңдікті таңдаңыз.';
  z=p.equations.map(([l,op,r,result],i)=>{const v=evaluate([l,op,r]);return`${expression([l,op,r])} = ${Q(v)}; ұсынылған ${Q(result)} ${cmp(v,result)===0?'осы мәнге тең':'осы мәнге тең емес'}.`;}).join(' ')+` Сондықтан дұрыс жол: ${a}. Бірдей бөлімдер қосылмайды, әртүрлі бөлімдер алдымен ортақ бөлімге келтіріледі.`;flags.intentionalIncorrectExample=true;break;
 }
 case'reduced-difference-denominator':case'reduced-difference-terms-sum':{
  const proof=commonProof(p.fractions,['−']),[n,d]=proof.value;a=kind==='reduced-difference-denominator'?d:n+d;s=kind==='reduced-difference-denominator'?`${p.fractions.map(Q).join(' − ')} айырмасын толық қысқартыңыз. Соңғы бөлшектің БӨЛІМІН жазыңыз.`:`${p.fractions.map(Q).join(' − ')} айырмасын қысқартылмайтын ${F('a','b')} түріне келтіріңіз. a + b неге тең?`;
  z=`${proof.text} Соңғы ${Q(proof.value)} бөлшегінде ЕҮОБ(${n}, ${d}) = 1. `+(kind==='reduced-difference-denominator'?`Бөлім ${d}; қысқартуға дейінгі ${proof.d} бөлімін автоматты түрде жауап деп алмаймыз.`:`a = ${n}, b = ${d}, сондықтан a + b = ${n} + ${d} = ${a}. Тек алымды не тек бөлімді жазу сұраққа жауап бермейді.`);break;
 }
 case'same-denominator-sum':case'same-denominator-sum-reduce':{
  const q=norm([p.first+p.second,p.denominator]);a=Q(q);options=fractionOptions(q,kind==='same-denominator-sum'?[[p.first+p.second,2*p.denominator],[p.second-p.first,p.denominator],[p.first*p.second,p.denominator**2]]:[[p.first+p.second,2*p.denominator],[p.first-p.second,p.denominator],[p.first*p.second,p.denominator**2]]);s=`${F(p.first,p.denominator)} + ${F(p.second,p.denominator)} қосындысының ${kind==='same-denominator-sum-reduce'?'толық қысқартылған ':'дұрыс '}мәнін таңдаңыз.`;
  z=`Бірдей бөлім ${p.denominator} сақталады: ${p.first} + ${p.second} = ${p.first+p.second}. Қосынды ${F(p.first+p.second,p.denominator)}${gcd(p.first+p.second,p.denominator)>1?` = ${a}; алым мен бөлім ${gcd(p.first+p.second,p.denominator)} санына бөлінді`:`, ол қысқармайды`}. Бөлімдерді қосу не бөлшектерді көбейту бұл амалға сәйкес емес.`;break;
 }
 case'one-minus-proper-fraction':{
  const[n,d]=p.fraction,q=sub([1,1],p.fraction);a=Q(q);options=uniqueOptions(a,[Q(p.fraction),M(1,n,d),String(d-n)]);s=`Бір бүтіннен ${Q(p.fraction)} алынды. Қалған шаманы бөлшек түрінде көрсетіңіз.`;
  z=`Бір бүтін ${F(d,d)} санына тең. ${F(d,d)} − ${Q(p.fraction)} = ${F(d-n,d)}${d-n===q[0]?'':` = ${a}`}. ${d-n} — алымдардың айырмасы ғана; бөлімді тастауға болмайды. Дұрыс жауап ${a}.`;break;
 }
 case'remaining-original-equal-pieces':{
  a=p.parts-p.first-p.second;assert.ok(a>0);s=`Балшықтан жасалған жолақ ${p.parts} тең ұяшыққа бөлінген. Бір бұйымға жолақтың ${F(p.first,p.parts)}, екіншісіне ${F(p.second,p.parts)} бөлігі жұмсалды. Бастапқы өлшемдегі неше ұяшық пайдаланылмай қалды?`;
  z=`Екі бұйымға ${p.first} + ${p.second} = ${p.first+p.second} ұяшық жұмсалды. Қалған үлес ${F(p.parts,p.parts)} − ${F(p.first+p.second,p.parts)} = ${F(a,p.parts)}. Әр бастапқы ұяшық ${F(1,p.parts)}, сондықтан ${a} ұяшық қалды. Тексеру: ${p.first} + ${p.second} + ${a} = ${p.parts}.`;break;
 }
 case'unknown-subtrahend-numerator':{
  a=p.minuend-p.difference;assert.ok(a>0);s=`${F(p.minuend,p.denominator)} − ${F('x',p.denominator)} = ${F(p.difference,p.denominator)}. Теңдіктегі натурал x санын табыңыз.`;
  z=`Белгісіз азайтқышты табу үшін азайғыштан айырманы аламыз: ${F('x',p.denominator)} = ${F(p.minuend,p.denominator)} − ${F(p.difference,p.denominator)} = ${F(a,p.denominator)}. Бірдей бөлімдердегі алымдар тең, x = ${a}. Кері тексеру: ${p.minuend} − ${a} = ${p.difference}.`;break;
 }
 case'three-same-denominator-make-one':{
  assert.equal(sum(p.numerators),p.denominator);a=1;s=`${p.numerators.map(n=>F(n,p.denominator)).join(' + ')} қосындысының мәнін табыңыз.`;
  z=`Үш бөлім де ${p.denominator}, сондықтан алымдарды қосамыз: ${p.numerators.join(' + ')} = ${sum(p.numerators)}. Қосынды ${F(sum(p.numerators),p.denominator)} = 1. Әрқайсысының бөлімін қайта қосу бүтіннің өлшемін өзгертіп жіберер еді.`;break;
 }
 case'unlike-difference-small-unit':case'coprime-denominator-sum':case'shared-factor-denominator-sum':case'reduce-both-before-addition':{
  const subtract=kind==='unlike-difference-small-unit',qs=p.fractions,proof=commonProof(qs,[subtract?'−':'+']),q=proof.value;let distractors;
  if(subtract)distractors=[String(div(qs[0][0]-qs[1][0],qs[0][1]-qs[1][1])),Q([qs[0][0]-qs[1][0],proof.d]),mixed(add(...qs))];
  else if(kind==='coprime-denominator-sum')distractors=[Q([sum(qs.map(q=>q[0])),sum(qs.map(q=>q[1]))]),Q(norm([qs[0][0]*(proof.d/qs[0][1])+qs[1][0],proof.d])),Q(norm([qs[0][0]*qs[1][0],qs[0][1]*qs[1][1]]))];
  else if(kind==='shared-factor-denominator-sum')distractors=[Q(norm([sum(qs.map(q=>q[0])),sum(qs.map(q=>q[1]))])),Q(norm([qs[0][0]+qs[1][0]*(proof.d/qs[1][1]),proof.d])),Q(norm([qs[0][0]*qs[1][0],qs[0][1]*qs[1][1]]))];
  else{const reduced=qs.map(norm);distractors=[Q([sum(qs.map(q=>q[0])),sum(qs.map(q=>q[1]))]),Q(norm([sum(reduced.map(q=>q[0])),sum(reduced.map(q=>q[1]))])),Q(sub(...reduced))];}
  a=Q(q);options=uniqueOptions(a,distractors);s=kind==='reduce-both-before-addition'?`${qs.map(Q).join(' + ')} қосындысын есептеңіз. Ортақ бөлім іздеуден бұрын ЕКІ бөлшекті де қысқартып алыңыз.`:`${qs.map(Q).join(subtract?' − ':' + ')} өрнегінің дұрыс мәнін таңдаңыз.`;
  const reduced=qs.map(norm),small=commonProof(reduced,[subtract?'−':'+']);z=kind==='reduce-both-before-addition'?`Алдымен ${qs.map((q,i)=>`${Q(q)} = ${Q(reduced[i])}, себебі ЕҮОБ(${q[0]}, ${q[1]}) = ${gcd(...q)}`).join('; ')}. Енді ${small.text} Қысқартпай алсақ ортақ бөлім ${proof.d} болар еді, ал алдын ала қысқартқанда ${small.d} жеткілікті.`:(kind==='shared-factor-denominator-sum'?'18 = 2 × 3², 24 = 2³ × 3. Әр жай санның ең үлкен дәрежесін алып, ЕКОЕ(18, 24) = 2³ × 3² = 72 табамыз. ':'')+`${proof.text} `+(kind==='shared-factor-denominator-sum'?`Бөлімдерде ортақ бөлгіш бар: ${qs[0][1]} × ${qs[1][1]} = ${qs[0][1]*qs[1][1]} саны ең кіші ортақ бөлім емес. `:'')+`Толықтауыш көбейткіш алымға да, бөлімге де қолданылады. Дұрыс жауап ${a}.`;break;
 }
 case'two-uses-of-original-paint':{
  const proof=commonProof(p.fractions),q=proof.value;a=Q(q);options=fractionOptions(q,[[2,7],[1,3],[5,54]]);s=`Шеберхана бір ыдыстағы бастапқы бояудың ${Q(p.fractions[0])} бөлігін плакаттарға, ${Q(p.fractions[1])} бөлігін макеттерге жұмсады. Екі үлес те БАСТАПҚЫ бояуға қатысты, қолданылған бөліктер қабыспайды. Барлығы бастапқы бояудың қандай бөлігі жұмсалды?`;
  z=`Екі бөлек шығынды бір бастапқы бүтінге қатысты қосамыз. ${proof.text} Екінші үлес бірінші шығыннан кейінгі қалдыққа емес, бастапқы бояуға берілген. Сондықтан көбейту емес, қосу керек; жұмсалғаны ${a}.`;break;
 }
 case'sum-fixed-denominator-numerator':{
  const proof=commonProof(p.fractions),[n,d]=proof.value;a=div(n*p.denominator,d);s=`${p.fractions.map(Q).join(' + ')} қосындысын бөлімі ДӘЛ ${p.denominator} болатын бөлшекпен жазыңыз. Осы жазудағы алым қандай?`;
  z=`Берілген ${p.denominator} саны ${p.fractions.map(q=>q[1]).join(' және ')} бөлімдерінің әрқайсысына қалдықсыз бөлінеді. ${proof.text} Берілген бөліммен қосынды ${F(a,p.denominator)}. Сұралған алым ${a}; бөлімді өзге санға ауыстырмаймыз.`;break;
 }
 case'two-activities-extra-hours-to-minutes':{
  const second=add(p.first,p.extra),total=add(p.first,second);a=div(total[0]*60,total[1]);s=`Айша қыш бұйымын жасауға ${Q(p.first)} сағат жұмсады. Дина осындай өз бұйымын жасауға Айшадан ${Q(p.extra)} сағат артық уақыт жұмсады. Екі қыздың жұмсаған уақыттарын қосқанда неше минут шығады?`;
  z=`Динаның уақыты: ${commonProof([p.first,p.extra]).text} Екі уақыттың қосындысы: ${commonProof([p.first,second]).text} 1 сағат 60 минут болғандықтан ${Q(total)} сағат = ${total[0]} × 60 : ${total[1]} = ${a} минут. Айшаның уақытын екінші рет қосу қажет: тек Динаның уақытын сұрап тұрған жоқ.`;break;
 }
 case'repair-added-denominators':{
  const qs=p.fractions,proof=commonProof(qs),wrong=[sum(qs.map(q=>q[0])),sum(qs.map(q=>q[1]))];a=Q(proof.value);options=uniqueOptions(a,[Q(wrong),F(sum(qs.map(q=>q[0])),proof.d),F(qs[0][0]*qs[1][0],qs[0][1]*qs[1][1])]);s=`Нұрбек «${qs.map(Q).join(' + ')} = ${Q(wrong)}» деп жазды. Бұл — алымдарды және бөлімдерді жеке қосқан ӘДЕЙІ ҚАТЕ мысал. Оның орнына қай дұрыс қосынды жазылуы керек?`;
  z=`Бөлімдерді бөлек қосуға болмайды: ${qs[0][1]} + ${qs[1][1]} = ${wrong[1]} жаңа бөлімін алу қосу ережесі емес. ${proof.text} Бірінші қосылғыш ${Q(qs[0])} жартыдан үлкен, ал қате ${Q(wrong)} жартыға тең; оң бөлшек қосқанда мән кеми алмайды. Дұрысы ${a}.`;flags.intentionalIncorrectExample=true;break;
 }
 case'three-operation-unit-denominator':{
  const proof=commonProof(p.fractions,['−','+']);assert.equal(proof.value[0],1);a=proof.value[1];s=`${Q(p.fractions[0])} − ${Q(p.fractions[1])} + ${Q(p.fractions[2])} өрнегі толық қысқартылғанда ${F(1,'n')} болады. Натурал n санын анықтаңыз.`;
  z=`Амал таңбаларын сақтап ортақ бөлімге келтіреміз. ${proof.text} Қысқартылған нәтиже ${F(1,a)}, сондықтан n = ${a}. Екінші бөлшек азайтылады, үшіншісі қосылады; барлығын қосу басқа өрнек болар еді.`;break;
 }
 case'parallel-completion-time':{
  const q=add([1,p.firstHours],[1,p.secondHours]);a=div(q[1],q[0]);s=`Екі бригада бір алаңды жөндей алады: біріншісі жалғыз ${p.firstHours} сағатта, екіншісі жалғыз ${p.secondHours} сағатта бітіреді. Екеуінің өнімділігі тұрақты; қатар жұмыс істегенде атқарған бөліктері қабыспайды. Бірге бір мезгілде бастаса, алаңды неше сағатта жөндейді?`;
  z=`Бір сағаттағы үлестер ${F(1,p.firstHours)} және ${F(1,p.secondHours)}. ${commonProof([[1,p.firstHours],[1,p.secondHours]]).text} Бір сағатта ${Q(q)} жұмыс біткендіктен, толық жұмыс ${a} сағатта орындалады. Тексеру: ${F(a,p.firstHours)} + ${F(a,p.secondHours)} = 1. Жеке уақыттарды қосу ортақ өнімділікті бермейді.`;break;
 }
 case'unknown-unit-addend-denominator':{
  const proof=commonProof([p.total,p.known],['−']);assert.equal(proof.value[0],1);a=proof.value[1];s=`${Q(p.known)} + ${F(1,'b')} = ${Q(p.total)} теңдігінде b — натурал сан. Оның мәнін табыңыз.`;
  z=`Белгісіз қосылғыш: ${F(1,'b')} = ${Q(p.total)} − ${Q(p.known)}. ${proof.text} Сондықтан b = ${a}. Кері қою: ${commonProof([p.known,[1,a]]).text} Нәтиже бастапқы оң жақпен бірдей.`;break;
 }
 case'unknown-minuend-fraction':{
  const proof=commonProof([p.subtrahend,p.difference]),q=proof.value;a=Q(q);options=fractionOptions(q,[[1,36],[2,5],[35,216]]);s=`x − ${Q(p.subtrahend)} = ${Q(p.difference)} теңдеуін қанағаттандыратын x санын таңдаңыз.`;
  z=`Белгісіз азайғыш айырма мен азайтқыштың қосындысына тең. ${proof.text} Демек x = ${a}. Тексеру: ${commonProof([q,p.subtrahend],['−']).text} Бұл берілген айырмаға тең; азайтқышты қайта азайтуға болмайды.`;break;
 }
 case'two-packets-extra-mass':{
  const second=add(p.first,p.extra),total=add(p.first,second);a=mixed(total);options=uniqueOptions(a,[mixed(second),mixed(scale(p.first,2)),Q(sub(p.first,p.extra))]);s=`Бірінші қапшықта ${Q(p.first)} кг тұқым бар. Екінші қапшықта біріншіден ${Q(p.extra)} КИЛОГРАММ артық тұқым бар. Екеуінің жалпы массасын таңдаңыз.`;
  z=`Екінші қапшық: ${commonProof([p.first,p.extra]).text} Барлық масса: ${commonProof([p.first,second]).text} ${Q(total)} = ${a} кг. Қосымша шама бірінші массаның үлесі емес, жеке килограмм өлшемімен берілген. Тек екінші қапшықтың массасын жауап деп алмаймыз.`;break;
 }
 case'mass-difference-grams':{
  const proof=commonProof([p.first,p.second],['−']);a=div(proof.value[0]*1000,proof.value[1]);s=`Дина ${Q(p.first)} кг, Мерей ${Q(p.second)} кг таңқурай жинады. Дина жинаған таңқурай неше ГРАММ артық?`;
  z=`Айырма: ${proof.text} 1 кг = 1000 г, сондықтан ${Q(proof.value)} кг = ${proof.value[0]} × 1000 : ${proof.value[1]} = ${a} г. Жеке тексеру: ${div(p.first[0]*1000,p.first[1])} − ${div(p.second[0]*1000,p.second[1])} = ${a} г. Килограмм санын грамм деп жазбаймыз.`;break;
 }
 case'three-project-hours-mixed-total':{
  const proof=commonProof(p.fractions),q=proof.value;a=mixed(q);options=uniqueOptions(a,[F(1,proof.d),Q(add(p.fractions[0],p.fractions[1])),Q(norm([p.fractions.reduce((v,q)=>v*q[0],1),p.fractions.reduce((v,q)=>v*q[1],1)]))]);s=`Робот жобасында Әли сызба дайындауға ${Q(p.fractions[0])} сағат, бағдарлама жазуға ${Q(p.fractions[1])} сағат, сынауға ${Q(p.fractions[2])} сағат жұмсады. Үш жұмыстың жалпы уақытын сағатпен таңдаңыз.`;
  z=`Үш кезеңнің бәрі есепке алынады. ${proof.text} ${Q(q)} = ${a} сағат. Минутпен тексерсек ${p.fractions.map(([n,d])=>div(n*60,d)).join(' + ')} = ${div(q[0]*60,q[1])} минут. Бүтін сағатты тастау не үшінші кезеңді ұмыту дұрыс емес.`;break;
 }
 case'regroup-two-complementary-pairs':{
  const[d,e]=p.denominators,[n,m]=p.firstNumerators;assert.ok(n<d&&m<e);a=2;s=`Ең қолайлы топтастыруды қолданып есептеңіз: ${F(n,d)} + ${F(m,e)} + ${F(d-n,d)} + ${F(e-m,e)}.`;
  z=`Қосылғыштардың ретін ауыстырып, бөлімдері бірдейлерді жұптаймыз: (${F(n,d)} + ${F(d-n,d)}) + (${F(m,e)} + ${F(e-m,e)}). Әр жақша бір бүтін береді: ${F(d,d)} + ${F(e,e)} = 1 + 1 = 2. Ортақ бөлім ${lcm(d,e)} іздеу міндетті емес, өйткені толықтауыш жұптар бар.`;break;
 }
 case'maximum-addition-subtraction-expression':{
  options=p.expressions.map(expression);const vs=p.expressions.map(evaluate),best=one(vs.map((q,i)=>vs.every(t=>cmp(q,t)>=0)?i:null).filter(i=>i!==null));a=options[best];s='Екі қосынды мен екі айырманы есептеп, МӘНІ ең үлкен өрнекті таңдаңыз.';
  const d=vs.map(q=>q[1]).reduce(lcm,1);z=p.expressions.map((ex,i)=>`${expression(ex)} = ${Q(vs[i])}`).join('; ')+`. Салыстыру үшін ортақ бөлім ${d}: мәндердің алымдары берілген ретпен ${list(vs.map(([n,b])=>n*div(d,b)))}. Ең үлкені ${vs[best][0]*div(d,vs[best][1])}, сондықтан жауап ${a}. Алдыңғы екеуінің айырмасы аз болса да, дәл бөлшектер тең емес.`;break;
 }
 case'whole-minus-two-original-shares':{
  const used=add(...p.fractions),q=sub([1,1],used);a=Q(q);options=fractionOptions(q,[used,[9,13],[7,40]]);s=`Бір құты желімнің бастапқы көлемінің ${Q(p.fractions[0])} бөлігі альбомға, ${Q(p.fractions[1])} бөлігі макетке жұмсалды. Екі үлес те сол БАСТАПҚЫ құтыға қатысты. Желімнің қандай бөлігі қалды?`;
  z=`Жұмсалған үлес: ${commonProof(p.fractions).text} Қалғаны: ${commonProof([[1,1],used],['−']).text} Тексеру: ${Q(p.fractions[0])} + ${Q(p.fractions[1])} + ${a} = 1. ${Q(used)} жұмсалғанын білдіреді, қалғанын емес.`;break;
 }
 case'three-groups-relative-share-and-pieces':{
  const second=sub(p.first,p.less),used=add(add(p.first,second),p.third),left=sub([1,1],used);a=div(left[0]*p.piece[1],left[1]*p.piece[0]);assert.ok(a>0);s=`Шеберлік сабағында бір үлкен кенеп пайдаланылды. Бірінші топ оның ${Q(p.first)} бөлігін алды. Екінші топ біріншіден БАСТАПҚЫ кенептің ${Q(p.less)} бөлігіне кем кенеп алды, ал үшінші топ бастапқы кенептің ${Q(p.third)} бөлігін алды. Қалған кенептен әр оқушыға бастапқы кенептің ${Q(p.piece)} бөлігінен берілді. Қалдық толық бөлінсе, оны неше оқушы алды?`;
  z=`Екінші топ алғаны: ${commonProof([p.first,p.less],['−']).text} Үш топтың барлығы: ${commonProof([p.first,second,p.third]).text} Қалғаны ${Q(left)}. Оны ${p.piece[1]} бөліммен жазсақ ${F(a*p.piece[0],p.piece[1])}; бұл ${a} дана ${Q(p.piece)}. Сондықтан ${a} оқушы алды. Барлық үлес бір бастапқы кенепке қатысты; екінші топты бірінші топтан қалған кенептің үлесі деп алмаймыз.`;break;
 }
 case'sequential-workers-unfinished-share':{
  const shares=[[p.firstWorked,p.firstHours],[p.secondWorked,p.secondHours]],done=add(...shares),left=sub([1,1],done);assert.ok(cmp(done,[1,1])<0);a=Q(left);options=fractionOptions(left,[done,sub([1,1],add([1,p.firstHours],[1,p.secondHours])),sub([1,1],add([p.firstWorked,p.firstHours],[p.firstWorked,p.secondHours]))]);s=`Бір тапсырысты бірінші шебер жалғыз ${p.firstHours} сағатта, екіншісі жалғыз ${p.secondHours} сағатта бітіре алады. Өнімділіктері тұрақты. Әуелі бірінші шебер ${p.firstWorked} сағат істеп тоқтады, содан кейін екіншісі сол тапсырысты тағы ${p.secondWorked} сағат жалғастырды. Тапсырыстың қандай бөлігі әлі орындалмаған?`;
  z=`Орындалған үлестер ${F(p.firstWorked,p.firstHours)} және ${F(p.secondWorked,p.secondHours)}: әр уақыт өзінің толық орындау уақытына қатысты. ${commonProof(shares).text} Орындалмаған бөлік: ${commonProof([[1,1],done],['−']).text} Жұмыс уақыттары бірдей емес; ${p.firstWorked} сағатты екеуіне де беру шартты өзгертеді.`;break;
 }
 case'unknown-addend-versus-difference':{
  const rhs=sub(...p.right),q=sub(rhs,p.known);a=Q(q);options=fractionOptions(q,[add(rhs,p.known),rhs,[1,3]]);s=`x + ${Q(p.known)} = ${p.right.map(Q).join(' − ')} теңдеуінің шешімін таңдаңыз.`;
  z=`Әуелі оң жақ: ${commonProof(p.right,['−']).text} Енді x = ${Q(rhs)} − ${Q(p.known)}. ${commonProof([rhs,p.known],['−']).text} Тексеру: ${commonProof([q,p.known]).text} Оң жақтағы ${Q(rhs)} шығады; белгілі қосылғышты қосу емес, азайту қажет.`;break;
 }
 case'two-inlets-one-drain-time':{
  const qs=[[1,p.first],[1,p.second],[1,p.drain]],proof=commonProof(qs,['+','−']);assert.ok(proof.value[0]>0);a=div(proof.value[1],proof.value[0]);s=`Оқу үлгісіндегі су қоймасын бір құбыр жалғыз ${p.first} сағатта, екіншісі жалғыз ${p.second} сағатта толтырады. Үшінші құбыр толы қойманы ${p.drain} сағатта босатады. Барлық ағын жылдамдығы тұрақты деп алынады. Үшеуі бос қоймада бір мезгілде ашылса, ол неше сағатта толады?`;
  z=`Бір сағаттағы екі кіріс қосылады, шығыс азайтылады: ${proof.text} Таза өсім ${Q(proof.value)} қойма/сағат, ол оң. Толық қойма ${a} сағатта жиналады. Тексеру: ${F(a,p.first)} + ${F(a,p.second)} − ${F(a,p.drain)} = ${div(a,p.first)} + ${div(a,p.second)} − ${div(a,p.drain)} = 1. Үшінші ағынды қосуға болмайды.`;break;
 }
 case'compare-neighbour-unit-differences':{
  const n=p.base,left=[[1,n],[1,n+1]],right=[[1,n+1],[1,n+2]],l=sub(...left),r=sub(...right),L=left.map(Q).join(' − '),R=right.map(Q).join(' − ');a=`${L} > ${R}`;options=[`${L} < ${R}`,`${L} = ${R}`,`${L} = ${R} + ${Q(p.falseCorrection)}`,a];assert.ok(cmp(l,r)>0&&cmp(sub(l,r),p.falseCorrection)!==0);s=`Көршілес бірлік бөлшектердің айырмалары ${L} және ${R} берілген. Жалғыз дұрыс жазуды таңдаңыз.`;
  z=`Бірінші айырма: ${commonProof(left,['−']).text} Екіншісі: ${commonProof(right,['−']).text} Алымдары 1, бөлімдері ${l[1]} < ${r[1]}, сондықтан ${Q(l)} > ${Q(r)}. Екі айырманың өзара айырмасы ${Q(sub(l,r))}, ол ұсынылған ${Q(p.falseCorrection)} емес. Дұрыс қатынас ${a}.`;break;
 }
 case'known-category-extra-original-share-total':{
  const share=add(p.first,p.extra);a=div(p.knownCount*share[1],share[0]);assert.equal(a%p.first[1],0);assert.equal(a%p.extra[1],0);s=`Үйірме сөресіндегі барлық кітаптың ${Q(p.first)} бөлігі — комикстер. Ғылыми кітаптар саны комикстерден БАРЛЫҚ кітаптың ${Q(p.extra)} бөлігіне артық. Ғылыми кітаптар ${p.knownCount} дана болса, сөреде барлығы неше кітап бар?`;
  z=`Ғылыми кітаптардың жалпы үлесі: ${commonProof([p.first,p.extra]).text} Осы ${Q(share)} үлес ${p.knownCount} кітапқа тең. Бір ${F(1,share[1])} үлес ${p.knownCount} : ${share[0]} = ${div(p.knownCount,share[0])} кітап. Барлығы ${div(p.knownCount,share[0])} × ${share[1]} = ${a}. Тексеру: комикс ${a/p.first[1]*p.first[0]}, қосымша ${a/p.extra[1]*p.extra[0]}, қосынды ${p.knownCount}. Қосымша үлес комикс санына емес, барлық кітапқа қатысты.`;break;
 }
 case'symbolic-common-numerator-sum':{
  const[d,e]=p.denominators,D=lcm(d,e),n=D/d+D/e,q=norm([n,D]);a=F(`${q[0]} × a`,q[1]);options=uniqueOptions(a,[F('2 × a',d+e),F('2 × a',e),F('a',d)]);s=`a — натурал сан. ${F('a',d)} + ${F('a',e)} өрнегіне БАРЛЫҚ a үшін тең болатын ықшам өрнекті таңдаңыз.`;
  z=`Ортақ бөлім ${D}. ${F('a',d)} = ${F(`${D/d} × a`,D)}, ${F('a',e)} = ${F(`${D/e} × a`,D)}. Алымдар қосылады: ${D/d} × a + ${D/e} × a = ${n} × a. Нәтиже ${F(`${n} × a`,D)}${gcd(n,D)>1?` = ${a}`:''}. Бұл теңдік a орнына бір сан қоюдан емес, қосу ережесінен барлық натурал a үшін шығады.`;break;
 }
 case'telescoping-unit-difference-chain':{
  const q=sub([1,p.start],[1,p.end]);a=Q(q);options=fractionOptions(q,[[1,p.start],sub([1,1],[1,p.end]),[1,p.end]]);s=`Жақшалар бірдей заңдылықпен жалғасады: (${F(1,p.start)} − ${F(1,p.start+1)}) + (${F(1,p.start+1)} − ${F(1,p.start+2)}) + … + (${F(1,p.end-1)} − ${F(1,p.end)}). Қосындыны табыңыз.`;
  z=`Арадағы ${range(p.start+1,p.end-1).map(n=>F(1,n)).join(', ')} мүшелерінің әрқайсысы бір рет қосылып, бір рет азайтылады; олар жойылады. Тек ${F(1,p.start)} − ${F(1,p.end)} қалады. ${commonProof([[1,p.start],[1,p.end]],['−']).text} Алғашқы және соңғы мүшені сақтау қажет; соңғы азайтылатын үлесті тастамаймыз.`;break;
 }
 case'unknown-common-denominator-factor':{
  const[d,e]=p.factors,D=lcm(d,e),n=D/d+D/e;a=div(n*p.total[1],D*p.total[0]);s=`${F(1,`${d} × x`)} + ${F(1,`${e} × x`)} = ${Q(p.total)} теңдеуінде x — натурал сан. Оны табыңыз.`;
  z=`x оң, сондықтан ортақ бөлім ${D} × x. Сол жақ ${F(D/d,`${D} × x`)} + ${F(D/e,`${D} × x`)} = ${F(n,`${D} × x`)}. Оң жақтың алымы да ${p.total[0]}, демек ${D} × x = ${p.total[1]}. x = ${p.total[1]} : ${D} = ${a}. Тексеру: ${commonProof([[1,d*a],[1,e*a]]).text}`;assert.equal(n,p.total[0]);break;
 }
 case'least-unit-denominator-strict-sum':{
  const q=add(...p.fractions),gap=sub([1,1],q);assert.equal(gap[0],1);a=gap[1]+1;s=`${p.fractions.map(Q).join(' + ')} + ${F(1,'n')} < 1 болатындай ең кіші натурал n санын анықтаңыз.`;
  z=`Белгілі қосынды: ${commonProof(p.fractions).text} Сондықтан ${F(1,'n')} < 1 − ${Q(q)} = ${Q(gap)}. Бірлік бөлшекте бөлім үлкен болса, мән кіші: n > ${gap[1]}. Ең кішісі ${a}. n = ${gap[1]} кезінде қосынды 1-ге ТЕҢ, қатаң кіші емес; n = ${a} кезінде ${Q(add(q,[1,a]))} < 1.`;break;
 }
 case'consecutive-numerators-sum':{
  const nums=range(1,p.lastNumerator),total=sum(nums);a=div(total,p.denominator);s=`${F(1,p.denominator)} + ${F(2,p.denominator)} + ${F(3,p.denominator)} + … + ${F(p.lastNumerator,p.denominator)} қосындысында барлық алым 1–${p.lastNumerator} аралығында ретімен алынған. Қосындының мәні неше?`;
  const pairs=Math.floor(p.lastNumerator/2),middle=(p.lastNumerator+1)/2;assert.equal(p.lastNumerator%2,1);z=`Бөлім ${p.denominator} сақталады. Алымдарды шетінен жұптасақ, әр жұп ${p.lastNumerator+1}: 1 + ${p.lastNumerator}, 2 + ${p.lastNumerator-1}, … . ${pairs} жұп және ортадағы ${middle} бар. Қосынды ${pairs} × ${p.lastNumerator+1} + ${middle} = ${total}. Бөлшектердің қосындысы ${F(total,p.denominator)} = ${a}. Бөлімді ${p.lastNumerator} рет қоспаймыз.`;break;
 }
 case'opposite-motion-remaining-path-share':{
  const shares=[[p.elapsed,p.firstHours],[p.elapsed,p.secondHours]],covered=add(...shares),left=sub([1,1],covered);assert.ok(left[0]>0);a=Q(left);options=fractionOptions(left,[covered,[3,4],[7,11]]);s=`Екі жаяу саяхатшы бір жолдың қарама-қарсы ұштарынан бір мезгілде бір-біріне қарай шықты. Біріншісі бүкіл жолды ${p.firstHours} сағатта, екіншісі ${p.secondHours} сағатта өтеді; жылдамдықтары тұрақты. ${p.elapsed} сағаттан кейін олардың арасы бастапқы толық жолдың қандай бөлігі болады?`;
  z=`${p.elapsed} сағатта бірінші ${F(p.elapsed,p.firstHours)}, екінші ${F(p.elapsed,p.secondHours)} жол жүреді. ${commonProof(shares).text} Екі бөлік толық жолдан кіші, демек әлі кездескен жоқ. Қалған аралықты табамыз: ${commonProof([[1,1],covered],['−']).text} Жауап ${a}; ${Q(covered)} жүрген жолдарының қосындысы ғана.`;break;
 }
 case'choose-sum-exactly-one':{
  options=p.pairs.map(qs=>qs.map(Q).join(' + '));a=one(options.filter((_,i)=>cmp(add(...p.pairs[i]),[1,1])===0));s='Төмендегі төрт қосындының тек біреуі дәл бір бүтін береді. Сол өрнекті таңдаңыз.';
  z=p.pairs.map(qs=>`${qs.map(Q).join(' + ')} = ${Q(add(...qs))}`).join('; ')+`. Дәл ${F(1,1)} мәнін беретіні ${a}. Қалғандарының біреуі 1-ден кіші, екеуі үлкен; мәндерді ондық жуықтаумен алмастырмаймыз.`;break;
 }
 case'sum-all-irreducible-proper-fixed-denominator':{
  const ns=range(1,p.denominator-1).filter(n=>gcd(n,p.denominator)===1);a=div(sum(ns),p.denominator);s=`Бөлімі ДӘЛ ${p.denominator} болатын барлық қысқартылмайтын дұрыс оң бөлшектерді бір реттен қосыңыз. Қосынды неге тең?`;
  const excluded=range(1,p.denominator-1).filter(n=>gcd(n,p.denominator)>1);z=`Дұрыс бөлшек алымдары 1–${p.denominator-1} аралығында. ${p.denominator} санымен ортақ бөлгіші бар ${list(excluded)} алымдары алынбайды. Қалатыны ${list(ns)}: ${ns.map(n=>F(n,p.denominator)).join(' + ')} = ${F(sum(ns),p.denominator)} = ${a}. Шеткі алымдарды жұптасақ, әр жұптың қосындысы ${p.denominator}; бұл да ${a} бүтін береді. Қысқаратын бөлшектерді тізімге қоспаймыз.`;break;
 }
 case'whole-litres-minus-two-measures':{
  const used=add(...p.uses),left=sub([p.initialLitres,1],used);a=mixed(left);options=uniqueOptions(a,[mixed(used),mixed(sub([p.initialLitres,1],p.uses[1])),Q(sub(...p.uses))]);s=`Керамика шеберханасында ${p.initialLitres} л глазурь бар еді. Таңертең ${Q(p.uses[0])} ЛИТР, түстен кейін ${Q(p.uses[1])} ЛИТР жұмсалды. Ыдыста қалған көлемді литрмен таңдаңыз.`;
  z=`Жұмсалған көлем: ${commonProof(p.uses).text} Бастапқы ${p.initialLitres} л = ${F(p.initialLitres*used[1],used[1])} л. Қалдық: ${commonProof([[p.initialLitres,1],used],['−']).text} ${Q(left)} = ${a} л. Берілген бөлшектер бастапқы көлемнің үлестері емес, жеке литр өлшемдері; оларды ${p.initialLitres} санына қайта көбейтпейміз.`;break;
 }
 case'dyadic-sum-unit-deficit':{
  const ds=range(1,p.terms).map(k=>2**k),D=ds.at(-1),ns=ds.map(d=>D/d);a=D;s=`${ds.map(d=>F(1,d)).join(' + ')} қосындысы 1-ден ${F(1,'n')} шамасына кем. Натурал n неге тең?`;
  z=`Барлық бөлшекті ${D} бөліміне келтіреміз: алымдары ${list(ns)}. Олардың қосындысы ${ns.join(' + ')} = ${sum(ns)}. Сондықтан қосынды ${F(sum(ns),D)}, жетпейтіні ${F(D,D)} − ${F(sum(ns),D)} = ${F(1,D)}. Демек n = ${D}. Соңғы ${F(1,D)} қосылғышын ұмыту басқа қалдық берер еді.`;break;
 }
 case'fractional-arithmetic-sequence-next':{
  const[first,second,third]=p.terms,step=sub(second,first);assert.equal(cmp(sub(third,second),step),0);const q=add(third,step);a=Q(q);options=fractionOptions(q,[[3,4],[9,10],add(q,step)]);s=`Тізбектің әр мүшесі алдыңғысынан бірдей оң шамаға артады: ${p.terms.map(Q).join('; ')}; … . Төртінші мүшесін таңдаңыз.`;
  z=`Бірінші қадам: ${commonProof([second,first],['−']).text} Екінші қадам: ${commonProof([third,second],['−']).text} Екеуі де ${Q(step)}, сондықтан төртінші мүшеге жету үшін осы қадамды бір рет қосамыз: ${commonProof([third,step]).text} Бір емес, екі қадам қосу бесінші мүшені берер еді.`;break;
 }
 case'river-raft-from-two-whole-route-times':{
  assert.ok(p.upHours>p.downHours);const diff=sub([1,p.downHours],[1,p.upHours]);a=div(2*diff[1],diff[0]);s=`Моторлы қайық екі айлақтың арасын ағыспен ${p.downHours} сағатта, дәл сол жолды кері бағытта ${p.upHours} сағатта өтеді. Қайықтың тынық судағы жылдамдығы да, ағыс жылдамдығы да тұрақты. Тек ағысқа ілескен сал сол аралықты неше сағатта өтеді?`;
  z=`Толық аралықты 1 деп аламыз. Қайықтың бағыттар бойынша сағаттық үлестері ${F(1,p.downHours)} және ${F(1,p.upHours)}. Айырма: ${commonProof([[1,p.downHours],[1,p.upHours]],['−']).text} Бұл ағыс жылдамдығының ЕКІ есесі, өйткені (v + u) − (v − u) = 2 × u. Оның жартысы ${F(1,a)} жол/сағат. Демек салға ${a} сағат керек. Тексеру: ағыссыз қайық үлесі ${Q(sub([1,p.downHours],[1,a]))}; одан ${F(1,a)} алсақ ${F(1,p.upHours)} қалады.`;break;
 }
 case'choose-all-signs-for-target':{
  const states=[];for(let mask=0;mask<8;mask++){const signs=range(0,2).map(i=>mask&(1<<i)?'+':'−');let value=p.fractions[0];for(let i=1;i<4;i++)value=signs[i-1]==='+'?add(value,p.fractions[i]):sub(value,p.fractions[i]);states.push({signs,value});}const good=one(states.filter(t=>cmp(t.value,p.target)===0));a=good.signs.join(', ');options=uniqueOptions(a,['−, +, −','−, −, +','+, +, −']);s=`${Q(p.fractions[0])} □ ${Q(p.fractions[1])} □ ${Q(p.fractions[2])} □ ${Q(p.fractions[3])} = ${Q(p.target)} теңдігіндегі әр □ орнына «+» немесе «−» қойылады. Солдан оңға қарай таңбалардың дұрыс үштігін таңдаңыз.`;
  const D=p.fractions.map(q=>q[1]).concat(p.target[1]).reduce(lcm,1),ns=p.fractions.map(([n,d])=>n*div(D,d)),target=p.target[0]*div(D,p.target[1]);z=`Ортақ бөлім ${D}, сондықтан алымдар теңдеуі ${ns[0]} □ ${ns[1]} □ ${ns[2]} □ ${ns[3]} = ${target}. Барлығын қоссақ ${sum(ns)}, оны ${sum(ns)-target} шамасына азайту керек. «+»-ты «−»-ке ауыстыру сол санның екі есесін алып тастайды. Теріс таңбалы алымдардың қосындысы ${(sum(ns)-target)/2} болуы тиіс; ${ns.slice(1).join(', ')} ішінен бұл тек ${ns[2]} + ${ns[3]} = ${ns[2]+ns[3]}. Тексеру: ${ns[0]} + ${ns[1]} − ${ns[2]} − ${ns[3]} = ${target}. Сегіз ықтимал үштіктің тек осысы сәйкес: ${a}.`;break;
 }
 case'proper-unknown-numerators-sum':{
  const[d,e]=p.denominators,D=lcm(d,e),target=p.total[0]*div(D,p.total[1]),states=[];for(let x=1;x<d;x++)for(let y=1;y<e;y++)if(x*(D/d)+y*(D/e)===target)states.push([x,y]);const[x,y]=one(states);a=x+y;s=`${F('a',d)} және ${F('b',e)} — дұрыс бөлшектер, a мен b — натурал сандар. ${F('a',d)} + ${F('b',e)} = ${Q(p.total)} болса, a + b неге тең?`;
  const A=D/d,B=D/e;z=`Дұрыс бөлшек болу шарттары: 1 ≤ a < ${d}, 1 ≤ b < ${e}. Ортақ ${D} бөлім алымдарынан ${A} × a + ${B} × b = ${target} шығады. ${A} × a жұп, оң жақ ${target} та жұп; ${B} тақ болғандықтан b жұп. Жарамды жұп b мәндерін түгел тексереміз: ${range(1,e-1).filter(b=>b%2===0).map(b=>{const n=target-B*b;return`b = ${b}: a = ${n} : ${A} = ${n%A?Q(norm([n,A])):n/A}${n%A?' — натурал сан емес':n/A>=d?' — дұрыс бөлшек шегінен тыс':' — жарайды'}`;}).join('; ')}. Жалғыз жұп a = ${x}, b = ${y}, сондықтан a + b = ${x} + ${y} = ${a}. Тексеру: ${commonProof([[x,d],[y,e]]).text}`;assert.equal(A%2,0);assert.equal(B%2,1);assert.equal(target%2,0);break;
 }
 default:throw Error('Unknown source3.8 model '+kind);
 }
 if(!options)s+=' Жауапқа тек санды жазыңыз.';
 if(options){assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else assert.match(String(a),/^\d+$/);
 assert.ok(!/[\\$^]/.test(s+z));return {statement:s,answer:String(a),solution:z,...(options?{options}:{}),...flags};
}
const specs=new Map(SPECS.map(s=>[prefix+s.id,s]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,prefix+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:prefix+spec.id,modelId:prefix+spec.kind,grade:5,topic:spec.kind==='fractional-arithmetic-sequence-next'?'seq':'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Сақталған 3.8 тақырыбының 49 невизуалды бастапқы шарты, толық шешімі мен барлық нұсқалары жеке оқылды. Әр бастапқы сұрақтың сұралған шамасы мен есептеу тәсілі сақталып, жаңа қазақша шарттар, деректер және өз шешімдері жазылды.',
 'Жаңа жағдайлар: балшық ұяшықтары, бояу мен желімнің бастапқы үлестері, қыш бұйымына жұмсалған уақыт, тұқым қапшықтары, робот жобасы, кенеп бөлу, кезекпен жұмыс істеу және екі саяхатшы. Бастапқы бүтіннің үлесі мен килограмм/литр өлшеміндегі бөлшек шама нақты ажыратылды; тұрақты өнімділік пен бір мезгілде бастау шарттары ашық берілді.',
 '49 редакция не model ID 49 жеке жаңа математикалық мағына дегенді білдірмейді. Ортақ бөлім, алдын ала/соңғы қысқарту, аралас сан, қатаң теңсіздік, шектеулі толық іздеу, қосу-азайту таңбалары және бастапқы көздегі арнайы әдіс сақталды. Бөлшек/әріпті жауаптар MCQ, ашық жауаптар тек бүтін сан; native canonical бөлшектер қолданылады.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const k of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[k]),canonicalEdition(e[k]));const actual=renderEdition(row);for(const k of['statement','solution','options','intentionalIncorrectExample'])assert.equal(canonicalEdition(row[k]),canonicalEdition(actual[k]),'Unbound addition '+k);assert.equal(row.answer,actual.answer);return{answer:actual.answer,checks:['all49 individual saved3.8conditions/fullsolutions/options read','exact rational addition/subtraction, known/unknown roles and reducibility','sameoriginalwhole vs litre/kg measures, constantwork/motion units','complete propernumerator/sign domains, strictnaturalminimum','fulltext/solution/answer/options/source metadata bound; noTeX','external independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All49 saved nonvisual grade5 topic3.8 sources rewritten offline. Numeric/model variants not semantic uniqueness. External review pending.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-fraction-addition.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
