import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync, readFileSync } from 'node:fs';
import { petStage } from '../frontend/src/pets.js';
import { petEvolution } from '../frontend/src/petEvolution.js';

test('all species evolve through the existing XP thresholds without consuming XP',()=>{
 for(const id of ['owl','fox','panda','lion','penguin','koala']){
   for(const [xp,expected] of [[0,1],[99,1],[100,2],[499,2],[500,3],[1499,3],[1500,4],[3999,4],[4000,5]]){
     const stage=petStage(xp),visual=petEvolution(id,stage.stage,stage.progress);
     assert.equal(visual.stage,expected);assert.equal(visual.pet,id);assert.equal(visual.legend,expected===5);
     for(const asset of [visual.image,visual.smallImage]){
       const path=new URL(`../frontend/public${asset}`,import.meta.url),data=readFileSync(path);
       assert.equal(data.subarray(8,12).toString(),'WEBP');
       assert.ok(statSync(path).size<85000);
     }
   }
 }
 assert.equal(petEvolution('invalid',4).pet,'owl');
 assert.equal(petEvolution('fox',1,.8).hatching,true);
 assert.equal(petEvolution('fox',2,.8).hatching,false);
 assert.notEqual(petEvolution('fox',2).image,petEvolution('fox',4).image);
});
