const { createHash, randomUUID } = require('node:crypto');
const { getAdmin } = require('../lib/firebase-admin');
const defaults = ['makosmalikos@gmail.com','nurss.aldb@gmail.com'];
const safeId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
const hash = (key) => createHash('sha256').update(key).digest('hex');
let modelPromise;
const model = () => modelPromise ||= import('../../frontend/src/adminTaskModel.js');
function createHandler({ admin = getAdmin, staticPool = async () => (await import('../../frontend/src/bank.js')).POOL } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control','private, no-store');
    if (!['GET','POST','PATCH'].includes(req.method)) return res.status(405).json({ error:'method_not_allowed' });
    try {
      const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
      if (!token) return res.status(403).json({ error:'not_allowed' });
      const { auth, db } = admin();
      const user = await auth.verifyIdToken(token, true);
      const allow = [process.env.ADMIN_EMAIL_1 || defaults[0],process.env.ADMIN_EMAIL_2 || defaults[1]].map((v) => v.trim().toLowerCase());
      if (user.admin !== true || user.adminAuthVersion !== 2 || !allow.includes(String(user.email || '').trim().toLowerCase())) return res.status(403).json({ error:'not_allowed' });
      const { normalizeTask, validateTask, contentKey } = await model();
      if (req.method === 'GET') {
        const cursor = req.query?.cursor;
        if (cursor && !safeId(cursor)) return res.status(400).json({ error:'bad_cursor' });
        let query = db.collection('bankTasks').orderBy('__name__');
        if (cursor) query = query.startAfter(cursor);
        const snap = await query.limit(51).get();
        const tasks = snap.docs.slice(0,50).map((doc) => {
          const raw = doc.data();
          return { ...normalizeTask({ ...raw, status:raw.status || 'published' }), id:doc.id, revision:raw.revision || 0 };
        });
        return res.status(200).json({ tasks, cursor:snap.docs.length > 50 ? tasks.at(-1).id : null });
      }
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error:'bad_body' });
      const bulk = Array.isArray(body.tasks);
      if (bulk && req.method !== 'POST') return res.status(400).json({ error:'bad_body' });
      const items = bulk ? body.tasks : [body];
      if (!items.length || items.length > 100) return res.status(400).json({ error:'batch_size' });
      if (req.method === 'PATCH' && (!safeId(body.id) || !Number.isInteger(body.revision))) return res.status(400).json({ error:'bad_id' });
      const tasks = items.map((item) => normalizeTask(item));
      const issues = tasks.map((task, index) => ({ row:index+2, errors:validateTask(task, bulk || task.status !== 'draft') })).filter((item) => item.errors.length);
      if (bulk && tasks.some((task) => task.status !== 'draft')) return res.status(400).json({ error:'import_drafts_only' });
      if (issues.length) return res.status(400).json({ error:'validation_failed', issues });
      if (req.method === 'POST' && tasks.some((task) => task.status !== 'draft')) return res.status(409).json({ error:'review_required' });
      const [snapshot, pool] = await Promise.all([db.collection('bankTasks').get(), staticPool()]);
      const known = new Map(pool.map((task) => [contentKey(task),task.id]));
      snapshot.docs.forEach((doc) => known.set(contentKey(doc.data()),doc.id));
      tasks.forEach((task, index) => {
        const key = contentKey(task), found = known.get(key);
        if (found && found !== (req.method === 'PATCH' ? body.id : null)) issues.push({ row:index+2, errors:['duplicate_task'] });
        known.set(key, req.method === 'PATCH' ? body.id : 'batch');
      });
      if (issues.length) return res.status(409).json({ error:'duplicate_task', issues });
      if (body.action === 'validate') return res.status(200).json({ ok:true, count:tasks.length });
      const ids = tasks.map(() => `admin_${randomUUID()}`);
      await db.runTransaction(async (transaction) => {
        const existing = req.method === 'PATCH' ? await transaction.get(db.collection('bankTasks').doc(body.id)) : null;
        if (existing && !existing.exists) throw Object.assign(new Error('not_found'),{ status:404 });
        const old = existing?.data();
        if (old) {
          if ((old.revision || 0) !== body.revision) throw Object.assign(new Error('stale_revision'),{ status:409 });
          if (!old.status || old.status === 'published') throw Object.assign(new Error('published_locked'),{ status:409 });
          if (tasks[0].status === 'published') {
            const previous = normalizeTask(old);
            if (old.status !== 'reviewed' || JSON.stringify({ ...previous, status:'published' }) !== JSON.stringify(tasks[0])) throw Object.assign(new Error('review_required'),{ status:409 });
          }
        }
        const keys = tasks.map((task) => hash(contentKey(task)));
        const locks = [];
        for (const key of keys) locks.push(await transaction.get(db.collection('bankTaskKeys').doc(key)));
        locks.forEach((lock) => {
          if (lock.exists && lock.data().taskId !== body.id) throw Object.assign(new Error('duplicate_task'),{ status:409 });
        });
        tasks.forEach((task, index) => {
          const id = req.method === 'PATCH' ? body.id : ids[index];
          transaction.set(db.collection('bankTasks').doc(id), { ...task, image:null, source:'admin',
            revision:(old?.revision || 0)+1, createdBy:old?.createdBy || user.email,
            createdAt:old?.createdAt || new Date(), updatedBy:user.email, updatedAt:new Date() });
          transaction.set(db.collection('bankTaskKeys').doc(keys[index]),{ taskId:id });
        });
        if (old) {
          const oldKey = hash(contentKey(old));
          if (oldKey !== keys[0]) transaction.delete(db.collection('bankTaskKeys').doc(oldKey));
        }
      });
      return res.status(200).json({ id:req.method === 'PATCH' ? body.id : ids[0], ids:req.method === 'PATCH' ? [body.id] : ids, count:tasks.length });
    } catch (error) {
      if (error?.code === 'synaq/admin-config') return res.status(503).json({ error:'server_not_configured' });
      if (error?.code?.startsWith('auth/')) return res.status(403).json({ error:'not_allowed' });
      if (error instanceof SyntaxError) return res.status(400).json({ error:'bad_body' });
      if (error.status) return res.status(error.status).json({ error:error.message });
      console.error('admin-task',error?.code || error?.message);
      return res.status(500).json({ error:'failed' });
    }
  };
}
module.exports = { createHandler };
