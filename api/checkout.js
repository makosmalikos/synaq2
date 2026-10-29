// Kaspi is a fixed payment link. Access is granted manually after payment review.
const { getAdmin } = require('../backend/lib/firebase-admin');
const { familyPlan, planRank, PLAN_CATALOG } = require('../backend/lib/plans');
const { kaspiUrl } = require('../shared/payments.json');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'login_required' });
  try {
    const { auth, db } = getAdmin();
    const user = await auth.verifyIdToken(token, true);
    if (!user?.uid) return res.status(401).json({ error: 'login_required' });
    if (String(user.email || '').endsWith('@synaq.kids')) return res.status(403).json({ error: 'parent_required' });
    const plan = req.body?.plan ?? 'pro';
    const lessons = plan === 'mentor' ? Number(req.body?.lessons) : null;
    if (!['pro', 'mentor'].includes(plan) || (plan === 'mentor' && ![2, 3].includes(lessons))) {
      return res.status(400).json({ error: 'bad_plan' });
    }
    const family = await db.collection('families').doc(user.uid).get();
    if (!family.exists) return res.status(403).json({ error: 'family_required' });
    const currentPlan = familyPlan(family.data());
    if (planRank(currentPlan) >= planRank(plan)) return res.status(409).json({ error: plan === 'pro' ? 'already_pro' : 'already_plan' });
    if (currentPlan !== 'free') return res.status(409).json({ error: 'plan_change_required' });
    const priceKzt = plan === 'mentor' ? PLAN_CATALOG.mentor.lessonPricesKzt[lessons] : PLAN_CATALOG.pro.priceKzt;
    // Never record a successful payment or change entitlements from a link request.
    return res.status(200).json({ url: kaspiUrl, provider: 'kaspi', manualActivation: true, plan, lessons, priceKzt });
  } catch (error) {
    if (error?.code?.startsWith('auth/')) return res.status(401).json({ error: 'login_required' });
    if (error?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
    console.error('checkout failed', error?.code || 'storage_or_server_error');
    return res.status(503).json({ error: 'checkout_unavailable' });
  }
};
