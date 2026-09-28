import test from 'node:test';
import assert from 'node:assert/strict';
import { formatStudyTime, weekHours } from '../frontend/src/analytics.js';

test('weekly study time retains short verified sessions without daily rounding', () => {
  const now = new Date();
  const today = Math.floor((now.getTime() - 1000) / 1000);
  const week = weekHours([
    { at: { seconds: today }, secs: 120 },
    { at: { seconds: today }, secs: 70 },
    { at: { seconds: today }, secs: -25 },
  ]);
  const day = week[(now.getDay() + 6) % 7];
  assert.equal(day.seconds, 190);
  assert.equal(day.hours, 190 / 3600);
  assert.equal(week.reduce((sum, item) => sum + item.seconds, 0), 190);
});

test('study time labels use minutes for short sessions and the selected language for hours', () => {
  assert.equal(formatStudyTime(0, 'ru'), '0 мин');
  assert.equal(formatStudyTime(35, 'ru'), '<1 мин');
  assert.equal(formatStudyTime(190, 'ru'), '3 мин');
  assert.equal(formatStudyTime(3600, 'ru'), '1 ч');
  assert.equal(formatStudyTime(3600, 'kk'), '1 сағ');
});
