// Weekly access uses the same Kaspi link and manual payment review.
const { getAdmin } = require('../backend/lib/firebase-admin');
const { familyPlan, hasFullAccess } = require('../backend/lib/plans');
const { weeklyWindow, passId, PRICE_KZT } = require('../backend/lib/weekly-mock');
const { kaspiUrl } = require('../shared/payments.json');
const failure = (code, status) => Object.assign(new Error(code), { status });

async function identity(db, user) {
  if (!user?.uid) throw failure('auth-required', 401);
  if (!String(user.email || '').endsWith('@synaq.kids')) {
    const family = await db.collection('families').doc(user.uid).get();
    if (!family.exists) throw failure('family-required', 403);
    return { parentUid: user.uid, family: family.data(), email: user.email, name: user.name };
  }
  const index = await db.collection('childIndex').doc(user.uid).get();
  const parentUid = index.data()?.parentUid;
  if (!index.exists || !(typeof parentUid === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(parentUid))) throw failure('child-required', 403);
  const familyRef = db.collection('families').doc(parentUid);
  const [family, child] = await Promise.all([familyRef.get(), familyRef.collection('children').doc(user.uid).get()]);
  if (!family.exists || !child.exists || `${child.data().code}@synaq.kids` !== user.email) throw failure('child-required', 403);
  return { parentUid, family: family.data(), email: family.data().parentEmail, name: family.data().parentName };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'auth-required' });
  try {
    const { auth, db } = getAdmin();
    const user = await auth.verifyIdToken(token, true);
    const owner = await identity(db, user);
    const window = weeklyWindow();
    if (hasFullAccess(familyPlan(owner.family))) return res.status(200).json({ access: true, included: true, ...window });
    const pass = await db.collection('weeklyMockPasses').doc(passId(owner.parentUid, window.weekKey)).get();
    if (pass.data()?.paid === true) return res.status(200).json({ access: true, paid: true, ...window });
    return res.status(200).json({ url: kaspiUrl, provider: 'kaspi', manualActivation: true, priceKzt: PRICE_KZT, ...window });
  } catch (error) {
    if (error?.code?.startsWith('auth/')) return res.status(401).json({ error: 'auth-required' });
    return res.status(error?.status || 503).json({ error: error?.status ? error.message : 'weekly-payment-unavailable' });
  }
};
