export const PLATFORM_DIAGNOSTIC_VERSION = 2;

// A response may advance the server past a pending answer (including a retry).
export function restoredDiagnosticAnswer(session, draft) {
  if (!draft || draft.attemptId !== session.id) return '';
  if (draft.pendingAnswer?.index === session.index) return draft.pendingAnswer.answer;
  return draft.index === session.index ? draft.answer || '' : '';
}

const KIND_RULES = [
  [/percent|pct/i, 'pct'],
  [/fraction|decimal|mixed/i, 'frac'],
  [/perimeter|area|geometry|angle|circle|coordinate|symmetry|volume/i, 'geo'],
  [/equation|algebra|linear|inequal|system/i, 'eq'],
  [/ratio|proportion|dependency|scale|motion|work|word|money/i, 'ratio'],
  [/probability|combinator|average|statistic|data/i, 'comb'],
  [/order|place|round|divisib|gcd|integer|addsub|multip|division|mental|column|big|remainder/i, 'num'],
];

export function trainingTopicForKind(kind = '') {
  return KIND_RULES.find(([pattern]) => pattern.test(kind))?.[1] || 'num';
}

export function diagnosticStorageKey(uid) {
  return `synaq_platform_diagnostic_${uid || 'guest'}`;
}

export function diagnosticProgressKey(uid) {
  return `synaq_platform_diagnostic_progress_${uid || 'guest'}`;
}

export function readStoredDiagnostic(uid) {
  try {
    const value = JSON.parse(localStorage.getItem(diagnosticStorageKey(uid)) || 'null');
    return value?.version === PLATFORM_DIAGNOSTIC_VERSION && Array.isArray(value.topics) ? value : null;
  } catch { return null; }
}

const tabDrafts = new Map();
function validDiagnosticProgress(value) {
  return value?.version === PLATFORM_DIAGNOSTIC_VERSION && value.screen === 'test'
      && Number.isInteger(value.grade) && value.grade >= 3 && value.grade <= 6
      && typeof value.attemptId === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value.attemptId)
      && Number.isInteger(value.index) && value.index >= 0 && value.index < 20
      && typeof value.answer === 'string' && value.answer.length <= 2000
      && typeof value.pendingStart === 'boolean'
      && (value.pendingAnswer === null || (Number.isInteger(value.pendingAnswer?.index)
        && value.pendingAnswer.index >= 0 && value.pendingAnswer.index < 20
        && typeof value.pendingAnswer.answer === 'string' && value.pendingAnswer.answer.length <= 2000));
}

// Each tab owns its active draft. The shared backup is consulted only when
// this tab has no draft, so opening a new diagnostic cannot overwrite another.
// Keeping the backup also preserves recovery after closing the original tab.
export function readDiagnosticProgress(uid, tabStorage, backupStorage) {
  const key = diagnosticProgressKey(uid);
  try {
    const raw = (tabStorage || globalThis.sessionStorage)?.getItem(key);
    if (raw) { const value = JSON.parse(raw); return validDiagnosticProgress(value) ? value : null; }
  } catch { /* Continue with this tab's memory or its durable backup. */ }
  if (tabDrafts.has(key)) return tabDrafts.get(key);
  try {
    const value = JSON.parse((backupStorage || globalThis.localStorage)?.getItem(key) || 'null');
    if (!validDiagnosticProgress(value)) return null;
    writeDiagnosticProgress(uid, value, tabStorage, backupStorage);
    return value;
  } catch { return null; }
}

export function writeDiagnosticProgress(uid, value, tabStorage, backupStorage) {
  if (!validDiagnosticProgress(value)) return false;
  const key = diagnosticProgressKey(uid), raw = JSON.stringify(value);
  tabDrafts.set(key, value);
  let durable = false;
  try { const target = tabStorage || globalThis.sessionStorage; if (target) { target.setItem(key, raw); durable = true; } } catch { /* Warn before leaving this page. */ }
  try { (backupStorage || globalThis.localStorage)?.setItem(key, raw); } catch { /* The tab copy still survives reload. */ }
  return durable;
}

export function clearDiagnosticProgress(uid, attemptId, storage) {
  const key = diagnosticProgressKey(uid);
  if (tabDrafts.get(key)?.attemptId === attemptId) tabDrafts.delete(key);
  const clear = target => {
    const value = JSON.parse(target?.getItem(key) || 'null');
    if (value?.attemptId === attemptId) target.removeItem(key);
  };
  if (storage) { try { clear(storage); } catch { /* Retain unreadable drafts. */ } return; }
  try { clear(globalThis.sessionStorage); } catch { /* Retain unreadable drafts. */ }
  try { clear(globalThis.localStorage); } catch { /* Another tab may own the backup. */ }
}

export function daysUntilDiagnostic(completedAt, interval = 7) {
  const completed = Date.parse(completedAt || '');
  if (!Number.isFinite(completed)) return 0;
  const due = completed + interval * 86400000;
  return Math.max(0, Math.ceil((due - Date.now()) / 86400000));
}

export function buildDiagnosticShareText(result, childName = '', lang = 'kk') {
  if (!result) return '';
  const ru = lang === 'ru';
  const weak = (result.topics || []).filter((topic) => topic.level !== 'strong').slice(0, 3);
  const names = weak.map((topic) => topic.title?.[ru ? 'ru' : 'kk']).filter(Boolean).join(', ');
  return ru
    ? `SYNAQ · Диагностика${childName ? ` — ${childName}` : ''}\nГотовность: ${result.readiness}%\nПравильных ответов: ${result.correct}/${result.total}\n${names ? `Нужно подтянуть: ${names}\n` : ''}Следующая проверка — через 7 дней.`
    : `SYNAQ · Диагностика${childName ? ` — ${childName}` : ''}\nДайындық: ${result.readiness}%\nДұрыс жауап: ${result.correct}/${result.total}\n${names ? `Күшейту керек: ${names}\n` : ''}Келесі тексеру — 7 күннен кейін.`;
}
