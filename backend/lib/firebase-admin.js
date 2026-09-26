// All APIs share this explicitly named Admin app. Never inherit an unrelated
// default app or silently accept the SDK's emulator environment variables.
const { createHash } = require('node:crypto');
const APP_NAME = 'synaq-child-api'; // Retained name for existing warm processes.
const DEMO_PROJECT = 'demo-synaq-tests';
let cached;

function configurationError() {
  return Object.assign(new Error('server_not_configured'), { code: 'synaq/admin-config', status: 503 });
}

function loopbackHost(value) {
  const match = /^(localhost|127\.0\.0\.1|\[::1\]):([1-9]\d{0,4})$/.exec(value || '');
  return !!match && Number(match[2]) <= 65535;
}

function configuration(env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  const emulator = env.SYNAQ_USE_EMULATORS === '1';
  const authHost = env.FIREBASE_AUTH_EMULATOR_HOST || '';
  const firestoreHost = env.FIRESTORE_EMULATOR_HOST || '';
  const clientEmail = env.FIREBASE_CLIENT_EMAIL || '';
  const privateKey = env.FIREBASE_PRIVATE_KEY || '';
  if (env.SYNAQ_USE_EMULATORS && !emulator) throw configurationError();
  if (emulator) {
    if (env.NODE_ENV === 'production' || projectId !== DEMO_PROJECT
      || !loopbackHost(authHost) || !loopbackHost(firestoreHost)
      || clientEmail || privateKey || env.GOOGLE_APPLICATION_CREDENTIALS || env.FIREBASE_CONFIG
      || [env.GOOGLE_CLOUD_PROJECT, env.GCLOUD_PROJECT].some((id) => id && id !== DEMO_PROJECT)) {
      throw configurationError();
    }
  } else if (authHost || firestoreHost || !projectId || projectId.startsWith('demo-') || !clientEmail || !privateKey) {
    throw configurationError();
  }
  return { emulator, projectId, authHost, firestoreHost, clientEmail, privateKey };
}

function getAdmin() {
  // Validate on every request, even when an SDK app is already cached.
  const config = configuration(process.env);
  const fingerprint = createHash('sha256').update(JSON.stringify(config)).digest('hex');
  if (cached) {
    if (cached.fingerprint !== fingerprint) throw configurationError();
    return cached.services;
  }
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  const { getFirestore, Firestore } = require('firebase-admin/firestore');
  if (getApps().some((app) => app.name === APP_NAME)) throw configurationError();
  const options = { projectId: config.projectId };
  if (config.emulator) {
    options.credential = { getAccessToken: async () => ({ access_token: 'owner', expires_in: 3600 }) };
  } else options.credential = cert({ projectId: config.projectId,
    clientEmail: config.clientEmail, privateKey: config.privateKey.replace(/\\n/g, '\n') });
  const app = initializeApp(options, APP_NAME);
  // Admin getFirestore(app) rejects custom credentials. Its public Firestore
  // constructor accepts an explicit local authClient, so neither Auth nor
  // Firestore can fall through to ADC files or Google's metadata server.
  const db = config.emulator ? new Firestore({ projectId: config.projectId, host: config.firestoreHost,
    ssl: false, preferRest: false, authClient: {
      universeDomain: 'googleapis.com',
      getAccessToken: async () => ({ token: 'owner' }),
      getRequestHeaders: async () => new Headers({ Authorization: 'Bearer owner' }),
    } }) : getFirestore(app);
  const services = { auth: getAuth(app), db };
  cached = { fingerprint, services };
  return services;
}

module.exports = { getAdmin };
