import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {editionHash} from './edition-review.mjs';
import {statementFor,solutionFor,descriptionFor,svgFor,verifyEdition,independentlyCalculate} from './visual-wave32-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const specs=[
 ['thirty-five-apples-five-friends','pictured-divisor-choice','68a6806d5a0d1130',{scene:'apples',rows:5,columns:7},'5','num','Counting an exact pictured array, then choosing its positive divisor among distractors',['4','5','6','8']],
 ['eight-sealed-eleven-pencil-boxes','sealed-box-strict-maximum','89dd74db3bec24f8',{scene:'boxes',boxes:8,perBox:11,limit:66},'55','num','Maximizing an available whole-box multiple under a strict bound that is itself a multiple',null],
 ['first-multiple-twenty-three','first-multiple-ray','f1023fb9add326f8',{scene:'ray',labels:[[2,46],[3,69],[4,92]]},'23','num','Reading equally spaced first multiples from a ray and distinguishing a value from its index',['46','23','115','2']],
 ['thirty-five-by-twenty-square-cuts','largest-square-cut-count','19c0c3a8fcb1c5e3',{scene:'paper',length:35,width:20},'28','num','Finding the largest common natural centimetre side, then counting a complete equal-square tiling',null],
 ['one-forty-four-garden-factor-pairs','unordered-garden-factor-pairs','49fc192d0a31b813',{scene:'garden',area:144},'8','num','Enumerating all unordered positive integer factor pairs, including the central square once',null],
 ['area-one-fifty-side-difference-five','factor-difference-perimeter','72e2d0e96830c3a1',{scene:'factor-rectangle',area:150,difference:5},'50','geo','Selecting the unique integer factor pair with a given side difference, then computing its full perimeter',['25','50','60','150']],
 ['eighty-lamps-divisor-parity','divisor-parity-lamps','4f05738b6dcfc303',{scene:'lamps',lamps:80,rows:8,columns:10},'8','num','Linking successive multiples toggles to divisor parity and counting all square-labelled lamps',null],
];
export function prepareVisualWave32(){
 const scope=read('problems/editorial/batches/visual-inventory.json').records.filter(r=>r.grade===5&&r.group==='courses'&&/\/5-math-2-1-level/.test(r.sourceFile));
 assert.equal(scope.length,7);assert.deepEqual(specs.map(r=>r[2]).sort(),scope.map(r=>r.sourceId).sort());
 const editions=[];
 for(const [suffix,model,sourceId,params,answer,topic,sourceSkill,options]of specs){
  const record=scope.find(r=>r.sourceId===sourceId),raw=read(record.sourceFile).questions[record.sourceIndex];assert.equal(raw.id,sourceId);assert.ok(raw.solution);
  const editionId='visual-wave32-'+suffix,row={editionId,modelId:'visual-wave32-'+model,grade:5,topic,difficulty:record.level===1?'easy':record.level===2?'medium':'hard',params,answer,sourceRefs:[{sourceId,sourceFile:record.sourceFile}],sourceOccurrenceId:record.occurrenceId,sourceCanonicalSha256:editionHash(raw),sourceSkill,adaptationChanges:['Әр бастапқы визуалды дағды жеке сақталды: нұсқалар арасындағы бөлгіш, қорап саны шектелген еселік, координаталық сәуле, ең үлкен ортақ бөлгіш арқылы бөлу, реттелмеген жұптар және шам ауыстыруының жұп-тақтығы.','Алма қатары, қорап/қарындаш саны, қатаң шек, сәуле мәндері, қағаз өлшемдері, бақша/тіктөртбұрыш аудандары мен айырмасы және шам саны жаңа деректермен берілді.','Жаңа native SVG нақты объектілерден, тең аралықтардан және өлшем белгілерінен құрастырылды. Бақша/айнымалы қабырғалар масштабсыз деп анық жазылды. Бастапқы raster/traced SVG көшірілмеді.'],editorialStatus:'draft',minimumPlan:'pro',figureTitle:'Бөлгіштер мен еселіктер',figureReview:{status:'draft',required:'Independent all7source/new fullsolution/MCQ review; actual35apples/8boxes/80initiallyofflamps, equal ray spacing, unsolved rectangle labels, square-pair central case and343px typography'},image:'/figures/synaq-editions/'+editionId+'.svg',verificationModule:'scripts/editorial/visual-wave32-models.mjs'};
  if(options)row.options=options;row.statement=statementFor(row);row.solution=solutionFor(row);row.figureDescription=descriptionFor(row);
  assert.notEqual(row.statement,raw.statement);assert.notEqual(row.answer,String(raw.sourceAnswer));
  row.figureSha256=crypto.createHash('sha256').update(svgFor(row)).digest('hex');verifyEdition(row);row.independentVerification={status:'computed_awaiting_external_review',...independentlyCalculate(row)};editions.push(row);
 }
 return {schemaVersion:1,createdAt:'2026-10-24',status:'draft_awaiting_independent_review',sourcePolicy:'All7 saved visual grade5topic2.1 sources only; no capture/download or traced art.',publication:{allowed:false,minimumInternalPlanAfterVerification:'pro',publicPlanName:'Standard'},coverage:{scope:'All captured visual sources grade5topic2.1',sourceVisualOccurrences:7,addressedNewDrafts:7,previousEditionsRetained:[],missingSourceIds:[],exactNewSourceIds:specs.map(r=>r[2]).sort(),distinctModels:7,semantics:'Seven distinct source targets separately addressed, with a finite available-box bound, unlabelled solution values and complete factor/toggle domains.'},editions};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const pack=prepareVisualWave32();if(process.argv.includes('--write')){for(const q of pack.editions)fs.writeFileSync(path.join(root,'frontend/public',q.image),svgFor(q));fs.writeFileSync(path.join(root,'problems/editorial/batches/visual-wave32-divisor-diagrams.json'),JSON.stringify(pack,null,2)+'\n');}console.log(JSON.stringify(pack.coverage,null,2));}
