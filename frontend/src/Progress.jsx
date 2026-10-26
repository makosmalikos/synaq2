import React, { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import { auth, getAttempts, getMocks, getPlatformDiagnostics, getXpSummary, watchPro } from './firebase.js';
import { mockDisplayScore, formatStudyTime } from './analytics.js';
import { loadTopicCatalog } from './topicCatalog.js';
import { buildDiagnosis, pickDiagnosticMock } from './diagnosis.js';
import { buildProgressModel, formatProgressDate, PROGRESS_ATTEMPT_LIMIT } from './progressModel.js';
import DiagnosisReport from './components/DiagnosisReport.jsx';
import BrandLoader from './components/BrandLoader.jsx';
import MockResults from './components/MockResults.jsx';
import './Progress.css';
import { trainingTopicName } from './trainingCatalogModel.js';
import useReportRefresh from './useReportRefresh.js';
import { readWithDeadline } from './readDeadline.js';

const Arrow = () => <span aria-hidden="true">→</span>;
const topicLabel = (topic, ru) => trainingTopicName(topic, ru ? 'ru' : 'kk');

export default function Progress(props) {
  const uid = auth.currentUser?.uid || null;
  // The entire screen belongs to this child, including an open review, filter
  // and focus target. A key change resets them before the next child renders.
  return React.createElement(ProgressAccount, { ...props, uid, key: uid || 'signed-out' });
}

function ProgressAccount({ uid, onXpLoad, onTrainTopic, onGoDiagnostic }) {
  const { t, lang } = useLang();
  const ru = lang === 'ru';
  const [stats, setStats] = useState(null);
  const [mocks, setMocks] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [topics, setTopics] = useState([]);
  const [pro, setPro] = useState(null);
  const [xpInfo, setXpInfo] = useState({ xp: 0, studySecs: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);
  const [open, setOpen] = useState(null);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const returnToMock = useRef(null);
  useReportRefresh(setLoadRetry, Boolean(uid) && !open);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const isCurrent = () => active && auth.currentUser?.uid === uid;
    setLoading(true);
    setLoadError(false);
    setPro(null);
    if (!uid) {
      setLoading(false);
      setLoadError(true);
      return () => { active = false; };
    }
    let resolveEntitlement, rejectEntitlement;
    const entitlement = new Promise((resolve, reject) => { resolveEntitlement = resolve; rejectEntitlement = reject; });
    const stopPro = watchPro(uid, (value) => {
      resolveEntitlement();
      if (isCurrent()) setPro(value);
    }, (error) => {
      console.error('progress entitlement load failed', error);
      rejectEntitlement(error);
      if (isCurrent()) { setPro(null); setLoadError(true); }
    });
    (async () => {
      try {
        const [att, mk, topicList, xp, diagnosticResults] = await readWithDeadline(() => Promise.all([
          getAttempts(uid, PROGRESS_ATTEMPT_LIMIT), getMocks(uid), loadTopicCatalog(), getXpSummary(uid), getPlatformDiagnostics(uid),
          entitlement,
        ]), { signal: controller.signal });
        const nextStats = buildProgressModel({ attempts: att, topics: topicList });
        if (!isCurrent()) return;
        setDiagnostics(diagnosticResults);
        setTopics(topicList);
        setStats(nextStats);
        setMocks(mk);
        setXpInfo(xp);
        onXpLoad?.(xp.xp || 0);
      } catch (error) {
        console.error('progress load failed', error);
        if (isCurrent()) setLoadError(true);
      } finally {
        if (isCurrent()) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); stopPro(); };
  }, [uid, loadRetry, onXpLoad]);

  useEffect(() => {
    if (!open && returnToMock.current !== null) document.getElementById(`progress-mock-${returnToMock.current}`)?.focus();
  }, [open]);

  if (loadError) return (
    <main className="student-progress">
      <header className="sp-heading"><h1>{t('prog.title')}</h1></header>
      <section className="sp-state sp-error" role="alert">
        <span className="sp-state-icon" aria-hidden="true">↻</span>
        <h2>{ru ? 'Результаты пока не загрузились' : 'Нәтижелер әзірге жүктелмеді'}</h2>
        <p>{ru ? 'Проверь соединение и попробуй ещё раз.' : 'Байланысты тексеріп, қайталап көр.'}</p>
        <button type="button" className="sp-button" onClick={() => setLoadRetry((value) => value + 1)}>{ru ? 'Повторить' : 'Қайталау'}</button>
      </section>
    </main>
  );
  if (loading || !stats || pro === null) return <main className="student-progress" aria-busy="true"><header className="sp-heading"><h1>{t('prog.title')}</h1></header><BrandLoader /></main>;

  if (open) return <MockResults key={open.id || returnToMock.current} result={open} school={open.school} lang={lang}
    backLabel={ru ? 'К моему прогрессу' : 'Менің прогресіме'} onBack={() => setOpen(null)} />;

  const { accuracy, answerCount, totalSeconds, week, next, historyLimited } = stats;
  const maxSeconds = Math.max(1, ...week.map(day => day.seconds));
  const errorTopics = stats.topics.filter(topic => topic.wrong > 0);
  const visibleTopics = onlyErrors ? errorTopics : stats.topics;
  const latestDiagnostic = diagnostics.find(item => item.completedAt && item.total > 0 && Number.isFinite(item.readiness) && item.topics?.length);
  const diagMock = pickDiagnosticMock(mocks);
  const diagnosis = diagMock?.review?.length ? buildDiagnosis(diagMock.review, topics, lang) : null;
  const proUnlockHint = () => alert(t('diag.parentPro'));
  const weekdays = ru ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс'];

  return (
    <main className="student-progress">
      <header className="sp-heading"><p className="sp-eyebrow">{ru ? 'КАЖДЫЙ ОТВЕТ — ШАГ ВПЕРЁД' : 'ӘР ЖАУАП — АЛҒА ҚАДАМ'}</p><h1>{t('prog.title')}</h1><p>{ru ? 'Посмотри, что уже получается и что можно потренировать дальше.' : 'Не жақсы шығып жатқанын көріп, келесі жаттығуға тақырып таңда.'}</p></header>

      <section className="sp-next" aria-labelledby="progress-next-title">
        <div className="sp-next-copy"><span className="sp-next-tag">{ru ? 'ТВОЙ СЛЕДУЮЩИЙ ШАГ' : 'КЕЛЕСІ ҚАДАМЫҢ'}</span>
          <h2 id="progress-next-title">{next ? (next.kind === 'review' ? (ru ? 'Давай разберём ошибки' : 'Қателерді бірге талдайық') : (ru ? 'Отличное начало. Продолжим?' : 'Жақсы бастама. Жалғастырайық?')) : (ru ? 'Узнай, с чего начать' : 'Неден бастау керегін біл')}</h2>
          {next ? <><p className="sp-next-topic">{topicLabel(next.topic, ru)}</p><p>{next.kind === 'review' ? (ru ? `Верно ${next.topic.correct} из ${next.topic.total} ответов. Ещё немного практики поможет разобраться.` : `${next.topic.total} жауаптың ${next.topic.correct}-і дұрыс. Тағы біраз жаттығу тақырыпты түсінуге көмектеседі.`) : (ru ? 'В этой теме пока нет ошибок. Закрепи результат на следующих задачах.' : `Бұл тақырыптағы ${next.topic.total} жауаптың бәрі дұрыс. Келесі есептермен нәтижеңді бекіт.`)}</p>
            {onTrainTopic && <button type="button" className="sp-button sp-button-mint" onClick={() => onTrainTopic(next.topic.id)}>{next.kind === 'review' ? (ru ? 'Потренировать тему' : 'Тақырыпты жаттықтыру') : (ru ? 'Продолжить практику' : 'Жаттығуды жалғастыру')}<Arrow /></button>}
          </> : <><p>{ru ? 'Пройди диагностику: она поможет выбрать тему для первых занятий.' : 'Диагностикадан өт: ол алғашқы сабақтарға тақырып таңдауға көмектеседі.'}</p><button type="button" className="sp-button sp-button-mint" onClick={onGoDiagnostic}>{ru ? 'Пройти диагностику' : 'Диагностикадан өту'}<Arrow /></button></>}
        </div>
        <img className="sp-owl" src="/mascot/synaq-owl-study.webp" width="640" height="640" alt="" decoding="async" />
      </section>

      <dl className="sp-summary">
        <div className="sp-summary-accuracy"><dt>{ru ? 'Точность в практике' : 'Жаттығудағы дәлдік'}</dt><dd>{accuracy === null ? '—' : `${accuracy}%`}</dd><span>{answerCount ? (ru ? `${stats.correct} из ${answerCount} ответов верно` : `${answerCount} жауаптың ${stats.correct}-і дұрыс`) : (ru ? 'После первых ответов' : 'Алғашқы жауаптардан кейін')}</span></div>
        <div className="sp-summary-time"><dt>{ru ? 'Практика за неделю' : 'Аптадағы жаттығу'}</dt><dd>{formatStudyTime(totalSeconds, lang)}</dd><span>{ru ? 'Время решения задач' : 'Есеп шығаруға кеткен уақыт'}</span></div>
        <div className="sp-summary-xp"><dt>{ru ? 'Твой опыт' : 'Сенің тәжірибең'}</dt><dd>{(xpInfo.xp || 0).toLocaleString(ru ? 'ru-RU' : 'kk-KZ')} <small>XP</small></dd><span>{ru ? 'Опыт для роста и уровня' : 'Өсу мен деңгейге арналған тәжірибе'}</span></div>
      </dl>
      <p className="sp-data-note">{historyLimited ? (ru ? `Показаны подтверждённые ответы из последних ${PROGRESS_ATTEMPT_LIMIT} записей практики. Более ранние занятия могут не попасть в итог недели.` : `Жаттығудағы соңғы ${PROGRESS_ATTEMPT_LIMIT} жазбаның расталған жауаптары көрсетілген. Бұрынғы жаттығулар апта қорытындысына кірмеуі мүмкін.`) : (ru ? 'Точность и время считаются по подтверждённым ответам в практике. XP — опыт; коины для наград доступны в магазине.' : 'Дәлдік пен уақыт жаттығудағы расталған жауаптар бойынша есептеледі. XP — тәжірибе; сыйлық коиндары дүкенде көрсетіледі.')}</p>

      <section className="sp-topics" aria-labelledby="progress-topics-title">
        <div className="sp-section-head"><div><span className="sp-eyebrow">{ru ? 'УЧИМСЯ НА СВОИХ ОТВЕТАХ' : 'ЖАУАПТАРДАН ҮЙРЕНЕМІЗ'}</span><h2 id="progress-topics-title">{ru ? 'Твои темы' : 'Сенің тақырыптарың'}</h2></div>{!!stats.topics.length && <div className="sp-filters" role="group" aria-label={ru ? 'Показать темы' : 'Тақырыптарды көрсету'}><button type="button" aria-pressed={!onlyErrors} onClick={() => setOnlyErrors(false)}>{ru ? 'Все' : 'Барлығы'} <span>{stats.topics.length}</span></button><button type="button" aria-pressed={onlyErrors} onClick={() => setOnlyErrors(true)}>{ru ? 'Есть ошибки' : 'Қате бар'} <span>{errorTopics.length}</span></button></div>}</div>
        {visibleTopics.length ? <div className="sp-topic-grid">{visibleTopics.map(topic => <article className={`sp-topic-card${topic.wrong ? '' : ' sp-topic-clear'}`} key={topic.id}>
          <div className="sp-topic-top"><span className="sp-topic-badge">{topic.wrong ? (ru ? 'Можно повторить' : 'Қайталап көр') : (ru ? 'Без ошибок' : 'Қатесіз')}</span><strong>{topic.pct}%</strong></div>
          <h3>{topicLabel(topic, ru)}</h3>
          <div className="sp-meter" aria-hidden="true"><i style={{ width: `${topic.pct}%` }} /></div>
          <p className="sp-topic-count">{ru ? `Верно: ${topic.correct} из ${topic.total}` : `${topic.total} жауаптың ${topic.correct}-і дұрыс`} <span>· {ru ? `Ошибок: ${topic.wrong}` : `Қате: ${topic.wrong}`}</span></p>
          {topic.total < 5 && <p className="sp-small-sample">{ru ? 'Пока мало ответов — продолжай пробовать.' : 'Әзірге жауап аз — жаттығуды жалғастыр.'}</p>}
          {topic.canPractice && onTrainTopic ? <button type="button" className="sp-topic-action" onClick={() => onTrainTopic(topic.id)} aria-label={`${ru ? 'Практика' : 'Жаттығу'}: ${topicLabel(topic, ru)}`}>{ru ? 'Практика по теме' : 'Тақырып бойынша жаттығу'}<Arrow /></button> : <p className="sp-small-sample">{ru ? 'Новые задачи по теме появятся позже.' : 'Тақырып бойынша жаңа есептер кейін қосылады.'}</p>}
        </article>)}</div> : <div className="sp-state sp-topic-empty"><span className="sp-state-icon" aria-hidden="true">{onlyErrors ? '✓' : '↗'}</span><h3>{onlyErrors ? (ru ? 'В этих ответах нет ошибок' : 'Бұл жауаптарда қате жоқ') : (ru ? 'Здесь появятся твои результаты' : 'Мұнда сенің нәтижелерің пайда болады')}</h3><p>{onlyErrors ? (ru ? 'Выбери любую из своих тем и продолжай практику.' : 'Өз тақырыптарыңның бірін таңдап, жаттығуды жалғастыр.') : (ru ? 'Ответь на задачи в практике — увидишь точность и количество верных ответов по каждой теме.' : 'Жаттығуда есептерге жауап бер: әр тақырып бойынша дәлдік пен дұрыс жауап санын көресің.')}</p>{onlyErrors && <button type="button" className="sp-text-button" onClick={() => setOnlyErrors(false)}>{ru ? 'Показать все темы' : 'Барлық тақырыпты көрсету'}<Arrow /></button>}</div>}
      </section>

      <div className="sp-details-grid">
        <section className="sp-panel sp-week" aria-labelledby="progress-week-title"><div className="sp-section-head"><div><span className="sp-eyebrow">{ru ? 'ПОНЕМНОГУ КАЖДЫЙ ДЕНЬ' : 'КҮН САЙЫН АЗ-АЗДАН'}</span><h2 id="progress-week-title">{ru ? 'Практика на неделе' : 'Аптадағы жаттығу'}</h2></div></div>
          <div className="sp-week-chart" role="img" aria-label={week.map(day => `${weekdays[day.index]}: ${formatStudyTime(day.seconds, lang)}`).join('; ')}>{week.map(day => <div className="sp-week-day" key={day.key} aria-hidden="true"><div className="sp-week-track"><i style={{ height: day.seconds ? `${Math.max(5, day.seconds / maxSeconds * 100)}%` : '0%' }} /></div><span>{weekdays[day.index]}</span></div>)}</div>
          <p>{totalSeconds ? (ru ? `На этой неделе: ${formatStudyTime(totalSeconds, lang)} решения задач. Каждый подход — ещё один шаг.` : `Осы аптада: ${formatStudyTime(totalSeconds, lang)} есеп шығардың. Әр жаттығу — тағы бір қадам.`) : (ru ? 'На этой неделе пока нет времени практики. Начни с одной задачи.' : 'Осы аптада жаттығу уақыты әзірге жоқ. Бір есептен баста.')}</p>
        </section>
        <section className="sp-panel sp-diagnostic" aria-labelledby="progress-diagnostic-title"><span className="sp-eyebrow">{ru ? 'ВЗГЛЯД НА ПОДГОТОВКУ' : 'ДАЙЫНДЫҚҚА КӨЗҚАРАС'}</span><h2 id="progress-diagnostic-title">{ru ? 'Твоя диагностика' : 'Сенің диагностикаң'}</h2>
          {latestDiagnostic ? <><div className="sp-diagnostic-score"><strong>{latestDiagnostic.readiness}%</strong><span>{latestDiagnostic.correct}/{latestDiagnostic.total} {ru ? 'верных ответов' : 'дұрыс жауап'}<small>{fmtDate(latestDiagnostic.completedAt, lang)}</small></span></div><ul>{latestDiagnostic.topics.map((item, index) => <li key={item.moduleId || index}><span>{typeof item.title === 'string' ? item.title : item.title?.[lang] || item.title?.kk}</span><b>{item.pct}%</b></li>)}</ul></> : <p>{ru ? 'Диагностика помогает увидеть сильные стороны и выбрать, что повторить.' : 'Диагностика мықты тұстарыңды көруге және нені қайталау керегін таңдауға көмектеседі.'}</p>}
          <button type="button" className="sp-text-button" onClick={onGoDiagnostic}>{latestDiagnostic ? (ru ? 'Открыть диагностику' : 'Диагностиканы ашу') : (ru ? 'Пройти диагностику' : 'Диагностикадан өту')}<Arrow /></button>
        </section>
      </div>

      {!latestDiagnostic && diagnosis && <div className="sp-legacy-diagnosis"><DiagnosisReport diagnosis={diagnosis} pro={pro} onUnlock={proUnlockHint} onTrainTopic={pro ? onTrainTopic : undefined} compact /></div>}

      <section className="sp-mocks" aria-labelledby="progress-mocks-title"><div className="sp-section-head"><div><span className="sp-eyebrow">{ru ? 'ПОСМОТРИ И РАЗБЕРИСЬ' : 'ҚАРАП, ТҮСІНІП АЛ'}</span><h2 id="progress-mocks-title">{ru ? 'Твои пробные тесты' : 'Сенің сынақ тесттерің'}</h2></div><span className="sp-count">{mocks.length}</span></div>
        {mocks.length ? <div className="sp-mock-list">{mocks.map((mock, index) => <button type="button" id={`progress-mock-${index}`} className="sp-mock" key={index} onClick={() => { returnToMock.current = index; setOpen(mock); }}><span className="sp-mock-icon" aria-hidden="true">▤</span><span className="sp-mock-copy"><strong>{mock.school || (ru ? 'Пробный тест' : 'Сынақ тесті')}</strong><small>{fmtDate(mock.at, lang)}{mock.spentSec ? ` · ${fmtSpent(mock.spentSec)}` : ''}</small></span><span className="sp-mock-result"><strong>{mockDisplayScore(mock).score}/{mockDisplayScore(mock).max}</strong><small>{mock.school === 'БИЛ' || mock.scoring === 'bil' || mock.scoring === 'rfmsh' ? (ru ? 'баллов' : 'ұпай') : (ru ? 'верных ответов' : 'дұрыс жауап')}</small></span><Arrow /></button>)}</div> : <div className="sp-mock-empty"><p>{ru ? 'Пока нет завершённых пробных тестов. После первого здесь появятся результат и разбор задач.' : 'Әзірге аяқталған сынақ тесті жоқ. Бірінші сынақтан кейін нәтиже мен есептерді талдау осы жерде пайда болады.'}</p></div>}
      </section>
    </main>
  );
}

function fmtDate(at, lang) {
  return formatProgressDate(at, lang);
}
const fmtSpent = (seconds) => `${Math.floor(seconds / 60)} мин ${String(Math.floor(seconds % 60)).padStart(2, '0')} сек`;
