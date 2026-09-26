import { auth } from './firebase.js';

async function request(body) {
  const user = auth.currentUser, token = await user?.getIdToken?.();
  if (!user || !token) throw Object.assign(new Error('auth-required'), { code: 'diagnostic/auth-required' });
  const response = await fetch('/api/diagnostic-session', {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== 'object') {
    const reason = data?.error || 'temporarily-unavailable';
    throw Object.assign(new Error(reason), { code: `diagnostic/${reason}`, status: response.status });
  }
  return data;
}

export const diagnosticStart = (id, grade) => request({ action: 'start', id, grade });
export const diagnosticResume = (id) => request({ action: 'resume', id });
export const diagnosticAnswer = (id, index, answer) => request({ action: 'answer', id, index, answer });
