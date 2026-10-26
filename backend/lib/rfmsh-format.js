const {createHash} = require('node:crypto');
const FORMAT = require('../../shared/rfmsh-format.json');
const review = require('../data/rfmshReviewedLevels.json');
const byId = new Map(review.records.map(record => [record.id, record]));
function reviewedLevel(question) {
  const record = byId.get(question?.id);
  if (!record || question.school !== 'РФМШ' || question.options?.length
    || !/^[+-]?\d+$/.test(String(question.answer).trim())) return null;
  const hash = createHash('sha256').update(JSON.stringify(review.fields.map(key => question[key] ?? null))).digest('hex');
  return hash === record.sha256 ? record.level : null;
}
function examQuestion(question, level = reviewedLevel(question)) {
  if (!level || reviewedLevel(question) !== level) throw new Error('rfmsh_question_unavailable');
  return {...question, examLevel:level, examPoints:FORMAT.levels[level].points, examFormat:FORMAT.version};
}
function integerAnswerCorrect(given, answer) {
  const value = String(given ?? '').trim();
  return /^[+-]?\d{1,2000}$/.test(value) && BigInt(value) === BigInt(String(answer).trim());
}
module.exports = {FORMAT, reviewedLevel, examQuestion, integerAnswerCorrect};
