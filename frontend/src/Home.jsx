import React, { lazy, Suspense } from 'react';
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
import { studyPlanDate } from './studyPlan.js';
import { topicName } from './diagnosticData.js';
import './Home.css';

const HomeCourseProgress = lazy(() => import('./HomeCourseProgress.jsx'));

const Arrow = () => <span aria-hidden="true">↗</span>;
const label = (topic, ru) => topic ? (ru ? topic.nameRu || topic.name : topic.name) : '';
const Bar = ({ value, label: text }) => <div className="sh-bar" role="progressbar" aria-label={text} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><i style={{ width: `${value}%` }} /></div>;

// The view receives data explicitly so all loading, new-student and recovery
// states can be checked without signing into a real child's account.
export function HomeView({ go, name, avatar, xp = 0, onTrainTopic, courseContent, lang = 'kk', overview = emptyHomeOverview(),
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
    continue: ['Продолжим путь', `Твоя тема — «${topicTitle}». Несколько задач помогут закрепить её.`, 'Продолжить тему'],
    recommended: ['Начнём с важного', `По результатам диагностики стоит повторить «${topicTitle}».`, 'Начать практику'],
    review: ['Шаг за шагом', `Повторим «${topicTitle}». Цель недели — 3 верных ответа в этой теме.`, 'Повторить тему'],
    resumeTraining: ['Закончим начатое?', 'Вернись к незавершённой задаче и продолжи тренировку.', 'Вернуться к задаче'],
    resumeDiagnostic: ['Проверим знания', 'Продолжи диагностику. Сохранённые ответы уже учтены.', 'Продолжить диагностику'],
    diagnosis: ['С чего начнём?', 'Узнай сильные темы и то, что стоит повторить.', 'Пройти диагностику'],
    lessons: ['Время учиться', 'Выбери тему и закрепи её практикой.', 'Продолжить обучение'],
    done: ['На сегодня всё!', 'Дневной лимит задач использован. Посмотри результаты и возвращайся завтра.', 'Посмотреть результаты'],
    practice: ['Время для практики', 'Одна тема и несколько задач — начни с малого.', 'Выбрать тему'],
  } : {
    continue: ['Тағы бір қадам', `Тақырыбың — «${topicTitle}». Бірнеше есеппен біліміңді бекіт.`, 'Тақырыпты жалғастыру'],
    recommended: ['Бірге үйренейік', `Диагностика бойынша «${topicTitle}» тақырыбын қайталаған жөн.`, 'Жаттығуды бастау'],
    review: ['Алға бір қадам', `«${topicTitle}» тақырыбын қайталайық. Апта мақсаты — осы тақырыптан 3 дұрыс жауап.`, 'Тақырыпты қайталау'],
    resumeTraining: ['Есепке оралайық', 'Аяқталмаған есепке оралып, жаттығуды жалғастыр.', 'Есепке оралу'],
    resumeDiagnostic: ['Біліміңді тексер', 'Диагностиканы жалғастыр. Сақталған жауаптар ескеріледі.', 'Диагностиканы жалғастыру'],
    diagnosis: ['Алғашқы қадам', 'Мықты тұстарыңды және қайталауды қажет ететін тақырыптарды анықта.', 'Диагностикадан өту'],
    lessons: ['Оқу уақыты', 'Тақырыпты таңдап, жаттығумен бекіт.', 'Оқуды жалғастыру'],
    done: ['Мақсатқа жеттің!', 'Бүгінгі есеп лимитін пайдаландың. Нәтижелеріңді көріп, ертең қайта кел.', 'Нәтижелерді көру'],
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
  const format = (value) => value === null ? '—' : value.toLocaleString('ru-RU');
  const rewardTitle = model.reward?.title?.[lang] || model.reward?.title?.ru;
  const week = model.plan;
  const weekdays = ru ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['Дс','Сс','Ср','Бс','Жм','Сб','Жс'];
  const dateLabel = (key) => studyPlanDate(key, lang);
  const weeklyLabels = ru ? { days: '3 дня практики', answers: '15 решённых задач', review: '3 верных ответа в теме для повторения' } : { days: '3 күн жаттығу', answers: '15 шығарылған есеп', review: 'Қайталау тақырыбынан 3 дұрыс жауап' };
  const openWeeklyReview = () => pendingTraining ? go('training') : week.review.topic ? openTopic(week.review.topic) : go('diagnosis');

  return <main className="student-home">
    <header className="sh-heading">
      <div><p>{ru ? 'ТВОЯ ПОДГОТОВКА' : 'СЕНІҢ ДАЙЫНДЫҒЫҢ'}</p><h1>{ru ? 'Привет' : 'Сәлем'}, {name || (ru ? 'друг' : 'досым')}!</h1></div>
      <span className="sh-level"><span aria-hidden="true">✦</span> {level} {ru ? 'уровень' : 'деңгей'}</span>
    </header>

    <section className="sh-hero" aria-labelledby="student-next-step">
      <div className="sh-hero-top"><div><span className="sh-hero-tag">{ru ? 'ТВОЙ СЛЕДУЮЩИЙ ШАГ' : 'КЕЛЕСІ ҚАДАМЫҢ'}</span><h2 id="student-next-step">{title}</h2></div>
        <div className="sh-owl-scene" aria-hidden="true"><span className="sh-math-orbit">×</span><span className="sh-math-orbit">+</span><span className="sh-math-orbit">÷</span><img src={goalDone ? '/mascot/synaq-owl-celebrate.webp' : '/mascot/synaq-owl-study.webp'} width="640" height="640" alt="" decoding="async" /></div></div>
      <p className="sh-hero-description">{description}</p>
      <button className="sh-primary" type="button" onClick={continueStudy}>{action}<Arrow /></button>
      <span className="sh-hero-note">{ru ? 'Маленькие шаги. Настоящий прогресс.' : 'Шағын қадамдар. Нақты нәтиже.'}</span>
    </section>

    <dl className="sh-stats">
      <div><dt>{ru ? 'Задач сегодня' : 'Бүгінгі есептер'}</dt><dd>{format(model.todayCount)}</dd></div>
      <div><dt>{ru ? 'Точность ответов' : 'Жауап дәлдігі'}</dt><dd>{model.accuracy === null ? '—' : `${model.accuracy}%`}</dd></div>
      <div><dt>{ru ? 'Твои коины' : 'Сенің коиндарың'}</dt><dd><span className="sh-coin" aria-hidden="true">S</span><span className="sh-stat-number">{format(model.balance)}</span></dd></div>
    </dl>
    <p className="sh-stats-note">{overview.attempts.status === 'loading' ? (ru ? 'Загружаем историю ответов…' : 'Жауаптар тарихы жүктелуде…') : overview.attempts.status === 'error' ? (ru ? 'История ответов пока недоступна.' : 'Жауаптар тарихы әзірге қолжетімсіз.') : model.answerCount ? (ru ? `Точность по последним ${model.answerCount} ответам в практике.` : `Дәлдік жаттығудағы соңғы ${model.answerCount} жауап бойынша.`) : (ru ? 'Точность появится после первых ответов в практике.' : 'Дәлдік жаттығудағы алғашқы жауаптардан кейін көрсетіледі.')}</p>
    {hasError && <div className="sh-notice" role="status"><p>{ru ? 'Часть данных не загрузилась. Можно продолжить занятия или попробовать ещё раз.' : 'Кейбір деректер жүктелмеді. Оқуды жалғастыруға немесе қайта жүктеуге болады.'}</p><button type="button" onClick={onRetry}>{ru ? 'Обновить данные' : 'Деректерді жаңарту'}</button></div>}

    <section className="sh-week" aria-labelledby="student-week">
      <div className="sh-section-title"><div><span className="sh-eyebrow">{dateLabel(week.week.start)} — {dateLabel(week.week.end)}</span><h2 id="student-week">{ru ? 'Твоя неделя маленьких побед' : 'Шағын жеңістер аптасы'}</h2></div><span className="sh-week-score">{format(week.completedCount)}<small> / 3</small><span>{ru ? 'цели' : 'мақсат'}</span></span></div>
      <div className="sh-week-layout"><div className="sh-week-calendar" aria-label={ru ? 'Дни практики на этой неделе' : 'Осы аптадағы жаттығу күндері'}>{week.days.map(day => <div key={day.key} className={`${day.active ? 'active' : ''} ${day.isToday ? 'today' : ''} ${day.isFuture ? 'future' : ''}`} aria-current={day.isToday ? 'date' : undefined} aria-label={`${dateLabel(day.key)}: ${day.isFuture ? (ru ? 'впереди' : 'алда') : day.count === null ? (ru ? 'нет данных' : 'дерек жоқ') : `${day.count}${day.exact ? '' : '+'} ${ru ? 'задач' : 'есеп'}`}`}><span>{weekdays[day.index]}</span><b aria-hidden="true">{day.active ? '✓' : day.isFuture ? '·' : day.active === null ? '—' : '·'}</b><small>{day.isToday ? (ru ? 'сегодня' : 'бүгін') : Number(day.key.slice(-2))}</small></div>)}</div>
        <div className="sh-week-goals">{week.milestones.map(milestone => <div className={milestone.done ? 'done' : ''} key={milestone.id}><span className="sh-goal-check" aria-hidden="true">{milestone.done ? '✓' : '○'}</span><div><strong>{weeklyLabels[milestone.id]}</strong>{milestone.id === 'review' && <small>{week.review.needsDiagnostic ? (ru ? 'Сначала пройди диагностику' : 'Алдымен диагностикадан өт') : label(week.review.topic, ru)}</small>}</div><b>{milestone.current === null ? '—' : `${Math.min(milestone.target, milestone.current)}${!milestone.exact && !milestone.done ? '+' : ''}`}<small>/{milestone.target}</small></b></div>)}</div></div>
      <div className="sh-week-bottom"><p>{week.completedCount === null ? (ru ? 'План появится после загрузки результатов.' : 'Жоспар нәтижелер жүктелгенде көрсетіледі.') : !week.historyComplete ? (ru ? 'Учтена доступная история. «+» означает не меньше указанного.' : 'Қолжетімді тарих есепке алынды. «+» — көрсетілгеннен кем емес.') : (ru ? 'Отметки появляются автоматически после ответов на задачи.' : 'Белгілер есепке жауап бергеннен кейін автоматты түрде қойылады.')}</p>{week.completedCount !== null && !week.review.done && <button type="button" className="sh-text-link" onClick={openWeeklyReview}>{week.review.needsDiagnostic ? (ru ? 'Найти тему для повторения' : 'Қайталау тақырыбын анықтау') : (ru ? 'Повторить тему' : 'Тақырыпты қайталау')} <Arrow /></button>}</div>
    </section>

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

    {courseContent}

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

    <section className="sh-companion" aria-label={ru ? 'Твой питомец и опыт' : 'Сенің досың және тәжірибең'}><PetCreature pet={pet.id} stage={stage.stage} progress={stage.progress} size={64} label={`${ru ? pet.ru : pet.kk}: ${ru ? stage.ru : stage.kk}`} /><div><strong>{ru ? pet.ru : pet.kk} · {ru ? stage.ru : stage.kk}</strong><p>{format(totalXp)} XP · {ru ? 'Опыт и уровень сохраняются при обмене коинов' : 'Коин айырбастағанда тәжірибе мен деңгей сақталады'}</p></div><div className="sh-companion-growth"><span>{stage.next ? `${format(stage.xpToNext)} XP ${ru ? 'до роста' : 'өсімге дейін'}` : (ru ? 'Высшая стадия!' : 'Ең жоғары саты!')}</span><Bar value={Math.round(stage.progress * 100)} label={ru ? 'Рост питомца' : 'Досыңның өсуі'} /></div></section>

    <nav className="sh-shortcuts" aria-label={ru ? 'Ещё для подготовки' : 'Дайындыққа қосымша'}>
      <button type="button" className="sh-logic-shortcut" onClick={() => pendingTraining ? go('training') : openTopic(STATIC_TOPICS.find(topic => topic.id === 'comb' && topic.gradableCount > 0))}><span aria-hidden="true">◇</span><strong>{ru ? 'Прокачай логику' : 'Логиканы дамыт'}</strong><small>{ru ? 'Находи связи и закономерности' : 'Байланыс пен заңдылықтарды тап'}</small><Arrow /></button>
      <button type="button" onClick={() => go('mock')}><span aria-hidden="true">▤</span><strong>{ru ? 'Пробный экзамен' : 'Сынақ емтиханы'}</strong><small>БИЛ · НИШ · РФМШ</small><Arrow /></button>
      <button type="button" onClick={() => go('mentor')}><span aria-hidden="true">✳</span><strong>{ru ? 'Урок с наставником' : 'Тәлімгермен сабақ'}</strong><small>{ru ? 'Разберитесь в сложном вместе' : 'Күрделі тақырыпты бірге түсініңдер'}</small><Arrow /></button>
    </nav>
  </main>;
}

export default function Home({ uid, initialDiagnostic, grade, plan, onOpenCurriculum, ...props }) {
  const { lang } = useLang();
  const { overview, retry } = useHomeOverview(uid);
  const sections = initialDiagnostic ? { ...overview, diagnostics: { ...overview.diagnostics, value: [
    ...(overview.diagnostics.value || []), { ...initialDiagnostic, source: 'public', topics: initialDiagnostic.topics.map((item) => ({ ...item,
      moduleId: `public-${item.id}`, title: { ru: topicName(item.id, 'ru'), kk: topicName(item.id, 'kk') } })) },
  ] } } : overview;
  const courseContent = <Suspense fallback={<div className="sh-course-loading">{lang === 'ru' ? 'Загружаем твои уроки…' : 'Сабақтарың жүктелуде…'}</div>}><HomeCourseProgress uid={uid} grade={grade} plan={plan} lang={lang} attempts={overview.attempts.value} historyStatus={overview.attempts.status} onOpen={onOpenCurriculum || (() => props.go('curriculum'))} /></Suspense>;
  return <HomeView {...props} lang={lang} overview={sections} onRetry={retry} courseContent={courseContent}
    pendingTraining={!!readPendingTraining(uid)} pendingDiagnostic={!!readDiagnosticProgress(uid)} />;
}
