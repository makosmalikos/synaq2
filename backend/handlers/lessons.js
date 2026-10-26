// POST /api/lessons — запись ребёнка на урок с наставником и всё вокруг неё.
// Ребёнок и родитель общаются с этим обработчиком, наставник кабинета не имеет.
// Ссылка Google Meet выдаётся только действием `join` за 10 минут до начала.
const { createHash, randomUUID } = require('node:crypto');
const { getAdmin } = require('../lib/firebase-admin');
const { familyPlan, millis } = require('../lib/plans');
const L = require('../lib/lessons');
const { mentorTaskPreviews } = require('../lib/mentor-task-previews');
const { notifyAdmin } = require('../lib/admin-notify');

const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const safeId = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const text = (v, max) => String(v ?? '').trim().slice(0, max);

async function context(db, user) {
  if (/^[a-z0-9]+@synaq\.kids$/.test(user.email || '')) {
    const index = await db.collection('childIndex').doc(user.uid).get();
    const parentUid = index.data()?.parentUid;
    if (!index.exists || typeof parentUid !== 'string' || !parentUid || parentUid.includes('/')) throw fail('child_required', 403);
    const family = await db.collection('families').doc(parentUid).get();
    if (!family.exists) throw fail('child_required', 403);
    return { role: 'child', parentUid, childUid: user.uid, childName: text(index.data()?.name, 80), family: family.data() };
  }
  if (!user.email) throw fail('login_required', 401);
  const family = await db.collection('families').doc(user.uid).get();
  if (!family.exists) throw fail('family_required', 403);
  return { role: 'parent', parentUid: user.uid, family: family.data() };
}

function planInfo(family, now) {
  const plan = familyPlan(family, now);
  const periodEnd = millis(family.planExpiresAt ?? family.proExpiresAt);
  const lessonsPerWeek = [2, 3].includes(Number(family.lessonsPerWeek)) ? Number(family.lessonsPerWeek) : 2;
  return { active: plan === 'mentor' && periodEnd > now, lessonsPerWeek, quota: lessonsPerWeek * 4, periodEnd };
}
const creditRef = (db, parentUid, periodEnd) => db.collection('lessonCredits').doc(`${parentUid}_${periodEnd}`);

const publicMentor = (id, m) => ({ id, name: m.name || '', bio: m.bio || '',
  rating: m.ratingCount ? Math.round((m.ratingSum / m.ratingCount) * 10) / 10 : null, ratingCount: Number(m.ratingCount) || 0,
  comments: Array.isArray(m.recentComments) ? m.recentComments.slice(0, 3) : [] });

function publicLesson(id, l, now) {
  const status = L.effectiveStatus(l, now);
  return { id, mentorId: l.mentorId, mentorName: l.mentorName, childName: l.childName || '', startAt: l.startAt, endAt: l.endAt,
    topic: l.topic || '', taskIds: l.taskIds || [], status, rating: l.rating || null, complained: !!l.complaint,
    canJoin: status === 'booked' && now >= l.startAt - L.JOIN_BEFORE_MS && now <= l.endAt + L.JOIN_AFTER_MS,
    canCancel: status === 'booked' && now < l.startAt, freeCancel: now <= l.startAt - L.FREE_CANCEL_MS };
}

