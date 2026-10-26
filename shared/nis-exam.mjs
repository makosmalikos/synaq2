// Absolute deadlines are shared by the server and the anonymous training player.
export const NIS_FORMAT = 'nis-sections-2026-v1';
export const NIS_PHASES = Object.freeze([
  { subject: 'math', day: 1, first: 1, last: 40, minutes: 60 },
  { subject: 'kolzar', day: 1, first: 41, last: 100, minutes: 30 },
  { subject: 'science', day: 1, first: 101, last: 120, minutes: 30 },
  { subject: 'languages', day: 2, first: 121, last: 180, minutes: 120 },
]);
const fail = message => { throw Object.assign(new Error(message), {status: 409}); };
export const isNis = session => session?.examFormat === NIS_FORMAT;
export function startNis(now) {
  return { phase: 0, deadline: now + 3600000, waiting: false, ready: false, revision: 0, answers: {}, elapsedSec: 0, phaseStartedAt: now };
}
function closePhase(state, now) {
  const p = NIS_PHASES[state.phase];
  const ended = Math.min(now, state.deadline);
  const next = { ...state, phase: state.phase + 1, revision: 0,
    elapsedSec: state.elapsedSec + Math.max(0, Math.floor((ended - state.phaseStartedAt) / 1000)), phaseStartedAt: ended };
  if (next.phase === 3) return { ...next, waiting: true, deadline: null };
  if (next.phase === 4) return { ...next, ready: true, deadline: null };
  return { ...next, deadline: ended + NIS_PHASES[next.phase].minutes * 60000 };
}
export function reconcileNis(state, now) {
  let next = { ...state, answers: { ...state.answers } };
  while (!next.waiting && !next.ready && now >= next.deadline) next = closePhase(next, next.deadline);
  return next;
}
export function updateNis(previous, action, now) {
  let state = reconcileNis(previous, now);
  if (action.op === 'begin-day2') {
    if (state.ready || state.phase === 3 && !state.waiting) return state; // replay never resets time
    if (!state.waiting || state.phase !== 3) fail('phase-not-ready');
    return { ...state, waiting: false, phaseStartedAt: now, deadline: now + 7200000 };
  }
  if (!['save', 'advance'].includes(action.op)) fail('bad-phase-action');
  if (action.phase < state.phase) return state; // expired/replayed request cannot modify a closed block
  if (action.phase !== state.phase || state.waiting || state.ready) fail('phase-not-active');
  const p = NIS_PHASES[state.phase];
  if (!Number.isSafeInteger(action.revision) || action.revision < 0 || !action.answers || Array.isArray(action.answers)
    || typeof action.answers !== 'object' || Object.keys(action.answers).length > 60) fail('bad-phase-answers');
  for (const [key, value] of Object.entries(action.answers)) {
    if (!/^\d{1,3}$/.test(key) || Number(key) < p.first || Number(key) > p.last || typeof value !== 'string' || value.length > 2000) fail('bad-phase-answers');
  }
  if (action.revision > state.revision) {
    const answers = { ...state.answers };
    for (let n = p.first; n <= p.last; n++) delete answers[n];
    Object.assign(answers, action.answers);
    state = { ...state, answers, revision: action.revision };
  }
  // An older in-flight save/finish must never replace a newer selection.
  if (action.op === 'advance') state = closePhase(state, now);
  return state;
}

export function validNisState(s) {
  if (!s || !Number.isInteger(s.phase) || s.phase < 0 || s.phase > 4
    || typeof s.waiting !== 'boolean' || typeof s.ready !== 'boolean'
    || s.waiting && s.phase !== 3 || s.ready !== (s.phase === 4)
    || !Number.isSafeInteger(s.revision) || s.revision < 0
    || !Number.isFinite(s.phaseStartedAt) || !Number.isFinite(s.elapsedSec) || s.elapsedSec < 0 || s.elapsedSec > 14400
    || !s.answers || typeof s.answers !== 'object' || Array.isArray(s.answers)) return false;
  if (s.waiting || s.ready) { if (s.deadline !== null) return false; }
  else if (!Number.isFinite(s.deadline) || s.deadline < s.phaseStartedAt) return false;
  const last = s.ready ? 180 : s.waiting ? 120 : NIS_PHASES[s.phase].last;
  return Object.entries(s.answers).every(([n,a]) => /^\d{1,3}$/.test(n) && Number(n)>=1 && Number(n)<=last && typeof a==='string' && a.length<=2000);
}
