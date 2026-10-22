const VERSION = 1;
const MAX_AGE = 7 * 86400000;
const key = (kind) => `synaq_public_${kind}_draft`;

export function questionRevision(questions) {
  const text = JSON.stringify(questions.map(({ id, statement, ru, kk, options, answer }) =>
    [id, statement, ru, kk, options, answer]));
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}

export function readPublicTestDraft(kind, getQuestions, storage, now = Date.now()) {
  try {
    const value = JSON.parse((storage || globalThis.localStorage).getItem(key(kind)) || 'null');
    if (!value || value.version !== VERSION || value.kind !== kind
      || !Number.isFinite(value.savedAt) || now - value.savedAt > MAX_AGE || value.savedAt > now + 60000
      || !Number.isInteger(value.grade) || value.grade < 3 || value.grade > 6
      || !['РФМШ', 'НИШ', 'БИЛ', ...(kind === 'quick' ? ['general'] : [])].includes(value.target)
      || (kind === 'mock' && (value.grade !== 6 || !Number.isFinite(value.deadline) || value.deadline <= 0))) return null;
    const questions = getQuestions(value);
    if (!questions?.length || value.revision !== questionRevision(questions)
      || !Number.isInteger(value.index) || value.index < 0 || value.index >= questions.length
      || !value.answers || typeof value.answers !== 'object' || Array.isArray(value.answers)) return null;
    const ids = new Set(questions.map(q => q.id));
    if (Object.entries(value.answers).some(([id, answer]) => !ids.has(id) || typeof answer !== 'string' || answer.length > 2000)) return null;
    return value;
  } catch { return null; }
}

export function savePublicTestDraft(kind, value, revision, storage, now = Date.now()) {
  try {
    (storage || globalThis.localStorage).setItem(key(kind), JSON.stringify({ ...value, version: VERSION, kind, revision, savedAt: now }));
    return true;
  } catch { return false; }
}

export function clearPublicTestDraft(kind, storage) {
  try { (storage || globalThis.localStorage).removeItem(key(kind)); } catch {}
}
