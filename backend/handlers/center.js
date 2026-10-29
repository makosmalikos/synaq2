const { getAdmin } = require('../lib/firebase-admin');
const { createCenterService } = require('../lib/center-service');

function createHandler({ admin = getAdmin, service = createCenterService } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'login_required' });
    try {
      const { auth, db } = admin();
      const user = await auth.verifyIdToken(token, true);
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const result = await service({ db, topics: async () => (await import('../../frontend/src/topicCatalog.generated.js')).STATIC_TOPICS })(user, body);
      return res.status(200).json(result);
    } catch (error) {
      if (error?.code?.startsWith('auth/')) return res.status(401).json({ error: 'login_required' });
      if (error instanceof SyntaxError) return res.status(400).json({ error: 'invalid_body' });
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error('center', error?.code || error?.name || 'failed');
      return res.status(503).json({ error: 'temporarily_unavailable' });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
