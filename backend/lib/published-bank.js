// Read administrative publication state for each request, including warm workers.
async function loadPublishedBank(db) {
  const [bank, metadata, snapshot] = await Promise.all([
    import('../../frontend/src/bank.js'), import('../../frontend/src/questionMetadata.js'),
    db.collection('bankTasks').get(),
  ]);
  const { active } = metadata.partitionAdminTasks(snapshot.docs.map((doc) => ({ ...doc.data(),id:doc.id })), bank.POOL.map((question) => question.id));
  return [...bank.POOL, ...active];
}
module.exports = { loadPublishedBank };
