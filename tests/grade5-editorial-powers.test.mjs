import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-powers-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const editions=buildEditions(),prefix='grade5-powers-';
const range=(lo,hi)=>Array.from({length:hi-lo+1},(_,i)=>lo+i);
const pow=(base,exponent)=>Array.from({length:Number(exponent)}).reduce(value=>value*BigInt(base),1n);
const only=values=>{assert.equal(values.length,1);return values[0];};
const kind=row=>row.modelId.slice(prefix.length);
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
function frac(n,d=1n){n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];}
const plus=(a,b)=>frac(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const minus=(a,b)=>frac(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
const times=(a,b)=>frac(a[0]*b[0],a[1]*b[1]);
const divide=(a,b)=>frac(a[0]*b[1],a[1]*b[0]);
const equal=(a,b)=>a[0]*b[1]===b[0]*a[1];
const supers='⁰¹²³⁴⁵⁶⁷⁸⁹';
function expression(text,vars={}){
 text=text.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,s=>'^'+[...s].map(c=>supers.indexOf(c)).join('')).replace(/(\d)([a-z])/g,'$1 × $2').replace(/\s/g,'');
 const tokens=text.match(/\d+|[a-z]|[()+−×:^]/g);assert.equal(tokens?.join(''),text);let pos=0;
 const atom=()=>{if(tokens[pos]==='('){pos++;const n=addition();assert.equal(tokens[pos++],')');return n;}const token=tokens[pos++];return frac(/\d/.test(token)?token:vars[token]);};
 const powered=()=>{let n=atom();if(tokens[pos]==='^'){pos++;const e=Number(tokens[pos++]);assert.ok(Number.isInteger(e)&&e>=0&&e<=30);n=Array(e).fill(n).reduce((a,b)=>times(a,b),frac(1));}return n;};
 const product=()=>{let n=powered();while(tokens[pos]==='×'||tokens[pos]===':'){const op=tokens[pos++],right=powered();n=op==='×'?times(n,right):divide(n,right);}return n;};
 const addition=()=>{let n=product();while(tokens[pos]==='+'||tokens[pos]==='−'){const op=tokens[pos++],right=product();n=op==='+'?plus(n,right):minus(n,right);}return n;};
 const n=addition();assert.equal(pos,tokens.length);return n;
}
const integer=x=>{assert.equal(x[1],1n);return x[0];};
function matchingOption(row,predicate){return only(row.options.filter(predicate));}
function equalOption(row,target){return matchingOption(row,option=>equal(expression(option),frac(target)));}
const square=n=>range(1,n).some(i=>BigInt(i)*BigInt(i)===BigInt(n));
const cube=n=>range(1,n).some(i=>pow(i,3)===BigInt(n));
function oracle(row){const p=row.params;switch(kind(row)){
 case'natural-cube-root':return only(range(1,p.value).filter(n=>pow(n,3)===BigInt(p.value)));
 case'natural-square-root':return only(range(1,p.value).filter(n=>pow(n,2)===BigInt(p.value)));
 case'square-plus':return equalOption(row,pow(p.base,2)+BigInt(p.added));
 case'first-power-plus-one-power':return pow(p.base,1)+pow(1,p.onesExponent);
 case'ten-power-value':return pow(10,p.exponent);
 case'coefficient-square':return BigInt(p.coefficient)*pow(p.base,2);
 case'name-cube':return matchingOption(row,o=>{const caret=o.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,s=>'^'+[...s].map(c=>supers.indexOf(c)).join(''));return caret===`${p.base}^3`;});
 case'write-ten-power':return equalOption(row,BigInt('1'+'0'.repeat(p.exponent)));
 case'identify-base-exponent':return matchingOption(row,o=>{const m=o.match(/^негізі (\d+), көрсеткіші (\d+)$/);return Number(m[1])===p.base&&Number(m[2])===p.exponent;});
 case'expand-power':return matchingOption(row,o=>{const parts=o.split(' × ');return parts.length===p.exponent&&parts.every(n=>n===String(p.base));});
 case'scaled-swapped-equality':case'compare-close-powers':return matchingOption(row,o=>{const m=o.match(/^(.+) ([=<>]) (.+)$/);if(!m)return false;const l=expression(m[1]),r=expression(m[3]),diff=l[0]*r[1]-r[0]*l[1];return m[2]==='='?diff===0n:m[2]==='>'?diff>0n:diff<0n;});
 case'power-value':return pow(p.base,p.exponent);
 case'coefficient-ten-power':return BigInt(p.coefficient)*pow(10,p.exponent);
 case'compress-product':return matchingOption(row,o=>{const m=o.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);return m&&Number(m[1])===p.base&&Number([...m[2]].map(c=>supers.indexOf(c)).join(''))===p.count;});
 case'power-place-expansion':{
  const text=[p.thousands,0,p.tens,p.units].join('');return matchingOption(row,o=>o===text);
 }
 case'division-power-plus-cube':return integer(plus(divide(frac(p.numerator),frac(pow(p.divisorBase,2))),frac(pow(p.cubeBase,3))));
 case'sum-square':return equalOption(row,pow(p.first+p.second,2));
 case'collect-coefficient-power':{
  const samples=[1,2,3,4];
  // All alternatives have degree at most 3. Equality at four distinct points proves this polynomial identity.
  return matchingOption(row,o=>samples.every(t=>equal(expression(o,{[p.variable]:t}),expression(`${p.first} × ${p.variable} × ${p.second} × ${p.variable} × ${p.variable}`,{[p.variable]:t}))));
 }
 case'both-square-cube':return matchingOption(row,o=>square(Number(o))&&cube(Number(o)));
 case'largest-power':{const vs=row.options.map(o=>integer(expression(o))),max=vs.reduce((a,b)=>a>b?a:b);return matchingOption(row,o=>integer(expression(o))===max);}
 case'product-two-powers':return equalOption(row,pow(...p.first)*pow(...p.second));
 case'nested-archive-count':{
  let count=0;for(let c=0;c<p.cabinets;c++)for(let s=0;s<p.branch;s++)for(let f=0;f<p.branch;f++)for(let card=0;card<p.branch;card++)count++;return count;
 }
 case'sum-two-squares':return pow(p.first,2)+pow(p.second,2);
 case'coefficient-square-minus-cube':return BigInt(p.coefficient)*pow(p.squareBase,2)-pow(p.cubeBase,3);
 case'find-exponent':{let current=BigInt(p.value),steps=0;while(current>1n){assert.equal(current%BigInt(p.base),0n);current/=BigInt(p.base);steps++;}return steps;}
 case'nested-square-times':return equalOption(row,pow(BigInt(p.before)-pow(p.innerBase,p.innerExponent),2)*BigInt(p.multiplier));
 case'difference-two-powers':return pow(...p.first)-pow(...p.second);
 case'coefficient-missing-ten-exponent':{const n=BigInt(String(p.coefficient)+'0'.repeat(p.exponent));let current=n/BigInt(p.coefficient),steps=0;while(current>1n){assert.equal(current%10n,0n);current/=10n;steps++;}return steps;}
 case'square-sum-discrepancy':return equalOption(row,pow(p.first+p.second,2)-pow(p.first,2)-pow(p.second,2));
 case'count-natural-squares':{const squares=new Set(range(1,p.last).map(n=>BigInt(n)*BigInt(n)).filter(n=>n<=BigInt(p.last)));return equalOption(row,squares.size);}
 case'nine-divisible-ten-power-sum':return matchingOption(row,o=>integer(expression(o))%9n===0n);
 case'odd-sum-square':{let total=0;for(let n=1;n<=p.last;n++)if(n%2===1)total+=n;return total;}
 case'nines-digit-sum':return [...String(pow(10,p.exponent)-1n)].reduce((s,c)=>s+Number(c),0);
 case'square-boundary-code':return only(range(p.tens*10,p.tens*10+9).filter(n=>{const t=String(BigInt(n)*BigInt(n));return t.length===4&&t[0]===String(p.firstSquareDigit)&&t.at(-1)===String(p.lastSquareDigit);}));
 case'power-last-digit':return equalOption(row,pow(p.base,p.exponent)%10n);
 case'long-power-order':{
  const text=row.statement.match(/^(.+) өрнегін/)[1];return integer(expression(text));
 }
 case'impossible-square':return matchingOption(row,o=>!square(Number(o)));
 case'consecutive-power-gap':{
  const visible=range(0,p.count-1).filter(i=>i!==p.gapIndex),exponent=only(range(1,8).filter(e=>visible.every(i=>pow(p.firstBase+i,e)===pow(p.firstBase+i,2))));return equalOption(row,pow(p.firstBase+p.gapIndex,exponent));
 }
 case'square-minus-double':return pow(p.base,2)-BigInt(2*p.base);
 case'true-power-equality':return matchingOption(row,o=>{const [left,right]=o.split(' = ');return equal(expression(left),expression(right));});
 case'wrong-power-representation':return matchingOption(row,o=>!equal(expression(o),frac(p.target)));
 case'square-area-factor':{
  const big=range(1,p.larger).flatMap(x=>range(1,p.larger).map(y=>[x,y])),small=range(1,p.smaller).flatMap(x=>range(1,p.smaller).map(y=>[x,y]));assert.equal(big.length%small.length,0);return big.length/small.length;
 }
 case'cube-box-volume':{let count=0;for(let x=0;x<p.edge;x++)for(let y=0;y<p.edge;y++)for(let z=0;z<p.edge;z++)count++;return count;}
 case'fresh-information-tree':{
  let all=new Set(['origin']),frontier=['origin'];for(let day=1;day<=p.days;day++){const next=[];for(const person of frontier)for(let child=0;child<p.branch;child++){const id=person+'.'+child;assert.ok(!all.has(id));all.add(id);next.push(id);}frontier=next;}return equalOption(row,all.size);
 }
 case'unmatched-two-five-digit-count':return String(pow(2,p.twos)*pow(5,p.fives)).length;
 case'least-square-above':return equalOption(row,range(1,p.threshold).find(n=>BigInt(n)*BigInt(n)>BigInt(p.threshold)));
 default:throw Error('Missing second oracle '+kind(row));
}}
for(const row of editions)test('independent exact powers oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
 assert.ok(!/[\\$]/.test(row.statement+row.solution));
});
test('all 47 captured nonvisual topic2.6 sources covered once, no visuals carried over',()=>{
 const sources=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-6');assert.equal(editions.length,47);assert.equal(sources.length,47);assert.deepEqual(new Set(editions.map(r=>r.sourceRefs[0].sourceId)),new Set(sources.map(s=>s.sourceId)));
 for(const row of editions){const ref=row.sourceRefs[0],raw=JSON.parse(fs.readFileSync(ref.sourceFile));const q=only(raw.questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.ok(!row.figure&&!row.image);assert.notEqual(q.statement,row.statement);}
});
test('all statement, solution, keys, params and MCQ mutations fail exact binding',()=>{
 for(const row of editions){for(const field of['statement','solution','answer']){const bad=structuredClone(row);bad[field]+=' altered';assert.throws(()=>verifyEdition(bad));}
  const bad=structuredClone(row);bad.params.unboundExponent=19;assert.throws(()=>verifyEdition(bad));
  if(row.options){const choice=structuredClone(row);choice.options[0]+=' altered';assert.throws(()=>verifyEdition(choice));}
 }
});
test('source-critical power grouping, counterexamples, last-digit cycles and exact strict bounds',()=>{
 const get=k=>only(editions.filter(r=>kind(r)===k));
 assert.equal(get('long-power-order').answer,'16');assert.equal(integer(expression('(3⁴ × 4² : 6² + 8²) : 4 − 3²')),16n);
 assert.equal(get('nested-square-times').answer,'256');assert.notEqual(get('nested-square-times').answer,String(pow((35n-pow(3,3))*4n,2)));
 assert.equal(get('square-boundary-code').answer,'87');assert.equal(get('square-boundary-code').solution.includes('83² = 6889'),true);
 assert.equal(get('power-last-digit').answer,'9');assert.equal(get('unmatched-two-five-digit-count').answer,'9');assert.notEqual(get('unmatched-two-five-digit-count').answer,String(6+10));
 assert.equal(get('least-square-above').answer,'29');assert.equal(pow(28,2),784n);
 assert.equal(get('fresh-information-tree').answer,'63');assert.equal(get('both-square-cube').answer,'729');
 const max=get('largest-power');assert.equal(max.answer,'3⁶');assert.equal(integer(expression('2⁸')),integer(expression('4⁴')));assert.ok(integer(expression('3⁶'))>integer(expression('2⁸')));
 for(const [k,fragment]of[['square-boundary-code','overline(8a)'],['fresh-information-tree','бір адамға екі рет айтылмайды'],['consecutive-power-gap','бірдей белгісіз натурал дәрежеге'],['least-square-above','қатаң үлкен']]){const row=structuredClone(get(k));assert.ok(row.statement.includes(fragment));row.statement=row.statement.replace(fragment,'');assert.throws(()=>verifyEdition(row));}
});
