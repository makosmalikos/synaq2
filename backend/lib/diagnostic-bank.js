const VERSION = 2;
const TOTAL = 20;

let curriculumPromise;
const curriculum = () => {
  curriculumPromise ||= import('../../frontend/src/curriculumData.js');
  return curriculumPromise;
};

function selectModules(topics) {
  const modules = [...new Map(topics.map((topic) => [topic.moduleId, topic])).values()];
  if (modules.length <= 8) return modules;
  return Array.from({ length: 8 }, (_, index) => modules[Math.round(index * (modules.length - 1) / 7)]);
}

async function createWave(grade, wave, selections) {
  const { CURRICULUM, createCurriculumQuestions } = await curriculum();
  const topics = CURRICULUM[grade] || [];
  const byModule = new Map(topics.map((topic) => [topic.moduleId, topic]));
  const targets = selections || selectModules(topics).map((topic) => ({ moduleId: topic.moduleId, difficulty: 'easy' }));
  return targets.map(({ moduleId, difficulty }, index) => {
    const topic = byModule.get(moduleId);
    if (!topic) throw new Error('diagnostic_topic_unavailable');
    const question = createCurriculumQuestions(topic, difficulty, 1)[0];
    if (!question?.text?.ru || !question?.text?.kk || question.answer == null) throw new Error('diagnostic_question_unavailable');
    return { id: `${wave}-${index}-${question.id}`, moduleId, wave, difficulty,
      topic: { kind: topic.kind || '', title: topic.title }, question };
  });
}

const levelOf = (pct) => (pct >= 75 ? 'strong' : pct >= 50 ? 'mid' : 'weak');

function scoreByModule(records) {
  const grouped = new Map();
  for (const record of records) {
    const item = grouped.get(record.moduleId) || { moduleId: record.moduleId, topic: record.topic, correct: 0, total: 0, seconds: 0 };
    item.total += 1;
    item.correct += record.correct ? 1 : 0;
    item.seconds += record.seconds;
    grouped.set(record.moduleId, item);
  }
  return [...grouped.values()].map((item) => {
    const pct = Math.round(item.correct / item.total * 100);
    return { ...item, pct, level: levelOf(pct) };
  }).sort((a, b) => a.pct - b.pct || b.seconds - a.seconds);
}

async function nextWave(grade, wave, records) {
  if (wave === 2) {
    const first = new Map(records.map((item) => [item.moduleId, item.correct]));
    return createWave(grade, 2, selectModules((await curriculum()).CURRICULUM[grade] || [])
      .map((topic) => ({ moduleId: topic.moduleId, difficulty: first.get(topic.moduleId) ? 'medium' : 'easy' })));
  }
  if (wave === 3) {
    return createWave(grade, 3, scoreByModule(records).slice(0, 4).map((item) => ({
      moduleId: item.moduleId, difficulty: item.pct >= 100 ? 'hard' : 'medium',
    })));
  }
  return [];
}

function publicQuestion(item) {
  const { answer, solution, ...question } = item.question;
  return { id: item.id, moduleId: item.moduleId, wave: item.wave, difficulty: item.difficulty,
    topic: item.topic, question };
}

const TRAINING_KIND_RULES = [
  [/percent|pct/i, 'pct'], [/fraction|decimal|mixed/i, 'frac'],
  [/perimeter|area|geometry|angle|circle|coordinate|symmetry|volume/i, 'geo'],
  [/equation|algebra|linear|inequal|system/i, 'eq'],
  [/ratio|proportion|dependency|scale|motion|work|word|money/i, 'ratio'],
  [/probability|combinator|average|statistic|data/i, 'comb'],
];
const trainingTopicForKind = (kind = '') => TRAINING_KIND_RULES.find(([pattern]) => pattern.test(kind))?.[1] || 'num';

function buildResult(session, completedAt) {
  const topics = scoreByModule(session.records);
  const correct = session.records.filter((item) => item.correct).length;
  return { version: VERSION, grade: session.grade, completedAt: new Date(completedAt).toISOString(),
    readiness: Math.round(correct / session.records.length * 100), correct, total: session.records.length,
    spentSec: Math.max(1, Math.min(4 * 3600, Math.floor((completedAt - session.startedAt) / 1000))),
    topics: topics.map((item) => ({ moduleId: item.moduleId, kind: item.topic.kind || '',
      trainingTopicId: trainingTopicForKind(item.topic.kind), title: item.topic.title, pct: item.pct,
      correct: item.correct, total: item.total, level: item.level })),
    mistakes: session.records.filter((item) => !item.correct).map((item) => ({ moduleId: item.moduleId,
      trainingTopicId: trainingTopicForKind(item.topic.kind), title: item.topic.title, text: item.question.text,
      your: item.your, answer: item.question.answer, solution: item.question.solution })), verified: true };
}

async function answerMatches(given, expected) {
  return (await curriculum()).curriculumAnswersMatch(given, expected);
}

module.exports = { VERSION, TOTAL, createWave, nextWave, publicQuestion, buildResult, answerMatches };
