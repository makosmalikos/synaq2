import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../frontend/src/PlatformApp.jsx', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../frontend/src/styles.css', import.meta.url), 'utf8');

test('student navigation keeps six primary choices and groups secondary screens', () => {
  const definition = app.slice(app.indexOf('const NAV = ['), app.indexOf('const NAV_ICONS'));
  assert.deepEqual([...definition.matchAll(/\{ id: '([^']+)'/g)].map((match) => match[1]),
    ['home', 'learning', 'diagnosis', 'mock', 'progress', 'more']);
  assert.match(definition, /children: \['curriculum', 'training'\]/);
  assert.match(definition, /children: \['duel', 'league', 'rewards'\]/);
});

test('tablet navigation collapses before the full header becomes crowded', () => {
  assert.match(styles, /@media \(min-width:641px\) and \(max-width:1050px\)/);
  assert.match(styles, /\.nav-v\.open\{display:flex;flex-direction:column/);
});

test('cabinet logo returns to the student home instead of leaving the cabinet', () => {
  assert.match(app, /className="logo"[^>]+onClick=\{\(\) => pick\('home'\)\}/);
  assert.doesNotMatch(app, /className="logo"[^>]+onClick=\{onHome\}/);
});
