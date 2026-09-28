// Admin-only lead inbox. Shares the catch-all Vercel function.
const { getAdmin } = require('../lib/firebase-admin');

const DEFAULT_ADMIN_EMAILS = ['makosmalikos@gmail.com', 'nurss.aldb@gmail.com'];
const STATUSES = new Set(['new', 'contacted', 'closed']);

const norm = (value) => String(value || '').trim().toLowerCase();
const safeId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);

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

function iso(value) {
  const date = value?.toDate?.() || (value instanceof Date ? value : value ? new Date(value) : null);
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function createHandler({ admin = getAdmin } = {}) {
  return async function adminLeadsHandler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (!['GET', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'method_not_allowed' });
    try {
      const { auth, db } = admin();
      const user = await verifyAdmin(auth, req);
      if (!user) return res.status(403).json({ error: 'not_allowed' });

      if (req.method === 'GET') {
        const snapshot = await db.collection('leads').orderBy('createdAt', 'desc').limit(100).get();
        const leads = snapshot.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            name: String(data.name || ''),
            phone: String(data.phone || ''),
            role: data.role === 'student' ? 'student' : 'parent',
            comment: String(data.comment || ''),
            lang: data.lang === 'ru' ? 'ru' : 'kk',
            status: STATUSES.has(data.status) ? data.status : 'new',
            createdAt: iso(data.createdAt),
            updatedAt: iso(data.updatedAt),
          };
        });
        return res.status(200).json({ leads });
      }

      const id = req.body?.id;
      const status = req.body?.status;
      if (!safeId(id) || !STATUSES.has(status)) return res.status(400).json({ error: 'invalid_update' });
      const ref = db.collection('leads').doc(id);
      const snapshot = await ref.get();
      if (!snapshot.exists) return res.status(404).json({ error: 'not_found' });
      const updatedAt = new Date();
      await ref.update({ status, updatedAt, updatedBy: user.email });
      return res.status(200).json({ ok: true, status, updatedAt: updatedAt.toISOString() });
    } catch (error) {
      if (error?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
      if (error?.code?.startsWith('auth/')) return res.status(403).json({ error: 'not_allowed' });
      console.error('admin-leads', error?.code || error?.message || error);
      return res.status(500).json({ error: 'failed' });
    }
  };
}

const handler = createHandler();
handler.createHandler = createHandler;
module.exports = handler;
