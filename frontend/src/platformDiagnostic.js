export const PLATFORM_DIAGNOSTIC_VERSION = 2;

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

export function readDiagnosticProgress(uid) {
  try {
    const value = JSON.parse(localStorage.getItem(diagnosticProgressKey(uid)) || 'null');
    return value?.version === PLATFORM_DIAGNOSTIC_VERSION && value.screen === 'test'
      && value.grade >= 3 && value.grade <= 6
      && typeof value.attemptId === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value.attemptId)
      && Number.isInteger(value.index) && value.index >= 0 && value.index < 20
      && typeof value.answer === 'string' && value.answer.length <= 2000
      && typeof value.pendingStart === 'boolean'
      && (value.pendingAnswer === null || (Number.isInteger(value.pendingAnswer?.index)
        && value.pendingAnswer.index >= 0 && value.pendingAnswer.index < 20
        && typeof value.pendingAnswer.answer === 'string' && value.pendingAnswer.answer.length <= 2000)) ? value : null;
  } catch { return null; }
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