async function activeMentors(db) {
  const snap = await db.collection('mentors').where('active', '==', true).limit(100).get();
  return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

async function takenStarts(db, mentorId, now, periodEnd) {
  // Old slot locks remain for history. Restrict the query before applying its
  // cap, otherwise a busy mentor's past lessons can hide current reservations.
  const snap = await db.collection('lessonSlots').where('mentorId', '==', mentorId)
    .where('startAt', '>=', now + L.MIN_AHEAD_MS)
    .where('startAt', '<', Math.min(periodEnd, now + L.MAX_AHEAD_MS + 1))
    .orderBy('startAt').limit(1000).get();
  return new Set(snap.docs.map((d) => d.data().startAt));
}

const recentLessons = (db, ctx) => db.collection('lessons')
  .where(ctx.role === 'child' ? 'childUid' : 'parentUid', '==', ctx.role === 'child' ? ctx.childUid : ctx.parentUid)
  .orderBy('startAt', 'desc').limit(60).get();

async function ownLesson(db, ctx, id) {
  if (!safeId(id)) throw fail('bad_request');
  const snap = await db.collection('lessons').doc(id).get();
  const l = snap.data();
  if (!snap.exists || (ctx.role === 'child' ? l.childUid !== ctx.childUid : l.parentUid !== ctx.parentUid)) throw fail('not_found', 404);
  return { ref: snap.ref || db.collection('lessons').doc(id), l };
}

const ACTIONS = {
  async overview(db, ctx, _body, now) {
    const info = planInfo(ctx.family, now);
    const snap = await recentLessons(db, ctx);
    const all = snap.docs.map((d) => ({ id: d.id, l: d.data() })).sort((a, b) => b.l.startAt - a.l.startAt);
    const used = info.active ? (await creditRef(db, ctx.parentUid, info.periodEnd).get()).data()?.used || 0 : 0;
    // Список наставников нужен только семьям с активным тарифом: остальным не тратим чтения.
    const mentors = info.active ? (await activeMentors(db)).map((m) => publicMentor(m.id, m.data)) : [];
    const previous = all.find((x) => ['completed', 'no_show_child'].includes(L.effectiveStatus(x.l, now)))?.l.mentorId || null;
    mentors.sort((a, b) => (b.id === previous) - (a.id === previous) || (b.rating || 0) - (a.rating || 0));
    return { plan: { active: info.active, lessonsPerWeek: info.lessonsPerWeek, quota: info.quota, used: Math.min(used, info.quota * 3),
      left: Math.max(0, info.quota - used), periodEnd: info.periodEnd || null },
      lessons: all.slice(0, 60).map((x) => publicLesson(x.id, x.l, now)), mentors, previousMentorId: previous, now };
  },

  // Уведомления считаются из текущего состояния (ничего отдельно не хранится),
  // «прочитано» запоминает сам клиент по стабильному ключу.
  async notifications(db, ctx, _body, now) {
    const info = planInfo(ctx.family, now);
    const items = [];
    const plan = familyPlan(ctx.family, now);
    const expiresAt = millis(ctx.family.planExpiresAt ?? ctx.family.proExpiresAt);
    if (plan !== 'free' && ctx.family.cancelAtPeriodEnd === true && expiresAt - now <= 3 * 86400000 && expiresAt > now) {
      items.push({ key: `plan_ending:${expiresAt}`, kind: 'plan_ending', days: Math.max(1, Math.ceil((expiresAt - now) / 86400000)), at: now });
    }
    if (!info.active) return { items };
    const snap = await recentLessons(db, ctx);
    const lessons = snap.docs.map((d) => ({ id: d.id, l: d.data() }));
    const used = (await creditRef(db, ctx.parentUid, info.periodEnd).get()).data()?.used || 0;
    const left = Math.max(0, info.quota - used);
    const upcoming = lessons.filter((x) => L.effectiveStatus(x.l, now) === 'booked' && x.l.endAt > now).sort((a, b) => a.l.startAt - b.l.startAt);
    const next = upcoming[0];
    if (next) {
      const l = next.l;
      if (now >= l.startAt - L.JOIN_BEFORE_MS && now <= l.endAt) items.push({ key: `lesson_now:${next.id}`, kind: 'lesson_now', startAt: l.startAt, mentorName: l.mentorName, at: now });
      else if (l.startAt - now <= 24 * 3600000) items.push({ key: `lesson_today:${next.id}`, kind: 'lesson_today', startAt: l.startAt, mentorName: l.mentorName, at: l.startAt - 24 * 3600000 });
    }
    if (left > 0 && !upcoming.length) items.push({ key: `book_prompt:${info.periodEnd}:${left}`, kind: 'book_prompt', left, at: now });
    const daysLeft = Math.ceil((info.periodEnd - now) / 86400000);
    if (left > 0 && daysLeft <= 7) items.push({ key: `period_ending:${info.periodEnd}:${left}`, kind: 'period_ending', left, days: Math.max(1, daysLeft), at: now });
    for (const { id, l } of lessons) {
      const status = L.effectiveStatus(l, now);
      if (now - l.endAt > 7 * 86400000) continue;
      if (status === 'completed' && !l.rating && ctx.role === 'child') items.push({ key: `rate_prompt:${id}`, kind: 'rate_prompt', mentorName: l.mentorName, at: l.endAt });
      if (status === 'no_show_mentor') items.push({ key: `credit_returned:${id}`, kind: 'credit_returned', mentorName: l.mentorName, at: l.endAt });
    }
    return { items: items.sort((a, b) => b.at - a.at) };
  },

  async slots(db, ctx, body, now) {
    const info = planInfo(ctx.family, now);
    if (!info.active || !safeId(body.mentorId)) throw fail('mentor_plan_required', 403);
    const m = (await db.collection('mentors').doc(body.mentorId).get());
    if (!m.exists || m.data().active === false) throw fail('not_found', 404);
    const taken = await takenStarts(db, body.mentorId, now, info.periodEnd);
    return { slots: L.slotStarts(m.data().slots, now, info.periodEnd).filter((s) => !taken.has(s)) };
  },

  async book(db, ctx, body, now) {
    if (ctx.role !== 'child') throw fail('child_required', 403);
    const startAt = Number(body.startAt);
    if (!safeId(body.mentorId) || !Number.isSafeInteger(startAt)) throw fail('bad_request');
    const topic = text(body.topic, 80);
    if (!topic) throw fail('topic_required');
    const taskIds = Array.isArray(body.taskIds) ? body.taskIds.map((q) => text(q, 200)).filter(Boolean).slice(0, 10) : [];
    const id = `l_${randomUUID().replaceAll('-', '')}`;
    return db.runTransaction(async (tx) => {
      const familyRef = db.collection('families').doc(ctx.parentUid);
      const mentorRef = db.collection('mentors').doc(body.mentorId);
      const mentorLock = db.collection('lessonSlots').doc(`m_${body.mentorId}_${startAt}`);
      const childLock = db.collection('lessonSlots').doc(`c_${ctx.childUid}_${startAt}`);
      const [family, mentor, mLock, cLock] = await Promise.all([tx.get(familyRef), tx.get(mentorRef), tx.get(mentorLock), tx.get(childLock)]);
      const info = planInfo(family.data() || {}, now);
      if (!info.active) throw fail('mentor_plan_required', 403);
      if (!mentor.exists || mentor.data().active === false) throw fail('not_found', 404);
      if (!L.isSlot(mentor.data().slots, startAt, now, info.periodEnd)) throw fail('slot_unavailable', 409);
      if (mLock.exists || cLock.exists) throw fail('slot_taken', 409);
      const cRef = creditRef(db, ctx.parentUid, info.periodEnd);
      const credit = await tx.get(cRef);
      const used = credit.data()?.used || 0;
      if (used >= info.quota) throw fail('no_credits', 402);
      const lesson = { parentUid: ctx.parentUid, childUid: ctx.childUid, childName: ctx.childName, mentorId: body.mentorId,
        mentorName: mentor.data().name || '', startAt, endAt: startAt + L.LESSON_MS, topic, taskIds, status: 'booked',
        creditKey: cRef.id, rateKzt: Number(mentor.data().rateKzt) || 3000, createdAt: new Date(now) };
      tx.create(db.collection('lessons').doc(id), lesson);
      tx.create(mentorLock, { lessonId: id, mentorId: body.mentorId, startAt });
      tx.create(childLock, { lessonId: id, childUid: ctx.childUid, startAt });
      tx.set(cRef, { parentUid: ctx.parentUid, periodEnd: info.periodEnd, used: used + 1 }, { merge: true });
      return { lesson: publicLesson(id, lesson, now) };
    });
  },

  async cancel(db, ctx, body, now) {
    if (!safeId(body.id)) throw fail('bad_request');
    return db.runTransaction(async (tx) => {
      const lRef = db.collection('lessons').doc(body.id);
      const snap = await tx.get(lRef);
      const l = snap.data();
      if (!snap.exists || (ctx.role === 'child' ? l.childUid !== ctx.childUid : l.parentUid !== ctx.parentUid)) throw fail('not_found', 404);
      if (l.status !== 'booked' || now >= l.startAt) throw fail('cannot_cancel', 409);
      const free = now <= l.startAt - L.FREE_CANCEL_MS;
      const cRef = db.collection('lessonCredits').doc(l.creditKey);
      const credit = free ? await tx.get(cRef) : null;
      tx.update(lRef, { status: free ? 'cancelled' : 'cancelled_late', cancelledAt: new Date(now), cancelledBy: ctx.role });
      tx.delete(db.collection('lessonSlots').doc(`m_${l.mentorId}_${l.startAt}`));
      tx.delete(db.collection('lessonSlots').doc(`c_${l.childUid}_${l.startAt}`));
      if (free) tx.set(cRef, { used: Math.max(0, (credit.data()?.used || 1) - 1) }, { merge: true });
      return { status: free ? 'cancelled' : 'cancelled_late' };
    });
  },

  async join(db, ctx, body, now) {
    const { l } = await ownLesson(db, ctx, body.id);
    if (L.effectiveStatus(l, now) !== 'booked' || now < l.startAt - L.JOIN_BEFORE_MS || now > l.endAt + L.JOIN_AFTER_MS) throw fail('too_early', 409);
    const mentor = await db.collection('mentors').doc(l.mentorId).get();
    const link = mentor.data()?.meetLink;
    if (!link) throw fail('no_link', 409);
    return { url: link };
  },

  async rate(db, ctx, body, now) {
    const stars = Number(body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw fail('bad_request');
    const comment = text(body.comment, 300);
    return db.runTransaction(async (tx) => {
      const lRef = db.collection('lessons').doc(safeId(body.id) ? body.id : 'x');
      const snap = await tx.get(lRef);
      const l = snap.data();
      if (!snap.exists || (ctx.role === 'child' ? l.childUid !== ctx.childUid : l.parentUid !== ctx.parentUid)) throw fail('not_found', 404);
      if (L.effectiveStatus(l, now) !== 'completed' || l.rating) throw fail('cannot_rate', 409);
      const mRef = db.collection('mentors').doc(l.mentorId);
      const m = (await tx.get(mRef)).data() || {};
      const recent = [...(comment ? [comment] : []), ...(m.recentComments || [])].slice(0, 5);
      tx.update(lRef, { rating: stars, ratingComment: comment, ratedAt: new Date(now), ratedBy: ctx.role });
      tx.set(mRef, { ratingSum: (m.ratingSum || 0) + stars, ratingCount: (m.ratingCount || 0) + 1, recentComments: recent }, { merge: true });
      return { ok: true };
    });
  },

  async complain(db, ctx, body, now) {
    const message = text(body.text, 500);
    if (!message) throw fail('bad_request');
    const { ref } = await ownLesson(db, ctx, body.id);
    await ref.set({ complaint: { text: message, by: ctx.role, at: new Date(now) } }, { merge: true });
    return { ok: true };
  },

  // Родитель на Standard просит перейти на Pro с наставником: админ видит заявку во входящих.
  async upgrade_request(db, ctx, body) {
    if (ctx.role !== 'parent') throw fail('parent_required', 403);
    const lessons = [2, 3].includes(Number(body.lessons)) ? Number(body.lessons) : 2;
    await notifyAdmin(db, { id: `upgrade_${ctx.parentUid}`, source: 'mentor_upgrade_request', name: ctx.family.parentName,
      comment: `Хочет перейти на Pro с наставником: ${lessons} урока в неделю. Сейчас тариф: ${familyPlan(ctx.family, Date.now())}. Email: ${ctx.family.parentEmail || '—'}` });
    return { ok: true };
  },

  // «Непонятная» задача: ребёнок отмечает её, потом прикладывает к записи.
  async unclear_add(db, ctx, body, now) {
    if (ctx.role !== 'child') throw fail('child_required', 403);
    const qid = text(body.qid, 200);
    if (!qid || qid.includes('/')) throw fail('bad_request');
    const key = createHash('sha256').update(qid).digest('hex').slice(0, 24);
    await db.collection('unclearTasks').doc(`${ctx.childUid}_${key}`).set({ childUid: ctx.childUid, qid, topic: text(body.topic, 80), at: new Date(now) });
    return { ok: true };
  },
  async unclear_list(db, ctx, _body, now) {
    if (ctx.role !== 'child') throw fail('child_required', 403);
    const snap = await db.collection('unclearTasks').where('childUid', '==', ctx.childUid).limit(100).get();
    const items = snap.docs.map((d) => ({ key: d.id, ...d.data() })).sort((a, b) => millis(b.at) - millis(a.at)).slice(0, 30);
    return { tasks: await mentorTaskPreviews(db, items, undefined, { plan: familyPlan(ctx.family, now) }) };
  },
  async unclear_remove(db, ctx, body) {
    if (ctx.role !== 'child') throw fail('child_required', 403);
    const key = text(body.key, 200);
    if (!key.startsWith(`${ctx.childUid}_`) || key.includes('/')) throw fail('bad_request');
    await db.collection('unclearTasks').doc(key).delete();
    return { ok: true };
  },
};

function createHandler({ admin = getAdmin, now = Date.now } = {}) {
  return async function lessonsHandler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    try {
      const { auth, db } = admin();
      const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
      if (!token) return res.status(401).json({ error: 'login_required' });
      const user = await auth.verifyIdToken(token, true);
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const action = ACTIONS[body.action];
      if (!Object.prototype.hasOwnProperty.call(ACTIONS, body.action) || !action) return res.status(400).json({ error: 'bad_request' });
      const ctx = await context(db, user);
      return res.status(200).json(await action(db, ctx, body, now()));
    } catch (error) {
      if (error?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
      if (error?.code?.startsWith?.('auth/')) return res.status(401).json({ error: 'login_required' });
      if (error?.status) return res.status(error.status).json({ error: error.message });
      if (error instanceof SyntaxError) return res.status(400).json({ error: 'bad_request' });
      console.error('lessons', error?.code || error?.message || error);
      return res.status(500).json({ error: 'failed' });
    }
  };
}

const handler = createHandler();
handler.createHandler = createHandler;
module.exports = handler;
