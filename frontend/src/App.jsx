import React, { useEffect, useState } from 'react';
import { watchAuth, isKid, logout, getMyProfile } from './firebase.js';
import Auth from './Auth.jsx';
import Parent from './Parent.jsx';
import Home from './Home.jsx';
import Progress from './Progress.jsx';
import Duel from './Duel.jsx';
import League from './League.jsx';
import Training from './components/Training.jsx';
import Mock from './components/Mock.jsx';

const NAV = [
  { id: 'home',     n: '01', label: 'Басты бет' },
  { id: 'training', n: '02', label: 'Дайындық' },
  { id: 'duel',     n: '03', label: 'Дуэль' },
  { id: 'league',   n: '04', label: 'Лига' },
  { id: 'mock',     n: '05', label: 'Апталық сынақ' },
  { id: 'progress', n: '06', label: 'Прогресс' },
];

export default function App() {
  const [user, setUser] = useState(undefined);
  const [tab, setTab] = useState('home');
  const [profile, setProfile] = useState({ name: 'Бала', klass: '', school: 'РФМШ' });

  useEffect(() => watchAuth(setUser), []);
  useEffect(() => { if (user && isKid(user)) getMyProfile().then(setProfile); }, [user]);

  if (user === undefined) return <div style={{ padding: 40, color: '#6B655B' }}>Жүктелуде…</div>;
  if (!user) return <Auth />;
  if (!isKid(user)) return <Parent />;

  const school = profile.school;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo"><b>Synaq</b><span>сынақ</span></div>
        <nav className="nav-v">
          {NAV.map((it) => (
            <button key={it.id} className={tab === it.id ? 'on' : ''} onClick={() => setTab(it.id)}>
              <span className="num">{it.n}</span>
              <span>{it.label}</span>
              {it.id === 'mock' && <span className="badge">1</span>}
            </button>
          ))}
        </nav>
        <div className="userbox">
          <div className="who">
            <div className="ava">{(profile.name || 'Б')[0].toUpperCase()}</div>
            <div>
              <div style={{ font: "600 15px 'Golos Text'" }}>{profile.name}</div>
              <div style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#9A9384' }}>{profile.klass} сынып</div>
            </div>
          </div>
          <button className="btn ghost full" onClick={logout}>Шығу</button>
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
