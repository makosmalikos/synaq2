import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {renderEdition,verifyEdition} from './grade4-unit-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=new Map(read('problems/editorial/batches/grade4-inventory.json').records.map(q=>[q.sourceId,q]));
const coverage=new Map(read('problems/editorial/source-coverage.json').records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
const measurement=(id,from,target)=>[id,'measurement-conversion',{from:from.map(([value,unit])=>({value,unit})),target}];
const fraction=(id,from,numerator,denominator,target)=>[id,'fraction-of-time-unit',{from,numerator,denominator,target}];
const specs=[
  measurement('f979d4a29ded791b',[[8,'g'],[375,'mg']],'mg'),measurement('3f9dbb10f999bc12',[[27000,'kg']],'t'),measurement('6a8d35fd27ccef17',[[14000,'mg']],'g'),measurement('5e10aad0f5f9499c',[[9,'c']],'kg'),measurement('0f4bb2ecea3e2839',[[6,'g']],'mg'),measurement('b1655d0df3fc682d',[[12000000,'mg']],'kg'),measurement('fa88d7b9fae146e4',[[3,'kg']],'mg'),measurement('270d4faacd1acd73',[[4,'t'],[650,'kg']],'kg'),measurement('d05aefbbef84d98a',[[9,'g'],[62,'mg']],'mg'),measurement('0735744ca632caaa',[[7,'c'],[18,'kg']],'kg'),measurement('09b06127810e8a8b',[[6,'t']],'kg'),
  measurement('7ef05361af15ed2f',[[7,'m3']],'dm3'),measurement('e2769ba764f54f91',[[5,'litre']],'cm3'),measurement('21b75dfbc928d415',[[9000,'mm3']],'cm3'),measurement('d022c80594ce24d6',[[4,'dm3']],'cm3'),measurement('0ecf192435373079',[[8,'dm3']],'mm3'),measurement('957df7500d2f0ceb',[[4,'m3'],[90,'dm3']],'dm3'),measurement('3f624dcc8af0ffa3',[[11000,'cm3']],'dm3'),measurement('424833d5cdc959e4',[[9,'dm3']],'cm3'),
  measurement('421ab83c8fd95342',[[9,'ar']],'m2'),measurement('83797d5697b45513',[[4500000,'mm2']],'cm2'),measurement('de0d87c4ba4dd14b',[[3,'ha']],'ar'),measurement('ae0f546809d30096',[[4,'ar']],'m2'),measurement('a0a5e9fd1b4fe33d',[[900,'m2']],'ar'),measurement('144c0977f6b7d706',[[28,'ha']],'ar'),measurement('21d60c5931b0893c',[[8,'m2']],'dm2'),measurement('70c2bfdbed97e851',[[6,'ha']],'m2'),measurement('8cbae94b32e128fb',[[75000,'mm2']],'cm2'),measurement('d048ff61cf5db4a9',[[9,'ha']],'ar'),measurement('f1a54b61132951ff',[[7,'m2']],'cm2'),measurement('e0618b81038de2da',[[5,'km2']],'ha'),measurement('94bb6257a975bff6',[[12,'ha']],'ar'),measurement('3edcf2c67cc6c4b1',[[11,'m2']],'dm2'),measurement('d9fcdaceeea96346',[[8,'ha']],'m2'),
  measurement('34b01a1d424a5522',[[6,'minute'],[28,'second']],'second'),measurement('0ed340c25dd89db5',[[216,'hour']],'day'),measurement('d299bfe16a5d9c24',[[4,'week'],[2,'day']],'day'),measurement('75ca8fba49d85b84',[[3,'year'],[7,'month']],'month'),measurement('8e814a5d7d39522b',[[6,'day'],[5,'hour']],'hour'),measurement('38ad98c452024de6',[[3,'week'],[2,'day']],'hour'),measurement('3de771a0d947277a',[[7,'day'],[9,'hour']],'hour'),measurement('5391b191af7e8512',[[4,'hour'],[35,'minute']],'minute'),measurement('e194b7f6da014f1c',[[2,'hour'],[48,'minute']],'minute'),
  fraction('2fbed3056652cb67','hour',2,5,'minute'),fraction('eaf9a0643008b905','year',1,4,'month'),fraction('20b37f1fd4dcda37','day',1,3,'hour'),fraction('0f09e59bc6ab9cde','century',1,4,'year'),fraction('7ea74838a5424526','century',1,5,'month'),fraction('406b219760f0db10','day',1,12,'minute'),['52e71bfefc3ef9b0','given-year-fraction',{days:366,numerator:1,denominator:6}],fraction('9791ee83feb4659f','century',3,4,'year'),fraction('d67c97fcd4dfa154','day',1,8,'hour'),
];
const editions=[],skipped=[];
for(const [sourceId,model,params]of specs){
  const record=inventory.get(sourceId),editionId=`grade4-unit-${sourceId}`;assert(record,'Expected a canonical grade-4 nonvisual source');
  const already=coverage.get(`${record.sourceFile}:${sourceId}`)||[];
  if(already.some(id=>id!==editionId)){skipped.push({sourceId,verifiedEditions:already});continue;}
  const capture=read(record.sourceFile),source=capture.questions.find(q=>q.id===sourceId);
  assert(capture.status==='captured'&&source.checked&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
  const row={editionId,modelId:`grade4-${model}`,grade:4,topic:model==='measurement-conversion'?'num':'frac',difficulty:/level1\.json$/.test(record.sourceFile)?'easy':'medium',params,sourceRefs:[{sourceFile:record.sourceFile,sourceId}],
    adaptationChanges:[
      'Нақты бастапқы өлшем бірліктері мен ауыстыру бағыты оқылып, сол өлшем дағдысына жаңа деректер таңдалды.',
      'Шарт пен шешім қазақша қайта жазылды; жай бірлік, құрама шама және уақыт үлесі бір-бірімен шатастырылмайды.',
      'Аудан мен көлемнің дәрежелері және жыл/тәулік арасындағы айнымалы байланыс бөлек тексерілді; жаңа жауап дәл бүтін арифметикамен есептелді.'
    ],relationToSource:'Saved grade-4 unit skill reference. Many numeric exercises share conversion models and are not distinct semantic stories.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
  Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_dimensional_integer_calculation',...verifyEdition(row)};editions.push(row);
}
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',summary:{editions:editions.length,models:new Set(editions.map(row=>row.modelId)).size,sourceOccurrencesReferenced:editions.length,alreadyVerifiedSourceOccurrences:skipped.length,independentlyReviewed:0},skipped,editions};
assert.equal(specs.length,52);
const target=path.join(root,'problems/editorial/batches/grade4-units-wave7.json'),text=JSON.stringify(batch,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...batch.summary,checks:'passed'}));
