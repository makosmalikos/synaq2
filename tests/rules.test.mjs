import { test, before, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
let env;
before(async () => {
  if (enabled) env = await initializeTestEnvironment({ projectId: 'demo-synaq-tests', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
});
after(async () => { if (env) await env.cleanup(); });
test('center data is API-only; children read only their own seat and its license', { skip: !enabled }, async () => {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'centerSeats/rules-center-child'), { centerId: 'rules-center', active: true });
    await setDoc(doc(db, 'centerLicenses/rules-center'), { active: true, expiresAt: Date.now() + 86400000 });
    await setDoc(doc(db, 'centers/rules-center'), { name: 'Center' });
    await setDoc(doc(db, 'centerStaff/rules-teacher'), { centerId: 'rules-center', active: true, role: 'owner' });
  });
  const child = env.authenticatedContext('rules-center-child').firestore();
  const stranger = env.authenticatedContext('rules-stranger').firestore();
  const staff = env.authenticatedContext('rules-teacher').firestore();
  await assertSucceeds(getDoc(doc(child, 'centerSeats/rules-center-child')));
  await assertSucceeds(getDoc(doc(child, 'centerLicenses/rules-center')));
  await assertFails(getDoc(doc(stranger, 'centerSeats/rules-center-child')));
  await assertFails(getDoc(doc(stranger, 'centerLicenses/rules-center')));
  for (const db of [child, stranger, staff]) {
    for (const path of ['centers/rules-center', 'centerStaff/rules-teacher', 'centerInvites/secret', 'centers/rules-center/groups/group']) {
      await assertFails(getDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, path), { active: true }));
    }
    await assertFails(setDoc(doc(db, 'centerSeats/rules-center-child'), { centerId: 'rules-center', active: true }));
    await assertFails(setDoc(doc(db, 'centerLicenses/rules-center'), { active: true, expiresAt: Date.now() + 86400000 }));
  }
  await env.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'centerSeats/rules-center-child'), { active: false }));
  await assertFails(getDoc(doc(child, 'centerLicenses/rules-center')));
});
test('Firestore ownership, private state and create-only records', { skip: !enabled }, async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'families/parent'), { parentName: 'Parent', pro: true });
    await setDoc(doc(db, 'families/parent/children/child'), { name: 'Child', code: 'student' });
    await setDoc(doc(db, 'childIndex/child'), { parentUid: 'parent', pro: true });
    await setDoc(doc(db, 'results/child/attempts/a'), { qid: 'q1' });
    await setDoc(doc(db, 'duels/ABCDEF'), { host: { uid: 'child' }, guest: null, status: 'waiting' });
  });
  const parent = env.authenticatedContext('parent').firestore();
  const child = env.authenticatedContext('child').firestore();
  const other = env.authenticatedContext('other').firestore();
  await assertSucceeds(getDoc(doc(parent, 'results/child/attempts/a')));
  await assertFails(getDoc(doc(other, 'results/child/attempts/a')));
  await assertSucceeds(setDoc(doc(other, 'families/other'), { parentName: 'Other' }));
  await assertFails(setDoc(doc(other, 'families/other/children/child'), { code: 'student' }));
  await assertFails(setDoc(doc(other, 'childIndex/child'), { parentUid: 'other', pro: false }));
  await assertFails(updateDoc(doc(parent, 'childIndex/child'), { parentUid: 'parent' }));
  await assertFails(updateDoc(doc(parent, 'families/parent'), { proExpiresAt: new Date(2099, 1) }));
  await assertSucceeds(updateDoc(doc(parent, 'families/parent'), { parentName: 'New name' }));
  for (const collection of ['explanations', 'translations', 'aiCache', 'bankTasks', 'bankTaskKeys', 'duels', 'duelPrivate', 'paymentEvents', 'paymentSubscriptions', 'learningSessions', 'learningRateLimits', 'mockSessions', 'diagnosticSessions', 'diagnosticRateLimits', 'checkoutSessions', 'rewardWallets', 'rewardRequests']) {
    await assertFails(setDoc(doc(child, `${collection}/fake`), { host: { uid: 'child' }, text: 'test' }));
    if (collection !== 'duels') await assertFails(getDoc(doc(child, `${collection}/fake`)));
  }
  await assertSucceeds(getDoc(doc(child, 'duels/ABCDEF')));
  await assertFails(getDoc(doc(other, 'duels/ABCDEF')));
  await assertFails(setDoc(doc(child, 'results/child/stats/summary'), { xp: 0, studySecs: 0, diagnosticMockUsed: true,
    diagnosticMockAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(child, 'results/child/stats/summary'), { diagnosticMockUsed: false }));
  await assertFails(updateDoc(doc(child, 'results/child/stats/summary'), { xp: 100000 }));
  await assertFails(updateDoc(doc(child, 'results/child/attempts/a'), { qid: 'q2' }));
});

test('practice results and even small XP increments cannot be forged from the browser', { skip: !enabled }, async () => {
  const child = env.authenticatedContext('batch-child').firestore();
  const batch = writeBatch(child);
  batch.set(doc(child, 'results/batch-child/attempts/stable-id'), { qid: 'q1', correct: true, secs: 60 });
  batch.set(doc(child, 'results/batch-child/solved/q1'), { qid: 'q1', correct: true });
  batch.set(doc(child, 'results/batch-child/stats/summary'), { xp: 5, studySecs: 60 });
  await assertFails(batch.commit());
  await assertFails(setDoc(doc(child, 'results/batch-child/attempts/single'), { qid: 'q1', correct: true }));
  await assertFails(setDoc(doc(child, 'results/batch-child/solved/q1'), { qid: 'q1', correct: true }));
  await assertFails(setDoc(doc(child, 'results/batch-child/daily/2026-09-24'), { count: 0 }));
  await env.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), 'results/batch-child/stats/summary'), { xp: 5, studySecs: 60 }));
  await assertFails(updateDoc(doc(child, 'results/batch-child/stats/summary'), { xp: 10 }));
  await assertFails(updateDoc(doc(child, 'results/batch-child/stats/summary'), { studySecs: 61 }));
  await assertFails(setDoc(doc(child, 'results/batch-child/awards/forged'), { gain: 50 }));
  await env.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), 'results/legacy-child/stats/summary'), { diagnosticMockUsed: true }));
  const legacy = env.authenticatedContext('legacy-child').firestore();
  await assertFails(updateDoc(doc(legacy, 'results/legacy-child/stats/summary'), { xp: 0, studySecs: 0 }));
  await assertFails(updateDoc(doc(legacy, 'results/legacy-child/stats/summary'), { diagnosticMockUsed: false }));
});
