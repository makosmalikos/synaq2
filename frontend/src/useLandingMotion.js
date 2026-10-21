import { useEffect } from 'react';

// Content remains visible without JS/observer support. Motion runs once per card,
// using only opacity and transform, with no scroll listeners or animation library.
export default function useLandingMotion(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compact = window.matchMedia('(max-width: 760px)');
    const played = new WeakSet();
    const running = new Set();
    let observer;
    const stop = () => {
      observer?.disconnect();
      running.forEach(animation => animation.cancel());
      running.clear();
    };
    const configure = () => {
      stop();
      if (preference.matches) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting || played.has(target)) return;
          played.add(target);
          observer.unobserve(target);
          const index = [...target.parentElement.children].indexOf(target);
          const animation = target.animate([
            { opacity: 0.65, transform: `translateY(${compact.matches ? 8 : 14}px)` },
            { opacity: 1, transform: 'translateY(0)' },
          ], {
            duration: compact.matches ? 360 : 500,
            delay: compact.matches ? 0 : Math.min(index, 4) * 55,
            easing: 'cubic-bezier(.22,1,.36,1)',
            fill: 'none',
          });
          running.add(animation);
          animation.onfinish = animation.oncancel = () => running.delete(animation);
        });
      }, { threshold: 0.12 });
      root.querySelectorAll('.sx-student-tile, .sx-benefit-grid article, .sx-review-grid article, .sx-plan, .lp-diagnostic-card').forEach(node => {
        if (!played.has(node)) observer.observe(node);
      });
    };
    configure();
    preference.addEventListener('change', configure);
    return () => { stop(); preference.removeEventListener('change', configure); };
  }, [rootRef]);
}
