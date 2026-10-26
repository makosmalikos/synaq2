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
function calcTrace(t){if(t[0]==='n')return d(t[1])===t[2]?[]:[`${t[2]} = ${fr(t[1])}`];if(t[0]==='neg'){const a=evalTree(t[1]);return[...calcTrace(t[1]),`−(${d(a)}) = ${d(neg(a))}`];}if(t[0]==='square'){const a=evalTree(t[1]);return[...calcTrace(t[1]),`(${d(a)})² = ${d(mul(a,a))}`];}const a=evalTree(t[1]),b=evalTree(t[2]),result=evalTree(t),op={'+':'+','-':'−','*':'×','/':':'}[t[0]],work=t[0]==='/'?`(${d(a)}) : (${d(b)}) = (${d(a)}) × ${fr(div(Q(1),b))} = ${d(result)}`:`(${d(a)}) ${op} (${d(b)}) = ${d(result)}`;return[...calcTrace(t[1]),...calcTrace(t[2]),work];}
function solveEquation(s){const c=comparisons(s.replaceAll('c','x'));assert.equal(c.length,1);assert.equal(c[0][1],'=');const l=affine(c[0][0]),r=affine(c[0][2]),a=sub(l.a,r.a),b=sub(l.b,r.b);assert(a[0]);return{c:c[0],l,r,a,b,root:div(neg(b),a)};}
function equationWork(s){const variable=/\bc\b/.test(s)||/\dc\b/.test(s)?'c':/\by\b/.test(s)||/\dy\b/.test(s)?'y':'x',e=solveEquation(s),lt=expandedTerms(parse(e.c[0])),rt=expandedTerms(parse(e.c[2])),common=[...lt,...rt].reduce((n,t)=>n/gcd(n,t.value[1])*t.value[1],1);assert(common>0);const scale=Q(common),L={a:mul(e.l.a,scale),b:mul(e.l.b,scale)},R={a:mul(e.r.a,scale),b:mul(e.r.b,scale)},A=mul(e.a,scale),B=mul(e.b,scale),v=at(e.l,e.root);assert(equal(v,at(e.r,e.root)));return{...e,work:`Жақшаларды таратып, барлық мүшелерді сақтаймыз: ${termsText(lt,variable)} = ${termsText(rt,variable)}. Екі жақтың ӘР МҮШЕСІН оң ортақ бөлім ${common} санына көбейтеміз: ${termsText(lt,variable,scale)} = ${termsText(rt,variable,scale)}. Ұқсас мүшелерді жинасақ, ${linear(L,variable)} = ${linear(R,variable)}. Айнымалы мүшелерді бір жаққа, тұрақтыларды екінші жаққа жинаймыз: ${linear({a:A,b:Q(0)},variable)} = ${d(neg(B))}. ${d(A)} санына бөліп, ${variable} = ${d(e.root)} аламыз. Бастапқы теңдеуге қойғандағы екі жақ та ${d(v)}.`};}
const kinds={
 'decimal-like-terms-root':'Ұқсас ондық коэффициенттерді жинап',
 'fractional-coefficient-brackets-root':'Бөлшек коэффициенттер мен жақша алдындағы минусты сақтап',
 'fraction-equation-decimal-term-on-left':'Ондық тұрақтыны да ортақ бөлімге көбейтуді ұмытпай',
 'difference-of-two-variable-numerators':'Екінші алымның бүкіл жақшасын азайтып',
 'all-three-denominators-negative-root':'Үш түрлі бөлімді түгел жойып',
 'mixed-unknown-subtrahend-dividend-factor-chain':'Аралас сандар мен белгісіз азайтқышты ескеріп',
 'variable-both-outside-fraction-two-sides':'Бөлшектердің сыртындағы x мүшелерін де сақтап',
 'numerator-products-three-denominator-root':'Алымдардағы көбейтіндіні және үш бөлімді ескеріп',
 'decimal-multiplier-negative-root':'Ондық көбейткішті жақшаның екі мүшесіне де таратып',
 'tenths-brackets-small-positive-coefficient':'Жақшаларды ашып, ондық коэффициенттердің айырмасын тауып',
 'decimal-y-negative-bracket-two-sides':'Оң жақтың теріс y мүшесінің таңбасын сақтап',
 'near-equal-decimal-coefficients-negative-y':'Бір-біріне жақын ондық коэффициенттерді дәл азайтып',
};
const intros={
 'square-negative-fraction-before-negative-division':'Алдымен толық теріс бөлшектің квадратын, содан кейін бөлулерді орындаймыз. Соңғы теріс 0,01 санына бөлу модульді 100 есе үлкейтеді, таңбаны теріске өзгертеді.',
 'mixed-product-minus-mixed-quotient-over-decimal-sum':'Негізгі бөлшектің алымы мен бөлімін бөлек есептейміз. Аралас сандардағы қосындыны түгел сан деп алып, көбейту мен бөлуді азайтудан бұрын орындаймыз.',
 'three-negative-numerator-two-negative-denominator':'Алымда үш теріс көбейткіш болғандықтан алым теріс; бөлімдегі екі теріс көбейткіш оң нәтиже береді. Сондықтан толық бөлшек теріс болуы тиіс. Аралас санның алдындағы минус бүтін қосындыға қатысты.',
 'quotient-of-two-negative-mixed-subexpressions':'Алдымен алымдағы және бөлімдегі аралас сандардың айырмаларын табамыз. Екі бөлік те теріс шыққан соң олардың бөліндісі оң болады; сыртқы негізгі сызық екі бүтін нәтижені бөледі.',
 'mixed-double-ratio-subtraction-over-product-quotient':'Алымның екі бөлігін жеке табамыз. Алымдағы екінші нәтиже АЗАЙТЫЛАДЫ; сыртқы негізгі бөлшек сызығы бүкіл алымды бүкіл бөлімге бөледі. Тек таңбаларды санап арифметиканы өткізіп кетпейміз.',
 'mixed-negative-difference-negative-reciprocal':'Теріс аралас санды азайтқанда оның қарама-қарсысын қосамыз. Содан кейін теріс бөлшекке бөлеміз; соңғы теріс көбейтіндіні азайту — оны оң қосуға ауыстыру.',
 'decimal-divide-minus-mixed-sum-product':'Жақшадағы екі аралас санды қосамыз, ондық бөлуді бөлек орындаймыз. Соңында дайын көбейтіндіні бөліндіден азайтамыз.',
 'subtract-division-by-negative-three-fraction-sum':'Үш бөлшекті алдымен ортақ бөлімге келтіреміз. Шыққан теріс, нөлден өзге бөлгішке бөлеміз; сондықтан сыртқы азайтуда теріс бөлінді азайтылады.',
 'mixed-divide-five-hundredths-minus-product-and-four-digit-tail':'Аралас сандардың бүтін қосындыларын сақтаймыз. 0,05 санына бөлу — 20 санына көбейту. Жақша мен көбейту дайын болған соң ғана сыртқы азайту және соңғы қосуды солдан оңға орындаймыз.',
 'two-parentheses-negative-subtraction-mixed-fractions':'Екі негізгі жақшаны жеке есептейміз. Екінші жақшада теріс аралас сан толық азайтылады; оны ашқаннан кейін бүкіл екінші нәтижені бірінші нәтижеден азайтамыз.',
 'crosscancel-mixed-product-inside-main-fraction':'Аралас сандарды бұрыс бөлшекке айналдырып, алымның көбейтіндісін есептейміз. Көбейткіштердің ортақ бөлігін қысқартып, содан кейін алымның қосындысы мен бөлімнің айырмасын бөлек табамыз.',
 'decimal-sum-plus-negative-fraction-subtraction':'Бірінші жақша ондық сандармен есептеледі. Екіншісінде теріс бөлшекті азайтуды қосуға ауыстырып, барлық үш санды ортақ бөлімге келтіреміз. Соңында екі нәтижені қосамыз.',
};
const sourceSpecificSteps={
 'mixed-product-minus-mixed-quotient-over-decimal-sum':'(1 + (29/35)) = (64/35), сондықтан (64/35) × (7/10) = (64/5) × (1/10) = (32/5) × (1/5) = (32/25): алдымен 7, содан кейін 2 ортақ көбейткішін қысқарттық. Екінші бөлінді (12/5) : (48/5) = (1/4). Алымдағы айырманың ортақ бөлімі 100: (32/25) − (1/4) = (128/100) − (25/100) = (103/100).',
 'quotient-of-two-negative-mixed-subexpressions':'Алымдағы аралас сандар (17/3) және (11/8). Олардың ортақ бөлімі 24: (17/3) − (11/8) = (136/24) − (33/24) = (103/24).',
 'mixed-negative-difference-negative-reciprocal':'Ішкі айырмадағы теріс санды азайтуды ауыстырсақ: (8 + (5/6)) − (6 + (3/4)). Ортақ бөлім 12: (8 + (10/12)) − (6 + (9/12)) = (2 + (1/12)) = (25/12).',
 'decimal-divide-minus-mixed-sum-product':'Жақшадағы ортақ бөлім 4: (1 + (1/4)) + (1 + (1/2)) = (1 + (1/4)) + (1 + (2/4)) = (2 + (3/4)) = (11/4).',
 'two-parentheses-negative-subtraction-mixed-fractions':'Бірінші жақшаны ортақ 160 бөліммен жазамыз: (−232/160) − (5/160) + (336/160) = (99/160). Екінші жақшада да 160: (−23/40) + (47/32) = (−92/160) + (235/160) = (143/160). Соңғы айырма (99/160) − (143/160) = (−44/160) = (−11/40) = −0,275.',
 'decimal-sum-plus-negative-fraction-subtraction':'Екінші жақшаның ортақ бөлімі 240: (108/240) + (35/240) − (68/240) = (75/240) = (5/16). Бірінші жақша −0,35 = (−7/20). Соңғы қосындының ортақ бөлімі 80: (−28/80) + (25/80) = (−3/80).',
};
const sourceStepExpressions={
  "mixed-product-minus-mixed-quotient-over-decimal-sum": "(((1 + (29/35)) × (7/10) − (2 + (2/5)) : (9 + (3/5)))/(0,48 : 1,6 + 0,84 : 4))",
  "quotient-of-two-negative-mixed-subexpressions": "((((5 + (2/3)) − (1 + (3/8))) : (−(4 + (7/24))))/((16,25 − (1 + (1/4))) : (−(3 + (3/4)))))",
  "mixed-negative-difference-negative-reciprocal": "(−(6 + (3/4)) − (−(8 + (5/6)))) : (−25/48) − 4,2 × (−1/3)",
  "decimal-divide-minus-mixed-sum-product": "14,875 : 2,5 − ((1 + (1/4)) + (1 + (1/2))) × 1,6",
  "two-parentheses-negative-subtraction-mixed-fractions": "((−1,45) − (1/32) − (−2,1)) − ((−23/40) − (−(1 + (15/32))))",
  "decimal-sum-plus-negative-fraction-subtraction": "(−0,57 + 0,22) + (0,45 − (−7/48) − (17/60))"
};
const authoredStructure={
  "decimal-like-terms-root": "NV+NV-N-NV=N",
  "square-negative-fraction-before-negative-division": "((-N/N)²-N/(-N/N))/(-N)",
  "fractional-coefficient-brackets-root": "(N/N)*(V-N)-(N/N)*(NV-N)=N",
  "mixed-product-minus-mixed-quotient-over-decimal-sum": "(((N+(N/N))*(N/N)-(N+(N/N))/(N+(N/N)))/(N/N+N/N))",
  "fraction-equation-decimal-term-on-left": "((NV+N)/N)-((N+NV)/N)+N=V",
  "three-negative-numerator-two-negative-denominator": "((-(N+(N/N))*N*(-N)*(-N/N)*N)/((N/N)*(-N)*(-(N+(N/N)))))",
  "difference-of-two-variable-numerators": "((V+N)/N)-((V-N)/N)=N",
  "quotient-of-two-negative-mixed-subexpressions": "((((N+(N/N))-(N+(N/N)))/(-(N+(N/N))))/((N-(N+(N/N)))/(-(N+(N/N)))))",
  "all-three-denominators-negative-root": "((N-NV)/N)-((N+NV)/N)=((N-NV)/N)",
  "mixed-unknown-subtrahend-dividend-factor-chain": "(N+(N/N))-((NV-(N+(N/N)))/(N+(N/N)))=(N+(N/N))",
  "variable-both-outside-fraction-two-sides": "((NV+N)/N)-V=((NV+N)/N)-NV",
  "mixed-double-ratio-subtraction-over-product-quotient": "(((-(N+(N/N))*(-(N+(N/N))))/(-N/N)-(N+(N/N))*(-N)/(-N/N))/((-(N+(N/N)))*N/(-N)))",
  "numerator-products-three-denominator-root": "((N*(V+N))/N)-((NV+N)/N)=((N*(NV+N))/N)-N",
  "decimal-multiplier-negative-root": "(NV-N)*N=NV-N",
  "mixed-negative-difference-negative-reciprocal": "(-(N+(N/N))-(-(N+(N/N))))/(-N/N)-N*(-N/N)",
  "decimal-divide-minus-mixed-sum-product": "N/N-((N+(N/N))+(N+(N/N)))*N",
  "tenths-brackets-small-positive-coefficient": "N*(V-N)=N+N*(V+N)",
  "subtract-division-by-negative-three-fraction-sum": "-N-N/((N/N)+(-N/N)-(N/N))",
  "mixed-divide-five-hundredths-minus-product-and-four-digit-tail": "(N+(N/N))/N-(N+(N/N))*(N+(N+(N/N)))+N",
  "decimal-y-negative-bracket-two-sides": "N*(NV-N)=N*(-V-N)-N",
  "two-parentheses-negative-subtraction-mixed-fractions": "((-N)-(N/N)-(-N))-((-N/N)-(-(N+(N/N))))",
  "crosscancel-mixed-product-inside-main-fraction": "((N+(N+(N/N))*(N+(N/N)))/(N-N))",
  "near-equal-decimal-coefficients-negative-y": "N*(NV+N)-N=NV",
  "decimal-sum-plus-negative-fraction-subtraction": "(-N+N)+(N-(-N/N)-(N/N))"
};
const structure=s=>s.replace(/\d+(?:,\d+)?/g,'N').replace(/[xyca]/g,'V').replace(/×/g,'*').replace(/−/g,'-').replace(/:/g,'/').replace(/\s/g,'');
export function renderEdition(row){const p=row.params,k=row.skillFamily;
 if(p.expression||p.equation)assert.equal(structure(p.expression||p.equation),authoredStructure[k],'Source-specific arithmetic/bracket/sign/nested scope structure');
 if(k in kinds){keys(p,['equation']);const e=equationWork(p.equation);if(k==='mixed-unknown-subtrahend-dividend-factor-chain'){
  assert.equal(p.equation,'(10 + (1/5)) - ((6x - (5 + (2/5)))/(12 + (3/5))) = (9 + (13/15))');
  e.work='Белгісіз азайтқышты табамыз. Бір бүтінді ұсақтаймыз: (10 + (1/5)) = (10 + (3/15)) = (9 + (18/15)). Сондықтан (9 + (18/15)) − (9 + (13/15)) = (5/15) = (1/3). Енді (6x − (27/5)) : (63/5) = (1/3). Белгісіз бөлінгіш 6x − (27/5) = (1/3) × (63/5) = (21/5). Одан 6x = (21/5) + (27/5) = (48/5), x = (48/5) : 6 = 1,6. Тексеру: 6 × 1,6 − 5,4 = 4,2; 4,2 : 12,6 = (1/3); 10,2 − (1/3) = (148/15).';
  }
  return choose(`${kinds[k]}, ${p.equation} теңдеуінің түбірін таңдаңыз.`,e.root,e.work);
 }
 if(k==='variable-denominator-decimal-proportion'){
  keys(p,['subtractTenths','coefficient','addHundredths','rightNumeratorTenths','rightDenominatorTenths']);positive(...Object.values(p));const shift=Q(p.subtractTenths,10),offset=Q(p.addHundredths,100),right=div(Q(p.rightNumeratorTenths,10),Q(p.rightDenominatorTenths,10)),A=sub(Q(1),mul(right,Q(p.coefficient)));assert(A[0]);const answer=div(add(shift,mul(right,offset)),A),den=add(mul(Q(p.coefficient),answer),offset);assert(den[0]);assert(equal(div(sub(answer,shift),den),right));const excluded=div(neg(offset),Q(p.coefficient));return choose(`((a − ${d(shift)})/(${p.coefficient}a + ${d(offset)})) = (${d(Q(p.rightNumeratorTenths,10))}/${d(Q(p.rightDenominatorTenths,10))}) теңдеуінің түбірін таңдаңыз. Бөлім нөлге тең болмауы тиіс.`,answer,`Анықталу шарты: ${p.coefficient}a + ${d(offset)} ≠ 0, яғни a ≠ ${d(excluded)}. Оң жақ ${fr(right)} болады. Айқыш көбейтсек, ${right[1]} × (a − ${d(shift)}) = ${right[0]} × (${p.coefficient}a + ${d(offset)}). Жақшаны ашқанда ${right[1]}a − ${d(mul(Q(right[1]),shift))} = ${d(mul(Q(right[0]),Q(p.coefficient)))}a + ${d(mul(Q(right[0]),offset))}. Айнымалы мүшелерді біріктіріп, a = ${d(answer)} аламыз. Бұл мәндегі бөлім ${d(den)} ≠ 0; бастапқы бөлшек ${fr(right)} мәніне тең.`);
 }
 assert(k in intros,'Unknown individually read arithmetic2 role '+k);keys(p,['expression']);if(sourceStepExpressions[k])assert.equal(p.expression,sourceStepExpressions[k],'Manual source-specific LCD/cancellation steps bind their exact givens');const tree=arithmeticTree(p.expression),value=evalTree(tree),trace=calcTrace(tree);assert(value[0]);const extra=k==='crosscancel-mixed-product-inside-main-fraction'?' Аралас көбейткіштер (48/11) және (11/8): 11 толық қысқарады, 48 : 8 = 6.':k==='subtract-division-by-negative-three-fraction-sum'?' Үш бөлімнің ортақ еселігі 280: (53/70) + (−9/56) − (31/40) = (212/280) − (45/280) − (217/280) = (−5/28).':'';
 if(extra)assert(k==='crosscancel-mixed-product-inside-main-fraction'?p.expression==='((3,36 + (4 + (4/11)) × (1 + (3/8)))/(7,4 − 4,8))':p.expression==='−16,8 − 0,6 : ((53/70) + (−9/56) − (31/40))');
 if(k==='square-negative-fraction-before-negative-division')assert(p.expression.endsWith(': (−0,01)')&&p.expression.includes('²'));
 return choose(`Амалдардың ретін сақтап, ${p.expression} өрнегінің мәнін таңдаңыз.`,value,intros[k]+extra+(sourceSpecificSteps[k]?' '+sourceSpecificSteps[k]:'')+' Қадамдар: '+trace.join('; ')+`. Нәтиже ${d(value)}. Бөлу амалдарының әр бөлімі нөлден өзге.`);
}
export function verifyEdition(row){assert.equal(row.grade,6);assert.equal(row.minimumPlan,'pro');const result=renderEdition(row);for(const k of['statement','options','answer','solution'])assert.deepEqual(row[k],result[k]);assert(!/[\\$]|NaN|undefined/.test(row.statement+row.solution));return{answer:result.answer,checks:['All25 canonical nonvisual part2 conditions, full official solutions and every MCQ individually read. SourceSVG19/23/27 excluded.','Each new expression/equation authored separately; exact rational recursive AST computes every printed inside-out step, reciprocal and whole-negative mixed number.','Fractional/decimal affine equations preserve every outside term and explicit LCD distribution; special inverse subtrahend/dividend chain and variable-denominator domain handled separately.','Shared arithmetic mechanisms and invariant pedagogical constants0.01/0.05 are not new semantic meanings. Closed author draft until independent fullcontent/hash review.']};}
