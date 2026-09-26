const { getAdmin } = require('../backend/lib/firebase-admin');
const { createLearningService } = require('../backend/lib/learning-service');

function content(db) {
  return {
    async getTrainingQuestion(id) {
      const { POOL } = await import('../frontend/src/bank.js');
      const staticQuestion = POOL.find((question) => question.id === id);
      if (staticQuestion) return staticQuestion;
      const snapshot = await db.collection('bankTasks').doc(id).get();
      if (!snapshot.exists) return null;
      const { normalizeAdminTask, quarantineReason } = await import('../frontend/src/questionMetadata.js');
      const question = normalizeAdminTask({ ...snapshot.data(), id });
      return quarantineReason(question) ? null : question;
    },
    async getCurriculumQuestion(key, level, id, accessOnly = false) {
      const { CURRICULUM, createCurriculumQuestions } = await import('../frontend/src/curriculumData.js');
      const { trainingTopicForKind } = await import('../frontend/src/platformDiagnostic.js');
      const list = Object.values(CURRICULUM).find((topics) => topics.some((topic) => topic.key === key));
      const topic = list?.find((item) => item.key === key);
      if (!topic) return null;
      const standard = list.filter((item) => item.quarter === topic.quarter).slice(0, 2).some((item) => item.key === key);
      if (accessOnly) return { standard };
      const question = createCurriculumQuestions(topic, level, 1)[0];
      return { standard, question: { ...question, id: `${topic.key}-${id}`, topic: trainingTopicForKind(topic.kind), school: 'curriculum' } };
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
