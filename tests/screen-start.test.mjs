import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../frontend/src/useScreenStart.js', import.meta.url), 'utf8')
  .replace(/^import[^\n]+\n/, '').replace('export default ', '');

function fixture({ mobile = false, panel = true } = {}) {
  const calls = [];
  const heading = { hasAttribute: () => false, setAttribute: (...args) => calls.push(['attribute', ...args]), focus: options => calls.push(['focus', options]) };
  const question = { querySelector: () => heading, scrollIntoView: options => calls.push(['question', options]) };
  const context = {
    useLayoutEffect: effect => effect(),
    window: { scrollTo: options => calls.push(['page', options]), matchMedia: () => ({ matches: mobile }) },
    document: { querySelector: selector => selector === '.mock-question-panel' ? (panel ? question : null) : heading },
  };
  vm.createContext(context); vm.runInContext(source, context);
  return { calls, run: (...args) => context.useScreenStart(...args) };
}

test('mobile question navigation brings the condition into view and focuses its heading', () => {
  const f = fixture({ mobile: true }); f.run('question-30', '.mock-question-panel');
  assert.deepEqual(f.calls.map(call => call[0]), ['page', 'question', 'attribute', 'focus']);
  assert.equal(f.calls[1][1].block, 'start'); assert.equal(f.calls[3][1].preventScroll, true);
});

test('desktop navigation keeps the page header visible while focusing the current task', () => {
  const f = fixture(); f.run('question-5', '.mock-question-panel');
  assert.deepEqual(f.calls.map(call => call[0]), ['page', 'attribute', 'focus']);
});

test('other screens and absent question panels retain the existing screen-start behaviour', () => {
  for (const selector of [undefined, '.mock-question-panel']) {
    const f = fixture({ mobile: true, panel: false }); f.run('summary', selector);
    assert.deepEqual(f.calls.map(call => call[0]), ['page', 'attribute', 'focus']);
  }
});
