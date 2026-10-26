import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {signedContextSpecs} from './grade6-signed-contexts-specs.mjs';
import {renderEdition,verifyEdition} from './grade6-signed-contexts-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),specs=new Map(signedContextSpecs.map(([id,model,params])=>[id,{model,params}]));assert.equal(specs.size,34);
const editions=[],hard=new Set(['lake-relative-reference','inverse-cooling','balance-multiple-stages','helicopter-diver-submarine','two-resales-with-repair','inverse-quiz-count','era-elapsed-no-zero','misread-watch']);
const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
for(const level of ['1','2','3']){
 const sourceFile=`problems/sources/zerek/courses/6-math-2-1-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));assert.equal(source.grade,6);assert.equal(source.status,'captured');
 for(const original of source.questions.filter(q=>!q.images?.length&&!q.svg?.length)){
  assert.equal(original.checked,true);const spec=specs.get(original.id);assert.ok(spec,'Individually read saved source '+original.id);
  const row={editionId:'grade6-signed-contexts-'+original.id,modelId:'grade6-signed-contexts-'+spec.model,grade:6,topic:'num',difficulty:hard.has(spec.model)?'hard':level==='1'?'basic':'medium',params:spec.params,sourceRefs:[{sourceFile,sourceId:original.id}],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individual adaptation of34saved nonvisual topic2.1 sources. Sign categories and numerical variants are not counted as new semantic meanings.',adaptationChanges:[
   'Барлық34 бастапқы шарт, толық шешім және MCQ жеке оқылды. Таңба, нөлден қашықтық, шығын мөлшері, бағыт, нөлдік деңгей және кері кезең дағдылары жеке сақталды.',
   'Сандар, оқиғалар, есімдер және таңдау реттері қайта жазылды. Жол мен тереңдік белгісі, мөлшер мен теріс баланс, оң емес және теріс емес топтар нақты ажыратылды.',
   'Лифтте нөлінші қабаттың жоқтығы және көрші қабат аралығы ашық берілді. Күнтізбеде нөлінші жыл жоқ және екі жылдың басы салыстырылады; тарихи оқиға ойдан алынған деп көрсетілді.',
   'Оператор теріс баланста қызмет көрсетуі, жолаушылар/басқа шығын сияқты есепке әсер ететін келісімдер нақты айтылды. Бөлшектер canonical native fraction, ақша/уақыт және ұпайлар дәл есептелді. Сыртқы толық review-ге дейін жабық.'
  ]};Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);assert.notEqual(clean(row.statement),clean(original.statement));assert.ok(!/[\\$]/.test([row.statement,row.solution,row.answer,...row.options||[]].join(' ')));editions.push(row);
 }
}
assert.equal(editions.length,34);const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All34 individually read saved grade6topic2.1 nonvisual levels1/2/3; no test capture exists here. Closed author draft until separate full-content hash-bound independent review.',summary:{editions:34,sourceOccurrencesReferenced:34,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const text=JSON.stringify(batch,null,2)+'\n',file=path.join(root,'problems/editorial/batches/grade6-signed-contexts.json');if(process.argv.includes('--write'))fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);console.log(JSON.stringify(batch.summary));
