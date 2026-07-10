// Бэкенд Synaq. Локально — обычный сервер; на Vercel — serverless-функция.
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (_req, res) => res.json({ service: 'synaq-backend', ok: true }));
app.use('/api/training', require('./routes/training'));
app.use('/api/mock', require('./routes/mock'));

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Synaq backend → http://localhost:${PORT}`));
}

module.exports = app; // Vercel @vercel/node принимает express-приложение как обработчик
