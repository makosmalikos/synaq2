// Open during the user gesture: mobile browsers may block window.open after
// an awaited network request. Always return a regular link as a fallback.
export async function openLesson(call, id, { current = () => true, open = () => window.open('about:blank', '_blank') } = {}) {
  let popup;
  try { popup = open(); if (popup) popup.opener = null; } catch { popup?.close(); popup = null; }
  try {
    const { url } = await call({ action: 'join', id });
    if (!current()) { popup?.close(); return null; }
    const target = new URL(url);
    if (target.protocol !== 'https:' || target.username || target.password) throw new Error('no_link');
    if (popup && !popup.closed) popup.location.replace(target.href);
    return target.href;
  } catch (error) { popup?.close(); throw error; }
}
