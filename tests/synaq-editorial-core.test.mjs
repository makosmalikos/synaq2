import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyEdition,CORE_MODEL_IDS} from '../scripts/editorial/core-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../problems/editorial/synaq-standard-core.json',import.meta.url)));
// Independent, fixed answers for the authored conditions. Enumeration and inverse
// checks below deliberately do not call the model generator to compute the oracle.
const expected=['9','24','36','9','6438','58000','6','71','10','310','14','11','-1','13','5','39','15','19.5','3','14','7','24','8.4','36'];
test('24 different authored models have checked keys and bound conditions/solutions',()=>{
 assert.equal(rows.length,24);assert.equal(new Set(rows.map(r=>r.modelId)).size,24);
 assert.deepEqual(new Set(rows.map(r=>r.modelId)),new Set(CORE_MODEL_IDS));
 assert.deepEqual(rows.map(r=>r.answer),expected);
 for(const row of rows){assert.equal(verifyEdition(row).answer,row.answer);assert.ok(row.statement.length>65);assert.ok(row.solution.length>60);assert.ok(row.sourceRefs.length);}
});
test('independent enumeration and substitution verify the new scenarios',()=>{
 const at=id=>rows.find(r=>r.modelId===id),num=id=>Number(at(id).answer);
 assert.equal(Array.from({length:36},(_,i)=>i+1).filter(n=>Number.isInteger(36/n)).length,num('equal-rows'));
 const kits=num('identical-kits');assert.equal(48%kits,0);assert.equal(72%kits,0);for(let n=kits+1;n<=48;n++)assert.ok(48%n!==0||72%n!==0);
 const t=num('synchronised-lights');assert.equal(t%12,0);assert.equal(t%18,0);for(let n=1;n<t;n++)assert.ok(n%12!==0||n%18!==0);
 const vans=num('minimum-shuttles');assert.ok(vans*9>=74);assert.ok((vans-1)*9<74);
 let pins=0;for(let a=1;a<=9;a++)for(let b=0;b<=9;b++)for(let c=0;c<=9;c++)for(let d=0;d<=9;d++)if(a+b+c+d===3)pins++;
 assert.equal(pins,num('digit-sum-pins'));
 const x=num('balance-two-sides');assert.equal(5*x+14,3*x+42);
 const fee=num('fixed-fee-packs');assert.equal(6*fee+350,2210);
 const cap=num('strict-capacity');assert.ok(8+cap*3<44);assert.ok(8+(cap+1)*3>=44);
 let vouchers=0;for(let a=0;a<=7;a++)for(let b=0;b<=5;b++)for(let c=0;c<=3;c++)if(80*a+120*b+200*c===600)vouchers++;
 assert.equal(vouchers,num('voucher-combinations'));
 let pairs=0;for(let a=0;a<9;a++)for(let b=a+1;b<9;b++)pairs++;assert.equal(pairs,num('distinct-pairs'));
 assert.equal(num('weighted-average')*5,6+6+10+10+10);
});
test('a changed condition, stale solution or altered answer cannot pass the publication checker',()=>{
 for(const row of rows){
  assert.throws(()=>verifyEdition({...row,statement:row.statement+' Бұдан басқа шарт.'}));
  assert.throws(()=>verifyEdition({...row,solution:'Ескі жауап.'}));
  assert.throws(()=>verifyEdition({...row,answer:String(Number(row.answer)+1)}));
 }
});
