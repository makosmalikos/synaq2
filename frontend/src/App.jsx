import React, { lazy, Suspense, useEffect, useState } from 'react';
import Landing from './Landing.jsx';
import { useLang } from './i18n.jsx';
import { ScreenBoundary } from './components/ScreenBoundary.jsx';
import { readRoute, routePath, readDuelCode } from './routes.js';

// Публичные страницы не зависят от Firebase, сессии и банка экзаменационных задач.
const PlatformApp = lazy(() => import('./PlatformApp.jsx'));
const PublicDiagnostic = lazy(() => import('./PublicDiagnostic.jsx'));

export default function App() {
  const { t, lang } = useLang();
  const [route, setRoute] = useState(() => readRoute(window.location.pathname));
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [duelCode] = useState(() => {
    let storage;
    try { storage = window.sessionStorage; } catch {}
    return readDuelCode(window.location.search, storage);
  });
  // Preserve navigation when Back remounts the lazy cabinet, without keeping
  // its Firebase listeners and active exercise timers alive on public pages.
  const [tab, setTab] = useState(() => duelCode ? 'duel' : 'home');
  const [trainTopic, setTrainTopic] = useState(null);
  const [tabBeforeSubscription, setTabBeforeSubscription] = useState('home');

  useEffect(() => {
    const onPop = () => setRoute(readRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next) => {
    window.history.pushState({}, '', routePath(next));
    setRoute(next);
    window.scrollTo(0, 0);
  };

  return (
    <ScreenBoundary key={route} lang={lang}>
      <Suspense fallback={<div role="status" style={{ padding: 40, color: '#60758A' }}>{t('common.loading')}</div>}>
        {route === 'landing' && <Landing onStart={() => go('app')} onDiagnostic={() => go('diagnostic')} />}
        {route === 'diagnostic' && <PublicDiagnostic onBack={() => go('landing')} onRegister={(result) => { setDiagnosticResult(result); go('app'); }} />}
        {route === 'app' && <PlatformApp
          initialDiagnosticPlan={diagnosticResult} onHome={() => go('landing')} duelCode={duelCode}
          navigation={{ tab, setTab, trainTopic, setTrainTopic, tabBeforeSubscription, setTabBeforeSubscription }}
        />}
      </Suspense>
    </ScreenBoundary>
  );
}
