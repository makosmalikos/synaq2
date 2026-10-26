import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {SET_SPECS} from './grade4-set-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-set-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records;
const records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json');
const verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(SET_SPECS.map(s=>s.id)).size,SET_SPECS.length);
const editions=[];
for(const spec of SET_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-set-${spec.id}`;
 assert(ref&&['4-math-2-6','4-math-3-3'].includes(ref.sourceTopic),'Source must belong to the independently inventoried set topics');
 const prior=verified.get(`${ref.sourceFile}:${spec.id}`)||[];
 if(prior.some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);
 assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const row={editionId,modelId:`grade4-set-${spec.kind}`,skillFamily:spec.skillFamily,grade:4,topic:'logic',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
  'Бастапқы нақты шарт, жауап кілті және ресми шешім толық оқылды; жиынға тиістілік, санау, амал немесе қасиетті тану дағдысы жеке сақталды.',
  'Деректер мен өз қазақша шарты қайта жазылды. Жиын элементтерінің реті жауапты өзгертпейді; жауап нұсқалары тек жазылу ретімен ажыратылмайды.',
  'Шекаралар, бос жиын, өз жиыны, «дәл бір», «кемінде бір» және үш топтың жұп қиылысуларына ортақ топтың кіруі қажет жерде анық айтылды.'
 ],relationToSource:'A source-specific saved grade-4 set exercise edition. Repeated numerical models are retained, not counted as semantically unique stories.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 const rendered=renderEdition(row);Object.assign(row,{statement:rendered.statement,answer:rendered.answer,solution:rendered.solution,...(rendered.options?{options:rendered.options}:{})});row.calculationVerification={method:'finite_membership_constraints_and_truth_tables',...verifyEdition(row)};
 editions.push(row);
}
const missing=inventory.filter(r=>['4-math-2-6','4-math-3-3'].includes(r.sourceTopic)&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!editions.some(e=>e.sourceRefs[0].sourceId===r.sourceId));
assert.equal(missing.length,0,'All presently unreviewed nonvisual source records in the two set topics must be individually mapped');
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'Saved grade-4 nonvisual sets/intersections/unions: full source-specific draft coverage of currently unreviewed references in topics2.6 and3.3. No network/source collection.',summary:{editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0},editions};
const target=path.join(root,'problems/editorial/batches/grade4-sets-wave8.json'),text=JSON.stringify(batch,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...batch.summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
