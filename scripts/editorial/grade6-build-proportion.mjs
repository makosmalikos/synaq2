import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {proportionSpecs} from './grade6-proportion-specs.mjs';import {renderEdition,verifyEdition} from './grade6-proportion-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),specs=new Map(proportionSpecs.map(([id,model,params])=>[id,{model,params}]));assert.equal(specs.size,54);
const editions=[];
const testDifficulty={'general-cross-products':'basic','count-equivalent':'medium','nonzero-convention':'basic','equal-middle':'medium','four-member-product':'hard','target-root-choice':'basic','detect-inversion-error':'medium','variable-both-ratio':'hard','impossible-fourth':'hard','max-distinct-digit-product':'hard'};
for(const level of['1','2','3','test']){
 const sourceFile=`problems/sources/zerek/courses/6-math-1-4-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));assert.equal(source.grade,6);assert.equal(source.status,'captured');
 for(const q of source.questions){
  assert.equal(q.checked,true);assert.ok(!q.images?.length&&!q.svg?.length);const s=specs.get(q.id);assert.ok(s,'Missing source-specific proportion '+q.id);
  const row={editionId:'grade6-proportion-'+q.id,modelId:'grade6-proportion-'+s.model,grade:6,topic:'ratio',difficulty:level==='test'?testDifficulty[s.model]:level==='1'?'basic':level==='2'?'medium':'hard',params:s.params,sourceRefs:[{sourceFile,sourceId:q.id}],adaptationChanges:[
   'Толық сақталған шарт пен шешім жеке оқылды; айқас мүшелер, бірлік түрлендірулері, дәл бөлшектер және әр есептің сұралған қадамы сақталды.',
   'Жаңа сандар мен қазақша мәтін жазылды. Сандық инварианттар (әртүрлі төрт саннан 8 жазу, шеткі және ортаңғы көбейтінділер теңдігі) жалған өзгертілмейді.',
   'Барлық жауап дәл рационал арифметикамен, ал санақ есептері толық ақырлы іздеумен қайта есептелді. Нұсқалар толық жауапты білдіреді.'
  ],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individual saved grade6 topic1.4 adaptation. Repeated equation structures and numerical variants are not independent semantic meanings.'};
  Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);assert.notEqual(row.statement,q.statement);editions.push(row);
 }
}
assert.equal(editions.length,54);assert.equal(new Set(editions.map(r=>r.editionId)).size,54);
const container={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All54 saved nonvisual grade6 topic1.4 conditions individually read and adapted; closed until independent review.',summary:{editions:54,sourceOccurrencesReferenced:54,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const filename=path.join(root,'problems/editorial/batches/grade6-proportion.json'),text=JSON.stringify(container,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(filename,text);else assert.equal(fs.readFileSync(filename,'utf8'),text);
console.log(JSON.stringify(container.summary));
