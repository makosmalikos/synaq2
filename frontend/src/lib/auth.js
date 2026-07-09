// Логика авторизации Synaq поверх Firebase.
// Родитель: Google или email/пароль. Ребёнок: код + PIN (служебный аккаунт код@synaq.kids).
import {
  signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut as fbSignOut, onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs,
} from 'firebase/firestore';
import { auth, db, googleProvider, secondaryAuth, CHILD_DOMAIN } from './firebase.js';

const rand = (n, alphabet) =>
  Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
export const genCode = () => rand(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'); // код ребёнка
export const genPin = () => rand(4, '0123456789');                        // PIN

export const roleOf = (user) =>
  user && user.email && user.email.endsWith('@' + CHILD_DOMAIN) ? 'child' : 'parent';

export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
export const signOut = () => fbSignOut(auth);

// --- Родитель ---
export async function registerParentEmail(email, password, school) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureFamily(cred.user, school);
  return cred.user;
}
export async function loginParentEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}
export async function signInWithGoogle(school) {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureFamily(cred.user, school); // создаёт семью при первом входе
  return cred.user;
}

async function ensureFamily(user, school) {
  const ref = doc(db, 'families', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      parentEmail: user.email || null,
      parentName: user.displayName || null,
      school: school || 'rfmsh',
      createdAt: serverTimestamp(),
    });
  } else if (school) {
    await setDoc(ref, { school }, { merge: true });
  }
}
export async function getFamily(uid) {
  const snap = await getDoc(doc(db, 'families', uid));
  return snap.exists() ? snap.data() : null;
}
export async function setSchool(uid, school) {
  await setDoc(doc(db, 'families', uid), { school }, { merge: true });
}

// --- Ребёнок: создание родителем (код + PIN) ---
export async function createChild(parent, { name, klass }) {
  const code = genCode();
  const pin = genPin();
  const email = `${code.toLowerCase()}@${CHILD_DOMAIN}`;
  // создаём служебный аккаунт во вторичном экземпляре (родитель остаётся залогинен)
  const sec = secondaryAuth();
  const cred = await createUserWithEmailAndPassword(sec, email, pin);
  const childUid = cred.user.uid;
  await fbSignOut(sec);

  await setDoc(doc(db, 'families', parent.uid, 'children', childUid), {
    name, klass, code, createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'childIndex', childUid), { parentUid: parent.uid, name, klass });
  return { childUid, code, pin, name, klass };
}

export async function listChildren(parentUid) {
  const snap = await getDocs(collection(db, 'families', parentUid, 'children'));
  return snap.docs.map((d) => ({ childUid: d.id, ...d.data() }));
}

// --- Ребёнок: вход по коду + PIN ---
export async function loginChild(code, pin) {
  const email = `${String(code).trim().toLowerCase()}@${CHILD_DOMAIN}`;
  const cred = await signInWithEmailAndPassword(auth, email, pin);
  return cred.user;
}

// --- Сохранение результатов ---
export async function saveAttempt(childUid, attempt) {
  await addDoc(collection(db, 'results', childUid, 'attempts'), {
    ...attempt, at: serverTimestamp(),
  });
}
export async function saveMockResult(childUid, result) {
  await addDoc(collection(db, 'results', childUid, 'mocks'), {
    ...result, at: serverTimestamp(),
  });
}
export async function childMocks(childUid) {
  const snap = await getDocs(collection(db, 'results', childUid, 'mocks'));
  return snap.docs.map((d) => d.data());
}
export async function childAttempts(childUid) {
  const snap = await getDocs(collection(db, 'results', childUid, 'attempts'));
  return snap.docs.map((d) => d.data());
}
