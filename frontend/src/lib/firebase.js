// Инициализация Firebase. Значения берутся из .env (VITE_FIREBASE_*).
// Скопируйте .env.example → .env и подставьте ключи из консоли Firebase.
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

// Основной экземпляр (родитель/ребёнок).
export const app = getApps().length ? getApps()[0] : initializeApp(cfg);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Вторичный экземпляр — чтобы создавать аккаунт ребёнку, не разлогинивая родителя.
export function secondaryAuth() {
  const name = 'synaq-secondary';
  const existing = getApps().find((a) => a.name === name);
  const secApp = existing || initializeApp(cfg, name);
  return getAuth(secApp);
}

// Есть ли реальная конфигурация (иначе включаем демо-режим без бэкенда авторизации).
export const firebaseReady = Boolean(cfg.apiKey && cfg.projectId);

// Домен служебных аккаунтов детей.
export const CHILD_DOMAIN = 'synaq.kids';
