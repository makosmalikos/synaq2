import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {AREA_SPECS} from './grade4-area-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-area-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(AREA_SPECS.map(s=>s.id)).size,AREA_SPECS.length);const editions=[];
for(const spec of AREA_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-area-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-1-8',`Missing canonical1.8 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const row={editionId,modelId:`grade4-area-${spec.kind}`,skillFamily:spec.kind,grade:4,topic:['four-legged-animal-count','children-horses-count'].includes(spec.kind)?'logic':'geo',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Әр сақталған шарт, барлық нұсқа, жауап және толық ресми шешім жеке оқылды. Шаманы шамаға бөлгендегі өлшемсіз сан мен шаманы санға бөлгендегі ауданның айырмасы сақталды.',
 'Жаңа сандар, қазақша шарт пен шешім жасалды. Ар, сотық, гектар және шаршы бірліктердің коэффициенттері, ұсақ шекара айырмасы, қосынды/айырма, ауданнан ұзындық пен периметрге көшу сақталды.',
 'Жердің бөліктері қабаттаспайтыны және бас/аяқ есептеріндегі объект түрлері ашық берілген. Сандық редакциялар жеке жаңа математикалық мағына деп есептелмейді.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual area/quantity/reasoning edition. Numerical variants are source coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_square_area_quantity_arithmetic_and_complete_head_leg_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-1-8'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual1.8 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All27 remaining saved grade-4 nonvisual topic1.8 area/unit/reasoning sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-area-wave15.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
