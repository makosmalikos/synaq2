import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-inverse-models.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-inverse.json',import.meta.url),'utf8')),rows=pack.editions;
// Hand-derived fixture keys for every source-specific condition. These exercise
// complete ledgers, unit conversion and which quantity the question actually asks.
const expected=[
'6','20','6','Өнімділігі бірдей баспа құрылғыларының саны мен бір тиражды шығару уақыты','x: 3; 4; 6 — y: 16; 12; 8','5 есе кемиді','Бірлік бағасы тұрақты күріштің массасы мен жалпы құны','63','Сәйкес мәндердің көбейтіндісі','12','135','6','4','16','48; 36','(36/48) = (x/8)','2','20 м',
'110','(7/5) есе артады','a = 15; b = 24','8','160; 120; 80','16','90','10','Дана 4800 теңге; Мерей 3000 теңге','36 айналым; 12 артық','9','1,25 есе кемиді','30','15','24000','17','Жеңіл көлік 245 км; жүк көлігі 175 км','1,5 м',
'80','45','45; 60; 105','55','15','10','2 км','270','x · y = 70','6','a = 10 см; b = 8 см','30','15','n = 6; t = 11','7','216','27','45'];
test('all54 inverse editions preserve exact source-specific fixture keys and unique choices',()=>{
 assert.equal(rows.length,54);assert.equal(expected.length,54);assert.equal(new Set(rows.map(r=>r.editionId)).size,54);
 for(let i=0;i<rows.length;i++){const r=rows[i];assert.equal(r.answer,expected[i],r.modelId);assert.equal(verifyEdition(r).answer,expected[i]);assert.ok(r.sourceRefs.length===1&&r.minimumPlan==='pro'&&r.grade===6);if(r.options)assert.equal(r.options.filter(o=>o===expected[i]).length,1);}
});
test('a wrong key or altered complete explanation/condition cannot pass the frozen author check',()=>{
 for(const r of rows){for(const key of ['answer','statement','solution'])assert.throws(()=>verifyEdition({...r,[key]:r[key]+' wrong'}));}
});
test('remaining ledgers and full durations are different exact quantities',()=>{
 // Eight tractors:120 total tractor-days,24 done,96 left,6 remain.
 assert.equal(rows[23].answer,'16');assert.notEqual(rows[23].answer,'19');
 // Added workers:180 total,60 done,120/20=6 remaining,4+6=10 total.
 assert.equal(rows[25].answer,'10');assert.notEqual(rows[25].answer,'6');
 // Camp:900−200−300=400, then8 more days; total17, not8 or18.
 assert.equal(50*18-50*4-60*5,400);assert.equal(rows[33].answer,'17');
});
test('units, endpoint counts, changed-product percentages and inverse part order remain explicit',()=>{
 assert.equal(rows[10].answer,'135');assert.equal(rows[18].answer,'110');
 assert.equal((37-1)*6/4+1,55);assert.equal(rows[39].answer,'55');
 assert.equal(rows[17].answer,'20 м');assert.equal(rows[29].answer,'1,25 есе кемиді');assert.equal(rows[41].answer,'10');
 assert.equal(rows[38].answer,'45; 60; 105');assert.equal(rows[50].answer,'7');
});
test('nonintegral inverse scaling uses exact rational MCQs and decimal commas',()=>{
 assert.ok(rows[19].options.includes('(7/5) есе артады'));assert.ok(rows[42].options.includes('(8/3) км'));
 assert.equal(rows[35].answer,'1,5 м');assert.match(rows[53].statement,/6,25 сағат/);
 assert.doesNotMatch(rows.map(r=>[r.statement,r.solution,r.answer,...(r.options||[])].join(' ')).join(' '),/[\\$]/);
});
test('source references cover exactly the54 saved nonvisual grade6topic1.6 occurrences',()=>{
 const actual=[];for(const level of ['1','2','3','test']){const file=`problems/sources/zerek/courses/6-math-1-6-level${level}.json`,src=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));for(const q of src.questions){assert.ok(!q.images?.length&&!q.svg?.length);actual.push(file+'#'+q.id);}}
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),actual.sort());assert.match(pack.scope,/excluded from delivery before independent/);
});
