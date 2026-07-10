import React, { useEffect, useState } from 'react';
import { watchAuth, isKid, logout, getMySchool } from './firebase.js';
import Auth from './Auth.jsx';
import Parent from './Parent.jsx';
import Home from './Home.jsx';
import Training from './components/Training.jsx';
import Mock from './components/Mock.jsx';

const Logo = () => <div className="logo"><b>Synaq</b><span>сынақ</span></div>;

export default function App() {
  const [user, setUser] = useState(undefined);
  const [tab, setTab] = useState('home');
  const [school, setSchool] = useState('РФМШ');
  useEffect(() => watchAuth(setUser), []);
  useEffect(() => { if (user && isKid(user)) getMySchool().then(setSchool); }, [user]);

  if (user === undefined) return <div className="app"><p className="muted" style={{ padding: 40 }}>Жүктелуде…</p></div>;
  if (!user) return <Auth />;
  if (!isKid(user)) return <Parent />;

  return (
    <div className="app">
      <header>
        <Logo />
        <nav>
          <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}>Басты</button>
          <button className={tab === 'training' ? 'on' : ''} onClick={() => setTab('training')}>Дайындық</button>
          <button className={tab === 'mock' ? 'on' : ''} onClick={() => setTab('mock')}>Мок-тест</button>
          <button className="logout" onClick={logout}>Шығу</button>
        </nav>
      </header>
      {tab === 'home' && <Home go={setTab} />}
      {tab === 'training' && <Training school={school} />}
      {tab === 'mock' && <Mock school={school} />}
    </div>
  );
}
