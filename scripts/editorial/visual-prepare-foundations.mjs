// Produces only a bounded, source-specific DRAFT batch. Never touches the bank.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {editionHash} from './edition-review.mjs';
import {statementFor,solutionFor,svgFor,verifyEdition} from './visual-foundation-models.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const specs=[
 ['bead-number','abacus-number','5ec4a10c36b0f476','num','basic',{digits:[4,9,0,6]},'4906','Төрт разрядты есепшот','мыңдық, жүздік, ондық, бірлік бағандарында тиісінше 4, 9, 0, 6 моншақ','place-value reading with an explicit zero place'],
 ['trek-days','route-days','9880db612f195c7b','speed','hard',{segmentsCm:[4,6,8],kmPerCm:5,kmPerDay:15},'6','Жаяу саяхаттың бағыты','4 см, 6 см және 8 см үш бөлік; 1 см жердегі 5 км-ге тең','map route length followed by travel-time division'],
 ['clock-angle','clock-angle','d3a98301508c9b91','geo','medium',{hour:9,minute:40},'50','Сағат тілдерінің орналасуы','Сағат 09:40; сағат тілі 9 бен 10 арасында, минут тілі 8-де','smaller angle between actual clock-hand directions'],
 ['sector-fraction','sector-fraction','a1d86b83aa9c6f06','frac','basic',{total:12,shaded:7},'7/12','Тең секторлы төсбелгі','12 тең сектордың жетеуі көк, қалған бесеуі ақ','equal-part numerator and denominator from a circle'],
 ['temperature-rise','temperature-rise','698c58efc5c36cc3','num','medium',{cold:-7,warm:5},'12','Екі уақыттағы температура','Таңертең −7 °C, түсте +5 °C; әр кіші бөлік 1 °C','signed temperature difference across zero'],
 ['reading-bar-gap','bar-difference','7444a428736c7c57','stats','basic',{labels:['Айша','Берік','Дана','Ерке'],values:[12,8,5,9],first:0,second:2},'7','Шешілген басқатырғыштар','Айша — 12, Берік — 8, Дана — 5, Ерке — 9 басқатырғыш','difference of exactly two selected bar-chart readings'],
 ['shoot-growth','line-growth','1eb9298094f0f5ff','stats','basic',{values:[4,7,9,14,20,25],from:2,to:5},'13','Жылыжайдағы өскін','1–6-күндердегі биіктік: 4, 7, 9, 14, 20, 25 см','change between two specified times on a line chart'],
 ['ray-improper-numerator','ray-numerator','eb624f925aad939a','frac','medium',{divisions:6,numerator:17},'17','Сан сәулесіндегі P нүктесі','Әр бірлік алтыға бөлінген; P нүктесі нөлден кейінгі 17-аралықта','improper-fraction numerator by counting unit subintervals'],
 ['notched-frame','notch-perimeter','b378b8e971afc3ff','geo','hard',{width:18,height:11,depth:4,notchWidth:5,offset:8},'66','Ойығы бар жақтау','Сыртқы ені 18 см, биіктігі 11 см, жоғарғы ойықтың тереңдігі 4 см','orthogonal perimeter with an inward rectangular notch'],
 ['fan-all-triangles','fan-triangles','d751c6bb677c8245','comb','medium',{baseSegments:5},'15','Үшбұрышты желпуіш','Жоғарғы төбеден табандағы алты нүктеге кесінділер жүргізілген','count all fan triangles, including composite triangles'],
 ['polygon-pieces','polygon-triangulation','f2da6bb957073dff','geo','medium',{sides:11},'9','Дөңес көпбұрышты бөлу','Он бір төбелі дөңес көпбұрыштың бір төбесінен барлық диагональ жүргізілген','count triangulation faces rather than every larger triangle'],
 ['club-union','venn-union','1993abd9490b9a59','sets','basic',{leftOnly:11,rightOnly:8,both:6},'25','Екі үйірменің оқушылары','A-да барлығы 17, B-да барлығы 14 оқушы; ортақ аймақта 6 оқушы','distinct members of a two-set union from whole-set totals and their intersection'],
 ['interval-integer','interval-maximum','316028916b84ad9e','sys','medium',{a:{lo:-5,hi:4,loClosed:false,hiClosed:true},b:{lo:1,hi:11,loClosed:true,hiClosed:false}},'10','Екі сан аралығы','A = (−5; 4], B = [1; 11); ашық және жабық шеттер көрсетілген','largest integer in an overlapping union with an open right endpoint'],
 ['led-weight','seven-segment-mass','zerek_7d1f8732-e93b-4174-9f7c-8f167a7a117b_47','ratio','medium',{target:'3579',referenceCents:50},'4,75','Таяқшалардан жасалған цифрлар','Үлгіде «1» екі таяқшадан тұрады және 0,5 кг; төменде 3579 жазуы берілген','seven-segment counting followed by equal-stick mass proportionality'],
 ['mirror-point','point-ox-reflection','825b17c2bd93989d','geo','medium',{x:4,y:-3},'(4; 3)','Ox осіне қатысты шағылдыру','Бірлік тордағы M нүктесінің координатасы (4; −3); Ox осі көк','point reflection across Ox with one invariant coordinate'],
 ['mirror-cells','pixel-reflection','81166b251336aa5f','geo','basic',{cells:[[0,0],[1,0],[2,0],[2,1],[2,2],[1,2],[0,2],[0,1],[3,2]],axis:5},'9','Торкөзді өрнек пен симметрия осі','Қатарларда 3, 2 және 4 көк торкөз; оң жақтағы k түзуі — шағылдыру осі','area preservation of a reflected nonconvex grid figure'],
 ['open-pool-tiles','open-pool-surface','9bbbf8c2b3dec26a','geo','medium',{length:12,width:9,depth:3},'234','Үсті ашық су ыдысы','Тікбұрышты ыдыстың ұзындығы 12 м, ені 9 м, тереңдігі 3 м; қақпағы жоқ','surface area of floor and four walls, excluding the open top'],
 ['opposite-angle','vertical-angle','c3650cb97d75483f','geo','basic',{angle:58},'58','Қиылысқан түзулер','Бір бұрыш 58°; оған вертикаль қарсы бұрыш x деп белгіленген','vertical-angle equality, not adjacent-angle supplementation'],
 ['circle-sector-gap','circle-sector-gap','85be9b38a970e8eb','geo','basic',{known:[60,105,110]},'85','Төрт секторлы дөңгелек','Үш секторда 60°, 105° және 110° жазылған; төртіншісінде сұрақ белгісі бар','missing sector from the full-turn angle sum'],
 ['nested-subsets','nested-subsets','8bbb5b3def4784ea','sets','medium',{inner:[4,8,12,16],outerOnly:[2,6,10,14]},'16','Бірінің ішіндегі екі жиын','B ішінде 4, 8, 12, 16; A-ның B-дан тыс бөлігінде 2, 6, 10, 14','all subsets of the inner set, including empty and full subsets'],
 ['square-circle-corners','square-circle-corners','zerek_9dd9307d-6568-455d-9203-9fbd242ff4ff_02','geo','medium',{radius:6,piHundredths:314},'30,96','Шаршының көк бұрыштары','Радиусы 6 см шеңбер шаршының төрт жағына жанасады; бұрыштар көк','square-minus-inscribed-disk area under an explicit pi approximation'],
 ['ring-width','ring-width','554e3e7d79d42821','geo','basic',{inner:4,outer:11},'7','Концентрлі екі шеңбер','Ортақ центрден сызылған ішкі радиус 4 см, сыртқы радиус 11 см','radial ring width rather than a difference of diameters'],
];

