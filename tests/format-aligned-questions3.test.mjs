import test from 'node:test';
import assert from 'node:assert/strict';
import { POOL, BANK_QUARANTINE } from '../frontend/src/bank.js';

const batch = POOL.filter((q) => q.id.startsWith('synaq_fit3_'));
const get = (id) => {
  const item = batch.find((q) => q.id === `synaq_fit3_${id}`);
  assert.ok(item, `missing ${id}`);
  return item;
};

test('third batch is active, complete and school-aligned', () => {
  assert.equal(batch.length, 30);
  assert.equal(BANK_QUARANTINE.filter((q) => q.id.startsWith('synaq_fit3_')).length, 0);
  for (const school of ['НИШ', 'БИЛ', 'РФМШ']) {
    assert.equal(batch.filter((q) => q.school === school).length, 10);
  }
  for (const item of batch) {
    assert.ok(item.statement.trim(), item.id);
    assert.ok(item.solution.trim(), item.id);
    if (item.school === 'РФМШ') {
      assert.equal(item.options, null);
      assert.match(item.answer, /^-?\d+$/);
    } else {
      assert.ok(item.options.includes(item.answer), `${item.id}: answer is not an option`);
      assert.equal(new Set(item.options).size, item.options.length);
    }
  }
  assert.equal(batch.filter((q) => q.subject === 'reading').length, 3);
  assert.equal(batch.filter((q) => q.subject === 'science').length, 4);
  assert.equal(batch.filter((q) => q.subject === 'kolzar').length, 2);
});

test('independent arithmetic and exhaustive checks cover the new multi-step answers', () => {
  assert.equal(Number(get('nis_01').answer), 32 - (18 + 15 - 7));
  assert.equal(Number(get('nis_03').answer), 6 * 4 - (6 - 2) * (4 - 2));
  assert.equal(get('nis_06').answer, (2 / 4) * (1 / 3) === 1 / 6 ? 'Тең' : 'А');
  assert.equal(Number(get('bil_01').answer), 120 * (1 - 3 / 8 - 1 / 5));
  assert.equal(Number(get('bil_04').answer), [5, 10, 15, 20, 25].length + 1);
  assert.equal(Number(get('rf_01').answer), 5 * 18 - 4 * 15);
  assert.equal(Number(get('rf_02').answer), 400 / (5 - 3));
  const factors = Array.from({ length: 72 }, (_, i) => i + 1)
    .filter((x) => 72 % x === 0)
    .map((x) => 2 * (x + 72 / x));
  assert.equal(Number(get('rf_03').answer), Math.min(...factors));
  assert.equal(Number(get('rf_04').answer), Number(String(7n ** 2026n).at(-1)));
  assert.equal(Number(get('rf_05').answer), [1, 2, 3, 4].length);
  assert.equal(Number(get('rf_07').answer), Math.min(...Array.from({ length: 9000 }, (_, i) => i + 1000)
    .filter((n) => [...String(n)].reduce((s, digit) => s + Number(digit), 0) === 3)));
  assert.equal(Number(get('rf_10').answer), [1, 2, 3, 4].filter((n) => 24 % n === 0).length);
});
