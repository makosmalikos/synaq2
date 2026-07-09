import { Router } from 'express';
import { mockVariants, publicVariant } from '../data/bank.js';
import { isCorrect } from '../lib/check.js';

const r = Router();

// Список мок-вариантов (метаданные)
r.get('/', (_req, res) => {
  res.json(mockVariants.map((v) => ({
    id: v.id, title: v.title, timeLimitMin: v.timeLimitMin, count: v.questions.length,
  })));
});

// Вариант без ответов/разбора — как на экзамене
r.get('/:id', (req, res) => {
  const v = mockVariants.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'variant not found' });
  res.json(publicVariant(v));
});

// Сдача варианта -> балл + разбор по каждой задаче
r.post('/:id/submit', (req, res) => {
  const v = mockVariants.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'variant not found' });
  const answers = (req.body && req.body.answers) || {};

  let score = 0, gradable = 0;
  const perTopic = {};
  const review = v.questions.map((q) => {
    const ok = isCorrect(answers[String(q.num)] ?? answers[q.id], q.answer);
    if (q.answer !== null) {
      gradable += 1;
      perTopic[q.topic] = perTopic[q.topic] || { correct: 0, total: 0 };
      perTopic[q.topic].total += 1;
      if (ok) { score += 1; perTopic[q.topic].correct += 1; }
    }
    return {
      num: q.num, id: q.id, topic: q.topic, statement: q.statement,
      userAnswer: answers[String(q.num)] ?? answers[q.id] ?? null,
      correctAnswer: q.answer, correct: ok, solution: q.solution,
      verify: q.verify, image: q.image,
    };
  });

  res.json({
    testId: v.id, title: v.title,
    score, gradable, total: v.questions.length,
    perTopic, review,
  });
});

export default r;
