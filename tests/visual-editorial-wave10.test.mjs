import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave10} from '../scripts/editorial/visual-wave10-prepare.mjs';
import {parseAffine,linearRoot,absoluteRoots,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave10-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave10-algebra-diagrams.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave10-'+s)),calc=q=>independentlyCalculate(q).answer,asNum=r=>r.n/r.d;
test('publisher verification contract supplies nonempty check strings without mutating frozen metadata',()=>{
 for(const q of pack.editions){const before=JSON.stringify(q),result=verifyEdition(q);assert.ok(Array.isArray(result.checks)&&result.checks.length>0);assert.ok(result.checks.every(s=>typeof s==='string'&&s.length>0));assert.equal(JSON.stringify(q),before);}
});
test('all20 individually addressed source drafts exhaust grade6chapter3–4 visual inventory',()=>{
 assert.equal(pack.editions.length,20);assert.deepEqual(prepareVisualWave10(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,20);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');assert.equal(verifyEdition(q).answer,q.answer);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('all20 separately reasoned keys ignore stored answers',()=>{
 assert.deepEqual(pack.editions.map(calc),['36','29','40','4','7(x + 5) = 7x + 35','7','30','56','35','4a + 6','(3 + (1/4))','88','8','12','29','3x + 5 = -7','9','7','4','|x| = 4']);
 for(const q of pack.editions){const bad=structuredClone(q);bad.answer='invalid';assert.equal(calc(bad),q.answer);assert.throws(()=>verifyEdition(bad),/Independent algebra answer/);}
});
test('bounded exact parser preserves implicit multiplication, signed zero and decimal rational coefficients',()=>{
 assert.deepEqual(parseAffine('7(x + 5)'),[{n:7,d:1},{n:35,d:1}]);assert.deepEqual(parseAffine('-x + 8'),[{n:-1,d:1},{n:8,d:1}]);assert.deepEqual(parseAffine('0,75x'),[{n:3,d:4},{n:0,d:1}]);assert.deepEqual(parseAffine('(-1) × 0'),[{n:0,d:1},{n:0,d:1}]);
 assert.deepEqual(parseAffine('(1/(3 + (1/4)))'),[{n:0,d:1},{n:4,d:13}]);assert.throws(()=>parseAffine('1/0'));assert.throws(()=>parseAffine('x*x'));assert.throws(()=>parseAffine('x/2 + globalThis'));assert.throws(()=>parseAffine('2^3'));assert.throws(()=>parseAffine('1/(x+1)'));
});
test('machine multiplication precedes subtraction; reversed operation order is a different output',()=>{
 assert.equal(calc(row('ordered-number-machine')),'29');assert.equal((7-6)*5,5);assert.notEqual((7-6)*5,Number(row('ordered-number-machine').answer));
});
test('triangle half-area and rectangle full perimeter remain different substitution targets',()=>{
 assert.equal(calc(row('variable-triangle-area')),'36');assert.equal(9*8,72);assert.equal(calc(row('variable-rectangle-boundary')),'40');assert.notEqual(14*6,40);
});
test('actual card text yields four negative coefficients, including implicit -1 and positive double negatives',()=>{
 const q=row('signed-coefficient-cards');assert.deepEqual(independentlyCalculate(q).checks.coefficients,['-5','-4','-6','-1','1','3/4']);assert.equal(calc(q),'4');assert.match(q.params.cards[4],/-u.*-v/);
});
test('actual printed equality options compare exact coefficient pairs rather than one substituted example',()=>{
 const q=row('area-distributive-identity');assert.equal(calc(q),'7(x + 5) = 7x + 35');const trueOptions=q.options.filter(s=>{const [a,b]=s.split('=');return JSON.stringify(parseAffine(a))===JSON.stringify(parseAffine(b));});assert.equal(trueOptions.length,1);
 const bad=row('false-area-identity');assert.equal(calc(bad),'4a + 6');assert.deepEqual(parseAffine('4(a + 6)','a'),[{n:4,d:1},{n:24,d:1}]);assert.deepEqual(parseAffine('(a+6)×4','a'),[{n:4,d:1},{n:24,d:1}]);assert.notDeepEqual(parseAffine('4a+6','a'),parseAffine('4a+24','a'));
});
test('tile variable coefficient and rectangle constant have independent requested targets',()=>{
 const q=row('algebra-tile-coefficient');assert.equal(calc(q),'7');assert.equal(independentlyCalculate(q).checks.constant,8);const svg=svgFor(q);assert.equal([...svg.matchAll(/data-tile="x"/g)].length,7);assert.equal([...svg.matchAll(/data-tile="1"/g)].length,8);
 assert.equal(calc(row('area-constant-after-expansion')),'35');
});
test('like terms are added before substitution, and the new triangle is geometrically possible',()=>{
 assert.equal(calc(row('variable-strip-like-terms')),'30');assert.equal(2*5+3*5+5,30);const q=row('triangle-like-term-perimeter');assert.equal(calc(q),'56');assert.equal(3*4+5*4+6*4,56);
 const invalid=structuredClone(q);invalid.params.sides=[1,2,6];assert.throws(()=>calc(invalid),/triangle inequalities/);
});
test('square tiling reads3 large squares and4 small squares, not inverse aspect or swapped counts',()=>{
 const q=row('square-tiling-continued-ratio'),r=independentlyCalculate(q);assert.deepEqual(r.checks,{width:26,height:8,ratio:'13/4'});assert.equal(calc(q),'(3 + (1/4))');const svg=svgFor(q);assert.equal([...svg.matchAll(/data-square="large"/g)].length,3);assert.equal([...svg.matchAll(/data-square="small"/g)].length,4);
 assert.equal(asNum(parseAffine('(1/(3+(1/4)))')[1]),4/13);
});
test('all actually printed equality premises are true and grouping survives memberwise product',()=>{
 const p=row('memberwise-equality-product'),s=row('signed-memberwise-equality-sum');assert.equal(calc(p),'88');assert.deepEqual(independentlyCalculate(p).checks.premises,['11','8']);assert.equal(calc(s),'8');assert.deepEqual(independentlyCalculate(s).checks.premises,['-7','15']);
 p.params.equalities[0][1]='12';assert.throws(()=>calc(p),/premise/);assert.notEqual(4+7*17-9,88,'Dropping product parentheses changes the expression');
});
test('one balance and two-balance transitivity preserve explicit known totals',()=>{
 assert.equal(calc(row('balanced-unknown-mass')),'12');const q=row('two-balances-transitivity');assert.equal(calc(q),'29');assert.equal(independentlyCalculate(q).checks.commonTotal,40);
 q.params.bridge[1]=14;assert.throws(()=>calc(q),/First actual balance/);
});
test('all essential masses in both small balances retain at least14px text at343px width',()=>{
 const svg=svgFor(row('two-balances-transitivity'));for(const m of svg.matchAll(/<text [^>]*font-size="([^"]+)"[^>]*>(8|25|15|\?|11)<\/text>/g))assert.ok(Number(m[1])>=20);assert.equal([...svg.matchAll(/font-size="20"/g)].length,11);
});
test('coordinate-to-linear-equation choices are solved from the actual printed equation strings',()=>{
 const q=row('coordinate-selects-equation');assert.equal(calc(q),'3x + 5 = -7');assert.deepEqual(q.options.map(t=>asNum(linearRoot(t))),[4,4,-1.25,-4]);assert.deepEqual(linearRoot('3x + 5 = -7'),{n:-4,d:1});
});
test('partition and two-sided balance cancel known and variable quantities separately',()=>{
 assert.equal(calc(row('equal-strip-parts-equation')),'9');assert.equal(4*9+6,42);const q=row('balance-variable-both-sides');assert.equal(calc(q),'7');assert.equal(5*7+3,2*7+24);
 const svg=svgFor(q);assert.equal([...svg.matchAll(/data-weight="x"/g)].length,7);assert.equal([...svg.matchAll(/data-weight="3"/g)].length,1);assert.equal([...svg.matchAll(/data-weight="24"/g)].length,1);
});
test('shifted absolute equation chooses the right root and does not print unknown coordinates in accessible text',()=>{
 const q=row('shifted-absolute-right-root');assert.equal(calc(q),'4');assert.deepEqual(independentlyCalculate(q).checks,{leftRoot:-6,rightRoot:4});assert.doesNotMatch(descriptionFor(q),/B.{0,16}(?:координатасы|санында) 4|A.{0,16}координатасы -6/);const svg=svgFor(q);assert.match(svg,/data-center="-1"/);assert.match(svg,/data-root="-6"/);assert.match(svg,/data-root="4"/);assert.doesNotMatch(svg,/>4<\/text>|>-6<\/text>/);
});
test('absolute equation requires precisely both roots, rejecting the double distance and one-root distractors',()=>{
 const q=row('absolute-equation-two-roots');assert.equal(calc(q),'|x| = 4');assert.deepEqual(absoluteRoots('|x| = 4').map(asNum),[-4,4]);assert.deepEqual(absoluteRoots('|x - 4| = 0').map(asNum),[4]);assert.deepEqual(absoluteRoots('|x + 1| = 5').map(asNum),[-6,4]);assert.deepEqual(absoluteRoots('|x| = 8').map(asNum),[-8,8]);
});
test('actual native triangle sides, right legs and given numeric rectangle sides use one metric',()=>{
 const q=row('triangle-like-term-perimeter'),svg=svgFor(q),m=svg.match(/data-sides="3,5,6" points="([^"]+)"/);assert.ok(m);const [A,B,C]=m[1].split(' ').map(s=>s.split(',').map(Number)),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),scale=dist(A,B)/6;assert.ok(Math.abs(dist(A,C)/scale-3)<1e-10);assert.ok(Math.abs(dist(B,C)/scale-5)<1e-10);
 for(const suffix of ['area-distributive-identity','area-constant-after-expansion','false-area-identity']){const r=row(suffix),s=svgFor(r),a=s.match(/width="([^"]+)" height="([^"]+)"[^>]*data-side="constant"/);assert.ok(a);assert.ok(Math.abs(Number(a[1])/Number(a[2])-r.params.constant/r.params.height)<1e-12);}
});
test('parameter edits invalidate exact question, solution, accessible geometry and native file SHA',()=>{
 const q=row('variable-triangle-area');q.params.value=10;q.answer='45';assert.throws(()=>verifyEdition(q),/statement/);q.statement=statementFor(q);assert.throws(()=>verifyEdition(q),/solution/);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});
