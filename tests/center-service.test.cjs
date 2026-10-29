const test = require('node:test');
const assert = require('node:assert/strict');
const { createCenterService, assignmentProgress } = require('../backend/lib/center-service');
const { learningFamily } = require('../backend/lib/center-access');
const { familyPlan } = require('../backend/lib/plans');
const { createLearningService } = require('../backend/lib/learning-service');
const { centerMemory } = require('./helpers/center-memory.cjs');
const { createHandler } = require('../backend/handlers/center');

function fixture() {
  let time = Date.parse('2026-10-26T10:00:00Z');
  const owner = { uid: 'owner', email: 'owner@example.test', name: 'Owner' };
  const teacher = { uid: 'teacher', email: 'teacher@example.test', email_verified: true, name: 'Teacher' };
  const parent = { uid: 'parent', email: 'parent@example.test' };
  const child = { uid: 'child', email: 'student@synaq.kids' };
  const admin = { uid: 'admin', email: 'makosmalikos@gmail.com', admin: true, adminAuthVersion: 2 };
  const db = centerMemory({ 'families/parent': {}, 'families/parent/children/child': { name: 'Student', code: 'student', klass: '6' }, 'childIndex/child': { parentUid: 'parent' } });
  const act = createCenterService({ db, now: () => time, topics: async () => [{ id: 'num', count: 20, name: 'Сандар', nameRu: 'Числа' }] });
  const create = () => act(owner, { action: 'create', name: 'Test Academy', id: 'center' });
  const group = (id = 'group', teacherUid = owner.uid) => act(owner, { action: 'group', centerId: 'center', id, name: id, teacherUid });
  const invite = (kind = 'student', groupId = 'group') => act(owner, { action: 'invite', centerId: 'center', groupId, kind, email: teacher.email });
  const enroll = code => act(parent, { action: 'enroll', code, childUid: child.uid, consent: true });
  const assign = (uid = owner, groupId = 'group') => act(uid, { action: 'assign', centerId: 'center', groupId, id: 'assignment', title: 'Practice', topicId: 'num', target: 2, dueAt: time + 3600000 });
  const license = (active = true, seatLimit = 30) => act(admin, { action: 'license', centerId: 'center', active, seatLimit, expiresAt: time + 86400000 });
  return { db, act, owner, teacher, parent, child, admin, create, group, invite, enroll, assign, license, now: () => time, advance: ms => { time += ms; } };
}

test('center creation is idempotent and roles cannot cross tenants or groups', async () => {
  const f = fixture();
  await f.create(); await f.create();
  assert.equal(f.db.records.get('centers/center').staffCount, 1);
  await assert.rejects(f.act(f.child, { action: 'create', name: 'Fake', id: 'fake' }), /invalid_center/);
  await assert.rejects(f.act(f.owner, { action: 'create', name: 'Duplicate', id: 'other' }), /already_staff/);
  const invitation = await f.invite('teacher');
  await assert.rejects(f.act({ ...f.teacher, email: 'attacker@example.test' }, { action: 'join_staff', code: invitation.code }), /invite_email_mismatch/);
  await assert.rejects(f.act({ ...f.teacher, email_verified: false }, { action: 'join_staff', code: invitation.code }), /verified_email_required/);
  await f.act(f.teacher, { action: 'join_staff', code: invitation.code });
  await f.group(); await f.group('teacher-group', f.teacher.uid);
  await assert.rejects(f.assign(f.teacher), /not_allowed/);
  await f.assign(f.teacher, 'teacher-group');
  const view = await f.act(f.teacher, { action: 'workspace', groupId: 'group' });
  assert.deepEqual(view.groups.map(g => g.id), ['teacher-group']);
  assert.equal(view.selectedGroupId, 'teacher-group');
  await assert.rejects(f.act(f.teacher, { action: 'group', centerId: 'center', id: 'forged', name: 'Forged', teacherUid: f.teacher.uid }), /owner_required/);
  await assert.rejects(f.act(f.teacher, { action: 'invite', centerId: 'center', kind: 'teacher', email: 'other@example.test' }), /owner_required/);
  const outsider = { uid: 'other-owner', email: 'other@example.test' };
  await f.act(outsider, { action: 'create', name: 'Other Center', id: 'other-center' });
  await assert.rejects(f.act(outsider, { action: 'invite', centerId: 'center', groupId: 'group', kind: 'student' }), /not_allowed/);
  await assert.rejects(f.act(f.teacher, { action: 'archive_assignment', centerId: 'other-center', groupId: 'teacher-group', id: 'assignment' }), /not_allowed/);
  await f.act(f.owner, { action: 'remove_teacher', centerId: 'center', teacherUid: f.teacher.uid });
  assert.equal((await f.act(f.teacher, { action: 'workspace' })).center, null);
  assert.equal(f.db.records.get('centers/center/groups/teacher-group').teacherUid, f.owner.uid);
  await assert.rejects(f.assign(f.teacher, 'teacher-group'), /not_allowed/);
  await assert.rejects(f.act(f.teacher, { action: 'join_staff', code: invitation.code }), /already_staff/);
});

