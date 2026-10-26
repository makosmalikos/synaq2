/** Saved3.10 drafts, only external independent review may approve publication. */
import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';
import{canonicalEdition}from'./edition-review.mjs';import{grade5Sources}from'./grade5-inventory.mjs';import{SPECS}from'./grade5-unit-fractions-specs.mjs';
const prefix='grade5-unit-fractions-',sources=new Map(grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-10').map(q=>[q.sourceId,q]));
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a),lcm=(a,b)=>a/gcd(a,b)*b,div=(a,b)=>{assert.equal(a%b,0);return a/b;},range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=xs=>xs.reduce((a,b)=>a+b,0),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const norm=([n,d])=>{assert.ok(Number.isInteger(n)&&Number.isInteger(d)&&d>0);const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>norm([a[0]*b[1]+b[0]*a[1],a[1]*b[1]]),sub=(a,b)=>norm([a[0]*b[1]-b[0]*a[1],a[1]*b[1]]),cmp=(a,b)=>a[0]*b[1]-b[0]*a[1],sumQ=qs=>qs.reduce(add,[0,1]),unit=q=>{const[n,d]=norm(q);return n===1&&d>1;};
const side=x=>/^[0-9A-Za-z□]+$/.test(String(x))?String(x):`(${x})`,F=(n,d)=>`(${side(n)}/${side(d)})`,Q=q=>F(...q),M=(w,n,d)=>`(${w} + ${F(n,d)})`,mixed=q=>q[0]%q[1]===0?String(q[0]/q[1]):q[0]<q[1]?Q(q):M(Math.floor(q[0]/q[1]),q[0]%q[1],q[1]),U=ds=>ds.map(d=>F(1,d)).join(' + '),V=ds=>sumQ(ds.map(d=>[1,d])),list=xs=>xs.join(', '),opts=(a,xs)=>{const o=[a,...xs];assert.equal(new Set(o).size,4);return o;};
function proof(qs,ops=qs.slice(1).map(()=>'+')){const D=qs.map(q=>q[1]).reduce(lcm,1),ns=qs.map(([n,d])=>n*div(D,d));let n=ns[0];for(let i=1;i<ns.length;i++)n+=ops[i-1]==='+'?ns[i]:-ns[i];const value=norm([n,D]);return{value,text:`Ортақ бөлім ${D}: ${qs.map((q,i)=>`${Q(q)} = ${F(ns[i],D)}`).join('; ')}. Алымдар ${ns.map((n,i)=>(i?` ${ops[i-1]} `:'')+n).join('')} = ${n}, сондықтан нәтиже ${F(n,D)}${gcd(n,D)>1?` = ${mixed(value)}`:''}.`};}
function pairDomain(target){const[n,d]=target,lower=Math.floor(d/n)+1,upper=Math.ceil(2*d/n)-1,rows=[];for(let a=Math.max(2,lower);a<=upper;a++){const remainder=sub(target,[1,a]);if(remainder[0]>0&&remainder[1]%remainder[0]===0){const b=remainder[1]/remainder[0];if(b>a)rows.push([a,b]);}}return{lower:Math.max(2,lower),upper,rows};}
function tripleDomain(target){const[n,d]=target,rows=[];for(let a=2;a<3*d/n;a++){const r=sub(target,[1,a]);if(r[0]<=0)continue;for(const[b,c]of pairDomain(r).rows)if(a<b)rows.push([a,b,c]);}return rows;}
const definition='Бұл тапсырмада аликвоттық бөлшек дегеніміз — алымы 1, ал натурал бөлімі 1-ден үлкен бөлшек.';
function render(kind,p){let s,z,a,options,flags={};switch(kind){
 case'unit-definition-universal-property':{
  a='Аликвоттық бөлшектің әрқайсысы 1-ден кіші';options=opts(a,[`Ең кіші аликвоттық бөлшек ${F(1,p.falseMinimum)}`,`${F(1,1)} аликвоттық бөлшекке жатады`,'Аликвоттық бөлшек бұрыс болуы мүмкін']);s='Аликвоттық бөлшектер туралы барлық жағдайда орындалатын қасиетті таңдаңыз.';
  z=`${definition} 1 < n болғанда ${F(1,'n')} < 1, сондықтан бірінші тұжырым шын. Ең кіші мән болмайды: ${F(1,p.falseMinimum+1)} < ${F(1,p.falseMinimum)}. ${F(1,1)} = 1 анықтамадағы n > 1 шартын бұзады; бұрыс бөлшек те осы шартқа сай емес.`;break;
 }
 case'adjacent-unit-difference-denominator':case'unit-sum-reduces-to-unit':case'coprime-unit-sum':{
  const ds=kind==='adjacent-unit-difference-denominator'?[p.firstDenominator,p.secondDenominator]:p.denominators,minus=kind==='adjacent-unit-difference-denominator',pr=proof(ds.map(d=>[1,d]),[minus?'−':'+']);if(kind==='coprime-unit-sum'){a=Q(pr.value);options=opts(a,[F(2,sum(ds)),F(2,ds[0]*ds[1]),F(1,ds[0]*ds[1])]);s=`${U(ds)} қосындысының дәл мәнін таңдаңыз.`;}else{assert.ok(unit(pr.value));a=pr.value[1];s=`${F(1,ds[0])} ${minus?'−':'+'} ${F(1,ds[1])} = ${F(1,'n')}. Натурал n мәнін табыңыз.`;}z=pr.text+(minus?` Көршілес бөлімдерде айырма ${F(1,`${ds[0]} × ${ds[1]}`)} түрінде де жазылады.`:' Бөлімдерді өзара қосуға болмайды.')+(kind==='coprime-unit-sum'?'':` Қысқартылған нәтиженің бөлімі n = ${a}.`);break;
 }
 case'select-written-unit-fraction':{
  options=p.choices.map(Q);a=one(options.filter((_,i)=>p.choices[i][0]===1&&p.choices[i][1]>1));s='Қай бөлшек берілген жазылуында аликвоттық бөлшек болады?';z=definition+' '+p.choices.map(q=>`${Q(q)}: алымы ${q[0]}, бөлімі ${q[1]}; ${q[0]===1&&q[1]>1?'екі талапқа да сай':'талаптардың кемінде біреуіне сай емес'}`).join('; ')+`. Тек ${a} жарайды.`;break;
 }
 case'unit-missing-addend-no-reduction':case'unit-missing-addend-after-reduction':case'two-over-odd-missing-unit':{
  const target=p.total??p.target,pr=proof([target,[1,p.knownDenominator]],['−']);assert.ok(unit(pr.value));a=pr.value[1];s=`${Q(target)} = ${F(1,p.knownDenominator)} + ${F(1,'n')} теңдігі орындалатын натурал n санын анықтаңыз.`;z=`Белгісіз қосылғыш қосындыдан белгілі қосылғышты азайтуға тең. ${pr.text} Сондықтан n = ${a}. Тексеру: ${U([p.knownDenominator,a])} = ${Q(target)}. `+(kind==='two-over-odd-missing-unit'?'Екі бірдей бөлімді қосу емес, шарттағы белгілі бөлім сақталады.':'Қысқартылған бірлік алымы бар бөлшектің бөлімі сұралды.');break;
 }
 case'decompose-two-unit-sum':case'decompose-two-unit-divisor-split':case'two-over-odd-unit-decomposition':case'decompose-three-distinct-units':case'select-unit-split-adjacent-product':{
  const target=kind==='select-unit-split-adjacent-product'?[1,p.denominator]:p.target;options=p.choices.map(U);a=one(options.filter((_,i)=>cmp(V(p.choices[i]),target)===0&&new Set(p.choices[i]).size===p.choices[i].length));s=`${Q(target)} мәнін бөлімдері ӘРТҮРЛІ ${p.choices[0].length===3?'үш':'екі'} аликвоттық бөлшектің қосындысымен дұрыс көрсететін жазуды таңдаңыз.`;
  const chosen=p.choices[options.indexOf(a)],D=chosen.reduce(lcm,1),ns=chosen.map(d=>D/d);z=`Дұрыс үміткердің ортақ бөлімі ${D}: ${U(chosen)} = ${F(ns.join(' + '),D)} = ${Q(target)}. Бөлімдері ${list(chosen)} — бәрі 1-ден үлкен және әртүрлі. Қалған нұсқалар: ${p.choices.filter(ds=>ds!==chosen).map(ds=>`${U(ds)} = ${Q(V(ds))}`).join('; ')}.`+(kind==='select-unit-split-adjacent-product'?` Мұнда ${p.denominator} × ${p.denominator+1} = ${p.denominator*(p.denominator+1)} қажет, ${p.denominator}² емес.`:' Алымды ортақ бөлімнің тиісті бөлгіштеріне жіктеу бірлік бөлшектерді табуға көмектеседі.');break;
 }
 case'count-units-denominator-upper':case'count-units-strictly-above':{
  const end=kind==='count-units-denominator-upper'?p.maximum:p.thresholdDenominator-1,ds=range(2,end);a=ds.length;s=kind==='count-units-denominator-upper'?`Бөлімі ${p.maximum} санынан аспайтын аликвоттық бөлшектерді түгел санап шығыңыз. ${F(1,1)} есепке кірмейді.`:`${F(1,p.thresholdDenominator)} санынан ҚАТАҢ үлкен аликвоттық бөлшектер нешеу? Алым 1, бөлім 1-ден үлкен болуы тиіс.`;
  z=`Рұқсат етілген бөлімдер ${list(ds)}. Тиісті бөлшектер ${ds.map(d=>F(1,d)).join(', ')}. Саны ${end} − 2 + 1 = ${a}. `+(kind==='count-units-strictly-above'?`${F(1,p.thresholdDenominator)} шекараға тең, сондықтан кірмейді. `:'')+`${F(1,1)} анықтама бойынша алынбайды.`;break;
 }
 case'single-strict-unit-denominator-between':{
  a=one(range(p.upperDenominator+1,p.lowerDenominator-1));s=`${F(1,p.lowerDenominator)} < ${F(1,'n')} < ${F(1,p.upperDenominator)}. Екі қатаң шартты да орындайтын натурал n қандай?`;z=`Алымдар бірдей 1 болғанда бөлімдер кері реттеледі: ${p.upperDenominator} < n < ${p.lowerDenominator}. Аралықтағы жалғыз натурал сан ${a}. Шеткі ${p.upperDenominator} және ${p.lowerDenominator} мәндері теңдік бергендіктен жарамайды.`;break;
 }
 case'count-written-unit-fractions':{
  const good=p.fractions.filter(([n,d])=>n===1&&d>1);a=good.length;s=`${p.fractions.map(Q).join('; ')} тізіміндегі аликвоттық бөлшектер нешеу?`;z=`Жазылуында алымы 1 және бөлімі 1-ден үлкендер: ${good.map(Q).join(', ')}. Барлығы ${a}. Алымы 1 емес бөлшектер алынбайды; ${F(3,3)} = 1 және ${F(8,1)} = 8 дұрыс бірлік бөлшек емес.`;break;
 }
 case'smallest-unit-one-digit-denominator':{
  a=p.maximumDigit;s=`Карталарда бөлімі бір таңбалы натурал сан болатын барлық аликвоттық бөлшек жазылған. Ең КІШІ мәні бар картадағы бөлімді жазыңыз.`;z=`Бөлім 1 болмайды, сондықтан мүмкін бөлімдер 2–${p.maximumDigit}. Бірдей алым 1 үшін бөлім үлкейген сайын бөлшек кішірейеді. Ең үлкен бір таңбалы бөлім ${a} ең кіші ${F(1,a)} мәнін береді. ${F(1,2)} керісінше ең үлкен мән.`;break;
 }
 case'choose-three-unit-sum-one':{
  options=p.choices.map(U);a=one(options.filter((_,i)=>cmp(V(p.choices[i]),[1,1])===0));s='Үш түрлі бірлік бөлшек қосылған төрт жазу берілген. Қайсысының мәні дәл 1?';z=p.choices.map(ds=>`${U(ds)} = ${mixed(V(ds))}`).join('; ')+`. Дәл бір бүтін беретін жазу ${a}. Қалған қосындылар 1-ден үлкен не кіші.`;break;
 }
 case'greatest-unit-definition':{
  a=F(1,2);options=opts(a,[F(1,p.distractorDenominator),F(1,1),'Ең үлкен мән болмайды']);s='Барлық аликвоттық бөлшектердің ең үлкенін таңдаңыз.';z=`${definition} Ең кіші рұқсат етілген бөлім 2. Бірдей алымда кіші бөлім үлкен мән береді, сондықтан максимум ${a}. ${F(1,1)} анықтамаға кірмейді. Ең кіші мән жоқ болғанымен, ең үлкен мән бар; бұл екі ұғымды шатастырмаймыз.`;break;
 }
 case'count-numerators-reducing-to-unit':{
  const ds=range(1,p.denominator).filter(n=>p.denominator%n===0),valid=ds.filter(n=>n<p.denominator);a=valid.length;s=`${F('n',p.denominator)} бөлшегін қажет болса толық қысқартқанда аликвоттық бөлшек шығуы керек. Осы талапқа сай натурал n неше түрлі мән қабылдайды?`;z=`Алымы 1 болу үшін n саны ${p.denominator} санының бөлгіші болуы тиіс. Барлық бөлгіш ${list(ds)} — ${ds.length} сан. n = ${p.denominator} болса бөлшек 1 болады, ол алынбайды. n = 1 өзі бірлік бөлшек бергендіктен саналады. Қалған ${a} мәннің әрқайсысында ${F('n',p.denominator)} = ${F(1,`${p.denominator} : n`)}.`;break;
 }
 case'unknown-subtracted-unit-denominator':{
  const pr=proof([[1,p.firstDenominator],[1,p.differenceDenominator]],['−']);assert.ok(unit(pr.value));a=pr.value[1];s=`${F(1,p.differenceDenominator)} = ${F(1,p.firstDenominator)} − ${F(1,'n')}. Белгісіз бөлім n неге тең?`;z=`Белгісіз азайтқышты табамыз: ${F(1,'n')} = ${F(1,p.firstDenominator)} − ${F(1,p.differenceDenominator)}. ${pr.text} Демек n = ${a}. Кері тексеру: ${F(1,p.firstDenominator)} − ${F(1,a)} = ${F(1,p.differenceDenominator)}.`;break;
 }
 case'split-unit-adjacent-plus-product':{
  a=p.denominator*(p.denominator+1);s=`${F(1,p.denominator)} = ${F(1,p.denominator+1)} + ${F(1,'n')} теңдігін дұрыс ететін натурал n санын табыңыз.`;z=`Қалдық бірлік бөлшек: ${proof([[1,p.denominator],[1,p.denominator+1]],['−']).text} Сондықтан n = ${p.denominator} × ${p.denominator+1} = ${a}. Тексеру: ${U([p.denominator+1,a])} = ${F(1,p.denominator)}. Екі бөлім әртүрлі, біреуі ${p.denominator+1}, екіншісі ${a}.`;break;
 }
 case'greatest-two-unit-sum':{
  options=p.choices.map(U);const vs=p.choices.map(V),best=one(vs.map((q,i)=>vs.every(t=>cmp(q,t)>=0)?i:null).filter(i=>i!==null));a=options[best];s='Бірлік бөлшектердің төрт қосындысын салыстырып, ең үлкен мән беретінін таңдаңыз.';const D=vs.map(q=>q[1]).reduce(lcm,1);z=p.choices.map((ds,i)=>`${U(ds)} = ${Q(vs[i])}`).join('; ')+`. Ортақ ${D} бөлімдегі алымдар ретімен ${list(vs.map(([n,d])=>n*div(D,d)))}. Ең үлкені ${vs[best][0]*div(D,vs[best][1])}, сондықтан жауап ${a}. Бөлімдердің қосындысына қарап таңдамаймыз.`;break;
 }
 case'third-unit-for-given-total':case'four-unit-sum-one-missing':{
  const known=p.knownDenominators.map(d=>[1,d]),target=kind==='four-unit-sum-one-missing'?[1,1]:p.total,used=sumQ(known),left=sub(target,used);assert.ok(unit(left));a=left[1];s=`${U(p.knownDenominators)} + ${F(1,'n')} = ${Q(target)}. Натурал n санын табыңыз.`;z=`Белгілі қосылғыштар: ${proof(known).text} Қалдық: ${proof([target,used],['−']).text} Сондықтан n = ${a}. Тексеру: ${U([...p.knownDenominators,a])} = ${Q(target)}; бөлімдері әртүрлі.`;break;
 }
 case'equal-share-half-plus-unit':case'half-plus-unit-from-residual-half':{
  const share=norm([p.wholes,p.people]),left=sub(share,[1,p.firstDenominator]);assert.ok(unit(left));a=left[1];s=kind==='equal-share-half-plus-unit'?`${p.wholes} бірдей нан ${p.people} адамға тең бөлінеді. Әр адамға жарты нан және тағы нанның ${F(1,'n')} бөлігі беріледі. Ешбір нан тұтасымен ${p.people} тең бөлікке бөлінбейді. n неге тең?`:`Ұзындығы бірдей ${p.wholes} таспа ${p.people} оқушыға тең үлестіріледі. Әрқайсысына жарты таспа және тағы ${F(1,'n')} таспа беріледі. Тұтас таспаны ${p.people} тең бөлікке кеспей осылай бөлуге болады. n мәнін анықтаңыз.`;
  z=`Бір адамға ${Q(share)} бүтін тиеді. Жартыдан қалған үлес: ${proof([share,[1,p.firstDenominator]],['−']).text} Демек n = ${a}. `+(kind==='equal-share-half-plus-unit'?`${p.people/2} нанды екіге бөліп ${p.people} жарты аламыз. Қалған ${p.wholes-p.people/2} нанның әрқайсысын ${a} тең бөлікке бөлсек, ${p.people} дана ${F(1,a)} шығады. Тек 2 және ${a} тең бөліктер қолданылды.`:`Алғашқы ${p.wholes-1} таспаны екіге бөліп ${2*(p.wholes-1)} жарты аламыз. Соңғы таспаның бір жартысы қалған оқушыға беріледі. Оның екінші жартысы ${p.people} тең бөлікке бөлінгенде әр бөлік толық таспаның ${F(1,a)} үлесіне тең болады. Соңғы таспа түгелімен ${p.people} тең бөлікке бөлінген жоқ: оның бір жартысы бүтін сақталды.`);break;
 }
 case'equal-sharing-without-direct-equal-cut':{
  const share=norm([p.wholes,p.people]);options=p.choices.map(U);a=one(options.filter((_,i)=>cmp(V(p.choices[i]),share)===0));s=`${p.wholes} бірдей бәліш ${p.people} балаға тең бөлінеді. Алғашқы 3 бәліш екіге, соңғысы 42 тең бөлікке кесіледі; ешбір бәліш тұтасымен ${p.people} тең бөлікке бөлінбейді. Бірнеше ұсақ бөлікті бір үлес ретінде біріктіруге болады. Әр баланың толық үлесін көрсететін қосындыны таңдаңыз.`;
  z=`Әр бала ${Q(share)} бәліш алуы керек. Үш бәліштен ${p.people} жарты шығады. Соңғы бәліштің 42 ұсақ бөлігін әр бала 7 данадан алады: 6 бөлік ${F(6,42)} = ${F(1,7)}, бір бөлік ${F(1,42)}. Демек үлес ${a}. Тексеру: ${proof([[1,2],[1,7],[1,42]]).text} Әр балаға бір жарты мен жеті ұсақ бөлік беріледі, бүкіл 42 бөлік түгел жұмсалады.`;break;
 }
 case'equal-cut-cap-unit-sharing':{
  const share=norm([p.wholes,p.people]);options=p.choices.map(U);a=one(options.filter((_,i)=>cmp(V(p.choices[i]),share)===0&&p.choices[i].every(d=>d<=p.maximumEqualPieces)));s=`${p.wholes} бірдей бәліш ${p.people} адамға тең беріледі. Әр бәліш тек ӨЗАРА ТЕҢ бөліктерге кесіледі және бір бәліштен ${p.maximumEqualPieces} бөліктен артық шығуға болмайды. Әр адамға төмендегі қосындылардың қайсысындай екі бөлік беруге болады?`;
  const ds=p.choices[options.indexOf(a)];assert.ok(ds.every(d=>p.people%d===0));z=`Бір адамға ${Q(share)} бәліш тиеді. ${U(ds)} = ${Q(share)}, бөлімдер ${list(ds)} шектен аспайды. ${p.people/ds[0]} бәлішті ${ds[0]}, қалған ${p.people/ds[1]} бәлішті ${ds[1]} тең бөлікке бөлсек, әр өлшемнен ${p.people} дана аламыз; барлығы ${p.wholes} бәліш. ${U(p.choices[0])} те сан жағынан ${Q(share)} береді, бірақ 12 тең бөлікті қажет етеді, ал 12 > ${p.maximumEqualPieces}. Сондықтан тең мәннің өзі кесу талабын орындауға жеткіліксіз.`;break;
 }
 case'short-neighbour-product-telescoping':case'long-neighbour-product-reduced-terms-sum':{
  const start=kind==='short-neighbour-product-telescoping'?p.start:1,last=kind==='short-neighbour-product-telescoping'?p.start+p.terms-1:p.lastIndex,end=last+1,q=sub([1,start],[1,end]);
  const terms=range(start,last).map(n=>F(1,`${n} × ${n+1}`));s=terms.length>4?`${terms.slice(0,3).join(' + ')} + … + ${terms.at(-1)}`:terms.join(' + ');
  if(kind==='short-neighbour-product-telescoping'){a=Q(q);options=opts(a,[F(1,start),F(1,last*end),F(1,10)]);s+=' қосындысының мәнін таңдаңыз.';}else{a=q[0]+q[1];s+=` қосындысы қысқартылмайтын ${F('a','b')} түрінде жазылды. a + b неге тең?`;}
  z=`Әр қосылғыш ${F(1,'k × (k + 1)')} = ${F(1,'k')} − ${F(1,'k + 1')} түріне келеді. Көршілес жақшалардағы аралық мүшелер бір рет қосылып, бір рет азайтылады. Тек ${F(1,start)} − ${F(1,end)} қалады: ${proof([[1,start],[1,end]],['−']).text}`+(kind==='long-neighbour-product-reduced-terms-sum'?` ЕҮОБ(${q[0]}, ${q[1]}) = 1. Сондықтан a + b = ${q[0]} + ${q[1]} = ${a}.`:' Соңғы жақшадағы азайтылатын бөлімді ұмытуға болмайды.');break;
 }
 case'count-unit-pair-decompositions':{
  const domain=pairDomain([1,p.denominator]);a=domain.rows.length;s=`${F(1,p.denominator)} = ${F(1,'x')} + ${F(1,'y')} теңдігін орындайтын x < y натурал бөлім жұбы нешеу? Бір жұптағы орын ауыстыру бөлек тәсіл болып саналмайды.`;
  z=`Екі қосылғыш оң, сондықтан x > ${p.denominator}. x < y болғанда бірінші қосылғыш қосындының жартысынан үлкен, демек x < ${2*p.denominator}. Барлық x мәні ${domain.lower}–${domain.upper}. Әр x үшін y = ${F(`${p.denominator} × x`,`x − ${p.denominator}`)} натурал болуы керек. Толық тексеру: ${range(domain.lower,domain.upper).map(x=>{const y=norm([p.denominator*x,x-p.denominator]);return`x = ${x} → y = ${y[1]===1?y[0]:Q(y)}`;}).join('; ')}. Жарамды жұптар ${domain.rows.map(([x,y])=>`(${x}, ${y})`).join('; ')} — ${a} тәсіл. x = y = ${2*p.denominator} шартына сай емес.`;break;
 }
 case'minimum-first-unit-denominator-second':{
  const domain=pairDomain(p.target),[first,second]=domain.rows[0];assert.equal(first,domain.lower);a=second;s=`${Q(p.target)} = ${F(1,'a')} + ${F(1,'b')}, мұнда 1 < a < b — натурал сандар. a ең аз мүмкін мәнге тең болғанда b неше болады?`;
  z=`${F(1,'a')} қосындыдан кіші, сондықтан ${p.target[0]} × a > ${p.target[1]}; ең кіші үміткер a = ${first}. Оны тексереміз: ${proof([p.target,[1,first]],['−']).text} Бұл ${F(1,second)}, сондықтан b = ${second}. ${first} < ${second} орындалады. Бұдан кіші a тіпті бірінші қосылғыштың шамасына қойылған шартты орындамайды. Сұралғаны a емес, b.`;break;
 }
 case'skip-two-product-telescoping':{
  const q=sub([1,p.start],[1,p.lastEndpoint]);a=Q(q);options=opts(a,[F(q[0]/2,q[1]),F(p.lastEndpoint-3,p.lastEndpoint-2),F(p.lastEndpoint-2,p.lastEndpoint)]);const is=range(0,(p.lastEndpoint-p.start)/p.step-1).map(i=>p.start+i*p.step),terms=is.map(n=>F(p.step,`${n} × ${n+p.step}`));s=`${terms.slice(0,3).join(' + ')} + … + ${terms.at(-1)} қосындысын табыңыз.`;
  z=`${F(2,'k × (k + 2)')} = ${F(1,'k')} − ${F(1,'k + 2')}. Сондықтан әр аралық тақ бөлім бір рет азайтылып, келесі жақшада қосылады. Тек ${F(1,p.start)} − ${F(1,p.lastEndpoint)} = ${a} қалады. Алымдағы 2-ні тастау нәтижені екі есе кемітеді; соңғы оң жақ бөлім ${p.lastEndpoint}, одан бұрынғы ${p.lastEndpoint-2} емес.`;break;
 }
 case'largest-distinct-unit-sum':{
  const ds=range(2,p.count+1),q=V(ds);a=mixed(q);options=opts(a,[String(p.count/2),M(1,1,12),F(1,4)]);s=`Бөлімдері өзара ӘРТҮРЛІ ${p.count} аликвоттық бөлшекті қосқанда ең үлкен қандай мән алуға болады?`;
  z=`Өсу ретімен тұрған бөлімдер кемінде ${list(ds)} болады. Әр келесі бөлімді одан үлкейту сол қосылғышты кішірейтеді. Сондықтан максимум ең кіші әртүрлі бөлімдерде: ${U(ds)}. ${proof(ds.map(d=>[1,d])).text} Аралас түрде ${a}. Бір ${F(1,2)} бөлшегін ${p.count} рет алуға болмайды, өйткені бөлімдер әртүрлі болуы тиіс; бөлім 1 де рұқсат етілмейді.`;break;
 }
 case'minimum-number-of-unit-addends':{
  const domain=pairDomain(p.target);assert.ok(!unit(p.target)&&domain.rows.length===0&&cmp(V(p.witness),p.target)===0);a=p.witness.length;s=`${Q(p.target)} мәнін бөлімдері әртүрлі аликвоттық бөлшектердің қосындысымен жазу қажет. Ең АЗ неше қосылғыш жеткілікті?`;
  z=`Бір қосылғыш болмайды: қысқартылған ${Q(p.target)} алымы 1 емес. Екі қосылғыш болса, үлкені ${F(1,'a')} үшін қосындының жартысынан үлкен әрі қосындыдан кіші болу керек. Бірінші бөлімнің барлық мүмкін мәні: ${list(range(domain.lower,domain.upper))}. ${range(domain.lower,domain.upper).map(d=>`${Q(p.target)} − ${F(1,d)} = ${Q(sub(p.target,[1,d]))}, бұл аликвоттық емес`).join('; ')}. Екі қосылғыш жетпейді. Ал ${U(p.witness)} = ${Q(p.target)}: ${proof(p.witness.map(d=>[1,d])).text} Бөлімдері әртүрлі, сондықтан ең аз саны ${a}.`;break;
 }
 case'three-original-unit-shares-left':{
  const used=V(p.denominators),q=sub([1,1],used);a=Q(q);options=opts(a,[Q(used),F(1,6),'Ештеңе қалмады']);s=`Бір бақша телімінің БАСТАПҚЫ ауданының ${F(1,p.denominators[0])} бөлігі бірінші, ${F(1,p.denominators[1])} бөлігі екінші, ${F(1,p.denominators[2])} бөлігі үшінші топқа бөлінді. Үлестер қабыспайды. Телімнің қандай бөлігі әлі бөлінген жоқ?`;
  z=`Бөлінген үлес: ${proof(p.denominators.map(d=>[1,d])).text} Қалған бөлік: ${proof([[1,1],used],['−']).text} Барлық бөлшек бір бастапқы ауданға қатысты; әр қадамда қалған ауданның үлесін алып отырған жоқпыз.`;break;
 }
 case'dyadic-sum-complement':{
  const ds=range(1,p.terms).map(i=>2**i),D=ds.at(-1),q=[1,D];a=Q(q);options=opts(a,[F(D-1,D),F(1,D/2),F(1,2*D)]);s=`S = ${U(ds)}. Қосындының өзін емес, 1 − S айырмасын таңдаңыз.`;
  z=`Ортақ бөлім ${D}, алымдар ${list(ds.map(d=>D/d))}. Олардың қосындысы ${D-1}, демек S = ${F(D-1,D)}. Сондықтан 1 − S = ${F(D,D)} − ${F(D-1,D)} = ${a}. Біртіндеп азайтсақ, әр қадамнан кейінгі қалдық соңғы азайтылған бөлшекке тең; соңғысы ${F(1,D)}.`;break;
 }
 case'telescoping-last-denominator-from-target':{
  const gap=sub([1,1],p.target);assert.ok(unit(gap));const last=gap[1]-1;a=last*(last+1);s=`${F(1,2)} + ${F(1,6)} + ${F(1,12)} + ${F(1,20)} + … + ${F(1,'n')} = ${Q(p.target)}. Бөлімдер k × (k + 1) заңдылығымен жүреді: 1 × 2, 2 × 3, 3 × 4, … . Соңғы қосылғыштың БӨЛІМІ n қандай?`;
  z=`Алғашқы k қосылғыштың қосындысы көршілес бірлік бөлшектерді қысқартудан 1 − ${F(1,'k + 1')} болады. Қалдық 1 − ${Q(p.target)} = ${Q(gap)}, сондықтан k + 1 = ${gap[1]}, k = ${last}. Соңғы бөлім n = ${last} × ${last+1} = ${a}. ${last} — қосылғыштар саны, ${last+1} — келесі бірлік бөлшектің бөлімі; олардың ешқайсысы n емес.`;break;
 }
 case'unique-three-distinct-units-total-one':{
  const ds=one(tripleDomain([1,p.total]));a=sum(ds);assert.deepEqual(ds,[2,3,6]);s=`Ойындағы үш картаға ${F(1,'a')}, ${F(1,'b')}, ${F(1,'c')} жазылған. Бөлімдер 1 < a < b < c — натурал сандар, ал үш мәннің қосындысы 1. Үш бөлімнің қосындысы a + b + c неше?`;
  z=`a ≥ 3 болса ең үлкен мүмкін үштік ${U([3,4,5])} = ${F(47,60)} < 1; сондықтан a = 2. Қалған екі үлес ${F(1,2)} береді. b < c болғандықтан ${F(1,'b')} осы қалдықтың жартысынан үлкен, яғни b < 4. Сонымен 2 < b < 4, b = 3. Қалдық ${F(1,2)} − ${F(1,3)} = ${F(1,6)}, c = 6. Бөлімдер қосындысы 2 + 3 + 6 = ${a}. Осы шектеулерден басқа натурал бөлімдер жарамайды.`;break;
 }
 case'impossible-two-unit-decomposition':{
  const domain=pairDomain(p.target);assert.equal(domain.rows.length,0);a='Мүмкін емес';options=opts(a,p.offered.map(ds=>`Мүмкін: ${U(ds)}`));s=`${Q(p.target)} мәнін екі ӘРТҮРЛІ аликвоттық бөлшек қосындысымен жазуға бола ма? Толық дәлелге сәйкес жауапты таңдаңыз.`;
  z=`Бөлімдерді a < b деп реттейміз. Үлкен қосылғыш ${F(1,'a')} қосындыдан кіші, оның жартысынан үлкен. Осыдан a тек ${list(range(domain.lower,domain.upper))} мәндерін алады. ${range(domain.lower,domain.upper).map(d=>`${Q(p.target)} − ${F(1,d)} = ${Q(sub(p.target,[1,d]))}; алымы 1 емес, қысқартылған бөлшек аликвоттық емес`).join('; ')}. Басқа a болмайтындықтан екі қосылғышпен мүмкін емес. Ұсынылған ${p.offered.map(U).join('; ')} жазуларының да ешқайсысы берілген мәнге тең емес.`;break;
 }
 case'ascending-three-unit-fractions':{
  const ds=p.denominators.toSorted((a,b)=>b-a);a=ds.map(d=>F(1,d)).join(' < ');options=opts(a,[p.denominators.toSorted((a,b)=>a-b).map(d=>F(1,d)).join(' < '),p.denominators.map(d=>F(1,d)).join(' < '),[p.denominators[2],p.denominators[1],p.denominators[0]].map(d=>F(1,d)).join(' < ')]);s=`${p.denominators.map(d=>F(1,d)).join('; ')} бөлшектерінің ӨСУ ретін дұрыс көрсететін жазуды таңдаңыз.`;
  z=`Барлық алым 1. Бөлімдердің кему реті ${ds.join(' > ')}, сондықтан мәндер кері ретпен ${a}. Тек цифрлардың өсу ретіне қарап жазу бөлшек мәндерін кері орналастырады.`;break;
 }
 case'select-fraction-not-reducing-to-unit':{
  options=p.fractions.map(Q);a=one(options.filter((_,i)=>!unit(p.fractions[i])));s=`Бөлшектерді толық қысқартқаннан кейін тек біреуінен аликвоттық бөлшек шықпайды. Сол берілген бөлшекті таңдаңыз.`;z=p.fractions.map(q=>`${Q(q)} = ${Q(norm(q))}, ${unit(q)?'бірлік алым мен 1-ден үлкен бөлім шығады':'қысқартылған алымы 1 емес'}`).join('; ')+`. Жауап ${a}. Алым бастапқыда 1 болмауы кедергі емес, қысқартылған түрі тексеріледі.`;break;
 }
 case'denominator-increment-unit-difference':{
  const hits=range(2,p.differenceDenominator).filter(n=>n*(n+1)===p.differenceDenominator);a=one(hits);s=`${F(1,'n')} аликвоттық бөлшегінің бөлімін бір бірлікке арттырғанда мәні ${F(1,p.differenceDenominator)} шамасына кеміді. Бастапқы бөлім n қандай?`;
  z=`Айырма ${F(1,'n')} − ${F(1,'n + 1')} = ${F(1,'n × (n + 1)')}. Сондықтан n × (n + 1) = ${p.differenceDenominator}. Көршілес ${a} және ${a+1} сандарының көбейтіндісі осы санға тең. Оң n артқанда n × (n + 1) қатаң өседі, басқа шешім жоқ. Тексеру: ${F(1,a)} − ${F(1,a+1)} = ${F(1,p.differenceDenominator)}.`;break;
 }
 case'greedy-last-unit-denominator':{
  const steps=[];let current=p.target;while(!unit(current)){const d=Math.max(2,Math.ceil(current[1]/current[0])),next=sub(current,[1,d]);assert.ok(next[0]>0);steps.push([current,d,next]);current=next;assert.ok(steps.length<15);}a=current[1];s=`${Q(p.target)} мәнін бірлік бөлшектерге жіктейміз: әр қадамда қалдықтан одан АСПАЙТЫН ЕҢ ҮЛКЕН аликвоттық бөлшекті алып тастаймыз. Қалдық өзі аликвоттық болса, оны соңғы қосылғыш ретінде алып тоқтаймыз. Ең соңғы бөлшектің бөлімі неше?`;
  z=steps.map(([q,d,left])=>`${Q(q)} қалдығында ${F(1,d)} ең үлкен жарамды бірлік бөлшек: ${d>2?`${F(1,d-1)} одан үлкен және қалдықтан асады, ал `:''}${F(1,d)} ≤ ${Q(q)}. Азайтсақ ${proof([q,[1,d]],['−']).text}`).join(' ')+` Соңғы ${Q(current)} аликвоттық болғандықтан тоқтаймыз. Жіктеу ${U([...steps.map(t=>t[1]),current[1]])} = ${Q(p.target)}. Сұралған соңғы бөлім ${a}.`;break;
 }
 case'equal-unit-addends-still-unit':{
  options=p.denominators.map(d=>F(1,d));a=one(options.filter((_,i)=>unit([p.count,p.denominators[i]])));s=`Бір аликвоттық бөлшектің ${p.count} бірдей көшірмесін қоссақ, нәтиже де аликвоттық бөлшек болуы керек. Қай қосылғыш жарайды?`;z=p.denominators.map(d=>`${p.count} дана ${F(1,d)} қосындысы ${F(p.count,d)} = ${mixed(norm([p.count,d]))}; ${unit([p.count,d])?'алынғаны аликвоттық':'анықтамаға сай емес'}`).join('; ')+`. Бөлімнің ${p.count} санына бөлінуі ғана жеткіліксіз: нәтижедегі бөлім 1-ден үлкен болуы тиіс. Сондықтан ${F(1,4)} үшін 1 шығуы жарамайды.`;break;
 }
 case'same-addition-numerator-denominator':{
  const newN=1+p.added,newD=div(newN*p.target[1],p.target[0]);a=newD-p.added;assert.ok(a>1);s=`${F(1,'n')} бөлшегінің АЛЫМЫНА да, БӨЛІМІНЕ де ${p.added} қосылды. Жаңа бөлшек ${Q(p.target)} мәніне тең болды. Бастапқы натурал бөлім n неше?`;
  z=`Жаңа бөлшек ${F(`1 + ${p.added}`,`n + ${p.added}`)} = ${F(newN,`n + ${p.added}`)}. ${Q(p.target)} = ${F(newN,newD)}, сондықтан бөлімдер тең: n + ${p.added} = ${newD}. n = ${newD} − ${p.added} = ${a}. Кері тексеру ${F(`1 + ${p.added}`,`${a} + ${p.added}`)} = ${Q(p.target)}. Бұл алым мен бөлімді бір санға көбейту амалы емес.`;break;
 }
 case'choose-true-three-unit-identity':{
  options=p.choices.map(ds=>`${Q(p.target)} = ${U(ds)}`);a=one(options.filter((_,i)=>cmp(V(p.choices[i]),p.target)===0));s='Үш аликвоттық бөлшектің қосындысына қатысты төрт теңдік берілген. Бір теңдік қана шын; қалғандары әдейі қате. Шын жазуды таңдаңыз.';z=p.choices.map(ds=>`${U(ds)} = ${Q(V(ds))}${cmp(V(ds),p.target)===0?' — берілген мәнге тең':' — берілген мәнге тең емес'}`).join('; ')+`. Дұрыс жазу ${a}. Әр нұсқаның үш бөлімі әртүрлі, бірақ бұл олардың қосындысы бірдей дегенді білдірмейді.`;flags.intentionalIncorrectExample=true;break;
 }
 case'three-parallel-unit-work-times':{
  const rate=V(p.times);assert.ok(unit(rate));a=rate[1];s=`Үш бригада бір тапсырысты жеке орындаса ретімен ${list(p.times)} күнде бітіре алады. Өнімділіктері тұрақты. Бір мезгілде бастағанда атқарған бөліктері қабыспайды. Үшеуі бірге тапсырысты неше күнде орындайды?`;
  z=`Бір күндегі үлестер ${U(p.times)}. ${proof(p.times.map(d=>[1,d])).text} Бір күнде ${F(1,a)} жұмыс біткендіктен, толық жұмыс ${a} күнде бітеді. Тексеру: ${p.times.map(d=>F(a,d)).join(' + ')} = 1. Жеке уақыттарды қосу не орташа алу бірлескен өнімділікті бермейді.`;break;
 }
 case'harmonic-block-strict-bounds':{
  const count=p.lastDenominator-p.firstDenominator+1,low=norm([count,p.lastDenominator]),high=norm([count,p.firstDenominator]);assert.deepEqual(low,[1,2]);assert.ok(cmp(high,[1,1])<0);a=`${Q(low)} < A < 1`;options=opts(a,[`A < ${Q(low)}`,`A = ${Q(low)}`,'A > 1']);s=`A = ${F(1,p.firstDenominator)} + ${F(1,p.firstDenominator+1)} + … + ${F(1,p.lastDenominator)}; бөлімдер ${p.firstDenominator}–${p.lastDenominator} аралығындағы барлық натурал сан. Үлкен ортақ бөлім іздемей, A туралы дұрыс бағалауды таңдаңыз.`;
  z=`Қосылғыш саны ${p.lastDenominator} − ${p.firstDenominator} + 1 = ${count}. Әрқайсысы ${F(1,p.lastDenominator)} санынан кіші емес, әрі біреуінен басқасы одан үлкен. Сондықтан A > ${count} × ${F(1,p.lastDenominator)} = ${Q(low)}. Әрқайсысы ${F(1,p.firstDenominator)} санынан үлкен емес, әрі біреуінен басқасы одан кіші: A < ${count} × ${F(1,p.firstDenominator)} = ${Q(high)} < 1. Демек ${a}. Шеттердің біреуіне тең қосылғыш болуы жалпы қосындыны сол бағалауға тең етпейді.`;break;
 }
 default:throw Error('Unfinished source3.10 model '+kind);
 }
 if(!options)s+=' Жауапқа тек санды жазыңыз.';if(options){assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===String(a)).length,1);}else assert.match(String(a),/^\d+$/);assert.ok(!/[\\$^]/.test(s+z));return{statement:s,answer:String(a),solution:z,...(options?{options}:{}),...flags};
}
const specs=new Map(SPECS.map(s=>[prefix+s.id,s]));
export function renderEdition(row){const spec=specs.get(row.editionId);assert.ok(spec);assert.equal(row.modelId,prefix+spec.kind);assert.equal(canonicalEdition(row.params),canonicalEdition(spec.params));return render(spec.kind,row.params);}
export function buildEditions(){return SPECS.map(spec=>{const src=sources.get(spec.id);assert.ok(src);return{editionId:prefix+spec.id,modelId:prefix+spec.kind,grade:5,topic:'frac',difficulty:src.level===3?'hard':src.level===1?'basic':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:src.sourceFile,sourceId:src.sourceId}],adaptationChanges:[
 'Сақталған 3.10 тақырыбының 51 невизуалды бастапқы шарты, толық шешімі мен барлық нұсқалары жеке оқылды. Жаңа деректер мен қазақша редакциялар бөлімнің жеке дағдыларына сай жазылды; анықтамалардың математикалық тұрақтылары еркін ауыстырылған жоқ.',
 'Аликвоттық бөлшек анықтамасы: 1/n, мұнда n > 1 — натурал сан. 1/1 алынбайды. Жаңа жағдайлар: нан мен таспаны тең үлестіру, нақты кесу ережесі бар бәліштер, бақша телімі және үш бригаданың жұмысы. Нақты есептеуді тарихи папирусқа телитін жаңа расталмаған тұжырым қосылмады.',
 '51 редакция не model ID 51 бөлек жаңа математикалық мағына емес. Анықтамаға тәуелді 1/2 максимумы, бір таңбалы 9 шегі және 1/2+1/3+1/6 жалғыз үштігі математикалық тұрақты күйінде сақталды. Қалған деректер жаңарды; екі бірлік бөлшектің толық бөлім домені, ашкөз алгоритм, қатаң бағалау, телескоптық қысқарту және кесу шектеуі дәл тексеріледі. Ашық жауап тек бүтін сан, бөлшек/рет/тұжырым MCQ; native canonical бөлшектер.',spec.note
 ],editorialStatus:'awaiting_independent_review',minimumPlan:'pro',...render(spec.kind,spec.params)};});}
