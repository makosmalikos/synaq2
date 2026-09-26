// Firebase: авторизация (родитель по почте, ребёнок по логину+паролю) и прогресс.
import { initializeApp } from 'firebase/app';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile,
  signOut, onIdTokenChanged, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail,
  EmailAuthProvider, linkWithCredential, reauthenticateWithCredential, updatePassword,
  signInWithCustomToken, connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, getDocs, collection, serverTimestamp,
  runTransaction, onSnapshot, connectFirestoreEmulator, query, orderBy, limit,
} from 'firebase/firestore';
import { firebaseSettings } from './firebaseConfig.js';

const settings = firebaseSettings(import.meta.env, globalThis.location?.hostname);
const app = initializeApp(settings.config);
export const auth = getAuth(app);
export const db = getFirestore(app);
if (settings.emulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:19099');
  connectFirestoreEmulator(db, '127.0.0.1', 18080);
}

const KID_DOMAIN = '@synaq.kids';
const kidEmail = (code = '') => {
  const value = String(code).trim().toLowerCase();
  const username = value.endsWith(KID_DOMAIN) ? value.slice(0, -KID_DOMAIN.length) : value;
  if (!/^[a-z0-9]+$/.test(username)) {
    throw Object.assign(new Error('invalid-child-code'), { code: 'auth/invalid-child-code' });
  }
  return username + KID_DOMAIN;
};
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

const normEmail = (email = '') => email.trim().toLowerCase();

// ── Родитель ──
// Школа больше не спрашивается вообще: дайындык идёт по всему банку,
// а школа выбирается только в момент мок-теста.
export async function ensureFamilyProfile(user, name = user?.displayName || '') {
  if (!user?.uid || !user.email || isKid(user)) throw Object.assign(new Error('parent_required'), { code: 'auth/parent-required' });
  const ref = doc(db, 'families', user.uid);
  const parentName = String(name).trim();
  return runTransaction(db, async (tx) => {
    const snapshot = await tx.get(ref);
    if (snapshot.exists()) {
      // A parallel auth callback may have created the profile before displayName
      // finished saving. Fill that name only; never replace an existing family.
      if (parentName && !snapshot.data().parentName) tx.set(ref, { parentName }, { merge: true });
      return;
    }
    tx.set(ref, { parentEmail: normEmail(user.email), parentName: parentName || null, createdAt: serverTimestamp() });
  });
}

export async function registerParent(email, password, name = '') {
  const cred = await createUserWithEmailAndPassword(auth, normEmail(email), password);
  const parentName = name.trim();
  if (parentName) await updateProfile(cred.user, { displayName: parentName }).catch(() => {});
  await ensureFamilyProfile(cred.user, parentName);
  return cred.user;
}
export async function loginParent(email, password) {
  const cred = await signInWithEmailAndPassword(auth, normEmail(email), password);
  await ensureFamilyProfile(cred.user);
  return cred;
}

export async function resetParentPassword(email) {
  await sendPasswordResetEmail(auth, normEmail(email));
}

export const hasPasswordLogin = (user) =>
  !!user?.providerData?.some((p) => p.providerId === 'password');

export const isGoogleLogin = (user) =>
  !!user?.providerData?.some((p) => p.providerId === 'google.com');

// Google-аккаунтқа email+пароль қосу — содан кейін екеуімен де кіруге болады.
export async function linkParentPassword(password) {
  const user = auth.currentUser;
  if (!user?.email) throw Object.assign(new Error('no-email'), { code: 'auth/no-email' });
  if ((password || '').length < 6) throw Object.assign(new Error('weak'), { code: 'auth/weak-password' });
  const credential = EmailAuthProvider.credential(normEmail(user.email), password);
  await linkWithCredential(user, credential);
  await user.reload();
}

export async function changeParentPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user?.email) throw Object.assign(new Error('no-email'), { code: 'auth/no-email' });
  if ((newPassword || '').length < 6) throw Object.assign(new Error('weak'), { code: 'auth/weak-password' });
  const credential = EmailAuthProvider.credential(normEmail(user.email), currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  await ensureFamilyProfile(cred.user);
  return cred.user;
}

