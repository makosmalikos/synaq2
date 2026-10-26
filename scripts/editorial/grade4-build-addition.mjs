import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {ADDITION_SPECS} from './grade4-addition-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-addition-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(ADDITION_SPECS.map(s=>s.id)).size,ADDITION_SPECS.length);const editions=[];
for(const spec of ADDITION_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-addition-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-1-5',`Missing canonical1.5 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const row={editionId,modelId:`grade4-addition-${spec.kind}`,skillFamily:spec.kind==='supplied-digit-extremes'?`${spec.kind}-${spec.params.digits.length}`:spec.kind,grade:4,topic:spec.kind==='three-object-assignment'?'logic':spec.kind==='three-digit-rearrangement-steps'?'seq':['zero-chain-complement','sum-and-gap-larger'].includes(spec.kind)?'eq':'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Әр нақты бастапқы шарт, кілт, нұсқалар және толық ресми шешім жеке оқылды. Нөлдер арқылы қарыз алу, тасымал, кері амал, қате цифрды түзету, сөзбен сан оқу және цифрлық не логикалық шектеу сақталды.',
 'Деректер мен қазақша тұжырым қайта жазылды. 10 000, 999 = 1 000 − 1 немесе үштен бір бөлік сияқты әдісті анықтайтын педагогикалық тұрақтылар тиісті жерде сақталды.',
 'Ең кіші сан нөлден басталмайды; ойын цифрлары қайталанса да толық қолданылады; үлкен қосындыда разряд салмағы сақталады; «бір қате есептеу» тапсырмасы әдейі қате теңдікті таңдауды сұрайды.'
 ],relationToSource:'One source-specific saved grade-4 addition/subtraction edition. Numerical variants are source coverage, not newly distinct meanings.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 if(spec.kind==='find-incorrect-calculation')row.intentionalIncorrectExample=true;
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_place_value_arithmetic_and_full_finite_constraints',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-1-5'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual1.5 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All24 remaining saved grade-4 nonvisual topic1.5 addition/subtraction/reasoning sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-addition-wave12.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
