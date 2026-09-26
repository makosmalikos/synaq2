import { STATIC_TOPICS, STATIC_BANK_IDS } from './topicCatalog.generated.js';
import { partitionAdminTasks } from './questionMetadata.js';
import { addQuestionsToTopics } from './topicSummary.js';

export function topicsWithAdminTasks(tasks = []) {
  const { active } = partitionAdminTasks(tasks, STATIC_BANK_IDS);
  return addQuestionsToTopics(STATIC_TOPICS, active).filter((topic) => topic.count > 0);
}

// Same readiness/fallback policy as the training bank, but no statements or
// solutions from the bundled question bank are downloaded for a report.
// Browser reports use the generated answer-free baseline. Server code may
// inject an Admin SDK reader when it needs live custom-task counts.
export async function loadTopicCatalog(readTasks = async () => []) {
  try {
    return topicsWithAdminTasks(await readTasks());
  } catch (error) {
    console.warn('bankTasks (каталог тем) не загрузились:', error?.message || error);
    return topicsWithAdminTasks();
  }
}
