import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {directSpecs} from './grade6-direct-specs.mjs';import {renderEdition,verifyEdition} from './grade6-direct-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),specs=new Map(directSpecs.map(([id,model,params])=>[id,{model,params}]));assert.equal(specs.size,54);const editions=[];
const geometry=new Set(['relationship','fixed-side-area-factor','fixed-width-percent','minute-hand-turn','clock-angle','height-volume-increment','same-sun-shadows']);
const motion=new Set(['constant-speed-distance','meaning-speed','fuel','seconds-to-minutes','journey-time','remaining-journey','simultaneous-gap','time-from-formula']);
const testDifficulty={'matching-pair':'medium','time-from-formula':'basic','composition-factor':'medium','split-cost':'medium','two-ingredients':'medium','split-work':'medium','successive-factors':'medium','delayed-worker':'hard','losing-clock':'hard','two-candles':'hard'};
for(const level of ['1','2','3','test']){
 const sourceFile=`problems/sources/zerek/courses/6-math-1-5-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));assert.equal(source.grade,6);assert.equal(source.status,'captured');
 for(const q of source.questions){assert.equal(q.checked,true);assert.ok(!q.images?.length&&!q.svg?.length);const spec=specs.get(q.id);assert.ok(spec,'Individually read source '+q.id);
  const row={editionId:'grade6-direct-'+q.id,modelId:'grade6-direct-'+spec.model,grade:6,topic:geometry.has(spec.model)?'geo':motion.has(spec.model)?'motion':'ratio',difficulty:level==='test'?testDifficulty[spec.model]:level==='1'?'basic':level==='2'?'medium':'hard',params:spec.params,sourceRefs:[{sourceFile,sourceId:q.id}],adaptationChanges:[
   'Сақталған 54 бастапқы шарттың әрқайсысы, толық шешім және барлық жауап нұсқасы жеке оқылып, нақты бастапқы дағдыға жеке редакция таңдалды.',
   'Қазақша мәтіндер, сандар мен жағдайлар өзгерді. Бірлікке келтіру, қатынасты дұрыс ретпен құру, қоспа айырмасы, жоғары дөңгелектеу және толық/қалған уақыт айырмасы сақталды.',
   'Жауаптар дәл қысқартылған рационал арифметикамен есептелді. Тілдердегі сағат/минут, масса/ұзындық және пайыз/масса бірліктері бөлек қарастырылды. Сандық нұсқалар жаңа мағына болып саналмайды.'
  ],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individual saved grade6topic1.5 direct-proportion adaptation. Repeated arithmetic models are not independent semantic meanings.'};
  Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);assert.notEqual(row.statement,q.statement);editions.push(row);
 }
}
assert.equal(editions.length,54);const container={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All54 saved nonvisual grade6topic1.5 conditions individually read and rewritten; not published before independent review.',summary:{editions:54,sourceOccurrencesReferenced:54,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};const file=path.join(root,'problems/editorial/batches/grade6-direct.json'),text=JSON.stringify(container,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);console.log(JSON.stringify(container.summary));
