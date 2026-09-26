import { diagnosticProgressKey, diagnosticStorageKey, readStoredDiagnostic } from './platformDiagnostic.js';

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
  try {
    const target = storage || localStorage;
    const draft = JSON.parse(target.getItem(diagnosticProgressKey(uid)) || 'null');
    if (draft?.attemptId === attemptId) target.removeItem(diagnosticProgressKey(uid));
  } catch { /* Keep an unreadable draft instead of deleting another attempt. */ }
}

export function stageDiagnosticResult(uid, result, storage) {
  let durable = false;
  try {
    const target = storage || localStorage;
    const current = JSON.parse(target.getItem(diagnosticStorageKey(uid)) || 'null');
    if (!current || current.saveId === result.saveId || !(Date.parse(current.completedAt) > Date.parse(result.completedAt))) {
      target.setItem(diagnosticStorageKey(uid), JSON.stringify(result));
      durable = true;
    }
  } catch { /* The UI distinguishes an in-memory result from a durable backup. */ }
  pendingResults.set(ownerKey(uid), { result, durable });
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
