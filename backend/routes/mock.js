const express = require('express');
const router = express.Router();
const { variants, byId } = require('../data/mockVariants');

const stripAnswers = (v) => ({
  ...v,
  questions: v.questions.map(({ answer, solution, note, ...q }) => q),
});

const norm = (v) => String(v ?? '').trim().toLowerCase()
  .replace(/\s+/g, '').replace(',', '.').replace(/%$/, '');

function isCorrect(given, q) {
  if (!q || q.answer == null) return false;
  const ans = String(q.answer).trim();
  if (!ans || ans === '—' || ans === '-') return false;
  if (q.options) return String(given).trim() === ans;
  const a = norm(given);
  return a !== '' && a === norm(q.answer);
}

router.get('/schools', (_req, res) => {
  res.json([
    {
      code: 'РФМШ',
      ready: variants.some((v) => !v.school || v.school === 'РФМШ'),
      variants: variants.filter((v) => !v.school || v.school === 'РФМШ').length,
    },
    {
      code: 'БИЛ',
      ready: variants.some((v) => v.school === 'БИЛ'),
      variants: variants.filter((v) => v.school === 'БИЛ').length,
    },
  ]);
});

router.get('/variants', (req, res) => {
  const school = req.query.school;
  let list = variants;
  if (school) list = list.filter((v) => (v.school || 'РФМШ') === school);
  res.json(list.map((v) => ({
    id: v.id,
    title: v.title,
    school: v.school || 'РФМШ',
    count: v.questions.length,
    timeLimitMin: v.timeLimitMin || 120,
  })));
});

router.get('/variants/:id', (req, res) => {
  const v = byId(req.params.id);
  if (!v) return res.status(404).json({ error: 'not found' });
  res.json(stripAnswers(v));
});

router.post('/variants/:id/submit', (req, res) => {
  const v = byId(req.params.id);
  if (!v) return res.status(404).json({ error: 'not found' });
  const answers = req.body?.answers || {};
  let correct = 0;
  let gradable = 0;
  let wrong = 0;
  const review = v.questions.map((q) => {
    const has = q.answer != null && String(q.answer).trim() !== '' && String(q.answer).trim() !== '—';
    if (has) gradable++;
    const ok = has && isCorrect(answers[q.num], q);
    if (ok) correct++;
    else if (has && norm(answers[q.num]) !== '') wrong++;
    return {
      num: q.num,
      topic: q.topic || null,
      statement: q.statement,
      your: answers[q.num] ?? null,
      answer: q.answer,
      correct: ok,
    };
  });

  if (v.school === 'БИЛ') {
    const cancelled = Math.floor(wrong / 4);
    const net = Math.max(0, correct - cancelled);
    return res.json({
      scoring: 'bil',
      score: correct,
      wrong,
      cancelled,
      points: +(net * 1.5).toFixed(1),
      maxPoints: +(gradable * 1.5).toFixed(1),
      gradable,
      total: v.questions.length,
      review,
    });
  }

  res.json({ score: correct, gradable, total: v.questions.length, review });
});

module.exports = router;
