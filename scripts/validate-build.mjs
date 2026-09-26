import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const dist = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.vite/manifest.json'), 'utf8'));

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
check('src/PublicDiagnostic.jsx', /^(?:firebase|question-bank|PlatformApp|curriculumData)$/, 130_000);
check('src/PlatformApp.jsx', /^question-bank$/);
check('src/Parent.jsx', /^question-bank$/);
check('src/Progress.jsx', /^question-bank$/);
console.log('Build loading boundaries OK');
