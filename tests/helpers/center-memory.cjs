const assert = require('node:assert/strict');

// Serial, atomic transactions with query support and read-before-write checks.
function centerMemory(seed = {}) {
  const records = new Map(Object.entries(seed));
  let tail = Promise.resolve();
  const value = v => v instanceof Date ? v.getTime() : v;
  const snap = path => ({ id: path.split('/').at(-1), exists: records.has(path), data: () => records.get(path) });
  const doc = path => ({ path, get: async () => snap(path), collection: name => collection(`${path}/${name}`) });
  function collection(path, filters = [], order = null, limit = Infinity) {
    return { path, query: true, doc: id => doc(`${path}/${id}`),
      where: (field, op, expected) => collection(path, [...filters, [field, op, expected]], order, limit),
      orderBy: (field, direction = 'asc') => collection(path, filters, [field, direction], limit),
      limit: max => collection(path, filters, order, max),
      get: async () => {
        let docs = [...records.keys()].filter(key => key.startsWith(path + '/') && key.split('/').length === path.split('/').length + 1)
          .map(snap).filter(s => filters.every(([field, op, expected]) => op === '==' ? s.data()[field] === expected
            : op === '>=' ? value(s.data()[field]) >= value(expected) : op === '<' ? value(s.data()[field]) < value(expected) : false));
        if (order) docs.sort((a, b) => (value(a.data()[order[0]]) - value(b.data()[order[0]])) * (order[1] === 'desc' ? -1 : 1));
        docs = docs.slice(0, limit);
        return { docs, size: docs.length, empty: !docs.length };
      },
    };
  }
  return { records, collection, runTransaction(fn) {
    const work = tail.then(async () => {
      const writes = [];
      const result = await fn({ get: async ref => { assert.equal(writes.length, 0, 'Reads must precede writes'); return ref.get(); },
        create(ref, data) { assert.equal(records.has(ref.path), false); writes.push([ref.path, data]); },
        set(ref, data, options) { writes.push([ref.path, options?.merge ? { ...records.get(ref.path), ...data } : data]); },
        update(ref, data) { assert.ok(records.has(ref.path)); writes.push([ref.path, { ...records.get(ref.path), ...data }]); },
      });
      writes.forEach(([path, data]) => records.set(path, data));
      return result;
    });
    tail = work.catch(() => {});
    return work;
  } };
}
module.exports = { centerMemory };
