// One deadline covers token refresh, HTTP headers and the complete JSON body.
// Never retry mutations automatically: callers retain their stable attempt IDs.
export async function authenticatedRequest(auth, url, {
  body, method = 'POST', uid, prefix = '', authError = 'auth-required',
  fallback = 'temporarily-unavailable', timeoutMs = 20000, fetcher = fetch, onDispatch,
} = {}) {
  const fail = (reason, status = 0) => Object.assign(new Error(reason), { code: `${prefix}${reason}`, status });
  const user = auth.currentUser;
  if (!user || (uid && user.uid !== uid)) throw fail(authError, 401);
  const controller = new AbortController();
  const ensureOwner = () => {
    if (auth.currentUser?.uid !== user.uid) throw fail(authError, 401);
    if (controller.signal.aborted) throw fail('request-timeout');
  };
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const token = await user.getIdToken();
        ensureOwner();
        if (!token) throw fail(authError, 401);
        onDispatch?.();
        const response = await fetcher(url, {
          method, signal: controller.signal, cache: 'no-store',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        const data = await response.json().catch(() => null);
        ensureOwner();
        if (!response.ok || !data || typeof data !== 'object' || Array.isArray(data)) {
          const reason = typeof data?.error === 'string' ? data.error : fallback;
          throw fail(reason, response.status);
        }
        return data;
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(fail('request-timeout'));
          controller.abort();
        }, timeoutMs);
      }),
    ]);
  } finally { clearTimeout(timer); }
}
