import {
  CURRICULUM,
  createCurriculumQuestions,
  curriculumAnswersMatch,
  validateCurriculum,
} from '../frontend/src/curriculumData.js';

const errors = validateCurriculum();
const seen = new Set();
let generated = 0;

for (const grade of [3, 4, 5, 6]) {
  const topics = CURRICULUM[grade] || [];
  for (const quarter of [1, 2, 3, 4]) {
    if (!topics.some((topic) => topic.quarter === quarter)) {
      errors.push(`${grade}: quarter ${quarter} is empty`);
    }
  }

  for (const topic of topics) {
    if (seen.has(topic.key)) errors.push(`${topic.key}: duplicate key`);
    seen.add(topic.key);

    for (const level of ['easy', 'medium', 'hard', 'mixed']) {
      const questions = createCurriculumQuestions(topic, level, 40);
      generated += questions.length;
      for (const question of questions) {
        if (!question.id || !question.text?.ru || !question.text?.kk) errors.push(`${topic.key}: missing question text`);
        if (!question.solution?.ru || !question.solution?.kk) errors.push(`${topic.key}: missing solution`);
        if (!String(question.answer).trim()) errors.push(`${topic.key}: empty answer`);
        if (!curriculumAnswersMatch(question.answer, question.answer)) errors.push(`${topic.key}: answer cannot be parsed`);
        if (/NaN|undefined|Infinity/.test(`${question.text.ru} ${question.text.kk} ${question.answer} ${question.solution.ru} ${question.solution.kk}`)) {
          errors.push(`${topic.key}: non-finite generated value`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error(`Curriculum validation failed (${errors.length}):`);
  console.error([...new Set(errors)].join('\n'));
  process.exit(1);
}

const topicCount = Object.values(CURRICULUM).reduce((total, topics) => total + topics.length, 0);
console.log(`Curriculum OK: ${topicCount} topics, ${generated} generated questions checked.`);
