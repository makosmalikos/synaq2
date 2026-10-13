import test from 'node:test';
import assert from 'node:assert/strict';
import { parentSummary } from '../frontend/src/parentAnalytics.js';
const now = new Date(2026, 9, 4, 12).getTime();
const attempt = (daysAgo, correct, topic='fractions') => ({at:{seconds:(now-daysAgo*86400000)/1000},correct,topic,secs:30});
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
