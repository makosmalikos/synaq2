import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BANK_QUARANTINE, POOL } from '../frontend/src/bank.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'frontend', 'public');
const errors = [];

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
// удаляем его путь из MISSING_FIGURES в bank.js.
for (const q of BANK_QUARANTINE.filter((item) => item.quarantineReason === 'missing_image')) {
  if (fs.existsSync(path.join(publicDir, q.image))) {
    fail(`${q.id}: ${q.image} exists but is still quarantined`);
  }
}

// Минимум для мок-теста БИЛ (math 40 · logic 20 · kaz 20) — по мере импорта.
const bilSpec = { math: 18, logic: 0, kaz: 0 };
for (const [subject, minimum] of Object.entries(bilSpec)) {
  if (minimum <= 0) continue;
  const count = POOL.filter((q) => (q.school === 'БИЛ' || q.school === 'КТЛ') && q.subject === subject).length;
  if (count < minimum) fail(`BIL ${subject}: need ${minimum}, found ${count}`);
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
