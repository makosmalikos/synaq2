// Real-time дуэль через Firestore: ссылка → друг подключается → 10 вопросов.
import {
  doc, setDoc, getDoc, onSnapshot, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase.js';
import { POOL } from './bank.js';
import { generate } from './generators.js';
import { isCorrect } from './api.js';

export const DUEL_SIZE = 10;
export const ROUND_SEC = 45;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);

export function genDuelCode() {
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => CODE_CHARS[n % CODE_CHARS.length]).join('');
}

export function buildDuelQuestions(n = DUEL_SIZE) {
  const genCount = Math.ceil(n / 2);
  const poolCount = n - genCount;
  const bank = shuffle(
    POOL.filter((q) => q.school === 'РФМШ' && !q.options && q.answer != null && !q.image),
  ).slice(0, poolCount).map((q) => ({
    id: q.id,
    statement: q.statement,
    answer: q.answer,
    solution: q.solution || '',
    topic: q.topic,
    source: 'bank',
  }));
  const gen = generate(genCount).map((q) => ({ ...q, source: 'generated' }));
  return shuffle([...bank, ...gen]).slice(0, n).map((q, i) => ({ ...q, num: i + 1 }));
}

export function duelLink(code) {
  const base = `${window.location.origin}/app`;
  return `${base}?duel=${code}`;
}

function playerRole(data, uid) {
  if (!data || !uid) return null;
  if (data.host?.uid === uid) return 'host';
  if (data.guest?.uid === uid) return 'guest';
  return null;
}

export async function createDuel(name) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('auth');
  const code = genDuelCode();
  const ref = doc(db, 'duels', code);
  await setDoc(ref, {
    code,
    host: { uid, name: name || 'Ойыншы' },
    guest: null,
    status: 'waiting',
    questions: buildDuelQuestions(),
    qIndex: 0,
    scores: { host: 0, guest: 0 },
    round: { host: null, guest: null },
    roundStartedAt: null,
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
      // Гость зашёл — сразу стартуем, хосту жать «Бастау» не нужно.
      tx.update(ref, {
        guest: { uid, name: name || 'Қонақ' },
        status: 'playing',
        qIndex: 0,
        round: { host: null, guest: null },
        roundStartedAt: serverTimestamp(),
        startedAt: serverTimestamp(),
      });
    }
  });
  return id;
}

export async function startDuel(code) {
  const uid = auth.currentUser?.uid;
  const ref = doc(db, 'duels', code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('not_found');
    const data = snap.data();
    if (data.host.uid !== uid) throw new Error('not_host');
    if (!data.guest) throw new Error('no_guest');
    if (data.status !== 'waiting') return;
    tx.update(ref, {
      status: 'playing',
      qIndex: 0,
      round: { host: null, guest: null },
      roundStartedAt: serverTimestamp(),
      startedAt: serverTimestamp(),
    });
  });
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

    const q = data.questions[data.qIndex];
    if (!q) throw new Error('no_q');

    const round = { ...(data.round || { host: null, guest: null }) };
    if (round[role]) return data;

    const ok = isCorrect(answer, q);
    round[role] = { value: String(answer ?? '').trim(), correct: ok, at: Date.now() };

    const scores = { ...data.scores };
    if (ok) scores[role] = (scores[role] || 0) + 1;

    const hostDone = !!round.host;
    const guestDone = !!round.guest;
    if (!hostDone || !guestDone) {
      tx.update(ref, { round, scores });
      return { ...data, round, scores };
    }

    // Оба ответили — следующий раунд или финиш.
    const nextIndex = data.qIndex + 1;
    if (nextIndex >= data.questions.length) {
      const winner = scores.host > scores.guest ? 'host'
        : scores.guest > scores.host ? 'guest' : 'draw';
      tx.update(ref, {
        round, scores, status: 'finished', winner, finishedAt: serverTimestamp(),
      });
      return { ...data, round, scores, status: 'finished', winner };
    }

    tx.update(ref, {
      round: { host: null, guest: null },
      scores,
      qIndex: nextIndex,
      roundStartedAt: serverTimestamp(),
    });
    return { ...data, round, scores, qIndex: nextIndex };
  });
}

export async function skipRoundIfExpired(code) {
  const uid = auth.currentUser?.uid;
  const ref = doc(db, 'duels', code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.status !== 'playing') return;

    const started = data.roundStartedAt?.toMillis?.() || data.roundStartedAt?.seconds * 1000;
    if (!started || Date.now() - started < ROUND_SEC * 1000) return;

    const round = { ...(data.round || { host: null, guest: null }) };
    const roles = ['host', 'guest'];
    for (const r of roles) {
      if (!round[r]) round[r] = { value: '', correct: false, at: Date.now(), timeout: true };
    }

    const scores = { ...data.scores };
    const nextIndex = data.qIndex + 1;
    if (nextIndex >= data.questions.length) {
      const winner = scores.host > scores.guest ? 'host'
        : scores.guest > scores.host ? 'guest' : 'draw';
      tx.update(ref, {
        round, scores, status: 'finished', winner, finishedAt: serverTimestamp(),
      });
      return;
    }
    tx.update(ref, {
      round: { host: null, guest: null },
      scores,
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

export async function getDuel(code) {
  const snap = await getDoc(doc(db, 'duels', code));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
