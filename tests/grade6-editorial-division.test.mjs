import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-division-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-division.json',import.meta.url))).editions;
const find=kind=>structuredClone(rows.find(q=>q.modelId===`grade6-division-${kind}`));

test('decimal ratios are reduced before a potentially repeating unit is explained',()=>{
 const q=find('decimal-ratio-smaller');assert.equal(q.answer,'34');assert.match(q.solution,/85 : 5 = 17/);verifyEdition(q);
});
test('fractional lengths and ordered answers remain exact rather than rounded',()=>{
 const q=find('fractional-share');assert.equal(q.answer,'22/5');assert.ok(q.options.includes('11/3'));assert.ok(!q.options.some(s=>s.includes('3,666')));
 const wire=find('fraction-ratio-tuple');assert.equal(wire.answer,'(30; 18)');assert.ok(wire.options.includes('(18; 30)'));verifyEdition(wire);
});
test('limiting resource uses both inventories and preserves exact decimal result',()=>{
 const q=find('limiting-mixture');assert.equal(q.answer,'9,1');assert.match(q.solution,/5,2 және 3,9/);verifyEdition(q);
});
test('unmatched middle terms require scaling both saved ratios through their LCM',()=>{
 const q=find('chain-unmatched-share');assert.equal(q.answer,'80');assert.match(q.solution,/3 есе, екінші қатынасты 2 есе/);verifyEdition(q);
 q.params.second=[2,5];assert.throws(()=>renderEdition(q),/Both pairs must require scaling/);
});
test('nonexistent triangles and inconsistent age evolution cannot become questions',()=>{
 const triangle=find('triangle-tuple');triangle.params.weights=[1,2,4];assert.throws(()=>renderEdition(triangle),/Triangle must exist/);
 const ages=find('ages-changing-ratio');ages.params.before=[3,1];ages.params.after=[5,1];assert.throws(()=>renderEdition(ages));
});
test('an interval with several possible class sizes is rejected',()=>{
 const q=find('bounded-class-size');q.params.lowerExclusive=20;q.params.upperExclusive=42;assert.throws(()=>renderEdition(q),/unique class size/);
});
test('indivisible children and reversed named target cannot pass author binding',()=>{
 const q=structuredClone(rows.find(q=>q.params.context==='class'));q.params.total=31;assert.throws(()=>renderEdition(q),/integer is required/);
 q.params.total=32;q.params.target=0;assert.throws(()=>renderEdition(q));
});
test('condition, answer, explanation and choice changes invalidate a reviewed edition',()=>{
 for(const field of ['statement','answer','solution','options']){
  const q=find('total-tuple');if(field==='options')q.options.reverse();else q[field]+=' changed';assert.throws(()=>verifyEdition(q));
 }
});
