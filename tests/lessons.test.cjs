const test = require('node:test');
const assert = require('node:assert/strict');
const { fakeFirestore } = require('./helpers/fake-firestore.cjs');
const lessons = require('../backend/handlers/lessons');
const adminLessons = require('../backend/handlers/admin-lessons');

const H = 3600000;
// Понедельник 2026-10-12 10:00 по Алматы.
const NOW = Date.parse('2026-10-12T10:00:00+05:00');
const res = () => ({ statusCode: 200, body: null, setHeader() {}, status(c) { this.statusCode = c; return this; }, json(v) { this.body = v; return this; } });

function world(planOverrides = {}) {
  const db = fakeFirestore({
    'families/p1': { plan: 'mentor', lessonsPerWeek: 2, planExpiresAt: new Date(NOW + 20 * 86400000), ...planOverrides },
    'childIndex/kid1': { parentUid: 'p1', name: 'Али' },
    'families/p1/children/kid1': { code: 'ali' },
    'mentors/m1': { name: 'Айгерим', active: true, meetLink: 'https://meet.google.com/aaa-bbbb-ccc', rateKzt: 3000,
      slots: [{ day: 3, time: '17:00' }, { day: 5, time: '18:00' }] },
    'mentors/m2': { name: 'Берик', active: true, meetLink: '', slots: [{ day: 3, time: '17:00' }] },
  });
  const auth = { async verifyIdToken(t) {
    if (t === 'kid') return { uid: 'kid1', email: 'ali@synaq.kids' };
    if (t === 'parent') return { uid: 'p1', email: 'mom@mail.com' };
    if (t === 'stranger') return { uid: 'p2', email: 'x@mail.com' };
    if (t === 'admin') return { uid: 'a', email: 'makosmalikos@gmail.com', admin: true, adminAuthVersion: 2 };
    throw Object.assign(new Error('bad'), { code: 'auth/id-token-expired' }); } };
  let clock = NOW;
  const handler = lessons.createHandler({ admin: () => ({ auth, db }), now: () => clock });
  const admin = adminLessons.createHandler({ admin: () => ({ auth, db }), now: () => clock });
  return { db, setNow: (v) => { clock = v; },
    call: async (token, body) => { const r = res(); await handler({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body }, r); return r; },
    adminCall: async (method, body, query = {}) => { const r = res(); await admin({ method, headers: { authorization: 'Bearer admin' }, body, query }, r); return r; } };
}
// Среда 2026-10-14 17:00 Алматы и 2026-10-16 18:00.
const WED = Date.parse('2026-10-14T17:00:00+05:00'), WED2 = Date.parse('2026-10-21T17:00:00+05:00');

test('slots follow the mentor week, 12-hour rule and hide taken ones', async () => {
  const w = world();
  const slots = (await w.call('kid', { action: 'slots', mentorId: 'm1' })).body.slots;
  assert.ok(slots.includes(WED) && slots.includes(WED2));
  assert.ok(slots.every((s) => s >= NOW + 12 * H));
  assert.equal((await w.call('kid', { action: 'book', mentorId: 'm1', startAt: WED, topic: 'Дроби' })).statusCode, 200);
  assert.ok(!(await w.call('kid', { action: 'slots', mentorId: 'm1' })).body.slots.includes(WED));
  assert.equal((await w.call('kid', { action: 'book', mentorId: 'm1', startAt: WED, topic: 'Дроби' })).statusCode, 409);
  assert.equal((await w.call('kid', { action: 'book', mentorId: 'm2', startAt: WED, topic: 'Дроби' })).statusCode, 409); // ребёнок уже занят
  assert.equal((await w.call('kid', { action: 'book', mentorId: 'm1', startAt: WED + 60000, topic: 'x' })).statusCode, 409); // не слот
});

test('only the mentor plan books, quota is enforced and free cancel returns the lesson', async () => {
  assert.equal((await world({ plan: 'pro' }).call('kid', { action: 'book', mentorId: 'm1', startAt: WED, topic: 'Дроби' })).statusCode, 403);
  const w = world({ lessonsPerWeek: 2 });
  const starts = (await w.call('kid', { action: 'slots', mentorId: 'm1' })).body.slots;
  const first = (await w.call('kid', { action: 'book', mentorId: 'm1', startAt: starts[0], topic: 'Дроби', taskIds: ['q1'] })).body.lesson;
  assert.equal((await w.call('kid', { action: 'overview' })).body.plan.left, 7);
  assert.equal((await w.call('parent', { action: 'cancel', id: first.id })).body.status, 'cancelled');
  assert.equal((await w.call('kid', { action: 'overview' })).body.plan.left, 8);
  assert.equal((await w.call('stranger', { action: 'cancel', id: first.id })).statusCode, 403);
  w.db.records.set(`lessonCredits/p1_${w.db.records.get('families/p1').planExpiresAt.getTime()}`, { used: 8 });
  assert.equal((await w.call('kid', { action: 'book', mentorId: 'm1', startAt: starts[1], topic: 'Дроби' })).statusCode, 402);
});

