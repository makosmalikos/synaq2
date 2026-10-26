import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { transformWithOxc } from '../frontend/node_modules/vite/dist/node/index.js';

const source = fs.readFileSync(new URL('../frontend/src/components/Mock.jsx', import.meta.url), 'utf8');
function fixture(extra = {}) {
  const state = { confirms: 0, submissions: 0 };
  const context = { isCurrent: () => true, runRef: { current: { answers: { 2: '8' } } }, submittingRef: { current: false },
    mockRemaining: () => 50, setConfirmFinish: value => { state.confirms += value ? 1 : 0; },
    submit: () => { state.submissions++; }, ...extra };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  function requestFinish()'), source.indexOf('  async function submit()')), context);
  return { context, state };
}

test('manual finish asks first without freezing answers or sending the attempt', () => {
  const { context, state } = fixture();
  context.requestFinish();
  assert.equal(state.confirms, 1);
  assert.equal(state.submissions, 0);
  assert.equal(context.runRef.current.submission, undefined);
  assert.deepEqual(context.runRef.current.answers, { 2: '8' });
});

test('expired and already frozen attempts can finish without a second confirmation', () => {
  for (const extra of [{ mockRemaining: () => 0 }, { runRef: { current: { submission: { answers: { 2: '8' } } } } }]) {
    const { context, state } = fixture(extra);
    context.requestFinish();
    assert.equal(state.confirms, 0);
    assert.equal(state.submissions, 1);
  }
});

test('late finish clicks cannot reopen confirmation after completion or while saving', () => {
  for (const extra of [{ isCurrent: () => false }, { runRef: { current: null } }, { runRef: { current: { result: {} } } }, { submittingRef: { current: true } }]) {
    const { context, state } = fixture(extra);
    context.requestFinish();
    assert.equal(state.confirms + state.submissions, 0);
  }
});

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const dialogSource = fs.readFileSync(new URL('../frontend/src/components/MockFinishDialog.jsx', import.meta.url), 'utf8');
const transformed = await transformWithOxc(dialogSource, 'MockFinishDialog.jsx');
const code = transformed.code.replace(/from ["']([^"']+)["']/g, (_, name) => `from ${JSON.stringify(pathToFileURL(require.resolve(name)).href)}`);
const { default: MockFinishDialog } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
test('confirmation clearly shows unanswered count in both languages and defaults to continuing', () => {
  for (const lang of ['ru', 'kz']) {
    const html = renderToStaticMarkup(React.createElement(MockFinishDialog, { lang, answered: 3, total: 60, onCancel() {}, onConfirm() {} }));
    assert.match(html, /<dialog[^>]+aria-labelledby=[^>]+aria-describedby=/);
    assert.match(html, /3 \/ 60/);
    assert.match(html, /<strong>57<\/strong>/);
    assert.match(html, lang === 'ru' ? /autofocus="">Продолжить тест/ : /autofocus="">Сынақты жалғастыру/);
    assert.match(html, lang === 'ru' ? /изменить ответы нельзя/ : /жауаптарды өзгерте алмайсың/);
  }
});