// ── Родитель создаёт ребёнка ──
// Auth-аккаунт и связь с семьёй создаёт сервер после проверки родителя.
// Клиенту запрещено менять childIndex и присваивать существующие аккаунты.
export async function createChild(parentUid, { name, klass = '', code, pin, requestId, avatar }) {
  const user = auth.currentUser;
  if (!user || user.uid !== parentUid) throw Object.assign(new Error('login_required'), { code: 'auth/requires-login' });
  const normalized = kidEmail(code).slice(0, -KID_DOMAIN.length);
  const response = await fetch('/api/child-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify({ name, klass, code: normalized, pin, requestId, avatar }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorCode = ({ username_taken: 'auth/email-already-in-use', 'email-already-in-use': 'auth/email-already-in-use',
      weak_password: 'auth/weak-password', child_limit: 'auth/child-limit', invalid_child_code: 'auth/invalid-child-code',
      invalid_child: 'auth/invalid-child', family_missing: 'auth/family-missing', rate_limit: 'auth/too-many-requests',
    })[data.error] || 'auth/child-create-failed';
    throw Object.assign(new Error(data.error || 'child-create-failed'), { code: errorCode });
  }
  return { childUid: data.childUid, code: normalized };
}

// Только родитель. API сверяет ID-токен родителя и связь family/child в
// Firestore перед сменой Auth-пароля — UID ребёнка, прогресс, подписка и
// остальные документы остаются нетронутыми.
export async function resetChildPassword(childUid, password) {
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error('not-authenticated'), { code: 'auth/requires-login' });
  const idToken = await user.getIdToken();
  const response = await fetch('/api/child-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ childUid, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = data.error === 'weak_password' ? 'auth/weak-password'
      : data.error === 'not_child_owner' ? 'auth/not-child-owner'
        : data.error === 'child_not_found' ? 'auth/user-not-found'
          : 'auth/child-reset-failed';
    throw Object.assign(new Error(data.error || 'child-reset-failed'), { code, passwordChanged: data.passwordChanged === true });
  }
  return true;
}

export async function loginChild(code, pin) {
  if (String(pin || '').length < 6) throw Object.assign(new Error('invalid-child-pin'), { code: 'auth/invalid-child-pin' });
  return signInWithEmailAndPassword(auth, kidEmail(code), pin);
}

export function childErrText(e, lang = 'kk') {
  const code = e?.code || '';
  const ru = lang === 'ru';
  if (code.includes('invalid-child-code') || code.includes('invalid-email')) {
    return ru ? 'Введите логин ребёнка латинскими буквами и цифрами.' : 'Баланың логинін латын әріптерімен және цифрлармен енгізіңіз.';
  }
  if (code.includes('invalid-child-pin')) {
    return ru ? 'PIN должен содержать минимум 6 символов.' : 'PIN кемінде 6 таңбадан тұруы керек.';
  }
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return ru
      ? 'Неверный логин или PIN. Можно вводить binara или binara@synaq.kids. Если PIN потерян, попросите родителя изменить его в кабинете.'
      : 'Логин немесе PIN қате. binara немесе binara@synaq.kids түрінде енгізуге болады. PIN жоғалса, ата-ана кабинетінен жаңартыңыз.';
  }
  if (code.includes('too-many-requests')) {
    return ru ? 'Слишком много попыток. Подождите несколько минут и попробуйте снова.' : 'Әрекет тым көп. Бірнеше минуттан кейін қайталап көріңіз.';
  }
  if (code.includes('network')) {
    return ru ? 'Проверьте интернет-соединение и попробуйте снова.' : 'Интернет байланысын тексеріп, қайта көріңіз.';
  }
  return errText(e, lang);
}

