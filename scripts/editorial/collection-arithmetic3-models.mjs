import assert from 'node:assert/strict';
import {Q,add,sub,mul,div,neg,equal,scalar,affine,at,comparisons,display as d,fr,gcd,parse,coefficients,expandedTerms,termsText,linear} from './collection-inequalities-math.mjs';
const keys=(p,ks)=>assert.deepEqual(Object.keys(p).sort(),ks.toSorted()),positive=(...ns)=>ns.forEach(n=>assert(Number.isSafeInteger(n)&&n>0));
const choose=(statement,value,solution,custom)=>{const answer=d(value),wrong=custom||[d(neg(value)),d(add(value,Q(1))),d(sub(value,Q(1)))],options=[...wrong,answer];assert.equal(new Set(options.map(o=>scalar(o).join('/'))).size,4);return{statement,options,answer,solution};};
function arithmeticTree(expression){const ts=expression.replace(/−/g,'-').replace(/×/g,'*').replace(/:/g,'/').match(/\d+(?:,\d+)?|[()+*/²-]/g)||[];assert.equal(ts.join(''),expression.replace(/−/g,'-').replace(/×/g,'*').replace(/:/g,'/').replace(/\s/g,''));let i=0;
 const atom=()=>{let t=ts[i++];assert(t);if(t==='('){const v=sum();assert.equal(ts[i++],')');return v;}assert(/^\d/.test(t));return['n',scalar(t),t];};
 const power=()=>{if(ts[i]==='-'){i++;return['neg',power()];}if(ts[i]==='+'){i++;return power();}let v=atom();if(ts[i]==='²'){i++;v=['square',v];}return v;};
 const product=()=>{let a=power();while(ts[i]==='*'||ts[i]==='/'){const op=ts[i++];a=[op,a,power()];}return a;};
 const sum=()=>{let a=product();while(ts[i]==='+'||ts[i]==='-'){const op=ts[i++];a=[op,a,product()];}return a;};const v=sum();assert.equal(i,ts.length);return v;}