test('enrollment requires parent ownership and consent, rotating invitations revoke old codes', async () => {
  const f = fixture(); await f.create(); await f.group();
  const old = await f.invite(), current = await f.invite();
  await assert.rejects(f.enroll(old.code), /invite_expired/);
  await assert.rejects(f.act(f.parent, { action: 'enroll', code: current.code, childUid: f.child.uid }), /consent_required/);
  await assert.rejects(f.act(f.child, { action: 'enroll', code: current.code, childUid: f.child.uid, consent: true }), /invalid_invite/);
  await assert.rejects(f.act({ uid: 'stranger', email: 'stranger@test.invalid' }, { action: 'enroll', code: current.code, childUid: f.child.uid, consent: true }), /not_child_owner/);
  await Promise.all([f.enroll(current.code), f.enroll(current.code)]);
  assert.equal(f.db.records.get('centers/center').studentCount, 1);
  assert.equal((await f.act(f.child, { action: 'student' })).enrollment.groupName, 'group');
  await assert.rejects(f.act(f.child, { action: 'student', childUid: 'another' }), /not_allowed/);
  await assert.rejects(f.act(f.teacher, { action: 'student', childUid: f.child.uid }), /not_child_owner/);
  await f.act(f.parent, { action: 'leave', childUid: f.child.uid });
  await f.act(f.parent, { action: 'leave', childUid: f.child.uid });
  assert.equal(f.db.records.get('centers/center').studentCount, 0);
  assert.equal((await f.act(f.child, { action: 'student' })).enrollment, null);
  f.advance(8 * 86400000);
  await assert.rejects(f.enroll(current.code), /invite_expired/);
});

