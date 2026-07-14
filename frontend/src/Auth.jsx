import React, { useState } from 'react';
import { registerParent, loginParent, loginChild, loginGoogle, errText } from './firebase.js';
import { useLang, LangSwitch } from './i18n.jsx';

// Вход оформлен как карточка поверх затемнённого фона (попап), а не пустая страница.
// На первом экране сразу объясняем, как устроен семейный аккаунт.
export default function Auth({ onClose }) {
  const { t } = useLang();
  const [stage, setStage] = useState('start'); // start | register | loginRole | loginParent | loginChild
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');

  const run = (fn) => async () => {
    setErr(''); setBusy(true);
    try { await fn(); } catch (e) { setErr(errText(e)); }
    setBusy(false);
  };

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.top}>
          <Logo />
          <LangSwitch />
        </div>

        {stage === 'start' && (
          <div style={{ animation: 'rise .35s ease both' }}>
            <h1 style={S.h1}>{t('auth.title')}</h1>
            <p style={S.sub}>{t('auth.sub')}</p>

            {/* Понятное объяснение потока: кто регистрируется и как входит ребёнок */}
            <div style={S.steps}>
              <p style={S.kicker}>{t('auth.how')}</p>
              {['auth.step1', 'auth.step2', 'auth.step3', 'auth.step4'].map((k, i) => (
                <div key={k} style={S.step}>
                  <span style={S.num}>{i + 1}</span>
                  <span style={S.stepTxt}>{t(k)}</span>
                </div>
              ))}
            </div>

            <button style={S.dark} onClick={() => setStage('register')}>{t('auth.create')}</button>
            <button style={S.outline} onClick={() => setStage('loginRole')}>{t('auth.have')}</button>

            <div style={S.divider}>
              <div style={S.line} />
              <span style={S.or}>{t('auth.or')}</span>
              <div style={S.line} />
            </div>

            <button style={S.google} disabled={busy} onClick={run(loginGoogle)}>
              <span style={{ font: "700 15px 'Golos Text'", color: '#4285F4' }}>G</span> {t('auth.google')}
            </button>
            <Err v={err} />
          </div>
        )}

        {stage === 'register' && (
          <div style={{ animation: 'rise .3s ease both' }}>
            <p style={S.kicker}>{t('auth.parentAccount')}</p>
            <h1 style={S.h1}>{t('auth.create')}</h1>
            <p style={S.hint}>{t('auth.step2')}</p>
            <input style={S.input} placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={S.input} type="password" placeholder={t('auth.password')} value={pass} onChange={(e) => setPass(e.target.value)} />
            <Err v={err} />
            <button style={{ ...S.dark, marginTop: 6 }} disabled={busy || !email || pass.length < 6}
              onClick={run(() => registerParent(email, pass))}>{t('auth.create')} →</button>
            <button style={S.back} onClick={() => setStage('start')}>{t('common.back')}</button>
          </div>
        )}

        {stage === 'loginRole' && (
          <div style={{ animation: 'rise .3s ease both' }}>
            <h1 style={S.h1}>{t('auth.whoEnters')}</h1>
            <button style={{ ...S.dark, marginTop: 18 }} onClick={() => setStage('loginChild')}>{t('auth.child')}</button>
            <button style={S.outline} onClick={() => setStage('loginParent')}>{t('auth.parent')}</button>
            <button style={S.back} onClick={() => setStage('start')}>{t('common.back')}</button>
          </div>
        )}

        {stage === 'loginParent' && (
          <div style={{ animation: 'rise .3s ease both' }}>
            <h1 style={S.h1}>{t('auth.parent')}</h1>
            <input style={S.input} placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={S.input} type="password" placeholder={t('auth.password')} value={pass} onChange={(e) => setPass(e.target.value)} />
            <Err v={err} />
            <button style={{ ...S.dark, marginTop: 6 }} disabled={busy} onClick={run(() => loginParent(email, pass))}>{t('auth.login')}</button>
            <button style={S.back} onClick={() => setStage('loginRole')}>{t('common.back')}</button>
          </div>
        )}

        {stage === 'loginChild' && (
          <div style={{ animation: 'rise .3s ease both' }}>
            <h1 style={S.h1}>{t('auth.child')}</h1>
            <p style={S.hint}>{t('auth.childHint')}</p>
            <input style={S.input} placeholder={t('auth.code')} value={code} onChange={(e) => setCode(e.target.value)} />
            <input style={S.input} type="password" placeholder={t('auth.pin')} value={pin} onChange={(e) => setPin(e.target.value)} />
            <Err v={err} />
            <button style={{ ...S.dark, marginTop: 6 }} disabled={busy} onClick={run(() => loginChild(code, pin))}>{t('auth.login')}</button>
            <button style={S.back} onClick={() => setStage('loginRole')}>{t('common.back')}</button>
          </div>
        )}

        {onClose && <button style={S.close} onClick={onClose} aria-label="close">×</button>}
      </div>
    </div>
  );
}

