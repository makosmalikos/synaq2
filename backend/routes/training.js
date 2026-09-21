const express = require('express');
const router = express.Router();
const topics = require('../data/topics');
const questions = require('../data/questions');
const bil = require('../data/bilQuestions');
const { generate } = require('../data/generators');

const shuffle = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const rfmsh = questions.filter(q => q.variant && /^v\d/.test(q.variant)).map(q => ({ ...q, school: 'РФМШ' }));
const bilQ = bil.map(q => ({ ...q, school: 'БИЛ' }));
const poolFor = (school) => (school === 'БИЛ' ? bilQ : rfmsh);

// Темы с числом задач — с учётом школы
router.get('/topics', (req, res) => {
  const pool = poolFor(req.query.school);
  const withCounts = topics.map(t => ({ ...t, count: pool.filter(q => q.topic === t.id).length }));
  res.json(withCounts.filter(t => t.count > 0));
});

// `Number(x) || fallback` считает limit=0 "не задан" (0 — falsy в JS) и
// молча отдаёт ВСЕ задачи темы вместо нуля — использовали clamp с явной
// проверкой на NaN вместо "||".
function clampLimit(raw, fallback, max) {
  const n = Number(raw);
  if (raw == null || raw === '' || !Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, max);
}

// Задачи по теме (с учётом школы)
router.get('/topics/:id/questions', (req, res) => {
  let items = poolFor(req.query.school).filter(q => q.topic === req.params.id);
  if (!items.length) return res.status(404).json({ error: 'Тема пуста' });
  if (req.query.mix) items = shuffle(items);
  const limit = clampLimit(req.query.limit, items.length, items.length);
  res.json(items.slice(0, limit));
});

router.get('/mixed', (req, res) => {
  const pool = poolFor(req.query.school);
  res.json(shuffle(pool).slice(0, clampLimit(req.query.limit, 15, pool.length)));
});
// n не был ограничен сверху: ?n=50000000 заставлял generate() синхронно
// строить многомиллионный массив и сериализовать его в JSON — DoS без
// авторизации. 200 с запасом покрывает любой реальный сценарий использования.
router.get('/generate', (req, res) => res.json(generate(clampLimit(req.query.n, 5, 200), req.query.topic || null)));

module.exports = router;
