const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');

const enabled = !!process.env.FIREBASE_AUTH_EMULATOR_HOST && !!process.env.FIRESTORE_EMULATOR_HOST;
before(() => {
  if (!enabled) return;
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
  for (const key of ['FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_CONFIG']) delete process.env[key];
  process.env.SYNAQ_USE_EMULATORS = '1';
  process.env.FIREBASE_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT = process.env.GCLOUD_PROJECT = 'demo-synaq-tests';
  process.env.NODE_ENV = 'test';
});
after(async () => {
  if (!enabled) return;
  await require('../backend/lib/firebase-admin').getAdmin().db.terminate();
  const { getApps, deleteApp } = require('firebase-admin/app');
  for (const app of getApps()) await deleteApp(app);
});

test('real center API: invite → parental enrollment → license → practice → teacher journal → revoke', { skip: !enabled, timeout: 120000 }, async () => {
  const { getAdmin } = require('../backend/lib/firebase-admin');
  const { db, auth } = getAdmin();
  const server = require('../backend/server').createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`, suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const createdUsers = [], centers = [];
  const password = `DemoOnly-${suffix}`;
  async function login(email) {
    const response = await fetch('http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await response.json(); assert.equal(response.status, 200, JSON.stringify(data)); return data.idToken;
  }
  async function account(role) {
    const email = `${role}-${suffix}@example.test`;
    const user = await auth.createUser({ email, password, emailVerified: true, displayName: `Test ${role}` }); createdUsers.push(user.uid);
    return { uid: user.uid, email, token: await login(email) };
  }
  async function call(user, endpoint, body, status = 200) {
    const response = await fetch(`${origin}/api/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` }, body: JSON.stringify(body) });
    const data = await response.json(); assert.equal(response.status, status, JSON.stringify(data)); return data;
  }
  try {
    const owner = await account('owner'), teacher = await account('teacher'), parent = await account('parent'), outsider = await account('outsider'), admin = await account('admin');
    process.env.ADMIN_EMAIL_1 = admin.email;
    await auth.setCustomUserClaims(admin.uid, { admin: true, adminAuthVersion: 2 }); admin.token = await login(admin.email);
    await db.collection('families').doc(parent.uid).set({ parentEmail: parent.email, parentName: 'Test Parent' });
    const childResult = await call(parent, 'child-create', { requestId: randomUUID(), code: `kid${suffix}`, name: 'Test Student', klass: '6', pin: password }, 201);
    const child = { uid: childResult.childUid, token: await login(`kid${suffix}@synaq.kids`) }; createdUsers.push(child.uid);
    const centerId = `center-${suffix}`, groupId = `group-${suffix}`; centers.push(centerId);
    await call(owner, 'center', { action: 'create', id: centerId, name: 'Test Center' });
    await call(owner, 'center', { action: 'group', centerId, id: groupId, name: 'NIS 6', teacherUid: owner.uid });
    const invitation = await call(owner, 'center', { action: 'invite', centerId, kind: 'teacher', email: teacher.email });
    await call(outsider, 'center', { action: 'join_staff', code: invitation.code }, 403);
    await call(teacher, 'center', { action: 'join_staff', code: invitation.code });
    await call(owner, 'center', { action: 'group', centerId, id: groupId, name: 'NIS 6', teacherUid: teacher.uid });
    const studentInvite = await call(teacher, 'center', { action: 'invite', centerId, groupId, kind: 'student' });
    await call(parent, 'center', { action: 'enroll', childUid: child.uid, code: studentInvite.code, consent: true });
    await call(parent, 'center', { action: 'enroll', childUid: child.uid, code: studentInvite.code, consent: true });
    const lessonStart = Date.now() + 3600000;
    await call(teacher, 'center', { action: 'schedule_create', centerId, groupId, id: 'lesson', title: 'Live class', startsAt: lessonStart, endsAt: lessonStart + 3600000, weeks: 2 });
    await call(parent, 'center', { action: 'schedule_create', centerId, groupId, id: 'forged', title: 'Forged class', startsAt: lessonStart, endsAt: lessonStart + 3600000 }, 403);
    assert.equal((await call(child, 'center', { action: 'student' })).schedule.length, 2);
    assert.equal((await call(parent, 'center', { action: 'student', childUid: child.uid })).schedule.length, 2);
    await call(teacher, 'center', { action: 'schedule_update', centerId, groupId, id: 'lesson_0', version: 1, title: 'Moved class', startsAt: lessonStart + 7200000, endsAt: lessonStart + 10800000 });
    await call(teacher, 'center', { action: 'schedule_cancel', centerId, groupId, id: 'lesson_0', version: 2 });
    assert.equal((await call(child, 'center', { action: 'student' })).schedule[0].status, 'cancelled');
    const expiresAt = Date.now() + 86400000;
    await call(owner, 'center', { action: 'license', centerId, active: true, seatLimit: 30, expiresAt }, 403);
    await call(admin, 'center', { action: 'license', centerId, active: true, seatLimit: 30, expiresAt });
    await call(teacher, 'center', { action: 'assign', centerId, groupId, id: `assignment-${suffix}`, title: 'Numbers', topicId: 'num', target: 1, dueAt: Date.now() + 3600000 });
    const { questions } = await call(child, 'learning', { action: 'questions', topicId: 'num', mixed: false, excludeIds: [], limit: 1 });
    assert.equal(questions.length, 1); assert.equal(questions[0].answer, undefined);
    const attemptId = randomUUID();
    await call(child, 'learning', { action: 'start', id: attemptId, mode: 'training', qid: questions[0].id });
    const privateQuestion = await require('../backend/lib/training-question').findTrainingQuestion(db, questions[0].id);
    const answer = await call(child, 'learning', { action: 'answer', id: attemptId, answer: String(privateQuestion.answer) });
    assert.equal(answer.correct, true);
    await call(child, 'learning', { action: 'answer', id: attemptId, answer: String(privateQuestion.answer) });
    const journal = await call(teacher, 'center', { action: 'workspace', groupId });
    assert.equal(journal.students.length, 1);
    assert.equal(journal.students[0].progress[`assignment-${suffix}`].answered, 1);
    assert.equal(journal.students[0].progress[`assignment-${suffix}`].status, 'completed');
    assert.equal((await call(child, 'center', { action: 'student' })).enrollment.licensed, true);
    assert.equal((await call(child, 'learning', { action: 'count' })).limit, null);
    assert.equal((await call(child, 'mock-session', { action: 'catalog' })).weekly.pro, true);
    await call(outsider, 'center', { action: 'student', childUid: child.uid }, 403);
    await call(parent, 'center', { action: 'leave', childUid: child.uid });
    assert.equal((await call(child, 'learning', { action: 'count' })).limit, 5);
    assert.equal((await call(teacher, 'center', { action: 'workspace', groupId })).students.length, 0);
    assert.equal((await db.collection('results').doc(child.uid).collection('attempts').get()).size, 1);
    assert.equal((await db.collection('families').doc(parent.uid).get()).data().plan, undefined);
  } finally {
    await new Promise(resolve => server.close(resolve));
    // Only records created by this test are removed; never clear shared emulators.
    for (const uid of createdUsers) {
      await auth.deleteUser(uid);
      for (const collection of ['families', 'childIndex', 'centerStaff', 'centerSeats', 'results']) await db.recursiveDelete(db.collection(collection).doc(uid));
    }
    for (const id of centers) {
      const invites = await db.collection('centerInvites').where('centerId', '==', id).get();
      await Promise.all(invites.docs.map(doc => doc.ref.delete()));
      for (const collection of ['centers', 'centerLicenses', 'centerInviteRates']) await db.recursiveDelete(db.collection(collection).doc(id));
    }
  }
});
