import React, { useEffect, useState } from 'react';
import { auth, createChild, getChildren, getMocks, logout } from './firebase.js';

const Logo = () => <div className="logo"><b>Synaq</b><span>ата-ана</span></div>;
const WORDS = ['synaq', 'bala', 'batyr', 'qanat', 'arman', 'miras', 'alua', 'aru', 'saga', 'tomiris'];
const genPass = () => WORDS[Math.floor(Math.random() * WORDS.length)] + Math.floor(100 + Math.random() * 900);
const cleanUser = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export default function Parent() {
  const [children, setChildren] = useState([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [created, setCreated] = useState(null);
  const [openChild, setOpenChild] = useState(null);
  const [mocks, setMocks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => getChildren(auth.currentUser.uid).then(setChildren).catch(() => {});
  useEffect(() => { load(); }, []);

  async function add() {
    setErr(''); setBusy(true);
    try {
      const code = cleanUser(username) || ('bala' + Math.floor(1000 + Math.random() * 9000));
      const password = pass || genPass();
      await createChild(auth.currentUser.uid, { name, klass: '', code, pin: password });
      setCreated({ code, pass: password });
      setName(''); setUsername(''); setPass(''); setAdding(false);
      await load();
    } catch (e) {
      const c = (e && e.code) || '';
      if (c.includes('email-already-in-use')) setErr('Бұл юзернейм бос емес — басқасын таңдаңыз');
      else if (c.includes('weak-password')) setErr('Пароль тым қысқа (кемінде 6 таңба)');
      else setErr('Қате: ' + (c || 'қайта көріңіз'));
    }
    setBusy(false);
  }
  const openResults = async (c) => { setOpenChild(c); setMocks(await getMocks(c.uid).catch(() => [])); };

  return (
    <div className="app">
      <header><Logo /><button className="logout" onClick={logout}>Шығу</button></header>

      {created && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--green)', background: '#EEF5EC' }}>
          <p className="kicker" style={{ color: 'var(--green)', margin: '0 0 8px' }}>Бала аккаунты жасалды</p>
          Балаға осыны беріңіз:<br />
          Юзернейм: <b>{created.code}</b><br />
          Пароль: <b>{created.pass}</b>
        </div>
      )}

      {!openChild ? (
        <main>
          <div className="row"><h1 style={{ margin: 0 }}>Балалар</h1><button className="btn" onClick={() => { setAdding(!adding); setErr(''); }}>+ Бала</button></div>

          {adding && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lab}>Баланың аты</label>
                <input placeholder="Мысалы: Арман" value={name} onChange={(e) => { setName(e.target.value); if (!username) setUsername(cleanUser(e.target.value)); }} style={inp} />
              </div>
              <div>
                <label style={lab}>Юзернейм (кіру логині)</label>
                <input placeholder="мысалы: arman" value={username} onChange={(e) => setUsername(cleanUser(e.target.value))} style={inp} />
              </div>
              <div>
                <label style={lab}>Пароль</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="пароль" value={pass} onChange={(e) => setPass(e.target.value)} style={{ ...inp, flex: 1 }} />
                  <button className="btn ghost" type="button" onClick={() => setPass(genPass())} style={{ whiteSpace: 'nowrap' }}>Генерациялау</button>
                </div>
              </div>
              {err && <p style={{ color: 'var(--accent)', fontSize: 13, margin: 0 }}>{err}</p>}
              <button className="btn accent" disabled={busy || !name} onClick={add}>Жасау</button>
            </div>
          )}

          <div className="list">
            {children.map((c) => (
              <div className="row-item" key={c.uid} onClick={() => openResults(c)}>
                <b>{c.name}</b><span className="rt">логин: {c.code}</span>
              </div>
            ))}
          </div>
          {!children.length && !adding && <p className="muted" style={{ marginTop: 14 }}>Әзірге бала жоқ. «+ Бала» басыңыз.</p>}
        </main>
      ) : (
        <main>
          <button className="link" onClick={() => setOpenChild(null)}>← Балалар</button>
          <h1>{openChild.name}</h1>
          <p className="kicker">Мок-тест нәтижелері</p>
          {mocks.length ? (
            <ol className="review">{mocks.map((m, i) => <li key={i}>{m.title || 'Мок-тест'}: <b>{m.score}/{m.gradable}</b> балл</li>)}</ol>
          ) : <p className="muted">Әзірге мок-тест тапсырылмаған.</p>}
        </main>
      )}
    </div>
  );
}
const lab = { display: 'block', font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#9A9384', marginBottom: 6 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid var(--line)', background: '#fff', font: "500 15px 'Golos Text'", color: 'var(--ink)', outline: 'none' };
