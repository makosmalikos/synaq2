import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { checkoutErrorMessage, checkoutNeedsVerification, isCheckoutDestination } from '../frontend/src/checkoutMessages.js';

const source = fs.readFileSync(new URL('../frontend/src/Parent.jsx', import.meta.url), 'utf8');
const buy = source.slice(source.indexOf('  async function buyPro()'), source.indexOf("  const [name, setName]"));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

function fixture({ status = 409, body = { error: 'checkout_pending' }, respond, token } = {}) {
  const calls = [], redirects = [], state = { paying: false, issue: null, refresh: 0 };
  const location = {};
  Object.defineProperty(location, 'href', { set: (url) => redirects.push(url) });
  const context = {
    auth: { currentUser: { uid: 'parent', email: 'parent@example.test', getIdToken: token || (async () => 'stub-token') } },
    mounted: { current: true }, payingRef: { current: false }, checkoutHold: false, paymentPending: false,
    setPaying: (value) => { state.paying = value; },
    setPaymentIssue: (value) => { state.issue = value; context.checkoutHold = checkoutNeedsVerification(value?.code); },
    setFamilyRetry: (update) => { state.refresh = update(state.refresh); },
    isCheckoutDestination, window: { location }, console: { error() {} },
    fetch: async (...args) => {
      calls.push(args);
      return respond ? respond(...args) : { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
    },
  };
  vm.createContext(context); vm.runInContext(buy, context);
  return { context, state, calls, redirects, run: () => context.buyPro() };
}

test('checkout codes have distinct safe RU/KK messages without echoing provider text', () => {
  const codes = ['checkout_pending', 'checkout_verification_required', 'checkout_payment_pending',
    'checkout_network_error', 'already_pro', 'parent_required', 'family_required', 'server_not_configured', 'checkout_unavailable'];
  for (const lang of ['ru', 'kk']) {
    const copy = codes.map((code) => checkoutErrorMessage(code, lang));
    assert.equal(new Set(copy).size, codes.length);
    assert.ok(copy.every((message) => typeof message === 'string' && message.length > 30));
    assert.equal(checkoutErrorMessage('<script>private provider message</script>', lang), checkoutErrorMessage('checkout_unavailable', lang));
    assert.equal(checkoutErrorMessage('__proto__', lang), checkoutErrorMessage('checkout_unavailable', lang));
    assert.equal(checkoutErrorMessage('constructor', lang), checkoutErrorMessage('checkout_unavailable', lang));
  }
  assert.notEqual(checkoutErrorMessage('checkout_payment_pending', 'ru'), checkoutErrorMessage('checkout_payment_pending', 'kk'));
  assert.match(checkoutErrorMessage('checkout_verification_required', 'ru'), /Не оплачивайте повторно/);
  assert.equal(checkoutErrorMessage('anything', 'ru', 401), checkoutErrorMessage('login_required', 'ru'));
  assert.equal(checkoutErrorMessage('Қайта кіріңіз', 'kk'), checkoutErrorMessage('login_required', 'kk'));
  assert.equal(checkoutErrorMessage('Төлем баптаулары толық емес', 'ru'), checkoutErrorMessage('server_not_configured', 'ru'));
});

test('ambiguous and processing payments hold the purchase button without any automatic POST retry', async () => {
  for (const code of ['checkout_verification_required', 'checkout_payment_pending']) {
    const f = fixture({ status: code === 'checkout_verification_required' ? 503 : 409, body: { error: code, message: 'untrusted raw text' } });
    await f.run();
    assert.equal(f.state.issue.code, code);
    assert.equal(f.state.paying, false);
    assert.equal(f.context.checkoutHold, true);
    await f.run();
    assert.equal(f.calls.length, 1);
    assert.equal(f.redirects.length, 0);
  }
  // The explicit refresh action observes Firestore; it does not call checkout.
  const notice = source.slice(source.indexOf('{paymentError &&'), source.indexOf('{err && !adding'));
  assert.match(notice, /setFamilyRetry\(\(n\) => n \+ 1\)/);
  assert.doesNotMatch(notice, /buyPro|fetch\(/);
});

test('a pending reservation permits an explicit manual retry but never schedules one', async () => {
  const f = fixture();
  await f.run();
  assert.equal(f.state.issue.code, 'checkout_pending');
  assert.equal(f.context.checkoutHold, false);
  assert.equal(f.calls.length, 1);
  await f.run();
  assert.equal(f.calls.length, 2);
  assert.doesNotMatch(buy, /setTimeout|setInterval/);
});

test('lost HTTP response is marked unknown, while failed authentication never sends a checkout request', async () => {
  const lost = fixture({ respond: async () => { throw Error('network'); } });
  await lost.run();
  assert.equal(lost.state.issue.code, 'checkout_network_error');
  assert.equal(lost.context.checkoutHold, true);
  await lost.run(); assert.equal(lost.calls.length, 1);
  const expired = fixture({ token: async () => { throw Object.assign(Error('expired'), { code: 'auth/id-token-expired' }); } });
  await expired.run();
  assert.equal(expired.state.issue.code, 'login_required');
  assert.equal(expired.calls.length, 0);
});

test('active Pro refreshes its subscription instead of redirecting or starting another request', async () => {
  const f = fixture({ body: { error: 'already_pro' } });
  await f.run();
  assert.equal(f.state.refresh, 1);
  assert.equal(f.state.issue.code, 'already_pro');
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.redirects, []);
});

test('success uses the exact server URL, including renewed sessions, without adding payment flags', async () => {
  const url = 'https://test.checkout.dodopayments.com/session/cks_renewed_2?locale=kk';
  const f = fixture({ status: 200, body: { url } });
  await f.run();
  assert.deepEqual(f.redirects, [url]);
  assert.equal(f.context.payingRef.current, true, 'stay guarded until navigation/pageshow');
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][0], '/api/checkout');
  assert.equal(f.calls[0][1].method, 'POST');
});

test('unsafe or malformed successful redirect responses require verification, not a substituted URL', async () => {
  for (const url of ['javascript:alert(1)', 'https://checkout.dodopayments.com.attacker.test/session/cks_a',
    'http://checkout.dodopayments.com/session/cks_a', 'https://user:pass@checkout.dodopayments.com/session/cks_a',
    'https://checkout.dodopayments.com:444/session/cks_a', '/app?paid=1', null]) {
    assert.equal(isCheckoutDestination(url), false);
    const f = fixture({ status: 200, body: { url } });
    await f.run();
    assert.equal(f.state.issue.code, 'checkout_verification_required');
    assert.deepEqual(f.redirects, []);
  }
  assert.equal(isCheckoutDestination('https://checkout.dodopayments.com/session/cks_a'), true);
});

test('same-render duplicate purchase and late response after account change cannot redirect another user', async () => {
  const pending = deferred();
  const f = fixture({ respond: () => pending.promise });
  const first = f.run();
  await f.run();
  assert.equal(f.calls.length, 1);
  f.context.auth.currentUser = { uid: 'other-parent' };
  pending.resolve({ ok: true, status: 200, text: async () => JSON.stringify({ url: 'https://checkout.dodopayments.com/session/cks_a' }) });
  await first;
  assert.deepEqual(f.redirects, []);
  assert.equal(f.state.issue, null);
});
