// Admin-only platform stats: how many kids registered and how many tasks they solved.
// Shares the catch-all Vercel function. Counts use Firestore aggregation (no document reads).
const { getAdmin } = require('../lib/firebase-admin');

const DEFAULT_ADMIN_EMAILS = ['makosmalikos@gmail.com', 'nurss.aldb@gmail.com'];
const norm = (value) => String(value || '').trim().toLowerCase();

function isAllowedEmail(email) {
  const allow = [
    process.env.ADMIN_EMAIL_1 || DEFAULT_ADMIN_EMAILS[0],
    process.env.ADMIN_EMAIL_2 || DEFAULT_ADMIN_EMAILS[1],
  ].filter(Boolean).map(norm);
  return allow.includes(norm(email));
}

async function verifyAdmin(auth, req) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const decoded = await auth.verifyIdToken(match[1], true);
  if (decoded?.admin !== true || decoded?.adminAuthVersion !== 2 || !isAllowedEmail(decoded.email)) return null;
  return { uid: decoded.uid, email: decoded.email };
}

async function count(query) {
  const snap = await query.count().get();
  return snap.data().count;
}

// Не даём одной упавшей цифре сломать остальные.
async function safeCount(query) {
  try { return await count(query); } catch (error) {
    console.error('admin-stats count', error?.code || error?.message || error);
    return null;
  }
}

function createHandler({ admin = getAdmin } = {}) {
  return async function adminStatsHandler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    try {
      const { auth, db } = admin();
      const user = await verifyAdmin(auth, req);
      if (!user) return res.status(403).json({ error: 'not_allowed' });
      const [students, parents, tasksSolved, tasksCorrect] = await Promise.all([
        safeCount(db.collection('childIndex')),
        safeCount(db.collection('families')),
        safeCount(db.collectionGroup('solved')),
        safeCount(db.collectionGroup('solved').where('correct', '==', true)),
      ]);
      return res.status(200).json({ students, parents, tasksSolved, tasksCorrect, at: new Date().toISOString() });
    } catch (error) {
      if (error?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
      if (error?.code?.startsWith('auth/')) return res.status(403).json({ error: 'not_allowed' });
      console.error('admin-stats', error?.code || error?.message || error);
      return res.status(500).json({ error: 'failed' });
    }
  };
}

const handler = createHandler();
handler.createHandler = createHandler;
module.exports = handler;