test('seat limit is atomic under concurrent enrollment and owner cannot grant a license', async () => {
  const f = fixture(); await f.create(); await f.group(); await f.license(true, 1);
  const code = (await f.invite()).code;
  f.db.records.set('families/parent2', {});
  f.db.records.set('families/parent2/children/child2', { name: 'Second', code: 'student2' });
  f.db.records.set('childIndex/child2', { parentUid: 'parent2' });
  const results = await Promise.allSettled([f.enroll(code), f.act({ uid: 'parent2', email: 'parent2@example.test' }, { action: 'enroll', code, childUid: 'child2', consent: true })]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.match(results.find(r => r.status === 'rejected').reason.message, /seat_limit/);
  assert.equal(f.db.records.get('centers/center').studentCount, 1);
  await assert.rejects(f.act(f.owner, { action: 'license', centerId: 'center', active: true, expiresAt: f.now() + 86400000, seatLimit: 100 }), /not_allowed/);
  await assert.rejects(f.act({ ...f.admin, email: 'attacker@example.test' }, { action: 'admin_list' }), /not_allowed/);
});

test('journal counts only distinct verified training answers after assignment and enrollment', async () => {
  const f = fixture(); await f.create(); await f.group(); await f.assign();
  f.advance(1000); await f.enroll((await f.invite()).code);
  const attempt = (key, extra) => f.db.records.set(`results/child/attempts/${key}`, { qid: key, topic: 'num', correct: true, verified: true, at: new Date(f.now()), ...extra });
  attempt('before', { at: new Date(f.now() - 1) });
  attempt('unverified', { verified: false }); attempt('other-topic', { topic: 'geo' });
  attempt('curriculum', { curriculumTopicKey: 'g5-natural' });
  f.advance(2000); attempt('q1', {}); attempt('q1-replay', { qid: 'q1' });
  let view = await f.act(f.owner, { action: 'workspace' });
  assert.equal(view.students[0].progress.assignment.answered, 1);
  assert.equal(view.students[0].progress.assignment.status, 'in_progress');
  f.advance(3600000); attempt('q2', { correct: false });
  view = await f.act(f.owner, { action: 'workspace' });
  assert.equal(view.students[0].progress.assignment.status, 'late');
  assert.equal(view.students[0].progress.assignment.accuracy, 50);
  assert.equal(JSON.stringify(view).includes('unverified'), false);
  await f.act(f.owner, { action: 'remove_student', centerId: 'center', groupId: 'group', childUid: 'child' });
  assert.equal((await f.act(f.owner, { action: 'workspace' })).students.length, 0);
  assert.equal(f.db.records.has('results/child/attempts/q1'), true);
});

test('assignment validation, replay, archive and overdue semantics', async () => {
  const f = fixture(); await f.create(); await f.group();
  const invalid = { action: 'assign', centerId: 'center', groupId: 'group', id: 'assignment', title: 'Test', topicId: 'invalid', target: 2, dueAt: f.now() + 1000 };
  await assert.rejects(f.act(f.owner, invalid), /invalid_assignment/);
  await assert.rejects(f.act(f.owner, { ...invalid, topicId: 'num', target: 21 }), /invalid_assignment/);
  assert.equal(f.db.records.has('centers/center/assignments/assignment'), false);
  await f.assign(); await f.assign();
  await assert.rejects(f.act(f.owner, { ...invalid, topicId: 'num', title: 'Changed request' }), /id_conflict/);
  assert.equal(f.db.records.get('centers/center/groups/group').assignmentCount, 1);
  const a = f.db.records.get('centers/center/assignments/assignment');
  assert.equal(assignmentProgress(a, { joinedAt: a.createdAt }, [], a.dueAt + 1).status, 'overdue');
  await f.act(f.owner, { action: 'archive_assignment', centerId: 'center', groupId: 'group', id: 'assignment' });
  assert.equal((await f.act(f.owner, { action: 'workspace' })).assignments.length, 0);
});

test('bounded journals explicitly report truncation rather than silently claiming complete data', async () => {
  const f = fixture(); await f.create(); await f.group(); await f.enroll((await f.invite()).code); await f.assign();
  for (let i = 0; i < 1001; i++) f.db.records.set(`results/child/attempts/a${i}`, {
    qid: `q${i}`, topic: 'geo', verified: true, correct: true, at: new Date(f.now()),
  });
  const view = await f.act(f.owner, { action: 'workspace' });
  assert.equal(view.students[0].truncated, true);
  assert.equal(view.students[0].progress.assignment.answered, 0);
});

test('center license unlocks paid questions, expires and revokes without changing family subscriptions', async () => {
  const f = fixture(); await f.create(); await f.group(); await f.enroll((await f.invite()).code);
  const family = { plan: 'free' };
  assert.equal(familyPlan(await learningFamily(f.db, 'child', family, null, f.now()), f.now()), 'free');
  await f.license();
  assert.equal(familyPlan(await learningFamily(f.db, 'child', family, null, f.now()), f.now()), 'pro');
  const mentor = { plan: 'mentor' };
  assert.equal(await learningFamily(f.db, 'child', mentor, null, f.now()), mentor);
  assert.equal(f.db.records.get('families/parent').plan, undefined);
  const learning = createLearningService({ db: f.db, now: f.now, getTrainingQuestion: async () => ({ id: 'paid-q', statement: '2+2', answer: '4', topic: 'num', minimumPlan: 'pro' }), gradeAnswer: async () => true });
  await learning(f.child, { action: 'start', id: 'session-one', mode: 'training', qid: 'paid-q' });
  assert.equal((await learning(f.child, { action: 'count' })).limit, null);
  await f.license(false);
  await assert.rejects(learning(f.child, { action: 'answer', id: 'session-one', answer: '4' }), /pro-required/);
  assert.equal((await learning(f.child, { action: 'count' })).limit, 5);
  await f.license(); f.advance(86400001);
  assert.equal(familyPlan(await learningFamily(f.db, 'child', family, null, f.now()), f.now()), 'free');
});

test('center endpoint rejects missing, revoked and malformed credentials and hides internal errors', async () => {
  let called = false;
  const handler = createHandler({ admin: () => ({ auth: { verifyIdToken: async (token, revoked) => {
    assert.equal(revoked, true);
    if (token !== 'valid') throw Object.assign(Error('bad'), { code: 'auth/id-token-expired' });
    return { uid: 'u', email: 'u@example.test' };
  } }, db: {} }), service: () => async () => { called = true; return { center: null }; } });
  const invoke = async (method, token, body) => {
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method, headers: { authorization: token ? `Bearer ${token}` : '' }, body }, res); return res;
  };
  assert.equal((await invoke('GET', 'valid', {})).statusCode, 405);
  assert.equal((await invoke('POST', '', {})).statusCode, 401);
  assert.equal((await invoke('POST', 'revoked', {})).statusCode, 401);
  assert.equal((await invoke('POST', 'valid', '{')).statusCode, 400);
  assert.equal(called, false);
  assert.equal((await invoke('POST', 'valid', {})).statusCode, 200);
});

