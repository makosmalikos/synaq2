const VERSION = 2;
const keyFor = (uid, version = VERSION) => `synaq_training_pending_v${version}_${uid}`;

export function trainingDayKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function trainingQuestion(question) {
  const { answer: _answer, solution: _solution, ...publicQuestion } = question || {};
  return publicQuestion;
}

// Per-tab storage survives refresh and navigation without mixing different
// children's records or concurrent browser tabs. No credentials are stored.
export function readPendingTraining(uid, storage) {
  try {
    const target = storage || globalThis.sessionStorage;
    const value = JSON.parse(target.getItem(keyFor(uid)) || target.getItem(keyFor(uid, 1)) || 'null');
    if (!value || ![1, VERSION].includes(value.version) || value.uid !== uid
      || typeof value.id !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(value.id)
      || typeof value.answer !== 'string' || !value.answer.trim() || value.answer.length > 2000 || !value.question
      || typeof value.question.id !== 'string' || !value.question.id || value.question.id.length > 200 || value.question.id.includes('/')) return null;
    if (value.version === 1) {
      if (value.question.id !== value.payload?.qid || typeof value.payload.correct !== 'boolean'
        || !Number.isFinite(value.payload.secs) || value.payload.secs < 0) return null;
      // Retain the answer, never its old client-reported correctness/time.
      return { uid, id: value.id, question: trainingQuestion(value.question), answer: value.answer, topic: value.topic, legacy: true };
    }
    if (typeof value.sessionId !== 'string' || value.sessionId !== value.id
      || value.payload?.sessionId !== value.sessionId || value.payload.answer !== value.answer) return null;
    return { ...value, question: trainingQuestion(value.question) };
  } catch { return null; }
}

export function writePendingTraining(record, storage) {
  try {
    const target = storage || globalThis.sessionStorage;
    target.setItem(keyFor(record.uid), JSON.stringify({ ...record, question: trainingQuestion(record.question), version: VERSION }));
    target.removeItem(keyFor(record.uid, 1));
    return true;
  } catch { return false; }
}

export function clearPendingTraining(uid, id, storage) {
  try {
    const target = storage || globalThis.sessionStorage;
    // A late acknowledgement must not delete a newer pending answer.
    for (const version of [VERSION, 1]) {
      const value = JSON.parse(target.getItem(keyFor(uid, version)) || 'null');
      if (value?.uid === uid && value.id === id) target.removeItem(keyFor(uid, version));
    }
    return true;
  } catch { return false; }
}
