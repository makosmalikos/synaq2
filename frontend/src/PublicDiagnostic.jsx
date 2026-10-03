import React, { useEffect, useMemo, useState } from 'react';
import Brand from './Brand.jsx';
import { LangSwitch, useLang } from './i18n.jsx';
import { topicName } from './diagnosticData.js';
import { PUBLIC_MOCKS } from './publicMockData.generated.js';
import { createPublicDiagnosticResult, savePublicDiagnosticResult } from './diagnosticPlan.js';

const copy = {
  ru: {
    free: 'БЕСПЛАТНЫЙ ПРОБНИК', title: 'Попробуйте тест выбранной школы',
    sub: 'Три полных фиксированных варианта: БИЛ, НИШ и РФМШ. Без регистрации, вопросы не меняются.',
    grade: 'Уровень', target: 'Выберите школу', general: 'Общий уровень', start: 'Начать пробный тест',
    back: 'На главную', question: 'Задание', of: 'из', next: 'Следующее задание', finish: 'Показать результат',
    pick: 'Выберите или введите ответ', result: 'ВАШ РЕЗУЛЬТАТ', ready: 'Результат теста', correct: 'правильных ответов',
    strong: 'Сильные стороны', weak: 'Нужно подтянуть', all: 'Результат по темам', recommendation: 'Что делать дальше',
    retry: 'Пройти ещё раз', account: 'Создать бесплатный аккаунт', noStrong: 'Пока рано выделять сильную тему — это нормально.',
    noWeak: 'Критичных пробелов не найдено. Продолжайте усложнять задачи.',
    plan: 'Начните со слабой темы, разберите правило и решите 5–10 задач. Затем повторите диагностику через неделю.',
    review: 'Разбор ошибок', your: 'Ваш ответ', right: 'Правильный ответ', why: 'Как решить',
    allCorrect: 'Ошибок нет — отличная работа!',
    excellent: 'Отличная база', good: 'Хорошая база', medium: 'Есть пробелы', low: 'Нужна системная подготовка',
  },
  kk: {
    free: 'ТЕГІН СЫНАҚ', title: 'Таңдаған мектебіңнің тестін байқап көр',
    sub: 'БИЛ, НИШ және РФМШ үшін үш толық тұрақты нұсқа. Тіркелусіз, сұрақтар өзгермейді.',
    grade: 'Деңгей', target: 'Мектепті таңда', general: 'Жалпы деңгей', start: 'Сынақты бастау',
    back: 'Басты бетке', question: 'Тапсырма', of: '/', next: 'Келесі тапсырма', finish: 'Нәтижені көру',
    pick: 'Жауапты таңда немесе енгіз', result: 'СЕНІҢ НӘТИЖЕҢ', ready: 'Тест нәтижесі', correct: 'дұрыс жауап',
    strong: 'Мықты тұстарың', weak: 'Жетілдіру керек', all: 'Тақырыптар бойынша нәтиже', recommendation: 'Келесі қадам',
    retry: 'Қайта өту', account: 'Тегін аккаунт ашу', noStrong: 'Мықты тақырыпты бөлуге әлі ерте — бұл қалыпты.',
    noWeak: 'Маңызды олқылық табылмады. Енді күрделі есептерге көш.',
    plan: 'Алдымен әлсіз тақырыптың ережесін қайталап, 5–10 есеп шығар. Бір аптадан кейін диагностиканы қайта өт.',
    review: 'Қателерді талдау', your: 'Сенің жауабың', right: 'Дұрыс жауап', why: 'Шешу жолы',
    allCorrect: 'Қате жоқ — өте жақсы нәтиже!',
    excellent: 'Өте жақсы база', good: 'Жақсы база', medium: 'Олқылықтар бар', low: 'Жүйелі дайындық қажет',
  },
};

