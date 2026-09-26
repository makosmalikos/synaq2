import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRoute, routePath, readDuelCode } from '../frontend/src/routes.js';
import { activateFonts } from '../frontend/src/fonts.js';

const src = fileURLToPath(new URL('../frontend/src/', import.meta.url));
function staticModules(entry, seen = new Set()) {
  const full = path.resolve(src, entry);
  if (seen.has(full)) return seen;
  seen.add(full);
  const code = fs.readFileSync(full, 'utf8');
  // Static ESM imports/re-exports only; deliberately do not follow import().
  for (const match of code.matchAll(/(?:\bimport\s+(?:[^;'"()]+?\s+from\s+)?|\bexport\s+[^;'"()]+?\s+from\s+)['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) { seen.add(specifier); continue; }
    if (/\.(?:js|jsx)$/.test(specifier)) staticModules(path.relative(src, path.resolve(path.dirname(full), specifier)), seen);
  }
  return seen;
}

test('public entry and diagnostic do not statically import Firebase or the exam bank', () => {
  for (const entry of ['main.jsx', 'PublicDiagnostic.jsx']) {
    const modules = [...staticModules(entry)];
    assert.ok(!modules.some((name) => /firebase/i.test(name) || /\/(?:bank\.js|data\.js|PlatformApp\.jsx|Auth\.jsx)$/.test(name)), `${entry}: ${modules.join(', ')}`);
  }
});

test('public routing preserves direct app/diagnostic paths but rejects unrelated prefixes', () => {
  for (const pathname of ['/app', '/app/', '/app/child']) assert.equal(readRoute(pathname), 'app');
  for (const pathname of ['/diagnostic', '/diagnostic/']) assert.equal(readRoute(pathname), 'diagnostic');
  for (const pathname of ['/', '/application', '/diagnostics', '/other']) assert.equal(readRoute(pathname), 'landing');
  assert.equal(routePath('app'), '/app');
  assert.equal(routePath('diagnostic'), '/diagnostic');
  assert.equal(routePath('landing'), '/');
});

test('duel invitations survive navigation and blocked browser storage', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(readDuelCode('?duel=abc123', storage), 'ABC123');
  assert.equal(readDuelCode('', storage), 'ABC123');
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(readDuelCode('?duel=def456', blocked), 'DEF456');
  assert.equal(readDuelCode('', blocked), '');
  assert.equal(readDuelCode('?duel=abc123'), 'ABC123');
});

test('public routing keeps diagnostic payload and cabinet navigation above the lazy screen', () => {
  const app = fs.readFileSync(path.join(src, 'App.jsx'), 'utf8');
  const platform = fs.readFileSync(path.join(src, 'PlatformApp.jsx'), 'utf8');
  assert.match(app, /setDiagnosticResult\(result\)/);
  assert.match(app, /initialDiagnosticPlan=\{diagnosticResult\}/);
  assert.match(platform, /initialDiagnosticPlan \|\| readPublicDiagnosticResult\(\)/);
  for (const value of ['tab', 'trainTopic', 'tabBeforeSubscription']) {
    assert.ok(app.includes(`const [${value},`));
    assert.ok(!platform.includes(`const [${value},`));
  }
});

function fontLink(cached = false) {
  const listeners = new Map();
  return {
    media: 'print', sheet: cached ? {} : null,
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
    fireLoad() { listeners.get('load')?.(); },
    listenerCount: () => listeners.size,
  };
}

test('fonts apply after load, including the cached-before-bootstrap case', () => {
  const link = fontLink();
  activateFonts(link);
  assert.equal(link.media, 'print');
  link.fireLoad();
  assert.equal(link.media, 'all');
  assert.equal(link.listenerCount(), 0);
  const cached = fontLink(true);
  activateFonts(cached);
  assert.equal(cached.media, 'all');
  assert.equal(cached.listenerCount(), 0);
  assert.doesNotThrow(() => activateFonts(null));
});

test('font bootstrap retains all design families without a render-blocking remote stylesheet', () => {
  const html = fs.readFileSync(new URL('../frontend/index.html', import.meta.url), 'utf8');
  const font = html.match(/<link[^>]*id="synaq-fonts"[^>]*>/)?.[0];
  assert.ok(font);
  assert.match(font, /media="print"/);
  assert.match(font, /display=swap/);
  for (const name of ['Geologica', 'Golos+Text', 'IBM+Plex+Mono', 'Lora', 'Manrope']) assert.ok(font.includes(name));
  const main = fs.readFileSync(path.join(src, 'main.jsx'), 'utf8');
  assert.ok(main.indexOf('activateFonts(document.') < main.indexOf('createRoot(document.'));
});
