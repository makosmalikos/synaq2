import React, { useState } from 'react';
import { registerParent, loginParent, loginChild, loginAdmin, loginGoogle, resetParentPassword, errText, childErrText } from './firebase.js';
import { useLang, LangSwitch } from './i18n.jsx';
import Brand from './Brand.jsx';

// Вход оформлен как карточка поверх затемнённого фона (попап), а не пустая страница.
// На первом экране сразу объясняем, как устроен семейный аккаунт.
export default function Auth({ onClose, duelCode = '' }) {
  const { t, lang } = useLang();
  const [pname, setPname] = useState('');
  // ?admin=1 в адресе — единственный путь к входу администратора: обычный
  // посетитель его не видит и кнопки на экране «Кто входит?» для него нет.
  // По этой ссылке экран «Кто входит?» показывает ТОЛЬКО кнопку «Администратор».
  const [isAdminLink] = useState(() => {
    try {
      return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1';
    } catch { return false; }
  });
  const [stage, setStage] = useState(() => (isAdminLink ? 'loginRole' : 'start')); // start | register | loginRole | loginParent | loginChild | loginAdmin
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [info, setInfo] = useState('');

  const run = (fn, formatError = (e) => errText(e, lang)) => async () => {
    setErr(''); setInfo(''); setBusy(true);
    try { await fn(); } catch (e) { setErr(formatError(e)); }
    setBusy(false);
  };

  const submitChild = (e) => {
    e.preventDefault();
    if (busy || !code.trim() || pin.length < 6) return;
    run(() => loginChild(code, pin), (error) => childErrText(error, lang))();
  };

  return (
    <div className={`auth-overlay ${stage === 'start' ? 'auth-overlay--start' : ''}`} style={S.overlay}>
      <style>{`
        .auth-card{animation:authCardIn .35s cubic-bezier(.2,.8,.2,1) both}
        .auth-overlay:before,.auth-overlay:after{content:'';position:fixed;pointer-events:none;border:1px solid rgba(255,255,255,.38);transform:rotate(-13deg);border-radius:48px}
        .auth-overlay:before{width:42vw;height:31vw;left:-13vw;bottom:-16vw}
        .auth-overlay:after{width:34vw;height:43vw;right:-12vw;top:-20vw;transform:rotate(22deg)}
        .auth-start-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);gap:30px;align-items:stretch;flex:1}
        .auth-start-copy{min-width:0;display:flex;flex-direction:column;justify-content:flex-start;padding:28px 0 12px}
        .auth-start-actions{display:flex;flex-direction:column;justify-content:flex-start;padding:24px;border:1px solid rgba(47,128,237,.12);border-radius:24px;background:linear-gradient(145deg,#F7FBFF,#EAF5FF);box-shadow:inset 0 1px 0 #fff;overflow:hidden;position:relative}
        .auth-start-actions:before{content:'SYNAQ START';display:inline-flex;align-self:flex-start;margin-bottom:16px;padding:6px 10px;border-radius:999px;background:#E3F1FF;color:#237ED7;font:700 10px 'Manrope',sans-serif;letter-spacing:.12em}
        .auth-start-error{grid-column:1/-1}
        .auth-visual{position:relative;flex:1;min-height:185px;margin:16px -24px -24px;overflow:hidden;background:linear-gradient(155deg,rgba(255,255,255,.12),rgba(87,178,244,.13))}
        .auth-visual:before{content:'';position:absolute;width:290px;height:290px;border:1px solid rgba(47,128,237,.17);border-radius:42% 58% 61% 39%/48% 35% 65% 52%;right:-50px;bottom:-155px;transform:rotate(-18deg);box-shadow:0 0 0 34px rgba(47,128,237,.035),0 0 0 70px rgba(47,128,237,.025)}
        .auth-student{position:absolute;height:240px;width:auto;right:5px;bottom:-62px;filter:drop-shadow(0 18px 22px rgba(30,92,146,.18));transition:transform .35s cubic-bezier(.2,.8,.2,1)}
        .auth-visual:hover .auth-student{transform:translateY(-5px) scale(1.035)}
        .auth-progress{position:absolute;left:18px;bottom:20px;width:165px;padding:13px 14px;border:1px solid rgba(47,128,237,.14);border-radius:16px;background:rgba(255,255,255,.88);box-shadow:0 14px 35px rgba(36,106,166,.13);backdrop-filter:blur(9px)}
        .auth-progress-head{display:flex;align-items:center;justify-content:space-between;color:#547089;font:700 10px 'Manrope',sans-serif;letter-spacing:.04em}
        .auth-progress-value{color:#167ad1;font:800 17px 'Geologica','Manrope',sans-serif}
        .auth-progress-track{height:6px;margin:9px 0 8px;border-radius:999px;background:#dcecff;overflow:hidden}
        .auth-progress-track span{display:block;width:82%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#44b8f4,#2f80ed)}
        .auth-schools{color:#28455f;font:700 9px 'Manrope',sans-serif;letter-spacing:.07em}
        .auth-float-icon{position:absolute;display:grid;place-items:center;width:38px;height:38px;border-radius:13px;background:rgba(255,255,255,.88);box-shadow:0 12px 28px rgba(42,106,158,.12);font-size:17px}
        .auth-float-icon--book{left:28px;top:21px;transform:rotate(-7deg)}
        .auth-float-icon--target{left:105px;top:57px;transform:rotate(7deg)}
        @keyframes authCardIn{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
        @media(min-width:761px){
          .auth-overlay--start{align-items:center!important;padding-top:24px!important;padding-bottom:24px!important}
          .auth-card--start{min-height:min(650px,calc(100vh - 48px));display:flex;flex-direction:column}
        }
        @media(max-width:760px){
          .auth-start-grid{grid-template-columns:1fr;gap:18px}
          .auth-start-actions{padding:0;border:0;background:transparent;box-shadow:none}
          .auth-start-actions:before{display:none}
          .auth-start-copy{padding:0}
          .auth-visual{display:none}
          .auth-overlay:before,.auth-overlay:after{opacity:.5}
        }
        @media(max-width:480px){
          .auth-card{border-radius:22px!important;padding:22px 20px 24px!important}
        }
      `}</style>
      <div className={`auth-card ${stage === 'start' ? 'auth-card--start' : ''}`} style={{ ...S.card, ...(stage === 'start' ? S.cardStart : null) }}>




        <div style={S.top}>
          <Logo />
         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
  <LangSwitch />
  <button onClick={() => (window.location.href = '/')} style={{ background: 'none', border: 'none', cursor: 'pointer', font: "600 13px 'Golos Text',sans-serif", color: '#6B655B' }}>{t('common.exit')}</button>
</div>
        </div>

        {duelCode && (
          <div style={{ background: '#FBEDEC', border: '1px solid rgba(176,52,43,.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ margin: 0, font: "600 13px 'IBM Plex Mono',monospace", letterSpacing: '.06em', color: '#B0342B', textTransform: 'uppercase' }}>
              ⚔ {t('auth.duelInvite')}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6B655B' }}>
              {t('auth.duelInviteSub')} <b>{duelCode}</b>
            </p>
          </div>
        )}

        {stage === 'start' && (
          <div className="auth-start-grid">
            <div className="auth-start-copy">
              <h1 style={{ ...S.h1, fontSize: 34 }}>{t('auth.title')}</h1>
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
            </div>
            <div className="auth-start-actions">
              <button style={S.dark} onClick={() => setStage('register')}>{t('auth.create')}</button>
              <button style={S.outline} onClick={() => setStage('loginRole')}>{t('auth.have')}</button>

              <div style={S.divider}>
                <div style={S.line} />
                <span style={S.or}>{t('auth.or')}</span>
                <div style={S.line} />
              </div>

              <button style={S.google} disabled={busy} onClick={run(loginGoogle)}>
                <span style={{ font: "800 15px 'Manrope'", color: '#4285F4' }}>G</span> {t('auth.google')}
              </button>
              <div className="auth-visual" aria-hidden="true">
                <span className="auth-float-icon auth-float-icon--book">📘</span>
                <span className="auth-float-icon auth-float-icon--target">🎯</span>
                <img className="auth-student" src="/hero/students/cutout-3.png" alt="" />
                <div className="auth-progress">
                  <div className="auth-progress-head"><span>ПРОГРЕСС</span><span className="auth-progress-value">82%</span></div>
                  <div className="auth-progress-track"><span /></div>
                  <div className="auth-schools">РФМШ · НИШ · БИЛ</div>
                </div>
              </div>
            </div>
            {err && <div className="auth-start-error"><Err v={err} /></div>}
          </div>
        )}

        {stage === 'register' && (
          <div style={{ animation: 'rise .3s ease both' }}>
            <p style={S.kicker}>{t('auth.parentAccount')}</p>
            <h1 style={S.h1}>{t('auth.create')}</h1>
            <p style={S.hint}>{t('auth.step2')}</p>
            <input style={S.input} placeholder={t('auth.yourName')} value={pname} onChange={(e) => setPname(e.target.value)} />
            <input style={S.input} placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={S.input} type="password" placeholder={t('auth.password')} value={pass} onChange={(e) => setPass(e.target.value)} />
            <Err v={err} />
            <button style={{ ...S.dark, marginTop: 6 }} disabled={busy || !email || pass.length < 6}
              onClick={run(() => registerParent(email, pass, pname))}>{t('auth.create')} →</button>
            <button style={S.back} onClick={() => setStage('start')}>{t('common.back')}</button>
          </div>
        )}

        {stage === 'loginRole' && (
          <div style={{ animation: 'rise .3s ease both' }}>
            <h1 style={S.h1}>{t('auth.whoEnters')}</h1>
            {isAdminLink ? (
              <button style={{ ...S.dark, marginTop: 18 }} onClick={() => setStage('loginAdmin')}>{t('auth.admin')}</button>
            ) : (
              <>
                <button style={{ ...S.dark, marginTop: 18 }} onClick={() => setStage('loginChild')}>{t('auth.child')}</button>
                <button style={S.outline} onClick={() => setStage('loginParent')}>{t('auth.parent')}</button>
              </>
            )}
            <button style={S.back} onClick={() => setStage('start')}>{t('common.back')}</button>
          </div>
        )}

        {stage === 'loginAdmin' && (
          <div style={{ animation: 'rise .3s ease both' }}>
            <h1 style={S.h1}>{t('admin.loginTitle')}</h1>
            <p style={S.hint}>{t('admin.googleHint')}</p>
            <Err v={err} />
            <button style={{ ...S.google, marginTop: 18 }} disabled={busy} onClick={run(loginAdmin)}>
              <span style={{ font: "800 15px 'Manrope'", color: '#4285F4' }}>G</span> {t('admin.googleLogin')}
            </button>
            <button style={S.back} onClick={() => setStage('loginRole')}>{t('common.back')}</button>
          </div>
        )}

        {stage === 'loginParent' && (
          <div style={{ animation: 'rise .3s ease both' }}>
            <h1 style={S.h1}>{t('auth.parent')}</h1>
            <p style={S.hint}>{t('auth.parentHint')}</p>
            <input style={S.input} type="email" autoComplete="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={S.input} type="password" autoComplete="current-password" placeholder={t('auth.passwordLogin')} value={pass} onChange={(e) => setPass(e.target.value)} />
            <Err v={err} />
            {info && <p style={{ color: '#4C7A4E', fontSize: 13, margin: '10px 0 0', textAlign: 'center' }}>{info}</p>}
            <button style={{ ...S.dark, marginTop: 6 }} disabled={busy || !email.trim()} onClick={run(() => loginParent(email, pass))}>{t('auth.login')}</button>
            <button
              style={S.linkBtn}
              disabled={busy || !email.trim()}
              onClick={run(async () => {
                await resetParentPassword(email);
                setInfo(t('auth.resetSent'));
              })}
            >
              {t('auth.forgot')}
            </button>

            <div style={S.divider}>
              <div style={S.line} />
              <span style={S.or}>{t('auth.or')}</span>
              <div style={S.line} />
            </div>

            <button style={S.google} disabled={busy} onClick={run(loginGoogle)}>
              <span style={{ font: "700 15px 'Golos Text'", color: '#4285F4' }}>G</span> {t('auth.google')}
            </button>
            <button style={S.back} onClick={() => setStage('loginRole')}>{t('common.back')}</button>
          </div>
        )}

        {stage === 'loginChild' && (
          <form style={{ animation: 'rise .3s ease both' }} onSubmit={submitChild}>
            <h1 style={S.h1}>{t('auth.child')}</h1>
            <p style={S.hint}>{t('auth.childHint')}</p>
            <label style={S.fieldLabel} htmlFor="child-code">{t('auth.code')}</label>
            <input id="child-code" style={S.input} placeholder={t('auth.codeExample')} value={code}
              autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username"
              onChange={(e) => setCode(e.target.value)} />
            <p style={S.fieldHelp}>{t('auth.codeHelp')}</p>
            <label style={S.fieldLabel} htmlFor="child-pin">{t('auth.pin')}</label>
            <div style={S.pinWrap}>
              <input id="child-pin" style={{ ...S.input, marginBottom: 0, paddingRight: 76 }}
                type={showPin ? 'text' : 'password'} placeholder={t('auth.pin')}
                value={pin} autoComplete="current-password" onChange={(e) => setPin(e.target.value)} />
              <button type="button" style={S.pinToggle} onClick={() => setShowPin((value) => !value)}>
                {showPin ? t('auth.hidePin') : t('auth.showPin')}
              </button>
            </div>
            <Err v={err} />
            <button type="submit" style={{ ...S.dark, marginTop: 14 }} disabled={busy || !code.trim() || pin.length < 6}>{t('auth.login')}</button>
            <button type="button" style={S.back} onClick={() => setStage('loginRole')}>{t('common.back')}</button>
          </form>
        )}

        {onClose && <button style={S.close} onClick={onClose} aria-label="close">×</button>}
      </div>
    </div>
  );
}

const Logo = () => (
  <Brand compact />
);

const Err = ({ v }) => (v ? <p style={{ color: '#B0342B', fontSize: 13, margin: '10px 0 0', textAlign: 'center' }}>{v}</p> : null);

const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto',
    backgroundColor: '#A9D9F7',
    backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.32) 1px,transparent 1.5px),radial-gradient(circle at 14% 18%,rgba(255,255,255,.72) 0,rgba(255,255,255,0) 31%),radial-gradient(circle at 88% 82%,rgba(47,128,237,.18) 0,rgba(47,128,237,0) 38%),linear-gradient(135deg,#D9F0FF 0%,#86CFF2 48%,#72B9E5 100%)',
    backgroundSize: '34px 34px,100% 100%,100% 100%,100% 100%',
    backgroundPosition: '0 0,center,center,center',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '4vh 20px 36px', fontFamily: "'Manrope','Golos Text',system-ui,sans-serif", color: '#13283C',
  },
  card: {
    position: 'relative', width: '100%', maxWidth: 470, background: 'rgba(255,255,255,.97)',
    border: '1px solid rgba(39,132,211,.16)', borderRadius: 28, padding: '28px 32px 32px', boxShadow: '0 30px 90px rgba(15,86,145,.2)', backdropFilter: 'blur(18px)',
  },
  cardStart: { maxWidth: 860 },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  close: {
    position: 'absolute', top: 12, right: 14, border: 0, background: 'none',
    font: '400 26px/1 system-ui', color: '#9A9384', cursor: 'pointer',
  },
  h1: { font: "800 28px/1.13 'Geologica','Manrope',sans-serif", letterSpacing: '-.035em', margin: '0 0 10px' },
  sub: { font: "500 14.5px/1.55 'Manrope',sans-serif", color: '#60758A', margin: '0 0 18px' },
  hint: { fontSize: 13.5, lineHeight: 1.5, color: '#60758A', margin: '0 0 16px' },
  steps: { background: '#F4F9FF', border: '1px solid rgba(39,132,211,.12)', borderRadius: 18, padding: '16px 17px 8px', marginBottom: 0 },
  kicker: { font: "700 10.5px 'Manrope',sans-serif", letterSpacing: '.13em', textTransform: 'uppercase', color: '#2B91EA', margin: '0 0 12px' },
  step: { display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  num: {
    flex: 'none', width: 20, height: 20, borderRadius: '50%', background: '#3A9DF5', color: '#FFFFFF',
    font: "700 11px 'IBM Plex Mono',monospace", display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepTxt: { font: "600 13.5px/1.45 'Manrope',sans-serif", color: '#334155' },
  divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' },
  line: { flex: 1, height: 1, background: 'rgba(23,20,15,.14)' },
  or: { font: "500 11px 'IBM Plex Mono',monospace", color: '#9A9384' },
  dark: { width: '100%', padding: 15, background: 'linear-gradient(135deg,#3A9DF5,#2F80ED)', color: '#FFFFFF', border: 'none', borderRadius: 13, font: "750 14.5px 'Manrope',sans-serif", cursor: 'pointer', marginBottom: 10, boxShadow: '0 12px 24px -14px rgba(47,128,237,.75)' },
  outline: { width: '100%', padding: 15, background: '#FFFFFF', color: '#167AD1', border: '1px solid rgba(39,132,211,.24)', borderRadius: 13, font: "750 14.5px 'Manrope',sans-serif", cursor: 'pointer' },
  input: { width: '100%', padding: '13px 14px', border: '1px solid rgba(39,132,211,.24)', borderRadius: 10, font: "500 15px 'Golos Text'", color: '#13283C', outline: 'none', background: '#fff', marginBottom: 10 },
  fieldLabel: { display: 'block', margin: '0 0 6px', font: "600 12px 'Golos Text'", color: '#36536B' },
  fieldHelp: { margin: '-3px 0 11px', font: "500 11.5px/1.4 'Golos Text'", color: '#8094A7' },
  pinWrap: { position: 'relative', marginBottom: 10 },
  pinToggle: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 0, background: '#EAF5FF', color: '#167AD1', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', font: "600 11px 'Golos Text'" },
  back: { width: '100%', marginTop: 6, padding: 9, background: 'transparent', color: '#6B655B', border: 'none', font: "500 13.5px 'Golos Text'", cursor: 'pointer' },
  linkBtn: { width: '100%', marginTop: 4, padding: 8, background: 'transparent', color: '#6B655B', border: 'none', font: "500 13px 'Golos Text'", cursor: 'pointer', textDecoration: 'underline' },
  google: { width: '100%', padding: 14, background: '#fff', color: '#13283C', border: '1px solid rgba(39,132,211,.2)', borderRadius: 13, font: "700 14px 'Manrope',sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 },
};
