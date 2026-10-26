import assert from'node:assert/strict';
const pos=(...xs)=>xs.forEach(x=>assert(Number.isSafeInteger(x)&&x>0));const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const q=(n,d=1)=>{assert(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d!==0);if(d<0){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),sub=(a,b)=>q(a[0]*b[1]-b[0]*a[1],a[1]*b[1]),mul=(a,b)=>q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>q(a[0]*b[1],a[1]*b[0]);
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1],int=a=>{assert.equal(a[1],1);pos(a[0]);return a[0];},text=a=>a[1]===1?String(a[0]):`(${a[0]}/${a[1]})`,M=(w,n,d)=>add(q(w),q(n,d)),mt=(w,n,d)=>`(${w} + (${n}/${d}))`;
const mixed=a=>{assert(a[0]>0);const w=Math.floor(a[0]/a[1]),r=a[0]%a[1];return r?`${w} + (${r}/${a[1]})`:String(w);};
const dec=a=>{let scale=1;while(scale%a[1]&&scale<1000000)scale*=10;assert.equal(scale%a[1],0,'Finite decimal required');const n=a[0]*(scale/a[1]);if(scale===1)return String(n);const sign=n<0?'-':'',digits=String(Math.abs(n)).padStart(String(scale).length,'0'),places=String(scale).length-1;return sign+(digits.slice(0,-places)+','+digits.slice(-places)).replace(/0+$/,'').replace(/,$/,'');};
const choice=(statement,options,i,solution)=>{options=options.map(String);assert.equal(options.length,4);assert.equal(new Set(options).size,4,'Distinct options required');return{statement,options,answer:options[i],solution};};
const required={
 "decimal-ratio-coefficient-fraction-notation": [
  "leftNumTenths",
  "leftDenTenths",
  "coefficient",
  "rightDenTenths"
 ],
 "train-same-speed-new-distance-time": [
  "firstKm",
  "firstHoursTenths",
  "targetKm"
 ],
 "decimal-ratio-coefficient-colon-notation": [
  "leftNumTenths",
  "leftDenTenths",
  "coefficient",
  "rightDenTenths"
 ],
 "liquid-volume-to-mass-rate": [
  "knownLitres",
  "knownMassTenths",
  "targetLitres"
 ],
 "mixed-shared-numerator-fraction-coefficient": [
  "leftWhole",
  "leftNum",
  "leftDen",
  "rightWhole",
  "rightNum",
  "rightDen",
  "coefficientNum",
  "coefficientDen",
  "last"
 ],
 "potato-constant-starch-yield": [
  "knownKg",
  "yieldTenths",
  "targetKg"
 ],
 "unit-fraction-decimal-ratio-mixed-root": [
  "leftDen",
  "decimalHundredths",
  "coefficient",
  "lastNum",
  "lastDen"
 ],
 "car-same-speed-shorter-distance-time": [
  "firstKm",
  "firstHoursTenths",
  "targetKm"
 ],
 "mixed-divisor-unknown-coefficient": [
  "leftWhole",
  "leftNum",
  "leftDen",
  "coefficient",
  "rightWhole",
  "rightNum",
  "rightDen",
  "lastTenths"
 ],
 "fixed-apple-mass-in-more-boxes": [
  "boxes",
  "kgPerBox",
  "newBoxes"
 ],
 "same-numerator-mixed-equals-decimal": [
  "whole",
  "num",
  "den",
  "coefficient",
  "rightThousandths",
  "last"
 ],
 "track-equal-laps-distance": [
  "knownLaps",
  "knownKmTenths",
  "targetLaps"
 ],
 "decimal-fraction-then-mixed-last": [
  "firstTenths",
  "fractionNum",
  "fractionDen",
  "coefficient",
  "lastWhole",
  "lastNum",
  "lastDen"
 ],
 "typing-fixed-text-inverse-rate": [
  "firstPerMin",
  "firstHours",
  "targetPerMin"
 ],
 "small-decimal-ratio-fractional-coefficient": [
  "firstTenths",
  "secondTenths",
  "coefficientDen",
  "lastNum",
  "lastDen"
 ],
 "meshing-gear-inverse-teeth-count": [
  "firstTeeth",
  "secondTeeth",
  "firstTurns"
 ],
 "unequal-decimal-digits-fraction-to-coefficient": [
  "coefficient",
  "fractionNum",
  "fractionDen",
  "rightHundredths",
  "rightThousandths"
 ],
 "printer-fixed-rate-time": [
  "knownMinutesTenths",
  "knownPages",
  "targetPages"
 ],
 "whole-over-fraction-x-shared-mixed-numerator": [
  "whole",
  "coefficientNum",
  "coefficientDen",
  "rightWhole",
  "rightNum",
  "rightDen",
  "lastWhole",
  "lastNum",
  "lastDen"
 ],
 "fixed-plastic-mass-identical-parts": [
  "knownKg",
  "knownParts",
  "targetKg"
 ],
 "mixed-over-fraction-x-reciprocal-mixed-fraction": [
  "leftWhole",
  "leftNum",
  "leftDen",
  "coefficientNum",
  "coefficientDen",
  "rightWhole",
  "rightNum",
  "rightDen",
  "lastNum",
  "lastDen"
 ],
 "equal-output-machine-rate": [
  "firstMinutesTenths",
  "secondMinutes",
  "firstPerMin"
 ],
 "decimal-offset-proportion-root": [
  "firstNum",
  "firstDen",
  "offsetTenths",
  "lastTenths"
 ],
 "computed-two-weights-mixed-and-decimal-cube": [
  "firstWhole",
  "firstNum",
  "firstDen",
  "secondWhole",
  "secondNum",
  "secondDen",
  "thirdWhole",
  "thirdNum",
  "thirdDen",
  "divideNum",
  "divideDen",
  "commonHundredths",
  "leftTenths",
  "rightTenths",
  "total"
 ],
 "reciprocal-given-ratio-linear-expression": [
  "x",
  "y",
  "xCoefficient",
  "yCoefficient"
 ],
 "wire-total-ratio-smaller": [
  "total",
  "a",
  "b"
 ],
 "recipe-two-ingredient-direct-scaling": [
  "firstCups",
  "secondCups",
  "targetFirst"
 ],
 "whole-offset-fractional-root": [
  "rightNum",
  "rightDen",
  "offset",
  "last"
 ],
 "fixed-work-more-people-fewer-days": [
  "firstWorkers",
  "days",
  "nextWorkers"
 ],
 "partial-work-one-day-then-whole-new-count": [
  "firstWorkers",
  "partDen",
  "nextWorkers"
 ],
 "nested-decimal-fraction-requested-multiple": [
  "outer",
  "addedTenths",
  "inner",
  "smallHundredths",
  "multiplier"
 ],
 "gcd-of-three-not-pair": [
  "a",
  "b",
  "c"
 ],
 "equal-rectangle-area-unknown-width": [
  "firstLengthTenths",
  "firstWidthTenths",
  "nextLengthTenths"
 ],
 "constant-over-coefficient-x": [
  "first",
  "coefficient",
  "rightNum",
  "rightDen"
 ],
 "mixed-given-ratio-linear-expression": [
  "whole",
  "num",
  "den",
  "firstCoefficient",
  "secondCoefficient"
 ],
 "percent-less-other-as-base": [
  "first",
  "second"
 ],
 "straight-angle-two-ratio-larger": [
  "a",
  "b"
 ],
 "affine-over-affine-root-then-minus-negative": [
  "topOffset",
  "bottomOffset",
  "rightNum",
  "rightDen",
  "whole",
  "negativeCoefficient"
 ],
 "triangle-perimeter-smallest-side": [
  "a",
  "b",
  "c",
  "perimeter"
 ],
 "cylinder-diameter-squared-length-inverse-mass": [
  "mass",
  "diameterFactor",
  "lengthDivisor"
 ],
 "whole-divide-mixed-equals-unknown-divide-mixed": [
  "first",
  "mixedWhole",
  "mixedNum",
  "mixedDen",
  "lastWhole",
  "lastNum",
  "lastDen"
 ],
 "grain-volume-decimal-mass-product": [
  "knownVolume",
  "massTenths",
  "targetVolumeTenths"
 ],
 "fixed-repair-work-person-days": [
  "firstWorkers",
  "days",
  "nextWorkers"
 ],
 "trapezoid-explicit-bases-legs-largest": [
  "leg",
  "firstBase",
  "secondBase",
  "perimeter"
 ],
 "division-root-then-multiple": [
  "divisor",
  "quotientTenths",
  "multiple"
 ],
 "constant-hourly-pay-all-three-days": [
  "firstHours",
  "firstPay",
  "secondHours",
  "thirdHours"
 ],
 "two-digit-multiples-excluding-triple-multiples": [
  "base",
  "excluded"
 ],
 "equal-affine-coefficients-ratio-then-target": [
  "coefficient",
  "topAdd",
  "bottomSubtract",
  "rightNum",
  "rightDen",
  "targetSubtract",
  "negativeCoefficient"
 ]
};
export function renderEdition(row){const p=row.params,k=row.skillFamily;assert(required[k]);assert.deepEqual(Object.keys(p).sort(),required[k].toSorted());Object.values(p).forEach(x=>pos(x));let a,b,c,x,y,z,t,ans,rate,total;
 switch(k){
 case'decimal-ratio-coefficient-fraction-notation':case'decimal-ratio-coefficient-colon-notation':
  a=q(p.leftNumTenths,10);b=q(p.leftDenTenths,10);c=q(p.rightDenTenths,10);rate=div(a,b);int(rate);ans=div(mul(rate,c),q(p.coefficient));assert(ans[1]!==1);return choice(k.endsWith('fraction-notation')?`(${dec(a)}/${dec(b)}) = (${p.coefficient}x/${dec(c)}) пропорциясындағы x-ті табыңыз.`:`${dec(a)} : ${dec(b)} = ${p.coefficient}x : ${dec(c)} пропорциясын шешіңіз.`,[dec(add(ans,q(3))),dec(ans),dec(mul(ans,q(10))),dec(mul(ans,q(p.coefficient)))],1,`Алғашқы қатынас ${dec(a)} : ${dec(b)} = ${text(rate)}. Екі мүшені 10 санына көбейтіп, ${p.leftNumTenths} : ${p.leftDenTenths} деп тексеруге болады. Сондықтан ${p.coefficient}x = ${text(rate)} × ${dec(c)} = ${dec(mul(rate,c))}. x = ${dec(mul(rate,c))} : ${p.coefficient} = ${dec(ans)}. Кері тексеру: ${p.coefficient} × ${dec(ans)} : ${dec(c)} = ${text(rate)}. Коэффициентке бөлуді ұмытсақ x орнына ${p.coefficient}x шығады.`);
 case'train-same-speed-new-distance-time':case'car-same-speed-shorter-distance-time':
  a=q(p.firstHoursTenths,10);rate=div(q(p.firstKm),a);ans=div(q(p.targetKm),rate);assert(ans[1]!==1);return choice(`${k.startsWith('train')?'Пойыз':'Автокөлік'} ${p.firstKm} км жолды ${dec(a)} сағатта өтті. Жылдамдық дәл сол күйі тұрақты болса, ${p.targetKm} км жолға неше сағат кетеді?`,[`${dec(add(ans,q(1)))} сағ`,`${dec(ans)} сағ`,`${dec(a)} сағ`,`${dec(sub(ans,q(1,2)))} сағ`],1,`Тұрақты жылдамдық ${p.firstKm} : ${dec(a)} = ${dec(rate)} км/сағ. Жаңа уақыт ${p.targetKm} : ${dec(rate)} = ${dec(ans)} сағ. Тексеру: ${dec(rate)} × ${dec(ans)} = ${p.targetKm} км. Қашықтық өзгергенде сол жылдамдықпен уақыт та тура пропорционал өзгереді.`);
 case'liquid-volume-to-mass-rate':
  rate=div(q(p.knownMassTenths,10),q(p.knownLitres));ans=mul(rate,q(p.targetLitres));return choice(`Бірдей сұйықтың ${p.knownLitres} литрі ${dec(q(p.knownMassTenths,10))} кг тартады. Тығыздық өзгермесе, ${p.targetLitres} литрдің массасы неше килограмм?`,[`${dec(sub(ans,q(1)))} кг`,`${dec(add(ans,q(2)))} кг`,`${dec(add(ans,q(1)))} кг`,`${dec(ans)} кг`],3,`Бір литр массасы ${dec(q(p.knownMassTenths,10))} : ${p.knownLitres} = ${dec(rate)} кг. Ізделген масса ${p.targetLitres} × ${dec(rate)} = ${dec(ans)} кг. Тексеру: ${dec(ans)} : ${p.targetLitres} = ${dec(rate)} кг/л. Барлық көлемге тұрақты бірлік массаны қолданамыз.`);
 case'mixed-shared-numerator-fraction-coefficient':
  assert(p.leftNum<p.leftDen&&p.rightNum<p.rightDen);a=M(p.leftWhole,p.leftNum,p.leftDen);b=M(p.rightWhole,p.rightNum,p.rightDen);assert.equal(a[0],b[0]);rate=div(a,b);c=q(p.coefficientNum,p.coefficientDen);ans=div(mul(rate,q(p.last)),c);int(ans);return choice(`${mt(p.leftWhole,p.leftNum,p.leftDen)} : ${mt(p.rightWhole,p.rightNum,p.rightDen)} = ((${p.coefficientNum}/${p.coefficientDen})x) : ${p.last}. x-ті есептеңіз.`,[text(a),text(ans),text(mul(rate,q(p.last))),text(div(ans,q(3)))],1,`Аралас сандар ${text(a)} және ${text(b)}. Бөлгенде ортақ ${a[0]} алымдары қысқарып, қатынас ${text(rate)} болады. Сондықтан (${p.coefficientNum}/${p.coefficientDen})x = ${p.last} × ${text(rate)} = ${text(mul(rate,q(p.last)))}. Бөлшек коэффициентке бөлеміз: x = ${text(mul(rate,q(p.last)))} : (${p.coefficientNum}/${p.coefficientDen}) = ${text(ans)}. Тексеру: (${p.coefficientNum}/${p.coefficientDen}) × ${text(ans)} : ${p.last} = ${text(rate)}.`);
 case'potato-constant-starch-yield':
  rate=div(q(p.yieldTenths,10),q(p.knownKg));ans=mul(rate,q(p.targetKg));return choice(`Бірдей шығыммен ${p.knownKg} кг картоптан ${dec(q(p.yieldTenths,10))} кг крахмал алынады. ${p.targetKg} кг картоп өңделсе, неше килограмм крахмал шығады?`,[`${dec(sub(ans,q(3,10)))} кг`,`${dec(ans)} кг`,`${dec(sub(ans,q(1)))} кг`,`${dec(add(ans,q(1)))} кг`],1,`Бір килограммнан ${dec(q(p.yieldTenths,10))} : ${p.knownKg} = ${dec(rate)} кг крахмал. Толық шығым ${p.targetKg} × ${dec(rate)} = ${dec(ans)} кг. Бұл бірдей өңдеу шығымы туралы шарт; картоптың барлық массасы крахмалға айналады деп алмаймыз.`);
 case'unit-fraction-decimal-ratio-mixed-root':
  a=q(1,p.leftDen);b=q(p.decimalHundredths,100);c=q(p.lastNum,p.lastDen);rate=div(a,b);ans=div(mul(rate,c),q(p.coefficient));assert(ans[0]>ans[1]&&ans[1]!==1);return choice(`(1/${p.leftDen}) : ${dec(b)} = ${p.coefficient}x : (${p.lastNum}/${p.lastDen}) пропорциясын шешіңіз.`,[text(sub(ans,q(2))),mixed(sub(ans,q(1,12))),mixed(ans),text(div(q(1),ans))],2,`Ондық сан ${dec(b)} = ${text(b)}. Сол жақ (1/${p.leftDen}) : ${text(b)} = ${text(rate)}. Одан ${p.coefficient}x = ${text(rate)} × (${p.lastNum}/${p.lastDen}) = ${text(mul(rate,c))}. x = ${text(mul(rate,c))} : ${p.coefficient} = ${text(ans)} = ${mixed(ans)}. Кері бөлшекке көбейту мен соңғы коэффициентке бөлу реті сақталады.`);
 case'mixed-divisor-unknown-coefficient':
  assert(p.leftNum<p.leftDen&&p.rightNum<p.rightDen);a=M(p.leftWhole,p.leftNum,p.leftDen);b=M(p.rightWhole,p.rightNum,p.rightDen);c=q(p.lastTenths,10);rate=div(b,c);ans=div(div(a,rate),q(p.coefficient));assert(ans[0]<ans[1]);return choice(`${mt(p.leftWhole,p.leftNum,p.leftDen)} : (${p.coefficient}x) = ${mt(p.rightWhole,p.rightNum,p.rightDen)} : ${dec(c)}, мұнда x ≠ 0. Түбірін таңдаңыз.`,['0,5',text(mul(ans,q(2))),text(ans),text(mul(ans,q(4)))],2,`Оң жақ ${text(b)} : ${dec(c)} = ${text(rate)}. Сол жақта белгісіз бөлгіш бар: ${p.coefficient}x = ${text(a)} : ${text(rate)} = ${text(div(a,rate))}. Сондықтан x = ${text(div(a,rate))} : ${p.coefficient} = ${text(ans)}. Түбір нөл емес, бастапқы бөлгіш жарамды. Бөлгішті табуда бөлінгішті бөліндіге бөлеміз.`);
 case'fixed-apple-mass-in-more-boxes':
  assert(p.newBoxes>p.boxes);total=p.boxes*p.kgPerBox;ans=q(total,p.newBoxes);int(ans);return choice(`Алманы ${p.boxes} жәшікке ${p.kgPerBox} кг-нан салды. Осы алманың бәрін ${p.newBoxes} жәшікке тең қайта бөлсе, әр жәшікке неше килограмм түседі?`,[`${p.kgPerBox+2} кг`,`${text(ans)} кг`,`${p.kgPerBox} кг`,`${p.boxes} кг`],1,`Алма массасы ${p.boxes} × ${p.kgPerBox} = ${total} кг және қайта салғанда өзгермейді. Бір жаңа жәшікке ${total} : ${p.newBoxes} = ${text(ans)} кг. Тексеру: ${p.newBoxes} × ${text(ans)} = ${total} кг. Жәшік санын көбейту әр жәшіктегі массаны азайтады.`);
 case'same-numerator-mixed-equals-decimal':
  assert(p.num<p.den);a=M(p.whole,p.num,p.den);b=q(p.rightThousandths,1000);assert(same(a,b));ans=q(p.last,p.coefficient);int(ans);return choice(`${mt(p.whole,p.num,p.den)} : (${p.coefficient}x) = ${dec(b)} : ${p.last}, x ≠ 0. x-ті табыңыз.`,[text(div(ans,q(2))),text(mul(ans,q(2))),text(sub(ans,q(1))),text(ans)],3,`Аралас сан ${mt(p.whole,p.num,p.den)} = ${dec(a)}. Бөлінгіш екі жақта бірдей әрі нөл емес. Бөлінділер тең болғандықтан бөлгіштер де тең: ${p.coefficient}x = ${p.last}. x = ${p.last} : ${p.coefficient} = ${text(ans)}. Тексеру: екі жақ та ${dec(a)} : ${p.last}; x нөл емес.`);
 case'track-equal-laps-distance':
  rate=div(q(p.knownKmTenths,10),q(p.knownLaps));ans=mul(rate,q(p.targetLaps));return choice(`Жүгіруші бірдей жолақты ${p.knownLaps} толық айналып, ${dec(q(p.knownKmTenths,10))} км өтті. Дәл сол жолақпен ${p.targetLaps} айналым жасаса, неше километр жүреді?`,[`${dec(sub(ans,q(3,10)))} км`,`${dec(sub(ans,q(6,10)))} км`,`${dec(add(ans,q(2,10)))} км`,`${dec(ans)} км`],3,`Бір айналым ${dec(q(p.knownKmTenths,10))} : ${p.knownLaps} = ${dec(rate)} км. ${p.targetLaps} айналым ${p.targetLaps} × ${dec(rate)} = ${dec(ans)} км. Жылдамдықты білу қажет емес: әр толық айналымның ұзындығы бірдей.`);
 case'decimal-fraction-then-mixed-last':
  assert(p.fractionNum<p.fractionDen&&p.lastNum<p.lastDen);a=q(p.firstTenths,10);b=q(p.fractionNum,p.fractionDen);c=M(p.lastWhole,p.lastNum,p.lastDen);rate=div(a,b);ans=div(mul(rate,c),q(p.coefficient));assert(ans[0]>ans[1]&&ans[1]!==1);return choice(`${dec(a)} : (${p.fractionNum}/${p.fractionDen}) = ${p.coefficient}x : ${mt(p.lastWhole,p.lastNum,p.lastDen)} пропорциясын шешіңіз.`,[mixed(sub(ans,q(1))),'-('+mixed(ans)+')',mixed(sub(ans,q(1,3))),mixed(ans)],3,`Бірінші ондық сан ${dec(a)} = ${text(a)}. Сол қатынас ${text(a)} : ${text(b)} = ${text(rate)}. Соңғы аралас сан ${text(c)}. Сондықтан ${p.coefficient}x = ${text(rate)} × ${text(c)} = ${text(mul(rate,c))}. Соңында ${p.coefficient} санына бөліп, x = ${text(ans)} = ${mixed(ans)} аламыз. Жай бөлшекке бөлгенде оның керісіне көбейтеміз.`);
 case'typing-fixed-text-inverse-rate':
  assert(p.targetPerMin>p.firstPerMin);total=p.firstPerMin*p.firstHours*60;ans=q(total,p.targetPerMin*60);return choice(`Мәтінді минутына ${p.firstPerMin} таңбадан тергенде ${p.firstHours} сағат кетеді. Құжаттағы таңба саны өзгермейді. Минутына ${p.targetPerMin} таңба терсе, неше сағат қажет?`,[`${dec(ans)} сағ`,`${dec(add(ans,q(3)))} сағ`,`${dec(add(ans,q(2)))} сағ`,`${dec(add(ans,q(1)))} сағ`],0,`Алғашқы уақыт ${p.firstHours} × 60 = ${p.firstHours*60} минут. Мәтін ${p.firstPerMin} × ${p.firstHours*60} = ${total} таңба. Жаңа уақыт ${total} : ${p.targetPerMin} = ${text(q(total,p.targetPerMin))} минут, яғни ${dec(ans)} сағ. Жылдамдық артқанда сол мәтінге уақыт азаяды; сағат пен минутты бірдей бірлікке келтіреміз.`);
 case'small-decimal-ratio-fractional-coefficient':
  assert(p.secondTenths>p.firstTenths);a=q(p.firstTenths,10);b=q(p.secondTenths,10);c=q(p.lastNum,p.lastDen);rate=div(a,b);ans=mul(mul(rate,c),q(p.coefficientDen));assert(ans[0]<ans[1]);return choice(`${dec(a)} : ${dec(b)} = ((1/${p.coefficientDen})x) : (${p.lastNum}/${p.lastDen}) теңдеуінің түбірін таңдаңыз.`,[mixed(add(ans,q(1))),text(div(q(1),ans)),text(q(1,p.lastNum)),text(ans)],3,`Сол қатынас ${p.firstTenths} : ${p.secondTenths} = ${text(rate)}. Сондықтан (1/${p.coefficientDen})x = (${p.lastNum}/${p.lastDen}) × ${text(rate)} = ${text(mul(c,rate))}. Бөлшек коэффициенттен босату үшін ${p.coefficientDen} санына көбейтеміз: x = ${text(ans)}. Тексеру: (${text(ans)} : ${p.coefficientDen}) : (${p.lastNum}/${p.lastDen}) = ${text(rate)}.`);
 case'meshing-gear-inverse-teeth-count':
  assert(p.secondTeeth>p.firstTeeth);total=p.firstTeeth*p.firstTurns;ans=q(total,p.secondTeeth);int(ans);return choice(`Тікелей ілініскен тісті доңғалақтардың біріншісінде ${p.firstTeeth}, екіншісінде ${p.secondTeeth} тіс бар. Біріншісі ${p.firstTurns} толық айналым жасаса, екіншісі неше айналым жасайды? Ілінісу сырғымайды.`,[text(add(ans,q(2))),text(ans),text(sub(ans,q(4))),text(sub(ans,q(2)))],1,`Бірінші доңғалақтан өткен тіс саны ${p.firstTeeth} × ${p.firstTurns} = ${total}. Сырғымай ілініскен екінші доңғалақтан да сонша тіс өтеді. Айналым саны ${total} : ${p.secondTeeth} = ${text(ans)}. Тексеру: ${p.secondTeeth} × ${text(ans)} = ${total}. Тісі көп доңғалақ азырақ айналады.`);
 case'unequal-decimal-digits-fraction-to-coefficient':
  a=q(p.rightHundredths,100);b=q(p.rightThousandths,1000);c=q(p.fractionNum,p.fractionDen);rate=div(a,b);ans=div(mul(rate,c),q(p.coefficient));return choice(`${p.coefficient}x : (${p.fractionNum}/${p.fractionDen}) = ${dec(a)} : ${dec(b)} пропорциясын шешіңіз.`,[dec(mul(ans,q(10))),'-'+String(p.coefficient),dec(rate),dec(ans)],3,`Оң қатынаста үтір орындары әртүрлі. Екеуін де 1000 санына көбейтеміз: ${p.rightHundredths*10} : ${p.rightThousandths} = ${dec(rate)}. Сондықтан ${p.coefficient}x = ${dec(rate)} × (${p.fractionNum}/${p.fractionDen}) = ${dec(mul(rate,c))}. x = ${dec(mul(rate,c))} : ${p.coefficient} = ${dec(ans)}. Екі ондық санды әртүрлі он дәрежесіне көбейту қатынасты бұзар еді.`);
 case'printer-fixed-rate-time':
  a=q(p.knownMinutesTenths,10);rate=div(q(p.knownPages),a);ans=div(q(p.targetPages),rate);int(ans);return choice(`Принтер тұрақты қарқынмен ${dec(a)} минутта ${p.knownPages} бет басады. Кідірмей ${p.targetPages} бет басуға неше минут қажет?`,[`${text(ans)} мин`,`${text(add(ans,q(10)))} мин`,`${text(sub(ans,q(5)))} мин`,`${text(sub(ans,q(10)))} мин`],0,`Бір минутта ${p.knownPages} : ${dec(a)} = ${dec(rate)} бет. Қажет уақыт ${p.targetPages} : ${dec(rate)} = ${text(ans)} мин. Тексеру: ${dec(rate)} × ${text(ans)} = ${p.targetPages} бет. Уақыт бірлігі минут күйінде сақталады.`);
 case'whole-over-fraction-x-shared-mixed-numerator':
  assert(p.rightNum<p.rightDen&&p.lastNum<p.lastDen);a=M(p.rightWhole,p.rightNum,p.rightDen);b=M(p.lastWhole,p.lastNum,p.lastDen);assert.equal(a[0],b[0]);rate=div(a,b);c=q(p.coefficientNum,p.coefficientDen);ans=div(div(q(p.whole),rate),c);int(ans);return choice(`${p.whole} : ((${p.coefficientNum}/${p.coefficientDen})x) = ${mt(p.rightWhole,p.rightNum,p.rightDen)} : ${mt(p.lastWhole,p.lastNum,p.lastDen)}, x ≠ 0. Теңдеуді шешіңіз.`,[text(mul(ans,q(3))),text(mul(ans,q(2))),text(mul(ans,q(4))),text(ans)],3,`Оң жақтағы аралас сандар ${text(a)} және ${text(b)}. Ортақ алым қысқарады: қатынас ${text(rate)}. Белгісіз бөлгіш (${p.coefficientNum}/${p.coefficientDen})x = ${p.whole} : ${text(rate)} = ${text(div(q(p.whole),rate))}. Бөлшек коэффициентке бөлеміз: x = ${text(div(q(p.whole),rate))} : (${p.coefficientNum}/${p.coefficientDen}) = ${text(ans)}. x нөл емес, бастапқы бөлгіш анықталған.`);
 case'fixed-plastic-mass-identical-parts':
  ans=q(p.knownParts*p.targetKg,p.knownKg);int(ans);return choice(`Бірдей үлгідегі ${p.knownParts} бөлшекке ${p.knownKg} кг пластмасса кетеді. Шығын үлесі өзгермесе, ${p.targetKg} кг-нан неше осындай бөлшек жасалады?`,[text(div(ans,q(2))),text(ans),text(div(ans,q(4))),String(p.targetKg)],1,`Масса үлесі (${p.targetKg}/${p.knownKg}) = ${text(q(p.targetKg,p.knownKg))}. Бөлшек саны ${p.knownParts} × ${text(q(p.targetKg,p.knownKg))} = ${text(ans)}. Тексеру: бір бөлшекке ${text(q(p.knownKg,p.knownParts))} кг кетеді; ${text(ans)} бөлшекке ${p.targetKg} кг қажет. Дайындау нормасы өзгермейді.`);
 case'mixed-over-fraction-x-reciprocal-mixed-fraction':
  assert(p.leftNum<p.leftDen&&p.rightNum<p.rightDen);a=M(p.leftWhole,p.leftNum,p.leftDen);b=M(p.rightWhole,p.rightNum,p.rightDen);c=q(p.lastNum,p.lastDen);rate=div(b,c);ans=div(div(a,rate),q(p.coefficientNum,p.coefficientDen));return choice(`${mt(p.leftWhole,p.leftNum,p.leftDen)} : ((${p.coefficientNum}/${p.coefficientDen})x) = ${mt(p.rightWhole,p.rightNum,p.rightDen)} : (${p.lastNum}/${p.lastDen}), x ≠ 0. x мәні қандай?`,[text(div(ans,q(2))),dec(ans),text(mul(ans,q(2))),text(div(ans,q(3)))],1,`Оң жақ ${text(b)} : (${p.lastNum}/${p.lastDen}) = ${text(rate)}. Сол жақтағы бөлгіш (${p.coefficientNum}/${p.coefficientDen})x = ${text(a)} : ${text(rate)} = ${text(div(a,rate))}. Бұдан x = ${text(div(a,rate))} : (${p.coefficientNum}/${p.coefficientDen}) = ${text(ans)} = ${dec(ans)}. Жай бөлшекке бөлгенде керісіне көбейтеміз; x нөл емес.`);
 case'equal-output-machine-rate':
  a=q(p.firstMinutesTenths,10);total=mul(q(p.firstPerMin),a);ans=div(total,q(p.secondMinutes));int(ans);return choice(`Бірдей тапсырысты бірінші станок ${dec(a)} минутта, екіншісі ${p.secondMinutes} минутта орындайды. Біріншісі минутына ${p.firstPerMin} бөлшек жасайды. Екіншісінің минуттық өнімділігі неше бөлшек? Екеуінің қарқыны тұрақты.`,[text(ans),text(mul(ans,q(2))),text(add(ans,q(2))),text(sub(ans,q(2)))],0,`Тапсырыс көлемі ${p.firstPerMin} × ${dec(a)} = ${text(total)} бөлшек. Екінші станок дәл осы көлемді ${p.secondMinutes} минутта жасайды: ${text(total)} : ${p.secondMinutes} = ${text(ans)} бөлшек/мин. Тексеру: ${text(ans)} × ${p.secondMinutes} = ${text(total)}. Бірдей уақыт емес, бірдей тапсырыс берілген.`);
 case'decimal-offset-proportion-root':
  a=q(p.firstNum,p.firstDen);b=q(p.offsetTenths,10);c=q(p.lastTenths,10);ans=sub(mul(a,c),b);int(ans);return choice(`(${p.firstNum}/${p.firstDen}) = ((x + ${dec(b)})/${dec(c)}) пропорциясындағы x-ті табыңыз.`,[text(ans),text(add(ans,q(10))),text(mul(ans,q(2))),text(add(ans,q(12)))],0,`Айқас көбейткенде ${p.firstDen} × (x + ${dec(b)}) = ${p.firstNum} × ${dec(c)} = ${dec(mul(q(p.firstNum),c))}. Сондықтан x + ${dec(b)} = ${dec(mul(a,c))}. Қосылған санды азайтып, x = ${dec(mul(a,c))} − ${dec(b)} = ${text(ans)}. Тексеру: ((${text(ans)} + ${dec(b)})/${dec(c)}) = (${p.firstNum}/${p.firstDen}).`);
 case'computed-two-weights-mixed-and-decimal-cube':
  assert(p.firstNum<p.firstDen&&p.secondNum<p.secondDen&&p.thirdNum<p.thirdDen);x=M(p.firstWhole,p.firstNum,p.firstDen);y=M(p.secondWhole,p.secondNum,p.secondDen);z=M(p.thirdWhole,p.thirdNum,p.thirdDen);a=div(add(sub(x,y),z),q(p.divideNum,p.divideDen));c=q(p.commonHundredths,100);t=sub(q(p.leftTenths,10),q(p.rightTenths,10));b=div(mul(c,t),mul(mul(c,c),c));int(a);int(b);rate=q(p.total,a[0]+b[0]);int(rate);ans=mul(a,rate);const other=mul(b,rate);return choice(`a = (${mt(p.firstWhole,p.firstNum,p.firstDen)} − ${mt(p.secondWhole,p.secondNum,p.secondDen)} + ${mt(p.thirdWhole,p.thirdNum,p.thirdDen)}) : (${p.divideNum}/${p.divideDen}); b = ((${dec(c)} × ${dec(q(p.leftTenths,10))} − ${dec(c)} × ${dec(q(p.rightTenths,10))})/${dec(c)}³). ${p.total} санын a : b қатынасында бөліп, бірінші және екінші бөліктерді таңдаңыз.`,[`${text(other)}; ${text(ans)}`,`${text(div(ans,q(2)))}; ${text(div(other,q(2)))}`,`${text(ans)}; ${text(other)}`,`${text(a)}; ${text(b)}`],2,`a үшін аралас сандар ${text(x)}, ${text(y)}, ${text(z)}. Алғашқы айырма ${text(sub(x,y))}, оған ${text(z)} қосқанда ${text(add(sub(x,y),z))}. Демек a = ${text(add(sub(x,y),z))} : (${p.divideNum}/${p.divideDen}) = ${text(a)}. b алымынан ортақ ${dec(c)} шығарамыз: ${dec(c)} × (${dec(q(p.leftTenths,10))} − ${dec(q(p.rightTenths,10))}) = ${dec(mul(c,t))}. Бөлім ${dec(c)}³ = ${dec(mul(mul(c,c),c))}. b = ${dec(mul(c,t))} : ${dec(mul(mul(c,c),c))} = ${text(b)}. Үлестер қосындысы ${a[0]+b[0]}, бір үлес ${p.total} : ${a[0]+b[0]} = ${text(rate)}. Бөліктер ${text(ans)} және ${text(other)}; қосындысы ${p.total}. Ретін ауыстыруға не a мен b мәндерін бөліктердің өзі деп алуға болмайды.`);
 case'reciprocal-given-ratio-linear-expression':
  assert(p.x!==p.y);ans=add(q(p.xCoefficient),q(p.yCoefficient*p.y,p.x));int(ans);return choice(`x, y > 0 және (x/y) = (${p.x}/${p.y}). ((${p.xCoefficient}x + ${p.yCoefficient}y)/x) өрнегінің мәнін табыңыз.`,[text(ans),String(p.xCoefficient+p.yCoefficient),'3',text(add(q(p.xCoefficient),q(p.yCoefficient*p.x,p.y)))],0,`Бөлшекті мүшелеп бөлеміз: ((${p.xCoefficient}x + ${p.yCoefficient}y)/x) = ${p.xCoefficient} + ${p.yCoefficient} × (y/x). Берілгеннің керісі (y/x) = (${p.y}/${p.x}). Сондықтан ${p.xCoefficient} + ${p.yCoefficient} × (${p.y}/${p.x}) = ${text(ans)}. x пен y оң болғандықтан, екі бөлім де нөл емес. (x/y) қатынасын кері аудармай қою басқа мән береді.`);
 case'wire-total-ratio-smaller':
  assert(p.a>p.b);rate=q(p.total,p.a+p.b);int(rate);ans=mul(q(p.b),rate);return choice(`Ұзындығы ${p.total} см сымды ${p.a} : ${p.b} қатынасындағы екі бөлікке кесті. КІШІ бөлік неше сантиметр?`,[`${text(mul(q(p.a),rate))} см`,`${text(sub(ans,q(2)))} см`,`${text(ans)} см`,`${text(mul(q(p.a),q(p.b)))} см`],2,`Үлес саны ${p.a} + ${p.b} = ${p.a+p.b}. Бір үлес ${p.total} : ${p.a+p.b} = ${text(rate)} см. Кіші бөлік ${p.b} × ${text(rate)} = ${text(ans)} см. Үлкені ${text(mul(q(p.a),rate))} см, екі бөлік қосылса ${p.total} см. Үлкен бөлікті таңдау сұралған рөлді ауыстырады.`);
 case'recipe-two-ingredient-direct-scaling':
  rate=q(p.targetFirst,p.firstCups);int(rate);ans=mul(q(p.secondCups),rate);return choice(`Бір рецептте ${p.firstCups} стақан жидекке ${p.secondCups} стақан қант қосылады. Сол құрамды сақтап, ${p.targetFirst} стақан жидекке неше стақан қант керек? Барлық стақанның сыйымдылығы бірдей.`,[text(div(ans,q(2))),String(p.secondCups),String(p.targetFirst),text(ans)],3,`Жидек ${p.targetFirst} : ${p.firstCups} = ${text(rate)} есе көп. Қант та осы көбейткішпен өзгереді: ${p.secondCups} × ${text(rate)} = ${text(ans)} стақан. Тексеру: ${p.firstCups} × ${text(ans)} = ${p.secondCups*p.targetFirst}; ингредиенттер қатынасы сақталды.`);
 case'whole-offset-fractional-root':
  rate=q(p.rightNum,p.rightDen);a=mul(rate,q(p.last));ans=sub(a,q(p.offset));assert(ans[0]>0&&ans[1]!==1);return choice(`(${p.rightNum}/${p.rightDen}) = ((${p.offset} + x)/${p.last}) теңдігіндегі x-ті есептеңіз.`,[dec(ans),String(p.offset+1),dec(add(a,q(p.offset))),dec(a)],0,`Алдымен толық алымды табамыз: ${p.offset} + x = (${p.rightNum}/${p.rightDen}) × ${p.last} = ${dec(a)}. Сонда x = ${dec(a)} − ${p.offset} = ${dec(ans)}. Тексеру: ((${p.offset} + ${dec(ans)})/${p.last}) = (${p.rightNum}/${p.rightDen}). Толық алымды не қосу арқылы алынған мәнді x-пен шатастырмаймыз.`);
 case'fixed-work-more-people-fewer-days':case'fixed-repair-work-person-days':
  assert(p.nextWorkers>p.firstWorkers);total=p.firstWorkers*p.days;ans=q(total,p.nextWorkers);int(ans);return choice(`${p.firstWorkers} шебер бірдей қарқынмен ${k.includes('repair')?'жөндеуді':'тапсырысты'} ${p.days} күнде аяқтайды. Әр шебердің өнімділігі тұрақты. Сол жұмысты ${p.nextWorkers} шебер бірге неше күнде бітіреді?`,k.includes('repair')?[String(p.days),String(p.firstWorkers),text(ans),text(div(ans,q(2)))]:[text(mul(ans,q(2))),text(ans),text(div(ans,q(3))),text(add(ans,q(2)))],k.includes('repair')?2:1,`Жұмыс көлемі ${p.firstWorkers} × ${p.days} = ${total} адам-күн. Жаңа уақыт ${total} : ${p.nextWorkers} = ${text(ans)} күн. Тексеру: ${p.nextWorkers} × ${text(ans)} = ${total}. Адам көбейгенде бірдей жұмысқа уақыт азаяды; жұмыс көлемі сақталады.`);
 case'partial-work-one-day-then-whole-new-count':
  total=p.firstWorkers*p.partDen;ans=q(total,p.nextWorkers);int(ans);return choice(`Өнімділіктері бірдей ${p.firstWorkers} жұмысшы БІР күнде тапсырыстың (1/${p.partDen}) бөлігін орындайды. Бүкіл тапсырысты ${p.nextWorkers} сондай жұмысшы неше күнде бітіреді? Барлығы басынан бірге бастайды.`,[text(add(ans,q(5))),text(ans),text(add(ans,q(1))),text(mul(ans,q(2)))],1,`Бір күнде жасалған жұмыс толық көлемнің (1/${p.partDen}) бөлігі. Бүкіл көлем ${p.firstWorkers} × ${p.partDen} = ${total} адам-күн. ${p.nextWorkers} адамға ${total} : ${p.nextWorkers} = ${text(ans)} күн қажет. Тексеру: ${p.nextWorkers} × ${text(ans)} = ${total}. Бір күндік бөлікті бүкіл жұмыс деп алуға болмайды.`);
 case'nested-decimal-fraction-requested-multiple':
  a=q(p.addedTenths,10);b=q(p.smallHundredths,100);x=div(q(p.inner),b);y=add(a,x);z=div(q(p.outer),y);ans=mul(q(p.multiplier),z);int(ans);assert(!same(ans,z));return choice(`x = (${p.outer}/(${dec(a)} + (${p.inner}/${dec(b)}))). ${p.multiplier}x өрнегінің мәнін табыңыз.`,[text(mul(ans,q(10))),'10',String(p.multiplier),text(ans)],3,`Ішкі бөлшектен бастаймыз: (${p.inner}/${dec(b)}) = ${text(x)}. Сыртқы бөлім ${dec(a)} + ${text(x)} = ${dec(y)}. x = (${p.outer}/${dec(y)}) = ${text(z)}. Енді сұралған көбейтінді ${p.multiplier} × ${text(z)} = ${text(ans)}. Бөлімге қосылған ондық сан сыртқы бөлшекке түгел кіреді; x пен ${p.multiplier}x бір мән емес.`);
 case'gcd-of-three-not-pair':
  total=gcd(gcd(p.a,p.b),p.c);assert(total>1);ans=q(total);return choice(`${p.a}, ${p.b} және ${p.c} сандарының ҮШЕУІНЕ БІРДЕЙ ортақ ең үлкен бөлгішін табыңыз.`,[String(total+2),String(total+3),String(total),String(p.a*p.b)],2,`Алғашқы екеуінің ЕҮОБ-ы ${gcd(p.a,p.b)}. Оны үшінші ${p.c} санымен қайта салыстырғанда ең үлкен ортақ бөлгіш ${total}. Тексеру: ${p.a} : ${total} = ${p.a/total}, ${p.b} : ${total} = ${p.b/total}, ${p.c} : ${total} = ${p.c/total}. Осы үш нәтиженің бірден басқа ортақ бөлгіші жоқ. Тек екі санға бөлінетін сан жеткіліксіз.`);
 case'equal-rectangle-area-unknown-width':
  a=q(p.firstLengthTenths,10);b=q(p.firstWidthTenths,10);c=q(p.nextLengthTenths,10);total=mul(a,b);ans=div(total,c);assert(ans[0]>0);return choice(`Екі тіктөртбұрыш аудандары тең. Біріншісінің ұзындығы ${dec(a)} м, ені ${dec(b)} м. Екіншісінің ұзындығы ${dec(c)} м. Екінші тіктөртбұрыштың ені қандай?`,[`${dec(mul(ans,q(2)))} м`,`${dec(b)} м`,`${dec(ans)} м`,`${dec(total)} м`],2,`Бірінші аудан ${dec(a)} × ${dec(b)} = ${dec(total)} м². Екінші аудан да сол шама: оның ені ${dec(total)} : ${dec(c)} = ${dec(ans)} м. Тексеру: ${dec(c)} × ${dec(ans)} = ${dec(total)} м². Аудан мен еннің бірліктері әртүрлі.`);
 case'constant-over-coefficient-x':
  ans=q(p.first*p.rightDen,p.coefficient*p.rightNum);int(ans);return choice(`(${p.first}/(${p.coefficient}x)) = (${p.rightNum}/${p.rightDen}), x ≠ 0. Пропорцияның түбірін табыңыз.`,[String(p.first-2),String(p.coefficient),text(ans),String(p.first)],2,`Айқас көбейту: ${p.first} × ${p.rightDen} = ${p.rightNum} × ${p.coefficient}x. Сондықтан ${p.coefficient*p.rightNum}x = ${p.first*p.rightDen}, x = ${text(ans)}. Бөлім ${p.coefficient} × ${text(ans)} = ${text(mul(q(p.coefficient),ans))} нөл емес. Екі жақ та ${text(q(p.rightNum,p.rightDen))} болады.`);
 case'mixed-given-ratio-linear-expression':
  assert(p.num<p.den);a=M(p.whole,p.num,p.den);b=div(q(1),a);ans=add(q(p.firstCoefficient),mul(q(p.secondCoefficient),b));assert(ans[1]!==1);return choice(`m, n > 0 және (m/n) = ${mt(p.whole,p.num,p.den)}. ((${p.firstCoefficient}m + ${p.secondCoefficient}n)/m) мәнін таңдаңыз.`,[mixed(ans),'1 + (1/4)',mixed(add(ans,q(3))),mixed(add(q(p.firstCoefficient),mul(q(p.secondCoefficient),a)))],0,`Берілген аралас сан ${text(a)}, демек (n/m) = ${text(b)}. Өрнекті бөлеміз: ((${p.firstCoefficient}m + ${p.secondCoefficient}n)/m) = ${p.firstCoefficient} + ${p.secondCoefficient} × (n/m). Орнына қойғанда ${p.firstCoefficient} + ${p.secondCoefficient} × ${text(b)} = ${text(ans)} = ${mixed(ans)}. Кері қатынасты қолданбай көбейту басқа нәтижені береді.`);
 case'percent-less-other-as-base':
  assert(p.second>p.first);ans=q((p.second-p.first)*100,p.second);int(ans);return choice(`Алма санының алмұрт санына қатынасы ${p.first} : ${p.second}. Алма алмұрттан неше ПАЙЫЗҒА АЗ?`,[String(p.first*100/p.second),'60',text(ans),'20'],2,`Айырма ${p.second} − ${p.first} = ${p.second-p.first} үлес. 100% деп алмұрттың ${p.second} үлесін аламыз. Пайыз (${p.second-p.first}/${p.second}) × 100% = ${text(ans)}%. Тексеру: ${p.second} үлестің ${text(ans)}%-ы ${p.second-p.first}, оны алып тастасақ ${p.first} қалады. Алма санын бөлімге қою салыстыру негізін ауыстырады.`);
 case'straight-angle-two-ratio-larger':
  assert(p.b>p.a);rate=q(180,p.a+p.b);int(rate);ans=mul(q(p.b),rate);return choice(`Жазыңқы бұрышты ішкі сәуле ${p.a} : ${p.b} қатынасындағы екі бұрышқа бөлді. ҮЛКЕН бұрыштың градустық өлшемін таңдаңыз.`,[`${text(mul(q(p.a),rate))}°`,`${text(add(ans,q(2)))}°`,`${text(ans)}°`,`${text(add(ans,q(9)))}°`],2,`Жазыңқы бұрыш 180°. Бір үлес 180 : (${p.a} + ${p.b}) = ${text(rate)}°. Үлкені ${p.b} × ${text(rate)} = ${text(ans)}°, кішісі ${text(mul(q(p.a),rate))}°. Екі бұрыштың қосындысы 180°. Сұралғаны кіші бөлік емес.`);
 case'affine-over-affine-root-then-minus-negative':
  assert(p.rightNum!==p.rightDen);x=q(p.rightDen*p.topOffset-p.rightNum*p.bottomOffset,p.rightNum-p.rightDen);assert(!same(x,q(-p.bottomOffset)));ans=add(q(p.whole),mul(q(p.negativeCoefficient),x));int(ans);return choice(`((x + ${p.topOffset})/(x + ${p.bottomOffset})) = (${p.rightNum}/${p.rightDen}), x ≠ -${p.bottomOffset}. ${p.whole} − (-${p.negativeCoefficient}x) өрнегінің мәнін табыңыз.`,[text(ans),text(x),text(sub(q(p.whole),mul(q(p.negativeCoefficient),x))),text(sub(mul(q(p.negativeCoefficient),x),q(p.whole)))],0,`Айқас көбейтеміз: ${p.rightDen} × (x + ${p.topOffset}) = ${p.rightNum} × (x + ${p.bottomOffset}). Ашсақ ${p.rightDen}x + ${p.rightDen*p.topOffset} = ${p.rightNum}x + ${p.rightNum*p.bottomOffset}. Бұдан ${p.rightNum-p.rightDen}x = ${p.rightDen*p.topOffset-p.rightNum*p.bottomOffset}, x = ${text(x)}. Бөлім x + ${p.bottomOffset} = ${text(add(x,q(p.bottomOffset)))} нөл емес. Қос минус қосуға айналады: ${p.whole} − (-${p.negativeCoefficient}x) = ${p.whole} + ${p.negativeCoefficient}x = ${text(ans)}.`);
 case'triangle-perimeter-smallest-side':
  assert(p.a<p.b&&p.b<p.c&&p.a+p.b>p.c);rate=q(p.perimeter,p.a+p.b+p.c);int(rate);ans=mul(q(p.a),rate);return choice(`Үшбұрыш қабырғалары ${p.a} : ${p.b} : ${p.c} қатынасында, периметрі ${p.perimeter} см. Ең КІШІ қабырғасы неше сантиметр?`,[String(p.perimeter/2),text(ans),text(mul(q(p.b),rate)),text(mul(q(p.c),rate))],1,`Барлық үлес ${p.a+p.b+p.c}. Бір үлес ${p.perimeter} : ${p.a+p.b+p.c} = ${text(rate)} см. Қабырғалар ${text(ans)}, ${text(mul(q(p.b),rate))}, ${text(mul(q(p.c),rate))} см. Ең кішісі ${text(ans)} см. Қысқа екеуінің қосындысы ұзыннан үлкен, сондықтан үшбұрыш бар. Үш қабырға қосындысы ${p.perimeter} см.`);
 case'cylinder-diameter-squared-length-inverse-mass':
  assert(p.diameterFactor>1&&p.lengthDivisor>1);rate=q(p.diameterFactor**2,p.lengthDivisor);ans=mul(q(p.mass),rate);int(ans);return choice(`Цилиндр пішінді тұтас ағаш бөрененің массасы ${p.mass} кг. Дәл сондай ағаштан жасалған екінші бөрененің ДИАМЕТРІ ${p.diameterFactor} есе үлкен, ҰЗЫНДЫҒЫ ${p.lengthDivisor} есе қысқа. Тығыздықтары бірдей. Екіншісінің массасы неше килограмм?`,[text(ans),text(q(p.mass*p.diameterFactor,p.lengthDivisor)),String(p.mass*p.diameterFactor),text(q(p.mass,p.lengthDivisor))],0,`Диаметр ${p.diameterFactor} есе артқанда радиус та ${p.diameterFactor} есе өседі, дөңгелек қиманың ауданы ${p.diameterFactor}² = ${p.diameterFactor**2} есе артады. Ұзындық ${p.lengthDivisor} есе кемиді. Көлем, демек масса ${p.diameterFactor**2} : ${p.lengthDivisor} = ${dec(rate)} есе өзгереді. Масса ${p.mass} × ${dec(rate)} = ${text(ans)} кг. Диаметрді ауданға сызықтық көбейткіш деп алу квадраттау қадамын жоғалтады.`);
 case'whole-divide-mixed-equals-unknown-divide-mixed':
  assert(p.mixedNum<p.mixedDen&&p.lastNum<p.lastDen);a=M(p.mixedWhole,p.mixedNum,p.mixedDen);b=M(p.lastWhole,p.lastNum,p.lastDen);rate=div(q(p.first),a);ans=mul(rate,b);int(ans);return choice(`${p.first} : ${mt(p.mixedWhole,p.mixedNum,p.mixedDen)} = x : ${mt(p.lastWhole,p.lastNum,p.lastDen)} пропорциясындағы белгісіз мүшені табыңыз.`,[text(sub(ans,q(20))),text(ans),text(div(ans,q(3))),text(sub(ans,q(10)))],1,`Бірінші аралас сан ${text(a)}. Сол қатынас ${p.first} : ${text(a)} = ${text(rate)}. Екінші аралас сан ${text(b)}, сондықтан x = ${text(rate)} × ${text(b)} = ${text(ans)}. Тексеру: ${text(ans)} : ${text(b)} = ${text(rate)}. Аралас сан бүтін және бөлшек бөліктерімен бірге бір бөлгіш болып табылады.`);
 case'grain-volume-decimal-mass-product':
  a=q(p.massTenths,10);b=q(p.targetVolumeTenths,10);rate=div(a,q(p.knownVolume));ans=mul(rate,b);return choice(`Бірдей бидайдың ${p.knownVolume} м³ көлемі ${dec(a)} т болады. Сол тығыздықпен ${dec(b)} м³ бидайдың массасы неше тонна?`,[dec(ans),dec(mul(ans,q(2))),dec(b),dec(sub(ans,q(1)))],0,`Бір м³ бидай ${dec(a)} : ${p.knownVolume} = ${dec(rate)} т. Толық масса ${dec(b)} × ${dec(rate)} = ${dec(ans)} т. Тексеру: ${dec(ans)} : ${dec(b)} = ${dec(rate)} т/м³. Көлем бірлігі м³, соңғы жауап массаны тоннамен береді.`);
 case'trapezoid-explicit-bases-legs-largest':
  assert(p.secondBase>p.firstBase&&p.firstBase>p.leg&&p.secondBase-p.firstBase<2*p.leg);total=2*p.leg+p.firstBase+p.secondBase;rate=q(p.perimeter,total);int(rate);ans=mul(q(p.secondBase),rate);return choice(`Теңбүйірлі трапецияның екі бүйір қабырғасы мен кіші, үлкен табандары осы ретпен ${p.leg} : ${p.leg} : ${p.firstBase} : ${p.secondBase} қатынасында. Периметрі ${p.perimeter} см. Ең ұзын қабырғасы неше сантиметр?`,[`${text(ans)} см`,`${text(mul(q(p.leg),rate))} см`,`${String(p.secondBase)} см`,`${text(mul(q(p.firstBase),rate))} см`],0,`Барлық үлес ${p.leg} + ${p.leg} + ${p.firstBase} + ${p.secondBase} = ${total}. Бір үлес ${p.perimeter} : ${total} = ${text(rate)} см. Ең үлкен табан ${p.secondBase} × ${text(rate)} = ${text(ans)} см. Бүйірлер ${text(mul(q(p.leg),rate))} см, кіші табан ${text(mul(q(p.firstBase),rate))} см. Төрт ұзындық қосындысы ${p.perimeter} см. Табандар айырмасы екі бүйірдің қосындысынан кіші, сондықтан оң биіктікпен мұндай теңбүйірлі трапеция салынады.`);
 case'division-root-then-multiple':
  a=q(p.quotientTenths,10);x=mul(q(p.divisor),a);ans=mul(q(p.multiple),x);int(ans);assert(!same(x,ans));return choice(`x ÷ ${p.divisor} = ${dec(a)} теңдеуін шешіңіз. Жауап ретінде ${p.multiple}x мәнін таңдаңыз.`,[text(ans),String(p.divisor),text(x),dec(mul(a,q(2)))],0,`Белгісіз бөлінгіш x = ${dec(a)} × ${p.divisor} = ${text(x)}. Бірақ сұралғаны ${p.multiple}x: ${p.multiple} × ${text(x)} = ${text(ans)}. Тексеру: ${text(x)} ÷ ${p.divisor} = ${dec(a)}. Түбір мен оның көбейтіндісін ажыратамыз.`);
 case'constant-hourly-pay-all-three-days':
  rate=q(p.firstPay,p.firstHours);int(rate);total=p.firstHours+p.secondHours+p.thirdHours;ans=mul(rate,q(total));return choice(`Қызметкер бірінші күні ${p.firstHours} сағат істеп, ${p.firstPay} теңге алды. Екінші күні ${p.secondHours}, үшінші күні ${p.thirdHours} сағат істеді. Сағаттық ақы бірдей. ҮШ КҮННІҢ жалпы ақысы неше теңге?`,[text(mul(rate,q(p.secondHours))),text(mul(rate,q(p.thirdHours))),text(ans),text(mul(rate,q(p.firstHours+p.secondHours)))],2,`Бір сағат ақысы ${p.firstPay} : ${p.firstHours} = ${text(rate)} теңге. Барлық уақыт ${p.firstHours} + ${p.secondHours} + ${p.thirdHours} = ${total} сағат. Жалпы ақы ${total} × ${text(rate)} = ${text(ans)} теңге. Күндік ақылар ${p.firstPay}, ${text(mul(rate,q(p.secondHours)))}, ${text(mul(rate,q(p.thirdHours)))}; үшеуін бірге қосамыз.`);
 case'two-digit-multiples-excluding-triple-multiples':{
  assert.equal(p.excluded,p.base*3);const all=[],excluded=[],kept=[];for(let n=10;n<=99;n++)if(n%p.base===0){all.push(n);if(n%p.excluded===0)excluded.push(n);else kept.push(n);}assert(excluded.length>0);ans=q(kept.length);return choice(`Екі таңбалы натурал сандардың ішінде ${p.base} санына бөлініп, ${p.excluded} санына БӨЛІНБЕЙТІНДЕР нешеу?`,[String(kept.length+2),String(kept.length+1),String(kept.length),String(kept.length-1)],2,`${p.base} санына бөлінетіндер: ${all.join(', ')} — ${all.length} сан. Олардың ішінде ${p.excluded} санына бөлінетіндер: ${excluded.join(', ')} — ${excluded.length} сан. Бұл тізім алғашқымен түгел қамтылады, сондықтан ${all.length} − ${excluded.length} = ${kept.length}. Қалғандары ${kept.join(', ')}. Бір таңбалы еселіктерді де, 100 санын да қоспаймыз.`);
 }
 case'equal-affine-coefficients-ratio-then-target':
  assert(p.rightNum!==p.rightDen);x=q(p.rightDen*p.topAdd+p.rightNum*p.bottomSubtract,p.coefficient*(p.rightNum-p.rightDen));assert(!same(mul(q(p.coefficient),x),q(p.bottomSubtract)));ans=sub(mul(q(1+p.negativeCoefficient),x),q(p.targetSubtract));int(ans);return choice(`((${p.coefficient}x + ${p.topAdd})/(${p.coefficient}x − ${p.bottomSubtract})) = (${p.rightNum}/${p.rightDen}), ${p.coefficient}x − ${p.bottomSubtract} ≠ 0. x − ${p.targetSubtract} − (-${p.negativeCoefficient}x) мәнін табыңыз.`,[text(x),text(ans),String(-p.targetSubtract),text(add(ans,q(4)))],1,`Айқас көбейтеміз: ${p.rightDen} × (${p.coefficient}x + ${p.topAdd}) = ${p.rightNum} × (${p.coefficient}x − ${p.bottomSubtract}). Ашсақ ${p.rightDen*p.coefficient}x + ${p.rightDen*p.topAdd} = ${p.rightNum*p.coefficient}x − ${p.rightNum*p.bottomSubtract}. Демек ${p.coefficient*(p.rightNum-p.rightDen)}x = ${p.rightDen*p.topAdd+p.rightNum*p.bottomSubtract}, x = ${text(x)}. Бөлім ${text(sub(mul(q(p.coefficient),x),q(p.bottomSubtract)))} нөл емес. Сұралған өрнек x − ${p.targetSubtract} + ${p.negativeCoefficient}x = ${1+p.negativeCoefficient}x − ${p.targetSubtract} = ${text(ans)}. Минустың алдындағы минус қосуға айналады.`);
 default:throw Error(k);
 }
}
export function verifyEdition(row){assert.equal(row.grade,6);assert.equal(row.minimumPlan,'pro');const result=renderEdition(row);for(const f of['statement','answer','solution','options'])assert.deepEqual(row[f],result[f]);assert(!/[\\$]|undefined|NaN|<\/?(?:script|img|svg)/i.test(row.statement+row.solution));return{answer:result.answer,checks:['all48_saved_collection_occurrences_fullconditions_officialsolutions_keys_everyMCQ_individually_read','exact_mixed_decimal_fraction_ratios_and_coefficient_dividend_vs_divisor_roles','same_improper_numerator_cancellations_equal_mixed_decimal_numerators_preserved','requested_multiples_expressions_and_ordered_part_pairs_distinguished_from_roots','fixed_work_mass_output_density_and_equal_unit_assumptions_explicit','affine_variable_denominators_checked_nonzero_before_target_expression','nested_fraction_mainbars_and_decimal_cube_common_factor_order_retained','geometric_area_diameter_squared_perimeter_triangle_and_trapezoid_domains','prime_gcd_three_numbers_percent_comparison_base_and_complete_two_digit_exclusion','author_draft_requires_external_independent_review_before_closed_standard_release']};}
