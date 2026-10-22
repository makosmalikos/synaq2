import React from 'react';
import PetCreature from './PetCreature.jsx';
import { petStage } from './pets.js';
import { petAvatar } from './PetAvatar.jsx';
import { useLang } from './i18n.jsx';
import { xpLevel } from './xp.js';
import { STATIC_TOPICS } from './topicCatalog.generated.js';
import { readPendingTraining } from './trainingPersistence.js';
import { readDiagnosticProgress } from './platformDiagnostic.js';
import { DAILY_GOAL, emptyHomeOverview, homeModel } from './homeModel.js';
import { useHomeOverview } from './useHomeOverview.js';
import { topicName } from './diagnosticData.js';
import './Home.css';

const Arrow = () => <span aria-hidden="true">↗</span>;
const label = (topic, ru) => topic ? (ru ? topic.nameRu || topic.name : topic.name) : '';
const Bar = ({ value, label: text }) => <div className="sh-bar" role="progressbar" aria-label={text} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><i style={{ width: `${value}%` }} /></div>;

// The view receives data explicitly so all loading, new-student and recovery
// states can be checked without signing into a real child's account.
export function HomeView({ go, name, avatar, xp = 0, onTrainTopic, lang = 'kk', overview = emptyHomeOverview(),
  pendingTraining = false, pendingDiagnostic = false, onRetry = () => {} }) {
  const ru = lang === 'ru';
  const model = homeModel({
    attempts: overview.attempts.value || [], diagnostics: overview.diagnostics.value || [],
    topics: STATIC_TOPICS, daily: overview.daily.value, wallet: overview.wallet.value,
    historyReady: overview.attempts.status === 'ready' && overview.diagnostics.status === 'ready',
    pendingTraining, pendingDiagnostic,
  });
  const pet = petAvatar(avatar);
  const totalXp = Math.max(0, Number(xp) || 0, Number(overview.wallet.value?.xp) || 0);
  const stage = petStage(totalXp);
  const level = xpLevel(totalXp);
  const topicTitle = label(model.next.topic, ru);
  const copy = ru ? {
    continue: [topicTitle, 'Вернись к теме, которую решал в прошлый раз.', 'Продолжить тему'],
    recommended: [topicTitle, 'Начни с этой темы по результатам последней диагностики.', 'Начать практику'],
    resumeTraining: ['Закончим начатое?', 'Вернись к незавершённой задаче и продолжи тренировку.', 'Вернуться к задаче'],
    resumeDiagnostic: ['Продолжим диагностику', 'Вернись к проверке знаний. Сохранённые ответы уже учтены.', 'Продолжить диагностику'],
    diagnosis: ['Найди свою точку старта', 'Узнай сильные темы и то, что стоит повторить.', 'Пройти диагностику'],
    lessons: ['Вернёмся к урокам', 'Выбери тему и закрепи её практикой.', 'Продолжить обучение'],
    done: ['План на сегодня выполнен', 'Дневной лимит задач использован. Посмотри результаты и возвращайся завтра.', 'Посмотреть результаты'],
    practice: ['Время для практики', 'Одна тема и несколько задач — начни с малого.', 'Выбрать тему'],
  } : {
    continue: [topicTitle, 'Өткен жолы шығарған тақырыбыңды жалғастыр.', 'Тақырыпты жалғастыру'],
    recommended: [topicTitle, 'Соңғы диагностика нәтижесі бойынша осы тақырыптан баста.', 'Жаттығуды бастау'],
    resumeTraining: ['Бастағанды аяқтайық!', 'Аяқталмаған есепке оралып, жаттығуды жалғастыр.', 'Есепке оралу'],
    resumeDiagnostic: ['Диагностиканы жалғастыр', 'Біліміңді тексеруді жалғастыр. Сақталған жауаптар ескеріледі.', 'Диагностиканы жалғастыру'],
    diagnosis: ['Неден бастайтыныңды біл', 'Мықты тұстарыңды және қайталауды қажет ететін тақырыптарды анықта.', 'Диагностикадан өту'],
    lessons: ['Сабақтарға оралайық', 'Тақырыпты таңдап, жаттығумен бекіт.', 'Оқуды жалғастыру'],
    done: ['Бүгінгі жоспар орындалды', 'Бүгінгі есеп лимитін пайдаландың. Нәтижелеріңді көріп, ертең қайта кел.', 'Нәтижелерді көру'],
    practice: ['Жаттығу уақыты', 'Бір тақырып пен бірнеше есеп — аздан баста.', 'Тақырыпты таңдау'],
  };
  const [title, description, action] = copy[model.next.kind];
  const openTopic = (topic) => topic && onTrainTopic ? onTrainTopic(topic.id) : go('training');
  const continueStudy = () => model.next.topic ? openTopic(model.next.topic) : go(model.next.tab);
  // Recovery always takes precedence over starting a different practice topic.
  const practice = () => pendingTraining ? go('training') : openTopic(model.next.topic || model.weak?.topic);
  const hasError = Object.values(overview).some((section) => section.status === 'error');
  const progressLoading = overview.attempts.status === 'loading' || overview.diagnostics.status === 'loading';
  const goalDone = model.todayCount !== null && model.todayCount >= DAILY_GOAL;
  const format = (value) => value === null ? '—' : value.toLocaleString(ru ? 'ru-RU' : 'kk-KZ');
  const rewardTitle = model.reward?.title?.[lang] || model.reward?.title?.ru;

  return <main className="student-home">
    <header className="sh-heading">
      <div><p>{ru ? 'ТВОЯ ПОДГОТОВКА' : 'СЕНІҢ ДАЙЫНДЫҒЫҢ'}</p><h1>{ru ? 'Привет' : 'Сәлем'}, {name || (ru ? 'друг' : 'досым')}!</h1></div>
      <span className="sh-level"><span aria-hidden="true">✦</span> {level} {ru ? 'уровень' : 'деңгей'}</span>
    </header>

    <section className="sh-hero" aria-labelledby="student-next-step">
      <div className="sh-hero-top">
        <div><span className="sh-hero-tag">{ru ? 'ТВОЙ СЛЕДУЮЩИЙ ШАГ' : 'КЕЛЕСІ ҚАДАМЫҢ'}</span><h2 id="student-next-step">{title}</h2></div>
        <div className="sh-pet"><PetCreature pet={pet.id} stage={stage.stage} progress={stage.progress} size={150} label={`${ru ? pet.ru : pet.kk}: ${ru ? stage.ru : stage.kk}`} /></div>
      </div>
      <p className="sh-hero-description">{description}</p>
      <button className="sh-primary" type="button" onClick={continueStudy}>{action}<Arrow /></button>
      <div className="sh-pet-progress"><span><b>{ru ? pet.ru : pet.kk}</b> · {ru ? stage.ru : stage.kk}</span><span>{stage.next ? `${format(stage.xpToNext)} XP ${ru ? 'до роста' : 'өсімге дейін'}` : (ru ? 'Высшая стадия!' : 'Ең жоғары саты!')}</span><Bar value={Math.round(stage.progress * 100)} label={ru ? 'Рост питомца' : 'Досыңның өсуі'} /></div>
    </section>

    <dl className="sh-stats">
      <div><dt>{ru ? 'Задач сегодня' : 'Бүгінгі есептер'}</dt><dd>{format(model.todayCount)}</dd></div>
      <div><dt>{ru ? 'Точность ответов' : 'Жауап дәлдігі'}</dt><dd>{model.accuracy === null ? '—' : `${model.accuracy}%`}</dd></div>
      <div><dt>{ru ? 'Твои коины' : 'Сенің коиндарың'}</dt><dd><span className="sh-coin" aria-hidden="true">S</span><span className="sh-stat-number">{format(model.balance)}</span></dd></div>
    </dl>
    <p className="sh-stats-note">{overview.attempts.status === 'loading' ? (ru ? 'Загружаем историю ответов…' : 'Жауаптар тарихы жүктелуде…') : overview.attempts.status === 'error' ? (ru ? 'История ответов пока недоступна.' : 'Жауаптар тарихы әзірге қолжетімсіз.') : model.answerCount ? (ru ? `Точность по последним ${model.answerCount} ответам в практике.` : `Дәлдік жаттығудағы соңғы ${model.answerCount} жауап бойынша.`) : (ru ? 'Точность появится после первых ответов в практике.' : 'Дәлдік жаттығудағы алғашқы жауаптардан кейін көрсетіледі.')}</p>
    {hasError && <div className="sh-notice" role="status"><p>{ru ? 'Часть данных не загрузилась. Можно продолжить занятия или попробовать ещё раз.' : 'Кейбір деректер жүктелмеді. Оқуды жалғастыруға немесе қайта жүктеуге болады.'}</p><button type="button" onClick={onRetry}>{ru ? 'Обновить данные' : 'Деректерді жаңарту'}</button></div>}

    <div className="sh-study-grid">
      <section className="sh-card sh-plan" aria-labelledby="student-today">
        <div className="sh-section-title"><div><span className="sh-eyebrow">{ru ? 'ШАГ ЗА ШАГОМ' : 'ҚАДАМ-ҚАДАММЕН'}</span><h2 id="student-today">{ru ? 'Твой план на сегодня' : 'Бүгінгі жоспарың'}</h2></div><span className="sh-plan-mark" aria-hidden="true">✓</span></div>
        <div className="sh-daily-goal"><div><strong>{ru ? 'Цель — 5 задач' : 'Мақсат — 5 есеп'}</strong><span>{model.todayCount === null ? '—' : Math.min(DAILY_GOAL, model.todayCount)} / {DAILY_GOAL}</span></div>{model.todayCount !== null && <Bar value={Math.min(100, model.todayCount / DAILY_GOAL * 100)} label={ru ? 'Задачи за сегодня' : 'Бүгінгі есептер'} />}</div>
        <div className="sh-plan-steps">
          <button type="button" onClick={goalDone ? () => go('progress') : practice}><span className={`sh-step-number${goalDone ? ' done' : ''}`}>{goalDone ? '✓' : '1'}</span><span><strong>{goalDone ? (ru ? 'Пять задач — готово!' : 'Бес есеп — дайын!') : (ru ? 'Потренируйся на задачах' : 'Есеп шығарып жаттық')}</strong><small>{goalDone ? (ru ? 'Посмотри, что получилось' : 'Нәтижеңді көр') : (label(model.next.topic, ru) || (ru ? 'Выбери тему и начни с первой' : 'Тақырыпты таңдап, алғашқы есептен баста'))}</small></span><Arrow /></button>
          <button type="button" onClick={() => go(model.progressSource === 'diagnostic' ? 'diagnosis' : 'progress')}><span className="sh-step-number">2</span><span><strong>{model.fromPublicDiagnostic ? (ru ? 'Пройди полную диагностику' : 'Толық диагностикадан өт') : model.progressTopics.length ? (ru ? 'Посмотри свои результаты' : 'Нәтижелеріңді қара') : (ru ? 'Узнай свои сильные темы' : 'Мықты тақырыптарыңды біл')}</strong><small>{model.weak ? label(model.weak.topic, ru) : (ru ? 'Узнай, что стоит повторить' : 'Нені қайталау керегін біл')}</small></span><Arrow /></button>
          <button type="button" onClick={() => go('curriculum')}><span className="sh-step-number">3</span><span><strong>{ru ? 'Закрепи знания в уроках' : 'Сабақтарда біліміңді бекіт'}</strong><small>{ru ? 'Теория и практика по темам' : 'Тақырыптар бойынша теория мен жаттығу'}</small></span><Arrow /></button>
        </div>
      </section>

      <section className="sh-card sh-progress" aria-labelledby="student-progress">
        <div className="sh-section-title"><div><span className="sh-eyebrow">{ru ? 'ТВОИ РЕЗУЛЬТАТЫ' : 'СЕНІҢ НӘТИЖЕЛЕРІҢ'}</span><h2 id="student-progress">{ru ? 'Как идут дела' : 'Қалай келе жатырсың'}</h2></div><span className="sh-progress-mark" aria-hidden="true">↗</span></div>
        {model.progressTopics.length ? <>
          <p className="sh-muted">{model.fromPublicDiagnostic ? (ru ? 'По короткой диагностике' : 'Қысқа диагностика бойынша') : model.progressSource === 'diagnostic' ? (ru ? 'По последней диагностике' : 'Соңғы диагностика бойынша') : (ru ? `По последним ${model.answerCount} ответам в практике` : `Жаттығудағы соңғы ${model.answerCount} жауап бойынша`)}</p>
          <div className="sh-topic-results">{model.progressTopics.map((item) => <div key={item.moduleId || item.topic.id} className={item.pct >= 70 ? 'strong' : 'grow'}><div><span>{item.title?.[lang] || label(item.topic, ru)}</span><b>{item.pct}%</b></div><Bar value={item.pct} label={item.title?.[lang] || label(item.topic, ru)} /></div>)}</div>
          <button className="sh-text-link" type="button" onClick={() => go(model.progressSource === 'diagnostic' ? 'diagnosis' : 'progress')}>{model.fromPublicDiagnostic ? (ru ? 'Пройти полную диагностику' : 'Толық диагностикадан өту') : (ru ? 'Посмотреть подробнее' : 'Толығырақ көру')} <Arrow /></button>
        </> : <div className="sh-progress-empty"><div className="sh-mini-chart" aria-hidden="true"><i /><i /><i /></div><p>{progressLoading ? (ru ? 'Загружаем твои результаты…' : 'Нәтижелерің жүктелуде…') : hasError ? (ru ? 'Результаты пока недоступны.' : 'Нәтижелер әзірге қолжетімсіз.') : (ru ? 'У каждой сильной стороны есть начало. Узнай свои с диагностики.' : 'Әр мықты тұстың бастауы бар. Өз қабілетіңді диагностикадан біл.')}</p><button className="sh-text-link" type="button" onClick={() => go('diagnosis')}>{ru ? 'Открыть диагностику' : 'Диагностиканы ашу'} <Arrow /></button></div>}
      </section>
    </div>

    <div className="sh-extras-grid">
      <section className="sh-duel" aria-labelledby="student-duel">
        <div className="sh-duel-art" aria-hidden="true"><span>×</span><b>VS</b><span>÷</span></div>
        <span className="sh-eyebrow">{ru ? 'ВМЕСТЕ ИНТЕРЕСНЕЕ' : 'БІРГЕ ҚЫЗЫҚТЫРАҚ'}</span><h2 id="student-duel">{ru ? 'Кто решит быстрее?' : 'Кім жылдам шығарады?'}</h2><p>{ru ? 'Пригласи друга на дуэль. Решайте задачи, соревнуйтесь и получайте XP.' : 'Досыңды дуэльге шақыр. Есеп шығарып, жарысып, XP жинаңдар.'}</p><button type="button" className="sh-duel-button" onClick={() => go('duel')}>{ru ? 'Открыть дуэли' : 'Дуэльдерді ашу'} <Arrow /></button>
      </section>
      <section className="sh-card sh-reward" aria-labelledby="student-reward">
        <div className="sh-section-title"><div><span className="sh-eyebrow">{ru ? 'УЧЁБА ПРИНОСИТ БОЛЬШЕ' : 'ОҚУДЫҢ ПАЙДАСЫ КӨП'}</span><h2 id="student-reward">{ru ? 'Копи на свою награду' : 'Сыйлығыңа коин жина'}</h2></div><span className="sh-reward-icon" aria-hidden="true">✦</span></div>
        <p className="sh-wallet"><span className="sh-coin" aria-hidden="true">S</span><b>{format(model.balance)}</b> {ru ? 'коинов' : 'коин'}</p>
        {model.reward && model.balance !== null ? <><div className="sh-reward-caption"><strong>{rewardTitle}</strong><span>{format(model.reward.price)} S</span></div><Bar value={Math.min(100, Math.round(model.balance / model.reward.price * 100))} label={rewardTitle} /><p className="sh-muted">{model.coinsLeft ? (ru ? `До награды ещё ${format(model.coinsLeft)} коинов.` : `Сыйлыққа дейін ${format(model.coinsLeft)} коин қалды.`) : (ru ? 'Коинов достаточно! Обмен доступен в магазине.' : 'Коин жеткілікті! Дүкенде айырбастай аласың.')}</p></> : <p className="sh-muted">{ru ? 'Зарабатывай коины за занятия и выбирай награды в магазине.' : 'Оқу арқылы коин жинап, дүкеннен сыйлық таңда.'}</p>}
        {model.pendingReward && <p className="sh-pending-reward">{ru ? 'Заявка на награду уже отправлена' : 'Сыйлыққа өтінім жіберілді'}</p>}
        <button className="sh-text-link" type="button" onClick={() => go('rewards')}>{ru ? 'В магазин наград' : 'Сыйлықтар дүкеніне'} <Arrow /></button>
      </section>
    </div>

    <nav className="sh-shortcuts" aria-label={ru ? 'Ещё для подготовки' : 'Дайындыққа қосымша'}>
      <button type="button" onClick={() => go('mock')}><span aria-hidden="true">▤</span><strong>{ru ? 'Пробный экзамен' : 'Сынақ емтиханы'}</strong><small>БИЛ · НИШ · РФМШ</small><Arrow /></button>
      <button type="button" onClick={() => go('mentor')}><span aria-hidden="true">✳</span><strong>{ru ? 'Урок с наставником' : 'Тәлімгермен сабақ'}</strong><small>{ru ? 'Разберитесь в сложном вместе' : 'Күрделі тақырыпты бірге түсініңдер'}</small><Arrow /></button>
    </nav>
  </main>;
}

export default function Home({ uid, initialDiagnostic, ...props }) {
  const { lang } = useLang();
  const { overview, retry } = useHomeOverview(uid);
  const sections = initialDiagnostic ? { ...overview, diagnostics: { ...overview.diagnostics, value: [
    ...(overview.diagnostics.value || []), { ...initialDiagnostic, source: 'public', topics: initialDiagnostic.topics.map((item) => ({ ...item,
      moduleId: `public-${item.id}`, title: { ru: topicName(item.id, 'ru'), kk: topicName(item.id, 'kk') } })) },
  ] } } : overview;
  return <HomeView {...props} lang={lang} overview={sections} onRetry={retry}
    pendingTraining={!!readPendingTraining(uid)} pendingDiagnostic={!!readDiagnosticProgress(uid)} />;
}
