import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {UNITARY_ALLOCATION_SPECS} from './grade4-unitary-allocation-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-unitary-allocation-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(UNITARY_ALLOCATION_SPECS.map(s=>s.id)).size,UNITARY_ALLOCATION_SPECS.length);const editions=[];
for(const spec of UNITARY_ALLOCATION_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-unitary-allocation-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-6-3',`Missing canonical6.3 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-unitary-allocation-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық39 қалған сақталған көрнекіліксіз шарт, толық ресми шешім, кілт және барлық нұсқа жеке оқылды. Бірлік баға, масса, шығын, өнімділік арқылы жаңа топқа көшу дербес жазылды.',
 'Қосынды немесе айырма берілгенде белгісіз бірлікке келтіру, бірінші/екінші шама не реттелген екі жауапты табу, жалпы құн мен жетпейтін ақшаны ажырату сақталды.',
 'Бірдей өнімділік, баға, рейс саны, ыдыс массасы; үш үлесті бөлу мен біріктірілген топқа қатысты айырма; сағат/минут, тонна/центнер және метр/сантиметр түрлендірулері дәл есептелді.39source39жаңамағынаемес.'
 ],relationToSource:'One individually read saved grade-4 nonvisual6.3 unitary/proportional-allocation occurrence with preserved original sum or difference, equal unit assumption, ordered requested quantity and exact unit conversion. Numeric variants are coverage, not unique meanings.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_unitary_price_rate_mass_sum_difference_allocation_and_unit_conversion_models',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-6-3'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual6.3 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All39 remaining saved grade-4 nonvisual topic6.3 unitary/proportional-allocation models; individually preserved requested quantities and exact units; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-unitary-allocation-wave43.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
