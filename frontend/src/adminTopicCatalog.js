import { STATIC_TOPICS } from './topicCatalog.generated.js';
import { STATIC_BANK_IDS } from './bankIds.generated.js';
import { partitionAdminTasks } from './questionMetadata.js';
import { addQuestionsToTopics } from './topicSummary.js';

// Only callers merging live administrative tasks need the static ID index.
export function topicsWithAdminTasks(tasks = []) {
  const { active } = partitionAdminTasks(tasks, STATIC_BANK_IDS);
  return addQuestionsToTopics(STATIC_TOPICS, active).filter(topic => topic.count > 0);
}
