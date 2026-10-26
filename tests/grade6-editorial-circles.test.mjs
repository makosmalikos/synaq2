import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-circles-models.mjs';

const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-circles.json',import.meta.url),'utf8'));
const rows=pack.editions;
const keys=[
 'Ішкі бөлігі есепке алынбайтын идеал жұқа шар қабығы','Радиусы 8 см дөңгелек','12','π, шеңбер өлшеміне тәуелсіз тұрақты сан','264','113,04','50,24','26','616','O — сфераның центрі','693','110','S = π × t²','3 есе артады','176','42',
 '21','858','144','Екі шағын пиццада, 28,26 см²-ге көп','122,46','18,84','500','2464','16','18','770','21,5','153,86','113,04','1584','Ұзындықтар 3 : 5; аудандар 9 : 25',
 '504','625','1078','748','Дөңгелек, 132 см²-ге көп','660','6','1256','260,62','21,5','Жолдары тең, әрқайсысы 66 м','53',
 'Беттегі екі ұшты қосып, шар центрі арқылы өтетін кесінді','3,14','40','4158','13','42','10,5','14','2016','198',
];

test('all54 individually read circle/disk/sphere editions match hand-derived keys and access scope',()=>{
 assert.equal(rows.length,54);assert.equal(keys.length,54);assert.equal(new Set(rows.map(r=>r.editionId)).size,54);
 rows.forEach((r,i)=>{assert.equal(r.answer,keys[i],r.modelId);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);assert.equal(r.topic,'geo');if(r.options){assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);}});
});

test('whole boundaries include straight edges, while the two-half-arc path and stadium do not double-count diameters',()=>{
 assert.equal(22*56/7/2+56,144);assert.equal(rows[18].answer,'144');assert.match(rows[18].statement,/түзу диаметрі де/);
 assert.equal(2*120+22*84/7,504);assert.equal(rows[32].answer,'504');
 assert.equal(22*42/7/2,22*21/7/2*2);assert.match(rows[42].statement,/Түзу диаметрлер жолға кірмейді/);
 assert.equal(2*22*21/7/12+2*21,53);assert.equal(rows[43].answer,'53');
});

test('radius/diameter and squared ratios remain distinct across pizza, rings, inscribed figures and combined areas',()=>{
 assert.equal((2*15**2-21**2)*314,2826);assert.equal(rows[19].answer,'Екі шағын пиццада, 28,26 см²-ге көп');
 assert.equal(22*(21**2-14**2)/7,770);assert.equal(rows[26].answer,'770');
 assert.equal(22*((21+7)**2-21**2)/7,1078);assert.equal(rows[34].answer,'1078');
 assert.equal(48**2/12**2,16);assert.equal(rows[24].answer,'16');
 assert.equal(5**2+12**2,13**2);assert.equal(rows[48].answer,'13');
 assert.equal(2*308*7/22,14**2);assert.equal(rows[51].answer,'14');
 assert.equal(28**2+2*22*14**2/7,2016);assert.equal(rows[52].answer,'2016');
});

test('no-slip distance, time and roller width conversions independently conserve physical units',()=>{
 assert.equal(42*22/7*650/100,858);assert.equal(rows[17].answer,'858');
 assert.equal(132000/(84*22/7),500);assert.equal(rows[22].answer,'500');
 assert.equal(99*100000/60/(84*22/7),625);assert.equal(rows[33].answer,'625');
 assert.equal(2*22*10.5/7*12-2*22*7/7,748);assert.equal(rows[35].answer,'748');
 assert.equal(21*22/70*40*2.5,660);assert.equal(rows[37].answer,'660');assert.match(rows[37].statement,/бұрынғы ізін қайта баспайды/);
 assert.equal(19800/132-19800/220,60);assert.equal(rows[53].answer,'198');
});

test('rope around a square has exactly three-quarter direct region plus two extra quarter regions',()=>{
 const side=6,rope=10,extra=rope-side;
 assert.ok(side<rope&&rope<2*side);assert.ok(extra<side);
 const squareHundredths=3*rope**2*314/4+2*extra**2*314/4;
 assert.equal(squareHundredths,26062);assert.equal(rows[40].answer,'260,62');
 // Extra quarters lie in x>=side or y>=side; extra<side keeps them disjoint.
 assert.match(rows[40].solution,/екі ширек дөңгелек/);assert.match(rows[40].solution,/12 метрлік екі қабырғаны/);
});

test('all explicit pi models are stated, and closed loops and positive numeric-value equations exclude common alternative answers',()=>{
 for(const r of rows){if(r.params.pi)assert.match(r.statement,/π ≈/);}
 assert.equal(88/2.2,40);assert.equal(rows[46].answer,'40');assert.match(rows[46].statement,/бір орынға екі шам қойылмайды/);
 assert.equal(6**2,3*2*6);assert.match(rows[38].statement,/Радиусы оң/);assert.match(rows[38].statement,/САНДЫҚ мәні/);assert.equal(rows[38].answer,'6');
 assert.doesNotMatch(rows[23].solution,/Қиманың радиусы/);assert.doesNotMatch(rows[28].solution,/Қиманың радиусы/);assert.match(rows[39].solution,/Қиманың радиусы/);
});

test('changed keys/conditions/options/explanations fail frozen binding and physically invalid data are rejected',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const [i,patch] of [[18,{diameter:0}],[21,{minutes:61}],[34,{pathWidth:-1}],[37,{turns:1.5}],[40,{rope:12}],[43,{pieces:1}],[46,{gap:3}],[48,{radii:[5,11]}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...patch}}));
});

test('coverage is exactly all54 saved nonvisual topic1.9 sources; no raw TeX or nonfinite output',()=>{
 const sourceRefs=[];
 for(const level of ['1','2','3','test']){const file=`problems/sources/zerek/courses/6-math-1-9-level${level}.json`;const source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));for(const r of source.questions){assert.equal(r.checked,true);assert.ok(!r.images?.length&&!r.svg?.length);sourceRefs.push(file+'#'+r.id);}}
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),sourceRefs.sort());
 assert.match(pack.scope,/Closed author draft/);
 assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|Infinity|NaN/);
});
