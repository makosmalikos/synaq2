// One addressed adaptation for EVERY archived visual source in grade 5 topic 7.2.
// Draft output only: this script never imports or updates the active task bank.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {editionHash} from './edition-review.mjs';
import {statementFor,solutionFor,svgFor,verifyEdition} from './visual-wave2-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const rays=obj=>Object.entries(obj).map(([label,mark])=>({label,mark}));
const p=(obj,rest={})=>({rotation:0,rays:rays(obj),...rest});
const specs=[
 ['obtuse-right','baseline-reading','3de425471f88e31e',p({A:0,B:125},{scale:'inner',base:'A',target:'B'}),'125','Reading an obtuse angle from the right-origin inner scale','basic'],
 ['unit-left','baseline-reading','99d2f30b8de44a54',p({A:180,B:43},{scale:'outer',base:'A',target:'B'}),'137','One-degree reading from a left-origin outer scale, avoiding its complementary row','basic'],
 ['small-ticks','baseline-reading','150ec8efd00c21d6',p({A:0,B:32},{scale:'inner',base:'A',target:'B'}),'32','Counting one-degree ticks for an acute angle rather than rounding to a five-degree mark','basic'],
 ['tilted-left','baseline-reading','7fcca51173a52c30',p({A:180,B:68},{scale:'outer',base:'A',target:'B',rotation:18}),'112','Choosing the outer zero row even when the entire protractor is tilted','basic'],
 ['wide-left','baseline-reading','f8e42a6227b4f245',p({A:180,B:25},{scale:'outer',base:'A',target:'B'}),'155','Reading the obtuse angle from a left baseline rather than the acute reverse-scale number','basic'],
 ['ignore-middle','named-target-reading','f1e625942eed05b1',p({A:0,B:57,C:146},{base:'A',target:'C'}),'146','Selecting the named terminal ray while ignoring an unrelated intermediate ray','basic'],
 ['select-scale','baseline-reading','5d7ac5156e9d65cb',p({A:0,B:68},{scale:'inner',base:'A',target:'B'}),'68','Selecting the zero row for a right-baseline acute angle on a double scale','basic'],
 ['construction-point','construction-point','2f3471d8d76538d3',{rotation:0,rays:[...rays({A:0}),...rays({U:55,V:105,W:75,T:85}).map(r=>({...r,pointOnly:true}))],goal:75,base:'A'},'W','Choosing a marked construction point for a given angle, including the reverse-scale distractor','medium'],
 ['acute-left','baseline-reading','fd1440f257372ea5',p({A:180,B:138},{scale:'outer',base:'A',target:'B'}),'42','Acute-angle reading with a left-origin baseline and the appropriate outer scale','basic'],
 ['tilted-precision','baseline-reading','da2fa7c6f70567bf',p({A:0,B:57},{scale:'inner',base:'A',target:'B',rotation:-12}),'57','Precise acute reading on a tilted instrument without substituting its complementary scale','basic'],
 ['below-instrument','external-supplement','87ab2e109e092f7c',{rotation:12,rays:[...rays({A:0,B:180,C:76}),{label:'D',mark:256,outside:true}],base:'A',visible:'C',opposite:'D'},'104','Measuring a visible ray and using its opposite ray below the instrument to obtain a supplementary angle','medium'],
 ['test-bisector','bisector-check','cfaacf7ee97c91b1',p({A:0,C:52,B:104},{base:'A',middle:'C',target:'B'}),'Иә: 52° және 52°','Testing a claimed bisector by separately comparing its two adjacent measured angles','medium'],
 ['two-nonzero','nonzero-reading','a004eaa7f42e9f3b',p({A:152,B:29},{base:'A',target:'B'}),'123','Measuring an angle whose two sides are both away from the scale zero','medium'],
 ['between-two','difference-rays','26e9350d03de4ead',p({A:0,C:46,B:121},{reference:'A',base:'C',target:'B'}),'75','Subtracting two nonzero ray readings while ignoring a separate zero-reference ray','medium'],
 ['three-inclined','named-ray-difference','65af0bf2bfe4aece',p({E:180,F:0,K:149,L:83,N:31},{baselineLeft:'E',baselineRight:'F',base:'K',target:'L'}),'66','Choosing the correct nonzero pair among three inclined rays and a straight baseline','medium'],
 ['opposite-baseline','baseline-supplement','17d1f7278fb2c0e8',p({A:0,E:180,B:61},{baselineLeft:'E',baselineRight:'A',target:'B'}),'119','Finding the angle to the opposite baseline by supplementing the measured acute angle','medium'],
 ['construct-half','construct-bisector','c0a9129a701e4e88',p({A:0,B:146},{base:'A',target:'B',future:'C'}),'73','Determining the scale mark of an internal bisector when one boundary is at zero','medium'],
 ['nonzero-offset','nonzero-reading','d1ac745bb7813812',p({A:35,B:119},{base:'A',target:'B'}),'84','Measuring from two nonzero inner-scale marks rather than treating one mark as the whole angle','medium'],
 ['tilted-offset','nonzero-reading','e3965ed57137fde1',p({A:33,B:119},{base:'A',target:'B',rotation:-14}),'86','Consistent-scale subtraction when neither side is at zero and the instrument is rotated','medium'],
 ['compare-adjacent','adjacent-difference','8b945166178e4a90',p({A:21,B:69,C:153},{first:'A',middle:'B',last:'C',rotation:15}),'36','Finding the difference of two adjacent measured angles on a rotated protractor','hard'],
 ['bisector-offset','bisector-offset','b99d20ee1e508d17',p({E:180,F:0,K:162,L:106,N:26},{first:'K',middle:'L',last:'N',future:'P'}),'12','Constructing the bisector of two nonzero rays before finding its offset from a third ray','hard'],
 ['avoid-mixed-rows','mixed-scale-reading','747aeb9caacf0267',p({P:164,Q:39},{base:'P',target:'Q'}),'125','Avoiding a mixed inner/outer-row subtraction when both angle sides are nonzero','hard'],
 ['bisector-other-row','bisector-crossscale','dff804f49a3e463c',p({M:37,N:153},{base:'M',target:'N',future:'K',rotation:-16}),'95','Bisecting a nonzero-origin angle and converting the midpoint to the specifically requested inner scale','hard'],
 ['equal-named-angle','equal-angle','3b44c38bab048b07',p({P:0,Q:31,R:97,S:128,T:180},{base:'P',target:'R',candidates:[['R','T'],['Q','S'],['P','S'],['Q','R']]}),'∠QOS','Comparing named angle differences and returning a matching angle label rather than a number','hard'],
 ['all-pair-sum','pair-sum','dba7f1f68b476604',p({A:0,B:34,C:82,D:139,E:180}),'930','Enumerating every unordered ray-pair angle, including the straight angle, then summing them','hard'],
 ['identify-ray','identify-ray','95e48cbc55d062f2',p({A:0,B:62,C:108,D:118,E:128},{base:'A',goal:118}),'OD','Identifying a named ray for a prescribed angle while rejecting an opposite-scale match','medium'],
 ['double-construction','twice-angle','2699b11a5615279e',p({M:0,N:43},{base:'M',target:'N',future:'P'}),'86','Measuring an angle before constructing its double in the same half-plane','medium'],
 ['supplement-gap','supplement-difference','611ac0b41aebe4c3',p({E:180,F:0,K:136},{left:'E',right:'F',target:'K'}),'92','Comparing both supplementary angles instead of returning one measured angle','medium'],
 ['strict-acute-pairs','acute-count','89786aaf67b06f06',p({A:0,B:30,C:60,D:100,E:150,F:180}),'8','Counting every strictly acute unordered ray pair, explicitly excluding a 90-degree pair','hard'],
];

