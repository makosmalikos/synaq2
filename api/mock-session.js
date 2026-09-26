const { getAdmin } = require('../backend/lib/firebase-admin');
const { familyPlan } = require('../backend/lib/plans');
const { mockCatalog, createMock, restoreMock, gradeMock, publicMock } = require('../backend/lib/mock-bank');

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
const publicSession = async (db, session) => ({
  test: publicMock(await restoreMock(db, session)), diagnostic: session.diagnostic === true,
  startedAt: session.startedAt, deadline: session.deadline, expiresAt: session.expiresAt,
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
      await childContext(db, user);
      return res.status(200).json({ schools: await mockCatalog(db) });
    }
    if (!validId(body.id)) throw error('bad-request');
    const ref = sessionRef(db, user.uid, body.id);

    if (body.action === 'resume') {
      await childContext(db, user);
      const snapshot = await ref.get();
      if (!snapshot.exists || snapshot.data().uid !== user.uid) throw error('session-not-found', 404);
      const session = snapshot.data();
      if (session.completed) {
        const result = await resultRef(db, user.uid, body.id).get();
        if (!result.exists) throw error('session-not-found', 404);
        return res.status(200).json({ completed: true, result: result.data() });
      }
      if (session.expiresAt <= Date.now()) throw error('session-expired', 410);
      return res.status(200).json(await publicSession(db, session));
    }

    if (body.action === 'start') {
      if (!validSchool(body.school) || !Array.isArray(body.excludeQuestionIds)
        || body.excludeQuestionIds.length > 1000
        || body.excludeQuestionIds.some((id) => typeof id !== 'string' || !id || id.length > 200 || id.includes('/'))) throw error('bad-request');
      const prepared = await createMock(db, body.school, body.excludeQuestionIds);
      if (!prepared?.questions?.length) throw error('exam-unavailable', 404);
      const now = Date.now(), day = new Date(now + 5 * 3600000).toISOString().slice(0, 10);
      const session = await db.runTransaction(async (tx) => {
        const { family } = await childContext(db, user, tx);
        const existing = await tx.get(ref);
        if (existing.exists) {
          const value = existing.data();
          if (value.uid !== user.uid || value.school !== body.school) throw error('request-conflict', 409);
          return value;
        }
        const plan = familyPlan(family, now), diagnostic = plan !== 'pro';
        const statsRef = db.collection('results').doc(user.uid).collection('stats').doc('summary');
        const claimRef = db.collection('mockDiagnosticClaims').doc(user.uid);
        const rateRef = db.collection('mockRateLimits').doc(user.uid);
        const [stats, claim, rate] = await Promise.all([tx.get(statsRef), tx.get(claimRef), tx.get(rateRef)]);
        if (diagnostic) {
          const claimData = claim.data() || {};
          if (stats.data()?.diagnosticMockUsed || claimData.completed
            || (claim.exists && claimData.sessionId !== body.id && claimData.expiresAt > now)) throw error('pro-required', 403);
          tx.set(claimRef, { sessionId: body.id, completed: false,
            expiresAt: now + prepared.timeLimitMin * 60000 + SESSION_GRACE_MS, updatedAt: new Date(now) });
        }
        const rateData = rate.data() || {}, starts = rateData.day === day ? Number(rateData.starts || 0) : 0;
        if (!Number.isSafeInteger(starts) || starts < 0 || starts >= (plan === 'pro' ? 20 : 3)) throw error('rate-limit', 429);
        tx.set(rateRef, { day, starts: starts + 1, updatedAt: new Date(now) });
        const value = { uid: user.uid, attemptId: body.id, school: prepared.school, title: prepared.title,
          timeLimitMin: prepared.timeLimitMin, sections: prepared.sections, shortened: !!prepared.shortened,
          targetCount: prepared.targetCount, diagnostic, startedAt: now,
          deadline: now + prepared.timeLimitMin * 60000,
          expiresAt: now + prepared.timeLimitMin * 60000 + SESSION_GRACE_MS, completed: false,
          questionRefs: prepared.questions.map((question) => ({ id: question.id, num: question.num,
            section: question.section, subject: question.subject || null })),
        };
        tx.create(ref, value);
        return value;
      });
      if (session.completed) throw error('session-completed', 409);
      return res.status(200).json(await publicSession(db, session));
    }

    if (body.action === 'submit') {
      if (!body.answers || typeof body.answers !== 'object' || Array.isArray(body.answers)
        || Object.keys(body.answers).length > 120
        || Object.entries(body.answers).some(([key, value]) => !/^\d{1,3}$/.test(key)
          || typeof value !== 'string' || value.length > 2000)) throw error('bad-answers');
      await childContext(db, user);
      const before = await ref.get();
      if (!before.exists || before.data().uid !== user.uid) throw error('session-not-found', 404);
      const graded = await gradeMock(db, before.data(), body.answers);
      const now = Date.now();
      const result = await db.runTransaction(async (tx) => {
        await childContext(db, user, tx);
        const outRef = resultRef(db, user.uid, body.id), statsRef = db.collection('results').doc(user.uid).collection('stats').doc('summary');
        const [current, saved, stats] = await Promise.all([tx.get(ref), tx.get(outRef), tx.get(statsRef)]);
        if (!current.exists || current.data().uid !== user.uid) throw error('session-not-found', 404);
        if (saved.exists) return saved.data();
        const session = current.data();
        if (session.completed || session.expiresAt < now) throw error(session.completed ? 'session-completed' : 'session-expired', session.completed ? 409 : 410);
        const spentSec = Math.max(1, Math.min(session.timeLimitMin * 60, Math.floor((now - session.startedAt) / 1000)));
        const payload = { ...graded, school: session.school, spentSec, limitMin: session.timeLimitMin,
          diagnostic: session.diagnostic === true, shortened: !!session.shortened,
          targetCount: session.targetCount, sourceId: session.attemptId, verified: true, at: new Date(now) };
        tx.create(outRef, payload);
        tx.update(ref, { completed: true, completedAt: now });
        if (session.diagnostic) {
          tx.set(statsRef, { ...(stats.exists ? {} : { xp: 0, studySecs: 0 }), diagnosticMockUsed: true,
            diagnosticMockAt: new Date(now), updatedAt: new Date(now) }, { merge: true });
          tx.set(db.collection('mockDiagnosticClaims').doc(user.uid), {
            sessionId: body.id, completed: true, expiresAt: session.expiresAt, updatedAt: new Date(now),
          });
        }
        return payload;
      });
      return res.status(200).json({ result });
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
