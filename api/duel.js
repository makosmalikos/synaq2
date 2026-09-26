const { createDuelService } = require('../backend/lib/duel-service');
const { getAdmin } = require('../backend/lib/firebase-admin');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (process.env.SYNAQ_USE_EMULATORS !== '1' && (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY)) return res.status(503).json({ error: 'server_not_configured' });
  try {
    const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'auth' });
    const { auth, db } = getAdmin(), user = await auth.verifyIdToken(token, true);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const service = createDuelService({ db, getPool: async () => (await import('../frontend/src/bank.js')).POOL });
    return res.status(200).json(await service(user, body));
  } catch (e) {
    if (e.code?.startsWith('auth/')) return res.status(401).json({ error: 'auth' });
    if (e instanceof SyntaxError) return res.status(400).json({ error: 'bad_body' });
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error('duel', e.code || e.message);
    return res.status(500).json({ error: 'failed' });
  }
};
