import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {MEETING_SPECS} from './grade4-meeting-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-meeting-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(MEETING_SPECS.map(s=>s.id)).size,MEETING_SPECS.length);const editions=[];
for(const spec of MEETING_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-meeting-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-6-5',`Missing canonical6.5 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-meeting-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық40 сақталған көрнекіліксіз шарт, толық ресми шешім, кілт пен барлық нұсқа жеке оқылды. Қарсы қозғалыстың тікелей, кері, қатынасты және кезеңді модельдері жеке жазылды.',
 'Жақындау жылдамдығы, жеке жылдамдық, жол, уақыт, өрнек, теңдеу, реттелген жұп немесе тірек нүктесінен қашықтық рөлі сақталды. Жылдамдық қосындысы мен айырмасы диагностикалық нұсқаларда бірге тексеріледі.',
 'Бастапқы шығу уақыты, кеш шығу алдындағы жалғыз жол, демалыс кезеңі және кездесуден кейінгі уақыт нақты ажыратылды. Жарты аралық тапсырмасы алғашқы, кездесуге дейінгі сәтті ашық сұрайды; түпнұсқа шешімінің жұп нөмірі туралы жаңылысы қайталанбады.40source40жаңамағынаемес.'
 ],relationToSource:'One individually read saved grade-4 nonvisual6.5 opposite-motion occurrence with preserved requested direct/inverse time, distance, speed, literal formula/equation, sum-and-gap pair and endpoint role; clock delays/rest phases and before/after encounter targets are explicit. Numeric variants are source coverage, not unique meanings.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_opposite_motion_direct_inverse_sum_gap_and_piecewise_absolute_clock_models',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-6-5'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual6.5 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All40 remaining saved grade-4 nonvisual topic6.5 opposite-motion models; individually preserved requested direct/inverse quantities, endpoint/time roles, diagnostic constraints, units, clock delays and rest phases; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-meeting-wave45.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
