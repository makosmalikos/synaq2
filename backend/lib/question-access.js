const { planRank, validPlan } = require('./plans');

const ids = (question) => [question?.id, question?.qid, question?.originalId].filter((id) => typeof id === 'string');
const originalZerek = (question) => ids(question).some((id) => id.startsWith('zerek_'));
const adaptedNamespace = (question) => ids(question).some((id) => id.startsWith('synaq_adapted_'));

function isVerifiedAdaptation(question) {
  return !originalZerek(question) && adaptedNamespace(question)
    && question.editorialStatus === 'verified' && ['pro', 'mentor'].includes(question.minimumPlan);
}

// null means unpublished/unavailable, not a free question. Original transfers
// stay closed on every plan until separately rewritten and reviewed.
function questionMinimumPlan(question) {
  if (!question || typeof question !== 'object' || originalZerek(question)) return null;
  if (adaptedNamespace(question)) return isVerifiedAdaptation(question) ? question.minimumPlan : null;
  if (question.sourceProvider === 'zerek') return null;
  if (question.minimumPlan == null) return 'free';
  return validPlan(question.minimumPlan);
}

function questionAccessAllowed(question, plan = 'free') {
  const required = questionMinimumPlan(question);
  return required !== null && planRank(plan) >= planRank(required);
}

function assertQuestionAccess(question, plan) {
  if (questionAccessAllowed(question, plan)) return;
  const unavailable = questionMinimumPlan(question) === null;
  throw Object.assign(new Error(unavailable ? 'question-unavailable' : 'pro-required'), { status: unavailable ? 404 : 403 });
}

const publicQuestionAllowed = (question) => questionAccessAllowed(question, 'free');

// Old local review snapshots may predate the publication boundary. Keep their
// score and unrelated review rows, but never return restricted condition/key.
function sanitizeMockResult(result) {
  if (!Array.isArray(result?.review)) return result;
  return { ...result, review: result.review.map((row) => publicQuestionAllowed(row) ? row : {
    qid: row?.qid || row?.id || null, num: row?.num ?? null,
    topic: row?.topic || null, subject: row?.subject || null, school: row?.school || null,
    correct: row?.correct === true, unavailable: true,
  }) };
}

module.exports = { originalZerek, isVerifiedAdaptation, questionMinimumPlan, questionAccessAllowed,
  assertQuestionAccess, publicQuestionAllowed, sanitizeMockResult };
