// Author-side regression checks only. This does NOT create independent review signatures.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition,setTesting} from './grade4-set-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-sets-wave8.json',import.meta.url))).editions;
const refs=new Set();
for(const row of rows){
 assert.equal(row.grade,4);assert.equal(row.sourceRefs.length,1);assert(!refs.has(row.sourceRefs[0].sourceId));refs.add(row.sourceRefs[0].sourceId);
 assert.equal(verifyEdition(row).answer,row.answer);
 assert(!/[<$\\]|△/.test(row.statement),'Native notation only; unexplained symmetric-difference symbol is excluded');
 for(const key of ['answer','statement','solution']){const changed=structuredClone(row);changed[key]+=' changed';assert.throws(()=>verifyEdition(changed));}
}
// An independent per-atom boolean membership oracle, rather than the model's array operations.
let concreteExpressions=0;
function member(tree,sets,atom){if(typeof tree==='string')return sets[tree].includes(atom);if(!Array.isArray(tree))return tree.literal.includes(atom);const [op,l,r]=tree,a=member(l,sets,atom),b=member(r,sets,atom);return op==='union'?a||b:op==='intersect'?a&&b:op==='difference'?a&&!b:op==='xor'?a!==b:assert.fail(op);}
for(const row of rows.filter(r=>r.modelId==='grade4-set-evaluate')){
 const p=row.params,universe=[...new Set(Object.values(p.sets).flat())],actual=universe.filter(x=>member(p.expression,p.sets,x));
 if(p.ask==='count')assert.equal(row.answer,String(actual.length));
 if(p.ask==='sum')assert.equal(row.answer,String(actual.reduce((a,b)=>a+b,0)));
 if(p.ask==='set'){const parse=text=>text==='∅'?[]:text.slice(1,-1).split('; ').map(v=>/^\d+$/.test(v)?Number(v):v);assert(setTesting.eq(parse(row.answer),actual));}
 if(p.ask==='member')assert.deepEqual(actual,[Number(row.answer)]);
 concreteExpressions++;
}
const bySource=new Map(rows.map(r=>[r.sourceRefs[0].sourceId,r]));
assert.equal(bySource.get('36d8d0b303582e72').answer,'10'); // 5 choose2, not ordered pairs20.
assert.equal(bySource.get('9c6ce811348dc948').answer,'16'); // Includes empty/self.
assert.equal(bySource.get('545f19fafa9ed182').answer,'16'); // Fixed included element, 4 optional.
assert.equal(bySource.get('cb009ffdaf572b3a').answer,'13'); // Pair totals include all-three2.
assert.equal(bySource.get('bc7029a1873fe9a7').answer,'22');
assert.equal(bySource.get('1279fc3500f9f041').answer,'4');
assert.equal(bySource.get('d3d07435b52e9f10').answer,'9');
assert.equal(bySource.get('a098e29e14c328cd').answer,'{0; 3; 6; 8}'); // Zero is a set element.
const ambiguous=structuredClone(bySource.get('fc765d81a9b706b1'));ambiguous.params.optionSets[1]=ambiguous.params.optionSets[0].slice().reverse();assert.throws(()=>renderEdition(ambiguous));
const impossible=structuredClone(bySource.get('cb009ffdaf572b3a'));impossible.params.regions[3]=-1;assert.throws(()=>renderEdition(impossible));
const inconsistent=structuredClone(bySource.get('bc7029a1873fe9a7'));inconsistent.params.total=99;assert.throws(()=>renderEdition(inconsistent));
const oversize=structuredClone(bySource.get('f78168332a9d38e5'));oversize.params.a=oversize.params.total+1;assert.throws(()=>renderEdition(oversize));
const badUnknown=structuredClone(bySource.get('e47918ab18c890a9'));badUnknown.params.intersection=[999];assert.throws(()=>renderEdition(badUnknown));
console.log(JSON.stringify({editions:rows.length,uniqueSourceRefs:refs.size,concreteExpressions,textAndAnswerMutationChecks:rows.length*3,negativeConstraintChecks:5,passed:true,independentReview:false}));
