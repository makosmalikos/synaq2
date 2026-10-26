import fs from'node:fs';import assert from'node:assert/strict';
import{renderEdition,verifyEdition}from'./collection-word4-models.mjs';
import{wordSpecs}from'./collection-word4-specs.mjs';
import{mathFragments}from'../../frontend/src/mathPresentation.js';
const batch=JSON.parse(fs.readFileSync('problems/editorial/batches/collection-word4-wave19.json','utf8')),rows=batch.editions;assert.equal(rows.length,21);assert.equal(batch.summary.models,19);let nativeFractions=0,tamperRejected=0,missingRejected=0;
function walk(ns){for(const n of ns){if(n.type==='fraction'){nativeFractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){walk(n.fraction.numerator);walk(n.fraction.denominator);}else if(n.type==='text')assert(!/[0-9a-z)|]\s*\/\s*[(−\-0-9a-z|]/i.test(n.value),'Bare mathfraction '+n.value);}}
for(const [i,row]of rows.entries()){
 assert.equal(row.editorialStatus,'draft');assert.equal(row.minimumPlan,'pro');assert.equal(row.sourceRefs[0].sourceId,String(i+1));assert.equal(verifyEdition(row).answer,wordSpecs[i].handExpected);assert.deepEqual(renderEdition(row),Object.fromEntries(['statement','options','answer','solution'].map(k=>[k,row[k]])));
 for(const s of[row.statement,row.solution,row.answer,...row.options]){assert(!/\\(?:frac|dfrac|cdot|times)|\$/.test(s));walk(mathFragments(s));}
 for(const field of['statement','solution','answer','options']){const bad=structuredClone(row);if(field==='options')bad.options[0]+=' [tampered]';else bad[field]+=' [tampered]';assert.throws(()=>verifyEdition(bad));tamperRejected++;}
 for(const key of Object.keys(row.params)){const bad=structuredClone(row);delete bad.params[key];assert.throws(()=>renderEdition(bad));missingRejected++;}
}
const invalid=[['total',10],['majorCount',4],['squareArea',10],['gap',30],['cost',7151],['numerator',8],['first',64],['factor','1'],['specialEach',5],['hours','0'],['upHours','3'],['widthNumerator',4],['widthDecrease',8],['emptySeats',40],['heightPercent',100],['delayMinutes',60],['delayHours',100],['length',541],['firstHours',3],['timeGap',17],['pathFactor','1']];
for(const[i,[key,value]]of invalid.entries()){const bad=structuredClone(rows[i]);bad.params[key]=value;assert.throws(()=>renderEdition(bad));}
assert.equal(rows[8].answer,'3 + ((x − 6)/5) = (x/4)');assert(rows[8].solution.includes('x = 36'));assert(rows[8].statement.includes('ТЕҢДЕУДІ'));
assert.equal(rows[15].answer,'1 сағ 15 мин');assert.equal(rows[16].answer,'5');assert(rows[15].statement.includes('ЕКІНШІ көлік шыққан сәттен'));
assert.equal(rows[17].answer,'18');assert(rows[17].statement.includes('ені 30 см')||rows[17].statement.includes('Ені 30 см'));assert(rows[17].solution.includes('см²'));
console.log(JSON.stringify({authorDraft:true,keys:21,nativeFractions,fullContentTamperRejected:tamperRejected,missingParametersRejected:missingRejected,invalidDomainsRejected:21,sourceSpecificModels:19}));
