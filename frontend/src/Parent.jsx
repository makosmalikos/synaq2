import React, { useEffect, useState } from 'react';
import {
  auth, createChild, getChildren, getMocks, logout,
  genPassword, suggestUsername, cleanUsername, errText,
} from './firebase.js';

const Logo = () => <div className="logo"><b>Synaq</b><span>ата-ана</span></div>;

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
  useEffect(() => {
    load();
  }, []);

  async function add() {
    setErr(''); setBusy(true);
    try {
      const code = cleanUsername(username) || suggestUsername(name) || ('bala' + Math.floor(1000 + Math.random() * 9000));
      const password = pass || genPassword();
      await createChild(auth.currentUser.uid, { name, code, pin: password });
      setCreated({ code, pass: password, name });
      setName(''); setUsername(''); setPass(''); setAdding(false);
      await load();
    } catch (e) { setErr(errText(e)); }
    setBusy(false);
  }
  const openResults = async (c) => { setOpenChild(c); setMocks(await getMocks(c.uid).catch(() => [])); };

  return (
    <div className="app">
      <header>
        <Logo />
        <button className="logout" onClick={logout}>Шығу</button>
      </header>

      {created && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--green)', background: '#EEF5EC' }}>
          <p className="kicker" style={{ color: 'var(--green)', margin: '0 0 8px' }}>{created.name} аккаунты жасалды</p>
          Балаға осыны беріңіз:<br />
          Юзернейм: <b>{created.code}</b><br />
          Пароль: <b>{created.pass}</b>
        </div>
      )}

      {!openChild ? (
        <main>
          <div className="row">
            <h1 style={{ margin: 0 }}>Балалар</h1>
            <button className="btn" onClick={() => { setAdding(!adding); setErr(''); }}>+ Бала</button>
          </div>

          {adding && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lab}>Баланың аты</label>
                <input placeholder="Мысалы: Айгерім" value={name} style={inp}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!username) setUsername(cleanUsername(e.target.value));
                  }} />
              </div>
              <div>
                <label style={lab}>Юзернейм (кіру логині)</label>
                <input placeholder="мысалы: aigerim" value={username} style={inp}
                  onChange={(e) => setUsername(cleanUsername(e.target.value))} />
                <p style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#9A9384', margin: '6px 0 0' }}>
                  тек латын әрпі мен цифр
                </p>
              </div>
              <div>
                <label style={lab}>Пароль</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="пароль" value={pass} onChange={(e) => setPass(e.target.value)} style={{ ...inp, flex: 1 }} />
                  <button className="btn ghost" type="button" onClick={() => setPass(genPassword())} style={{ whiteSpace: 'nowrap' }}>
                    Генерациялау
                  </button>
                </div>
              </div>
              {err && <p style={{ color: 'var(--accent)', fontSize: 13, margin: 0 }}>{err}</p>}
              <button className="btn accent" disabled={busy || !name} onClick={add}>
                {busy ? 'Жасалуда…' : 'Жасау'}
              </button>
            </div>
          )}

          <div className="list">
            {children.map((c) => (
              <div className="row-item" key={c.uid} onClick={() => openResults(c)}>
                <b>{c.name}</b>
                <span className="rt">логин: {c.code} · нәтижелер →</span>
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
            <ol className="review">
              {mocks.map((m, i) => <li key={i}>{m.title || 'Мок-тест'}: <b>{m.score}/{m.gradable}</b> балл</li>)}
            </ol>
          ) : <p className="muted">Әзірге мок-тест тапсырылмаған.</p>}
        </main>
      )}
    </div>
  );
}
const lab = { display: 'block', font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#9A9384', marginBottom: 6 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid var(--line)', background: '#fff', font: "500 15px 'Golos Text'", color: 'var(--ink)', outline: 'none' };
