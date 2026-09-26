// Бэкенд Synaq. Локально — обычный сервер; на Vercel — serverless-функция.
const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');

const ENDPOINTS = ['explain', 'checkout', 'subscription-portal', 'entitlement', 'child-create', 'child-password', 'admin-login', 'admin-task', 'duel', 'duel-award', 'learning', 'mock-session', 'diagnostic-session'];

// These lighter endpoints share the catch-all Vercel function so the project
// stays within the Hobby plan's 12-function limit. Explicit loaders also make
// their dependencies visible to Vercel's static file tracer.
const SHARED_ENDPOINTS = {
  'admin-login': () => require('./handlers/admin-login'),
  entitlement: () => require('./handlers/entitlement'),
  'child-password': () => require('./handlers/child-password'),
  'duel-award': () => require('./handlers/duel-award'),
};

function createApp({ handlers = {} } = {}) {
  const app = express();
  app.use(cors());
  const invoke = (name) => (req, res, next) => {
    // Load only the selected endpoint. Never mount api/[...path].js here:
    // that file delegates back to this app on Vercel.
    try {
      const handler = handlers[name] || SHARED_ENDPOINTS[name]?.() || require(`../api/${name}.js`);
      Promise.resolve(handler(req, res)).catch(next);
    } catch (error) { next(error); }
  };
  // Signature verification reads exact stream bytes. Mount before JSON parsing;
  // express.raw would consume that stream too, so let the webhook read it once.
  app.all('/api/webhook', invoke('webhook'));
  app.use(express.json({ limit: '1mb' }));
  for (const name of ENDPOINTS) app.all(`/api/${name}`, invoke(name));
  app.get('/', (_req, res) => res.json({ service: 'synaq-backend', ok: true }));
  app.use('/api/training', require('./routes/training'));
  app.use('/api/mock', require('./routes/mock'));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));
  app.use((error, _req, res, _next) => {
    if (res.headersSent) return _next(error);
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'payload_too_large' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid_json' });
    console.error('API handler failed:', error.code || error.name || 'Error');
    return res.status(500).json({ error: 'internal_error' });
  });
  return app;
}

if (require.main === module) {
  const envFile = path.resolve(__dirname, '..', '.env');
  if (process.env.SYNAQ_USE_EMULATORS !== '1' && fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') process.loadEnvFile(envFile);
  const PORT = process.env.PORT || 4000;
  const app = createApp();
  app.listen(PORT, '127.0.0.1', () => console.log(`Synaq backend → http://127.0.0.1:${PORT}`));
}

module.exports = createApp();
module.exports.createApp = createApp;
module.exports.ENDPOINTS = ENDPOINTS;
