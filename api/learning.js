const { getAdmin } = require('../backend/lib/firebase-admin');
const { createLearningService } = require('../backend/lib/learning-service');

function content(db) {
  async function bankContent() {
    const bank = await import('../frontend/src/bank.js');
    await bank.ensureBankReady(async () => {
      const snapshot = await db.collection('bankTasks').get();
      return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
    });
    return bank;
  }
  return {
    async getTrainingQuestion(id) {
      const { POOL } = await bankContent();
      const staticQuestion = POOL.find((question) => question.id === id);
      if (staticQuestion) return staticQuestion;
      const snapshot = await db.collection('bankTasks').doc(id).get();
      if (!snapshot.exists) return null;
      const { normalizeAdminTask, quarantineReason } = await import('../frontend/src/questionMetadata.js');
      const question = normalizeAdminTask({ ...snapshot.data(), id });
      return quarantineReason(question) ? null : question;
    },
    async getTrainingTopics() {
      const [{ POOL, EXTRA_TOPICS }, { topics }, { addQuestionsToTopics }] = await Promise.all([
        bankContent(), import('../frontend/src/data.js'), import('../frontend/src/topicSummary.js'),
      ]);
      return addQuestionsToTopics([...topics, ...EXTRA_TOPICS], POOL).filter((topic) => topic.count > 0);
    },
    async getTrainingQuestions({ topicId, mixed, excludeIds, limit }) {
      const { POOL } = await bankContent();
      const exclude = new Set(excludeIds);
      const candidates = POOL.filter((question) => question?.id && question?.statement && question.answer != null
        && !['', '-', '—'].includes(String(question.answer).trim()) && !exclude.has(question.id)
        && (mixed ? ['eq', 'num', 'work', 'ratio', 'geo', 'frac', 'pct', 'sys'].includes(question.topic)
          : question.topic === topicId));
      const shuffled = candidates.map((question) => [Math.random(), question])
        .sort((a, b) => a[0] - b[0]).map((item) => item[1]).slice(0, limit);
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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'auth-required' });
  try {
    const { auth, db } = getAdmin();
    const user = await auth.verifyIdToken(token, true);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    return res.status(200).json(await createLearningService({ db, ...content(db) })(user, body));
  } catch (cause) {
    if (cause?.code?.startsWith('auth/')) return res.status(401).json({ error: 'auth-required' });
    if (cause instanceof SyntaxError) return res.status(400).json({ error: 'bad-body' });
    if (cause?.status) return res.status(cause.status).json({ error: cause.message });
    console.error('learning', cause?.code || cause?.name || 'failed');
    return res.status(503).json({ error: 'temporarily-unavailable' });
  }
};
module.exports.content = content;
