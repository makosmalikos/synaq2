// BIL admission rules: +4 for a correct answer, -1 for an incorrect answer,
// and 0 for a question left unanswered. Keep negative totals visible.
function scoreBil(correct, wrong, gradable) {
  return {
    scoring: 'bil',
    score: correct,
    wrong,
    unanswered: gradable - correct - wrong,
    points: 4 * correct - wrong,
    maxPoints: 4 * gradable,
  };
}

module.exports = { scoreBil };
