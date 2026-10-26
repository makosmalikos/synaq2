// Firestore reads can remain pending while reconnecting. Bound the UI wait;
// this does not retry writes or pretend to cancel an SDK network operation.
export async function readWithDeadline(read, { timeoutMs = 15000, signal } = {}) {
  let timer, onAbort;
  const failure = code => Object.assign(new Error(code), { code });
  if (signal?.aborted) throw failure('read-cancelled');
  try {
    return await Promise.race([
      Promise.resolve().then(read),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(failure('read-timeout')), timeoutMs);
        onAbort = () => reject(failure('read-cancelled'));
        signal?.addEventListener('abort', onAbort, { once: true });
      }),
    ]);
  } finally { clearTimeout(timer); if (onAbort) signal?.removeEventListener('abort', onAbort); }
}
