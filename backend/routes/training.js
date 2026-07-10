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

// Задачи по теме (с учётом школы)
router.get('/topics/:id/questions', (req, res) => {
  let items = poolFor(req.query.school).filter(q => q.topic === req.params.id);
  if (!items.length) return res.status(404).json({ error: 'Тема пуста' });
  if (req.query.mix) items = shuffle(items);
  const limit = Number(req.query.limit) || items.length;
  res.json(items.slice(0, limit));
});

router.get('/mixed', (req, res) => res.json(shuffle(poolFor(req.query.school)).slice(0, Number(req.query.limit) || 15)));
router.get('/generate', (req, res) => res.json(generate(Number(req.query.n) || 5, req.query.topic || null)));

module.exports = router;
