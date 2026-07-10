// Клиент к API. Один домен: фронт и бэкенд вместе, поэтому базовый путь пустой (/api/...).
const j = (r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); };

export const api = {
  topics:        (school)         => fetch(`/api/training/topics?school=${school||''}`).then(j),
  topicQuestions:(id, mix = true, school) => fetch(`/api/training/topics/${id}/questions?mix=${mix ? 1 : ''}&school=${school||''}`).then(j),
  mixed:         (limit = 15)     => fetch(`/api/training/mixed?limit=${limit}`).then(j),
  generate:      (n = 5, topic)   => fetch(`/api/training/generate?n=${n}${topic ? '&topic=' + topic : ''}`).then(j),
  mockList:      ()               => fetch('/api/mock').then(j),
  mockWeekly:    (school)         => fetch(`/api/mock/weekly?school=${school||''}`).then(j),
  mockGet:       (id)             => fetch(`/api/mock/${id}`).then(j),
  mockSubmit:    (id, answers)    => fetch(`/api/mock/${id}/submit`, {
                                       method: 'POST',
                                       headers: { 'Content-Type': 'application/json' },
                                       body: JSON.stringify({ answers }),
                                     }).then(j),
};
