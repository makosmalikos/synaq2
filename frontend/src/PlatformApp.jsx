import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { watchAuth, watchMyProfile, isKid, isAdmin, logout, getXpSummary, ensureFamilyProfile } from './firebase.js';
import { useLang, LangToggle } from './i18n.jsx';
import Auth from './Auth.jsx';
import Home from './Home.jsx';
import League from './League.jsx';
import Brand from './Brand.jsx';
import { readPublicDiagnosticResult } from './diagnosticPlan.js';
import PetAvatar from './PetAvatar.jsx';

// Банк задач большой: загружаем его только вместе с экраном, которому он нужен.
const Parent = lazy(() => import('./Parent.jsx'));
const Admin = lazy(() => import('./Admin.jsx'));
const Progress = lazy(() => import('./Progress.jsx'));
const Duel = lazy(() => import('./Duel.jsx'));
const Training = lazy(() => import('./components/Training.jsx'));
const Mock = lazy(() => import('./components/Mock.jsx'));
const Rewards = lazy(() => import('./Rewards.jsx'));
const Subscription = lazy(() => import('./Subscription.jsx'));
const Curriculum = lazy(() => import('./Curriculum.jsx'));
const PlatformDiagnostic = lazy(() => import('./components/PlatformDiagnostic.jsx'));

const NAV = [
  { id: 'home', icon: 'home' },
  { id: 'learning', icon: 'book', children: ['curriculum', 'training'] },
  { id: 'diagnosis', icon: 'diagnosis' },
  { id: 'mock', icon: 'test' },
  { id: 'progress', icon: 'progress' },
  { id: 'more', icon: 'more', children: ['duel', 'league', 'rewards'] },
];

const NAV_ICONS = {
  home: <><path d="M3.5 10.5 12 3.8l8.5 6.7" /><path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" /></>,
  diagnosis: <><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" /></>,
  test: <><path d="M7 3.5h10v17H7z" /><path d="M9.5 8h5M9.5 12h5M9.5 16h3" /></>,
  progress: <><path d="M4 19.5V14h4v5.5M10 19.5V9h4v10.5M16 19.5V4h4v15.5" /><path d="M3 19.5h18" /></>,
  more: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  curriculum: <><path d="M4 5h16v14H4zM8 5v14M4 9h4" /></>,
  training: <><path d="m8 5 10 7-10 7Z" /></>,
  duel: <><path d="m5 4 14 16M19 4 5 20M4 3l4 1-3 3M20 3l-4 1 3 3" /></>,
  league: <><path d="M7 4h10v4a5 5 0 0 1-10 0ZM9 18h6M12 13v5" /><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" /></>,
  rewards: <><path d="M12 3.5 14.7 9l6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" /></>,
};

const NavIcon = ({ name }) => (
  <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">{NAV_ICONS[name]}</svg>
);

const ScreenFallback = () => <div style={{ padding: 40, color: '#6B655B' }}>...</div>;

