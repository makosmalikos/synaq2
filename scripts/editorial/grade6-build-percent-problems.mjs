import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {percentProblemSpecs} from './grade6-percent-problems-specs.mjs';
import {renderEdition,verifyEdition} from './grade6-percent-problems-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const specs=new Map(percentProblemSpecs.map(([id,model,params])=>[id,{model,params}]));assert.equal(specs.size,54);
const geometry=new Set(['oxygen-room-volume']),sets=new Set(['overlapping-readers']);
const hard=new Set(['three-groups-offset','two-year-depreciation','conserved-dry-matter','symmetric-price-changes','profit-after-two-changes','weighted-two-classes','alloy-conservation','cheaper-more-kilograms']);
const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const editions=[];
for(const level of ['1','2','3','test']){
 const sourceFile=`problems/sources/zerek/courses/6-math-1-7-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));assert.equal(source.grade,6);assert.equal(source.status,'captured');
 for(const original of source.questions){
  assert.equal(original.checked,true);assert.ok(!original.images?.length&&!original.svg?.length);const spec=specs.get(original.id);assert.ok(spec,'Unread source '+original.id);
  const row={editionId:'grade6-percent-problems-'+original.id,modelId:'grade6-percent-problems-'+spec.model,grade:6,topic:geometry.has(spec.model)?'geo':sets.has(spec.model)?'sets':'percent',difficulty:hard.has(spec.model)?'hard':level==='1'?'basic':'medium',params:spec.params,
   sourceRefs:[{sourceFile,sourceId:original.id}],adaptationChanges:[
    'Барлық54 бастапқы шарт, толық шешім және барлық жауап нұсқасы жеке оқылды. Әр тапсырма бастапқы сұралған нақты дағдысы бойынша жеке қайта жазылды.',
    'Сандар, заттар және кейіпкерлер өзгертілді. Бастапқы бүтіннен және сол сәттегі қалдықтан алынған проценттер, өсімнің өзі және толық сома, жаңа баға және өзгеріс бөлек ажыратылды.',
    'Екі жылғы кему, су ғана буланатын кептіру, хордағы екі бөлек негіз, екі сыныптың салмақталған үлесі, толық қамтылған қиылысатын жиындар, қорытпа және тұрақты бюджет нақты сақталу теңдеулерімен тексеріледі.',
    'Барлық жауап дәл рационал есептелді. Жаңа редакциялар мен ортақ механизмнің сандық нұсқалары бөлек жаңа мағына болып саналмайды. Тек сыртқы толық тәуелсіз тексеруден кейін ашылады.'
   ],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individually read saved grade6topic1.7 percent-problem adaptation; repeated percent mechanisms are not a semantic-uniqueness claim.'};
  Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);assert.notEqual(clean(row.statement),clean(original.statement));editions.push(row);
 }
}
assert.equal(editions.length,54);
const container={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All54 saved topic1.7 sources individually read and adapted. Author draft excluded from Standard delivery until separate full-content hash-bound review.',summary:{editions:54,sourceOccurrencesReferenced:54,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const text=JSON.stringify(container,null,2)+'\n',file=path.join(root,'problems/editorial/batches/grade6-percent-problems.json');if(process.argv.includes('--write'))fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);console.log(JSON.stringify(container.summary));
