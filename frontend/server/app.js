// Express-приложение Synaq. Работает и локально (npm run dev), и как
// serverless-функция на Vercel (см. /api/[...path].js).
import express from 'express';
import cors from 'cors';
import training from './routes/training.js';
import mock from './routes/mock.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'synaq-api' }));
  app.use('/api/training', training);
  app.use('/api/mock', mock);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }));
  return app;
}

// Локальный запуск
if (process.env.RUN_LOCAL === '1') {
  const port = process.env.PORT || 4000;
  createApp().listen(port, () => console.log(`Synaq API → http://localhost:${port}/api/health`));
}

export default createApp;
