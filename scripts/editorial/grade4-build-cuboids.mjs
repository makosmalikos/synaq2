import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {CUBOIDS_SPECS} from './grade4-cuboids-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-cuboids-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(CUBOIDS_SPECS.map(s=>s.id)).size,CUBOIDS_SPECS.length);const editions=[];
for(const spec of CUBOIDS_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-cuboids-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-4-1',`Missing canonical4.1 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-cuboids-${kind}`,skillFamily:kind,grade:4,topic:'geometry',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық39 қалған сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. Жақ, қыр, төбе сандары геометриялық тұрақтылар ретінде сақталды; қораптың бір қырын/бір жағын/толық бетін/көлемін шатастырмау дағдылары ажыратылды.',
 'Дербес қазақша шарттар, жаңа өлшемдер және толық шешімдер жазылды. Ұзындық бірліктері, кері есеп, бірдей қырлар қосындысына қарамастан әртүрлі көлем, көлем өсімінің қосылған қабаты жеке тексерілді.',
 'Натурал өлшем үштіктері мен ортақ бөлгіштер толық тексерілді. Бұрыш текшесін алу және тек екі қарама-қарсы жақты бояу есептері өздерінің ашық бет/қабат моделін сақтайды. Сандық нұсқалар жаңа мағыналар саны емес.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic4.1 cuboid topology, dimensions, surface, volume, layers or finite integer domain edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_native_cuboid_faces_edges_volumes_layer_voxel_and_complete_integer_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-4-1'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual4.1 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All39 remaining saved grade-4 nonvisual topic4.1 cuboid topology/surface/volume/layer/domain sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-cuboids-wave27.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
