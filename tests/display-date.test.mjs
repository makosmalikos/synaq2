import test from 'node:test';
import assert from 'node:assert/strict';
import { displayDate } from '../frontend/src/displayDate.js';

test('Kazakh dates use real month and weekday names at the Almaty midnight boundary', () => {
  const value = '2026-10-25T20:05:00Z';
  assert.equal(displayDate(value, 'kk', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), 'дс, 26 қазан 2026, 01:05');
  assert.equal(displayDate(value, 'kk', { weekday: 'long' }), 'дүйсенбі');
  assert.equal(displayDate(value, 'kk'), '26 қаз.');
  assert.equal(displayDate(value, 'kk', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }), '25.10.2026');
});

test('Russian dates and invalid timestamps remain readable', () => {
  assert.match(displayDate('2026-10-25T20:05:00Z', 'ru'), /26 окт/);
  assert.equal(displayDate('invalid', 'kk'), '—');
  assert.equal(displayDate(new Date(NaN), 'ru'), '—');
});
