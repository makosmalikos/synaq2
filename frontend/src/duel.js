// Real-time дуэль через Firestore: 15 сұрақ, жылдамдық, XP.
import {
  doc, setDoc, onSnapshot, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase.js';
import { POOL } from './bank.js';
import { isCorrect } from './api.js';
import { DUEL_SIZE, DUEL_ROUND_SEC } from './xp.js';

export { DUEL_SIZE, DUEL_ROUND_SEC as ROUND_SEC };

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);

export function genDuelCode() {
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => CODE_CHARS[n % CODE_CHARS.length]).join('');
}

export function buildDuelQuestions(n = DUEL_SIZE) {
  return shuffle(
    POOL.filter((q) => q.answer != null && String(q.answer).trim() !== '' && !q.image),
  ).slice(0, n).map((q, i) => ({
    id: q.id,
    statement: q.statement,
    topic: q.topic,
    options: q.options || null,
    source: 'bank',
    num: i + 1,
  }));
}

export function resolveDuelQuestion(q) {
  if (!q) return q;
  const bank = POOL.find((p) => p.id === q.id);
  if (!bank) return q;
  return {
    ...q,
    answer: bank.answer,
    solution: bank.solution || '',
    options: q.options || bank.options || null,
  };
}

export function duelLink(code) {
  return `${window.location.origin}/app?duel=${code}`;
}

function playerRole(data, uid) {
  if (!data || !uid) return null;
  if (data.host?.uid === uid) return 'host';
  if (data.guest?.uid === uid) return 'guest';
  return null;
}

function bumpSpeed(round, speedWins) {
  const sw = { ...speedWins };
  const h = round.host;
  const g = round.guest;
  if (h?.correct && g?.correct) {
    if (h.at < g.at) sw.host = (sw.host || 0) + 1;
    else if (g.at < h.at) sw.guest = (sw.guest || 0) + 1;
  } else if (h?.correct && !g?.correct) sw.host = (sw.host || 0) + 1;
  else if (g?.correct && !h?.correct) sw.guest = (sw.guest || 0) + 1;
  return sw;
}

function pickWinner(scores, speedWins) {
  if (scores.host > scores.guest) return 'host';
  if (scores.guest > scores.host) return 'guest';
  if ((speedWins.host || 0) > (speedWins.guest || 0)) return 'host';
  if ((speedWins.guest || 0) > (speedWins.host || 0)) return 'guest';
  return 'draw';
}

const duelDefaults = () => ({
  qIndex: 0,
  scores: { host: 0, guest: 0 },
  speedWins: { host: 0, guest: 0 },
  round: { host: null, guest: null },
  roundStartedAt: null,
});

export async function createDuel(name) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('auth');
  const code = genDuelCode();
  await setDoc(doc(db, 'duels', code), {
    code,
    host: { uid, name: name || 'Ойыншы' },
    guest: null,
    status: 'waiting',
    questions: buildDuelQuestions(),
    ...duelDefaults(),
    winner: null,
    createdAt: serverTimestamp(),
  });
  return code;
}

export async function joinDuel(code, name) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('auth');
  const id = code.toUpperCase();
  const ref = doc(db, 'duels', id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('not_found');
    const data = snap.data();
    if (data.status === 'finished') throw new Error('finished');
    if (data.host.uid === uid) return;
    if (data.guest?.uid && data.guest.uid !== uid) throw new Error('full');
    if (!data.guest) {
      tx.update(ref, {
        guest: { uid, name: name || 'Қонақ' },
        status: 'playing',
        ...duelDefaults(),
        roundStartedAt: serverTimestamp(),
        startedAt: serverTimestamp(),
      });
    }
  });
  return id;
}

export async function submitDuelAnswer(code, answer) {
  const uid = auth.currentUser?.uid;
  const ref = doc(db, 'duels', code);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('not_found');
    const data = snap.data();
    const role = playerRole(data, uid);
    if (!role || data.status !== 'playing') throw new Error('bad_state');

    const q = resolveDuelQuestion(data.questions[data.qIndex]);
    if (!q) throw new Error('no_q');

    const round = { ...(data.round || { host: null, guest: null }) };
    if (round[role]) return data;

    const ok = isCorrect(answer, q);
    round[role] = { value: String(answer ?? '').trim(), correct: ok, at: Date.now() };

    const scores = { ...data.scores };
    let speedWins = { ...(data.speedWins || { host: 0, guest: 0 }) };
    if (ok) scores[role] = (scores[role] || 0) + 1;

    const hostDone = !!round.host;
    const guestDone = !!round.guest;
    if (!hostDone || !guestDone) {
      tx.update(ref, { round, scores, speedWins });
      return { ...data, round, scores, speedWins };
    }

    speedWins = bumpSpeed(round, speedWins);
    const nextIndex = data.qIndex + 1;

    if (nextIndex >= data.questions.length) {
      const winner = pickWinner(scores, speedWins);
      tx.update(ref, {
        round, scores, speedWins, status: 'finished', winner, finishedAt: serverTimestamp(),
      });
      return { ...data, round, scores, speedWins, status: 'finished', winner };
    }

    tx.update(ref, {
      round: { host: null, guest: null },
      scores,
      speedWins,
      qIndex: nextIndex,
      roundStartedAt: serverTimestamp(),
    });
    return { ...data, round, scores, speedWins, qIndex: nextIndex };
  });
}

export async function skipRoundIfExpired(code) {
  const ref = doc(db, 'duels', code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.status !== 'playing') return;

    const started = data.roundStartedAt?.toMillis?.() || data.roundStartedAt?.seconds * 1000;
    if (!started || Date.now() - started < DUEL_ROUND_SEC * 1000) return;

    const round = { ...(data.round || { host: null, guest: null }) };
    for (const r of ['host', 'guest']) {
      if (!round[r]) round[r] = { value: '', correct: false, at: Date.now(), timeout: true };
    }

    const scores = { ...data.scores };
    let speedWins = bumpSpeed(round, { ...(data.speedWins || { host: 0, guest: 0 }) });
    const nextIndex = data.qIndex + 1;

    if (nextIndex >= data.questions.length) {
      tx.update(ref, {
        round, scores, speedWins, status: 'finished',
        winner: pickWinner(scores, speedWins),
        finishedAt: serverTimestamp(),
      });
      return;
    }
    tx.update(ref, {
      round: { host: null, guest: null },
      scores,
      speedWins,
      qIndex: nextIndex,
      roundStartedAt: serverTimestamp(),
    });
  });
}

export function watchDuel(code, cb) {
  if (!code) return () => {};
  return onSnapshot(doc(db, 'duels', code), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, () => cb(null));
}

export function myRole(duel) {
  return playerRole(duel, auth.currentUser?.uid);
}
