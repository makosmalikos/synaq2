import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { transformWithOxc } from '../frontend/node_modules/vite/dist/node/index.js';

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = fs.readFileSync(new URL('../frontend/src/components/MathText.jsx', import.meta.url), 'utf8');
const transformed = await transformWithOxc(source, 'MathText.jsx');
const code = transformed.code.replace(/^import "\.\/MathText\.css";\s*/m, '').replace(/from "([^"]+)"/g, (all, specifier) => {
  const target = specifier === '../mathPresentation.js'
    ? new URL('../frontend/src/mathPresentation.js', import.meta.url).href
    : pathToFileURL(require.resolve(specifier)).href;
  return `from ${JSON.stringify(target)}`;
});
const { default: MathText } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const render = text => renderToStaticMarkup(React.createElement(MathText, { text }));

test('native overlines span the complete grouped digit expression and expose its meaning', () => {
  const html = render('((overline(ab+cd))/(3))');
  assert.match(html, /<mfrac><mrow><mover accent="true"><mrow><mtext>ab\+cd<\/mtext>/);
  assert.match(html, /<mo stretchy="true">¯<\/mo><\/mover>/);
  assert.match(html, /aria-label="[^\"]*overline\(ab\+cd\)[^\"]*"/);
  assert.match(html, /<mtext>3<\/mtext>/);
});

test('native MathML tables keep cells aligned and all source values accessible', () => {
  const html = render('| x | 1 | 2 | 3 | 4 | 5 |\n| --- | --- | --- | --- | --- | --- |\n| y | 7 | 11 | 15 | 19 | ? |');
  assert.match(html, /<math[^>]*display="block"/);
  assert.match(html, /<mtable /);
  assert.equal((html.match(/<mtr>/g) || []).length, 2);
  assert.equal((html.match(/<mtd>/g) || []).length, 12);
  assert.deepEqual([...html.matchAll(/<mtext>(.*?)<\/mtext>/g)].map(match => match[1]), ['x', '1', '2', '3', '4', '5', 'y', '7', '11', '15', '19', '?']);
  assert.match(html, /aria-label="x, 1, 2, 3, 4, 5; y, 7, 11, 15, 19, \?"/);
  assert.doesNotMatch(html, /\| ---/);
});

test('table and overline contents remain text and cannot inject HTML', () => {
  const html = render('| x | <img src=x onerror=alert(1)> |\n| --- | --- |\n| y | overline(ab) |');
  assert.doesNotMatch(html, /<img|<script/);
  assert.match(html, /&lt;img/);
  assert.match(html, /<mover /);
});
