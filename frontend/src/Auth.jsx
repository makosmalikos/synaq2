import React, { useState } from 'react';
import { registerParent, loginParent, loginChild, loginGoogle, errText } from './firebase.js';
import { POOL } from './bank.js';

const COUNT = (c) => POOL.filter((q) => q.school === c).length;
const SCHOOLS = [
  { code: 'РФМШ', name: 'РФМШ', full: 'Республикалық физика-математика мектебі', grades: '5–7 сын.' },
  { code: 'НИШ', name: 'НИШ', full: 'Назарбаев Зияткерлік мектептері', grades: '7 сын.' },
  { code: 'БИЛ', name: 'БИЛ', full: 'Білім-Инновация лицейлері', grades: '6–7 сын.' },
];

// Экраны входа, оформленные как в дизайне: по центру, выбор школы карточками.
export default function Auth() {
  const [stage, setStage] = useState('start'); // start | register | school | loginRole | loginParent | loginChild
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [schools, setSchools] = useState(['РФМШ']);
  const toggle = (c) => setSchools((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]));
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
            <button style={{ ...S.dark, marginTop: 6 }} disabled={!email || pass.length < 6} onClick={() => { setErr(''); setStage('school'); }}>Жалғастыру →</button>
            <button style={S.back} onClick={() => setStage('start')}>← Артқа</button>
          </div>
        )}

        {stage === 'school' && (
          <div style={{ animation: 'rise .4s ease both' }}>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <p style={S.kicker}>Мектеп таңдау · 2 / 2</p>
              <h1 style={S.h1}>Балаңызды қай мектепке дайындаймыз?</h1>
              <p style={{ ...S.sub, marginBottom: 0, fontSize: 13.5 }}>
                Бірнеше мектепті таңдауға болады — дайындық кезінде барлығының есептері араласып беріледі.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(23,20,15,.16)', border: '1px solid rgba(23,20,15,.16)' }}>
              {SCHOOLS.map((s2) => {
                const on = schools.includes(s2.code);
                return (
                  <div key={s2.code} onClick={() => toggle(s2.code)}
                    style={{ background: on ? '#FFF9F8' : '#fff', padding: '16px 18px', cursor: 'pointer', borderLeft: on ? '3px solid #B0342B' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
                      <span style={{
                        width: 18, height: 18, flex: '0 0 18px', border: on ? '1px solid #B0342B' : '1px solid rgba(23,20,15,.28)',
                        background: on ? '#B0342B' : '#fff', color: '#fff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', font: "700 11px 'Golos Text'", borderRadius: 2,
                      }}>{on ? '✓' : ''}</span>
                      <span style={{ font: "700 18px 'Lora',serif", letterSpacing: '-.01em', flex: 1 }}>{s2.name}</span>
                      <span style={S.badgeOn}>{COUNT(s2.code)} есеп</span>
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4, color: '#6B655B', marginBottom: 12, paddingLeft: 29 }}>{s2.full}</div>
                    <div style={{ borderTop: '1px solid rgba(23,20,15,.1)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', font: "500 12px 'IBM Plex Mono',monospace", color: '#6B655B' }}>
                      <span>{s2.grades}</span><span>{on ? 'таңдалды' : 'таңдау'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Err v={err} />
            {!schools.length && <p style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#9A9384', textAlign: 'center', marginTop: 12 }}>Кемінде бір мектеп таңдаңыз</p>}
            <button style={{ ...S.dark, marginTop: 16, opacity: schools.length ? 1 : .45 }} disabled={busy || !schools.length}
              onClick={run(() => registerParent(email, pass, { schools }))}>Аккаунт құру →</button>
            <button style={S.back} onClick={() => setStage('register')}>← Артқа</button>
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
