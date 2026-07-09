// Клиент к бэкенду Synaq (Express). В деве проксируется Vite на localhost:4000.
const base = '/api';
async function j(url, opts) {
  const r = await fetch(base + url, {
    headers: { 'content-type': 'application/json' },
    ...opts,
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
  return r.json();
}

export const api = {
  topics: () => j('/training/topics'),
  topicQuestions: (id, limit = 8) => j(`/training/topics/${id}/questions?mix=1&limit=${limit}`),
  mixed: (limit = 8) => j(`/training/mixed?limit=${limit}`),
  checkTraining: (id, answer) =>
    j('/training/check', { method: 'POST', body: JSON.stringify({ id, answer }) }),
  mockList: () => j('/mock'),
  mock: (id) => j(`/mock/${id}`),
  submitMock: (id, answers) =>
    j(`/mock/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
};
