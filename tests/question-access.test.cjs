const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
const access = require('../backend/lib/question-access');
const { fakeFirestore } = require('./helpers/fake-firestore.cjs');
const { selectQuestions, createDuelService } = require('../backend/lib/duel-service');
const { memoryDb } = require('./helpers/memory-db.cjs');
const legacy = { id: 'legacy-question', statement: '2+2?', answer: '4', solution: '2+2=4', options: ['3','4'], school: 'БИЛ', subject: 'math', topic: 'num' };
const adapted = { ...legacy, id: 'synaq_adapted_verified_test', minimumPlan: 'pro', editorialStatus: 'verified', sourceProvider: 'zerek' };
const originals = ['zerek_crypt_01', 'zerek_02c8cf84-6eb2-4fff-b411-8f69e54951b1_01', 'zerek_course_0000000000000004', 'zerek_course_extra_0000000000000004'].map(id => ({ ...legacy, id }));

test('all original namespaces stay unavailable on every plan; only reviewed separate adaptations can be paid', () => {
  for (const q of [...originals, { ...adapted, id: 'renamed-original' }, { ...adapted, originalId: 'zerek_crypt_01' }]) {
    for (const plan of ['free','standard','pro','mentor']) assert.equal(access.questionAccessAllowed(q, plan), false, `${q.id}:${plan}`);
  }
  for (const q of [adapted, { ...adapted, sourceProvider: undefined }]) {
    assert.equal(access.questionAccessAllowed(q, 'free'), false);
    assert.equal(access.questionAccessAllowed(q, 'standard'), false, 'retired internal standard is not the public Standard tier');
    assert.equal(access.questionAccessAllowed(q, 'pro'), true);
    assert.equal(access.questionAccessAllowed(q, 'mentor'), true);
  }
  for (const override of [{ editorialStatus: undefined }, { editorialStatus: 'draft' }, { minimumPlan: undefined }, { minimumPlan: 'free' }, { minimumPlan: 'standard' }, { minimumPlan: 'unknown' }]) {
    assert.equal(access.questionAccessAllowed({ ...adapted, ...override }, 'mentor'), false, JSON.stringify(override));
  }
  assert.equal(access.questionAccessAllowed({ ...adapted, minimumPlan: 'mentor' }, 'pro'), false);
  assert.equal(access.questionAccessAllowed({ ...adapted, minimumPlan: 'mentor' }, 'mentor'), true);
  for (const plan of ['free','standard','pro','mentor']) assert.equal(access.questionAccessAllowed(legacy, plan), true);
});

test('active server lists and topic counts apply verified access before limit, with no answer fields', async () => {
  const seed = Object.fromEntries([...originals, adapted, { ...adapted, id: 'synaq_adapted_draft_test', editorialStatus: 'draft' }, { ...legacy, id: 'renamed-source', sourceProvider: 'zerek' }]
    .map(q => [`bankTasks/${q.id}`, { ...q, status: 'published' }]));
  const db = fakeFirestore(seed), provider = require('../api/learning').content(db);
  const request = { topicId: 'num', mixed: false, excludeIds: [], limit: 100000 };
  const free = await provider.getTrainingQuestions(request), retired = await provider.getTrainingQuestions({ ...request, plan: 'standard' });
  const paid = await provider.getTrainingQuestions({ ...request, plan: 'pro' }), mentor = await provider.getTrainingQuestions({ ...request, plan: 'mentor' });
  assert.equal(free.some(q => q.id === adapted.id), false);
  assert.equal(retired.some(q => q.id === adapted.id), false);
  assert.ok(paid.some(q => q.id === adapted.id)); assert.ok(mentor.some(q => q.id === adapted.id));
  for (const rows of [free, retired, paid, mentor]) {
    assert.equal(rows.some(q => q.id.startsWith('zerek_') || q.id === 'synaq_adapted_draft_test' || q.id === 'renamed-source'), false);
    assert.equal(rows.some(q => q.answer !== undefined || q.solution !== undefined), false);
  }
  const [catalogFree, catalogPaid] = await Promise.all([provider.getTrainingTopics(), provider.getTrainingTopics({ plan: 'pro' })]);
  assert.equal(catalogPaid.find(t => t.id === 'num').count - catalogFree.find(t => t.id === 'num').count,
    paid.length - free.length);
  const { findTrainingQuestion } = require('../backend/lib/training-question');
  for (const q of originals) assert.equal(await findTrainingQuestion(db, q.id), null);
  assert.equal(await findTrainingQuestion(db, 'synaq_adapted_draft_test'), null);
  assert.equal(await findTrainingQuestion(db, 'renamed-source'), null);
  assert.equal((await findTrainingQuestion(db, adapted.id)).minimumPlan, 'pro');
});

