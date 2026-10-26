import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as core from './grade4-core-models.mjs';
import * as arithmetic from './grade4-arithmetic-models.mjs';
import * as equations from './grade4-equation-models.mjs';
import * as special from './grade4-special-models.mjs';
import * as remainders from './grade4-remainder-models.mjs';
import * as rounding from './grade4-rounding-models.mjs';
import * as units from './grade4-unit-models.mjs';

// Local calculation/representation regression checks, not an editorial review
// signature and not a claim that numeric exercises are distinct semantic tasks.
const batches=[
  ['grade4-core-wave1.json',core,43],['grade4-arithmetic-wave2.json',arithmetic,156],
  ['grade4-equations-wave3.json',equations,76],['grade4-patterns-wave4.json',special,1],
  ['grade4-remainders-wave5.json',remainders,24],['grade4-rounding-wave6.json',rounding,23],
  ['grade4-units-wave7.json',units,52],
];
const all=[],refs=new Set();
for(const [name,module,count]of batches){
  const rows=JSON.parse(fs.readFileSync(new URL(`../../problems/editorial/batches/${name}`,import.meta.url),'utf8')).editions;
  assert.equal(rows.length,count);
  for(const row of rows){
    assert.equal(module.verifyEdition(row).answer,row.answer);all.push(row);
    for(const text of [row.statement,row.solution,...(row.options||[])])assert(!/\$|\\(?:frac|cdot|times)|<[^>]+>/.test(text),`${row.editionId} is not native text`);
    for(const ref of row.sourceRefs){const key=`${ref.sourceFile}:${ref.sourceId}`;assert(!refs.has(key),'A source was adapted twice within these batches');refs.add(key);}
  }
  for(const field of ['answer','statement','solution']){
    const changed=structuredClone(rows[0]);changed[field]+=' changed';assert.throws(()=>module.verifyEdition(changed));
  }
}
assert.equal(all.length,375);assert.equal(new Set(all.map(q=>q.editionId)).size,375);
assert.throws(()=>arithmetic.calculate({op:'/',left:{value:5},right:{value:0}}));
assert.throws(()=>arithmetic.parseSourceExpression('1-2'));
assert.throws(()=>equations.solveEquation({op:'*',left:{variable:'x'},right:{value:0}},{value:0}));
assert.equal(rounding.halfUp(2449,100),2400);
assert.equal(rounding.halfUp(2450,100),2500);
assert.equal(rounding.halfUp(2549,100),2500);
assert.equal(rounding.halfUp(2550,100),2600);
assert.throws(()=>rounding.renderEdition({grade:4,modelId:'grade4-rounding-choice',params:{unit:100,target:6400,candidates:[6371,6380,6450,6307]}}));
assert.throws(()=>remainders.renderEdition({grade:4,modelId:'grade4-hidden-division-digit',params:{template:'?8',scale:1000,divisor:700,target:'digit'}}));
assert.throws(()=>remainders.renderEdition({grade:4,modelId:'grade4-remainder-under-factor-divisor',params:{firstDivisor:448,nextDivisor:100,remainder:173}}));
const efficient=all.find(q=>q.params.efficient);assert(efficient);
const changedProof=structuredClone(efficient);changedProof.params.efficient.proofExpressions[0]='1';assert.throws(()=>arithmetic.verifyEdition(changedProof));
assert.throws(()=>units.renderEdition({grade:4,modelId:'grade4-measurement-conversion',params:{from:[{value:1,unit:'kg'}],target:'cm3'}}));
assert.throws(()=>units.renderEdition({grade:4,modelId:'grade4-measurement-conversion',params:{from:[{value:1,unit:'year'}],target:'day'}}));
assert.throws(()=>units.renderEdition({grade:4,modelId:'grade4-fraction-of-time-unit',params:{from:'hour',numerator:1,denominator:7,target:'minute'}}));
console.log(JSON.stringify({editionsChecked:all.length,uniqueSourceRefs:refs.size,batches:batches.length,textAndAnswerMutationChecks:21,negativeDomainCases:10,roundingBoundaryCases:4,passed:true}));
