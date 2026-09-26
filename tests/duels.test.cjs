const { test } = require('node:test');
const assert = require('node:assert/strict');
const { memoryDb } = require('./helpers/memory-db.cjs');
const { createDuelService, selectQuestions, ROUND_MS } = require('../backend/lib/duel-service');
const bank = Array.from({ length: 20 }, (_, i) => ({ id: `q${i}`, statement: '2 + 2?', answer: '4', options: ['3', '4'] }));
function fixture() {
  const db = memoryDb(); let now = 100000;
  const act = createDuelService({ db, getPool: async () => bank, now: () => now, newCode: () => 'ABCDEF' });
  return { db, act, advance: (ms) => { now += ms; } };
}
test('server creates private answers, allows invited guest, rejects third player', async () => {
  const f = fixture();
  await f.act({ uid: 'host' }, { action: 'create' });
  assert.equal(f.db.records.get('duels/ABCDEF').questions.length, 15);
  assert.equal(f.db.records.get('duels/ABCDEF').questions[0].answer, undefined);
  assert.equal(f.db.records.get('duelPrivate/ABCDEF').questions[0].answer, '4');
  await f.act({ uid: 'guest' }, { action: 'join', code: 'ABCDEF' });
  await assert.rejects(f.act({ uid: 'third' }, { action: 'join', code: 'ABCDEF' }), /full/);
  await assert.rejects(f.act({ uid: 'host' }, { action: 'answer', code: 'ABCDEF', qIndex: 0, answer: '4' }), /not_started/);
});
test('correctness is server-owned, repeated answers are idempotent and round-bound', async () => {
  const f = fixture();
  await f.act({ uid: 'host' }, { action: 'create' });
  await f.act({ uid: 'guest' }, { action: 'join', code: 'ABCDEF' }); f.advance(3000);
  await f.act({ uid: 'host' }, { action: 'answer', code: 'ABCDEF', qIndex: 0, answer: '4', correct: false });
  assert.deepEqual(f.db.records.get('duels/ABCDEF').round.host, { submitted: true });
  const duplicate = await f.act({ uid: 'host' }, { action: 'answer', code: 'ABCDEF', qIndex: 0, answer: '3' });
  assert.equal(duplicate.duplicate, true); f.advance(1);
  await f.act({ uid: 'guest' }, { action: 'answer', code: 'ABCDEF', qIndex: 0, answer: '3', correct: true });
  assert.deepEqual(f.db.records.get('duels/ABCDEF').scores, { host: 1, guest: 0 });
  await assert.rejects(f.act({ uid: 'guest' }, { action: 'answer', code: 'ABCDEF', qIndex: 0, answer: '4' }), /stale_round/);
  await assert.rejects(f.act({ uid: 'third' }, { action: 'expire', code: 'ABCDEF', qIndex: 1 }), /not_player/);
});
test('expired answers cannot score and completed matches produce server proof', async () => {
  const f = fixture(); await f.act({ uid: 'host' }, { action: 'create' });
  await f.act({ uid: 'guest' }, { action: 'join', code: 'ABCDEF' }); f.advance(3000);
  for (let qIndex = 0; qIndex < 15; qIndex++) {
    f.advance(ROUND_MS);
    const result = await f.act({ uid: 'host' }, { action: 'answer', code: 'ABCDEF', qIndex, answer: '4' });
    assert.equal(result.expired, true);
  }
  assert.equal(f.db.records.get('duels/ABCDEF').status, 'finished');
  const proof = f.db.records.get('duelPrivate/ABCDEF').result;
  assert.deepEqual(proof.scores, { host: 0, guest: 0 }); assert.equal(proof.guestUid, 'guest');
});
test('legacy rooms without server proof are not accepted; invalid questions excluded', async () => {
  const f = fixture(); f.db.records.set('duels/ABCDEF', { status: 'waiting', host: { uid: 'host' } });
  await assert.rejects(f.act({ uid: 'guest' }, { action: 'join', code: 'ABCDEF' }), /not_found/);
  assert.throws(() => selectQuestions([{ id: 'a', statement: '?', answer: '—' }]), /bank_unavailable/);
});
