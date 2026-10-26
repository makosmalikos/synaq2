import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{renderEdition,verifyEdition}from'../scripts/editorial/grade6-addition-properties-models.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-addition-properties.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['-12','a + (-a) = 2a','(7/11)','(-6 + 11) + (-5) = -6 + (11 + (-5))','-17 және -13','8','13','-3,3','64','86','-18','-9 + 7 = 7 + (-9)','10','-11 + 4 + 7'];
test('all14saved addition-property skills match hand-derived keys and paid scope',()=>{assert.equal(rows.length,14);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});});
test('property recognition distinguishes all-true numeric identities by order versus brackets',()=>{
 assert.equal(rows[3].answer,'(-6 + 11) + (-5) = -6 + (11 + (-5))');assert.equal(rows[11].answer,'-9 + 7 = 7 + (-9)');
 for(let a=-10;a<=10;a++)for(let b=-10;b<=10;b++)for(let c=-10;c<=10;c++){assert.equal(a+b,b+a);assert.equal((a+b)+c,a+(b+c));}
 assert.match(rows[3].solution,/реті.*сақталады/);assert.match(rows[11].solution,/орын ауыстырады/);
});
test('not-universal identity has a real counterexample and is not incorrectly claimed never true',()=>{
 assert.equal(4+(-4),0);assert.notEqual(4+(-4),2*4);assert.equal(0+(-0),2*0);assert.match(rows[1].solution,/a = 0 болса ғана/);
});
test('round grouping criterion has a unique pair rather than relying on subjective convenience',()=>{
 const pairSums=[-17-13,-17+36,36-13];assert.equal(pairSums.filter(n=>n%10===0).length,1);assert.equal(pairSums[0],-30);assert.match(rows[4].statement,/10-ға еселік/);assert.equal(rows[5].answer,String((4+6)-(135+65)/100));assert.equal(rows[8].answer,String(164-35-65));
});
test('opposite cancellation keeps the survivor and preserves decimal/fraction signs',()=>{
 assert.equal(rows[0].answer,'-12');assert.equal(rows[2].answer,'(7/11)');assert.equal(rows[9].answer,'86');assert.equal(rows[10].answer,'-18');assert.notEqual(rows[10].answer,String(-18+41));
 assert.equal(rows[7].answer,'-3,3');assert.equal(-48+67-52,-33);
});
test('inclusive interval and zero sum retain all signs, zero, and unpaired endpoint',()=>{
 for(let n=1;n<=50;n++){let sum=0;for(let x=-n;x<=n+1;x++)sum+=x;assert.equal(renderEdition({...rows[6],params:{negativeEndMagnitude:n,positiveEnd:n+1}}).answer,String(sum));}
 assert.equal(38-14+2-16,10);assert.equal(rows[12].answer,'10');assert.equal(rows[13].answer,'-11 + 4 + 7');assert.deepEqual([-11+4+7,-11-4+7,11-4+7,-11+4-7],[0,-8,14,-14]);
});
test('modified fulltexts/options/keys and invalid grouping/counterexample domains cannot verify',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const[i,p]of [[1,{counterexample:0}],[2,{cancelNumerator:8}],[4,{negativeB:12}],[5,{negativeBHundredths:66}],[6,{positiveEnd:14}],[7,{negativeBTenths:53}],[8,{negativeB:64}],[10,{positive:36}],[13,{negative:12}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...p}}));
});
test('exact14saved nonvisual2.10 occurrences remain closed drafts with native math',()=>{const file='problems/sources/zerek/courses/6-math-2-10-level1.json',source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));const refs=source.questions.filter(q=>!q.images?.length&&!q.svg?.length).map(q=>{assert.equal(q.checked,true);return file+'#'+q.id;});assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);});
