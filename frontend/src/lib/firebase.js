// Инициализация Firebase. Значения берутся из .env (VITE_FIREBASE_*).
// Если ключей нет — приложение работает в демо-режиме (Firebase НЕ инициализируется).
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

// Есть ли реальная конфигурация. Если нет — включаем демо-режим и НЕ трогаем Firebase.
export const firebaseReady = Boolean(cfg.apiKey && cfg.projectId);

// Домен служебных аккаунтов детей.
export const CHILD_DOMAIN = 'synaq.kids';

// Инициализируем только когда есть ключи (иначе getAuth падает с invalid-api-key).
export const app = firebaseReady
  ? (getApps().length ? getApps()[0] : initializeApp(cfg))
  : null;
export const auth = firebaseReady ? getAuth(app) : null;
export const db = firebaseReady ? getFirestore(app) : null;
export const googleProvider = firebaseReady ? new GoogleAuthProvider() : null;

// Вторичный экземпляр — чтобы создавать аккаунт ребёнку, не разлогинивая родителя.
export function secondaryAuth() {
  if (!firebaseReady) return null;
  const name = 'synaq-secondary';
  const existing = getApps().find((a) => a.name === name);
  const secApp = existing || initializeApp(cfg, name);
  return getAuth(secApp);
}
