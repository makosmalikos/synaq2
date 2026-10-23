// Shared server-only lookup: never return unpublished or quarantined admin tasks.
const { questionMinimumPlan, originalZerek } = require('./question-access');
async function findTrainingQuestion(db, id) {
  if (originalZerek({ id })) return null;
  const { getStandardBank } = require('./standard-bank');
  const edition = getStandardBank().find((question) => question.id === id);
  if (edition) return edition;
  const bank = await import('../../frontend/src/bank.js');
  const bundled = bank.POOL.find(question => question.id === id);
  if (bundled) return questionMinimumPlan(bundled) === null ? null : bundled;
  if (!db || typeof id !== 'string' || !id || id.length > 200 || id.includes('/')) return null;
  const snapshot = await db.collection('bankTasks').doc(id).get();
  if (!snapshot.exists) return null;
  const raw = snapshot.data();
  if (raw.status != null && raw.status !== 'published') return null;
  const { normalizeAdminTask, quarantineReason } = await import('../../frontend/src/questionMetadata.js');
  const question = normalizeAdminTask({ ...raw, id });
  return quarantineReason(question) || questionMinimumPlan(question) === null ? null : question;
}
module.exports = { findTrainingQuestion };