// Дуэль: XP начисляет только сервер (транзакция + идемпотентность по коду
// дуэли) — клиент больше не пишет произвольную награду себе в статистику напрямую.
export async function claimDuelXp(code) {
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error('not-authenticated'), { code: 'auth/requires-login' });
  const idToken = await user.getIdToken();
  const response = await fetch('/api/duel-award', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'duel-award-failed'), { code: 'duel/award-failed' });
  return { gain: Number(data.gain) || 0, credited: data.credited === true };
}

// ── Администратор (Admin Panel) ──
// Пароля у админа нет: email сверяется server-side с allowlist ADMIN_EMAIL_1/2
// в серверный admin-login, который в ответ выдаёт Firebase custom token с клеймом
// admin:true. Здесь мы только логинимся этим токеном — сам допуск целиком
// решает сервер, фронт ничего не проверяет и не может подделать.
// Владение email подтверждается входом через Google — серверный admin-login
// проверяет подпись ID-токена и allowlist ADMIN_EMAIL_1/2, и только затем
// выдаёт отдельный admin custom token. Прежний вариант слал один email без
// токена — сервер требует Bearer и сейчас отклонял бы любой такой запрос.
export async function loginAdmin() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const googleCred = await signInWithPopup(auth, provider);
  const idToken = await googleCred.user.getIdToken(true);
  const r = await fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.token) {
    await signOut(auth).catch(() => {});
    throw Object.assign(new Error(data.error || 'admin_denied'), {
      code: data.error === 'not_allowed' ? 'admin/not-allowed'
        : data.error === 'google_required' ? 'admin/google-required'
          : 'admin/failed',
    });
  }
  const cred = await signInWithCustomToken(auth, data.token);
  return cred.user;
}

// Клеймы читаются из ID-токена асинхронно, поэтому isAdmin — Promise<boolean>.
// adminAuthVersion === 2 отсекает токены старого небезопасного endpoint'а,
// где владение email ещё не подтверждалось входом через Google.
export async function isAdmin(user) {
  if (!user) return false;
  try {
    const result = await user.getIdTokenResult();
    return result.claims?.admin === true && result.claims?.adminAuthVersion === 2;
  } catch { return false; }
}

function expiryMillis(value) {
  if (value?.toMillis) return value.toMillis();
  if (value == null) return 0;
  return new Date(value).getTime();
}

export function familyHasPro(family) {
  return familyPlan(family) === 'pro';
}

export function familyPlan(family) {
  const plan = ['standard', 'pro'].includes(family?.plan) ? family.plan : family?.pro === true ? 'pro' : 'free';
  const rawExpiry = family?.planExpiresAt ?? family?.proExpiresAt;
  if (rawExpiry == null) return plan;
  const expiresAt = expiryMillis(rawExpiry);
  return Number.isFinite(expiresAt) && expiresAt > Date.now() ? plan : 'free';
}

// The family is authoritative; childIndex is only a server-owned relationship.
export async function getMyProfile() {
  const u = auth.currentUser;
  if (!u) return { name: '', klass: '', plan: 'free', pro: false };
  const s = await getDoc(doc(db, 'childIndex', u.uid));
  const d = s.data() || {};
  const family = d.parentUid ? await getDoc(doc(db, 'families', d.parentUid)) : null;
  const plan = familyPlan(family?.data());
  return { name: d.name || u.displayName || '', klass: d.klass || '', school: d.school || 'РФМШ', avatar: d.avatar || 'owl',
    plan, pro: plan === 'pro', planExpiresAt: family?.data()?.planExpiresAt || family?.data()?.proExpiresAt || null,
    proExpiresAt: family?.data()?.proExpiresAt || null };
}

