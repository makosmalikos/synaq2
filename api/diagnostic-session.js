const { getAdmin } = require('../backend/lib/firebase-admin');
const { VERSION, TOTAL, createWave, nextWave, publicQuestion, buildResult, answerMatches } = require('../backend/lib/diagnostic-bank');

const TTL = 24 * 3600 * 1000;
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value);
const sessionRef = (db, uid, id) => db.collection('diagnosticSessions').doc(`${uid}_${id}`);
const resultRef = (db, uid, id) => db.collection('results').doc(uid).collection('diagnostics').doc(id);

async function childContext(db, user, tx) {
  if (!user?.uid || !/^[a-z0-9]+@synaq\.kids$/.test(user.email || '')) throw error('child-required', 403);
  const index = await tx.get(db.collection('childIndex').doc(user.uid));
  const parentUid = index.data()?.parentUid;
  if (!index.exists || typeof parentUid !== 'string' || !parentUid || parentUid.includes('/')) throw error('child-required', 403);
  const family = db.collection('families').doc(parentUid);
  const [familySnap, child] = await Promise.all([tx.get(family), tx.get(family.collection('children').doc(user.uid))]);
  if (!familySnap.exists || !child.exists || `${child.data().code}@synaq.kids` !== user.email) throw error('child-required', 403);
}

function state(id, session) {
  if (session.completed) return { id, completed: true };
  const current = session.questions[session.index];
  return { id, version: VERSION, grade: session.grade, index: session.index, total: TOTAL,
    startedAt: session.startedAt, expiresAt: session.expiresAt, question: publicQuestion(current) };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'auth-required' });
  try {
    const { auth, db } = getAdmin(), user = await auth.verifyIdToken(token, true);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || !validId(body.id)) throw error('bad-request');
    const ref = sessionRef(db, user.uid, body.id), now = Date.now();

    if (body.action === 'start') {
      if (!Number.isSafeInteger(body.grade) || body.grade < 3 || body.grade > 6) throw error('bad-grade');
      const prepared = await createWave(body.grade, 1);
      const session = await db.runTransaction(async (tx) => {
        await childContext(db, user, tx);
        const existing = await tx.get(ref);
        if (existing.exists) {
          const value = existing.data();
          if (value.uid !== user.uid || value.grade !== body.grade) throw error('request-conflict', 409);
          return value;
        }
        const day = new Date(now + 5 * 3600000).toISOString().slice(0, 10);
        const rateRef = db.collection('diagnosticRateLimits').doc(user.uid), rate = (await tx.get(rateRef)).data() || {};
        const starts = rate.day === day ? Number(rate.starts || 0) : 0;
        if (!Number.isSafeInteger(starts) || starts < 0 || starts >= 10) throw error('rate-limit', 429);
        const value = { uid: user.uid, id: body.id, version: VERSION, grade: body.grade, index: 0,
          questions: prepared, records: [], startedAt: now, questionStartedAt: now,
          expiresAt: now + TTL, completed: false };
        tx.create(ref, value);
        tx.set(rateRef, { day, starts: starts + 1, updatedAt: new Date(now) });
        return value;
      });
      if (session.completed) {
        const saved = await resultRef(db, user.uid, body.id).get();
        return res.status(200).json({ id: body.id, completed: true, result: saved.data() });
      }
      if (session.expiresAt <= now) throw error('session-expired', 410);
      return res.status(200).json(state(body.id, session));
    }

    if (body.action === 'resume') {
      const value = await db.runTransaction(async (tx) => { await childContext(db, user, tx); return tx.get(ref); });
      if (!value.exists || value.data().uid !== user.uid) throw error('session-not-found', 404);
      const session = value.data();
      if (session.completed) {
        const saved = await resultRef(db, user.uid, body.id).get();
        if (!saved.exists) throw error('session-not-found', 404);
        return res.status(200).json({ id: body.id, completed: true, result: saved.data() });
      }
      if (session.expiresAt <= now) throw error('session-expired', 410);
      return res.status(200).json(state(body.id, session));
    }

    if (body.action === 'answer') {
      if (!Number.isSafeInteger(body.index) || body.index < 0 || body.index >= TOTAL
        || typeof body.answer !== 'string' || body.answer.length > 2000) throw error('bad-answer');
      const before = await ref.get();
      if (!before.exists || before.data().uid !== user.uid) throw error('session-not-found', 404);
      const snapshot = before.data(), current = snapshot.questions?.[body.index];
      if (snapshot.completed) {
        const saved = await resultRef(db, user.uid, body.id).get();
        return res.status(200).json({ id: body.id, completed: true, result: saved.data() });
      }
      if (!current || body.index > snapshot.index) throw error('request-conflict', 409);
      const correct = body.answer.trim() !== '' && await answerMatches(body.answer, current.question.answer);
      const outcome = await db.runTransaction(async (tx) => {
        await childContext(db, user, tx);
        const live = await tx.get(ref);
        if (!live.exists || live.data().uid !== user.uid) throw error('session-not-found', 404);
        const session = live.data();
        if (session.completed) {
          const saved = await tx.get(resultRef(db, user.uid, body.id));
          return { completed: true, result: saved.data() };
        }
        if (session.expiresAt <= now) throw error('session-expired', 410);
        if (body.index < session.index) return { completed: false, session };
        if (body.index !== session.index) throw error('request-conflict', 409);
        const item = session.questions[session.index];
        const record = { ...item, your: body.answer.trim(), correct,
          seconds: Math.max(1, Math.min(300, Math.floor((now - session.questionStartedAt) / 1000))) };
        const records = [...session.records, record];
        let questions = session.questions, index = session.index + 1;
        if (index === 8) questions = [...questions, ...await nextWave(session.grade, 2, records)];
        if (index === 16) questions = [...questions, ...await nextWave(session.grade, 3, records)];
        if (index >= TOTAL) {
          const finalSession = { ...session, records };
          const result = { ...buildResult(finalSession, now), sourceId: body.id, at: new Date(now) };
          tx.create(resultRef(db, user.uid, body.id), result);
          tx.update(ref, { records, completed: true, completedAt: now });
          return { completed: true, result };
        }
        const updated = { ...session, questions, records, index, questionStartedAt: now };
        tx.update(ref, { questions, records, index, questionStartedAt: now });
        return { completed: false, session: updated };
      });
      return res.status(200).json(outcome.completed ? { id: body.id, completed: true, result: outcome.result }
        : state(body.id, outcome.session));
    }
    throw error('bad-action');
  } catch (cause) {
    if (cause?.code?.startsWith('auth/')) return res.status(401).json({ error: 'auth-required' });
    if (cause instanceof SyntaxError) return res.status(400).json({ error: 'bad-body' });
    if (cause?.status) return res.status(cause.status).json({ error: cause.message });
    console.error('diagnostic-session', cause?.code || cause?.name || 'failed');
    return res.status(503).json({ error: 'temporarily-unavailable' });
  }
};
