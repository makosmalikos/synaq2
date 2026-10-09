import test from 'node:test';
import assert from 'node:assert/strict';
import { POOL } from '../frontend/src/bank.js';

const batch = POOL.filter((q) => q.id.startsWith('synaq_fit_'));
const byId = (suffix) => {
  const q = batch.find((item) => item.id === `synaq_fit_${suffix}`);
  assert.ok(q, `missing ${suffix}`);
  return q;
};

test('all 24 format-aligned questions are active in their intended exam sections', () => {
  assert.equal(batch.length, 24);
  for (const school of ['НИШ', 'БИЛ', 'РФМШ']) {
    assert.equal(batch.filter((q) => q.school === school).length, 8);
  }
  for (const q of batch) {
    assert.ok(q.solution?.trim(), `${q.id}: no worked solution`);
    if (q.school === 'РФМШ') {
      assert.equal(q.options, null, `${q.id}: RFMSH answers must be open`);
      assert.match(q.answer, /^-?\d+$/, `${q.id}: RFMSH answers must be integers`);
    } else {
      assert.ok(q.options?.includes(q.answer), `${q.id}: missing correct option`);
      assert.equal(new Set(q.options).size, q.options.length, `${q.id}: repeated option`);
    }
  }
});

test('independent enumeration confirms the less obvious answers', () => {
  const digitCount = Array.from({ length: 200 }, (_, i) => String(i + 1).length).reduce((a, b) => a + b, 0);
  assert.equal(Number(byId('nis_01').answer), digitCount);

  const twoDigit = Array.from({ length: 90 }, (_, i) => i + 10);
  assert.equal(Number(byId('bil_02').answer), twoDigit.filter((n) => n % 6 === 0 && n % 9 === 0).length);
  const evenCodes = [];
  for (const tens of [2, 5, 7]) for (const ones of [0, 2, 5, 7]) {
    if (tens !== ones && ones % 2 === 0) evenCodes.push(10 * tens + ones);
  }
  assert.equal(Number(byId('bil_06').answer), evenCodes.length);

  const oddMultiples = Array.from({ length: 900 }, (_, i) => i + 100).filter((n) => n % 2 && n % 5 === 0 && n % 7 === 0);
  assert.equal(Number(byId('rf_01').answer), Math.max(...oddMultiples));
  const reversed = twoDigit.filter((n) => {
    const tens = Math.floor(n / 10), ones = n % 10;
    return tens + ones === 11 && 10 * ones + tens - n === 27;
  });
  assert.deepEqual(reversed, [Number(byId('rf_02').answer)]);
  const routes = (x, y, touchedForbidden = false) => {
    if (x === 4 && y === 3) return Number(!touchedForbidden);
    const forbidden = touchedForbidden || (x === 2 && y === 1);
    return (x < 4 ? routes(x + 1, y, forbidden) : 0) + (y < 3 ? routes(x, y + 1, forbidden) : 0);
  };
  assert.equal(Number(byId('rf_03').answer), routes(0, 0));
  assert.equal(Number(byId('rf_06').answer), Array.from({ length: 300 }, (_, i) => i + 1).filter((n) => n % 4 === 0 && n % 6 !== 0).length);
});
