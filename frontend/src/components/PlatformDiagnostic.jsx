import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { auth, getPlatformDiagnostics } from '../firebase.js';
import { diagnosticAnswer, diagnosticResume, diagnosticStart } from '../diagnosticApi.js';
import {
  PLATFORM_DIAGNOSTIC_VERSION,
  daysUntilDiagnostic,
  diagnosticProgressKey,
  diagnosticStorageKey,
  readDiagnosticProgress,
  trainingTopicForKind,
} from '../platformDiagnostic.js';
import { acknowledgeDiagnosticResult, diagnosticRecovery, stageDiagnosticResult } from '../diagnosticPersistence.js';

const local = (value, lang) => value?.[lang === 'ru' ? 'ru' : 'kk'] || '';

const copy = {
  ru: {
    kicker: 'SYNAQ DIAGNOSTIC', title: 'Полная диагностика знаний',
    sub: '20 заданий в три этапа. Система проверит базу, подстроит сложность и повторно проверит слабые навыки.',
    grade: 'Класс', start: 'Начать диагностику', minutes: '15–20 минут', questions: '20 заданий',
    adaptive: 'Адаптивная сложность', noHints: 'Без подсказок — так результат будет точнее',
    stage1: 'Проверяем фундамент', stage2: 'Подстраиваем сложность', stage3: 'Уточняем слабые места',
    enter: 'Введите ответ', next: 'Ответить', skip: 'Пропустить', finish: 'Завершить диагностику',
    result: 'Диагностика завершена', readiness: 'Общая готовность', correct: 'правильных',
    time: 'минут', map: 'Карта навыков', weak: 'Нужно подтянуть', strong: 'Сильные навыки',
    plan: 'Персональный план на 7 дней', practice: 'Начать тренировку', again: 'Пройти заново',
    resume: 'Продолжить диагностику', history: 'История диагностики', retest: 'Повторная диагностика',
    review: 'Разбор ошибок', your: 'Ваш ответ', right: 'Правильный ответ', solution: 'Как решить',
    day: 'День', tasks: 'задач', emptyStrong: 'Сильные темы проявятся после следующей попытки.',
  },
  kk: {
    kicker: 'SYNAQ DIAGNOSTIC', title: 'Білімді толық диагностикалау',
    sub: 'Үш кезеңдегі 20 есеп. Жүйе негізгі білімді тексеріп, күрделілікті бейімдейді және әлсіз дағдыларды қайта тексереді.',
    grade: 'Сынып', start: 'Диагностиканы бастау', minutes: '15–20 минут', questions: '20 есеп',
    adaptive: 'Бейімделетін күрделілік', noHints: 'Нәтиже дәл болу үшін көмексіз орында',
    stage1: 'Негізді тексереміз', stage2: 'Күрделілікті бейімдейміз', stage3: 'Әлсіз тұстарды нақтылаймыз',
    enter: 'Жауапты енгіз', next: 'Жауап беру', skip: 'Өткізіп жіберу', finish: 'Диагностиканы аяқтау',
    result: 'Диагностика аяқталды', readiness: 'Жалпы дайындық', correct: 'дұрыс',
    time: 'минут', map: 'Дағдылар картасы', weak: 'Күшейту керек', strong: 'Мықты дағдылар',
    plan: '7 күндік жеке жоспар', practice: 'Жаттығуды бастау', again: 'Қайта өту',
    resume: 'Диагностиканы жалғастыру', history: 'Диагностика тарихы', retest: 'Қайта диагностика',
    review: 'Қателерді талдау', your: 'Сенің жауабың', right: 'Дұрыс жауап', solution: 'Шешу жолы',
    day: 'Күн', tasks: 'есеп', emptyStrong: 'Мықты тақырыптар келесі әрекеттен кейін көрінеді.',
  },
};

