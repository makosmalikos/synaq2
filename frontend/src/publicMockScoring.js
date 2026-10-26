import { rfmshPoints, rfmshIntegerAnswer } from './rfmshScoring.js';
const normalizeAnswer = (value) => String(value ?? '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');

export function scorePublicMock(questions, answers, school) {
  const grouped = {};
  let wrong = 0;
  let unanswered = 0;
  const mistakes = [];
  const weightedRfmsh = school === 'РФМШ' && questions.length > 0 && questions.every(q=>rfmshPoints(q)!==null);
  let weightedPoints = 0;

  for (const item of questions) {
    grouped[item.topic] ||= { id: item.topic, total: 0, correct: 0 };
    grouped[item.topic].total += 1;
    const given = normalizeAnswer(answers[item.id]);
    if (weightedRfmsh ? rfmshIntegerAnswer(answers[item.id],item.answer) : given === normalizeAnswer(item.answer)) {
      grouped[item.topic].correct += 1;
      if (weightedRfmsh) weightedPoints += rfmshPoints(item);
    }
    else {
      mistakes.push(item);
      if (given) wrong += 1;
      else unanswered += 1;
    }
  }

  const topics = Object.values(grouped).map((item) => ({ ...item, pct: Math.round(item.correct / item.total * 100) }));
  const correct = topics.reduce((sum, item) => sum + item.correct, 0);
  const points = weightedRfmsh ? weightedPoints : school === 'БИЛ' ? 4 * correct - wrong : correct;
  const maxPoints = weightedRfmsh ? questions.reduce((sum,q)=>sum+rfmshPoints(q),0) : school === 'БИЛ' ? 4 * questions.length : questions.length;
  const pct = maxPoints ? Math.max(0, Math.round(points / maxPoints * 100)) : 0;
  return { topics, correct, wrong, unanswered, points, maxPoints, pct,
    weak: topics.filter((item) => item.pct < 60), strong: topics.filter((item) => item.pct >= 75), mistakes };
}
