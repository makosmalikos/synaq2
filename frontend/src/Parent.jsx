import React, { useEffect, useState } from 'react';
import { auth, createChild, getChildren, getMocks, logout } from './firebase.js';

const Logo = () => <div className="logo"><b>Synaq</b><span>ата-ана</span></div>;

export default function Parent() {
  const [children, setChildren] = useState([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [klass, setKlass] = useState('6');
  const [pin, setPin] = useState('');
  const [created, setCreated] = useState(null);
  const [openChild, setOpenChild] = useState(null);
  const [mocks, setMocks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => getChildren(auth.currentUser.uid).then(setChildren).catch(() => {});
  useEffect(() => { load(); }, []);
  const genCode = () => (name.slice(0, 3).toLowerCase().replace(/[^a-zа-я]/gi, '') || 'bala') + Math.floor(1000 + Math.random() * 9000);

  async function add() {
    setErr(''); setBusy(true);
    try {
      const code = genCode();
      await createChild(auth.currentUser.uid, { name, klass, code, pin });
      setCreated({ code, pin }); setName(''); setPin(''); setAdding(false); await load();
    } catch (e) { setErr('Қате: ' + ((e && e.code) || 'қайта көріңіз')); }
    setBusy(false);
  }
  const openResults = async (c) => { setOpenChild(c); setMocks(await getMocks(c.uid).catch(() => [])); };

  return (
    <div className="app">
      <header><Logo /><button className="logout" onClick={logout}>Шығу</button></header>

      {created && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--green)', background: '#EEF5EC' }}>
          <p className="kicker" style={{ color: 'var(--green)', margin: '0 0 6px' }}>Бала аккаунты жасалды</p>
          Балаға беріңіз — Код: <b>{created.code}</b> · PIN: <b>{created.pin}</b>
        </div>
      )}

      {!openChild ? (
        <main>
          <div className="row"><h1 style={{ margin: 0 }}>Балалар</h1><button className="btn" onClick={() => setAdding(!adding)}>+ Бала</button></div>
          {adding && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <input placeholder="Баланың аты" value={name} onChange={(e) => setName(e.target.value)} style={{ margin: 0 }} />
              <select value={klass} onChange={(e) => setKlass(e.target.value)} style={{ padding: 13, border: '1px solid var(--line)', background: '#fff', font: "500 15px 'Golos Text'" }}><option>5</option><option>6</option><option>7</option></select>
              <input placeholder="PIN (кемінде 4 сан)" value={pin} onChange={(e) => setPin(e.target.value)} style={{ margin: 0 }} />
              {err && <p style={{ color: 'var(--accent)', fontSize: 13, margin: 0 }}>{err}</p>}
              <button className="btn accent" disabled={busy || !name || pin.length < 4} onClick={add}>Жасау</button>
            </div>
          )}
          <div className="list">
            {children.map((c) => (
              <div className="row-item" key={c.uid} onClick={() => openResults(c)}>
                <b>{c.name}</b><span className="rt">{c.klass} сынып · код {c.code}</span>
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
