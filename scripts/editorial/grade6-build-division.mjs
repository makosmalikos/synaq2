import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {divisionSpecs} from './grade6-division-specs.mjs';
import {renderEdition,verifyEdition} from './grade6-division-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const specs=new Map(divisionSpecs.map(([id,model,params])=>[id,{model,params}]));
assert.equal(specs.size,54);
const editions=[];
for(const level of['1','2','3','test']){
 const sourceFile=`problems/sources/zerek/courses/6-math-1-2-level${level}.json`;
 const capture=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));
 assert.equal(capture.status,'captured');assert.equal(capture.grade,6);
 for(const source of capture.questions){
  assert.equal(source.checked,true);assert.ok(!source.images?.length&&!source.svg?.length);
  const spec=specs.get(source.id);assert.ok(spec,'Missing individual division adaptation '+source.id);
  const row={editionId:`grade6-division-${source.id}`,modelId:`grade6-division-${spec.model}`,grade:6,topic:'ratio',difficulty:level==='1'?'basic':level==='2'?'medium':'hard',params:spec.params,
   sourceRefs:[{sourceFile,sourceId:source.id}],adaptationChanges:[
    'Толық сақталған шарт пен шешім жеке оқылып, сұралған бөлік, бірлік және есептеу кезеңдері сақталды.',
    'Жаңа қазақша контекст пен жаңа сандар таңдалды; математикалық тұрақтылар (180°, 360°, 1000 г) ғана ережеге сай сақталады.',
    'Шешім жаңа деректерден дәл рационал арифметикамен жазылды; бірнеше сан сұралғанда реті көрсетілген жауап нұсқалары берілді.'
   ],relationToSource:'Source-specific adaptation of saved grade6 topic1.2. Repeated sharing structures are not counted as independent semantic stories.',minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
  Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);editions.push(row);
 }
}
assert.equal(editions.length,54);assert.equal(new Set(editions.map(r=>r.editionId)).size,54);
const content={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All 54 saved nonvisual sources of grade6 topic1.2. Author drafts remain closed pending independent review.',summary:{editions:editions.length,sourceOccurrencesReferenced:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const target=path.join(root,'problems/editorial/batches/grade6-division.json'),text=JSON.stringify(content,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text,'Authored grade6 division batch is stale');
console.log(JSON.stringify(content.summary));
