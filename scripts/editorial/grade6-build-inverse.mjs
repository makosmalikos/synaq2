import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {inverseSpecs} from './grade6-inverse-specs.mjs';import {renderEdition,verifyEdition} from './grade6-inverse-models.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),specs=new Map(inverseSpecs.map(([id,model,params])=>[id,{model,params}]));assert.equal(specs.size,54);
const motion=new Set(['same-road-minutes','inverse-proportion','mixed-time-return','slower-time-factor','meeting-distances','boat-same-distance','late-and-early-distance','wheel-turn-difference','roundtrip-total-time']);
const geometry=new Set(['fixed-area','impossible-area-pair','posts-and-intervals']);
const hard=new Set(['camp-two-changes','inverse-parts-known-gap','initial-worker-count','late-and-early-distance','wheel-turn-difference','boat-same-distance','worker-hours-days']);
const editions=[];
for(const level of ['1','2','3','test']){
 const sourceFile=`problems/sources/zerek/courses/6-math-1-6-level${level}.json`,source=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8'));assert.equal(source.grade,6);assert.equal(source.status,'captured');
 for(const original of source.questions){assert.equal(original.checked,true);assert.ok(!original.images?.length&&!original.svg?.length);const spec=specs.get(original.id);assert.ok(spec,'Individually read source '+original.id);
  const row={editionId:'grade6-inverse-'+original.id,modelId:'grade6-inverse-'+spec.model,grade:6,topic:geometry.has(spec.model)?'geo':motion.has(spec.model)?'motion':'ratio',difficulty:hard.has(spec.model)?'hard':level==='1'?'basic':'medium',params:spec.params,
   sourceRefs:[{sourceFile,sourceId:original.id}],adaptationChanges:[
    'Барлық 54 бастапқы шарт, толық шешім және барлық нұсқа жеке оқылды. Жұмыс, азық, ақша, уақыт, айналым, қашықтық және үлестіру жағдайларының нақты бастапқы дағдылары сақталды.',
    'Шарттар қазақша қайта жазылып, сандар мен кейіпкерлер өзгертілді. Қосымша және жалпы сан, қалған және толық уақыт, бағана және аралық, жаңа мөлшер және оның айырмасы жеке ажыратылды.',
    'Қор жұмсалған әр кезең бөлек есептеледі; жұмысшылар мен құбырлардың бірдей тұрақты өнімділігі, шөптің толықтырылмауы, дөңгелектердің сырғанамауы және өлшем бірліктері ашық көрсетілді.',
    'Кесу есебі бастапқы тұтас таспаны бөлудің екі баламасымен беріледі: бұрын кесілген бөлшектерді қайта жалғау туралы жасырын болжам жоқ. Дәл рационал жауаптар есептеледі; сандық редакциялар жеке жаңа мағына болып саналмайды.'
   ],minimumPlan:'pro',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Individual saved grade6topic1.6 inverse-proportion adaptation. Repeated conservation models do not constitute separate semantic meanings.'};
  Object.assign(row,renderEdition(row));row.calculationVerification=verifyEdition(row);assert.notEqual(row.statement,original.statement);editions.push(row);
 }
}
assert.equal(editions.length,54);const container={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All54 saved nonvisual grade6topic1.6 conditions individually read and rewritten. Local author draft, excluded from delivery before independent full-content review.',summary:{editions:54,sourceOccurrencesReferenced:54,distinctModels:new Set(editions.map(r=>r.modelId)).size,independentlyReviewed:0},editions};
const text=JSON.stringify(container,null,2)+'\n',file=path.join(root,'problems/editorial/batches/grade6-inverse.json');if(process.argv.includes('--write'))fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);console.log(JSON.stringify(container.summary));
