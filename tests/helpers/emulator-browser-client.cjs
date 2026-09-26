const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');

const filename = path.resolve(__dirname, '../../frontend/src/firebase.js');
const frontendRequire = createRequire(filename);

// Execute the actual frontend adapter against real SDKs. Only Vite environment,
// import resolution and the app name are supplied by this Node test harness.
async function loadEmulatorClient(name, { firestorePort = 18080 } = {}) {
  if (!Number.isInteger(firestorePort) || firestorePort < 1 || firestorePort > 65535) throw Error('Invalid emulator port');
  let source = fs.readFileSync(filename, 'utf8');
  source = source.replaceAll('import.meta.env', JSON.stringify({ DEV: true, VITE_FIREBASE_EMULATORS: '1' }))
    .replace('globalThis.location?.hostname', JSON.stringify('127.0.0.1'))
    .replace('initializeApp(settings.config)', `initializeApp(settings.config, ${JSON.stringify(name)})`)
    .replace("connectFirestoreEmulator(db, '127.0.0.1', 18080)", `connectFirestoreEmulator(db, '127.0.0.1', ${firestorePort})`)
    .replace(/(['"])(firebase\/(?:app|auth|firestore))\1/g, (_, quote, specifier) => JSON.stringify(pathToFileURL(frontendRequire.resolve(specifier)).href))
    .replace("'./firebaseConfig.js'", JSON.stringify(pathToFileURL(path.join(path.dirname(filename), 'firebaseConfig.js')).href));
  source += `\n//# sourceURL=synaq-emulator-client-${name}.mjs\n`;
  const client = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  if (client.auth.app.options.projectId !== 'demo-synaq-tests' || !client.auth.emulatorConfig) throw Error('Emulator client guard failed');
  return client;
}

module.exports = { loadEmulatorClient, sdk: {
  ...frontendRequire('firebase/app'), ...frontendRequire('firebase/auth'), ...frontendRequire('firebase/firestore'),
} };
