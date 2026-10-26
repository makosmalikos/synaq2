import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {editionHash} from './edition-review.mjs';
import {statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from './visual-wave6-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),inScope=r=>r.grade===6&&/\/6-math-2-(6|16)-level/.test(r.sourceFile);
const river=(extra)=>({scene:'river',currentDirection:1,boatDirection:1,...extra});
const specs=[
 ['downstream-travel-time','boat-time','1919714d4ce39914',river({boatSpeed:14,current:4,distance:90}),'5','Reading distance and two aligned velocity arrows before finding downstream travel time','ratio','medium',null],
 ['drifting-raft-time','raft-time','a1a5572ba14b4e72',river({raft:true,boatSpeed:0,current:5,distance:50}),'10','A passive raft travels at the current speed, with no invented own speed','ratio','basic',null],
 ['downstream-distance','boat-distance','9e3726238e9d893a',river({boatSpeed:17,current:3,hours:4}),'80','Reading both arrow directions and adding the aligned speeds before finding distance from time','ratio','medium',null],
 ['upstream-bank-speed','upstream-direction-speed','f82d1b9fa7fa3f01',river({boatDirection:-1,boatSpeed:18,current:5}),'Ағысқа қарсы, 13 км/сағ','Choosing both relative flow direction and ground speed from opposed labelled velocity arrows','ratio','medium',['Ағысқа қарсы, 13 км/сағ','Ағыспен, 23 км/сағ','Ағысқа қарсы, 23 км/сағ','Ағыспен, 13 км/сағ']],
 ['infer-raft-current','raft-current','98cc6f15baff63c3',river({raft:true,boatSpeed:0,current:null,distance:42,hours:7}),'6','Recovering current speed from a passive raft journey with distance only on the drawing','ratio','basic',null],
 ['water-complement-mass','water-mass','f4d52f362b38d3c9',{scene:'mixture',mass:450,saltPercent:14},'387','Using the complement of a salt mass percentage in a two-component solution','pct','medium',null],
 ['two-price-changes','successive-price','4b1ec0906f346c7b',{scene:'price',initial:12000,discount:20,increase:15},'11040','Applying a discount then an increase to two different bases in the pictured order','pct','medium',null],
 ['infer-compound-growth','compound-second-year','f64a303c5567ce74',{scene:'interest',initial:64000,afterOne:72000},'81000','Inferring an unstated annual multiplicative rate from two given sums and applying it to the next year','pct','hard',null],
 ['two-dimension-percent-area','expanded-rectangle-area','d83753e0c61298cb',{scene:'rectangle',length:8,width:5,lengthPercent:25,widthPercent:40},'70','Deriving both expanded rectangle dimensions separately and then finding area, rather than adding percent increases','geo','medium',null],
];
export function prepareVisualWave6(){
 const scope=read('problems/editorial/batches/visual-inventory.json').records.filter(inScope);assert.equal(scope.length,9);assert.deepEqual(specs.map(r=>r[2]).sort(),scope.map(r=>r.sourceId).sort());const editions=[];
 for(const [suffix,model,sourceId,params,answer,sourceSkill,topic,difficulty,options]of specs){
  const record=scope.find(r=>r.sourceId===sourceId),raw=read(record.sourceFile).questions[record.sourceIndex];assert.equal(raw.id,sourceId);assert.ok(raw.solution);const editionId='visual-wave6-'+suffix,row={editionId,modelId:'visual-wave6-'+model,grade:6,topic,difficulty,params,answer,sourceRefs:[{sourceId,sourceFile:record.sourceFile}],sourceOccurrenceId:record.occurrenceId,sourceCanonicalSha256:editionHash(raw),sourceSkill,
   adaptationChanges:['Әр дереккөздің нақты сұрағы жеке сақталды: уақыт, жол, ағыс, бағыт, су массасы, соңғы баға, күрделі өсім немесе өзгерген аудан.','Қашықтықтар, жылдамдықтар, уақыттар, массалар, бағалар, пайыздар мен дұрыс жауаптар жаңадан таңдалды.','Сызбалар өзеннің бағытталған векторларынан, жаңа деректердің native карточкаларынан не нақты масштабтағы тік төртбұрыштардан жаңадан салынды; source raster/traced path көшірілмеді.'],
   editorialStatus:'draft',minimumPlan:'pro',figureTitle:'Қозғалыс пен өзгерістер сызбасы',figureReview:{status:'draft',required:'Independent complete source-skill, motion arrows, units, changing percent bases, new rectangle geometry and343px readability review'},image:'/figures/synaq-editions/'+editionId+'.svg',verificationModule:'scripts/editorial/visual-wave6-models.mjs'};
  if(options)row.options=options;row.statement=statementFor(row);row.solution=solutionFor(row);row.figureDescription=descriptionFor(row);assert.notEqual(row.statement,raw.statement);assert.notEqual(row.answer,String(raw.sourceAnswer));row.figureSha256=crypto.createHash('sha256').update(svgFor(row)).digest('hex');row.independentVerification={status:'computed_awaiting_external_review',...verifyEdition(row)};editions.push(row);
 }
 return {schemaVersion:1,createdAt:'2026-10-23',status:'draft_awaiting_independent_review',sourcePolicy:'Saved visuals only; two explicitly delimited topics river-motion2.6(5) and percentage2.16(4), no capture/download or source trace.',publication:{allowed:false,minimumInternalPlanAfterVerification:'pro',publicPlanName:'Standard'},coverage:{scope:'All captured visual sources in grade6 topics2.6 and2.16',sourceVisualOccurrences:9,addressedNewDrafts:9,previousEditionsRetained:[],missingSourceIds:[],exactNewSourceIds:specs.map(r=>r[2]).sort(),distinctModels:9,semantics:'9 individually addressed models in2 source-topic blocks; no claim that these9 forms represent9 unrelated families.'},editions};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const pack=prepareVisualWave6();if(process.argv.includes('--write')){for(const q of pack.editions)fs.writeFileSync(path.join(root,'frontend/public',q.image),svgFor(q));fs.writeFileSync(path.join(root,'problems/editorial/batches/visual-wave6-flow-percent.json'),JSON.stringify(pack,null,2)+'\n');}console.log(JSON.stringify(pack.coverage,null,2));}
