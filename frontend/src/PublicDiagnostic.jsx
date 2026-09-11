import React, { useMemo, useState } from 'react';
import Brand from './Brand.jsx';
import { LangSwitch, useLang } from './i18n.jsx';
import { DIAGNOSTIC_QUESTIONS, topicName } from './diagnosticData.js';

const copy = {
  ru: {
    free: 'БЕСПЛАТНАЯ ДИАГНОСТИКА', title: 'Узнайте слабые темы по математике',
    sub: '10 коротких заданий. Без регистрации. Сразу после теста покажем готовность, сильные и слабые стороны.',
    grade: 'Выберите класс', target: 'Цель подготовки', general: 'Общий уровень', start: 'Начать диагностику',
    back: 'На главную', question: 'Задание', of: 'из', next: 'Следующее задание', finish: 'Показать результат',
    pick: 'Выберите один ответ', result: 'ВАШ РЕЗУЛЬТАТ', ready: 'Готовность по математике', correct: 'правильных ответов',
    strong: 'Сильные стороны', weak: 'Нужно подтянуть', all: 'Результат по темам', recommendation: 'Что делать дальше',
    retry: 'Пройти ещё раз', account: 'Создать бесплатный аккаунт', noStrong: 'Пока рано выделять сильную тему — это нормально.',
    noWeak: 'Критичных пробелов не найдено. Продолжайте усложнять задачи.',
    plan: 'Начните со слабой темы, разберите правило и решите 5–10 задач. Затем повторите диагностику через неделю.',
    excellent: 'Отличная база', good: 'Хорошая база', medium: 'Есть пробелы', low: 'Нужна системная подготовка',
  },
  kk: {
    free: 'ТЕГІН ДИАГНОСТИКА', title: 'Математикадан әлсіз тақырыптарды анықта',
    sub: '10 қысқа тапсырма. Тіркелусіз. Сынақтан кейін дайындық деңгейін, мықты және әлсіз тұстарды бірден көрсетеміз.',
    grade: 'Сыныпты таңда', target: 'Дайындық мақсаты', general: 'Жалпы деңгей', start: 'Диагностиканы бастау',
    back: 'Басты бетке', question: 'Тапсырма', of: '/', next: 'Келесі тапсырма', finish: 'Нәтижені көру',
    pick: 'Бір жауапты таңда', result: 'СЕНІҢ НӘТИЖЕҢ', ready: 'Математикаға дайындық', correct: 'дұрыс жауап',
    strong: 'Мықты тұстарың', weak: 'Жетілдіру керек', all: 'Тақырыптар бойынша нәтиже', recommendation: 'Келесі қадам',
    retry: 'Қайта өту', account: 'Тегін аккаунт ашу', noStrong: 'Мықты тақырыпты бөлуге әлі ерте — бұл қалыпты.',
    noWeak: 'Маңызды олқылық табылмады. Енді күрделі есептерге көш.',
    plan: 'Алдымен әлсіз тақырыптың ережесін қайталап, 5–10 есеп шығар. Бір аптадан кейін диагностиканы қайта өт.',
    excellent: 'Өте жақсы база', good: 'Жақсы база', medium: 'Олқылықтар бар', low: 'Жүйелі дайындық қажет',
  },
};

const schools = ['РФМШ', 'НИШ', 'БИЛ'];

