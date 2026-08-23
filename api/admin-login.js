// Вход администратора — без пароля. Email проверяется server-side против allowlist
// ADMIN_EMAIL_1 / ADMIN_EMAIL_2 (Vercel → Environment Variables). Если email
// разрешён, через firebase-admin выдаётся Firebase custom token; фронт логинится
// им через signInWithCustomToken() (frontend/src/firebase.js: loginAdmin()).
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
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    if (!body || typeof body !== 'object') body = {};

    const email = norm(body.email);
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'bad_email' });

    if (!isAllowedEmail(email)) {
      return res.status(403).json({ error: 'not_allowed' });
    }

    const adminAuth = getAdminAuth();
    if (!adminAuth) return res.status(500).json({ error: 'no_admin_credentials' });

    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        user = await adminAuth.createUser({ email, emailVerified: true });
      } else {
        throw e;
      }
    }

    // Клейм admin:true — единственное, на что опирается isAdmin() на фронте
    // и verifyAdmin() в api/admin-task.js. Сам custom token живёт недолго,
    // но клейм переживает в ID-токене, который клиент обновляет автоматически.
    const token = await adminAuth.createCustomToken(user.uid, { admin: true });
    return res.status(200).json({ token });
  } catch (e) {
    console.error('admin-login', e.code || e.message);
    return res.status(500).json({ error: 'failed' });
  }
};