export default function PlatformDiagnostic({ initialGrade, onGoPractice }) {
  const { lang } = useLang();
  const c = copy[lang === 'ru' ? 'ru' : 'kk'];
  const parsed = Number.parseInt(initialGrade, 10);
  const [grade, setGrade] = useState(parsed >= 3 && parsed <= 6 ? parsed : 5);
  const [screen, setScreen] = useState('intro');
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [resumeData, setResumeData] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [recoveryAvailable, setRecoveryAvailable] = useState(true);
  const ownerUid = useRef(auth.currentUser?.uid || null).current;
  const mounted = useRef(false);
  const submittedRef = useRef(false);
  const attemptId = useRef(null);
  const current = session?.question;
  const index = session?.index || 0;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const uid = ownerUid;
    const { result: localResult, durable } = diagnosticRecovery(uid);
    const progress = readDiagnosticProgress(uid);
    if (localResult) { setResult(localResult); setHistory([localResult]); }
    if (localResult) setRecoveryAvailable(durable);
    if (progress) setResumeData(progress);
    if (!uid) return;
    let active = true;
    getPlatformDiagnostics(uid).then((items) => {
      if (!active || auth.currentUser?.uid !== uid || !items.length) return;
      setHistory(items);
      setResult(items[0]);
      try { localStorage.setItem(diagnosticStorageKey(uid), JSON.stringify(items[0])); } catch {}
    }).catch(() => {});
    return () => { active = false; };
  }, [ownerUid]);

  useEffect(() => { submittedRef.current = false; }, [index, screen]);

  useEffect(() => {
    if (recoveryAvailable || screen !== 'test') return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [screen, saveState, recoveryAvailable]);

  useEffect(() => {
    if (screen !== 'test' || !session || !attemptId.current) return;
    const uid = ownerUid;
    if ((auth.currentUser?.uid || null) !== uid) return;
    try {
      localStorage.setItem(diagnosticProgressKey(uid), JSON.stringify({
        version: PLATFORM_DIAGNOSTIC_VERSION, screen: 'test', grade, index, answer,
        attemptId: attemptId.current, pendingStart: false,
        pendingAnswer: readDiagnosticProgress(uid)?.pendingAnswer || null,
      }));
      setRecoveryAvailable(true);
    } catch { setRecoveryAvailable(false); }
  }, [screen, grade, session, index, answer, ownerUid]);

  const storeProgress = (value) => {
    try { localStorage.setItem(diagnosticProgressKey(ownerUid), JSON.stringify(value)); setRecoveryAvailable(true); return true; }
    catch { setRecoveryAvailable(false); return false; }
  };
  const fail = (error, draft) => {
    if (!mounted.current || auth.currentUser?.uid !== ownerUid) return;
    if (['diagnostic/session-expired', 'diagnostic/session-not-found'].includes(error?.code)) {
      try { localStorage.removeItem(diagnosticProgressKey(ownerUid)); } catch {}
      attemptId.current = null; setSession(null); setResumeData(null); setScreen('intro');
    } else setResumeData(draft);
    setSaveState('error');
  };
  const accept = (value, draft = null) => {
    if (!mounted.current || auth.currentUser?.uid !== ownerUid) return;
    if (value.completed && value.result) {
      const saved = { ...value.result, saveId: value.id, savePending: false };
      stageDiagnosticResult(ownerUid, saved); acknowledgeDiagnosticResult(ownerUid, saved);
      setResult(value.result); setHistory((items) => [value.result, ...items.filter((item) => item.sourceId !== value.id)]);
      setResumeData(null); setSession(null); setAnswer(''); setScreen('result'); setSaveState('saved');
      window.scrollTo(0, 0); return;
    }
    attemptId.current = value.id; setGrade(value.grade); setSession(value);
    const pending = draft?.pendingAnswer;
    const restoredAnswer = pending?.index === value.index ? pending.answer : draft?.answer || '';
    storeProgress({ version: PLATFORM_DIAGNOSTIC_VERSION, screen: 'test', grade: value.grade,
      index: value.index, answer: restoredAnswer, attemptId: value.id, pendingStart: false, pendingAnswer: null });
    setAnswer(restoredAnswer);
    setResumeData(null); setScreen('test'); setSaveState('idle'); window.scrollTo(0, 0);
  };
  const begin = async () => {
    if (saveState === 'saving' || auth.currentUser?.uid !== ownerUid) return;
    if (resumeData?.pendingStart) return resume();
    const id = crypto.randomUUID(), draft = { version: PLATFORM_DIAGNOSTIC_VERSION, screen: 'test', grade,
      index: 0, answer: '', attemptId: id, pendingStart: true, pendingAnswer: null };
    attemptId.current = id; setSaveState('saving'); storeProgress(draft);
    try { accept(await diagnosticStart(id, grade), draft); }
    catch (error) { fail(error, draft); }
  };
  const resume = async () => {
    const draft = resumeData;
    if (!draft?.attemptId || saveState === 'saving' || auth.currentUser?.uid !== ownerUid) return;
    setSaveState('saving');
    try {
      let value = draft.pendingStart ? await diagnosticStart(draft.attemptId, draft.grade) : await diagnosticResume(draft.attemptId);
      if (!value.completed && draft.pendingAnswer?.index === value.index) {
        value = await diagnosticAnswer(draft.attemptId, draft.pendingAnswer.index, draft.pendingAnswer.answer);
      }
      accept(value, draft);
    } catch (error) { fail(error, draft); }
  };
  const submit = async (skip = false) => {
    if (submittedRef.current || !current || (!skip && !answer.trim()) || saveState === 'saving'
      || auth.currentUser?.uid !== ownerUid || !attemptId.current) return;
    submittedRef.current = true;
    const given = skip ? '' : answer.trim(), draft = { version: PLATFORM_DIAGNOSTIC_VERSION, screen: 'test', grade,
      index, answer: given, attemptId: attemptId.current, pendingStart: false, pendingAnswer: { index, answer: given } };
    storeProgress(draft); setSaveState('saving');
    try { accept(await diagnosticAnswer(attemptId.current, index, given), draft); }
    catch (error) { fail(error, draft); }
    finally { submittedRef.current = false; }
  };
  const storageWarning = !recoveryAvailable && (screen === 'test' || saveState === 'error' || saveState === 'saving') ? <p role="alert">{lang === 'ru' ? 'Браузер не может сохранить резервную копию. Не обновляйте и не закрывайте страницу, пока результат не сохранится.' : 'Браузер сақтық көшірмені сақтай алмады. Нәтиже сақталғанша бетті жаңартпаңыз және жаппаңыз.'}</p> : null;
  const saveNotice = <>{storageWarning}{saveState === 'error' ? <p role="alert">{lang === 'ru' ? 'Не удалось связаться с сервером. Попробуйте продолжить ещё раз.' : 'Сервермен байланысу мүмкін болмады. Қайта жалғастырып көріңіз.'}</p> : saveState === 'saving' ? <p role="status">{lang === 'ru' ? 'Синхронизируем диагностику…' : 'Диагностика синхрондалуда…'}</p> : null}</>;

  if (screen === 'intro') return (
    <main className="platform-diag-page">
      {saveNotice}
      <header className="platform-diag-title"><span>{c.kicker}</span><h1>{c.title}</h1><p>{c.sub}</p></header>
      <section className="platform-diag-intro">
        <div className="platform-diag-visual"><i>◎</i><strong>3</strong><span>{lang === 'ru' ? 'этапа анализа' : 'талдау кезеңі'}</span><div><b>01</b><b>02</b><b>03</b></div></div>
        <div className="platform-diag-start">
          <label>{c.grade}</label><div className="platform-diag-grades">{[3,4,5,6].map((value) => <button key={value} className={grade === value ? 'on' : ''} onClick={() => setGrade(value)}>{value}</button>)}</div>
          <ul><li>✓ {c.questions}</li><li>✓ {c.minutes}</li><li>✓ {c.adaptive}</li></ul>
          <button className="platform-diag-primary" disabled={saveState === 'saving'} onClick={begin}>{c.start} →</button><small>{c.noHints}</small>
          {resumeData && <button className="platform-diag-resume" onClick={resume}>{c.resume} · {(resumeData.index || 0) + 1}/20 →</button>}
          {result && <button className="platform-diag-last" onClick={() => { setGrade(result.grade); setScreen('result'); window.scrollTo(0, 0); }}>{lang === 'ru' ? `Последний результат: ${result.readiness}%` : `Соңғы нәтиже: ${result.readiness}%`} →</button>}
        </div>
      </section>
    </main>
  );

  if (screen === 'test' && current) {
    const stageText = current.wave === 1 ? c.stage1 : current.wave === 2 ? c.stage2 : c.stage3;
    return <main className="platform-diag-page platform-diag-test">
      {saveNotice}
      <div className="platform-diag-test-head"><div><span>{stageText}</span><strong>{index + 1} / 20</strong></div><div><i style={{ width: `${(index + 1) / 20 * 100}%` }} /></div></div>
      <section className="platform-diag-question-card">
        <div className="platform-diag-question-meta"><span>{local(current.topic.title, lang)}</span><b>{current.difficulty === 'easy' ? '01' : current.difficulty === 'medium' ? '02' : '03'}</b></div>
        <h1>{local(current.question.text, lang)}</h1>
        <input autoFocus inputMode="text" value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); }} placeholder={c.enter} />
        <div><button className="platform-diag-skip" disabled={saveState === 'saving'} onClick={() => submit(true)}>{c.skip}</button><button className="platform-diag-primary" disabled={!answer.trim() || saveState === 'saving'} onClick={() => submit()}>{index === 19 ? c.finish : c.next} →</button></div>
      </section>
    </main>;
  }

  const ranked = result?.topics || [];
  const weak = ranked.filter((item) => item.level !== 'strong').slice(0, 3);
  const strong = ranked.filter((item) => item.level === 'strong');
  const plan = (weak.length ? weak : ranked.slice(0, 3));
  const daysLeft = daysUntilDiagnostic(result?.completedAt);
  const practiceTopic = plan[0]?.trainingTopicId || trainingTopicForKind(plan[0]?.kind) || 'num';
  return <main className="platform-diag-page platform-diag-results">
    {saveNotice}
    <header className="platform-diag-result-hero"><div><span>{c.result}</span><h1>{result.readiness}%</h1><p>{c.readiness}</p></div><div><strong>{result.correct}/{result.total}</strong><span>{c.correct}</span></div><div><strong>{Math.ceil(result.spentSec / 60)}</strong><span>{c.time}</span></div></header>
    <section className="platform-diag-map"><div className="platform-diag-section-head"><span>01</span><div><h2>{c.map}</h2><p>{grade} {c.grade.toLowerCase()}</p></div></div><div className="platform-diag-skill-grid">{ranked.map((item) => <article className={`is-${item.level}`} key={item.moduleId}><div><b>{local(item.title, lang)}</b><strong>{item.pct}%</strong></div><div><i style={{ width: `${item.pct}%` }} /></div><small>{item.correct}/{item.total}</small></article>)}</div></section>
    <div className="platform-diag-columns"><section><div className="platform-diag-section-head"><span>02</span><div><h2>{c.weak}</h2></div></div>{weak.map((item) => <article className="platform-diag-topic-row weak" key={item.moduleId}><b>{local(item.title, lang)}</b><strong>{item.pct}%</strong></article>)}</section><section><div className="platform-diag-section-head"><span>03</span><div><h2>{c.strong}</h2></div></div>{strong.length ? strong.slice(0,3).map((item) => <article className="platform-diag-topic-row strong" key={item.moduleId}><b>{local(item.title, lang)}</b><strong>{item.pct}%</strong></article>) : <p className="platform-diag-empty">{c.emptyStrong}</p>}</section></div>
    <section className="platform-diag-plan"><div className="platform-diag-section-head"><span>04</span><div><h2>{c.plan}</h2></div></div><div>{plan.map((item, i) => <article key={item.moduleId}><span>{c.day} {i * 2 + 1}</span><b>{local(item.title, lang)}</b><small>{5 + i * 2} {c.tasks}</small></article>)}<article className="repeat"><span>{c.day} 7</span><b>{c.retest}</b><small>↻</small></article></div><button className="platform-diag-primary" onClick={() => onGoPractice?.(practiceTopic)}>{c.practice} →</button></section>
    {!!result.mistakes.length && <section className="platform-diag-review"><div className="platform-diag-section-head"><span>05</span><div><h2>{c.review}</h2><p>{result.mistakes.length}</p></div></div>{result.mistakes.map((item, i) => <details key={`${item.moduleId}-${i}`}><summary><span>{String(i + 1).padStart(2, '0')}</span><b>{local(item.text, lang)}</b><i>+</i></summary><div><p><small>{c.your}</small><b>{item.your || '—'}</b></p><p className="right"><small>{c.right}</small><b>{item.answer}</b></p><aside><strong>{c.solution}</strong>{local(item.solution, lang)}</aside></div></details>)}</section>}
    <section className="platform-diag-history"><div className="platform-diag-section-head"><span>06</span><div><h2>{c.history}</h2><p>{daysLeft ? (lang === 'ru' ? `Повторная проверка через ${daysLeft} дн.` : `Қайта тексеруге ${daysLeft} күн қалды`) : (lang === 'ru' ? 'Можно пройти повторную проверку' : 'Қайта тексеруден өтуге болады')}</p></div></div><div>{history.slice(0, 5).map((item, i) => <article key={item.id || item.completedAt || i}><time>{new Date(item.completedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'kk-KZ')}</time><i style={{ height: `${Math.max(8, item.readiness)}%` }} /><strong>{item.readiness}%</strong></article>)}</div></section>
    <div className="platform-diag-actions"><button disabled={saveState === 'saving'} onClick={begin}>{daysLeft ? c.again : c.retest}</button><button className="platform-diag-primary" onClick={() => onGoPractice?.(practiceTopic)}>{c.practice} →</button></div>
  </main>;
}
