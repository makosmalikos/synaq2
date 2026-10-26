import assert from 'node:assert/strict';
const pick=(statement,options,answer,solution)=>{assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===answer).length,1);return{statement,options,answer,solution};};
const calculationIntros={
 'compound-mainbar-two-differences-left-to-right':'Негізгі сызықтың үстіндегі толық алымды және астындағы толық бөлімді бөлек табамыз. Бөлімнің ішіндегі қатар тұрған бөлу мен көбейтуді солдан оңға орындаймыз.',
 'mixed-borrow-then-division-negative-product':'Ең ішкі екі аралас санның айырмасын ортақ бөліммен табамыз. Одан кейін бөлу, қосу және ең соңғы теріс санға көбейту орындалады.',
 'negative-mixed-quotients-mainbar-positive':'Екі жақшадағы айырманы бөлек есептейміз. Әр теріс аралас бөлгіштің минусы БҮТІН аралас санға қатысты. Екі негізгі теріс нәтижені бөлгенде таңба оң болады.',
 'negative-three-mixed-sum-over-quarter':'Алымның алғашқы теріс аралас санын толық теріс қосынды ретінде жазамыз. Үш теріс мүшені ортақ бөлімге келтіріп, келесі екі бөліндіні есептейміз. Бөлімнің көбейтуі мен бөлуі солдан оңға жүреді.',
 'mixed-crosscancel-product-minus-decimal-mainbar':'Аралас көбейткіштерді бұрыс бөлшекке айналдырып, ортақ көбейткішті қысқартамыз. Содан кейін ғана алымның айырмасын, бөлімнің қосындысын және толық бөліндіні табамыз.',
 'signed-fraction-decimal-pair-parentheses':'Теріс бөлшекті азайтқанда оның қарама-қарсысын қосамыз. Екі жақшаны жеке есептеп, дайын нәтижелерді қосамыз.',
 'mixed-product-quotient-final-mixed-borrow':'Алдымен көбейту мен бөлуді табамыз; содан кейін қосу мен соңғы азайту орындалады. Соңғы аралас айырмада бір бүтінді ұсақтау қажет.',
 'nested-negative-fraction-pair-small-decimal-product':'Ішкі жақшадағы екі теріс бөлшекті қосамыз. Олардың толық қосындысын сыртқы теріс бөлшектен азайтамыз; содан кейін ғана теріс көбейткіш пен соңғы қосылғышты қолданамыз.',
 'negative-mixed-difference-left-to-right-final-borrow':'Жақшадағы аралас саннан ондық санды азайтамыз. Одан кейін көбейту мен бөлу солдан оңға орындалады. Соңғы бүтін сан мен теріс бөлшекті қосқанда бір бүтіннен бөлшек аламыз.',
 'positive-fraction-parenthesis-negative-unit-divisor':'Жақшаның үш мүшесін ортақ бөлімге келтіреміз. Сол оң нәтижені теріс бірлік бөлшекке бөліп, одан кейін соңғы оң бөлшекке көбейтеміз.',
};
const authoredStructure={
  "compound-mainbar-two-differences-left-to-right": "((((N+(N/N))-N)*(N+(N/N))-N/N)/((N*N-N)/N*(N+(N/N))-N*N))",
  "mixed-borrow-then-division-negative-product": "(N/((N+(N/N))-(N+(N/N)))+N)*(-N)",
  "three-affine-numerators-subtract-middle": "((N-V)/N)-((N-V)/N)=((N-NV)/N)",
  "negative-mixed-quotients-mainbar-positive": "((((N+(N/N))-(N+(N/N)))/(-(N+(N/N))))/((N-(N+(N/N)))/(-(N+(N/N)))))",
  "fractional-affine-identity-all-real": "(V/N)-(V+(N/N))=(N/N)-((NV/N)+N)",
  "negative-three-mixed-sum-over-quarter": "(((-(N+(N/N))-(N+(N/N))-(N+(N/N)))/(N/N)+N/(N/N))/((N+(N/N))*(N+(N/N))/(N+(N/N))))",
  "mixed-crosscancel-product-minus-decimal-mainbar": "(((N+(N/N))*(N+(N/N))-N)/(N+N))",
  "negative-first-positive-second-decimal-brackets": "-N*(NV-N)+N*(NV+N)=N",
  "signed-fraction-decimal-pair-parentheses": "((N/N)-(-N/N)+(-N))+((-N)-(-N))",
  "substitute-negative-into-two-rational-terms": "((V-N)/N)+(N/(V-N))",
  "mixed-product-quotient-final-mixed-borrow": "N+N*(N+(N/N))-(N+(N/N))/N",
  "negative-both-distributed-decimal-equation": "-N*(NV+N)-N=-N*(NV-N)",
  "nested-negative-fraction-pair-small-decimal-product": "N+(-N)*((-N/N)-((-N/N)+(-N/N)))",
  "substitute-negative-linear-plus-negative-fraction": "NV+(-N/(NV-N))",
  "negative-mixed-difference-left-to-right-final-borrow": "N+((N+(N/N))-N)*(N+(N/N))/(N+(N/N))",
  "subtract-second-decimal-bracket-negative-root": "N*(NV-N)-N*(NV-N)=-N",
  "positive-fraction-parenthesis-negative-unit-divisor": "((-N/N)+N-(N/N))/(-N/N)*(N/N)",
  "negative-linear-root-strict-interval": "-NV-N=N"
};
const structure=s=>s.replace(/\d+(?:,\d+)?/g,'N').replace(/[xyca]/g,'V').replace(/×/g,'*').replace(/−/g,'-').replace(/:/g,'/').replace(/\s/g,'');
export function renderEdition(row){const p=row.params,k=row.skillFamily;
 if(p.expression||p.equation||p.formula)assert.equal(structure(p.expression||p.equation||p.formula),authoredStructure[k],'Source-specific mainbar, bracket, sign, substitution and operation shapes');
 if(['three-affine-numerators-subtract-middle','negative-first-positive-second-decimal-brackets','negative-both-distributed-decimal-equation','subtract-second-decimal-bracket-negative-root'].includes(k)){keys(p,['equation']);const e=equationWork(p.equation);return choose(`${p.equation} теңдеуінің түбірін таңдаңыз.`,e.root,e.work);}
 if(k==='fractional-affine-identity-all-real'){
  keys(p,['equation']);const c=comparisons(p.equation);assert.equal(c.length,1);assert.equal(c[0][1],'=');const l=affine(c[0][0]),r=affine(c[0][2]);assert(equal(l.a,r.a)&&equal(l.b,r.b));const lt=expandedTerms(parse(c[0][0])),rt=expandedTerms(parse(c[0][2]));return pick(`${p.equation} теңдеуінің шешімдері туралы дұрыс тұжырымды таңдаңыз.`,['Тек 0','Тек 1','Шешімі жоқ','Кез келген нақты сан'],'Кез келген нақты сан',`Жақшаның алдындағы минус әр мүшеге таралады. Сол жақ ${termsText(lt,'y')}, оң жақ ${termsText(rt,'y')}. Екеуін ықшамдағанда бірдей ${linear(l,'y')} өрнегі шығады. Сондықтан айнымалы және тұрақты мүшелерді бір жаққа жинасақ, 0 = 0 теңдігі қалады; нөлге бөліп бір ғана түбір шығармаймыз. Барлық бөлімдер нөлден өзге тұрақтылар. Демек y орнына кез келген нақты сан қоюға болады. Мысалы, y = 0 болғанда екі жақ та ${d(l.b)}.`);
 }
 if(k==='outside-minus-modulus-alternating-signs'){
  keys(p,['firstHundredths','secondHundredths','thirdHundredths']);positive(...Object.values(p));const a=Q(p.firstHundredths,100),b=Q(p.secondHundredths,100),c=Q(p.thirdHundredths,100),first=sub(b,a),answer=sub(first,c);assert(answer[0]<0);return choose(`−|−${d(a)}| + |−${d(b)}| − |−${d(c)}| өрнегінің мәнін таңдаңыз.`,answer,`Әр модуль ішіндегі теріс саннан оң қашықтық береді: ${d(a)}, ${d(b)}, ${d(c)}. Бірақ модульдердің СЫРТЫНДАҒЫ минустар сақталады. Сондықтан −${d(a)} + ${d(b)} − ${d(c)} = ${d(first)} − ${d(c)} = ${d(answer)}. Бірінші және үшінші модульдің алдындағы минусты түсірмейміз.`);
 }
 if(k==='mean-absolute-assigned-negative-sum'){
  keys(p,['xTenths','yFirstTenths','ySecondTenths']);positive(...Object.values(p));const a=Q(p.xTenths,10),b=Q(p.yFirstTenths,10),c=Q(p.ySecondTenths,10),yAbs=add(b,c),answer=div(add(a,yAbs),Q(2));return choose(`x = −${d(a)}, y = −${d(b)} + (−${d(c)}) берілген. |−x| және |y| мәндерінің арифметикалық ортасын таңдаңыз.`,answer,`Алдымен y = −${d(b)} + (−${d(c)}) = −${d(yAbs)}. x теріс, сондықтан −x = ${d(a)}, |−x| = ${d(a)}; |y| = ${d(yAbs)}. Екі мәннің арифметикалық ортасы олардың қосындысының 2 санына бөліндісі: (${d(a)} + ${d(yAbs)}) : 2 = ${d(add(a,yAbs))} : 2 = ${d(answer)}. Қосындының өзін орташа мән деп алмаймыз.`);
 }
 if(k==='substitute-negative-into-two-rational-terms'||k==='substitute-negative-linear-plus-negative-fraction'){
  keys(p,['formula','argument']);assert(Number.isSafeInteger(p.argument)&&p.argument<0);const replacement=p.formula.replaceAll('x',`(${p.argument})`),tree=arithmeticTree(replacement.replace(/(\d)\(/g,'$1 × (')),answer=evalTree(tree);assert(answer[0]<0);return choose(`f(x) = ${p.formula} формуласы берілген. f(${p.argument}) мәнін таңдаңыз.`,answer,`Формуладағы ӘР x орнына жақшамен ${p.argument} қоямыз: f(${p.argument}) = ${replacement}. Айнымалысы бар бөлімді де толық алмастырамыз; теріс аргументтің таңбасын жоғалтпаймыз. Қадамдар: ${calcTrace(tree).join('; ')}. Нәтиже ${d(answer)}. Қойылған аргументте ешбір бөлім нөлге тең емес.`);
 }
 if(k==='moduli-sum-before-positive-divisor'){
  keys(p,['firstTenths','secondTenths','divisorTenths']);positive(...Object.values(p));const a=Q(p.firstTenths,10),b=Q(p.secondTenths,10),D=Q(p.divisorTenths,10),sum=add(a,b),answer=div(sum,D);return choose(`(|−${d(a)}| + |${d(b)}|) : |−${d(D)}| өрнегінің мәнін таңдаңыз.`,answer,`Модульдер: |−${d(a)}| = ${d(a)}, |${d(b)}| = ${d(b)}, |−${d(D)}| = ${d(D)}. Алдымен жақшадағы қосынды ${d(a)} + ${d(b)} = ${d(sum)}. Содан кейін ${d(sum)} : ${d(D)} = ${d(answer)}. Бөлгіштің модулі оң, ол нөл емес.`);
 }
 if(k==='negative-linear-root-strict-interval'){
  keys(p,['equation','intervals']);assert.equal(p.intervals.length,4);const e=equationWork(p.equation),hits=p.intervals.map(o=>comparisons(o).every(([l,op,r])=>{const a=at(affine(l),e.root),b=at(affine(r),e.root);assert.equal(op,'<');return a[0]*b[1]<b[0]*a[1];}));assert.equal(hits.filter(Boolean).length,1);const answer=p.intervals[hits.indexOf(true)];return pick(`${p.equation} теңдеуінің түбірін алдымен тауып, сол түбір жатқан ҚАТАҢ аралықты таңдаңыз.`,p.intervals,answer,`${e.work} Түбір ${d(e.root)} екі көрші бүтін санның АРАСЫНДА жатады: ${answer.replaceAll('x',d(e.root))}. Шекаралардың өздері аралыққа кірмейді; берілген түбір оларға тең емес.`);
 }
 if(k==='mean-two-opposites-positive-negative-inputs'){
  keys(p,['positiveXTenths','negativeYTenths']);positive(...Object.values(p));const a=Q(p.positiveXTenths,10),b=Q(p.negativeYTenths,10),answer=div(add(a,b),Q(2));return choose(`x = ${d(a)}, y = −${d(b)} болса, |−x| пен |−y| мәндерінің арифметикалық ортасын таңдаңыз.`,answer,`−x = −${d(a)}, сондықтан |−x| = ${d(a)}. y теріс болғандықтан −y = ${d(b)}, оның модулі де ${d(b)}. Арифметикалық орта (${d(a)} + ${d(b)}) : 2 = ${d(add(a,b))} : 2 = ${d(answer)}. Екі қарама-қарсы санды алу және кейін модульді есептеу — бөлек қадамдар.`);
 }
 if(k==='insert-operation-pattern-preserve-precedence'){
  keys(p,['firstHundredths','secondHundredths','third','fourth','last','target','patterns']);positive(p.firstHundredths,p.secondHundredths,p.third,p.fourth,p.last,p.target);assert(p.firstHundredths>p.secondHundredths);assert.deepEqual(p.patterns,[['−','+','−','×'],['+','−','×',':'],['−','×',':','+'],['−','+','+','×']]);const a=d(Q(p.firstHundredths,100)),b=d(Q(p.secondHundredths,100)),expression=ops=>`(((${a} ${ops[0]} ${b}) ${ops[1]} ${p.third} ${ops[2]} ${p.fourth}) ${ops[3]} ${p.last})`,results=p.patterns.map(ops=>evalTree(arithmeticTree(expression(ops)))),hit=results.map(v=>equal(v,Q(p.target)));assert.equal(hit.filter(Boolean).length,1);const options=p.patterns.map(ops=>ops.join(', '));return pick(`(((${a} □ ${b}) □ ${p.third} □ ${p.fourth}) □ ${p.last}) = ${p.target} теңдігі дұрыс болу үшін төрт □ орнына СОЛДАН ОҢҒА қай амалдар тізбегін қою керек? Қойылған жақшалар өзгермейді; жақша ішіндегі көбейту мен бөлу қосу/азайтудан бұрын орындалады.`,options,options[hit.indexOf(true)],`Әр ұсынылған тізбекті сол ретімен қойып тексереміз. ${p.patterns.map((ops,i)=>`${i+1}) ${expression(ops)} = ${d(results[i])}`).join('; ')}. Тек ${hit.indexOf(true)+1} нұсқасы ${p.target} береді. Жақшаның ішіндегі амалдар реті сақталды, қатардағы таңбаларды жай ғана солдан оңға түгел есептемейміз.`);
 }
 if(k==='negative-decimal-ratio-modulus-root-sum'){
  keys(p,['numeratorTenths','denominatorTenths','negativeDivisorTenths','shift']);positive(...Object.values(p));const A=Q(p.numeratorTenths,10),B=Q(p.denominatorTenths,10),D=Q(p.negativeDivisorTenths,10),left=div(neg(A),B),radius=mul(left,neg(D)),high=sub(radius,Q(p.shift)),low=sub(neg(radius),Q(p.shift)),answer=add(high,low);assert(high[0]>0&&low[0]<0);return choose(`(−${d(A)}/${d(B)}) = ((|x + ${p.shift}|)/(−${d(D)})) теңдеуінің БАРЛЫҚ түбірлерінің қосындысын таңдаңыз.`,answer,`Сол бөлшек ${d(neg(A))} : ${d(B)} = ${d(left)}. Екі жақты теріс, нөлден өзге −${d(D)} санына көбейтеміз: |x + ${p.shift}| = (${d(left)}) × (−${d(D)}) = ${d(radius)}. Екі тармақ: x + ${p.shift} = ${d(radius)} немесе x + ${p.shift} = −${d(radius)}. Түбірлер ${d(high)} және ${d(low)}, олардың қосындысы ${d(high)} + (${d(low)}) = ${d(answer)}. Екі түбір де модульдің ішінде ${d(radius)} не −${d(radius)} беріп, бастапқы теңдікті орындайды.`);
 }
 assert(k in calculationIntros,'Unknown individually read arithmetic5 role '+k);keys(p,['expression']);if(k in stepExpressions)assert.equal(p.expression,stepExpressions[k],'Manual proof steps bind exact printed givens');const tree=arithmeticTree(p.expression),answer=evalTree(tree);assert(answer[0]);let supplement='';
 if(k==='negative-mixed-quotients-mainbar-positive')supplement=' Бірінші айырманың ортақ бөлімі 35: (203/35) − (50/35) = (153/35). Оның теріс бөлгіші (−51/7). Кері санға көбейткенде 153 = 3 × 51 және 35 = 5 × 7: (153/35) × (−7/51) = (3/5) × (−1) = −0,6. Айқыш 51 және 7 көбейткіштері қысқарды.';
 if(k==='negative-three-mixed-sum-over-quarter')supplement=' Алғашқы үш аралас санға ортақ бөлім 30 аламыз: (−220/30) − (104/30) − (135/30) = (−459/30) = −15,3. Бөлімнің көбейтіндісі (13/4) × (105/26) = (105/8), ал оған кейінгі бөлу (105/8) : (105/2) = (1/4).';
 if(k==='signed-fraction-decimal-pair-parentheses')supplement=' Бірінші жақшаның ҮШ мүшесіне ортақ бөлім 300: (41/60) + (11/75) − 0,89 = (205/300) + (44/300) − (267/300) = (−18/300) = −0,06.';
 if(k==='positive-fraction-parenthesis-negative-unit-divisor')supplement=' Жақшаның ҮШ мүшесіне ортақ бөлім 60: (−2/5) + 0,85 − (1/6) = (−24/60) + (51/60) − (10/60) = (17/60).';
 if(k==='mixed-borrow-then-division-negative-product')supplement=' Ортақ бөлім 18: (5 + (4/18)) − (2 + (11/18)). 4 < 11 болғандықтан (5 + (4/18)) = (4 + (22/18)). Айырма (4 + (22/18)) − (2 + (11/18)) = (2 + (11/18)) = (47/18).';
 if(k==='mixed-product-quotient-final-mixed-borrow')supplement=' Көбейтінді 32, бөлінді (50/9) = (5 + (5/9)). Алғашқы қосынды 61,2 + 32 = 93,2 = (93 + (1/5)). Соңғы ортақ бөлім 45: (93 + (9/45)) − (5 + (25/45)). Бір бүтін ұсақтаймыз: (93 + (9/45)) = (92 + (54/45)). Айырма (92 + (54/45)) − (5 + (25/45)) = (87 + (29/45)).';
 if(k==='nested-negative-fraction-pair-small-decimal-product')supplement=' Ішкі қосындының ортақ бөлімі 120: (−13/15) + (−1/24) = (−104/120) + (−5/120) = (−109/120). Сыртқы айырма (−5/8) − (−109/120) = (−75/120) + (109/120) = (34/120). −6 × (34/120) = −0,05 × 34 = −1,7. Оған 0,65 қосқанда −1,05 шығады.';
 if(k==='negative-mixed-difference-left-to-right-final-borrow')supplement=' Алғашқы айырма (47/20) − (55/20) = (−2/5). Көбейтіп, бөлген соң (−4/15) шығады. Соңында 3 + (−4/15) = (2 + (15/15)) − (4/15) = (2 + (11/15)).';
 return choose(`Амалдар мен негізгі бөлшек сызықтарының орнын сақтап, ${p.expression} өрнегінің мәнін таңдаңыз.`,answer,calculationIntros[k]+supplement+' Қадамдар: '+calcTrace(tree).join('; ')+`. Толық нәтиже ${d(answer)}. Ешбір қолданылған бөлгіш нөлге тең емес.`);
}
const stepExpressions={
 'negative-mixed-quotients-mainbar-positive':'((((5 + (4/5)) − (1 + (3/7))) : (−(7 + (2/7))))/((18,55 − (2 + (11/20))) : (−(4 + (4/9)))))',
 'negative-three-mixed-sum-over-quarter':'(((−(7 + (1/3)) − (3 + (7/15)) − (4 + (1/2))) : (1/15) + 36 : (6/25))/((3 + (1/4)) × (4 + (1/26)) : (52 + (1/2))))',
 'signed-fraction-decimal-pair-parentheses':'((41/60) − (−11/75) + (−0,89)) + ((−0,68) − (−0,92))',
 'positive-fraction-parenthesis-negative-unit-divisor':'((−2/5) + 0,85 − (1/6)) : (−1/15) × (9/17)',
 'mixed-borrow-then-division-negative-product':'(9,4 : ((5 + (2/9)) − (2 + (11/18))) + 0,284) × (−4,5)',
 'mixed-product-quotient-final-mixed-borrow':'61,2 + 2,4 × (13 + (1/3)) − (5 + (2/9)) : 0,94',
 'nested-negative-fraction-pair-small-decimal-product':'0,65 + (−6) × ((−5/8) − ((−13/15) + (−1/24)))',
 'negative-mixed-difference-left-to-right-final-borrow':'3 + ((2 + (7/20)) − 2,75) × (1 + (4/9)) : (2 + (1/6))',
};
export function verifyEdition(row){assert.equal(row.minimumPlan,'pro');assert.equal(row.grade,6);const result=renderEdition(row);for(const k of['statement','options','answer','solution'])assert.deepEqual(row[k],result[k]);assert(!/[\\$]|NaN|undefined/.test(row.statement+row.solution));return{answer:result.answer,checks:['All24 canonical saved nonvisual part5 conditions/full official solutions/every MCQ read; two sourceSVG occurrences excluded.','New individual arithmetic, affine, substitution and requested-target data; compound mainbar scope, whole negative mixed values, exact LCD/cross-cancel and explicit mixed borrowing preserved.','Universal identity distinguished from one-root/no-root, negative-argument function substitution includes every variable denominator, strict interval requested instead of numeric root, four operation-pattern candidates retain normal precedence.','Modulus outside signs, mean versus sum, two distinct assigned-sign scenarios and full modulus-root SUM are separate requested roles; shared mechanisms and necessary invariant facts are not semantic uniqueness. Closed draft awaits full independent review/hash.']};}
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
function equationWork(s){const variable=/\bc\b/.test(s)||/\dc\b/.test(s)?'c':/\by\b/.test(s)||/\dy\b/.test(s)?'y':'x',e=solveEquation(s),lt=expandedTerms(parse(e.c[0])),rt=expandedTerms(parse(e.c[2])),common=[...lt,...rt].reduce((n,t)=>n/gcd(n,t.value[1])*t.value[1],1);assert(common>0);const scale=Q(common),L={a:mul(e.l.a,scale),b:mul(e.l.b,scale)},R={a:mul(e.r.a,scale),b:mul(e.r.b,scale)},A=mul(e.a,scale),B=mul(e.b,scale),v=at(e.l,e.root);assert(equal(v,at(e.r,e.root)));return{...e,work:`${s.includes('(')?'Жақшаларды таратып, барлық мүшелерді сақтаймыз':'Екі жақтағы мүшелерді жазамыз'}: ${termsText(lt,variable)} = ${termsText(rt,variable)}. ${common>1?`Екі жақтың ӘР МҮШЕСІН оң ортақ бөлім ${common} санына көбейтеміз: ${termsText(lt,variable,scale)} = ${termsText(rt,variable,scale)}. `:''}Ұқсас мүшелерді жинасақ, ${linear(L,variable)} = ${linear(R,variable)}. Айнымалы мүшелерді бір жаққа, тұрақтыларды екінші жаққа жинаймыз: ${linear({a:A,b:Q(0)},variable)} = ${d(neg(B))}. ${equal(A,Q(1))?`Осыдан ${variable} = ${d(e.root)}.`:`${d(A)} санына бөліп, ${variable} = ${d(e.root)} аламыз.`} Бастапқы теңдеуге қойғандағы екі жақ та ${d(v)}.`};}
