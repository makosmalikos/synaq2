// Creates fictional B2B demonstration data only in the guarded local project.
// No .env is loaded and no production credentials are accepted.
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
if (process.env.SYNAQ_USE_EMULATORS !== '1' || process.env.FIREBASE_PROJECT_ID !== 'demo-synaq-tests'
  || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:19099' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:18080') {
  throw Error('Run only against demo-synaq-tests on local Auth and Firestore emulators.');
}

async function main() {
  const { db, auth } = require('../backend/lib/firebase-admin').getAdmin();
  const { createCenterService } = require('../backend/lib/center-service');
  const topics = (await import('../frontend/src/topicCatalog.generated.js')).STATIC_TOPICS;
  const suffix = randomUUID().replaceAll('-', '').slice(0, 10), password = `DemoOnly-${suffix}`;
  let clock = Date.now() - 3 * 86400000;
  const act = createCenterService({ db, now: () => clock, topics: async () => topics });
  const account = async (email, name) => {
    const record = await auth.createUser({ email, password, displayName: name, emailVerified: true });
    return { uid: record.uid, email, name, email_verified: true };
  };
  const owner = await account(`center-demo-${suffix}@example.test`, 'Айдана');
  const teacher = await account(`teacher-demo-${suffix}@example.test`, 'Мадина');
  const centerId = `demo-center-${suffix}`, groupId = `demo-group-${suffix}`;
  await act(owner, { action: 'create', id: centerId, name: 'Bilim Academy' });
  const invitation = await act(owner, { action: 'invite', centerId, kind: 'teacher', email: teacher.email });
  await act(teacher, { action: 'join_staff', code: invitation.code });
  await act(owner, { action: 'group', centerId, id: groupId, name: 'НИШ · 6 класс · утро', teacherUid: teacher.uid });
  await act(owner, { action: 'group', centerId, id: `demo-bil-${suffix}`, name: 'БИЛ · 6 класс · вечер', teacherUid: owner.uid });
  const code = (await act(owner, { action: 'invite', centerId, groupId, kind: 'student' })).code;
  const names = ['Амина Серик', 'Алихан Омар', 'Айша Нур', 'Данияр Ермек', 'Медина Асан', 'Арсен Кайрат', 'София Иванова', 'Ислам Бек', 'Аружан Али', 'Тимур Кан'];
  const children = [], parents = [];
  for (let i = 0; i < names.length; i++) {
    const parent = await account(`parent-${i}-${suffix}@example.test`, `Демо родитель ${i + 1}`);
    const child = await account(`demo${i}${suffix}@synaq.kids`, names[i]);
    const code = `demo${i}${suffix}`;
    await db.collection('families').doc(parent.uid).set({ parentEmail: parent.email, parentName: parent.name });
    await db.collection('families').doc(parent.uid).collection('children').doc(child.uid).set({ code, name: names[i], klass: '6' });
    await db.collection('childIndex').doc(child.uid).set({ parentUid: parent.uid, code, name: names[i], klass: '6', avatar: 'owl' });
    children.push(child); parents.push(parent);
  }
  for (let i = 0; i < children.length; i++) await act(parents[i], { action: 'enroll', childUid: children[i].uid, code, consent: true });
  const assignments = [
    { id: `demo-num-${suffix}`, title: 'Числа и делимость', topicId: 'num', target: 10, dueAt: Date.now() + 86400000 },
    { id: `demo-frac-${suffix}`, title: 'Закрепляем дроби', topicId: 'frac', target: 8, dueAt: Date.now() - 86400000 },
    { id: `demo-eq-${suffix}`, title: 'Уравнения без ошибок', topicId: 'eq', target: 5, dueAt: Date.now() + 2 * 86400000 },
  ];
  clock += 1000;
  for (const a of assignments) await act(teacher, { action: 'assign', centerId, groupId, ...a, instructions: 'Повтори тему и реши задачи самостоятельно. Разберём сложные места на следующем занятии.' });
  const batch = db.batch();
  for (let i = 0; i < children.length; i++) for (let j = 0; j < assignments.length; j++) {
    const a = assignments[j], count = i < 4 ? a.target : i === 9 ? 0 : Math.max(0, a.target - (i - 2) * (j + 1));
    for (let k = 0; k < count; k++) batch.set(db.collection('results').doc(children[i].uid).collection('attempts').doc(`demo-${j}-${k}`), {
      qid: `demo-${a.topicId}-${k}`, topic: a.topicId, verified: true, correct: (i + k) % 5 !== 0,
      at: new Date(clock + (k + 1) * 60000), secs: 60, demoOnly: true,
    });
  }
  batch.set(db.collection('centerLicenses').doc(centerId), { name: 'Bilim Academy', active: true, seatLimit: 30, expiresAt: Date.now() + 30 * 86400000, updatedAt: Date.now(), demoOnly: true });
  await batch.commit();
  clock = Date.now();
  await act(teacher, { action: 'schedule_create', centerId, groupId, id: `demo-lessons-${suffix}`,
    title: 'Математика · дроби', startsAt: clock + 86400000, endsAt: clock + 90000000, weeks: 3,
    location: 'Кабинет 204', notes: 'Возьми тетрадь и повтори сложение дробей.' });
  const output = '/tmp/synaq-center-demo.json';
  fs.writeFileSync(output, JSON.stringify({ demoOnly: true, centerId, groupId, owner: owner.email, teacher: teacher.email,
    parent: parents[0].email, child: children[0].email, password }, null, 2), { mode: 0o600 });
  console.log(`Fictional demo created. Local-only login details: ${output}`);
  await db.terminate();
  const { getApps, deleteApp } = require('firebase-admin/app');
  await Promise.all(getApps().map(deleteApp));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
