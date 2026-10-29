const { randomUUID } = require('node:crypto');
const { getAdmin } = require('../lib/firebase-admin');
const { REWARDS, rewardById, coinsEarned, coinBalance } = require('../lib/reward-catalog');

const ADMIN_EMAILS = ['makosmalikos@gmail.com', 'nurss.aldb@gmail.com'];
const safeId = (id) => typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
const isChild = (user) => /^[a-z0-9]+@synaq\.kids$/.test(user?.email || '');
const isAdmin = (user) => user?.admin === true && user?.adminAuthVersion === 2
  && [process.env.ADMIN_EMAIL_1 || ADMIN_EMAILS[0], process.env.ADMIN_EMAIL_2 || ADMIN_EMAILS[1]]
    .some((email) => email?.toLowerCase() === String(user.email || '').toLowerCase());
const iso = value => {
  const date = value?.toDate?.() || (value instanceof Date ? value
    : typeof value === 'string' || typeof value === 'number' ? new Date(value) : null);
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
};
const newestFirst = (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '');
const output = (doc) => {
  const d = doc.data();
  return { id: doc.id, rewardId: d.rewardId, price: d.price, status: d.status,
    childUid: d.childUid, parentUid: d.parentUid, createdAt: iso(d.createdAt), updatedAt: iso(d.updatedAt) };
};
const fail = (reason, status) => { throw Object.assign(new Error(reason), { status }); };

