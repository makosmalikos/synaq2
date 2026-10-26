import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {renderEdition,verifyEdition} from './grade4-special-models.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sourceFile='problems/sources/zerek/courses/4-math-1-4-level3.json',sourceId='4c2e5ff259f1ad26';
const source=JSON.parse(fs.readFileSync(path.join(root,sourceFile),'utf8')).questions.find(q=>q.id===sourceId);
assert(source.checked&&source.statement.includes('99\\,999')&&source.sourceAnswer==='50000');
const row={editionId:'grade4-paired-badge-score',modelId:'grade4-paired-alternating-sum',grade:4,topic:'seq',difficulty:'hard',params:{top:24600},
  sourceRefs:[{sourceFile,sourceId}],adaptationChanges:[
    'Ұзын кезектескен қосынды жұп және тақ карточкалардың нөмірлерін салыстыру туралы жаңа шартпен берілді.',
    'Жоғарғы шекара өзгертіліп, екі шеткі нөмірдің кіретіні анық жазылды.',
    'Шешім жұптау арқылы табылып, тақ пен жұп сандарды бөлек толық қосу арқылы тексерілді.'
  ],editorialStatus:'draft',reviewStatus:'awaiting_independent_review',relationToSource:'Curriculum reference for pairing terms in a long alternating sum; an authored exercise, not a literal transcription.'};
Object.assign(row,renderEdition(row));row.calculationVerification={method:'pairing_with_exhaustive_integer_oracle',...verifyEdition(row)};
const content={schemaVersion:1,status:'draft_awaiting_independent_review',summary:{editions:1,sourceOccurrencesReferenced:1,independentlyReviewed:0},editions:[row]};
const target=path.join(root,'problems/editorial/batches/grade4-patterns-wave4.json'),text=JSON.stringify(content,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({editions:1,answer:row.answer,checks:'passed'}));
