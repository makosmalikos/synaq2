import { clearDiagnosticProgress, diagnosticStorageKey, readStoredDiagnostic } from './platformDiagnostic.js';

// A blocked browser store must not also discard a result on SPA navigation.
// This fallback is deliberately UID-scoped and does not survive a page reload.
const pendingResults = new Map();
const ownerKey = (uid) => uid || 'guest';

export function diagnosticRecovery(uid) {
  const memory = pendingResults.get(ownerKey(uid));
  if (memory) return memory;
  const result = readStoredDiagnostic(uid);
  return { result, durable: !!result };
}

export function clearDiagnosticDraft(uid, attemptId, storage) {
  clearDiagnosticProgress(uid, attemptId, storage);
}

export function stageDiagnosticResult(uid, result, storage) {
  let durable = false;
  let newer = pendingResults.get(ownerKey(uid));
  try {
    const target = storage || localStorage;
    const current = JSON.parse(target.getItem(diagnosticStorageKey(uid)) || 'null');
    if (current && Date.parse(current.completedAt) > Date.parse(newer?.result.completedAt || '')) newer = { result: current, durable: true };
    if (current && !newer) newer = { result: current, durable: true };
    if (!(Date.parse(newer?.result.completedAt || '') > Date.parse(result.completedAt))
      && (!current || current.saveId === result.saveId || !(Date.parse(current.completedAt) > Date.parse(result.completedAt)))) {
      target.setItem(diagnosticStorageKey(uid), JSON.stringify(result));
      durable = true;
    }
  } catch { /* The UI distinguishes an in-memory result from a durable backup. */ }
  pendingResults.set(ownerKey(uid), Date.parse(newer?.result.completedAt || '') > Date.parse(result.completedAt)
    ? newer : { result, durable });
  // Never delete the draft before the complete result has reached storage.
  if (durable) clearDiagnosticDraft(uid, result.saveId, storage);
  return durable;
}

export function acknowledgeDiagnosticResult(uid, result, storage) {
  const key = ownerKey(uid);
  if (pendingResults.get(key)?.result.saveId === result.saveId) pendingResults.delete(key);
  try {
    const target = storage || localStorage;
    const current = JSON.parse(target.getItem(diagnosticStorageKey(uid)) || 'null');
    // A late acknowledgement from another tab cannot replace its newer result.
    if (current?.saveId === result.saveId) {
      target.setItem(diagnosticStorageKey(uid), JSON.stringify({ ...result, savePending: false }));
    }
  } catch { /* The server acknowledgement remains authoritative. */ }
  clearDiagnosticDraft(uid, result.saveId, storage);
}
