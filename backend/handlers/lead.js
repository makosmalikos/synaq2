// Public landing-page lead capture. This handler intentionally shares the
// catch-all Vercel function so it does not consume another Hobby function slot.
const { createHash } = require('node:crypto');
const { getAdmin } = require('../lib/firebase-admin');

const MAX_PER_HOUR = 5;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function clean(value, max) {
  if (typeof value !== 'string' || CONTROL_CHARS.test(value)) return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

function clientAddress(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function validate(body) {
  const name = clean(body?.name, 80);
  const phone = clean(body?.phone, 32);
  const role = clean(body?.role, 16);
  const comment = clean(body?.comment, 600);
  const website = clean(body?.website, 200);
  if (website) return { bot: true };
  if (name.length < 2 || !/^\+?[0-9][0-9 ()-]{6,24}$/.test(phone)
    || !['parent', 'student'].includes(role)) return null;
  return { name, phone, role, comment };
}

function createHandler({ admin = getAdmin, now = () => new Date() } = {}) {
  return async function leadHandler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const lead = validate(req.body);
    if (lead?.bot) return res.status(201).json({ ok: true });
    if (!lead) return res.status(400).json({ error: 'invalid_lead' });

    try {
      const { db } = admin();
      const createdAt = now();
      const hour = createdAt.toISOString().slice(0, 13);
      const salt = process.env.LEAD_RATE_SALT || process.env.FIREBASE_PROJECT_ID || 'synaq';
      const addressHash = createHash('sha256').update(`${salt}:${clientAddress(req)}`).digest('hex');
      const rateRef = db.collection('leadRateLimits').doc(addressHash);
      const leadRef = db.collection('leads').doc();

      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(rateRef);
        const previous = snapshot.exists ? snapshot.data() : {};
        const count = previous.hour === hour && Number.isSafeInteger(previous.count) ? previous.count : 0;
        if (count >= MAX_PER_HOUR) throw Object.assign(new Error('rate_limit'), { code: 'rate_limit' });
        tx.set(rateRef, { hour, count: count + 1, updatedAt: createdAt });
        tx.set(leadRef, { ...lead, status: 'new', source: 'landing', lang: req.body?.lang === 'ru' ? 'ru' : 'kk', createdAt });
      });

      const telegramToken = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
      const telegramChat = String(process.env.TELEGRAM_LEAD_CHAT_ID || '').trim();
      if (telegramToken && telegramChat) {
        const role = lead.role === 'parent' ? 'Ата-ана / Родитель' : 'Оқушы / Ученик';
        const text = ['Жаңа SYNAQ өтінімі', `Аты: ${lead.name}`, `Телефон: ${lead.phone}`, `Кім: ${role}`,
          lead.comment ? `Түсініктеме: ${lead.comment}` : ''].filter(Boolean).join('\n');
        try {
          const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST', signal: AbortSignal.timeout(5000), headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: telegramChat, text }),
          });
          if (!response.ok) console.error('lead telegram', response.status);
        } catch (error) {
          console.error('lead telegram', error?.name || error?.message || error);
        }
      }

      return res.status(201).json({ ok: true });
    } catch (error) {
      if (error?.code === 'rate_limit') return res.status(429).json({ error: 'rate_limit' });
      if (error?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
      console.error('lead', error?.code || error?.message || error);
      return res.status(500).json({ error: 'failed' });
    }
  };
}

const handler = createHandler();
handler.createHandler = createHandler;
handler.validate = validate;
module.exports = handler;
