import { authenticatedRequest } from './authenticatedRequest.js';

const LANG_SUBJECTS = ['rus', 'eng', 'kaz'];
const cache = new Map();
const CACHE_LIMIT = 256;
const keyFor = (question, lang) => JSON.stringify([question.id, question.statement, question.solution || '', lang]);
const translatable = (question) => !LANG_SUBJECTS.includes(question.subject);

export async function translateQuestions(list, lang, { loadAuth = () => import('./firebase.js'), fetcher = fetch, timeoutMs = 15000 } = {}) {
  if (!list?.length) return list;
  const need = list.filter((question) => translatable(question) && question.lang && question.lang !== lang
    && !cache.has(keyFor(question, lang)));
  if (need.length) {
    try {
      const { auth } = await loadAuth();
      for (let index = 0; index < need.length; index += 30) {
        const batch = need.slice(index, index + 30);
        const data = await authenticatedRequest(auth, '/api/explain', { fetcher, timeoutMs,
          body: { mode: 'translate', lang,
            items: batch.map((question) => ({ id: question.id, statement: question.statement, solution: question.solution || '' })) },
        });
        for (const question of batch) {
          const value = data?.[question.id];
          if (value && typeof value.statement === 'string' && value.statement.trim()) {
            cache.set(keyFor(question, lang), { statement: value.statement, solution: typeof value.solution === 'string' ? value.solution : '' });
            while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
          }
        }
      }
    } catch (error) {
      console.warn('перевод не удался — показываем оригинал', error);
    }
  }
  return list.map((question) => {
    if (!translatable(question) || !question.lang || question.lang === lang) return question;
    const translated = cache.get(keyFor(question, lang));
    return translated ? { ...question, statement: translated.statement || question.statement,
      solution: translated.solution || question.solution } : { ...question, needsTranslation: true };
  });
}
