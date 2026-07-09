import { useEffect, useState } from 'react';
import { firebaseReady } from './lib/firebase.js';
import { watchAuth, roleOf, getFamily, signOut } from './lib/auth.js';
import Auth from './screens/Auth.jsx';
import ChildApp from './screens/ChildApp.jsx';
import ParentApp from './screens/ParentApp.jsx';

// Демо-режим: если Firebase не сконфигурирован (.env пуст), приложение всё равно
// открывается — авторизация симулируется локально, чтобы можно было посмотреть UI.
export default function App() {
  const [lang, setLang] = useState('kk');
  const [ready, setReady] = useState(!firebaseReady);
  const [session, setSession] = useState(null); // { user, role, school }

  useEffect(() => {
    if (!firebaseReady) return;
    const unsub = watchAuth(async (user) => {
      if (!user) { setSession(null); setReady(true); return; }
      const role = roleOf(user);
      let school = 'rfmsh';
      if (role === 'parent') {
        const fam = await getFamily(user.uid);
        school = (fam && fam.school) || 'rfmsh';
      }
      setSession({ user, role, school });
      setReady(true);
    });
    return unsub;
  }, []);

  const onSignedIn = (s) => setSession(s);
  const onSignOut = async () => {
    if (firebaseReady) await signOut();
    setSession(null);
  };

  if (!ready) return <div className="auth-wrap"><span className="mono" style={{ color: 'var(--muted)' }}>Жүктелуде…</span></div>;

  if (!session) return <Auth lang={lang} setLang={setLang} onSignedIn={onSignedIn} demo={!firebaseReady} />;

  return session.role === 'parent'
    ? <ParentApp session={session} onSignOut={onSignOut} demo={!firebaseReady} />
    : <ChildApp session={session} onSignOut={onSignOut} demo={!firebaseReady} />;
}
