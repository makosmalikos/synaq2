import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {independentlyCalculate,verifyEdition,svgFor,statementFor,solutionFor} from '../scripts/editorial/visual-foundation-models.mjs';
import {visualFamily} from '../scripts/editorial/visual-inventory.mjs';

const root=new URL('../',import.meta.url);
const pack=JSON.parse(fs.readFileSync(new URL('problems/editorial/batches/visual-foundations.json',root)));
const byModel=new Map(pack.editions.map(r=>[r.modelId,r]));
const row=name=>structuredClone(byModel.get('visual-'+name));
const calc=(name,params)=>independentlyCalculate({modelId:'visual-'+name,params}).answer;
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

test('22 distinct visual drafts retain a source occurrence and a newly computed native drawing',()=>{
 assert.equal(pack.status,'draft_awaiting_independent_review');assert.equal(pack.publication.allowed,false);
 assert.equal(pack.editions.length,22);assert.equal(byModel.size,22);
 assert.equal(new Set(pack.editions.map(r=>r.sourceOccurrenceId)).size,22);
 const expected={
  'bead-number':'4906','trek-days':'6','clock-angle':'50','sector-fraction':'7/12','temperature-rise':'12','reading-bar-gap':'7',
  'shoot-growth':'13','ray-improper-numerator':'17','notched-frame':'66','fan-all-triangles':'15','polygon-pieces':'9',
  'club-union':'25','interval-integer':'10','led-weight':'4,75','mirror-point':'(4; 3)','mirror-cells':'9','open-pool-tiles':'234',
  'opposite-angle':'58','circle-sector-gap':'85','nested-subsets':'16','square-circle-corners':'30,96','ring-width':'7',
 };
 for(const q of pack.editions){
  assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');
  assert.equal(verifyEdition(q).answer,expected[q.editionId.replace(/^visual-/,'')]);
  const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(sha(bytes),q.figureSha256);
  const drawing=bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"','');
  assert.doesNotMatch(drawing,/<image\b|<script\b|<foreignObject\b|https?:|href=|data:image/i);
 }
});

test('new parameter changes cannot retain a stale figure digest or condition',()=>{
 const q=row('abacus-number');q.params.digits[0]=5;q.answer='5906';q.statement=statementFor(q);q.solution=solutionFor(q);
 assert.throws(()=>verifyEdition(q),/figure digest/);
 const clock=row('clock-angle');clock.statement=clock.statement.replace('09:40','09:00');assert.throws(()=>verifyEdition(clock),/condition/);
 const broken=row('sector-fraction');broken.answer='5/12';assert.throws(()=>verifyEdition(broken),/mathematical answer/);
});

test('clock hand calculations include continuous hour movement at fractional minutes',()=>{
 assert.equal(calc('clock-angle',{hour:9,minute:40}),'50');assert.notEqual(calc('clock-angle',{hour:9,minute:40}),'60');
 assert.equal(calc('clock-angle',{hour:0,minute:10}),'55');assert.equal(calc('clock-angle',{hour:11,minute:59}),'5,5');
});

test('notch width and location do not alter a single-notch boundary perimeter',()=>{
 const p=row('notch-perimeter').params;assert.equal(calc('notch-perimeter',p),'66');
 assert.equal(calc('notch-perimeter',{...p,notchWidth:2,offset:4}),'66');
 assert.throws(()=>calc('notch-perimeter',{...p,depth:12}));
});

test('triangle enumeration distinguishes all composite triangles from triangulation faces',()=>{
 assert.equal(calc('fan-triangles',{baseSegments:5}),'15');assert.equal(calc('fan-triangles',{baseSegments:10}),'55');
 assert.equal(calc('polygon-triangulation',{sides:11}),'9');assert.equal(calc('polygon-triangulation',{sides:6}),'4');
});

test('Venn diagram supplies whole-set totals and overlap without supplying the union',()=>{
 const q=row('venn-union'),svg=svgFor(q);const labels=[...svg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]);
 assert.deepEqual(labels,['A: 17','B: 14','6']);assert.equal(verifyEdition(q).answer,'25');
 assert.equal(calc('venn-union',{leftOnly:3,rightOnly:4,both:8}),'15');
});

