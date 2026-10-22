import test from 'node:test';
import assert from 'node:assert/strict';
import { POOL, BANK_QUARANTINE } from '../frontend/src/bank.js';
import { formatAlignedQuestions4 } from '../frontend/src/formatAlignedQuestions4.js';
const byId = id => POOL.find(q => q.id === `synaq_fit4_${id}`);
const shape = s => s.toLowerCase().replace(/\d+(?:[.,]\d+)?/g, '#').replace(/\s+/g, ' ').trim();

test('fourth batch: 24 active authored tasks, correct school format and no numerical reskins', () => {
  const oldShapes = new Set(POOL.filter(q => !q.id.startsWith('synaq_fit4_')).map(q => shape(q.statement)));
  assert.equal(formatAlignedQuestions4.length, 24);
  for (const school of ['НИШ', 'БИЛ', 'РФМШ']) assert.equal(formatAlignedQuestions4.filter(q => q.school === school).length, 8);
  for (const q of formatAlignedQuestions4) {
    assert.ok(POOL.some(active => active.id === q.id), q.id);
    assert.ok(!BANK_QUARANTINE.some(rejected => rejected.id === q.id), q.id);
    assert.equal(oldShapes.has(shape(q.statement)), false, q.id);
    assert.match(q.source, /SYNAQ original/);
    assert.ok(q.solution.length > 35, q.id);
    if (q.school === 'БИЛ') assert.equal(q.options.length, 5, q.id);
    if (q.school === 'РФМШ') { assert.equal(q.options, null); assert.match(q.answer, /^\d+$/); }
    else { assert.ok(q.options.includes(q.answer)); assert.equal(new Set(q.options).size, q.options.length); }
  }
  assert.equal(new Set(formatAlignedQuestions4.map(q => shape(q.statement))).size, 24);
});

test('independent arithmetic and exhaustive models check every quantitative answer', () => {
  const numeric = (id, answer) => assert.equal(Number(byId(id).answer), answer, id);
  numeric('nis_01', Array.from({length:22},(_,i)=>i).filter(n=>410+28*n<=600).at(-1));
  numeric('nis_02', 10*350-8*50);
  numeric('nis_03', Array.from({length:96},(_,i)=>[i%12,Math.floor(i/12)]).filter(([x,y])=>x===0||x===11||y===0||y===7).length);
  numeric('nis_04', 150/(1.5+1+30/60));
  const signs=new Set([1,4,5].map(x=>Math.sign(3*x+7-(x+15))));
  assert.equal(signs.size,3);assert.equal(byId('nis_05').answer,'Недостаточно данных');
  assert.equal(125*80/100,80*125/100);assert.equal(byId('nis_06').answer,'Равны');
  numeric('bil_01', [0,1,2,3].find(k=>3**k>=9));
  numeric('bil_03', Array.from({length:20},(_,i)=>i+1).filter(n=>n%2&&n%3).length);
  numeric('bil_05', 100-100*1.2*.8);
  const tileSize=Array.from({length:12},(_,i)=>i+1).filter(d=>18%d===0&&12%d===0).at(-1);
  numeric('bil_06', 18*12/(tileSize**2));
  let rectangles=0;
  for(let x1=0;x1<3;x1++)for(let x2=x1+1;x2<=3;x2++)for(let y1=0;y1<2;y1++)for(let y2=y1+1;y2<=2;y2++)rectangles++;
  numeric('rf_01',rectangles);
  const reversed=Array.from({length:90},(_,i)=>i+10).filter(n=>Math.floor(n/10)+n%10===9&&n-((n%10)*10+Math.floor(n/10))===27);
  assert.deepEqual(reversed,[Number(byId('rf_02').answer)]);
  let max=0;for(const a of [-1,0,1])for(const b of [-1,0,1])for(const c of [-1,0,1])for(const d of [-1,0,1])max=Math.max(max,a+3*b+9*c+27*d);
  numeric('rf_03',max);
  numeric('rf_04',Array.from({length:31},(_,i)=>i+1).find(day=>(day-1+3)%7===4&&day%5===0));
  let unplayed=0;for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)if(!(a<3&&b<3))unplayed++;
  numeric('rf_05',unplayed);
  const shelves=Array.from({length:100},(_,i)=>i+8).filter(x=>x+8===3*(x-8));assert.deepEqual(shelves.map(x=>2*x),[Number(byId('rf_06').answer)]);
  numeric('rf_07',Array.from({length:100},(_,i)=>i+1).find(x=>x*2/3/2+12===x));
  let codes=0;for(let a=0;a<=9;a++)for(let b=0;b<=9;b++)if(new Set([2,a,b,7]).size===4&&2+a+b+7===15)codes++;
  numeric('rf_08',codes);
});

const permutations = items => items.length ? items.flatMap((x,i)=>permutations(items.filter((_,j)=>i!==j)).map(rest=>[x,...rest])) : [[]];
test('logic and reading keys follow only the stated conditions', () => {
  const fillings=permutations(['apple','pear','mixed']).filter(([a,p,m])=>a!=='apple'&&p!=='pear'&&m!=='mixed'&&m==='apple');
  assert.deepEqual(fillings,[['pear','mixed','apple']]);assert.equal(byId('bil_02').answer,'Тек алмұрт');
  const heights=permutations(['A','D','S','M']).filter(order=>order.indexOf('A')<order.indexOf('D')&&order.indexOf('D')<order.indexOf('S')&&order.indexOf('A')<order.indexOf('M')&&order.indexOf('M')<order.indexOf('D'));
  assert.deepEqual(heights,[['A','M','D','S']]);assert.equal(byId('bil_04').answer,'Меруерт');
  assert.match(byId('bil_07').statement,/кітап алуға және қайтаруға болады/);assert.equal(byId('bil_07').answer,'Кітабын қайтара алады');
  assert.match(byId('bil_08').statement,/күн де қатты суытты/);assert.equal(byId('bil_08').answer,'Ауа райының өзгеру ықпалы ескерілмеген');
  assert.match(byId('nis_07').statement,/ничего из него не вытекало/);assert.equal(byId('nis_07').answer,'Не изменится');
  assert.equal(byId('nis_08').answer,'Различать освещение, сохраняя одинаковые полив и температуру');
});
