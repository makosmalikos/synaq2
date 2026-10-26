import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {propertiesBasicSpecs} from './grade5-natural-properties-basic-specs.mjs';
import {renderEdition,verifyEdition} from './grade5-natural-properties-basic-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),editions=[];
const retained='0d0d7f87bc97c986';
for(const [level,id,model,params] of propertiesBasicSpecs){
 const sourceFile=`problems/sources/zerek/courses/5-math-1-6-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile)));
 assert.equal(source.grade,5);assert.equal(source.status,'captured');
 const old=source.questions.find(q=>q.id===id);assert.ok(old);assert.equal(old.checked,true);assert.ok(!old.images?.length&&!old.svg?.length);assert.notEqual(id,retained);
 const r={editionId:'grade5-natural-properties-basic-'+id,modelId:'grade5-natural-properties-basic-'+model,grade:5,topic:'num',difficulty:level==='1'?'basic':'medium',params,sourceRefs:[{sourceFile,sourceId:id}],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individual adaptation of27pending saved nonvisual grade5topic1.6 levels1+2. Already linked exactduplicate retained. Same taught mechanisms and distractor roles, not new semantic claims.',adaptationChanges:['Барлық28сақталған визуалсыз шарт, толық ресми шешім және әр MCQ жеке оқылды; тек27pending редакция жасалды, бір бұрын байланыстырылған дәл қайталама өзгертілмеді.','Қосылғыш/көбейткіш реті, жақша топтастыруы, барлық мүшеге үлестіру, дөңгелек жұптар және мәтіндік санақ бірліктері сақталды. Сандар, контекст, таңбалар мен толық түсіндіру жаңартылды.','Standard үшін жабық draft; тәуелсіз толық мазмұн hash тексеруінсіз банкке кірмейді. Түпнұсқа сурет/TeX жоқ.']};
 Object.assign(r,renderEdition(r));r.calculationVerification=verifyEdition(r);
 assert.notEqual(r.statement.normalize('NFKC').toLocaleLowerCase('kk'),old.statement.normalize('NFKC').toLocaleLowerCase('kk'));
 assert.doesNotMatch([r.statement,r.solution,r.answer,...r.options||[]].join(' '),/[\\$]|NaN|Infinity/);editions.push(r);
}
assert.equal(editions.length,27);
for(const level of ['1','2']){
 const sourceFile=`problems/sources/zerek/courses/5-math-1-6-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile)));
 assert.deepEqual(editions.filter(r=>r.sourceRefs[0].sourceFile===sourceFile).map(r=>r.sourceRefs[0].sourceId).sort(),source.questions.filter(q=>!q.images?.length&&!q.svg?.length&&q.id!==retained).map(q=>q.id).sort());
}
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All27pending saved nonvisual GRADE5topic1.6 levels1+2 ONLY; one exactduplicate retained, visual editions retained, levels3/test still pending.',summary:{editions:27,sourceOccurrencesReferenced:27,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const file=path.join(root,'problems/editorial/batches/grade5-natural-properties-basic.json'),text=JSON.stringify(batch,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);
console.log(JSON.stringify(batch.summary));
