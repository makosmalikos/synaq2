import test from 'node:test';
import assert from 'node:assert/strict';
import { mathFragments } from '../frontend/src/mathPresentation.js';

const text = value => ({ type: 'text', value });
const fraction = (n, d) => ({ type: 'fraction', numerator: [text(n)], denominator: [text(d)] });

test('canonical bank fractions become structural fractions without consuming prose', () => {
  assert.deepEqual(mathFragments('Жолдың (3/4) бөлігі, кейін (1/2) км.'), [text('Жолдың '), fraction('3', '4'), text(' бөлігі, кейін '), fraction('1', '2'), text(' км.')]);
  assert.deepEqual(mathFragments('((2x+4)/(3))'), [fraction('2x+4', '3')]);
});

test('mixed-number display preserves negative signs and explicit subtraction semantics', () => {
  const mixed = { type: 'mixed', whole: '3', fraction: fraction('1', '4') };
  assert.deepEqual(mathFragments('-(3 + (1/4))'), [text('-'), mixed]);
  assert.deepEqual(mathFragments('(-3 + (1/4))'), [text('(-3 + '), fraction('1', '4'), text(')')]);
  assert.deepEqual(mathFragments('(111111 + (4/9))'), [{ type: 'mixed', whole: '111111', fraction: fraction('4', '9') }]);
  assert.deepEqual(mathFragments('(14 + (23/20))'), [text('(14 + '), fraction('23', '20'), text(')')]);
});

test('mixed-number grouping survives a coefficient or an exponent', () => {
  const mixed = { type: 'mixed', whole: '2', fraction: fraction('1', '4'), parenthesized: true };
  assert.deepEqual(mathFragments('(2 + (1/4))y'), [mixed, text('y')]);
  assert.deepEqual(mathFragments('2(2 + (1/4))'), [text('2'), mixed]);
  assert.deepEqual(mathFragments('√(2 + (1/4))'), [text('√'), mixed]);
  assert.deepEqual(mathFragments('-(2 + (1/4))^2'), [text('-'), mixed, text('^2')]);
  assert.deepEqual(mathFragments('(2 + (1/4))²'), [mixed, text('²')]);
  assert.deepEqual(mathFragments('(2 + (1/4)) · 2'), [{ type: 'mixed', whole: '2', fraction: fraction('1', '4') }, text(' · 2')]);
});

test('nested fraction groups retain numerator and denominator boundaries', () => {
  assert.deepEqual(mathFragments('((1/2)/(3/4))'), [{ type: 'fraction', numerator: [fraction('1', '2')], denominator: [fraction('3', '4')] }]);
});

test('ordinary prose, URLs and malformed notation remain literal text', () => {
  for (const value of ['и/или', '(и/или)', 'https://synaq.app', '(3/4', '(/4)', '(a/b/c)', '<script>bad()</script>']) {
    assert.deepEqual(mathFragments(value), [text(value)], value);
  }
});


test('digit concatenations retain the scope of their overline and surrounding arithmetic', () => {
  const overline = value => ({ type: 'overline', content: [text(value)] });
  assert.deepEqual(mathFragments('overline(ab+cd) > overline(ba)'), [overline('ab+cd'), text(' > '), overline('ba')]);
  assert.deepEqual(mathFragments('2overline(ab)'), [text('2'), overline('ab')]);
  assert.deepEqual(mathFragments('((overline(ab+cd))/(3))'), [{ type: 'fraction', numerator: [overline('ab+cd')], denominator: [text('3')] }]);
  for (const value of ['myoverline(ab)', 'overline(', 'overline()']) assert.deepEqual(mathFragments(value), [text(value)]);
});

test('canonical tables preserve row and column correspondence and unknown values', () => {
  const value = '| x | 1 | 2 | 3 | 4 | 5 |\n| --- | --- | --- | --- | --- | --- |\n| y | 7 | 11 | 15 | 19 | ? |';
  const rows = [['x', '1', '2', '3', '4', '5'], ['y', '7', '11', '15', '19', '?']];
  assert.deepEqual(mathFragments(value), [{ type: 'table', rows: rows.map(row => row.map(cell => [text(cell)])) }]);
  const nested = mathFragments('| x | (1/2) |\n| --- | --- |\n| y | overline(ab) |')[0];
  assert.deepEqual(nested.rows[0][1], [fraction('1', '2')]);
  assert.deepEqual(nested.rows[1][1], [{ type: 'overline', content: [text('ab')] }]);
  for (const malformed of ['|x|y|\n|z|w|', '|x|y|\n|---|---|\n|1|2|3|']) assert.deepEqual(mathFragments(malformed), [text(malformed)]);
});
