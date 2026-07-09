// Инициализация Firebase. Значения берутся из .env (VITE_FIREBASE_*).
// Если ключей нет ИЛИ они неверные — приложение НЕ падает, а работает в демо-режиме.
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const CHILD_DOMAIN = 'synaq.kids';

let _app = null, _auth = null, _db = null, _provider = null, _ready = false;

// Пытаемся инициализировать только если ключи выглядят реальными.
if (cfg.apiKey && cfg.projectId) {
  try {
    _app = getApps().length ? getApps()[0] : initializeApp(cfg);
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    _provider = new GoogleAuthProvider();
    _ready = true;
  } catch (e) {
    // Неверные ключи и т.п. — не роняем сайт, уходим в демо-режим.
    console.warn('[Synaq] Firebase не инициализирован, работаем в демо-режиме:', e && e.message);
    _app = _auth = _db = _provider = null;
    _ready = false;
  }
}

export const app = _app;
export const auth = _auth;
export const db = _db;
export const googleProvider = _provider;
export const firebaseReady = _ready;

export function secondaryAuth() {
  if (!_ready) return null;
  try {
    const name = 'synaq-secondary';
    const existing = getApps().find((a) => a.name === name);
    const secApp = existing || initializeApp(cfg, name);
    return getAuth(secApp);
  } catch { return null; }
}
