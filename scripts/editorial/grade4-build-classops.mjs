import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {CLASSOPS_SPECS} from './grade4-classops-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-classops-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json');
const verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(CLASSOPS_SPECS.map(s=>s.id)).size,CLASSOPS_SPECS.length);
const editions=[];
for(const spec of CLASSOPS_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-classops-${spec.id}`;
 assert(ref&&ref.sourceTopic==='4-math-1-4',`Unexpected or missing canonical reference ${spec.id}`);
 const prior=verified.get(`${ref.sourceFile}:${spec.id}`)||[];if(prior.some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);
 assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const changes=[
  'Бастапқы сақталған шарт, нұсқалар, кілт және толық ресми шешім жеке оқылды. Класпен есептеу, бос разряд, ең кіші не үлкен сан, компенсация, қате амалды кері қайтару және цифрлық шектеулер сақталды.',
  'Деректер мен қазақша тұжырым қайта жазылды. Тұрақты математикалық қасиеттің жауабы өзгермеуі мүмкін: көршілес разряд шекараларының айырмасы бәрібір 1, ал 999 = 1 000 − 1 педагогикалық түрлендіруі сақталады.',
  'Әріптік есептердің көбейткіші өзгертіліп, барлық цифрлық нұсқа толық тексерілді. Жаңа сөйлемде нөлден бастамау, әртүрлі әріптердің әртүрлі цифры және қатардың тұрақты қадамы анық жазылады.'
 ];
 if(spec.kind==='four-letter-cryptarithm')changes.push('Алты еселеуге ауыстырғанда ННММ шарты 374 және 924 шешімдерін береді. Бірмәнді авторлық нұсқа үшін КЛМ < 500 деген жаңа ашық шек қосылды; бұл бастапқы есепте болған деп көрсетілмейді.');
 const row={editionId,modelId:`grade4-classops-${spec.kind}`,skillFamily:`${spec.kind}${['digit-boundary','distinct-boundary'].includes(spec.kind)?'-'+spec.params.direction:spec.kind==='class-arithmetic'?'-'+spec.params.operation+'-'+spec.params.scale:''}`,grade:4,topic:spec.kind.includes('term')?'seq':spec.kind.includes('cryptarithm')||spec.kind==='missing-subtrahend'?'eq':'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:changes,relationToSource:'A source-specific saved grade-4 class-operation edition. Numerical variants remain source coverage, not newly distinct meanings.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'decimal_classes_greedy_bounds_and_exhaustive_cryptarithms',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-1-4'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'Every currently unedited nonvisual reference in source topic1.4 must be mapped');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All23 remaining saved grade-4 nonvisual class-operation sources in topic1.4; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-classops-wave11.json'),text=JSON.stringify(batch,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
