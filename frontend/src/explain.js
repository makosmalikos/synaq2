// Клиент разбора. Общим доверенным кэшем управляет только сервер;
// здесь хранится лишь кэш текущей сессии, привязанный к содержимому задачи.
//
// Персональный разбор («ты ответил 12 — вот где ошибся») не кэшируем:
// он завязан на конкретный неверный ответ.
import { auth } from './firebase.js';

const memory = new Map();   // в пределах сессии — вообще без похода в сеть

export async function explain(q, { given = null, lang = 'kk' } = {}) {
  const personal = given != null && String(given).trim() !== '';
  const key = JSON.stringify([q.id, q.statement, q.answer, q.solution, !!q.image, lang]);

  if (!personal) {
    if (memory.has(key)) return memory.get(key);
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
  }
  return text;
}

export async function askTutor(q, { action = 'question', message, history = [], given = null, allowAnswer = false, lang = 'kk' } = {}) {
  const token = await auth.currentUser?.getIdToken(true).catch(() => null);
  if (!token) throw new Error('unauthorized');
  const response = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      mode: 'tutor', action, message, history: history.slice(-6), lang,
      statement: q.statement, answer: allowAnswer ? q.answer ?? null : null,
      solution: allowAnswer ? q.solution || '' : '', given: allowAnswer ? given : null,
      hasImage: !!q.image, allowAnswer,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.text !== 'string' || !data.text.trim()) throw new Error(data.error || 'failed');
  return data.text.trim();
}

export function explainError(msg, lang = 'kk') {
  const ru = lang === 'ru';
  if (msg === 'rate_limit') return ru ? 'Лимит AI на сегодня закончился.' : 'Бүгінгі AI лимиті аяқталды.';
  if (msg === 'service_daily_limit') return ru
    ? 'Общий лимит AI на сегодня достигнут. Попробуйте завтра.'
    : 'AI қызметінің бүгінгі жалпы лимиті аяқталды. Ертең қайталап көріңіз.';
  if (msg === 'no_api_key') return ru
    ? 'GEMINI_API_KEY не настроен в Vercel (Settings → Environment Variables).'
    : 'GEMINI_API_KEY Vercel-де қосылмаған (Settings → Environment Variables).';
  if (msg === 'unauthorized') return ru ? 'Войдите заново: возможно, сессия завершилась.' : 'Қайта кіріп көріңіз (сессия аяқталған болуы мүмкін).';
  if (msg === 'upstream') return ru ? 'Gemini не ответил. Попробуйте позже.' : 'Gemini жауап бермеді. Кейін қайталаңыз.';
  if (msg === 'empty') return ru ? 'Gemini вернул пустой ответ. Попробуйте ещё раз.' : 'Gemini бос жауап қайтарды. Қайта көріңіз.';
  if (msg === 'failed') return ru ? 'Ошибка сервера. Повторите через минуту.' : 'Сервер қатесі. Бір минуттан кейін қайталаңыз.';
  if (msg === 'bad_statement') return ru ? 'Для этой задачи объяснение недоступно.' : 'Бұл есеп үшін түсіндірме қолжетімсіз.';
  return ru ? 'Не удалось получить объяснение. Попробуйте ещё раз.' : 'Түсіндірмені алу мүмкін болмады. Қайталап көріңіз.';
}
