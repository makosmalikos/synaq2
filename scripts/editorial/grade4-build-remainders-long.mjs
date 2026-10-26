import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {REMAINDERS_LONG_SPECS} from './grade4-remainders-long-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-remainders-long-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(REMAINDERS_LONG_SPECS.map(s=>s.id)).size,REMAINDERS_LONG_SPECS.length);const editions=[];
for(const spec of REMAINDERS_LONG_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-remainders-long-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-5-7',`Missing canonical5.7 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-remainders-long-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық41 қалған сақталған шарт, толық ресми шешім, кілт пен нұсқалар жеке оқылды. Бөлінгіш = бөлгіш × толымсыз бөлінді + қалдық және0≤қалдық<бөлгіш ережелері сақталды.',
 'Жаңа деректер мен дербес қазақша жағдайлар жазылды. Теңдігі дұрыс, бірақ қалдығы артық нұсқа; бір/екі/үш таңбалы бөлінді; соңғы нөл; кері есеп және екі кезеңді бастапқы санды қалпына келтіру жеке сақталды.',
 'Қалдықтар жүйесінің ең кіші оң шешімі, қатаң төменгі шек, толық екі/үш таңбалы домен, максималды қалдық, бірдей бөлінді-қалдық экстремумы мен саны тексерілді. Толық топқа төмендету және автобусты жоғары дөңгелектеу ажыратылды. Үштаңбалы инвариант991 өзгермейді;41source41жаңа мағына дегенді білдірмейді.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic5.7 Euclidean remainder longdivision edition or individually retained inverse, complete residue/digit domain and staged application model. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_integer_euclidean_remainder_strict_bounds_complete_residue_digit_domains_and_floor_ceiling_applications',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-5-7'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual5.7 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All41 remaining saved grade-4 nonvisual topic5.7 Euclidean remainder longdivision, inverse identities, complete residue/digit domains and staged applications; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-remainders-long-wave36.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
