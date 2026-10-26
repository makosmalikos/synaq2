const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../api/mock-session'), 'utf8');
const context = vm.createContext({ sanitizeMockResult: require('../backend/lib/question-access').sanitizeMockResult });
vm.runInContext(source.slice(source.indexOf('function serializeMockResult('), source.indexOf('const publicSession =')), context);
test('fresh, restored and already serialized mock result dates share one HTTP representation', () => {
  const iso = '2026-10-26T07:14:56.264Z';
  for (const at of [new Date(iso), { toDate: () => new Date(iso) }, iso]) {
    const original = { at, score: 1, review: [] };
    const result = context.serializeMockResult(original);
    assert.equal(result.at, iso); assert.equal(result.score, 1);
    assert.equal(original.at, at, 'Serialization must not change the stored result');
  }
});
test('missing or invalid mock dates remain absent instead of inventing an epoch result date', () => {
  for (const at of [null, undefined, 'invalid-date']) assert.equal(context.serializeMockResult({ at }).at, null);
});
