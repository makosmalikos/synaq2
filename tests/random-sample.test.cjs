const test = require('node:test');
const assert = require('node:assert/strict');
const { randomSample } = require('../backend/lib/random-sample');

test('sample does not mutate the shared bank, repeat positions or lose object identity', () => {
  const pool = Object.freeze(Array.from({ length: 100 }, (_, id) => Object.freeze({ id })));
  let calls = 0;
  const sample = randomSample(pool, 20, () => { calls++; return .9; });
  assert.equal(sample.length, 20); assert.equal(new Set(sample).size, 20);
  assert.ok(sample.every(item => pool[item.id] === item));
  assert.deepEqual(pool.map(item => item.id), Array.from({ length: 100 }, (_, i) => i));
  assert.equal(calls, 20, 'Only selected positions need random draws');
});

test('every ordered pair has equal probability in a three-item bank', () => {
  const combinations = [];
  for (let first = 0; first < 3; first++) for (let second = 0; second < 2; second++) {
    const draws = [(first + .5) / 3, (second + .5) / 2];
    combinations.push(randomSample(['a', 'b', 'c'], 2, () => draws.shift()).join(''));
  }
  assert.deepEqual(combinations.sort(), ['ab', 'ac', 'ba', 'bc', 'ca', 'cb']);
});

test('empty, small and oversized selections are bounded and retain all available questions', () => {
  assert.deepEqual(randomSample([], 60), []);
  assert.deepEqual(randomSample([1, 2], 0), []);
  assert.deepEqual(randomSample([1, 2], -5), []);
  assert.deepEqual(randomSample([1, 2, 3], 60).sort(), [1, 2, 3]);
  assert.deepEqual(randomSample([1, 2, 3], 2, () => 0), [1, 2]);
});
