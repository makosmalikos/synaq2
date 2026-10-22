import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, getDocsFromServer, runTransaction } from 'firebase/firestore';
import { auth, db, getAttempts } from './firebase.js';
import { CURRICULUM } from './curriculumData.js';
import { createCurriculumTheoryStore, curriculumProgressModel, emptyCurriculumTheory, loadCurriculumAttempts,
  mergeCurriculumLesson, validCurriculumLesson } from './curriculumProgress.js';

const catalog = new Map(Object.values(CURRICULUM).flat().map((topic) => [topic.key, topic]));
const sameLesson = (a, b) => !!a && !!b && a.lastStep === b.lastStep && a.updatedAt === b.updatedAt
  && a.studiedAt === b.studiedAt && a.checkPassed === b.checkPassed
  && a.completedSteps.length === b.completedSteps.length && a.completedSteps.every((step) => b.completedSteps.includes(step));
async function bounded(request) {
  let timer;
  try { return await Promise.race([request, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('sync-timeout')), 12000); })]); }
  finally { clearTimeout(timer); }
}

export function useCurriculumProgress(uid, grade, plan, { attempts, historyStatus, historyLimit, savedAttemptId = null } = {}) {
  const [theory, setTheory] = useState(() => ({ uid, record: emptyCurriculumTheory(uid), error: null }));
  const [sync, setSync] = useState({ uid, status: 'loading' });
  const [history, setHistory] = useState({ uid, status: 'loading', attempts: [] });
  const [revision, setRevision] = useState(0);
  const store = useRef(null);
  useEffect(() => {
    let active = true, cloudReady = false, syncing = false, loading = false;
    const pending = new Map();
    const current = () => active && auth.currentUser?.uid === uid;
    const status = (value) => { if (current()) setSync({ uid, status: value }); };
    const controller = createCurriculumTheoryStore(uid, { isCurrent: current,
      onChange: (next) => { if (current()) setTheory({ uid, ...next }); } });
    setTheory({ uid, ...controller.snapshot() });
    setSync({ uid, status: 'loading' });

    async function flush() {
      if (!current() || !cloudReady || syncing) return;
      syncing = true;
      try {
        while (current() && pending.size) {
          status('saving');
          const [key, lesson] = pending.entries().next().value;
          const merged = await bounded(runTransaction(db, async (tx) => {
            if (!current()) throw Error('account-changed');
            const ref = doc(db, 'results', uid, 'lessonReading', key), snap = await tx.get(ref);
            if (!current()) throw Error('account-changed');
            const remote = snap.exists() ? snap.data() : null;
            const next = mergeCurriculumLesson(catalog.get(key), lesson, validCurriculumLesson(key, remote) ? remote : null);
            tx.set(ref, next);
            return next;
          }));
          if (!current()) return;
          controller.merge({ [key]: merged });
          if (pending.get(key) === lesson) pending.delete(key);
        }
        status('synced');
      } catch { cloudReady = false; status('local'); }
      finally { syncing = false; }
    }

    async function pull() {
      if (!uid || !current() || loading || syncing) return;
      loading = true;
      status('loading');
      try {
        const snapshot = await bounded(getDocsFromServer(collection(db, 'results', uid, 'lessonReading')));
        if (!current()) return;
        const remote = Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()]));
        const merged = controller.merge(remote);
        for (const [key, lesson] of Object.entries(merged.lessons)) {
          if (!sameLesson(lesson, remote[key])) pending.set(key, lesson);
        }
        cloudReady = true;
        void flush();
      } catch { cloudReady = false; status('local'); }
      finally { loading = false; }
    }
    store.current = { uid, retry: pull, update(topic, action) {
      const next = controller.update(topic, action);
      if (!next) return null;
      const lesson = next.record.lessons[topic.key];
      pending.set(topic.key, lesson);
      if (cloudReady) void flush(); else status('local');
      return lesson;
    } };
    void pull();
    window.addEventListener('online', pull);
    window.addEventListener('focus', pull);
    return () => { active = false; window.removeEventListener('online', pull); window.removeEventListener('focus', pull); };
  }, [uid]);

  const suppliedHistory = attempts !== undefined || historyStatus !== undefined;
  useEffect(() => {
    if (suppliedHistory) return undefined;
    let active = true;
    setHistory({ uid, status: 'loading', attempts: [] });
    if (uid) void loadCurriculumAttempts(uid, getAttempts, (next) => setHistory({ uid, ...next }),
      { isCurrent: () => active && auth.currentUser?.uid === uid });
    return () => { active = false; };
  }, [uid, revision, savedAttemptId, suppliedHistory]);
  const updateTheory = useCallback((topic, action) => {
    if (store.current?.uid !== uid || auth.currentUser?.uid !== uid) return null;
    return store.current.update(topic, action);
  }, [uid]);
  const currentTheory = theory.uid === uid ? theory.record : emptyCurriculumTheory(uid);
  const currentHistory = suppliedHistory ? { status: historyStatus || 'ready', attempts: attempts || [] }
    : history.uid === uid ? history : { status: 'loading', attempts: [] };
  const model = useMemo(() => curriculumProgressModel({ grade, plan, theory: currentTheory, attempts: currentHistory.attempts, historyLimit }),
    [grade, plan, currentTheory, currentHistory.attempts, historyLimit]);
  return { ...model, theory: currentTheory, theoryError: theory.uid === uid ? theory.error : null,
    syncStatus: sync.uid === uid ? sync.status : 'loading', historyStatus: currentHistory.status,
    updateTheory, retry: () => { if (store.current?.uid === uid) void store.current.retry(); setRevision((value) => value + 1); } };
}
