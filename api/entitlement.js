// GET /api/entitlement -> { pro: boolean }
// Returns only the current child's entitlement. Family and payment metadata
// remain server-side and are never exposed to the child client.

function getAdmin() {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  const { getFirestore } = require('firebase-admin/firestore');

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'synaq-88779',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return { auth: getAuth(), db: getFirestore() };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  res.setHeader('Cache-Control', 'private, no-store');

  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    return res.status(500).json({ error: 'server_not_configured' });
  }

  try {
    const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'login_required' });

    const { auth, db } = getAdmin();
    const child = await auth.verifyIdToken(match[1], true);
    if (!child?.uid || !String(child.email || '').endsWith('@synaq.kids')) {
      return res.status(403).json({ error: 'child_required' });
    }

    const index = await db.collection('childIndex').doc(child.uid).get();
    const parentUid = index.exists ? String(index.data()?.parentUid || '') : '';
    if (!parentUid) return res.status(200).json({ pro: false });

    const family = await db.collection('families').doc(parentUid).get();
    return res.status(200).json({ pro: family.exists && family.data()?.pro === true });
  } catch (e) {
    if (e?.code?.startsWith('auth/')) return res.status(401).json({ error: 'login_required' });
    console.error('entitlement', e?.code || e?.message || e);
    return res.status(500).json({ error: 'failed' });
  }
};
