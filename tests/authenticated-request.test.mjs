import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticatedRequest } from '../frontend/src/authenticatedRequest.js';

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
const account = () => ({ currentUser: { uid: 'first', getIdToken: async () => 'first-token' } });
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

test('authenticated mutations preserve stable IDs and bearer token without automatic replay', async () => {
  const auth = account(), calls = [];
  const body = { action: 'answer', id: 'stable-attempt', answer: '4' };
  const value = await authenticatedRequest(auth, '/api/learning', { uid: 'first', body, fetcher: async (url, options) => {
    calls.push({ url, options }); return response({ saved: true });
  } });
  assert.deepEqual(value, { saved: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer first-token');
  assert.deepEqual(JSON.parse(calls[0].options.body), body);
  assert.equal(calls[0].options.cache, 'no-store');
  assert.ok(calls[0].options.signal instanceof AbortSignal);
});

test('signed-out, wrong-owner and mid-token account switches never send a request', async () => {
  let calls = 0;
  const fetcher = () => { calls++; return response({}); };
  await assert.rejects(authenticatedRequest({ currentUser: null }, '/api/learning', { fetcher }), { status: 401 });
  await assert.rejects(authenticatedRequest(account(), '/api/learning', { uid: 'other', fetcher }), { status: 401 });
  const token = deferred(), auth = account(); auth.currentUser.getIdToken = () => token.promise;
  const pending = authenticatedRequest(auth, '/api/learning', { fetcher, prefix: 'learning/' });
  auth.currentUser = { uid: 'second' }; token.resolve('old-token');
  await assert.rejects(pending, { code: 'learning/auth-required', status: 401 });
  assert.equal(calls, 0);
});

test('late response bodies from a previous account are rejected', async () => {
  const auth = account(), data = deferred();
  const pending = authenticatedRequest(auth, '/api/rewards', { authError: 'login_required', fetcher: async () => ({ ok: true, status: 200, json: () => data.promise }) });
  await tick(); auth.currentUser = { uid: 'second' }; data.resolve({ balance: 9000 });
  await assert.rejects(pending, { message: 'login_required', status: 401 });
});

test('deadline also bounds stalled token refresh; a late token cannot send a mutation', async () => {
  const token = deferred(), auth = account(); let calls = 0;
  auth.currentUser.getIdToken = () => token.promise;
  await assert.rejects(authenticatedRequest(auth, '/api/learning', { timeoutMs: 15, prefix: 'learning/', fetcher: () => { calls++; } }), { code: 'learning/request-timeout' });
  token.resolve('late-token'); await tick(); assert.equal(calls, 0);
});

test('deadline aborts hanging fetch and hanging JSON bodies without replaying either', async () => {
  for (const phase of ['headers', 'body']) {
    let signal, calls = 0;
    const stalled = deferred();
    await assert.rejects(authenticatedRequest(account(), '/api/mock-session', { timeoutMs: 15, fetcher: async (_, options) => {
      signal = options.signal; calls++;
      return phase === 'headers' ? stalled.promise : { ok: true, status: 200, json: () => stalled.promise };
    } }), { message: 'request-timeout' });
    assert.equal(signal.aborted, true); assert.equal(calls, 1);
    stalled.resolve(phase === 'headers' ? response({}) : {}); await tick();
  }
});

test('invalid successful payloads do not masquerade as saved results; HTTP errors preserve status and codes', async () => {
  for (const data of [null, [], 'HTML fallback', 1]) {
    await assert.rejects(authenticatedRequest(account(), '/api/mock-session', { fetcher: async () => response(data) }), { message: 'temporarily-unavailable' });
  }
  await assert.rejects(authenticatedRequest(account(), '/api/learning', { prefix: 'learning/', fetcher: async () => response({ error: 'daily-limit' }, 429) }), { code: 'learning/daily-limit', status: 429 });
  let calls = 0;
  await assert.rejects(authenticatedRequest(account(), '/api/rewards', { fetcher: async () => { calls++; throw new TypeError('offline'); } }), /offline/);
  assert.equal(calls, 1);
});

test('GET requests carry authentication without adding a request body', async () => {
  await authenticatedRequest(account(), '/api/rewards', { method: 'GET', fetcher: async (_, options) => {
    assert.equal(options.method, 'GET'); assert.equal(Object.hasOwn(options, 'body'), false); return response({ balance: 0 });
  } });
});
