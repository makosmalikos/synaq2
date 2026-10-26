import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {editionHash} from './edition-review.mjs';
import {statementFor,solutionFor,expressionOptions,svgFor,verifyEdition} from './visual-wave3-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const grid=rows=>rows.flatMap((length,y)=>Array.from({length},(_,x)=>[x,y]));
const cut=(w,h,cw,ch,rest={})=>({w,h,cw,ch,...rest});
const specs=[
 ['square-sticker','square-cut','ecb84842d4069369',cut(13,13,5,5),'144','Square-minus-corner-square area, using squared side lengths','basic'],
 ['corner-model','corner-area','aeea3643ac316b6b',cut(14,9,6,4),'102','Rectangle-minus-corner-rectangle area, with independently retained side dimensions','basic'],
 ['joined-sign','two-rectangles','02e05679fe0c6af1',{aw:7,ah:4,bw:3,bh:2},'34','Adding two non-overlapping rectangular part areas rather than their dimensions or perimeters','basic'],
 ['diagonal-paper','diagonal-half','0034c46223b47376',{w:12,h:7},'42','A right triangle obtained as exactly half of its diagonal-cut rectangle','basic'],
 ['three-piece-panel','three-pillars','8325cc187c202436',{pillarW:3,pillarH:8,gap:5,bridgeH:2},'58','Adding three non-overlapping rectangular areas in a P-shaped panel','basic'],
 ['t-pointer','t-shape','448a15b35182fede',{barW:12,barH:3,stemW:4,stemH:6},'60','T-shaped composite area with a stem that starts below, without overlapping, the top bar','basic'],
 ['count-grid','grid-area','e8ccb403629e2a2d',{rows:[8,8,5],cells:grid([8,8,5]),side:1},'21','Counting actual unit-area cells of a nonrectangular three-row figure','basic'],
 ['inner-zone','inner-garden','25940b79122dfafc',{w:23,h:16,cw:7,ch:5,holeX:8,holeY:5,unit:'м'},'333','Subtracting a strictly interior rectangular area from its surrounding rectangle','basic'],
 ['choose-formula','choose-expression','eaaaf44b606d5f52',cut(13,9,4,3,{unit:'м'}),'13 × 9 − 4 × 3','Selecting a correct area expression, rather than merely computing a numerical area','medium'],
 ['reject-formula','wrong-expression','6d3d30b163146fbd',cut(14,9,5,3,{unit:'м'}),'14 × 9 − 5 × 6','Identifying exactly one incorrect expression among three valid decompositions of a cut rectangle','medium'],
 ['four-flowerbeds','four-corners','099a5f8d2cd388e8',{w:15,cut:2,unit:'м'},'209','Subtracting all four disjoint equal corner squares from a larger square','medium'],
 ['workshop-wall','wall-openings','20a732fdb8081f54',{w:8,h:4,windowW:3,windowH:1,windowX:1,windowY:1,doorW:2,doorH:3,doorX:5,unit:'м'},'23','Wall area after subtracting two separate openings with different dimensions','medium'],
 ['corner-ribbon','corner-perimeter','6c2785da4075c9f6',cut(16,9,6,4),'50','Corner-cut perimeter invariance, explicitly contrasting area subtraction with boundary length','medium'],
 ['crossed-paths','cross-paths','cd7976272c84d5a2',{w:33,h:23,path:3,unit:'м'},'600','Remaining area after two crossing full-span paths, counting their intersection only once','medium'],
 ['notched-coating','notch-paint','fce143ca012d7627',cut(13,9,5,4,{rate:180,unit:'м'}),'17460','A notched composite floor area followed by material mass per square metre','medium'],
 ['restore-width','inverse-width','5c5f16eb7c720f4e',cut(12,9,5,3,{remaining:93}),'9','Recovering an unknown original width from the remaining area and a removed corner rectangle','medium'],
 ['floor-budget','floor-cost','bbe90bcc302b569b',cut(8,5,3,2,{rate:3500,unit:'м'}),'119000','Floor area excluding furniture footprint followed by a price per square metre','medium'],
 ['reading-corner','rectangle-triangle','47939f42d2cc71fe',{w:6,h:4,leg:3,unit:'м'},'30','Sum of a rectangle and a right triangle sharing a full side, without overlap','medium'],
 ['l-tile-border','l-grid-perimeter','ce98fb01343f7ece',{cells:[[0,0],[0,1],[0,2],[0,3],[1,3]],side:4},'48','Boundary perimeter of an L polyomino, excluding every shared square side','hard'],
 ['overlap-cards','overlap-union','db67a1dd9ef677ec',{aw:8,ah:5,bw:6,bh:4,ow:3},'52','Union area of partially overlapping rectangles, subtracting their common area once','hard'],
 ['pool-walkway','outer-border','be365ee3bcaaabc0',{w:13,h:7,border:2,context:'pool',unit:'м'},'96','Outer uniform rectangular border area, increasing both dimensions by twice the border width','hard'],
 ['whole-tile-packs','tile-boxes','c66c0a12b89d2d1e',cut(7,5,3,2,{tileCm:25,pack:12,unit:'м'}),'39','Composite floor area, squared centimetre-to-metre tile conversion, then whole-pack ceiling','hard'],
 ['cross-two-measures','cross-area-perimeter','a6a45d5b92cbfe1b',{cells:[[1,0],[0,1],[1,1],[2,1],[1,2]],side:3},'45 см² және 36 см','Simultaneous area and exposed-edge perimeter of a five-square cross','hard'],
 ['stair-boundary','stair-perimeter','6a3f8a8a5799c6e1',{rows:[5,4,3,2,1],cells:grid([1,2,3,4,5]),side:3},'60','Perimeter of a left-aligned full staircase, consolidating the step lengths','hard'],
 ['test-corner','corner-area','ffc24145df9dfe13',cut(15,11,4,6),'141','An independent test instance of remaining area after a rectangular corner is removed','medium'],
 ['test-t-panel','t-shape','4f19f784d3d3ef83',{barW:14,barH:2,stemW:6,stemH:7},'70','Test T-panel area with independent top bar and below-bar stem dimensions','medium'],
 ['through-path','longitudinal-strip','d2ece4d7bd9a7660',{w:27,h:18,path:4,unit:'м'},'378','Remaining rectangle area after one full-length longitudinal strip is removed','medium'],
 ['picture-border','outer-border','9e712e03bb0545aa',{w:18,h:13,border:3,context:'frame',unit:'см'},'222','Picture-frame area from inner dimensions and the same added width on all four sides','hard'],
];

