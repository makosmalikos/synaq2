const SPECS = Object.freeze({
  'РФМШ': { count: 30, minutes: 120, subjects: [[null, 30, 1]] },
  'НИШ': { count: 120, minutes: 150, subjects: [['math', 40, 1], ['kolzar', 20, 1], ['eng', 20, 2], ['rus', 20, 2], ['kaz', 20, 2]] },
  'БИЛ': { count: 80, minutes: 120, subjects: [['math', 40, 1], ['logic', 20, 1], ['kaz', 20, 2]] },
});

let bankPromise;
async function loadBank(db) {
  if (!bankPromise) bankPromise = (async () => {
    const bank = await import('../../frontend/src/bank.js');
    await bank.ensureBankReady(async () => {
      const snapshot = await db.collection('bankTasks').get();
      return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
    });
    return bank.POOL;
  })().catch((error) => { bankPromise = null; throw error; });
  return bankPromise;
}

const shuffled = (items) => items.map((item) => [Math.random(), item])
  .sort((a, b) => a[0] - b[0]).map((item) => item[1]);
const gradable = (question) => question?.id && question?.statement && question.answer != null
  && !['', '-', '—'].includes(String(question.answer).trim())
  && (!question.options || (Array.isArray(question.options) && question.options.length >= 2
    && question.options.map(String).includes(String(question.answer))));
const publicQuestion = ({ answer, solution, note, ...question }) => question;

function poolFor(pool, school, subject) {
  return pool.filter((question) => gradable(question)
    && (school === 'БИЛ' ? ['БИЛ', 'КТЛ'].includes(question.school)
      : question.school === school || (school === 'НИШ' && subject === 'kaz' && question.school === 'БИЛ'))
    && (subject == null || question.subject === subject));
}

function preferFresh(items, count, excluded) {
  const ids = new Set(excluded || []);
  return [...items.filter((item) => !ids.has(item.id)), ...items.filter((item) => ids.has(item.id))].slice(0, count);
}

function availability(pool, school) {
  const spec = SPECS[school];
  const subjects = spec.subjects.map(([subject, target, section]) => ({
    subject, target, section, count: Math.min(target, poolFor(pool, school, subject).length),
  }));
  const count = subjects.reduce((sum, item) => sum + item.count, 0);
  return { code: school, ready: count > 0, count, targetCount: spec.count,
    shortened: count < spec.count, missingSubjects: subjects.filter((item) => item.count < item.target),
    sections: new Set(subjects.filter((item) => item.count).map((item) => item.section)).size,
    timeLimitMin: Math.max(1, Math.round(spec.minutes * count / spec.count)),
  };
}

async function mockCatalog(db) {
  const pool = await loadBank(db);
  return Object.keys(SPECS).map((school) => availability(pool, school));
}

async function createMock(db, school, excluded = []) {
  const pool = await loadBank(db), spec = SPECS[school];
  if (!spec) return null;
  const info = availability(pool, school);
  if (!info.ready) return null;
  const questions = [];
  for (const [subject, target, section] of spec.subjects) {
    const candidates = shuffled(poolFor(pool, school, subject));
    for (const question of preferFresh(candidates, target, excluded)) {
      questions.push({ ...question, num: questions.length + 1, subject: subject || question.subject || null, section });
    }
  }
  return { school, title: school === 'РФМШ' ? 'РФМШ · Пробный тест' : `${school} · Пробный тест`,
    timeLimitMin: info.timeLimitMin, sections: info.sections, shortened: info.shortened,
    targetCount: info.targetCount, questions };
}

async function restoreMock(db, session) {
  const pool = await loadBank(db), byId = new Map(pool.map((question) => [question.id, question]));
  const questions = (session.questionRefs || []).map((ref, index) => {
    const question = byId.get(ref.id);
    if (!gradable(question) || ref.num !== index + 1 || ![1, 2].includes(ref.section)) throw new Error('question_unavailable');
    return { ...question, num: ref.num, section: ref.section, subject: ref.subject || question.subject || null };
  });
  if (!questions.length || questions.length > 120) throw new Error('question_unavailable');
  return { id: session.attemptId, school: session.school, title: session.title,
    timeLimitMin: session.timeLimitMin, sections: session.sections, shortened: !!session.shortened,
    targetCount: session.targetCount, questions };
}

async function gradeMock(db, session, answers) {
  const { isCorrect, norm } = await import('../../frontend/src/grading.js');
  const variant = await restoreMock(db, session);
  let correct = 0, gradableCount = 0, wrong = 0;
  const review = variant.questions.map((question) => {
    const has = gradable(question);
    if (has) gradableCount += 1;
    const ok = has && isCorrect(answers[question.num], question);
    if (ok) correct += 1;
    else if (has && norm(answers[question.num]) !== '') wrong += 1;
    return { qid: question.id, num: question.num, topic: question.topic || null,
      subject: question.subject || null, school: variant.school, statement: question.statement,
      solution: question.solution || '', image: question.image || null, options: question.options || null,
      your: answers[question.num] ?? null, answer: question.answer, correct: ok, note: question.note || null };
  });
  if (variant.school === 'БИЛ') {
    const cancelled = Math.floor(wrong / 4), net = Math.max(0, correct - cancelled);
    return { scoring: 'bil', score: correct, wrong, cancelled, points: +(net * 1.5).toFixed(1),
      maxPoints: +(gradableCount * 1.5).toFixed(1), gradable: gradableCount, total: review.length, review };
  }
  return { score: correct, gradable: gradableCount, total: review.length, review };
}

function publicMock(variant) {
  return { ...variant, questions: variant.questions.map(publicQuestion) };
}

module.exports = { SPECS, mockCatalog, createMock, restoreMock, gradeMock, publicMock };
