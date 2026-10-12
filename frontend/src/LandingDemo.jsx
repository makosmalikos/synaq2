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

function DemoCursor({ phase }) {
  return (
    <div className={`lp-live-cursor lp-live-cursor-phase-${phase}`} aria-hidden="true">
      <svg viewBox="0 0 28 32"><path d="M3 2.5 24 18l-9.2 1.7 5.1 8.3-4.2 2.5-5-8.3-5.9 7.2L3 2.5Z" /></svg>
      <i />
    </div>
  );
}

function DemoShell({ type, title, text, result, delay, children }) {
  const { lang } = useLang();
  const { rootRef, phase } = useDemoPlayback(delay);
  return (
    <article className={`lp-live-demo-card lp-live-demo-${type} lp-live-phase-${phase}`}>
      <div className="lp-live-demo-copy">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <div ref={rootRef} className="lp-live-demo-scene">
        {children(phase)}
        <DemoCursor phase={phase} />
      </div>
      <div className="lp-live-demo-foot">
        <span className={phase === 3 ? 'is-ready' : ''}>{phase === 3 ? result : (lang === 'ru' ? 'Показываем сценарий…' : 'Сценарий көрсетілуде…')}</span>

      </div>
    </article>
  );
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
      <div className="lp-live-score"><strong>{phase === 3 ? '68%' : '—'}</strong><span>{lang === 'ru' ? 'готовность' : 'дайындық'}</span></div>
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
      <div className="lp-live-parent-score"><span>{lang === 'ru' ? 'Готовность' : 'Дайындық'}</span><strong>{phase === 3 ? '74%' : '68%'}</strong><i><b /></i></div>
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

export default function LandingDemo() {
  const { lang } = useLang();
  return (
    <div className="lp-live-demo-grid">
      <DemoShell
        type="task"
        delay={0}
        title={lang === 'ru' ? 'Ребёнок решает — SYNAQ объясняет' : 'Бала шығарады — SYNAQ түсіндіреді'}
        text={lang === 'ru' ? 'Один ответ превращается в понятное объяснение, а не просто красную ошибку.' : 'Әр жауап жай ғана қатеге емес, түсінікті талдауға айналады.'}
        result={lang === 'ru' ? 'Ответ проверен, объяснение показано' : 'Жауап тексерілді, түсіндірме көрсетілді'}
      >
        {(phase) => <TaskScene phase={phase} lang={lang} />}
      </DemoShell>
      <DemoShell
        type="diagnostic"
        delay={260}
        title={lang === 'ru' ? 'Слабые темы видно сразу' : 'Әлсіз тақырыптар бірден көрінеді'}
        text={lang === 'ru' ? 'Диагностика собирает результат по темам и показывает, с чего начать.' : 'Диагностика әр тақырыптың нәтижесін жинап, неден бастау керегін көрсетеді.'}
        result={lang === 'ru' ? 'План подготовки готов' : 'Дайындық жоспары дайын'}
      >
        {(phase) => <DiagnosticScene phase={phase} lang={lang} />}
      </DemoShell>
      <DemoShell
        type="parent"
        delay={520}
        title={lang === 'ru' ? 'Родитель понимает, есть ли прогресс' : 'Ата-ана прогресті анық көреді'}
        text={lang === 'ru' ? 'Готовность, занятия и следующий фокус собраны в одном экране.' : 'Дайындық, сабақтар және келесі мақсат бір экранда жиналған.'}
        result={lang === 'ru' ? 'Рекомендация на неделю открыта' : 'Апталық ұсыныс ашылды'}
      >
        {(phase) => <ParentScene phase={phase} lang={lang} />}
      </DemoShell>
      {[
        ['duel', lang === 'ru' ? 'Решать вместе интереснее' : 'Бірге есеп шығару қызығырақ', lang === 'ru' ? 'Вызови друга на дуэль: одинаковые задачи, очки за верные ответы и скорость.' : 'Досыңды дуэльге шақыр: бірдей есептер, дұрыс жауап пен жылдамдық үшін ұпай.', lang === 'ru' ? 'Верный ответ меняет счёт' : 'Дұрыс жауап есепті өзгертеді'],
        ['coins', lang === 'ru' ? 'Старания приносят коины' : 'Еңбегің коинға айналады', lang === 'ru' ? 'За проверенный XP начисляются коины. Копи их и выбирай награды в каталоге.' : 'Тексерілген XP үшін коин беріледі. Оларды жинап, каталогтан сыйлық таңда.', lang === 'ru' ? 'Баланс пополнился' : 'Баланс толықты'],
        ['xp', lang === 'ru' ? 'Каждый шаг — новый опыт' : 'Әр қадам — жаңа тәжірибе', lang === 'ru' ? 'Решай задачи, зарабатывай XP и повышай уровень. Прогресс виден после каждого занятия.' : 'Есеп шығар, XP жина және деңгейіңді көтер. Әр сабақтан кейін прогресің көрінеді.', lang === 'ru' ? 'Достигнут следующий уровень' : 'Келесі деңгейге жеттің'],
      ].map(([type, title, text, result], index) => <DemoShell key={type} type={type} title={title} text={text} result={result} delay={index * 180}>
        {(phase) => <MotivationScene type={type} phase={phase} lang={lang} />}
      </DemoShell>)}
    </div>
  );
}
