import assert from 'node:assert/strict';
import {Q,add,sub,mul,div,neg,equal,scalar,parse,gcd,display as d,linear} from './collection-inequalities-math.mjs';
const vector=(x=Q(0),y=Q(0),c=Q(0))=>({x,y,c}),constant=v=>!v.x[0]&&!v.y[0],sum=(u,v)=>vector(add(u.x,v.x),add(u.y,v.y),add(u.c,v.c)),scale=(v,a)=>vector(mul(v.x,a),mul(v.y,a),mul(v.c,a));
function coefficients(t){switch(t[0]){case'num':return vector(Q(0),Q(0),Q(t[1],t[2]));case'var':assert(['x','y'].includes(t[1]));return t[1]==='x'?vector(Q(1)):vector(Q(0),Q(1));case'neg':return scale(coefficients(t[1]),Q(-1));default:{const l=coefficients(t[1]),r=coefficients(t[2]);if(t[0]==='+')return sum(l,r);if(t[0]==='-')return sum(l,scale(r,Q(-1)));if(t[0]==='*'){assert(constant(l)||constant(r),'Linear system only');return constant(l)?scale(r,l.c):scale(l,r.c);}assert.equal(t[0],'/');assert(constant(r)&&r.c[0]);return scale(l,div(Q(1),r.c));}}}
function equation(s){const pair=s.split('=');assert.equal(pair.length,2);const a=sum(coefficients(parse(pair[0])),scale(coefficients(parse(pair[1])),Q(-1))),D=[a.x,a.y,a.c].reduce((n,v)=>n/gcd(n,v[1])*v[1],1),norm=scale(a,Q(D));assert(norm.x[0]&&norm.y[0]);return{a:norm.x,b:norm.y,c:neg(norm.c),D};}
function lhs(a,b){let out=a[0]?equal(a,Q(1))?'x':equal(a,Q(-1))?'-x':d(a)+'x':'';if(b[0]){const m=b[0]<0?neg(b):b,term=equal(m,Q(1))?'y':d(m)+'y';out+=(out?(b[0]<0?' − ':' + '):b[0]<0?'-':'')+term;}return out||'0';}
const equationText=e=>`${lhs(e.a,e.b)} = ${d(e.c)}`,scaled=(e,f)=>({a:mul(e.a,f),b:mul(e.b,f),c:mul(e.c,f)}),pair=(x,y)=>`(${d(x)}; ${d(y)})`;
function solve(eqs,method){const[a,b]=eqs.map(equation);let x,y,work=eqs.map((s,i)=>[a,b][i].D===1?`${i+1}) ${equationText([a,b][i])}`:`${i+1}) Әр мүшені ${[a,b][i].D} санына көбейтеміз: ${equationText([a,b][i])}`).join('. ')+'. ';
 if(method.startsWith('substitute_')){const from=method==='substitute_first'?a:b,other=method==='substitute_first'?b:a;assert(equal(from.a,Q(1)));const slope=neg(from.b),intercept=from.c,substitution=linear({a:slope,b:intercept},'y'),A=add(mul(other.a,slope),other.b),B=mul(other.a,intercept);assert(A[0]);y=div(sub(other.c,B),A);x=add(mul(slope,y),intercept);work+=`Коэффициенті 1 болатын x мүшесі бар теңдеуден x = ${substitution}. Оны басқа теңдеуге қоямыз: ${d(other.a)} × (${substitution}) + (${d(other.b)})y = ${d(other.c)}. Жақшаны ашып, ${linear({a:A,b:B},'y')} = ${d(other.c)}. Сондықтан ${d(A)}y = ${d(other.c)} − (${d(B)}) = ${d(sub(other.c,B))}, y = ${d(y)}. Енді x = ${d(slope)} × (${d(y)}) + (${d(intercept)}) = ${d(x)}. `;
 }else{const eliminate=method==='eliminate_x'?'a':'b';assert(['eliminate_x','eliminate_y'].includes(method));assert(a[eliminate][1]===1&&b[eliminate][1]===1);const A=a[eliminate][0],B=b[eliminate][0],g=gcd(A,B),f1=Q(Math.abs(B)/g),f2=Q((Math.sign(A)===Math.sign(B)?-1:1)*Math.abs(A)/g),first=scaled(a,f1),second=scaled(b,f2),combined={a:add(first.a,second.a),b:add(first.b,second.b),c:add(first.c,second.c)};assert(!combined[eliminate][0]);work+=`${equal(f1,Q(1))&&equal(f2,Q(1))?`Коэффициенттер бастапқыдан қарама-қарсы, теңдеулерді қайта көбейтудің қажеті жоқ`:`${equal(f1,Q(1))?`Бірінші теңдеуді өзгертпейміз`:`Бірінші теңдеуді ${d(f1)} санына көбейтеміз`}; ${equal(f2,Q(1))?`екіншісін өзгертпейміз`:`екіншісін ${d(f2)} санына көбейтеміз`}`}: ${equationText(first)}; ${equationText(second)}. Теңдеулерді ҚОССАҚ, ${eliminate==='a'?'x':'y'} мүшелері жойылады: ${equationText(combined)}. `;
  if(eliminate==='a'){assert(combined.b[0]);y=div(combined.c,combined.b);x=div(sub(a.c,mul(a.b,y)),a.a);work+=`Осыдан y = ${d(y)}. Бірінші теңдеуде ${d(a.a)}x = ${d(a.c)} − (${d(a.b)} × (${d(y)})) = ${d(sub(a.c,mul(a.b,y)))}, x = ${d(x)}. `;}else{assert(combined.a[0]);x=div(combined.c,combined.a);y=div(sub(a.c,mul(a.a,x)),a.b);work+=`Осыдан x = ${d(x)}. Бірінші теңдеуде ${d(a.b)}y = ${d(a.c)} − (${d(a.a)} × (${d(x)})) = ${d(sub(a.c,mul(a.a,x)))}, y = ${d(y)}. `;}
 }
 for(const e of[a,b])assert(equal(add(mul(e.a,x),mul(e.b,y)),e.c));work+=`Тексеру: ${d(a.a)} × (${d(x)}) + (${d(a.b)}) × (${d(y)}) = ${d(a.c)}; ${d(b.a)} × (${d(x)}) + (${d(b.b)}) × (${d(y)}) = ${d(b.c)}. ЕКІ бастапқы теңдеуді бір жұп қатар орындайды.`;return{x,y,work};}
