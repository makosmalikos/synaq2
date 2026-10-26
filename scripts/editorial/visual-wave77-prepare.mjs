import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {editionHash} from './edition-review.mjs';
import {specs,retained} from './visual-wave77-specs.mjs';
import {independentlyCalculate,verifyEdition,svgFor,descriptionFor,statementFor,solutionFor} from './visual-wave77-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
export function prepareVisualWave77(){
 const scope=read('problems/editorial/batches/visual-inventory.json').records.filter(r=>r.grade===5&&r.group==='courses'&&/\/5-math-7-4-level/.test(r.sourceFile));
 assert.equal(scope.length,29);
 assert.deepEqual(scope.map(r=>r.sourceId).sort(),[...specs,...retained].map(r=>r.sourceId).sort());
 const previous=[read('problems/editorial/batches/visual-foundations.json'),read('problems/editorial/synaq-standard-geometry.json')].flatMap(b=>Array.isArray(b)?b:b.editions);
 for(const x of retained){const old=previous.find(q=>q.editionId===x.editionId);assert.ok(old?.sourceRefs.some(r=>r.sourceId===x.sourceId));}
 const editions=specs.map(s=>{
  const record=scope.find(r=>r.sourceId===s.sourceId),raw=read(record.sourceFile).questions[record.sourceIndex];
  assert.equal(raw.id,s.sourceId);assert.equal(record.sourceFile,s.sourceFile);assert.ok(raw.solution);
  const editionId='visual-wave77-'+s.suffix;
  const row={editionId,modelId:'visual-wave77-'+s.model,grade:5,topic:s.topic,difficulty:record.level===1?'easy':record.level===2?'medium':'hard',params:s.params,answer:s.answer,
   sourceRefs:[{sourceId:s.sourceId,sourceFile:record.sourceFile}],sourceOccurrenceId:record.occurrenceId,sourceCanonicalSha256:editionHash(raw),sourceSkill:s.sourceSkill,
   adaptationChanges:[
    'Барлық29сақталған5сынып7.4визуалдышарт/толықресмишешім/әрMCQжекеоқылды.26қолжетімдібастапқырастр5previewпарақтақаралды.25жаңаадрестікредакцияжәне4бұрынтексерілгенөзгеріссізредакциябар.',
    '25nativeSVGжаңапараметрлерменқұрылды;бастапқырастр/trace/реконструкциякөшірілмеді.146be0405fa9a785растрыжоқ:сақталғантолықшарт/ресмишешімдегібұруменбеттестірунавығығана,өз5×3/4табандарлыторлытөртбұрыштарменқайтақұрылды.Растрменvisualcomparisonмəлімденбейді.Екіretainedрастрыжоқ,оларғақайтақолқойылмайды.',
    'Жекенысаналарсақталды:көршілестөбе/диагональ,ойыс/өздігіненқиылысу/сүйірішкібұрыш,бұрудағытеңдік,сыртқышекараменортаққабырғалардыажырату,теңқабырғалы/шаршыфактілері,аудандыбөлу/толықтыру,торлықұрамдасүшбұрыш/төртбұрыштардытолықсанау,ондықпериметржәнетөртұяшықпериметрлерініңтеңдігі.Ойысортогоналдыфигуралардыңбарлықішкібұрышытікдегенқатесөйлемкөшірілмеді.Тәуелсізсыртқыreviewкүтіледі.'
   ],editorialStatus:'draft',minimumPlan:'pro',figureTitle:'Көпбұрыштар мен құрама фигуралар',
   figureReview:{status:'draft',required:'Independent full29saved/25new conditions/official+newsolutions/everyMCQ plus5allsource and5native343sheets. FourretainedNOTresigned. Missingnew146be0405fa9a785andretained7eccaf6025f2451f,bcae7df0a7662afc mustNOTclaimsourceimagecomparison. Checkactualmetricgeometry/gridscale/rigidcongruence/alltriangleandquadcounts/sharedboundaries/arealabels/strictconvexconcave/crossings. No selfsignature.'},
   image:'/figures/synaq-editions/'+editionId+'.svg',verificationModule:'scripts/editorial/visual-wave77-models.mjs',...(s.options?{options:s.options}:{})};
  row.statement=statementFor(row);row.solution=solutionFor(row);row.figureDescription=descriptionFor(row);row.figureSha256=crypto.createHash('sha256').update(svgFor(row)).digest('hex');
  assert.notEqual(row.statement,raw.statement);verifyEdition(row);row.independentVerification={status:'computed_awaiting_external_review',...independentlyCalculate(row)};
  return row;
 });
 return{schemaVersion:1,createdAt:'2026-10-24',status:'draft_awaiting_independent_review',sourcePolicy:'All29savedvisualgrade5topic7.4:25newand4previousverifiedretained;archivedonly.26of29source rastersavailable,1newand2retainedmissinghonestlyrecorded.',publication:{allowed:false,minimumInternalPlanAfterVerification:'pro',publicPlanName:'Standard'},coverage:{scope:'All captured visual grade5 topic7.4 sources',sourceVisualOccurrences:29,addressedNewDrafts:25,previousEditionsRetained:retained,missingSourceIds:[],unavailableSourceRasters:[{sourceId:'146be0405fa9a785',reason:'Archivedrasterunavailable; fullsavedrigid-rotation/congruenceconditionandfullsolutiononly. NewnativegridconstructionNOTsourceimagecomparison.'}],unavailableRetainedSourceRasters:['7eccaf6025f2451f','bcae7df0a7662afc'],exactNewSourceIds:specs.map(s=>s.sourceId).sort(),distinctModels:25,semantics:'Twenty-fiveaddressedpolygon/metric/grid/compositeareas/allfigurescountdrafts;twenty-twogeoandthreecomb,4oldverifiedretained. Factualsquare/equilateral/perpendicularityandstructuralconservationhonestlypreserved.'},editions};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const pack=prepareVisualWave77();if(process.argv.includes('--write')){for(const q of pack.editions)fs.writeFileSync(path.join(root,'frontend/public',q.image),svgFor(q));fs.writeFileSync(path.join(root,'problems/editorial/batches/visual-wave77-pictured-polygons.json'),JSON.stringify(pack,null,2)+'\n');}console.log(JSON.stringify(pack.coverage,null,2));}
