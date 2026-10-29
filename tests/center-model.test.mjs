import test from 'node:test';
import assert from 'node:assert/strict';
import { almatyInput, almatyTime, centerDate, journalCsv } from '../frontend/src/centerModel.js';
import { readRoute, routePath } from '../frontend/src/routes.js';

test('center deadline is Almaty time regardless of host timezone', () => {
  assert.equal(almatyTime('2026-10-26T18:00'), Date.parse('2026-10-26T13:00:00Z'));
  assert.equal(almatyInput(Date.parse('2026-10-26T13:00:00Z')), '2026-10-26T18:00');
});
test('Kazakh dates have readable month names and handle midnight in Almaty', () => {
  assert.equal(centerDate(Date.parse('2026-10-26T19:05:00Z'), 'kk'), '27 қазан, 00:05');
  assert.equal(centerDate(Date.parse('2026-12-31T20:30:00Z'), 'kk'), '1 қаңтар, 01:30');
});
test('CSV quotes delimiters, escapes quotes and neutralizes spreadsheet formulas', () => {
  const csv = journalCsv([{ name: '=HYPERLINK("bad")', progress: { a: { answered: 1, target: 3, accuracy: 100, status: 'in_progress' } } }], [{ id: 'a', title: '+SUM(1;2)' }]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"\'+SUM(1;2)"'));
  assert.ok(csv.includes('1/3; 100%; in_progress'));
});
test('center route matches segments and round-trips', () => {
  assert.equal(readRoute('/centers'), 'centers');
  assert.equal(readRoute('/centers/'), 'centers');
  assert.equal(readRoute('/centers-other'), 'landing');
  assert.equal(routePath('centers'), '/centers');
});
