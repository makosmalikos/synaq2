import { STATIC_TOPICS } from './topicCatalog.generated.js';

const baseline = () => STATIC_TOPICS.filter(topic => topic.count > 0)
  .map(topic => ({ ...topic, schools: [...topic.schools] }));

// Browser reports need only summary counts. The larger duplicate-ID index and
// admin normalizer load only when a caller actually supplies custom tasks.
export async function loadTopicCatalog(readTasks) {
  if (!readTasks) return baseline();
  try {
    const tasks = await readTasks();
    if (!tasks.length) return baseline();
    const { topicsWithAdminTasks } = await import('./adminTopicCatalog.js');
    return topicsWithAdminTasks(tasks);
  } catch (error) {
    console.warn('bankTasks (каталог тем) не загрузились:', error?.message || error);
    return baseline();
  }
}
