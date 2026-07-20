// Клиент разбора. Кэш общий: задача объясняется ОДИН раз на всех детей,
// потом отдаётся из Firestore мгновенно и бесплатно. Иначе каждый ребёнок
// на каждой задаче жёг бы отдельный запрос к модели.
//
// Персональный разбор («ты ответил 12 — вот где ошибся») не кэшируем:
// он завязан на конкретный неверный ответ.
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';

const memory = new Map();   // в пределах сессии — вообще без похода в сеть

export async function explain(q, { given = null, lang = 'kk' } = {}) {
  const personal = given != null && String(given).trim() !== '';
  const key = `${q.id}_${lang}`;

  if (!personal) {
    if (memory.has(key)) return memory.get(key);
    try {
      const snap = await getDoc(doc(db, 'explanations', key));
      const text = snap.exists() ? snap.data().text : null;
      if (text) { memory.set(key, text); return text; }
    } catch { /* правила не опубликованы — просто идём в модель */ }
  }

  const token = await auth.currentUser?.getIdToken(true).catch(() => null);
  if (!token) throw new Error('unauthorized');
  const res = await fetch('/api/explain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      statement: q.statement,
      answer: q.answer,
      hint: q.solution || '',
      hasImage: !!q.image,
      given: personal ? given : null,
      lang,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || 'failed');
  }
  const { text } = await res.json();

  if (!personal && text) {
    memory.set(key, text);
    // create-only: готовый разбор больше не перезаписывается
    setDoc(doc(db, 'explanations', key), {
      text, lang, qid: q.id, at: serverTimestamp(),
    }).catch(() => {});
  }
  return text;
}

export function explainError(msg) {
  if (msg === 'no_api_key')     return 'GEMINI_API_KEY Vercel-де қосылмаған (Settings → Environment Variables).';
  if (msg === 'unauthorized')   return 'Қайта кіріп көріңіз (сессия аяқталған болуы мүмкін).';
  if (msg === 'upstream')       return 'Gemini жауап бермеді. API кілтін тексеріңіз немесе кейін қайталаңыз.';
  if (msg === 'empty')          return 'Gemini бос жауап қайтарды. Қайта көріңіз.';
  if (msg === 'failed')         return 'Сервер қатесі. Бір минуттан кейін қайталаңыз.';
  if (msg === 'bad_statement')  return 'Бұл есеп үшін түсіндірме қолжетімсіз.';
  return 'Түсіндірмені алу мүмкін болмады. Қайталап көріңіз.';
}
