import React, { useEffect, useState, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { translateQuestions } from '../translateQuestions.js';
import { auth, startLearningSession, saveAttempt, getSolved, setFlag, getFlags, watchPro, todayCount,
  getTrainingTopics, getTrainingQuestions } from '../firebase.js';
import { readPendingTraining, writePendingTraining, clearPendingTraining, trainingDayKey, trainingQuestion } from '../trainingPersistence.js';
import Explain from './Explain.jsx';
import AiTutor from './AiTutor.jsx';

const LT = ['A', 'B', 'C', 'D', 'E'];
// Блоки раздельно: язык и математика в одной ленте — бессмыслица.
// Заголовок — через t(), чтобы шёл за выбранным языком интерфейса (не только сами задачи).
const BLOCKS = [
  { id: 'math',     titleKey: 'ui.68', only: null },
  { id: 'logic',    titleKey: 'ui.69', only: null },
  { id: 'lang_kaz', titleKey: 'ui.70', only: 'lang_kaz' },
  { id: 'lang_rus', titleKey: 'ui.71', only: 'lang_rus' },
  { id: 'lang_eng', titleKey: 'ui.72', only: 'lang_eng' },
];
// id → тема, чтобы не фильтровать весь пул на каждый рендер


// ── КОЛХАР: екі баған + салыстыру батырмалары ──
// statement форматы: "Салыстыр...:\n[ортақ шарт]\nА) ...\nВ) ..."
// Шартты абзацтарға бөліп шығарамыз (тілдік есептерде мәтін мен сұрақ бөлек тұрады).
const Stmt = ({ text }) => (
  <>
    {String(text || '').split(/\n{2,}/).map((p, i) => (
      <p className="stmt" key={i} style={i ? { marginTop: 14 } : undefined}>{p}</p>
    ))}
  </>
);

export const showTrainingLimit = (pro, done, checked, limit = 5) => pro === false && done >= limit && !checked;

export function trainingLoadErrorText(code, ru) {
  if (code === 'learning/server_not_configured') {
    return ru
      ? 'Сервер проверки прогресса не настроен. Для локальной разработки добавьте Firebase Admin в корневой .env или запустите demo-режим.'
      : 'Прогресті тексеру сервері бапталмаған. Жергілікті әзірлеу үшін түбірдегі .env файлына Firebase Admin деректерін қосыңыз немесе demo режимін іске қосыңыз.';
  }
  if (code === 'learning/auth-required') {
    return ru ? 'Сессия входа закончилась. Войдите в аккаунт заново.' : 'Кіру сессиясы аяқталды. Аккаунтқа қайта кіріңіз.';
  }
  return ru
    ? 'Не удалось загрузить задачи, подписку или прогресс. Проверьте соединение.'
    : 'Есептер, жазылым немесе прогресс жүктелмеді. Байланысты тексеріңіз.';
}

export function Kolhar({ q, answer, onPick, disabled, correct }) {
  const { lang } = useLang();
  const ru = lang === 'ru';
  const lines = (q.statement || '').split('\n');
  const a = (lines.find((l) => l.startsWith('А)')) || '').slice(2).trim();
  const b = (lines.find((l) => l.startsWith('В)')) || '').slice(2).trim();
  const note = lines.slice(1).filter((l) => !l.startsWith('А)') && !l.startsWith('В)')).join(' ').trim();

  // «А» = А үлкен, «В» = В үлкен, «Тең» = тең
  const BTN = [
    { v: 'А',   sign: '>', label: ru ? 'А больше' : 'А үлкен' },
    { v: 'Тең', sign: '=', label: ru ? 'Равны' : 'Тең' },
    { v: 'В',   sign: '<', label: ru ? 'В больше' : 'В үлкен' },
  ];
  if (q.options?.includes('Анықтау мүмкін емес')) {
    BTN.push({ v: 'Анықтау мүмкін емес', sign: '?', label: ru ? 'Нельзя определить' : 'Анықтау мүмкін емес' });
  }

  const col = {
    flex: '1 1 200px', minWidth: 200, background: '#fff', border: '1px solid var(--line)',
    borderRadius: 12, padding: '18px 18px 20px',
  };
  const tag = {
    font: "700 12px 'IBM Plex Mono',monospace", letterSpacing: '.14em',
    color: '#B0342B', display: 'block', marginBottom: 10,
  };

  return (
    <div>
      {note && <p className="muted" style={{ margin: '0 0 12px', fontSize: 14 }}>{note}</p>}

      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={col}><span style={tag}>А</span>
          <span style={{ fontSize: 16, lineHeight: 1.5 }}>{a}</span></div>
        <div style={col}><span style={tag}>В</span>
          <span style={{ fontSize: 16, lineHeight: 1.5 }}>{b}</span></div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {BTN.map((o) => {
          const sel = answer === o.v;
          const good = disabled && o.v === q.answer;
          const bad = disabled && sel && correct === false;
          return (
            <button key={o.v} disabled={disabled} onClick={() => onPick(o.v)}
              style={{
                flex: o.sign === '?' ? '1 1 100%' : 1, minWidth: 90, padding: '14px 10px',
                borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
                border: '1px solid ' + (good ? '#4C7A4E' : bad ? '#B0342B' : sel ? 'var(--ink)' : 'var(--line)'),
                background: good ? 'rgba(76,122,78,.12)' : bad ? 'rgba(176,52,43,.1)' : sel ? 'var(--ink)' : '#fff',
                color: good ? '#2F5A31' : bad ? '#B0342B' : sel ? 'var(--bg)' : 'var(--ink)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
              <span style={{ font: "700 22px 'Lora',serif", lineHeight: 1 }}>{o.sign}</span>
              <span style={{ font: "600 12.5px 'Golos Text'" }}>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Training({ onXp, startTopicId, onTopicOpened }) {
  const { t, lang } = useLang();
  const ru = lang === 'ru';
  const topicName = (value) => ru ? value.nameRu || value.name : value.name;
  const [topics, setTopics] = useState([]);
  const [solved, setSolved] = useState(new Set());
  const [solvedIn, setSolvedIn] = useState({});
  const [flags, setFlags] = useState(new Set());
  const [topic, setTopic] = useState(null);
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [secs, setSecs] = useState(0);
  const [pro, setPro] = useState(null);
  const [done, setDone] = useState(0);
  const [xpPop, setXpPop] = useState(null);         // бүгін шығарған есеп саны
  const FREE_DAY = 5;                          // тегін тарифте күніне 5 есеп
  const locked = !pro && done >= FREE_DAY;
  const timer = useRef(null);
  const [saveState, setSaveState] = useState('idle');
  const [sessionState, setSessionState] = useState('idle');
  const [sessionNotice, setSessionNotice] = useState('');
  const [serverResult, setServerResult] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorCode, setLoadErrorCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [recoveryAvailable, setRecoveryAvailable] = useState(true);
  const [loadRetry, setLoadRetry] = useState(0);
  const pendingAttempt = useRef(null);
  const questionSession = useRef(null);
  const currentQuestion = useRef(null);
  const savingRef = useRef(false);
  const mounted = useRef(true);
  const topicRequest = useRef(0);
  const dayRef = useRef(trainingDayKey());
  const onXpRef = useRef(onXp);
  onXpRef.current = onXp;
  const uid = auth.currentUser?.uid;
  const questionKey = topic && items[i]?.id ? `${uid}:${topic.id}:${i}:${items[i].id}` : null;
  currentQuestion.current = questionKey;
  // "Тексеру" батырмасы disabled={!answer} шартымен ғана бөгеледі, checked-ке
  // қарамастан — тез қос басу/тап (әсіресе телефонда touchend+click) екі
  // check()-ті бір сұраққа қатар шақырып, XP мен күнделікті лимитті қосарлап
  // санауы мүмкін еді. checkingRef синхронды қорған: setChecked(true)
  // рендерге дейін де екінші шақыруды бірден тоқтатады.
  const checkingRef = useRef(false);
  // startTopicId эффектісі ниже solvedRef арқылы «соңғы» solved-ты оқиды —
  // тікелей solved-ты тәуелділікке қоссақ, әр дұрыс жауаптан кейін бүкіл
  // тәжірибе қайта іске қосылып, ағымдағы сессия үзіліп кетер еді.
  const solvedRef = useRef(solved);
  useEffect(() => { solvedRef.current = solved; });
  useEffect(() => { checkingRef.current = false; }, [i, items]);

  useEffect(() => {
    mounted.current = true;
    const preventLostAnswer = (event) => {
      if (!pendingAttempt.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventLostAnswer);
    return () => {
      mounted.current = false;
      currentQuestion.current = null;
      topicRequest.current++;
      window.removeEventListener('beforeunload', preventLostAnswer);
    };
  }, []);

  useEffect(() => {
    const refreshDay = () => {
      if (trainingDayKey() !== dayRef.current && !pendingAttempt.current) {
        dayRef.current = trainingDayKey();
        setLoadRetry((value) => value + 1);
      }
    };
    const interval = setInterval(refreshDay, 60000);
    window.addEventListener('focus', refreshDay);
    return () => { clearInterval(interval); window.removeEventListener('focus', refreshDay); };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true); setLoadError(false); setLoadErrorCode(''); setPro(null);
    if (!uid) { setLoadErrorCode('learning/auth-required'); setLoadError(true); setLoading(false); return; }
    if ((pendingAttempt.current && pendingAttempt.current.uid !== uid)
      || (questionSession.current && questionSession.current.uid !== uid)) {
      pendingAttempt.current = null; savingRef.current = false;
      questionSession.current = null; currentQuestion.current = null;
      topicRequest.current++;
      setSessionState('idle'); setSessionNotice(''); setServerResult(null);
      setTopic(null); setItems([]); setChecked(false); setSaveState('idle');
    }
    const stop = watchPro(uid, (value) => { if (alive) setPro(value); }, (error) => {
      if (alive) { setLoadErrorCode(error?.code || 'profile-load-failed'); setLoadError(true); setPro(null); }
    });
    const requestedDay = trainingDayKey();
    Promise.all([getTrainingTopics(uid), todayCount(uid), getSolved(uid), getFlags(uid)]).then(async ([list, count, completed, flagged]) => {
      if (!alive) return;
      // The count can finish before midnight while the question bank is still
      // loading. Never label yesterday's exhausted quota as today's count.
      if (requestedDay !== trainingDayKey()) count = await todayCount(uid);
      if (!alive) return;
      dayRef.current = trainingDayKey();
      const completedIds = new Set(completed.map((item) => item.qid));
      const completedByTopic = {};
      completed.forEach((item) => { if (item.topic) completedByTopic[item.topic] = (completedByTopic[item.topic] || 0) + 1; });
      solvedRef.current = completedIds;
      setSolved(completedIds); setSolvedIn(completedByTopic); setDone(count); setFlags(new Set(flagged)); setTopics(list);
      const restored = pendingAttempt.current || readPendingTraining(uid);
      if (restored?.uid === uid) {
        pendingAttempt.current = restored;
        setTopic(restored.topic || list.find((item) => item.id === restored.question.topic) || { id: '_resume', name: t('ui.1') });
        setItems([restored.question]); setI(0); setAnswer(restored.answer);
        setChecked(true); setSecs(0); setServerResult(null);
        checkingRef.current = true;
        persistAttempt();
      }
    }).catch((error) => { if (alive) { setLoadErrorCode(error?.code || 'load-failed'); setLoadError(true); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; stop(); };
  }, [uid, loadRetry]);

  useEffect(() => {
    if (!startTopicId || !topics.length || loading || loadError || pro === null || topic || pendingAttempt.current) return;
    const tp = topics.find((x) => x.id === startTopicId);
    if (!tp) return;
    // Из персонального плана разрешаем открыть рекомендованную тему и на
    // бесплатном тарифе; общий дневной лимит всё равно контролируется ниже.
    let alive = true;
    const request = ++topicRequest.current;
    setOpening(true);
    (async () => {
      // solvedRef.current, не solved: getSolved() әлі жүктеліп үлгермеген
      // болса (сырттан "осы тақырыпты жаттық" сілтемесі бойынша бірден
      // кіргенде), тұйықталған solved әрқашан бос жиын болып қалатын еді —
      // сол кезде бұрын шығарылған есептер қайта көрсетілер еді.
      const list = await translateQuestions(await getTrainingQuestions(uid, {
        topicId: tp.id, excludeIds: solvedRef.current, limit: 60,
      }), lang);
      if (!alive || !mounted.current || request !== topicRequest.current || pendingAttempt.current || auth.currentUser?.uid !== uid) return;
      start(tp, list);
      onTopicOpened?.();
    })().catch((error) => { if (alive && request === topicRequest.current) {
      setLoadErrorCode(error?.code || 'tasks-load-failed'); setLoadError(true);
    } })
      .finally(() => { if (alive && request === topicRequest.current) setOpening(false); });
    return () => {
      alive = false;
      if (request === topicRequest.current) { topicRequest.current++; setOpening(false); }
    };
  }, [startTopicId, topics, lang, onTopicOpened, loading, loadError, pro, topic, uid]);

  useEffect(() => {
    if (!questionKey || checked || loading || opening || pro === null || locked || pendingAttempt.current) return;
    if (['expired', 'limited', 'locked', 'error'].includes(sessionState)) return;
    beginQuestion();
  }, [questionKey, checked, loading, opening, pro, locked]);

  useEffect(() => {
    if (!items.length || checked || sessionState !== 'ready') return;
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [items, i, checked, sessionState]);

  // сколько задач темы уже решено
  // тегін тарифте ашық болатын жалғыз тақырып — тізімдегі біріншісі
  const b0 = topics.length ? topics[0].id : null;

  const start = (tp, list) => {
    if (pendingAttempt.current) return;
    checkingRef.current = false;
    currentQuestion.current = null; questionSession.current = null;
    setSessionState('idle'); setSessionNotice(''); setServerResult(null);
    setTopic(tp); setItems(list.filter((item) => !solvedRef.current.has(item.id)).map(trainingQuestion));
    setI(0); setAnswer(''); setChecked(false); setSecs(0); setSaveState('idle');
  };
  async function openQuestions(tp, getQuestions) {
    if (pendingAttempt.current || savingRef.current) return;
    const request = ++topicRequest.current;
    const owner = auth.currentUser?.uid;
    setOpening(true);
    try {
      const list = await translateQuestions(await getQuestions(), lang);
      if (!mounted.current || request !== topicRequest.current || auth.currentUser?.uid !== owner || pendingAttempt.current) return;
      start(tp, list);
    } catch (error) { if (mounted.current && request === topicRequest.current) {
      setLoadErrorCode(error?.code || 'tasks-load-failed'); setLoadError(true);
    } }
    finally { if (mounted.current && request === topicRequest.current) setOpening(false); }
  }
  const openTopic = (tp) => openQuestions(tp, () => getTrainingQuestions(uid, {
    topicId: tp.id, excludeIds: solvedRef.current, limit: 60,
  }));
  const openMixed = () => openQuestions({ id: '_mix', name: t('ui.3') }, () => getTrainingQuestions(uid, {
    mixed: true, excludeIds: solvedRef.current, limit: 20,
  }));
  const leaveTopic = () => {
    if (pendingAttempt.current || savingRef.current) return;
    topicRequest.current++;
    currentQuestion.current = null; questionSession.current = null;
    setSessionState('idle'); setSessionNotice(''); setServerResult(null);
    setOpening(false); setTopic(null); setItems([]); setChecked(false);
  };
  const next = () => {
    if (pendingAttempt.current || savingRef.current) return;
    checkingRef.current = false;
    currentQuestion.current = null; questionSession.current = null;
    setSessionState('idle'); setSessionNotice(''); setServerResult(null);
    if (i + 1 < items.length) { setI(i + 1); setAnswer(''); setChecked(false); setSecs(0); setSaveState('idle'); }
    else leaveTopic();
  };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  function terminalLearningError(error, attempt) {
    const code = error?.code;
    if (!['learning/daily-limit', 'learning/rate-limit', 'learning/session-expired', 'learning/session-not-found', 'learning/topic-locked'].includes(code)) return false;
    if (attempt) {
      clearPendingTraining(attempt.uid, attempt.id);
      if (pendingAttempt.current === attempt) pendingAttempt.current = null;
    }
    if (questionSession.current) questionSession.current.terminal = true;
    checkingRef.current = false;
    setChecked(false); setServerResult(null); setSaveState('idle');
    setSessionState(['learning/daily-limit', 'learning/rate-limit'].includes(code) ? 'limited' : code === 'learning/topic-locked' ? 'locked' : 'expired');
    setSessionNotice(code);
    return true;
  }

  async function beginQuestion({ fresh = false } = {}) {
    const question = items[i], owner = auth.currentUser?.uid, key = currentQuestion.current;
    if (!question || !key || pendingAttempt.current || checked) return;
    if (!owner || owner !== uid) { setLoadErrorCode('learning/auth-required'); setLoadError(true); return; }
    let scope = questionSession.current;
    if (fresh && scope?.pending) return;
    if (fresh || !scope || scope.key !== key) {
      scope = { key, uid: owner, qid: question.id, id: crypto.randomUUID(), ready: false, pending: false };
      questionSession.current = scope;
    }
    if (scope.ready || scope.pending || scope.terminal) return;
    const isCurrent = () => mounted.current && questionSession.current === scope
      && currentQuestion.current === scope.key && auth.currentUser?.uid === owner;
    scope.pending = true;
    setSessionState('starting'); setSessionNotice('');
    try {
      const result = await startLearningSession(owner, { mode: 'training', qid: scope.qid }, scope.id);
      if (!isCurrent()) return;
      if (result.id !== scope.id || result.question?.id !== scope.qid) throw new Error('invalid_session_response');
      scope.ready = true;
      scope.startedAt = result.startedAt; scope.expiresAt = result.expiresAt;
      setItems((current) => current.map((item, index) => index === i && item.id === scope.qid
        ? { ...trainingQuestion(result.question),
          // Translation changes only visible prose, never submitted option values.
          ...(item.lang && item.lang !== lang ? { statement: item.statement, needsTranslation: item.needsTranslation } : {}) }
        : item));
      setSecs(Number.isFinite(result.startedAt) ? Math.max(0, Math.floor((Date.now() - result.startedAt) / 1000)) : 0);
      setSessionState('ready');
    } catch (error) {
      if (isCurrent() && !terminalLearningError(error)) setSessionState('error');
    } finally { scope.pending = false; }
  }

  async function persistAttempt() {
    if (!pendingAttempt.current || savingRef.current) return;
    const attempt = pendingAttempt.current;
    if (auth.currentUser?.uid !== attempt.uid) { setSaveState('error'); return; }
    savingRef.current = attempt;
    setSaveState('saving');
    const { uid: owner, id } = attempt;
    const isCurrent = () => mounted.current && auth.currentUser?.uid === owner && pendingAttempt.current === attempt;
    try {
      if (!attempt.sessionId) {
        // Recover old local journals by starting a fresh, server-timed session.
        // Client-reported seconds and correctness are deliberately discarded.
        const session = await startLearningSession(owner, { mode: 'training', qid: attempt.question.id }, id);
        if (!isCurrent()) return;
        if (session.id !== id || session.question?.id !== attempt.question.id) throw new Error('invalid_session_response');
        attempt.sessionId = id;
        attempt.payload = { sessionId: id, answer: attempt.answer };
        attempt.question = { ...trainingQuestion(session.question), statement: attempt.question.statement };
        delete attempt.legacy;
        setRecoveryAvailable(writePendingTraining(attempt));
        setSessionNotice('legacy');
      }
      const result = await saveAttempt(owner, { sessionId: attempt.sessionId, answer: attempt.answer }, id);
      if (typeof result.correct !== 'boolean') throw new Error('invalid_attempt_response');
      // A replay may already be included in the loaded daily count. Likewise,
      // midnight can pass while the write is pending: reconcile, do not add 1.
      const reconcile = !result.saved || trainingDayKey() !== dayRef.current;
      const confirmedCount = Number.isSafeInteger(result.count) && result.count >= 0 ? result.count
        : reconcile ? await todayCount(owner) : null;
      clearPendingTraining(owner, id);
      if (!isCurrent()) return;
      pendingAttempt.current = null;
      const gain = result.saved ? result.gain : 0;
      onXpRef.current?.(gain, result.totalXp);
      setServerResult({ correct: result.correct, answer: result.answer, solution: result.solution || '' });
      if (Number.isFinite(result.secs)) setSecs(result.secs);
      const wasSolved = solvedRef.current.has(attempt.question.id);
      solvedRef.current = new Set(solvedRef.current).add(attempt.question.id);
      setSolved(solvedRef.current);
      if (!wasSolved && attempt.question.topic) setSolvedIn((value) => ({
        ...value, [attempt.question.topic]: (value[attempt.question.topic] || 0) + 1,
      }));
      if (gain > 0) { setXpPop(gain); setTimeout(() => { if (mounted.current) setXpPop(null); }, 1800); }
      dayRef.current = trainingDayKey();
      if (confirmedCount != null) setDone(confirmedCount);
      else setDone((value) => value + 1);
      setRecoveryAvailable(true);
      setSaveState('saved');
    } catch (error) { if (isCurrent() && !terminalLearningError(error, attempt)) setSaveState('error'); }
    finally { if (savingRef.current === attempt) savingRef.current = false; }
  }

  function check() {
    if (checkingRef.current || checked || locked || loading || opening || pro === null || pendingAttempt.current || !answer.trim() || !items[i]) return;
    if (!auth.currentUser || auth.currentUser.uid !== uid) { setLoadErrorCode('learning/auth-required'); setLoadError(true); return; }
    const session = questionSession.current;
    if (sessionState !== 'ready' || !session?.ready || session.uid !== uid || session.key !== currentQuestion.current) return;
    checkingRef.current = true;
    const q = items[i];
    setChecked(true); setServerResult(null);
    pendingAttempt.current = { uid: auth.currentUser.uid, id: session.id, sessionId: session.id, question: trainingQuestion(q), answer, topic,
      payload: { sessionId: session.id, answer } };
    setRecoveryAvailable(writePendingTraining(pendingAttempt.current));
    persistAttempt();
  }
  const saveNotice = <>
    {saveState === 'error' ? <p role="alert">{ru ? 'Не удалось подтвердить сохранение ответа. Повтори перед продолжением — ответ не будет засчитан дважды.' : 'Жауаптың сақталғанын растау мүмкін болмады. Жалғастырмас бұрын қайтала — жауап екі рет есептелмейді.'} <button type="button" className="link" onClick={persistAttempt}>{ru ? 'Повторить' : 'Қайталау'}</button></p> : saveState === 'saving' ? <p role="status" className="muted">{ru ? 'Сохраняем ответ…' : 'Жауап сақталуда…'}</p> : null}
    {!recoveryAvailable && pendingAttempt.current && <p role="alert">{ru ? 'Браузер не позволяет сохранить резервную копию. Не закрывай страницу до подтверждения сохранения.' : 'Браузер сақтық көшірмені сақтауға рұқсат бермейді. Сақталғаны расталғанша бетті жаппа.'}</p>}
    {sessionNotice === 'legacy' && <p role="status" className="muted">{ru ? 'Восстановлен ответ из предыдущей версии. Время подготовки считается с новой серверной сессии.' : 'Алдыңғы нұсқадағы жауап қалпына келтірілді. Дайындық уақыты жаңа серверлік сессиядан есептеледі.'}</p>}
  </>;
  function toggleFlag() {
    const q = items[i];
    const on = !flags.has(q.id);
    setFlags((s) => { const n = new Set(s); if (on) n.add(q.id); else n.delete(q.id); return n; });
    if (auth.currentUser) setFlag(auth.currentUser.uid, q.id, on).catch(() => {});
  }

  if (loadError && !checked) return <main><p role="alert">{trainingLoadErrorText(loadErrorCode, ru)}</p>
    <button className="btn" onClick={() => setLoadRetry((value) => value + 1)}>{ru ? 'Повторить' : 'Қайталау'}</button></main>;
  if ((loading || opening || pro === null) && !checked) return <main><p role="status">{t('common.loading')}</p></main>;

  // ── список тем ──
  if (!topic) {
    const Group = ({ title, arr }) => !arr.length ? null : (
      <>
        <div className="row" style={{ margin: '26px 0 12px' }}>
          <span className="kicker" style={{ margin: 0 }}>{title}</span>
        </div>
        <div className="list">
          {arr.map((t, k) => {
            const done = Math.min(solvedIn[t.id] || 0, t.count);
            const pct = Math.round(done / t.count * 100);
            const shut = !pro && !(b0 && t.id === b0);      // тегін тарифте — бір ғана тақырып
            return (
              <div className="row-item" key={t.id}
                onClick={() => (shut ? null : openTopic(t))}
                style={{ opacity: shut ? 0.45 : 1, cursor: shut ? 'default' : 'pointer' }}>
                <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#B7B0A2', width: 26 }}>{String(k + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1 }}>
                  <b>{topicName(t)}</b>
                  <div style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 3 }}>
                    {t.schools.join(' · ')}
                  </div>
                </div>
                <div style={{ width: 110 }}><div className="bar"><i style={{ width: pct + '%' }} /></div></div>
                <span style={{ font: "600 13px 'IBM Plex Mono',monospace", width: 46, textAlign: 'right', color: pct >= 60 ? '#4C7A4E' : '#6B655B' }}>
                  {shut ? '🔒' : pct + '%'}
                </span>
              </div>
            );
          })}
        </div>
      </>
    );

    return (
      <main>
        {saveNotice}
        {loadError && <p role="alert">{trainingLoadErrorText(loadErrorCode, ru)}</p>}
        <p className="kicker">{t('ui.1')}</p>
        <h1>{t('ui.2')}</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          {ru ? 'Задачи трёх школ выдаются вперемешку.' : 'Есептер үш мектептің бәрінен араласып беріледі.'}
        </p>

        <div className="hero-card" style={{ marginTop: 16 }}>
          <h2>{t('ui.3')}</h2>
          <p>{t('ui.4')}</p>
          <button className="btn accent" disabled={pro === null} onClick={openMixed}>{t('ui.5')}</button>
        </div>

        {BLOCKS.map((b) => (
          <Group key={b.id} title={t(b.titleKey)}
            arr={topics.filter((tp) => (b.only ? tp.id === b.only : tp.block === b.id))} />
        ))}
      </main>
    );
  }

  // ── тегін тариф лимиті ──
  if (topic && (sessionState === 'limited' || sessionState === 'locked' || showTrainingLimit(pro, done, checked, FREE_DAY))) return (
    <main>
      <button className="link" onClick={leaveTopic}>{t('ui.6')}</button>
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px' }}>{sessionState === 'locked' ? (ru ? 'Эта тема пока недоступна' : 'Бұл тақырып әзірге қолжетімсіз') : (ru ? 'Лимит на сегодня закончился' : 'Бүгінгі лимит бітті')}</h2>
        <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>
          {sessionState === 'locked' ? (ru ? 'Вернись к списку и выбери доступную тему.' : 'Тізімге оралып, қолжетімді тақырыпты таңда.')
            : pro ? (ru ? 'Достигнут защитный дневной лимит. Продолжить можно завтра по времени Алматы.' : 'Күндік қорғаныс шегіне жеттің. Алматы уақытымен ертең жалғастыра аласың.')
              : (ru ? `Завтра по времени Алматы будут доступны ещё ${FREE_DAY} задач.` : `Алматы уақытымен ертең тағы ${FREE_DAY} есеп ашылады.`)}
        </p>
      </div>
    </main>
  );

  // ── задача ──
  const q = items[i] && { ...trainingQuestion(items[i]), ...(serverResult ? { answer: serverResult.answer, solution: serverResult.solution } : {}) };
  if (!q) return (
    <main>
      <button className="link" onClick={leaveTopic}>{t('ui.6')}</button>
      <p className="muted" style={{ marginTop: 14 }}>{t('ui.7')}</p>
    </main>
  );
  const ok = serverResult?.correct === true;

  return (
    <main>
      <div className="exam-top">
        <span className="ttl">{topicName(topic)}</span>
        <span className="clock">{fmt(secs)}</span>
      </div>
      {sessionState === 'starting' && <p role="status" className="muted">{ru ? 'Открываем защищённую сессию задачи…' : 'Есептің қорғалған сессиясы ашылуда…'}</p>}
      {sessionState === 'error' && <p role="alert">{ru ? 'Не удалось открыть задачу на сервере. Проверь соединение и повтори.' : 'Есепті серверде ашу мүмкін болмады. Байланысты тексеріп, қайтала.'} <button type="button" className="link" onClick={() => beginQuestion()}>{ru ? 'Повторить' : 'Қайталау'}</button></p>}
      {sessionState === 'expired' && <p role="alert">{ru ? 'Сессия задачи закончилась. Этот ответ не засчитан. Начни задачу заново, чтобы продолжить.' : 'Есеп сессиясының мерзімі бітті. Бұл жауап есептелмеді. Жалғастыру үшін есепті қайта баста.'} <button type="button" className="link" onClick={() => beginQuestion({ fresh: true })}>{ru ? 'Начать заново' : 'Қайта бастау'}</button></p>}
      <div className="qhead">
        <span className="qnum-chip">{i + 1}/{items.length}</span>
        <span style={chip}>{q.school}</span>
        {q.needsTranslation && <span style={{ ...chip, color: '#9A9384' }} title="Қазақша аудармасы әзірге жоқ">рус</span>}
        <button className={'flagbtn' + (flags.has(q.id) ? ' on' : '')} onClick={toggleFlag}>
          <span className="fl">⚑</span> {ru ? 'Повторить позже' : 'Кейін қайталау'}
        </button>
      </div>

      {/* КОЛХАР: екі баған + салыстыру батырмалары. Қалғаны — әдеттегі көрініс. */}
      {q.subject === 'kolzar' ? (
        <Kolhar q={q} answer={answer} onPick={setAnswer} disabled={checked || sessionState !== 'ready'} correct={serverResult ? ok : null} />
      ) : (
        <>
          <Stmt text={q.statement} />
          {q.image && <img className="fig" src={q.image} alt="сурет" />}

          {!checked ? (
            q.options ? (
              <div className="opts">
                {q.options.map((o, k) => (
                  <button key={k} disabled={sessionState !== 'ready'} className={'opt' + (answer === o ? ' sel' : '')} onClick={() => setAnswer(o)}>
                    <span className="lt">{LT[k]}</span><span>{o}</span>
                  </button>
                ))}
              </div>
            ) : (
              <input value={answer} maxLength={1000} disabled={sessionState !== 'ready'} onChange={(e) => setAnswer(e.target.value)} placeholder={t('ui.10')}
                onKeyDown={(e) => { if (e.key === 'Enter' && answer.trim()) check(); }} />
            )
          ) : (
            q.options && (
              <div className="opts" style={{ marginBottom: 14 }}>
                {q.options.map((o, k) => (
                  <div key={k} className={'opt' + (serverResult ? (o === q.answer ? ' ok' : (o === answer ? ' bad' : '')) : (o === answer ? ' sel' : ''))}>
                    <span className="lt">{LT[k]}</span><span>{o}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      <AiTutor q={q} checked={checked} given={checked && !ok ? answer : null} />

      {checked && serverResult && (
        <>
          <div className={ok ? 'fb ok' : 'fb no'}>{ok ? t('ui.66') : `${t('ui.67')} ${q.answer ?? '—'}`}</div>
          {xpPop && <div className="xp-pop">+{xpPop} XP</div>}
          <Explain q={q} given={ok ? null : answer} />
        </>
      )}
      {saveNotice}

      <div className="navbar">
        <button className="btn ghost" disabled={saveState === 'saving' || saveState === 'error'} onClick={leaveTopic}>{t('ui.6')}</button>
        {!checked
          ? <button className="btn" disabled={sessionState !== 'ready' || !(answer && answer.toString().trim())} onClick={check}>{t('ui.8')}</button>
          : <button className="btn accent" disabled={saveState === 'saving' || saveState === 'error'} onClick={next}>{t('ui.9')}</button>}
      </div>
    </main>
  );
}

const chip = {
  font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase',
  color: '#6B655B', border: '1px solid rgba(23,20,15,.18)', padding: '3px 7px',
};