const expected=new Map(buildEditions().map(r=>[r.editionId,r]));
export function verifyEdition(row){const e=expected.get(row.editionId);assert.ok(e);for(const k of['grade','topic','difficulty','modelId','params','sourceRefs','adaptationChanges','minimumPlan'])assert.equal(canonicalEdition(row[k]),canonicalEdition(e[k]));const actual=renderEdition(row);for(const k of['statement','solution','options','intentionalIncorrectExample'])assert.equal(canonicalEdition(row[k]),canonicalEdition(actual[k]));assert.equal(row.answer,actual.answer);return{answer:actual.answer,checks:['all51 saved3.10 fullconditions/solutions/MCQ read','unitdefinition n>1; universal constants retained honestly','complete rational pair/triple bounds, greedy and telescoping exact','sharing equal-cut limits and actual constructive allocation','full statement/solution/options/answer/params/source metadata bound','external independent editorial review pending']};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const editions=buildEditions();assert.equal(editions.length,sources.size);for(const row of editions)verifyEdition(row);const out={schemaVersion:1,scope:'All51saved nonvisual grade5 topic3.10 rewritten offline. Definitions/theorem constants retained; source/model variants notsemanticuniqueness. Independent review pending.',sourceOccurrences:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,editions};fs.writeFileSync(new URL('../../problems/editorial/batches/grade5-unit-fractions.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({authored:editions.length,models:out.distinctModels}));}
