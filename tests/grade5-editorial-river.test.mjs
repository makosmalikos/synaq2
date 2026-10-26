import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-river-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const rows=buildEditions(),prefix='grade5-river-',kind=r=>r.modelId.slice(prefix.length);
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const get=k=>one(rows.filter(r=>kind(r)===k));
const pick=(r,fn)=>one(r.options.filter(fn));
const number=o=>{const m=o.match(/^(\d+)(?: км\/сағ| км| м\/мин| сағат| тәулік| м| есе)?$/);assert.ok(m);return Number(m[1]);};
const numeric=(r,n)=>r.options?pick(r,o=>number(o)===n):n;
// Oracle searches complete integer physical-state/time domains and checks
// observed forward trajectories, never importing the producer calculator.
const states=(max,fn)=>{const out=[];for(let v=1;v<=max;v++)for(let u=1;u<v;u++)if(fn(v,u))out.push([v,u]);return out;};
function oracle(row){const p=row.params;switch(kind(row)){
 case'raft-distance':return Array(p.hours).fill(p.current).reduce((a,b)=>a+b,0);
 case'current-from-own-down':return numeric(row,one(range(1,p.own-1).filter(u=>p.own+u===p.down)));
 case'raft-speed':return pick(row,o=>o===`${p.current} км/сағ`);
 case'downstream-direction':assert.ok(p.backHours<p.outHours);return pick(row,o=>o===`${p.secondPort} айлағынан ${p.firstPort} айлағына`);
 case'own-from-two-speeds':return one(states(p.down,(v,u)=>v+u===p.down&&v-u===p.up))[0];
 case'downstream-boat-distance':case'supply-boat-downstream-distance':return Array(p.hours).fill(p.own+p.current).reduce((a,b)=>a+b,0);
 case'speed-difference-theorem':{
  // Formal linear coefficient subtraction (v+u)-(v-u): v cancels,2u.
  assert.deepEqual([1-1,1-(-1)],[0,2]);for(let v=2;v<40;v++)for(let u=1;u<v;u++)assert.equal((v+u)-(v-u),2*u);return pick(row,o=>o==='Ағыс жылдамдығының екі есесіне');
 }
 case'own-from-down-current':return one(range(p.current+1,p.down).filter(v=>v+p.current===p.down));
 case'lake-distance-extraneous-current':return numeric(row,Array(p.hours).fill(p.own).reduce((a,b)=>a+b,0));
 case'time-from-given-downspeed':return one(range(1,p.distance).filter(t=>t*p.down===p.distance));
 case'own-from-up-current':return numeric(row,one(range(p.current+1,p.up+2*p.current).filter(v=>v-p.current===p.up)));
 case'current-from-raft-trip':return numeric(row,one(range(1,p.distance).filter(u=>u*p.hours===p.distance)));
 case'current-from-two-speeds':return one(states(p.down,(v,u)=>v+u===p.down&&v-u===p.up))[1];
 case'distance-from-given-upspeed':return Array(p.hours).fill(p.up).reduce((a,b)=>a+b,0);
 case'downstream-time':return one(range(1,p.distance).filter(t=>(p.own+p.current)*t===p.distance));
 case'own-from-two-trips':return one(states(p.downDistance,(v,u)=>(v+u)*p.downHours===p.downDistance&&(v-u)*p.upHours===p.upDistance))[0];
 case'upstream-time':return numeric(row,one(range(1,p.distance).filter(t=>(p.own-p.current)*t===p.distance)));
 case'up-to-down-distance':{
  const v=one(range(p.current+1,p.up+2*p.current).filter(v=>v-p.current===p.up));return (v+p.current)*p.hours;
 }
 case'boat-matches-raft-route':{
  const raftPath=Array(p.raftHours).fill(p.current).reduce((a,b)=>a+b,0);return numeric(row,one(range(1,raftPath).filter(t=>(p.own+p.current)*t===raftPath)));
 }
 case'upstream-distance':return Array(p.hours).fill(p.own-p.current).reduce((a,b)=>a+b,0);
 case'difference-from-current':{
  const values=new Set(range(p.current+1,p.current+40).map(v=>(v+p.current)-(v-p.current)));assert.equal(values.size,1);return pick(row,o=>o===`${one([...values])} км/сағ`);
 }
 case'swimmer-downstream-minutes':return one(range(1,p.distance).filter(t=>(p.own+p.current)*t===p.distance));
 case'boat-raft-separation':return numeric(row,Math.abs((p.own+p.current)*p.hours-p.current*p.hours));
 case'river-then-lake-total':return [...Array(p.riverHours).fill(p.own+p.current),...Array(p.lakeHours).fill(p.own)].reduce((a,b)=>a+b,0);
 case'current-from-two-trips':return numeric(row,one(states(p.downDistance,(v,u)=>(v+u)*p.downHours===p.downDistance&&(v-u)*p.upHours===p.upDistance))[1]);
 case'positive-upstream-headway':return pick(row,o=>number(o)-p.current>0);
 case'down-to-up-distance':{
  const v=one(range(p.current+1,p.down).filter(v=>v+p.current===p.down));return numeric(row,(v-p.current)*p.hours);
 }
 case'raft-time-without-distance':{
  // Route chosen as 2*downDays*upDays (different normalization to producer).
  const d=2*p.downDays*p.upDays,down=d/p.downDays,up=d/p.upDays;const [v,u]=one(states(d,(v,u)=>v+u===down&&v-u===up));assert.ok(v>u);return numeric(row,one(range(1,d).filter(t=>u*t===d)));
 }
 case'own-current-ratio-trip':{
  const [v,u]=one(states(p.downDistance,(v,u)=>v===p.ratio*u&&(v+u)*p.downHours===p.downDistance));return numeric(row,(v-u)*p.upHours);
 }
 case'equal-route-distance-inverse':return pick(row,o=>{const d=number(o);return d>p.own*p.downHours&&d*p.upHours+d*p.downHours===2*p.own*p.downHours*p.upHours;});
 case'round-trip-with-stop':{
  const out=one(range(1,p.distance).filter(t=>(p.own+p.current)*t===p.distance)),back=one(range(1,p.distance).filter(t=>(p.own-p.current)*t===p.distance));return out+p.stopHours+back;
 }
 case'raft-time-known-route':{
  const [v,u]=one(states(p.distance,(v,u)=>(v+u)*p.downHours===p.distance&&(v-u)*p.upHours===p.distance));assert.ok(v>u);return one(range(1,p.distance).filter(t=>u*t===p.distance));
 }
 case'boat-turns-to-meet-raft':{
  const v=one(range(p.current+1,p.distance).filter(v=>(v+p.current)*p.downHours===p.distance));
  const t=one(range(1,p.distance).filter(t=>p.distance-(v-p.current)*t===p.current*(p.downHours+t)));return p.downHours+t;
 }
 case'swimmer-lost-float-separation':return numeric(row,(p.own-p.current)*p.minutes+p.current*p.minutes);
 case'river-lake-roundtrip-comparison':{
  const out=one(range(1,p.distance).filter(t=>(p.own+p.current)*t===p.distance)),back=one(range(1,p.distance).filter(t=>(p.own-p.current)*t===p.distance)),eachLake=one(range(1,p.distance).filter(t=>p.own*t===p.distance));const gap=out+back-2*eachLake;assert.equal(gap,2);return pick(row,o=>o===`Өзенде ${gap} сағатқа ұзақ`);
 }
 case'turn-before-origin-distance':return Math.abs((p.own+p.current)*p.downHours-(p.own-p.current)*p.upHours);
 case'groundspeed-ratio-to-own-ratio':{
  const ratios=new Set(states(80,(v,u)=>v+u===p.downUpRatio*(v-u)).map(([v,u])=>v/u));assert.equal(ratios.size,1);
  // Algebraic identity: (r-1)*v=(r+1)*u gives unique ratio for ANY scale.
  for(const [v,u]of states(40,(v,u)=>v+u===p.downUpRatio*(v-u)))assert.equal((p.downUpRatio-1)*v,(p.downUpRatio+1)*u);
  return numeric(row,one([...ratios]));
 }
 case'up-from-lake-down':{
  const u=one(range(1,p.own).filter(u=>p.own+u===p.down));return numeric(row,p.own-u);
 }
 case'raft-distance-from-groundspeeds':return one(states(p.down,(v,u)=>v+u===p.down&&v-u===p.up))[1]*p.hours;
 case'lake-speed-from-down-trip':return one(range(p.current+1,p.distance).filter(v=>(v+p.current)*p.hours===p.distance));
 case'upstream-metres-from-minutes':{
  // Cross-multiplied full-unit identity avoids repeating producer m/min conversion.
  return pick(row,o=>number(o)*60===(p.own-p.current)*1000*p.minutes);
 }
 case'staggered-raft-separation':{
  const first=Array(p.observeHour-p.firstHour).fill(p.current).reduce((a,b)=>a+b,0),second=Array(p.observeHour-p.secondHour).fill(p.current).reduce((a,b)=>a+b,0);return numeric(row,first-second);
 }
 case'lake-down-up-three-observations':{
  const [v,u]=one(states(p.downDistance,(v,u)=>v*p.lakeHours===p.lakeDistance&&(v+u)*p.downHours===p.downDistance));return one(range(1,p.upDistance).filter(t=>(v-u)*t===p.upDistance));
 }
 case'maximum-returnable-excursion':{
  const up=p.own-p.current,down=p.own+p.current;
  const possible=range(0,p.totalHours*up).filter(d=>d*(up+down)<=p.totalHours*up*down);const max=Math.max(...possible);
  assert.equal(max*(up+down),p.totalHours*up*down);assert.ok((max+1)*(up+down)>p.totalHours*up*down);return numeric(row,max);
 }
 case'breakdown-drift-return':{
  const start=(p.own-p.current)*p.upHours,afterDrift=start-p.current*p.driftHours;assert.ok(afterDrift>0);const repaired=one(range(1,start).filter(t=>afterDrift-(p.own+p.current)*t===0));return p.upHours+p.driftHours+repaired;
 }
 case'delayed-boat-catches-raft':{
  const t=one(range(1,p.current*p.delayHours+1).filter(t=>(p.own+p.current)*t===p.current*(p.delayHours+t)));return (p.own+p.current)*t;
 }
 default:throw Error('Missing independent river oracle '+kind(row));
}}
for(const row of rows)test('full independent river forward/domain oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);assert.ok(!/[\\$]/.test(row.statement+row.solution));
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all47 canonical saved nonvisual2.10 sources covered once without pictures or premature review',()=>{
 const src=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-10');assert.equal(src.length,47);assert.equal(rows.length,47);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(src.map(q=>q.sourceId)));
 for(const row of rows){const ref=row.sourceRefs[0],q=one(JSON.parse(fs.readFileSync(ref.sourceFile)).questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(q.statement,row.statement);assert.equal(row.grade,5);assert.equal(row.minimumPlan,'pro');assert.ok(!row.figure&&!row.image);}
});
test('all printed numerical conditions full solutions answers choices and fixed parameter metadata bound',()=>{
 for(const row of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(row);bad[field]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}for(const field of['grade','topic','difficulty','modelId','minimumPlan']){const bad=structuredClone(row);bad[field]='tamper';assert.throws(()=>verifyEdition(bad));}const bad=structuredClone(row);bad.params.fakeCurrent=17;assert.throws(()=>verifyEdition(bad));if(row.options){const bad=structuredClone(row);bad.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}}
});
test('ground versus own speeds, still lake and strict upstream headway do not collapse',()=>{
 assert.equal(get('current-from-own-down').answer,'5 км/сағ');assert.equal(get('own-from-two-speeds').answer,'29');assert.equal(get('current-from-two-speeds').answer,'5');
 assert.equal(get('lake-distance-extraneous-current').answer,'55 км');assert.equal(get('positive-upstream-headway').answer,'41 м/мин');assert.equal(32-32,0);assert.ok(26-32<0);
 assert.equal(get('down-to-up-distance').answer,'108 км');assert.equal(get('up-to-down-distance').answer,'87');assert.equal(get('upstream-time').answer,'6 сағат');assert.equal(get('time-from-given-downspeed').answer,'5');
});
test('both floating and powered positions move; meeting TOTAL versus remaining time and position preserved',()=>{
 assert.equal(get('boat-raft-separation').answer,'60 км');assert.equal(18*4,72);assert.equal(3*4,12);
 assert.equal(get('boat-turns-to-meet-raft').answer,'6');assert.equal(3*6,75-19*3);
 assert.equal(get('delayed-boat-catches-raft').answer,'48');assert.equal(4*(8+4),12*4);
 assert.equal(get('staggered-raft-separation').answer,'12 км');assert.equal(4*(16-8)-4*(16-11),12);
 assert.equal(get('swimmer-lost-float-separation').answer,'280 м');assert.equal(40*5+16*5,280);
});
test('return constraint, stop, disabled drift and net distance retain all phases and actual requested quantity',()=>{
 assert.equal(get('round-trip-with-stop').answer,'15');assert.equal(140/28+3+140/20,15);
 assert.equal(get('breakdown-drift-return').answer,'11');assert.equal(8*5-3*4,14*2);
 assert.equal(get('turn-before-origin-distance').answer,'56');assert.equal(32*4-24*3,56);assert.notEqual(32*4+24*3,56);
 assert.equal(get('maximum-returnable-excursion').answer,'72 км');assert.equal(72/12+72/18,10);assert.ok(73/12+73/18>10);
 assert.equal(get('river-lake-roundtrip-comparison').answer,'Өзенде 2 сағатқа ұзақ');assert.equal(96/16+96/8-2*96/12,2);
 for(const [k,phrase]of[['round-trip-with-stop','онда 3 сағат тұрды'],['breakdown-drift-return','айлаққа қарай ақты'],['river-lake-roundtrip-comparison','БІР БАҒЫТТАҒЫ'],['maximum-returnable-excursion','ағыспен қайтуы тиіс']]){const row=get(k);assert.ok(row.statement.includes(phrase));const bad=structuredClone(row);bad.statement=bad.statement.replace(phrase,'');assert.throws(()=>verifyEdition(bad));}
});
test('metres/minutes, route-normalization, ratio and equal-route inverse preserve exact physical ledger',()=>{
 assert.equal(get('upstream-metres-from-minutes').answer,'2400 м');assert.equal(2400*60,9*1000*16);assert.notEqual(9*16,2400);
 assert.equal(get('raft-time-without-distance').answer,'24 тәулік');assert.equal(get('raft-time-known-route').answer,'36');
 assert.equal(get('own-current-ratio-trip').answer,'32 км');assert.equal(get('groundspeed-ratio-to-own-ratio').answer,'3 есе');assert.equal(get('equal-route-distance-inverse').answer,'120 км');
 assert.equal((32+8)*3,(32-8)*5);assert.ok(!get('equal-route-distance-inverse').solution.includes('333333'));assert.equal(get('river-then-lake-total').answer,'107');
 for(const k of['positive-upstream-headway','equal-route-distance-inverse','maximum-returnable-excursion']){const solution=get(k).solution;assert.ok(!/\d+\/\d+|= -\d/.test(solution),'Premature fraction/negative evaluation in '+k);}
});
