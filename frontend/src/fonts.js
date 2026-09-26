// Keep the same families/weights and swap behavior, but apply their stylesheet
// only after it loads. The app can render with its existing system fallbacks.
export function activateFonts(link) {
  if (!link) return;
  const apply = () => {
    link.media = 'all';
    link.removeEventListener('load', apply);
  };
  link.addEventListener('load', apply, { once: true });
  // The stylesheet may already be cached by the time the module executes.
  if (link.sheet) apply();
}
