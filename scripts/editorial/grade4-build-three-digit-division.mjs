import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {THREE_DIGIT_DIVISION_SPECS} from './grade4-three-digit-division-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-three-digit-division-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(THREE_DIGIT_DIVISION_SPECS.map(s=>s.id)).size,THREE_DIGIT_DIVISION_SPECS.length);const editions=[];
for(const spec of THREE_DIGIT_DIVISION_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-three-digit-division-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-5-10',`Missing canonical5.10 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-three-digit-division-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық22 қалған сақталған шарт, кілт, толық ресми шешім және барлық нұсқа жеке оқылды. Үштаңбалы бөлгіш,3/4цифрлықалғашқыбөлік,1/2/3цифрлықбөлінді,әрсынақцифрымен0≤қалдық<бөлгішсақталды.',
 'Таңдалғанартықцифрдіазайту,кемцифрдентуғанартыққалдық,алдыңғықалдықпентолықбөліндініажырату,бірлікбағаайырмасы,жұмыскүндері,365күндікбірлікқарқын,бөліндініарттыруменжаңасанынақұнжекежазылды.',
 'Тоннаданкилограмғаауысыпкөліктіңрейсінжоғарыдөңгелектеу,еңкішітолымсызүштаңбалыбөлінді,еңүлкенқалдықкеріесебі,соңғынөлдерсақталды.Бөлгішпенбөліндіекіүштаңбалыкөбейткішболғандағыкатегорикалықшектер—инвариант;22source22жаңамағынаемес.'
 ],relationToSource:'One individually read saved grade-4 nonvisual topic5.10 three-digit divisor skill with prefixes, trial digits, inverse/digit domains and source-specific staged quantities. Numeric variants and categorical invariants are not unique meanings. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_integer_three_digit_divisor_trial_digit_remainder_domains_and_staged_quantities',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-5-10'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual5.10 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All22 remaining saved grade-4 nonvisual topic5.10 three-digit division, prefixes, trial digits, complete inverse/digit domains and staged applications; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-three-digit-division-wave39.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
