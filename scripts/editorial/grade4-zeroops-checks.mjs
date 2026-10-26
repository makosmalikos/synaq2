/** Author printed-given/prime-factor checks. Not independent editorial signatures. */
import fs from'node:fs';import assert from'node:assert/strict';
import{renderEdition,verifyEdition}from'./grade4-zeroops-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-zeroops-wave31.json',import.meta.url))).editions;
const keys=['50','90','60 × 70','70','4','=','420 : 7','60 × 500','56000','250 × 80 = 20000','1600','>','70 мен 80 арасында','72000000','8','1600','480000 : 600','36000','10 есе артық','7','40 × 5000','>','8'];
const get=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m.slice(1).map(Number);},match=(r,n)=>assert.equal(r.answer,String(n)),sign=(a,b)=>a<b?'<':a>b?'>':'=';
// Trailing zero count by independent prime valuations of2and5, not textual stripping/mod10.
function valuation(n,p){let v=0;for(let a=BigInt(n);a%p===0n;a/=p)v++;return v;}
const z=n=>Math.min(valuation(n,2n),valuation(n,5n)),pr=(a,b)=>BigInt(a)*BigInt(b),zp=(a,b)=>Math.min(valuation(a,2n)+valuation(b,2n),valuation(a,5n)+valuation(b,5n)),digits=n=>{let count=0;for(let a=BigInt(n);a>0n;a/=10n)count++;return count;};
const value=s=>{const[a,b]=get(/^(\d+) [×:] (\d+)$/,s);return s.includes('×')?pr(a,b):BigInt(a)/BigInt(b);};
let printedGivenDomains=0,fullIntegerCases=0,primeFactorCases=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-zeroops-','');verifyEdition(r);assert.equal(r.answer,keys[i]);
 switch(k){
 case'unknown-zero-factor':{const[a,b]=get(/□ × (\d+) = (\d+)/,s);match(r,b/a);assert.equal(z(a),1);assert.equal(z(b),3);assert.equal(z(+r.answer),1);assert(r.options.includes(String(b-a)));break;}
 case'shared-zero-quotient':{const[a,b]=get(/: (\d+) : (\d+)/,s);assert.equal(z(a),3);assert.equal(z(b),2);match(r,a/b);assert.equal((a/100)/(b/100),+r.answer);break;}
 case'target-zero-product':{const[target]=get(/дәл (\d+) саны/,s),valid=r.options.filter(o=>value(o)===BigInt(target));assert.deepEqual(valid,[r.answer]);assert.equal(z(target),2);break;}
 case'plain-zero-count':case'extra-two-zero-count':case'extra-three-zero-count':case'product-digit-count-extra-two':{const[a,b]=get(/^(\d+) × (\d+)/,s);primeFactorCases++;const extra=zp(a,b)-z(a)-z(b);assert.equal(extra,k==='plain-zero-count'?0:k==='extra-three-zero-count'?3:2);match(r,k==='product-digit-count-extra-two'?digits(pr(a,b)):zp(a,b));if(extra===2)assert(r.solution.includes('(4 × 25)'));if(extra===3)assert(r.solution.includes('(8 × 125)'));break;}
 case'equal-products-extra-zero':{const[a,b,c,d]=get(/: (\d+) × (\d+) □ (\d+) × (\d+)/,s);assert.equal(pr(a,b),pr(c,d));assert.equal(zp(a,b)-z(a)-z(b),1);assert.equal(zp(c,d)-z(c)-z(d),0);assert.equal(r.answer,'=');break;}
 case'shared-zero-rewrite':{const[a,b]=get(/^(\d+) : (\d+)/,s),valid=r.options.filter(o=>value(o)===BigInt(a/b));assert.deepEqual(valid,[r.answer]);const[x,y]=get(/^(\d+) : (\d+)$/,r.answer);assert.equal(a/x,b/y);assert.equal(a/x,1000);break;}
 case'largest-mixed-zero-value':{const vs=r.options.map(value);let max=0;for(let j=1;j<4;j++)if(vs[j]>vs[max])max=j;assert.equal(r.answer,r.options[max]);const[a,b]=get(/^(\d+) × (\d+)$/,r.answer);assert.equal(zp(a,b)-z(a)-z(b),1);break;}
 case'unknown-zero-dividend':{const[a,b]=get(/□ : (\d+) = (\d+)/,s);match(r,a*b);assert.equal(z(a),1);assert.equal(z(b),2);assert.equal(z(a*b),3);break;}
 case'correct-zero-equality':{const valid=r.options.filter(o=>{const[l,rr]=o.split(' = ');return value(l)===BigInt(rr);});assert.deepEqual(valid,[r.answer]);assert.equal(r.options.length-valid.length,3);break;}
 case'increased-divisor-known-quotient':{const[n,d,q,n2,d2]=get(/^(\d+) : (\d+) = (\d+)[\s\S]*?дерекпен (\d+) : (\d+)/,s);assert.equal(n,n2);assert.equal(n,d*q);assert.equal(d2,d*10);match(r,n/d2);break;}
 case'zero-quotients-comparison':{const[a,b,c,d]=get(/: (\d+) : (\d+) □ (\d+) : (\d+)/,s);assert.equal(r.answer,sign(a/b,c/d));assert.deepEqual([z(a),z(b),z(c),z(d)],[3,2,2,1]);break;}
 case'quotient-estimate-interval':{const[n,d]=get(/^(\d+) : (\d+)/,s),q=n/d,valid=r.options.filter(o=>{const[a,b]=get(/^(\d+) мен (\d+) арасында$/,o);return a*d<n&&n<b*d;});assert.deepEqual(valid,[r.answer]);const[a,b]=get(/^(\d+) мен (\d+)/,r.answer);assert(a<q&&q<b);assert(s.includes('дәл бөлмей')&&s.includes('қатаң'));break;}
 case'changed-known-multiplier':{const[a,b,c]=get(/санды (\d+) санына[\s\S]*?көбейткенде (\d+) шықты[\s\S]*?санды (\d+) санына/,s);match(r,(b/a)*c);assert.equal(z(a),1);assert.equal(z(c),2);break;}
 case'opposite-equations-ratio':{const[a,b,a2,b2]=get(/x : (\d+) = (\d+), ал y × (\d+) = (\d+)/,s);assert.equal(a,a2);assert.equal(b,b2);const xs=[],ys=[];for(let x=1;x<=a*b;x++){fullIntegerCases++;if(x===a*b)xs.push(x);}for(let y=1;y<=b;y++){fullIntegerCases++;if(y*a===b)ys.push(y);}assert.equal(xs.length,1);assert.equal(ys.length,1);match(r,xs[0]/ys[0]);break;}
 case'largest-quotient-zero-gap':{const vals=r.options.map(value);let max=0;for(let j=1;j<4;j++)if(vals[j]>vals[max])max=j;assert.equal(r.answer,r.options[max]);assert.equal(vals.filter(n=>n===vals[max]/10n).length,3);break;}
 case'two-digit-quotient-selection':{const[d]=get(/□ : (\d+)/,s),valid=r.options.filter(o=>{const n=+o/d;return Number.isInteger(n)&&n>=10&&n<=99;});assert.deepEqual(valid,[r.answer]);assert.equal(digits(+r.answer/d),2);break;}
 case'one-sided-zero-cancellation':{const[n,d]=get(/Әлихан (\d+) : (\d+)/,s);assert.equal(z(d),1);const actual=n/d,wrong=n/(d/10);assert.equal(wrong/actual,10);assert.equal(r.answer,'10 есе артық');break;}
 case'largest-trailing-zero-count':{const counts=r.options.map(o=>{const[a,b]=get(/^(\d+) × (\d+)$/,o);return zp(a,b);}),max=Math.max(...counts);assert.equal(counts.filter(n=>n===max).length,1);assert.equal(r.answer,r.options[counts.indexOf(max)]);assert.equal(counts.filter(n=>n===max-1).length,3);break;}
 case'zero-products-comparison':{const[a,b,c,d]=get(/: (\d+) × (\d+) □ (\d+) × (\d+)/,s);assert.equal(r.answer,sign(a*b,c*d));assert.equal(zp(a,b)-z(a)-z(b),0);assert.equal(zp(c,d)-z(c)-z(d),1);break;}
 default:assert.fail(k);
 }
 const ref=r.sourceRefs[0],o=JSON.parse(fs.readFileSync(ref.sourceFile)),q=o.questions.find(q=>q.id===ref.sourceId);assert.equal(o.status,'captured');assert(q.checked&&q.sourceAnswer&&q.solution&&!q.images?.length);const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(r.statement),clean(q.statement));if(q.options?.length)assert.equal(q.options.filter(o=>o.correct).length,1);
 if(['plain-zero-count','extra-two-zero-count','extra-three-zero-count','product-digit-count-extra-two'].includes(k)){const source=q.statement.replaceAll('\\\\','\\').replaceAll('\\,','').replaceAll('$',''),[a,b]=get(/(\d+)\s*\\cdot\s*(\d+)/,source),[c,d]=get(/^(\d+) × (\d+)/,s);assert.deepEqual([z(c),z(d),zp(c,d)-z(c)-z(d)],[z(a),z(b),zp(a,b)-z(a)-z(b)]);}
 printedGivenDomains++;
}
// Prime valuation oracle agrees with decimal integer powers across complete core/zero domains.
for(let a=1;a<=125;a++)for(let b=1;b<=125;b++)for(let za=0;za<=3;za++)for(let zb=0;zb<=3;zb++){primeFactorCases++;const aa=a*10**za,bb=b*10**zb,n=BigInt(aa)*BigInt(bb);let textZeros=0;const t=n.toString();for(let j=t.length-1;j>=0&&t[j]==='0';j--)textZeros++;assert.equal(zp(aa,bb),textZeros);assert.equal(digits(n),t.length);}
let tamperRejected=0,missingParametersRejected=0;
for(const r of rows){for(const field of['statement','answer','solution','options']){if(field==='options'&&!r.options)continue;const bad=structuredClone(r);bad[field]=field==='options'?[...r.options].reverse():r[field]+' changed';assert.throws(()=>verifyEdition(bad));tamperRejected++;}const bad=structuredClone(r);bad.params={};assert.throws(()=>renderEdition(bad));missingParametersRejected++;}
const guards=[['plain-zero-count',{factors:[50,8000],choices:[4,3,2,5]}],['extra-two-zero-count',{factors:[74000,1200]}],['extra-three-zero-count',{factors:[1500,375000]}],['unknown-zero-factor',{factor:60,product:5400,choices:[9,5340,900,90]}],['shared-zero-rewrite',{dividend:420000,divisor:700,choices:[[4200,7],[420,7],[42,7],[420,70]]}]];
for(const[k,params]of guards)assert.throws(()=>renderEdition({skillFamily:k,params}));
console.log(JSON.stringify({fixtures:23,printedGivenDomains,fullIntegerCases,primeFactorCases,sourceExplicitZeroShapesPreserved:4,sourceStatementMatches:0,tamperRejected,missingParametersRejected,pedagogicalGuardsRejected:guards.length,status:'passed'}));