const schools = ['РФМШ', 'НИШ', 'БИЛ'];
const subjectNames = {
  math: { ru: 'Математика', kk: 'Математика' }, kolzar: { ru: 'Количественные характеристики', kk: 'Сандық сипаттамалар' },
  science: { ru: 'Естествознание', kk: 'Жаратылыстану' }, eng: { ru: 'Английский язык', kk: 'Ағылшын тілі' },
  rus: { ru: 'Русский язык', kk: 'Орыс тілі' }, kaz: { ru: 'Казахский язык', kk: 'Қазақ тілі' },
  logic: { ru: 'Логика', kk: 'Логика' }, reading: { ru: 'Чтение', kk: 'Оқу сауаттылығы' },
};
const normalizeAnswer = (value) => String(value ?? '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const rest = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${minutes}:${String(rest).padStart(2, '0')}`;
};

export default function PublicDiagnostic({ onBack, onRegister }) {
  const { lang } = useLang();
  const c = copy[lang] || copy.kk;
  const [screen, setScreen] = useState('setup');
  const [target, setTarget] = useState('РФМШ');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [deadline, setDeadline] = useState(null);
  const [clock, setClock] = useState(() => Date.now());
  const grade = target === 'БИЛ' ? 4 : target === 'НИШ' ? 5 : 6;
  const mock = PUBLIC_MOCKS[target];
  const questions = mock.questions;
  const current = questions[index];

  const report = useMemo(() => {
    const grouped = {};
    questions.forEach((item) => {
      grouped[item.topic] ||= { id: item.topic, total: 0, correct: 0 };
      grouped[item.topic].total += 1;
      if (normalizeAnswer(answers[item.id]) === normalizeAnswer(item.answer)) grouped[item.topic].correct += 1;
    });
    const topics = Object.values(grouped).map((item) => ({ ...item, pct: Math.round(item.correct / item.total * 100) }));
    const correct = topics.reduce((sum, item) => sum + item.correct, 0);
    const pct = Math.round(correct / questions.length * 100);
    const mistakes = questions.filter((item) => normalizeAnswer(answers[item.id]) !== normalizeAnswer(item.answer));
    return { topics, correct, pct, weak: topics.filter((item) => item.pct < 60), strong: topics.filter((item) => item.pct >= 75), mistakes };
  }, [answers, questions]);

  const begin = () => { setAnswers({}); setIndex(0); setDeadline(Date.now() + mock.minutes * 60000); setClock(Date.now()); setScreen('test'); window.scrollTo(0, 0); };
  const persistResult = () => savePublicDiagnosticResult(createPublicDiagnosticResult({ grade, target, report }));
  useEffect(() => {
    if (screen !== 'test' || !deadline) return undefined;
    const timer = setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (now >= deadline) {
        clearInterval(timer);
        persistResult();
        setScreen('result');
        window.scrollTo(0, 0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, deadline, report]);
  const remainingSec = deadline ? Math.max(0, Math.ceil((deadline - clock) / 1000)) : mock.minutes * 60;
  const next = () => {
    if (index < questions.length - 1) setIndex((value) => value + 1);
    else { persistResult(); setScreen('result'); window.scrollTo(0, 0); }
  };
  const registerWithResult = () => onRegister(persistResult());
  const label = report.pct >= 85 ? c.excellent : report.pct >= 70 ? c.good : report.pct >= 50 ? c.medium : c.low;
  const targetLabel = target === 'general' ? c.general : target;
  const mistakeCountLabel = lang === 'ru'
    ? `${report.mistakes.length} ${report.mistakes.length === 1 ? 'ошибка' : report.mistakes.length < 5 ? 'ошибки' : 'ошибок'} из ${questions.length}`
    : `${report.mistakes.length} қате / ${questions.length}`;

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
          <div className="public-diag-facts"><span>{questions.length} {lang === 'ru' ? 'заданий' : 'тапсырма'}</span><span>{mock.minutes} {lang === 'ru' ? 'минут' : 'минут'}</span><span>{lang === 'ru' ? 'Полный формат' : 'Толық формат'}</span></div>
        </section>
        <section className="public-diag-config">
          <label>{c.target}</label>
          <div className="public-diag-targets">{schools.map((value) => ({ id: value, label: value })).map((item) => <button key={item.id} type="button" className={target === item.id ? 'on' : ''} onClick={() => { setTarget(item.id); setAnswers({}); setIndex(0); }}>{item.label}</button>)}</div>
          <button type="button" className="public-diag-primary" onClick={begin}>{c.start} →</button>
          <small>{lang === 'ru' ? 'Email и номер телефона не нужны' : 'Email мен телефон нөмірі қажет емес'}</small>
        </section>
      </main>}

      {screen === 'test' && <main className="public-diag-test">
        <div className="public-diag-progress"><i style={{ width: `${(index + 1) / questions.length * 100}%` }} /></div>
        <div className="public-diag-testmeta"><span>{c.question} {index + 1} {c.of} {questions.length}</span><b>{targetLabel} · {formatTime(remainingSec)}</b></div>
        <section className="public-diag-question">
          <span className="public-diag-topic">{subjectNames[current.topic]?.[lang] || topicName(current.topic, lang)}</span>
          <h1>{current.statement}</h1>
          {current.image && <img className="public-diag-question-image" src={current.image} alt="" />}
          {current.options ? <div className="public-diag-options">{current.options.map((option, optionIndex) => <button type="button" key={`${optionIndex}-${option}`} className={answers[current.id] === option ? 'on' : ''} onClick={() => setAnswers((value) => ({ ...value, [current.id]: option }))}><i>{String.fromCharCode(65 + optionIndex)}</i><span>{option}</span></button>)}</div>
            : <input className="public-diag-answer-input" value={answers[current.id] || ''} onChange={(event) => setAnswers((value) => ({ ...value, [current.id]: event.target.value }))} placeholder={lang === 'ru' ? 'Введите ответ' : 'Жауапты енгізіңіз'} />}
          <div className="public-diag-question-foot"><button type="button" className="public-diag-secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>← {lang === 'ru' ? 'Назад' : 'Артқа'}</button><span>{answers[current.id] == null || answers[current.id] === '' ? c.pick : '✓'}</span><button type="button" className="public-diag-primary" onClick={next}>{index === questions.length - 1 ? c.finish : c.next} →</button></div>
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
            <article className="plan"><span>7</span><div><h3>{c.recommendation}</h3><p>{c.plan}</p><ol className="public-diag-mini-plan">{(report.weak.length ? report.weak : report.topics).slice(0, 3).map((item, itemIndex) => <li key={item.id}><b>{lang === 'ru' ? 'День' : 'Күн'} {itemIndex * 2 + 1}</b><span>{topicName(item.id, lang)} · {5 + itemIndex * 2} {lang === 'ru' ? 'задач' : 'есеп'}</span></li>)}</ol></div></article>
          </div>
        </section>
        <section className="public-diag-review">
          <div className="public-diag-review-head"><div><span>{c.review}</span><h2>{report.mistakes.length ? mistakeCountLabel : c.allCorrect}</h2></div><strong>{report.correct}/{questions.length}</strong></div>
          {!!report.mistakes.length && <div className="public-diag-review-list">{report.mistakes.map((item, mistakeIndex) => <article key={item.id}>
            <div className="public-diag-review-num">{String(mistakeIndex + 1).padStart(2, '0')}</div>
            <div className="public-diag-review-copy"><span>{subjectNames[item.topic]?.[lang] || topicName(item.topic, lang)}</span><h3>{item.statement}</h3><div className="public-diag-answer-pair"><p><small>{c.your}</small><b>{answers[item.id] || '—'}</b></p><i>→</i><p className="is-right"><small>{c.right}</small><b>{item.answer}</b></p></div></div>
          </article>)}</div>}
        </section>
        <div className="public-diag-actions"><button type="button" className="public-diag-secondary" onClick={begin}>{c.retry}</button><button type="button" className="public-diag-primary" onClick={registerWithResult}>{c.account} →</button></div>
      </main>}
    </div>
  );
}
