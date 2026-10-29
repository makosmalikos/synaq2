const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { enabled, configure, shutdown, liveFixture } = require('./helpers/deep-live-fixture.cjs');
before(configure); after(shutdown);
const options = { skip: !enabled, timeout: 120000 };

test('NIS API enforces phases, preserves newest answers and grades saved answers rather than a forged submit', options, async () => liveFixture(async f => {
  const id = randomUUID(), post = body => f.post('mock-session', { id, ...body });
  const started = await post({ action: 'start', school: 'НИШ', excludeQuestionIds: [] });
  assert.equal(started.status, 200);
  const stored = (await f.db.doc(`mockSessions/${f.uid}_${id}`).get()).data();
  const secret = await require('../backend/lib/mock-bank').restoreMock(f.db, stored);
  const answer = String(secret.questions[0].answer);
  for (const body of [
    { action: 'submit', answers: {} },
    { action: 'phase', op: 'begin-day2' },
    { action: 'phase', op: 'save', phase: 1, revision: 1, answers: { 41: 'future' } },
    { action: 'phase', op: 'save', phase: 0, revision: 1, answers: { 41: 'future' } },
  ]) assert.equal((await post(body)).status, 409);
  assert.equal((await post({ action: 'phase', op: 'save', phase: 0, revision: 3, answers: { 1: answer } })).status, 200);
  const stale = await post({ action: 'phase', op: 'save', phase: 0, revision: 2, answers: { 1: 'stale' } });
  assert.equal(stale.status, 200); assert.equal(stale.body.nis.answers[1], answer);
  const advanced = await post({ action: 'phase', op: 'advance', phase: 0, revision: 2, answers: { 1: 'stale' } });
  assert.equal(advanced.status, 200); assert.equal(advanced.body.nis.phase, 1); assert.equal(advanced.body.nis.answers[1], answer);
  const replay = await post({ action: 'phase', op: 'advance', phase: 0, revision: 4, answers: { 1: 'forged' } });
  assert.equal(replay.status, 200); assert.deepEqual(replay.body.nis, advanced.body.nis);
  for (const phase of [1, 2]) assert.equal((await post({ action: 'phase', op: 'advance', phase, revision: 1, answers: {} })).status, 200);
  const day2 = await post({ action: 'phase', op: 'begin-day2' });
  assert.equal(day2.status, 200);
  assert.equal((await post({ action: 'phase', op: 'begin-day2' })).body.nis.deadline, day2.body.nis.deadline);
  assert.equal((await post({ action: 'phase', op: 'advance', phase: 3, revision: 1, answers: {} })).status, 200);
  const result = await post({ action: 'submit', answers: { 1: 'forged' } });
  assert.equal(result.status, 200); assert.equal(result.body.result.score, 1);
  assert.equal(result.body.result.review[0].your, answer);
  assert.equal((await post({ action: 'phase', op: 'save', phase: 3, revision: 2, answers: {} })).status, 409);
  assert.deepEqual((await post({ action: 'resume' })).body.result, result.body.result);
}));

test('NIS API reconciles expired blocks without reopening answers or extending deadlines', options, async () => liveFixture(async f => {
  const id = randomUUID(), post = body => f.post('mock-session', { id, ...body });
  assert.equal((await post({ action: 'start', school: 'НИШ', excludeQuestionIds: [] })).status, 200);
  assert.equal((await post({ action: 'phase', op: 'save', phase: 0, revision: 1, answers: { 1: 'saved' } })).status, 200);
  const ref = f.db.doc(`mockSessions/${f.uid}_${id}`), data = (await ref.get()).data();
  const expiredDeadline = Date.now() - 31 * 60000;
  // An elapsed wall clock is simulated only in this isolated session.
  await ref.update({ nis: { ...data.nis, deadline: expiredDeadline, phaseStartedAt: expiredDeadline - 3600000 } });
  const resumed = await post({ action: 'resume' });
  assert.equal(resumed.status, 200); assert.equal(resumed.body.nis.phase, 2);
  assert.equal(resumed.body.nis.answers[1], 'saved');
  assert.equal(resumed.body.nis.deadline, expiredDeadline + 3600000);
  const late = await post({ action: 'phase', op: 'save', phase: 0, revision: 20, answers: { 1: 'late overwrite' } });
  assert.equal(late.status, 200); assert.equal(late.body.nis.answers[1], 'saved');
  assert.equal(late.body.nis.deadline, resumed.body.nis.deadline);
}));