export async function prepareVisualFoundations(){
 const inventory=read('problems/editorial/batches/visual-inventory.json'),cache=new Map(),sourceModules=new Map();
 for(const file of ['frontend/src/zerekImportedQuestions.js','frontend/src/zerekReviewedQuestions.js']){
  const m=await import(pathToFileURL(path.join(root,file)).href);sourceModules.set(file,Object.values(m).find(Array.isArray));
 }
 const existingRefs=new Set();for(const name of ['core','fractions','geometry']){const pack=read(`problems/editorial/synaq-standard-${name}.json`);for(const row of Array.isArray(pack)?pack:pack.editions)for(const ref of row.sourceRefs)existingRefs.add(ref.sourceId);}
 const editions=[];
 for(const [suffix,model,sourceId,topic,difficulty,params,answer,figureTitle,figureDescription,skill]of specs){
  const record=inventory.records.find(r=>r.sourceId===sourceId);assert.ok(record,'Missing canonical visual source '+sourceId);
  assert.ok([4,5,6].includes(record.grade),'School grade must be explicit');
  assert.ok(!existingRefs.has(sourceId),'Do not rewrite or replace a reference of the existing verified 51 in this first batch: '+sourceId);
  if(!cache.has(record.sourceFile))cache.set(record.sourceFile,read(record.sourceFile));
  const raw=cache.get(record.sourceFile).questions[record.sourceIndex];assert.equal(raw.id||raw.sourceContentId||sourceId,sourceId);
  let ref={sourceId,sourceFile:record.sourceFile};
  if(record.group==='collections'){
   const entry=[...sourceModules].find(([,rows])=>rows.some(q=>q.id===sourceId));assert.ok(entry,'Collection source needs an archived normalized reference');
   ref={sourceId,sourceFile:entry[0],rawSourceFile:record.sourceFile,rawSourceIndex:record.sourceIndex,rawSourceSha256:editionHash(raw)};
  }
  const editionId='visual-'+suffix,row={editionId,modelId:'visual-'+model,grade:record.grade,topic,difficulty,params,answer,
   sourceRefs:[ref],sourceOccurrenceId:record.occurrenceId,sourceSkill:skill,
   adaptationChanges:[
    'Түпнұсқаның тек математикалық дағдысы сақталды; тапсырманың шарты SYNAQ үшін жаңадан жазылды.',
    'Параметрлер, суреттегі деректер және жауап жаңадан таңдалып, жеке математикалық әдіспен қайта есептелді.',
    'Скан, бастапқы сурет және traced SVG көшірілмеді: тек жаңа параметрлерден native SVG құрылды.',
    'Жауап пен сызба бөлек редакциялық тексеруге ұсынылады; бұл жазба әзірше жарияланбайды.',
   ],figureTitle,figureDescription,image:`/figures/synaq-editions/${editionId}.svg`,editorialStatus:'draft',minimumPlan:'pro',
   figureReview:{status:'draft',required:'Independent source-skill, parameter, SVG and 343px readability review'},
   verificationModule:'scripts/editorial/visual-foundation-models.mjs'};
  row.statement=statementFor(row);row.solution=solutionFor(row);
  assert.notEqual(row.statement,raw.statement);assert.notEqual(answer,String(raw.sourceAnswer),'Use a new target answer as well as new data');
  row.figureSha256=sha(svgFor(row));row.independentVerification={status:'computed_awaiting_external_review',...verifyEdition(row)};
  editions.push(row);
 }
 return {schemaVersion:1,createdAt:'2026-10-23',status:'draft_awaiting_independent_review',
  sourcePolicy:'Only archived mathematical skills are used as references. Every SVG is constructed from new authored parameters, never copied or traced. No source collection is being fetched.',
  publication:{allowed:false,minimumInternalPlanAfterVerification:'pro',publicPlanName:'Standard',originalSourceTasksPublished:0},
  coverage:{sourceOccurrencesInVisualInventory:inventory.records.length,draftSourceOccurrences:editions.length,distinctDraftModels:new Set(editions.map(r=>r.modelId)).size,
   semantics:'One explicitly linked visual source occurrence per draft. These drafts do not cover other examples or whole families by implication.',
   remainingVisualOccurrencesNotAuthoredByThisBatch:inventory.records.length-editions.length},editions};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const pack=await prepareVisualFoundations();
 if(process.argv.includes('--write')){
  for(const row of pack.editions){const file=path.join(root,'frontend/public',row.image);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,svgFor(row));}
  const file=path.join(root,'problems/editorial/batches/visual-foundations.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(pack,null,2)+'\n');
 }
 console.log(JSON.stringify(pack.coverage,null,2));
}
