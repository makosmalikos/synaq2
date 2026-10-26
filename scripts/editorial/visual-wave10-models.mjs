// Source-addressed algebra visuals: exact rational parsing of actual printed math.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const prefix='visual-wave10-',kind=q=>{assert.ok(q.modelId.startsWith(prefix));return q.modelId.slice(prefix.length);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
const R=(n,d=1)=>{assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d!==0);if(n===0)return {n:0,d:1};const g=gcd(n,d),sgn=d<0?-1:1;return {n:sgn*n/g,d:sgn*d/g};};
const add=(a,b)=>R(a.n*b.d+b.n*a.d,a.d*b.d),mul=(a,b)=>R(a.n*b.n,a.d*b.d),neg=a=>R(-a.n,a.d),sub=(a,b)=>add(a,neg(b)),div=(a,b)=>mul(a,R(b.d,b.n));
const eq=(a,b)=>a.n===b.n&&a.d===b.d,zero=()=>R(0),one=()=>R(1),rs=a=>a.d===1?String(a.n):a.n+'/'+a.d;
export function parseAffine(input,variable='x'){
 const src=String(input).replace(/[×·]/g,'*').replace(/[−–]/g,'-').replace(/,/g,'.').replace(/\s/g,''),tokens=[];let pos=0;
 const re=/\d+(?:\.\d+)?|[a-z]|[+\-*/()]/y;
 while(pos<src.length){re.lastIndex=pos;const m=re.exec(src);assert.ok(m,'Supported exact expression token');tokens.push(m[0]);pos=re.lastIndex;}let i=0;
 const decimal=t=>{if(!t.includes('.'))return R(Number(t));const [a,b]=t.split('.');return R(Number(a+b),10**b.length);};
 const plus=(a,b)=>[add(a[0],b[0]),add(a[1],b[1])],minus=(a,b)=>plus(a,b.map(neg));
 function primary(){const t=tokens[i++];assert.ok(t,'Complete expression');if(t==='('){const p=expression();assert.equal(tokens[i++],')');return p;}if(/^\d/.test(t))return [zero(),decimal(t)];assert.equal(t,variable,'Expected authored variable');return [one(),zero()];}
 function unary(){if(tokens[i]==='-'){i++;return unary().map(neg);}if(tokens[i]==='+'){i++;return unary();}return primary();}
 function product(){let a=unary();while(i<tokens.length){const t=tokens[i],implicit=t==='('||/^[a-z0-9]/.test(t);if(!implicit&&t!=='*'&&t!=='/')break;if(!implicit)i++;const b=unary();if(t==='/'&&!implicit){assert.equal(b[0].n,0,'No variable denominator in affine polynomial');a=a.map(v=>div(v,b[1]));}else{assert.ok(a[0].n===0||b[0].n===0,'No quadratic product');a=[add(mul(a[0],b[1]),mul(a[1],b[0])),mul(a[1],b[1])];}}return a;}
 function expression(){let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();a=op==='+'?plus(a,b):minus(a,b);}return a;}
 const result=expression();assert.equal(i,tokens.length,'Full exact expression consumed');return result;
}
const valueAt=(expr,variable,n)=>{const [a,b]=parseAffine(expr,variable);return add(mul(a,R(n)),b);};
const constantValue=expr=>{const p=parseAffine(expr);assert.equal(p[0].n,0);return p[1];};
export function linearRoot(text){
 const parts=text.split('=');assert.equal(parts.length,2);const l=parseAffine(parts[0]),r=parseAffine(parts[1]),a=sub(l[0],r[0]),b=sub(r[1],l[1]);assert.notEqual(a.n,0,'Unique linear root');return div(b,a);
}
export function absoluteRoots(text){
 const m=text.match(/^\|(.+)\|\s*=\s*(\d+)$/);assert.ok(m,'Explicit nonnegative absolute equation');const [a,b]=parseAffine(m[1]);assert.notEqual(a.n,0);const d=R(Number(m[2]));return [div(sub(d,b),a),div(sub(neg(d),b),a)].filter((v,i,all)=>!all.slice(0,i).some(w=>eq(v,w))).sort((x,y)=>x.n/x.d-y.n/y.d);
}
const splitExpression=(p,form)=>{
 const v=p.variable,h=p.height,c=p.constant;
 switch(form){case 'factored':return h+'('+v+' + '+c+')';case 'expanded':return h+v+' + '+h*c;case 'reversed':return '('+v+' + '+c+') × '+h;case 'missing-factor':return h+v+' + '+c;default:throw Error('Known area form');}
};
export function independentlyCalculate(q){
 const p=q.params,k=kind(q);let answer,checks;
 switch(k){
 case 'variable-right-area':answer=rs(div(mul(R(p.fixed),R(p.value)),R(2)));checks={twiceArea:p.fixed*p.value};break;
 case 'machine-order':{let x=R(p.input);for(const op of p.operations)x=op.op==='multiply'?mul(x,R(op.value)):sub(x,R(op.value));answer=rs(x);checks={operationOrder:p.operations.map(r=>r.op)};break;}
 case 'variable-rectangle-perimeter':answer=String(p.value+p.fixed+p.value+p.fixed);checks={fourSides:[p.value,p.fixed,p.value,p.fixed]};break;
 case 'negative-coefficient-count':{const coefficients=p.cards.map(s=>constantValue(s.replace(/[a-z]/g,'(1)')));answer=String(coefficients.filter(r=>r.n<0).length);checks={coefficients:coefficients.map(rs)};break;}
 case 'distributive-equality':{const good=q.options.filter(text=>{const [l,r]=text.split('=');assert.ok(l&&r);const a=parseAffine(l,p.variable),b=parseAffine(r,p.variable);return a.every((v,i)=>eq(v,b[i]));});assert.equal(good.length,1);const target=parseAffine(good[0].split('=')[0],p.variable);assert.ok(target.every((r,i)=>eq(r,R(i?p.height*p.constant:p.height))));answer=good[0];checks={identityCoefficients:target.map(rs)};break;}
 case 'tile-like-coefficient':answer=String(p.groups.reduce((s,r)=>s+r.strips,0));checks={constant:p.groups.reduce((s,r)=>s+r.squares,0)};break;
 case 'like-strip-value':{const coefficient=p.coefficients.reduce((s,n)=>s+n,0);answer=String(coefficient*p.value);checks={coefficient};break;}
 case 'like-triangle-perimeter':{const [a,b,c]=p.sides;assert.ok(a+b>c&&a+c>b&&b+c>a,'True triangle inequalities');answer=String((a+b+c)*p.value);checks={coefficient:a+b+c};break;}
 case 'identity-constant':answer=String(p.height*p.constant);checks={polynomial:parseAffine(splitExpression(p,'factored'),p.variable).map(rs)};break;
 case 'not-area-identity':{const target=parseAffine(splitExpression(p,'factored'),p.variable),bad=q.options.filter(text=>!parseAffine(text,p.variable).every((v,i)=>eq(v,target[i])));assert.equal(bad.length,1);answer=bad[0];checks={targetCoefficients:target.map(rs)};break;}
 case 'square-tiling-ratio':{assert.ok(p.largeSquares>=2&&p.smallSquares>=2&&p.smallSide>0);const height=p.smallSquares*p.smallSide,width=p.largeSquares*height+p.smallSide,target=R(width,height),matches=q.options.filter(s=>eq(constantValue(s),target));assert.equal(matches.length,1);answer=matches[0];checks={width,height,ratio:rs(target)};break;}
 case 'equality-product':
 case 'equality-sum':{const values=p.equalities.map(([a,b])=>{const va=constantValue(a),vb=constantValue(b);assert.ok(eq(va,vb),'Every actually printed premise is a true equality');return va;});assert.equal(values.length,2);answer=rs(k==='equality-product'?mul(...values):add(...values));checks={premises:values.map(rs)};break;}
 case 'balanced-missing-mass':answer=String(p.leftCount*p.leftMass-p.rightKnown);assert.ok(Number(answer)>0);checks={leftTotal:p.leftCount*p.leftMass};break;
 case 'balance-transitivity':{const first=p.productCount*p.productMass,bridge=p.bridge.reduce((s,n)=>s+n,0);assert.equal(first,bridge,'First actual balance is true');answer=String(bridge-p.secondKnown);assert.ok(Number(answer)>0);checks={commonTotal:bridge};break;}
 case 'point-equation-root':{const good=q.options.filter(t=>eq(linearRoot(t),R(p.target)));assert.equal(good.length,1);answer=good[0];checks={candidateRoots:q.options.map(t=>rs(linearRoot(t)))};break;}
 case 'partition-equation':{const remaining=p.total-p.constant;assert.ok(remaining>0&&remaining%p.count===0);answer=String(remaining/p.count);checks={repeatedParts:p.count,remaining};break;}
 case 'two-sided-balance':{assert.ok(p.leftCount>p.rightCount);const n=p.rightKnown-p.leftKnown,d=p.leftCount-p.rightCount,sol=R(n,d);assert.ok(sol.n>0);answer=rs(sol);checks={leftTotal:rs(add(mul(R(p.leftCount),sol),R(p.leftKnown))),rightTotal:rs(add(mul(R(p.rightCount),sol),R(p.rightKnown)))};assert.equal(checks.leftTotal,checks.rightTotal);break;}
 case 'shifted-absolute-right':answer=String(p.center+p.distance);checks={leftRoot:p.center-p.distance,rightRoot:p.center+p.distance};break;
 case 'absolute-pair-equation':{const target=[...p.targets].sort((a,b)=>a-b).map(n=>R(n)),matches=q.options.filter(t=>{const roots=t.startsWith('|')?absoluteRoots(t):[linearRoot(t)];return roots.length===target.length&&roots.every((v,i)=>eq(v,target[i]));});assert.equal(matches.length,1);answer=matches[0];checks={targetRoots:target.map(rs)};break;}
 default:throw Error('Unknown algebra visual '+k);
 }
 return {answer,checks};
}
function core(q){
 const p=q.params;
 switch(kind(q)){
 case 'variable-right-area':return 'Тікбұрышты үшбұрыштың бір катеті '+p.fixed+' см, екіншісі m см. m = '+p.value+' болғанда оның ауданы неше шаршы сантиметр?';
 case 'machine-order':return 'Сан машинасына x = '+p.input+' саны берілді. Сызбадағы амалдарды солдан оңға қарай орындағанда соңғы ұяшыққа қандай сан жазылады?';
 case 'variable-rectangle-perimeter':return 'Суреттегі тіктөртбұрыштың өлшемдері сантиметрмен берілген. x = '+p.value+' болса, оның толық периметрі неше сантиметр?';
 case 'negative-coefficient-count':return 'Алты карточкадағы өрнектерді көбейткіштері бойынша ықшамдаңыз. Неше өрнектің сандық коэффициенті теріс болады?';
 case 'distributive-equality':return 'Бір тіктөртбұрыш екі бөлікке бөлінген. Толық аудан мен екі бөліктің аудандарының қосындысын салыстырғанда қай теңдік барлық x үшін орындалады?';
 case 'tile-like-coefficient':return 'Екі жиынтықтағы әр ұзын тақтайшаның ауданы x, ал әр шаршының ауданы 1. Барлық тақтайшалардың жалпы ауданын ықшамдағанда x алдындағы коэффициент қандай болады?';
 case 'like-strip-value':return 'Жолақтың үш бөлігінің ұзындығы метрмен көрсетілген. t = '+p.value+' болса, бүкіл жолақтың ұзындығы неше метр?';
 case 'like-triangle-perimeter':return 'Үшбұрыш қабырғаларының ұзындықтары суретте сантиметрмен белгіленген. a = '+p.value+' болғанда оның периметрі неше сантиметр?';
 case 'identity-constant':return 'Тіктөртбұрыштың ауданын бөліктердің аудандары арқылы жазыңыз да, ықшамдаңыз. Алынған өрнектің әріпсіз қосылғышы неге тең?';
 case 'not-area-identity':return 'Суреттегі тіктөртбұрыштың ауданына теңбе-тең ЕМЕС өрнекті таңдаңыз.';
 case 'square-tiling-ratio':return 'Тіктөртбұрыш ең үлкен квадраттарға, ал қалған жолағы ең кіші квадраттарға бөлінген. Кішкене квадрат қабырғасы '+p.smallSide+' бірлік. Көлденең ұзындықтың тік енге қатынасын білдіретін өрнекті таңдаңыз.';
 case 'equality-product':return 'Екі тура теңдікті сол және оң жақтары бойынша мүшелеп көбейтті. Соңғы жолдағы сұрақ белгісінің орнына қандай сан жазылады?';
 case 'equality-sum':return 'Екі тура теңдікті мүшелеп қосты. Таңбаларды сақтап есептеңіз: соңғы жолдағы сұрақ белгісінің орнына қай сан келеді?';
 case 'balanced-missing-mass':return 'Таразы тепе-теңдікте. Барлық жүктердегі сандар килограмды білдіреді. Сұрақ белгісі бар жүктің массасы неше килограмм?';
 case 'balance-transitivity':return 'Екі таразы да тепе-теңдікте. Сандар килограммен берілген. Екінші таразыдағы сұрақ белгісі бар жүктің массасын табыңыз.';
 case 'point-equation-root':return 'Сандық түзуде A нүктесі белгіленген. Оның координатасы қай теңдеудің түбірі болады?';
 case 'partition-equation':return 'Жолақтың '+p.count+' бірдей бөлігінің әрқайсысының ұзындығы x см. Соңғы бөліктің және бүкіл жолақтың ұзындығы сызбада берілген. x неге тең?';
 case 'two-sided-balance':return 'Таразы теңесіп тұр. x деп белгіленген барлық жүктердің массалары бірдей, сандары бар жүктер килограммен берілген. Бір x жүгінің массасы неше килограмм?';
 case 'shifted-absolute-right':return 'Қара нүкте a санын көрсетеді. A мен B — |x − a| = d теңдеуінің түбірлері; олардың a нүктесіне дейінгі бірдей қашықтықтары нұсқарлармен берілген. Оң жақтағы B нүктесінің координатасын табыңыз.';
 case 'absolute-pair-equation':return 'Түзудегі екі көк нүктенің координаталары қай теңдеудің барлық түбірлерін береді? Бір ғана түбірі бар теңдеумен шатастырмаңыз.';
 default:throw Error('Unknown condition');
 }
}
export const statementFor=q=>core(q)+(q.options?'':' Жауапқа тек санды жазыңыз.');
export function solutionFor(q){
 const p=q.params,k=kind(q),r=independentlyCalculate(q);let s;
 switch(k){
 case 'variable-right-area':s='Катеттер '+p.fixed+' және '+p.value+' см. Тікбұрышты үшбұрыш ауданы осы катеттерден құралған тіктөртбұрыш ауданының жартысына тең: '+p.fixed+' × '+p.value+' : 2 = '+r.answer+' см². Екіге бөлуді ұмытпау керек.';break;
 case 'machine-order':{const first=p.input*p.operations[0].value;s='Алдымен '+p.input+' × '+p.operations[0].value+' = '+first+'. Содан кейін '+first+' − '+p.operations[1].value+' = '+r.answer+'. Амалдардың орнын ауыстыруға болмайды.';break;}
 case 'variable-rectangle-perimeter':s='Екі ұзын қабырға '+p.value+' см-ден, екі қысқа қабырға '+p.fixed+' см-ден: '+p.value+' + '+p.fixed+' + '+p.value+' + '+p.fixed+' = '+r.answer+' см.';break;
 case 'negative-coefficient-count':s='Карточкалардағы коэффициенттер ретімен: '+r.checks.coefficients.join('; ')+'. Теріс коэффициенттер саны '+r.answer+'. Екі теріс көбейткіш оң коэффициент береді; жалғыз минус −1 көбейткішін білдіреді.';break;
 case 'distributive-equality':s='Тұтас аудан '+p.height+'(x + '+p.constant+'). Екі бөлік '+p.height+'x және '+p.height*p.constant+' аудан береді. Сондықтан '+r.answer+'. '+p.height+' саны жақшадағы екі қосылғышқа да көбейтіледі.';break;
 case 'tile-like-coefficient':s='Бірінші топ '+p.groups[0].strips+'x + '+p.groups[0].squares+', екінші топ '+p.groups[1].strips+'x + '+p.groups[1].squares+'. Жолақтар саны '+p.groups[0].strips+' + '+p.groups[1].strips+' = '+r.answer+', ал шаршылар саны '+r.checks.constant+'. Жалпы аудан '+r.answer+'x + '+r.checks.constant+'; x коэффициенті '+r.answer+'.';break;
 case 'like-strip-value':s=p.coefficients.map(n=>n===1?'t':n+'t').join(' + ')+' = '+r.checks.coefficient+'t. t = '+p.value+' болғанда '+r.checks.coefficient+' × '+p.value+' = '+r.answer+' м.';break;
 case 'like-triangle-perimeter':s='Периметр '+p.sides.map(n=>n+'a').join(' + ')+' = '+r.checks.coefficient+'a. a = '+p.value+' болса, '+r.checks.coefficient+' × '+p.value+' = '+r.answer+' см.';break;
 case 'identity-constant':s='Бөліктердің аудандары '+p.height+p.variable+' және '+p.height+' × '+p.constant+' = '+r.answer+'. Сондықтан '+splitExpression(p,'factored')+' = '+splitExpression(p,'expanded')+'. Әріпсіз қосылғыш '+r.answer+'.';break;
 case 'not-area-identity':s='Тұтас аудан '+splitExpression(p,'factored')+' = '+splitExpression(p,'expanded')+'. '+r.answer+' өрнегі тұрақты бөліктің ауданын '+p.height*p.constant+' орнына '+p.constant+' деп алады. Сондықтан ол ауданға теңбе-тең емес.';break;
 case 'square-tiling-ratio':s='Тік ен '+p.smallSquares+' × '+p.smallSide+' = '+r.checks.height+'. Әр үлкен квадраттың қабырғасы осыған тең. Көлденең ұзындық '+p.largeSquares+' × '+r.checks.height+' + '+p.smallSide+' = '+r.checks.width+'. Қатынас '+r.checks.width+'/'+r.checks.height+' = '+p.largeSquares+' + 1/'+p.smallSquares+'. Кері қатынаспен шатастырмаймыз.';break;
 case 'equality-product':s='Оң жақтарды көбейтеміз: '+r.checks.premises[0]+' × '+r.checks.premises[1]+' = '+r.answer+'. Сол жақтағы әр қосынды мен айырма жақшада сақталады, сондықтан теңдік бұзылмайды.';break;
 case 'equality-sum':s='Оң жақтарды таңбасымен қосамыз: ('+r.checks.premises[0]+') + '+r.checks.premises[1]+' = '+r.answer+'. Теріс таңбаны жоғалтсақ, басқа сан шығады.';break;
 case 'balanced-missing-mass':s='Сол табақтағы '+p.leftCount+' жүктің әрқайсысы '+p.leftMass+' кг: барлығы '+r.checks.leftTotal+' кг. Оң жақта '+p.rightKnown+' + ? = '+r.checks.leftTotal+'. Белгісіз масса '+r.checks.leftTotal+' − '+p.rightKnown+' = '+r.answer+' кг.';break;
 case 'balance-transitivity':s='Бірінші таразы: '+p.productCount+' × '+p.productMass+' = '+p.bridge.join(' + ')+' = '+r.checks.commonTotal+'. Екінші таразының сол жағы да '+r.checks.commonTotal+' кг. Сондықтан ? + '+p.secondKnown+' = '+r.checks.commonTotal+', яғни ? = '+r.checks.commonTotal+' − '+p.secondKnown+' = '+r.answer+' кг.';break;
 case 'point-equation-root':s='A координатасы '+p.target+'. Нұсқалардағы теңдеулердің түбірлері ретімен '+r.checks.candidateRoots.join('; ')+'. Координатаға сәйкес келетін жалғыз теңдеу: '+r.answer+'.';break;
 case 'partition-equation':s='Бөліктердің қосындысы бойынша '+p.count+'x + '+p.constant+' = '+p.total+'. Белгілі бөлікті алып тастаймыз: '+p.count+'x = '+r.checks.remaining+'. Бірдей '+p.count+' бөлікке бөлсек, x = '+r.checks.remaining+' : '+p.count+' = '+r.answer+' см.';break;
 case 'two-sided-balance':s='Таразы теңдігі '+p.leftCount+'x + '+p.leftKnown+' = '+p.rightCount+'x + '+p.rightKnown+'. Екі жақтан '+p.rightCount+'x пен '+p.leftKnown+'-ті аламыз: '+(p.leftCount-p.rightCount)+'x = '+(p.rightKnown-p.leftKnown)+'. Сондықтан x = '+r.answer+' кг. Тексеру: екі табақта да '+r.checks.leftTotal+' кг.';break;
 case 'shifted-absolute-right':s='Қара нүкте a = '+p.center+', қашықтық d = '+p.distance+'. B оң жақта болғандықтан, оның координатасы '+p.center+' + '+p.distance+' = '+r.answer+'. Сол жақтағы A координатасы '+r.checks.leftRoot+'; ол сұралған B емес.';break;
 case 'absolute-pair-equation':s='Көк нүктелердің координаталары '+p.targets.join(' және ')+'. Екеуі де 0-ден '+Math.abs(p.targets[0])+' бірлік қашықтықта. Сондықтан '+r.answer+' теңдеуінің дәл осы екі түбірі бар. Нүктелердің өзара арақашықтығы бұл модульдің мәні емес.';break;
 default:throw Error('Unknown solution');
 }
 return s;
}
export function descriptionFor(q){
 const p=q.params,k=kind(q);
 switch(p.scene){
 case 'right-triangle':return 'Тікбұрышты үшбұрыш. Көлденең катеті m, тік катеті '+p.fixed+' см. Суреттегі қатынас m = '+p.value+' үшін сақталған.';
 case 'machine':return 'Солдан оңға: x кірісі; ×'+p.operations[0].value+'; аралық бос ұяшық; −'+p.operations[1].value+'; сұрақ белгісі бар шығыс.';
 case 'rectangle':return 'Тіктөртбұрыштың көлденең қабырғасы x см, тік қабырғасы '+p.fixed+' см.';
 case 'cards':return 'Карточкалар ретімен: '+p.cards.map((s,i)=>(i+1)+': '+s).join('; ')+'.';
 case 'split':return 'Тіктөртбұрыштың биіктігі '+p.height+'. Көлденең ұзындығы '+p.variable+' және '+p.constant+' бөліктерінен тұрады. Бөліктердің ортақ шекарасы тік.';
 case 'tiles':return 'Екі жиынтық: '+p.groups.map((r,i)=>(i+1)+': '+r.strips+' ұзын x тақтайшасы және '+r.squares+' бірлік шаршы').join('; ')+'.';
 case 'strip':return 'Үш іргелес бөлік ретімен '+p.coefficients.map(n=>n===1?'t':n+'t').join(', ')+' метр.';
 case 'triangle':return 'Үшбұрыштың сол, оң және төменгі қабырғалары ретімен '+p.sides.map(n=>n+'a').join(', ')+' см.';
 case 'tiling':return 'Қатар тұрған '+p.largeSquares+' үлкен квадрат. Оң жақ жіңішке жолақта '+p.smallSquares+' бірдей кіші квадрат бірінің үстіне бірі орналасқан. Кішісінің көлденең қабырғасы '+p.smallSide+'.';
 case 'equalities':return 'Берілген тура теңдіктер '+p.equalities.map(r=>r.join(' = ')).join('; ')+'. Төменде сол жақтары '+(k==='equality-product'?'жақшалармен көбейтілген':'қосылған')+', оң жақта сұрақ белгісі тұр.';
 case 'balance':if(k==='balanced-missing-mass')return 'Тең таразы. Сол жақта '+p.leftCount+' жүк, әрқайсысында '+p.leftMass+'; оң жақта '+p.rightKnown+' және ?.';if(k==='two-sided-balance')return 'Тең таразы. Сол жақта '+p.leftCount+' x жүгі мен '+p.leftKnown+'; оң жақта '+p.rightCount+' x жүгі мен '+p.rightKnown+'.';return 'Екі тең таразы. Біріншінің сол жағында '+p.productCount+' бірдей '+p.productMass+' жүгі, оң жағында '+p.bridge.join(' және ')+'. Екіншінің сол жағында '+p.bridge.join(' және ')+', оң жағында ? және '+p.secondKnown+'.';
 case 'partition':return 'Көлденең жолақта '+p.count+' бірдей x бөлігі, одан кейін '+p.constant+' см бөлік. Толық ұзындығы '+p.total+' см.';
 case 'axis':if(k==='shifted-absolute-right')return 'Бірлік сандық түзу. Қара нүкте '+p.center+' санында. A осы нүктеден солға, B оңға '+p.distance+' бірлік қашықтықта. A мен B координаталары жазылмаған.';return 'Бірлік сандық түзу. '+(k==='point-equation-root'?'A нүктесі '+p.target+' санында.':'Көк нүктелер '+p.targets.join(' және ')+' сандарында.');
 default:throw Error('Known scene description');
 }
}
export function svgFor(q){
 const p=q.params,k=kind(q),blue='#315ce8',purple='#8459ce',ink='#203549',soft='#dbe5f1';let body='';
 const line=(x1,y1,x2,y2,color=ink,width=2,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,t,size=25,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(t)+'</text>';
 const centered=(x,y,t,size=25,color=ink)=>text(x,y,t,size,color,'text-anchor="middle"');
 const rect=(x,y,w,h,fill='#eaf0ff',extra='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="'+blue+'" stroke-width="2" '+extra+'/>';
 const bracket=(x1,x2,y,t)=>line(x1,y,x2,y,ink,1.5)+line(x1,y-5,x1,y+5,ink,1.5)+line(x2,y-5,x2,y+5,ink,1.5)+centered((x1+x2)/2,y-10,t,23);
 function balance(left,right,yTop,height,number){
  const beam=yTop+20,base=yTop+height-30,box=30,gap=4;
  let s='<g data-balance="'+number+'">'+line(110,beam,370,beam,ink,3)+'<path d="M 240 '+(beam-8)+' L 213 '+(yTop+height-10)+' L 267 '+(yTop+height-10)+' Z" fill="#e5e9fa" stroke="'+purple+'" stroke-width="2"/>';
  for(const [index,items]of [left,right].entries()){
   const cx=index?370:110,half=height>200?74:69;
   s+=line(cx,beam,cx-half,base,ink,1.5)+line(cx,beam,cx+half,base,ink,1.5)+line(cx-half,base,cx+half,base,ink,3);
   for(let i=0;i<items.length;i++){
    const row=Math.floor(i/3),count=Math.min(3,items.length-row*3),col=i%3,x=cx-(count*box+(count-1)*gap)/2+col*(box+gap),y=base-(row+1)*box;
    s+=rect(x,y,box,box,items[i]==='x'?'#fff1c2':'#eaf0ff','rx="3" data-weight="'+esc(items[i])+'" data-pan="'+index+'"')+centered(x+box/2,y+box*0.72,items[i],height>200?box*0.64:20);
   }
  }
  if(number)s+=centered(240,yTop+height+12,number,18,purple);
  return s+'</g>';
 }
 if(p.scene==='right-triangle'){
  const scale=Math.min(300/p.value,230/p.fixed),x=90,y=285,w=p.value*scale,h=p.fixed*scale;
  body+='<polygon data-legs="'+p.value+','+p.fixed+'" points="'+x+','+y+' '+(x+w)+','+y+' '+x+','+(y-h)+'" fill="#eaf0ff" stroke="'+blue+'" stroke-width="3"/><path d="M '+x+' '+(y-18)+' L '+(x+18)+' '+(y-18)+' L '+(x+18)+' '+y+'" stroke="'+ink+'" fill="none"/>'+centered(x+w/2,y+35,'m')+centered(x-25,y-h/2+8,p.fixed);
 }else if(p.scene==='machine'){
  const xs=[25,205,385];for(const [i,x]of xs.entries())body+=rect(x,160,70,58,i===1?'#fff':'#eaf0ff','rx="10"')+centered(x+35,198,i===0?'x':i===1?'':'?',30);
  for(let i=0;i<2;i++){const a=xs[i]+76,b=xs[i+1]-10;body+=line(a,189,b,189,blue,2.5)+'<path d="M '+b+' 189 L '+(b-9)+' 184 L '+(b-9)+' 194 Z" fill="'+blue+'"/>'+centered((a+b)/2,155,(p.operations[i].op==='multiply'?'×':'−')+p.operations[i].value,27,purple);}
 }else if(p.scene==='rectangle'){
  const scale=336/p.value,w=336,h=p.fixed*scale,x=72,y=180-h/2;
  body+=rect(x,y,w,h)+centered(x+w/2,y+h+35,'x')+centered(x+w+25,y+h/2+8,p.fixed);
 }else if(p.scene==='cards'){
  p.cards.forEach((s,i)=>{const x=30+(i%2)*225,y=45+Math.floor(i/2)*103;body+=rect(x,y,205,70,i%2?'#f1edff':'#eaf0ff','rx="12" data-card="'+(i+1)+'"')+text(x+12,y+22,i+1,16,purple)+centered(x+104,y+49,s,26);});
 }else if(p.scene==='split'){
  const scale=Math.min(330/(3*p.constant),180/p.height),constantWidth=p.constant*scale,variableWidth=2*constantWidth,h=p.height*scale,x=(480-variableWidth-constantWidth)/2,y=185-h/2;
  body+=rect(x,y,variableWidth,h,'#eaf0ff','data-side="variable"')+rect(x+variableWidth,y,constantWidth,h,'#fff1c2','data-side="constant"')+bracket(x,x+variableWidth,y-20,p.variable)+bracket(x+variableWidth,x+variableWidth+constantWidth,y-20,p.constant)+centered(x-25,y+h/2+8,p.height);
 }else if(p.scene==='tiles'){
  for(const [i,g]of p.groups.entries()){
   const x=22+i*238,y=85;body+=rect(x,y,210,220,'#fafbff','rx="12"');
   for(let n=0;n<g.strips;n++)body+=rect(x+12+n*43,y+20,27,113,'#dce8ff','data-tile="x"')+centered(x+25+n*43,y+86,'x',24);
   for(let n=0;n<g.squares;n++){const sx=x+12+(n%5)*35,sy=y+154+Math.floor(n/5)*29;body+=rect(sx,sy,26,26,'#fff1c2','data-tile="1"')+centered(sx+13,sy+19,1,18);}
  }
 }else if(p.scene==='strip'||p.scene==='partition'){
  const values=p.scene==='strip'?p.coefficients.map(n=>n*p.value):Array(p.count).fill((p.total-p.constant)/p.count).concat(p.constant),sum=values.reduce((s,n)=>s+n,0),x=45,y=160;let at=x;
  values.forEach((v,i)=>{const w=390*v/sum,label=p.scene==='strip'?(p.coefficients[i]===1?'t':p.coefficients[i]+'t'):(i===values.length-1?String(p.constant):'x');body+=rect(at,y,w,65,i%2?'#fff1c2':'#eaf0ff','data-part="'+i+'" data-relative-length="'+v+'"')+centered(at+w/2,y+42,label,27);at+=w;});
  if(p.scene==='partition')body+=bracket(x,x+390,135,p.total+' см');
 }else if(p.scene==='triangle'){
  const [a,b,c]=p.sides,cx=(a*a+c*c-b*b)/(2*c),cy=Math.sqrt(a*a-cx*cx),scale=330/c,A=[75,280],B=[405,280],C=[75+cx*scale,280-cy*scale];
  body+='<polygon data-sides="'+p.sides.join(',')+'" points="'+[A,B,C].map(v=>v.join(',')).join(' ')+'" fill="#eef0ff" stroke="'+blue+'" stroke-width="3"/>'+centered((A[0]+C[0])/2-18,(A[1]+C[1])/2-5,a+'a')+centered((B[0]+C[0])/2+20,(B[1]+C[1])/2-7,b+'a')+centered(240,315,c+'a');
 }else if(p.scene==='tiling'){
  const unit=390/(p.largeSquares*p.smallSquares+1),big=unit*p.smallSquares,x=45,y=120;
  for(let i=0;i<p.largeSquares;i++)body+=rect(x+i*big,y,big,big,'#eaf0ff','data-square="large"');
  for(let i=0;i<p.smallSquares;i++)body+=rect(x+p.largeSquares*big,y+i*unit,unit,unit,'#fff1c2','data-square="small"');
  body+=bracket(x+p.largeSquares*big,x+p.largeSquares*big+unit,y+big+28,p.smallSide);
 }else if(p.scene==='equalities'){
  for(const [i,r]of p.equalities.entries())body+=centered(255,113+i*58,r.join(' = '),27);
  body+=text(43,160,k==='equality-product'?'×':'+',36,purple)+line(65,196,435,196,ink,2);
  const parts=p.equalities.map(r=>r[0]),out=k==='equality-product'?'('+parts[0]+') × ('+parts[1]+') = ?':'('+parts[0]+') + ('+parts[1]+') = ?';
  body+=centered(240,247,out,24);
 }else if(p.scene==='balance'){
  if(k==='balanced-missing-mass')body+=balance(Array(p.leftCount).fill(String(p.leftMass)),[String(p.rightKnown),'?'],25,285,'');
  else if(k==='two-sided-balance')body+=balance(Array(p.leftCount).fill('x').concat(String(p.leftKnown)),Array(p.rightCount).fill('x').concat(String(p.rightKnown)),25,285,'');
  else{body+=balance(Array(p.productCount).fill(String(p.productMass)),p.bridge.map(String),0,165,'1');body+=balance(p.bridge.map(String),['?',String(p.secondKnown)],175,165,'2');}
 }else if(p.scene==='axis'){
  const x=v=>36+(v-p.min)*408/(p.max-p.min),y=200;body+=line(30,y,452,y,ink,2.2)+'<path d="M 452 200 L 443 195 L 443 205 Z" fill="'+ink+'"/>';
  for(let v=p.min;v<=p.max;v++){body+=line(x(v),y-6,x(v),y+6,ink,1.4);if(k!=='shifted-absolute-right'||v===0||v===p.center)body+=centered(x(v),y+28,v,18);}
  if(k==='point-equation-root')body+='<circle data-target="'+p.target+'" cx="'+x(p.target)+'" cy="'+y+'" r="6" fill="'+blue+'"/>'+centered(x(p.target),y-21,'A',24,blue);
  else if(k==='absolute-pair-equation')for(const v of p.targets)body+='<circle data-root="'+v+'" cx="'+x(v)+'" cy="'+y+'" r="6" fill="'+blue+'"/>';
  else{
   const left=p.center-p.distance,right=p.center+p.distance;
   for(const [name,v]of [['A',left],['B',right]])body+='<circle data-root="'+v+'" cx="'+x(v)+'" cy="'+y+'" r="5" fill="'+blue+'"/>'+centered(x(v),y-18,name,23,blue);
   body+='<circle data-center="'+p.center+'" cx="'+x(p.center)+'" cy="'+y+'" r="5" fill="'+ink+'"/>';
   for(const [a,b]of [[left,p.center],[p.center,right]]){const ax=x(a),bx=x(b),ay=145;body+=line(ax,ay,bx,ay,purple,1.8)+line(ax,ay-5,ax,ay+5,purple,1.8)+line(bx,ay-5,bx,ay+5,purple,1.8)+centered((ax+bx)/2,ay-12,p.distance,22,purple);}
  }
 }else throw Error('Known native algebra scene');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img" aria-labelledby="title desc"><title id="title">Алгебралық сызба</title><desc id="desc">'+esc(descriptionFor(q))+'</desc><rect width="480" height="360" rx="18" fill="#fff"/><g font-family="Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
export function verifyEdition(q){
 const r=independentlyCalculate(q);assert.equal(r.answer,q.answer,'Independent algebra answer');assert.equal(statementFor(q),q.statement,'Exact parameter-bound statement');assert.equal(solutionFor(q),q.solution,'Exact parameter-bound solution');assert.equal(descriptionFor(q),q.figureDescription,'Exact accessible description');assert.equal(sha(svgFor(q)),q.figureSha256,'Exact native SVG digest');
 if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(v=>v===r.answer).length,1);}
 return {answer:r.answer,checks:Object.entries(r.checks).map(([key,value])=>key+': '+JSON.stringify(value))};
}
