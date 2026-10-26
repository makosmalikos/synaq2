const { isFreePreview } = require('../backend/lib/free-preview');
const { randomSample } = require('../backend/lib/random-sample');
const { getAdmin } = require('../backend/lib/firebase-admin');
const { findTrainingQuestion } = require('../backend/lib/training-question');
const { createLearningService } = require('../backend/lib/learning-service');
const { trainingGradeAllowed } = require('../backend/lib/training-grade');
const { questionAccessAllowed } = require('../backend/lib/question-access');
const { readPrivateFigure } = require('../backend/lib/private-figure');

function content(db) {
  let requestContent;
  function bankContent() {
    return requestContent ||= readContent();
  }
  async function readContent() {
    const bank = await import('../frontend/src/bank.js');
    const { loadPublishedBank } = require('../backend/lib/published-bank');
    return { ...bank, POOL: await loadPublishedBank(db) };
  }
  return {
    async getTrainingQuestion(id) {
      return findTrainingQuestion(db, id);
    },
    async getTrainingTopics({ gradeCeiling, plan = 'free' } = {}) {
      const [{ POOL, EXTRA_TOPICS }, { topics }, { addQuestionsToTopics }] = await Promise.all([
        bankContent(), import('../frontend/src/data.js'), import('../frontend/src/topicSummary.js'),
      ]);
      const eligible = POOL.filter(question => trainingGradeAllowed(question, gradeCeiling) && questionAccessAllowed(question, plan));
      const catalog = addQuestionsToTopics([...topics, ...EXTRA_TOPICS], eligible).filter(topic => topic.count > 0);
      const previewCount = eligible.filter(isFreePreview).length;
      if (previewCount) catalog.push({ id: 'free-preview', name: 'Тегін есептер жинағы', nameRu: 'Попробуй новые задачи', block: 'math', count: previewCount, gradableCount: previewCount });
      return catalog;
    },
    async getTrainingQuestions({ topicId, mixed, excludeIds, limit, gradeCeiling, plan = 'free' }) {
      const { POOL } = await bankContent();
      const exclude = new Set(excludeIds);
      const candidates = POOL.filter((question) => question?.id && question?.statement && question.answer != null
        && !['', '-', '—'].includes(String(question.answer).trim()) && !exclude.has(question.id)
        && trainingGradeAllowed(question, gradeCeiling)
        && questionAccessAllowed(question, plan)
        && (topicId === 'free-preview' && !mixed ? isFreePreview(question) : mixed ? ['eq', 'num', 'work', 'ratio', 'geo', 'frac', 'pct', 'sys'].includes(question.topic)
          : question.topic === topicId));
      const shuffled = randomSample(candidates, limit);
      return shuffled.map(({ answer, solution, note, ...question }) => question);
    },
    async getCurriculumQuestion(key, level, id, accessOnly = false) {
      const { CURRICULUM, createCurriculumQuestions } = await import('../frontend/src/curriculumData.js');
      const { trainingTopicForKind } = await import('../frontend/src/platformDiagnostic.js');
      const list = Object.values(CURRICULUM).find((topics) => topics.some((topic) => topic.key === key));
      const topic = list?.find((item) => item.key === key);
      if (!topic) return null;
      const quarter = list.filter((item) => item.quarter === topic.quarter);
      const free = quarter.slice(0, 1).some((item) => item.key === key);
      const standard = quarter.slice(0, 2).some((item) => item.key === key);
      if (accessOnly) return { free, standard };
      const question = createCurriculumQuestions(topic, level, 1)[0];
      return { free, standard, question: { ...question, id: `${topic.key}-${id}`, topic: trainingTopicForKind(topic.kind), school: 'curriculum' } };
    },
    async gradeAnswer(given, question, mode) {
      if (mode === 'curriculum') return (await import('../frontend/src/curriculumData.js')).curriculumAnswersMatch(given, question.answer);
      return (await import('../frontend/src/grading.js')).isCorrect(given, question);
    },
  };
}

function createLearningHandler({ admin = getAdmin, readFigure = readPrivateFigure } = {}) { return async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'auth-required' });
  try {
    const { auth, db } = admin();
    const user = await auth.verifyIdToken(token, true);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await createLearningService({ db, ...content(db) })(user, body);
    if (body.action === 'figure') {
      const bytes = await readFigure(result.image);
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Vary', 'Authorization');
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      return res.status(200).send(bytes);
    }
    return res.status(200).json(result);
  } catch (cause) {
    if (cause?.code?.startsWith('auth/')) return res.status(401).json({ error: 'auth-required' });
    if (cause instanceof SyntaxError) return res.status(400).json({ error: 'bad-body' });
    if (cause?.status) return res.status(cause.status).json({ error: cause.message });
    console.error('learning', cause?.code || cause?.name || 'failed');
    return res.status(503).json({ error: 'temporarily-unavailable' });
  }
}; }
module.exports = createLearningHandler();
module.exports.createLearningHandler = createLearningHandler;
module.exports.content = content;