const structure=s=>s.replace(/\d+(?:,\d+)?/g,'N').replace(/−/g,'-').replace(/×/g,'*').replace(/\s/g,'');
const authoredStructures={
  "decimal-clearing-ordered-pair": [
    "Nx+N=Ny",
    "Ny+N=Nx"
  ],
  "second-equation-unit-x-substitution": [
    "Nx-Ny=-N",
    "Ny+x=N"
  ],
  "opposite-x-elimination-zero-coordinate": [
    "Nx+Ny=N",
    "Ny-Nx=N"
  ],
  "ready-opposite-x-direct-addition": [
    "Nx-Ny=N",
    "Ny-Nx=N"
  ],
  "first-unit-difference-substitution": [
    "x-y=N",
    "Nx-Ny=-N"
  ],
  "signed-positive-negative-sum": [
    "Nx+Ny=N",
    "Nx-Ny=N"
  ],
  "signed-negative-positive-sum": [
    "Nx-Ny=-N",
    "Nx+Ny=-N"
  ],
  "positive-sum-with-negative-second-coordinate": [
    "Nx-Ny=N",
    "Nx+Ny=N"
  ],
  "opposite-coordinate-zero-sum": [
    "Nx-Ny=N",
    "Nx+Ny=N"
  ],
  "one-decimal-coefficient-sum": [
    "Nx+Ny=-N",
    "Nx-Ny=N"
  ],
  "two-decimal-coefficients-positive-sum": [
    "Nx-Ny=-N",
    "-Nx+Ny=-N"
  ],
  "positive-negative-negative-sum": [
    "Nx+Ny=-N",
    "Nx-Ny=N"
  ],
  "both-positive-sum": [
    "Nx+Ny=N",
    "Nx-Ny=-N"
  ],
  "subtract-negative-coordinate-negative-sum": [
    "Nx-Ny=N",
    "Nx+Ny=-N"
  ],
  "negative-first-positive-second-negative-sum": [
    "Nx+Ny=N",
    "Nx-Ny=-N"
  ],
  "both-negative-sum": [
    "Nx+Ny=-N",
    "Nx-Ny=-N"
  ],
  "ready-cancellation-then-weighted-expression": [
    "Nx-Ny=N",
    "Ny-Nx=-N"
  ]
};
export function renderEdition(row){const p=row.params;assert.deepEqual(Object.keys(p).sort(),(p.target==='expression'?['equations','expression','method','target']:['equations','method','target']).sort());assert.equal(p.equations.length,2);assert.deepEqual(p.equations.map(structure),authoredStructures[row.skillFamily]);const{x,y,work}=solve(p.equations,p.method);let options,answer,solution=work,question;
 if(p.target==='pair'){answer=pair(x,y);options=row.skillFamily==='decimal-clearing-ordered-pair'?[pair(sub(x,Q(1)),add(y,Q(1))),pair(sub(x,Q(2)),y),pair(y,x),answer]:!x[0]?[pair(y,x),pair(x,neg(y)),pair(add(x,Q(1)),y),answer]:[pair(neg(x),y),pair(x,neg(y)),pair(neg(x),neg(y)),answer];question='ЕКІ теңдеуді бір мезгілде орындайтын (x; y) РЕТТЕЛГЕН жұбын таңдаңыз. Бірінші орын — x, екінші орын — y.';solution+=` Сұралған реттелген жұп ${answer}.`;}
 else if(p.target==='sum'){const value=add(x,y);answer=d(value);options=[d(x),d(y),value[0]?d(neg(value)):d(Q(1)),answer];question='Жүйеден x пен y мәндерін тауып, олардың x + y ҚОСЫНДЫСЫН таңдаңыз.';solution+=` Жұпты табумен тоқтамаймыз: x + y = ${d(x)} + (${d(y)}) = ${answer}.`;}
 else{assert.equal(p.target,'expression');assert.equal(p.expression,'-4 × (3x + y)');const value=mul(Q(-4),add(mul(Q(3),x),y));answer=d(value);options=[d(neg(value)),d(add(x,y)),d(mul(Q(-4),sub(mul(Q(3),x),y))),answer];question=`Жүйенің шешімін ${p.expression} өрнегіне қойып, сол өрнектің МӘНІН таңдаңыз.`;solution+=` Қажетті өрнек ${p.expression} = −4 × (3 × (${d(x)}) + (${d(y)})) = −4 × (${d(add(mul(Q(3),x),y))}) = ${answer}. Жауап ретінде жұп не x + y қосындысы сұралған жоқ.`;}
 assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===answer).length,1);return{statement:`Төмендегі екі теңдеу бір ЖҮЙЕ құрайды.\n1) ${p.equations[0]}\n2) ${p.equations[1]}\n${question}`,options,answer,solution};
}
export function verifyEdition(row){assert.equal(row.minimumPlan,'pro');assert.equal(row.grade,6);const rendered=renderEdition(row);for(const k of['statement','options','answer','solution'])assert.deepEqual(row[k],rendered[k]);assert(!/[\\$]|NaN|undefined/.test(row.statement+row.solution));return{answer:rendered.answer,checks:['All17 canonical saved nonvisual conditions/full official solutions/everyMCQ read; source4 SVG excluded.','Individually selected new linear/decimal data preserve substitution versus elimination, zero coordinate, ready opposite coefficients, signed coordinate regimes, requested ordered pair/SUM/weighted expression.','Both equations verified exactly after denominator clearing, substitution or genuine coefficient cancellation. Seventeen source occurrences include numeric variants, not seventeen claimed meanings.','Closed Standard author draft awaits independent complete source/new/solution/MCQ review and hash signature.']};}
