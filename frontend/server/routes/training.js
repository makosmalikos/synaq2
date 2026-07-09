import { Router } from 'express';
import { topics } from '../data/topics.js';
import { byTopic, questions } from '../data/bank.js';
import { isCorrect } from '../lib/check.js';

const r = Router();
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const strip = ({ answer, solution, verify, ...q }) => q; // без ответа/разбора

// Список тем + количество задач по каждой
r.get('/topics', (_req, res) => {
  const counts = questions.reduce((m, q) => ((m[q.topic] = (m[q.topic] || 0) + 1), m), {});
  res.json(topics.map((t) => ({ ...t, count: counts[t.id] || 0 })));
});

// Задачи по теме (mix — перемешать, limit — сколько)
r.get('/topics/:id/questions', (req, res) => {
  let pool = byTopic(req.params.id);
  if (!pool.length) return res.status(404).json({ error: 'topic not found' });
  if (req.query.mix === '1') pool = shuffle(pool);
  const limit = Math.min(parseInt(req.query.limit || '10', 10), pool.length);
  res.json(pool.slice(0, limit).map(strip));
});

// Смешанная тренировка по всем темам
r.get('/mixed', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '10', 10), questions.length);
  res.json(shuffle(questions).slice(0, limit).map(strip));
});

// Проверка одной задачи в тренировке -> верно/неверно + разбор
r.post('/check', (req, res) => {
  const { id, answer } = req.body || {};
  const q = questions.find((x) => x.id === id);
  if (!q) return res.status(404).json({ error: 'question not found' });
  const correct = isCorrect(answer, q.answer);
  res.json({ id, correct, answer: q.answer, solution: q.solution, gradable: q.answer !== null });
});

export default r;
