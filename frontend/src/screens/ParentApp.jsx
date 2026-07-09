import { useEffect, useState } from 'react';
import { SCHOOLS } from '../lib/ui.js';
import { createChild, listChildren, setSchool, childMocks } from '../lib/auth.js';

function Sidebar({ nav, setNav, who, onSignOut }) {
  const items = [['overview', 'Шолу'], ['children', 'Балалар'], ['progress', 'Прогресс']];
  return (
    <aside className="sidebar">
      <div className="side-brand"><span className="name">Synaq</span><span className="sub">сынақ</span></div>
      {items.map(([k, label], i) => (
        <button key={k} className={'nav-item' + (nav === k ? ' on' : '')} onClick={() => setNav(k)}>
          <span className="n">0{i + 1}</span>{label}
        </button>
      ))}
      <div className="side-foot">
        <div className="who">
          <div className="avatar" style={{ background: 'var(--accent)' }}>{(who.name || 'А').charAt(0)}</div>
          <div><div className="nm">{who.name}</div><div className="sb">Отбасы аккаунты</div></div>
        </div>
        <button className="logout" onClick={onSignOut}>Шығу</button>
      </div>
    </aside>
  );
}

function Overview({ session, demo }) {
  const [school, setSch] = useState(session.school || 'rfmsh');
  const pick = async (code) => {
    setSch(code);
    if (!demo) await setSchool(session.user.uid, code).catch(() => {});
  };
  return (
    <div className="rise">
      <p className="page-eyebrow">Шолу</p>
      <h1 className="page-title">Қош келдіңіз, {session.user.displayName || 'Ата-ана'}</h1>
      <p className="page-sub">Мұнда балаңыздың дайындығын бақылайсыз. Алдымен мектеп пен баланы қосыңыз.</p>
      <div className="stat-strip" style={{ marginBottom: 24 }}>
        <div className="stat"><div className="v">8</div><div className="l">ТОЛЫҚ НҰСҚА</div></div>
        <div className="stat"><div className="v">240</div><div className="l">ЕСЕП БАНКІ</div></div>
        <div className="stat"><div className="v">12</div><div className="l">ТАҚЫРЫП</div></div>
        <div className="stat"><div className="v">РФМШ</div><div className="l">ДАЙЫН МЕКТЕП</div></div>
      </div>
      <h2 className="serif" style={{ fontSize: 18, marginBottom: 12 }}>Мақсатты мектеп</h2>
      <div className="school-grid">
        {SCHOOLS.map((sc) => (
          <div key={sc.code} className={'school' + (school === sc.code ? ' sel' : '') + (sc.ready ? '' : ' locked')}
            onClick={() => sc.ready && pick(sc.code)}>
            <div className="row"><span className="nm">{sc.name}</span>
              <span className={'badge' + (sc.ready ? ' on' : '')}>{sc.ready ? 'Дайын' : 'Жақында'}</span></div>
            <div className="full">{sc.full}</div>
            <div className="meta"><span>{sc.grades}</span><span>{sc.ratio}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Children({ session, demo }) {
  const [kids, setKids] = useState([]);
  const [name, setName] = useState('');
  const [klass, setKlass] = useState(6);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null); // {code, pin, name}
  const [err, setErr] = useState('');

  const load = () => { if (!demo) listChildren(session.user.uid).then(setKids).catch(() => {}); };
  useEffect(load, []);

  const add = async () => {
    if (!name) return;
    setBusy(true); setErr('');
    try {
      if (demo) {
        const code = 'DEMO' + Math.floor(10 + Math.random() * 89);
        const pin = String(1000 + Math.floor(Math.random() * 8999));
        setCreated({ code, pin, name });
        setKids([...kids, { childUid: 'demo' + kids.length, name, klass, code }]);
      } else {
        const c = await createChild(session.user, { name, klass });
        setCreated(c); load();
      }
      setName('');
    } catch (e) { setErr(e.message || String(e)); }
    setBusy(false);
  };

  return (
    <div className="rise" style={{ maxWidth: 640 }}>
      <p className="page-eyebrow">Балалар</p>
      <h1 className="page-title">Бала қосу</h1>
      <p className="page-sub">Балаға почта керек емес. Сіз код пен PIN жасайсыз — бала солармен кіреді.</p>

      {created && (
        <div className="q-wrap" style={{ marginBottom: 20, borderColor: 'var(--green)' }}>
          <div className="q-sub" style={{ color: 'var(--green)' }}>{created.name} үшін кіру деректері дайын</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
            <div><div className="l mono" style={{ fontSize: 11, color: 'var(--muted2)' }}>КОД</div>
              <div className="serif" style={{ fontSize: 30, letterSpacing: '.06em' }}>{created.code}</div></div>
            <div><div className="l mono" style={{ fontSize: 11, color: 'var(--muted2)' }}>PIN</div>
              <div className="serif" style={{ fontSize: 30, letterSpacing: '.14em' }}>{created.pin}</div></div>
          </div>
          <p className="note" style={{ marginTop: 10 }}>Бұл деректерді балаңызға беріңіз. PIN-ді сақтап қойыңыз.</p>
        </div>
      )}

      <div className="panel">
        <div className="panel-eyebrow">Жаңа бала</div>
        <div className="field"><label>Аты</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Аружан" /></div>
        <div className="field" style={{ marginBottom: 0 }}><label>Сынып</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[5, 6].map((g) => (
              <button key={g} onClick={() => setKlass(g)}
                style={{ flex: 1, padding: 11, borderRadius: 3, border: '1px solid ' + (klass === g ? 'var(--accent)' : 'var(--line)'), background: klass === g ? 'var(--accent-tint)' : 'var(--card)', color: klass === g ? 'var(--accent)' : 'var(--muted)', font: "600 14px 'Golos Text'" }}>{g} сынып</button>
            ))}
          </div>
        </div>
      </div>
      {err && <p className="err">{err}</p>}
      <button className="btn btn-dark" disabled={busy || !name} onClick={add}>{busy ? 'Құрылуда…' : 'Бала қосу және код жасау'}</button>

      {kids.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-h"><span className="t">Балалар</span><span className="m">{kids.length}</span></div>
          {kids.map((k, i) => (
            <div key={k.childUid} className="trow">
              <span className="num">0{i + 1}</span>
              <span className="nm">{k.name}</span>
              <span className="cnt">{k.klass} сынып</span>
              <span className="mono" style={{ color: 'var(--muted)' }}>код: {k.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ParentProgress({ session, demo }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (demo) return;
    (async () => {
      const kids = await listChildren(session.user.uid).catch(() => []);
      const all = [];
      for (const k of kids) {
        const mocks = await childMocks(k.childUid).catch(() => []);
        mocks.forEach((m) => all.push({ ...m, child: k.name }));
      }
      setRows(all);
    })();
  }, []);
  return (
    <div className="rise">
      <p className="page-eyebrow">Прогресс</p>
      <h1 className="page-title">Сынақ нәтижелері</h1>
      {demo
        ? <p className="page-sub">Демо-режим: нақты нәтижелер Firebase қосылғанда осында көрінеді — қай тақырып мықты, қайсысы әлсіз.</p>
        : rows.length === 0
          ? <p className="page-sub">Балаңыз әлі сынақ тапсырмаған. Нәтижелер осында жиналады.</p>
          : (
            <div className="card">
              {rows.map((r, i) => (
                <div key={i} className="trow">
                  <span className="num">0{i + 1}</span>
                  <span className="nm">{r.child} · {r.title}</span>
                  <span className="cnt">{r.score} / {r.gradable}</span>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}

export default function ParentApp({ session, onSignOut, demo }) {
  const [nav, setNav] = useState('overview');
  const who = { name: session.user.displayName || 'Ата-ана' };
  return (
    <div className="shell">
      <Sidebar nav={nav} setNav={setNav} who={who} onSignOut={onSignOut} />
      <main className="main">
        {nav === 'overview' && <Overview session={session} demo={demo} />}
        {nav === 'children' && <Children session={session} demo={demo} />}
        {nav === 'progress' && <ParentProgress session={session} demo={demo} />}
      </main>
    </div>
  );
}
