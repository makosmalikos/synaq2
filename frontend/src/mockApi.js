import { auth } from './firebase.js';

async function request(body) {
  const token = await auth.currentUser?.getIdToken?.();
  if (!token) throw new Error('auth-required');
  const response = await fetch('/api/mock-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || `mock_${response.status}`), { status: response.status });
  return data;
}

export const mockCatalog = () => request({ action: 'catalog' }).then((data) => data.schools || []);
export const mockStart = ({ id, school, excludeQuestionIds = [] }) => request({ action: 'start', id, school, excludeQuestionIds });
export const mockResume = (id) => request({ action: 'resume', id });
export const mockSubmit = (id, answers) => request({ action: 'submit', id, answers }).then((data) => data.result);
export const reviewQuestionIds = (review = []) => [...new Set(review.map((item) => item?.qid).filter(Boolean))];
