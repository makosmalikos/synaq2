import React, { useEffect, useState } from 'react';
import { watchAuth, isKid, logout, getMyProfile } from './firebase.js';
import { useLang, LangSwitch } from './i18n.jsx';
import Auth from './Auth.jsx';
import Landing from './Landing.jsx';
import Parent from './Parent.jsx';
import Home from './Home.jsx';
import Progress from './Progress.jsx';
import Duel from './Duel.jsx';
import League from './League.jsx';
import Training from './components/Training.jsx';
import Mock from './components/Mock.jsx';

const NAV = [
  { id: 'home', n: '01' }, { id: 'training', n: '02' }, { id: 'duel', n: '03' },
  { id: 'league', n: '04' }, { id: 'mock', n: '05' }, { id: 'progress', n: '06' },
];

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

  useEffect(() => watchAuth(setUser), []);
  useEffect(() => { if (user && isKid(user)) getMyProfile().then(setProfile); }, [user]);

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
  if (!user) return <Auth />;

  // 3. Дашборд (родитель / ребёнок)
  const exit = async () => {
    if (!window.confirm('Шығуды растайсыз ба?')) return;
    await logout();
    go('landing');
  };
  if (!isKid(user)) return <Parent onExit={exit} />;

  const school = profile.school;
  const pick = (id) => { setTab(id); setMenuOpen(false); };   // выбрал пункт → меню закрылось

  return (
    <div className="shell">
      <aside className="sidebar">
        {/* Верхняя строка сайдбара: логотип + язык + (на телефоне) аватар и бургер */}
        <div className="sbar-top">
          <div className="logo" onClick={() => go('landing')} style={{ cursor: 'pointer' }}>
            <b>Synaq</b><span>сынақ</span>
          </div>

          <div className="sbar-right">
            {/* Тіл ауыстырғыш — дашбордта да көрінеді (десктоп + телефон) */}
            <LangSwitch />

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
              <div style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#9A9384' }}>{profile.klass} {t('common.grade')}</div>
            </div>
          </div>
          <button className="btn ghost full" onClick={exit}>{t('common.exit')}</button>
        </div>
      </aside>

      <div className="content">
        {tab === 'home' && <Home go={setTab} name={profile.name} />}
        {tab === 'training' && <Training school={school} />}
        {tab === 'mock' && <Mock school={school} />}
        {tab === 'duel' && <Duel />}
        {tab === 'league' && <League />}
        {tab === 'progress' && <Progress />}
      </div>
    </div>
  );
}