function watchChildProfile(uid, fallbackName, callback, onError = () => {}) {
  let stopFamily = () => {}, expiryTimer, closed = false;
  const fail = (error) => { if (!closed) onError(error); };
  const stopIndex = onSnapshot(doc(db, 'childIndex', uid), (snapshot) => {
    stopFamily(); clearTimeout(expiryTimer);
    const index = snapshot.data() || {};
    const base = { name: index.name || fallbackName || '', klass: index.klass || '', school: index.school || 'РФМШ', avatar: index.avatar || 'owl' };
    callback({ ...base, plan: 'free', pro: false, proLoading: !!index.parentUid });
    if (!index.parentUid) return;
    stopFamily = onSnapshot(doc(db, 'families', index.parentUid), (family) => {
      clearTimeout(expiryTimer);
      const data = family.data();
      const emit = () => {
        if (closed) return;
        const plan = familyPlan(data), expiresAt = data?.planExpiresAt ?? data?.proExpiresAt;
        callback({ ...base, plan, pro: plan === 'pro', planExpiresAt: expiresAt || null,
          proExpiresAt: data?.proExpiresAt || null, proLoading: false });
        const remaining = expiryMillis(expiresAt) - Date.now();
        if (plan !== 'free' && remaining > 0) expiryTimer = setTimeout(emit, Math.min(remaining + 25, 2147483647));
      };
      emit();
    }, fail);
  }, fail);
  return () => { closed = true; stopIndex(); stopFamily(); clearTimeout(expiryTimer); };
}

export function watchMyProfile(callback, onError) {
  const user = auth.currentUser;
  if (!user) return () => {};
  return watchChildProfile(user.uid, user.displayName, callback, onError);
}

export function watchPro(childUid, callback, onError) {
  return watchChildProfile(childUid, '', (profile) => {
    if (!profile.proLoading) callback(profile.pro);
  }, onError);
}

export const logout = () => signOut(auth);
export const watchAuth = (cb) => onIdTokenChanged(auth, cb);

// ── Прогресс ──
export const setFlag = (uid, qid, on) => on
  ? setDoc(doc(db, 'results', uid, 'flags', qid), { qid, at: serverTimestamp() })
  : import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(doc(db, 'results', uid, 'flags', qid)));
export async function getFlags(uid) {
  const snap = await getDocs(collection(db, 'results', uid, 'flags'));
  return snap.docs.map((d) => d.id);
}

// attempts — вся история попыток (для процента правильных).
// solved/{qid} — по одной записи на ЗАДАЧУ, пишется при любом ответе, верном
// или нет. Ребёнок решал — значит, задача засчитана как пройденная; счётчик
// «шешілген есеп» не должен стоять на нуле только потому, что он ошибся.
// Ключ = qid, поэтому повторное открытие той же задачи счётчик не надувает.
async function learningRequest(uid, body) {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) throw Object.assign(new Error('auth-required'), { code: 'learning/auth-required' });
  const token = await user.getIdToken();
  if (auth.currentUser?.uid !== uid) throw Object.assign(new Error('auth-required'), { code: 'learning/auth-required' });
  const response = await fetch('/api/learning', {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result !== 'object') {
    const reason = result?.error || 'temporarily-unavailable';
    throw Object.assign(new Error(reason), { code: `learning/${reason}` });
  }
  return result;
}

export function startLearningSession(uid, request, id = crypto.randomUUID()) {
  const body = request?.mode === 'curriculum'
    ? { mode: 'curriculum', topicKey: request.topicKey, level: request.level }
    : { mode: 'training', qid: request?.qid };
  return learningRequest(uid, { ...body, action: 'start', id });
}

export const getTrainingTopics = (uid) => learningRequest(uid, { action: 'topics' }).then((result) => result.topics || []);
export const getTrainingQuestions = (uid, { topicId = null, mixed = false, excludeIds = [], limit = 60 }) =>
  learningRequest(uid, { action: 'questions', topicId, mixed, excludeIds: [...excludeIds], limit })
    .then((result) => result.questions || []);

export async function saveAttempt(uid, a, attemptId = a?.sessionId) {
  if (!a?.sessionId || a.sessionId !== attemptId) throw Object.assign(new Error('session-required'), { code: 'learning/session-required' });
  // The browser cannot submit its own grade, XP, school/topic or elapsed time.
  return learningRequest(uid, { action: 'answer', id: attemptId, answer: a.answer });
}

const statsRef = (uid) => doc(db, 'results', uid, 'stats', 'summary');

export async function getXpSummary(uid) {
  const snap = await getDoc(statsRef(uid));
  return snap.exists() ? snap.data() : { xp: 0, studySecs: 0 };
}

