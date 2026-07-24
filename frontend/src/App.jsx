import React, { lazy, Suspense, useEffect, useState } from 'react';
import { watchAuth, isKid, logout, getMyProfile, getXpSummary } from './firebase.js';
import { useLang, LangSwitch } from './i18n.jsx';
import Auth from './Auth.jsx';
import Landing from './Landing.jsx';
import Home from './Home.jsx';
import League from './League.jsx';
import Brand from './Brand.jsx';

// Банк задач большой: загружаем его только вместе с экраном, которому он нужен.
const Parent = lazy(() => import('./Parent.jsx'));
const Progress = lazy(() => import('./Progress.jsx'));
const Duel = lazy(() => import('./Duel.jsx'));
const Training = lazy(() => import('./components/Training.jsx'));
const Mock = lazy(() => import('./components/Mock.jsx'));

const NAV = [
  { id: 'home', n: '01' }, { id: 'training', n: '02' }, { id: 'duel', n: '03' },
  { id: 'league', n: '04' }, { id: 'mock', n: '05' }, { id: 'progress', n: '06' },
];

const ScreenFallback = () => <div style={{ padding: 40, color: '#6B655B' }}>...</div>;

// Роут: '/' = лендинг, '/app' = авторизация → дашборд.
const readRoute = () =>
  (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) ? 'app' : 'landing';


export default function App() {
  const { t } = useLang();
  const [user, setUser] = useState(undefined);
  const [route, setRoute] = useState(readRoute);
  const [tab, setTab] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);   // бургер-меню на телефоне
  const [profile, setProfile] = useState({ name: 'Бала', klass: '', school: 'РФМШ' });
  const [xp, setXp] = useState(0);
  const [trainTopic, setTrainTopic] = useState(null);

  const [duelCode] = useState(() => {
    if (typeof window === 'undefined') return '';
    const fromUrl = new URLSearchParams(window.location.search).get('duel')?.toUpperCase() || '';
    if (fromUrl) {
      try { sessionStorage.setItem('synaq_duel', fromUrl); } catch {}
      return fromUrl;
    }
    try { return sessionStorage.getItem('synaq_duel')?.toUpperCase() || ''; } catch { return ''; }
  });

  useEffect(() => watchAuth(setUser), []);
  useEffect(() => {
    if (user && isKid(user)) {
      getMyProfile().then(setProfile);
      getXpSummary(user.uid).then((s) => setXp(s.xp || 0)).catch(() => {});
    }
  }, [user]);
  useEffect(() => { if (duelCode) setTab('duel'); }, [duelCode]);

  // кнопки «назад/вперёд» в браузере
  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (to) => {
    window.history.pushState({}, '', to === 'app' ? '/app' : '/');
    setRoute(to);
    window.scrollTo(0, 0);
  };

  // 1. Лендинг — всегда первый экран на '/'
  if (route === 'landing') return <Landing onStart={() => go('app')} />;

  // 2. Авторизация — пока не вошли, дашборда нет
  if (user === undefined) return <div style={{ padding: 40, color: '#6B655B' }}>{t('common.loading')}</div>;
  if (!user) return <Auth duelCode={duelCode} />;

  // 3. Дашборд (родитель / ребёнок)
  const exit = async () => {
    if (!window.confirm('Шығуды растайсыз ба?')) return;
    await logout();
    go('landing');
  };
  if (!isKid(user)) return (
    <Suspense fallback={<ScreenFallback />}>
      <Parent onExit={exit} />
    </Suspense>
  );

  const school = profile.school;
  const pick = (id) => { setTab(id); setMenuOpen(false); };
  const goTrainTopic = (topicId) => { setTrainTopic(topicId); setTab('training'); setMenuOpen(false); };

  return (
    <div className="shell">
      <aside className="sidebar">
        {/* Верхняя строка сайдбара: логотип + (на телефоне) аватар и бургер */}
        <div className="sbar-top">
          <div className="logo" onClick={() => go('landing')} style={{ cursor: 'pointer' }}>
            <Brand compact />
          </div>

          <div className="sbar-right">
            {/* Аватар + бургер — только на телефоне (через CSS) */}
            <div className="sbar-mobile">
              <div className="ava sm">{(profile.name || 'Б')[0].toUpperCase()}</div>
              <button className="burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Меню">
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Навигация. На телефоне показывается только когда menuOpen. */}
        <nav className={'nav-v' + (menuOpen ? ' open' : '')}>
          {NAV.map((it) => (
            <button key={it.id} className={tab === it.id ? 'on' : ''} onClick={() => pick(it.id)}>
              <span className="num">{it.n}</span>
              <span>{t(`nav.${it.id}`)}</span>
              {it.id === 'mock' && <span className="badge">1</span>}
            </button>
          ))}
          {/* Выход внутри раскрытого меню — удобно на телефоне */}
          <button className="nav-exit" onClick={exit}>{t('common.exit')}</button>
        </nav>

        {/* Блок пользователя — только десктоп (на телефоне спрятан через CSS) */}
        <div className="userbox">
          <div className="who">
            <div className="ava">{(profile.name || 'Б')[0].toUpperCase()}</div>
            <div>
              <div style={{ font: "600 15px 'Golos Text'" }}>{profile.name}</div>
              <div style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#9A9384' }}>{profile.klass} {t('common.grade')} · {xp} XP</div>
            </div>
          </div>
          <button className="btn ghost full" onClick={exit}>{t('common.exit')}</button>
        </div>
      </aside>

      <div className="content">
        {/* Жоғарғы жол: тіл ауыстырғыш (сайдбарда емес, контенттің үстінде) */}
        <div className="topbar">
          <LangSwitch />
        </div>
        <Suspense fallback={<ScreenFallback />}>
          {tab === 'home' && <Home go={setTab} name={profile.name} xp={xp} />}
          {tab === 'training' && (
            <Training
              school={school}
              onXp={(n) => setXp((x) => x + n)}
              startTopicId={trainTopic}
              onTopicOpened={() => setTrainTopic(null)}
            />
          )}
          {tab === 'mock' && (
            <Mock
              onTrainTopic={goTrainTopic}
              onGoProgress={() => setTab('progress')}
            />
          )}
          {tab === 'duel' && <Duel initialCode={duelCode} fromLink={!!duelCode} playerName={profile.name} onXp={(n) => setXp((x) => x + n)} />}
          {tab === 'league' && <League />}
          {tab === 'progress' && <Progress onXpLoad={setXp} onTrainTopic={goTrainTopic} />}
        </Suspense>
      </div>
    </div>
  );
}
