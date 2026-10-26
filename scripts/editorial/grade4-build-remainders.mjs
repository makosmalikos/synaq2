import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {renderEdition,verifyEdition} from './grade4-remainder-models.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const records=new Map(read('problems/editorial/batches/grade4-inventory.json').records.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json');
const verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
const specs=[
  ['double-neighbour-remainders','43603ab23a56abd6',{first:7,second:5}],
  ['largest-digit-remainder','a321e617b5895946',{digits:4,divisor:9,remainder:4}],
  ['shifted-remainder','22edb6cd8ba46091',{divisor:11,remainder:8,add:7}],
  ['reversed-multiply-divide','436f322d59a8ed27',{factor:6,mistakenQuotient:125}],
  ['complete-bundle-top-up','412cc90047bb5f76',{total:5867,size:10}],
  ['incomplete-quotient-length','3360bb554e635b32',{dividend:830014,divisor:100}],
  ['quotient-remainder-total','6c15b38977cc6523',{dividend:6075,divisor:100}],
  ['two-division-reconstruction','f86123dca3b8be02',{quotient:647,lastTwo:79}],
  ['remainder-multiple-of-quotient','0f536f155b2eb42f',{divisor:100,multiplier:7}],
  ['bounded-equal-quotient-remainder','38cb35a81224da9c',{lower:3200,upper:9999,divisor:100}],
  ['fixed-thousands-and-remainder','2555026c0d4254fb',{thousandsQuotient:7,remainder:64}],
  ['digit-interval-remainder-count','e9496d1ab0ad4885',{digits:4,divisor:100,remainder:24}],
  ['shared-decimal-remainder-minimum','a08569c27ad327ce',{remainder:4}],
  ['largest-quotient-remainder-sum','acff37ed32a375be',{divisor:100,total:18}],
  ['largest-equal-quotient-remainder','42c23f2aab7a24ab',{divisor:168}],
  ['reconstruct-then-new-remainder','facce289944548bd',{firstDivisor:125,firstQuotient:48,firstRemainder:19,nextDivisor:129}],
  ['remainder-under-factor-divisor','57a6f34c99471d8f',{firstDivisor:448,nextDivisor:64,remainder:173}],
  ['largest-legal-remainder','bf60e84d0d2eafec',{divisor:248}],
  ['count-digit-multiples','f7b66a705bd138bb',{digits:5,divisor:175}],
  ['smallest-digit-remainder','7a051849db75f766',{digits:5,divisor:154,remainder:39}],
  ['divisor-linked-to-quotient','c715994a9814c1f6',{dividend:2352,ratio:3}],
  ['smallest-two-digit-divisor','75de9e2115334363',{quotient:8}],
  ['hidden-division-digit','a874785b31607fba',{template:'3?5',scale:1000,divisor:900,target:'quotient'}],
  ['hidden-division-digit','1f20a557ff3d73f5',{template:'?6',scale:1000,divisor:900,target:'digit'}],
];
const editions=specs.map(([slug,sourceId,params])=>{
  const ref=records.get(sourceId),editionId=`grade4-remainder-${sourceId}`;
  assert(ref&&(verified.get(`${ref.sourceFile}:${sourceId}`)||[]).every(id=>id===editionId),'Do not redo a source with a different independently verified edition');
  const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===sourceId);
  assert(capture.status==='captured'&&source.checked&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
  const row={editionId,modelId:`grade4-${slug}`,grade:4,topic:'num',difficulty:'hard',params,
    sourceRefs:[{sourceFile:ref.sourceFile,sourceId}],adaptationChanges:[
      'Бастапқы шарт пен ресми шешім толық оқылып, нақты қалдық/бөлінді/разряд шектеуінің дағдысы сақталды.',
      'Сандық деректер және қазақша шарт осы редакция үшін қайта жазылды; жауап жаңа деректерден есептелді.',
      'Кіші/үлкен мән не бірмәнділік талаптары толық аралықты тексеру немесе дәл бүтін шекаралармен дәлелденді.'
    ],relationToSource:'Specific saved grade-4 division/remainder skill reference. A numeric exercise edition is not claimed as a semantically unique story.',
    editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
  const rendered=renderEdition(row);Object.assign(row,{statement:rendered.statement,answer:rendered.answer,solution:rendered.solution});
  row.calculationVerification={method:'exact_constraints_and_finite_candidates',...verifyEdition(row)};return row;
});
assert.equal(editions.length,24);
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'24 source-specific saved grade-4 nonvisual division/remainder exercises; no new source collection.',summary:{editions:24,models:new Set(editions.map(q=>q.modelId)).size,sourceOccurrencesReferenced:24,independentlyReviewed:0},editions};
const target=path.join(root,'problems/editorial/batches/grade4-remainders-wave5.json'),text=JSON.stringify(batch,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({editions:24,models:batch.summary.models,checks:'passed',reviewStatus:'awaiting_independent_review'}));
