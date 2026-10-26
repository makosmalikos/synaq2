import { useLayoutEffect } from 'react';

export default function useScreenStart(screenKey, questionSelector) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const question = questionSelector ? document.querySelector(questionSelector) : null;
    if (question && window.matchMedia('(max-width: 760px)').matches) {
      question.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    const heading = question?.querySelector('h2') || document.querySelector('.platform-main main h1, main h1')
      || document.querySelector('.platform-main main, main');
    if (!heading) return;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }, [screenKey, questionSelector]);
}
