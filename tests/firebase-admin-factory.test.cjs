const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const source = fs.readFileSync(`${__dirname}/../backend/lib/firebase-admin.js`, 'utf8');
const demo = { SYNAQ_USE_EMULATORS: '1', NODE_ENV: 'test', FIREBASE_PROJECT_ID: 'demo-synaq-tests',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:19099', FIRESTORE_EMULATOR_HOST: 'localhost:18080' };

function fixture(environment) {
  const env = { ...environment }, initialized = [], certs = [], apps = [{ name: '[DEFAULT]', options: { projectId: 'unrelated-project' } }];
  let loaded = 0;
  const context = { module: { exports: {} }, process: { env }, Headers, require(name) {
    if (name === 'node:crypto') return crypto;
    loaded++;
    if (name === 'firebase-admin/app') return { getApps: () => apps,
      initializeApp(options, name) { const app = { name, options }; apps.push(app); initialized.push(app); return app; },
      cert(config) { certs.push(config); return 'certificate'; } };
    if (name === 'firebase-admin/auth') return { getAuth: (app) => ({ app }) };
    if (name === 'firebase-admin/firestore') return { getFirestore: (app) => ({ app }),
      Firestore: class { constructor(options) { this.options = options; } } };
    throw Error(`Unexpected dependency ${name}`);
  } };
  vm.runInNewContext(source, context);
  return { getAdmin: context.module.exports.getAdmin, env, initialized, certs, apps, loaded: () => loaded };
}

test('demo opt-in is keyless and uses explicit local-only credentials for Auth and Firestore', async () => {
  const f = fixture(demo);
  const result = f.getAdmin();
  assert.equal(result.auth.app.name, 'synaq-child-api');
  assert.equal(result.auth.app.options.projectId, 'demo-synaq-tests');
  assert.equal((await result.auth.app.options.credential.getAccessToken()).access_token, 'owner');
  assert.equal((await result.auth.app.options.credential.getAccessToken()).expires_in, 3600);
  assert.equal(result.db.options.host, demo.FIRESTORE_EMULATOR_HOST);
  assert.equal(result.db.options.projectId, 'demo-synaq-tests');
  assert.equal(result.db.options.ssl, false);
  assert.equal(result.db.options.preferRest, false);
  assert.equal((await result.db.options.authClient.getRequestHeaders()).get('Authorization'), 'Bearer owner');
  assert.equal(result.db.options.authClient.universeDomain, 'googleapis.com');
  assert.equal(f.certs.length, 0);
  assert.equal(f.getAdmin(), result);
  assert.equal(f.initialized.length, 1);
});

test('every unsafe emulator configuration is rejected before SDK loading', () => {
  const invalid = [
    { SYNAQ_USE_EMULATORS: undefined }, { SYNAQ_USE_EMULATORS: 'true' }, { SYNAQ_USE_EMULATORS: '0' },
    { NODE_ENV: 'production' }, { FIREBASE_PROJECT_ID: 'synaq-88779' },
    { FIREBASE_AUTH_EMULATOR_HOST: '' }, { FIRESTORE_EMULATOR_HOST: '' },
    { FIREBASE_AUTH_EMULATOR_HOST: 'https://127.0.0.1:19099' },
    { FIRESTORE_EMULATOR_HOST: '127.0.0.1:18080/path' },
    { FIREBASE_AUTH_EMULATOR_HOST: '0.0.0.0:19099' }, { FIRESTORE_EMULATOR_HOST: 'example.com:8080' },
    { FIRESTORE_EMULATOR_HOST: '127.0.0.1:65536' }, { FIRESTORE_EMULATOR_HOST: '127.0.0.1:0' },
    { FIREBASE_CLIENT_EMAIL: 'service@example.invalid' }, { FIREBASE_PRIVATE_KEY: 'private-key' },
    { GOOGLE_APPLICATION_CREDENTIALS: '/private/account.json' }, { FIREBASE_CONFIG: '{}' },
    { GOOGLE_CLOUD_PROJECT: 'production-project' }, { GCLOUD_PROJECT: 'production-project' },
  ];
  for (const overrides of invalid) {
    const f = fixture({ ...demo, ...overrides });
    assert.throws(f.getAdmin, { code: 'synaq/admin-config', status: 503 }, JSON.stringify(overrides));
    assert.equal(f.loaded(), 0);
  }
});

test('certificate mode remains the default and cannot accidentally inherit emulator hosts', () => {
  const certEnv = { FIREBASE_PROJECT_ID: 'real-project', FIREBASE_CLIENT_EMAIL: 'service@example.invalid', FIREBASE_PRIVATE_KEY: 'first\\nsecond' };
  const f = fixture(certEnv);
  const result = f.getAdmin();
  assert.equal(result.auth.app.options.credential, 'certificate');
  assert.equal(f.certs[0].privateKey, 'first\nsecond');
  for (const overrides of [{ FIREBASE_PROJECT_ID: '' }, { FIREBASE_PROJECT_ID: 'demo-synaq-tests' },
    { FIREBASE_CLIENT_EMAIL: '' }, { FIREBASE_PRIVATE_KEY: '' },
    { FIREBASE_AUTH_EMULATOR_HOST: demo.FIREBASE_AUTH_EMULATOR_HOST }, { FIRESTORE_EMULATOR_HOST: demo.FIRESTORE_EMULATOR_HOST }]) {
    assert.throws(fixture({ ...certEnv, ...overrides }).getAdmin, { code: 'synaq/admin-config' });
  }
});

test('cached SDK cannot outlive its validated configuration or adopt a foreign named app', () => {
  const f = fixture(demo);
  f.getAdmin();
  f.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:19098';
  assert.throws(f.getAdmin, { code: 'synaq/admin-config' });
  const occupied = fixture(demo);
  occupied.apps.push({ name: 'synaq-child-api' });
  assert.throws(occupied.getAdmin, { code: 'synaq/admin-config' });
  const ipv6 = fixture({ ...demo, FIREBASE_AUTH_EMULATOR_HOST: '[::1]:19099', FIRESTORE_EMULATOR_HOST: '[::1]:18080' });
  assert.ok(ipv6.getAdmin());
});

test('actual Admin/Firestore SDK initializes demo transport without ADC or metadata discovery', () => {
  // No RPC is sent: initialize the real SDK transport with ADC discovery
  // forbidden. This catches SDK compatibility changes hidden by unit mocks.
  const result = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const { GoogleAuth } = require('google-auth-library');
    let adc = 0;
    GoogleAuth.prototype.getApplicationDefaultAsync = async () => { adc++; throw Error('ADC forbidden'); };
    const { getAdmin } = require('./backend/lib/firebase-admin');
    const { getApps, deleteApp } = require('firebase-admin/app');
    (async () => {
      const { db } = getAdmin();
      const token = await getApps()[0].options.credential.getAccessToken();
      assert.equal(token.access_token, 'owner');
      assert.equal(token.expires_in, 3600);
      await db._clientPool.run('credential-test', false, (client) => client.initialize());
      assert.equal(adc, 0);
      assert.equal(db.projectId, 'demo-synaq-tests');
      await db.terminate();
      await Promise.all(getApps().map(deleteApp));
    })().catch((error) => { console.error(error); process.exitCode = 1; });
  `], { cwd: `${__dirname}/..`, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, ...demo, FIREBASE_CLIENT_EMAIL: '', FIREBASE_PRIVATE_KEY: '', GOOGLE_APPLICATION_CREDENTIALS: '',
      FIREBASE_CONFIG: '', GCLOUD_PROJECT: demo.FIREBASE_PROJECT_ID, GOOGLE_CLOUD_PROJECT: demo.FIREBASE_PROJECT_ID } });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.doesNotMatch(result.stderr, /MetadataLookupWarning|ADC forbidden/);
});

for (const mode of ['demo', 'certificate']) {
  test(`all API initializers reuse the first named Admin app (${mode}, real SDK, no RPC)`, () => {
    const result = spawnSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const fs = require('node:fs');
      const vm = require('node:vm');
      const { createRequire } = require('node:module');
      const path = require('node:path');
      const { GoogleAuth } = require('google-auth-library');
      GoogleAuth.prototype.getApplicationDefaultAsync = async () => { throw Error('ADC forbidden'); };
      // Initializing Auth/Firestore must not open any transport or ask metadata
      // servers for credentials. The production key below is ephemeral and local.
      require('node:net').Socket.prototype.connect = () => { throw Error('Network forbidden'); };
      if (${JSON.stringify(mode)} === 'certificate') {
        const { privateKey } = require('node:crypto').generateKeyPairSync('rsa', { modulusLength: 2048 });
        delete process.env.SYNAQ_USE_EMULATORS;
        delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
        delete process.env.FIRESTORE_EMULATOR_HOST;
        process.env.FIREBASE_PROJECT_ID = 'synaq-initializer-test';
        process.env.FIREBASE_CLIENT_EMAIL = 'initializer@example.invalid';
        process.env.FIREBASE_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' });
      }
      const { getAdmin } = require('./backend/lib/firebase-admin');
      const { getApps, getApp, deleteApp } = require('firebase-admin/app');
      (async () => {
        const original = getAdmin(); // Same factory used first by child-create.
        assert.equal(original.auth.app.name, 'synaq-child-api');
        assert.throws(() => getApp(), { code: 'app/no-app' });
        const accessors = {
          'child-create': 'getAdmin()', 'child-password': 'getAdmin()',
          'duel': 'getAdmin()', 'duel-award': 'getAdmin()', 'entitlement': 'getAdmin()',
          'checkout': '({ auth: getAdminAuth(), db: getAdminStore() })',
          'explain': '({ auth: getAdminAuth(), db: getAdminDb() })',
          'admin-task': '({ auth: getAdminAuth(), db: getAdminDb() })',
          'admin-login': '({ auth: getAdminAuth() })', 'webhook': '({ db: store() })',
        };
        const shared = new Set(['admin-login', 'child-password', 'duel-award', 'entitlement']);
        for (const [name, accessor] of Object.entries(accessors)) {
          const filename = path.resolve(shared.has(name) ? 'backend/handlers' : 'api', name + '.js');
          const code = fs.readFileSync(filename, 'utf8');
          assert.doesNotMatch(code, /initializeApp|getApps\\(/, name + ' bypasses the shared factory');
          const context = { module: { exports: {} }, require: createRequire(filename), process, console };
          vm.runInNewContext(code + '\\nmodule.exports = () => ' + accessor + ';', context, { filename });
          const services = context.module.exports();
          if (services.auth) assert.equal(services.auth, original.auth, name + ' auth');
          if (services.db) assert.equal(services.db, original.db, name + ' db');
        }
        // Exercise the actual handler sequence too. A malformed token is
        // rejected locally by the real SDK, before any provider/storage RPC.
        process.env.GEMINI_API_KEY = 'local-unused-provider-key';
        process.env.DODO_PAYMENTS_API_KEY = 'local-unused-provider-key';
        process.env.DODO_PRODUCT_ID = 'local-unused-product';
        for (const name of Object.keys(accessors).filter((value) => value !== 'webhook')) {
          const handler = require(shared.has(name) ? './backend/handlers/' + name : './api/' + name);
          const req = { method: name === 'entitlement' ? 'GET' : 'POST', body: {},
            headers: { authorization: 'Bearer not-a-jwt' } };
          const res = { statusCode: 200, setHeader() {},
            status(code) { this.statusCode = code; return this; },
            json(body) { this.body = body; return this; } };
          await handler(req, res);
          assert.equal(res.statusCode, name === 'admin-task' ? 403 : 401,
            name + ': ' + JSON.stringify(res.body));
        }
        assert.equal(getApps().length, 1);
        assert.throws(() => getApp(), { code: 'app/no-app' });
        await original.db.terminate();
        await Promise.all(getApps().map(deleteApp));
      })().catch((error) => { console.error(error); process.exitCode = 1; });
    `], { cwd: `${__dirname}/..`, encoding: 'utf8', timeout: 15000,
      env: { ...process.env, ...demo, FIREBASE_CLIENT_EMAIL: '', FIREBASE_PRIVATE_KEY: '', GOOGLE_APPLICATION_CREDENTIALS: '',
        FIREBASE_CONFIG: '', GCLOUD_PROJECT: demo.FIREBASE_PROJECT_ID, GOOGLE_CLOUD_PROJECT: demo.FIREBASE_PROJECT_ID } });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    assert.doesNotMatch(result.stderr, /MetadataLookupWarning|ADC forbidden|Network forbidden/);
  });
}
