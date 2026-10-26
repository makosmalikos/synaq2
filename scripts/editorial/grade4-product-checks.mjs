/** Source-specific printed-given author checks; not external editorial review. */
import fs from'node:fs';import assert from'node:assert/strict';
import{renderEdition,verifyEdition}from'./grade4-product-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-product-wave30.json',import.meta.url))).editions;
const expected=['11 × (4 × 25)','=','460','9','940','1440 : 10 : 6','12','(x : y) : z','1080 : (6 × 15) = 12','(840 : 7) × 12','4900','1260 : (9 × 7) = (1260 : 9) : 7','8','>','70','<','1300','4800','1000','120','53','33','7','6 есе өседі','280','28 × 25 × 20','40','1300','=','11000','4800 : 6 : 8','70'];
const get=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m.slice(1).map(Number);},match=(r,n)=>assert.equal(r.answer,String(n));
// Separate shunting-yard evaluator uses unreduced rational cross-products, not author's recursive parser.
function exp(s,env={}){const tokens=s.match(/\d+|[a-z]+|[()+×:]/g)||[];assert.equal(tokens.join(''),s.replace(/\s/g,''));const ops=[],out=[],rank={'+':1,'×':2,':':2};for(const t of tokens){if(/^\d+$/.test(t)||Object.hasOwn(env,t))out.push([BigInt(Object.hasOwn(env,t)?env[t]:t),1n]);else if(t==='(')ops.push(t);else if(t===')'){while(ops.at(-1)!=='('){assert(ops.length);out.push(ops.pop());}ops.pop();}else{while(ops.length&&ops.at(-1)!=='('&&rank[ops.at(-1)]>=rank[t])out.push(ops.pop());ops.push(t);}}while(ops.length)out.push(ops.pop());const stack=[];for(const t of out){if(Array.isArray(t))stack.push(t);else{const b=stack.pop(),a=stack.pop();assert(a&&b);stack.push(t==='+'?[a[0]*b[1]+b[0]*a[1],a[1]*b[1]]:t==='×'?[a[0]*b[0],a[1]*b[1]]:[a[0]*b[1],a[1]*b[0]]);}}assert.equal(stack.length,1);assert.notEqual(stack[0][1],0n);return stack[0];}
const same=(a,b)=>a[0]*b[1]===b[0]*a[1],integer=n=>[BigInt(n),1n];
let fullIntegerCases=0,symbolicCases=0,printedGivenDomains=0,numericSolutionEqualities=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-product-','');verifyEdition(r);assert.equal(r.answer,expected[i]);
 switch(k){
 case'factor-associative-choice':{const[n,a,b,n2,c]=get(/^(\d+) = (\d+) × (\d+)[\s\S]*?Қай өрнек (\d+) × (\d+)/,s);assert.equal(n,a*b);assert.equal(n,n2);assert.equal(b*c,100);const valid=r.options.filter(o=>same(exp(o),integer(n*c)));assert.deepEqual(valid,[r.answer]);break;}
 case'associative-product-compare':{const[a,b,c]=get(/: (\d+) × \((\d+) × (\d+)\)/,s);assert.equal(a*(b*c),(a*b)*c);assert.equal(r.answer,'=');break;}
 case'nested-ten-product':{const[n,a,b]=get(/: (\d+) × \((\d+) × (\d+)\)/,s);assert.equal(a*b,10);match(r,n*a*b);break;}
 case'decomposed-divisor':{const[d,a,b,n,d2]=get(/^(\d+) = (\d+) × (\d+)[\s\S]*?, (\d+) : (\d+)/,s);assert.equal(d,d2);assert.equal(d,a*b);match(r,n/d);break;}
 case'twenty-product':{const[n]=get(/, (\d+) × 20/,s);match(r,n*20);assert(r.solution.includes('× (2 × 10)'));break;}
 case'division-chain-choice':case'division-factorization-choice':{const[n,d]=get(/^(\d+) : (\d+)/,s);const valid=r.options.filter(o=>same(exp(o),[BigInt(n),BigInt(d)]));assert.deepEqual(valid,[r.answer]);if(k==='division-factorization-choice')assert(r.solution.includes('40 + 8 = 48')&&r.solution.includes('6 × 8'));break;}
 case'nested-product-division':case'nested-product-division-choice':{const[n,a,b]=get(/: (\d+) : \((\d+) × (\d+)\)/,s);match(r,n/(a*b));break;}
 case'symbolic-product-division':{assert(s.includes('y > 1, z > 1')&&s.includes('қалдықсыз'));const allValid=Array(4).fill(true);for(let y=2;y<=8;y++)for(let z=2;z<=8;z++)for(let q=1;q<=12;q++){symbolicCases++;const x=q*y*z;for(let j=0;j<4;j++)allValid[j]&&=same(exp(r.options[j],{x,y,z}),integer(q));}assert.deepEqual(allValid,[true,false,false,false]);assert.equal(r.answer,r.options[0]);break;}
 case'correct-division-equality':case'division-rewrite-equality':{const valid=r.options.filter(o=>{const[l,rr]=o.split(' = ');return same(exp(l),exp(rr));});assert.deepEqual(valid,[r.answer]);assert(r.options.filter(o=>!valid.includes(o)).length===3);break;}
 case'odd-division-expression':{const vals=r.options.map(o=>exp(o)),same0=r.options.filter((_,j)=>same(vals[0],vals[j]));assert.equal(same0.length,3);assert(!same(vals[0],vals[3]));assert.equal(r.answer,r.options[3]);break;}
 case'round-hundred-multiplier':case'round-thousand-multiplier':{const[d,a,b,n,d2]=get(/^(\d+) = (\d+) × (\d+)[\s\S]*?, (\d+) × (\d+)/,s);assert.equal(d,d2);assert.equal(d,a*b);match(r,n*d);if(k==='round-hundred-multiplier')assert.equal(n*a%100,0);else assert.equal(n*a,1000);break;}
 case'daily-product-resource':{const[a,b,n]=get(/әшекейге (\d+) м[\s\S]*?Күніне (\d+) әшекей[\s\S]*?, (\d+) м/,s);match(r,n/(a*b));assert(r.options.includes(String(n/a)));break;}
 case'fifty-hundred-comparison':{const[a,b]=get(/^(\d+) × 50 □ (\d+) × 100/,s);assert.equal(a%2,0);assert.equal(r.answer,a*50>b*100?'>':a*50<b*100?'<':'=');break;}
 case'parentheses-division-comparison':{const[n,a,b]=get(/: (\d+) : \((\d+) × (\d+)\)/,s);assert(n/(a*b)<n/a*b);assert.equal(r.answer,'<');break;}
 case'full-bus-repeated-trips':{const[a,b,c]=get(/әрқайсысы (\d+) жолаушы алатын (\d+) автобус[\s\S]*?автобус (\d+) рет/,s);assert.equal(b*c,20);match(r,a*b*c);assert(s.includes('бұрын тасымалданбаған'));break;}
 case'inverse-two-divisions':{const[a,b,q]=get(/алдымен (\d+) санына[\s\S]*?кейін (\d+) санына[\s\S]*?нәтиже (\d+) болды/,s);assert.equal(a*b,100);match(r,q*a*b);break;}
 case'missing-round-thousand-factor':{const[n,a,b]=get(/: (\d+) × (\d+) = (\d+) × □/,s);match(r,n*a/b);assert.equal((n/b)*a,1000);break;}
 case'pairwise-product-cancellation':{const[n1,n2,n3,d1,d2,d3]=get(/: \((\d+) × (\d+) × (\d+)\) : \((\d+) × (\d+) × (\d+)\)/,s);assert([n1%d1,n2%d2,n3%d3].every(n=>n===0));match(r,(n1/d1)*(n2/d2)*(n3/d3));break;}
 case'inverse-three-multiplications':{const[a,b,c,n]=get(/кезекпен (\d+), (\d+), (\d+) сандарына[\s\S]*?нәтиже (\d+) болды/,s);assert.equal(a*b*c,1000);match(r,n/(a*b*c));break;}
 case'unknown-divisor-factor':{const[n,a,q]=get(/: (\d+) : \(□ × (\d+)\) = (\d+)/,s);const found=[];for(let x=1;x<=n/q;x++){fullIntegerCases++;if(x*a*q===n)found.push(x);}assert.deepEqual(found,[+r.answer]);break;}
 case'known-quotient-nested':{const[q,f]=get(/x : y = (\d+)[\s\S]*?x : \(y × (\d+)\)/,s);match(r,q/f);for(let y=1;y<=100;y++){fullIntegerCases++;assert.equal((q*y)/(y*f),+r.answer);}break;}
 case'product-relative-changes':{const[div,a,div2,c]=get(/b саны (\d+) санына[\s\S]*?a мәнін (\d+) есе[\s\S]*?b мәнін (\d+) есе[\s\S]*?c мәнін (\d+) есе/,s);assert.equal(div,div2);const f=a*c/div;assert.equal(r.answer,`${f} есе өседі`);for(let x=1;x<=10;x++)for(let y=div;y<=40;y+=div)for(let z=1;z<=10;z++){symbolicCases++;assert.equal((x*a)*(y/div)*(z*c),x*y*z*f);}break;}
 case'unfinished-division-correction':{const[d,a,q]=get(/санды (\d+) санына[\s\S]*?тек (\d+) санына[\s\S]*?, (\d+) нәтижесін/,s);match(r,q*a/d);break;}
 case'largest-efficient-product':{const vals=r.options.map(o=>exp(o));let max=0;for(let j=1;j<4;j++)if(vals[j][0]*vals[max][1]>vals[max][0]*vals[j][1])max=j;assert.equal(r.answer,r.options[max]);assert(r.solution.includes('(125 × 8)')&&r.solution.includes('(4 × 25)'));break;}
 case'associative-division-compare':{const[n,a,b]=get(/: \((\d+) : (\d+)\) : (\d+)/,s);assert.equal(n/a/b,n/(a*b));assert.equal(r.answer,'=');break;}
 case'unknown-fourth-factor':{const[a,b,c,n]=get(/: (\d+) × (\d+) × (\d+) × □ = (\d+)/,s);assert.equal(a*c,100);match(r,n/(a*b*c));break;}
 default:assert.fail(k);
 }
 const ref=r.sourceRefs[0],o=JSON.parse(fs.readFileSync(ref.sourceFile)),q=o.questions.find(q=>q.id===ref.sourceId);assert.equal(o.status,'captured');assert(q.checked&&q.sourceAnswer&&q.solution&&!q.images?.length);const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(r.statement),clean(q.statement));if(q.options?.length)assert.equal(q.options.filter(o=>o.correct).length,1);printedGivenDomains++;
 // All maximal pure numeric chains in the solution must remain true.
 for(const m of r.solution.matchAll(/(?<![\w:])([\d][\d\s×:+()]*?)\s*=\s*([\d][\d\s×:+()]*)(?!\d)/g)){
  const l=m[1].trim(),rr=m[2].trim();if(!/[×:+]/.test(l))continue;try{assert(same(exp(l),exp(rr)),[r.editionId,l,rr]);numericSolutionEqualities++;}catch(e){if(e.code==='ERR_ASSERTION'&&e.message.includes(r.editionId))throw e;}
 }
}
let tamperRejected=0,missingParametersRejected=0;
for(const r of rows){for(const key of['statement','answer','solution','options']){if(key==='options'&&!r.options)continue;const bad=structuredClone(r);bad[key]=key==='options'?[...r.options].reverse():r[key]+' changed';assert.throws(()=>verifyEdition(bad));tamperRejected++;}const bad=structuredClone(r);bad.params={};assert.throws(()=>renderEdition(bad));missingParametersRejected++;}
const guards=[['factor-associative-choice',{outer:11,pair:[5,25]}],['nested-ten-product',{number:46,pair:[2,6],choices:[4600,460,56,97]}],['round-hundred-multiplier',{number:174,parts:[4,7]}],['round-thousand-multiplier',{number:124,parts:[8,11]}],['inverse-three-multiplications',{factors:[2,4,126],result:53000}],['product-relative-changes',{increaseA:3,decreaseB:4,increaseC:8,example:[5,11,7],choices:[6,1,96,7]}]];
for(const[k,params]of guards)assert.throws(()=>renderEdition({skillFamily:k,params}));
console.log(JSON.stringify({fixtures:rows.length,printedGivenDomains,fullIntegerCases,symbolicCases,numericSolutionEqualities,sourceStatementMatches:0,tamperRejected,missingParametersRejected,pedagogicalGuardsRejected:guards.length,status:'passed'}));
