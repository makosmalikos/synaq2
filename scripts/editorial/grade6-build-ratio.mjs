import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {ratioSpecs} from './grade6-ratio-specs.mjs';
import {renderEdition,verifyEdition} from './grade6-ratio-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const specs=new Map(ratioSpecs.map(([id,model,params])=>[id,{model,params}]));
assert.equal(specs.size,54);
const editions=[];
for(const level of['1','2','3','test']){
 const sourceFile=`problems/sources/zerek/courses/6-math-1-1-level${level}.json`;
 const capture=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));
 assert.equal(capture.status,'captured');assert.equal(capture.grade,6);
 for(const source of capture.questions){
  assert.equal(source.checked,true);assert.ok(!source.images?.length&&!source.svg?.length);
  const spec=specs.get(source.id);assert.ok(spec,'Missing individual adaptation spec '+source.id);
  const row={editionId:`grade6-ratio-${source.id}`,modelId:`grade6-ratio-${spec.model}`,grade:6,topic:'ratio',difficulty:level==='1'?'basic':level==='2'?'medium':'hard',params:spec.params,
   sourceRefs:[{sourceFile,sourceId:source.id}],adaptationChanges:[
    'Сақталған шарттағы нақты қатынас дағдысы жеке оқылып, осы редакцияға жаңа деректер таңдалды.',
    'Жаңа қолданбалы контекст пен қазақша шарт жазылды; бастапқы сөйлемдер және дайын шешім көшірілмеді.',
    'Бірліктерді ауыстыру, қатынастың бағыты мен толық/қалған бөліктің айырмасы ашық көрсетілді; жауап жаңа деректерден есептелді.'
   ],relationToSource:'Individually authored edition for a saved ratio skill. Similar ratio models are not counted as new semantic stories.',minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
  Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);editions.push(row);
 }
}
assert.equal(editions.length,54);assert.equal(new Set(editions.map(r=>r.editionId)).size,54);
const content={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All 54 saved nonvisual sources of grade 6 topic 1.1; not yet published or independently approved.',summary:{editions:editions.length,sourceOccurrencesReferenced:editions.length,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const target=path.join(root,'problems/editorial/batches/grade6-ratio.json'),text=JSON.stringify(content,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text,'Authored grade6 ratio batch is stale');
console.log(JSON.stringify(content.summary));
