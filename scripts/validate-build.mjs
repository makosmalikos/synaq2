import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const dist = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.vite/manifest.json'), 'utf8'));
for (const directory of ['zerek', 'zerek-courses', 'synaq-editions']) {
  assert.equal(fs.existsSync(path.join(dist, 'figures', directory)), false, 'Offline source diagrams must not be deployed');
}
const privateEditions = JSON.parse(fs.readFileSync(new URL('../backend/data/synaqAdaptedQuestions.json', import.meta.url)));
for (const entry of Object.values(manifest).filter(entry => entry.file.endsWith('.js'))) {
  const js = fs.readFileSync(path.join(dist, entry.file), 'utf8');
  for (const edition of privateEditions) {
    assert.equal(js.includes(edition.id), false, 'A paid edition was bundled into public JavaScript: ' + edition.id);
    assert.equal(js.includes(edition.statement), false, 'A paid condition was bundled into public JavaScript');
  }
}

function dependencies(entry, seen = new Set()) {
  assert.ok(manifest[entry], `Missing build entry: ${entry}`);
  if (seen.has(entry)) return seen;
  seen.add(entry);
  for (const key of manifest[entry].imports || []) dependencies(key, seen);
  return seen;
}

function check(entry, banned, gzipBudget) {
  const chunks = [...dependencies(entry)].map((key) => manifest[key]);
  for (const chunk of chunks) assert.ok(!banned.test(chunk.name), `${entry} eagerly loads ${chunk.name}`);
  const bytes = chunks.reduce((sum, chunk) => sum + gzipSync(fs.readFileSync(path.join(dist, chunk.file))).length, 0);
  if (gzipBudget) assert.ok(bytes <= gzipBudget, `${entry}: ${bytes} gzip bytes exceed ${gzipBudget}`);
  console.log(`${entry}: ${chunks.length} static JS chunks, ${(bytes / 1000).toFixed(1)} kB gzip`);
}

// Validate the actual production graph, not just source imports. A new shared
// chunk must not accidentally pull private SDKs/data back into public routes.
check('index.html', /^(?:firebase|question-bank|PlatformApp|curriculumData)$/, 110_000);
// Do not ship cabinet styles or remote font imports with the landing.
const landingCss = new Set([...dependencies('index.html')].flatMap(key => manifest[key].css || []));
let cssBytes = 0;
for (const file of landingCss) {
  const css = fs.readFileSync(path.join(dist, file), 'utf8');
  assert.doesNotMatch(css, /\.curriculum-reader|\.duel-arena|fonts\.googleapis\.com/);
  cssBytes += gzipSync(css).length;
}
assert.ok(cssBytes <= 28_000, `Landing CSS exceeds mobile budget: ${cssBytes}`);
console.log(`Landing CSS: ${(cssBytes / 1000).toFixed(1)} kB gzip`);
// Fonts for private routes must also work without third-party font servers.
const allCss = new Set(Object.values(manifest).flatMap(entry => entry.css || []));
for (const file of allCss) {
  assert.doesNotMatch(fs.readFileSync(path.join(dist, file), 'utf8'), /fonts\.(?:googleapis|gstatic)\.com/);
}
check('src/PublicDiagnostic.jsx', /^(?:firebase|question-bank|PlatformApp|curriculumData)$/, 135_000);
check('src/PlatformApp.jsx', /^(?:question-bank|Home|curriculumData|useCurriculumProgress|diagnosticData)$/, 310_000);
check('src/Home.jsx', /^(?:question-bank|curriculumData|Curriculum|diagnosticData)$/, 340_000);
check('src/HomeCourseProgress.jsx', /^(?:question-bank|curriculumData|Curriculum|diagnosticData)$/, 320_000);
check('src/components/Mentor.jsx', /^(?:question-bank|bank|Admin|curriculumData|Curriculum|topicCatalog\.generated)$/, 315_000);
check('src/Parent.jsx', /^question-bank$/);
check('src/Progress.jsx', /^question-bank$/);
console.log('Build loading boundaries OK');