test('late cancel burns the lesson; Meet link opens only 10 minutes before', async () => {
  const w = world();
  const id = (await w.call('kid', { action: 'book', mentorId: 'm1', startAt: WED, topic: 'Дроби' })).body.lesson.id;
  assert.equal((await w.call('kid', { action: 'join', id })).statusCode, 409);
  w.setNow(WED - 9 * 60000);
  assert.equal((await w.call('kid', { action: 'join', id })).body.url, 'https://meet.google.com/aaa-bbbb-ccc');
  assert.equal((await w.call('parent', { action: 'join', id })).statusCode, 200);
  assert.equal((await w.call('stranger', { action: 'join', id })).statusCode, 403);
  w.setNow(WED - 5 * H);
  assert.equal((await w.call('kid', { action: 'cancel', id })).body.status, 'cancelled_late');
  assert.equal((await w.call('kid', { action: 'overview' })).body.plan.left, 7);
});

test('rating after the lesson updates the mentor average once; mentor contacts stay hidden', async () => {
  const w = world();
  const id = (await w.call('kid', { action: 'book', mentorId: 'm1', startAt: WED, topic: 'Дроби' })).body.lesson.id;
  assert.equal((await w.call('kid', { action: 'rate', id, stars: 5 })).statusCode, 409);
  w.setNow(WED + H);
  assert.equal((await w.call('kid', { action: 'rate', id, stars: 5, comment: 'Объясняет понятно' })).statusCode, 200);
  assert.equal((await w.call('kid', { action: 'rate', id, stars: 1 })).statusCode, 409);
  const view = (await w.call('kid', { action: 'overview' })).body;
  const m = view.mentors.find((x) => x.id === 'm1');
  assert.equal(m.rating, 5); assert.equal(m.ratingCount, 1);
  assert.equal(view.previousMentorId, 'm1');
  assert.equal(view.mentors[0].id, 'm1');
  assert.ok(!JSON.stringify(view).includes('meet.google.com'));
});

test('unclear tasks and complaints', async () => {
  const w = world();
  await w.call('kid', { action: 'unclear_add', qid: 'frac_1', topic: 'Дроби' });
  const list = (await w.call('kid', { action: 'unclear_list' })).body.tasks;
  assert.deepEqual(list.map((t) => t.qid), ['frac_1']);
  assert.equal((await w.call('parent', { action: 'unclear_list' })).statusCode, 403);
  await w.call('kid', { action: 'unclear_remove', key: list[0].key });
  assert.equal((await w.call('kid', { action: 'unclear_list' })).body.tasks.length, 0);
  const id = (await w.call('kid', { action: 'book', mentorId: 'm1', startAt: WED, topic: 'Дроби' })).body.lesson.id;
  assert.equal((await w.call('parent', { action: 'complain', id, text: 'Опоздал' })).statusCode, 200);
  const row = (await w.adminCall('GET')).body.lessons[0];
  assert.equal(row.complaint.text, 'Опоздал');
});

test('admin marks no-shows and payouts count only paid lessons', async () => {
  const w = world();
  const a = (await w.call('kid', { action: 'book', mentorId: 'm1', startAt: WED, topic: 'Дроби' })).body.lesson.id;
  const b = (await w.call('kid', { action: 'book', mentorId: 'm1', startAt: WED2, topic: 'Дроби' })).body.lesson.id;
  w.setNow(WED2 + 2 * H);
  assert.equal((await w.adminCall('POST', { id: a, status: 'no_show_mentor' })).statusCode, 200);
  assert.equal((await w.call('kid', { action: 'overview' })).body.plan.left, 7); // вернулся урок наставника
  const p = (await w.adminCall('GET', null, { view: 'payouts', month: '2026-10' })).body;
  assert.equal(p.totalKzt, 3000); // b проведён автоматически, a не оплачивается
  assert.equal(p.mentors[0].lessons, 1);
  assert.equal((await w.adminCall('POST', { id: b, status: 'no_show_child' })).statusCode, 200);
  assert.equal((await w.adminCall('GET', null, { view: 'payouts', month: '2026-10' })).body.totalKzt, 3000); // неявка ребёнка оплачивается
  assert.equal((await w.adminCall('GET', null, { view: 'payouts', month: 'bad' })).statusCode, 400);
});

test('parent can request an upgrade; admin sees it once in the lead inbox', async () => {
  const w = world({ plan: 'pro' });
  assert.equal((await w.call('kid', { action: 'upgrade_request', lessons: 3 })).statusCode, 403);
  assert.equal((await w.call('parent', { action: 'upgrade_request', lessons: 3 })).statusCode, 200);
  assert.equal((await w.call('parent', { action: 'upgrade_request', lessons: 2 })).statusCode, 200);
  const leads = [...w.db.records].filter(([k]) => k.startsWith('leads/'));
  assert.equal(leads.length, 1);
  assert.equal(leads[0][1].status, 'new');
  assert.match(leads[0][1].comment, /3 урока/);
});