export default function PublicDiagnostic({ onBack, onRegister }) {
  const { lang } = useLang();
  const c = copy[lang] || copy.kk;
  const [screen, setScreen] = useState('setup');
  const [grade, setGrade] = useState(5);
  const [target, setTarget] = useState('РФМШ');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const questions = DIAGNOSTIC_QUESTIONS[grade];
  const current = questions[index];

  const report = useMemo(() => {
    const grouped = {};
    questions.forEach((item) => {
      grouped[item.topic] ||= { id: item.topic, total: 0, correct: 0 };
      grouped[item.topic].total += 1;
      if (answers[item.id] === item.answer) grouped[item.topic].correct += 1;
    });
    const topics = Object.values(grouped).map((item) => ({ ...item, pct: Math.round(item.correct / item.total * 100) }));
    const correct = topics.reduce((sum, item) => sum + item.correct, 0);
    const pct = Math.round(correct / questions.length * 100);
    return { topics, correct, pct, weak: topics.filter((item) => item.pct < 60), strong: topics.filter((item) => item.pct >= 75) };
  }, [answers, questions]);

  const begin = () => { setAnswers({}); setIndex(0); setScreen('test'); window.scrollTo(0, 0); };
  const next = () => {
    if (answers[current.id] == null) return;
    if (index < questions.length - 1) setIndex((value) => value + 1);
    else { setScreen('result'); window.scrollTo(0, 0); }
  };
  const label = report.pct >= 85 ? c.excellent : report.pct >= 70 ? c.good : report.pct >= 50 ? c.medium : c.low;
  const targetLabel = target === 'general' ? c.general : target;

  return (
    <div className="public-diag">
      <header className="public-diag-head">
        <button type="button" className="public-diag-brand" onClick={onBack}><Brand /></button>
        <LangSwitch />
        <button type="button" className="public-diag-back" onClick={onBack}>← {c.back}</button>
      </header>

      {screen === 'setup' && <main className="public-diag-setup">
        <section className="public-diag-intro">
          <span className="public-diag-kicker">✓ {c.free}</span>
          <h1>{c.title}</h1>
          <p>{c.sub}</p>
          <div className="public-diag-facts"><span>10 {lang === 'ru' ? 'заданий' : 'тапсырма'}</span><span>≈ 7 {lang === 'ru' ? 'минут' : 'минут'}</span><span>{lang === 'ru' ? 'Результат сразу' : 'Нәтиже бірден'}</span></div>
        </section>
        <section className="public-diag-config">
          <label>{c.grade}</label>
          <div className="public-diag-grades">{[3, 4, 5, 6].map((value) => <button key={value} type="button" className={grade === value ? 'on' : ''} onClick={() => setGrade(value)}>{value}</button>)}</div>
          <label>{c.target}</label>
          <div className="public-diag-targets">{[{ id: 'general', label: c.general }, ...schools.map((value) => ({ id: value, label: value }))].map((item) => <button key={item.id} type="button" className={target === item.id ? 'on' : ''} onClick={() => setTarget(item.id)}>{item.label}</button>)}</div>
          <button type="button" className="public-diag-primary" onClick={begin}>{c.start} →</button>
          <small>{lang === 'ru' ? 'Email и номер телефона не нужны' : 'Email мен телефон нөмірі қажет емес'}</small>
        </section>
      </main>}

      {screen === 'test' && <main className="public-diag-test">
        <div className="public-diag-progress"><i style={{ width: `${(index + 1) / questions.length * 100}%` }} /></div>
        <div className="public-diag-testmeta"><span>{c.question} {index + 1} {c.of} {questions.length}</span><b>{grade} {lang === 'ru' ? 'класс' : 'сынып'} · {targetLabel}</b></div>
        <section className="public-diag-question">
          <span className="public-diag-topic">{topicName(current.topic, lang)}</span>
          <h1>{current[lang]}</h1>
          <div className="public-diag-options">{current.options.map((option, optionIndex) => <button type="button" key={option} className={answers[current.id] === option ? 'on' : ''} onClick={() => setAnswers((value) => ({ ...value, [current.id]: option }))}><i>{String.fromCharCode(65 + optionIndex)}</i><span>{option}</span></button>)}</div>
          <div className="public-diag-question-foot"><span>{answers[current.id] == null ? c.pick : '✓'}</span><button type="button" className="public-diag-primary" disabled={answers[current.id] == null} onClick={next}>{index === questions.length - 1 ? c.finish : c.next} →</button></div>
        </section>
      </main>}

      {screen === 'result' && <main className="public-diag-result">
        <section className="public-diag-score">
          <div><span className="public-diag-kicker">{c.result}</span><h1>{label}</h1><p>{grade} {lang === 'ru' ? 'класс' : 'сынып'} · {targetLabel}</p></div>
          <div className="public-diag-ring" style={{ '--score': `${report.pct * 3.6}deg` }}><strong>{report.pct}%</strong><span>{c.ready}</span></div>
          <div className="public-diag-scorecount"><strong>{report.correct}/{questions.length}</strong><span>{c.correct}</span></div>
        </section>
        <section className="public-diag-report">
          <div className="public-diag-topiclist"><h2>{c.all}</h2>{report.topics.map((item) => <div className="public-diag-topicrow" key={item.id}><div><b>{topicName(item.id, lang)}</b><span>{item.correct}/{item.total}</span></div><div><i style={{ width: `${item.pct}%` }} /></div><strong className={item.pct < 60 ? 'weak' : item.pct >= 75 ? 'strong' : ''}>{item.pct}%</strong></div>)}</div>
          <div className="public-diag-insights">
            <article className="weak"><span>↗</span><div><h3>{c.weak}</h3><p>{report.weak.length ? report.weak.map((item) => topicName(item.id, lang)).join(' · ') : c.noWeak}</p></div></article>
            <article className="strong"><span>✓</span><div><h3>{c.strong}</h3><p>{report.strong.length ? report.strong.map((item) => topicName(item.id, lang)).join(' · ') : c.noStrong}</p></div></article>
            <article className="plan"><span>01</span><div><h3>{c.recommendation}</h3><p>{c.plan}</p></div></article>
          </div>
        </section>
        <div className="public-diag-actions"><button type="button" className="public-diag-secondary" onClick={begin}>{c.retry}</button><button type="button" className="public-diag-primary" onClick={onRegister}>{c.account} →</button></div>
      </main>}
    </div>
  );
}
