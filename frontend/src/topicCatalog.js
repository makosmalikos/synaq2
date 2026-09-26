import { STATIC_TOPICS, STATIC_BANK_IDS } from './topicCatalog.generated.js';
import { readAdminTasks } from './adminTasks.js';
import { partitionAdminTasks } from './questionMetadata.js';
import { addQuestionsToTopics } from './topicSummary.js';

export function topicsWithAdminTasks(tasks = []) {
  const { active } = partitionAdminTasks(tasks, STATIC_BANK_IDS);
  return addQuestionsToTopics(STATIC_TOPICS, active).filter((topic) => topic.count > 0);
}

// Same readiness/fallback policy as the training bank, but no statements or
// solutions from the bundled question bank are downloaded for a report.
export async function loadTopicCatalog(readTasks = readAdminTasks) {
  try {
    return topicsWithAdminTasks(await readTasks());
  } catch (error) {
    console.warn('bankTasks (каталог тем) не загрузились:', error?.message || error);
    return topicsWithAdminTasks();
  }
}
