import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {QUANTITY_SPECS} from './grade4-quantity-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-quantity-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(QUANTITY_SPECS.map(s=>s.id)).size,QUANTITY_SPECS.length);const editions=[];
for(const spec of QUANTITY_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-quantity-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-1-9',`Missing canonical1.9 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-quantity-${kind}`,skillFamily:kind,grade:4,topic:/age/.test(kind)?'logic':/area|hectare|square|plot|land|sotyk/.test(kind)?'geo':'word',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Сақталған шарт, барлық жауап нұсқалары, кілт пен толық шешім жеке оқылып, сұралған шаманың мағынасы сақталды.',
 'Жаңа сандармен дербес қазақша шарт пен толық шешім жазылды. Квадрат және текше бірліктердің 100/1 000 коэффициенттері, аралас өлшемдер, кері аудан-периметр, өнімділік пен жас қатынастары сақталды.',
 'Қате түрлендіруді таңдау тапсырмасында әдейі қате мысал айқын белгіленді. 1 сотықтың анықтамасы өзгермейтін математикалық факт ретінде сақталды. Сандық нұсқалар бөлек жаңа математикалық мағына деп саналмайды.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic1.9 quantity/reasoning edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',...(kind==='incorrect-unit-equality'?{intentionalIncorrectExample:true}:{}),...(kind==='sotyk-definition'?{pedagogicalInvariant:'1 сотық = 100 м² is a unit definition, not an authored numerical novelty.'}:{})};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_SI_quantity_arithmetic_complete_square_age_and_rate_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-1-9'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual1.9 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All30 remaining saved grade-4 nonvisual topic1.9 unit-quantity and reasoning sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-quantity-wave16.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
