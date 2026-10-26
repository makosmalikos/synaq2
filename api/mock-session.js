const { NIS_FORMAT, startNis, updateNis, reconcileNis, isNis } = require('../shared/nis-exam.mjs');
const { getAdmin } = require('../backend/lib/firebase-admin');
const { familyPlan, hasFullAccess } = require('../backend/lib/plans');
const { mockCatalog, createWeeklyMock, createPreviewMock, restoreMock, gradeMock, publicMock } = require('../backend/lib/mock-bank');
const { PRICE_KZT, weeklyWindow, passId } = require('../backend/lib/weekly-mock');
const { sanitizeMockResult } = require('../backend/lib/question-access');

const PREVIEW_SCHOOLS = ['РФМШ', 'БИЛ'];
const SESSION_GRACE_MS = 30 * 60 * 1000;
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value);
const validSchool = (value) => ['РФМШ', 'НИШ', 'БИЛ'].includes(value);

async function childContext(db, user, tx = null) {
  if (!user?.uid || !/^[a-z0-9]+@synaq\.kids$/.test(user.email || '')) throw error('child-required', 403);
  const read = (ref) => tx ? tx.get(ref) : ref.get();
  const indexRef = db.collection('childIndex').doc(user.uid), index = await read(indexRef);
  const parentUid = index.data()?.parentUid;
  if (!index.exists || typeof parentUid !== 'string' || !parentUid || parentUid.includes('/')) throw error('child-required', 403);
  const familyRef = db.collection('families').doc(parentUid);
  const [family, child] = await Promise.all([read(familyRef), read(familyRef.collection('children').doc(user.uid))]);
  if (!family.exists || !child.exists || `${child.data().code}@synaq.kids` !== user.email) throw error('child-required', 403);
  return { family: family.data(), parentUid };
}

