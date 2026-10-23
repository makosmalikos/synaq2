import fs from 'node:fs';
import {renderEdition} from './core-models.mjs';
import {zerekCourseExpansionQuestions as expansion} from '../../frontend/src/zerekCourseExpansionQuestions.js';
import {zerekCourseQuestions as base} from '../../frontend/src/zerekCourseQuestions.js';
import {zerekImportedQuestions as collections} from '../../frontend/src/zerekImportedQuestions.js';
const sources=[...expansion.map(q=>[q,'frontend/src/zerekCourseExpansionQuestions.js']),...base.map(q=>[q,'frontend/src/zerekCourseQuestions.js']),...collections.map(q=>[q,'frontend/src/zerekImportedQuestions.js'])];
const specs=[
 ['equal-rows',5,'num','medium',{students:36},'4d54fde5b3414c5c'],
 ['identical-kits',5,'num','medium',{cards:48,stickers:72},'aca08380eb5a2c3a'],
 ['synchronised-lights',5,'num','medium',{first:12,second:18},'eb9a6c817007aa30'],
 ['minimum-shuttles',4,'num','medium',{people:74,seats:9},'d369920e5c98482d'],
 ['place-value-code',4,'num','basic',{thousands:6,hundreds:4,tens:3,ones:8},'0be36aa6c2c614ed'],
 ['round-visitors',4,'num','basic',{count:57650,unit:1000},'2c2369403838ce24'],
 ['digit-divisible-nine',5,'num','medium',{prefix:34,suffix:5},'35893ab0e1ae9754'],
 ['smallest-prime-code',5,'num','basic',{lo:70,hi:80},'974732f32d20b66e'],
 ['digit-sum-pins',5,'comb','hard',{digits:4,total:3},'a39a6e8ed3773cc6'],
 ['fixed-fee-packs',4,'eq','medium',{packs:6,fee:350,total:2210},'89c7df74f9d9d0b6'],
 ['balance-two-sides',6,'eq','medium',{leftCoefficient:5,leftConstant:14,rightCoefficient:3,rightConstant:42},'4aad7a8c53b157a9'],
 ['strict-capacity',6,'sys','medium',{fixed:8,each:3,cap:44},'f66cf8f92a5c132c'],
 ['temperature-changes',6,'num','basic',{start:-9,rise:14,drop:6},'be08524b50364efb'],
 ['coordinate-distance',6,'num','basic',{a:-8,b:5},'3c6d2b1a7611f905'],
 ['bounded-multiples',5,'sets','medium',{lo:12,hi:27,divisor:3},'6cf772c695b595c4'],
 ['increasing-display',4,'seq','medium',{first:7,step:4,index:9},'8c3b2dc6deb0bffb'],
 ['median-odd',6,'stats','basic',{values:[12,19,8,15,22,10,17]},'0d70753e3eb6b08b'],
 ['median-even',6,'stats','medium',{values:[21,15,18,12,24,30]},'0d70753e3eb6b08b'],
 ['unique-mode',6,'stats','basic',{values:[3,1,3,2,4,3,1]},'4ace784e6149e961'],
 ['measurement-range',6,'stats','basic',{values:[18,24,21,30,16]},'890237c50f880110'],
 ['voucher-combinations',5,'comb','hard',{values:[80,120,200],total:600},'07133becf5b9b990'],
 ['poster-product',4,'comb','medium',{backgrounds:3,fonts:4,icons:2},'d6dd919268dd4403'],
 ['weighted-average',6,'stats','medium',{values:[6,10],counts:[2,3]},'2b7337dec1a7b193'],
 ['distinct-pairs',5,'comb','medium',{members:9},'zerek_14930a2d-fe09-4297-8fa1-f1039923dd16_37'],
];
const rows=specs.map(([modelId,grade,topic,difficulty,params,sourceId])=>{
 const found=sources.find(([q])=>(q.sourceContentId||q.id)===sourceId);if(!found)throw Error('Unknown source reference '+sourceId);
 const row={editionId:'core-'+modelId,modelId,grade,topic,difficulty,params,sourceRefs:[{sourceId,sourceFile:found[1]}],adaptationChanges:['Condition and requested quantity written for a new classroom setting or an explicit mathematical task.','Numerical givens and solution recomputed independently; original answer/solution not used as a generator.'],relationToSource:'Curriculum skill reference; this edition does not claim to be a literal numeric variant of the source.'};
 return {...row,...renderEdition(row)};
});
fs.writeFileSync('problems/editorial/synaq-standard-core.json',JSON.stringify(rows,null,2)+'\n');
console.log('Prepared '+rows.length+' distinct core editions for independent editorial review.');
