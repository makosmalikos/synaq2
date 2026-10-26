import test from 'node:test';
import assert from 'node:assert/strict';
import { parentSummary } from '../frontend/src/parentAnalytics.js';
const now = new Date(2026, 9, 4, 12).getTime();
const attempt = (daysAgo, correct, topic='fractions') => ({at:{seconds:(now-daysAgo*86400000)/1000},correct,verified:true,topic,secs:30});
const topics = [{id:'fractions',name:'Fractions'}];
test('compares seven calendar days with the preceding week and rejects future activity', () => {
  const items = [...Array.from({length:5},()=>attempt(1,true)),...Array.from({length:5},()=>attempt(8,false)),attempt(-1,false)];
  const s = parentSummary(items,[],topics,now);
  assert.equal(s.currentCount,5); assert.equal(s.accuracy,100); assert.equal(s.delta,100);
  assert.equal(s.seconds,150); assert.equal(s.improved[0].delta,100);
  assert.equal(s.days.filter(d=>d.active).length,1);
});
test('empty or sparse history produces no invented trend or mastery', () => {
  const empty = parentSummary([],[],topics,now);
  assert.equal(empty.accuracy,null); assert.equal(empty.delta,null); assert.equal(empty.lastAt,0);
  const sparse = parentSummary([attempt(1,true)],[],topics,now);
  assert.equal(sparse.delta,null); assert.equal(sparse.mastered,0); assert.equal(sparse.weak.length,0);
});
test('counts test-only days and normalizes results by the gradable denominator', () => {
  const s = parentSummary([], [{at:{seconds:now/1000},score:15,gradable:20},{at:{seconds:now/1000},score:10,gradable:0}],topics,now);
  assert.equal(s.tests.length,1); assert.equal(s.tests[0].pct,75);
  assert.equal(s.days.at(-1).active,true); assert.equal(s.seconds,0);
});

test('truncated history cannot claim weekly growth', () => {
  const items=Array.from({length:500},(_,i)=>attempt(i<490?1:8,i<490));
  const s=parentSummary(items,[],topics,now);
  assert.equal(s.delta,null); assert.equal(s.topics[0].delta,null);
});
test('school readiness uses the latest and best mock per school and ignores future or ungraded tests', () => {
  const mock = (school, daysAgo, score, gradable = 30) => ({ school, score, gradable, at: { seconds: (now - daysAgo * 86400000) / 1000 } });
  const s = parentSummary([], [mock('РФМШ', 5, 12), mock('РФМШ', 1, 24), mock('РФМШ', -2, 30), mock('БИЛ', 1, 0, 0)], topics, now);
  const rfmsh = s.schools.find(r => r.code === 'РФМШ');
  assert.equal(rfmsh.count, 2); assert.equal(rfmsh.last, 80); assert.equal(rfmsh.best, 80);
  assert.equal(s.schools.find(r => r.code === 'БИЛ').last, null);
  assert.equal(s.schools.find(r => r.code === 'НИШ').count, 0);
});

test('parent and child count only server-verified boolean answers', () => {
  const good = attempt(0, true);
  const s = parentSummary([good, { ...good, verified: false, correct: false }, { ...good, verified: undefined }, { ...good, correct: 'true' }], [], topics, now);
  assert.equal(s.currentCount, 1); assert.equal(s.accuracy, 100);
  assert.equal(s.topics[0].count, 1); assert.equal(s.seconds, 30);
});

test('seven-day activity follows Almaty midnight regardless of device timezone', () => {
  const time = Date.parse('2026-10-26T00:05:00+05:00');
  const row = at => ({ ...attempt(0, true), at: new Date(at) });
  const s = parentSummary([row('2026-10-25T23:59:00+05:00'), row('2026-10-26T00:01:00+05:00'), row('2026-10-19T23:59:00+05:00')], [], topics, time);
  assert.deepEqual(s.days.map(d => d.count), [0,0,0,0,0,1,1]);
  assert.equal(s.days.at(-1).date.toISOString(), '2026-10-25T19:00:00.000Z');
});

test('corrupt dates, nonfinite durations and invalid mock scores never poison reports', () => {
  const good = attempt(0, false);
  const s = parentSummary([{ ...good, secs: Infinity }, { ...good, at: {toMillis(){throw Error('bad')}} }], [
    { at: good.at, school: 'БИЛ', score: NaN, gradable: 60 }, { at: good.at, score: 3, gradable: Infinity },
  ], topics, now);
  assert.equal(s.currentCount, 1); assert.equal(s.seconds, 0);
  assert.equal(s.tests.length, 0); assert.equal(s.schools.find(s => s.code === 'БИЛ').last, null);
});

test('a corrupt row in a capped history cannot prove a complete previous week', () => {
  const items = [...Array.from({length:499}, (_,i) => attempt(i < 490 ? 1 : 8, i < 490)), { ...attempt(20, false), at: null }];
  const s = parentSummary(items, [], topics, now);
  assert.equal(s.delta, null); assert.equal(s.topics[0].delta, null);
});
