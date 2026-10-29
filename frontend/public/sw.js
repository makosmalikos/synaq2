// Only the public connection-help screen is cached. Account/API responses,
// question content, tokens and authenticated documents never enter this cache.
const CACHE = 'synaq-offline-v1';
const OFFLINE = '/offline.html';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(OFFLINE)));
  // Do not skip waiting or reload an active training/test session.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('synaq-offline-') && key !== CACHE).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== self.location.origin
    || url.pathname === '/api' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/')) return;
  event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE)) || new Response('Интернетке қосылыңыз / Подключитесь к интернету', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
});
