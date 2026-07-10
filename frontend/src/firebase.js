// Firebase: авторизация (родитель по почте, ребёнок по коду+PIN) и сохранение результатов.
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, getDocs, addDoc, collection, serverTimestamp,
} from 'firebase/firestore';

// Конфиг проекта synaq-88779 (тот же, что у waitlist-лендинга).
const firebaseConfig = {
  apiKey: 'AIzaSyATdVvMsNkN0F66XipkShtFe0wKizu2r6o',
  authDomain: 'synaq-88779.firebaseapp.com',
  projectId: 'synaq-88779',
  storageBucket: 'synaq-88779.firebasestorage.app',
  messagingSenderId: '592299512879',
  appId: '1:592299512879:web:b87d2fe2d2e67f6f99e2da',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const KID_DOMAIN = '@synaq.kids';          // технический домен для детских «почт»
const kidEmail = (code) => code.trim().toLowerCase() + KID_DOMAIN;
export const isKid = (user) => !!user && (user.email || '').endsWith(KID_DOMAIN);

// ── Родитель: регистрация и вход ──
export async function registerParent(email, password, { school }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'families', cred.user.uid), {
    parentEmail: email, school: school || null, createdAt: serverTimestamp(),
  });
  return cred.user;
}
export const loginParent = (email, password) => signInWithEmailAndPassword(auth, email, password);

// Вход через Google (родитель). Создаёт семью при первом входе.
export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  // семью создаём отдельно — даже если Firestore не настроен, вход не должен падать
  try {
    const ref = doc(db, 'families', cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, { parentEmail: cred.user.email, school: 'РФМШ', createdAt: serverTimestamp() });
  } catch (e) { /* Firestore міндетті емес — авторизация өтті */ }
  return cred.user;
}

// ── Родитель создаёт ребёнка (код + PIN), не выходя из своего аккаунта ──
export async function createChild(parentUid, { name, klass, code, pin }) {
  const fam = await getDoc(doc(db, 'families', parentUid));
  const school = fam.exists() ? (fam.data().school || 'РФМШ') : 'РФМШ';
  // вторичный экземпляр Firebase, чтобы не менять текущую сессию родителя
  const secondary = initializeApp(firebaseConfig, 'sec-' + Date.now());
  const secAuth = getAuth(secondary);
  try {
    const cred = await createUserWithEmailAndPassword(secAuth, kidEmail(code), pin);
    const childUid = cred.user.uid;
    await setDoc(doc(db, 'families', parentUid, 'children', childUid), {
      name, klass, code: code.trim().toLowerCase(), createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'childIndex', childUid), { parentUid, name, klass, school });
    return { childUid, code };
  } finally {
    await signOut(secAuth).catch(() => {});
    await deleteApp(secondary).catch(() => {});
  }
}

// ── Ребёнок: вход по коду + PIN ──
export const loginChild = (code, pin) => signInWithEmailAndPassword(auth, kidEmail(code), pin);

// Школа текущего ребёнка (для показа задач нужной школы)
export async function getMySchool() {
  const u = auth.currentUser;
  if (!u) return 'РФМШ';
  try { const s = await getDoc(doc(db, 'childIndex', u.uid)); return (s.exists() && s.data().school) || 'РФМШ'; }
  catch { return 'РФМШ'; }
}

// Профиль ребёнка (имя, класс, школа)
export async function getMyProfile() {
  const u = auth.currentUser;
  if (!u) return { name: 'Бала', klass: '', school: 'РФМШ' };
  try {
    const s = await getDoc(doc(db, 'childIndex', u.uid));
    if (s.exists()) { const d = s.data(); return { name: d.name || 'Бала', klass: d.klass || '', school: d.school || 'РФМШ' }; }
  } catch {}
  return { name: 'Бала', klass: '', school: 'РФМШ' };
}

export const logout = () => signOut(auth);
export const watchAuth = (cb) => onAuthStateChanged(auth, cb);

// ── Сохранение результатов ребёнка ──
export const saveAttempt = (uid, a) =>
  addDoc(collection(db, 'results', uid, 'attempts'), { ...a, at: serverTimestamp() });
export const saveMock = (uid, r) =>
  addDoc(collection(db, 'results', uid, 'mocks'), { ...r, at: serverTimestamp() });

// ── Чтение (для прогресса / дашборда родителя) ──
export async function getChildren(parentUid) {
  const snap = await getDocs(collection(db, 'families', parentUid, 'children'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
export async function getMocks(childUid) {
  const snap = await getDocs(collection(db, 'results', childUid, 'mocks'));
  return snap.docs.map((d) => d.data());
}
export async function getAttempts(childUid) {
  const snap = await getDocs(collection(db, 'results', childUid, 'attempts'));
  return snap.docs.map((d) => d.data());
}