function createHandler({ admin = getAdmin, now = () => new Date() } = {}) {
  return async function rewardsHandler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method_not_allowed' });
    try {
      const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
      if (!token) return res.status(401).json({ error: 'login_required' });
      const { auth, db } = admin();
      const user = await auth.verifyIdToken(token, true);
      const role = isAdmin(user) ? 'admin' : isChild(user) ? 'child' : 'parent';
      const requests = db.collection('rewardRequests');
      if (req.method === 'GET') {
        if (role === 'admin') {
          const snap = await requests.orderBy('createdAt', 'desc').limit(100).get();
          const rows = await Promise.all(snap.docs.map(async (doc) => {
            const request = output(doc);
            const family = await db.collection('families').doc(request.parentUid).get();
            return { ...request, parentEmail: String(family.data()?.parentEmail || '') };
          }));
          return res.status(200).json({ requests: rows });
        }
        if (role === 'parent') {
          const snap = await requests.where('parentUid', '==', user.uid).get();
          return res.status(200).json({ requests: snap.docs.map(output).sort(newestFirst) });
        }
        const index = await db.collection('childIndex').doc(user.uid).get();
        if (!index.exists || !index.data()?.parentUid) fail('child_required', 403);
        const [stats, wallet, snap] = await Promise.all([
          db.collection('results').doc(user.uid).collection('stats').doc('summary').get(),
          db.collection('rewardWallets').doc(user.uid).get(),
          requests.where('childUid', '==', user.uid).get(),
        ]);
        const xp = coinsEarned(stats.data()?.xp);
        return res.status(200).json({ xp, balance: coinBalance(xp, wallet.data()?.spentCoins),
          rewards: REWARDS, requests: snap.docs.map(output).sort(newestFirst) });
      }

      const { action, id, rewardId } = req.body || {};
      if (action === 'claim' && role === 'child') {
        const reward = rewardById(rewardId);
        if (!reward) fail('invalid_reward', 400);
        const requestRef = requests.doc(randomUUID()), walletRef = db.collection('rewardWallets').doc(user.uid);
        const indexRef = db.collection('childIndex').doc(user.uid);
        const statsRef = db.collection('results').doc(user.uid).collection('stats').doc('summary');
        const createdAt = now();
        const result = await db.runTransaction(async (tx) => {
          const [index, stats, wallet] = await Promise.all([tx.get(indexRef), tx.get(statsRef), tx.get(walletRef)]);
          const parentUid = index.data()?.parentUid;
          if (!index.exists || typeof parentUid !== 'string' || !parentUid || parentUid.includes('/')) fail('child_required', 403);
          const familyRef = db.collection('families').doc(parentUid);
          const childRef = familyRef.collection('children').doc(user.uid);
          const [family, child] = await Promise.all([tx.get(familyRef), tx.get(childRef)]);
          if (!family.exists || !child.exists || `${child.data()?.code}@synaq.kids` !== user.email) fail('child_required', 403);
          const spent = Math.max(0, Math.floor(Number(wallet.data()?.spentCoins) || 0));
          if (wallet.data()?.activeRequestId) fail('active_request', 409);
          if (coinBalance(stats.data()?.xp, spent) < reward.price) fail('insufficient_coins', 409);
          const storedFulfilledAt = wallet.data()?.lastFulfilledAt;
          const lastFulfilled = storedFulfilledAt?.toDate?.() || (storedFulfilledAt instanceof Date ? storedFulfilledAt : null);
          if (lastFulfilled && createdAt - lastFulfilled < 30 * 86400000) fail('monthly_limit', 409);
          tx.create(requestRef, { childUid: user.uid, parentUid, rewardId, price: reward.price,
            status: 'pending_parent', createdAt, updatedAt: createdAt });
          tx.set(walletRef, { spentCoins: spent + reward.price, activeRequestId: requestRef.id, updatedAt: createdAt }, { merge: true });
          return { id: requestRef.id, balance: coinBalance(stats.data()?.xp, spent + reward.price) };
        });
        return res.status(200).json(result);
      }

      if (!safeId(id)) fail('invalid_request', 400);
      const requestRef = requests.doc(id), changedAt = now();
      const result = await db.runTransaction(async (tx) => {
        const request = await tx.get(requestRef);
        if (!request.exists) fail('not_found', 404);
        const data = request.data();
        if (role === 'parent' && user.uid !== data.parentUid) fail('not_allowed', 403);
        if (role === 'child' && user.uid !== data.childUid) fail('not_allowed', 403);
        const walletRef = db.collection('rewardWallets').doc(data.childUid);
        const wallet = await tx.get(walletRef);
        if (wallet.data()?.activeRequestId !== id) fail('request_closed', 409);
        let status;
        if (action === 'cancel' && role === 'child' && data.status === 'pending_parent') status = 'cancelled';
        else if (action === 'approve' && role === 'parent' && data.status === 'pending_parent') status = 'pending_fulfillment';
        else if (action === 'reject' && role === 'parent' && data.status === 'pending_parent') status = 'rejected';
        else if (action === 'fulfill' && role === 'admin' && data.status === 'pending_fulfillment') status = 'fulfilled';
        else if (action === 'decline' && role === 'admin' && data.status === 'pending_fulfillment') status = 'declined';
        else fail('invalid_transition', 409);
        tx.update(requestRef, { status, updatedAt: changedAt, updatedBy: user.uid });
        if (status === 'fulfilled') tx.set(walletRef, { activeRequestId: null, lastFulfilledAt: changedAt, updatedAt: changedAt }, { merge: true });
        else if (['cancelled', 'rejected', 'declined'].includes(status)) {
          tx.set(walletRef, { activeRequestId: null,
            spentCoins: Math.max(0, Math.floor(Number(wallet.data()?.spentCoins) || 0) - data.price), updatedAt: changedAt }, { merge: true });
        }
        return { id, status };
      });
      return res.status(200).json(result);
    } catch (error) {
      if (error?.code === 'synaq/admin-config') return res.status(503).json({ error: 'server_not_configured' });
      if (error?.code?.startsWith('auth/')) return res.status(401).json({ error: 'login_required' });
      if (error?.status) return res.status(error.status).json({ error: error.message });
      console.error('rewards', error?.code || error?.message || error);
      return res.status(500).json({ error: 'failed' });
    }
  };
}

const handler = createHandler();
handler.createHandler = createHandler;
module.exports = handler;