function optionsFor(row){
 const p=row.params,kind=row.modelId.replace('visual-wave2-','');
 if(kind==='construction-point')return ['U','V','W','T'];
 if(kind==='identify-ray')return ['OB','OC','OD','OE'];
 if(kind==='equal-angle')return p.candidates.map(([a,b])=>'∠'+a+'O'+b);
 if(kind==='bisector-check')return ['Жоқ: 52° және 104°','Иә: 52° және 52°','Жоқ: 48° және 56°','Иә: 104° және 104°'];
 return null;
}
export function prepareVisualWave2(){
 const inventory=read('problems/editorial/batches/visual-inventory.json');
 const scope=inventory.records.filter(r=>r.grade===5&&r.sourceFile.includes('/5-math-7-2-'));
 assert.equal(scope.length,29,'The complete captured visual topic must be represented');
 const specified=new Set(specs.map(s=>s[2]));assert.equal(specified.size,29);
 assert.deepEqual([...specified].sort(),scope.map(r=>r.sourceId).sort(),'No selective source omission or implicit family coverage');
 const oldRefs=new Set();
 for(const f of ['problems/editorial/batches/visual-foundations.json',...['core','fractions','geometry'].map(n=>'problems/editorial/synaq-standard-'+n+'.json')]){
  const data=read(f);for(const row of Array.isArray(data)?data:data.editions)for(const ref of row.sourceRefs)oldRefs.add(ref.sourceId);
 }
 const cache=new Map(),editions=[];
 for(const [suffix,kind,sourceId,params,answer,skill,difficulty]of specs){
  assert.ok(!oldRefs.has(sourceId),'Do not replace an existing source adaptation');
  const record=scope.find(r=>r.sourceId===sourceId);assert.ok(record);
  if(!cache.has(record.sourceFile))cache.set(record.sourceFile,read(record.sourceFile));
  const raw=cache.get(record.sourceFile).questions[record.sourceIndex];
  assert.equal(raw.id||raw.sourceContentId,sourceId);
  assert.ok(String(raw.solution||'').length>0,'Full archived solution is required for the addressed adaptation');
  const editionId='visual-wave2-'+suffix;
  const row={editionId,modelId:'visual-wave2-'+kind,grade:5,topic:'geo',difficulty,params,answer,
   sourceRefs:[{sourceId,sourceFile:record.sourceFile}],sourceOccurrenceId:record.occurrenceId,
   sourceCanonicalSha256:editionHash(raw),sourceSkill:skill,
   adaptationChanges:[
    'Әр сақталған көрнекі тапсырманың нақты дағдысы жеке қаралып, жаңа шарт пен деректер жасалды.',
    'Бұрыштар, белгілер және жауап қайта таңдалды; дұрыс жауап бағыт векторлары не барлық жұптарды тізу арқылы бөлек есептелді.',
    'Транспортирдің екі шкаласы мен 181 белгісі жаңа геометриялық параметрлерден native SVG ретінде салынды; бастапқы сурет көшірілмеді.',
    'Биссектриса мен бұрыш салу есептерінде ізделетін жаңа сәуле суретке дайын жауап ретінде қосылмады.',
   ],
   figureTitle:'Бұрыштарды өлшеу зертханасы',
   figureDescription:'Әр кіші белгі 1°. Ішкі шкала көк, сыртқы шкала қара. Ішкі шкаладағы бағыттар: '+params.rays.map(r=>'O'+r.label+' — '+r.mark+'°'+(r.pointOnly?' (белгіленген нүкте)':r.outside?' (құралдан тыс)':'')).join('; ')+'. Құралдың бұрылуы: '+params.rotation+'°.',
   image:'/figures/synaq-editions/'+editionId+'.svg',editorialStatus:'draft',minimumPlan:'pro',
   figureReview:{status:'draft',required:'Independent per-source skill, answer, both scale rows, exact marks and 343px readability review'},
   verificationModule:'scripts/editorial/visual-wave2-models.mjs'};
  const options=optionsFor(row);if(options)row.options=options;
  row.statement=statementFor(row);row.solution=solutionFor(row);
  assert.notEqual(row.statement,raw.statement);assert.notEqual(row.answer,String(raw.sourceAnswer),'An addressed new answer is required');
  row.figureSha256=crypto.createHash('sha256').update(svgFor(row)).digest('hex');
  row.independentVerification={status:'computed_awaiting_external_review',...verifyEdition(row)};
  editions.push(row);
 }
 return {schemaVersion:1,createdAt:'2026-10-23',status:'draft_awaiting_independent_review',
  sourcePolicy:'Only saved archive records are read. Every source occurrence in the selected visual topic has its own new condition, parameters, computed answer and native protractor. No trace or source image is reused.',
  publication:{allowed:false,minimumInternalPlanAfterVerification:'pro',publicPlanName:'Standard'},
  coverage:{scope:'All captured visual occurrences in grade 5 topic 7.2, levels 1/2/3/test',sourceVisualOccurrences:29,addressedDrafts:editions.length,
   exactSourceIds:[...specified].sort(),missingSourceIds:[],distinctModels:new Set(editions.map(r=>r.modelId)).size,
   semantics:'29 individual source-specific drafts, sharing 20 explicit model forms. No other source tasks are implicitly covered by these models.'},editions};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const data=prepareVisualWave2();
 if(process.argv.includes('--write')){
  for(const row of data.editions)fs.writeFileSync(path.join(root,'frontend/public',row.image),svgFor(row));
  fs.writeFileSync(path.join(root,'problems/editorial/batches/visual-wave2-protractors.json'),JSON.stringify(data,null,2)+'\n');
 }
 console.log(JSON.stringify(data.coverage,null,2));
}
