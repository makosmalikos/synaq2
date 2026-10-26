import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {NUMERATION_SPECS} from './grade4-numeration-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-numeration-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records;
const records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json');
const verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(NUMERATION_SPECS.map(s=>s.id)).size,NUMERATION_SPECS.length);
const editions=[];
for(const spec of NUMERATION_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-numeration-${spec.id}`;
 assert(ref&&['4-math-1-2','4-math-1-3'].includes(ref.sourceTopic),`Unexpected or missing canonical reference ${spec.id}`);
 const prior=verified.get(`${ref.sourceFile}:${spec.id}`)||[];
 if(prior.some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);
 assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const row={editionId,modelId:`grade4-numeration-${spec.kind}`,skillFamily:spec.skillFamily,grade:4,topic:spec.kind==='append-cycle'?'seq':'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
  'Сақталған нақты бастапқы шарт, жауап нұсқалары, кілт және толық ресми шешім оқылды; жеке разрядтық, класстық, цифрлық шектеу немесе тиімді есептеу дағдысы сақталды.',
  'Деректер мен қазақша тұжырым қайта жазылды. Қажет жерде жаңа анық шек берілді; бастапқы нөл, толық разряд бірліктері, бос класс және цифрлардың қайталанбауы жеке тексеріледі.',
  'Көбейту 9 = 10 − 1 және 999 = 1 000 − 1 арқылы берілгенде сол тиімді түрлендіру шешімде көрсетіледі. Қатардың екі цифрлы тіркеу ережесі бірмәнді анықталған.'
 ],relationToSource:'A source-specific saved grade-4 edition. Different numerical variants are retained and are not claimed as semantically unique stories.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_decimal_classes_and_finite_digit_constraints',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>['4-math-1-2','4-math-1-3'].includes(r.sourceTopic)&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'Every currently unedited nonvisual reference in these two source topics must be mapped');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'Saved grade-4 nonvisual numeration/place-value sources in topics1.2 and remaining nonrounding1.3; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-numeration-wave9.json'),text=JSON.stringify(batch,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
