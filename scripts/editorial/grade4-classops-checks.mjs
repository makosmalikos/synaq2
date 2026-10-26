import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-classops-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-classops-wave11.json',import.meta.url),'utf8')).editions;
const expected=['100000000','700000','65000','999 999 999','8306','96 000 − 16 000','Шұғылада: 150 адамға көп','8000902','102345678','987 654 321','<','853 000 − 1 000 + 1','374','64 400','799 999 999','980 089','54 690','148','987 653 214','900000','1','350','12'];
assert.equal(rows.length,expected.length);let mutations=0;
for(const[rowIndex,row]of rows.entries()){
 assert.equal(row.answer,expected[rowIndex],row.editionId);assert.equal(verifyEdition(row).answer,row.answer);assert.equal(row.grade,4);assert.equal(row.minimumPlan,'pro');assert.equal(row.editorialStatus,'draft');
 for(const field of ['statement','answer','solution']){const changed=structuredClone(row);changed[field]+=' өзгеріс';assert.throws(()=>verifyEdition(changed));mutations++;}
 if(row.options){const changed=structuredClone(row);changed.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(changed));mutations++;}
 const changed=structuredClone(row);function mutate(value){for(const key of Object.keys(value)){if(typeof value[key]==='number'){value[key]++;return true;}if(value[key]&&typeof value[key]==='object'&&mutate(value[key]))return true;}return false;}
 assert(mutate(changed.params));assert.throws(()=>verifyEdition(changed));mutations++;
}
const find=kind=>rows.find(r=>r.modelId===`grade4-classops-${kind}`);
// Different finite representation: enumerate letter assignments, not model input numbers.
const four=[],unbounded=[];for(let a=1;a<=9;a++)for(let b=0;b<=9;b++)for(let c=0;c<=9;c++)for(let d=1;d<=9;d++)if(new Set([a,b,c,d]).size===4&&6*(100*a+10*b+c)===1100*d+11*c){const n=100*a+10*b+c;unbounded.push(n);if(n<500)four.push(n);}
assert.deepEqual(unbounded,[374,924]);assert.deepEqual(four,[Number(find('four-letter-cryptarithm').answer)]);
const triple=[];for(let a=1;a<=9;a++)for(let b=0;b<=9;b++)for(let c=1;c<=9;c++)if(new Set([a,b,c]).size===3&&6*(100*a+10*b+c)===111*c)triple.push(100*a+10*b+c);
assert.deepEqual(triple,[Number(find('three-letter-cryptarithm').answer)]);
const prefixed=[];for(let a=1;a<=9;a++)for(let b=0;b<=9;b++)for(let c=1;c<=9;c++)if(new Set([a,b,c]).size===3&&7*(10*a+b)===100*c+10*a+b)prefixed.push(100*c+10*a+b);
assert.deepEqual(prefixed,[Number(find('prefix-cryptarithm').answer)]);
const withDigitSum=[];for(let i=0;i<9;i++)for(let j=i;j<9;j++){const ds=Array(9).fill(9);ds[i]--;ds[j]--;const n=Number(ds.join(''));assert.equal(ds.reduce((a,b)=>a+b),79);withDigitSum.push(n);}
assert.equal(Math.min(...withDigitSum),Number(find('minimum-digit-sum').answer.replaceAll(' ','')));
const possibleSub=[];for(let d=0;d<10;d++){const difference=28034+100*d,sub=83624-difference;if(Math.floor(sub/100)%10===6&&sub%10===0)possibleSub.push(sub);}
assert.deepEqual(possibleSub,[Number(find('missing-subtrahend').answer.replaceAll(' ',''))]);
const sequence=[];for(let n=210012;n<1000000;n+=110011)sequence.push(n);assert.equal(sequence.at(-1),Number(find('last-fixed-length-term').answer.replaceAll(' ','')));
const decreasing=[];for(let n=18400;n>=14000;n-=400)decreasing.push(n);assert.equal(decreasing.at(-1),14000);assert.equal(decreasing.length,Number(find('descending-term-index').answer));
assert.equal(6600-3190-3260,150);assert.equal(68400-2000-2000,64400);assert.equal(853000-999,852001);
const invalid=[['four-letter-cryptarithm',{upperExclusive:1000}],['three-letter-cryptarithm',{multiplier:7}],['prefix-cryptarithm',{multiplier:5}],['digit-boundary',{digits:10}],['distinct-boundary',{digits:10}],['subtract-near-thousand',{start:853001}],['descending-term-index',{target:14001}],['minimum-digit-sum',{sum:82}],['missing-subtrahend',{differencePattern:'28??4'}]];
for(const[kind,patch]of invalid){const row=structuredClone(find(kind));Object.assign(row.params,patch);assert.throws(()=>renderEdition(row),kind);}
console.log(JSON.stringify({editions:rows.length,fixtureAnswers:expected.length,exhaustiveLetterDomains:3,finiteNumericDomains:4,rejectedMutations:mutations,rejectedInvalidDomains:invalid.length,status:'passed',independentEditorialReview:'pending'}));
