import React from 'react';
import { useLang } from './i18n.jsx';

function useDemoPlayback(delay = 0) {
  const rootRef = React.useRef(null);
  const timersRef = React.useRef([]);
  const [phase, setPhase] = React.useState(0);

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
  }, []);

  const play = React.useCallback(() => {
    clearTimers();
    setPhase(0);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setPhase(3);
      return;
    }
    timersRef.current = [
      window.setTimeout(() => setPhase(1), delay + 120),
      window.setTimeout(() => setPhase(2), delay + 920),
      window.setTimeout(() => setPhase(3), delay + 1540),
    ];
  }, [clearTimers, delay]);

  React.useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    if (!('IntersectionObserver' in window)) {
      play();
      return clearTimers;
    }
    let active = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.28 && !active) {
        active = true;
        play();
      } else if (!entry.isIntersecting) {
        active = false;
        clearTimers();
        setPhase(0);
      }
    }, { threshold: [0, 0.28] });
    observer.observe(node);
    return () => {
      observer.disconnect();
      clearTimers();
    };
  }, [clearTimers, play]);

  return { rootRef, phase };
}

function DemoShell({ type, label, children }) {
  const { lang } = useLang();
  const { rootRef, phase } = useDemoPlayback();
  const ru = lang === 'ru';
  return <article className={`lp-live-demo-card lp-live-demo-${type} lp-live-phase-${phase}`}>
    <div className="sx-demo-browserbar"><b>SYNAQ<span>●</span></b><span>{ru ? 'Твоя подготовка — в одном месте' : 'Дайындығың — бір платформада'}</span><small>{ru ? 'Демо' : 'Демо'}</small></div>
    <div className="sx-demo-workspace">
      <div className="sx-demo-sidebar" aria-hidden="true"><span>◈ &nbsp; {ru ? 'Моя подготовка' : 'Менің дайындығым'}</span><strong>{label}</strong><span>✦ &nbsp; {ru ? 'Достижения' : 'Жетістіктер'}</span><div>SYNAQ.APP</div></div>
      <div ref={rootRef} className="lp-live-demo-scene">{children(phase)}</div>
    </div>
  </article>;
}

function TaskScene({ phase, lang }) {
  return (
    <div className="lp-live-window lp-task-window">
      <div className="lp-live-window-head"><strong>{lang === 'ru' ? 'Тренировка' : 'Жаттығу'}</strong><span>{lang === 'ru' ? 'Математика' : 'Математика'}</span></div>
      <div className="lp-task-progress"><i /><i /><i className="on" /><i /><i /></div>
      <small>{lang === 'ru' ? 'Задание 3 из 5' : '5 тапсырманың 3-і'}</small>
      <h4>48 ÷ 6 = ?</h4>
      <div className="lp-task-options">
        {['6', '7', '8', '9'].map((answer) => <span className={answer === '8' && phase >= 2 ? 'chosen' : ''} key={answer}>{answer}{answer === '8' && phase === 3 ? <em>✓</em> : null}</span>)}
      </div>
      <div className={`lp-task-explain${phase === 3 ? ' is-visible' : ''}`}><b>✨ {lang === 'ru' ? 'Верно!' : 'Дұрыс!'}</b><span>{lang === 'ru' ? '8 × 6 = 48, поэтому 48 ÷ 6 = 8.' : '8 × 6 = 48, сондықтан 48 ÷ 6 = 8.'}</span></div>
    </div>
  );
}

function DiagnosticScene({ phase, lang }) {
  const rows = [
    [lang === 'ru' ? 'Вычисления' : 'Есептеулер', '86%', 'good'],
    [lang === 'ru' ? 'Дроби' : 'Бөлшектер', '62%', 'mid'],
    [lang === 'ru' ? 'Геометрия' : 'Геометрия', '38%', 'weak'],
  ];
  return (
    <div className="lp-live-window lp-live-diagnostic-window">
      <div className="lp-live-window-head"><strong>{lang === 'ru' ? 'Диагностика' : 'Диагностика'}</strong><span>10 {lang === 'ru' ? 'заданий' : 'тапсырма'}</span></div>
      <div className="lp-live-score"><strong>{phase === 3 ? '68%' : '—'}</strong><span>{lang === 'ru' ? 'результат' : 'нәтиже'}</span></div>
      <div className="lp-live-bars">{rows.map(([label, value, tone]) => <div className={tone} key={label}><span>{label}</span><i><b style={{ '--demo-width': value }} /></i><em>{phase === 3 ? value : '—'}</em></div>)}</div>
      <span className="lp-live-scene-action" aria-hidden="true">{lang === 'ru' ? 'Показать результат' : 'Нәтижені көрсету'}</span>
      <div className={`lp-live-weak-note${phase === 3 ? ' is-visible' : ''}`}>↗ {lang === 'ru' ? 'Найдены 2 слабые темы' : '2 әлсіз тақырып табылды'}</div>
    </div>
  );
}

