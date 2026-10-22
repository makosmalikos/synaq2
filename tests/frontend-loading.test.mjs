import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRoute, routePath, readDuelCode } from '../frontend/src/routes.js';

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
  for (const entry of ['main.jsx', 'PublicDiagnostic.jsx', 'FreeDiagnostic.jsx']) {
    const modules = [...staticModules(entry)];
    assert.ok(!modules.some((name) => /firebase/i.test(name) || /\/(?:bank\.js|data\.js|PlatformApp\.jsx|Auth\.jsx)$/.test(name)), `${entry}: ${modules.join(', ')}`);
  }
});

test('public routing preserves direct app/diagnostic paths but rejects unrelated prefixes', () => {
  for (const pathname of ['/app', '/app/', '/app/child']) assert.equal(readRoute(pathname), 'app');
  for (const pathname of ['/diagnostic', '/diagnostic/']) assert.equal(readRoute(pathname), 'diagnostic');
  for (const pathname of ['/', '/application', '/diagnostics', '/other']) assert.equal(readRoute(pathname), 'landing');
  for (const pathname of ['/free-diagnostic', '/free-diagnostic/', '/free-diagnostic/start']) assert.equal(readRoute(pathname), 'free-diagnostic');
  assert.equal(readRoute('/free-diagnostics'), 'landing');
  assert.equal(routePath('free-diagnostic'), '/free-diagnostic');
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
  assert.match(platform, /bindInitialDiagnostic\(current, initialDiagnosticPlan, nextUid\)/);
  assert.match(platform, /diagnosticSeed\?\.uid === user\.uid \? diagnosticSeed\.result : null/);
  for (const value of ['tab', 'trainTopic', 'tabBeforeSubscription']) {
    assert.ok(app.includes(`const [${value},`));
    assert.ok(!platform.includes(`const [${value},`));
  }
});

test('landing fonts load locally, cover Kazakh, and avoid a late layout-shifting swap', () => {
  const html = fs.readFileSync(new URL('../frontend/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html, /rel="stylesheet" href="\/fonts\/manrope\/font.css"/);
  const font = fs.readFileSync(new URL('../frontend/public/fonts/manrope/font.css', import.meta.url), 'utf8');
  assert.match(font, /font-display: optional/);
  assert.match(font, /U\+0460-052F/); // Kazakh Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ, І.
  let bytes = 0;
  for (const [, url] of font.matchAll(/url\(([^)]+)\)/g)) {
    assert.ok(url.startsWith('/fonts/manrope/'));
    const buffer = fs.readFileSync(new URL(`../frontend/public${url}`, import.meta.url));
    assert.equal(buffer.subarray(0, 4).toString(), 'wOF2');
    bytes += buffer.length;
  }
  assert.ok(bytes < 50_000, `Local font budget: ${bytes}`);
  const platformFont = fs.readFileSync(path.join(src, 'platform-fonts.css'), 'utf8');
  for (const name of ['Geologica', 'Golos+Text', 'IBM+Plex+Mono', 'Lora']) assert.ok(platformFont.includes(name));
  assert.match(platformFont, /display=optional/);
  const main = fs.readFileSync(path.join(src, 'main.jsx'), 'utf8');
  assert.doesNotMatch(main, /platform-fonts|styles\.css/);
});

test('above-the-fold school logos stay within a small image budget', () => {
  const bytes = ['bil', 'nis', 'rfmsh'].reduce((total, school) => total + fs.statSync(new URL(`../frontend/public/landing/mobile/school-${school}.webp`, import.meta.url)).size, 0);
  assert.ok(bytes < 20_000, `Three tiny school logos: ${bytes} bytes`);
  for (const file of ['LandingRefresh.jsx', 'LandingFounders.jsx']) {
    assert.doesNotMatch(fs.readFileSync(path.join(src, file), 'utf8'), /src=\{`\/schools\//);
  }
  assert.ok(fs.statSync(new URL('../frontend/public/brands/synaq-mark-320.webp', import.meta.url)).size < 30_000);
  for (const file of ['Brand.jsx', 'public.css', 'LandingRefresh.css']) {
    assert.doesNotMatch(fs.readFileSync(path.join(src, file), 'utf8'), /\/brands\/synaq-mark\.png/);
  }
});
