// Minimal isolated Admin SDK double; queued transactions make writes atomic.
function memoryDb(seed = {}) {
  const records = new Map(Object.entries(seed));
  const snapshot = (path) => ({ exists: records.has(path), data: () => records.get(path) });
  const doc = (path) => ({ path, id: path.split('/').at(-1), get: async () => snapshot(path), collection: (name) => collection(`${path}/${name}`) });
  const collection = (path) => ({ doc: (id) => doc(`${path}/${id}`) });
  const db = { records, collection, async runTransaction(fn) {
    const pending = [];
    const result = await fn({
      get: async (ref) => snapshot(ref.path),
      create(ref, value) { if (records.has(ref.path)) throw new Error('already_exists'); pending.push([ref.path, value]); },
      set(ref, value, options) { pending.push([ref.path, options?.merge ? { ...records.get(ref.path), ...value } : value]); },
      update(ref, value) { if (!records.has(ref.path)) throw new Error('missing_document'); pending.push([ref.path, { ...records.get(ref.path), ...value }]); },
    });
    for (const [path, value] of pending) records.set(path, value);
    return result;
  } };
  return db;
}
module.exports = { memoryDb };
