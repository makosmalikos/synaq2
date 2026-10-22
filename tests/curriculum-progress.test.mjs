import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CURRICULUM } from '../frontend/src/curriculumData.js';
import { curriculumAccessibleKeys, curriculumLessonPages, curriculumProgressModel, curriculumResumeStep,
  curriculumTheoryStudied, createCurriculumTheoryStore, emptyCurriculumTheory, loadCurriculumAttempts,
  mergeCurriculumLesson, readCurriculumTheory, updateCurriculumTheory, writeCurriculumTheory } from '../frontend/src/curriculumProgress.js';

const topic = CURRICULUM[3][0];
const storage = () => { const values = new Map(); return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
const completed = (uid = 'kid', target = topic) => curriculumLessonPages(target).slice(0, -1).reduce((record, step, i) =>
  updateCurriculumTheory(record, target, { step, advance: true, checkPassed: step === 'check', now: i + 1 }), emptyCurriculumTheory(uid));
const answers = (correct, key = topic.key) => correct.map((value, i) => ({ sessionId: `session-${i}`, topic: key, verified: true, correct: value, at: new Date(2026, 1, i + 1) }));

test('opening summary or skipping parts cannot complete theory; traversal and a passed self-check can', () => {
  let record = emptyCurriculumTheory('kid');
  record = updateCurriculumTheory(record, topic, { step: 'summary', now: 1 });
  assert.equal(curriculumTheoryStudied(topic, record.lessons[topic.key]), false);
  assert.equal(curriculumResumeStep(topic, record.lessons[topic.key]), 'intro');
  record = updateCurriculumTheory(record, topic, { step: 'check', advance: true, checkPassed: true, now: 2 });
  assert.equal(curriculumTheoryStudied(topic, record.lessons[topic.key]), false);
  record = completed();
  assert.equal(curriculumTheoryStudied(topic, record.lessons[topic.key]), true);
  assert.equal(curriculumResumeStep(topic, record.lessons[topic.key]), 'summary');
  const failedCheck = curriculumLessonPages(topic).slice(0, -1).reduce((r, step, i) =>
    updateCurriculumTheory(r, topic, { step, advance: true, checkPassed: false, now: i + 1 }), emptyCurriculumTheory('kid'));
  assert.equal(curriculumTheoryStudied(topic, failedCheck.lessons[topic.key]), false);
  assert.equal(failedCheck.lessons[topic.key].lastStep, 'check');
});

test('reader resumes a real unfinished section and completing theory never establishes practice mastery', () => {
  let record = updateCurriculumTheory(emptyCurriculumTheory('kid'), topic, { step: 'intro', advance: true, now: 1 });
  record = updateCurriculumTheory(record, topic, { step: 0, advance: true, now: 2 });
  assert.equal(curriculumResumeStep(topic, record.lessons[topic.key]), 1);
  const model = curriculumProgressModel({ grade: 3, plan: 'pro', theory: completed() });
  assert.equal(model.studiedCount, 1);
  assert.equal(model.masteredCount, 0);
  assert.equal(model.nextTopic.key, CURRICULUM[3][1].key);
});

test('persisted theory is UID scoped and rejects corrupt or foreign records without overwriting them', () => {
  const memory = storage();
  assert.equal(writeCurriculumTheory('kid', completed(), memory), true);
  assert.equal(readCurriculumTheory('kid', memory).record.lessons[topic.key].lastStep, 'summary');
  assert.deepEqual(readCurriculumTheory('other', memory).record.lessons, {});
  assert.equal(writeCurriculumTheory('other', completed(), memory), false);
  const [key] = memory.values.keys();
  memory.values.set(key, JSON.stringify({ ...completed(), uid: 'other' }));
  const before = memory.values.get(key);
  const controller = createCurriculumTheoryStore('kid', { storage: memory });
  assert.equal(controller.snapshot().error, 'invalid');
  controller.update(topic, { step: 'intro', now: 9 });
  assert.equal(memory.values.get(key), before);
  const forged = completed();
  forged.lessons[topic.key].completedSteps = [];
  assert.equal(writeCurriculumTheory('kid', forged, memory), false);
});

test('account switches reject stale local updates and cloud merges, while the next account remains independent', () => {
  const memory = storage(); let uid = 'kid'; const changes = [];
  const first = createCurriculumTheoryStore('kid', { storage: memory, isCurrent: () => uid === 'kid', onChange: value => changes.push(value) });
  first.update(topic, { step: 'intro', advance: true, now: 1 });
  uid = 'other'; const before = [...memory.values.entries()];
  assert.equal(first.update(topic, { step: 1, advance: true, now: 2 }), null);
  assert.equal(first.merge(completed().lessons), null);
  assert.deepEqual([...memory.values.entries()], before);
  assert.equal(changes.length, 1);
  const next = createCurriculumTheoryStore('other', { storage: memory, isCurrent: () => uid === 'other' });
  assert.deepEqual(next.snapshot().record.lessons, {});
  next.update(topic, { step: 'intro', now: 3 });
  assert.equal(readCurriculumTheory('kid', memory).record.lessons[topic.key].lastStep, 0);
  assert.equal(readCurriculumTheory('other', memory).record.lessons[topic.key].lastStep, 'intro');
});

test('device/cloud merges preserve completed sections and the newest resume position without inventing mastery', () => {
  const left = updateCurriculumTheory(emptyCurriculumTheory('kid'), topic, { step: 'intro', advance: true, now: 1 }).lessons[topic.key];
  const right = updateCurriculumTheory(emptyCurriculumTheory('kid'), topic, { step: 0, advance: true, now: 2 }).lessons[topic.key];
  const merged = mergeCurriculumLesson(topic, left, right);
  assert.deepEqual(merged.completedSteps, ['intro', 0]);
  assert.equal(merged.lastStep, 1);
  assert.equal(merged.studiedAt, null);
  const done = completed().lessons[topic.key];
  assert.equal(curriculumTheoryStudied(topic, mergeCurriculumLesson(topic, done, right)), true);
  assert.deepEqual(mergeCurriculumLesson(topic, merged, merged), merged);
});

test('blocked local storage keeps usable in-memory progress with an explicit error', () => {
  const controller = createCurriculumTheoryStore('kid', { storage: { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } } });
  assert.equal(controller.snapshot().error, 'unavailable');
  const next = controller.update(topic, { step: 'intro', advance: true, now: 1 });
  assert.equal(next.error, 'unavailable');
  assert.deepEqual(next.record.lessons[topic.key].completedSteps, ['intro']);
});

