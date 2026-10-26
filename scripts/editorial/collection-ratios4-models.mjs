import assert from'node:assert/strict';
const pos=(...xs)=>xs.forEach(x=>assert(Number.isSafeInteger(x)&&x>0));const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const q=(n,d=1)=>{assert(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d!==0);if(d<0){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),sub=(a,b)=>q(a[0]*b[1]-b[0]*a[1],a[1]*b[1]),mul=(a,b)=>q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>q(a[0]*b[1],a[1]*b[0]);
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1],int=a=>{assert.equal(a[1],1);pos(a[0]);return a[0];},text=a=>a[1]===1?String(a[0]):`(${a[0]}/${a[1]})`,M=(w,n,d)=>add(q(w),q(n,d)),mt=(w,n,d)=>`(${w} + (${n}/${d}))`;
const mixed=a=>{assert(a[0]>0);const w=Math.floor(a[0]/a[1]),r=a[0]%a[1];return r?`${w} + (${r}/${a[1]})`:String(w);};
const dec=a=>{let scale=1;while(scale%a[1]&&scale<1000000)scale*=10;assert.equal(scale%a[1],0,'Finite decimal required');const n=a[0]*(scale/a[1]);if(scale===1)return String(n);const sign=n<0?'-':'',digits=String(Math.abs(n)).padStart(String(scale).length,'0'),places=String(scale).length-1;return sign+(digits.slice(0,-places)+','+digits.slice(-places)).replace(/0+$/,'').replace(/,$/,'');};
const choice=(statement,options,i,solution)=>{options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4,'Distinct options required');return{statement,options,answer:options[i],solution};};
const required={
 "mixed-reciprocal-proportion-root-only": [
  "leftWhole",
  "leftNum",
  "leftDen",
  "rightWhole",
  "rightNum",
  "rightDen",
  "smallNum",
  "smallDen"
 ],
 "same-mixture-component-share": [
  "knownMass",
  "knownCopper",
  "targetMass"
 ],
 "workforce-factor-time-inverse-plain": [
  "workers",
  "hours",
  "factor"
 ],
 "two-side-ratios-all-three-triangle-lengths": [
  "a",
  "b",
  "b2",
  "c",
  "perimeterTenths"
 ],
 "circle-area-ratio-to-circumference-ratio": [
  "firstSquare",
  "secondSquare"
 ],
 "negative-given-ratio-scaled-denominator": [
  "coefficient",
  "givenNum",
  "givenDen",
  "negativeWhole",
  "denominatorFactor"
 ],
 "verbal-improper-part-of-part": [
  "firstNum",
  "firstDen",
  "secondNum",
  "secondDen",
  "targetNum",
  "targetDen"
 ],
 "rectangle-ratio-gap-to-decimal-perimeter": [
  "small",
  "large",
  "gap"
 ],
 "second-colour-fraction-of-whole": [
  "first",
  "second"
 ],
 "second-food-share-of-total": [
  "total",
  "first",
  "second"
 ],
 "whole-over-x-equals-decimal-ratio": [
  "first",
  "rightNumTenths",
  "rightDenTenths"
 ],
 "computed-weights-outer-ratio-denominator": [
  "firstWhole",
  "firstNum",
  "firstDen",
  "secondWhole",
  "secondNum",
  "secondDen",
  "thirdWhole",
  "thirdNum",
  "thirdDen",
  "multiplier",
  "commonTenths",
  "leftTenths",
  "rightTenths",
  "top"
 ],
 "workforce-factor-time-inverse-with-units": [
  "workers",
  "hours",
  "factor"
 ],
 "constant-speed-new-time-distance": [
  "firstKm",
  "firstHours",
  "nextHours"
 ],
 "negative-decimal-root-then-affine-expression": [
  "leftDenTenths",
  "rightNegativeTenths",
  "rightDen",
  "targetCoefficient",
  "targetAdd"
 ],
 "decimal-left-ratio-fraction-coefficient": [
  "firstTenths",
  "secondTenths",
  "coefficient",
  "lastTenths"
 ],
 "both-ratio-members-same-factor": [
  "value",
  "factor"
 ],
 "equal-item-price-new-quantity": [
  "knownCount",
  "knownCost",
  "targetCount"
 ],
 "nested-divisor-affine-backwards": [
  "numerator",
  "insideConstant",
  "coefficient",
  "outsideAdd",
  "total"
 ],
 "first-group-share-of-large-total": [
  "total",
  "first",
  "second"
 ],
 "mixed-same-denominator-requested-root-multiple": [
  "leftWhole",
  "leftNum",
  "leftDen",
  "leftDivisor",
  "rightWhole",
  "rightNum",
  "rightDen",
  "multiplier"
 ],
 "sum-of-unit-ratios-symbolic-denominator-gap": [
  "firstDen",
  "secondDen",
  "coefficient"
 ],
 "area-to-same-radius-circumference-1": [
  "areaHundredths",
  "piHundredths"
 ],
 "diameter-fractional-arc-1": [
  "diameter",
  "numerator",
  "denominator",
  "piHundredths"
 ],
 "diameter-wheel-full-turn-distance": [
  "diameter",
  "turns",
  "piHundredths"
 ],
 "circumference-smaller-radius-area-1": [
  "circumferenceHundredths",
  "shrink",
  "piHundredths"
 ],
 "circumference-smaller-radius-area-2": [
  "circumferenceHundredths",
  "shrink",
  "piHundredths"
 ],
 "diameter-fractional-arc-2": [
  "diameter",
  "numerator",
  "denominator",
  "piHundredths"
 ],
 "area-to-same-radius-circumference-2": [
  "areaHundredths",
  "piHundredths"
 ],
 "largest-inscribed-disc-square-remainder": [
  "side",
  "piHundredths"
 ],
 "area-to-same-radius-circumference-3": [
  "areaHundredths",
  "piHundredths"
 ],
 "concentric-ring-difference-of-squares": [
  "outerRadius",
  "innerRadius",
  "piHundredths"
 ],
 "circumference-smaller-radius-area-3": [
  "circumferenceHundredths",
  "shrink",
  "piHundredths"
 ],
 "radius-wheel-full-turn-distance": [
  "radiusTenths",
  "turns",
  "piHundredths"
 ]
};
const numberWord=n=>{const w={1:'бір',2:'екі',3:'үш',4:'төрт',5:'бес',6:'алты',7:'жеті',8:'сегіз',9:'тоғыз',10:'он'};assert(w[n]);return w[n];};
const denomWord=n=>{const w={2:'екіден',3:'үштен',4:'төрттен',5:'бестен',6:'алтыдан',7:'жетіден',8:'сегізден',9:'тоғыздан',10:'оннан'};assert(w[n]);return w[n];};
const frWords=(n,d)=>`${denomWord(d)} ${numberWord(n)}`;
export function renderEdition(row){const p=row.params,k=row.skillFamily;assert(required[k]);assert.deepEqual(Object.keys(p).sort(),required[k].toSorted());Object.values(p).forEach(x=>pos(x));let a,b,c,x,y,z,rate,ans,total;
 switch(k){
 case'mixed-reciprocal-proportion-root-only':
  assert(p.leftNum<p.leftDen&&p.rightNum<p.rightDen);a=M(p.leftWhole,p.leftNum,p.leftDen);b=M(p.rightWhole,p.rightNum,p.rightDen);c=q(p.smallNum,p.smallDen);rate=div(b,c);ans=div(a,rate);return choice(`${mt(p.leftWhole,p.leftNum,p.leftDen)} ÷ x = ${mt(p.rightWhole,p.rightNum,p.rightDen)} ÷ (${p.smallNum}/${p.smallDen}), x ≠ 0. Тек x мәнін таңдаңыз.`,[dec(mul(ans,q(10))),text(mul(ans,q(100))),dec(ans),dec(mul(ans,q(20)))],2,`Оң жақ ${text(b)} : (${p.smallNum}/${p.smallDen}) = ${text(rate)}. Белгісіз бөлгіш x = ${text(a)} : ${text(rate)} = ${text(ans)} = ${dec(ans)}. Тексеру: ${text(a)} : ${text(ans)} = ${text(rate)}. x нөл емес. Сұралғаны x-тің өзі, оның еселенгені емес.`);
 case'same-mixture-component-share':
  assert(p.knownCopper<p.knownMass);ans=q(p.knownCopper*p.targetMass,p.knownMass);int(ans);return choice(`Құрамы бірдей қоспаның ${p.knownMass} грамында ${p.knownCopper} г мыс бар. Сол құрамдағы ${p.targetMass} г қоспада неше грамм мыс болады?`,[`${p.knownMass} г`,`${text(q(p.knownCopper,2))} г`,`${p.knownCopper} г`,`${text(ans)} г`],3,`Мыстың массалық үлесі (${p.knownCopper}/${p.knownMass}) = ${text(q(p.knownCopper,p.knownMass))}. Сондықтан жаңа мыс массасы ${p.targetMass} × ${text(q(p.knownCopper,p.knownMass))} = ${text(ans)} г. Тексеру: (${text(ans)}/${p.targetMass}) = (${p.knownCopper}/${p.knownMass}). Қоспаның барлық массасын мыс деп алмаймыз.`);
 case'workforce-factor-time-inverse-plain':case'workforce-factor-time-inverse-with-units':
  assert(p.factor>1);ans=q(p.hours,p.factor);int(ans);return choice(`${p.workers} жұмысшы бір тапсырысты ${p.hours} сағатта орындайды. Жұмысшы санын ${p.factor} есе арттырды. Әр жұмысшының өнімділігі бірдей әрі тұрақты болса, сол тапсырыс неше сағатта бітеді?`,[`${text(add(ans,q(4)))} сағ`,`${text(ans)} сағ`,`${text(mul(ans,q(2)))} сағ`,`${text(add(ans,q(1)))} сағ`],1,`Алғашқы жұмыс көлемі ${p.workers} × ${p.hours} = ${p.workers*p.hours} адам-сағат. Жаңа жұмысшы саны ${p.workers} × ${p.factor} = ${p.workers*p.factor}. Уақыт ${p.workers*p.hours} : ${p.workers*p.factor} = ${text(ans)} сағ. Жұмысшылар ${p.factor} есе көбейгенде уақыт сол есеге азаяды.`);
 case'two-side-ratios-all-three-triangle-lengths':{
  let ns=[p.a*p.b2,p.b*p.b2,p.c*p.b],g=ns.reduce(gcd);ns=ns.map(n=>n/g);[a,b,c]=ns;assert(a+b>c&&a+c>b&&b+c>a);rate=q(p.perimeterTenths,10*(a+b+c));x=mul(q(a),rate);y=mul(q(b),rate);z=mul(q(c),rate);const label=(x,y,z)=>`AB = ${dec(x)}; BC = ${dec(y)}; AC = ${dec(z)}`;return choice(`Үшбұрышта AB : BC = ${p.a} : ${p.b}, BC : AC = ${p.b2} : ${p.c}. Периметрі ${dec(q(p.perimeterTenths,10))} см. ҮШ қабырғаның AB, BC, AC ұзындықтарын толық таңдаңыз.`,[label(sub(x,q(2)),add(y,q(2)),z),label(y,z,x),label(x,y,z),label(z,x,y)],2,`BC-ны ортақ үлеске келтіріп, AB : BC : AC = ${a} : ${b} : ${c} аламыз. Бір үлес ${dec(q(p.perimeterTenths,10))} : ${a+b+c} = ${dec(rate)} см. AB = ${a} × ${dec(rate)} = ${dec(x)} см, BC = ${dec(y)} см, AC = ${dec(z)} см. Қосындысы ${dec(q(p.perimeterTenths,10))} см, екі қатынас та сақталады. Үшбұрыш теңсіздіктері орындалады; тек бір қабырғаны табу бұл сұраққа толық жауап емес.`);
 }
 case'circle-area-ratio-to-circumference-ratio':
  a=Math.sqrt(p.firstSquare);b=Math.sqrt(p.secondSquare);pos(a,b);assert(a!==b);return choice(`Екі дөңгелек аудандарының қатынасы ${p.firstSquare} : ${p.secondSquare}. Сол дөңгелектерді шектейтін шеңберлер ұзындықтарының қатынасын дәл осы ретпен таңдаңыз.`,[`${p.firstSquare} : ${p.secondSquare}`,'1 : 2',`${a} : ${b}`,`${2*a} : ${2*b-1}`],2,`Дөңгелек ауданы πr², сондықтан радиустар квадраттарының қатынасы ${p.firstSquare} : ${p.secondSquare}. ${p.firstSquare} = ${a}² және ${p.secondSquare} = ${b}². Радиустар оң: олардың қатынасы ${a} : ${b}. Шеңбер ұзындығы 2πr радиусқа тура пропорционал, сондықтан ізделген ұзындықтар қатынасы да ${a} : ${b}. Аудан қатынасын сол күйі алу квадрат түбір қадамын жоғалтады.`);
 case'negative-given-ratio-scaled-denominator':
  assert(p.givenNum<p.givenDen);a=q(-p.givenNum,p.givenDen);ans=div(sub(a,q(p.negativeWhole)),q(p.denominatorFactor));return choice(`b ≠ 0, (${p.coefficient}a/b) = -(${p.givenNum}/${p.givenDen}). ((-${p.negativeWhole}b + ${p.coefficient}a)/(${p.denominatorFactor}b)) өрнегін есептеңіз.`,[dec(ans),dec(negate(mul(ans,q(2)))),dec(mul(ans,q(p.denominatorFactor))),dec(negate(ans))],0,`Алым мен бөлімді b-ға бөлеміз: ((-${p.negativeWhole}b + ${p.coefficient}a)/(${p.denominatorFactor}b)) = ((-${p.negativeWhole} + (${p.coefficient}a/b))/${p.denominatorFactor}). Берілгенді қойсақ (-${p.negativeWhole} − (${p.givenNum}/${p.givenDen})) : ${p.denominatorFactor} = ${text(ans)} = ${dec(ans)}. Бөлімдегі ${p.denominatorFactor} көбейткіші жоғалмайды; b нөл емес.`);
 case'verbal-improper-part-of-part':
  assert(p.firstNum>p.firstDen&&p.secondNum<p.secondDen&&p.targetNum<p.targetDen);a=q(p.firstNum,p.firstDen);b=q(p.secondNum,p.secondDen);c=q(p.targetNum,p.targetDen);ans=div(c,mul(a,b));return choice(`Белгісіз санның ${frWords(p.firstNum,p.firstDen)} бөлігінің ${frWords(p.secondNum,p.secondDen)} бөлігі ${frWords(p.targetNum,p.targetDen)} санына тең. Бұл санды табыңыз.`,[text(mul(a,b)),text(ans),text(div(q(1),ans)),text(c)],1,`«${frWords(p.firstNum,p.firstDen)}» — (${p.firstNum}/${p.firstDen}), «${frWords(p.secondNum,p.secondDen)}» — (${p.secondNum}/${p.secondDen}). Ізделген сан x болса, x × (${p.firstNum}/${p.firstDen}) × (${p.secondNum}/${p.secondDen}) = (${p.targetNum}/${p.targetDen}). Екі үлестің көбейтіндісі ${text(mul(a,b))}. x = (${p.targetNum}/${p.targetDen}) : ${text(mul(a,b))} = ${text(ans)}. Тексеру: ${text(ans)} × (${p.firstNum}/${p.firstDen}) × (${p.secondNum}/${p.secondDen}) = (${p.targetNum}/${p.targetDen}). Алғашқы үлес бұрыс бөлшек болса да, көбейту ережесі сақталады.`);
 case'rectangle-ratio-gap-to-decimal-perimeter':
  assert(p.large>p.small);rate=q(p.gap,p.large-p.small);x=mul(q(p.small),rate);y=mul(q(p.large),rate);ans=mul(q(2),add(x,y));assert(rate[1]!==1);return choice(`Тіктөртбұрыштың ені : ұзындығы = ${p.small} : ${p.large}. Ұзындығы енінен ${p.gap} см артық. Периметрі неше сантиметр?`,[dec(ans),dec(div(ans,q(2))),String(p.small+p.large),String(2*(p.small+p.large))],0,`Айырма ${p.large} − ${p.small} = ${p.large-p.small} үлес, бір үлес ${p.gap} : ${p.large-p.small} = ${dec(rate)} см. Ені ${dec(x)} см, ұзындығы ${dec(y)} см. Периметр 2 × (${dec(x)} + ${dec(y)}) = ${dec(ans)} см. Тексеру: ${dec(y)} − ${dec(x)} = ${p.gap} см. Жарты периметрді толық периметр деп алмау керек.`);
 case'second-colour-fraction-of-whole':
  ans=q(p.second,p.first+p.second);return choice(`Көк және сары шарлар ғана бар, көк : сары саны = ${p.first} : ${p.second}. САРЫ шарлар барлық шардың қандай бөлігін құрайды?`,[text(q(p.first,p.first+p.second)),text(q(p.first,p.second)),text(ans),text(q(p.second-p.first,p.second))],2,`Барлық шар ${p.first} + ${p.second} = ${p.first+p.second} үлес. Сарыға ${p.second} үлес тиесілі, сондықтан барлыққа қатысты бөлшек ${text(ans)}. Бөлімге тек көк шарды не тек сары шарды қою бөлікті барлық санмен салыстырмайды.`);
 case'second-food-share-of-total':
  rate=q(p.total,p.first+p.second);int(rate);ans=mul(q(p.second),rate);return choice(`Алма және шие салмасы бар барлығы ${p.total} бәліш пісірді. Алма : шие саны = ${p.first} : ${p.second}. ШИЕ салмасы бар бәліш нешеу?`,[text(mul(q(p.first),rate)),text(ans),String(p.total/2),text(div(q(p.total),q(p.second)))],1,`Барлық үлес ${p.first+p.second}, бір үлес ${p.total} : ${p.first+p.second} = ${text(rate)} бәліш. Шие салмасы ${p.second} × ${text(rate)} = ${text(ans)}, алма салмасы ${text(mul(q(p.first),rate))}. Қосындысы ${p.total}; сұралғаны қатынастағы екінші бөлік.`);
 case'whole-over-x-equals-decimal-ratio':
  a=q(p.rightNumTenths,10);b=q(p.rightDenTenths,10);rate=div(a,b);ans=div(q(p.first),rate);assert(ans[1]!==1);return choice(`${p.first} : x = ${dec(a)} : ${dec(b)}, x ≠ 0. Белгісіз бөлгішті табыңыз.`,['6','12','9',dec(ans)],3,`Айқас көбейтсек ${dec(a)} × x = ${p.first} × ${dec(b)} = ${dec(mul(q(p.first),b))}. Сондықтан x = ${dec(mul(q(p.first),b))} : ${dec(a)} = ${dec(ans)}. Тексеру: ${p.first} : ${dec(ans)} = ${dec(rate)}, ${dec(a)} : ${dec(b)} = ${dec(rate)}. Бөлгіш нөл емес.`);
 case'computed-weights-outer-ratio-denominator':
  assert(p.firstNum<p.firstDen&&p.secondNum<p.secondDen&&p.thirdNum<p.thirdDen);x=M(p.firstWhole,p.firstNum,p.firstDen);y=M(p.secondWhole,p.secondNum,p.secondDen);z=M(p.thirdWhole,p.thirdNum,p.thirdDen);a=mul(add(sub(x,y),z),q(p.multiplier));c=q(p.commonTenths,10);b=div(mul(c,sub(q(p.leftTenths,10),q(p.rightTenths,10))),mul(c,c));rate=div(a,b);ans=div(q(p.top),rate);assert(ans[0]>ans[1]&&ans[1]!==1);return choice(`a = (${mt(p.firstWhole,p.firstNum,p.firstDen)} − ${mt(p.secondWhole,p.secondNum,p.secondDen)} + ${mt(p.thirdWhole,p.thirdNum,p.thirdDen)}) × ${p.multiplier}; b = ((${dec(c)} × ${dec(q(p.leftTenths,10))} − ${dec(c)} × ${dec(q(p.rightTenths,10))})/${dec(c)}²). (${p.top}/(a : b)) өрнегінің мәнін таңдаңыз.`,[mixed(div(q(p.top),a)),mixed(ans),'3 + (3/8)','7 + (4/9)'],1,`a ішіндегі айырма ${text(sub(x,y))}, кейінгі қосынды ${text(add(sub(x,y),z))}. Оны ${p.multiplier} санына көбейтсек a = ${dec(a)}. b алымынан ортақ ${dec(c)} шығарамыз: ${dec(c)} × (${dec(q(p.leftTenths,10))} − ${dec(q(p.rightTenths,10))}) = ${dec(mul(c,sub(q(p.leftTenths,10),q(p.rightTenths,10))))}. Бөлім ${dec(c)}² = ${dec(mul(c,c))}. Сондықтан b = ${dec(b)}. Қатынас a : b = ${dec(a)} : ${dec(b)} = ${dec(rate)}. Сыртқы бөлшек ${p.top} : ${dec(rate)} = ${text(ans)} = ${mixed(ans)}. Алдымен a мен b, содан кейін олардың қатынасы, ең соңында сыртқы бөлу есептеледі.`);
 case'constant-speed-new-time-distance':
  rate=q(p.firstKm,p.firstHours);int(rate);ans=mul(rate,q(p.nextHours));return choice(`Жаяу турист бірдей қарқынмен ${p.firstKm} км жолды ${p.firstHours} сағатта өтті. Кідірмей сол жылдамдықпен ${p.nextHours} сағат жүрсе, қанша километр өтеді?`,[text(sub(ans,q(10))),text(ans),text(add(ans,q(10))),String(p.firstKm)],1,`Жылдамдық ${p.firstKm} : ${p.firstHours} = ${text(rate)} км/сағ. Жаңа жол ${text(rate)} × ${p.nextHours} = ${text(ans)} км. Тексеру: ${text(ans)} : ${p.nextHours} = ${text(rate)} км/сағ; жылдамдық бірдей.`);
 case'negative-decimal-root-then-affine-expression':
  a=q(p.leftDenTenths,10);b=q(-p.rightNegativeTenths,10);x=div(mul(a,b),q(p.rightDen));ans=add(mul(q(p.targetCoefficient),x),q(p.targetAdd));assert(x[0]<0&&ans[0]<0);return choice(`(x/${dec(a)}) = (${dec(b)}/${p.rightDen}). ${p.targetCoefficient}x + ${p.targetAdd} өрнегінің мәнін есептеңіз.`,[text(sub(ans,q(1,3))),dec(mul(q(p.targetCoefficient),x)),dec(x),dec(ans)],3,`x = ${dec(a)} × (${dec(b)}) : ${p.rightDen} = ${dec(x)}. Теріс пен оңның көбейтіндісі теріс. Сұралған өрнек ${p.targetCoefficient} × (${dec(x)}) + ${p.targetAdd} = ${dec(ans)}. Тексеру: ${dec(x)} : ${dec(a)} = ${dec(div(b,q(p.rightDen)))}. Түбірді не ${p.targetCoefficient}x мәнін жауап деп алып қоюға болмайды.`);
 case'decimal-left-ratio-fraction-coefficient':
  a=q(p.firstTenths,10);b=q(p.secondTenths,10);c=q(p.lastTenths,10);rate=div(a,b);int(rate);ans=div(mul(rate,c),q(p.coefficient));assert(ans[1]!==1);return choice(`(${dec(a)}/${dec(b)}) = (${p.coefficient}x/${dec(c)}) пропорциясын шешіңіз.`,[dec(ans),dec(sub(ans,q(2))),dec(mul(ans,q(6))),dec(add(ans,q(1,5)))],0,`Сол қатынас ${p.firstTenths} : ${p.secondTenths} = ${text(rate)}. Одан ${p.coefficient}x = ${text(rate)} × ${dec(c)} = ${dec(mul(rate,c))}. Коэффициентке бөлеміз: x = ${dec(mul(rate,c))} : ${p.coefficient} = ${dec(ans)}. Кері қойғанда екі бөлшек те ${text(rate)} мәнін береді.`);
 case'both-ratio-members-same-factor':
  assert(p.factor>1);return choice(`n ≠ 0 және m : n = ${p.value}. ЕКІ санды да ${p.factor} есе көбейтсек, (${p.factor}m) : (${p.factor}n) өрнегінің мәні қандай?`,[String(p.value*p.factor),text(q(p.value,p.factor)),text(q(p.value,p.factor*p.factor)),String(p.value)],3,`Алым мен бөлімдегі бірдей нөлден өзге ${p.factor} көбейткіші қысқарады: (${p.factor}m/(${p.factor}n)) = (m/n) = ${p.value}. Қатынастың екі мүшесін бірдей еселеу оның мәнін өзгертпейді. Тек бір мүшені еселеу басқа амал болар еді.`);
 case'equal-item-price-new-quantity':
  rate=q(p.knownCost,p.knownCount);int(rate);ans=mul(rate,q(p.targetCount));return choice(`${p.knownCount} бірдей балмұздақ ${p.knownCost} теңге тұрады. Бағасы өзгермесе, ${p.targetCount} балмұздақтың құны неше теңге?`,[`${text(ans)} тг`,`${text(add(ans,rate))} тг`,`${text(mul(ans,q(2)))} тг`,`${text(rate)} тг`],0,`Біреуінің бағасы ${p.knownCost} : ${p.knownCount} = ${text(rate)} теңге. ${p.targetCount} дана ${p.targetCount} × ${text(rate)} = ${text(ans)} теңге тұрады. Бірлік бағаны толық құнмен шатастырмаймыз.`);
 case'nested-divisor-affine-backwards':
  assert(p.total>p.outsideAdd);rate=q(p.total-p.outsideAdd);a=div(q(p.numerator),rate);x=div(sub(q(p.insideConstant),a),q(p.coefficient));int(x);assert(a[0]!==0);return choice(`${p.numerator} : (${p.insideConstant} − ${p.coefficient}x) + ${p.outsideAdd} = ${p.total}, мұнда ${p.insideConstant} − ${p.coefficient}x ≠ 0. Теңдеуді шешіңіз.`,['9','23',text(x),'12'],2,`Сыртқы қосылғыштан бастаймыз: ${p.numerator} : (${p.insideConstant} − ${p.coefficient}x) = ${p.total} − ${p.outsideAdd} = ${text(rate)}. Белгісіз бөлгіш ${p.insideConstant} − ${p.coefficient}x = ${p.numerator} : ${text(rate)} = ${text(a)}. Сондықтан ${p.coefficient}x = ${p.insideConstant} − ${text(a)} = ${text(sub(q(p.insideConstant),a))}, x = ${text(x)}. Бөлім ${text(a)} нөл емес; тексергенде ${text(rate)} + ${p.outsideAdd} = ${p.total}.`);
 case'first-group-share-of-large-total':
  rate=q(p.total,p.first+p.second);int(rate);ans=mul(q(p.first),rate);return choice(`Мектепте ${p.total} оқушы бар. Қыздар санының ұлдар санына қатынасы ${p.first} : ${p.second}. ҚЫЗДАР нешеу?`,[text(ans),text(rate),text(mul(q(p.second),rate)),text(div(ans,q(2)))],0,`Барлық үлес ${p.first} + ${p.second} = ${p.first+p.second}. Бір үлес ${p.total} : ${p.first+p.second} = ${text(rate)} оқушы. Қыздар ${p.first} × ${text(rate)} = ${text(ans)}. Ұлдар ${text(mul(q(p.second),rate))}; қосындысы ${p.total}.`);
 case'mixed-same-denominator-requested-root-multiple':
  assert(p.leftNum<p.leftDen&&p.rightNum<p.rightDen);a=M(p.leftWhole,p.leftNum,p.leftDen);b=M(p.rightWhole,p.rightNum,p.rightDen);rate=div(a,q(p.leftDivisor));x=div(b,rate);ans=mul(q(p.multiplier),x);int(ans);assert(!same(ans,x));return choice(`${mt(p.leftWhole,p.leftNum,p.leftDen)} ÷ ${p.leftDivisor} = ${mt(p.rightWhole,p.rightNum,p.rightDen)} ÷ x, x ≠ 0. ${p.multiplier}x мәнін таңдаңыз.`,[text(x),String(p.multiplier),text(div(q(1),x)),text(ans)],3,`Аралас сандар ${text(a)} және ${text(b)}. Сол қатынас ${text(a)} : ${p.leftDivisor} = ${text(rate)}. Белгісіз бөлгіш x = ${text(b)} : ${text(rate)} = ${text(x)}. Сұралған көбейтінді ${p.multiplier} × ${text(x)} = ${text(ans)}. x нөл емес; тексергенде екі бастапқы бөлінді де ${text(rate)}.`);
 case'sum-of-unit-ratios-symbolic-denominator-gap':
  rate=add(q(1,p.firstDen),q(1,p.secondDen));assert(rate[0]<rate[1]);ans=div(add(q(1),mul(q(p.coefficient),rate)),sub(q(1),rate));int(ans);return choice(`n ≠ 0 және (m/n) = (1/${p.firstDen}) + (1/${p.secondDen}). ((n + ${p.coefficient}m)/(n − m)) мәнін табыңыз.`,[text(ans),mixed(add(rate,q(1))),'-17',text(rate)],0,`Бірінші қатынас (1/${p.firstDen}) + (1/${p.secondDen}) = ${text(rate)}. m = ${rate[0]}k, n = ${rate[1]}k, k ≠ 0 деп аламыз. Алым (${rate[1]} + ${p.coefficient*rate[0]})k = ${rate[1]+p.coefficient*rate[0]}k, бөлім (${rate[1]} − ${rate[0]})k = ${rate[1]-rate[0]}k, ол нөл емес. Қысқартқанда ${text(ans)} шығады. Жалпы түрде де (1 + ${p.coefficient} × ${text(rate)}) : (1 − ${text(rate)}) = ${text(ans)}.`);
 case'area-to-same-radius-circumference-1':case'area-to-same-radius-circumference-2':case'area-to-same-radius-circumference-3':{
  assert.equal(p.piHundredths,314);const pi=q(p.piHundredths,100);a=q(p.areaHundredths,100);b=div(a,pi);int(b);x=Math.sqrt(b[0]);pos(x);ans=mul(q(2*x),pi);const index=k.endsWith('-1')?2:k.endsWith('-2')?0:1,opts=index===2?[String(x),dec(div(ans,q(2))),dec(ans),String(x*x)]:index===0?[dec(ans),dec(mul(ans,q(10))),dec(sub(ans,q(1))),dec(add(ans,q(7)))]:[dec(add(ans,q(10))),dec(ans),dec(mul(ans,q(2))),dec(div(ans,q(2)))];return choice(`Дөңгелектің ауданы ${dec(a)} см². Осы дөңгелекті шектейтін шеңбердің ҰЗЫНДЫҒЫН табыңыз. π = ${dec(pi)} деп алыңыз.`,opts.map(v=>v+' см'),index,`Аудан формуласы S = πr². Сондықтан r² = ${dec(a)} : ${dec(pi)} = ${text(b)}. Радиус оң: r = ${x} см. Шеңбер ұзындығы C = 2 × ${dec(pi)} × ${x} = ${dec(ans)} см. Тексеру: ${dec(pi)} × ${x}² = ${dec(a)} см². Радиус, радиус квадраты және шеңбер ұзындығы әртүрлі шамалар.`);
 }
 case'diameter-fractional-arc-1':case'diameter-fractional-arc-2':{
  assert.equal(p.piHundredths,314);assert(p.numerator<p.denominator);const pi=q(p.piHundredths,100);a=mul(q(p.diameter),pi);ans=mul(a,q(p.numerator,p.denominator));const index=k.endsWith('-1')?2:1,opts=index===2?[dec(a),dec(div(ans,q(2))),dec(ans),dec(sub(ans,q(14,100)))]:[dec(mul(ans,q(2))),dec(ans),dec(add(ans,q(3))),dec(sub(ans,q(69,10)))];return choice(`Шеңбер диаметрі ${p.diameter} см. Толық шеңбердің (${p.numerator}/${p.denominator}) бөлігін құрайтын доғаның ұзындығы қанша? π = ${dec(pi)} деп алыңыз.`,opts.map(v=>v+' см'),index,`Толық шеңбер ұзындығы C = πd = ${dec(pi)} × ${p.diameter} = ${dec(a)} см. Доға осы ұзындықтың (${p.numerator}/${p.denominator}) бөлігі: ${dec(a)} : ${p.denominator} × ${p.numerator} = ${dec(ans)} см. Диаметрді радиус деп алсақ, толық ұзындықты екі есе артық есептер едік; доға үлесін де қолдану керек.`);
 }
 case'diameter-wheel-full-turn-distance':{
  assert.equal(p.piHundredths,314);const pi=q(p.piHundredths,100);a=mul(pi,q(p.diameter));ans=mul(a,q(p.turns));return choice(`Диаметрі ${p.diameter} см доңғалақ түзу жолда СЫРҒЫМАЙ ${p.turns} толық айналым жасады. Жүрген жол неше сантиметр? π = ${dec(pi)} деп алыңыз.`,[ans,a,sub(ans,q(96)),div(ans,q(2))].map(v=>dec(v)+' см'),0,`Бір толық айналым жолы C = πd = ${dec(pi)} × ${p.diameter} = ${dec(a)} см. ${p.turns} айналымдағы жол ${dec(a)} × ${p.turns} = ${dec(ans)} см. Сырғымай қозғалу шарты бір айналымды шеңбер ұзындығымен байланыстырады; тек бір айналымды жауап деп алмаймыз.`);
 }
 case'circumference-smaller-radius-area-1':case'circumference-smaller-radius-area-2':case'circumference-smaller-radius-area-3':{
  assert.equal(p.piHundredths,314);assert(p.shrink>1);const pi=q(p.piHundredths,100);a=q(p.circumferenceHundredths,100);x=div(a,mul(q(2),pi));int(x);y=div(x,q(p.shrink));int(y);ans=mul(pi,mul(y,y));const index=k.endsWith('-3')?3:0,opts=index===0?[ans,mul(ans,q(2)),div(ans,q(2)),sub(ans,q(12,100))]:[mul(ans,q(3)),add(ans,q(2,100)),mul(ans,q(10)),ans];return choice(`Берілген шеңбердің ұзындығы ${dec(a)} см. Жаңа дөңгелектің радиусы сол шеңбер радиусынан ${p.shrink} есе кіші. ЖАҢА дөңгелектің ауданын табыңыз. π = ${dec(pi)} деп алыңыз.`,opts.map(v=>dec(v)+' см²'),index,`Алғашқы радиус r = C : (2π) = ${dec(a)} : ${dec(mul(q(2),pi))} = ${text(x)} см. Жаңа радиус ${text(x)} : ${p.shrink} = ${text(y)} см. Жаңа аудан ${dec(pi)} × ${text(y)}² = ${dec(ans)} см². Радиусты алдымен азайтып, содан кейін квадраттаймыз; ұзындық пен ауданның өлшемдерін шатастырмаймыз.`);
 }
 case'largest-inscribed-disc-square-remainder':{
  assert.equal(p.piHundredths,314);const pi=q(p.piHundredths,100);x=q(p.side,2);int(x);a=mul(pi,mul(x,x));ans=sub(q(p.side*p.side),a);assert(ans[0]>0);return choice(`Қабырғасы ${p.side} см шаршы қағаздан оның ішіне толық сыятын ЕҢ ҮЛКЕН дөңгелек қиылды. Қалған қағаздың ауданы неше см²? π = ${dec(pi)} деп алыңыз.`,[add(ans,q(100)),add(ans,q(20)),sub(ans,q(4)),ans].map(v=>dec(v)+' см²'),3,`Шаршыға сыятын ең үлкен дөңгелектің диаметрі ${p.side} см, радиусы ${p.side} : 2 = ${text(x)} см. Шаршы ауданы ${p.side}² = ${p.side*p.side} см². Дөңгелек ауданы ${dec(pi)} × ${text(x)}² = ${dec(a)} см². Қалған аудан ${p.side*p.side} − ${dec(a)} = ${dec(ans)} см². Қиылған бөлікті емес, қалған бөлікті табамыз.`);
 }
 case'concentric-ring-difference-of-squares':{
  assert.equal(p.piHundredths,314);assert(p.outerRadius>p.innerRadius);const pi=q(p.piHundredths,100);a=mul(pi,q(p.outerRadius**2));b=mul(pi,q(p.innerRadius**2));ans=sub(a,b);return choice(`Ортақ центрлі екі шеңбер радиустары ${p.outerRadius} см және ${p.innerRadius} см. Екі шеңбер арасындағы САҚИНАНЫҢ ауданын табыңыз. π = ${dec(pi)} деп алыңыз.`,[mul(ans,q(10)),ans,mul(ans,q(100)),div(ans,q(10))].map(v=>dec(v)+' см²'),1,`Сыртқы дөңгелек ауданы ${dec(pi)} × ${p.outerRadius}² = ${dec(a)} см². Ішкісі ${dec(pi)} × ${p.innerRadius}² = ${dec(b)} см². Сақина ауданы айырмаға тең: ${dec(a)} − ${dec(b)} = ${dec(ans)} см². Қысқаша ${dec(pi)} × (${p.outerRadius**2} − ${p.innerRadius**2}) = ${dec(ans)}. Радиустар айырмасын квадраттау басқа фигураның ауданын берер еді.`);
 }
 case'radius-wheel-full-turn-distance':{
  assert.equal(p.piHundredths,314);const pi=q(p.piHundredths,100);x=q(p.radiusTenths,10);a=mul(mul(q(2),pi),x);ans=mul(a,q(p.turns));return choice(`Доңғалақтың РАДИУСЫ ${dec(x)} м. Ол түзу жолда сырғымай ${p.turns} толық айналым жасады. Жүрген қашықтық неше метр? π = ${dec(pi)} деп алыңыз.`,[ans,div(ans,q(2)),a,mul(q(2*p.turns),x)].map(v=>dec(v)+' м'),0,`Радиус берілгендіктен C = 2πr. Бір айналым ${dec(mul(q(2),pi))} × ${dec(x)} = ${dec(a)} м. Барлық жол ${dec(a)} × ${p.turns} = ${dec(ans)} м. Радиусты диаметрдің орнына қою жауапты екі есе кемітеді; айналым санын да көбейту керек.`);
 }
 default:throw Error(k);
 }
}
const negate=a=>[-a[0],a[1]];
export function verifyEdition(row){assert.equal(row.grade,6);assert.equal(row.minimumPlan,'pro');const result=renderEdition(row);for(const f of['statement','answer','solution','options'])assert.deepEqual(row[f],result[f]);assert(!/[\\$]|undefined|NaN|<\/?(?:script|img|svg)/i.test(row.statement+row.solution));return{answer:result.answer,checks:['all34_saved_nonvisual_collection_occurrences_fullconditions_officialsolutions_everyMCQ_individually_read','part4visual23_24_excluded_and_no_new_capture','exact_mixed_decimal_signed_proportions_with_divisor_and_requested_expression_roles','verbal_improper_fraction_then_part_of_part_translated_to_exact_multiplicative_equation','computed_mixed_weights_common_decimal_factor_square_then_outer_ratio_denominator','ordered_part_vs_whole_and_three_triangle_sides_with_inequalities_bound','circle_area_vs_circumference_radius_vs_diameter_and_explicit_pi314','arc_fraction_same_radius_reverse_area_smaller_radius_squared_square_remainder_ring_area','wheel_no_slip_full_turn_count_and_units_explicit','draft_requires_independent_external_math_content_review']};}
