import { useLayoutEffect } from 'react';

export default function useScreenStart(screenKey) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const heading = document.querySelector('.platform-main main h1, .platform-main main, main h1, main');
    if (!heading) return;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }, [screenKey]);
}
