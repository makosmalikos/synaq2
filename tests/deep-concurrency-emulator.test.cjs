const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const { enabled, configure, shutdown, liveFixture } = require('./helpers/deep-live-fixture.cjs');
const metrics = [];
before(configure);
after(async () => {
  if (enabled) {
    await fs.mkdir('output/deep-scenario-audit', { recursive: true });
    await fs.writeFile('output/deep-scenario-audit/concurrency-metrics.json', JSON.stringify({ environment: 'Local Node + Auth/Firestore emulators; not production capacity', metrics }, null, 2));
  }
  await shutdown();
});
const options = { skip: !enabled, timeout: 120000 };
function measured(name, rows) {
  const times = rows.map(r => r.ms).sort((a, b) => a - b);
  metrics.push({ name, requests: rows.length, p50Ms: Math.round(times[Math.floor(times.length * .5)]), p95Ms: Math.round(times[Math.min(times.length - 1, Math.floor(times.length * .95))]), maxBytes: Math.max(...rows.map(r => r.bytes)), statuses: rows.reduce((out, r) => { out[r.status] = (out[r.status] || 0) + 1; return out; }, {}) });
}
async function publicQuestion() {
  const { POOL } = await import('../frontend/src/bank.js');
  return POOL.find(q => q.answer != null && !q.image && q.school === 'РФМШ');
}
test('12 simultaneous retries of one practice answer create one attempt, one daily use and one XP award', options, async () => liveFixture(async f => {
  const q = await publicQuestion(), id = randomUUID();
  assert.equal((await f.post('learning', { action: 'start', mode: 'training', id, qid: q.id })).status, 200);
  const rows = await Promise.all(Array.from({ length: 12 }, () => f.post('learning', { action: 'answer', id, answer: String(q.answer) })));
  measured('practice same answer ×12', rows);
  assert.ok(rows.every(r => r.status === 200), JSON.stringify(rows.map(r => r.status)));
  assert.equal(rows.filter(r => r.body.saved).length, 1);
  assert.equal((await f.client.getAttempts(f.uid)).length, 1);
  assert.equal((await f.post('learning', { action: 'count' })).body.count, 1);
  assert.equal((await f.client.getXpSummary(f.uid)).xp, 5);
}));
test('two conflicting answers to one practice ID cannot replace the committed answer', options, async () => liveFixture(async f => {
  const q = await publicQuestion(), id = randomUUID();
  await f.post('learning', { action: 'start', mode: 'training', id, qid: q.id });
  const answers = [String(q.answer), '__wrong__'];
  const rows = await Promise.all(answers.map(answer => f.post('learning', { action: 'answer', id, answer })));
  assert.deepEqual(rows.map(r => r.status).sort(), [200, 409]);
  const saved = (await f.client.getAttempts(f.uid))[0];
  assert.equal(saved.answer, answers[rows.findIndex(r => r.status === 200)]);
  assert.equal((await f.post('learning', { action: 'count' })).body.count, 1);
}));
test('12 parallel free answers cannot exceed the daily allowance or double credit one question', options, async () => liveFixture(async f => {
  const q = await publicQuestion(), ids = Array.from({ length: 12 }, () => randomUUID());
  for (const id of ids) assert.equal((await f.post('learning', { action: 'start', mode: 'training', id, qid: q.id })).status, 200);
  const rows = await Promise.all(ids.map(id => f.post('learning', { action: 'answer', id, answer: String(q.answer) })));
  measured('free quota race ×12', rows);
  assert.equal(rows.filter(r => r.status === 200).length, 5, JSON.stringify(rows.map(r => r.status)));
  assert.ok(rows.every(r => r.status === 200 || r.status === 429));
  assert.equal((await f.post('learning', { action: 'count' })).body.count, 5);
  assert.equal((await f.client.getAttempts(f.uid)).length, 5);
  assert.equal((await f.client.getXpSummary(f.uid)).xp, 5);
}, 'free'));
test('8 parallel NIS submissions freeze one identical result with all 180 review rows', options, async () => liveFixture(async f => {
  const id = randomUUID(), catalog = await f.post('mock-session', { action: 'catalog' });
  assert.equal((await f.post('mock-session', { action: 'start', id, school: 'НИШ', weekKey: catalog.body.weekly.weekKey, excludeQuestionIds: [] })).status, 200);
  await require('./helpers/nis-session.cjs').completeNisPhases(body => f.post('mock-session', body), id, { 2: '0', 30: '12' });
  const rows = await Promise.all(Array.from({ length: 8 }, () => f.post('mock-session', { action: 'submit', id, answers: { 2: '0', 30: '12' } })));
  measured('NIS finish ×8', rows);
  assert.ok(rows.every(r => r.status === 200), JSON.stringify(rows.map(r => r.status)));
  for (const row of rows) assert.deepEqual(row.body.result, rows[0].body.result);
  assert.equal(rows[0].body.result.review.length, 180);
  assert.equal((await f.client.getMocks(f.uid)).length, 1);
}));
test('8 parallel reward claims reserve coins once and 8 rejections refund once', options, async () => liveFixture(async f => {
  await f.db.doc(`results/${f.uid}/stats/summary`).set({ xp: 9000 });
  const claims = await Promise.all(Array.from({ length: 8 }, () => f.post('rewards', { action: 'claim', rewardId: 'book' })));
  measured('reward claim ×8', claims);
  assert.equal(claims.filter(r => r.status === 200).length, 1);
  assert.ok(claims.every(r => r.status === 200 || r.status === 409));
  const id = claims.find(r => r.status === 200).body.id;
  const wallet = f.db.doc('rewardWallets/' + f.uid);
  assert.equal((await wallet.get()).data().spentCoins, 4500);
  const rejects = await Promise.all(Array.from({ length: 8 }, () => f.post('rewards', { action: 'reject', id }, f.parentToken)));
  assert.ok(rejects.every(r => r.status === 200 || r.status === 409));
  assert.equal((await wallet.get()).data().spentCoins, 0);
  assert.equal((await f.client.getXpSummary(f.uid)).xp, 9000);
}));
test('8 bookings for one mentor slot consume one lesson and parallel cancellation restores one credit', options, async () => liveFixture(async f => {
  const L = require('../backend/lib/lessons'), mentorId = 'deep_' + randomUUID().replaceAll('-', '');
  const startAt = Math.ceil((Date.now() + 48 * 3600000) / 3600000) * 3600000;
  const local = L.almaty(startAt), path = 'mentors/' + mentorId;
  f.track(path); f.track(`lessonSlots/m_${mentorId}_${startAt}`);
  await f.db.doc(path).set({ active: true, name: 'Local test mentor', slots: [{ day: local.day, time: local.time }] });
  const rows = await Promise.all(Array.from({ length: 8 }, () => f.post('lessons', { action: 'book', mentorId, startAt, topic: 'Local concurrency test' })));
  measured('same lesson slot ×8', rows);
  assert.equal(rows.filter(r => r.status === 200).length, 1, JSON.stringify(rows));
  assert.ok(rows.every(r => r.status === 200 || r.status === 409));
  const id = rows.find(r => r.status === 200).body.lesson.id;
  const credit = f.db.doc(`lessonCredits/${f.parentUid}_${f.periodEnd}`);
  assert.equal((await credit.get()).data().used, 1);
  const cancels = await Promise.all(Array.from({ length: 8 }, () => f.post('lessons', { action: 'cancel', id })));
  assert.ok(cancels.every(r => r.status === 200 || r.status === 409));
  assert.equal((await credit.get()).data().used, 0);
  assert.equal((await f.db.doc(`lessonSlots/m_${mentorId}_${startAt}`).get()).exists, false);
}, 'mentor'));
test('catalog and question reads stay bounded under 40 requests at concurrency 8', options, async () => liveFixture(async f => {
  // Warm the import/registry once; report warm local latency separately from production capacity.
  const cold = await f.post('learning', { action: 'topics' });
  assert.equal(cold.status, 200); measured('catalog cold import', [cold]);
  const rows = [];
  for (let batch = 0; batch < 5; batch++) rows.push(...await Promise.all(Array.from({ length: 8 }, (_, i) => f.post('learning', i % 2 ? { action: 'topics' } : { action: 'questions', topicId: 'num', mixed: false, excludeIds: [], limit: 60 }))));
  measured('warm catalog/questions concurrency 8', rows);
  for (const row of rows) {
    assert.equal(row.status, 200);
    if (row.body.questions) { assert.ok(row.body.questions.length <= 60); assert.ok(row.body.questions.every(q => q.answer === undefined && q.solution === undefined)); }
    assert.ok(row.ms < 5000, `Local request exceeded 5s: ${row.ms}`);
    assert.ok(row.bytes < 512000, 'A bounded list must not serialize the whole bank');
  }
}));
test('40 daily-count reads do not rewrite an existing counter or contend with answer writes', options, async () => liveFixture(async f => {
  const day = require('../backend/lib/learning-service').learningDay(Date.now()).day;
  const ref = f.db.doc(`results/${f.uid}/daily/${day}`), at = new Date(Date.now() - 10000);
  await ref.set({ count: 2, updatedAt: at });
  const rows = [];
  for (let i = 0; i < 5; i++) rows.push(...await Promise.all(Array.from({ length: 8 }, () => f.post('learning', { action: 'count' }))));
  measured('daily counter reads concurrency 8', rows);
  assert.ok(rows.every(r => r.status === 200 && r.body.count === 2));
  assert.equal((await ref.get()).data().updatedAt.toMillis(), at.getTime(), 'Reading a known counter must not write it');
}));
test('malformed learning, mock and diagnostic payloads fail closed without creating sessions', options, async () => liveFixture(async f => {
  const rows = [];
  for (const route of ['learning', 'mock-session', 'diagnostic-session']) {
    for (const body of [null, [], {}, { action: 'unknown' }, { action: 'start', id: '../outside', grade: 5 }, { action: 'start', id: 123 }, { action: 'answer', id: 'valid-but-missing', answer: 'x'.repeat(2001) }]) {
      const response = await f.post(route, body);
      assert.ok([400, 403, 404].includes(response.status), `${route} ${JSON.stringify(body).slice(0, 70)} returned ${response.status}`);
      assert.equal(response.body.result, undefined); assert.equal(response.body.question, undefined); rows.push(response);
    }
  }
  measured('malformed authenticated requests', rows);
  for (const collection of ['learningSessions', 'mockSessions', 'diagnosticSessions']) assert.equal((await f.db.collection(collection).where('uid', '==', f.uid).get()).size, 0);
}));
