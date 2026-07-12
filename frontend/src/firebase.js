// Firebase: авторизация (родитель по почте, ребёнок по логину+паролю) и прогресс.
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile,
  signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, getDocs, addDoc, collection, serverTimestamp,
} from 'firebase/firestore';

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

const KID_DOMAIN = '@synaq.kids';
const kidEmail = (code) => code.trim().toLowerCase() + KID_DOMAIN;
export const isKid = (user) => !!user && (user.email || '').endsWith(KID_DOMAIN);

// Пароль: без похожих символов (0/O, 1/l) — детям диктовать голосом.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
export function genPassword(len = 8) {
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => ALPHABET[n % ALPHABET.length]).join('');
}

// Логин ребёнка становится почтой «логин@synaq.kids», поэтому кириллица в нём
// даёт auth/invalid-email. Транслитерируем имя.
const TR = {
  а:'a',ә:'a',б:'b',в:'v',г:'g',ғ:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',қ:'q',
  л:'l',м:'m',н:'n',ң:'n',о:'o',ө:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ұ:'u',ү:'u',ф:'f',х:'h',
  һ:'h',ц:'c',ч:'ch',ш:'sh',щ:'sh',ъ:'',ы:'y',і:'i',ь:'',э:'e',ю:'yu',я:'ya',
};
export const cleanUsername = (s = '') =>
  s.toLowerCase().split('').map((c) => (TR[c] ?? c)).join('').replace(/[^a-z0-9]/g, '');
export const suggestUsername = (name) => {
  const base = cleanUsername(name);
  return base ? base + Math.floor(10 + Math.random() * 90) : '';
};

// ── Родитель ──
// Школа больше не спрашивается вообще: дайындык идёт по всему банку,
// а школа выбирается только в момент мок-теста.
export async function registerParent(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'families', cred.user.uid), {
    parentEmail: email,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}
export const loginParent = (email, password) => signInWithEmailAndPassword(auth, email, password);

export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  try {
    const ref = doc(db, 'families', cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, { parentEmail: cred.user.email, createdAt: serverTimestamp() });
  } catch { /* Firestore міндетті емес — авторизация өтті */ }
  return cred.user;
}

// ── Родитель создаёт ребёнка ──
// createUserWithEmailAndPassword МОЛЧА логинит нового юзера в тот же app —
// родитель бы вылетел из сессии и следующая запись упала бы с permission-denied.
// Поэтому аккаунт ребёнка создаём во ВТОРИЧНОМ экземпляре Firebase.
export async function createChild(parentUid, { name, klass = '', code, pin }) {
  const secondary = initializeApp(firebaseConfig, 'sec-' + Date.now());
  const secAuth = getAuth(secondary);
  try {
    const cred = await createUserWithEmailAndPassword(secAuth, kidEmail(code), pin);
    const childUid = cred.user.uid;
    // Имя в профиль аккаунта — тогда оно показывается сразу, даже если
    // childIndex почему-то не прочитается.
    await updateProfile(cred.user, { displayName: name }).catch(() => {});
    await setDoc(doc(db, 'families', parentUid, 'children', childUid), {
      name, klass, code: code.trim().toLowerCase(), createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'childIndex', childUid), { parentUid, name, klass });
    return { childUid, code };
  } finally {
    await signOut(secAuth).catch(() => {});
    await deleteApp(secondary).catch(() => {});
  }
}

export const loginChild = (code, pin) => signInWithEmailAndPassword(auth, kidEmail(code), pin);

// Профиль ребёнка: настоящее имя вместо заглушки «Бала»
export async function getMyProfile() {
  const u = auth.currentUser;
  if (!u) return { name: '', klass: '' };
  const fallback = { name: u.displayName || '', klass: '' };
  try {
    const s = await getDoc(doc(db, 'childIndex', u.uid));
    if (!s.exists()) return fallback;
    const d = s.data();
    return { name: d.name || fallback.name, klass: d.klass || '' };
  } catch { return fallback; }
}

export const logout = () => signOut(auth);
export const watchAuth = (cb) => onAuthStateChanged(auth, cb);

// ── Прогресс ──
export const setFlag = (uid, qid, on) => on
  ? setDoc(doc(db, 'results', uid, 'flags', qid), { qid, at: serverTimestamp() })
  : import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(doc(db, 'results', uid, 'flags', qid)));
export async function getFlags(uid) {
  try { const snap = await getDocs(collection(db, 'results', uid, 'flags')); return snap.docs.map((d) => d.id); }
  catch { return []; }
}

// attempts — вся история попыток (для процента правильных).
// solved/{qid} — по одной записи на ЗАДАЧУ, пишется при любом ответе, верном
// или нет. Ребёнок решал — значит, задача засчитана как пройденная; счётчик
// «шешілген есеп» не должен стоять на нуле только потому, что он ошибся.
// Ключ = qid, поэтому повторное открытие той же задачи счётчик не надувает.
export async function saveAttempt(uid, a) {
  await addDoc(collection(db, 'results', uid, 'attempts'), { ...a, at: serverTimestamp() });
  await setDoc(doc(db, 'results', uid, 'solved', a.qid), {
    qid: a.qid, topic: a.topic || null, school: a.school || null,
    correct: !!a.correct, at: serverTimestamp(),
  }, { merge: true }).catch(() => {});
}
export const saveMock = (uid, r) =>
  addDoc(collection(db, 'results', uid, 'mocks'), { ...r, at: serverTimestamp() });

// ── Чтение ──
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
export async function getSolved(childUid) {
  try {
    const snap = await getDocs(collection(db, 'results', childUid, 'solved'));
    return snap.docs.map((d) => d.data());
  } catch { return []; }
}

// Человеческие сообщения об ошибках
export function errText(e) {
  const c = (e && e.code) || '';
  if (c.includes('email-already-in-use')) return 'Бұл юзернейм бос емес — басқасын таңдаңыз';
  if (c.includes('weak-password')) return 'Пароль тым қысқа (кемінде 6 таңба)';
  if (c.includes('invalid-email')) return 'Юзернейм тек латын әрпі мен цифрдан тұруы керек';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Қате логин немесе пароль';
  if (c.includes('permission-denied')) return 'Firestore ережелері жарияланбаған. Firebase Console → Firestore → Rules → Publish';
  if (c.includes('operation-not-allowed')) return 'Firebase-те Email/Password қосылмаған (Authentication → Sign-in method)';
  if (c.includes('unauthorized-domain')) return 'Домен рұқсат етілмеген (Firebase → Authorized domains)';
  if (c.includes('popup-blocked')) return 'Браузер терезені бөгеді — рұқсат етіңіз';
  if (c.includes('popup-closed')) return 'Терезе жабылды, қайта көріңіз';
  if (c.includes('network')) return 'Интернет байланысын тексеріңіз';
  return 'Қате: ' + (c || (e && e.message) || 'белгісіз');
}
