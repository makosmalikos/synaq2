import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {verifyEdition} from '../scripts/editorial/grade5-sequence-models.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade5-sequence.json',import.meta.url),'utf8'));
const parseList=s=>s.split('; ').map(Number),sum=a=>a.reduce((a,b)=>a+b,0);
function oracle(r){const p=r.params,k=r.modelId.replace('grade5-sequence-','');let x;
 switch(k){
 case'arithmetic-next':x=p.first;for(let i=0;i<4;i++)x+=p.step;return String(x);
 case'geometric-next':x=p.first;for(let i=0;i<4;i++)x*=p.factor;return String(x);
 case'listed-position':return String(p.terms.findIndex(n=>n===p.target)+1);
 case'arithmetic-previous':for(let n=0;n<p.anchor;n++)if(n+p.step===p.anchor)return String(n);throw Error('No predecessor');
 case'fibonacci-term':{function f(n){return n===1?p.first:n===2?p.second:f(n-1)+f(n-2);}return String(f(p.index));}
 case'shift-multiply-term':{let product=0;for(let i=0;i<p.factor;i++)product+=p.index+p.shift;return String(product);}
 case'listed-term':return String(p.terms.slice(0,p.index).at(-1));
 case'linear-first-three':{const good=r.options.filter(option=>parseList(option).every((v,i)=>v===p.coefficient*(i+1)+p.offset));assert.equal(good.length,1);return good[0];}
 case'linear-term':{let v=p.offset;for(let i=0;i<p.index;i++)v+=p.coefficient;return String(v);}
 case'constant-choice':{const good=r.options.filter(x=>new Set(parseList(x)).size===1);assert.equal(good.length,1);return good[0];}
 case'index-meaning':return String(p.index);
 case'period-term':{const repeated=[];while(repeated.length<p.index)repeated.push(...p.block);return String(repeated[p.index-1]);}
 case'geometric-preceding':{const good=r.options.filter(s=>{const a=parseList(s);return a.length===p.count&&a.every((v,i)=>i===0||v===a[i-1]*p.factor)&&a.at(-1)*p.factor===p.anchor;});assert.equal(good.length,1);return good[0];}
 case'linear-nonmember':{const good=p.candidates.filter(v=>{for(let n=1;n<=v;n++)if((p.innerA*n+p.innerB)*p.multiplier===v)return false;return true;});assert.equal(good.length,1);return String(good[0]);}
 case'period-sum':{const blocks=Math.floor(p.count/p.block.length),tail=p.count%p.block.length;return String(blocks*sum(p.block)+sum(p.block.slice(0,tail)));}
 case'arithmetic-context-term':{let v=p.first;for(let index=1;index<p.index;index++)v+=p.step;return String(v);}
 case'geometric-three-next':{const good=r.options.filter(s=>{let v=p.first;for(let i=0;i<4;i++)v*=p.factor;const xs=parseList(s);return xs[0]===v&&xs[1]===v*p.factor&&xs[2]===v*p.factor*p.factor;});assert.equal(good.length,1);return good[0];}
 case'affine-recurrence':{function f(n){return n===1?p.first:p.factor*f(n-1)+p.add;}return String(f(p.index));}
 case'linear-difference':{let a=p.offset,b=p.offset;for(let i=0;i<p.high;i++)a+=p.coefficient;for(let i=0;i<p.low;i++)b+=p.coefficient;return String(a-b);}
 case'odd-term':{let count=0;for(let n=1;n<1000;n++)if(n%2&&++count===p.index)return String(n);throw Error('No odd term');}
 case'arithmetic-formula':{const expected=Array.from({length:15},(_,i)=>p.first+i*p.step);const good=r.options.filter(option=>{const m=/a\(n\) = (\d+) × n ([+−]) (\d+)/.exec(option);assert.ok(m);return expected.every((v,i)=>v===Number(m[1])*(i+1)+(m[2]==='+'?1:-1)*Number(m[3]));});assert.equal(good.length,1);return good[0];}
 case'membership-index':for(let n=1,v=p.first;v<=p.target;n++,v+=p.step)if(v===p.target)return String(n);return'0';
 case'linear-index':for(let n=1;n<=p.target;n++)if(p.coefficient*n+p.offset===p.target)return String(n);throw Error('No index');
 case'linear-sum':return String(p.coefficient*p.count*(p.count+1)/2+p.offset*p.count);
 case'fibonacci-missing-second':assert.equal(p.knownIndex,5);return String((p.known-2*p.first)/3);
 case'row-total':{let result=0,seats=p.first;for(let row=0;row<p.rows;row++){result+=seats;seats+=p.step;}return String(result);}
 case'quadratic-member':{const valid=p.candidates.filter(v=>{for(let n=1;n<=v;n++)if(n*(n+p.offset)===v)return true;return false;});assert.equal(valid.length,1);return String(valid[0]);}
 case'digit-stream':{let position=0;for(let n=1;n<1000;n++)for(const digit of String(n)){position++;if(position===p.position)return digit;}throw Error('No digit');}
 case'infer-affine':{const prefix=[p.first];for(let i=0;i<4;i++)prefix.push(prefix.at(-1)*p.factor+p.add);const fits=[];for(let m=1;m<=10;m++)for(let add=-20;add<=20;add++)if(prefix.every((v,i)=>i===0||v===m*prefix[i-1]+add))fits.push([m,add]);assert.equal(fits.length,1);let v=p.first;for(let i=1;i<p.index;i++)v=fits[0][0]*v+fits[0][1];return String(v);}
 case'page-digits':return String(Array.from({length:p.last},(_,i)=>String(i+1)).join('').length);
 case'sum-previous':return String(p.index===1?p.first:p.first*2**(p.index-2));
 case'arithmetic-count':{let count=0;for(let v=p.first;v<=p.last;v+=p.step)count++;return String(count);}
 case'common-count':{let count=0;for(let v=1;v<=p.limit;v++)if((v-p.b)%p.a===0&&(v-p.d)%p.c===0&&(v-p.b)/p.a>=1&&(v-p.d)/p.c>=1)count++;return String(count);}
 case'square-term':{let square=0;for(let i=0;i<p.index;i++)square+=p.index;return String(square+p.offset);}
 case'two-digit-count':{let count=0;for(let v=10;v<=99;v++)if((v-p.offset)%p.coefficient===0&&(v-p.offset)/p.coefficient>=1)count++;return String(count);}
 default:throw Error('No independent sequence oracle '+k);
 }
}
test('47 individually mapped sequence sources retain explicit rules and have no external-review signature',()=>{assert.equal(data.editions.length,47);assert.equal(new Set(data.editions.map(r=>r.sourceRefs[0].sourceId)).size,47);for(const r of data.editions){assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'awaiting_independent_review');const ref=r.sourceRefs[0];const q=JSON.parse(fs.readFileSync(new URL('../'+ref.sourceFile,import.meta.url),'utf8')).questions.find(q=>q.id===ref.sourceId);assert.ok(q.checked);assert.equal(q.images.length,0);assert.notEqual(q.statement,r.statement);assert.doesNotMatch(r.statement+r.solution,/[\\$]/);if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(v=>v===r.answer).length,1);}}});
for(const row of data.editions)test(row.editionId+' independently recalculated with unambiguous answer and full binding',()=>{assert.equal(row.answer,oracle(row));assert.equal(verifyEdition(row).answer,row.answer);for(const key of['statement','solution'])assert.throws(()=>verifyEdition({...row,[key]:row[key]+' 13'}));assert.throws(()=>verifyEdition({...row,answer:'wrong'}));assert.throws(()=>verifyEdition({...row,params:{...row.params,unreviewedExtra:7}}));});