const sessionRef = (db, uid, id) => db.collection('mockSessions').doc(`${uid}_${id}`);
const resultRef = (db, uid, id) => db.collection('results').doc(uid).collection('mocks').doc(id);
// A fresh transaction returns a Date; a replay reads a Firestore Timestamp.
// Keep the HTTP result identical before and after recovery.
function serializeMockResult(value) {
  const result = sanitizeMockResult(value);
  const date = result.at == null ? new Date(NaN)
    : typeof result.at.toDate === 'function' ? result.at.toDate() : new Date(result.at);
  return { ...result, at: Number.isFinite(date.getTime()) ? date.toISOString() : null };
}
const publicSession = async (db, session) => ({
  test: publicMock(await restoreMock(db, session)), diagnostic: false, preview: session.preview === true, weekKey: session.weekKey || null,
  startedAt: session.startedAt, deadline: session.deadline, expiresAt: session.expiresAt, serverNow: Date.now(), ...(isNis(session) ? {nis:session.nis, answers:session.nis.answers} : {}),
});

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'auth-required' });
  try {
    const { auth, db } = getAdmin();
    const user = await auth.verifyIdToken(token, true);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw error('bad-body');

    if (body.action === 'catalog') {
      const { family, parentUid } = await childContext(db, user);
      const window = weeklyWindow();
      const pass = await db.collection('weeklyMockPasses').doc(passId(parentUid, window.weekKey)).get();
      const pro = hasFullAccess(familyPlan(family)), paid = pass.exists && pass.data()?.paid === true;
      const schools = await mockCatalog(db);
      return res.status(200).json({ schools, previews: schools.filter(s => PREVIEW_SCHOOLS.includes(s.code)), weekly: {
        ...window, pro, paid, access: pro || paid, priceKzt: PRICE_KZT,
      } });
    }
    if (!validId(body.id)) throw error('bad-request');
    const ref = sessionRef(db, user.uid, body.id);

    if (body.action === 'resume') {
      await childContext(db, user);
      const snapshot = await ref.get();
      if (!snapshot.exists || snapshot.data().uid !== user.uid) throw error('session-not-found', 404);
      let session = snapshot.data();
      if (session.completed) {
        const result = await resultRef(db, user.uid, body.id).get();
        if (!result.exists) throw error('session-not-found', 404);
        return res.status(200).json({ completed: true, result: serializeMockResult(result.data()) });
      }
      if (session.expiresAt <= Date.now()) throw error('session-expired', 410);
      if (isNis(session)) session = await db.runTransaction(async tx => {
        const current = await tx.get(ref); const value = current.data();
        if (value.completed) return value;
        const nis = reconcileNis(value.nis, Date.now());
        const updated = {...value, nis, deadline:nis.deadline || value.expiresAt};
        tx.update(ref, {nis,deadline:updated.deadline}); return updated;
      });
      return res.status(200).json(await publicSession(db, session));
    }

    if (body.action === 'start') {
      if (!validSchool(body.school) || !Array.isArray(body.excludeQuestionIds)
        || body.excludeQuestionIds.length > 2500
        || body.excludeQuestionIds.some((id) => typeof id !== 'string' || !id || id.length > 200 || id.includes('/'))) throw error('bad-request');
      if (body.preview != null && typeof body.preview !== 'boolean') throw error('bad-request');
      const preview = body.preview === true;
      if (preview && !PREVIEW_SCHOOLS.includes(body.school)) throw error('preview-unavailable', 404);
      const window = weeklyWindow();
      if (!preview && body.weekKey != null && body.weekKey !== window.weekKey) throw error('week-changed', 409);
      const prepared = preview ? await createPreviewMock(db, body.school) : await createWeeklyMock(db, body.school, window.weekKey);
      if (!prepared?.questions?.length) throw error('exam-unavailable', 404);
      const now = Date.now(), day = new Date(now + 5 * 3600000).toISOString().slice(0, 10);
      const session = await db.runTransaction(async (tx) => {
        const { family, parentUid } = await childContext(db, user, tx);
        const existing = await tx.get(ref);
        if (existing.exists) {
          const value = existing.data();
          if (value.uid !== user.uid || value.school !== body.school || (value.preview === true) !== preview) throw error('request-conflict', 409);
          return value;
        }
        const plan = familyPlan(family, now);
        const passRef = db.collection('weeklyMockPasses').doc(passId(parentUid, window.weekKey));
        const rateRef = db.collection('mockRateLimits').doc(user.uid);
        const [pass, rate] = await Promise.all([tx.get(passRef), tx.get(rateRef)]);
        if (!preview && !hasFullAccess(plan) && (!pass.exists || pass.data()?.paid !== true)) throw error('weekly-payment-required', 402);
        const rateData = rate.data() || {}, starts = rateData.day === day ? Number(rateData.starts || 0) : 0;
        if (!Number.isSafeInteger(starts) || starts < 0 || starts >= (hasFullAccess(plan) ? 20 : 3)) throw error('rate-limit', 429);
        tx.set(rateRef, { day, starts: starts + 1, updatedAt: new Date(now) });
        const value = { uid: user.uid, attemptId: body.id, school: prepared.school, title: prepared.title,
          timeLimitMin: prepared.timeLimitMin, sections: prepared.sections, shortened: !!prepared.shortened,
          targetCount: prepared.targetCount, ...(prepared.examFormat ? {examFormat:prepared.examFormat} : {}), ...(prepared.scoring === 'rfmsh' ? {scoring:prepared.scoring} : {}), diagnostic: false, preview, weekKey: preview ? null : window.weekKey, startedAt: now,
          deadline: now + prepared.timeLimitMin * 60000,
          expiresAt: now + prepared.timeLimitMin * 60000 + SESSION_GRACE_MS, completed: false,
          questionRefs: prepared.questions.map((question) => ({ id: question.id, num: question.num,
            section: question.section, subject: question.subject || null, ...(prepared.scoring === 'rfmsh' ? {examLevel:question.examLevel} : {}) })),
        };
        if (prepared.examFormat === NIS_FORMAT) {
          value.nis = startNis(now); value.deadline = value.nis.deadline;
          value.expiresAt = now + 7 * 86400000;
        }
        tx.create(ref, value);
        return value;
      });
      if (session.completed) throw error('session-completed', 409);
      if (session.expiresAt <= Date.now()) throw error('session-expired', 410);
      return res.status(200).json(await publicSession(db, session));
    }

    if (body.action === 'phase') {
      const session = await db.runTransaction(async tx => {
        await childContext(db, user, tx);
        const snapshot = await tx.get(ref);
        if (!snapshot.exists || snapshot.data().uid !== user.uid) throw error('session-not-found',404);
        const value = snapshot.data();
        if (!isNis(value) || value.completed) throw error('phase-not-active',409);
        if (value.expiresAt <= Date.now()) throw error('session-expired',410);
        const nis = updateNis(value.nis, body, Date.now());
        const expiresAt = Math.max(value.expiresAt, (nis.deadline || 0) + SESSION_GRACE_MS);
        const deadline = nis.deadline || expiresAt;
        tx.update(ref, {nis, deadline, expiresAt}); return {...value,nis,deadline,expiresAt};
      });
      return res.status(200).json({nis:session.nis,deadline:session.deadline,serverNow:Date.now()});
    }

    if (body.action === 'submit') {
      if (!body.answers || typeof body.answers !== 'object' || Array.isArray(body.answers)
        || Object.keys(body.answers).length > 180
        || Object.entries(body.answers).some(([key, value]) => !/^\d{1,3}$/.test(key)
          || typeof value !== 'string' || value.length > 2000)) throw error('bad-answers');
      await childContext(db, user);
      const before = await ref.get();
      if (!before.exists || before.data().uid !== user.uid) throw error('session-not-found', 404);
      const initial = before.data();
      if (isNis(initial) && !initial.nis.ready) throw error('phases-incomplete',409);
      const graded = await gradeMock(db, initial, isNis(initial) ? initial.nis.answers : body.answers);
      const now = Date.now();
      const result = await db.runTransaction(async (tx) => {
        await childContext(db, user, tx);
        const outRef = resultRef(db, user.uid, body.id);
        const [current, saved] = await Promise.all([tx.get(ref), tx.get(outRef)]);
        if (!current.exists || current.data().uid !== user.uid) throw error('session-not-found', 404);
        if (saved.exists) return saved.data();
        const session = current.data();
        if (session.completed || session.expiresAt < now) throw error(session.completed ? 'session-completed' : 'session-expired', session.completed ? 409 : 410);
        const spentSec = isNis(session) ? session.nis.elapsedSec : Math.max(1, Math.min(session.timeLimitMin * 60, Math.floor((now - session.startedAt) / 1000)));
        const payload = { ...graded, school: session.school, spentSec, limitMin: session.timeLimitMin,
          diagnostic: false, preview: session.preview === true, weekKey: session.weekKey || null, shortened: !!session.shortened,
          targetCount: session.targetCount, sourceId: session.attemptId, verified: true, at: new Date(now) };
        tx.create(outRef, payload);
        tx.update(ref, { completed: true, completedAt: now });
        return payload;
      });
      return res.status(200).json({ result: serializeMockResult(result) });
    }
    throw error('bad-action');
  } catch (cause) {
    if (cause?.code?.startsWith('auth/')) return res.status(401).json({ error: 'auth-required' });
    if (cause instanceof SyntaxError) return res.status(400).json({ error: 'bad-body' });
    if (cause?.status) return res.status(cause.status).json({ error: cause.message });
    console.error('mock-session', cause?.code || cause?.name || 'failed');
    return res.status(503).json({ error: 'temporarily-unavailable' });
  }
};
