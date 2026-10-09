import test from 'node:test';
import assert from 'node:assert/strict';
import { POOL } from '../frontend/src/bank.js';

const batch = POOL.filter((q) => q.id.startsWith('synaq_fit2_'));
const get = (id) => {
  const item = batch.find((q) => q.id === `synaq_fit2_${id}`);
  assert.ok(item, `missing ${id}`);
  return item;
};
const value = (id) => Number(get(id).answer);

test('the second batch is active and follows school-specific answer formats', () => {
  assert.equal(batch.length, 36);
  for (const school of ['НИШ', 'БИЛ', 'РФМШ']) {
    assert.equal(batch.filter((q) => q.school === school).length, 12);
  }
  for (const item of batch) {
    assert.ok(item.solution?.trim(), `${item.id}: missing explanation`);
    if (item.school === 'РФМШ') {
      assert.equal(item.options, null);
      assert.match(item.answer, /^-?\d+$/);
    } else {
      assert.ok(item.options?.includes(item.answer), `${item.id}: invalid answer option`);
      assert.equal(new Set(item.options).size, item.options.length);
    }
  }
  assert.equal(batch.filter((q) => q.subject === 'reading').length, 4);
  assert.equal(batch.filter((q) => q.subject === 'science').length, 4);
  assert.equal(batch.filter((q) => q.subject === 'kolzar').length, 4);
});

test('enumeration independently verifies counting and logic answers', () => {
  const ints = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
  assert.equal(value('nis_01'), ints(1, 120).filter((n) => n % 4 === 0 || n % 6 === 0).length);
  const divisors = (n) => ints(1, n).filter((d) => n % d === 0).length;
  assert.equal(get('nis_06').answer, divisors(48) > divisors(36) ? 'В' : 'А');

  const lamps = Array(20).fill(false);
  for (let step = 1; step <= 20; step++) for (let pos = step; pos <= 20; pos += step) lamps[pos - 1] = !lamps[pos - 1];
  assert.equal(value('bil_05'), lamps.filter(Boolean).length);
  const prizes = ['А', 'Б', 'В'];
  const exactlyOne = prizes.filter((prize) => [prize === 'Б', prize !== 'Б', prize !== 'А'].filter(Boolean).length === 1);
  assert.deepEqual(exactlyOne, [get('bil_06').answer.slice(-1)]);

  const countRects = () => {
    let count = 0;
    for (let x1 = 0; x1 < 3; x1++) for (let x2 = x1 + 1; x2 <= 3; x2++) {
      for (let y1 = 0; y1 < 2; y1++) for (let y2 = y1 + 1; y2 <= 2; y2++) count++;
    }
    return count;
  };
  assert.equal(value('rf_02'), countRects());
  assert.equal(value('rf_03'), ints(100, 999).filter((n) => String(n).split('').reduce((sum, digit) => sum + Number(digit), 0) === 5).length);
  const arrange = (remaining, order = []) => {
    if (!remaining.length) return Number(order.every((child, i) => child < 4 || i === 0 || order[i - 1] < 4));
    return remaining.reduce((sum, child, i) => sum + arrange(remaining.filter((_, j) => j !== i), [...order, child]), 0);
  };
  assert.equal(value('rf_04'), arrange([0, 1, 2, 3, 4, 5, 6]));
  assert.equal(value('rf_06'), ints(1, 6).flatMap((a) => ints(1, 6).map((b) => a + b)).filter((sum) => sum === 9).length);
  assert.equal(value('rf_07'), ints(101, 300).find((n) => [6, 8, 10].every((d) => n % d === 1)));
  assert.equal(value('rf_09'), Math.max(...ints(1, 14).map((width) => width * (15 - width))));
  assert.equal(value('rf_10'), ints(10, 99).filter((n) => Math.floor(n / 10) + n % 10 === 10).length);
});
