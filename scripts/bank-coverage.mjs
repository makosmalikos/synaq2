import { POOL as publicPool } from '../frontend/src/bank.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { getStandardBank } = require('../backend/lib/standard-bank');
const POOL = [...publicPool, ...getStandardBank()];

// A diagnostic, not a proof of semantic uniqueness. It catches the most common
// numerical reskins so the active row count cannot masquerade as content depth.
const shape = (statement) => String(statement)
  .toLocaleLowerCase()
  .replace(/\d+(?:[.,]\d+)?/g, '#')
  .replace(/\s+/g, ' ')
  .trim();

const targets = { НИШ: 2500, БИЛ: 1400, РФМШ: 1100 };
const totalShapes = new Set(POOL.map((question) => shape(question.statement))).size;
const rows = Object.entries(targets).map(([school, target]) => {
  const questions = POOL.filter((question) => question.school === school);
  const distinctShapes = new Set(questions.map((question) => shape(question.statement))).size;
  return { school, active: questions.length, distinctShapes, target, gapByShapes: Math.max(0, target - distinctShapes) };
});

console.table(rows);
console.log(`Total active: ${POOL.length}; approximate distinct formulations: ${totalShapes}; target: 5000; approximate gap: ${Math.max(0, 5000 - totalShapes)}.`);
console.log('Number-masked formulations are a screening metric; an editor must still judge semantic duplicates and correctness.');
