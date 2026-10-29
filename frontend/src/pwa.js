// Capture the browser event before lazy account screens mount.
export function createInstallController(host) {
  const listeners = new Set();
  const display = host?.matchMedia?.('(display-mode: standalone)');
  const ua = host?.navigator?.userAgent || '';
  let event = null, prompting = false;
  let state = { available: false, installed: !!(display?.matches || host?.navigator?.standalone), ios: /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && host?.navigator?.maxTouchPoints > 1), embedded: /Instagram|FBAN|FBAV|TikTok|Line\//i.test(ua), dismissed: false };
  try { state.dismissed = Number(host?.localStorage?.getItem('synaq-install-dismissed-until')) > Date.now(); } catch {}
  const update = values => { state = { ...state, ...values }; listeners.forEach(fn => fn()); };
  const before = e => { if (state.installed) return; e.preventDefault(); event = e; update({ available: true }); };
  const installed = () => { event = null; update({ available: false, installed: true }); };
  const changed = () => { if (display.matches || host.navigator.standalone) installed(); };
  host?.addEventListener('beforeinstallprompt', before);
  host?.addEventListener('appinstalled', installed);
  display?.addEventListener?.('change', changed);
  return {
    getSnapshot: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    dismiss() {
      try { host?.localStorage?.setItem('synaq-install-dismissed-until', String(Date.now() + 7 * 86400000)); } catch {}
      update({ dismissed: true });
    },
    async install() {
      if (prompting || state.installed) return 'ignored';
      if (!event) return 'help';
      const current = event; event = null; prompting = true; update({ available: false });
      try {
        // Must run directly from the user's click, before any asynchronous work.
        await current.prompt();
        const choice = await current.userChoice;
        if (choice.outcome === 'accepted') update({ dismissed: true });
        return choice.outcome;
      } catch { return 'help'; }
      finally { prompting = false; }
    },
    dispose() { host?.removeEventListener('beforeinstallprompt', before); host?.removeEventListener('appinstalled', installed); display?.removeEventListener?.('change', changed); listeners.clear(); },
  };
}
export const installController = createInstallController(typeof window === 'undefined' ? null : window);

export function registerPwa(host = window) {
  if (!host.isSecureContext || !host.navigator?.serviceWorker) return;
  const register = () => host.navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
  if (host.document.readyState === 'complete') register();
  else host.addEventListener('load', register, { once: true });
}
