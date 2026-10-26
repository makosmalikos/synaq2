import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {propertiesAdvancedSpecs} from './grade5-natural-properties-advanced-specs.mjs';
import {renderEdition,verifyEdition} from './grade5-natural-properties-advanced-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),editions=[];

for(const [level,id,model,params] of propertiesAdvancedSpecs){
 const sourceFile=`problems/sources/zerek/courses/5-math-1-6-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile)));
 assert.equal(source.grade,5);assert.equal(source.status,'captured');
 const old=source.questions.find(q=>q.id===id);assert.ok(old);assert.equal(old.checked,true);assert.ok(!old.images?.length&&!old.svg?.length);
 const r={editionId:'grade5-natural-properties-advanced-'+id,modelId:'grade5-natural-properties-advanced-'+model,grade:5,topic:'num',difficulty:'hard',params,sourceRefs:[{sourceFile,sourceId:id}],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individual adaptation of all20 saved nonvisual grade5topic1.6 levels3/test. Same taught mechanisms, difficulty, targets and distractor roles, not new semantic claims.',adaptationChanges:['Барлық20сақталған визуалсыз3/test шарт, толық ресми шешім және әр MCQ жеке оқылды; әрқайсысына жаңа жеке шарт пен толық шешім жасалды.','Гаусс жұптары мен мүшелер саны, орталық жұпсыз сағат, екі деңгейлі ортақ көбейткіш, ең аз қосындының бірегейлігі, барлық карточка мен жалпы құн нысаналары сақталды. Шарттар мен сандар жаңартылды.','Standard үшін жабық draft; тәуелсіз толық мазмұн hash тексеруінсіз банкке кірмейді. Түпнұсқа сурет/TeX жоқ.']};
 Object.assign(r,renderEdition(r));r.calculationVerification=verifyEdition(r);
 assert.notEqual(r.statement.normalize('NFKC').toLocaleLowerCase('kk'),old.statement.normalize('NFKC').toLocaleLowerCase('kk'));
 assert.doesNotMatch([r.statement,r.solution,r.answer,...r.options||[]].join(' '),/[\\$]|NaN|Infinity/);editions.push(r);
}
assert.equal(editions.length,20);
for(const level of ['3','test']){
 const sourceFile=`problems/sources/zerek/courses/5-math-1-6-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile)));
 assert.deepEqual(editions.filter(r=>r.sourceRefs[0].sourceFile===sourceFile).map(r=>r.sourceRefs[0].sourceId).sort(),source.questions.filter(q=>!q.images?.length&&!q.svg?.length).map(q=>q.id).sort());
}
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All20saved nonvisual GRADE5topic1.6 levels3/test; visual editions retained, numerical variants are not new semantic meanings.',summary:{editions:20,sourceOccurrencesReferenced:20,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const file=path.join(root,'problems/editorial/batches/grade5-natural-properties-advanced.json'),text=JSON.stringify(batch,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);
console.log(JSON.stringify(batch.summary));
