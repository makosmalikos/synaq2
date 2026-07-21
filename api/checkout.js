// POST /api/checkout  { email?, name? }  →  { url }
// uid берётся из Firebase ID token (Authorization: Bearer …).

const API = process.env.DODO_ENV === 'test_mode'
  ? 'https://test.dodopayments.com'
  : 'https://live.dodopayments.com';

const FIREBASE_WEB_KEY = process.env.FIREBASE_WEB_KEY || 'AIzaSyATdVvMsNkN0F66XipkShtFe0wKizu2r6o';

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

async function verifyToken(idToken) {
  if (!idToken) return null;
  try {
    const auth = getAdminAuth();
    if (auth) {
      const decoded = await auth.verifyIdToken(idToken);
      return decoded.uid;
    }
  } catch (e) {
    console.error('admin verify', e.code || e.message);
  }
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!r.ok) return null;
    const data = await r.json();
    return data.users?.[0]?.localId || null;
  } catch (e) {
    console.error('lookup error', e.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const uid = await verifyToken(idToken);
  if (!uid) return res.status(401).json({ error: 'unauthorized' });

  const { email, name } = req.body || {};

  if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.DODO_PRODUCT_ID) {
    console.error('DODO_PAYMENTS_API_KEY немесе DODO_PRODUCT_ID жоқ');
    return res.status(500).json({ error: 'Төлем баптаулары толық емес' });
  }

  try {
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
        metadata: { parentUid: uid },
      }),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.checkout_url) {
      console.error('dodo checkout failed', r.status, data);
      return res.status(502).json({ error: `Dodo ${r.status}` });
    }
    return res.status(200).json({ url: data.checkout_url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Сервер қатесі' });
  }
};