test('public mock selection, weekly selection and restoration reject restricted content independently of practiceOnly', async () => {
  const pool = [legacy, ...originals, adapted], filename = path.resolve(__dirname, '../backend/lib/mock-bank.js');
  const realRequire = createRequire(filename);
  const context = { module: { exports: {} }, require: id => id === './published-bank' ? { loadPublishedBank: async () => pool } : realRequire(id) };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  const bank = context.module.exports;
  const catalog = await bank.mockCatalog({});
  assert.equal(catalog.find(s => s.code === 'БИЛ').count, 1);
  for (const variant of [await bank.createMock({}, 'БИЛ'), await bank.createWeeklyMock({}, 'БИЛ', '2026-10-19')]) {
    assert.deepEqual(Array.from(variant.questions, q => q.id), [legacy.id]);
    assert.equal(bank.publicMock(variant).questions[0].answer, undefined);
  }
  for (const q of [...originals, adapted]) {
    await assert.rejects(bank.restoreMock({}, { school: 'БИЛ', questionRefs: [{ id: q.id, num: 1, section: 1 }] }), /question_unavailable/);
    assert.throws(() => bank.publicMock({ questions: [q] }), /question-unavailable/);
  }
});

test('shared duels never select restricted tasks and reject an older room containing one', async () => {
  const available = Array.from({length:15},(_,i)=>({...legacy,id:`legacy-${i}`}));
  const restricted = [...originals, adapted];
  assert.throws(() => selectQuestions([...available.slice(1), ...restricted]), /bank_unavailable/);
  assert.deepEqual(new Set(selectQuestions([...available, ...restricted]).map(q=>q.id)),new Set(available.map(q=>q.id)));
  const db=memoryDb(), act=createDuelService({db,getPool:async()=>available,newCode:()=> 'ABCDEF'});
  await act({uid:'host'},{action:'create'});
  db.records.get('duels/ABCDEF').questions[0]={...originals[0]};
  db.records.get('duelPrivate/ABCDEF').questions[0]={...originals[0]};
  await assert.rejects(act({uid:'guest'},{action:'join',code:'ABCDEF'}),/bank_unavailable/);
  assert.equal(db.records.get('duels/ABCDEF').guest,null);
});

test('old mock review redaction retains scores and unrelated rows without exposing restricted fields', () => {
  const allowed={...legacy,qid:legacy.id,num:1,your:'4',correct:true};
  const closed=[...originals,adapted].map((q,i)=>({...q,qid:q.id,num:i+2,your:'4',correct:true,note:'private'}));
  const source={score:6,total:6,review:[allowed,...closed]}, before=JSON.stringify(source);
  const clean=access.sanitizeMockResult(source);
  assert.equal(JSON.stringify(source),before);assert.equal(clean.score,source.score);assert.equal(clean.review[0],allowed);
  for(const row of clean.review.slice(1)){
    assert.equal(row.unavailable,true);assert.equal(row.correct,true);
    for(const field of ['statement','solution','answer','options','image','note','your'])assert.equal(Object.hasOwn(row,field),false,field);
  }
});
