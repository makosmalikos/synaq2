import { pathToFileURL } from 'node:url';

// Public GET/HEAD requests only: no accounts, payment requests or user data.
const routes = ['/', '/app', '/free-diagnostic', '/diagnostic'];
const images = ['/brands/synaq-mark-320.webp', ...['owl', 'fox', 'panda', 'lion', 'penguin', 'koala']
  .map(pet => `/mascot/synaq-${pet}-grown-small.webp`)];

export function assetPaths(source) {
  return [...new Set([...source.matchAll(/["']\/?(assets\/[A-Za-z0-9_.-]+\.(?:js|css))["']/g)]
    .map(match => `/${match[1]}`))];
}

export function validateResponse(response, path, kind) {
  if (!response.ok) throw Error(`${path}: HTTP ${response.status}`);
  const type = response.headers.get('content-type') || '';
  const expected = { html: /text\/html/i, js: /(?:java|ecma)script/i, css: /text\/css/i, image: /^image\//i }[kind];
  if (!expected?.test(type)) throw Error(`${path}: expected ${kind}, received ${type || 'no Content-Type'}`);
}

export async function checkRelease(base, fetcher = fetch) {
  const origin = new URL(base).origin;
  if (!/^https?:/.test(origin)) throw Error('Use an HTTP(S) origin');
  const checked = [];
  const request = async (path, kind, method = 'GET') => {
    const response = await fetcher(new URL(path, origin), {
      method, signal: AbortSignal.timeout(20000), redirect: 'follow',
    });
    validateResponse(response, path, kind);
    checked.push({ path, status: response.status, contentType: response.headers.get('content-type') });
    return response;
  };
  let entryAssets;
  for (const path of routes) {
    const html = await (await request(path, 'html')).text();
    const assets = assetPaths(html);
    if (!/id=["']root["']/.test(html) || !assets.some(path => path.endsWith('.js'))) {
      throw Error(`${path}: application shell is missing`);
    }
    const signature = assets.join('\n');
    if (entryAssets && signature !== entryAssets.join('\n')) throw Error(`${path}: different build from landing`);
    entryAssets = assets;
  }
  const resources = new Set(entryAssets);
  // Vite's entry lists the lazy chunks in its preload map. Validate those too:
  // a 200 HTML fallback for a deleted JS file must fail this check.
  for (const path of entryAssets.filter(path => path.endsWith('.js'))) {
    const source = await (await request(path, 'js')).text();
    for (const asset of assetPaths(source)) resources.add(asset);
  }
  const paths = [...new Set([...resources, ...images])];
  for (let offset = 0; offset < paths.length; offset += 6) {
    const results = await Promise.allSettled(paths.slice(offset, offset + 6).map(path =>
      request(path, path.endsWith('.js') ? 'js' : path.endsWith('.css') ? 'css' : 'image', 'HEAD')));
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length) throw new AggregateError(failures.map(result => result.reason), 'Release assets failed');
  }
  return { origin, checkedAt: new Date().toISOString(), routes: routes.length, resources: paths.length, checked };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await checkRelease(process.argv[2] || 'https://www.synaq.app'), null, 2)); }
  catch (error) { console.error(error); process.exitCode = 1; }
}
