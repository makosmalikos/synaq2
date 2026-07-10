// Роуты мок-тестов (полные варианты РФМШ).
const express = require('express');
const router = express.Router();
const mock = require('../data/mockVariants');

// Нормализация открытого ответа: пробелы, регистр, запятая/точка, %, единицы.
const norm = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '')
  .replace(',', '.')
  .replace(/%$/, '')
  .replace(/(км|мм|см|м|мин|кг|г|л|тг|га|°|градус[аовъ]*)$/u, '');

// Мок-тест недели: один вариант по школе, сменяется каждую неделю
router.get('/weekly', (req, res) => {
  const school = req.query.school;
  const list = mock.variants.filter(v => (school === 'БИЛ' ? v.id.startsWith('bil') : v.id.startsWith('rfmsh')));
  if (!list.length) return res.status(404).json({ error: 'нұсқа жоқ' });
  const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  const idx = ((week % list.length) + list.length) % list.length;
  const v = list[idx];
  res.json({ id: v.id, week: idx + 1, title: `Осы аптаның сынағы · ${idx + 1}-нұсқа`, timeLimitMin: v.timeLimitMin, count: v.questions.length });
});

// Список доступных вариантов (без ответов).
router.get('/', (_req, res) => {
  res.json(mock.variants.map(v => ({ id: v.id, title: v.title, timeLimitMin: v.timeLimitMin, count: v.questions.length })));
});

// Вариант для прохождения — БЕЗ ответов (как на экзамене).
router.get('/:id', (req, res) => {
  const v = mock.byId(req.params.id);
  if (!v) return res.status(404).json({ error: 'Вариант не найден' });
  res.json({ ...v, questions: v.questions.map(({ answer, note, solution, ...rest }) => rest) });
});

// Проверка ответов после сдачи. body: { answers: { "1": "101", ... } }
router.post('/:id/submit', express.json(), (req, res) => {
  const v = mock.byId(req.params.id);
  if (!v) return res.status(404).json({ error: 'Вариант не найден' });
  const given = (req.body && req.body.answers) || {};
  let correct = 0, gradable = 0;
  const review = v.questions.map(q => {
    const has = q.answer != null;
    if (has) gradable++;
    const ua = norm(given[q.num]);
    const ok = has && ua !== '' && ua === norm(q.answer);
    if (ok) correct++;
    return { num: q.num, topic: q.topic, your: given[q.num] ?? null, answer: q.answer, correct: ok, note: q.note || null };
  });
  res.json({ score: correct, gradable, total: v.questions.length, review });
});

module.exports = router;