function ParentScene({ phase, lang }) {
  return (
    <div className="lp-live-window lp-live-parent-window">
      <div className="lp-live-window-head"><strong>{lang === 'ru' ? 'Прогресс ребёнка' : 'Баланың прогресі'}</strong><span>{lang === 'ru' ? 'Эта неделя' : 'Осы апта'}</span></div>
      <div className="lp-live-parent-top"><div className="lp-live-avatar">А</div><div><strong>{lang === 'ru' ? 'Аружан · 6 класс' : 'Аружан · 6 сынып'}</strong><span>{lang === 'ru' ? 'Подготовка к НИШ' : 'НИШ-ке дайындық'}</span></div></div>
      <div className="lp-live-parent-score"><span>{lang === 'ru' ? 'Результат по темам' : 'Тақырыптар нәтижесі'}</span><strong>{phase === 3 ? '74%' : '68%'}</strong><i><b /></i></div>
      <div className="lp-live-week"><span><b>12</b>{lang === 'ru' ? 'задач' : 'есеп'}</span><span><b>4.2</b>{lang === 'ru' ? 'часа' : 'сағат'}</span><span><b>+6%</b>{lang === 'ru' ? 'рост' : 'өсім'}</span></div>
      <span className="lp-live-scene-action" aria-hidden="true">{lang === 'ru' ? 'Открыть рекомендацию' : 'Ұсынысты ашу'}</span>
      <div className={`lp-live-parent-tip${phase === 3 ? ' is-visible' : ''}`}><b>🎯 {lang === 'ru' ? 'Фокус недели' : 'Апта фокусы'}</b><span>{lang === 'ru' ? 'Закрепить дроби: 5 задач в день' : 'Бөлшектерді бекіту: күніне 5 есеп'}</span></div>
    </div>
  );
}

function MotivationScene({ phase, lang, type }) {
  const ru = lang === 'ru';
  const done = phase === 3;
  return (
    <div className="lp-live-window lp-motivation-window">
      <div className="lp-live-window-head"><strong>{type === 'duel' ? (ru ? 'Дуэль с другом' : 'Доспен дуэль') : type === 'coins' ? (ru ? 'Мои коины' : 'Менің коиндарым') : (ru ? 'Мой прогресс' : 'Менің прогресім')}</strong><span>{ru ? 'Пример' : 'Мысал'}</span></div>
      {type === 'duel' ? <>
        <div className="lp-duel-players"><div><i>А</i><span>{ru ? 'Ты' : 'Сен'}</span><b>{done ? '8' : '7'}</b></div><em>VS</em><div><i>Д</i><span>{ru ? 'Друг' : 'Дос'}</span><b>7</b></div></div>
        <div className="lp-motivation-question"><small>{ru ? 'Кто решит быстрее?' : 'Кім тезірек шығарады?'}</small><strong>25% × 80 = ?</strong></div>
        <div className="lp-duel-options"><span>10</span><span className={phase >= 2 ? 'selected' : ''}>20 {done && '✓'}</span><span>25</span></div>
        <div className={`lp-motivation-result${done ? ' is-visible' : ''}`}>{ru ? 'Верный ответ · +5 XP' : 'Дұрыс жауап · +5 XP'}</div>
      </> : type === 'coins' ? <>
        <div className={`lp-demo-coin${phase >= 2 ? ' earned' : ''}`} aria-hidden="true">✦</div>
        <div className="lp-reward-total"><small>{ru ? 'Доступно коинов' : 'Қолжетімді коиндар'}</small><strong>{done ? '125' : '120'}</strong></div>
        <div className="lp-reward-rule">1 XP = 1 {ru ? 'коин' : 'коин'}</div>
        <div className={`lp-motivation-result${done ? ' is-visible' : ''}`}>{ru ? 'Проверенный результат → коины' : 'Тексерілген нәтиже → коиндар'}</div>
      </> : <>
        <div className={`lp-demo-level${done ? ' level-up' : ''}`}><small>{ru ? 'Уровень' : 'Деңгей'}</small><strong>{done ? '2' : '1'}</strong></div>
        <div className="lp-reward-total"><small>{ru ? 'Опыт за подготовку' : 'Дайындық тәжірибесі'}</small><strong>{done ? '500' : '495'} <em>XP</em></strong></div>
        <div className="lp-xp-track"><i style={{width: done ? '100%' : '99%'}} /></div>
        <div className={`lp-motivation-result${done ? ' is-visible' : ''}`}>{ru ? '+5 XP · Новый уровень!' : '+5 XP · Жаңа деңгей!'}</div>
      </>}
    </div>
  );
}

