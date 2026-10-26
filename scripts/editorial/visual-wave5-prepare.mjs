import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {editionHash} from './edition-review.mjs';
import {statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from './visual-wave5-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const topics=[2,4,13,14,15,17,18],inScope=r=>r.grade===6&&topics.some(t=>r.sourceFile.includes('/6-math-2-'+t+'-level'));
const axis=(points,minTick,maxTick,denominator=1,extra={})=>({scene:'axis',points:Object.entries(points).map(([label,tick])=>({label,tick})),minTick,maxTick,denominator,tickEvery:1,labels:[0,denominator],...extra});
const thermo=(reading,min,max,step,labelEvery,extra={})=>({scene:'thermo',reading,min,max,step,labelEvery,...extra});
const specs=[
 ['equal-left-jumps','jump-product','b3d2a22a51d4b36f',axis({E:-12},-14,2,1,{jumpStart:0,delta:-3,jumpCount:4,finalLabel:'E'}),'(-3) · 4 = -12','Reading repeated negative jump size and count in their actual factor order','num','medium',['(-3) · 4 = -12','(-4) · 3 = -12','3 · 4 = 12','(-3) · 3 = -9']],
 ['coordinate-product','coordinate-product','b617010feb6317eb',axis({A:-5,B:4},-7,6,1,{first:'A',second:'B'}),'-20','Reading opposite-signed coordinates before multiplying, rather than adding or subtracting','num','basic',['-20','20','-1','-9']],
 ['row-column-mosaic','commutation-grid','87e1df75a32e5951',{scene:'grid',rows:3,cols:7},'3 · 7 = 7 · 3','Matching commutativity to the exact row/column counts of the pictured grid','num','basic',['3 + 7 = 7 + 3','3 · 6 = 6 · 3','4 · 7 = 7 · 4','3 · 7 = 7 · 3']],
 ['round-product-pair','round-pair','b3a0444b2a831e4f',{scene:'cards',values:[-125,3,6,-8],roundTarget:1000},'-125 және -8','Using associativity/commutativity to group the unique negative pair making a power of ten','num','medium',['3 және 6','-125 және -8','-125 және 3','6 және -8']],
 ['three-factor-cards','card-product','64ab4b91b9b476b2',{scene:'cards',values:[-20,9,-5]},'900','Reading three factors and efficiently grouping two negative factors before multiplying','num','medium',null],
 ['uniform-hourly-cooling','cooling-rate','b402d97b1556f731',thermo(-28,-40,10,2,5,{hours:7}),'4','Reading a negative final thermometer and dividing its cooling magnitude by elapsed hours','num','medium',null],
 ['first-equal-left-part','equal-parts-coordinate','09b98f083c21b883',axis({A:-24,B:-4},-28,4,1,{tickEvery:4,labels:[-24,0],jumpStart:0,delta:-4,jumpCount:6,finalLabel:'A',target:'B',hiddenLabels:['B']}),'-4','Dividing a labelled negative endpoint into pictured equal parts to recover the first left subdivision','num','medium',['4','-4','-6','-20']],
 ['ordered-coordinate-quotient','coordinate-quotient','a575c57fbbe41faf',axis({A:-12,B:3},-14,6,1,{first:'A',second:'B'}),'-4','Dividing A by B after reading both signed coordinates, preserving operand order','num','medium',['-4','4','-1/4','-9']],
 ['remainder-period-length','period-length','3d08b34753f6e26d',{scene:'division',numerator:3,denominator:11,trace:[[3,2,8],[8,7,3]]},'2','Finding the length of a repeating decimal by returning to the initial long-division remainder','frac','medium',null],
 ['remainder-period-notation','period-notation','3189f640178f9d2b',{scene:'division',numerator:3,denominator:7,trace:[[3,4,2],[2,2,6],[6,8,4],[4,5,5],[5,7,1],[1,1,3]]},'0,(428571)','Writing the full repeating digit block in its original order from verified long-division steps','frac','medium',['0,(428571)','0,4(28571)','0,(142857)','0,(42857)']],
 ['repeat-on-ninths','repeat-axis','c9f6f219101d9ba9',axis({K:2,L:4,M:6,N:7},0,9,9,{repeatDigit:7}),'N','Converting a one-digit repeating decimal to ninths and locating its point on a subdivided unit line','frac','medium',['K','L','M','N']],
 ['repeat-sector-remainder','repeat-sector','e53ac7130956e007',{scene:'sectors',parts:9,repeatDigit:8,colored:3},'5','Converting a recurring decimal to the required number of equal sectors and subtracting already colored sectors','frac','medium',null],
 ['read-negative-integer','integer-coordinate','4faa8940a8203ee9',axis({A:-5},-7,3,1,{target:'A'}),'-5','Reading a negative integer coordinate from a unit scale','num','basic',['-5','5','-4','-6']],
 ['read-negative-half','half-coordinate','c00472c6df58a577',axis({B:-7},-10,4,2,{target:'B'}),'-3,5','Reading a negative half-integer using the two subdivisions of each unit','frac','basic',['-3,5','3,5','-2,5','-4,5']],
 ['opposite-of-point','opposite-number','89f8f85104dd6c0b',axis({K:-9},-11,3,1,{target:'K'}),'9','Reading a negative coordinate and then changing its sign to find the opposite number','num','basic',null],
 ['count-unit-intervals','unit-length','0a90c6314708c851',axis({M:-4,N:3},-6,5,1,{first:'M',second:'N'}),'7','Counting unit intervals across zero rather than counting the endpoint marks','num','basic',null],
 ['find-opposite-pair','opposite-pair','5abaf7a10362bfe3',axis({P:-6,Q:-2,R:6,S:5},-8,8),'P және R','Selecting the unique pair symmetric about zero among four signed points','num','basic',['P және R','P және S','Q және R','Q және S']],
 ['count-quarter-gaps','minor-gap-count','bfc92b20978bc535',axis({M:-5,N:3},-8,8,4,{first:'M',second:'N'}),'8','Distinguishing a count of quarter-unit gaps from their length in full units','frac','medium',null],
 ['calibrate-from-two-labels','two-label-calibration','9edafd5e160e3424',axis({A:-4,B:4,C:10},-8,14,1,{target:'C',labels:[-4,4],tickEvery:2,calibration:[{label:'A',value:-4},{label:'B',value:4}],hiddenLabels:['C']}),'10','Inferring the two-unit tick scale from two nonzero labelled points before recovering a third','num','medium',null],
 ['thermometer-modulus','thermo-absolute','e8900039a18bc875',thermo(-18,-30,20,2,5),'18','Reading a negative fine thermometer scale and returning the nonnegative absolute value','num','basic',null],
 ['whole-mixed-modulus','mixed-absolute','deb929b3b35930b2',{scene:'mixed',whole:2,numerator:3,denominator:5},'(2 + (3/5))','Taking the absolute value of the entire negative mixed numeral without losing its whole part','frac','basic',['(2 + (3/5))','-(2 + (3/5))','(3/5)','(2 + (2/5))']],
 ['negative-from-origin-gap','bracket-negative','a8684eeff1b39ec1',axis({M:-4},-6,2,1,{target:'M',bracket:4,hideTicks:true,labels:[0],hiddenLabels:['M']}),'-4','Combining unsigned distance from zero with the pictured left-hand position to choose one signed coordinate','num','basic',['4','-4','-4 немесе 4','-3']],
 ['point-coordinate-modulus','coordinate-absolute','d0f06e3290a45e15',axis({A:-7},-9,3,1,{target:'A'}),'7','Reading a negative point and measuring its distance from the coordinate origin','num','basic',null],
 ['sum-opposite-moduli','opposite-absolutes-sum','38c66880933c5246',axis({P:-5,Q:5},-7,7,1,{first:'P',second:'Q'}),'10','Adding magnitudes of opposite signed coordinates rather than cancelling the original signed values','num','basic',null],
 ['farthest-point-modulus','greatest-absolute','d72637103a243c6c',axis({A:-4,B:-7,C:1,D:6},-9,8),'B','Comparing distances from zero rather than comparing signed order alone','num','basic',['A','B','C','D']],
];
export function prepareVisualWave5(){
 const scope=read('problems/editorial/batches/visual-inventory.json').records.filter(inScope);assert.equal(scope.length,26);
 const retained=[{sourceId:'e6db1123d5557018',editionId:'geometry-park-coordinate-walk'}];
 const geo=read('problems/editorial/synaq-standard-geometry.json').editions;assert.ok(geo.some(q=>q.editionId===retained[0].editionId&&q.sourceRefs.some(r=>r.sourceId===retained[0].sourceId)));
 assert.deepEqual(specs.map(r=>r[2]).sort(),scope.filter(r=>r.sourceId!==retained[0].sourceId).map(r=>r.sourceId).sort());
 const editions=[];
 for(const [suffix,model,sourceId,params,answer,sourceSkill,topic,difficulty,options]of specs){
  const record=scope.find(r=>r.sourceId===sourceId),raw=read(record.sourceFile).questions[record.sourceIndex];assert.equal(raw.id,sourceId);assert.ok(raw.solution);
  const editionId='visual-wave5-'+suffix,row={editionId,modelId:'visual-wave5-'+model,grade:6,topic,difficulty,params,answer,sourceRefs:[{sourceId,sourceFile:record.sourceFile}],sourceOccurrenceId:record.occurrenceId,sourceCanonicalSha256:editionHash(raw),sourceSkill,
   adaptationChanges:['Дереккөздің нақты дағдысы сақталып, сандар, бөлшектің бөліктері, көбейткіштер, координаталар, белгілер және жауап жаңадан таңдалды.','Теріс таңбаның, модульдің, көбейту реттілігінің және периодтағы цифрлар блогының мағынасы жеке тексерілді.','Барлық сурет жаңа бүтін tick numerator, ұяшық, доға немесе қалдық параметрлерінен native SVG ретінде салынды; түпнұсқа raster/traced path қолданылмады.'],
   editorialStatus:'draft',minimumPlan:'pro',figureTitle:'Сандар мен үлестер зертханасы',figureReview:{status:'draft',required:'Independent full source-skill, exact rational geometry, remainder arithmetic and 343px native visual review'},image:'/figures/synaq-editions/'+editionId+'.svg',verificationModule:'scripts/editorial/visual-wave5-models.mjs'};
  if(options)row.options=options;row.statement=statementFor(row);row.solution=solutionFor(row);row.figureDescription=descriptionFor(row);assert.notEqual(row.statement,raw.statement);assert.notEqual(row.answer,String(raw.sourceAnswer));row.figureSha256=crypto.createHash('sha256').update(svgFor(row)).digest('hex');row.independentVerification={status:'computed_awaiting_external_review',...verifyEdition(row)};editions.push(row);
 }
 return {schemaVersion:1,createdAt:'2026-10-23',status:'draft_awaiting_independent_review',sourcePolicy:'Only saved visual rational-number sources; no collection or downloading, no original traced paths.',publication:{allowed:false,minimumInternalPlanAfterVerification:'pro',publicPlanName:'Standard'},coverage:{scope:'All captured visual sources in grade6 topics2.2,2.4,2.13–2.15,2.17–2.18',sourceVisualOccurrences:26,addressedNewDrafts:25,previousEditionsRetained:retained,missingSourceIds:[],exactNewSourceIds:specs.map(r=>r[2]).sort(),distinctModels:new Set(editions.map(q=>q.modelId)).size,semantics:'25 individually addressed drafts plus1 retained verified edition cover all26 visual source occurrences. Explicit model forms do not imply25 unrelated mathematical families.'},editions};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const pack=prepareVisualWave5();if(process.argv.includes('--write')){for(const q of pack.editions)fs.writeFileSync(path.join(root,'frontend/public',q.image),svgFor(q));fs.writeFileSync(path.join(root,'problems/editorial/batches/visual-wave5-rational-visuals.json'),JSON.stringify(pack,null,2)+'\n');}console.log(JSON.stringify(pack.coverage,null,2));}