const evalTree=t=>t[0]==='n'?t[1]:t[0]==='neg'?neg(evalTree(t[1])):t[0]==='square'?mul(evalTree(t[1]),evalTree(t[1])):({'+':add,'-':sub,'*':mul,'/':div})[t[0]](evalTree(t[1]),evalTree(t[2]));
function calcTrace(t){
 if(t[0]==='n')return d(t[1])===t[2]?[]:[`${t[2]} = ${fr(t[1])}`];
 if(t[0]==='neg'){const a=evalTree(t[1]);return[...calcTrace(t[1]),`−(${d(a)}) = ${d(neg(a))}`];}
 if(t[0]==='square'){const a=evalTree(t[1]);return[...calcTrace(t[1]),`(${d(a)})² = ${d(mul(a,a))}`];}
 const a=evalTree(t[1]),b=evalTree(t[2]),result=evalTree(t),op={'+':'+','-':'−','*':'×','/':':'}[t[0]];let work;
 if(t[0]==='/')work=`(${d(a)}) : (${d(b)}) = (${d(a)}) × (${fr(div(Q(1),b))}) = ${d(result)}`;
 else if((t[0]==='+'||t[0]==='-')&&(a[1]>1||b[1]>1)){
  const common=a[1]/gcd(a[1],b[1])*b[1],an=a[0]*(common/a[1]),bn=b[0]*(common/b[1]);
  work=`${fr(a)} ${op} ${fr(b)}: ортақ бөлім ${common}, (${an}/${common}) ${op} (${bn}/${common}) = ${d(result)}`;
 }else if(t[0]==='*'&&(a[1]>1||b[1]>1)){
  const g1=gcd(a[0],b[1]),g2=gcd(b[0],a[1]),factors=[g1,g2].filter(n=>n>1);
  work=g1>1||g2>1?`${fr(a)} × ${fr(b)}: айқыш ортақ ${factors.join(' және ')} ${factors.length===1?'көбейткішін':'көбейткіштерін'} қысқартамыз, ${fr(Q(a[0]/g1,a[1]/g2))} × ${fr(Q(b[0]/g2,b[1]/g1))} = ${d(result)}`:`(${d(a)}) × (${d(b)}) = ${d(result)}`;
 }else work=`(${d(a)}) ${op} (${d(b)}) = ${d(result)}`;
 return[...calcTrace(t[1]),...calcTrace(t[2]),work];
}
function solveEquation(s){const c=comparisons(s.replaceAll('c','x').replace(/:/g,'/'));assert.equal(c.length,1);assert.equal(c[0][1],'=');const l=affine(c[0][0]),r=affine(c[0][2]),a=sub(l.a,r.a),b=sub(l.b,r.b);assert(a[0]);return{c:c[0],l,r,a,b,root:div(neg(b),a)};}
function equationWork(s){const variable=/\bc\b/.test(s)||/\dc\b/.test(s)?'c':/\by\b/.test(s)||/\dy\b/.test(s)?'y':'x',e=solveEquation(s),lt=expandedTerms(parse(e.c[0])),rt=expandedTerms(parse(e.c[2])),common=[...lt,...rt].reduce((n,t)=>n/gcd(n,t.value[1])*t.value[1],1);assert(common>0);const scale=Q(common),L={a:mul(e.l.a,scale),b:mul(e.l.b,scale)},R={a:mul(e.r.a,scale),b:mul(e.r.b,scale)},A=mul(e.a,scale),B=mul(e.b,scale),v=at(e.l,e.root);assert(equal(v,at(e.r,e.root)));return{...e,work:`${s.includes('(')?'Жақшаларды таратып, барлық мүшелерді сақтаймыз':'Екі жақтағы мүшелерді жазамыз'}: ${termsText(lt,variable)} = ${termsText(rt,variable)}. ${common>1?`Екі жақтың ӘР МҮШЕСІН оң ортақ бөлім ${common} санына көбейтеміз: ${termsText(lt,variable,scale)} = ${termsText(rt,variable,scale)}. `:''}Ұқсас мүшелерді жинасақ, ${linear(L,variable)} = ${linear(R,variable)}. Айнымалы мүшелерді бір жаққа, тұрақтыларды екінші жаққа жинаймыз: ${linear({a:A,b:Q(0)},variable)} = ${d(neg(B))}. ${d(A)} санына бөліп, ${variable} = ${d(e.root)} аламыз. Бастапқы теңдеуге қойғандағы екі жақ та ${d(v)}.`};}
const equationIntros={
 'negative-distribution-close-decimal-coefficients':'Теріс көбейткішті жақшаның ӘР мүшесіне таратып',
 'positive-y-decimal-two-brackets':'Екі жақтағы ондық коэффициенттері бар жақшаларды ашып',
 'subtract-both-negative-variable-brackets':'Азайтылып тұрған жақшаның екі мүшесінің де таңбасын өзгертіп',
 'negative-root-two-left-decimal-brackets':'Ұқсас мүшелерді жинап, теріс коэффициентті ескеріп',
 'integer-variable-sides-negative-root':'Айнымалыны екі жақтан бір жаққа жинап',
};
const calculationIntros={
 'mixed-cross-product-subtracted-main-numerator':'Аралас сан мен бөлшектің көбейткіштерін алдымен айқыш қысқартамыз. Негізгі сызық бүкіл алымның айырмасын бөлімнің қосындысына бөледі.',
 'two-parentheses-negative-three-fraction-sum':'Бірінші жақшада теріс сан азайтылады. Екінші жақшаның үш бөлшегін ортақ бөлімге келтіреміз; сыртқы азайту бүкіл екінші нәтижеге қатысты.',
 'decimal-product-mixed-quotient-left-to-right':'Көбейту мен бөлуді сыртқы азайту/қосудан бұрын орындаймыз. Екі аралас санды бүтін қосынды ретінде бөлеміз.',
 'fraction-sum-before-negative-thousandths-division':'Ішкі жақшада теріс аралас санды толық азайтамыз. Үш бөлшектің ортақ бөлімімен есептеп, содан кейін теріс мыңдық бөлшекке бөлеміз.',
 'decimal-product-minus-mixed-difference-division':'Аралас сандардың айырмасын ең алдымен ортақ бөлімге келтіреміз. Оған бөлгенде тек сол толық айырманың кері санын аламыз.',
 'whole-negative-one-collapse-before-mixed-product':'Жақшадағы үш санды ортақ бөлімге келтіреміз. Шыққан −1 саны теріс аралас көбейткішпен көбейгенде таңба оңға ауысады; соңғы теріс санды содан кейін қосамыз.',
 'mixed-difference-reciprocal-then-decimal-subtraction':'Алдымен жақшадағы екі аралас санды азайтамыз. Дайын айырмаға бөлу, бірінші көбейту және ең соңғы азайту өз ретімен орындалады.',
 'mixednegative-plus-decimal-small-fraction-product':'Ішкі үш санды ортақ бөлімге келтіреміз; теріс ондық санды азайту — оның қарама-қарсысын қосу. Тек дайын шағын бөлшекке ондық көбейткішті қолданамыз.',
 'two-negative-main-parts-over-negative-product':'Негізгі бөлшектің алымында теріс көбейтінді мен теріс бөлінді қосылады. Бөлімде де теріс көбейтінді бар; толық бөлінді оң болуы керек.',
 'five-layer-subtractive-continued-fraction':'Ең ішкі қабаттан бастап әр БҮТІН бөлімді табамыз. Бір қабатты өткізіп жібермей, әр бөлуде тек дайын бөлімнің кері санын аламыз. Барлық бөлімнің нөл еместігін тексереміз.',
 'three-nested-subtractions-whole-negative-mixed':'Теріс аралас санның алдындағы минус бүтін қосындыға қатысты. Үш негізгі жақшаны іштен сыртқа ашып, әр сыртқы азайтудың таңбасын сақтаймыз.',
 'mixed-minus-three-unit-fraction-sum':'Жақшаның үш бірлік бөлшегін алдымен ортақ бөлімге келтіріп қосамыз. Содан кейін аралас саннан сол толық қосындыны азайтамыз.',
};
const authoredStructure={
  "mixed-cross-product-subtracted-main-numerator": "((N-(N+(N/N))*(N/N))/(N+N))",
  "negative-distribution-close-decimal-coefficients": "-N*(NV-N)-N=N*(-NV+N)",
  "two-parentheses-negative-three-fraction-sum": "(N-(-N))-((N/N)-(N/N)-(-N/N))",
  "decimal-product-mixed-quotient-left-to-right": "N*N-(N+(N/N))/(N+(N/N))+N",
  "positive-y-decimal-two-brackets": "N*(NV-N)=N*(NV-N)+N",
  "fraction-sum-before-negative-thousandths-division": "((-N/N)-(N/N)-(-(N+(N/N))))/(-N)+N",
  "decimal-product-minus-mixed-difference-division": "N*N-N/((N+(N/N))-(N+(N/N)))",
  "subtract-both-negative-variable-brackets": "N*(N-V)-N*(V+N)=-N",
  "whole-negative-one-collapse-before-mixed-product": "(N-(N+(N/N))-(N/N))*(-(N+(N/N)))+(-N)",
  "mixed-difference-reciprocal-then-decimal-subtraction": "N*N-N/((N+(N/N))-(N+(N/N)))",
  "negative-root-two-left-decimal-brackets": "N*(N-V)-N*(V+N)=N",
  "mixednegative-plus-decimal-small-fraction-product": "-(N+(N/N))+N*((N/N)-(N+(N/N))-(-N))",
  "integer-variable-sides-negative-root": "-NV-N=NV+N",
  "two-negative-main-parts-over-negative-product": "((-(N+(N/N))*(N+(N/N))+(-(N+(N/N)))/(N+(N/N)))/((-N/N)*(N+(N/N))))",
  "five-layer-subtractive-continued-fraction": "(N/(N-(N/(N-(N/(N-(N/(N-(N/N)))))))))",
  "three-nested-subtractions-whole-negative-mixed": "-N-(N-(N+(-(N+(N/N))+(N+(N/N)))))",
  "mixed-minus-three-unit-fraction-sum": "(N+(N/N))-((N/N)+(N/N)+(N/N))"
};
const structure=s=>s.replace(/\d+(?:,\d+)?/g,'N').replace(/[xyca]/g,'V').replace(/×/g,'*').replace(/−/g,'-').replace(/:/g,'/').replace(/\s/g,'');
export function renderEdition(row){const p=row.params,k=row.skillFamily;
 if(p.expression||p.equation)assert.equal(structure(p.expression||p.equation),authoredStructure[k],'Individual source-specific arithmetic/bracket/sign/nested scope');
 if(k in equationIntros){keys(p,['equation']);const e=equationWork(p.equation);return choose(`${equationIntros[k]}, ${p.equation} теңдеуінің түбірін таңдаңыз.`,e.root,e.work);}
 if(k==='proportion-unknown-dividend-then-factor'){
  keys(p,['leftTenths','rightTenths','coefficientDenominator','divisorNumerator','divisorDenominator']);positive(...Object.values(p));const l=Q(p.leftTenths,10),r=Q(p.rightTenths,10),ratio=div(l,r),coefficient=Q(1,p.coefficientDenominator),divisor=Q(p.divisorNumerator,p.divisorDenominator),dividend=mul(ratio,divisor),answer=div(dividend,coefficient);assert(equal(div(mul(coefficient,answer),divisor),ratio));return choose(`${d(l)} : ${d(r)} = (${fr(coefficient)} × x) : ${fr(divisor)} пропорциясындағы x мәнін таңдаңыз.`,answer,`Сол қатынас ${d(l)} : ${d(r)} = ${fr(ratio)}. Белгісіз бөлінгіш ${fr(coefficient)} × x = ${fr(ratio)} × ${fr(divisor)} = ${fr(dividend)}. Енді белгісіз көбейткіш x = ${fr(dividend)} : ${fr(coefficient)} = ${fr(answer)}. Тексеру: ${fr(coefficient)} × ${fr(answer)} : ${fr(divisor)} = ${fr(ratio)}. Алдымен бөлінгішті, одан кейін көбейткішті таптық.`);
 }
 if(k==='unknown-fractional-divisor-positive-domain'){
  keys(p,['dividend','coefficientNumerator','coefficientDenominator','rightNumeratorWhole','rightNumerator','rightNumeratorDenominator','rightDenominatorWhole','rightDenominatorNumerator','rightDenominator']);positive(...Object.values(p));assert(p.rightNumerator<p.rightNumeratorDenominator&&p.rightDenominatorNumerator<p.rightDenominator);const numerator=add(Q(p.rightNumeratorWhole),Q(p.rightNumerator,p.rightNumeratorDenominator)),denominator=add(Q(p.rightDenominatorWhole),Q(p.rightDenominatorNumerator,p.rightDenominator)),ratio=div(numerator,denominator),coefficient=Q(p.coefficientNumerator,p.coefficientDenominator),unknownDivisor=div(Q(p.dividend),ratio),answer=div(unknownDivisor,coefficient);assert(answer[0]>0);return choose(`${p.dividend} : (${fr(coefficient)} × x) = (${p.rightNumeratorWhole} + (${p.rightNumerator}/${p.rightNumeratorDenominator})) : (${p.rightDenominatorWhole} + (${p.rightDenominatorNumerator}/${p.rightDenominator})) теңдеуінің түбірін таңдаңыз. x = 0 мәні анықталу облысына кірмейді.`,answer,`Оң қатынас ${fr(numerator)} : ${fr(denominator)} = ${fr(ratio)}. Белгісіз БӨЛГІШ ${fr(coefficient)} × x = ${p.dividend} : ${fr(ratio)} = ${fr(unknownDivisor)}. Сондықтан x = ${fr(unknownDivisor)} : ${fr(coefficient)} = ${d(answer)}. Бұл мән нөл емес, ${fr(coefficient)} × x = ${fr(unknownDivisor)} ≠ 0. Тексеру: ${p.dividend} : ${fr(unknownDivisor)} = ${fr(ratio)}. Белгісіз бөлгішті бөліндіге көбейтіп таппаймыз, бөлінгішті бөліндіге бөлеміз.`);
 }
 if(k==='same-denominator-whole-parts-and-residual'){
  keys(p,['wholeParts','numerators','subtractNumerator','denominator']);assert(p.wholeParts.length===3&&p.numerators.length===3);positive(...p.wholeParts,...p.numerators,p.subtractNumerator,p.denominator);assert(p.numerators.every(n=>n<p.denominator));const whole=p.wholeParts.reduce((a,b)=>a+b),numerator=p.numerators.reduce((a,b)=>a+b)-p.subtractNumerator;assert(numerator>0&&numerator<p.denominator);const answer=`(${whole} + (${numerator}/${p.denominator}))`,options=[String(whole),`(${whole-1} + (${p.denominator-numerator}/${p.denominator}))`,`(${whole-1} + (${p.subtractNumerator}/${p.denominator}))`,answer];assert.equal(new Set(options.map(o=>scalar(o).join('/'))).size,4);return{statement:`${p.wholeParts.map((w,i)=>`(${w} + (${p.numerators[i]}/${p.denominator}))`).join(' + ')} − (${p.subtractNumerator}/${p.denominator}) өрнегін бүтін және бөлшек бөліктеріне топтап есептеңіз.`,options,answer,solution:`Бөлімдер бірдей ${p.denominator}, оларды қосып жібермейміз. Бүтін бөліктер ${p.wholeParts.join(' + ')} = ${whole}. Бөлшек алымдары ${p.numerators.join(' + ')} − ${p.subtractNumerator} = ${numerator}; бөлшек бөлігі (${numerator}/${p.denominator}). Толық нәтиже ${answer}. Қалдық алым нөл емес, сондықтан бүтін ${whole} санының өзі толық жауап болмайды.`};
 }
 if(k==='cross-proportion-unknown-numerator-addend'){
  keys(p,['leftNumerator','leftDenominator','shiftTenths','divisorTenths']);positive(...Object.values(p));assert(p.leftNumerator<p.leftDenominator);const shift=Q(p.shiftTenths,10),divisor=Q(p.divisorTenths,10),left=Q(p.leftNumerator,p.leftDenominator),sum=mul(left,divisor),answer=sub(sum,shift);assert(answer[0]>0);return choose(`${fr(left)} = ((x + ${d(shift)})/${d(divisor)}) пропорциясындағы x мәнін таңдаңыз.`,answer,`Бөлімдер ${p.leftDenominator} және ${d(divisor)} нөлден өзге. Айқыш көбейтеміз: ${p.leftDenominator} × (x + ${d(shift)}) = ${p.leftNumerator} × ${d(divisor)}. Оң жақ ${d(mul(Q(p.leftNumerator),divisor))}. Оны ${p.leftDenominator} санына бөліп, x + ${d(shift)} = ${d(sum)} табамыз. Белгісіз қосылғыш x = ${d(sum)} − ${d(shift)} = ${d(answer)}. Тексеру: (${d(answer)} + ${d(shift)}) : ${d(divisor)} = ${fr(left)}.`);
 }
 if(k==='inverse-mixed-dividend-addend-and-variable-divisor'){
  keys(p,['dividendTenths','addWhole','addNumerator','addDenominator','divisorWhole','divisorNumerator','divisorDenominator','rightWhole','rightNumerator','rightDenominator']);positive(...Object.values(p));assert(p.addNumerator<p.addDenominator&&p.divisorNumerator<p.divisorDenominator&&p.rightNumerator<p.rightDenominator);const start=Q(p.dividendTenths,10),addend=add(Q(p.addWhole),Q(p.addNumerator,p.addDenominator)),divisor=add(Q(p.divisorWhole),Q(p.divisorNumerator,p.divisorDenominator)),right=add(Q(p.rightWhole),Q(p.rightNumerator,p.rightDenominator)),unknownDividend=mul(right,divisor),unknownAddend=sub(unknownDividend,addend);assert(unknownAddend[0]>0);const answer=div(start,unknownAddend);assert(answer[0]>0);return choose(`((${d(start)} : x) + (${p.addWhole} + (${p.addNumerator}/${p.addDenominator}))) : (${p.divisorWhole} + (${p.divisorNumerator}/${p.divisorDenominator})) = (${p.rightWhole} + (${p.rightNumerator}/${p.rightDenominator})) теңдеуінің түбірін таңдаңыз. x ≠ 0.`,answer,`Анықталу шарты x ≠ 0. Алдымен белгісіз бөлінгіш: ${d(start)} : x + ${fr(addend)} = ${fr(right)} × ${fr(divisor)} = ${fr(unknownDividend)}. Кейін белгісіз қосылғыш: ${d(start)} : x = ${fr(unknownDividend)} − ${fr(addend)} = ${fr(unknownAddend)}. Енді белгісіз бөлгіш x = ${d(start)} : ${fr(unknownAddend)} = ${d(answer)}. Тексеру: ${d(start)} : ${d(answer)} = ${fr(unknownAddend)}; (${fr(unknownAddend)} + ${fr(addend)}) : ${fr(divisor)} = ${fr(right)}. Бөлінгіш → қосылғыш → бөлгіш ретін сақтадық.`);
 }
 assert(k in calculationIntros,'Unknown individually read arithmetic3 role '+k);keys(p,['expression']);const tree=arithmeticTree(p.expression),answer=evalTree(tree),trace=calcTrace(tree);assert(answer[0]);if(k==='whole-negative-one-collapse-before-mixed-product')assert.equal(p.expression,'(1,8 − (2 + (2/9)) − (26/45)) × (−(4 + (1/5))) + (−1,35)');return choose(`Амалдар мен жақшалардың ретін сақтап, ${p.expression} өрнегінің мәнін таңдаңыз.`,answer,calculationIntros[k]+' Қадамдар: '+trace.join('; ')+`. Толық нәтиже ${d(answer)}. Бөлгіштерді есептегенде ешбірі нөл болған жоқ.`);
}
export function verifyEdition(row){assert.equal(row.minimumPlan,'pro');assert.equal(row.grade,6);const result=renderEdition(row);for(const k of['statement','options','answer','solution'])assert.deepEqual(row[k],result[k]);assert(!/[\\$]|NaN|undefined/.test(row.statement+row.solution));return{answer:result.answer,checks:['All22 canonical nonvisual part3 saved conditions/full official solutions/everyMCQ individually read; six sourceSVG occurrences excluded.','New source-specific data and requested targets, exact arithmetic with explicit common-denominator additions/subtractions and genuine factor cross-cancellation shown.','Inverse divisor versus dividend roles, variable denominatorx≠0, mixed whole-parts grouping, cross proportion and full subtractive continued-fraction nesting retained.','Shared numeric mechanisms and essential zero/one/sign facts not claimed as new mathematical meanings. Closed draft requires external independent fullcontent/hash review.']};}
