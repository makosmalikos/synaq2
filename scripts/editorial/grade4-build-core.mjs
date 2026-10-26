import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {renderEdition,verifyEdition,modelIds} from './grade4-core-models.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const specs=[
  ['joined-ribbons','1-1','fc1e3f6a6ea14afe','num','easy',{firstM:3,firstCm:28,secondM:2,secondCm:67}],
  ['quarter-hour-finish','1-10','a312b350b278c653','num','medium',{hour:14,afterMinutes:20}],
  ['banknote-change','1-11','f8d2d6ba4c5d805f','num','medium',{total:18000,large:10000,small:2000}],
  ['euro-cent-change','1-12','6d1a73da43ddb42e','num','medium',{firstEuro:3,firstCent:75,secondEuro:2,secondCent:60,paidEuro:10}],
  ['place-value-assembly','1-2','ec4232667e0aff3f','num','easy',{thousands:40,hundreds:3,ones:8}],
  ['digit-contribution','1-3','895497af40ea6690','num','easy',{number:274806391,digit:7}],
  ['checkpoint-sequence','1-4','8c3b2dc6deb0bffb','seq','medium',{start:20420,step:1200,position:6},2],
  ['extreme-codes-zero','1-5','573fe2d7f165c2fa','num','hard',{digits:[0,2,6,8]}],
  ['mixed-freight-mass','1-6','fe097f3baabedb48','num','easy',{tonnes:6,centners:5}],
  ['cube-wire-frame','1-7','3fbf213e977cd299','spat','medium',{edge:7}],
  ['park-area-remainder','1-8','ed19efc458dc35fb','geo','medium',{squareKm:3,reservedM2:180000}],
  ['sum-of-squares','1-9','98687ffaf89ab2ee','num','easy',{small:7,large:70}],
  ['product-comparison-gap','2-1','3392bcb064efc0d0','num','medium',{factor:26104,times:3,reference:78300}],
  ['zero-quotient-packages','2-2','0a8ca9895d689cf8','num','medium',{items:72024,groups:6}],
  ['divisible-code-extremum','2-3','51150c0a45cb3d51','num','hard',{digits:[4,2,6,0]}],
  ['thousand-sheet-order','2-4','8838011ef7d1634f','num','easy',{bundles:26,used:500}],
  ['complete-hundreds-reconstruction','2-5','97cc7c5eccfa817c','num','medium',{full:47,remainder:23}],
  ['multiple-ticket-count','2-6','6cf772c695b595c4','sets','medium',{lower:24,upper:84,multiple:6}],
  ['ski-trip-with-rest','3-1','acef4c2ad6544365','work','medium',{speed:6,distance:18,rest:30}],
  ['three-speed-gap','3-2','d606f37a8a1b5e3d','work','hard',{kmHour:54,metresSecond:14,metresMinute:960}],
  ['union-of-word-letters','3-3','5758bac210671cfe','sets','medium',{first:'ҚАЗЫНА',second:'ЗАМАН'}],
  ['cubic-container-volume','4-1','9be87b4267e9b0e2','spat','medium',{edge:4}],
  ['free-floor-area','4-2','631b83be7a42c0b0','geo','medium',{length:12,width:7,carpetLength:4,carpetWidth:2}],
  ['adjacent-square-posters','4-3','614821fc5eb462d1','geo','medium',{count:4,side:7}],
  ['three-level-packing','5-1','50fde1419d0dfde2','num','medium',{trays:18,boxes:5,items:24}],
  ['triple-digit-unknown-factor','5-10','dc799dcf10cf1d1d','eq','medium',{each:216,total:19656}],
  ['production-equal-distribution','5-11','95cfb8e8a71b90a2','work','hard',{daily:168,days:125,destinations:75},2],
  ['tens-package-division','5-2','c7cf6cd423be4e45','num','medium',{total:7200,capacity:90}],
  ['daily-stock-remainder','5-3','680091af8b4f721b','num','medium',{daily:1280,days:20,shipped:9600},2],
  ['equal-budget-price-count','5-4','fb29d93dd96c6816','num','hard',{budget:7200,firstPrice:120,secondPrice:90},2],
  ['full-seats-total','5-5','a02434d81899c58c','num','easy',{rows:24,seats:18}],
  ['three-digit-quotient-selection','5-6','c2afb9be6382ef17','num','medium',{pairs:[[8640,72],[5796,84],[4216,68]]}],
  ['full-crates-remainder','5-7','b74e5399b8b7d295','num','medium',{total:1019,capacity:42}],
  ['unit-price-repeat-purchase','5-8','537b4a01345ee74c','num','medium',{count:28,total:14280,wanted:6},2],
  ['three-digit-product','5-9','3e4a5fe8abd21a33','num','medium',{first:406,second:213}],
  ['productivity-comparison-gap','6-1','e762b27b32d91c80','work','medium',{firstMinutes:6,firstItems:54,secondMinutes:8,secondItems:64}],
  ['parallel-printer-time','6-2','4f18343853bad0fd','work','medium',{firstRate:18,secondRate:22,total:600}],
  ['shared-unit-price','6-3','3e61e439444e39dc','num','medium',{firstCount:7,secondCount:5,total:9600}],
  ['equal-speed-time-difference','6-4','dae5c16da06a07b0','work','hard',{longer:7,shorter:4,extraDistance:195}],
  ['closing-route-length','6-5','b0a8c90b83edc9a3','work','medium',{firstSpeed:12,secondSpeed:15,time:3}],
  ['bracket-equation','6-6','f70c4ec25767d9c8','eq','medium',{addend:35,factor:6,product:540}],
  ['separation-rate-from-distance','6-7','ff3d071ac68beab7','work','medium',{distance:840,hours:4}],
  ['meeting-unknown-speed','6-8','57cda2912696cc1a','work','hard',{distance:156,time:6,firstSpeed:11}],
];