const Logo = () => (
  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
    <span style={{ font: "700 26px 'Lora',serif", letterSpacing: '-.01em' }}>Synaq</span>
    <span style={{ font: "500 10px 'IBM Plex Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#B0342B', borderLeft: '1px solid rgba(23,20,15,.2)', paddingLeft: 10 }}>сынақ</span>
  </div>
);

const Err = ({ v }) => (v ? <p style={{ color: '#B0342B', fontSize: 13, margin: '10px 0 0', textAlign: 'center' }}>{v}</p> : null);

const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto',
    background: 'rgba(20,17,12,.55)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '6vh 20px 40px', fontFamily: "'Golos Text',system-ui,sans-serif", color: '#17140F',
  },
  card: {
    position: 'relative', width: '100%', maxWidth: 420, background: '#FBFAF6',
    borderRadius: 16, padding: '26px 28px 30px', boxShadow: '0 24px 70px rgba(0,0,0,.28)',
  },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  close: {
    position: 'absolute', top: 12, right: 14, border: 0, background: 'none',
    font: '400 26px/1 system-ui', color: '#9A9384', cursor: 'pointer',
  },
  h1: { font: "600 25px/1.22 'Lora',serif", letterSpacing: '-.02em', margin: '0 0 8px' },
  sub: { fontSize: 14.5, lineHeight: 1.55, color: '#6B655B', margin: '0 0 20px' },
  hint: { fontSize: 13.5, lineHeight: 1.5, color: '#6B655B', margin: '0 0 16px' },
  steps: { background: '#fff', border: '1px solid rgba(23,20,15,.1)', borderRadius: 12, padding: '16px 16px 8px', marginBottom: 22 },
  kicker: { font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#B0342B', margin: '0 0 12px' },
  step: { display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  num: {
    flex: 'none', width: 20, height: 20, borderRadius: '50%', background: '#17140F', color: '#FBFAF6',
    font: "700 11px 'IBM Plex Mono',monospace", display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepTxt: { fontSize: 13.5, lineHeight: 1.45, color: '#3A352C' },
  divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' },
  line: { flex: 1, height: 1, background: 'rgba(23,20,15,.14)' },
  or: { font: "500 11px 'IBM Plex Mono',monospace", color: '#9A9384' },
  dark: { width: '100%', padding: 15, background: '#17140F', color: '#FBFAF6', border: 'none', borderRadius: 8, font: "600 15px 'Golos Text'", cursor: 'pointer', marginBottom: 10 },
  outline: { width: '100%', padding: 15, background: 'transparent', color: '#17140F', border: '1px solid rgba(23,20,15,.24)', borderRadius: 8, font: "600 15px 'Golos Text'", cursor: 'pointer' },
  input: { width: '100%', padding: '13px 14px', border: '1px solid rgba(23,20,15,.22)', borderRadius: 8, font: "500 15px 'Golos Text'", color: '#17140F', outline: 'none', background: '#fff', marginBottom: 10 },
  back: { width: '100%', marginTop: 6, padding: 9, background: 'transparent', color: '#6B655B', border: 'none', font: "500 13.5px 'Golos Text'", cursor: 'pointer' },
  google: { width: '100%', padding: 13, background: '#fff', color: '#17140F', border: '1px solid rgba(23,20,15,.24)', borderRadius: 8, font: "600 15px 'Golos Text'", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 },
};
