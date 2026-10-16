// Админ-панель наставников: список, добавление, изменение, расписание.
// GET → { mentors }, POST { id?, ...поля } → создать/обновить, DELETE?id → скрыть.
// Данные лежат в коллекции `mentors`, правила Firestore её закрывают для клиентов:
// читать и писать может только этот серверный обработчик.
const { randomUUID } = require('node:crypto');
const { getAdmin } = require('../lib/firebase-admin');

const DEFAULT_ADMIN_EMAILS = ['makosmalikos@gmail.com', 'nurss.aldb@gmail.com'];
const norm = (value) => String(value || '').trim().toLowerCase();
const safeId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const bad = (message) => Object.assign(new Error(message), { status: 400 });
const LESSON_RATE_KZT = 3000;

function isAllowedEmail(email) {
  const allow = [process.env.ADMIN_EMAIL_1 || DEFAULT_ADMIN_EMAILS[0], process.env.ADMIN_EMAIL_2 || DEFAULT_ADMIN_EMAILS[1]]
    .filter(Boolean).map(norm);
  return allow.includes(norm(email));
}

async function verifyAdmin(auth, req) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const decoded = await auth.verifyIdToken(match[1], true);
  if (decoded?.admin !== true || decoded?.adminAuthVersion !== 2 || !isAllowedEmail(decoded.email)) return null;
  return { uid: decoded.uid, email: decoded.email };
}

// Слоты недели: { day: 1..7 (пн..вс), time: 'HH:MM' } — время начала 40-минутного урока (Алматы).
function cleanSlots(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 200) throw bad('invalid_slots');
  const seen = new Set();
  const slots = [];
  for (const slot of value) {
    const day = Number(slot?.day), time = String(slot?.time || '');
    if (!Number.isInteger(day) || day < 1 || day > 7 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw bad('invalid_slots');
    const key = `${day}_${time}`;
    if (!seen.has(key)) { seen.add(key); slots.push({ day, time }); }
  }
  return slots.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
}

function cleanMentor(body) {
  const name = String(body?.name || '').trim();
  const email = norm(body?.email);
  const meetLink = String(body?.meetLink || '').trim();
  const phone = String(body?.phone || '').trim();
  const bio = String(body?.bio || '').trim();
  if (!name || name.length > 80) throw bad('invalid_name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw bad('invalid_email');
  if (meetLink && !/^https:\/\/[^\s]{4,300}$/.test(meetLink)) throw bad('invalid_link');
  if (phone.length > 30 || bio.length > 500) throw bad('invalid_text');
  return { name, email, meetLink, phone, bio, active: body?.active !== false, slots: cleanSlots(body?.slots), rateKzt: LESSON_RATE_KZT };
}

const iso = (value) => {
  const date = value?.toDate?.() || (value instanceof Date ? value : null);
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
};
const publicMentor = (id, data) => ({ id, name: data.name || '', email: data.email || '', phone: data.phone || '', bio: data.bio || '',
  meetLink: data.meetLink || '', active: data.active !== false, slots: Array.isArray(data.slots) ? data.slots : [],
  rateKzt: Number(data.rateKzt) || LESSON_RATE_KZT, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt) });

function createHandler({ admin = getAdmin } = {}) {
  return async function adminMentorsHandler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'method_not_allowed' });
    try {
      const { auth, db } = admin();
      const user = await verifyAdmin(auth, req);
      if (!user) return res.status(403).json({ error: 'not_allowed' });
      const mentors = db.collection('mentors');

      if (req.method === 'GET') {
        const snapshot = await mentors.orderBy('createdAt', 'desc').limit(200).get();
        return res.status(200).json({ mentors: snapshot.docs.map((doc) => publicMentor(doc.id, doc.data() || {})) });
      }
      if (req.method === 'DELETE') {
        const id = req.query?.id || req.body?.id;
        if (!safeId(id)) return res.status(400).json({ error: 'invalid_id' });
        const ref = mentors.doc(id);
        if (!(await ref.get()).exists) return res.status(404).json({ error: 'not_found' });
        await ref.set({ active: false, updatedAt: new Date(), updatedBy: user.email }, { merge: true });
        return res.status(200).json({ ok: true });
      }
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const data = cleanMentor(body);
      const now = new Date();
      if (body.id != null) {
        if (!safeId(body.id)) return res.status(400).json({ error: 'invalid_id' });
        const ref = mentors.doc(body.id);
        if (!(await ref.get()).exists) return res.status(404).json({ error: 'not_found' });
        await ref.set({ ...data, updatedAt: now, updatedBy: user.email }, { merge: true });
        return res.status(200).json({ mentor: publicMentor(body.id, { ...data, updatedAt: now }) });
      }
      const id = `m_${randomUUID().replaceAll('-', '')}`;
      await mentors.doc(id).set({ ...data, createdAt: now, updatedAt: now, createdBy: user.email });
      return res.status(201).json({ mentor: publicMentor(id, { ...data, createdAt: now, updatedAt: now }) });
    } catch (error) {
      if (error?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
      if (error?.code?.startsWith('auth/')) return res.status(403).json({ error: 'not_allowed' });
      if (error?.status) return res.status(error.status).json({ error: error.message });
      if (error instanceof SyntaxError) return res.status(400).json({ error: 'invalid_json' });
      console.error('admin-mentors', error?.code || error?.message || error);
      return res.status(500).json({ error: 'failed' });
    }
  };
}

const handler = createHandler();
handler.createHandler = createHandler;
module.exports = handler;