function RewardsScene({ phase, lang }) {
  const done = phase === 3;
  const ru = lang === 'ru';
  return <div className="lp-live-window sx-rewards-window">
    <div className="lp-live-window-head"><strong>{ru ? 'Мой прогресс' : 'Менің прогресім'}</strong><span>{ru ? 'Пример' : 'Мысал'}</span></div>
    <img className="sx-rewards-art" src="/landing/mobile/reward-star-400.webp" decoding="async" alt="" width="260" height="260" loading="lazy" />
    <div className="sx-reward-stats"><div><span>{ru ? 'Опыт' : 'Тәжірибе'}</span><b>{done ? '500' : '495'} <small>XP</small></b></div><div><span>{ru ? 'Коины' : 'Коиндар'}</span><b>{done ? '125' : '120'} <small>✦</small></b></div></div>
    <div className="lp-xp-track"><i style={{width: done ? '100%' : '99%'}} /></div>
    <div className={`lp-motivation-result${done ? ' is-visible' : ''}`}>{ru ? '+5 XP · Уровень 2 · +5 коинов' : '+5 XP · 2-деңгей · +5 коин'}</div>
  </div>;
}

export default function LandingDemo() {
  const { lang } = useLang();
  const ru = lang === 'ru';
  const [active, setActive] = React.useState('task');
  const id = React.useId();
  const buttons = React.useRef([]);
  const tabsRef = React.useRef(null);
  const swipe = React.useRef(null);
  const features = [
    { type: 'task', label: ru ? 'Практика и ИИ' : 'Жаттығу және ЖИ', tag: ru ? 'РАЗОБРАТЬСЯ, А НЕ ЗАЗУБРИТЬ' : 'ЖАТТАУ ЕМЕС, ТҮСІНУ', title: ru ? 'Вместе найдём решение.' : 'Шешімін бірге табамыз.', text: ru ? 'Задачи, проверка ответа и разбор непонятного с ИИ-помощником.' : 'Есеп шығару, жауапты тексеру және түсінбегенді ЖИ-көмекшімен талдау.', result: ru ? 'Ответ проверен, объяснение показано' : 'Жауап тексерілді, түсіндірме көрсетілді', scene: TaskScene },
    { type: 'diagnostic', label: ru ? 'Диагностика' : 'Диагностика', tag: ru ? 'СВОЯ ТОЧКА СТАРТА' : 'ӨЗ БАСТАУ НҮКТЕҢ', title: ru ? 'Понятно, с чего начать.' : 'Неден бастау керегі түсінікті.', text: ru ? 'Результат по темам помогает увидеть, что уже получается, а чему уделить больше внимания. После диагностики — план практики на неделю.' : 'Тақырыптар бойынша нәтиже нені меңгергеніңізді және неге көңіл бөлу керегін көрсетеді. Диагностикадан кейін — бір апталық жоспар.', result: ru ? 'Найдены темы для повторения' : 'Қайталауға арналған тақырыптар анықталды', scene: DiagnosticScene },
    { type: 'duel', label: ru ? 'Дуэли' : 'Дуэльдер', tag: ru ? 'ДРУЖЕСКИЙ ВЫЗОВ' : 'ДОСТЫҚ САЙЫС', title: ru ? 'Кто решит быстрее?' : 'Кім тезірек шығарады?', text: ru ? 'Пригласи друга на математическую дуэль. Одни и те же задачи, очки за верные ответы и скорость — и ещё один повод потренироваться.' : 'Досыңды математикалық дуэльге шақыр. Бірдей есептер, дұрыс жауап пен жылдамдыққа ұпай — жаттығуға тағы бір себеп.', result: ru ? 'Верный ответ меняет счёт' : 'Дұрыс жауап есепті өзгертеді', scene: MotivationScene },
    { type: 'rewards', label: ru ? 'XP и коины' : 'XP және коиндар', tag: ru ? 'МАЛЕНЬКИЕ ПОБЕДЫ КАЖДЫЙ ДЕНЬ' : 'КҮН САЙЫНҒЫ ШАҒЫН ЖЕҢІСТЕР', title: ru ? 'Старания становятся видимыми.' : 'Еңбегіңнің нәтижесі көрінеді.', text: ru ? 'За проверенный результат начисляются XP и коины. Опыт повышает уровень, а коины можно копить на награды в каталоге.' : 'Тексерілген нәтиже үшін XP және коин беріледі. Тәжірибе деңгейіңді көтереді, ал коиндарды каталогтағы сыйлықтарға жинауға болады.', result: ru ? 'Новый уровень и пополнение баланса' : 'Жаңа деңгей және толыққан баланс', scene: RewardsScene },
    { type: 'parent', label: ru ? 'Для родителей' : 'Ата-аналарға', tag: ru ? 'ПРОГРЕСС БЕЗ ДОГАДОК' : 'ПРОГРЕСС АНЫҚ КӨРІНЕДІ', title: ru ? 'Вы видите, как идут дела.' : 'Дайындық барысын көресіз.', text: ru ? 'Результаты по темам, время занятий и следующий шаг — в кабинете родителя.' : 'Тақырыптар нәтижесі, дайындық уақыты мен келесі қадам — ата-ана кабинетінде.', result: ru ? 'Рекомендация на неделю открыта' : 'Апталық ұсыныс ашылды', scene: ParentScene },
  ];
  const item = features.find((f) => f.type === active);
  const Scene = item.scene;
  const activeIndex = features.findIndex(f => f.type === active);
  const move = (direction) => setActive(features[(activeIndex + direction + features.length) % features.length].type);
  React.useEffect(() => {
    const rail = tabsRef.current;
    const tab = buttons.current[activeIndex];
    if (!rail || !tab) return;
    const keepVisible = () => {
      const left = tab.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
      if (left < rail.scrollLeft) rail.scrollLeft = left;
      else if (left + tab.offsetWidth > rail.scrollLeft + rail.clientWidth) rail.scrollLeft = left + tab.offsetWidth - rail.clientWidth;
    };
    keepVisible();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(keepVisible);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [activeIndex, lang]);
  const onPointerDown = (event) => {
    if (event.pointerType !== 'touch' || !event.isPrimary) { swipe.current = null; return; }
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    // No explicit capture or preventDefault: vertical pans and pinch zoom
    // belong to the browser. It cancels this gesture when scrolling begins.
  };
  const onPointerUp = (event) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
  };
  const onKeyDown = (e, index) => {
    let next;
    if (e.key === 'ArrowRight') next = (index + 1) % features.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + features.length) % features.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = features.length - 1;
    else return;
    e.preventDefault();
    setActive(features[next].type);
    buttons.current[next]?.focus({ preventScroll: true });
  };
  return <div className="sx-platform sx-gallery" role="region" aria-roledescription={ru ? 'карусель' : 'карусель'} aria-label={ru ? 'Знакомство с платформой' : 'Платформамен танысу'}>
    <div ref={tabsRef} className="sx-feature-tabs" role="tablist" aria-label={ru ? 'Возможности SYNAQ' : 'SYNAQ мүмкіндіктері'}>{features.map((f, index) => <button ref={(el) => { buttons.current[index] = el; }} key={f.type} type="button" role="tab" id={`${id}-tab-${f.type}`} aria-controls={`${id}-panel`} aria-selected={active === f.type} tabIndex={active === f.type ? 0 : -1} onClick={() => setActive(f.type)} onKeyDown={(e) => onKeyDown(e,index)}>{f.label}</button>)}</div>
    <div className="sx-gallery-stage">
      <div className="sx-gallery-peek sx-gallery-peek-left" aria-hidden="true"><b>SYNAQ</b><i /><i /><i /></div>
      <div className="sx-gallery-peek sx-gallery-peek-right" aria-hidden="true"><b>SYNAQ</b><i /><i /><i /></div>
      <button className="sx-gallery-arrow sx-gallery-prev" type="button" aria-label={ru ? 'Предыдущая возможность' : 'Алдыңғы мүмкіндік'} aria-controls={`${id}-panel`} onClick={() => move(-1)}>‹</button>
      <div className="sx-feature-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} tabIndex={0} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null; }}>
        <DemoShell key={active} type={active} label={item.label}>{(phase) => <Scene phase={phase} lang={lang} type={active} />}</DemoShell>
      </div>
      <button className="sx-gallery-arrow sx-gallery-next" type="button" aria-label={ru ? 'Следующая возможность' : 'Келесі мүмкіндік'} aria-controls={`${id}-panel`} onClick={() => move(1)}>›</button>
    </div>
    <div className="sx-gallery-caption" aria-live="polite" aria-atomic="true"><h3>{item.title}</h3><p>{item.text}</p></div>
    <div className="sx-gallery-pagination"><span>{String(activeIndex + 1).padStart(2, '0')} / 05</span><small>{ru ? 'Пример работы платформы' : 'Платформа жұмысының мысалы'}</small></div>
  </div>;
}
