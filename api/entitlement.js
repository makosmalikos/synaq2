// GET /api/entitlement -> { pro: boolean }
// Returns only the current child's entitlement. Family and payment metadata
// remain server-side and are never exposed to the child client.

const { getAdmin } = require('../backend/lib/firebase-admin');
const { familyPlan, millis } = require('../backend/lib/plans');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  res.setHeader('Cache-Control', 'private, no-store');

  if (process.env.SYNAQ_USE_EMULATORS !== '1' && (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY)) {
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
    if (!parentUid) return res.status(200).json({ plan: 'free', standard: false, pro: false, expiresAt: null });

    const family = await db.collection('families').doc(parentUid).get();
    const plan = family.exists ? familyPlan(family.data()) : 'free';
    const expiresMs = millis(family.data()?.planExpiresAt ?? family.data()?.proExpiresAt);
    return res.status(200).json({ plan, standard: plan === 'standard', pro: plan === 'pro',
      expiresAt: plan !== 'free' && expiresMs ? new Date(expiresMs).toISOString() : null });
  } catch (e) {
    if (e?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
    if (e?.code?.startsWith('auth/')) return res.status(401).json({ error: 'login_required' });
    console.error('entitlement', e?.code || e?.message || e);
    return res.status(500).json({ error: 'failed' });
  }
};
