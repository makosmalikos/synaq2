import { useState } from 'react';
import { SCHOOLS } from '../lib/ui.js';
import { firebaseReady } from '../lib/firebase.js';
import {
  registerParentEmail, loginParentEmail, signInWithGoogle, loginChild, roleOf,
} from '../lib/auth.js';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6C12.2 13.3 17.6 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.5z"/>
    <path fill="#FBBC05" d="M10.3 28.7a14.5 14.5 0 0 1 0-9.3l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l7.8-6z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.6 2.1-8.8 2.1-6.4 0-11.8-3.8-13.7-9.3l-7.8 6C6.4 42.6 14.6 48 24 48z"/>
  </svg>
);

export default function Auth({ lang, setLang, onSignedIn, demo }) {
  const [stage, setStage] = useState('start'); // start | regForm | school | login | childLogin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('rfmsh');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const fail = (e) => { setErr(e.message || String(e)); setBusy(false); };

  // Демо-вход (когда Firebase не настроен): просто пускаем в UI.
  const demoParent = () => onSignedIn({ user: { uid: 'demo-parent', email: email || 'ata-ana@demo.kz', displayName: 'Ата-ана' }, role: 'parent', school });
  const demoChild = () => onSignedIn({ user: { uid: 'demo-child', email: 'demo@synaq.kids', displayName: 'Бала' }, role: 'child', school });

  const doGoogle = async () => {
    if (demo) return demoParent();
    setBusy(true); setErr('');
    try { await signInWithGoogle(school); /* onAuthStateChanged подхватит */ }
    catch (e) { fail(e); }
  };
  const doRegister = async () => {
    if (demo) return demoParent();
    setBusy(true); setErr('');
    try { await registerParentEmail(email, password, school); }
    catch (e) { fail(e); }
  };
  const doLogin = async () => {
    if (demo) return demoParent();
    setBusy(true); setErr('');
    try { await loginParentEmail(email, password); }
    catch (e) { fail(e); }
  };
  const doChildLogin = async () => {
    if (demo) return demoChild();
    setBusy(true); setErr('');
    try { await loginChild(code, pin); }
    catch (e) { fail(e); }
  };

  return (
    <div className="auth-wrap">
      <div className="lang-toggle">
        <button className={'lang-btn' + (lang === 'kk' ? ' on' : '')} onClick={() => setLang('kk')}>KK</button>
        <button className={'lang-btn' + (lang === 'ru' ? ' on' : '')} onClick={() => setLang('ru')}>RU</button>
      </div>

      <div className="auth-card">
        {demo && (
          <div className="note" style={{ marginBottom: 18, padding: '10px 12px', border: '1px solid var(--line)', background: 'var(--card)' }}>
            Демо-режим: Firebase кілттері қосылмаған. UI-ды осылай да көруге болады. Нақты авторизация үшін <span className="mono">frontend/.env</span> толтырыңыз.
          </div>
        )}

        {stage === 'start' && (
          <div className="rise" style={{ textAlign: 'center' }}>
            <div className="brand"><span className="name">Synaq</span><span className="sub">сынақ</span></div>
            <h1 className="title">Мектеп сынағына нақты дайындық</h1>
            <p className="lead" style={{ marginBottom: 32 }}>Бір отбасы аккаунты — бала дайындалады, ата-ана бақылайды.</p>
            <button className="btn-google" onClick={doGoogle} disabled={busy} style={{ marginBottom: 12 }}>
              <GoogleIcon /> Google арқылы кіру
            </button>
            <div className="divider">немесе</div>
            <button className="btn btn-dark" onClick={() => setStage('school')} style={{ marginBottom: 10 }}>Аккаунт құру</button>
            <button className="btn btn-ghost" onClick={() => setStage('login')} style={{ marginBottom: 10 }}>Аккаунтым бар</button>
            <button className="btn btn-ghost" onClick={() => setStage('childLogin')}>Мен — оқушымын (код + PIN)</button>
            {err && <p className="err" style={{ marginTop: 12 }}>{err}</p>}
          </div>
        )}

        {stage === 'school' && (
          <div className="rise">
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <p className="eyebrow">Мектеп таңдау · 1 / 2</p>
              <h1 className="title" style={{ fontSize: 24 }}>Балаңызды қай мектепке дайындаймыз?</h1>
              <p className="note">Әр мектептің формат бөлек. Қазір РФМШ дайын.</p>
            </div>
            <div className="school-grid">
              {SCHOOLS.map((sc) => (
                <div key={sc.code}
                  className={'school' + (school === sc.code ? ' sel' : '') + (sc.ready ? '' : ' locked')}
                  onClick={() => sc.ready && setSchool(sc.code)}>
                  <div className="row">
                    <span className="nm">{sc.name}</span>
                    <span className={'badge' + (sc.ready ? ' on' : '')}>{sc.ready ? 'Дайын' : 'Жақында'}</span>
                  </div>
                  <div className="full">{sc.full}</div>
                  <div className="meta"><span>{sc.grades}</span><span>{sc.ratio}</span></div>
                </div>
              ))}
            </div>
            <button className="btn btn-dark" style={{ marginTop: 16 }} onClick={() => setStage('regForm')}>Жалғастыру →</button>
            <button className="btn btn-ghost" style={{ marginTop: 6, border: 'none', color: 'var(--muted)' }} onClick={() => setStage('start')}>← Артқа</button>
          </div>
        )}

        {stage === 'regForm' && (
          <div className="rise">
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <p className="eyebrow">Аккаунт құру · 2 / 2</p>
              <h1 className="title" style={{ fontSize: 24 }}>Отбасы аккаунтын ашу</h1>
              <p className="note">Ата-ана профилі. Баланы кейін кабинетте қосасыз.</p>
            </div>
            <button className="btn-google" onClick={doGoogle} disabled={busy} style={{ marginBottom: 16 }}>
              <GoogleIcon /> Google арқылы тіркелу
            </button>
            <div className="divider">немесе почтамен</div>
            <div className="panel">
              <div className="panel-eyebrow">Ата-ана профилі</div>
              <div className="field">
                <label>Почтаңыз</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ata-ana@mail.kz" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Құпия сөз</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            {err && <p className="err">{err}</p>}
            <button className="btn btn-dark" disabled={busy || (!demo && (!email || !password))} onClick={doRegister}>
              {busy ? 'Құрылуда…' : 'Аккаунт құру →'}
            </button>
            <button className="btn btn-ghost" style={{ marginTop: 6, border: 'none', color: 'var(--muted)' }} onClick={() => setStage('school')}>← Артқа</button>
          </div>
        )}

        {stage === 'login' && (
          <div className="rise">
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <p className="eyebrow">Кіру · Ата-ана</p>
              <h1 className="title" style={{ fontSize: 24 }}>Аккаунтқа кіру</h1>
            </div>
            <button className="btn-google" onClick={doGoogle} disabled={busy} style={{ marginBottom: 16 }}>
              <GoogleIcon /> Google арқылы кіру
            </button>
            <div className="divider">немесе почтамен</div>
            <div className="panel">
              <div className="field"><label>Почта</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ata-ana@mail.kz" /></div>
              <div className="field" style={{ marginBottom: 0 }}><label>Құпия сөз</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
            </div>
            {err && <p className="err">{err}</p>}
            <button className="btn btn-dark" disabled={busy} onClick={doLogin}>{busy ? 'Кіру…' : 'Кіру'}</button>
            <button className="btn btn-ghost" style={{ marginTop: 6, border: 'none', color: 'var(--muted)' }} onClick={() => setStage('start')}>← Артқа</button>
          </div>
        )}

        {stage === 'childLogin' && (
          <div className="rise">
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <p className="eyebrow">Кіру · Оқушы</p>
              <h1 className="title" style={{ fontSize: 24 }}>Код пен PIN енгіз</h1>
              <p className="note">Кодты ата-анаң берген. Почта керек емес.</p>
            </div>
            <div className="panel">
              <div className="field"><label>Код</label>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" style={{ letterSpacing: '.1em', fontFamily: "'IBM Plex Mono',monospace" }} /></div>
              <div className="field" style={{ marginBottom: 0 }}><label>PIN</label>
                <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="0000" inputMode="numeric" style={{ letterSpacing: '.3em', fontFamily: "'IBM Plex Mono',monospace" }} /></div>
            </div>
            {err && <p className="err">{err}</p>}
            <button className="btn btn-dark" disabled={busy} onClick={doChildLogin}>{busy ? 'Кіру…' : 'Кіру'}</button>
            <button className="btn btn-ghost" style={{ marginTop: 6, border: 'none', color: 'var(--muted)' }} onClick={() => setStage('start')}>← Артқа</button>
          </div>
        )}
      </div>
    </div>
  );
}
