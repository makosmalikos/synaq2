import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {MULTIPLICATION_DIVISION_REVIEW_SPECS} from './grade4-multiplication-division-review-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-multiplication-division-review-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(MULTIPLICATION_DIVISION_REVIEW_SPECS.map(s=>s.id)).size,MULTIPLICATION_DIVISION_REVIEW_SPECS.length);const editions=[];
for(const spec of MULTIPLICATION_DIVISION_REVIEW_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-multiplication-division-review-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-5-11',`Missing canonical5.11 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-multiplication-division-review-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық22 қалған сақталған шарт, кілт, толық ресми шешім және барлық нұсқа жеке оқылды. Ішкі/соңғы нөлді бөлінді,дұрысқалдық,алғашқыбөлік,бөліндіцифрларыменкерікөбейтужекесақталды.',
 'Жуықкөбейтіндігееңжақыннұсқа,миллионшегінқамтығанбағалаудынақтылау,ашықаралықпенқатаңшек,тәулік24сағат,кішібөлгішкекөшу,бөлінгішпенбөлгіштібіргеарттыружекежазылды.',
 'Екі/үштаңбалымножительдегіамалреті,нөлдітастаукеріесебі,бесцифрлықшектегіеңкішіүштаңбалысан,теңбөлінді-қалдықмаксимумыжәнеортақкөбейткіштіқайтаорналастырутексерілді.22source22жаңамағынаемес.'
 ],relationToSource:'One individually read saved grade-4 nonvisual topic5.11 multiplication/division review skill with exact zero places, individual estimate/property/inverse/domain models. Numeric variants are not unique meanings. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_integer_Euclidean_round_estimate_strict_interval_properties_precedence_and_inverse_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-5-11'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual5.11 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All22 remaining saved grade-4 nonvisual topic5.11 multiplication/division review, individual estimates, strict normalized remainder and inverse/property/domain models; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-multiplication-division-review-wave40.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
