import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {circleSpecs} from './grade6-circles-specs.mjs';import {renderEdition,verifyEdition} from './grade6-circles-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),specs=new Map(circleSpecs.map(([id,model,params])=>[id,{model,params}]));assert.equal(specs.size,54);
const hard=new Set(['goat-wrap-area','two-wheels-turn-difference','two-inner-disks-uncovered-radius','circumference-diameter-gap-radius','circumference-area-radii-sum','equal-wire-area-choice','two-clock-tips','roller-covered-area','sector-whole-boundary','square-four-external-semicircles']);
const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),editions=[];
for(const level of ['1','2','3','test']){
 const sourceFile=`problems/sources/zerek/courses/6-math-1-9-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));assert.equal(source.grade,6);assert.equal(source.status,'captured');
 for(const original of source.questions){assert.equal(original.checked,true);assert.ok(!original.images?.length&&!original.svg?.length);const spec=specs.get(original.id);assert.ok(spec,'Individually read source '+original.id);
  const row={editionId:'grade6-circles-'+original.id,modelId:'grade6-circles-'+spec.model,grade:6,topic:'geo',difficulty:hard.has(spec.model)?'hard':level==='1'?'basic':'medium',params:spec.params,sourceRefs:[{sourceFile,sourceId:original.id}],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individual saved grade6topic1.9 circle/disk/sphere adaptation. Categorical definitions and repeated circle mechanisms are not a semantic uniqueness claim.',adaptationChanges:[
   'Барлық54 бастапқы шарт, толық шешім және барлық нұсқа жеке оқылды. Шар/сфера, дөңгелек/шеңбер, радиус/диаметр, доға/толық шекара және аудан дағдылары жеке сақталды.',
   'Сандар, кейіпкерлер мен жағдайлар өзгеріп, қазақша жеке шарттар жазылды. Пиццада бірдей қалыңдық, сымда шығынсыз қайта ию, доңғалақта сырғанамау, катокта ізді қайталамау және тұйық шам қатарында бір орынды қайталамау ашық берілді.',
   'Әр сандық есепте π-дің қолданылатын жуық мәні көрсетіледі. Сол келісілген рационал модель дәл есептеледі; радиус, аудан және көлем бірліктері араластырылмайды. Сандық аудан мен ұзындықтың қатынасында тек сандық мәндер салыстырылатыны нақты айтылды.',
   'Қора арқанында қабырғаларды айналу, екі қосымша ширек аймақ, төртінші бұрышқа жетпеу және қабыспау шарттары сақталды. Секторда екі түзу қыр, стадионда тек сыртқы доғалар есепке алынады. Сыртқы толық тәуелсіз тексеруге дейін жабық.'
  ]};Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);assert.notEqual(clean(row.statement),clean(original.statement));editions.push(row);
 }
}
assert.equal(editions.length,54);const container={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All54 individually read saved grade6topic1.9 nonvisual sources. Closed author draft pending separate full-content independent hash-bound review.',summary:{editions:54,sourceOccurrencesReferenced:54,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const text=JSON.stringify(container,null,2)+'\n',file=path.join(root,'problems/editorial/batches/grade6-circles.json');if(process.argv.includes('--write'))fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);console.log(JSON.stringify(container.summary));
