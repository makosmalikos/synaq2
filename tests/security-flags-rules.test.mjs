import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

test('flag rules allow the real bookmark shape and reject arbitrary storage, forged dates and orphan accounts', { skip: !process.env.FIRESTORE_EMULATOR_HOST }, async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:18080') throw Error('Local emulator required');
  const env = await initializeTestEnvironment({ projectId: 'demo-synaq-tests', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  const uid = 'securityflags_' + randomUUID(), paths = ['childIndex/' + uid, ...['q1','q2','q3','q4','q5','q6'].map(q => `results/${uid}/flags/${q}`)];
  try {
    await env.withSecurityRulesDisabled(async c => setDoc(doc(c.firestore(), paths[0]), { parentUid: 'local-security-fixture' }));
    const child = env.authenticatedContext(uid).firestore(), other = env.authenticatedContext(uid + '_other').firestore();
    await assertSucceeds(setDoc(doc(child, paths[1]), { qid: 'q1', at: serverTimestamp() }));
    await assertFails(setDoc(doc(child, paths[2]), { qid: 'q2', at: serverTimestamp(), payload: 'x'.repeat(10000) }));
    await assertFails(setDoc(doc(child, paths[3]), { qid: 'different-question', at: serverTimestamp() }));
    await assertFails(setDoc(doc(child, paths[4]), { qid: 'q4', at: new Date('2020-01-01') }));
    await assertFails(setDoc(doc(child, paths[5]), { arbitrary: 'unbounded payload' }));
    await assertFails(setDoc(doc(other, paths[6]), { qid: 'q6', at: serverTimestamp() }));
    await assertFails(setDoc(doc(other, `results/${uid}_other/flags/q1`), { qid: 'q1', at: serverTimestamp() }));
    await assertSucceeds(deleteDoc(doc(child, paths[1])));
  } finally {
    await env.withSecurityRulesDisabled(async c => { for (const path of paths) await deleteDoc(doc(c.firestore(), path)); });
    await env.cleanup();
  }
});
