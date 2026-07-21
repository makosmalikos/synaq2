// Разбор задачи через Google Gemini (Flash). Vercel-функция, не фронт.
//
// Vercel → Environment Variables:
//   GEMINI_API_KEY = ... (aistudio.google.com)
//   FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL + FIREBASE_PROJECT_ID (как в webhook)
//   (опционально) GEMINI_MODEL, FIREBASE_WEB_KEY

const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
].filter(Boolean);

const FIREBASE_WEB_KEY = process.env.FIREBASE_WEB_KEY || 'AIzaSyATdVvMsNkN0F66XipkShtFe0wKizu2r6o';

function getAdminAuth() {
  if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) return null;
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'synaq-88779',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
      }),
    });
  }
  return getAuth();
}

async function verifyUser(idToken) {
  if (!idToken) return null;
  try {
    const auth = getAdminAuth();
    if (auth) {
      const decoded = await auth.verifyIdToken(idToken);
      return decoded.uid;
    }
  } catch (e) {
    console.error('admin verify', e.code || e.message);
  }
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('lookup failed', r.status, detail.slice(0, 200));
    }
    if (!r.ok) return null;
    const data = await r.json();
    return data.users?.[0]?.localId || null;
  } catch (e) {
    console.error('lookup error', e.message);
    return null;
  }
}

function getAdminDb() {
  if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) return null;
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'synaq-88779',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

const EXPLAIN_DAILY_LIMIT = Number(process.env.EXPLAIN_DAILY_LIMIT || 40);

async function checkExplainRate(uid) {
  const db = getAdminDb();
  if (!db) return;
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.collection('rateLimits').doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? snap.data() : { day, explain: 0 };
    const count = cur.day === day ? (cur.explain || 0) : 0;
    if (count >= EXPLAIN_DAILY_LIMIT) {
      const err = new Error('rate_limit');
      err.limit = EXPLAIN_DAILY_LIMIT;
      throw err;
    }
    tx.set(ref, { day, explain: count + 1, updatedAt: new Date() }, { merge: true });
  });
}

async function callGeminiOnce(key, model, { system, user, maxTokens }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
    }),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    const err = new Error('gemini_upstream');
    err.status = r.status;
    err.detail = detail.slice(0, 400);
    throw err;
  }
  const data = await r.json();
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts || [])
    .map((p) => p.text || '')
    .join('')
    .trim();
  if (!text) {
    const reason = cand?.finishReason || data.promptFeedback?.blockReason || 'no_text';
    const err = new Error('empty');
    err.reason = reason;
    throw err;
  }
  return { text, model };
}

async function callGemini(key, payload) {
  let lastErr;
  for (const model of MODELS) {
    try {
      return await callGeminiOnce(key, model, payload);
    } catch (e) {
      lastErr = e;
      console.error('gemini try', model, e.status || e.reason || e.message);
      if (e.message === 'empty') continue;
      if (e.status === 404 || e.status === 400) continue;
      throw e;
    }
  }
  throw lastErr || new Error('empty');
}

function buildPrompt({ statement, answer, hint, hasImage, given, lang }) {
  const kk = lang !== 'ru';
  const langLine = kk
    ? 'Пиши ТОЛЬКО на казахском языке.'
    : 'Пиши ТОЛЬКО на русском языке.';

  const rules = [
    langLine,
    'Читатель — ребёнок 11–13 лет, готовится в РФМШ / НИШ / БИЛ. Он умный, но многого ещё не проходил.',
    '',
    'Как объяснять:',
    '— Пронумерованными шагами. В каждом шаге сначала ЗАЧЕМ мы это делаем, потом само действие.',
    '— Короткие предложения. Живой человеческий язык.',
    '— Не пиши «очевидно», «легко видеть», «понятно, что».',
    '— 120–200 слов. Обычный текст, без markdown и заголовков.',
    '',
    `Правильный ответ известен: «${answer}». Твой разбор обязан привести именно к нему.`,
  ];

  if (hint) rules.push(`Черновая подсказка: ${hint}`);
  if (hasImage) rules.push('К задаче есть рисунок — ты его не видишь. Объясни метод без чисел с рисунка.');

  let task = `Задача:\n${statement}`;
  if (given) {
    task += `\n\nРебёнок ответил «${given}» — это неверно. В конце коротко: где, скорее всего, ошибка.`;
  }
  const last = kk ? 'Соңында: Жауабы: <ответ>' : 'В конце: Ответ: <ответ>';
  rules.push(last);

  return { system: rules.join('\n'), user: task };
}

const TRANSLATE_SYSTEM = (lang) => [
  lang === 'kk'
    ? 'Переведи школьные задачи по математике и логике на КАЗАХСКИЙ язык.'
    : 'Переведи школьные задачи по математике и логике на РУССКИЙ язык.',
  '',
  'Числа и формулы не меняй. Только перевод.',
  'Ответь ТОЛЬКО валидным JSON {"id": {"statement": "...", "solution": "..."}}, без markdown.',
].join('\n');

async function handleTranslate(res, key, body) {
  const { items = [], lang = 'kk' } = body;
  if (!items.length) return res.status(200).json({});

  try {
    const payload = {};
    for (const it of items.slice(0, 30)) {
      payload[it.id] = { statement: it.statement, solution: it.solution || '' };
    }
    const { text } = await callGemini(key, {
      system: TRANSLATE_SYSTEM(lang),
      user: JSON.stringify(payload),
      maxTokens: 4000,
    });
    const clean = text.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (e) {
    console.error('translate failed', e.status || e.reason || e.message);
    return res.status(500).json({ error: 'failed' });
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'no_api_key' });

  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const uid = await verifyUser(idToken);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });

    try {
      await checkExplainRate(uid);
    } catch (e) {
      if (e.message === 'rate_limit') {
        return res.status(429).json({ error: 'rate_limit', limit: e.limit || EXPLAIN_DAILY_LIMIT });
      }
      throw e;
    }

    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    if (!body || typeof body !== 'object') body = {};

    if (body.mode === 'translate') return handleTranslate(res, key, body);

    const { statement, answer, hint = '', hasImage = false, given = null, lang = 'kk' } = body;
    if (!statement || String(statement).length > 4000) {
      return res.status(400).json({ error: 'bad_statement' });
    }
    if (answer == null || String(answer).trim() === '') {
      return res.status(400).json({ error: 'bad_statement' });
    }

    const prompt = buildPrompt({ statement, answer, hint, hasImage, given, lang });
    const { text, model } = await callGemini(key, { ...prompt, maxTokens: 900 });
    return res.status(200).json({ text, model });
  } catch (e) {
    console.error('explain handler', e.status || e.reason || e.message, e.detail || '');
    if (e.message === 'empty') return res.status(502).json({ error: 'empty', reason: e.reason || null });
    if (e.message === 'gemini_upstream') {
      return res.status(502).json({ error: 'upstream', status: e.status || 500 });
    }
    return res.status(500).json({ error: 'failed' });
  }
};
