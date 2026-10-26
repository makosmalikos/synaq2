import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';
import{COLLECTION_RATIO3_SPECS}from'./collection-ratios3-specs.mjs';import{renderEdition,verifyEdition}from'./collection-ratios3-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const coverage=read('problems/editorial/source-coverage.json'),editions=[],norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
assert.equal(COLLECTION_RATIO3_SPECS.length,48);assert.equal(new Set(COLLECTION_RATIO3_SPECS.map(s=>`${s.collection}:${s.number}`)).size,48);
for(const spec of COLLECTION_RATIO3_SPECS){
 const sourceFile=`problems/sources/zerek/collections/${spec.collection}.json`,capture=read(sourceFile),matches=capture.questions.filter(q=>String(q.number)===String(spec.number));
 assert.equal(matches.length,1);const source=matches[0];assert.equal(capture.sourceReviewCaptured,true);assert(source.statement&&source.solution);assert(source.sourceAnswer||source.options?.filter(o=>o.correct).length===1||/Дұрыс жауап:/.test(source.openAnswerText||''));assert(!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const sourceId=String(spec.number),coverageRow=coverage.records.find(r=>r.sourceFile===sourceFile&&r.sourceId===sourceId);assert(coverageRow&&coverageRow.kind==='collection');assert(!coverageRow.verifiedEditions?.length,'Already covered source');
 const row={editionId:`collection-ratios3-${spec.collection.slice(0,8)}-${String(spec.number).padStart(2,'0')}`,modelId:`collection-ratios3-${spec.kind}`,skillFamily:spec.kind,grade:6,topic:spec.topic,difficulty:spec.kind.includes('mixed')?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile,sourceId}],adaptationChanges:[
 'Осы сақталған жинақтағы толық шарт, ресми шешім, кілт және әр жауап нұсқасы жеке оқылды. Ешбір жаңа бастапқы тапсырма жиналмады.',
 'Жеке сандық деректер, дербес қазақша тұжырым мен шешім жазылды. Қатынас реті, бөлік/бөлік және бөлік/барлығы, сұралған бастапқы/соңғы шама бөлек сақталды.',
 'Ондық пен жай бөлшекті қысқарту, өлшемдерді теңестіру, ортақ аралық мүше, бір жақты өзгеріс, ауданның квадраты және периметрдің жартысы дәл қайта есептелді. 48 бастапқы жағдай 48 бөлек математикалық мағына дегенді білдірмейді.'
 ],relationToSource:'Individually read saved NIS collection ratio occurrence. New parameters, wording, context and worked solution preserve the specific ordered-ratio, sum/gap/part target, common-middle, unit, change, geometry or fixed-work skill. Repeated mechanisms are variants; invariant 180°,360°,60min,100cm,1000ml definitions are facts, not new meanings.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));assert.notEqual(norm(row.statement),norm(source.statement));row.calculationVerification={method:'source_specific_exact_ratio_fraction_units_changes_and_geometric_scaling',...verifyEdition(row)};editions.push(row);
}
const summary={editions:editions.length,models:new Set(editions.map(e=>e.modelId)).size,sourceOccurrencesReferenced:editions.length,collections:2,grade:6,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'48 saved nonvisual occurrences from NIS Қатынас және пропорция parts2–3; rewritten individually with exact parameters and source-specific targets. Closed Standard draft; no new capture and no claim of48new mathematical meanings.',summary,editions};
const target=path.join(root,'problems/editorial/batches/collection-ratios-wave3.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,status:'author_draft_requires_external_review'}));
