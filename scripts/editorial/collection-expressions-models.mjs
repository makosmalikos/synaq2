import assert from 'node:assert/strict';
import {Q,add,sub,mul,div,neg,equal,gcd,display as d,fr} from './collection-inequalities-math.mjs';
const positive=(...xs)=>xs.forEach(x=>assert(Number.isSafeInteger(x)&&x>0)),keys=(p,ks)=>assert.deepEqual(Object.keys(p).sort(),ks.toSorted());
const choose=(statement,value,solution,wrong)=>{const answer=d(value),options=[...(wrong||[d(neg(value)),d(add(value,Q(1))),d(sub(value,Q(1)))]),answer];assert.equal(new Set(options).size,4);return{statement,answer,options,solution};};
function tree(s){const original=s.replace(/−/g,'-').replace(/×/g,'*').replace(/:/g,'/'),ts=original.match(/\d+(?:,\d+)?|[a-z]|[()+*/²-]/g)||[];assert.equal(ts.join(''),original.replace(/\s/g,''));let i=0;
 const atom=()=>{const t=ts[i++];assert(t);if(t==='('){const a=sum();assert.equal(ts[i++],')');return a;}if(/^[a-z]$/.test(t))return['v',t];assert(/^\d/.test(t));const[w,f='']=t.split(',');return['n',Q(Number(w+f),10**f.length)];};
 const power=()=>{if(ts[i]==='-'){i++;return['neg',power()];}if(ts[i]==='+'){i++;return power();}let a=atom();if(ts[i]==='²'){i++;a=['square',a];}return a;};
 const product=()=>{let a=power();while(i<ts.length&&(ts[i]==='*'||ts[i]==='/'||ts[i]==='('||/^[a-z]$/.test(ts[i])||/^\d/.test(ts[i]))){let op=ts[i];if(op==='*'||op==='/')i++;else op='*';a=[op,a,power()];}return a;};
 const sum=()=>{let a=product();while(ts[i]==='+'||ts[i]==='-'){const op=ts[i++];a=[op,a,product()];}return a;};const t=sum();assert.equal(i,ts.length);return t;
}
const combine=terms=>{const out=new Map;for(const[m,c]of terms)out.set(m,add(out.get(m)||Q(0),c));return new Map([...out].filter(([,c])=>c[0]));};
function expanded(t){if(t[0]==='n')return[['',t[1]]];if(t[0]==='v')return[[t[1],Q(1)]];if(t[0]==='neg')return expanded(t[1]).map(([m,c])=>[m,neg(c)]);if(t[0]==='square'){const u=expanded(t[1]);return u.flatMap(([m,a])=>u.map(([n,b])=>[[...m+n].sort().join(''),mul(a,b)]));}const u=expanded(t[1]),v=expanded(t[2]);if(t[0]==='+')return[...u,...v];if(t[0]==='-')return[...u,...v.map(([m,c])=>[m,neg(c)])];if(t[0]==='*')return u.flatMap(([m,a])=>v.map(([n,b])=>[[...m+n].sort().join(''),mul(a,b)]));assert.equal(t[0],'/');const denominator=combine(v);assert.equal(denominator.size,1);assert(denominator.has(''));const a=denominator.get('');assert(a[0]);return u.map(([m,c])=>[m,div(c,a)]);}
const poly=s=>combine(expanded(tree(s))),same=(a,b)=>a.size===b.size&&[...a].every(([m,c])=>b.has(m)&&equal(c,b.get(m))),constant=t=>{const a=combine(expanded(t));assert(a.size===0||(a.size===1&&a.has('')));return a.get('')||Q(0);};
const text=terms=>terms.map(([m,c],i)=>{const negative=c[0]<0,magnitude=negative?neg(c):c,value=m?(equal(magnitude,Q(1))?'':d(magnitude))+m:d(magnitude);return(i?(negative?' − ':' + '):negative?'-':'')+value;}).join('')||'0';
const flat=p=>text([...p].sort(([a],[b])=>!a?1:!b?-1:a.localeCompare(b)));
function trace(t){if(t[0]==='n')return[];assert(t[0]!=='v');if(t[0]==='neg')return[...trace(t[1]),`−(${d(constant(t[1]))}) = ${d(constant(t))}`];if(t[0]==='square')return[...trace(t[1]),`(${d(constant(t[1]))})² = ${d(constant(t))}`];const a=constant(t[1]),b=constant(t[2]),value=constant(t),op={'+':'+','-':'−','*':'×','/':':'}[t[0]];let work=`(${d(a)}) ${op} (${d(b)}) = ${d(value)}`;
 if((t[0]==='+'||t[0]==='-')&&(a[1]>1||b[1]>1)){const D=a[1]/gcd(a[1],b[1])*b[1];work=`${fr(a)} ${op} ${fr(b)}: ортақ бөлім ${D}, (${a[0]*D/a[1]}/${D}) ${op} (${b[0]*D/b[1]}/${D}) = ${d(value)}`;}
 if(t[0]==='/')work=`(${d(a)}) : (${d(b)}) = (${d(a)}) × (${fr(div(Q(1),b))}) = ${d(value)}`;
 if(t[0]==='*'){const g1=gcd(a[0],b[1]),g2=gcd(b[0],a[1]);if(g1>1||g2>1)work=`${fr(a)} × ${fr(b)}: айқыш ${[g1,g2].filter(g=>g>1).join(' және ')} көбейткіштерін қысқартып, ${fr(Q(a[0]/g1,a[1]/g2))} × ${fr(Q(b[0]/g2,b[1]/g1))} = ${d(value)}`;}
 return[...trace(t[1]),...trace(t[2]),work];
}
function groupWork(terms){const groups=new Map;for(const[m,c]of terms){if(!groups.has(m))groups.set(m,[]);groups.get(m).push(c);}return[...groups].map(([m,cs])=>{const D=cs.reduce((D,c)=>D/gcd(D,c[1])*c[1],1),sum=cs.reduce(add,Q(0)),nativeSum=cs.map(c=>'('+fr(c)+')').join(' + '),converted=cs.map(c=>`(${c[0]*(D/c[1])}/${D})`).join(' + ');return`${m?m+' мүшесінің коэффициенттері':'Тұрақты мүшелер'}: ${nativeSum}${D>1?`, ортақ бөлім ${D}: ${converted}`:''} = ${d(sum)}`;}).join('; ');}
const structure=s=>s.replace(/\d+(?:,\d+)?/g,'N').replace(/−/g,'-').replace(/×/g,'*').replace(/:/g,'/').replace(/\s/g,'');
const authoredStructures={
  "minus-inner-constant-variable-cancellation": {
    "expression": "-(N/N)*(Nb-N)+(N/N)*(b+N)"
  },
  "distribute-group-then-common-factor": {
    "expression": "N*(Na+Nb)-Nb+Na"
  },
  "negative-input-square-modulus-order": {},
  "subtract-two-variable-bracket-then-factor": {
    "expression": "N*(Nn-m)-N*(n-Nm)"
  },
  "coefficient-even-negative-rational": {
    "expression": "(-N/N)a*(-N/N)b*N*(N/N)c"
  },
  "two-assigned-expressions-ratio-main-denominator": {
    "firstExpression": "((N+(N/N))-(N+(N/N))+(N+(N/N)))*N",
    "secondExpression": "((N*N-N*N)/(N²))"
  },
  "proportion-root-then-negative-subtraction-target": {},
  "coefficient-odd-negative-rational": {
    "expression": "(N/N)a*(-N/N)b*(-N)c*(-N/N)d"
  },
  "fractional-two-brackets-two-negative-coefficients": {
    "expression": "(N/N)*(Nx-Ny)-(N/N)*(Ny+Nx)"
  },
  "fractional-brackets-common-denominator-by-variable": {
    "expression": "(N/N)*(Na-Nb)+(N/N)*(b-a)"
  },
  "negative-fraction-distribution-both-mixed-coefficients": {
    "expression": "-(N/N)*(Nx+(N/N)y)+(N/N)*(x-Ny)"
  },
  "decimal-distribution-two-integer-coefficients": {
    "expression": "N*(Nx-Ny)-Nx+Ny"
  },
  "mixed-multiplier-constant-cancels": {
    "expression": "(N+(N/N))*((N/N)-a)-((N+(N/N))+a)"
  },
  "plus-inner-constant-variable-cancellation": {
    "expression": "-(N/N)*(Nb+N)+(N/N)*(b+N)"
  },
  "negative-decimal-distribution-signed-two-variables": {
    "expression": "-N*(Nm-Nn)-Nm+Nn"
  },
  "fractional-distribution-decimal-coefficients": {
    "expression": "(N/N)*(Na-(N/N)b)+(N/N)*(b-a)"
  },
  "decimal-minus-fraction-brackets-partial-coefficient": {
    "expression": "N*(a-Nb)-(N/N)*(Nb+Na)"
  },
  "decimal-affine-one-variable-and-constant": {
    "expression": "-N*(Na-N)+N*((N/N)a+N)"
  },
  "subtract-second-whole-bracket-signs": {
    "expression": "N*(Nx-N)-N*(Nx+N)"
  },
  "two-different-arguments-then-value-sum": {
    "firstFormula": "((N+Nx)/N)",
    "secondFormula": "(N/(N+x))"
  },
  "rewrite-known-sum-and-product-without-solving": {
    "expression": "Na+Nb*(Na+N)"
  },
  "nested-subtractions-all-inner-members": {
    "expression": "Na-(Na+Na-(Na+b)+(Nb-Na)-Nb)-Na"
  },
  "coefficient-even-negative-decimal": {
    "expression": "-Na*(-N/N)b*Nc"
  },
  "mixed-equals-decimal-partial-variable-cancellation": {
    "expression": "(N/N)*(Na+(N+(N/N))b)-N*((N/N)a-Nb)"
  },
  "three-brackets-common-variable-factor": {
    "expression": "N*(Na-N)+(Nb-N)-(N-Na)"
  }
};
export function renderEdition(row){const p=row.params,k=row.skillFamily;
 for(const field of['expression','firstExpression','secondExpression','firstFormula','secondFormula'])if(field in p)assert.equal(structure(p[field]),authoredStructures[k][field],'Individually read expression sign/bracket/variable scope');
 if(p.options){keys(p,['expression','options']);const terms=expanded(tree(p.expression)),result=combine(terms),correct=p.options.filter(o=>same(poly(o),result));assert.equal(correct.length,1);assert.equal(p.options.length,4);assert.equal(new Set(p.options).size,4);let intro='Жақша алдындағы көбейткіш ӘР мүшеге таралады; жақшаны азайтқанда оның барлық мүшелерінің таңбасы өзгереді.',supplement='';
  if(k==='mixed-multiplier-constant-cancels'){assert.equal(p.expression,'(6 + (1/8)) × ((2/7) − a) − ((1 + (3/4)) + a)');supplement=' Аралас сандар (6 + (1/8)) = (49/8) және (1 + (3/4)) = (7/4). (49/8) × (2/7) = (7/4), сондықтан тұрақты (7/4) − (7/4) = 0; айнымалы коэффициенті (−49/8) − 1 = (−57/8).';}
  if(k==='mixed-equals-decimal-partial-variable-cancellation'){assert.equal(p.expression,'(3/8) × (5,6a + (5 + (3/5))b) − 4,2 × ((1/2)a − 0,3b)');supplement=' Алдымен (5 + (3/5)) = 5,6 екенін көреміз. (3/8) × 5,6 = 2,1, ал 4,2 × (1/2) = 2,1: a мүшелері жойылады. b коэффициенті 2,1 + 1,26 = 3,36.';}
  if(/factor$/.test(k)){const vars=[...result].filter(([m])=>m);assert(vars.length>1&&vars.every(([,c])=>c[1]===1));const G=vars.reduce((g,[,c])=>gcd(g,c[0]),0);assert(G>1);const inside=text(vars.map(([m,c])=>[m,div(c,Q(G))]));supplement+=` Айнымалы коэффициенттердің ең үлкен ортақ көбейткіші ${G}: ${text(vars)} = ${G} × (${inside}). Тұрақты мүше болса, ол өз орнында сақталады.`;}
  return{statement:`${p.expression} өрнегіне айнымалылардың БАРЛЫҚ мәндері үшін тең болатын ықшамдалған нұсқаны таңдаңыз.`,options:p.options,answer:correct[0],solution:intro+supplement+` Жақшаларды ашқанда ${text(terms)}. Ұқсас мүшелерді БӨЛЕК жинаймыз: ${groupWork(terms)}. Толық ықшам түр ${flat(result)}. Сондықтан дұрыс нұсқа ${correct[0]}. Бір кездейсоқ мәнде тең шығуы толық теңдікке дәлел емес.`};
 }
 if(k.startsWith('coefficient-')){
  keys(p,['expression']);const terms=combine(expanded(tree(p.expression)));assert.equal(terms.size,1);const[[monomial,value]]=terms;assert(monomial==='abc'||monomial==='abcd');const negativeFactors=(p.expression.match(/[−-]/g)||[]).length;assert.equal(negativeFactors%2,value[0]<0?1:0);assert(k.includes('odd')?negativeFactors===3:negativeFactors===2);const numberExpression=p.expression.replace(/[a-z]/g,'');return choose(`${p.expression} бірмүшесінің тек САНДЫҚ КОЭФФИЦИЕНТІН таңдаңыз.`,value,`Әріптік бөлік ${monomial}, коэффициент — оның алдындағы барлық санның көбейтіндісі. Теріс көбейткіш саны ${negativeFactors}, сондықтан таңба ${negativeFactors%2?'теріс':'оң'}. Әріптерді сандық коэффициентке қоспаймыз. Сандық есептеу: ${trace(tree(numberExpression)).join('; ')}. Коэффициент ${d(value)}, толық бірмүше ${text([[monomial,value]])}.`);
 }
 if(k==='negative-input-square-modulus-order'){
  keys(p,['coefficient','insideCoefficient','constant','input']);positive(p.coefficient,p.insideCoefficient,p.constant);assert(Number.isSafeInteger(p.input)&&p.input<0);const square=p.input*p.input,first=-p.coefficient*square,inside=-p.insideCoefficient*p.input,answer=first+Math.abs(inside)+p.constant;assert(answer>0);return choose(`x = ${p.input} болғанда −${p.coefficient}x² + |−${p.insideCoefficient}x| + ${p.constant} өрнегінің мәнін таңдаңыз.`,Q(answer),`Алдымен x² = (${p.input})² = ${square}; содан кейін −${p.coefficient}x² = −${p.coefficient} × ${square} = ${first}. Көбейткіштің минусы квадраттың ішіне көшірілмейді. Модуль ішінде −${p.insideCoefficient} × (${p.input}) = ${inside}, оның модулі ${Math.abs(inside)}. Толық қосынды ${first} + ${Math.abs(inside)} + ${p.constant} = ${answer}.`);
 }
 if(k==='two-assigned-expressions-ratio-main-denominator'){
  keys(p,['firstExpression','secondExpression','numerator']);positive(p.numerator);assert.equal(p.secondExpression,'((0,8 × 2,3 − 0,8 × 1,3)/(0,8²))');const first=tree(p.firstExpression),second=tree(p.secondExpression),a=constant(first),b=constant(second),ratio=div(a,b),answer=div(Q(p.numerator),ratio);assert(a[0]>0&&b[0]>0&&ratio[0]>0&&ratio[1]===1);const whole=Math.floor(p.numerator/ratio[0]),remainder=p.numerator-whole*ratio[0];assert(whole>0&&remainder>0);return choose(`a = ${p.firstExpression}, b = ${p.secondExpression}. Алдымен a мен b мәндерін тауып, (${p.numerator}/(a : b)) өрнегінің мәнін таңдаңыз. Негізгі бөлшектің бөлімі — ТОЛЫҚ a : b қатынасы.`,answer,`a үшін қадамдар: ${trace(first).join('; ')}. Демек a = ${d(a)}. b алымында ортақ 0,8 көбейткішін шығарамыз: 0,8 × 2,3 − 0,8 × 1,3 = 0,8 × (2,3 − 1,3) = 0,8. Оның бөлімі (0,8)² = 0,64, сондықтан b = 0,8 : 0,64 = ${d(b)}. Енді a : b = ${d(a)} : ${d(b)} = ${d(ratio)}. Тек дайын қатынасты негізгі бөлгішке қоямыз: (${p.numerator}/${d(ratio)}) = (${whole} + (${remainder}/${ratio[0]})), себебі ${p.numerator} = ${ratio[0]} × ${whole} + ${remainder}. ${p.numerator} санын алдымен a санына бөліп, кейін тағы b санына бөлу басқа өрнекке әкеледі.`);
 }
 if(k==='proportion-root-then-negative-subtraction-target'){
  keys(p,['numeratorShift','denominatorShift','rightNumerator','rightDenominator','targetBase','targetCoefficient']);positive(...Object.values(p));assert(p.numeratorShift!==p.denominatorShift&&p.rightNumerator!==p.rightDenominator);const A=p.rightDenominator-p.rightNumerator,B=p.rightNumerator*p.denominatorShift-p.rightDenominator*p.numeratorShift,x=Q(B,A),den=add(x,Q(p.denominatorShift));assert(den[0]);const answer=add(Q(p.targetBase),mul(Q(p.targetCoefficient),x));assert(equal(div(add(x,Q(p.numeratorShift)),den),Q(p.rightNumerator,p.rightDenominator)));return choose(`((x + ${p.numeratorShift})/(x + ${p.denominatorShift})) = (${p.rightNumerator}/${p.rightDenominator}) орындалады. x + ${p.denominatorShift} ≠ 0. Алдымен x тауып, ${p.targetBase} − (−${p.targetCoefficient}x) өрнегінің МӘНІН таңдаңыз.`,answer,`Бөлімдер нөл емес, сондықтан айқыш көбейтеміз: ${p.rightDenominator} × (x + ${p.numeratorShift}) = ${p.rightNumerator} × (x + ${p.denominatorShift}). Жақшаларды ашсақ, ${p.rightDenominator}x + ${p.rightDenominator*p.numeratorShift} = ${p.rightNumerator}x + ${p.rightNumerator*p.denominatorShift}. Одан ${A}x = ${B}, x = ${d(x)}. Бұл кезде x + ${p.denominatorShift} = ${d(den)} ≠ 0. Сұралған өрнекте теріс көбейтіндіні азайту қосуға ауысады: ${p.targetBase} − (−${p.targetCoefficient}x) = ${p.targetBase} + ${p.targetCoefficient}x = ${p.targetBase} + ${d(mul(Q(p.targetCoefficient),x))} = ${d(answer)}. Жай x мәнін жауап деп алмаймыз.`);
 }
 if(k==='two-different-arguments-then-value-sum'){
  keys(p,['firstFormula','firstInput','secondFormula','secondInput']);assert(Number.isSafeInteger(p.firstInput)&&p.firstInput>0&&Number.isSafeInteger(p.secondInput)&&p.secondInput<0);const first=p.firstFormula.replaceAll('x',`(${p.firstInput})`),second=p.secondFormula.replaceAll('x',`(${p.secondInput})`),f=tree(first),g=tree(second),a=constant(f),b=constant(g),answer=add(a,b);return choose(`${p.firstFormula} және ${p.secondFormula} өрнектеріне СӘЙКЕСІНШЕ x = ${p.firstInput} және x = ${p.secondInput} мәндерін қойыңыз. Осы екі нәтиженің ҚОСЫНДЫСЫН таңдаңыз.`,answer,`Бірінші өрнекке тек ${p.firstInput} қоямыз: ${first}. Қадамдар: ${trace(f).join('; ')}. Екінші өрнекке тек ${p.secondInput} қоямыз: ${second}. Қадамдар: ${trace(g).join('; ')}. Айнымалысы бар бөлім ${p.secondInput} қойылғанда нөл емес. Екі дайын мәннің қосындысы ${d(a)} + ${d(b)} = ${d(answer)}. Бір x мәнін екеуіне бірдей қою талап етілмейді.`);
 }
 if(k==='rewrite-known-sum-and-product-without-solving'){
  keys(p,['expression','givenSum','givenProduct']);assert(Number.isSafeInteger(p.givenSum)&&Number.isSafeInteger(p.givenProduct));assert(p.givenSum>0&&p.givenProduct<0);assert(p.givenSum*p.givenSum-4*p.givenProduct>0);const result=poly(p.expression);assert.deepEqual([...result.keys()].sort(),['a','ab','b']);assert(equal(result.get('a'),result.get('b')));const A=result.get('a'),B=result.get('ab'),answer=add(mul(A,Q(p.givenSum)),mul(B,Q(p.givenProduct)));return choose(`a + b = ${p.givenSum}, ab = ${p.givenProduct} екені белгілі. a мен b мәндерін жеке шешпей, ${p.expression} өрнегінің мәнін таңдаңыз.`,answer,`Жақшаны ашқанда ${flat(result)} шығады. a және b мүшелерінің коэффициенті бірдей ${d(A)}, сондықтан ${d(A)}a + ${d(A)}b = ${d(A)} × (a + b). Бүкіл өрнек ${d(A)} × (a + b) + ${d(B)}ab болады. Берілген екі шаманы қоямыз: ${d(A)} × ${p.givenSum} + ${d(B)} × (${p.givenProduct}) = ${d(mul(A,Q(p.givenSum)))} + (${d(mul(B,Q(p.givenProduct)))}) = ${d(answer)}. ab теріс болғандықтан екінші қосылғыштың минусын жоғалтпаймыз.`);
 }
 throw Error('Unknown individually read expression role '+k);
}
export function verifyEdition(row){assert.equal(row.grade,6);assert.equal(row.minimumPlan,'pro');const result=renderEdition(row);for(const field of['statement','options','answer','solution'])assert.deepEqual(row[field],result[field]);assert(!/[\\$]|NaN|undefined/.test(row.statement+row.solution));return{answer:result.answer,checks:['All25 canonical saved nonvisual expression conditions/full official solutions/every MCQ individually read; source4 SVG excluded.','New individual data preserve whole-bracket distribution, separate variable groups, exact rational/decimal coefficients, zero coefficient/constant cancellation and common factoring; many share an algebraic mechanism and are not25 novel meanings.','Negative substitution square before outside minus/modulus, parity of negative monomial factors, full a:b denominator, proportion-domain then requested expression, separate arguments and known sum/product targets preserved.','Polynomial MCQ equivalence holds for every assignment, not one trial; source-specific mixed conversion and arithmetic common-factor steps explicit. Closed Standard draft awaits independent complete review/hash.']};}
