import { mockDisplayScore } from './analytics.js';
import { isGradable } from './grading.js';

const SUBJECTS = {
  math: ['Математика', 'Математика'], logic: ['Логика', 'Логика'],
  kolzar: ['Количественные характеристики', 'Сандық сипаттамалар'],
  science: ['Естествознание', 'Жаратылыстану'], reading: ['Грамотность чтения', 'Оқу сауаттылығы'],
  eng: ['Английский язык', 'Ағылшын тілі'], rus: ['Русский язык', 'Орыс тілі'], kaz: ['Казахский язык', 'Қазақ тілі'],
};

export const hasMockAnswer = value => typeof value === 'string' && value.trim() !== '';
export const mockSubjectLabel = (subject, lang) => SUBJECTS[subject]?.[lang === 'ru' ? 0 : 1]
  || (lang === 'ru' ? 'Другие задания' : 'Басқа тапсырмалар');
export const mockReviewStatus = question => question.unavailable ? 'unavailable' : question.correct === true
  ? 'correct' : hasMockAnswer(question.your) ? 'wrong' : 'unanswered';

export function groupMockQuestions(questions) {
  const groups = new Map();
  questions.forEach((question, index) => {
    const subject = question.subject || 'math';
    if (!groups.has(subject)) groups.set(subject, { subject, questions: [] });
    groups.get(subject).questions.push({ question, index });
  });
  return [...groups.values()];
}

export const mockMistakes = review => review.filter(question => !question.unavailable
  && question.correct !== true && question.statement && isGradable(question));

export function mockReviewSummary(review, school) {
  const correct = review.filter(question => question.correct === true).length;
  const wrong = review.filter(question => mockReviewStatus(question) === 'wrong').length;
  const unanswered = review.filter(question => mockReviewStatus(question) === 'unanswered').length;
  const unavailable = review.filter(question => question.unavailable).length;
  return { correct, wrong, unanswered, unavailable, total: review.length,
    ...mockDisplayScore({ school, score: correct, wrong, gradable: review.length }) };
}

// Review snapshots, not the active exam, supply answer keys after submission.
export function mockReviewQuestions(result, test) {
  const original = new Map((test?.questions || []).map(question => [question.num, question]));
  return [...(result.review || [])].sort((a, b) => a.num - b.num).map(row => {
    if (row.unavailable) return row;
    const source = original.get(row.num);
    return { ...source, ...row, id: row.qid || row.id || source?.id, lang: row.lang || source?.lang };
  });
}
