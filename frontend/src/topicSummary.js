import { isGradable } from './grading.js';

// Works with either topic definitions (zero counts) or a precomputed catalog.
// Never mutates its inputs; shared by full-bank APIs and lightweight reports.
export function addQuestionsToTopics(catalog, questions) {
  const topics = new Map(catalog.map((topic) => [topic.id, {
    ...topic, count: topic.count || 0, gradableCount: topic.gradableCount || 0,
    schools: [...(topic.schools || [])],
  }]));
  for (const question of questions) {
    if (!question.topic) continue;
    if (!topics.has(question.topic)) topics.set(question.topic, {
      id: question.topic, name: question.topic, block: 'other', count: 0, gradableCount: 0, schools: [],
    });
    const topic = topics.get(question.topic);
    topic.count++;
    if (isGradable(question)) topic.gradableCount++;
    if (!topic.schools.includes(question.school)) topic.schools.push(question.school);
  }
  return [...topics.values()];
}
