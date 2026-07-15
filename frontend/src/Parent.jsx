import React, { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import {
  auth, createChild, getChildren, getMocks, getAttempts, logout, getFamily,
  genPassword, suggestUsername, cleanUsername, errText,
} from './firebase.js';
import { api, topicStats, readiness, mockSeries } from './api.js';

const Logo = () => { const { t } = useLang(); return <div className="logo"><b>Synaq</b><span>{t('ui.25')}</span></div>; };


// ── Футер поддержки: почта + Telegram ──
function SupportFooter() {
  const EMAIL = 'support@synaq.app';
  const TELEGRAM = 'makosmalikos';
  return (
    <footer style={{
      marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16,
      font: "500 13.5px 'Golos Text',sans-serif", color: '#9A9384',
    }}>
      <span style={{ fontWeight: 600, color: '#6B655B' }}>Қолдау / Поддержка:</span>
      <a href={`mailto:${EMAIL}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>✉ {EMAIL}</a>
      <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>✈ @{TELEGRAM}</a>
    </footer>
  );
}

export default function Parent({ onExit }) {
  const { t } = useLang();
  const exit = async () => {
    if (!window.confirm('Шығуды растайсыз ба?')) return;
    await (onExit || logout)();
  };
  const [pro, setPro] = useState(null);      // null — әлі жүктелуде
  const [me, setMe] = useState('');          // ата-ананың аты
  const [paying, setPaying] = useState(false);
  const [children, setChildren] = useState([]);
  const [adding, setAdding] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  // Жазылым күйін оқимыз: төлем өткенде вебхук families/{uid}.pro-ны true қылады
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    setMe(u.displayName || '');
    getFamily(u.uid).then((f) => {
      const has = !!f?.pro;
      setPro(has);
      if (!u.displayName) setMe(f?.parentName || (u.email || '').split('@')[0]);
      // лендингте «Про таңдау» басып, содан кейін кірген болса — төлемді бірден ашамыз
      let wanted = false;
      try {
        wanted = localStorage.getItem('synaq_want_pro') === '1';
        if (wanted) localStorage.removeItem('synaq_want_pro');
      } catch {}
      if (wanted && !has) buyPro();
    }).catch(() => setPro(false));
  }, []);

  // «Про таңдау» → Dodo төлем бетіне жібереміз
  async function buyPro() {
    const u = auth.currentUser;
    if (!u || paying) return;
    setPaying(true);
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: u.uid, email: u.email }),
      });
      const raw = await r.text();
      let data = null;
      try { data = JSON.parse(raw); } catch {}
      if (r.ok && data?.url) { window.location.href = data.url; return; }
      const why = !r.ok ? `Сервер ${r.status}${data?.error ? ': ' + data.error : ''}` : 'сілтеме келмеді';
      console.error('checkout failed', r.status, raw.slice(0, 200));
      alert(`Төлем бетін ашу мүмкін болмады (${why}).`);
    } catch (e) {
      console.error(e);
      alert('Байланыс қатесі: ' + (e?.message || 'белгісіз'));
    }
    setPaying(false);
  }

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
  const [stats, setStats] = useState([]);

  // Кірген соң бала жоқ болса — «Бала қосу» формасын бірден ашамыз
  useEffect(() => {
    if (firstLoad && !children.length && !created) { setAdding(true); setFirstLoad(false); }
  }, [children, firstLoad, created]);

  // Баланы ашқанда: мок-тестер + тақырып бойынша статистика
  const openResults = async (c) => {
    setOpenChild(c);
    const [ms, att, topics] = await Promise.all([
      getMocks(c.uid).catch(() => []),
      getAttempts(c.uid).catch(() => []),
      api.topics(),
    ]);
    setMocks(ms);
    setStats(topicStats(att, topics));
  };

  return (
    <div className="app">
      <header>
        <Logo />
        <button className="logout" onClick={exit}>{t('ui.26')}</button>
      </header>

      {created && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--green)', background: '#EEF5EC' }}>
          <p className="kicker" style={{ color: 'var(--green)', margin: '0 0 10px' }}>{created.name} аккаунты жасалды</p>
          <p style={{ margin: '0 0 14px', fontSize: 14 }}>Балаға осыны беріңіз — ол осымен кіреді:</p>

          <CopyRow label="Юзернейм" value={created.code} />
          <CopyRow label="Пароль" value={created.pass} />

          <button className="btn ghost" style={{ marginTop: 12 }}
            onClick={() => copy(`Synaq\nЮзернейм: ${created.code}\nПароль: ${created.pass}`)}>
            Екеуін де көшіру
          </button>
        </div>
      )}

      {!openChild ? (
        <main>
          {/* Сәлемдесу */}
          {me && (
            <>
              <h1 style={{ margin: '0 0 4px' }}>Сәлем, {me}!</h1>
              <p className="muted" style={{ margin: '0 0 20px' }}>
                {children.length
                  ? `${children.length} бала тіркелген. Прогресті көру үшін балаңызды таңдаңыз.`
                  : 'Балаңызды қосыңыз — сол арқылы ол дайындықты бастайды.'}
              </p>
            </>
          )}

          {/* Тарифтер: Тегін мен Про қатар тұрады, ата-ана таңдайды */}
          {pro !== null && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20,
            }}>
              {/* ── Тегін ── */}
              <div className="card" style={{
                borderColor: pro ? 'var(--line)' : 'var(--ink)',
                borderWidth: pro ? 1 : 2, opacity: pro ? 0.6 : 1,
              }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <p className="kicker" style={{ margin: 0 }}>{t('plan.free')}</p>
                  {!pro && <span className="tag" style={{ borderColor: 'var(--ink)' }}>{t('plan.current')}</span>}
                </div>
                <div style={{ font: "700 26px 'Lora',serif", marginBottom: 12 }}>{t('plan.freePrice')}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', font: "500 13.5px 'Golos Text'", lineHeight: 2 }}>
                  <li>✓ {t('plan.f1')}</li>
                  <li>✓ {t('plan.f2')}</li>
                  <li style={{ color: '#B0B0A6' }}>✗ {t('plan.f3')}</li>
                  <li style={{ color: '#B0B0A6' }}>✗ {t('plan.f4')}</li>
                </ul>
              </div>

              {/* ── Про ── */}
              <div className="card" style={{
                borderColor: pro ? 'var(--green)' : 'var(--accent)',
                borderWidth: 2, background: pro ? '#EEF5EC' : '#FBF3E3',
              }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <p className="kicker" style={{ margin: 0, color: pro ? 'var(--green)' : 'var(--accent)' }}>{t('plan.pro')}</p>
                  {pro && <span className="tag" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>{t('plan.active')}</span>}
                </div>
                <div style={{ font: "700 26px 'Lora',serif", marginBottom: 12 }}>
                  {t('plan.proPrice')}<span style={{ font: "500 13px 'Golos Text'", color: '#9A9384' }}>{t('plan.month')}</span>
                </div>
                <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', font: "500 13.5px 'Golos Text'", lineHeight: 2 }}>
                  <li>✓ {t('plan.p1')}</li>
                  <li>✓ {t('plan.p2')}</li>
                  <li>✓ {t('plan.p3')}</li>
                  <li>✓ {t('plan.p4')}</li>
                </ul>
                {pro ? (
                  <div style={{ font: "600 13px 'Golos Text'", color: 'var(--green)' }}>{t('plan.activeNote')}</div>
                ) : (
                  <button className="btn accent" disabled={paying} onClick={buyPro} style={{ width: '100%' }}>
                    {paying ? '…' : t('pro.buy')}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="row">
            <h1 style={{ margin: 0 }}>{t('ui.27')}</h1>
            <button className="btn" onClick={() => { setAdding(!adding); setErr(''); }}>{t('ui.28')}</button>
          </div>

          {adding && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lab}>{t('ui.29')}</label>
                <input placeholder={t('ui.37')} value={name} style={inp}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!username) setUsername(cleanUsername(e.target.value));
                  }} />
              </div>
              <div>
                <label style={lab}>{t('ui.30')}</label>
                <input placeholder={t('ui.38')} value={username} style={inp}
                  onChange={(e) => setUsername(cleanUsername(e.target.value))} />
                <p style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#9A9384', margin: '6px 0 0' }}>
                  тек латын әрпі мен цифр
                </p>
              </div>
              <div>
                <label style={lab}>{t('ui.31')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder={t('ui.39')} value={pass} onChange={(e) => setPass(e.target.value)} style={{ ...inp, flex: 1 }} />
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
          {!children.length && !adding && <p className="muted" style={{ marginTop: 14 }}>{t('ui.32')}</p>}
        </main>
      ) : (
        <ChildReport child={openChild} mocks={mocks} stats={stats} onBack={() => setOpenChild(null)} t={t} />
      )}
      <SupportFooter />
    </div>
  );
}

// Мәтінді буферге көшіру
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

function CopyRow({ label, value }) {
  const [ok, setOk] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, background: '#fff',
      border: '1px solid var(--line)', padding: '11px 14px', marginBottom: 8,
    }}>
      <span style={{ font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#9A9384', width: 78 }}>
        {label}
      </span>
      <b style={{ flex: 1, font: "600 16px 'IBM Plex Mono',monospace", letterSpacing: '.02em' }}>{value}</b>
      <button className="link" style={{ padding: '4px 8px', color: ok ? 'var(--green)' : 'var(--muted)' }}
        onClick={async () => { if (await copy(value)) { setOk(true); setTimeout(() => setOk(false), 1500); } }}>
        {ok ? '✓ көшірілді' : 'көшіру'}
      </button>
    </div>
  );
}

// ── Ата-анаға арналған есеп: дайындық, апталық баллдар, тақырыптық жылу картасы ──
const LVL_COL = { strong: '#4C7A4E', mid: '#B8892B', weak: '#B0342B' };
const LVL_BG = { strong: '#EEF5EC', mid: '#FBF3E3', weak: '#FBEDEC' };
const LVL_TXT = { strong: 'МЫҚТЫ', mid: 'ОРТАША', weak: 'ӘЛСІЗ' };

function ChildReport({ child, mocks, stats, onBack, t }) {
  // Толық дашборд әрқашан көрінеді. Есеп шығарылмаған тақырыптар да тұрады — тек 0%.
  const all = stats.length ? stats : [];
  const used = all.filter((s) => s.tried);
  const started = used.length > 0;
  const ready = readiness(stats);
  const series = mockSeries(mocks);
  const maxScore = Math.max(1, ...series.map((s) => s.max || 60));
  const counts = { strong: 0, mid: 0, weak: 0 };
  used.forEach((s) => counts[s.level]++);
  const weak = [...used].sort((a, b) => a.pct - b.pct).slice(0, 2);

  return (
    <main>
      <button className="link" onClick={onBack}>{t('ui.33')}</button>
      <p className="kicker">Есеп · соңғы апталар</p>
      <h1 style={{ marginBottom: 6 }}>{child.name}</h1>
      <div style={{ borderTop: '2px solid var(--ink)', margin: '10px 0 20px' }} />

      {!started && (
        <div className="card" style={{ marginBottom: 16, background: '#FBF3E3', borderColor: 'var(--mid,#B8892B)' }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>
            {child.name} әлі есеп шығара бастаған жоқ. Ол кіріп жаттыға бастаған соң,
            мұндағы сандар нақты деректермен толады.
          </p>
        </div>
      )}

      <div className="grid2" style={{ marginBottom: 16 }}>
        {/* Жалпы дайындық */}
        <div className="card">
          <p className="kicker" style={{ margin: '0 0 14px' }}>Жалпы дайындық</p>
          <div className="bar" style={{ marginBottom: 16 }}><i style={{ width: ready + '%' }} /></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
            <div style={{ font: "700 44px 'Lora',serif", lineHeight: 1 }}>
              {ready}<span style={{ fontSize: 22, color: 'var(--accent)' }}>%</span>
            </div>
            <div style={{ flex: 1, fontSize: 13.5 }}>
              {['strong', 'mid', 'weak'].map((k) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: LVL_COL[k] }}>
                  <span>■ {LVL_TXT[k].toLowerCase()}</span><b>{counts[k]}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Сынақ баллдары */}
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <span className="kicker" style={{ margin: 0 }}>Сынақ балы / апта</span>
            <span className="tag">{maxScore}-тан</span>
          </div>
          {series.length ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>
              {series.map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ font: "700 12px 'IBM Plex Mono',monospace", color: i === series.length - 1 ? 'var(--accent)' : '#6B655B' }}>{s.score}</div>
                  <div style={{
                    height: `${(s.score / maxScore) * 74}px`, minHeight: 3, marginTop: 4,
                    background: i === series.length - 1 ? 'var(--accent)' : '#D8D3C8',
                  }} />
                  <div style={{ font: "500 10px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          ) : <p className="muted" style={{ margin: 0 }}>Сынақ әлі тапсырылмаған.</p>}
        </div>
      </div>

      {/* Ұсыныс */}
      {!!weak.length && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent)', marginBottom: 16 }}>
          <p className="kicker" style={{ color: 'var(--accent)', margin: '0 0 8px' }}>Ұсыныс</p>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>
            {weak.map((w) => `${w.name} (${w.pct}%)`).join(' мен ')} тақырыптарына көбірек көңіл бөліңіз — қазір ең әлсіз тұсы.
          </p>
        </div>
      )}

      {/* Тақырыптық жылу картасы — барлық тақырып (шығарылмағаны 0%) */}
      <p className="kicker">Тақырыптық жылу картасы</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 22 }}>
        {all.map((s) => (
          <div key={s.id} style={{
            border: `1px solid ${s.tried ? LVL_COL[s.level] : 'var(--line)'}`,
            background: s.tried ? LVL_BG[s.level] : '#fff', padding: '12px 13px',
            opacity: s.tried ? 1 : 0.6,
          }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.35, marginBottom: 8, minHeight: 34 }}>{s.name}</div>
            <b style={{ font: "700 17px 'Golos Text'", color: s.tried ? LVL_COL[s.level] : '#9A9384' }}>{s.pct}%</b>
          </div>
        ))}
      </div>

      {/* Тақырыптар тізімі — деңгеймен (барлығы) */}
      <p className="kicker">Прогресс картасы</p>
      <div className="list">
        {all.map((s) => (
          <div key={s.id} className="row-item" style={{ cursor: 'default', opacity: s.tried ? 1 : 0.6 }}>
            <div style={{ flex: 1 }}>
              <b>{s.name}</b>
              <div style={{ font: "500 11.5px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 3 }}>
                {s.tried} сұрақ{s.days ? ` · ${s.days} күн` : ''}
              </div>
            </div>
            <div style={{ width: 130 }}>
              <div className="bar"><i style={{ width: s.pct + '%', background: s.tried ? LVL_COL[s.level] : '#D8D3C8' }} /></div>
            </div>
            <span style={{ font: "600 13px 'IBM Plex Mono',monospace", width: 40, textAlign: 'right', color: s.tried ? LVL_COL[s.level] : '#9A9384' }}>{s.pct}</span>
            <span style={{
              font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: '.08em',
              color: s.tried ? LVL_COL[s.level] : '#C4BEB2',
              border: `1px solid ${s.tried ? LVL_COL[s.level] : 'var(--line)'}`, padding: '3px 8px', width: 76, textAlign: 'center',
            }}>{s.tried ? LVL_TXT[s.level] : '—'}</span>
          </div>
        ))}
      </div>

      {/* Сынақ тарихы */}
      {!!mocks.length && (
        <>
          <p className="kicker" style={{ marginTop: 24 }}>{t('ui.34')}</p>
          <div className="list">
            {mocks.map((m, i) => (
              <div className="row-item" key={i} style={{ cursor: 'default' }}>
                <b style={{ flex: 1 }}>{m.school || 'Мок-тест'}</b>
                <span className="rt">{m.score}/{m.gradable} балл</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

const lab = { display: 'block', font: "500 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#9A9384', marginBottom: 6 };
const inp = { width: '100%', padding: '12px 14px', border: '1px solid var(--line)', background: '#fff', font: "500 15px 'Golos Text'", color: 'var(--ink)', outline: 'none' };
