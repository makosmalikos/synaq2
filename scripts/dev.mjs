import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const frontend = fileURLToPath(new URL('../frontend/', import.meta.url));
const envFile = fileURLToPath(new URL('../.env', import.meta.url));

function configuredFirebaseAdmin() {
  if (!existsSync(envFile)) return false;
  const values = new Map(readFileSync(envFile, 'utf8').split(/\r?\n/).map((line) => {
    const separator = line.indexOf('=');
    return separator < 1 ? ['', ''] : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
  return ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']
    .every((key) => values.get(key) && !values.get(key).includes('your_'));
}

if (process.env.SYNAQ_USE_EMULATORS !== '1' && !configuredFirebaseAdmin()) {
  console.warn('\n⚠ Firebase Admin не настроен: защищённая тренировка и серверный прогресс вернут server_not_configured.');
  console.warn('  Добавьте FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL и FIREBASE_PRIVATE_KEY в корневой .env');
  console.warn('  или используйте изолированный demo-режим: npm run dev:emulators\n');
}

const children = [
  spawn(process.execPath, ['backend/server.js'], { cwd: root, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], { cwd: frontend, stdio: 'inherit' }),
];
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
