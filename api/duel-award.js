// POST /api/duel-award { code } -> { gain, credited }
// Awards duel XP exactly once. The client no longer writes an arbitrary duel
// reward directly into its stats document.

const XP = { CORRECT: 5, SPEED: 3, WIN: 50 };
const DUEL_SIZE = 15;

function getAdmin() {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  const { getFirestore } = require('firebase-admin/firestore');
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'synaq-88779',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return { auth: getAuth(), db: getFirestore() };
}

function bodyOf(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
  }
  return req.body && typeof req.body === 'object' ? req.body : {};
}

function safeScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= DUEL_SIZE ? value : null;
}

function winnerOf(scores, speedWins) {
  if (scores.host !== scores.guest) return scores.host > scores.guest ? 'host' : 'guest';
  if (speedWins.host !== speedWins.guest) return speedWins.host > speedWins.guest ? 'host' : 'guest';
  return 'draw';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  res.setHeader('Cache-Control', 'private, no-store');
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    return res.status(500).json({ error: 'server_not_configured' });
  }

  try {
    const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'login_required' });
    const { auth, db } = getAdmin();
    const user = await auth.verifyIdToken(match[1], true);

    const code = String(bodyOf(req).code || '').trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) return res.status(400).json({ error: 'bad_code' });

    const duelRef = db.collection('duels').doc(code);
    const statsRef = db.collection('results').doc(user.uid).collection('stats').doc('summary');
    const awardRef = db.collection('results').doc(user.uid).collection('awards').doc(`duel_${code}`);

    const result = await db.runTransaction(async (tx) => {
      const [duelSnap, awardSnap, statsSnap] = await Promise.all([
        tx.get(duelRef), tx.get(awardRef), tx.get(statsRef),
      ]);
      if (awardSnap.exists) return { gain: Number(awardSnap.data()?.gain) || 0, credited: false };
      if (!duelSnap.exists || duelSnap.data()?.status !== 'finished') {
        const error = new Error('duel_not_finished');
        error.status = 409;
        throw error;
      }

      const duel = duelSnap.data();
      const role = duel.host?.uid === user.uid ? 'host' : duel.guest?.uid === user.uid ? 'guest' : null;
      if (!role) {
        const error = new Error('not_player');
        error.status = 403;
        throw error;
      }

      const scores = { host: safeScore(duel.scores?.host), guest: safeScore(duel.scores?.guest) };
      const speedWins = { host: safeScore(duel.speedWins?.host), guest: safeScore(duel.speedWins?.guest) };
      if (scores.host === null || scores.guest === null || speedWins.host === null || speedWins.guest === null
          || speedWins.host > scores.host || speedWins.guest > scores.guest) {
        const error = new Error('bad_duel_result');
        error.status = 409;
        throw error;
      }

      const winner = winnerOf(scores, speedWins);
      const gain = scores[role] * XP.CORRECT + speedWins[role] * XP.SPEED
        + (winner === role ? XP.WIN : 0);
      const currentXp = Math.max(0, Number(statsSnap.data()?.xp) || 0);
      const now = new Date();
      tx.create(awardRef, { type: 'duel', code, role, gain, createdAt: now });
      tx.set(statsRef, {
        xp: currentXp + gain,
        lastGain: gain,
        lastReason: 'duel',
        updatedAt: now,
      }, { merge: true });
      return { gain, credited: true };
    });

    return res.status(200).json(result);
  } catch (e) {
    if (e?.code?.startsWith('auth/')) return res.status(401).json({ error: 'login_required' });
    if (e?.status) return res.status(e.status).json({ error: e.message });
    console.error('duel-award', e?.code || e?.message || e);
    return res.status(500).json({ error: 'failed' });
  }
};
