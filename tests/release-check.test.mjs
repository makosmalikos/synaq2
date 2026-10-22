import test from 'node:test';
import assert from 'node:assert/strict';
import { assetPaths, checkRelease, validateResponse } from '../scripts/check-release.mjs';

test('release check extracts only same-origin build assets', () => {
  assert.deepEqual(assetPaths('<script src="/assets/index-a.js"></script> ["assets/Curriculum-x.js","assets/style-b.css","https://other.test/assets/x.js"]'),
    ['/assets/index-a.js', '/assets/Curriculum-x.js', '/assets/style-b.css']);
});

test('release check rejects HTML fallbacks and failed images', () => {
  assert.throws(() => validateResponse(new Response('<html>', { headers: { 'content-type': 'text/html' } }), '/assets/deleted.js', 'js'), /expected js/);
  assert.throws(() => validateResponse(new Response('', { status: 404 }), '/mascot/missing.webp', 'image'), /HTTP 404/);
});

test('release check covers direct routes and lazy chunks with read-only requests', async () => {
  const requests = [];
  const fetcher = async (url, options) => {
    assert.equal(url.origin, 'https://test.example');
    assert.ok(['GET', 'HEAD'].includes(options.method));
    requests.push(url.pathname);
    const type = url.pathname.endsWith('.js') ? 'text/javascript' : url.pathname.endsWith('.webp') ? 'image/webp' : 'text/html';
    return new Response(type === 'text/html' ? '<div id="root"></div><script src="/assets/index-a.js"></script>'
      : url.pathname.endsWith('index-a.js') ? '["assets/Curriculum-b.js"]' : '', { headers: { 'content-type': type } });
  };
  const result = await checkRelease('https://test.example', fetcher);
  assert.equal(result.routes, 4);
  assert.ok(requests.includes('/assets/Curriculum-b.js'));
  assert.ok(requests.includes('/mascot/synaq-fox-grown-small.webp'));
});

test('release check rejects inconsistent route deployments', async () => {
  await assert.rejects(checkRelease('https://test.example', async url => new Response(
    `<div id="root"></div><script src="/assets/${url.pathname === '/' ? 'new' : 'old'}.js"></script>`,
    { headers: { 'content-type': 'text/html' } })), /different build/);
});
