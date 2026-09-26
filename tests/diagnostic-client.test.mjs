import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { diagnosticProgressKey, diagnosticStorageKey, readDiagnosticProgress } from '../frontend/src/platformDiagnostic.js';
import { acknowledgeDiagnosticResult, diagnosticRecovery, stageDiagnosticResult } from '../frontend/src/diagnosticPersistence.js';

const screen = fs.readFileSync(new URL('../frontend/src/components/PlatformDiagnostic.jsx', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../frontend/src/diagnosticApi.js', import.meta.url), 'utf8');
function memoryStorage() {
  const data = new Map(), operations = [];
  return { data, operations, getItem: (key) => data.get(key) ?? null,
    setItem(key, value) { operations.push(['set', key]); data.set(key, value); },
    removeItem(key) { operations.push(['remove', key]); data.delete(key); } };
}
const result = (saveId = 'diagnostic_12345678', completedAt = '2026-09-26T00:00:00.000Z') => ({
  version: 2, saveId, savePending: false, completedAt, topics: [], mistakes: [], readiness: 70, correct: 14, total: 20,
});

test('a verified server result reaches storage before its matching draft is removed', () => {
  const uid = 'diag-order', storage = memoryStorage(), value = result();
  storage.setItem(diagnosticProgressKey(uid), JSON.stringify({ attemptId: value.saveId }));
  storage.operations.length = 0;
  assert.equal(stageDiagnosticResult(uid, value, storage), true);
  assert.deepEqual(storage.operations, [['set', diagnosticStorageKey(uid)], ['remove', diagnosticProgressKey(uid)]]);
  acknowledgeDiagnosticResult(uid, value, storage);
});

test('blocked storage keeps a UID-scoped in-memory server result', () => {
  const uid = 'diag-quota', storage = memoryStorage(), value = result();
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(stageDiagnosticResult(uid, value, storage), false);
  assert.equal(diagnosticRecovery(uid).result.saveId, value.saveId);
  assert.equal(diagnosticRecovery(uid).durable, false);
  assert.equal(diagnosticRecovery('different-child').result, null);
  acknowledgeDiagnosticResult(uid, value, storage);
});

test('late acknowledgement cannot replace or delete a newer result', () => {
  const uid = 'diag-newer', storage = memoryStorage(), old = result(), newer = result('diagnostic_87654321', '2026-09-26T01:00:00.000Z');
  stageDiagnosticResult(uid, old, storage);
  storage.setItem(diagnosticStorageKey(uid), JSON.stringify(newer));
  storage.setItem(diagnosticProgressKey(uid), JSON.stringify({ attemptId: newer.saveId }));
  assert.equal(stageDiagnosticResult(uid, old, storage), false);
  acknowledgeDiagnosticResult(uid, old, storage);
  assert.equal(JSON.parse(storage.getItem(diagnosticStorageKey(uid))).saveId, newer.saveId);
  assert.equal(JSON.parse(storage.getItem(diagnosticProgressKey(uid))).attemptId, newer.saveId);
});

test('v2 progress keeps only recovery data and rejects malformed pending answers', () => {
  const uid = 'diag-progress', storage = memoryStorage(), previous = globalThis.localStorage;
  globalThis.localStorage = storage;
  try {
    const valid = { version: 2, screen: 'test', grade: 5, index: 4, answer: '12', attemptId: 'diagnostic_12345678',
      pendingStart: false, pendingAnswer: { index: 4, answer: '12' } };
    storage.setItem(diagnosticProgressKey(uid), JSON.stringify(valid));
    assert.deepEqual(readDiagnosticProgress(uid), valid);
    for (const invalid of [{ ...valid, version: 1 }, { ...valid, index: 20 },
      { ...valid, pendingAnswer: { index: 4, answer: { correct: true } } }, { ...valid, attemptId: '../foreign' }]) {
      storage.setItem(diagnosticProgressKey(uid), JSON.stringify(invalid));
      assert.equal(readDiagnosticProgress(uid), null);
    }
  } finally { globalThis.localStorage = previous; }
});

test('diagnostic screen delegates start, resume and grading without importing answer generators', () => {
  assert.match(screen, /diagnosticStart\(id, grade\)/);
  assert.match(screen, /diagnosticResume\(draft\.attemptId\)/);
  assert.match(screen, /diagnosticAnswer\(attemptId\.current, index, given\)/);
  assert.doesNotMatch(screen, /curriculumData|curriculumAnswersMatch|createCurriculumQuestions|savePlatformDiagnostic/);
  assert.doesNotMatch(screen, /correct:\s*!|question\.answer|scoreByModule|makeWave/);
  assert.match(screen, /pendingAnswer:\s*\{ index, answer: given \}/);
});

test('diagnostic API sends only the stable session id, grade, index and answer', () => {
  assert.match(api, /request\(\{ action: 'start', id, grade \}\)/);
  assert.match(api, /request\(\{ action: 'resume', id \}\)/);
  assert.match(api, /request\(\{ action: 'answer', id, index, answer \}\)/);
  assert.doesNotMatch(api, /correct|readiness|topics|mistakes|spentSec/);
});
