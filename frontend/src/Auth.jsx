import React, { useState } from 'react';
import { registerParent, loginParent, loginChild, loginGoogle, errText } from './firebase.js';


// Экраны входа, оформленные как в дизайне: по центру, выбор школы карточками.
export default function Auth() {
  const [stage, setStage] = useState('start'); // start | register | school | loginRole | loginParent | loginChild
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');

  const run = (fn) => async () => { setErr(''); setBusy(true); try { await fn(); } catch (e) { setErr(errText(e)); } setBusy(false); };

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {stage === 'start' && (
          <div style={{ textAlign: 'center', animation: 'rise .4s ease both' }}>
            <Logo />
            <h1 style={S.h1big}>Мектеп сынағына нақты дайындық</h1>
            <p style={S.sub}>Бір отбасы аккаунты — бала дайындалады, ата-ана бақылайды.</p>
            <button style={S.dark} onClick={() => setStage('register')}>Аккаунт құру</button>
            <button style={S.outline} onClick={() => setStage('loginRole')}>Аккаунтым бар</button>
            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0 12px' }}>
              <div style={{ flex:1, height:1, background:'rgba(23,20,15,.14)' }}></div>
              <span style={{ font:"500 11px 'IBM Plex Mono',monospace", color:'#9A9384' }}>немесе</span>
              <div style={{ flex:1, height:1, background:'rgba(23,20,15,.14)' }}></div>
            </div>
            <button style={S.google} disabled={busy} onClick={run(loginGoogle)}>
              <span style={{ font:"700 15px 'Golos Text'", color:'#4285F4' }}>G</span> Google арқылы кіру
            </button>
            <Err v={err} />
          </div>
        )}

        {stage === 'register' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <p style={S.kicker}>Ата-ана аккаунты · 1 / 2</p>
              <h1 style={S.h1}>Аккаунт құру</h1>
            </div>
            <input style={S.input} placeholder="Электрондық пошта" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={S.input} type="password" placeholder="Құпиясөз (кемінде 6 таңба)" value={pass} onChange={(e) => setPass(e.target.value)} />
            <Err v={err} />
            <button style={{ ...S.dark, marginTop: 6 }} disabled={busy || !email || pass.length < 6} onClick={run(() => registerParent(email, pass))}>Аккаунт құру →</button>
            <button style={S.back} onClick={() => setStage('start')}>← Артқа</button>
          </div>
        )}

        {stage === 'loginRole' && (
          <div style={{ textAlign: 'center', animation: 'rise .4s ease both' }}>
            <Logo />
            <h1 style={S.h1}>Кім кіреді?</h1>
            <button style={{ ...S.dark, marginTop: 20 }} onClick={() => setStage('loginChild')}>Бала</button>
            <button style={S.outline} onClick={() => setStage('loginParent')}>Ата-ана</button>
            <button style={S.back} onClick={() => setStage('start')}>← Артқа</button>
          </div>
        )}

        {stage === 'loginParent' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 22 }}><h1 style={S.h1}>Ата-ана кірісі</h1></div>
            <input style={S.input} placeholder="Электрондық пошта" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={S.input} type="password" placeholder="Құпиясөз" value={pass} onChange={(e) => setPass(e.target.value)} />
            <Err v={err} />
            <button style={{ ...S.dark, marginTop: 6 }} disabled={busy} onClick={run(() => loginParent(email, pass))}>Кіру</button>
            <button style={S.back} onClick={() => setStage('loginRole')}>← Артқа</button>
          </div>
        )}

        {stage === 'loginChild' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 22 }}><h1 style={S.h1}>Бала кірісі</h1></div>
            <input style={S.input} placeholder="Код" value={code} onChange={(e) => setCode(e.target.value)} />
            <input style={S.input} type="password" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
            <Err v={err} />
            <button style={{ ...S.dark, marginTop: 6 }} disabled={busy} onClick={run(() => loginChild(code, pin))}>Кіру</button>
            <button style={S.back} onClick={() => setStage('loginRole')}>← Артқа</button>
          </div>
        )}

      </div>
    </div>
  );
}

const Logo = () => (
  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, marginBottom: 40 }}>
    <span style={{ font: "700 30px 'Lora',serif", letterSpacing: '-.01em' }}>Synaq</span>
    <span style={{ font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#B0342B', borderLeft: '1px solid rgba(23,20,15,.2)', paddingLeft: 11 }}>сынақ</span>
  </div>
);
const Err = ({ v }) => (v ? <p style={{ color: '#B0342B', fontSize: 13, margin: '10px 0 0', textAlign: 'center' }}>{v}</p> : null);

const S = {
  page: { minHeight: '100vh', background: '#FBFAF6', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontFamily: "'Golos Text',system-ui,sans-serif", color: '#17140F' },
  wrap: { width: '100%', maxWidth: 392, padding: '9vh 24px 0' },
  h1big: { font: "600 28px/1.22 'Lora',serif", letterSpacing: '-.02em', margin: '0 auto 12px', maxWidth: 300 },
  h1: { font: "600 25px/1.2 'Lora',serif", letterSpacing: '-.02em', margin: '0 auto 8px', maxWidth: 300 },
  sub: { fontSize: 14.5, lineHeight: 1.55, color: '#6B655B', margin: '0 0 40px' },
  kicker: { font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#B0342B', margin: '0 0 14px' },
  dark: { width: '100%', padding: 15, background: '#17140F', color: '#FBFAF6', border: 'none', borderRadius: 3, font: "600 15px 'Golos Text'", cursor: 'pointer', marginBottom: 10 },
  outline: { width: '100%', padding: 15, background: 'transparent', color: '#17140F', border: '1px solid rgba(23,20,15,.24)', borderRadius: 3, font: "600 15px 'Golos Text'", cursor: 'pointer' },
  input: { width: '100%', padding: '13px 14px', border: '1px solid rgba(23,20,15,.22)', borderRadius: 3, font: "500 15px 'Golos Text'", color: '#17140F', outline: 'none', background: '#fff', marginBottom: 10 },
  back: { width: '100%', marginTop: 6, padding: 9, background: 'transparent', color: '#6B655B', border: 'none', font: "500 13.5px 'Golos Text'", cursor: 'pointer' },
  google: { width:'100%', padding:13, background:'#fff', color:'#17140F', border:'1px solid rgba(23,20,15,.24)', borderRadius:3, font:"600 15px 'Golos Text'", cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:9 },
  badgeOn: { font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#4C7A4E', border: '1px solid #4C7A4E', padding: '2px 7px' },
  badgeOff: { font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#9A9384', border: '1px solid rgba(23,20,15,.2)', padding: '2px 7px' },
};
