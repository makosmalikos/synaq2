// Match path segments, not unrelated prefixes such as /application.
export function readRoute(pathname = '/') {
  if (/^\/diagnostic(?:\/|$)/.test(pathname)) return 'diagnostic';
  return /^\/app(?:\/|$)/.test(pathname) ? 'app' : 'landing';
}

export const routePath = (route) => route === 'app' ? '/app' : route === 'diagnostic' ? '/diagnostic' : '/';

export function readDuelCode(search, storage) {
  const fromUrl = new URLSearchParams(search).get('duel')?.toUpperCase() || '';
  if (fromUrl) {
    try { storage?.setItem('synaq_duel', fromUrl); } catch {}
    return fromUrl;
  }
  try { return storage?.getItem('synaq_duel')?.toUpperCase() || ''; } catch { return ''; }
}
