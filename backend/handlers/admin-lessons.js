// Админка уроков: список записей, отметки (не пришёл ребёнок / наставник), жалобы, выплаты.
// GET ?view=lessons | ?view=payouts&month=YYYY-MM, POST { id, status }.
const { getAdmin } = require('../lib/firebase-admin');
const L = require('../lib/lessons');

const DEFAULT_ADMIN_EMAILS = ['makosmalikos@gmail.com', 'nurss.aldb@gmail.com'];
const norm = (v) => String(v || '').trim().toLowerCase();
const safeId = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const SETTABLE = new Set(['booked', 'completed', 'no_show_child', 'no_show_mentor']);

function isAllowedEmail(email) {
  return [process.env.ADMIN_EMAIL_1 || DEFAULT_ADMIN_EMAILS[0], process.env.ADMIN_EMAIL_2 || DEFAULT_ADMIN_EMAILS[1]]
    .filter(Boolean).map(norm).includes(norm(email));
}
async function verifyAdmin(auth, req) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const decoded = await auth.verifyIdToken(match[1], true);
  if (decoded?.admin !== true || decoded?.adminAuthVersion !== 2 || !isAllowedEmail(decoded.email)) return null;
  return { uid: decoded.uid, email: decoded.email };
}

const row = (id, l, now) => ({ id, mentorId: l.mentorId, mentorName: l.mentorName || '', childName: l.childName || '', startAt: l.startAt,
  endAt: l.endAt, topic: l.topic || '', taskIds: l.taskIds || [], status: L.effectiveStatus(l, now), markedStatus: l.status,
  rating: l.rating || null, ratingComment: l.ratingComment || '', complaint: l.complaint ? { text: l.complaint.text, by: l.complaint.by } : null,
  rateKzt: Number(l.rateKzt) || 3000 });

function createHandler({ admin = getAdmin, now = Date.now } = {}) {
  return async function adminLessonsHandler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method_not_allowed' });
    try {
      const { auth, db } = admin();
      const user = await verifyAdmin(auth, req);
      if (!user) return res.status(403).json({ error: 'not_allowed' });
      const at = now();

      if (req.method === 'GET') {
        if (req.query?.view === 'payouts') {
          const month = String(req.query.month || '');
          if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ error: 'bad_month' });
          const from = Date.parse(`${month}-01T00:00:00+05:00`);
          const [y, m] = month.split('-').map(Number);
          const to = Date.parse(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01T00:00:00+05:00`);
          const snap = await db.collection('lessons').where('startAt', '>=', from).where('startAt', '<', to).limit(2000).get();
          const byMentor = new Map();
          for (const doc of snap.docs) {
            const l = doc.data();
            if (!L.PAID.has(L.effectiveStatus(l, at))) continue;
            const item = byMentor.get(l.mentorId) || { mentorId: l.mentorId, mentorName: l.mentorName || '', lessons: 0, amountKzt: 0 };
            item.lessons += 1; item.amountKzt += Number(l.rateKzt) || 3000;
            byMentor.set(l.mentorId, item);
          }
          const mentors = [...byMentor.values()].sort((a, b) => b.amountKzt - a.amountKzt);
          return res.status(200).json({ month, mentors, totalKzt: mentors.reduce((s, x) => s + x.amountKzt, 0) });
        }
        const snap = await db.collection('lessons').orderBy('startAt', 'desc').limit(200).get();
        return res.status(200).json({ lessons: snap.docs.map((d) => row(d.id, d.data(), at)), now: at });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (!safeId(body.id) || !SETTABLE.has(body.status)) return res.status(400).json({ error: 'invalid_update' });
      const result = await db.runTransaction(async (tx) => {
        const ref = db.collection('lessons').doc(body.id);
        const snap = await tx.get(ref);
        if (!snap.exists) return null;
        const l = snap.data();
        if (!(L.COUNTED.has(l.status) || l.status === 'no_show_mentor')) return { error: 'not_active' };
        const delta = (L.COUNTED.has(body.status) ? 1 : 0) - (L.COUNTED.has(l.status) ? 1 : 0);
        if (delta) {
          const cRef = db.collection('lessonCredits').doc(l.creditKey);
          const credit = await tx.get(cRef);
          tx.set(cRef, { used: Math.max(0, (credit.data()?.used || 0) + delta) }, { merge: true });
        }
        tx.update(ref, { status: body.status, markedAt: new Date(at), markedBy: user.email });
        return { ok: true };
      });
      if (!result) return res.status(404).json({ error: 'not_found' });
      if (result.error) return res.status(409).json({ error: result.error });
      return res.status(200).json(result);
    } catch (error) {
      if (error?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
      if (error?.code?.startsWith?.('auth/')) return res.status(403).json({ error: 'not_allowed' });
      if (error instanceof SyntaxError) return res.status(400).json({ error: 'invalid_json' });
      console.error('admin-lessons', error?.code || error?.message || error);
      return res.status(500).json({ error: 'failed' });
    }
  };
}

const handler = createHandler();
handler.createHandler = createHandler;
module.exports = handler;
