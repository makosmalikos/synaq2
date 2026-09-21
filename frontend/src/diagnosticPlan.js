export const PUBLIC_DIAGNOSTIC_KEY = 'synaq_public_diagnostic';

// Темы короткой диагностики шире тем экзаменационного банка. Здесь каждая
// школьная тема ведёт в ближайший подходящий раздел тренажёра.
export const DIAGNOSTIC_TO_TRAINING = {
  place: 'num',
  calc: 'frac',
  mult: 'frac',
  fractions: 'frac',
  decimals: 'frac',
  percent: 'pct',
  geometry: 'geo',
  applied: 'geo',
  problems: 'ratio',
  ratio: 'ratio',
  algebra: 'eq',
  rational: 'num',
};

export function createPublicDiagnosticResult({ grade, target, report }) {
  return {
    version: 1,
    grade,
    target,
    readiness: report.pct,
    correct: report.correct,
    total: report.topics.reduce((sum, item) => sum + item.total, 0),
    completedAt: new Date().toISOString(),
    topics: report.topics.map((item) => ({
      id: item.id,
      pct: item.pct,
      correct: item.correct,
      total: item.total,
      trainingTopicId: DIAGNOSTIC_TO_TRAINING[item.id] || 'num',
    })),
  };
}

export function savePublicDiagnosticResult(result) {
  try { localStorage.setItem(PUBLIC_DIAGNOSTIC_KEY, JSON.stringify(result)); } catch {}
  return result;
}

export function readPublicDiagnosticResult() {
  try {
    const value = JSON.parse(localStorage.getItem(PUBLIC_DIAGNOSTIC_KEY) || 'null');
    if (!value || value.version !== 1 || !Array.isArray(value.topics)) return null;
    return value;
  } catch {
    return null;
  }
}
