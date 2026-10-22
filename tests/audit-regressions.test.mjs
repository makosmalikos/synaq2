import test from 'node:test';
import assert from 'node:assert/strict';
import { restoredDiagnosticAnswer } from '../frontend/src/platformDiagnostic.js';
import { readPublicTestDraft, savePublicTestDraft, clearPublicTestDraft, questionRevision } from '../frontend/src/publicTestDraft.js';
import { claimChunkRecovery } from '../frontend/src/chunkRecovery.js';
import { validateLeadForm, sendLead } from '../frontend/src/leadForm.js';
import { buildDiagnosis, pickDiagnosticMock } from '../frontend/src/diagnosis.js';

const memory = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) }; };
const questions = [{ id: 'one', statement: '2 + 3', answer: '5' }, { id: 'two', statement: '5 + 3', answer: '8' }];
const draft = { grade: 6, target: 'БИЛ', index: 1, answers: { one: '5', two: '7' }, deadline: 100000 };

test('diagnostic recovery retains only an answer belonging to the same question and attempt', () => {
  const saved = { attemptId: 'attempt-a', index: 0, answer: '8300', pendingAnswer: { index: 0, answer: '8300' } };
  assert.equal(restoredDiagnosticAnswer({ id: 'attempt-a', index: 0 }, saved), '8300');
  assert.equal(restoredDiagnosticAnswer({ id: 'attempt-a', index: 1 }, saved), '');
  assert.equal(restoredDiagnosticAnswer({ id: 'attempt-b', index: 0 }, saved), '');
  assert.equal(restoredDiagnosticAnswer({ id: 'attempt-a', index: 0 }, { ...saved, pendingAnswer: null }), '8300');
});

test('public test survives a reload with answers, current question and original deadline', () => {
  const storage = memory();
  assert.equal(savePublicTestDraft('mock', draft, questionRevision(questions), storage, 1000), true);
  const restored = readPublicTestDraft('mock', () => questions, storage, 2000);
  assert.deepEqual(restored.answers, draft.answers);
  assert.equal(restored.index, 1);
  assert.equal(restored.deadline, 100000);
  // Expired tests remain readable so the UI can finish them, without restarting a timer.
  assert.equal(readPublicTestDraft('mock', () => questions, storage, 200000).deadline, 100000);
  clearPublicTestDraft('mock', storage);
  assert.equal(readPublicTestDraft('mock', () => questions, storage, 2000), null);
});

test('public drafts reject stale banks, malformed answers and expired drafts; types stay separate', () => {
  const storage = memory(), revision = questionRevision(questions);
  savePublicTestDraft('mock', draft, revision, storage, 1000);
  assert.equal(readPublicTestDraft('quick', () => questions, storage, 2000), null);
  assert.equal(readPublicTestDraft('mock', () => [{ ...questions[0], answer: '6' }, questions[1]], storage, 2000), null);
  assert.equal(readPublicTestDraft('mock', () => questions, storage, 9 * 86400000), null);
  for (const invalid of [{ index: 99 }, { target: 'unknown' }, { grade: 2 }, { answers: { alien: '8' } }, { deadline: null }]) {
    savePublicTestDraft('mock', { ...draft, ...invalid }, revision, storage, 1000);
    assert.equal(readPublicTestDraft('mock', () => questions, storage, 2000), null);
  }
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.equal(readPublicTestDraft('quick', () => questions, blocked), null);
  assert.equal(savePublicTestDraft('quick', draft, revision, blocked), false);
});

test('chunk recovery permits one reload, never loops and ignores ordinary UI errors', () => {
  const storage = memory(), error = Error('Unable to preload CSS for /assets/old.css');
  assert.equal(claimChunkRecovery(Error('Cannot read properties of undefined'), storage, 1000), false);
  assert.equal(claimChunkRecovery(error, storage, 1000), true);
  assert.equal(claimChunkRecovery(error, storage, 1001), false);
  assert.equal(claimChunkRecovery(error, { getItem() { throw Error('blocked'); } }, 1000), false);
});

test('lead rejects invalid phone values and confirms server acknowledgement before proceeding', async () => {
  const payload = { name: 'Тест', phone: '+7 777 123 45 67', role: 'parent' };
  assert.ok(validateLeadForm(payload));
  for (const phone of ['abc', '1       ', '+7 <script>', '777777777777777777']) assert.equal(validateLeadForm({ ...payload, phone }), null);
  for (const response of [{ ok: false }, { ok: true, json: async () => ({ ok: false }) }]) {
    await assert.rejects(sendLead(payload, 'ru', async () => response));
  }
  await sendLead(payload, 'ru', async (url, options) => {
    assert.equal(url, '/api/lead');
    assert.equal(JSON.parse(options.body).phone, payload.phone);
    return { ok: true, json: async () => ({ ok: true }) };
  });
});

test('Russian diagnostic explanations use Russian topic names', () => {
  const report = buildDiagnosis([{ topic: 'eq', answer: '2', your: '1', correct: false }], [{ id: 'eq', name: 'Теңдеулер', nameRu: 'Уравнения' }], 'ru');
  assert.equal(report.topics[0].name, 'Уравнения');
  assert.match(report.plan[0].line, /Уравнения/);
});

test('regular weekly mocks are not labelled as a diagnostic result', () => {
  const weekly = { diagnostic: false, review: [{}], at: { seconds: 20 } };
  const diagnostic = { diagnostic: true, review: [{}], at: { seconds: 10 } };
  assert.equal(pickDiagnosticMock([weekly]), null);
  assert.equal(pickDiagnosticMock([weekly, diagnostic]), diagnostic);
});
