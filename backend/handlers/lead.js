// Public landing-page lead capture. This handler intentionally shares the
// catch-all Vercel function so it does not consume another Hobby function slot.
const { createHash } = require('node:crypto');
const { isIP } = require('node:net');
const { getAdmin } = require('../lib/firebase-admin');

const MAX_PER_HOUR = 5;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function clean(value, max) {
  if (typeof value !== 'string' || CONTROL_CHARS.test(value)) return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

function clientAddress(req, trustVercel) {
  // Vercel overwrites X-Forwarded-For. A direct Node server must never trust
  // a caller-supplied proxy header (nor an arbitrary CF-Connecting-IP).
  const forwarded = trustVercel && typeof req.headers['x-forwarded-for'] === 'string'
    ? req.headers['x-forwarded-for'].split(',')[0].trim() : '';
  return (isIP(forwarded) ? forwarded : req.socket?.remoteAddress || 'unknown').toLowerCase();
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

function createHandler({ admin = getAdmin, now = () => new Date(), trustVercel = process.env.VERCEL === '1',
  globalLimit = Number(process.env.LEAD_GLOBAL_HOURLY_LIMIT ?? 100) } = {}) {
  if (!Number.isSafeInteger(globalLimit) || globalLimit < 1 || globalLimit > 10000) throw new Error('Invalid lead global limit');
  return async function leadHandler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const lead = validate(req.body);
    if (lead?.bot) return res.status(201).json({ ok: true });
    if (!lead) return res.status(400).json({ error: 'invalid_lead' });

    let retryAfter = 3600;
    try {
      const { db } = admin();
      const createdAt = now();
      const hour = createdAt.toISOString().slice(0, 13);
      retryAfter = Math.max(1, Math.ceil((3600000 - createdAt.getTime() % 3600000) / 1000));
      const salt = process.env.LEAD_RATE_SALT || process.env.FIREBASE_PROJECT_ID || 'synaq';
      const addressHash = createHash('sha256').update(`${salt}:${clientAddress(req, trustVercel)}`).digest('hex');
      const rateRef = db.collection('leadRateLimits').doc(addressHash);
      const phoneHash = createHash('sha256').update(`${salt}:phone:${lead.phone.replace(/\D/g, '')}`).digest('hex');
      const phoneRef = db.collection('leadRateLimits').doc('phone_' + phoneHash);
      const globalRef = db.collection('platformRateLimits').doc('leads');
      const leadRef = db.collection('leads').doc();

      await db.runTransaction(async (tx) => {
        const refs = [rateRef, phoneRef, globalRef], limits = [MAX_PER_HOUR, 3, globalLimit];
        const snapshots = await Promise.all(refs.map(ref => tx.get(ref)));
        const counts = snapshots.map(snapshot => {
          const value = snapshot.data() || {};
          if (value.hour !== hour) return 0;
          if (!Number.isSafeInteger(value.count) || value.count < 0) throw Object.assign(new Error('rate_limit'), { code: 'rate_limit' });
          return value.count;
        });
        if (counts.some((count, i) => count >= limits[i])) throw Object.assign(new Error('rate_limit'), { code: 'rate_limit' });
        refs.forEach((ref, i) => tx.set(ref, { hour, count: counts[i] + 1, updatedAt: createdAt }));
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
      if (error?.code === 'rate_limit') {
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({ error: 'rate_limit' });
      }
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
