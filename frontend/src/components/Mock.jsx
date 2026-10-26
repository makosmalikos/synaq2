import useScreenStart from '../useScreenStart.js';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLang } from '../i18n.jsx';
import { mockCatalog, mockResume, mockStart, mockSubmit, weeklyMockCheckout } from '../mockApi.js';
import { loadTopicCatalog } from '../topicCatalog.js';
import { auth, watchPro } from '../firebase.js';
import { buildDiagnosis } from '../diagnosis.js';
import BrandLoader from './BrandLoader.jsx';
import DiagnosisReport from './DiagnosisReport.jsx';
import MockQuestionNavigator from './MockQuestionNavigator.jsx';
import MockTask from './MockTask.jsx';
import MockResults from './MockResults.jsx';
import MockCatalog from './MockCatalog.jsx';
import { hasMockAnswer, mockSubjectLabel } from '../mockReviewModel.js';
import './MockExperience.css';
import { readMockSession, writeMockSession, clearMockSession, discardMockSession, mockRemaining,
  readMockStart, writeMockStart, clearMockStart, mockClockOffset } from '../mockPersistence.js';

function formatExamTimer(totalSec, lang) {
  const s = Math.max(0, totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0 && m === 0 && sec === 0) {
    if (lang === 'ru') return `${h} ${h === 1 ? 'час' : h < 5 ? 'часа' : 'часов'}`;
    return `${h} сағат`;
  }
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function Mock({ onTrainTopic, onGoProgress }) {
  const { t, lang } = useLang();
  const ru = lang === 'ru';
  const uid = auth.currentUser?.uid || null;
  const [schools, setSchools] = useState([]);
  const [school, setSchool] = useState(null);
  const [pause, setPause] = useState(false);
  const [pro, setPro] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [paying, setPaying] = useState(false);
  const [topics, setTopics] = useState([]);
  const [test, setTest] = useState(null);
  const [meta, setMeta] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [hideTimer, setHideTimer] = useState(false);
  const [result, setResult] = useState(null);
  const [isDiagnosticRun, setIsDiagnosticRun] = useState(false);
  const [startError, setStartError] = useState('');
  const [starting, setStarting] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadRetry, setLoadRetry] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [recoveryAvailable, setRecoveryAvailable] = useState(true);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryRetry, setRecoveryRetry] = useState(0);
  const mounted = useRef(false);
  const runRef = useRef(null);
  const generationRef = useRef(0);
  const startingRef = useRef(false);
  const pendingSave = useRef(null);
  const savingRef = useRef(false);
  const attemptId = useRef(null);
  const tick = useRef(null);
  // Дедлайн мока в мс от эпохи, не «тиках» — не плывёт при фоновой вкладке
  // (setInterval троттлится, но Date.now() — нет). Сдвигается вперёд на длительность
  // каждой паузы между секциями, чтобы пауза не отъедала время экзамена.
  const deadlineRef = useRef(null);
  const pausedAtRef = useRef(null);
  // submit() пересоздаётся на каждый рендер и замыкает свежие answers/meta/…
  // Таймер же живёт между рендерами — чтобы он не звал устаревшую версию
  // (и не отправлял пустые/старые ответы по истечении времени), он всегда
  // дёргает submitRef.current(), а не submit напрямую.
  const submitRef = useRef(() => {});
  const submittingRef = useRef(false);

  const isCurrent = () => mounted.current && auth.currentUser?.uid === uid;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (recoveryAvailable || !test || result) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [recoveryAvailable, test, result]);

  function applyRun(record) {
    runRef.current = record;
    attemptId.current = record.id;
    pendingSave.current = record.pending;
    deadlineRef.current = record.deadline;
    pausedAtRef.current = record.pausedAt;
    submittingRef.current = !!record.result;
    setSchool(record.school); setTest(record.test); setMeta(record.meta);
    setAnswers(record.answers); setFlags(record.flags); setI(record.index);
    setPause(record.pausedAt !== null); setLeft(mockRemaining(record));
    setHideTimer(!!record.hideTimer);
    setIsDiagnosticRun(record.isDiagnosticRun); setResult(record.result);
  }

  function changeRun(patch) {
    if (!isCurrent() || !runRef.current || runRef.current.uid !== uid) return null;
    if (submittingRef.current && !patch.result) return null;
    const record = { ...runRef.current, ...patch };
    setRecoveryAvailable(writeMockSession(record));
    applyRun(record);
    return record;
  }

  useEffect(() => {
    let alive = true;
    generationRef.current += 1;
    runRef.current = null; pendingSave.current = null;
    startingRef.current = false; savingRef.current = false; submittingRef.current = false;
    deadlineRef.current = null; pausedAtRef.current = null;
    setSessionReady(false); setRecoveryError(''); setRecoveryAvailable(true);
    setTest(null); setResult(null); setMeta(null); setSchool(null); setPause(false);
    setSaveState('idle'); setStartError(''); setStarting(false);
    if (!uid) { setSessionReady(true); return; }
    const stored = readMockSession(uid);
    let { record } = stored;
    const { error } = stored;
    if (error === 'unavailable') setRecoveryAvailable(false);
    if (error === 'invalid') setRecoveryError('invalid');
    const interruptedStart = !record ? readMockStart(uid) : null;
    if (!record && !interruptedStart) { setSessionReady(true); return; }
    (async () => {
      try {
        const resumed = await mockResume(record?.id || interruptedStart.id);
        if (!alive || !isCurrent()) return;
        if (!record && !resumed.completed) {
          record = { uid, id: interruptedStart.id, school: interruptedStart.school,
            test: resumed.test, meta: { school: interruptedStart.school,
              sections: resumed.test.sections, diagnostic: resumed.diagnostic },
            isDiagnosticRun: resumed.diagnostic, answers: {}, flags: {}, index: 0,
            startedAt: resumed.startedAt, deadline: resumed.deadline, pausedAt: null, pausedMs: 0,
            clockOffsetMs: mockClockOffset(resumed),
            hideTimer: false, navOpen: false, result: null, pending: null };
          setRecoveryAvailable(writeMockSession(record));
          clearMockStart(uid, interruptedStart.id);
        }
        if (resumed.completed) {
          if (!record) throw new Error('completed_start_without_journal');
          record = { ...record, result: resumed.result, pausedAt: null, pending: null };
        } else {
          record = { ...record, test: resumed.test,
            isDiagnosticRun: resumed.diagnostic, startedAt: resumed.startedAt,
            deadline: resumed.deadline, clockOffsetMs: mockClockOffset(resumed), pausedAt: null, pausedMs: 0, pending: null };
        }
        if (!alive || !isCurrent()) return;
        applyRun(record);
        setSaveState(record.result ? 'saved' : record.submission ? 'error' : 'idle');
        if (record.submission && !record.result) setStartError(ru ? 'Ответы зафиксированы. Повтори завершение, чтобы получить результат.' : 'Жауаптар бекітілді. Нәтижені алу үшін аяқтауды қайтала.');
      } catch (error) {
        if (interruptedStart && error?.status === 404) clearMockStart(uid, interruptedStart.id);
        else if (alive && isCurrent()) setRecoveryError('restore');
      } finally {
        if (alive && isCurrent()) setSessionReady(true);
      }
    })();
    return () => { alive = false; };
  }, [uid, recoveryRetry]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setLoadError(false); setPro(null); setWeekly(null);
    if (!uid) { setLoadError(true); setLoading(false); return; }
    const stop = watchPro(uid, (value) => { if (alive && isCurrent()) setPro(value); }, () => {
      if (alive && isCurrent()) { setLoadError(true); setPro(null); }
    });
    Promise.all([mockCatalog(), loadTopicCatalog()]).then(([catalog, topics]) => {
      if (alive && isCurrent()) {
        setSchools(catalog.schools || []); setWeekly(catalog.weekly || null); setTopics(topics);
      }
    }).catch(() => { if (alive && isCurrent()) setLoadError(true); })
      .finally(() => { if (alive && isCurrent()) setLoading(false); });
    return () => { alive = false; stop(); };
  }, [uid, loadRetry]);

  useEffect(() => {
    if (!weekly?.endsAt || school) return;
    const refresh = () => setLoadRetry((value) => value + 1);
    const timer = setTimeout(refresh, Math.max(0, weekly.endsAt - Date.now()) + 100);
    window.addEventListener('focus', refresh);
    return () => { clearTimeout(timer); window.removeEventListener('focus', refresh); };
  }, [weekly?.endsAt, school]);

  // Держим submitRef синхронным со «свежим» submit на каждый рендер.
  useEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    if (!sessionReady || !test || result || pause || runRef.current?.submission || deadlineRef.current == null) return;
    const tickFn = () => {
      if (!isCurrent()) return;
      const remain = mockRemaining(runRef.current);
      setLeft(remain);
      if (remain <= 0) {
        clearInterval(tick.current);
        submitRef.current();
      }
    };
    tickFn();
    tick.current = setInterval(tickFn, 1000);
    return () => clearInterval(tick.current);
  }, [sessionReady, test, result, pause, uid]);

  const diagnosis = useMemo(() => {
    if (!result?.review?.length || !topics.length) return null;
    return buildDiagnosis(result.review, topics, lang);
  }, [result, topics, lang]);

  async function startExam(code) {
    if (!isCurrent() || startingRef.current || !sessionReady || recoveryError || runRef.current
      || pro === null || !weekly?.access) return;
    startingRef.current = true; setStarting(true); setStartError('');
    const generation = generationRef.current;
    const active = () => isCurrent() && generationRef.current === generation;
    try {
    const reserved = readMockStart(uid);
    if (reserved && reserved.school !== code) {
      setRecoveryRetry(value => value + 1);
      return;
    }
    const requestId = reserved?.school === code ? reserved.id : crypto.randomUUID();
    if (!reserved && !writeMockStart({ uid, id: requestId, school: code })) setRecoveryAvailable(false);
    const started = await mockStart({ id: requestId, school: code, weekKey: weekly.weekKey, excludeQuestionIds: [] });
    const v = started.test;
    if (!v) throw new Error('empty_exam');
    if (!active()) return;
    const startedNow = started.startedAt;
    const record = {
      uid, id: requestId, school: code, test: v,
      meta: { school: code, sections: v.sections, diagnostic: false, weekKey: started.weekKey }, isDiagnosticRun: false,
      answers: {}, flags: {}, index: 0, startedAt: startedNow,
      deadline: started.deadline, pausedAt: null, pausedMs: 0,
      clockOffsetMs: mockClockOffset(started),
      hideTimer: false, navOpen: false, result: null, pending: null,
    };
    setRecoveryAvailable(writeMockSession(record));
    clearMockStart(uid, requestId);
    applyRun(record); setSaveState('idle');
    } catch (error) {
      if (error?.status >= 400 && error.status < 500 && error.status !== 409) clearMockStart(uid, readMockStart(uid)?.id);
      if (active()) {
        if (error.message === 'week-changed' || error.message === 'weekly-payment-required') {
          clearMockStart(uid, readMockStart(uid)?.id);
          setLoadRetry((value) => value + 1);
        }
        setStartError(error.message === 'week-changed'
          ? (ru ? 'Началась новая неделя. Выберите обновлённый пробник.' : 'Жаңа апта басталды. Жаңартылған сынақты таңдаңыз.')
          : (ru ? 'Не удалось запустить тест. Попробуй ещё раз.' : 'Сынақ басталмады. Қайта көр.'));
      }
    }
    finally { if (active()) { startingRef.current = false; setStarting(false); } }
  }

  async function submit() {
    // Может позвать и кнопка «Завершить», и таймер по истечении времени —
    // защита от двойной отправки (и задвоенной записи в истории результатов).
    const run = runRef.current;
    if (!isCurrent() || !run || run.uid !== uid || run.result || submittingRef.current) return;
    if (!run.submission) {
      const frozen = changeRun({ submission: { answers: { ...run.answers } } });
      if (!frozen) return;
    }
    const snapshot = runRef.current.submission.answers;
    submittingRef.current = true;
    setSaveState('saving');
    clearInterval(tick.current);
    let r;
    try {
      r = await mockSubmit(run.id, snapshot);
      if (!r) throw new Error('missing_exam');
    } catch {
      submittingRef.current = false;
      if (isCurrent()) { setSaveState('error'); setStartError(ru ? 'Не удалось проверить тест. Повтори завершение.' : 'Сынақ тексерілмеді. Аяқтауды қайтала.'); }
      return;
    }
    if (!isCurrent() || runRef.current?.id !== run.id) return;
    changeRun({ result: r, pending: null, pausedAt: null });
    pendingSave.current = null;
    setSaveState('saved');
  }

  function resumeExam() {
    const run = runRef.current;
    if (!run || run.pausedAt == null) return;
    const duration = Math.max(0, Date.now() - run.pausedAt);
    changeRun({ pausedAt: null, pausedMs: run.pausedMs + duration, deadline: run.deadline + duration });
  }

  useScreenStart(`${school}:${!!test}:${i}:${pause}:${!!result}`, test && !result && !pause ? '.mock-question-panel' : undefined);

  function goToQuestion(index) {
    const run = runRef.current;
    if (!run || run.result || mockRemaining(run) <= 0 || index < 0 || index >= run.test.questions.length) return;
    changeRun({ index });
  }

  const formatLabel = (value) => `${value.count} ${ru ? 'заданий' : 'тапсырма'} · ${value.timeLimitMin} ${ru ? 'мин' : 'мин'}`;
  const shortenedLabel = ru ? 'Сокращённый вариант: не все разделы банка заполнены' : 'Қысқартылған нұсқа: банктің кейбір бөлімдері әлі толық емес';
  const recoveryNotice = !recoveryAvailable && <p role="alert">{ru ? 'Автосохранение в этой вкладке недоступно. Не обновляй страницу и не переходи в другой раздел до сохранения результата.' : 'Бұл қойындыда автоматты сақтау қолжетімсіз. Нәтиже сақталғанша бетті жаңартпа және басқа бөлімге өтпе.'}</p>;
  const startNotice = <>{recoveryNotice}{startError && <p role="alert">{startError}</p>}{starting && <p role="status">{ru ? 'Подготавливаем тест…' : 'Сынақ дайындалуда…'}</p>}</>;

  const back = () => {
    if (!isCurrent() || pendingSave.current || saveState !== 'saved') return;
    if (!clearMockSession(uid, runRef.current?.id)) setRecoveryAvailable(false);
    runRef.current = null;
    setTest(null); setResult(null); setMeta(null); setSchool(null);
    setPause(false); setIsDiagnosticRun(false);
  };

  const proUnlockHint = () => {
    alert(t('diag.parentPro'));
  };

  async function buyWeeklyAccess() {
    if (paying) return;
    setPaying(true); setStartError('');
    try {
      const value = await weeklyMockCheckout();
      if (value.access) { setLoadRetry((revision) => revision + 1); return; }
      if (typeof value.url !== 'string' || !/^https:\/\//.test(value.url)) throw new Error('unsafe_checkout');
      window.location.assign(value.url);
    } catch {
      setStartError(ru ? 'Не удалось открыть оплату. Попробуйте ещё раз или обратитесь в поддержку.' : 'Төлемді ашу мүмкін болмады. Қайта көріңіз немесе қолдау қызметіне жазыңыз.');
    } finally { if (isCurrent()) setPaying(false); }
  }

  if (!sessionReady || (runRef.current && runRef.current.uid !== uid)) return <main><BrandLoader /></main>;
  if (recoveryError) return <main><p role="alert">{ru ? 'Не удалось восстановить сохранённый пробник. Он не удалён. Попробуй ещё раз или явно начни заново.' : 'Сақталған сынақты қалпына келтіру мүмкін болмады. Ол жойылған жоқ. Қайта көр немесе жаңадан баста.'}</p>
    <button type="button" className="btn" onClick={() => setRecoveryRetry((value) => value + 1)}>{ru ? 'Повторить' : 'Қайталау'}</button>
    <button type="button" className="btn ghost" onClick={() => {
      if (discardMockSession(uid)) setRecoveryRetry((value) => value + 1);
      else setRecoveryAvailable(false);
    }}>{ru ? 'Удалить сохранённый пробник' : 'Сақталған сынақты жою'}</button>{recoveryNotice}</main>;

  if (!school && loadError) return <main><p role="alert">{ru ? 'Не удалось загрузить тесты, подписку или прогресс. Проверь соединение.' : 'Сынақтар, жазылым немесе прогресс жүктелмеді. Байланысты тексер.'}</p>
    <button className="btn" onClick={() => setLoadRetry((value) => value + 1)}>{ru ? 'Повторить' : 'Қайталау'}</button></main>;
  if (!school && (loading || pro === null || weekly === null)) return <main><BrandLoader /></main>;

  if (!school) return <MockCatalog schools={schools} weekly={weekly} lang={lang} starting={starting} paying={paying}
    onStart={startExam} onBuy={buyWeeklyAccess} onRefresh={() => setLoadRetry((value) => value + 1)} notice={startNotice} />;

  if (test && pause) return (
    <main style={{ textAlign: 'center', paddingTop: 60 }}>
      {recoveryNotice}
      <p className="kicker">{t('ui.61')}</p>
      <h1 style={{ marginBottom: 8 }}>{t('ui.62')}</h1>
      <p className="muted" style={{ maxWidth: 380, margin: '0 auto 24px' }}>{t('ui.63')}</p>
      <button type="button" className="btn" onClick={resumeExam}>{t('ui.64')}</button>
      <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>{t('ui.65')}</p>
    </main>
  );

  if (result) return <MockResults key={runRef.current?.id} result={result} test={test} school={school} lang={lang} onBack={back}>
    {recoveryNotice}
    {diagnosis && <DiagnosisReport diagnosis={diagnosis} pro onUnlock={proUnlockHint} onTrainTopic={onTrainTopic} />}
  </MockResults>;

  const q = test.questions[i];
  const toggleFlag = () => changeRun({ flags: { ...runRef.current.flags, [q.num]: !runRef.current.flags[q.num] } });
  const pick = value => {
    const run = runRef.current;
    if (run && !run.submission && mockRemaining(run) > 0) changeRun({ answers: { ...run.answers, [q.num]: value } });
  };
  const answeredCount = test.questions.filter(question => hasMockAnswer(answers[question.num])).length;
  const unavailable = left <= 0 || !!runRef.current?.submission || saveState === 'saving';

  return <main className="mock-experience mock-exam-page">
    {startNotice}
    <div className="mock-page-heading"><div><span className="mock-eyebrow">SYNAQ · {ru ? 'ПРОБНЫЙ ТЕСТ' : 'СЫНАҚ ТЕСТІ'}</span><h1>{meta.school}</h1><p>{ru ? 'Решай в удобном порядке. Ответы сохраняются в этой вкладке.' : 'Өзіңе ыңғайлы ретпен шеш. Жауаптар осы қойындыда сақталады.'}</p></div>
      <div className="mock-exam-title-actions"><button type="button" className="clock" aria-label={ru ? 'Показать или скрыть таймер' : 'Таймерді көрсету немесе жасыру'} onClick={() => changeRun({ hideTimer: !hideTimer })}>{hideTimer ? (ru ? 'Показать время' : 'Уақытты көрсету') : formatExamTimer(left, lang)}</button><button type="button" className="btn" disabled={saveState === 'saving'} onClick={submit}>{saveState === 'saving' ? (ru ? 'Сохраняем…' : 'Сақталуда…') : (ru ? 'Завершить тест' : 'Сынақты аяқтау')}</button></div>
    </div>
    {test.shortened && <p className="mock-empty-note">{shortenedLabel} · {formatLabel(test)}</p>}
    {left <= 0 && <p className="mock-empty-note" role="status">{ru ? 'Время закончилось. Заверши тест, чтобы сохранить и разобрать ответы.' : 'Уақыт аяқталды. Жауаптарды сақтап, талдау үшін сынақты аяқта.'}</p>}
    <div className="mock-exam-progress"><span>{ru ? 'Твой прогресс' : 'Сенің прогресің'}</span><strong>{answeredCount} / {test.questions.length} {ru ? 'ответов' : 'жауап'}</strong></div>
    <div className="mock-exam-progress-bar" style={{ marginBottom: 22 }}><i style={{ width: `${answeredCount / test.questions.length * 100}%` }} /></div>
    <div className="mock-workspace">
      <MockQuestionNavigator questions={test.questions} selectedIndex={i} onSelect={goToQuestion} lang={lang} disabled={unavailable} flags={flags} statusFor={question => hasMockAnswer(answers[question.num]) ? 'answered' : 'unanswered'} />
      <section className="mock-question-panel">
        <div className="mock-question-heading"><div><span>{mockSubjectLabel(q.subject || 'math', lang)}</span><h2>{ru ? 'Задание' : 'Тапсырма'} {q.num}</h2></div><button type="button" disabled={unavailable} className={'flagbtn' + (flags[q.num] ? ' on' : '')} onClick={toggleFlag}><span aria-hidden="true">⚑</span> {ru ? 'Отметить' : 'Белгілеу'}</button></div>
        <MockTask question={q} lang={lang} value={answers[q.num] || ''} onPick={pick} disabled={unavailable} />
        <div className="mock-question-footer"><button type="button" className="btn ghost" disabled={i === 0 || unavailable} onClick={() => goToQuestion(i - 1)}>← {ru ? 'Назад' : 'Артқа'}</button><span>{i + 1} / {test.questions.length}</span>{i + 1 < test.questions.length ? <button type="button" className="btn" disabled={unavailable} onClick={() => goToQuestion(i + 1)}>{ru ? 'Далее' : 'Келесі'} →</button> : <button type="button" className="btn" disabled={saveState === 'saving'} onClick={submit}>{ru ? 'Завершить' : 'Аяқтау'}</button>}</div>
      </section>
    </div>
  </main>;
}
