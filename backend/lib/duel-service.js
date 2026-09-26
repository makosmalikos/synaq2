const { randomInt } = require('node:crypto');
const SIZE = 15, ROUND_MS = 35000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const roleOf = (room, uid) => room.host?.uid === uid ? 'host' : room.guest?.uid === uid ? 'guest' : null;
const millis = (value) => value?.toMillis?.() ?? (value instanceof Date ? value.getTime() : (value?.seconds || 0) * 1000);
const error = (message, status = 409) => Object.assign(new Error(message), { status });
const defaults = () => ({ qIndex: 0, scores: { host: 0, guest: 0 }, speedWins: { host: 0, guest: 0 }, round: { host: null, guest: null } });

function correct(given, question) {
  if (question.options) return String(given).trim() === String(question.answer).trim();
  const normalize = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, '').replace(',', '.').replace(/%$/, '');
  const split = (v) => { const m = v.match(/(км|мм|см|м|мин|кг|г|л|тг|га|°)$/u); return { value: m ? v.slice(0, -m[0].length) : v, unit: m?.[0] }; };
  const a = split(normalize(given)), b = split(normalize(question.answer));
  if (!a.value || (a.unit && b.unit && a.unit !== b.unit)) return false;
  return a.value === b.value || (/^-?\d+(\.\d+)?$/.test(a.value) && /^-?\d+(\.\d+)?$/.test(b.value) && Number(a.value) === Number(b.value));
}
function winnerOf(scores, speed) {
  if (scores.host !== scores.guest) return scores.host > scores.guest ? 'host' : 'guest';
  if (speed.host !== speed.guest) return speed.host > speed.guest ? 'host' : 'guest';
  return 'draw';
}
function selectQuestions(pool) {
  const available = pool.filter((q) => q.id && q.statement && !q.image && q.answer != null
    && !['', '-', '—'].includes(String(q.answer).trim())
    && (!q.options || (Array.isArray(q.options) && q.options.length >= 2 && q.options.map(String).includes(String(q.answer)))));
  if (available.length < SIZE) throw error('bank_unavailable', 503);
  for (let i = available.length - 1; i > 0; i--) { const j = randomInt(i + 1); [available[i], available[j]] = [available[j], available[i]]; }
  return available.slice(0, SIZE).map((q, i) => ({ id: String(q.id), statement: String(q.statement), answer: String(q.answer), options: q.options || null, topic: q.topic || null, source: 'bank', num: i + 1 }));
}
function finishRound(room, secret, at) {
  const round = secret.round;
  const scores = { ...room.scores }, speedWins = { ...room.speedWins };
  for (const role of ['host', 'guest']) if (round[role]?.correct) scores[role]++;
  if (round.host.correct && (!round.guest.correct || round.host.at < round.guest.at)) speedWins.host++;
  if (round.guest.correct && (!round.host.correct || round.guest.at < round.host.at)) speedWins.guest++;
  const lastRound = { qIndex: room.qIndex, host: round.host, guest: round.guest };
  if (room.qIndex + 1 >= secret.questions.length) {
    const winner = winnerOf(scores, speedWins);
    return { publicPatch: { scores, speedWins, lastRound, round, status: 'finished', winner, finishedAt: new Date(at) },
      privatePatch: { status: 'finished', result: { scores, speedWins, winner, hostUid: room.host.uid, guestUid: room.guest.uid, finishedAt: new Date(at) } } };
  }
  return { publicPatch: { scores, speedWins, lastRound, qIndex: room.qIndex + 1, round: { host: null, guest: null }, roundStartedAt: new Date(at) }, privatePatch: { round: { host: null, guest: null } } };
}
function createDuelService({ db, getPool, now = Date.now, newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('') }) {
  async function rate(uid, action) {
    const at = now(), day = new Date(at).toISOString().slice(0, 10), ref = db.collection('duelRateLimits').doc(uid);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref), data = snap.data() || {};
      const count = data.day === day ? Number(data.created) || 0 : 0;
      const windowStart = Number(data.windowStart) || 0, requests = at - windowStart < 60000 ? Number(data.requests) || 0 : 0;
      if (requests >= 90 || (action === 'create' && count >= 30)) throw error('rate_limit', 429);
      tx.set(ref, { day, created: count + (action === 'create' ? 1 : 0), requests: requests + 1, windowStart: requests ? windowStart : at });
    });
  }
  return async function act(user, body) {
    const action = body.action;
    if (!['create', 'join', 'answer', 'expire'].includes(action)) throw error('bad_action', 400);
    await rate(user.uid, action);
    const name = String(body.name || user.name || 'Ойыншы').trim().slice(0, 50) || 'Ойыншы';
    if (action === 'create') {
      const questions = selectQuestions(await getPool());
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = newCode(), ref = db.collection('duels').doc(code), secretRef = db.collection('duelPrivate').doc(code);
        const created = await db.runTransaction(async (tx) => {
          const [existing, privateExisting] = await Promise.all([tx.get(ref), tx.get(secretRef)]);
          if (existing.exists || privateExisting.exists) return false;
          const at = new Date(now());
          tx.create(ref, { code, serverVersion: 2, host: { uid: user.uid, name }, guest: null, status: 'waiting', questions: questions.map(({ answer, ...q }) => q), ...defaults(), winner: null, createdAt: at });
          tx.create(secretRef, { version: 2, hostUid: user.uid, guestUid: null, questions, round: { host: null, guest: null }, status: 'waiting', createdAt: at });
          return true;
        });
        if (created) return { code };
      }
      throw error('try_again', 503);
    }
    const code = String(body.code || '').trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) throw error('bad_code', 400);
    const ref = db.collection('duels').doc(code), secretRef = db.collection('duelPrivate').doc(code);
    return db.runTransaction(async (tx) => {
      const [snap, privateSnap] = await Promise.all([tx.get(ref), tx.get(secretRef)]);
      if (!snap.exists || !privateSnap.exists) throw error('not_found', 404);
      const room = snap.data(), secret = privateSnap.data();
      if (room.serverVersion !== 2 || secret.version !== 2 || room.host?.uid !== secret.hostUid) throw error('not_found', 404);
      const role = roleOf(room, user.uid), at = now();
      if (action === 'join') {
        if (room.status === 'finished') throw error('finished');
        if (role) return { code };
        if (room.guest || room.status !== 'waiting') throw error('full');
        if (at - millis(room.createdAt) > 86400000) throw error('expired');
        tx.update(ref, { guest: { uid: user.uid, name }, status: 'playing', ...defaults(), roundStartedAt: new Date(at + 3000), startedAt: new Date(at) });
        tx.update(secretRef, { guestUid: user.uid, status: 'playing', round: { host: null, guest: null } });
        return { code };
      }
      if (!role || !room.guest || secret.guestUid !== room.guest.uid) throw error('not_player', 403);
      if (room.status !== 'playing' || secret.status !== 'playing') throw error('bad_state');
      if (!Number.isInteger(body.qIndex) || body.qIndex !== room.qIndex) {
        if (action === 'expire') return { advanced: false };
        throw error('stale_round');
      }
      const started = millis(room.roundStartedAt);
      if (at < started) throw error('not_started');
      const expired = at >= started + ROUND_MS;
      if (action === 'expire' && !expired) return { advanced: false };
      const round = { ...secret.round };
      let verdict;
      if (!expired && action === 'answer') {
        if (round[role]) return { correct: round[role].correct, duplicate: true };
        if (typeof body.answer !== 'string' || !body.answer.trim() || body.answer.length > 1000) throw error('bad_answer', 400);
        verdict = correct(body.answer, secret.questions[room.qIndex]);
        round[role] = { value: body.answer.trim(), correct: verdict, at };
      } else {
        for (const r of ['host', 'guest']) if (!round[r]) round[r] = { value: '', correct: false, at, timeout: true };
      }
      if (round.host && round.guest) {
        const patches = finishRound(room, { ...secret, round }, at);
        tx.update(ref, patches.publicPatch); tx.update(secretRef, patches.privatePatch);
        return { advanced: true, expired, ...(verdict !== undefined ? { correct: verdict } : {}) };
      }
      // An opponent cannot read the submitted answer until both players finish.
      tx.update(ref, { round: { host: round.host ? { submitted: true } : null, guest: round.guest ? { submitted: true } : null } });
      tx.update(secretRef, { round });
      return { correct: verdict, advanced: false };
    });
  };
}
module.exports = { createDuelService, correct, winnerOf, selectQuestions, SIZE, ROUND_MS };
