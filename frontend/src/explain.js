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

  const token = await auth.currentUser?.getIdToken().catch(() => null);
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
  if (msg === 'no_api_key')     return 'ANTHROPIC_API_KEY Vercel-де қосылмаған.';
  if (msg === 'unauthorized')   return 'Қайта кіріп көріңіз.';
  if (msg === 'upstream')       return 'Түсіндірме сервисі жауап бермеді. Сәл кейін қайталаңыз.';
  return 'Түсіндірмені алу мүмкін болмады. Қайталап көріңіз.';
}
