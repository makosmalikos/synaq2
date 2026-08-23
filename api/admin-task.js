// Приём задачи из Admin Panel и запись в Firestore (bankTasks). Это НЕ Gemini
// и не какой-либо другой AI-парсинг: тему, школу, сложность, тип, условие,
// варианты, ответ и разбор администратор вводит вручную на фронте
// (frontend/src/Admin.jsx). Эта функция только:
//   1. проверяет Firebase ID token и что email — из allowlist ADMIN_EMAIL_1/2;
//   2. заново валидирует присланные данные на сервере (не доверяя клиенту);
//   3. пишет документ в bankTasks через Firebase Admin SDK.
//
// Firestore-правила запрещают клиенту писать в bankTasks напрямую — только
// через этот серверный путь. frontend/src/bank.js подмешивает bankTasks в POOL
// при загрузке приложения, так что задача появляется в Тренировке без передеплоя.

function getAdminApp() {
  if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) return null;
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'synaq-88779',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
      }),
    });
  }
  return true;
}

function getAdminAuth() {
  if (!getAdminApp()) return null;
  const { getAuth } = require('firebase-admin/auth');
  return getAuth();
}

function getAdminDb() {
  if (!getAdminApp()) return null;
  const { getFirestore } = require('firebase-admin/firestore');
  return getFirestore();
}

const norm = (s) => String(s || '').trim().toLowerCase();

function isAllowedEmail(email) {
  const allow = [process.env.ADMIN_EMAIL_1, process.env.ADMIN_EMAIL_2].filter(Boolean).map(norm);
  return allow.length > 0 && allow.includes(norm(email));
}

async function verifyAdmin(idToken) {
  if (!idToken) return null;
  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;
  const decoded = await adminAuth.verifyIdToken(idToken);
  if (!isAllowedEmail(decoded.email || '')) return null;
  return { uid: decoded.uid, email: decoded.email };
}

// Та же taxonomy, что и в frontend/src/Admin.jsx / data.js (topics) +
// bank.js (EXTRA_TOPICS). Держим отдельной копией: api/ (CommonJS, серверная
// сборка) и frontend/src (ESM, бандл клиента) собираются раздельно, общий
// импорт между ними в этом проекте не настроен. Список тем НЕ меняет taxonomy —
// это те же id, что уже существуют в банке.
const TOPIC_SCHOOLS = {
  eq: ['РФМШ', 'НИШ'],
  num: ['РФМШ', 'НИШ'],
  work: ['РФМШ', 'НИШ'],
  ratio: ['РФМШ', 'НИШ'],
  geo: ['РФМШ', 'НИШ'],
  frac: ['РФМШ', 'НИШ'],
  pct: ['РФМШ', 'НИШ'],
  sys: ['РФМШ', 'НИШ', 'БИЛ'],
  kolzar: ['НИШ'],
  seq: ['РФМШ', 'НИШ'],
  mtx: ['РФМШ', 'НИШ'],
  spat: ['РФМШ', 'НИШ'],
  comb: ['РФМШ', 'НИШ'],
  lang_kaz: ['НИШ'],
  lang_rus: ['НИШ'],
  lang_eng: ['НИШ'],
};
const DIFFICULTIES = [1, 2, 3, 4, 5];
const MAX_LEN = 4000;

// Возвращает код ошибки или null, если всё корректно.
function validateTask(body) {
  const { topic, school, difficulty, type, statement, options, answer, solution } = body;

  const allowedSchools = TOPIC_SCHOOLS[topic];
  if (!allowedSchools) return 'bad_topic';
  if (!allowedSchools.includes(school)) return 'bad_school';
  if (!DIFFICULTIES.includes(Number(difficulty))) return 'bad_difficulty';
  if (type !== 'open' && type !== 'mcq') return 'bad_type';
  if (!statement || typeof statement !== 'string' || !statement.trim() || statement.length > MAX_LEN) return 'bad_statement';
  if (!solution || typeof solution !== 'string' || !solution.trim() || solution.length > MAX_LEN) return 'bad_solution';

  if (type === 'mcq') {
    if (!Array.isArray(options) || options.length < 2) return 'bad_options';
    const cleaned = options.map((o) => String(o || '').trim()).filter(Boolean);
    if (cleaned.length < 2 || cleaned.length !== options.length) return 'bad_options';
    if (new Set(cleaned).size !== cleaned.length) return 'dup_options';
    if (!answer || !cleaned.includes(String(answer).trim())) return 'answer_not_in_options';
  } else if (!answer || typeof answer !== 'string' || !answer.trim()) {
    return 'bad_answer';
  }
  return null;
}

function buildId(topic) {
  const safeTopic = String(topic || 'task').replace(/[^a-z0-9_]/gi, '');
  const rand = Math.random().toString(36).slice(2, 8);
  return `admin_${safeTopic}_${Date.now().toString(36)}_${rand}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let admin;
    try {
      admin = await verifyAdmin(idToken);
    } catch (e) {
      console.error('admin-task verify', e.code || e.message);
      admin = null;
    }
    if (!admin) return res.status(403).json({ error: 'not_allowed' });

    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    if (!body || typeof body !== 'object') body = {};

    const reason = validateTask(body);
    if (reason) return res.status(400).json({ error: reason });

    const db = getAdminDb();
    if (!db) return res.status(500).json({ error: 'no_admin_credentials' });
    const { FieldValue } = require('firebase-admin/firestore');

    const isMcq = body.type === 'mcq';
    const task = {
      school: body.school,
      topic: body.topic,
      difficulty: Number(body.difficulty),
      type: body.type,
      statement: String(body.statement).trim(),
      options: isMcq ? body.options.map((o) => String(o).trim()).filter(Boolean) : null,
      answer: String(body.answer).trim(),
      solution: String(body.solution).trim(),
      image: null,
      source: 'admin',
      createdBy: admin.email,
      createdAt: FieldValue.serverTimestamp(),
    };

    // ID генерируется сервером (не приходит от клиента) и проверяется на
    // отсутствие коллизии в bankTasks — «нет конфликтов с существующим банком».
    let id = buildId(task.topic);
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await db.collection('bankTasks').doc(id).get();
      if (!existing.exists) break;
      id = buildId(task.topic);
    }

    await db.collection('bankTasks').doc(id).set(task);
    return res.status(200).json({ id });
  } catch (e) {
    console.error('admin-task', e.code || e.message);
    return res.status(500).json({ error: 'failed' });
  }
};
