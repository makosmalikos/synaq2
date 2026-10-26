// Only these reviewed, unchanged editions are included in the Free sampler.
// Fingerprints prevent an admin collision or an alias from widening access.
const { createHash } = require('node:crypto');
const fingerprints = Object.freeze(require('../data/freePreviewQuestions.json'));
const fields = ["id", "statement", "answer", "solution", "image", "options", "grade", "topic", "minimumPlan", "editorialStatus", "sourceProvider", "practiceOnly", "subject", "school"];
function isFreePreview(question) {
  const expected = fingerprints[question?.id];
  if (!expected) return false;
  const actual = createHash('sha256').update(JSON.stringify(fields.map(key => question[key] ?? null))).digest('hex');
  return actual === expected;
}
module.exports = { isFreePreview };
