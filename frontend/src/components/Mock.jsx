import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLang } from '../i18n.jsx';
import { translateQuestions } from '../translateQuestions.js';
import { mockCatalog, mockResume, mockStart, mockSubmit, reviewQuestionIds } from '../mockApi.js';
import { loadTopicCatalog } from '../topicCatalog.js';
import { auth, watchPro, getDiagnosticStatus, getMocks } from '../firebase.js';
import { buildDiagnosis } from '../diagnosis.js';
import Explain from './Explain.jsx';
import BrandLoader from './BrandLoader.jsx';
import DiagnosisReport from './DiagnosisReport.jsx';
import { Kolhar } from './Training.jsx';
import { readMockSession, writeMockSession, clearMockSession, discardMockSession, mockRemaining,
  readMockStart, writeMockStart, clearMockStart } from '../mockPersistence.js';

const LT = ['A', 'B', 'C', 'D', 'E'];

const recentKey = (school, type) => `synaq_recent_${type}_${school}`;
const readRecent = (school, type) => {
  try { const value = JSON.parse(localStorage.getItem(recentKey(school, type)) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
};
const rememberRecent = (school, type, values, limit) => {
  try {
    const merged = [...new Set([...values, ...readRecent(school, type)])].slice(0, limit);
    localStorage.setItem(recentKey(school, type), JSON.stringify(merged));
  } catch {}
};

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

const Stmt = ({ text }) => (
  <>
    {String(text || '').split(/\n{2,}/).map((p, i) => (
      <p className="stmt" key={i} style={i ? { marginTop: 14 } : undefined}>{p}</p>
    ))}
  </>
);

export default function Mock({ onTrainTopic, onGoProgress }) {
  const { t, lang } = useLang();
  const ru = lang === 'ru';
  const uid = auth.currentUser?.uid || null;
  const [schools, setSchools] = useState([]);
  const [school, setSchool] = useState(null);
  const [pause, setPause] = useState(false);
  const [pro, setPro] = useState(null);
  const [diagUsed, setDiagUsed] = useState(null);
  const [topics, setTopics] = useState([]);
  const [test, setTest] = useState(null);
  const [meta, setMeta] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [hideTimer, setHideTimer] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [open_, setOpen] = useState(null);
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
    setHideTimer(!!record.hideTimer); setNavOpen(!!record.navOpen);
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
        if (!record && !resumed.completed) {
          const questions = await translateQuestions(resumed.test.questions, lang);
          record = { uid, id: interruptedStart.id, school: interruptedStart.school,
            test: { ...resumed.test, questions }, meta: { school: interruptedStart.school,
              sections: resumed.test.sections, diagnostic: resumed.diagnostic },
            isDiagnosticRun: resumed.diagnostic, answers: {}, flags: {}, index: 0,
            startedAt: resumed.startedAt, deadline: resumed.deadline, pausedAt: null, pausedMs: 0,
            hideTimer: false, navOpen: false, result: null, pending: null };
          setRecoveryAvailable(writeMockSession(record));
          clearMockStart(uid, interruptedStart.id);
        }
        if (resumed.completed) {
          if (!record) throw new Error('completed_start_without_journal');
          record = { ...record, result: resumed.result, pending: null };
        } else {
          const questions = await translateQuestions(resumed.test.questions, lang);
          record = { ...record, test: { ...resumed.test, questions },
            isDiagnosticRun: resumed.diagnostic, startedAt: resumed.startedAt,
            deadline: resumed.deadline, pending: null };
        }
        if (!alive || !isCurrent()) return;
        applyRun(record);
        setSaveState(record.result ? 'saved' : 'idle');
      } catch (error) {
        if (interruptedStart && error?.status === 404) clearMockStart(uid, interruptedStart.id);
        else if (alive && isCurrent()) setRecoveryError('restore');
      } finally {
        if (alive && isCurrent()) setSessionReady(true);
      }
    })();
    return () => { alive = false; };
  }, [uid, recoveryRetry, lang]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setLoadError(false); setPro(null); setDiagUsed(null);
    if (!uid) { setLoadError(true); setLoading(false); return; }
    const stop = watchPro(uid, (value) => { if (alive && isCurrent()) setPro(value); }, () => {
      if (alive && isCurrent()) { setLoadError(true); setPro(null); }
    });
    Promise.all([mockCatalog(), loadTopicCatalog(), getDiagnosticStatus(uid)]).then(([list, topics, diagnostic]) => {
      if (alive && isCurrent()) {
        setSchools(list); setTopics(topics);
        setDiagUsed((used) => used === true || diagnostic.used);
      }
    }).catch(() => { if (alive && isCurrent()) setLoadError(true); })
      .finally(() => { if (alive && isCurrent()) setLoading(false); });
    return () => { alive = false; stop(); };
  }, [uid, loadRetry]);

  // Держим submitRef синхронным со «свежим» submit на каждый рендер.
  useEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    if (!sessionReady || !test || result || pause || deadlineRef.current == null) return;
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

  async function startExam(code, diagnostic = false) {
    if (!isCurrent() || startingRef.current || !sessionReady || recoveryError || runRef.current
      || pro === null || diagUsed === null || (!pro && diagUsed)) return;
    startingRef.current = true; setStarting(true); setStartError('');
    const generation = generationRef.current;
    const active = () => isCurrent() && generationRef.current === generation;
    try {
    const history = uid ? (await getMocks(uid)).filter((item) => item.school === code) : [];
    if (!active()) return;
    const excludeQuestionIds = [
      ...readRecent(code, 'questions'),
      ...history.flatMap((m) => reviewQuestionIds(m.review || [])),
    ];
    const reserved = readMockStart(uid);
    const requestId = reserved?.school === code ? reserved.id : crypto.randomUUID();
    if (!reserved && !writeMockStart({ uid, id: requestId, school: code })) setRecoveryAvailable(false);
    const started = await mockStart({ id: requestId, school: code, excludeQuestionIds });
    const v = started.test;
    if (!v) throw new Error('empty_exam');
    const qs = await translateQuestions(v.questions, lang);
    if (!active()) return;
    rememberRecent(code, 'questions', v.questions.map((q) => q.id).filter(Boolean), 600);
    const startedNow = started.startedAt;
    const freeRun = started.diagnostic;
    const record = {
      uid, id: requestId, school: code, test: { ...v, questions: qs },
      meta: { school: code, sections: v.sections, diagnostic: freeRun }, isDiagnosticRun: freeRun,
      answers: {}, flags: {}, index: 0, startedAt: startedNow,
      deadline: started.deadline, pausedAt: null, pausedMs: 0,
      hideTimer: false, navOpen: false, result: null, pending: null,
    };
    setRecoveryAvailable(writeMockSession(record));
    clearMockStart(uid, requestId);
    applyRun(record); setSaveState('idle');
    } catch (error) {
      if (error?.status >= 400 && error.status < 500 && error.status !== 409) clearMockStart(uid, readMockStart(uid)?.id);
      if (active()) setStartError(ru ? 'Не удалось запустить тест. Попробуй ещё раз.' : 'Сынақ басталмады. Қайта көр.');
    }
    finally { if (active()) { startingRef.current = false; setStarting(false); } }
  }

  async function submit() {
    // Может позвать и кнопка «Завершить», и таймер по истечении времени —
    // защита от двойной отправки (и задвоенной записи в истории результатов).
    const run = runRef.current;
    if (!isCurrent() || !run || run.uid !== uid || run.result || submittingRef.current) return;
    submittingRef.current = true;
    clearInterval(tick.current);
    let r;
    try {
      r = await mockSubmit(run.id, run.answers);
      if (!r) throw new Error('missing_exam');
    } catch {
      submittingRef.current = false;
      if (isCurrent()) setStartError(ru ? 'Не удалось проверить тест. Повтори завершение.' : 'Сынақ тексерілмеді. Аяқтауды қайтала.');
      return;
    }
    if (!isCurrent() || runRef.current?.id !== run.id) return;
    changeRun({ result: r, pending: null, pausedAt: null });
    if (!clearMockSession(uid, run.id)) setRecoveryAvailable(false);
    pendingSave.current = null;
    if (run.isDiagnosticRun) setDiagUsed(true);
    setSaveState('saved');
  }

  function resumeExam() {
    const run = runRef.current;
    if (!run || run.pausedAt == null) return;
    const duration = Math.max(0, Date.now() - run.pausedAt);
    changeRun({ pausedAt: null, pausedMs: run.pausedMs + duration, deadline: run.deadline + duration });
  }

  function goToQuestion(index) {
    const run = runRef.current;
    if (!run || run.result || mockRemaining(run) <= 0 || index < 0 || index >= run.test.questions.length) return;
    const cur = run.test.questions[run.index]?.section;
    const nxt = run.test.questions[index]?.section;
    changeRun({ index, navOpen: false, pausedAt: index > run.index && nxt && cur && nxt !== cur ? Date.now() : null });
  }

  const formatLabel = (value) => `${value.count} ${ru ? 'заданий' : 'тапсырма'} · ${value.timeLimitMin} ${ru ? 'мин' : 'мин'}`;
  const shortenedLabel = ru ? 'Сокращённый вариант: не все разделы банка заполнены' : 'Қысқартылған нұсқа: банктің кейбір бөлімдері әлі толық емес';
  const recoveryNotice = !recoveryAvailable && <p role="alert">{ru ? 'Автосохранение в этой вкладке недоступно. Не обновляй страницу и не переходи в другой раздел до сохранения результата.' : 'Бұл қойындыда автоматты сақтау қолжетімсіз. Нәтиже сақталғанша бетті жаңартпа және басқа бөлімге өтпе.'}</p>;
  const startNotice = <>{recoveryNotice}{startError && <p role="alert">{startError}</p>}{starting && <p role="status">{ru ? 'Подготавливаем тест…' : 'Сынақ дайындалуда…'}</p>}</>;

  const back = () => {
    if (!isCurrent() || pendingSave.current || saveState !== 'saved') return;
    runRef.current = null;
    setTest(null); setResult(null); setMeta(null); setSchool(null);
    setPause(false); setIsDiagnosticRun(false);
  };

  const proUnlockHint = () => {
    alert(t('diag.parentPro'));
  };

  if (!sessionReady || (runRef.current && runRef.current.uid !== uid)) return <main><BrandLoader /></main>;
  if (recoveryError) return <main><p role="alert">{ru ? 'Не удалось восстановить сохранённый пробник. Он не удалён. Попробуй ещё раз или явно начни заново.' : 'Сақталған сынақты қалпына келтіру мүмкін болмады. Ол жойылған жоқ. Қайта көр немесе жаңадан баста.'}</p>
    <button type="button" className="btn" onClick={() => setRecoveryRetry((value) => value + 1)}>{ru ? 'Повторить' : 'Қайталау'}</button>
    <button type="button" className="btn ghost" onClick={() => {
      if (discardMockSession(uid)) setRecoveryRetry((value) => value + 1);
      else setRecoveryAvailable(false);
    }}>{ru ? 'Удалить сохранённый пробник' : 'Сақталған сынақты жою'}</button>{recoveryNotice}</main>;

  if (!school && loadError) return <main><p role="alert">{ru ? 'Не удалось загрузить тесты, подписку или прогресс. Проверь соединение.' : 'Сынақтар, жазылым немесе прогресс жүктелмеді. Байланысты тексер.'}</p>
    <button className="btn" onClick={() => setLoadRetry((value) => value + 1)}>{ru ? 'Повторить' : 'Қайталау'}</button></main>;
  if (!school && (loading || pro === null || diagUsed === null)) return <main><BrandLoader /></main>;

  // ── тегін: диагностикалық сынақ немесе Pro upsell ──
  if (!school && pro === false && diagUsed !== null) {
    if (!diagUsed) {
      return (
        <main>
          {startNotice}
          <p className="kicker">{t('diag.freeMock')}</p>
          <h1>{t('diag.freeMockTitle')}</h1>
          <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>{t('diag.freeMockSub')}</p>
          <div className="list" style={{ marginTop: 16 }}>
            {schools.map((s) => (
              <div className="row-item" key={s.code}
                onClick={() => s.ready && !starting && startExam(s.code, true)}
                style={{ opacity: s.ready ? 1 : 0.5, cursor: s.ready ? 'pointer' : 'default' }}>
                <div style={{ flex: 1 }}><b>{s.code}</b><p className="muted">{formatLabel(s)}</p>{s.shortened && <small>{shortenedLabel} ({s.count}/{s.targetCount})</small>}</div>
                <span className="rt">{s.ready ? t('diag.startFree') : t('ui.60')}</span>
              </div>
            ))}
          </div>
        </main>
      );
    }
    return (
      <main>
        <p className="kicker">{t('ui.11')}</p>
        <h1>{t('ui.12')}</h1>
        <div className="card" style={{ marginTop: 18, borderColor: 'var(--accent)' }}>
          <p className="kicker" style={{ color: 'var(--accent)', margin: '0 0 8px' }}>{t('diag.doneFree')}</p>
          <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.6 }}>{t('diag.doneFreeSub')}</p>
          {onGoProgress && (
            <button type="button" className="btn accent" style={{ marginBottom: 10 }} onClick={onGoProgress}>
              {t('diag.viewInProgress')}
            </button>
          )}
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>{t('diag.parentPro')}</p>
        </div>
      </main>
    );
  }

  if (!school && pro === null) {
    return <main><BrandLoader /></main>;
  }

  if (!school) return (
    <main>
      {startNotice}
      <p className="kicker">{t('ui.11')}</p>
      <h1>{t('ui.12')}</h1>
      <p className="muted" style={{ marginTop: 6 }}>{t('ui.13')}</p>
      <div className="list" style={{ marginTop: 16 }}>
        {schools.map((s) => (
          <div className="row-item" key={s.code}
            onClick={() => s.ready && !starting && startExam(s.code, false)}
            style={{ opacity: s.ready ? 1 : 0.5, cursor: s.ready ? 'pointer' : 'default' }}>
            <div style={{ flex: 1 }}><b>{s.code}</b><p className="muted">{formatLabel(s)}</p>{s.shortened && <small>{shortenedLabel} ({s.count}/{s.targetCount})</small>}</div>
            <span className="rt">{s.ready ? '→' : t('ui.60')}</span>
          </div>
        ))}
      </div>
    </main>
  );

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

  if (result) return (
    <main>
      {recoveryNotice}
      {test.shortened && <p className="muted">{shortenedLabel} ({test.questions.length}/{test.targetCount})</p>}
      <p className="kicker">{t('diag.result')} · {meta.school}</p>
      <div className="hero-card" style={{ marginBottom: 18 }}>
        {result.scoring === 'bil' ? (
          <>
            <div style={{ font: "700 44px 'Lora',serif", lineHeight: 1 }}>
              {result.points}<span style={{ fontSize: 20, color: '#9A9384' }}> / {result.maxPoints}</span>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 14 }}>
              {result.score} {t('diag.correctShort')}, {result.wrong} {t('diag.wrong')}
            </p>
          </>
        ) : (
          <>
            <div style={{ font: "700 44px 'Lora',serif", lineHeight: 1 }}>
              {result.score}<span style={{ fontSize: 20, color: '#9A9384' }}> / {result.gradable}</span>
            </div>
            <p style={{ margin: '10px 0 0' }}>{t('ui.18')}</p>
          </>
        )}
      </div>

      {diagnosis && (
        <DiagnosisReport
          diagnosis={diagnosis}
          pro={!!pro}
          onUnlock={proUnlockHint}
          onTrainTopic={pro ? onTrainTopic : undefined}
        />
      )}

      {pro && (
        <>
          <p className="kicker" style={{ marginTop: 22 }}>{t('ui.19')}</p>
          <div className="list">
            {result.review.map((r) => {
              const on = open_ === r.num;
              return (
                <div key={r.num} style={{ borderBottom: '1px solid var(--line)' }}>
                  <div onClick={() => setOpen(on ? null : r.num)}
                    style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '14px 0', cursor: 'pointer' }}>
                    <span style={{ font: "600 13px 'IBM Plex Mono',monospace", color: r.correct ? '#4C7A4E' : '#B0342B' }}>
                      {r.correct ? '✓' : '✗'} №{r.num}
                    </span>
                    <span className="muted" style={{ fontSize: 13, flex: 1 }}>
                      «{r.your ?? '—'}» · «{r.answer ?? '?'}»
                    </span>
                    <span className="muted" style={{ fontSize: 13 }}>{on ? '▲' : '▼'}</span>
                  </div>
                  {on && (
                    <div style={{ padding: '0 0 16px' }}>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{r.statement}</p>
                      {r.image && <img className="fig" src={r.image} alt="" />}
                      {r.solution && <p className="muted" style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.55 }}>{r.solution}</p>}
                      <Explain q={r} given={r.correct ? null : r.your} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <button type="button" className="btn ghost" disabled={saveState === 'saving' || saveState === 'error'} style={{ marginTop: 16 }} onClick={back}>{t('ui.21')}</button>
    </main>
  );

  const q = test.questions[i];
  const toggleFlag = () => changeRun({ flags: { ...runRef.current.flags, [q.num]: !runRef.current.flags[q.num] } });
  const pick = (val) => { if (mockRemaining(runRef.current) > 0) changeRun({ answers: { ...runRef.current.answers, [q.num]: val } }); };
  const answered = (n) => answers[n] != null && answers[n] !== '';

  return (
    <main>
      {startNotice}
      {left <= 0 && <button type="button" className="btn accent" onClick={submit}>{ru ? 'Завершить и сохранить результат' : 'Аяқтау және нәтижені сақтау'}</button>}
      {test.shortened && <p className="muted">{shortenedLabel} · {formatLabel(test)}</p>}
      <div className="exam-top">
        <span className="ttl">{meta.title || meta.school}</span>
        <span className="clock" onClick={() => changeRun({ hideTimer: !hideTimer })} style={{ cursor: 'pointer' }}>
          {hideTimer ? '⏱' : formatExamTimer(left, lang)}
        </span>
      </div>

      {isDiagnosticRun && !pro && (
        <p className="pill" style={{ marginBottom: 12 }}>{t('diag.freeMockBadge')}</p>
      )}

      <div className="qhead">
        <span className="qnum-chip">{q.num}</span>
        <button type="button" className={'flagbtn' + (flags[q.num] ? ' on' : '')} onClick={toggleFlag}>
          <span className="fl">⚑</span> {t('diag.flag')}
        </button>
      </div>

      {q.subject === 'kolzar' ? (
        <Kolhar q={q} answer={answers[q.num]} onPick={pick} disabled={left <= 0} correct={null} />
      ) : (
        <>
          <Stmt text={q.statement} />
          {q.image && <img className="fig" src={q.image} alt="" />}
          {q.options ? (
            <div className="opts">
              {q.options.map((o, k) => (
                <button type="button" key={k} disabled={left <= 0} className={'opt' + (answers[q.num] === o ? ' sel' : '')} onClick={() => pick(o)}>
                  <span className="lt">{LT[k]}</span><span>{o}</span>
                </button>
              ))}
            </div>
          ) : (
            <input disabled={left <= 0} value={answers[q.num] || ''} onChange={(e) => pick(e.target.value)} placeholder={t('ui.24')} />
          )}
        </>
      )}

      {navOpen && (
        <div className="qgrid" style={{ marginTop: 18 }}>
          {test.questions.map((qq, k) => (
            <div key={qq.num}
              className={'qcell' + (answered(qq.num) ? ' done' : '') + (k === i ? ' cur' : '') + (flags[qq.num] ? ' flag' : '')}
              onClick={() => goToQuestion(k)}>{qq.num}</div>
          ))}
        </div>
      )}

      <div className="navbar">
        <button type="button" className="btn ghost" disabled={i === 0 || left <= 0} onClick={() => goToQuestion(i - 1)}>{t('ui.22')}</button>
        <button type="button" className="navpill" onClick={() => changeRun({ navOpen: !navOpen })}>{i + 1} / {test.questions.length} ▲</button>
        {i + 1 < test.questions.length
          ? <button type="button" className="btn" disabled={left <= 0} onClick={() => goToQuestion(i + 1)}>{t('ui.9')}</button>
          : <button type="button" className="btn accent" onClick={submit}>{t('ui.23')}</button>}
      </div>
    </main>
  );
}
