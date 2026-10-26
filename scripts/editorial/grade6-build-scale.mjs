import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {scaleSpecs} from './grade6-scale-specs.mjs';import {renderEdition,verifyEdition} from './grade6-scale-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),specs=new Map(scaleSpecs.map(([id,model,params])=>[id,{model,params}]));assert.equal(specs.size,54);
const geometry=new Set(['yard-dimensions','real-perimeter','real-rectangle-area','scaled-dimension-gap','enlarged-area','plan-area-to-real','scaled-square-area','new-map-lake-area','area-between-maps','perimeter-ratio-real-area','scale-from-area','area-reduction-factor','scaled-room-mats','scaled-volume','square-fence-cost']);
const motion=new Set(['walk-time-map','map-route-time','map-route-speed','arrival-with-stop','map-scale-from-mixed-time','mapped-head-on-time']);
const hard=new Set(['arrival-with-stop','enlarged-copy-real-metres','new-map-lake-area','area-between-maps','perimeter-ratio-real-area','scale-from-area','scaled-volume','square-fence-cost','ratio-route-map']);
const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),editions=[];
for(const level of ['1','2','3','test']){
 const sourceFile=`problems/sources/zerek/courses/6-math-1-8-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));assert.equal(source.grade,6);assert.equal(source.status,'captured');
 for(const original of source.questions){assert.equal(original.checked,true);assert.ok(!original.images?.length&&!original.svg?.length);const spec=specs.get(original.id);assert.ok(spec,'Individually read source '+original.id);
  const row={editionId:'grade6-scale-'+original.id,modelId:'grade6-scale-'+spec.model,grade:6,topic:geometry.has(spec.model)?'geo':motion.has(spec.model)?'motion':'ratio',difficulty:hard.has(spec.model)?'hard':level==='1'?'basic':'medium',params:spec.params,sourceRefs:[{sourceFile,sourceId:original.id}],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individual saved grade6topic1.8 scale adaptation; repeated conversion models and numerical/context editions are not separate semantic meanings.',adaptationChanges:[
   'Барлық54 сақталған шарт, толық шешім және нұсқалар жеке оқылып, үлкейту/кішірейту, масштабты анықтау, бірлік ауыстыру және бірнеше кезеңді есептеу дағдылары сақталды.',
   'Сандар мен жағдайлар жеке өзгертіліп, қазақша дербес шарттар жазылды. Нақты географиялық жол туралы тексерілмеген мәлімет орнына оқу картасындағы белгіленген кесінді қолданылды.',
   'Масштаб әрқашан сызбадағы ұзындықтың нақты ұзындыққа қатынасы. Сантиметр/миллиметр/метр/километр, шаршы және текше бірліктер бөлек ауыстырылды; аудан квадратқа, көлем кубқа өзгереді.',
   'Көшірменің жаңа масштабы, екі картадағы бір тұрақты жол, аялдама мен сағаттағы60минут, қақпасыз толық қоршау және кілемшелерді толық ұзындықпен төсеу ашық берілді. Жауаптар дәл рационал; сыртқы тәуелсіз тексеруге дейін жабық.'
  ]};Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);assert.notEqual(clean(row.statement),clean(original.statement));editions.push(row);
 }
}
assert.equal(editions.length,54);const container={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All54 individually read saved grade6topic1.8 scale sources. Closed author draft until separate full-content hash-bound review.',summary:{editions:54,sourceOccurrencesReferenced:54,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const text=JSON.stringify(container,null,2)+'\n',file=path.join(root,'problems/editorial/batches/grade6-scale.json');if(process.argv.includes('--write'))fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);console.log(JSON.stringify(container.summary));