test('an open endpoint is not the largest integer of the interval union',()=>{
 const p=row('interval-maximum').params;assert.equal(calc('interval-maximum',p),'10');
 assert.equal(calc('interval-maximum',{...p,b:{...p.b,hi:10}}),'9');
 assert.throws(()=>calc('interval-maximum',{...p,b:{...p.b,hiClosed:true}}),/open/);
 const labels=[...svgFor(row('interval-maximum')).matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]);
 assert.deepEqual(labels,['A','-5','0','4','B','1','11'],'endpoint neighbours must not crowd the 343px figure');
});

test('all drawn metal sticks have equal length and reference 1 has a visible gap',()=>{
 const svg=svgFor(row('seven-segment-mass'));
 const lines=[...svg.matchAll(/<line\s+x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"[^>]*data-stick="1"/g)].map(m=>m.slice(1).map(Number));
 assert.equal(lines.length,21);assert.ok(lines.every(([x,y,a,b])=>Math.hypot(a-x,b-y)===32));
 assert.equal(lines[1][1]-lines[0][3],8,'two sticks of digit 1 must not merge into one continuous line');
 assert.equal(calc('seven-segment-mass',{target:'10',referenceCents:50}),'2');
 for(const [target,total]of[['01234',24],['56789',29]]){
  const q=row('seven-segment-mass');q.params.target=target;
  assert.equal([...svgFor(q).matchAll(/data-stick="1"/g)].length,total);
 }
});

test('open container has five surfaces and reflected cell sets preserve holes and count',()=>{
 assert.equal(calc('open-pool-surface',{length:1,width:1,depth:1}),'5');
 assert.equal(calc('open-pool-surface',{length:6,width:4,depth:2}),'64');
 assert.equal(verifyEdition(row('pixel-reflection')).answer,'9');
 assert.equal(calc('point-ox-reflection',{x:-4,y:2}),'(-4; -2)');
 const p=row('pixel-reflection').params;p.cells.push(p.cells[0]);assert.throws(()=>calc('pixel-reflection',p));
});

test('exact decimal conventions and zero-crossing narratives are constrained',()=>{
 assert.equal(calc('square-circle-corners',{radius:5,piHundredths:314}),'21,5');
 assert.equal(calc('temperature-rise',{cold:-11,warm:4}),'15');
 assert.throws(()=>calc('temperature-rise',{cold:1,warm:4}));
 assert.equal(calc('sector-fraction',{total:12,shaded:8}),'2/3');
 assert.equal(calc('ray-numerator',{divisions:8,numerator:19}),'19');
});

test('visual triage does not mistake area units, travel turns or fraction durations for diagram skills',()=>{
 assert.equal(visualFamily('Бүлдірген неше шаршы метр жерге отырғызылған?').family,'polygon-measurement');
 assert.equal(visualFamily('Көк бөліктің ауданы неше шаршы см?').family,'polygon-measurement');
 assert.equal(visualFamily('Бассейннің түбіне неше шаршы метр плитка қажет?').family,'polygon-measurement');
 assert.equal(visualFamily('Шыбын велосипедшіге жетіп, кері бұрылып ұшты. Барлығы неше км?').family,'illustrated-word-problem');
 assert.equal(visualFamily('Уақыт сағатпен көрсетілген. Неше сағат артық?').family,'illustrated-word-problem');
 assert.equal(visualFamily('Сағаттық тіл мен минуттық тілдің арасындағы бұрыш неше градус?').family,'clock-hands');
 assert.equal(visualFamily('Суретте барлығы неше үшбұрыш бар?').family,'figure-enumeration');
});

test('inventory counts canonical occurrences without treating archived drawings as authored editions',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('problems/editorial/batches/visual-inventory.json',root)));
 assert.equal(data.summary.canonicalSourceOccurrences,9645);assert.equal(data.records.length,1799);
 assert.equal(data.assets.length,1745);assert.deepEqual(data.summary.courseVisualByGrade,{'4':582,'5':700,'6':232});
 assert.equal(new Set(data.records.map(r=>r.occurrenceId)).size,1799);
 assert.ok(data.assets.every(a=>a.canReuseSourcePathsAsOwnDrawing===false));
 assert.equal(data.summary.newVerifiedEditionsInThisInventory,0);
 assert.ok(data.records.every(r=>r.sourceTopologyReviewedForNewEdition===false));
});
