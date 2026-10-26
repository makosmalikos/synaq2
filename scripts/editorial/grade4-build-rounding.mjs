import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {renderEdition,verifyEdition} from './grade4-rounding-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const records=new Map(read('problems/editorial/batches/grade4-inventory.json').records.map(r=>[r.sourceId,r]));
const verified=new Map(read('problems/editorial/source-coverage.json').records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
const specs=[
  ['e4e9d36cc01fc90e','round-to-place',{number:65784,unit:1000}],
  ['8be23c617f41f5ba','round-to-place',{number:4387,unit:10}],
  ['b5841fdce55484d2','rounding-choice',{unit:100,target:6400,candidates:[6371,6349,6450,6307]}],
  ['802671dcc49ce9c0','rounding-inverse-extreme',{target:4600,unit:100,maximum:false}],
  ['fac0393826057124','round-to-place',{number:89967,unit:100}],
  ['86e99bd174fb0695','rounding-inverse-extreme',{target:73000,unit:1000,maximum:true}],
  ['a33fef7f9a554890','round-to-place',{number:476281,unit:10000}],
  ['7af1f9eb1aa79c93','round-to-place',{number:2458163,unit:10000}],
  ['5d141ae9d5cd6058','rounding-choice',{unit:100000,target:4800000,candidates:[4763218,4744000,4850000,4860000]}],
  ['b741e7a2fbd1b539','round-to-place',{number:99996,unit:10}],
  ['e46230ab8bd66198','distinct-code-then-round',{digits:[0,1,2,4,6,7,9],unit:100000}],
  ['272e412586837e89','rounding-set-difference',{target:8200,coarse:100,fine:10}],
  ['cabb1689cab38186','two-rounding-max',{firstTarget:7200,firstUnit:100,secondTarget:7150,secondUnit:10}],
  ['86023b7f5e0034dc','rounding-interval-width',{target:317000,unit:1000}],
  ['a7eb6f07fe2cd126','digit-bound-rounding-count',{digits:6,target:100000,unit:100000}],
  ['8132bcec2c029565','rounded-digit-sum-count',{target:42000,unit:1000,sum:9}],
  ['4eb3164b9deeae79','rounded-distinct-maximum',{target:73000,unit:1000,digits:5}],
  ['bc27704b909dfa23','rounded-neighbour-gap',{first:874999,second:875001,unit:10000}],
  ['6476b8d26a2d2be7','round-to-place',{number:682341,unit:10000}],
  ['f7c7d415b4844fbe','rounding-inverse-extreme',{target:60000,unit:1000,maximum:false}],
  ['65132b852db726ea','round-to-place',{number:2068419,unit:100000}],
  ['ca101ea4dea633af','rounded-multiple-count',{target:1300,unit:100,divisor:20}],
  ['7bf212fa09cf1210','two-rounding-choice',{firstTarget:18000,firstUnit:1000,secondTarget:17500,secondUnit:100,candidates:[17513,17499,17450,17551]}],
];
const editions=specs.map(([sourceId,slug,params])=>{
  const ref=records.get(sourceId),editionId=`grade4-rounding-${sourceId}`;
  assert(ref&&(verified.get(`${ref.sourceFile}:${sourceId}`)||[]).every(id=>id===editionId),'Source already has another verified edition');
  const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===sourceId);
  assert(capture.status==='captured'&&source.checked&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
  const row={editionId,modelId:`grade4-${slug}`,grade:4,topic:'num',difficulty:/level1\.json$/.test(ref.sourceFile)?'easy':/level2\.json$/.test(ref.sourceFile)?'medium':'hard',params,
    sourceRefs:[{sourceFile:ref.sourceFile,sourceId}],adaptationChanges:[
      'Толық бастапқы шарт пен шешімнен нақты дөңгелектеу/шекара/цифрлық шектеу дағдысы оқылып сақталды.',
      'Жаңа сандар, нұсқалар және өздігінен түсінікті қазақша шарт жазылды; ескірген нақты халық саны деректері қолданылмайды.',
      'Дәл жартыда жоғары жаққа дөңгелектеу шарты айқын берілді; аралық шеттері, бірмәнділік және жаңа жауап қайта тексерілді.'
    ],relationToSource:'Specific saved grade-4 rounding skill. Multiple numeric exercises can share one mathematical model; these are not claimed as semantically unique stories.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
  const rendered=renderEdition(row);Object.assign(row,{statement:rendered.statement,answer:rendered.answer,solution:rendered.solution});if(rendered.options)row.options=rendered.options;
  row.calculationVerification={method:'exact_half_up_boundaries_and_candidates',...verifyEdition(row)};return row;
});
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',summary:{editions:editions.length,models:new Set(editions.map(q=>q.modelId)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0},editions};
const target=path.join(root,'problems/editorial/batches/grade4-rounding-wave6.json'),text=JSON.stringify(batch,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({editions:editions.length,models:batch.summary.models,checks:'passed',reviewStatus:'awaiting_independent_review'}));
