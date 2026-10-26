import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {verifyEdition} from '../scripts/editorial/grade5-natural-models.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade5-natural.json',import.meta.url),'utf8'));
const sumDigits=n=>[...String(n)].reduce((a,c)=>a+ +c,0);
const words=new Map([[620050,'алты жүз жиырма мың елу'],[6020900,'алты миллион жиырма мың тоғыз жүз'],[3200061,'үш миллион екі жүз мың алпыс бір'],[4025000700,'төрт миллиард жиырма бес миллион жеті жүз'],[240070060,'екі жүз қырық миллион жетпіс мың алпыс']]);
// Independent oracle. Does not call a producer render or consume source answers.
function oracle(r){const p=r.params,k=r.modelId.replace('grade5-natural-','');switch(k){
 case'word-number':assert.ok(r.statement.includes('«'+words.get(p.number)+'»'));return String(p.number);
 case'digit-value':return String(+String(p.number).at(-1-p.place)*Number('1'+'0'.repeat(p.place)));
 case'digit-at':return String(p.number).at(-1-p.place);
 case'choose-place':return String(p.numbers.find(n=>+String(n).at(-1-p.place)===p.digit));
 case'max-digits':return'9'.repeat(p.digits);
 case'successor':return String(BigInt(p.number)+1n);
 case'predecessor':return String(BigInt(p.number)-1n);
 case'first-natural':return String([...p.candidates].filter(n=>n>0).sort((a,b)=>a-b)[0]);
 case'min-digits':return'1'+'0'.repeat(p.digits-1);
 case'decimal-symbols':return String(new Set('0123456789').size);
 case'thousands-class':return String(Number(String(p.number).slice(-6,-3)));
 case'non-natural':return String(p.candidates.filter(n=>n<=0)[0]);
 case'zero-count':return String(String(p.number).split('0').length-1);
 case'expanded-number':{let total=0;for(const[c,v]of p.terms)for(let i=0;i<c;i++)total+=v;return String(total);}
 case'extreme-distinct':{let best=p.maximum?-Infinity:Infinity;function walk(s){if(s.length===p.digits){best=p.maximum?Math.max(best,+s):Math.min(best,+s);return;}for(let d=0;d<=9;d++)if((s||d!==0)&&!s.includes(String(d)))walk(s+d);}walk('');return String(best);}
 case'total-tens':return String((BigInt(p.number)-BigInt(p.number%10))/10n);
 case'read-number':return words.get(p.number);
 case'permutation-range':{const possible=[];for(let n=100;n<=999;n++)if(String(n).split('').sort().join('')===p.digits.slice().sort().join(''))possible.push(n);return String(possible.at(-1)-possible[0]);}
 case'place-ratio':{const t=String(p.number),left=t.indexOf(String(p.digit)),right=t.lastIndexOf(String(p.digit));let n=1;for(let i=left;i<right;i++)n*=10;return String(n);}
 case'max-digit-sum':{let n=10**p.digits-1;while(sumDigits(n)!==p.sum)n--;return String(n);}
 case'page-digits':{const digits=Array.from({length:p.last},(_,i)=>String(i+1)).join('');return String(digits.length);}
 case'expansion-choice':{const terms=r.options.filter(s=>s.split(' + ').reduce((a,t)=>a+t.split(' × ').map(Number).reduce((x,y)=>x*y),0)===p.number);assert.equal(terms.length,1);return terms[0];}
 case'digit-length-count':{let n=0;for(let i=10**(p.digits-1);i<10**p.digits;i++)n++;return String(n);}
 case'min-digit-sum':{let n=1;while(sumDigits(n)!==p.sum)n++;return String(n);}
 case'digit-frequency':return String(Array.from({length:p.last-p.first+1},(_,i)=>String(i+p.first)).join('').split(String(p.digit)).length-1);
 case'append-zero':{for(let n=10;n<100;n++)if(Number(String(n)+'0')-n===p.increase)return String(n);throw Error('No code');}
 case'odd-digit-count':{let count=0;for(let n=10**(p.length-1);n<10**p.length;n++)if([...String(n)].every(d=>Number(d)%2===1))count++;return String(count);}
 case'count-digit-sum':{let count=0;function walk(pos,sum,first){if(pos===p.length){if(sum===p.sum)count++;return;}for(let d=first?1:0;d<=9;d++)if(sum+d<=p.sum)walk(pos+1,sum+d,false);}walk(0,0,true);return String(count);}
 case'hundreds-code':{for(let n=1000;n<10000;n++)if(Math.floor(n/100)===p.hundreds&&+String(n)[2]===p.tens&&+String(n)[3]-p.tens===p.extra)return String(n);throw Error('No constrained code');}
 case'page-inverse':{let count=0;for(let n=1;n<=999;n++){count+=String(n).length;if(count===p.digitTotal)return String(n);}throw Error('No page count');}
 case'repeated-class':return String(BigInt(String(p.block).repeat(2))/BigInt(p.block));
 case'digit-stream':{let remaining=p.position;for(let n=1;;n++){for(const d of String(n)){remaining--;if(!remaining)return d;}}}
 case'predecessor-sum':{const before=String(BigInt(p.number)-1n);return String([...before].map(Number).reduce((a,b)=>a+b));}
 case'extreme-sum':return String(BigInt('1'+'0'.repeat(p.digits-1))+BigInt('9'.repeat(p.digits)));
 case'count-digit-product':{let count=0;function walk(pos,product){if(pos===p.length){if(product===p.product)count++;return;}for(let d=1;d<=9;d++)if(p.product%(product*d)===0)walk(pos+1,product*d);}walk(0,1);return String(count);}
 case'linked-digits':{let found;for(let n=1000;n<10000;n++){const[t,h,e,u]=String(n).split('').map(Number);if(t===p.thousands&&h===t*p.multiplier&&e===h-t&&u===p.units){assert.equal(found,undefined);found=n;}}return String(found);}
 default:throw Error('No independent oracle '+k);
}}
test('all47 real nonvisual topic1.1 sources receive separate authored rows, never a review signature',()=>{assert.equal(data.editions.length,47);assert.equal(new Set(data.editions.map(r=>r.editionId)).size,47);const sources=new Set();for(const r of data.editions){assert.equal(r.grade,5);assert.equal(r.editorialStatus,'awaiting_independent_review');assert.equal(r.minimumPlan,'pro');for(const ref of r.sourceRefs){assert.ok(!sources.has(ref.sourceId));sources.add(ref.sourceId);const archive=JSON.parse(fs.readFileSync(new URL('../'+ref.sourceFile,import.meta.url),'utf8'));const source=archive.questions.find(q=>q.id===ref.sourceId);assert.ok(source.checked);assert.equal(source.images.length,0);assert.notEqual(source.statement,r.statement);}if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(a=>a===r.answer).length,1);}}});
for(const row of data.editions)test(row.editionId+' independently recalculated and text-bound',()=>{const expected=oracle(row);assert.equal(row.answer,expected);assert.equal(verifyEdition(row).answer,expected);for(const field of ['statement','solution'])assert.throws(()=>verifyEdition({...row,[field]:row[field]+' 9'}));assert.throws(()=>verifyEdition({...row,answer:'wrong'}));const changed=structuredClone(row);changed.params={...changed.params,unreviewedExtra:12};assert.throws(()=>verifyEdition(changed));});