export async function getDiagnosticStatus(uid) {
  const snap = await getDoc(statsRef(uid));
  const data = snap.exists() ? snap.data() : {};
  return { used: !!data.diagnosticMockUsed, at: data.diagnosticMockAt || null };
}

export async function addXp(uid, amount, reason = '') {
  throw Object.assign(new Error('XP is awarded only by verified server actions'), { code: 'learning/server-award-required' });
}

// ── Чтение ──
export async function getChildren(parentUid) {
  const snap = await getDocs(collection(db, 'families', parentUid, 'children'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
export async function getMocks(childUid) {
  // Отчёт использует последние попытки; не скачиваем бесконечно растущую
  // историю при каждом открытии кабинета родителя или нового пробника.
  const snap = await getDocs(query(collection(db, 'results', childUid, 'mocks'), orderBy('at', 'desc'), limit(50)));
  return snap.docs.map((d) => d.data());
}
export async function getAttempts(childUid) {
  // 500 последних ответов достаточно для текущей аналитики и ограничивает
  // стоимость/память одного чтения даже у давно активного ученика.
  const snap = await getDocs(query(collection(db, 'results', childUid, 'attempts'), orderBy('at', 'desc'), limit(500)));
  return snap.docs.map((d) => d.data());
}
export async function getSolved(childUid) {
  const snap = await getDocs(collection(db, 'results', childUid, 'solved'));
  return snap.docs.map((d) => d.data());
}

export async function getPlatformDiagnostics(childUid) {
  const snap = await getDocs(query(collection(db, 'results', childUid, 'diagnostics'), orderBy('at', 'desc'), limit(24)));
  return snap.docs.map((d) => d.data()).sort((a, b) => String(b.completedAt || '').localeCompare(String(a.completedAt || '')));
}

// Человеческие сообщения об ошибках
export function errText(e, lang = 'kk') {
  const c = (e && e.code) || '';
  if (lang === 'ru') {
    if (c.includes('email-already-in-use')) return 'Этот логин уже занят. Выберите другой.';
    if (c.includes('weak-password') || c.includes('invalid-child-pin')) return 'Пароль должен содержать минимум 6 символов.';
    if (c.includes('invalid-child')) return 'Укажите имя и логин ребёнка: 3–32 латинские буквы или цифры.';
    if (c.includes('family-missing')) return 'Профиль семьи не найден. Обратитесь в поддержку для восстановления.';
    if (c.includes('invalid-email')) return 'Проверьте адрес электронной почты.';
    if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Неверный логин или пароль.';
    if (c.includes('too-many-requests')) return 'Слишком много попыток. Повторите через несколько минут.';
    if (c.includes('network')) return 'Проверьте интернет-соединение и повторите.';
    if (c.includes('requires-recent-login')) return 'Для этого действия войдите в аккаунт заново.';
    if (c.includes('child-limit')) return 'В семье уже добавлен ребёнок.';
    if (c.includes('not-child-owner')) return 'Этот ребёнок не привязан к вашему аккаунту.';
    if (c.includes('admin/not-allowed') || c.includes('admin-denied')) return 'У этого аккаунта нет доступа к панели администратора.';
    if (c.includes('popup-closed')) return 'Окно входа закрыто. Попробуйте ещё раз.';
    if (c.includes('popup-blocked')) return 'Разрешите всплывающее окно для входа.';
    if (c.includes('provider-already-linked')) return 'Вход по паролю уже подключён.';
    if (c.includes('credential-already-in-use')) return 'Эта почта уже связана с другим аккаунтом.';
    return 'Не удалось выполнить действие. Повторите или обратитесь в поддержку.';
  }
  if (c.includes('child-limit')) return 'Отбасында бала аккаунты бар.';
  if (c.includes('invalid-child')) return 'Баланың аты мен логинін енгізіңіз: 3–32 латын әрпі немесе цифр.';
  if (c.includes('family-missing')) return 'Отбасы профилі табылмады. Қалпына келтіру үшін қолдау қызметіне жазыңыз.';
  if (c.includes('child-create-failed')) return 'Бала аккаунтын жасау мүмкін болмады. Қайта көріңіз.';
  if (c.includes('email-already-in-use')) return 'Бұл юзернейм бос емес — басқасын таңдаңыз';
  if (c.includes('weak-password')) return 'Пароль тым қысқа (кемінде 6 таңба)';
  if (c.includes('invalid-email')) return 'Юзернейм тек латын әрпі мен цифрдан тұруы керек';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) {
    return 'Қате логин немесе пароль. Google арқылы кіріп, кабинетте пароль қойыңыз.';
  }
  if (c.includes('provider-already-linked')) return 'Email+пароль қазірдің өзінде қосылған.';
  if (c.includes('credential-already-in-use')) return 'Бұл пошта басқа аккаунтқа байланған.';
  if (c.includes('requires-recent-login')) return 'Қауіпсіздік үшін қайта Google арқылы кіріңіз, содан кейін парольді өзгертіңіз.';
  if (c.includes('no-email')) return 'Пошта табылмады — Google аккаунтыңызда email болуы керек.';
  if (c.includes('too-many-requests')) return 'Тым көп әрекет. Біраз күтіңіз немесе парольді қалпына келтіріңіз.';
  if (c.includes('admin-denied')) return 'Бұл email әкімшілер тізімінде жоқ.';
  if (c.includes('admin-login-failed')) return 'Кіру мүмкін болмады. Кейінірек қайталап көріңіз.';
  if (c.includes('admin/not-allowed')) return 'Бұл аккаунтта әкімші панеліне қолжетімділік жоқ.';
  if (c.includes('admin/google-required')) return 'Рұқсат берілген әкімші Google аккаунты арқылы кіріңіз.';
  if (c.includes('admin/failed')) return 'Кіру мүмкін болмады. Қайта көріңіз.';
  if (c.includes('not-child-owner')) return 'Бұл бала аккаунты сіздің кабинетіңізге тіркелмеген.';
  if (c.includes('child-reset-failed')) return 'PIN өзгерту мүмкін болмады. Қайта көріңіз.';
  if (c.includes('permission-denied')) return 'Firestore ережелері жарияланбаған. Firebase Console → Firestore → Rules → Publish';
  if (c.includes('operation-not-allowed')) return 'Firebase-те Email/Password қосылмаған (Authentication → Sign-in method)';
  if (c.includes('unauthorized-domain')) return 'Домен рұқсат етілмеген (Firebase → Authorized domains)';
  if (c.includes('popup-blocked')) return 'Браузер терезені бөгеді — рұқсат етіңіз';
  if (c.includes('popup-closed')) return 'Терезе жабылды, қайта көріңіз';
  if (c.includes('network')) return 'Интернет байланысын тексеріңіз';
  return 'Қате: ' + (c || (e && e.message) || 'белгісіз');
}

// Ата-ана аккаунтының деректері (соның ішінде pro — төленген жазылым).
export async function getFamily(parentUid) {
  const snap = await getDoc(doc(db, 'families', parentUid));
  return snap.exists() ? snap.data() : null;
}

// Pro күйін баланың өзі оқи алатын индекске көшіреміз.
// Бұл ескі аккаунттарды ата-ана кірген кезде автоматты түзетеді.
export async function syncChildrenPro() { /* Compatibility: only the server writes entitlements now. */ }

// ── Тегін тариф шектеуі ──
// Баланың ата-анасында pro бар ма? (баланың құжатында parentUid сақталады)
export async function isPro(childUid) {
  const idx = await getDoc(doc(db, 'childIndex', childUid));
  const parentUid = idx.data()?.parentUid;
  if (!parentUid) return false;
  const family = await getDoc(doc(db, 'families', parentUid));
  return familyHasPro(family.data());
}

// Бүгін неше есеп шығарды (тегін тарифте күніне 5)
export async function todayCount(childUid) {
  return (await learningRequest(childUid, { action: 'count' })).count;
}