const ProfileIcon = ({ name }) => {
  const paths = {
    plan: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M3.5 9h17" /></>,
    support: <><path d="M20 11.5a8 8 0 1 1-3.1-6.3" /><path d="M17 4v5h-5M8.6 9.4c.6 2.4 3.6 5.4 6 6l1.4-1.5-2.2-1.6-1.1 1c-.9-.5-1.8-1.4-2.3-2.3l1-1.1L9.8 8Z" /></>,
    exit: <><path d="M14 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H14" /><path d="m16 8 4 4-4 4M9 12h11" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
};

// Firebase и личные данные загружаются только после перехода в кабинет.
export default function PlatformApp({ onHome, initialDiagnosticPlan, duelCode, navigation }) {
  const { t, lang } = useLang();
  const { tab, setTab, trainTopic, setTrainTopic, tabBeforeSubscription, setTabBeforeSubscription } = navigation;
  const [user, setUser] = useState(undefined);
  const [authRevision, setAuthRevision] = useState(0);
  // undefined — ещё не проверено, true/false — результат проверки admin custom-claim.
  const [adminUser, setAdminUser] = useState(undefined);
  const [familyState, setFamilyState] = useState(null);
  const [familyRetry, setFamilyRetry] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);   // бургер-меню на телефоне
  const [navMenu, setNavMenu] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: 'Бала', klass: '', school: 'РФМШ', avatar: 'owl' });
  const [profileError, setProfileError] = useState(false);
  const [xp, setXp] = useState(0);
  const mergeXp = useCallback((loadedXp) => {
    const total = Number(loadedXp);
    setXp((current) => Number.isFinite(total) ? Math.max(current, total) : current);
  }, []);
  const [diagnosticPlan] = useState(() => initialDiagnosticPlan || readPublicDiagnosticResult());
  const profileMenuRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => watchAuth((nextUser) => {
    setAdminUser(undefined);
    setUser(nextUser);
    setAuthRevision((value) => value + 1);
  }), []);
  useEffect(() => {
    setProfileError(false);
    setXp(0);
    if (user && isKid(user)) {
      let active = true;
      const stop = watchMyProfile((nextProfile) => {
        if (!active) return;
        setProfile(nextProfile);
        setProfileError(false);
      }, (error) => {
        if (!active) return;
        console.error('profile load failed', error);
        setProfileError(true);
      });
      getXpSummary(user.uid).then((s) => { if (active) setXp((current) => Math.max(current, s.xp || 0)); }).catch((error) => {
        console.error('progress load failed', error);
        if (active) setProfileError(true);
      });
      return () => { active = false; stop(); };
    }
    setProfile({ name: 'Бала', klass: '', school: 'РФМШ', avatar: 'owl', plan: 'free', pro: false });
    setXp(0);
  }, [user]);
  // Роль "администратор" подтверждается custom-claim в ID-токене — читается
  // асинхронно, поэтому пока проверка идёт, ничего лишнего не показываем.
  useEffect(() => {
    if (!user || isKid(user)) { setAdminUser(false); return; }
    let alive = true;
    isAdmin(user).then((v) => { if (alive) setAdminUser(v); });
    return () => { alive = false; };
  }, [user, authRevision]);

  useEffect(() => {
    if (!user || isKid(user) || adminUser !== false) return;
    let active = true;
    setFamilyState({ uid: user.uid, status: 'loading' });
    ensureFamilyProfile(user).then(() => {
      if (active) setFamilyState({ uid: user.uid, status: 'ready' });
    }).catch((error) => {
      console.error('family profile initialization failed', error);
      if (active) setFamilyState({ uid: user.uid, status: 'error' });
    });
    return () => { active = false; };
  }, [user, adminUser, familyRetry]);
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
  useEffect(() => {
    if (!navMenu) return undefined;
    const onPointerDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) setNavMenu(null);
    };
    const onKeyDown = (event) => { if (event.key === 'Escape') setNavMenu(null); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [navMenu]);

  // 2. Авторизация — пока не вошли, дашборда нет
  if (user === undefined) return <div style={{ padding: 40, color: '#6B655B' }}>{t('common.loading')}</div>;
  if (!user) return <Auth duelCode={duelCode} />;

  // 3. Дашборд (родитель / ребёнок)
  const exit = async () => {
    if (!window.confirm(lang === 'ru' ? 'Выйти из аккаунта?' : 'Шығуды растайсыз ба?')) return;
    await logout();
    onHome();
  };
  if (!isKid(user)) {
    if (adminUser === undefined) return <div style={{ padding: 40, color: '#6B655B' }}>{t('common.loading')}</div>;
    if (adminUser) return (
      <Suspense fallback={<ScreenFallback />}>
        <Admin onExit={exit} />
      </Suspense>
    );
    if (familyState?.uid !== user.uid || familyState.status === 'loading') return <ScreenFallback />;
    if (familyState.status === 'error') return (
      <section role="alert" className="card" style={{ maxWidth: 520, margin: '12vh auto', padding: 28 }}>
        <h1>{lang === 'ru' ? 'Не удалось подготовить кабинет' : 'Кабинетті дайындау мүмкін болмады'}</h1>
        <p>{lang === 'ru' ? 'Аккаунт уже создан. Проверьте соединение и повторите — регистрироваться заново не нужно.' : 'Аккаунт ашылды. Байланысты тексеріп, қайталаңыз — қайта тіркелу қажет емес.'}</p>
        <button className="btn" type="button" onClick={() => setFamilyRetry((value) => value + 1)}>{lang === 'ru' ? 'Повторить' : 'Қайталау'}</button>
        <button className="btn" type="button" onClick={exit}>{t('common.exit')}</button>
      </section>
    );
    return (
      <Suspense fallback={<ScreenFallback />}>
        <Parent onExit={exit} />
      </Suspense>
    );
  }

  const school = profile.school;
  const pick = (id) => { setTab(id); setMenuOpen(false); setNavMenu(null); setProfileOpen(false); window.scrollTo(0, 0); };
  const goTrainTopic = (topicId) => { setTrainTopic(topicId); setTab('training'); setMenuOpen(false); };
  const openSubscription = () => {
    setTabBeforeSubscription(tab === 'subscription' ? 'home' : tab);
    setProfileOpen(false);
    setTab('subscription');
    window.scrollTo(0, 0);
  };

  if (tab === 'subscription') return (
    <Suspense fallback={<ScreenFallback />}>
      <Subscription currentPlan={profile.plan || (profile.pro ? 'pro' : 'free')} onBack={() => { setTab(tabBeforeSubscription); window.scrollTo(0, 0); }} />
    </Suspense>
  );

  return (
    <div className="shell">
      <aside className={`sidebar sidebar-${tab}`}>
        {/* Верхняя строка сайдбара: логотип + (на телефоне) аватар и бургер */}
        <div className="sbar-top">
          <button className="logo" type="button" onClick={() => pick('home')} aria-label={t('nav.home')}>
            <Brand compact />
          </button>

          <div className="sbar-right">
            <div className="header-xp" title="XP">
              <span className="header-xp-coin" aria-hidden="true">★</span><b>{xp}</b><small>XP</small>
            </div>
            <div className="sbar-language"><LangToggle /></div>
            {/* Аватар + бургер — только на телефоне (через CSS) */}
            <div className="sbar-mobile">
              <PetAvatar id={profile.avatar} size="small" label={profile.name} />
              <button className="burger" onClick={() => { setMenuOpen((v) => !v); setNavMenu(null); }} aria-label={menuOpen ? t('nav.close') : t('nav.open')} aria-expanded={menuOpen}>
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Навигация. На телефоне показывается только когда menuOpen. */}
        <nav ref={navRef} className={'nav-v' + (menuOpen ? ' open' : '')} aria-label={t('nav.main')}>
          {NAV.map((item) => {
            const active = item.id === tab || item.children?.includes(tab);
            if (!item.children) return (
              <button key={item.id} className={`nav-item nav-${item.id}${active ? ' on' : ''}`} onClick={() => pick(item.id)} aria-current={active ? 'page' : undefined}>
                <NavIcon name={item.icon} />
                <span className="nav-label">{t(`nav.${item.id}`)}</span>
              </button>
            );
            const expanded = navMenu === item.id;
            return (
              <div key={item.id} className={`nav-group${active ? ' active' : ''}`}>
                <button className={`nav-group-trigger nav-${item.id}${active ? ' on' : ''}`} type="button" aria-haspopup="menu" aria-expanded={expanded} onClick={() => setNavMenu(expanded ? null : item.id)}>
                  <NavIcon name={item.icon} />
                  <span className="nav-label">{t(`nav.${item.id}`)}</span>
                  <svg className="nav-caret" viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1.5 5 5 5-5" /></svg>
                </button>
                {expanded && (
                  <div className="nav-dropdown" role="menu">
                    {item.children.map((child) => (
                      <button key={child} type="button" role="menuitem" className={tab === child ? 'on' : ''} onClick={() => pick(child)}>
                        <NavIcon name={child} />
                        <span>{t(`nav.${child}`)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
            <PetAvatar id={profile.avatar} label={profile.name} />
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
        {profileError && <p className="card" role="alert" style={{ margin: 20 }}>
          {lang === 'ru' ? 'Не удалось загрузить профиль или прогресс. Проверьте соединение и обновите страницу.' : 'Профильді немесе прогресті жүктеу мүмкін болмады. Байланысты тексеріп, бетті жаңартыңыз.'}
        </p>}
        <Suspense fallback={<ScreenFallback />}>
          {tab === 'home' && <Home go={setTab} name={profile.name} xp={xp} diagnosticPlan={diagnosticPlan} onTrainTopic={goTrainTopic} />}
          {tab === 'curriculum' && <Curriculum
            initialGrade={profile.klass} plan={profile.plan || (profile.pro ? 'pro' : 'free')} onUpgrade={openSubscription}
            onXp={(gain, totalXp) => setXp((current) => Number.isFinite(totalXp) ? Math.max(current, totalXp) : current + gain)}
          />}
          {tab === 'diagnosis' && <PlatformDiagnostic initialGrade={profile.klass} onGoPractice={goTrainTopic} />}
          {tab === 'training' && (
            <Training
              school={school}
              onXp={(gain, totalXp) => setXp((current) => Number.isFinite(totalXp) ? Math.max(current, totalXp) : current + gain)}
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
          {tab === 'progress' && <Progress onXpLoad={mergeXp} onTrainTopic={goTrainTopic} />}
          {tab === 'rewards' && <Rewards xp={xp} onGoTraining={() => setTab('training')} />}
        </Suspense>
      </div>
    </div>
  );
}
