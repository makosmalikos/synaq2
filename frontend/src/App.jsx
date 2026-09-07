import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { watchAuth, isKid, isAdmin, logout, getMyProfile, getXpSummary } from './firebase.js';
import { useLang, LangToggle } from './i18n.jsx';
import Auth from './Auth.jsx';
import Landing from './Landing.jsx';
import Home from './Home.jsx';
import League from './League.jsx';
import Brand from './Brand.jsx';

// Банк задач большой: загружаем его только вместе с экраном, которому он нужен.
const Parent = lazy(() => import('./Parent.jsx'));
const Admin = lazy(() => import('./Admin.jsx'));
const Progress = lazy(() => import('./Progress.jsx'));
const Duel = lazy(() => import('./Duel.jsx'));
const Training = lazy(() => import('./components/Training.jsx'));
const Mock = lazy(() => import('./components/Mock.jsx'));
const Rewards = lazy(() => import('./Rewards.jsx'));
const Subscription = lazy(() => import('./Subscription.jsx'));

const NAV = [
  { id: 'home', icon: '⌂' }, { id: 'training', icon: '▶' }, { id: 'league', icon: '↗' },
  { id: 'progress', icon: '▤' }, { id: 'mock', icon: '✓' }, { id: 'duel', icon: '⚔' },
  { id: 'rewards', icon: '◇' },
];

const ScreenFallback = () => <div style={{ padding: 40, color: '#6B655B' }}>...</div>;

const ProfileIcon = ({ name }) => {
  const paths = {
    plan: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M3.5 9h17" /></>,
    support: <><path d="M20 11.5a8 8 0 1 1-3.1-6.3" /><path d="M17 4v5h-5M8.6 9.4c.6 2.4 3.6 5.4 6 6l1.4-1.5-2.2-1.6-1.1 1c-.9-.5-1.8-1.4-2.3-2.3l1-1.1L9.8 8Z" /></>,
    exit: <><path d="M14 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H14" /><path d="m16 8 4 4-4 4M9 12h11" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
};

// Роут: '/' = лендинг, '/app' = авторизация → дашборд.
const readRoute = () =>
  (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) ? 'app' : 'landing';


export default function App() {
  const { t } = useLang();
  const [user, setUser] = useState(undefined);
  // undefined — ещё не проверено, true/false — результат проверки admin custom-claim.
  const [adminUser, setAdminUser] = useState(undefined);
  const [route, setRoute] = useState(readRoute);
  const [tab, setTab] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);   // бургер-меню на телефоне
  const [profileOpen, setProfileOpen] = useState(false);
  const [tabBeforeSubscription, setTabBeforeSubscription] = useState('home');
  const [profile, setProfile] = useState({ name: 'Бала', klass: '', school: 'РФМШ' });
  const [xp, setXp] = useState(0);
  const [trainTopic, setTrainTopic] = useState(null);
  const profileMenuRef = useRef(null);

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
  // Роль "администратор" подтверждается custom-claim в ID-токене — читается
  // асинхронно, поэтому пока проверка идёт, ничего лишнего не показываем.
  useEffect(() => {
    if (!user || isKid(user)) { setAdminUser(false); return; }
    let alive = true;
    isAdmin(user).then((v) => { if (alive) setAdminUser(v); });
    return () => { alive = false; };
  }, [user]);
  useEffect(() => { if (duelCode) setTab('duel'); }, [duelCode]);

  // кнопки «назад/вперёд» в браузере
  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const onPointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setProfileOpen(false);
    };
    const onKeyDown = (event) => { if (event.key === 'Escape') setProfileOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [profileOpen]);

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
  if (!isKid(user)) {
    if (adminUser === undefined) return <div style={{ padding: 40, color: '#6B655B' }}>{t('common.loading')}</div>;
    if (adminUser) return (
      <Suspense fallback={<ScreenFallback />}>
        <Admin onExit={exit} />
      </Suspense>
    );
    return (
      <Suspense fallback={<ScreenFallback />}>
        <Parent onExit={exit} />
      </Suspense>
    );
  }

  const school = profile.school;
  const pick = (id) => { setTab(id); setMenuOpen(false); setProfileOpen(false); };
  const goTrainTopic = (topicId) => { setTrainTopic(topicId); setTab('training'); setMenuOpen(false); };
  const openSubscription = () => {
    setTabBeforeSubscription(tab === 'subscription' ? 'home' : tab);
    setProfileOpen(false);
    setTab('subscription');
    window.scrollTo(0, 0);
  };

  if (tab === 'subscription') return (
    <Suspense fallback={<ScreenFallback />}>
      <Subscription active={!!profile.pro} onBack={() => { setTab(tabBeforeSubscription); window.scrollTo(0, 0); }} />
    </Suspense>
  );

  return (
    <div className="shell">
      <aside className={`sidebar sidebar-${tab}`}>
        {/* Верхняя строка сайдбара: логотип + (на телефоне) аватар и бургер */}
        <div className="sbar-top">
          <div className="logo" onClick={() => go('landing')} style={{ cursor: 'pointer' }}>
            <Brand compact />
          </div>

          <div className="sbar-right">
            <div className="header-xp" title="XP">
              <span aria-hidden="true">★</span><b>{xp}</b>
            </div>
            <div className="sbar-language"><LangToggle /></div>
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
            <button key={it.id} className={`nav-${it.id}${tab === it.id ? ' on' : ''}`} onClick={() => pick(it.id)}>
              <span className="num" aria-hidden="true">{it.icon}</span>
              <span>{t(`nav.${it.id}`)}</span>
              {it.id === 'mock' && <span className="badge">1</span>}
            </button>
          ))}
          {/* Выход внутри раскрытого меню — удобно на телефоне */}
          <button className="nav-exit" onClick={exit}>{t('common.exit')}</button>
        </nav>

        {/* Блок пользователя — только десктоп (на телефоне спрятан через CSS) */}
        <div className="userbox" ref={profileMenuRef}>
          <button
            className="profile-trigger"
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-label={t('profile.open')}
          >
            <span className="ava">{(profile.name || 'Б')[0].toUpperCase()}</span>
          </button>

          {profileOpen && (
            <div className="profile-dropdown" role="menu">
              <div className="profile-head">
                <strong>{profile.name}</strong>
                <span>{user.email || t('profile.account')}</span>
                <small>{profile.klass ? `${profile.klass} ${t('common.grade')} · ` : ''}{xp} XP</small>
              </div>

              <button className="profile-action profile-plan" type="button" role="menuitem" onClick={openSubscription}>
                <ProfileIcon name="plan" />
                <span>{t('profile.plan')}</span>
              </button>

              <a
                className="profile-action profile-support"
                href="https://wa.me/message/HAJDNIM2MPOCM1"
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                <ProfileIcon name="support" />
                <span>{t('profile.support')}</span>
              </a>

              <button className="profile-action profile-exit" type="button" role="menuitem" onClick={exit}>
                <ProfileIcon name="exit" />
                <span>{t('common.exit')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className={`content content-${tab}`}>
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
          {tab === 'rewards' && <Rewards xp={xp} onGoTraining={() => setTab('training')} />}
        </Suspense>
      </div>
    </div>
  );
}
