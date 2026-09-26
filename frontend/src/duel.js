// Firestore is read-only on the client. The server owns joins, rounds and scores.
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase.js';
import { DUEL_SIZE, DUEL_ROUND_SEC } from './xp.js';
export { DUEL_SIZE, DUEL_ROUND_SEC as ROUND_SEC };

async function request(action, payload = {}) {
  if (!auth.currentUser) throw new Error('auth');
  const token = await auth.currentUser.getIdToken();
  const response = await fetch('/api/duel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'failed');
  return result;
}

export const createDuel = async (name) => (await request('create', { name })).code;
export const joinDuel = async (code, name) => (await request('join', { code, name })).code;
export const submitDuelAnswer = (code, answer, qIndex) => request('answer', { code, answer, qIndex });
export const skipRoundIfExpired = (code, qIndex) => request('expire', { code, qIndex });
export const duelLink = (code) => `${window.location.origin}/app?duel=${code}`;

export function watchDuel(code, cb, onError) {
  if (!code) return () => {};
  return onSnapshot(doc(db, 'duels', code), (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null), onError);
}
export function myRole(duel) {
  const uid = auth.currentUser?.uid;
  return duel?.host?.uid === uid ? 'host' : duel?.guest?.uid === uid ? 'guest' : null;
}
