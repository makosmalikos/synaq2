const { createHash } = require('node:crypto');
const { millis, familyPlan, dailyTaskLimit } = require('./plans');

const FREE_DAILY_LIMIT = 5;
const SESSION_TTL = 86400000;
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const integer = (value) => Math.max(0, Math.floor(Number(value) || 0));
const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value);
const publicQuestion = ({ answer, solution, note, ...question }) => question;

// The product's daily allowance follows Kazakhstan time, not a browser clock.
function learningDay(at) {
  const day = new Date(at + 5 * 3600000).toISOString().slice(0, 10);
  return { day, start: Date.parse(`${day}T00:00:00+05:00`) };
}
function createLearningService({ db, getTrainingQuestion, getTrainingTopics, getTrainingQuestions, getCurriculumQuestion, gradeAnswer, now = Date.now }) {
  const resultRef = (uid, collection, id) => db.collection('results').doc(uid).collection(collection).doc(id);
  async function childContext(tx, user) {
    if (!user?.uid || !/^[a-z0-9]+@synaq\.kids$/.test(user.email || '')) throw error('child-required', 403);
    const index = await tx.get(db.collection('childIndex').doc(user.uid));
    const parentUid = index.data()?.parentUid;
    if (!index.exists || typeof parentUid !== 'string' || !parentUid || parentUid.includes('/')) throw error('child-required', 403);
    const familyRef = db.collection('families').doc(parentUid);
    const [family, child] = await Promise.all([tx.get(familyRef), tx.get(familyRef.collection('children').doc(user.uid))]);
    // Keep legitimate pre-server legacy children while rejecting orphaned or
    // reassigned Auth accounts. A supplied parentUid is never trusted.
    if (!family.exists || !child.exists || `${child.data().code}@synaq.kids` !== user.email) throw error('child-required', 403);
    return family.data();
  }

  async function dailyCount(tx, uid, dayInfo) {
    const ref = resultRef(uid, 'daily', dayInfo.day);
    const snap = await tx.get(ref);
    if (snap.exists) return { ref, count: integer(snap.data()?.count) };
    // Seed only a new day's counter from legacy results. No full-history scan.
    const legacy = await tx.get(db.collection('results').doc(uid).collection('attempts')
      .where('at', '>=', new Date(dayInfo.start)).where('at', '<', new Date(dayInfo.start + 86400000)));
    return { ref, count: legacy.size };
  }

  return async function act(user, body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw error('bad-body');
    const at = now(), dayInfo = learningDay(at);
    if (body.action === 'topics') {
      await db.runTransaction((tx) => childContext(tx, user));
      return { topics: await getTrainingTopics() };
    }
    if (body.action === 'questions') {
      const mixed = body.mixed === true;
      if ((!mixed && (typeof body.topicId !== 'string' || !body.topicId || body.topicId.length > 100))
        || !Array.isArray(body.excludeIds) || body.excludeIds.length > 1000
        || body.excludeIds.some((id) => typeof id !== 'string' || !id || id.length > 200 || id.includes('/'))
        || !Number.isSafeInteger(body.limit) || body.limit < 1 || body.limit > 60) throw error('bad-request');
      await db.runTransaction((tx) => childContext(tx, user));
      return { questions: await getTrainingQuestions({ topicId: body.topicId, mixed, excludeIds: body.excludeIds, limit: body.limit }) };
    }
    if (body.action === 'count') return db.runTransaction(async (tx) => {
      const family = await childContext(tx, user);
      const daily = await dailyCount(tx, user.uid, dayInfo);
      tx.set(daily.ref, { count: daily.count, updatedAt: new Date(at) }, { merge: true });
      return { count: daily.count, day: dayInfo.day, limit: dailyTaskLimit(familyPlan(family, at)) };
    });
    if (!['start', 'answer'].includes(body.action) || !validId(body.id)) throw error('bad-request');
    const sessionRef = db.collection('learningSessions').doc(`${user.uid}_${body.id}`);
    if (body.action === 'start') {
      if (!['training', 'curriculum'].includes(body.mode)) throw error('bad-mode');
      if (body.mode === 'training' && (typeof body.qid !== 'string' || !body.qid || body.qid.length > 200 || body.qid.includes('/'))) throw error('bad-question');
      if (body.mode === 'curriculum' && (typeof body.topicKey !== 'string' || !body.topicKey || body.topicKey.length > 100
        || !['easy', 'medium', 'hard', 'mixed'].includes(body.level))) throw error('bad-question');
      const request = body.mode === 'training' ? { mode: body.mode, qid: body.qid } : { mode: body.mode, topicKey: body.topicKey, level: body.level };
      const fingerprint = createHash('sha256').update(JSON.stringify(request)).digest('hex');
      // Generate once per HTTP request, not again on Firestore transaction retry.
      let prepared;
      return db.runTransaction(async (tx) => {
        const family = await childContext(tx, user);
        const [existing, daily] = await Promise.all([tx.get(sessionRef), dailyCount(tx, user.uid, dayInfo)]);
        if (existing.exists) {
          const session = existing.data();
          if (session.uid !== user.uid || session.fingerprint !== fingerprint) throw error('request-conflict', 409);
          if (session.expiresAt <= at) throw error('session-expired', 410);
          return { id: body.id, question: publicQuestion(session.question), startedAt: session.startedAt, expiresAt: session.expiresAt };
        }
        const plan = familyPlan(family, at), limit = dailyTaskLimit(plan);
        if (limit != null && daily.count >= limit) throw error('daily-limit', 429);
        prepared ||= body.mode === 'training' ? { question: await getTrainingQuestion(body.qid), standard: true }
          : await getCurriculumQuestion(body.topicKey, body.level, body.id);
        if (!prepared?.question) throw error('question-unavailable', 404);
        if (body.mode === 'curriculum' && plan !== 'pro'
          && (plan === 'free' ? !(prepared.free ?? prepared.standard) || body.level !== 'easy'
            : !prepared.standard || !['easy', 'medium'].includes(body.level))) {
          throw error('pro-required', 403);
        }
        const rateRef = db.collection('learningRateLimits').doc(user.uid);
        const rate = (await tx.get(rateRef)).data() || {};
        const starts = rate.day === dayInfo.day ? integer(rate.starts) : 0;
        if (starts >= (plan === 'pro' ? 300 : plan === 'standard' ? 150 : 60)) throw error('rate-limit', 429);
        const session = { uid: user.uid, fingerprint, mode: body.mode, request, question: prepared.question,
          startedAt: at, expiresAt: at + SESSION_TTL, completed: false };
        tx.create(sessionRef, session);
        tx.set(rateRef, { day: dayInfo.day, starts: starts + 1, updatedAt: new Date(at) });
        return { id: body.id, question: publicQuestion(session.question), startedAt: at, expiresAt: session.expiresAt };
      });
    }

    if (typeof body.answer !== 'string' || !body.answer.trim() || body.answer.length > 2000) throw error('bad-answer');
    const given = body.answer.trim();
    return db.runTransaction(async (tx) => {
      const family = await childContext(tx, user);
      const attemptRef = resultRef(user.uid, 'attempts', body.id), statsRef = resultRef(user.uid, 'stats', 'summary');
      const [sessionSnap, attemptSnap, statsSnap, daily] = await Promise.all([
        tx.get(sessionRef), tx.get(attemptRef), tx.get(statsRef), dailyCount(tx, user.uid, dayInfo),
      ]);
      if (!sessionSnap.exists || sessionSnap.data().uid !== user.uid) throw error('session-not-found', 404);
      const session = sessionSnap.data(), previous = statsSnap.data() || {};
      if (attemptSnap.exists) {
        const saved = attemptSnap.data();
        if (saved.answer !== given || saved.sessionId !== body.id) throw error('request-conflict', 409);
        return { saved: false, correct: saved.correct, answer: session.question.answer, solution: session.question.solution || '',
          gain: 0, totalXp: integer(previous.xp), count: daily.count, secs: saved.secs };
      }
      if (session.expiresAt <= at) throw error('session-expired', 410);
      if (session.completed) throw error('session-completed', 409);
      const plan = familyPlan(family, at), limit = dailyTaskLimit(plan);
      if (limit != null && daily.count >= limit) throw error('daily-limit', 429);
      if (plan !== 'pro' && session.mode === 'curriculum') {
        const access = await getCurriculumQuestion(session.request.topicKey, session.request.level, body.id, true);
        if (plan === 'free' ? !(access?.free ?? access?.standard) || session.request.level !== 'easy'
          : !access?.standard || !['easy', 'medium'].includes(session.request.level)) {
          throw error('pro-required', 403);
        }
      }
      const question = session.question;
      const solvedRef = resultRef(user.uid, 'solved', question.id), solved = (await tx.get(solvedRef)).data() || {};
      const correct = await gradeAnswer(given, question, session.mode);
      // Parallel tabs cannot credit the same elapsed interval more than once;
      // client secs/correct/topic/school fields have no effect on this record.
      const studyStart = Math.max(session.startedAt, millis(previous.studyCreditedUntil));
      // One abandoned question cannot generate an entire hourly bonus. This is
      // a conservative credit cap, not a claim to detect attention or bots.
      const seconds = Math.min(300, Math.max(0, Math.floor((at - studyStart) / 1000)));
      const studySecs = integer(previous.studySecs);
      const questionGain = correct && !solved.xpAwarded && !solved.correct ? 5 : 0;
      const gain = questionGain + (Math.floor((studySecs + seconds) / 3600) - Math.floor(studySecs / 3600)) * 100;
      const totalXp = integer(previous.xp) + gain;
      tx.create(attemptRef, { sessionId: body.id, qid: question.id, topic: question.topic || null,
        school: question.school || null, answer: given, correct, secs: seconds, gain, at: new Date(at), verified: true });
      tx.set(solvedRef, { qid: question.id, topic: question.topic || null, school: question.school || null,
        correct, xpAwarded: !!solved.xpAwarded || !!solved.correct || questionGain > 0, at: new Date(at) }, { merge: true });
      tx.set(statsRef, { xp: totalXp, studySecs: studySecs + seconds, studyCreditedUntil: new Date(at), updatedAt: new Date(at) }, { merge: true });
      tx.set(daily.ref, { count: daily.count + 1, updatedAt: new Date(at) }, { merge: true });
      tx.update(sessionRef, { completed: true, completedAt: at });
      return { saved: true, correct, answer: question.answer, solution: question.solution || '', gain, totalXp, count: daily.count + 1, secs: seconds };
    });
  };
}

module.exports = { createLearningService, learningDay, FREE_DAILY_LIMIT, SESSION_TTL };
