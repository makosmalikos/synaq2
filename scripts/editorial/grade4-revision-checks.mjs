import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-revision-models.mjs';
const batch=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-revision-wave10.json',import.meta.url),'utf8'));
// These are separately calculated fixture answers, not calls into the model solver.
const expected=['9','<','609; 690; 906; 960','67 400','205','12','3 ғасыр','63 × 4 + 27 × 4','210','10','477','6 сағ 15 мин','439 999','(84 − 28 + 56) : 4','960 кг','13','106200','4572','9','9','7','70','7 ц 52 кг','264','3','600','80 008','609','4 сағ 20 мин < 280 мин','21 600','17'];
assert.equal(batch.editions.length,expected.length);
let mutations=0;
for(const[rowIndex,row]of batch.editions.entries()){
 assert.equal(row.answer,expected[rowIndex],row.editionId);assert.equal(verifyEdition(row).answer,row.answer);
 assert.equal(row.grade,4);assert.equal(row.minimumPlan,'pro');assert.equal(row.editorialStatus,'draft');assert.equal(row.sourceRefs.length,1);assert(!row.image);assert(!/[\$\\]/.test(row.statement+row.solution));
 for(const field of ['statement','answer','solution']){const changed=structuredClone(row);changed[field]+=' өзгеріс';assert.throws(()=>verifyEdition(changed));mutations++;}
 if(row.options){const changed=structuredClone(row);changed.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(changed));mutations++;}
 const changed=structuredClone(row);
 function changeFirst(value){for(const key of Object.keys(value)){if(typeof value[key]==='number'){value[key]++;return true;}if(value[key]&&typeof value[key]==='object'&&changeFirst(value[key]))return true;}return false;}
 assert(changeFirst(changed.params));assert.throws(()=>verifyEdition(changed));mutations++;
}
const find=kind=>batch.editions.find(r=>r.modelId===`grade4-revision-${kind}`);
// Independent exhaustive domains retain the zero-leading, strict-boundary and age skills.
const digitRow=find('digit-extremes-difference'),digits=digitRow.params.digits.map(String).sort().join('');
const written=[];for(let n=1000;n<10000;n++)if(String(n).split('').sort().join('')===digits)written.push(n);
assert.equal(written.length,18);assert.equal(Math.max(...written)-Math.min(...written),Number(digitRow.answer));
const missing=find('missing-comparison-digit'),matching=[];
for(let d=0;d<10;d++){const value=68009+d*100;if(value>68609)matching.push(d);}
assert.deepEqual(matching,[7,8,9]);assert.equal(matching.length,Number(missing.answer));
const age=find('future-age-ratio'),years=[];for(let t=1;t<=100;t++)if(age.params.parent+t===age.params.ratio*(age.params.child+t))years.push(t);
assert.deepEqual(years,[Number(age.answer)]);
const pairs=find('three-pair-ages'),triples=[];for(let a=1;a<=40;a++)for(let b=1;b<=40;b++)for(let c=1;c<=40;c++)if(a+b===26&&b+c===29&&a+c===31)triples.push([a,b,c]);
assert.deepEqual(triples,[[14,12,17]]);assert.equal(Number(pairs.answer),triples[0][2]);
const ticket=find('unknown-child-tickets'),counts=[];for(let n=1;n<=100;n++)if(4*1700+n*800===14000)counts.push(n);
assert.deepEqual(counts,[Number(ticket.answer)]);
let paired=0;for(let n=2;n<=48;n+=2)paired+=n;assert.equal(paired,Number(find('even-sum-pairing').answer));
assert.equal(7*60+40-85,6*60+15);assert.equal(4*60+20,260);assert(260<280);
assert.equal((84-28+56)/4,28);assert.equal(84-(28+56/4),42);assert.equal((84-28)+56/4,70);assert.equal(84-(28+56)/4,63);
const parenthesisValues=[(72/3)*2+9,(72/3*2)+9,(72/3*2+9),72/(3*2)+9,72/(3*2+9),72/3*(2+9)];
assert.equal(Math.max(...parenthesisValues),Number(find('parenthesis-maximum').answer));
const badCases=[['map-distance',{kilometresPerCm:0}],['hours-to-minutes',{minutes:60}],['length-difference',{lastCm:20}],['strict-interval',{lower:0}],['missing-comparison-digit',{right:68608}],['even-sum-pairing',{last:46}],['future-age-ratio',{parent:45}],['unknown-child-tickets',{total:14001}],['three-pair-ages',{firstSecond:25}]];
for(const[kind,patch]of badCases){const row=structuredClone(find(kind));Object.assign(row.params,patch);assert.throws(()=>renderEdition(row),kind);}
console.log(JSON.stringify({editions:batch.editions.length,fixtureAnswers:expected.length,finiteDomainChecks:11,rejectedMutations:mutations,rejectedInvalidDomains:badCases.length,status:'passed',independentEditorialReview:'pending'}));
