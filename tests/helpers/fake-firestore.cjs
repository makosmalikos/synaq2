// Небольшая in-memory имитация Admin Firestore: документы, where/orderBy/limit, транзакции.
function fakeFirestore(seed = {}) {
  const records = new Map(Object.entries(seed));
  const snap = (path) => ({ id: path.split('/').at(-1), exists: records.has(path), data: () => records.get(path), ref: docRef(path) });
  function docRef(path) {
    return { path, id: path.split('/').at(-1),
      get: async () => snap(path),
      set: async (value, o) => { records.set(path, o?.merge ? { ...records.get(path), ...value } : value); },
      update: async (value) => { if (!records.has(path)) throw new Error('missing'); records.set(path, { ...records.get(path), ...value }); },
      delete: async () => { records.delete(path); } };
  }
  const val = (v) => v?.toMillis?.() ?? (v instanceof Date ? v.getTime() : v);
  function query(name, filters = [], order = null, max = Infinity) {
    const api = {
      where: (f, op, v) => query(name, [...filters, [f, op, v]], order, max),
      orderBy: (f, dir = 'asc') => query(name, filters, [f, dir], max),
      limit: (n) => query(name, filters, order, n),
      get: async () => {
        let docs = [...records.keys()].filter((p) => p.startsWith(`${name}/`) && !p.slice(name.length + 1).includes('/')).map(snap);
        for (const [f, op, v] of filters) docs = docs.filter((d) => { const x = val(d.data()[f]);
          return op === '==' ? x === v : op === '>=' ? x >= v : op === '<' ? x < v : false; });
        if (order) docs.sort((a, b) => (val(a.data()[order[0]]) - val(b.data()[order[0]])) * (order[1] === 'desc' ? -1 : 1));
        docs = docs.slice(0, max);
        return { docs, size: docs.length, empty: !docs.length };
      } };
    return api;
  }
  const db = {
    records,
    collection: (name) => ({ doc: (id) => docRef(`${name}/${id}`), ...query(name) }),
    async runTransaction(fn) {
      const pending = [];
      const tx = {
        get: async (ref) => snap(ref.path),
        create(ref, v) { if (records.has(ref.path) || pending.some((p) => p[0] === ref.path && p[1] !== 'delete')) throw new Error('already_exists'); pending.push([ref.path, v]); },
        set(ref, v, o) { pending.push([ref.path, v, o]); },
        update(ref, v) { pending.push([ref.path, v, { update: true }]); },
        delete(ref) { pending.push([ref.path, 'delete']); },
      };
      const result = await fn(tx);
      for (const [path, v, o] of pending) {
        if (v === 'delete') records.delete(path);
        else if (o?.merge || o?.update) records.set(path, { ...records.get(path), ...v });
        else records.set(path, v);
      }
      return result;
    },
  };
  return db;
}
module.exports = { fakeFirestore };
