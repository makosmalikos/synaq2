import { useEffect, useRef } from 'react';
import { trainingDayKey } from './trainingPersistence.js';

// Refresh after returning from another cabinet/device, and at Almaty midnight.
// The minute timer checks only the date; it never polls the full history.
export default function useReportRefresh(refresh, enabled = true) {
  const day = useRef(trainingDayKey());
  const last = useRef(Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    const check = (returned = false) => {
      if (document.visibilityState === 'hidden') return;
      const next = trainingDayKey(), now = Date.now();
      if (next !== day.current || (returned && now - last.current >= 30000)) {
        day.current = next; last.current = now;
        refresh(value => value + 1);
      }
    };
    const returned = () => check(true);
    check();
    const timer = setInterval(check, 60000);
    window.addEventListener('focus', returned);
    document.addEventListener('visibilitychange', returned);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', returned);
      document.removeEventListener('visibilitychange', returned);
    };
  }, [refresh, enabled]);
}
