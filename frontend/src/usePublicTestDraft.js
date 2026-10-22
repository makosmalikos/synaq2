import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { clearPublicTestDraft, questionRevision, readPublicTestDraft, savePublicTestDraft } from './publicTestDraft.js';

export default function usePublicTestDraft(kind, getQuestions, screen, value, questions) {
  const [resumeDraft, setResumeDraft] = useState(() => readPublicTestDraft(kind, getQuestions));
  const [durable, setDurable] = useState(true);
  const revision = useMemo(() => questionRevision(questions), [questions]);
  const { grade, target, index, answers, deadline } = value;
  useLayoutEffect(() => {
    if (screen === 'test') {
      setDurable(savePublicTestDraft(kind, { grade, target, index, answers, deadline }, revision));
    } else if (screen === 'result') {
      clearPublicTestDraft(kind);
      setResumeDraft(null);
    }
  }, [kind, screen, grade, target, index, answers, deadline, revision]);
  useEffect(() => {
    if (durable || screen !== 'test') return;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [durable, screen]);
  return { resumeDraft, durable };
}