const editions=specs.map(([slug,unit,sourceId,topic,difficulty,params,level=1])=>{
  const sourceFile=`problems/sources/zerek/courses/4-math-${unit}-level${level}.json`;
  const capture=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));
  assert.equal(capture.status,'captured');
  const source=capture.questions.find(q=>q.id===sourceId);
  assert(source&&source.checked,`Missing checked source ${sourceId}`);
  assert(!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'),'Visual source requires a different editorial workflow');
  const row={
    editionId:`grade4-core-${slug}`,modelId:`grade4-${slug}`,grade:4,topic,difficulty,params,
    sourceRefs:[{sourceFile,sourceId}],
    adaptationChanges:[
      'Жаңа қазақша шарт жазылды; бастапқы мәтін мен дайын шешім көшірілген жоқ.',
      'Деректер мен сұралған шама осы редакция үшін таңдалып, жауап жаңа деректерден қайта есептелді.',
      'Сурет қажет емес: барлық сан, өлшем бірлігі және байланыс шарттың өзінде берілген.'
    ],
    relationToSource:'Grade-4 curriculum skill reference. This is an authored edition, not a claim to reproduce the original exercise.',
    editorialStatus:'draft',reviewStatus:'awaiting_independent_review',
  };
  const rendered=renderEdition(row);
  Object.assign(row,{statement:rendered.statement,answer:rendered.answer,solution:rendered.solution});
  if(rendered.options)row.options=rendered.options;
  const checked=verifyEdition(row);
  row.calculationVerification={method:'exact_integer_model_with_givens_binding',checks:checked.checks};
  return row;
});
assert.equal(editions.length,43);
assert.equal(new Set(editions.map(q=>q.modelId)).size,modelIds.length);
assert.equal(new Set(editions.map(q=>q.sourceRefs[0].sourceId)).size,editions.length);
const target=path.join(root,'problems/editorial/batches/grade4-core-wave1.json');
const text=JSON.stringify({
  schemaVersion:1,status:'draft_awaiting_independent_review',
  scope:'43 authored nonvisual grade-4 editions, one real curriculum model per captured topic; not full grade-4 source coverage.',
  summary:{editions:editions.length,sourceOccurrencesReferenced:editions.length,sourceTopicsReferenced:43,models:modelIds.length,independentlyReviewed:0},
  editions,
},null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);
else assert.equal(fs.readFileSync(target,'utf8'),text,'The draft differs from its reproducible model output');
console.log(JSON.stringify({batch:path.relative(root,target),editions:editions.length,models:modelIds.length,checks:'passed',reviewStatus:'awaiting_independent_review'}));
