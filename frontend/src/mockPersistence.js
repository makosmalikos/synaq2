const VERSION = 1;
const keyFor = (uid) => `synaq_mock_pending_v${VERSION}_${uid}`;
const startKeyFor = (uid) => `synaq_mock_start_v${VERSION}_${uid}`;
const finite = (value) => Number.isFinite(value) && value >= 0;

// Only the current tab's exam is restored. In particular, a different child's
// answers must never appear when a shared device changes accounts.
export function readMockSession(uid, storage) {
  try {
    const raw = (storage || globalThis.sessionStorage).getItem(keyFor(uid));
    if (!raw) return { record: null, error: null };
    const value = JSON.parse(raw);
    if (!value || value.version !== VERSION || value.uid !== uid
      || typeof value.id !== 'string' || !value.id || value.id.length > 128
      || !value.test || typeof value.test.id !== 'string'
      || !Array.isArray(value.test.questions) || !value.test.questions.length
      || value.test.questions.length > 120
      || value.test.questions.some((question, index) => !question || typeof question.id !== 'string'
        || !question.id || question.num !== index + 1 || ![1, 2].includes(question.section)
        || typeof question.statement !== 'string')
      || !['РФМШ', 'НИШ', 'БИЛ'].includes(value.school)
      || value.test.school !== value.school
      || value.meta?.school !== value.school
      || !value.answers || typeof value.answers !== 'object' || Array.isArray(value.answers)
      || Object.values(value.answers).some((answer) => typeof answer !== 'string' || answer.length > 2000)
      || !value.flags || typeof value.flags !== 'object' || Array.isArray(value.flags)
      || Object.values(value.flags).some((flag) => typeof flag !== 'boolean')
      || !Number.isInteger(value.index) || value.index < 0 || value.index >= value.test.questions.length
      || !finite(value.startedAt) || !finite(value.deadline) || value.deadline < value.startedAt
      || !finite(value.pausedMs) || (value.pausedAt !== null && !finite(value.pausedAt))
      || typeof value.isDiagnosticRun !== 'boolean'
      || (value.pending && (value.pending.uid !== uid || value.pending.id !== value.id
        || !value.pending.payload || !value.result))
      || (value.result && (!Array.isArray(value.result.review) || value.result.review.length > 120
        || value.result.review.some((item) => !item || typeof item !== 'object')))) {
      return { record: null, error: 'invalid' };
    }
    return { record: value, error: null };
  } catch (error) {
    return { record: null, error: error instanceof SyntaxError ? 'invalid' : 'unavailable' };
  }
}

export function writeMockSession(record, storage) {
  try {
    (storage || globalThis.sessionStorage).setItem(keyFor(record.uid), JSON.stringify({ ...record, version: VERSION }));
    return true;
  } catch { return false; }
}

export function clearMockSession(uid, id, storage) {
  try {
    const target = storage || globalThis.sessionStorage;
    const current = readMockSession(uid, target);
    if (current.error) return false;
    // A late acknowledgement from a previous screen must not remove a new run.
    if (current.record?.id === id) target.removeItem(keyFor(uid));
    return true;
  } catch { return false; }
}

export function discardMockSession(uid, storage) {
  try {
    (storage || globalThis.sessionStorage).removeItem(keyFor(uid));
    return true;
  } catch { return false; }
}

export function readMockStart(uid, storage) {
  try {
    const value = JSON.parse((storage || globalThis.sessionStorage).getItem(startKeyFor(uid)) || 'null');
    return value?.uid === uid && typeof value.id === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value.id)
      && ['РФМШ', 'НИШ', 'БИЛ'].includes(value.school) ? value : null;
  } catch { return null; }
}

export function writeMockStart(value, storage) {
  try {
    (storage || globalThis.sessionStorage).setItem(startKeyFor(value.uid), JSON.stringify(value));
    return true;
  } catch { return false; }
}

export function clearMockStart(uid, id, storage) {
  try {
    const target = storage || globalThis.sessionStorage, current = readMockStart(uid, target);
    if (current?.id === id) target.removeItem(startKeyFor(uid));
    return true;
  } catch { return false; }
}

export function mockRemaining(record, now = Date.now()) {
  return Math.max(0, Math.ceil((record.deadline - (record.pausedAt ?? now)) / 1000));
}

export function mockSpent(record, now = Date.now()) {
  // Returning to an expired tab hours later must not credit hours of study.
  const until = Math.min(now, record.deadline, record.pausedAt ?? Infinity);
  return Math.max(0, Math.round((until - record.startedAt - record.pausedMs) / 1000));
}
