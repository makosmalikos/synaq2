import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {percentSpecs} from './grade6-percent-specs.mjs';
import {renderEdition,verifyEdition} from './grade6-percent-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const specs=new Map(percentSpecs.map(([id,model,params])=>[id,{model,params}]));
assert.equal(specs.size,54);
const editions=[];
const testDifficulty={'select-pair':'basic','fraction-complement':'medium','grid-product':'medium','speed-comparison':'medium','sum-first-relative':'medium','second-sale-base':'hard','rounded-wins':'medium','mixed-sales-profit':'hard','successes-added-total':'hard','neither-divisor':'hard'};
for(const level of['1','2','3','test']){
 const sourceFile=`problems/sources/zerek/courses/6-math-1-3-level${level}.json`;
 const capture=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));
 assert.equal(capture.status,'captured');assert.equal(capture.grade,6);
 for(const source of capture.questions){
  assert.equal(source.checked,true);assert.ok(!source.images?.length&&!source.svg?.length);
  const spec=specs.get(source.id);assert.ok(spec,'Missing individual percentage adaptation '+source.id);
  const row={editionId:`grade6-percent-${source.id}`,modelId:`grade6-percent-${spec.model}`,grade:6,topic:'pct',difficulty:level==='test'?testDifficulty[spec.model]:level==='1'?'basic':level==='2'?'medium':'hard',params:spec.params,
   sourceRefs:[{sourceFile,sourceId:source.id}],adaptationChanges:[
    'Сақталған толық шарт, шешім және жауап нұсқалары жеке оқылды; әр есептегі салыстыру негізі мен есептеу кезеңдері сақталды.',
    'Жаңа сандар мен қазақша шарттар таңдалды; 100%, сағаттағы 60 минут, килограмдағы 1000 грамм сияқты өлшем анықтамалары өзгермейді.',
    'Жаңа жауаптар дәл рационал арифметикамен есептелді; аралық мәндер дөңгелектелмейді. Екі жауап сұралғанда толық реттелген нұсқа беріледі.'
   ],relationToSource:'Source-specific grade6 topic1.3 adaptation; repeated proportional structures and numerical editions are not independent semantic meanings.',minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
  Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);editions.push(row);
 }
}
assert.equal(editions.length,54);assert.equal(new Set(editions.map(r=>r.editionId)).size,54);
const content={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All 54 saved nonvisual grade6 topic1.3 percentage sources. Closed until independent source/content review.',summary:{editions:54,sourceOccurrencesReferenced:54,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const target=path.join(root,'problems/editorial/batches/grade6-percent.json'),text=JSON.stringify(content,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text,'Authored percentage batch is stale');
console.log(JSON.stringify(content.summary));
