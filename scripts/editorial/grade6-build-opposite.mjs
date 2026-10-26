import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {oppositeSpecs} from './grade6-opposite-specs.mjs';import {renderEdition,verifyEdition} from './grade6-opposite-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),specs=new Map(oppositeSpecs.map(([id,model,params])=>[id,{model,params}]));assert.equal(specs.size,24);const editions=[];
const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
for(const level of ['1','2']){
 const sourceFile=`problems/sources/zerek/courses/6-math-2-2-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));assert.equal(source.grade,6);assert.equal(source.status,'captured');
 for(const original of source.questions.filter(q=>!q.images?.length&&!q.svg?.length)){
  assert.equal(original.checked,true);const spec=specs.get(original.id);assert.ok(spec,'Individually read saved source '+original.id);
  const row={editionId:'grade6-opposite-'+original.id,modelId:'grade6-opposite-'+spec.model,grade:6,topic:'num',difficulty:level==='1'?'basic':spec.model==='minus-x-fraction-difference'?'hard':'medium',params:spec.params,sourceRefs:[{sourceFile,sourceId:original.id}],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individual saved grade6topic2.2 adaptation. Repeated opposite-number categories and numeric variants are not a semantic uniqueness claim.',adaptationChanges:[
   'Барлық24 сақталған бастапқы шарт, толық шешім және MCQ жеке оқылды. Бағыт, қарама-қарсы сан, санақ басы, арақашықтық және кері бөлшектен айырмашылық жеке сақталды.',
   'Сандар, оқиғалар және таңдау мәндері өзгертіліп, жаңа қазақша шарт жазылды. Теріс емес қашықтық пен таңбалы координата, аралықтың ортасы мен жарты ұзындық, ортақ бөлім мен соңғы минус нақты ажыратылды.',
   'Бүтін нүктелерді санауда шеттер кірмейді, нөл кіреді. Жұптар бір рет қана саналады. Бес қабатталған минуста тақ/жұп заңдылығы және әр қадам көрсетілген; таңбасыз оң санға минус жетіспеу қатесі сақталды.',
   'Ондықтар мен бөлшектер рационал түрде дәл есептеледі. Бөлшектер native canonical жазумен берілген. Сақталған екі деңгейден басқа жаңа материал жиналған жоқ. Сыртқы толық тәуелсіз тексеруге дейін жабық.'
  ]};Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);assert.notEqual(clean(row.statement),clean(original.statement));assert.ok(!/[\\$]/.test([row.statement,row.solution,row.answer,...row.options||[]].join(' ')));editions.push(row);
 }
}
assert.equal(editions.length,24);const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All24 individually read saved nonvisual grade6topic2.2 sources in levels1/2. Closed author draft until separate full-content hash-bound independent review.',summary:{editions:24,sourceOccurrencesReferenced:24,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};const text=JSON.stringify(batch,null,2)+'\n',file=path.join(root,'problems/editorial/batches/grade6-opposite.json');if(process.argv.includes('--write'))fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);console.log(JSON.stringify(batch.summary));
