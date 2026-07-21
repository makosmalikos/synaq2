// POST /api/checkout  { email? }  →  { url }
// Dodo Payments-те төлем сессиясын ашып, сілтемесін қайтарады.
// uid-ті Firebase ID token-нен аламыз — клиент басқа адамның uid-ін бере алмайды.
//
// CommonJS (module.exports) — explain.js сияқты. ESM-ге көшірмеңіз:
// түбірдегі package.json-да "type": "module" жоқ, Vercel функцияны іске қоса алмайды.

const API = process.env.DODO_ENV === 'test_mode'
  ? 'https://test.dodopayments.com'
  : 'https://live.dodopayments.com';

function getAdminAuth() {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return getAuth();
}

function getAdminStore() {
  const { getFirestore } = require('firebase-admin/firestore');
  return getFirestore();
}

async function authenticatedUser(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return getAdminAuth().verifyIdToken(match[1]);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL
      || !process.env.FIREBASE_PRIVATE_KEY || !process.env.DODO_PAYMENTS_API_KEY
      || !process.env.DODO_PRODUCT_ID) {
    console.error('Checkout environment variables are incomplete');
    return res.status(500).json({ error: 'Төлем баптаулары толық емес' });
  }

  try {
    const user = await authenticatedUser(req);
    if (!user?.uid) return res.status(401).json({ error: 'Қайта кіріңіз' });
    const family = await getAdminStore().collection('families').doc(user.uid).get();
    if (!family.exists) return res.status(403).json({ error: 'Төлем тек ата-анаға қолжетімді' });

    const email = user.email || family.data()?.parentEmail;
    const name = user.name || family.data()?.parentName;
    const r = await fetch(`${API}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: process.env.DODO_PRODUCT_ID, quantity: 1 }],
        customer: email ? { email, name: name || undefined } : undefined,
        return_url: `${process.env.APP_URL || 'https://synaq.app'}/app?paid=1`,
        metadata: { parentUid: user.uid },
      }),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.checkout_url) {
      console.error('dodo checkout failed', r.status, data);
      return res.status(502).json({ error: `Dodo ${r.status}` });
    }
    return res.status(200).json({ url: data.checkout_url });
  } catch (e) {
    if (e?.code?.startsWith('auth/')) {
      console.warn('checkout auth failed', e.code);
      return res.status(401).json({ error: 'Қайта кіріңіз' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Сервер қатесі' });
  }
};
