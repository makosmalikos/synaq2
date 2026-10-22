import { test, before, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
let env;
before(async () => {
  if (enabled) env = await initializeTestEnvironment({ projectId: 'demo-synaq-reading', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
});
after(async () => { if (env) await env.cleanup(); });
const reading = () => ({ lastStep: 0, completedSteps: ['intro'], checkPassed: false, studiedAt: null, updatedAt: Date.now() });

test('reading belongs to the child; linked parent can read but no other account can change it', { skip: !enabled }, async () => {
  await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'childIndex/reader'), { parentUid: 'reading-parent' }));
  const child = env.authenticatedContext('reader').firestore();
  const parent = env.authenticatedContext('reading-parent').firestore();
  const stranger = env.authenticatedContext('stranger').firestore();
  const path = 'results/reader/lessonReading/g3-review-1';
  await assertSucceeds(setDoc(doc(child, path), reading()));
  await assertSucceeds(getDoc(doc(child, path)));
  await assertSucceeds(getDoc(doc(parent, path)));
  await assertFails(getDoc(doc(stranger, path)));
  await assertFails(setDoc(doc(parent, path), reading()));
  await assertFails(setDoc(doc(stranger, path), reading()));
  await assertFails(deleteDoc(doc(child, path)));
  await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), path), reading()));
});

test('reading documents accept only exact catalog keys and bounded fields, never XP or mastery', { skip: !enabled }, async () => {
  const child = env.authenticatedContext('reading-validation').firestore();
  const prefix = 'results/reading-validation/lessonReading/';
  await assertFails(setDoc(doc(child, prefix + 'g3-not-a-lesson-1'), reading()));
  for (const patch of [{ xp: 100 }, { practiceMastered: true }, { verified: true }, { pro: true }, { lastStep: 9 },
    { completedSteps: ['intro', 'intro'] }, { completedSteps: [0, 1, 2, 3, 4] }, { completedSteps: 'intro' },
    { updatedAt: -1 }, { updatedAt: 4102444800000 }, { checkPassed: 'yes' }, { studiedAt: Date.now() }]) {
    await assertFails(setDoc(doc(child, prefix + 'g3-review-1'), { ...reading(), ...patch }));
  }
  const done = { ...reading(), lastStep: 'summary', completedSteps: ['intro', 0, 1, 2, 3], checkPassed: true, studiedAt: Date.now() - 1 };
  await assertSucceeds(setDoc(doc(child, prefix + 'g3-review-1'), done));
  await assertFails(updateDoc(doc(child, prefix + 'g3-review-1'), { completedSteps: ['intro'], studiedAt: null }));
  await assertFails(updateDoc(doc(child, prefix + 'g3-review-1'), { checkPassed: false, studiedAt: null }));
  await assertSucceeds(updateDoc(doc(child, prefix + 'g3-review-1'), { lastStep: 2, updatedAt: Date.now() }));
  await assertFails(setDoc(doc(child, 'results/reading-validation/stats/summary'), { xp: 5 }));
  await assertFails(setDoc(doc(child, 'results/reading-validation/attempts/fake'), { verified: true, correct: true }));
});
