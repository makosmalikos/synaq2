import { useEffect, useState } from 'react';
import { auth, getAttempts, getPlatformDiagnostics, getDailyLearningState, rewardRequest } from './firebase.js';
import { emptyHomeOverview, HOME_ATTEMPT_LIMIT, loadHomeSections } from './homeModel.js';
import { trainingDayKey } from './trainingPersistence.js';

export function useHomeOverview(uid) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState(() => ({ uid, sections: emptyHomeOverview() }));
  useEffect(() => {
    if (!uid) return undefined;
    let active = true;
    setState({ uid, sections: emptyHomeOverview() });
    void loadHomeSections({
      attempts: () => getAttempts(uid, HOME_ATTEMPT_LIMIT),
      diagnostics: () => getPlatformDiagnostics(uid),
      daily: () => getDailyLearningState(uid),
      wallet: () => rewardRequest(),
    }, (key, section) => setState((current) => ({ uid, sections: { ...current.sections, [key]: section } })),
    { isCurrent: () => active && auth.currentUser?.uid === uid });
    return () => { active = false; };
  }, [uid, revision]);

  useEffect(() => {
    let day = trainingDayKey();
    const checkDay = () => {
      if (document.visibilityState === 'hidden') return;
      const nextDay = trainingDayKey();
      if (nextDay !== day) { day = nextDay; setRevision((value) => value + 1); }
    };
    // Only the date is checked; no network polling. Refetch once at a new
    // Kazakhstan day, including after the phone wakes from sleep.
    const timer = setInterval(checkDay, 60000);
    window.addEventListener('focus', checkDay);
    document.addEventListener('visibilitychange', checkDay);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', checkDay);
      document.removeEventListener('visibilitychange', checkDay);
    };
  }, [uid]);
  return { overview: state.uid === uid ? state.sections : emptyHomeOverview(), retry: () => setRevision((value) => value + 1) };
}
