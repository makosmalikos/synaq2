// Read administrative publication state for each request, including warm workers.
async function loadPublishedBank(db) {
  const { getStandardBank } = require('./standard-bank');
  const [bank, metadata, snapshot] = await Promise.all([
    import('../../frontend/src/bank.js'), import('../../frontend/src/questionMetadata.js'),
    db.collection('bankTasks').get(),
  ]);
  const bundled = [...bank.POOL, ...getStandardBank()];
  const { active } = metadata.partitionAdminTasks(snapshot.docs.map((doc) => ({ ...doc.data(),id:doc.id })), bundled.map((question) => question.id));
  return [...bundled, ...active];
}
module.exports = { loadPublishedBank };
