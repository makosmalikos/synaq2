// Server-only content: do not import this module from frontend code.
const editions = require('../data/synaqAdaptedQuestions.json');
const { isVerifiedAdaptation } = require('./question-access');
const seen = new Set();
for (const question of editions) {
  if (!isVerifiedAdaptation(question) || seen.has(question.id)
    || question.subject !== 'math' || question.school !== 'Математика'
    || question.practiceOnly !== true || ![4, 5, 6].includes(question.grade)
    || !question.statement || question.answer == null || !question.solution) {
    throw new Error('Invalid verified Standard edition: ' + question?.id);
  }
  seen.add(question.id);
}
const questions = Object.freeze(editions.map((question) => Object.freeze(question)));
function getStandardBank() { return questions; }
module.exports = { getStandardBank };
