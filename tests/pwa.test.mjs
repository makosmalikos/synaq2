import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createInstallController, registerPwa } from '../frontend/src/pwa.js';

function browser({ ios = false, standalone = false, stored = 0 } = {}) {
  const events = new Map(), mediaEvents = new Map(), writes = [];
  const media = { matches: standalone, addEventListener: (k, v) => mediaEvents.set(k, v), removeEventListener: k => mediaEvents.delete(k) };
  const host = { navigator: { userAgent: ios ? 'iPhone' : 'Chrome' }, matchMedia: () => media,
    localStorage: { getItem: () => stored, setItem: (...args) => writes.push(args) },
    addEventListener: (k, v) => events.set(k, v), removeEventListener: k => events.delete(k) };
  return { host, events, media, mediaEvents, writes };
}
test('native install prompt runs synchronously from click, once; acceptance waits for appinstalled', async () => {
  const b = browser(), c = createInstallController(b.host); let prompted = 0, prevented = 0, finish;
  b.events.get('beforeinstallprompt')({ preventDefault: () => prevented++, prompt: () => { prompted++; }, userChoice: new Promise(resolve => { finish = resolve; }) });
  assert.equal(prevented, 1); assert.equal(c.getSnapshot().available, true);
  const pending = c.install(); assert.equal(prompted, 1); assert.equal(await c.install(), 'ignored');
  finish({ outcome: 'accepted' }); assert.equal(await pending, 'accepted');
  assert.equal(c.getSnapshot().installed, false); assert.equal(c.getSnapshot().dismissed, true);
  b.events.get('appinstalled')(); assert.equal(c.getSnapshot().installed, true);
  assert.equal(await c.install(), 'ignored'); c.dispose(); assert.equal(b.events.size, 0);
});
test('cancelled or failed prompts are not reused; unsupported browsers receive help', async () => {
  for (const fails of [false, true]) {
    const b = browser(), c = createInstallController(b.host);
    b.events.get('beforeinstallprompt')({ preventDefault() {}, prompt() { if (fails) throw Error('unavailable'); }, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
    assert.equal(await c.install(), fails ? 'help' : 'dismissed');
    assert.equal(c.getSnapshot().dismissed, false); assert.equal(await c.install(), 'help');
  }
});
test('iPhone/iPad and standalone detection; dismissal persists but never disables manual installation', async () => {
  const b = browser({ ios: true }), c = createInstallController(b.host);
  assert.equal(c.getSnapshot().ios, true); c.dismiss(); assert.equal(await c.install(), 'help');
  assert.ok(Number(b.writes[0][1]) > Date.now() + 6 * 86400000);
  assert.equal(createInstallController(browser({ stored: Date.now() + 10000 }).host).getSnapshot().dismissed, true);
  assert.equal(createInstallController(browser({ standalone: true }).host).getSnapshot().installed, true);
  b.media.matches = true; b.mediaEvents.get('change')(); assert.equal(c.getSnapshot().installed, true);
  const ipad = browser(); ipad.host.navigator = { userAgent: 'Macintosh', maxTouchPoints: 5 };
  assert.equal(createInstallController(ipad.host).getSnapshot().ios, true);
});
test('blocked local storage and server rendering do not break install controls', async () => {
  const b = browser(); b.host.localStorage = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  const c = createInstallController(b.host); c.dismiss(); assert.equal(c.getSnapshot().dismissed, true);
  assert.equal(await createInstallController(null).install(), 'help');
});
test('registration waits for load, uses fresh worker script and skips insecure environments', async () => {
  const b = browser(), calls = []; b.host.document = { readyState: 'loading' };
  b.host.navigator.serviceWorker = { register: (...args) => { calls.push(args); return Promise.resolve(); } };
  registerPwa(b.host); assert.equal(calls.length, 0);
  b.host.isSecureContext = true; registerPwa(b.host); assert.equal(calls.length, 0);
  await b.events.get('load')(); assert.deepEqual(calls, [['/sw.js', { scope: '/', updateViaCache: 'none' }]]);
});
function worker({ offline = false, missing = false } = {}) {
  const listeners = {}, added = [], deleted = [], fetched = [];
  const fallback = new Response('Connection help');
  vm.runInNewContext(readFileSync(new URL('../frontend/public/sw.js', import.meta.url), 'utf8'), {
    URL, Response, self: { location: { origin: 'https://synaq.app' }, addEventListener: (name, fn) => { listeners[name] = fn; } },
    fetch: async request => { fetched.push(request); if (offline) throw Error('offline'); return new Response('Network response'); },
    caches: { open: async () => ({ add: async url => added.push(url) }), keys: async () => ['other-app', 'synaq-offline-v0', 'synaq-offline-v1'], delete: async name => deleted.push(name), match: async () => missing ? undefined : fallback },
  });
  return { listeners, added, deleted, fetched };
}
const navigation = path => ({ method: 'GET', mode: 'navigate', url: `https://synaq.app${path}` });
test('worker caches only public offline screen; updates leave unrelated caches alone', async () => {
  const w = worker(); let done;
  w.listeners.install({ waitUntil: p => { done = p; } }); await done; assert.deepEqual(w.added, ['/offline.html']);
  w.listeners.activate({ waitUntil: p => { done = p; } }); await done; assert.deepEqual(w.deleted, ['synaq-offline-v0']);
});
test('navigation uses network without caching account content; offline returns help', async () => {
  for (const offline of [false, true]) {
    const w = worker({ offline }); let result;
    w.listeners.fetch({ request: navigation('/app'), respondWith: p => { result = p; } });
    assert.equal(await (await result).text(), offline ? 'Connection help' : 'Network response');
    assert.equal(w.fetched.length, 1); assert.equal(w.added.length, 0);
  }
  const w = worker({ offline: true, missing: true }); let result;
  w.listeners.fetch({ request: navigation('/centers'), respondWith: p => { result = p; } }); assert.equal((await result).status, 503);
});
test('worker never intercepts API, Firebase auth, POST, subresources or cross-origin traffic', () => {
  const w = worker();
  for (const request of [navigation('/api'), navigation('/api/center'), navigation('/__/auth/handler'), { ...navigation('/app'), method: 'POST' }, { ...navigation('/assets/app.js'), mode: 'cors' }, { ...navigation('/'), url: 'https://another.example/' }]) {
    w.listeners.fetch({ request, respondWith() { assert.fail(`Intercepted ${request.url}`); } });
  }
  assert.equal(w.fetched.length, 0);
});
test('manifest has usable app identity and correctly sized install icons; PWA assets bypass SPA rewrites', () => {
  const manifest = JSON.parse(readFileSync(new URL('../frontend/public/manifest.webmanifest', import.meta.url)));
  assert.equal(manifest.id, '/'); assert.equal(manifest.start_url, '/app'); assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const png = readFileSync(new URL(`../frontend/public${icon.src}`, import.meta.url));
    const [width, height] = icon.sizes.split('x').map(Number);
    assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
  }
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url)));
  const rewrite = new RegExp(`^${config.rewrites[0].source}$`);
  for (const path of ['/sw.js', '/offline.html', '/manifest.webmanifest', '/pwa/icon-192.png']) assert.equal(rewrite.test(path), false, path);
  assert.equal(rewrite.test('/app'), true); assert.equal(rewrite.test('/centers'), true);
});
