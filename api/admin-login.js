// Вход администратора. Клиент сначала входит через Google и присылает Firebase
// ID token. Сервер проверяет подпись токена, подтверждённый email и allowlist,
// затем выдаёт Firebase custom token с claim admin:true.
//
// Никакого Gemini/AI здесь нет — это чистая проверка allowlist + выпуск токена.
//
// Vercel → Environment Variables:
//   ADMIN_EMAIL_1, ADMIN_EMAIL_2 = реальные email двух администраторов
//   FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL + FIREBASE_PROJECT_ID (как в webhook/explain)

function getAdminAuth() {
  if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) return null;
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'synaq-88779',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
      }),
    });
  }
  return getAuth();
}

const norm = (s) => String(s || '').trim().toLowerCase();

// Реальные адреса — как временный дефолт, чтобы всё работало без настройки
// Vercel env vars прямо сейчас (тот же приём, что и FIREBASE_WEB_KEY в
// api/explain.js). ADMIN_EMAIL_1/2 в Vercel, если заданы, имеют приоритет —
// так адреса можно сменить без деплоя нового кода.
const DEFAULT_ADMIN_EMAILS = ['makosmalikos@gmail.com', 'nurss.aldb@gmail.com'];

function isAllowedEmail(email) {
  const allow = [
    process.env.ADMIN_EMAIL_1 || DEFAULT_ADMIN_EMAILS[0],
    process.env.ADMIN_EMAIL_2 || DEFAULT_ADMIN_EMAILS[1],
  ].filter(Boolean).map(norm);
  return allow.length > 0 && allow.includes(norm(email));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) return res.status(500).json({ error: 'no_admin_credentials' });

    const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'google_required' });

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(match[1], true);
    } catch (e) {
      return res.status(401).json({ error: 'google_required' });
    }

    const email = norm(decoded.email);
    const provider = decoded.firebase?.sign_in_provider;
    if (provider !== 'google.com' || decoded.email_verified !== true) {
      return res.status(401).json({ error: 'google_required' });
    }
    if (!isAllowedEmail(email)) {
      return res.status(403).json({ error: 'not_allowed' });
    }

    // Версия сессии не позволяет использовать admin-токены, выданные старым
    // небезопасным endpoint, где владение email ещё не подтверждалось.
    const token = await adminAuth.createCustomToken(decoded.uid, {
      admin: true,
      adminAuthVersion: 2,
    });
    return res.status(200).json({ token });
  } catch (e) {
    console.error('admin-login', e.code || e.message);
    return res.status(500).json({ error: 'failed' });
  }
};
