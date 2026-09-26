import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BANK_QUARANTINE, POOL } from '../frontend/src/bank.js';
import { MOCK_SPECS, mockAvailability } from '../frontend/src/api.js';
import { checkTopicCatalog } from './generate-topic-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'frontend', 'public');
const errors = [];
if (!checkTopicCatalog()) errors.push('topic catalog is stale; run node scripts/generate-topic-catalog.mjs --write');

function fail(message) {
  errors.push(message);
}

const seen = new Set();
for (const q of POOL) {
  if (!q.id || !String(q.id).trim()) fail('active question without id');
  if (seen.has(q.id)) fail(`duplicate active id: ${q.id}`);
  seen.add(q.id);

  if (!q.statement || !String(q.statement).trim()) fail(`${q.id}: empty statement`);
  if (q.answer == null || !String(q.answer).trim()) fail(`${q.id}: empty answer`);

  if (q.options != null) {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      fail(`${q.id}: options must contain at least two values`);
    } else if (!q.options.map(String).includes(String(q.answer))) {
      fail(`${q.id}: answer is absent from options`);
    }
  }

  if (q.image) {
    if (!String(q.image).startsWith('/figures/')) {
      fail(`${q.id}: image must be inside /figures`);
    } else if (!fs.existsSync(path.join(publicDir, q.image))) {
      fail(`${q.id}: missing image ${q.image}`);
    }
  }
}

// Если изображение восстановили, вопрос должен автоматически вернуться в банк:
// удаляем его путь из MISSING_FIGURES в questionMetadata.js.
for (const q of BANK_QUARANTINE.filter((item) => item.quarantineReason === 'missing_image')) {
  if (fs.existsSync(path.join(publicDir, q.image))) {
    fail(`${q.id}: ${q.image} exists but is still quarantined`);
  }
}

// Validate the declared full format and the honest, available shortened mode.
for (const [school, spec] of Object.entries(MOCK_SPECS)) {
  if (spec.subjects.reduce((sum, [, count]) => sum + count, 0) !== spec.count) fail(`${school}: invalid declared total`);
  const available = mockAvailability(school);
  if (!available.ready) fail(`${school}: no gradable questions`);
  if (available.count !== available.subjects.reduce((sum, item) => sum + item.count, 0)) fail(`${school}: inconsistent available total`);
  if (available.shortened !== (available.count < spec.count)) fail(`${school}: incomplete format must be labelled shortened`);
  if (available.shortened) console.log(`  ${school}: shortened ${available.count}/${spec.count}; missing ${available.missingSubjects.map((item) => `${item.subject}: ${item.target - item.count}`).join(', ')}`);
}

const byReason = BANK_QUARANTINE.reduce((out, q) => {
  out[q.quarantineReason] = (out[q.quarantineReason] || 0) + 1;
  return out;
}, {});
const bySchool = POOL.reduce((out, q) => {
  out[q.school] = (out[q.school] || 0) + 1;
  return out;
}, {});
const normalizedIds = POOL.filter((q) => q.originalId).length;

console.log('Synaq question bank');
console.log(`  active:      ${POOL.length}`);
console.log(`  quarantined: ${BANK_QUARANTINE.length}`, byReason);
console.log(`  normalized:  ${normalizedIds} duplicate IDs`);
console.log('  schools:    ', bySchool);

if (errors.length) {
  console.error(`\nValidation failed (${errors.length}):`);
  for (const message of errors.slice(0, 50)) console.error(`  - ${message}`);
  if (errors.length > 50) console.error(`  ...and ${errors.length - 50} more`);
  process.exitCode = 1;
} else {
  console.log('\nValidation passed.');
}
