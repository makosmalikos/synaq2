import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:19099' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:18080') {
  throw new Error('Start with npm run dev:emulators; both local emulators must be running.');
}
// This demo process never loads .env or inherits real service credentials.
const env = { ...process.env, NODE_ENV: 'development', SYNAQ_USE_EMULATORS: '1', FIREBASE_PROJECT_ID: 'demo-synaq-tests', GOOGLE_CLOUD_PROJECT: 'demo-synaq-tests', GCLOUD_PROJECT: 'demo-synaq-tests', PORT: '4001' };
for (const key of Object.keys(env)) {
  if (/^(?:GEMINI_|DODO_|ADMIN_EMAIL_|GOOGLE_APPLICATION_CREDENTIALS$|FIREBASE_CLIENT_EMAIL$|FIREBASE_PRIVATE_KEY$|FIREBASE_CONFIG$)/.test(key)) delete env[key];
}
const root = fileURLToPath(new URL('../', import.meta.url));
const children = [
  spawn(process.execPath, ['backend/server.js'], { cwd: root, env, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'vite.emulator.config.js'], { cwd: `${root}frontend`, env, stdio: 'inherit' }),
];
console.log('DEMO ONLY: http://127.0.0.1:5175/app — project demo-synaq-tests, ephemeral local accounts.');
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) if (child.exitCode == null) child.kill('SIGTERM');
}
for (const child of children) {
  child.on('error', (error) => { console.error(error.message); stop(1); });
  child.on('exit', (code) => { if (!stopping) stop(code || 0); });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
