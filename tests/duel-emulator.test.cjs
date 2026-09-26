const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createDuelService } = require('../backend/lib/duel-service');

const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
test('real Admin SDK serializes concurrent duel answers and persists private proof', { skip: !enabled }, async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST, /^(127\.0\.0\.1|localhost):\d+$/);
  const app = initializeApp({ projectId: 'demo-synaq-tests' }, 'duel-integration');
  const db = getFirestore(app);
  const code = 'TSTXYZ', host = { uid: 'integration-host' }, guest = { uid: 'integration-guest' };
  const refs = [db.doc(`duels/${code}`), db.doc(`duelPrivate/${code}`), db.doc(`duelRateLimits/${host.uid}`), db.doc(`duelRateLimits/${guest.uid}`)];
  let now = Date.now();
  try {
    await Promise.all(refs.map((ref) => ref.delete()));
    const act = createDuelService({ db, now: () => now, newCode: () => code,
      getPool: async () => Array.from({ length: 20 }, (_, i) => ({ id: `integration-${i}`, statement: '2 + 2?', answer: '4', options: ['3', '4'] })),
    });
    await act(host, { action: 'create' });
    await act(guest, { action: 'join', code });
    now += 3000;
    for (let qIndex = 0; qIndex < 15; qIndex++) {
      await Promise.all([
        act(host, { action: 'answer', code, qIndex, answer: '4' }),
        act(guest, { action: 'answer', code, qIndex, answer: '3' }),
      ]);
      now += 1000;
    }
    const room = (await refs[0].get()).data(), proof = (await refs[1].get()).data();
    assert.equal(room.status, 'finished');
    assert.deepEqual(room.scores, { host: 15, guest: 0 });
    assert.equal(room.questions[0].answer, undefined);
    assert.equal(proof.result.hostUid, host.uid);
    assert.equal(proof.result.winner, 'host');
    assert.deepEqual(proof.result.scores, room.scores);
  } finally {
    await Promise.all(refs.map((ref) => ref.delete()));
    await db.terminate();
    await deleteApp(app);
  }
});
