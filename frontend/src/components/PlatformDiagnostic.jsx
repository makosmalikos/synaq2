import React, { useEffect, useMemo, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { CURRICULUM, createCurriculumQuestions, curriculumAnswersMatch } from '../curriculumData.js';
import { auth, getPlatformDiagnostics, savePlatformDiagnostic } from '../firebase.js';
import {
  PLATFORM_DIAGNOSTIC_VERSION,
  daysUntilDiagnostic,
  diagnosticProgressKey,
  diagnosticStorageKey,
  readDiagnosticProgress,
  readStoredDiagnostic,
  trainingTopicForKind,
} from '../platformDiagnostic.js';

const local = (value, lang) => value?.[lang === 'ru' ? 'ru' : 'kk'] || '';
const levelOf = (pct) => (pct >= 75 ? 'strong' : pct >= 50 ? 'mid' : 'weak');

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

function diagnosticModules(grade) {
  const modules = [...new Map((CURRICULUM[grade] || []).map((topic) => [topic.moduleId, topic])).values()];
  if (modules.length <= 8) return modules;
  return Array.from({ length: 8 }, (_, index) => modules[Math.round(index * (modules.length - 1) / 7)]);
}

function makeWave(modules, wave, levelFor) {
  return modules.map((topic, index) => {
    const difficulty = levelFor(topic);
    return {
      id: `${topic.moduleId}-${wave}-${Date.now()}-${index}`,
      moduleId: topic.moduleId,
      topic,
      wave,
      difficulty,
      question: createCurriculumQuestions(topic, difficulty, 1)[0],
    };
  });
}

function scoreByModule(records) {
  const grouped = {};
  records.forEach((record) => {
    grouped[record.moduleId] ||= { moduleId: record.moduleId, topic: record.topic, correct: 0, total: 0, seconds: 0 };
    grouped[record.moduleId].total += 1;
    grouped[record.moduleId].correct += record.correct ? 1 : 0;
    grouped[record.moduleId].seconds += record.seconds;
  });
  return Object.values(grouped).map((item) => ({
    ...item,
    pct: Math.round(item.correct / item.total * 100),
    level: levelOf(Math.round(item.correct / item.total * 100)),
  })).sort((a, b) => a.pct - b.pct || b.seconds - a.seconds);
}

function persist(result) {
  const uid = auth.currentUser?.uid;
  try { localStorage.setItem(diagnosticStorageKey(uid), JSON.stringify(result)); } catch {}
  if (uid) savePlatformDiagnostic(uid, result).catch(() => {});
}

export default function PlatformDiagnostic({ initialGrade, onGoPractice }) {
  const { lang } = useLang();
  const c = copy[lang === 'ru' ? 'ru' : 'kk'];
  const parsed = Number.parseInt(initialGrade, 10);
  const [grade, setGrade] = useState(parsed >= 3 && parsed <= 6 ? parsed : 5);
  const [screen, setScreen] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [records, setRecords] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [startedAt, setStartedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [resumeData, setResumeData] = useState(null);
  const modules = useMemo(() => diagnosticModules(grade), [grade]);
  const current = questions[index];

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    const localResult = readStoredDiagnostic(uid);
    const progress = readDiagnosticProgress(uid);
    if (localResult) { setResult(localResult); setHistory([localResult]); }
    if (progress) setResumeData(progress);
    if (!uid) return;
    let active = true;
    getPlatformDiagnostics(uid).then((items) => {
      if (!active || !items.length) return;
      setHistory(items);
      setResult(items[0]);
      try { localStorage.setItem(diagnosticStorageKey(uid), JSON.stringify(items[0])); } catch {}
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (screen !== 'test' || !questions.length) return;
    const uid = auth.currentUser?.uid;
    try {
      localStorage.setItem(diagnosticProgressKey(uid), JSON.stringify({
        version: PLATFORM_DIAGNOSTIC_VERSION, screen: 'test', grade, questions, records,
        index, answer, startedAt, questionStartedAt,
      }));
    } catch {}
  }, [screen, grade, questions, records, index, answer, startedAt, questionStartedAt]);

  const begin = () => {
    try { localStorage.removeItem(diagnosticProgressKey(auth.currentUser?.uid)); } catch {}
    setQuestions(makeWave(modules, 1, () => 'easy'));
    setRecords([]); setIndex(0); setAnswer(''); setResult(null);
    setStartedAt(Date.now()); setQuestionStartedAt(Date.now()); setScreen('test');
    window.scrollTo(0, 0);
  };

  const resume = () => {
    if (!resumeData?.questions?.length) return;
    setGrade(resumeData.grade); setQuestions(resumeData.questions); setRecords(resumeData.records || []);
    setIndex(Math.min(resumeData.index || 0, resumeData.questions.length - 1)); setAnswer(resumeData.answer || '');
    setStartedAt(resumeData.startedAt || Date.now()); setQuestionStartedAt(Date.now()); setScreen('test');
    window.scrollTo(0, 0);
  };

  const complete = (completed) => {
    const topics = scoreByModule(completed);
    const correct = completed.filter((item) => item.correct).length;
    const data = {
      version: PLATFORM_DIAGNOSTIC_VERSION, grade, completedAt: new Date().toISOString(),
      readiness: Math.round(correct / completed.length * 100), correct, total: completed.length,
      spentSec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      topics: topics.map((item) => ({ moduleId: item.moduleId, kind: item.topic.kind || '', trainingTopicId: trainingTopicForKind(item.topic.kind), title: item.topic.title, pct: item.pct, correct: item.correct, total: item.total, level: item.level })),
      mistakes: completed.filter((item) => !item.correct).map((item) => ({ moduleId: item.moduleId, trainingTopicId: trainingTopicForKind(item.topic.kind), title: item.topic.title, text: item.question.text, your: item.your, answer: item.question.answer, solution: item.question.solution })),
    };
    try { localStorage.removeItem(diagnosticProgressKey(auth.currentUser?.uid)); } catch {}
    persist(data); setResult(data); setHistory((items) => [data, ...items]); setResumeData(null); setScreen('result'); window.scrollTo(0, 0);
  };

  const submit = (skip = false) => {
    if (!current || (!skip && !answer.trim())) return;
    const record = {
      ...current,
      your: skip ? '' : answer.trim(),
      correct: !skip && curriculumAnswersMatch(answer, current.question.answer),
      seconds: Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000)),
    };
    const completed = [...records, record];
    setRecords(completed); setAnswer(''); setQuestionStartedAt(Date.now());

    if (index < questions.length - 1) { setIndex(index + 1); return; }
    if (current.wave === 1) {
      const first = new Map(completed.map((item) => [item.moduleId, item.correct]));
      setQuestions((items) => [...items, ...makeWave(modules, 2, (topic) => first.get(topic.moduleId) ? 'medium' : 'easy')]);
      setIndex(index + 1); return;
    }
    if (current.wave === 2) {
      const ranked = scoreByModule(completed).slice(0, 4);
      const third = makeWave(ranked.map((item) => item.topic), 3, (topic) => {
        const stat = ranked.find((item) => item.moduleId === topic.moduleId);
        return stat?.pct >= 100 ? 'hard' : 'medium';
      });
      setQuestions((items) => [...items, ...third]); setIndex(index + 1); return;
    }
    complete(completed);
  };

  if (screen === 'intro') return (
    <main className="platform-diag-page">
      <header className="platform-diag-title"><span>{c.kicker}</span><h1>{c.title}</h1><p>{c.sub}</p></header>
      <section className="platform-diag-intro">
        <div className="platform-diag-visual"><i>◎</i><strong>3</strong><span>{lang === 'ru' ? 'этапа анализа' : 'талдау кезеңі'}</span><div><b>01</b><b>02</b><b>03</b></div></div>
        <div className="platform-diag-start">
          <label>{c.grade}</label><div className="platform-diag-grades">{[3,4,5,6].map((value) => <button key={value} className={grade === value ? 'on' : ''} onClick={() => setGrade(value)}>{value}</button>)}</div>
          <ul><li>✓ {c.questions}</li><li>✓ {c.minutes}</li><li>✓ {c.adaptive}</li></ul>
          <button className="platform-diag-primary" onClick={begin}>{c.start} →</button><small>{c.noHints}</small>
          {resumeData && <button className="platform-diag-resume" onClick={resume}>{c.resume} · {(resumeData.index || 0) + 1}/20 →</button>}
          {result && <button className="platform-diag-last" onClick={() => { setGrade(result.grade); setScreen('result'); window.scrollTo(0, 0); }}>{lang === 'ru' ? `Последний результат: ${result.readiness}%` : `Соңғы нәтиже: ${result.readiness}%`} →</button>}
        </div>
      </section>
    </main>
  );

  if (screen === 'test' && current) {
    const stageText = current.wave === 1 ? c.stage1 : current.wave === 2 ? c.stage2 : c.stage3;
    return <main className="platform-diag-page platform-diag-test">
      <div className="platform-diag-test-head"><div><span>{stageText}</span><strong>{index + 1} / 20</strong></div><div><i style={{ width: `${(index + 1) / 20 * 100}%` }} /></div></div>
      <section className="platform-diag-question-card">
        <div className="platform-diag-question-meta"><span>{local(current.topic.title, lang)}</span><b>{current.difficulty === 'easy' ? '01' : current.difficulty === 'medium' ? '02' : '03'}</b></div>
        <h1>{local(current.question.text, lang)}</h1>
        <input autoFocus inputMode="text" value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); }} placeholder={c.enter} />
        <div><button className="platform-diag-skip" onClick={() => submit(true)}>{c.skip}</button><button className="platform-diag-primary" disabled={!answer.trim()} onClick={() => submit()}>{index === 19 ? c.finish : c.next} →</button></div>
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
    <header className="platform-diag-result-hero"><div><span>{c.result}</span><h1>{result.readiness}%</h1><p>{c.readiness}</p></div><div><strong>{result.correct}/{result.total}</strong><span>{c.correct}</span></div><div><strong>{Math.ceil(result.spentSec / 60)}</strong><span>{c.time}</span></div></header>
    <section className="platform-diag-map"><div className="platform-diag-section-head"><span>01</span><div><h2>{c.map}</h2><p>{grade} {c.grade.toLowerCase()}</p></div></div><div className="platform-diag-skill-grid">{ranked.map((item) => <article className={`is-${item.level}`} key={item.moduleId}><div><b>{local(item.title, lang)}</b><strong>{item.pct}%</strong></div><div><i style={{ width: `${item.pct}%` }} /></div><small>{item.correct}/{item.total}</small></article>)}</div></section>
    <div className="platform-diag-columns"><section><div className="platform-diag-section-head"><span>02</span><div><h2>{c.weak}</h2></div></div>{weak.map((item) => <article className="platform-diag-topic-row weak" key={item.moduleId}><b>{local(item.title, lang)}</b><strong>{item.pct}%</strong></article>)}</section><section><div className="platform-diag-section-head"><span>03</span><div><h2>{c.strong}</h2></div></div>{strong.length ? strong.slice(0,3).map((item) => <article className="platform-diag-topic-row strong" key={item.moduleId}><b>{local(item.title, lang)}</b><strong>{item.pct}%</strong></article>) : <p className="platform-diag-empty">{c.emptyStrong}</p>}</section></div>
    <section className="platform-diag-plan"><div className="platform-diag-section-head"><span>04</span><div><h2>{c.plan}</h2></div></div><div>{plan.map((item, i) => <article key={item.moduleId}><span>{c.day} {i * 2 + 1}</span><b>{local(item.title, lang)}</b><small>{5 + i * 2} {c.tasks}</small></article>)}<article className="repeat"><span>{c.day} 7</span><b>{c.retest}</b><small>↻</small></article></div><button className="platform-diag-primary" onClick={() => onGoPractice?.(practiceTopic)}>{c.practice} →</button></section>
    {!!result.mistakes.length && <section className="platform-diag-review"><div className="platform-diag-section-head"><span>05</span><div><h2>{c.review}</h2><p>{result.mistakes.length}</p></div></div>{result.mistakes.map((item, i) => <details key={`${item.moduleId}-${i}`}><summary><span>{String(i + 1).padStart(2, '0')}</span><b>{local(item.text, lang)}</b><i>+</i></summary><div><p><small>{c.your}</small><b>{item.your || '—'}</b></p><p className="right"><small>{c.right}</small><b>{item.answer}</b></p><aside><strong>{c.solution}</strong>{local(item.solution, lang)}</aside></div></details>)}</section>}
    <section className="platform-diag-history"><div className="platform-diag-section-head"><span>06</span><div><h2>{c.history}</h2><p>{daysLeft ? (lang === 'ru' ? `Повторная проверка через ${daysLeft} дн.` : `Қайта тексеруге ${daysLeft} күн қалды`) : (lang === 'ru' ? 'Можно пройти повторную проверку' : 'Қайта тексеруден өтуге болады')}</p></div></div><div>{history.slice(0, 5).map((item, i) => <article key={item.id || item.completedAt || i}><time>{new Date(item.completedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'kk-KZ')}</time><i style={{ height: `${Math.max(8, item.readiness)}%` }} /><strong>{item.readiness}%</strong></article>)}</div></section>
    <div className="platform-diag-actions"><button onClick={begin}>{daysLeft ? c.again : c.retest}</button><button className="platform-diag-primary" onClick={() => onGoPractice?.(practiceTopic)}>{c.practice} →</button></div>
  </main>;
}