test('practice mastery requires five distinct server-verified answers at exact 80%, evaluated on latest ten', () => {
  const model = attempts => curriculumProgressModel({ grade: 3, attempts }).topics[0];
  assert.equal(model(answers([true, true, true, true])).practiceMastered, false);
  assert.equal(model(answers([true, true, true, true, false])).practiceMastered, true);
  assert.equal(model(answers([true, true, true, false, false])).practiceMastered, false);
  const valid = answers([true, true, true, true]);
  assert.equal(model([...valid, ...valid]).practiceMastered, false);
  assert.equal(model([...valid, { ...valid[0], sessionId: 'local', verified: false }]).practiceMastered, false);
  assert.equal(model([...valid, { ...valid[0], sessionId: 'missing', verified: undefined }]).practiceMastered, false);
  assert.equal(model(answers([...Array(30).fill(true), ...Array(10).fill(false)])).practiceMastered, false);
  assert.equal(model(answers([...Array(30).fill(false), ...Array(10).fill(true)])).practiceMastered, true);
  assert.equal(model(answers([true, true, true, true, true], 'arithmetic')).practiceCount, 0);
});

test('next lesson follows grade order and subscription access; a finished reading route falls back to practice', () => {
  for (const plan of ['free', 'standard', 'pro', 'mentor']) {
    const keys = curriculumAccessibleKeys(3, plan);
    assert.equal(keys.size, plan === 'free' ? 4 : plan === 'standard' ? 8 : CURRICULUM[3].length);
    let theory = emptyCurriculumTheory('kid');
    for (const key of keys) theory.lessons[key] = completed('kid', CURRICULUM[3].find(t => t.key === key)).lessons[key];
    const model = curriculumProgressModel({ grade: 3, plan, theory });
    assert.equal(model.nextKind, 'practice');
    assert.equal(model.nextTopic.key, topic.key);
    assert.ok(model.topics.filter(t => t.accessible).every(t => keys.has(t.topic.key)));
  }
  const model = curriculumProgressModel({ grade: 3, plan: 'free', theory: completed() });
  assert.equal(model.nextTopic.key, CURRICULUM[3].find(t => t.quarter === 2).key);
});

test('late history from a previous account or timed-out request cannot replace current progress', async () => {
  let resolve, current = true; const updates = [];
  const pending = loadCurriculumAttempts('kid', () => new Promise(yes => { resolve = yes; }), value => updates.push(value), { isCurrent: () => current });
  await Promise.resolve(); current = false; resolve(answers([true, true, true, true, true])); await pending;
  assert.deepEqual(updates, []);
  let late; const timed = [];
  await loadCurriculumAttempts('kid', () => new Promise(yes => { late = yes; }), value => timed.push(value), { timeoutMs: 1 });
  assert.equal(timed[0].status, 'error');
  late(answers([true, true, true, true, true])); await Promise.resolve();
  assert.equal(timed.length, 1);
});

test('reading rules enumerate the exact current catalog and match its four-part lessons', () => {
  const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const section = rules.slice(rules.indexOf('function knownLesson()'), rules.indexOf('function validReading()'));
  const allowed = [...section.matchAll(/'(g[3-6]-[^']+)'/g)].map(match => match[1]).sort();
  const catalog = Object.values(CURRICULUM).flat();
  assert.deepEqual(allowed, catalog.map(t => t.key).sort());
  assert.ok(catalog.every(t => t.lecture.length === 4), 'update reading rules when the lesson structure changes');
});

test('truncated history cannot assert mastery from an incomplete recent topic window', () => {
  const attempts = [...answers([true, true, true, true, true]), ...answers(Array(95).fill(false), CURRICULUM[3][1].key)
    .map((answer, i) => ({ ...answer, sessionId: `other-${i}` }))];
  const capped = curriculumProgressModel({ grade: 3, attempts, historyLimit: 100 });
  assert.equal(capped.historyTruncated, true);
  assert.equal(capped.topics[0].practiceMastered, false);
  assert.equal(curriculumProgressModel({ grade: 3, attempts, historyLimit: 500 }).topics[0].practiceMastered, true);
  const fullTopic = [...answers(Array(10).fill(true)), ...attempts.slice(10)];
  assert.equal(curriculumProgressModel({ grade: 3, attempts: fullTopic, historyLimit: 100 }).topics[0].practiceMastered, true);
});

test('invalid and future attempt dates cannot contribute to mastery', () => {
  const attempts = answers([true, true, true, true, true]);
  const now = new Date(2026, 1, 6).getTime();
  for (const at of [null, undefined, 'bad-date', now + 1]) {
    const model = curriculumProgressModel({ grade: 3, attempts: attempts.map((answer, i) => i === 0 ? { ...answer, at } : answer), now });
    assert.equal(model.topics[0].practiceMastered, false);
  }
});