test('center schedule is shared only with the assigned group and its parents; leaving revokes it', async () => {
  const f = fixture(); await f.create(); await f.group(); await f.group('other-group');
  await f.enroll((await f.invite()).code);
  const event = { action: 'schedule_create', centerId: 'center', groupId: 'group', id: 'math', title: 'Math', startsAt: f.now() + 3600000, endsAt: f.now() + 7200000, location: 'Room 2', notes: 'Bring a notebook', weeks: 3 };
  await f.act(f.owner, event); await f.act(f.owner, event);
  const student = await f.act(f.child, { action: 'student' });
  assert.equal(student.schedule.length, 3);
  assert.equal(student.schedule[1].startsAt - student.schedule[0].startsAt, 7 * 86400000);
  assert.equal(student.enrollment.teacherName, 'Owner');
  assert.deepEqual((await f.act(f.parent, { action: 'student', childUid: f.child.uid })).schedule, student.schedule);
  assert.equal((await f.act(f.owner, { action: 'workspace', groupId: 'other-group' })).schedule.length, 0);
  await assert.rejects(f.act(f.teacher, { action: 'student', childUid: f.child.uid }), /not_child_owner/);
  await assert.rejects(f.act(f.child, { ...event, id: 'hacked' }), /not_allowed/);
  await assert.rejects(f.act(f.parent, { ...event, id: 'hacked' }), /not_allowed/);
  await f.act(f.parent, { action: 'leave', childUid: f.child.uid });
  assert.deepEqual((await f.act(f.child, { action: 'student' })).schedule, []);
});

