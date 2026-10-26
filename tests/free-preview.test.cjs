const test = require('node:test');
const assert = require('node:assert/strict');
const { getStandardBank } = require('../backend/lib/standard-bank');
const { isFreePreview } = require('../backend/lib/free-preview');
const { questionAccessAllowed } = require('../backend/lib/question-access');
const { content } = require('../api/learning');
const { createLearningService } = require('../backend/lib/learning-service');
const { fakeFirestore } = require('./helpers/fake-firestore.cjs');
function childStore(seed) {
  const db = fakeFirestore(seed), originalCollection = db.collection, originalTransaction = db.runTransaction;
  const collection = path => {
    const value = originalCollection(path);
    return { ...value, doc(id) { const ref = value.doc(id); ref.collection = name => collection(`${ref.path}/${name}`); return ref; } };
  };
  db.collection = collection;
  db.runTransaction = callback => originalTransaction(tx => callback({ ...tx, get: ref => ref.path ? tx.get(ref) : ref.get() }));
  return db;
}
const selected = getStandardBank().filter(isFreePreview);

test('only six unchanged reviewed editions are opened; aliases and edited copies stay closed', () => {
  assert.equal(selected.length, 6);
  for (const q of selected) {
    assert.equal(questionAccessAllowed(q, 'free'), true);
    for (const changed of [{ ...q, answer: 'forged' }, { ...q, statement: 'replacement' }, { ...q, grade: 1 }, { ...q, id: `${q.id}_copy`, originalId: q.id }]) {
      assert.equal(isFreePreview(changed), false);
      assert.equal(questionAccessAllowed(changed, 'free'), false);
    }
  }
  assert.ok(selected.some(q => q.image));
  assert.equal(getStandardBank().filter(q => questionAccessAllowed(q, 'free')).length, 6);
});

test('preview selection respects grade and exclusions and never returns answer keys', async () => {
  const c = content(fakeFirestore());
  for (const gradeCeiling of [3,4,5,6]) {
    const rows = await c.getTrainingQuestions({ topicId: 'free-preview', excludeIds: [], limit: 60, gradeCeiling, plan: 'free' });
    assert.equal(rows.length, gradeCeiling < 4 ? 0 : 6);
    assert.ok(rows.every(q => selected.some(s => s.id === q.id) && !Object.hasOwn(q,'answer') && !Object.hasOwn(q,'solution')));
    const topics = await c.getTrainingTopics({ gradeCeiling, plan: 'free' });
    assert.equal(topics.find(t => t.id === 'free-preview')?.count || 0, rows.length);
  }
  assert.equal((await c.getTrainingQuestions({ topicId: 'free-preview', excludeIds: selected.map(q => q.id), limit: 60, gradeCeiling: 6, plan: 'free' })).length, 0);
});

test('real Free sampler sessions grade on the server and still enforce the five-task allowance', async () => {
  const db = childStore({ 'childIndex/kid': { parentUid: 'parent' }, 'families/parent': { plan: 'free' }, 'families/parent/children/kid': { code: 'student', klass: 4 } });
  const act = createLearningService({ db, ...content(db) });
  const user = { uid: 'kid', email: 'student@synaq.kids' };
  for (let i = 0; i < 5; i++) {
    const q = selected[i], id = `free_sample_${i}`;
    const session = await act(user, { action:'start', mode:'training', qid:q.id, id });
    assert.equal(session.question.answer, undefined);
    const result = await act(user, { action:'answer', id, answer:q.answer });
    assert.equal(result.correct, true); assert.equal(result.count, i + 1);
  }
  await assert.rejects(act(user, { action:'start', mode:'training', qid:selected[5].id, id:'free_sample_over' }), /daily-limit/);
  const paid = getStandardBank().find(q => !isFreePreview(q));
  const fresh = childStore({ 'childIndex/kid': { parentUid: 'parent' }, 'families/parent': { plan: 'free' }, 'families/parent/children/kid': { code: 'student', klass: 6 } });
  await assert.rejects(createLearningService({ db:fresh, ...content(fresh) })(user, { action:'start', mode:'training', qid:paid.id, id:'paid_still_locked' }), /pro-required/);
});

test('both full free mocks use the fixed reviewed demo selection and grade their displayed keys', async () => {
  const { createPreviewMock, restoreMock, publicMock, gradeMock } = require('../backend/lib/mock-bank');
  const { PUBLIC_MOCKS } = await import('../frontend/src/publicMockData.generated.js');
  const db = fakeFirestore();
  for (const school of ['РФМШ','БИЛ']) {
    const variant = await createPreviewMock(db, school), repeat = await createPreviewMock(db, school);
    assert.deepEqual(variant, repeat);
    assert.equal(variant.questions.length, school === 'БИЛ' ? 60 : 30);
    assert.equal(variant.shortened, false);
    assert.deepEqual(variant.questions.map(q => `public-${school}-${q.id}`), PUBLIC_MOCKS[school].questions.map(q => q.id));
    for (const q of variant.questions) {
      if (school === 'БИЛ') { assert.equal(q.options.length, 4); assert.ok(q.options.includes(q.answer)); }
      else { assert.ok(!q.options); assert.match(String(q.answer), /^-?\d+$/); }
      assert.ok(q.solution);
    }
    const session = { ...variant, preview: true, attemptId:'real_free_preview', questionRefs:variant.questions.map(q=>({id:q.id,num:q.num,section:q.section,subject:q.subject,...(variant.scoring === 'rfmsh' ? {examLevel:q.examLevel} : {})})) };
    const restored = await restoreMock(db, session);
    assert.deepEqual(restored.questions.map(q => q.options), variant.questions.map(q => q.options));
    assert.ok(publicMock(restored).questions.every(q => !Object.hasOwn(q,'answer') && !Object.hasOwn(q,'solution')));
    const result = await gradeMock(db, session, Object.fromEntries(variant.questions.map(q=>[q.num,String(q.answer)])));
    assert.equal(result.score, school === 'БИЛ' ? 60 : 30);
    if (school === 'БИЛ') assert.equal(result.points, 240);
    assert.ok(result.review.every(q=>q.correct));
  }
  assert.equal(await createPreviewMock(db, 'НИШ'), null);
});