export function prepareVisualWave3(){
 const inv=read('problems/editorial/batches/visual-inventory.json'),scope=inv.records.filter(r=>r.grade===4&&r.sourceFile.includes('/4-math-4-3-'));
 assert.equal(scope.length,30);
 const existing=new Map();
 for(const file of ['problems/editorial/batches/visual-foundations.json','problems/editorial/batches/visual-wave2-protractors.json',...['core','fractions','geometry'].map(n=>'problems/editorial/synaq-standard-'+n+'.json')]){
  const pack=read(file);for(const row of Array.isArray(pack)?pack:pack.editions)for(const ref of row.sourceRefs)existing.set(ref.sourceId,row.editionId);
 }
 const reused=scope.filter(r=>existing.has(r.sourceId)).map(r=>({sourceId:r.sourceId,editionId:existing.get(r.sourceId)}));
 assert.deepEqual(reused.map(r=>r.sourceId).sort(),['ce5c3630b43e6904','b378b8e971afc3ff'].sort(),'The previous verified/draft editions are retained without rewriting them');
 assert.equal(specs.length,28);assert.equal(new Set(specs.map(r=>r[2])).size,28);
 assert.deepEqual(specs.map(r=>r[2]).sort(),scope.filter(r=>!existing.has(r.sourceId)).map(r=>r.sourceId).sort(),'Every remaining visual source is individually addressed');
 const editions=[],cache=new Map();
 for(const [suffix,model,sourceId,params,answer,sourceSkill,difficulty]of specs){
  const record=scope.find(r=>r.sourceId===sourceId);assert.ok(record&&!existing.has(sourceId));
  if(!cache.has(record.sourceFile))cache.set(record.sourceFile,read(record.sourceFile));
  const raw=cache.get(record.sourceFile).questions[record.sourceIndex];assert.equal(raw.id||raw.sourceContentId,sourceId);assert.ok(raw.solution);
  const editionId='visual-wave3-'+suffix,row={editionId,modelId:'visual-wave3-'+model,grade:4,topic:'geo',difficulty,params,answer,
   sourceRefs:[{sourceId,sourceFile:record.sourceFile}],sourceOccurrenceId:record.occurrenceId,sourceCanonicalSha256:editionHash(raw),sourceSkill,
   adaptationChanges:[
    'Сақталған бастапқы тапсырманың нақты сұрағы мен шешу дағдысы жеке қаралып сақталды; жаңа шарт пен өлшемдер жасалды.',
    'Әр фигура жаңа параметрлерден құрастырылды; бастапқы скан, traced SVG және дайын path қолданылмады.',
    'Аудан бірлік ұяшықтарды тізу арқылы, периметр тек ашық шеттерді санау арқылы формуладан бөлек тексерілді.',
    'Шамалар мен бірліктер, дұрыс/қате өрнек бағыты, белгісіз өлшем және материалға керек бүтін қорап талабы сақталды.',
   ],editorialStatus:'draft',minimumPlan:'pro',
   figureTitle:'Құрама фигуралар шеберханасы',
   figureReview:{status:'draft',required:'Independent source-skill, topology, dimensional labels, material units and 343px readability review'},
   image:'/figures/synaq-editions/'+editionId+'.svg',verificationModule:'scripts/editorial/visual-wave3-models.mjs'};
  row.statement=statementFor(row);row.solution=solutionFor(row);
  row.figureDescription=row.statement+' Көк бөліктер есепке алынады; ашық түсті ойықтар мен бос орындар алынбайды.';
  const options=expressionOptions(row);
  if(options)row.options=options;
  if(model==='cross-area-perimeter')row.options=['15 см² және 36 см','45 см² және 36 см','45 см² және 60 см','45 см² және 30 см'];
  assert.notEqual(row.statement,raw.statement);assert.notEqual(answer,String(raw.sourceAnswer));
  row.figureSha256=crypto.createHash('sha256').update(svgFor(row)).digest('hex');
  row.independentVerification={status:'computed_awaiting_external_review',...verifyEdition(row)};
  editions.push(row);
 }
 return {schemaVersion:1,createdAt:'2026-10-23',status:'draft_awaiting_independent_review',sourcePolicy:'No further collection; all addressed references are saved captured sources. New native coordinates and arithmetic only, with explicit occurrence coverage.',
  publication:{allowed:false,minimumInternalPlanAfterVerification:'pro',publicPlanName:'Standard'},
  coverage:{scope:'Every captured visual source in grade4 topic4.3, all four levels',sourceVisualOccurrences:30,addressedNewDrafts:28,previousEditionsRetained:reused,
   missingSourceIds:[],exactNewSourceIds:specs.map(r=>r[2]).sort(),distinctModels:new Set(editions.map(q=>q.modelId)).size,
   semantics:'28 individual new editions plus2 previously addressed occurrences exhaust this visual topic; no wider family/source coverage is implied.'},editions};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const pack=prepareVisualWave3();
 if(process.argv.includes('--write')){
  for(const row of pack.editions)fs.writeFileSync(path.join(root,'frontend/public',row.image),svgFor(row));
  fs.writeFileSync(path.join(root,'problems/editorial/batches/visual-wave3-composites.json'),JSON.stringify(pack,null,2)+'\n');
 }
 console.log(JSON.stringify(pack.coverage,null,2));
}
