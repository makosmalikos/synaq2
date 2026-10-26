import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-fraction-ray-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const rows=buildEditions(),prefix='grade5-fraction-ray-',kind=r=>r.modelId.slice(prefix.length),range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const one=xs=>{assert.equal(xs.length,1);return xs[0];},get=k=>one(rows.filter(r=>kind(r)===k)),pick=(r,f)=>one(r.options.filter(f)),raw=q=>q.length===3?[q[0]*q[2]+q[1],q[2]]:q,same=([a,b],[c,d])=>a*d===c*b;
function parse(s){let m=s.match(/^\((\d+) \+ \((\d+)\/(\d+)\)\)$/);if(m)return[Number(m[1])*Number(m[3])+Number(m[2]),Number(m[3])];m=s.match(/^\((\d+)\/(\d+)\)$/);if(m)return m.slice(1).map(Number);assert.match(s,/^\d+$/);return[Number(s),1];}
const numeric=(r,target)=>pick(r,o=>same(parse(o),target));
function scaled(q,scale){const[n,d]=raw(q);assert.equal(n*scale%d,0);return n*scale/d;}
function minimalScale(qs){for(let n=1;n<=10000;n++)if(qs.every(q=>{const[a,b]=raw(q);return a*n%b===0;}))return n;assert.fail('Bound too low');}
function oracle(r){const p=r.params;switch(kind(r)){
 case'remaining-unit-steps':return range(1,p.denominator).filter(k=>p.numerator+k<=p.denominator).length;
 case'minimal-fraction-partition':return minimalScale([[p.numerator,p.denominator]]);
 case'improper-point-to-mixed':return numeric(r,[p.numerator,p.denominator]);
 case'right-offset-from-integer':return numeric(r,[p.whole*p.denominator+p.steps,p.denominator]);
 case'fraction-to-equal-grid':return scaled([p.numerator,p.denominator],p.cells);
 case'unit-fraction-to-grid':return one(range(1,p.cells).filter(x=>x*p.denominator===p.cells));
 case'proper-fraction-to-centimetres':return one(range(1,p.centimetres).filter(x=>x*p.denominator===p.centimetres*p.numerator));
 case'lower-natural-neighbour':return one(range(1,p.numerator).filter(n=>n*p.denominator<p.numerator&&p.numerator<(n+1)*p.denominator));
 case'mixed-point-construction':return pick(r,o=>{const m=o.match(/^0-ден (\d+) толық бірлік, одан кейін бірлікті (\d+) тең бөлікке бөліп, (\d+) бөлігін оңға алу$/);return m&&Number(m[1])===p.whole&&Number(m[2])===p.denominator&&Number(m[3])===p.numerator;});
 case'coarsen-coordinate-grid':return pick(r,o=>{const[n,d]=parse(o);return d===p.denominator/p.group&&same([n,d],[p.numerator,p.denominator]);});
 case'unit-midpoint':return pick(r,o=>{const[n,d]=parse(o);return n*2===d;});
 case'interior-division-marks':return range(0,p.parts).filter(k=>k>0&&k<p.parts).length;
 case'physical-distance-to-proper-coordinate':case'physical-distance-to-mixed-coordinate':return numeric(r,[p.distance,p.unit]);
 case'equal-days-progress-grid':return one(range(1,p.cells).filter(c=>c*p.days===p.cells*p.elapsed));
 case'order-labelled-fraction-points':return p.points.map(([name,q])=>[name,scaled(q,p.cells)]).toSorted((a,b)=>a[1]-b[1]).map(q=>q[0]).join(', ');
 case'same-denominator-grid-gap':return scaled(p.right,p.cells)-scaled(p.left,p.cells);
 case'infer-partition-from-two-sides':return numeric(r,[p.whole*(p.leftSteps+p.rightSteps)+p.leftSteps,p.leftSteps+p.rightSteps]);
 case'count-distinct-fraction-positions':{const distinct=[];for(const q of p.values)if(!distinct.some(d=>same(raw(q),d)))distinct.push(raw(q));return distinct.length;}
 case'grid-distance-to-reduced-coordinate':return numeric(r,[p.distance,p.cells]);
 case'minimal-common-coordinate-scale':return minimalScale(p.fractions);
 case'real-road-coordinate-distance':return one(range(1,p.meters).filter(d=>d*p.denominator===p.meters*p.numerator));
 case'left-offset-across-integer':return numeric(r,[p.integer*p.denominator-p.steps,p.denominator]);
 case'completed-route-coordinate':return numeric(r,[p.completed,p.total]);
 case'sum-natural-neighbours':{const low=one(range(1,p.numerator).filter(n=>n*p.denominator<p.numerator&&p.numerator<(n+1)*p.denominator));return low+low+1;}
 case'mixed-coordinate-to-centimetres':case'mixed-coordinate-to-equal-grid':return scaled([p.whole,p.numerator,p.denominator],p.unit??p.cells);
 case'internal-ratio-fraction-point':return pick(r,o=>{const[n,d]=parse(o),[a,b]=raw(p.left),[c,e]=raw(p.right);return n*b>a*d&&n*e<c*d&&(c*d-n*e)*b===p.ratio*(n*b-a*d)*e;});
 case'farthest-from-half-grid':{const origin=scaled(p.target,p.cells);return Math.max(...p.fractions.map(q=>Math.abs(scaled(q,p.cells)-origin)));}
 case'farthest-from-whole-coordinate':{const distances=r.options.map(o=>Math.abs(scaled(parse(o),p.cells)-p.target*p.cells)),largest=Math.max(...distances);return one(r.options.filter((_,i)=>distances[i]===largest));}
 case'infer-unit-from-fraction-gap':{const[a,b]=raw(p.left),[c,d]=raw(p.right);return one(range(1,1000).filter(u=>(c*b-a*d)*u===p.gap*b*d));}
 case'repeated-fractional-motion':return numeric(r,[p.numerator*p.minutes,p.denominator]);
 case'infer-scale-then-second-coordinate':{const[n,d]=raw(p.first),unit=one(range(1,1000).filter(u=>u*n===p.firstCells*d));return numeric(r,[p.secondCells,unit]);}
 case'strict-between-mixed-count':{const[a,b]=raw(p.left),[c,d]=raw(p.right);return range(1,c*p.denominator).filter(n=>n*b>a*p.denominator&&n*d<c*p.denominator).length;}
 case'union-denominator-grid-count':return range(1,p.cells-1).filter(n=>p.denominators.some(d=>n*d%p.cells===0)).length;
 case'unit-internal-distance-ratio':return pick(r,o=>{const[n,d]=parse(o);return 0<n&&n<d&&n===p.ratio*(d-n);});
 case'minimal-scale-then-gap':{const u=minimalScale([p.left,p.right]);return scaled(p.right,u)-scaled(p.left,u);}
 case'one-step-left-of-unit':return numeric(r,[p.denominator-1,p.denominator]);
 case'select-point-inside-unit':return pick(r,o=>{const[n,d]=parse(o);return n>0&&n<d;});
 case'midpoint-of-fraction-points':return pick(r,o=>{const[n,d]=parse(o),[a,b]=raw(p.left),[c,e]=raw(p.right);return (n*b-a*d)*e===(c*d-n*e)*b;});
 case'real-place-map-grid-gap':return scaled(p.second,p.cells)-scaled(p.first,p.cells);
 case'irreducible-points-in-upper-half':return range(p.lower,p.upper).filter(n=>range(2,p.denominator).every(d=>n%d!==0||p.denominator%d!==0)).length;
 case'different-units-physical-farthest':{const distances=p.points.map(([name,u,q])=>[name,scaled(q,u)]),max=Math.max(...distances.map(e=>e[1]));return one(distances.filter(e=>e[1]===max))[0];}
 case'noninteger-tick-index':return range(1,p.index*p.denominator).filter(n=>n%p.denominator!==0)[p.index-1];
 default:throw Error('Missing separate author oracle '+kind(r));
}}
for(const row of rows)test('separate exact/domain author check '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all44 saved nonvisual3.5 sources covered once; grade/source skills retained and external review pending',()=>{
 const qs=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-5');assert.equal(qs.length,44);assert.equal(rows.length,44);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(qs.map(q=>q.sourceId)));
 const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 for(const r of rows){const ref=r.sourceRefs[0],q=one(JSON.parse(fs.readFileSync(ref.sourceFile)).questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(norm(q.statement),norm(r.statement));assert.equal(r.grade,5);assert.equal(r.topic,'frac');assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'awaiting_independent_review');assert.ok(!r.figure&&!r.image);}
});
test('all parameters/physical units/full text/solutions/options/source metadata exactly bound',()=>{
 for(const r of rows){for(const f of['statement','answer','solution']){const b=structuredClone(r);b[f]+=' өзгеріс';assert.throws(()=>verifyEdition(b));}for(const f of['grade','topic','difficulty','minimumPlan','modelId']){const b=structuredClone(r);b[f]='tamper';assert.throws(()=>verifyEdition(b));}for(const[k,v]of Object.entries(r.params)){const b=structuredClone(r);b.params[k]=typeof v==='number'?v+1:[...v,99];assert.throws(()=>verifyEdition(b));}if(r.options){const b=structuredClone(r);b.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(b));}const b=structuredClone(r);b.sourceRefs[0].sourceId='bad';assert.throws(()=>verifyEdition(b));}
});
test('every fraction/mixed group is native canonical, never bare text slash or TeX',()=>{
 let fractions=0,mixed=0;const walk=nodes=>{for(const n of nodes)if(n.type==='text'){assert.ok(!/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/u.test(n.value),n.value);assert.ok(!/[\\$^]/.test(n.value));}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else assert.fail(n.type);};
 for(const r of rows)for(const t of[r.statement,r.solution,r.answer,...(r.options||[])])walk(mathFragments(t));assert.ok(fractions>180&&mixed>40,{fractions,mixed});assert.ok(get('noninteger-tick-index').statement.includes('(a/8)'));
});
test('strict interval counts include integer representations but exclude endpoints',()=>{
 const r=get('strict-between-mixed-count');assert.equal(r.answer,'24');const ns=range(1,100).filter(n=>n>22&&n<47);assert.equal(ns.length,24);assert.deepEqual(ns.filter(n=>n%9===0),[27,36,45]);assert.ok(!ns.includes(22)&&!ns.includes(47));
 assert.equal(get('union-denominator-grid-count').answer,'13');const six=range(1,29).filter(k=>k*6%30===0),ten=range(1,29).filter(k=>k*10%30===0);assert.equal(six.length,5);assert.equal(ten.length,9);assert.deepEqual(six.filter(k=>ten.includes(k)),[15]);assert.equal(5+9-1,13);
 assert.equal(get('interior-division-marks').answer,'8');assert.equal(get('remaining-unit-steps').answer,'6');
});
test('equivalent fractions coincide; irreducibility does not require prime numerator',()=>{
 const r=get('count-distinct-fraction-positions');assert.equal(r.answer,'5');assert.deepEqual(r.params.values.map(q=>scaled(q,12)),[3,2,8,8,5,15,15]);
 assert.equal(get('irreducible-points-in-upper-half').answer,'3');assert.deepEqual(range(8,13).filter(n=>range(2,14).every(d=>n%d!==0||14%d!==0)),[9,11,13]);assert.equal(9%3,0);assert.equal(14%3,2);
 assert.equal(get('coarsen-coordinate-grid').answer,'(3/5)');assert.ok(same([9,15],[3,5]));assert.ok(!same([3,15],[9,15]));
});
test('minimum grid scales proved by complete smaller-unit domains',()=>{
 for(const[k,qs,expected]of[['minimal-common-coordinate-scale',[[1,6],[3,8],[5,12]],24],['minimal-scale-then-gap',[[3,5],[1,3,8]],40],['minimal-fraction-partition',[[7,15]],15]]){
  assert.equal(minimalScale(qs),expected);for(let u=1;u<expected;u++)assert.ok(qs.some(q=>{const[n,d]=raw(q);return n*u%d!==0;}));if(k==='minimal-common-coordinate-scale')assert.equal(get(k).answer,'24');
 }assert.equal(get('minimal-scale-then-gap').answer,'31');assert.equal(scaled([3,5],40),24);assert.equal(scaled([1,3,8],40),55);
 assert.equal(get('infer-unit-from-fraction-gap').answer,'40');assert.equal(scaled([1,1,8],40)-scaled([3,4],40),15);
});
test('left/right distances, two-sided farthest and midpoint are different requested quantities',()=>{
 assert.equal(get('left-offset-across-integer').answer,'(4 + (5/8))');assert.equal(5*8-3,4*8+5);
 assert.equal(get('right-offset-from-integer').answer,'(4 + (3/8))');assert.equal(get('one-step-left-of-unit').answer,'(8/9)');
 const r=get('farthest-from-half-grid'),positions=r.params.fractions.map(q=>scaled(q,60));assert.deepEqual(positions,[10,24,45,42]);assert.deepEqual(positions.map(x=>Math.abs(x-30)),[20,6,15,12]);assert.equal(r.answer,'20');assert.notEqual(positions[0],Math.max(...positions));
 assert.equal(get('midpoint-of-fraction-points').answer,'(7/16)');assert.equal((9-5)/16,1/4);assert.equal((9+5)/16,7/8);assert.notEqual(7/16,1/4);assert.notEqual(7/16,7/8);
});
test('ratio, changing scales, new real contexts and complete tick-boundary domain',()=>{
 assert.equal(get('internal-ratio-fraction-point').answer,'(2 + (5/8))');assert.equal(35-21,2*(21-14));
 assert.equal(get('unit-internal-distance-ratio').answer,'(4/5)');assert.ok(get('unit-internal-distance-ratio').statement.includes('OX кесіндісінің ұзындығы XU ұзындығынан'));
 const r=get('different-units-physical-farthest');assert.equal(r.answer,'Айсұлу');assert.deepEqual(r.params.points.map(([,u,q])=>scaled(q,u)),[28,28,30]);assert.equal(get('infer-scale-then-second-coordinate').answer,'(1 + (7/8))');assert.equal(32*5/8,20);assert.equal(32*(1+7/8),60);
 assert.equal(get('real-place-map-grid-gap').answer,'13');assert.equal(get('real-road-coordinate-distance').answer,'900');assert.equal(get('completed-route-coordinate').answer,'(3/5)');assert.equal(get('equal-days-progress-grid').answer,'15');
 assert.equal(get('noninteger-tick-index').answer,'74');let checked=0;for(let d=2;d<=20;d++){const actual=range(1,1000).filter(n=>n%d!==0);for(let i=1;i<=100;i++){const q=Math.floor((i-1)/(d-1)),r=(i-1)%(d-1)+1;assert.equal(q*d+r,actual[i-1]);checked++;}}assert.equal(checked,1900);
 assert.equal(range(1,8).filter(n=>n%8!==0)[6],7);assert.equal(range(1,16).filter(n=>n%8!==0)[7],9);assert.equal(74-Math.floor(74/8),65);
});
