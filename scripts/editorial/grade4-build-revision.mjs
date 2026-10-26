import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {REVISION_SPECS} from './grade4-revision-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-revision-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records;
const records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json');
const verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(REVISION_SPECS.map(s=>s.id)).size,REVISION_SPECS.length);
const editions=[];
for(const spec of REVISION_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-revision-${spec.id}`;
 assert(ref&&ref.sourceTopic==='4-math-1-1',`Unexpected or missing canonical reference ${spec.id}`);
 const prior=verified.get(`${ref.sourceFile}:${spec.id}`)||[];
 if(prior.some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);
 assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const row={editionId,modelId:`grade4-revision-${spec.kind}`,skillFamily:`${spec.kind}${spec.kind==='number-extreme'?'-'+spec.params.direction:''}`,grade:4,topic:['future-age-ratio','reverse-two-operations'].includes(spec.kind)?'eq':['map-distance','proportional-tickets','cheaper-unit-price','unknown-child-tickets'].includes(spec.kind)?'ratio':'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
  'Бастапқы сақталған шарт, нұсқалар, кілт және толық ресми шешім жеке оқылды; салыстыру, өлшем ауыстыру, кері амал, тең топтар, разряд немесе жақша қою дағдысы сақталды.',
  'Деректер мен қазақша тұжырым жаңартылды; сұралған өлшем және жауап пішіні анық жазылды. Сандық нұсқалар әртүрлі мағыналы сюжет деп саналмайды.',
  'Дәл арифметика, уақыттың 60 минуттық негізі, алдыңғы нөлге тыйым, қатаң теңсіздік, екі жақтан жұптау және жақшаның барлық мүмкін орны тиісті модельдерде жеке тексерілді.'
 ],relationToSource:'A source-specific saved grade-4 revision edition. Numerical variants are retained and are not claimed as semantically unique stories.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_integer_rational_and_finite_revision_models',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-1-1'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'Every currently unedited nonvisual reference in source topic1.1 must be mapped');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'The31 remaining saved grade-4 nonvisual revision sources in topic1.1. No new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-revision-wave10.json'),text=JSON.stringify(batch,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
