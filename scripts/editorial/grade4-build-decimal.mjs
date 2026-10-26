import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {DECIMAL_SPECS} from './grade4-decimal-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-decimal-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(DECIMAL_SPECS.map(s=>s.id)).size,DECIMAL_SPECS.length);const editions=[];
for(const spec of DECIMAL_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-decimal-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-2-4',`Missing canonical2.4 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-decimal-${kind}`,skillFamily:kind,grade:4,topic:/meters|length|kopecks|cost/.test(kind)?'word':'arith',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық24 қалған сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. 10, 100, 1 000 көбейткіштері, ішкі және соңғы нөлдер, өлшем бірлігі мен кері амал дағдылары сақталды.',
 'Жаңа сандар, есімдер мен өз қазақша шарттар және толық шешімдер жазылды. Бөлінгіш/бөлгіштен бірдей нөл алу, белгісізді кері амалмен табу, қосарланған қателікті түзету және көбейткіштерден туған қосымша нөл жеке түсіндірілді.',
 'Бір ғана санды 1 000 және 10 сандарына бөлудің айырмасы есебінде екі бөлудің де қалдықсыз болатыны ашық көрсетілді. Тұрақты бірлік анықтамалары өзгертілмеді; сандық нұсқалар жеке жаңа мағына саны емес.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic2.4 decimal-power/zero-place/unit/inverse-operation edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_decimal_powers_zero_place_inverse_and_unit_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-2-4'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual2.4 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All24 remaining saved grade-4 nonvisual topic2.4 decimal-power/zero-place sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-decimal-wave23.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