test('schedule edits use versions, cancellations remain visible and a weekly series is atomic', async () => {
  const f = fixture(); await f.create(); await f.group(); await f.enroll((await f.invite()).code);
  const event = { action: 'schedule_create', centerId: 'center', groupId: 'group', id: 'lesson', title: 'Class', startsAt: f.now() + 3600000, endsAt: f.now() + 7200000 };
  await f.act(f.owner, event);
  await assert.rejects(f.act(f.owner, { ...event, title: 'changed' }), /id_conflict/);
  await assert.rejects(f.act(f.owner, { ...event, id: 'overlap', weeks: 3 }), /lesson_overlap/);
  assert.equal((await f.act(f.child, { action: 'student' })).schedule.length, 1);
  await f.act(f.owner, { ...event, action: 'schedule_update', id: 'lesson_0', version: 1, startsAt: f.now() + 10800000, endsAt: f.now() + 14400000 });
  await assert.rejects(f.act(f.owner, { ...event, action: 'schedule_update', id: 'lesson_0', version: 1 }), /lesson_changed/);
  await f.act(f.owner, { action: 'schedule_cancel', centerId: 'center', groupId: 'group', id: 'lesson_0', version: 2 });
  assert.equal((await f.act(f.child, { action: 'student' })).schedule[0].status, 'cancelled');
  await assert.rejects(f.act(f.owner, { ...event, action: 'schedule_update', id: 'lesson_0', version: 3 }), /lesson_closed/);
});

test('schedule validates times, HTTPS links and teacher isolation', async () => {
  const f = fixture(); await f.create(); await f.group();
  await f.act(f.teacher, { action: 'join_staff', code: (await f.invite('teacher')).code });
  await f.group('teacher-group', f.teacher.uid);
  const event = { action: 'schedule_create', centerId: 'center', groupId: 'group', id: 'lesson', title: 'Class', startsAt: f.now() + 3600000, endsAt: f.now() + 7200000 };
  await assert.rejects(f.act(f.teacher, event), /not_allowed/);
  await f.act(f.teacher, { ...event, groupId: 'teacher-group', meetingUrl: 'https://example.test/lesson' });
  for (const change of [{ meetingUrl: 'javascript:alert(1)' }, { meetingUrl: 'https://user:pass@example.test' }, { startsAt: f.now() - 1 }, { endsAt: event.startsAt + 60000 }, { weeks: 13 }, { weeks: 0 }, { startsAt: f.now() + 100 * 86400000, endsAt: f.now() + 101 * 86400000 }]) {
    await assert.rejects(f.act(f.owner, { ...event, ...change }), /invalid_lesson/);
  }
  const outcomes = await Promise.allSettled([f.act(f.owner, event), f.act(f.owner, { ...event, id: 'concurrent' })]);
  assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1);
  assert.match(outcomes.find(outcome => outcome.status === 'rejected').reason.message, /lesson_overlap/);
  const view = await f.act(f.teacher, { action: 'workspace', groupId: 'group' });
  assert.equal(view.selectedGroupId, 'teacher-group');
  assert.equal(view.schedule[0].meetingUrl, 'https://example.test/lesson');
});

test('schedule includes lessons after many cancellations and explicitly reports its read limit', async () => {
  const f = fixture(); await f.create(); await f.group(); await f.enroll((await f.invite()).code);
  const path = 'centers/center/groups/group/schedule/';
  for (let i = 0; i < 260; i++) f.db.records.set(`${path}cancelled-${i}`, { startsAt: f.now() + i + 1, endsAt: f.now() + i + 3600000, status: 'cancelled' });
  f.db.records.set(`${path}next`, { startsAt: f.now() + 86400000, endsAt: f.now() + 90000000, status: 'scheduled' });
  let result = await f.act(f.child, { action: 'student' });
  assert.equal(result.schedule.length, 261);
  assert.equal(result.schedule.at(-1).id, 'next');
  assert.equal(result.scheduleTruncated, false);
  for (let i = 260; i < 1001; i++) f.db.records.set(`${path}cancelled-${i}`, { startsAt: f.now() + i + 1, endsAt: f.now() + i + 3600000, status: 'cancelled' });
  result = await f.act(f.child, { action: 'student' });
  assert.equal(result.schedule.length, 1000);
  assert.equal(result.scheduleTruncated, true);
  assert.equal((await f.act(f.owner, { action: 'workspace' })).scheduleTruncated, true);
});
