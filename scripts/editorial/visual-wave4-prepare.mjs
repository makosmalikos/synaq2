import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {editionHash} from './edition-review.mjs';
import {statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from './visual-wave4-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const topics=[1,3,5,7,8,9,10,11,12];
const inScope=r=>r.grade===6&&topics.some(t=>r.sourceFile.includes('/6-math-2-'+t+'-level'));
const makePoints=(obj,min,step)=>Object.entries(obj).map(([label,v])=>{assert.ok(Number.isInteger((v-min)/step));return {label,tick:(v-min)/step};});
const axis=(obj,min,max,step=1,extra={})=>({scene:'axis',min,max,step,points:makePoints(obj,min,step),labels:[0,step<=1?1:step],...extra});
const vertical=(obj,min,max,step,labelEvery,extra={})=>axis(obj,min,max,step,{scene:'vertical',labelEvery,...extra});
const thermo=(obj,min,max,step,labelEvery,extra={})=>({scene:'thermo',min,max,step,readings:makePoints(obj,min,step),labelEvery,...extra});
const arrow=(from,to,showDelta=true)=>({from,to,showDelta});
const bar=values=>({scene:'bars',step:5,ticks:values.map(v=>v/5)});
const specs=[
 ['daily-loss','loss-days','db4098bcaac62b74',bar([20,-10,-15,5,-25]),'3','Counting negative daily bars rather than adding their magnitudes','num','basic'],
 ['negative-thermometer','thermo-reading','2b6d7687ddd09b8b',thermo({A:-25},-40,20,5,2),'-25','Reading a negative halfway thermometer mark by inferring the five-degree minor step','num','basic'],
 ['below-sea-point','depth-point','f557af3836932b84',vertical({A:250,C:50,B:-100,D:-250},-350,350,50,2,{depth:250}),'D','Identifying a labelled point at a specified depth below the zero sea-level reference','num','basic'],
 ['shop-net-result','net-profit','3388ac6e2c7ddc7c',bar([45,-20,30,-15,40,-25]),'55','Reading and combining signed daily gains/losses rather than absolute bar heights','num','medium'],
 ['signed-height-label','signed-statement','a1953f8866e8802a',vertical({A:210,B:-90,C:90,D:-270},-300,240,30,2,{candidates:[{label:'A',value:180},{label:'B',value:90},{label:'C',value:90},{label:'D',value:270}]}),'C: +90 м','Selecting the unique correct signed height after reading unlabeled minor ticks','num','medium'],
 ['warming-above-zero','warm-excess','dd3d54534e2aa5e3',thermo({A:-9},-18,18,3,2,{change:14}),'5','Reading the initial negative temperature and finding only the warming remainder above zero','num','medium'],
 ['mine-distance-and-level','mine-dual','1033360b481ea8d2',vertical({M:180,N:-300},-360,240,60,2,{upper:'M',lower:'N'}),'480 м; -300 м','Distinguishing vertical travel distance across zero from a signed final mine level','num','hard'],
 ['four-measurement-changes','variation-total','222d5797f67d2305',thermo({'1':-6,'2':8,'3':4,'4':-10},-12,12,2,2),'32','Adding the magnitudes of all consecutive temperature changes rather than the net change','num','hard'],
 ['running-loss-days','cumulative-loss','8016c07da37d2bf8',bar([10,-25,5,-10,15,-5,20]),'5','Counting negative prefix balances after each day, not negative daily bars','num','hard'],
 ['opposite-number-cards','cancellation-cards','2fdda86cdc3d2984',{scene:'cards',values:[15,-9,11,-15,9]},'11','Reading five cards and grouping opposite addends with cancellation','num','medium'],
 ['opposite-coordinate-sum','coordinate-cancellation','2f40cccc9dffd261',axis({A:-6,B:-3,C:3,D:6,E:8},-7,9),'8','Reading five point coordinates and identifying two opposite-coordinate pairs before adding','num','medium'],
 ['cross-zero-segment','distance-crosszero','47e309c038176006',axis({A:-7,B:4},-8,5,1,{first:'A',second:'B'}),'11','Unsigned coordinate-segment length across zero, not the signed endpoint difference in arbitrary order','num','basic'],
 ['left-arrow-subtraction','subtraction-equality','6554f717e951b492',axis({A:5,B:-6},-7,6,1,{arrows:[arrow(5,-6,false)],startLabel:'A',endLabel:'B'}),'5 − 11 = -6','Matching a leftward movement to subtraction from its actual starting coordinate','num','medium'],
 ['two-times-rise','rise-two-readings','a6adfea8cdefb818',thermo({'09:00':-8,'15:00':6},-12,12,1,4),'14','Comparing two thermometer readings at different times across zero','num','medium'],
 ['platform-water-gap','altitude-gap','513927365fbae78f',vertical({A:45,B:-30},-40,60,5,4,{upper:'A',lower:'B'}),'75','Reading a non-unit vertical height scale before finding the upper-to-lower separation','num','medium'],
 ['unit-line-distance','distance-unit','e69d598606515f98',axis({A:-6,B:4},-7,5,1,{first:'A',second:'B'}),'10','Coordinate distance on a scale calibrated by zero and one','num','basic'],
 ['three-unit-ticks','distance-scaled','d5b240fb28f61126',axis({A:-9,B:6},-15,12,3,{first:'A',second:'B'}),'15','Inferring a non-unit tick interval before converting five tick gaps to coordinate units','num','medium'],
 ['restore-left-coordinate','restore-coordinate','73e29bf14704c201',axis({M:-5,K:3},-7,5,1,{known:'K',unknown:'M',distance:8,hideTicks:true,labels:[3],hiddenLabels:['M']}),'-5','Recovering the coordinate of a left-hand point from a known coordinate and an unsigned distance','num','medium'],
 ['choose-distance-pair','pair-distance','a494f2ecaa253f41',axis({A:-7,B:-3,C:0,D:3},-8,4,1,{goal:6,candidates:[['A','B'],['A','C'],['B','D'],['C','D']]}),'B және D','Choosing the unique point pair with a specified coordinate distance','num','medium'],
 ['integer-point-count','integer-count','5b1a1a7288355eae',axis({A:-3.5,B:-2,C:-.5,D:0,E:1.5},-4,2,.5),'2','Distinguishing integer and half-integer plotted coordinates, explicitly including zero as an integer','num','basic'],
 ['negative-integer-region','number-set-region','fbb9f5e09817ebfc',{scene:'sets',numerator:-14,denominator:1,regions:{natural:'C',integerOther:'A',rationalOther:'B'}},'A','Placing a negative integer in Z outside N within the nested N/Z/Q diagram; region letters are newly authored','sets','medium'],
 ['negative-neighbours','neighbor-integers','c090fc0a55cec632',axis({A:-3.5},-5,2,.5,{target:'A'}),'-4 және -3','Finding the two adjacent integers surrounding a negative half-integer point','num','medium'],
 ['greatest-negative-point','greatest-negative','7d49fa20115e6f03',axis({A:-.5,B:1,C:-3,D:2.5},-4,3,.5),'A','Selecting the rightmost negative point while excluding positive coordinates','num','medium'],
 ['strict-double-bound','strict-interval','c4fe243413201633',axis({P:-4.5,Q:-1.5,R:-2.5,S:.5},-5,1,.5,{lower:-3,upper:-2,labels:[-3,-2,0,1]}),'R','Identifying the one plotted half-integer inside a strict double inequality','sys','medium'],
 ['below-strict-threshold','strict-count','35976852a06eec51',axis({A:-7,B:-6,C:-4,D:-3,E:-1,F:1,G:2},-8,3,1,{bound:-3,labels:[-3,0,1]}),'3','Counting points strictly to the left of a threshold while excluding the point on the threshold','num','medium'],
 ['coldest-city','coldest-city','6f9bc9b6357c3003',thermo({A:-4,B:-16,C:6},-20,10,2,5,{names:['Қарағанды','Көкшетау','Тараз']}),'Көкшетау','Comparing three signed temperatures and returning the coldest city rather than the largest absolute positive number','num','medium'],
 ['signed-left-displacement','arrow-displacement','92e2a4fd06126654',axis({A:5,B:-3},-5,6,1,{arrows:[arrow(5,-3,false)],startLabel:'A',endLabel:'B'}),'-8','Recovering the signed added number from an arrow that crosses zero to the left','num','medium'],
 ['read-start-then-move','arrow-endpoint-read','c10bdd32ad7b8b4e',axis({A:-5,'?':4},-7,6,1,{arrows:[arrow(-5,4)],startLabel:'A',endLabel:'?',change:9,hiddenLabels:['?']}),'4','Reading an unnamed numeric starting coordinate before applying a given positive change','num','medium'],
 ['given-start-then-move','arrow-endpoint-given','39068aeb8d28f343',axis({A:-4,'?':6},-6,8,1,{arrows:[arrow(-4,6)],startLabel:'A',endLabel:'?',change:10,hiddenLabels:['?']}),'6','Locating a result from an explicitly supplied negative start and a positive rightward change','num','medium'],
 ['positive-jump-equation','arrow-equality','19609b99b1954b4c',axis({A:-3,B:5},-5,7,1,{arrows:[arrow(-3,5)],startLabel:'A',endLabel:'B'}),'(-3) + 8 = 5','Matching a positive jump across zero to an addition equation with the same start and direction','num','medium'],
 ['two-left-jumps','two-negative-equation','546915cc3a56a35a',axis({A:-4,B:-11},-12,1,1,{arrows:[arrow(0,-4),arrow(-4,-11)]}),'(-4) + (-7) = -11','Combining two consecutive leftward movements from zero without mistaking the endpoint for the second addend','num','medium'],
 ['frost-magnitude','frost-depth','5fb5cbd6281d3f91',thermo({A:-9},-18,12,3,2,{drop:8}),'17','Reading an initial frost and returning the positive below-zero magnitude after a further temperature drop','num','medium'],
 ['two-negative-coordinates','negative-coordinate-sum','e5f8e1299d755a09',axis({M:-7,N:-3},-8,2),'-10','Reading and adding two negative point coordinates, preserving the common negative sign','num','medium'],
 ['mixed-left-result','mixed-arrow-endpoint','e3495f404ac855cc',axis({M:3,'?':-5},-7,5,1,{arrows:[arrow(3,-5)],startLabel:'M',endLabel:'?',change:-8,hiddenLabels:['?']}),'-5','Reading a positive initial point and applying a larger-magnitude negative jump across zero','num','medium'],
 ['mixed-jump-equation','arrow-equality','5bbb4ebf1eda763c',axis({A:-6,B:4},-8,6,1,{arrows:[arrow(-6,4)],startLabel:'A',endLabel:'B'}),'(-6) + 10 = 4','Matching the displayed negative-to-positive jump rather than its reverse-direction equality','num','medium'],
 ['morning-warming','warming-temperature','b49b31508b592662',thermo({A:-6},-10,10,1,5,{change:15}),'9','Reading a one-degree initial negative temperature then adding the stated warming','num','medium'],
 ['sensor-descent','undersea-descent','9f2b5649ebdd5c31',vertical({A:7},-15,10,1,5,{target:'A',drop:18}),'-11','Reading an above-water starting height and applying a descent that crosses into negative underwater height','num','medium'],
];
const sign=n=>n>0?'+'+n:String(n);
function optionsFor(row){
 const p=row.params,k=row.modelId.replace('visual-wave4-','');
 switch(k){
 case 'thermo-reading':return ['-25','25','-20','-30'];
 case 'depth-point':case 'greatest-negative':return ['A','B','C','D'];
 case 'signed-statement':return p.candidates.map(c=>c.label+': '+sign(c.value)+' м');
 case 'mine-dual':return ['480 м; -300 м','120 м; -300 м','480 м; +300 м','300 м; -480 м'];
 case 'number-set-region':return ['A','B','C','Сыртында'];
 case 'neighbor-integers':return ['3 және 4','-3 және -2','-4 және -3','-5 және -4'];
 case 'strict-interval':return ['P','Q','R','S'];
 case 'coldest-city':return [...p.names,'Бәрінде бірдей'];
 case 'arrow-displacement':return ['8','-8','2','-2'];
 case 'arrow-equality':return row.sourceRefs[0].sourceId==='19609b99b1954b4c'?['3 + 8 = 11','(-3) + 8 = 5','(-3) + (-8) = -11','5 + (-8) = -3']:['4 + (-10) = -6','(-6) + 10 = 4','6 + (-10) = -4','(-6) + 4 = -2'];
 case 'two-negative-equation':return ['(-4) + 7 = 3','(-4) + (-7) = -11','(-4) + (-11) = -15','4 + 7 = 11'];
 case 'negative-coordinate-sum':return ['10','-10','-4','-7'];
 case 'mixed-arrow-endpoint':return ['5','-5','-11','11'];
 case 'undersea-descent':return ['11','-25','25','-11'];
 case 'restore-coordinate':return ['11','5','-5','-8'];
 case 'pair-distance':return p.candidates.map(([a,b])=>a+' және '+b);
 case 'subtraction-equality':return ['5 + 11 = 16','-6 − 11 = -17','-6 − 5 = -11','5 − 11 = -6'];
 default:return null;
 }
}
export function prepareVisualWave4(){
 const inv=read('problems/editorial/batches/visual-inventory.json'),scope=inv.records.filter(inScope);assert.equal(scope.length,38);
 const existing=new Map();
 for(const file of ['problems/editorial/batches/visual-foundations.json','problems/editorial/batches/visual-wave2-protractors.json','problems/editorial/batches/visual-wave3-composites.json',...['core','fractions','geometry'].map(n=>'problems/editorial/synaq-standard-'+n+'.json')]){
  const pack=read(file);for(const row of Array.isArray(pack)?pack:pack.editions)for(const ref of row.sourceRefs)existing.set(ref.sourceId,row.editionId);
 }
 const retained=scope.filter(r=>existing.has(r.sourceId)).map(r=>({sourceId:r.sourceId,editionId:existing.get(r.sourceId)}));
 assert.deepEqual(retained,[{sourceId:'698c58efc5c36cc3',editionId:'visual-temperature-rise'}]);
 assert.equal(specs.length,37);assert.equal(new Set(specs.map(r=>r[2])).size,37);
 assert.deepEqual(specs.map(r=>r[2]).sort(),scope.filter(r=>!existing.has(r.sourceId)).map(r=>r.sourceId).sort());
 const editions=[],cache=new Map();
 for(const [suffix,model,sourceId,params,answer,sourceSkill,topic,difficulty]of specs){
  const record=scope.find(r=>r.sourceId===sourceId);assert.ok(record&&!existing.has(sourceId));
  if(!cache.has(record.sourceFile))cache.set(record.sourceFile,read(record.sourceFile));
  const raw=cache.get(record.sourceFile).questions[record.sourceIndex];assert.equal(raw.id||raw.sourceContentId,sourceId);assert.ok(raw.solution);
  const editionId='visual-wave4-'+suffix,row={editionId,modelId:'visual-wave4-'+model,grade:6,topic,difficulty,params,answer,
   sourceRefs:[{sourceId,sourceFile:record.sourceFile}],sourceOccurrenceId:record.occurrenceId,sourceCanonicalSha256:editionHash(raw),sourceSkill,
   adaptationChanges:[
    'Әр дереккөздің нақты сұрағы жеке сақталды: координата, қашықтық, таңбалы өзгеріс, аяз шамасы және жиналған нәтиже бір-бірімен алмастырылмады.',
    'Сандар, шкалалар, қала атаулары не белгілер және дұрыс жауап жаңадан таңдалды; N/Z/Q есебінде теріс бүтін санның дағдысы сақталып, аймақ әріптері өзгертілді.',
    'Барлық сызбалар жаңа tick-index параметрлерінен native SVG ретінде салынды; дайын сурет пен traced path қолданылмады.',
    'Белгісіз координаталарға арналған сандық жауаптар суреттің жазуына немесе accessible сипаттамасына дайын санмен қосылмады.',
   ],editorialStatus:'draft',minimumPlan:'pro',figureTitle:'Таңбалы шамалар зертханасы',
   figureReview:{status:'draft',required:'Independent source-skill, exact scale, directed arrows, units, unknown labels and 343px readability review'},
   image:'/figures/synaq-editions/'+editionId+'.svg',verificationModule:'scripts/editorial/visual-wave4-models.mjs'};
  row.statement=statementFor(row);row.solution=solutionFor(row);row.figureDescription=descriptionFor(row);
  const opts=optionsFor(row);if(opts)row.options=opts;
  assert.notEqual(row.statement,raw.statement);assert.notEqual(row.answer,String(raw.sourceAnswer));
  row.figureSha256=crypto.createHash('sha256').update(svgFor(row)).digest('hex');
  row.independentVerification={status:'computed_awaiting_external_review',...verifyEdition(row)};editions.push(row);
 }
 return {schemaVersion:1,createdAt:'2026-10-23',status:'draft_awaiting_independent_review',sourcePolicy:'Saved grade6 rational-number visual sources only; all drawings and data are independently authored, with no downloads or original traces.',
  publication:{allowed:false,minimumInternalPlanAfterVerification:'pro',publicPlanName:'Standard'},
  coverage:{scope:'All captured visual sources in grade6 topics2.1,2.3,2.5,2.7–2.12',sourceVisualOccurrences:38,addressedNewDrafts:37,previousEditionsRetained:retained,missingSourceIds:[],
   exactNewSourceIds:specs.map(r=>r[2]).sort(),distinctModels:new Set(editions.map(q=>q.modelId)).size,
   semantics:'37 addressed new editions plus1 retained occurrence exhaust the stated visual topics. Model IDs identify explicit question forms, not a claim that all forms are different mathematical families.'},editions};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const pack=prepareVisualWave4();
 if(process.argv.includes('--write')){
  for(const row of pack.editions)fs.writeFileSync(path.join(root,'frontend/public',row.image),svgFor(row));
  fs.writeFileSync(path.join(root,'problems/editorial/batches/visual-wave4-signed-scales.json'),JSON.stringify(pack,null,2)+'\n');
 }console.log(JSON.stringify(pack.coverage,null,2));
}
