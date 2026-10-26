/** Offline source-specific3.12 draft; independent review required before exposure. */
import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';
import{canonicalEdition}from'./edition-review.mjs';import{grade5Sources}from'./grade5-inventory.mjs';import{SPECS}from'./grade5-reciprocals-specs.mjs';
const prefix='grade5-reciprocals-',sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-12').map(q=>[q.sourceId,q]));
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a),lcm=(a,b)=>a/gcd(a,b)*b,range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=xs=>xs.reduce((a,b)=>a+b,0),one=xs=>{assert.equal(xs.length,1);return xs[0];},div=(a,b)=>{assert.equal(a%b,0);return a/b;};
const norm=([n,d])=>{assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d>0);const g=gcd(n,d);return[n/g,d/g];},R=([w,n,d])=>{assert.ok(Number.isInteger(w)&&w>=0&&Number.isInteger(n)&&n>=0&&d>0&&(w===0||n<d));return norm([w*d+n,d]);},add=(a,b)=>norm([a[0]*b[1]+b[0]*a[1],a[1]*b[1]]),sub=(a,b)=>norm([a[0]*b[1]-b[0]*a[1],a[1]*b[1]]),mul=(a,b)=>norm([a[0]*b[0],a[1]*b[1]]),inv=q=>{assert.ok(q[0]>0);return norm([q[1],q[0]]);},cmp=(a,b)=>a[0]*b[1]-b[0]*a[1],sumQ=qs=>qs.reduce(add,[0,1]);
const side=x=>/^[0-9A-Za-z□]+$/.test(String(x))?String(x):`(${x})`,F=(n,d)=>`(${side(n)}/${side(d)})`,Q=q=>F(...q),M=(w,n,d)=>`(${w} + ${F(n,d)})`,show=([w,n,d])=>n===0?String(w):w===0?F(n,d):M(w,n,d),mixed=q=>{q=norm(q);return q[1]===1?String(q[0]):q[0]<q[1]?Q(q):M(Math.floor(q[0]/q[1]),q[0]%q[1],q[1]);},opts=(answer,others)=>{const out=[String(answer),...others.map(String)];assert.equal(out.length,4);assert.equal(new Set(out).size,4);return out;};
const pair=xs=>xs.map(show).join(' және '),isPair=xs=>cmp(mul(...xs.map(R)),[1,1])===0;
function mixedProof(v){const[w,n,d]=v;return n===0?`${show(v)} = ${F(w,1)}.`:w===0?`${show(v)} бөлшегінің алымы ${n}, бөлімі ${d}.`:`${show(v)} = ${F(`${w} × ${d} + ${n}`,d)} = ${Q(R(v))}.`;}
function inverseProof(q){const r=inv(q);return{value:r,text:`${Q(q)} санына кері сан ${Q(r)}${r[1]===1||r[0]>r[1]?` = ${mixed(r)}`:''}. Тексеру: ${Q(q)} × ${Q(r)} = ${F(q[0]*r[0],q[1]*r[1])} = 1.`};}
function plusProof(qs,minus=false){const D=qs.map(q=>q[1]).reduce(lcm,1),ns=qs.map(q=>q[0]*div(D,q[1])),raw=minus?ns[0]-ns[1]:sum(ns),q=norm([raw,D]);return{value:q,text:`Ортақ бөлім ${D}: ${qs.map((t,i)=>`${Q(t)} = ${F(ns[i],D)}`).join('; ')}. ${ns.join(minus?' − ':' + ')} = ${raw}, сондықтан ${qs.map(Q).join(minus?' − ':' + ')} = ${F(raw,D)}${gcd(raw,D)>1?` = ${Q(q)}`:''}.`};}
function render(kind,p){let s,z,a,options;switch(kind){
 case'fixed-denominator-reciprocal-numerator':{
  const proof=inverseProof(p.other);a=div(proof.value[0]*p.denominator,proof.value[1]);s=`${F('a',p.denominator)} және ${Q(p.other)} сандары өзара кері. Бірінші бөлшектің бөлімі ${p.denominator} болып қалады. a алымын табыңыз.`;z=proof.text+` Сондықтан ${F('a',p.denominator)} = ${F(a,p.denominator)}, бірдей бөлімдерде a = ${a}.`;break;
 }
 case'reciprocal-of-natural':{
  a=F(1,p.natural);options=opts(a,[String(p.natural),F(p.natural-1,p.natural),'1']);s=`Кестеде ${p.natural} саны берілді. Оған көбейткенде 1 беретін кері санды таңдаңыз.`;z=`${p.natural} = ${F(p.natural,1)}, сондықтан алым мен бөлімді ауыстырамыз. ${inverseProof([p.natural,1]).text} ${F(p.natural-1,p.natural)} бірлікке дейін толықтырушы болғанымен, көбейтінді 1 бермейді.`;break;
 }
 case'proper-reciprocal-numerator':{
  const proof=inverseProof(p.value);a=proof.value[0];s=`${Q(p.value)} санына кері санды қысқартылмайтын бөлшекпен жазыңыз. Оның тек АЛЫМЫН енгізіңіз.`;z=proof.text+` Сұралған алым ${a}, бөлім ${proof.value[1]} емес. Кері санда бастапқы алым мен бөлім орын ауыстырды.`;break;
 }
 case'unit-reciprocal-natural':{
  a=p.denominator;s=`${F(1,p.denominator)} бірлік бөлшегінің кері саны қандай натурал санға тең?`;z=inverseProof([1,p.denominator]).text+` Бір толық бірлік алу үшін осындай ${p.denominator} үлес керек.`;break;
 }
 case'universal-reciprocal-product':{
  a=1;options=opts(a,['0','3','100']);s='Екі карточкадағы сандар бір-біріне кері екені белгілі. Осы екі санды көбейтсе, қандай тұрақты нәтиже шығады?';z=`Кері сандар анықтамасы бойынша олардың көбейтіндісі дәл 1. Мысалы, ${Q(p.example)} және ${Q(inv(p.example))}: ${inverseProof(p.example).text} Бұл қасиет нақты алым мен бөлімге тәуелді емес.`;break;
 }
 case'select-mutually-reciprocal-pair':{
  options=p.pairs.map((xs,i)=>i===1?`${show(xs[0])} және ${Q(R(xs[1]))}`:pair(xs));a=one(options.filter((_,i)=>isPair(p.pairs[i])));s='Екі саны бір-біріне кері болатын жұпты таңдаңыз.';z=p.pairs.map((xs,i)=>`${options[i]}: ${xs.map(v=>Q(R(v))).join(' × ')} = ${mixed(mul(...xs.map(R)))}`).join('; ')+`. Тек ${a} жұбының көбейтіндісі 1. Қосындының 1 болуы немесе екі жазудың бір санға тең болуы жеткіліксіз.`;break;
 }
 case'reciprocal-of-one':{
  assert.equal(p.value,1);a=1;s='Карточкадағы 1 санының керісін табыңыз.';z='1 × 1 = 1, сондықтан 1 санының кері саны 1. Оң сандар ішінде ол өзіне кері: 1-ден кіші оң санның керісі 1-ден үлкен, ал 1-ден үлкен оң санның керісі 1-ден кіші.';break;
 }
 case'positive-proper-reciprocal-above-one':{
  a='1 санынан үлкен';options=opts(a,['1 санына тең','1 санынан кіші','0 санына тең']);s='Алымы мен бөлімі оң натурал саннан тұратын ДҰРЫС бөлшекті кері айналдырсақ, оның мәні 1-мен қалай салысады?';z=`Бастапқы ${F('m','n')} бөлшегінде 0 < m < n. Кері сан ${F('n','m')}, оның алымы бөлімінен үлкен, демек 1-ден үлкен. Мысалы, ${inverseProof(p.example).text} Оңдық шарты бар, нөл қарастырылмайды.`;break;
 }
 case'mixed-reciprocal-denominator':{
  const q=R(p.value),proof=inverseProof(q);a=proof.value[1];s=`${show(p.value)} аралас санының кері санын табыңыз. Қысқартылған кері бөлшектің БӨЛІМІ неше?`;z=mixedProof(p.value)+' '+proof.text+` Кері бөлшектің бөлімі ${a}; аралас санның бөлшек бөлігін ғана аудармаймыз.`;break;
 }
 case'only-zero-has-no-reciprocal':{
  options=p.choices.map(show);a=one(options.filter((_,i)=>R(p.choices[i])[0]===0));s='Төмендегі карточкалардың біріндегі санға кері сан анықталмайды. Сол санды таңдаңыз.';z=p.choices.filter(v=>R(v)[0]>0).map(v=>inverseProof(R(v)).text).join(' ')+' Ал 0 санын кез келген санға көбейту тек 0 береді. 1 шықпайтындықтан, 0 санына кері сан жоқ. Нөлді бөлімге жазып есептемейміз.';break;
 }
 case'improper-reciprocal-proper':{
  const proof=inverseProof(p.value);a=Q(proof.value);options=opts(a,[mixed(p.value),F(p.value[0]-p.value[1],p.value[0]),F(1,p.value[0])]);s=`Бұрыс ${Q(p.value)} бөлшегінің кері санын таңдаңыз.`;z=proof.text+` ${mixed(p.value)} — берілген санның өзінің аралас түрі, оның керісі емес. Бүтін санға айналдыру міндетті емес, алым мен бөлім орын ауыстырылады.`;break;
 }
 case'separated-reciprocal-factors-natural':{
  const r=inv(p.value);a=p.middle;s=`${Q(p.value)} × ${p.middle} × ${Q(r)} көбейтіндісінде өзара кері көбейткіштерді алдымен топтаңыз. Нәтиже неше?`;z=`Көбейткіштер орнын ауыстыруға болады: (${Q(p.value)} × ${Q(r)}) × ${p.middle}. Жақша 1, өйткені ${inverseProof(p.value).text} Демек 1 × ${p.middle} = ${a}.`;break;
 }
 case'unit-factor-equation-one':{
  a=p.denominator;s=`${F(1,p.denominator)} × x = 1 теңдеуіндегі x мәнін енгізіңіз.`;z=`x саны ${F(1,p.denominator)} бөлшегіне кері болуы керек. ${inverseProof([1,p.denominator]).text} Сондықтан x = ${a}.`;break;
 }
 case'unit-rate-reciprocal-time-difference':{
  const first=p.firstRateDenominator;a=first-p.secondMinutes;assert.ok(a>0);s=`Шеберханадағы бос ыдысқа бірінші құбыр минутына толық көлемнің ${F(1,first)} бөлігін құяды. Екінші құбыр сол ыдысты жеке өзі ${p.secondMinutes} минутта толтырады. Көлем тұрақты, су алынбайды. Екінші құбыр неше минут жылдам толтырады?`;z=`Бірінші құбырдың толық уақыты бір минуттық үлеске кері: ${inverseProof([1,first]).text} Сондықтан бірінші уақыт ${first} минут. Екіншісі ${p.secondMinutes} минутта бітіреді. Уақыт айырмасы ${first} − ${p.secondMinutes} = ${a} минут; тезірек болғандықтан азырақ уақыт жұмсалады.`;break;
 }
 case'select-value-reciprocal-strictly-above-one':{
  options=p.values.map(show);a=one(options.filter((_,i)=>cmp(inv(R(p.values[i])),[1,1])>0));s='Қай оң санның кері саны 1-ден ҚАТАҢ үлкен болады?';z=p.values.map(v=>`${show(v)} → ${mixed(inv(R(v)))}`).join('; ')+`. Тек ${a} саны 1-ден кіші, оның керісі 1-ден үлкен. 1 санының керісі 1-ге тең болғандықтан, қатаң талапқа кірмейді.`;break;
 }
 case'proper-reciprocal-as-mixed':{
  const proof=inverseProof(p.value),q=proof.value;a=mixed(q);options=opts(a,[M(p.value[0],1,p.value[1]),F(p.value[1]-p.value[0],p.value[1]),mixed(sub(q,[1,1]))]);s=`${Q(p.value)} санының керісін АРАЛАС сан түрінде таңдаңыз.`;z=proof.text+` Бүтін бөлікті тек кері айналдырғаннан кейін бөлеміз: ${q[0]} = ${Math.floor(q[0]/q[1])} × ${q[1]} + ${q[0]%q[1]}. Нәтиже ${a}.`;break;
 }
 case'mixed-reciprocal-pair-efficient-product':{
  const q=R(p.mixed);assert.equal(cmp(mul(q,p.fraction),[1,1]),0);a=p.middle;s=`${Q(p.fraction)} × ${p.middle} × ${show(p.mixed)} мәнін өзара кері жұп арқылы тиімді табыңыз.`;z=mixedProof(p.mixed)+` ${Q(p.fraction)} пен ${Q(q)} өзара кері: ${Q(p.fraction)} × ${Q(q)} = 1. Оларды біріктірсек, 1 × ${p.middle} = ${a}. Аралас санның бүтін бөлігі де түрлендіруге кірді.`;break;
 }
 case'one-true-reciprocal-property':{
  assert.equal(p.one,1);assert.equal(p.zero,0);a='1 мен оның кері саны бірдей';options=opts(a,['Нөлді қоса барлық санның керісі бар','Өзара кері екі оң санның көбейтіндісі 0 болады','0 санының керісі де 0']);s='Кері сандар туралы төрт пікірдің тек біреуі дұрыс. Сол пікірді таңдаңыз.';z='1 × 1 = 1, сондықтан бірінші пікір дұрыс. Нөлдің керісі жоқ, себебі 0 × кез келген сан = 0. Өзара кері сандардың көбейтіндісі міндетті түрде 1 болады, 0 емес. Сол себепті қалған үш пікір жалған.';break;
 }
 case'count-reciprocal-pairs-with-mixeds':{
  a=p.pairs.filter(isPair).length;s=`Тізімдегі өзара кері жұптарды санаңыз: ${p.pairs.map((xs,i)=>`${i+1}) ${pair(xs)}`).join('; ')}.`;z=p.pairs.map((xs,i)=>`${i+1}-жұп: ${xs.map(v=>Q(R(v))).join(' × ')} = ${mixed(mul(...xs.map(R)))} — ${isPair(xs)?'кері жұп':'кері жұп емес'}`).join('; ')+`. 1 беретін жұптар саны ${a}. Аралас сандарда бүтін бөлік ескерілді, тек бөлшек бөлікті аудару жеткіліксіз.`;break;
 }
 case'difference-of-two-reciprocals':{
  const A=inv(p.first),B=inv(p.second),proof=plusProof([B,A],true);a=Q(proof.value);options=opts(a,[Q(sub(p.first,p.second)),String(p.second[1]-p.first[1]),mixed(add(proof.value,[1,1]))]);s=`a саны ${Q(p.first)} бөлшегіне, b саны ${Q(p.second)} бөлшегіне кері. b − a айырмасын таңдаңыз.`;z=`Алдымен a = ${Q(A)}, b = ${Q(B)}. ${proof.text} Жауап ${a}. Берілген бастапқы бөлшектерді азайтсақ, кері сандардың айырмасын таппаймыз.`;break;
 }
 case'mixed-reciprocal-fixed-numerator':{
  const q=R(p.value),r=inv(q);a=div(r[0]*p.denominator,r[1]);s=`${F('x',p.denominator)} саны ${show(p.value)} аралас санына кері. Көрсетілген ${p.denominator} бөліміндегі x алымы неше?`;z=mixedProof(p.value)+' '+inverseProof(q).text+` Демек ${F('x',p.denominator)} = ${F(a,p.denominator)}, x = ${a}. Тек ${F(p.value[1],p.value[2])} бөлшек бөлігінің керісін табу басқа нәтиже береді.`;break;
 }
 case'same-route-time-reciprocal-comparison':{
  const winner=p.seconds[0]<p.seconds[1]?0:1,loser=1-winner;a=`${p.names[winner]}, себебі ${F(1,p.seconds[winner])} > ${F(1,p.seconds[loser])}`;options=opts(a,[`${p.names[loser]}, себебі ${F(1,p.seconds[loser])} > ${F(1,p.seconds[winner])}`,`${p.names[loser]}, себебі ${p.seconds[loser]} > ${p.seconds[winner]}`,'Қашықтықтары бірдей, сондықтан үлестері де бірдей']);s=`Екі оқушы бірдей ${p.metres} м жолды бірқалыпты жүгірді: ${p.names[0]} ${p.seconds[0]} секундта, ${p.names[1]} ${p.seconds[1]} секундта. Бір секундта осы жолдың ҮЛКЕНІРЕК бөлігін кім өтеді?`;z=`Ортақ жолды бір бүтін десек, ${p.names[0]} секундына ${F(1,p.seconds[0])}, ${p.names[1]} ${F(1,p.seconds[1])} бөлігін өтеді. Бөлімі ${p.seconds[winner]} кіші, сондықтан ${F(1,p.seconds[winner])} > ${F(1,p.seconds[loser])}. Жауап ${p.names[winner]}. Бірдей қашықтыққа аз уақыт жұмсаған адам жылдамырақ.`;break;
 }
 case'reciprocal-of-two-fraction-sum':{
  const proof=plusProof(p.values),q=inv(proof.value),sumInv=sumQ(p.values.map(inv));a=mixed(q);options=opts(a,[mixed(sumInv),Q(proof.value),mixed(inv(norm([sum(p.values.map(v=>v[0])),sum(p.values.map(v=>v[1]))])))]);s=`${p.values.map(Q).join(' + ')} ҚОСЫНДЫСЫНА кері санды табыңыз. Әр қосылғышқа жеке кері сан сұралмайды.`;z=proof.text+' '+inverseProof(proof.value).text+` Жауап ${a}. Жеке кері сандарды қосу ${mixed(sumInv)} береді, бұл қосындының керісі емес; ал ${Q(proof.value)} кері айналдыруға дейінгі нәтиже ғана.`;break;
 }
 case'mixed-factor-equation-one':{
  const q=R(p.value),r=inv(q);a=Q(r);options=opts(a,[show(p.value),F(p.value[2],p.value[1]),F(p.value[2],p.value[0]+p.value[2])]);s=`${show(p.value)} × x = 1 теңдеуіндегі x санын таңдаңыз.`;z=mixedProof(p.value)+' '+inverseProof(q).text+` Сондықтан x = ${a}. ${F(p.value[2],p.value[1])} нұсқасы тек бөлшек бөлікке кері сан, ал ${F(p.value[2],p.value[0]+p.value[2])} нұсқасында аралас сан бұрыс түрлендірілген.`;break;
 }
 case'product-of-two-unit-reciprocals':{
  a=p.denominators.reduce((a,b)=>a*b,1);s=`${p.denominators.map(d=>F(1,d)).join(' және ')} сандарының әрқайсысына кері санды табыңыз. Сол ЕКІ кері санның көбейтіндісі неше?`;z=p.denominators.map(d=>inverseProof([1,d]).text).join(' ')+` Енді ${p.denominators.join(' × ')} = ${a}. Бастапқы бөлшектердің көбейтіндісі ${F(1,a)} болар еді, ол сұралған кері сандар көбейтіндісі емес.`;break;
 }
 case'mixed-reciprocal-times-numerator':{
  const q=R(p.value),r=inv(q);a=div(...mul(r,[p.multiplier,1]));s=`a саны ${show(p.value)} аралас санына кері. ${p.multiplier} × a мәнін табыңыз.`;z=mixedProof(p.value)+' '+inverseProof(q).text+` Сондықтан ${p.multiplier} × a = ${p.multiplier} × ${Q(r)} = ${a}. Көбейтудегі ${p.multiplier} алымы мен бөлімдегі ${r[1]} қысқарады.`;break;
 }
 case'mixed-reciprocal-product-plus-fraction':{
  const q=R(p.value);assert.equal(cmp(mul(q,p.inverse),[1,1]),0);const result=add([1,1],p.addend);a=mixed(result);options=opts(a,[Q(p.addend),M(2,...p.addend),M(1,p.addend[0]-1,p.addend[1])]);s=`${show(p.value)} × ${Q(p.inverse)} + ${Q(p.addend)} өрнегін амал ретімен есептеп, мәнін таңдаңыз.`;z=mixedProof(p.value)+` Алғашқы екі сан өзара кері: ${Q(q)} × ${Q(p.inverse)} = 1. Енді 1 + ${Q(p.addend)} = ${a}. Өзара кері жұптың көбейтіндісі 0 не 2 емес, дәл 1.`;break;
 }
 case'all-natural-numerators-with-natural-inverse':{
  const ds=range(1,p.denominator).filter(d=>p.denominator%d===0);a=ds.join(', ');options=opts(a,[ds.slice(1,-1).join(', '),ds.slice(0,-1).join(', '),range(1,4).map(k=>k*p.denominator).join(', ')]);s=`a — натурал сан. ${F('a',p.denominator)} бөлшегінің керісі натурал сан болуы үшін a қабылдайтын БАРЛЫҚ мәнді таңдаңыз.`;z=`Кері сан ${F(p.denominator,'a')}. Ол натурал болуы үшін a саны ${p.denominator} санының бөлгіші болуы керек. Толық бөлгіштер: ${a}. Тексеру: ${ds.map(d=>`${p.denominator} : ${d} = ${div(p.denominator,d)}`).join('; ')}. a > ${p.denominator} болса, кері сан 0 мен 1 арасында, натурал болмайды. 1 мен ${p.denominator} шеткі бөлгіштері де кіреді; еселіктерді таңдауға болмайды.`;break;
 }
 case'select-number-for-reciprocal-sum':{
  const target=R(p.target);options=p.values.map(show);const vs=p.values.map(R);a=one(options.filter((_,i)=>cmp(add(vs[i],inv(vs[i])),target)===0));s=`Оң санға өзінің керісін қосқанда ${show(p.target)} шықты. Тек берілген нұсқалар ішінен шартқа сай санды таңдаңыз.`;z=vs.map((q,i)=>`${options[i]} + ${mixed(inv(q))} = ${mixed(add(q,inv(q)))}`).join('; ')+`. Нысанаға тек ${a} нұсқасы тең. Оған кері ${mixed(inv(vs[options.indexOf(a)]))} саны да осындай қосынды берер еді, бірақ ол нұсқаларда жоқ.`;break;
 }
 case'reciprocal-of-difference-of-mixed-inverses':{
  const A=inv(R(p.first)),B=inv(R(p.second)),proof=plusProof([A,B],true);assert.ok(proof.value[0]>0);a=div(...inv(proof.value));s=`Алдымен ${show(p.first)} санына кері саннан ${show(p.second)} санына кері санды азайтыңыз. Содан кейін осы АЙЫРМАҒА кері санды жазыңыз.`;z=[p.first,p.second].map(mixedProof).join(' ')+` Олардың керілері ретімен ${Q(A)}, ${Q(B)}. ${proof.text} Соңғы қадам: ${inverseProof(proof.value).text} Сондықтан жауап ${a}, аралық айырмамен тоқтамаймыз.`;break;
 }
 case'positive-number-multiple-of-own-inverse':{
  const root=Math.sqrt(p.ratio);assert.ok(Number.isInteger(root)&&root>0);a=div(p.multiplier,root);s=`Оң сан өзінің керісінен ${p.ratio} есе үлкен. Сол оң санға кері санды ${p.multiplier} санына көбейткендегі нәтиже неше?`;z=`Сан a > 0 болсын. a = ${p.ratio} × ${F(1,'a')}. Екі жағын a санына көбейтсек, a × a = ${p.ratio}. ${root} × ${root} = ${p.ratio}, сондықтан оң a = ${root}. Кері сан ${F(1,root)}. Сұралғаны ${p.multiplier} × ${F(1,root)} = ${a}. Оңдық шарты теріс түбірді қоспайды.`;break;
 }
 case'select-proper-from-inverse-minus-self':{
  options=p.values.map(Q);a=one(options.filter((_,i)=>cmp(sub(inv(p.values[i]),p.values[i]),p.difference)===0));s=`Қай берілген дұрыс бөлшектің керісінен өзін азайтқанда дәл ${Q(p.difference)} шығады?`;z=p.values.map(q=>`${Q(inv(q))} − ${Q(q)} = ${mixed(sub(inv(q),q))}`).join('; ')+`. Көрсетілген ${Q(p.difference)} айырма тек ${a} бөлшегіне сәйкес келеді. Шарттағы айырманың өзін автоматты жауап деп ала алмаймыз.`;break;
 }
 case'reciprocal-of-three-unit-sum':{
  const qs=p.denominators.map(d=>[1,d]),proof=plusProof(qs);a=div(...inv(proof.value));s=`${qs.map(Q).join(' + ')} қосындысына кері болатын натурал санды табыңыз.`;z=proof.text+' '+inverseProof(proof.value).text+` Әр қосылғыштың керісін қосу ${p.denominators.join(' + ')} = ${sum(p.denominators)} береді, бірақ ол қосындының кері саны емес.`;break;
 }
 case'double-reciprocal-chain-product':{
  const q=R(p.value),r=inv(q);a=div(...mul(q,[p.multiplier,1]));s=`a мен b өзара кері, сондай-ақ b мен c өзара кері. a = ${show(p.value)} болса, ${p.multiplier} × c мәнін табыңыз.`;z=mixedProof(p.value)+` b = ${Q(r)}. Оны қайта кері айналдырсақ, c = ${Q(q)} = a. Сондықтан ${p.multiplier} × c = ${p.multiplier} × ${Q(q)} = ${a}. Екі рет кері айналдыру бастапқы оң санды қайтарады.`;break;
 }
 case'count-natural-inverse-in-strict-interval':{
  const low=div(p.denominator,p.upper),high=div(p.denominator,p.lower);a=high-low-1;assert.ok(a>0);s=`a — натурал сан. ${F('a',p.denominator)} бөлшегінің керісі ${p.lower} санынан ҮЛКЕН, бірақ ${p.upper} санынан КІШІ. a неше түрлі мән қабылдайды?`;z=`Кері сан ${F(p.denominator,'a')}. Шарт ${p.lower} < ${F(p.denominator,'a')} < ${p.upper}. ${p.lower} = ${F(p.denominator,high)}, ${p.upper} = ${F(p.denominator,low)}. Бірдей оң алымда бөлім өскенде мән кемиді, сондықтан ${low} < a < ${high}. Жарамды a: ${range(low+1,high-1).join(', ')}. Саны ${a}. a = ${low} не a = ${high} болғанда шекараға теңдік шығады, олар кірмейді.`;break;
 }
 case'select-number-with-smallest-reciprocal':{
  const vs=p.values.map(R),rs=vs.map(inv);options=p.values.map(show);a=one(options.filter((_,i)=>rs.every(t=>cmp(rs[i],t)<=0)));s='Берілген оң сандардың қайсысының кері саны ЕҢ КІШІ болады?';z=options.map((o,i)=>`${o} → ${mixed(rs[i])}`).join('; ')+`. Ең кіші кері ${mixed(rs[options.indexOf(a)])}, сондықтан жауап ${a}. Оң сан үлкен болған сайын керісі кіші; ең кіші бастапқы санды таңдамаймыз.`;break;
 }
 case'second-pump-time-from-joint-and-first':{
  const proof=plusProof([[1,p.jointHours],[1,p.firstHours]],true);assert.ok(proof.value[0]>0);a=div(...inv(proof.value));s=`Жылыжайдың бос су ыдысын бірінші сорғы жалғыз ${p.firstHours} сағатта, екі сорғы бірге ${p.jointHours} сағатта толтырады. Өнімділік тұрақты, су ағып шықпайды, сорғылар бір-бірінің өнімділігіне әсер етпейді. Екінші сорғы жалғыз осы ыдысты неше сағатта толтырады?`;z=`Бір сағатта бірге ${F(1,p.jointHours)}, бірінші жеке ${F(1,p.firstHours)} ыдыс толтырады. Екінші өнімділік — осы үлестер айырмасы. ${proof.text} Толық уақыт: ${inverseProof(proof.value).text} Сондықтан екінші сорғыға ${a} сағат керек. ${p.firstHours} − ${p.jointHours} = ${p.firstHours-p.jointHours} сағат деп уақыттарды тікелей азайту дұрыс емес.`;break;
 }
 case'increasing-fraction-product-cancellation':{
  const start=p.firstDenominator,last=p.lastNumerator;a=div(last,start);s=`${F(start+1,start)} × ${F(start+2,start+1)} × ${F(start+3,start+2)} × … × ${F(last,last-1)} көбейтіндісін табыңыз. Бөлімдер ${start}–${last-1} аралығындағы барлық натурал сан, әрқайсысы бір рет алынды.`;z=`Алымдағы ${start+1}–${last-1} көбейткіштері бөлімдегі дәл сондай сандармен қысқарады. Ең соңғы алым ${last}, ең алғашқы бөлім ${start} қалады: ${F(last,start)} = ${a}. Мысалы, алғашқы екеуі ${F(start+1,start)} × ${F(start+2,start+1)} = ${F(start+2,start)}. Қысқартуда шеткі екі көбейткішті жоғалтпаймыз.`;break;
 }
 case'reciprocal-coefficient-pair-equation':{
  const q=R(p.mixed),target=R(p.target);assert.equal(cmp(mul(q,p.inverse),[1,1]),0);a=show(p.target);options=opts(a,[mixed(inv(target)),mixed(mul(target,q)),mixed(mul(target,p.inverse))]);s=`(${show(p.mixed)} × x) × ${Q(p.inverse)} = ${show(p.target)} теңдеуін шешіп, x мәнін таңдаңыз.`;z=mixedProof(p.mixed)+` Көбейткіштерді топтаймыз: (${Q(q)} × ${Q(p.inverse)}) × x = 1 × x = x. Сондықтан x = ${a}. Кері тексеру: ${Q(q)} × ${Q(target)} × ${Q(p.inverse)} = ${Q(target)}. Оң жақты кері айналдырмаймыз, себебі сол жақтың бүкіл коэффициенті 1 болды.`;break;
 }
 case'select-unit-product-containing-mixed':{
  options=p.pairs.map(xs=>xs.map(show).join(' × '));a=one(options.filter((_,i)=>isPair(p.pairs[i])));s='Қай көбейтіндінің мәні ДӘЛ 1 болады? Аралас санның бүтін бөлігін де ескеріңіз.';z=p.pairs.map((xs,i)=>`${options[i]} = ${mixed(mul(...xs.map(R)))}`).join('; ')+`. Тек ${a} өзара кері көбейткіштерден тұрады. Қосындысы 1 болатын екі бөлшек міндетті түрде өзара кері емес.`;break;
 }
 case'unit-reciprocal-times-natural':{
  a=p.denominator*p.multiplier;s=`${F(1,p.denominator)} санының өзін емес, оған КЕРІ санды ${p.multiplier} санына көбейтіңіз.`;z=inverseProof([1,p.denominator]).text+` Одан кейін ${p.denominator} × ${p.multiplier} = ${a}. Бастапқы бірлік бөлшекті көбейтіп жібермейміз.`;break;
 }
 case'ascending-natural-reciprocals':{
  const ds=[...p.naturals].sort((a,b)=>b-a);a=ds.map(d=>F(1,d)).join(' < ');options=opts(a,[p.naturals.map(d=>F(1,d)).join(' < '),p.naturals.join(' < '),[ds[1],ds[0],ds[2]].map(d=>F(1,d)).join(' < ')]);s=`${p.naturals.join(', ')} сандарының керілерін тауып, олардың ӨСУ ретімен жазылған нұсқасын таңдаңыз.`;z=`Керілер ${p.naturals.map(d=>F(1,d)).join(', ')}. Оң бірлік бөлшекте бөлім үлкен болса, мәні кіші. ${ds.join(' > ')} болғандықтан ${a}. Бастапқы натурал сандардың өз реті керілердің ретіне қарама-қарсы.`;break;
 }
 case'select-between-proper-and-reciprocal':{
  const lo=p.value,hi=inv(lo);assert.ok(cmp(lo,hi)<0);options=p.choices.map(show);a=one(options.filter((_,i)=>cmp(R(p.choices[i]),lo)>0&&cmp(R(p.choices[i]),hi)<0));s=`Төмендегі қай сан ${Q(lo)} саны мен оған кері санның ҚАТАҢ арасында жатады?`;z=inverseProof(lo).text+` Сондықтан ${Q(lo)} < x < ${Q(hi)}. `+p.choices.map(v=>`${show(v)} — ${cmp(R(v),lo)>0&&cmp(R(v),hi)<0?'екі шекараның арасында':cmp(R(v),lo)<=0?'төменгі шекарадан аспайды':'жоғарғы шекарадан кіші емес'}`).join('; ')+`. Жалғыз жарамды нұсқа ${a}.`;break;
 }
 case'pace-per-kilometre-to-speed':{
  const q=inv(p.hoursPerKm);a=mixed(q);options=opts(a,[Q(p.hoursPerKm),String(p.hoursPerKm[1]),String(p.hoursPerKm[0]*p.hoursPerKm[1])]);s=`Қалалық велобағытта бірқалыпты жүрген велосипедші 1 км жолға ${Q(p.hoursPerKm)} сағат жұмсайды. Бір сағатта жүретін жолын км/сағ санымен таңдаңыз.`;z=`Жылдамдық v болса, ${Q(p.hoursPerKm)} × v = 1 км. Демек v осы уақытқа кері сан. ${inverseProof(p.hoursPerKm).text} Сондықтан ${a} км/сағ. Кері тексергенде жылдамдық × бір километрге кеткен уақыт = 1 км.`;break;
 }
 case'select-reciprocal-pair-given-difference':{
  const target=R(p.difference);assert.ok(p.pairs.every(isPair));options=p.pairs.map(pair);const deltas=p.pairs.map(xs=>sub(R(xs[0]),R(xs[1])));a=one(options.filter((_,i)=>cmp(deltas[i],target)===0));s=`Өзара кері екі оң санның ҮЛКЕНІ кішісінен ${show(p.difference)} шамасына артық. Қай жұп осы айырма талабын да орындайды?`;z='Барлық ұсынылған жұптардың көбейтіндісі 1. Сондықтан тек кері екенін тану жеткіліксіз, айырмасын да есептейміз: '+p.pairs.map((xs,i)=>`${show(xs[0])} − ${show(xs[1])} = ${mixed(deltas[i])}`).join('; ')+`. Қажетті айырмаға тек ${a} жұбы сәйкес.`;break;
 }
 case'reciprocal-times-constant-period-two-sequence':{
  const second=mul(inv(p.first),[p.multiplier,1]),third=mul(inv(second),[p.multiplier,1]);assert.equal(cmp(third,p.first),0);assert.equal(p.index%2,0);a=div(...second);s=`Тізбектің 1-мүшесі ${Q(p.first)}. Әр келесі мүше алдыңғысына КЕРІ санды ${p.multiplier} санына көбейту арқылы алынады. Осы ережемен ${p.index}-мүше неше болады?`;z=`2-мүше: ${mixed(inv(p.first))} × ${p.multiplier} = ${mixed(second)}. 3-мүше: ${Q(inv(second))} × ${p.multiplier} = ${Q(third)}, яғни бірінші мүше қайтты. Жалпы t оң болса, ${p.multiplier} санына көбейтілген керіге екі рет өту бастапқы t санын қайтарады: ${F(p.multiplier,F(p.multiplier,'t'))} = t. Сондықтан барлық тақ орын ${Q(p.first)}, барлық жұп орын ${mixed(second)}. ${p.index} жұп, жауап ${a}.`;break;
 }
 case'larger-natural-from-reciprocal-sum-and-ratio':{
  const small=div((p.ratio+1)*p.sum[1],p.ratio*p.sum[0]);a=p.ratio*small;assert.equal(cmp(add([1,small],[1,a]),p.sum),0);s=`Екі натурал санның үлкені кішісінің ${p.ratio} есесіне тең. Олардың кері сандарының қосындысы ${Q(p.sum)}. ҮЛКЕН санды табыңыз.`;z=`Кіші сан a, үлкені ${p.ratio} × a. Керілердің қосындысы ${F(1,'a')} + ${F(1,`${p.ratio} × a`)} = ${F(p.ratio+1,`${p.ratio} × a`)} = ${Q(p.sum)}. Тең бөлшектерден ${(p.ratio+1)*p.sum[1]} = ${p.ratio*p.sum[0]} × a, сондықтан a = ${small}. Үлкен сан ${p.ratio} × ${small} = ${a}. Тексеру: ${F(1,small)} + ${F(1,a)} = ${Q(p.sum)}, әрі ${a} = ${p.ratio} × ${small}. Кіші санмен тоқтамаймыз.`;break;
 }
 default:throw Error('Unknown reciprocal3.12model '+kind);
 }
 if(!options)s+=' Жауапқа тек санды жазыңыз.';if(options){assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else assert.match(String(a),/^\d+$/);assert.ok(!/[\\$^]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{})};
}
const specs=new Map(SPECS.map(s=>[prefix+s.id,s]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,prefix+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:prefix+spec.id,modelId:prefix+spec.kind,grade:5,topic:['reciprocal-times-constant-period-two-sequence'].includes(spec.kind)?'seq':['unit-factor-equation-one','mixed-factor-equation-one','reciprocal-coefficient-pair-equation'].includes(spec.kind)?'eq':'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Барлық 47 сақталған 3.12 невизуалды бастапқы шарт, толық ресми шешім мен MCQ жеке оқылды. Әрқайсысына жаңа деректер мен дербес қазақша шарт/шешім жазылды; сұралған алым/бөлім, санның өзі мен керісі, амалдар мен соңғы сұрақ жеке сақталды.',
 'Жаңа жағдайлар: шеберхана ыдысының құбырлары, стадиондағы екі оқушы, жылыжай сорғылары және қалалық велобағыт. Тұрақты өнімділік, ортақ жолдың секундына үлесі, бос көлем/су шықпауы және бір километрге кеткен уақыттың кері жылдамдығы түсіндірілді.',
 'Көбейтінді1,1-дің өзіне керілігі және0-ге кері санның жоқтығы — өзгермейтін анықтамалар. Өзінің керісіне қатысты жалпы пікірлерде оңдық домені анық көрсетілді; теріс−1 туралы қате жалпы қорытынды көшірілмеді. 47 редакция не модель47 жеке жаңа мағына дегенді білдірмейді. Native canonical бөлшектер, MCQ бөлшек/символ/тізім, ашық жауап тек бүтін сан; тәуелсіз review күтілуде.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const k of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[k]),canonicalEdition(e[k]));const rendered=renderEdition(row);for(const k of['statement','solution','options'])assert.equal(canonicalEdition(row[k]),canonicalEdition(rendered[k]));assert.equal(row.answer,rendered.answer);return{answer:rendered.answer,checks:['all47saved3.12fullconditions/solutions/MCQread','reciprocalofWHOLEmixed/sum/difference, numerator/denominator roles','zeroNEVERinverted, positiveproper/universal1facts explicitlybounded','fullnaturaldivisor/strictinterval/quadraticpositive/period2domains','workrate/routefraction/paceunits and inverseledgers','exactfullstatement/solution/options/key/allnestedparams/provenancebinding','independent review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const r of editions)verifyEdition(r);const out={schemaVersion:1,scope:'All47saved nonvisualgrade5topic3.12 source-specificdrafts. No newcapture/modelvariantsnotsemanticuniqueness; independentreviewpending.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-reciprocals.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
