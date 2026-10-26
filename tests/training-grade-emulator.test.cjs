const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { isSchoolCourse } = require('../backend/lib/training-grade');
const { isFreePreview } = require('../backend/lib/free-preview');

const enabled = !!process.env.FIREBASE_AUTH_EMULATOR_HOST && !!process.env.FIRESTORE_EMULATOR_HOST;
before(() => {
  if (!enabled) return;
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
  for (const key of ['FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_CONFIG']) delete process.env[key];
  process.env.SYNAQ_USE_EMULATORS = '1';
  process.env.FIREBASE_PROJECT_ID = 'demo-synaq-tests';
  process.env.GOOGLE_CLOUD_PROJECT = process.env.GCLOUD_PROJECT = 'demo-synaq-tests';
  process.env.NODE_ENV = 'test';
});
after(async () => {
  if (!enabled) return;
  const { getApps, deleteApp } = require('firebase-admin/app');
  await require('../backend/lib/firebase-admin').getAdmin().db.terminate();
  for (const app of getApps()) await deleteApp(app);
});

test('authenticated learning endpoint enforces reviewed paid publication, live plans and school-grade ceilings', { skip: !enabled, timeout: 60000 }, async () => {
  const { getAdmin } = require('../backend/lib/firebase-admin');
  const { loadEmulatorClient, sdk } = require('./helpers/emulator-browser-client.cjs');
  const { auth, db } = getAdmin();
  const realBank = require('../backend/lib/standard-bank').getStandardBank();
  const review = require('../problems/reviews/synaq-standard-editions.json');
  assert.equal(realBank.length, review.summary.verifiedEditions);
  assert.ok(realBank.length >= 51, 'The original reviewed bank must remain available');
  const realPrivate = realBank.find(q => q.topic === 'stats' && q.grade === 6 && !isFreePreview(q));
  assert.ok(realPrivate);
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const uid = `grade_child_${suffix}`, parentUid = `grade_parent_${suffix}`, code = `grade${suffix}`;
  const childRef = db.collection('families').doc(parentUid).collection('children').doc(uid);
  const fixtures = [4,5,6].map(grade => ({ id: `synaq_adapted_emulator_${suffix}_g${grade}`, grade,
    minimumPlan: 'pro', editorialStatus: 'verified', sourceProvider: 'zerek', practiceOnly: true,
    subject: 'math', school: 'Математика', topic: 'num', statement: '2 + 2?', answer: '4', solution: '2+2=4', status: 'published' }));
  const originalIds = [`zerek_crypt_${suffix}`, `zerek_${suffix}_01`, `zerek_course_${suffix}`, `zerek_course_extra_${suffix}`];
  const allFixtures = [...fixtures, ...originalIds.map(id => ({ ...fixtures[0], id, statement: 'Withdrawn source condition' }))];
  const client = await loadEmulatorClient(`grade-ceiling-${suffix}`);
  const server = require('../backend/server').createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    await auth.createUser({ uid, email: `${code}@synaq.kids`, password: 'test-grade-pin-123' });
    await db.collection('families').doc(parentUid).set({ parentName: 'Grade test', plan: 'pro' });
    await childRef.set({ code, name: 'Grade test', klass: '4' });
    await db.collection('childIndex').doc(uid).set({ parentUid, code, klass: '4', linkedByServer: true });
    await Promise.all(allFixtures.map(q => db.collection('bankTasks').doc(q.id).set(q)));
    await client.loginChild(code, 'test-grade-pin-123');
    const token = await client.auth.currentUser.getIdToken();
    const post = async body => {
      const response = await fetch(`${origin}/api/learning`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      return { status: response.status, body: await response.json() };
    };
    const list = { action: 'questions', topicId: 'num', mixed: false, excludeIds: [], limit: 60 };
    for (const request of [list, { ...list, mixed: true }, { ...list, grade: 6, klass: '6', gradeCeiling: 6 }]) {
      const result = await post(request);
      assert.equal(result.status, 200);
      assert.equal(result.body.questions.length, 60);
      assert.equal(result.body.questions.some(q => isSchoolCourse(q) && q.grade > 4), false);
      assert.equal(result.body.questions.some(q => q.answer !== undefined || q.solution !== undefined), false);
    }
    const catalog4 = await post({ action: 'topics', gradeCeiling: 6 });
    assert.equal(catalog4.status, 200);
    const youngerStats = await post({ ...list, topicId: 'stats', grade: 6, gradeCeiling: 6, plan: 'mentor' });
    assert.equal(youngerStats.status, 200);
    assert.ok(youngerStats.body.questions.length>0);
    assert.equal(youngerStats.body.questions.some(q=>q.grade>4),false);
    const { POOL } = await import('../frontend/src/bank.js');
    const course = grade => fixtures.find(q => q.grade === grade);
    const start = qid => post({ action: 'start', mode: 'training', id: randomUUID(), qid, grade: 6, klass: '6', gradeCeiling: 6 });
    const denied = await start(course(6).id);
    assert.equal(denied.status, 404);
    assert.equal(denied.body.error, 'question-unavailable');
    assert.equal((await start(realPrivate.id)).status,404);
    const legacy = POOL.find(q => !isSchoolCourse(q) && q.grade == null && q.answer != null);
    assert.equal((await start(legacy.id)).status, 200);

    await childRef.update({ klass: '6' });
    for (const grade of [4, 5, 6]) {
      const result = await start(course(grade).id);
      assert.equal(result.status, 200);
      assert.equal(result.body.question.grade, grade);
    }
    const catalog6 = await post({ action: 'topics' });
    const realQuestions = await post({ ...list, topicId: 'stats' });
    assert.equal(realQuestions.status, 200);
    assert.ok(realQuestions.body.questions.some(q => q.id === realPrivate.id));
    assert.equal(realQuestions.body.questions.some(q => q.answer !== undefined || q.solution !== undefined), false);
    const count = result => result.body.topics.reduce((sum, topic) => sum + topic.count, 0);
    assert.ok(count(catalog6) > count(catalog4));
    await childRef.update({ klass: '' });
    assert.equal((await start(course(6).id)).status, 200);
    for (const qid of originalIds) assert.equal((await start(qid)).status, 404);
    const paid = await start(realPrivate.id), pending = await start(realPrivate.id);
    assert.equal(paid.status,200);assert.equal(pending.status,200);
    assert.equal(paid.body.question.statement,realPrivate.statement);
    assert.equal((await post({ action: 'answer', id: paid.body.id, answer: String(realPrivate.answer) })).body.gain, 5);
    await db.collection('families').doc(parentUid).update({ plan: 'free' });
    const spoof = { plan: 'mentor', pro: true, minimumPlan: 'free', editorialStatus: 'verified' };
    for (const body of [
      { action: 'start', mode: 'training', id: randomUUID(), qid: realPrivate.id },
      { action: 'start', mode: 'training', id: pending.body.id, qid: realPrivate.id },
      { action: 'answer', id: pending.body.id, answer: String(realPrivate.answer) },
      { action: 'answer', id: paid.body.id, answer: String(realPrivate.answer) },
    ]) {
      const denied = await post({ ...body, ...spoof });
      assert.equal(denied.status, 403); assert.deepEqual(denied.body, { error: 'pro-required' });
    }
    const free = await post({ ...list, ...spoof });
    assert.equal(free.status, 200);
    assert.equal(free.body.questions.some(q => q.id.startsWith('zerek_')), false);
    for (const q of free.body.questions.filter(q => q.id.startsWith('synaq_adapted_'))) {
      assert.ok(isFreePreview(realBank.find(item => item.id === q.id)), 'Only unchanged reviewed Free sampler editions may be public');
    }
    const freeStats=await post({...list,topicId:'stats',...spoof});assert.equal(freeStats.status,200);assert.deepEqual(freeStats.body.questions,[]);
    assert.deepEqual((await post({ action: 'count', ...spoof })).body, { count: 1, day: new Date(Date.now()+5*3600000).toISOString().slice(0,10), limit: 5 });
    for (const plan of ['standard','pro','mentor']) {
      await db.collection('families').doc(parentUid).update({ plan });
      const result = await start(realPrivate.id);
      assert.equal(result.status, plan === 'standard' ? 403 : 200, plan);
    }
    await db.collection('families').doc(parentUid).update({ plan: 'pro', planExpiresAt: 1 });
    assert.equal((await start(realPrivate.id)).status, 403);
  } finally {
    await client.logout();
    await sdk.terminate(client.db);
    await sdk.deleteApp(client.auth.app);
    const sessions = await db.collection('learningSessions').where('uid', '==', uid).get();
    await Promise.all(sessions.docs.map(doc => doc.ref.delete()));
    await Promise.all([db.recursiveDelete(db.collection('families').doc(parentUid)), db.recursiveDelete(db.collection('results').doc(uid)),
      ...allFixtures.map(q => db.collection('bankTasks').doc(q.id).delete()),
      db.collection('childIndex').doc(uid).delete(), db.collection('learningRateLimits').doc(uid).delete(),
      auth.deleteUser(uid).catch(error => { if (error.code !== 'auth/user-not-found') throw error; })]);
    await new Promise(resolve => { server.close(resolve); server.closeIdleConnections?.(); });
  }
});
