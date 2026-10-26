import format from '../../shared/rfmsh-format.json' with { type: 'json' };
export const RFM_POINTS = Object.freeze(Object.fromEntries(Object.entries(format.levels).map(([level,spec])=>[level,spec.points])));
export const rfmshPoints = question => question?.examFormat === format.version && RFM_POINTS[question.examLevel] === question.examPoints ? question.examPoints : null;
export const rfmshIntegerAnswer = (given,answer) => /^[+-]?\d{1,2000}$/.test(String(given ?? '').trim())
  && /^[+-]?\d{1,2000}$/.test(String(answer ?? '').trim()) && BigInt(String(given).trim()) === BigInt(String(answer).trim());
export function rfmshReviewScore(review) {
  if (!review.length || review.some(question=>rfmshPoints(question)===null)) return null;
  return {score:review.reduce((sum,q)=>sum+(q.correct===true?rfmshPoints(q):0),0),max:review.reduce((sum,q)=>sum+rfmshPoints(q),0)};
}
export function rfmshLevelLabel(question,lang) {
  const points=rfmshPoints(question);
  return points === null ? '' : lang === 'ru' ? `Уровень ${question.examLevel} · ${points === 3 ? '3 балла' : `${points} баллов`}` : `${question.examLevel} деңгейі · ${points} ұпай`;
}
