// POST /api/child-password { childUid, password }
// Allows an authenticated parent to change only their own child's PIN.
// The child's Firebase UID stays unchanged, so progress and subscription links
// remain intact for all existing accounts.

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

function bodyOf(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
  }
  return req.body && typeof req.body === 'object' ? req.body : {};
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    return res.status(500).json({ error: 'server_not_configured' });
  }

  try {
    const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'login_required' });

    const { auth, db } = getAdmin();
    const parent = await auth.verifyIdToken(match[1], true);
    if (!parent?.uid || String(parent.email || '').endsWith('@synaq.kids')) {
      return res.status(403).json({ error: 'not_child_owner' });
    }

    const body = bodyOf(req);
    const childUid = String(body.childUid || '').trim();
    const password = String(body.password || '');
    if (!childUid) return res.status(400).json({ error: 'child_not_found' });
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: 'weak_password' });
    }

    const childRef = db.collection('families').doc(parent.uid).collection('children').doc(childUid);
    const indexRef = db.collection('childIndex').doc(childUid);
    const [childDoc, indexDoc] = await Promise.all([childRef.get(), indexRef.get()]);
    if (!childDoc.exists || !indexDoc.exists || indexDoc.data()?.parentUid !== parent.uid) {
      return res.status(403).json({ error: 'not_child_owner' });
    }

    let childUser;
    try {
      childUser = await auth.getUser(childUid);
    } catch (e) {
      if (e?.code === 'auth/user-not-found') return res.status(404).json({ error: 'child_not_found' });
      throw e;
    }

    const expectedEmail = `${String(childDoc.data()?.code || '').trim().toLowerCase()}@synaq.kids`;
    if (!childUser.email?.endsWith('@synaq.kids') || childUser.email !== expectedEmail) {
      return res.status(403).json({ error: 'not_child_owner' });
    }

    await auth.updateUser(childUid, { password });
    return res.status(200).json({ ok: true });
  } catch (e) {
    if (e?.code?.startsWith('auth/')) return res.status(401).json({ error: 'login_required' });
    console.error('child-password', e?.code || e?.message || e);
    return res.status(500).json({ error: 'failed' });
  }
};
