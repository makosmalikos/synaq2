const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

function client() {
  const reads = [];
  const context = {
    module: { exports: {} }, console, Date, crypto: crypto.webcrypto, AbortSignal,
    initializeApp: () => ({}), getAuth: () => ({ currentUser: null }), getFirestore: () => ({}),
    firebaseSettings: () => ({ config: {}, emulators: false }),
    collection: (_, ...parts) => parts.join('/'),
    orderBy: (field, direction) => ({ type: 'orderBy', field, direction }),
    limit: (count) => ({ type: 'limit', count }),
    query: (ref, ...constraints) => ({ ref, constraints }),
    getDocs: async (value) => { reads.push(value); return { docs: [] }; },
  };
  const source = fs.readFileSync(`${__dirname}/../frontend/src/firebase.js`, 'utf8')
    .replace(/^import[\s\S]*?from ['"][^'"]+['"];\n/gm, '')
    .replace(/\bexport /g, '')
    .replaceAll('import.meta.env', 'undefined');
  vm.runInNewContext(source + '\nmodule.exports = { getMocks, getAttempts, getPlatformDiagnostics };', context);
  return { ...context.module.exports, reads };
}

test('history reads are newest-first and have explicit cost bounds', async () => {
  const value = client();
  await value.getMocks('child');
  await value.getAttempts('child');
  await value.getPlatformDiagnostics('child');

  assert.deepEqual(value.reads.map(({ ref, constraints }) => ({
    ref,
    order: constraints.find((item) => item.type === 'orderBy'),
    cap: constraints.find((item) => item.type === 'limit')?.count,
  })), [
    { ref: 'results/child/mocks', order: { type: 'orderBy', field: 'at', direction: 'desc' }, cap: 50 },
    { ref: 'results/child/attempts', order: { type: 'orderBy', field: 'at', direction: 'desc' }, cap: 500 },
    { ref: 'results/child/diagnostics', order: { type: 'orderBy', field: 'at', direction: 'desc' }, cap: 24 },
  ]);
});
