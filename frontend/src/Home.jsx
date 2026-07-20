import React from 'react';
import { useLang } from './i18n.jsx';
import { xpLevel } from './xp.js';

export default function Home({ go, name, xp = 0 }) {
  const { t } = useLang();
  const lvl = xpLevel(xp);
  return (
    <main>
      <p className="kicker">{t('ui.46')}</p>
      <h1 style={{ fontSize: 30 }}>{t('home.hi')}, {name}!</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 14 }}>
        {t('home.today')}
      </p>

      <div className="xp-bar card" style={{ marginBottom: 14, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="kicker" style={{ margin: 0 }}>{t('xp.title')}</p>
          <div style={{ font: "700 28px 'Lora',serif", color: 'var(--accent)' }}>{xp} XP</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="pill">{t('xp.level')} {lvl}</span>
          <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>{t('xp.hint')}</p>
        </div>
      </div>

      <div className="hero-card">
        <h2>{t('ui.47')}</h2>
        <p>{t('ui.48')}</p>
        <button className="btn accent" onClick={() => go('training')}>{t('ui.5')}</button>
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card click" onClick={() => go('duel')}>
          <p className="kicker" style={{ margin: 0 }}>{t('ui.56')}</p>
          <div style={{ font: "600 16px 'Golos Text'", margin: '10px 0 6px' }}>{t('duel.title')}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 'auto' }}>+50 XP · 15 {t('duel.round').toLowerCase()}</div>
        </div>
        <div className="card click" onClick={() => go('mock')}>
          <p className="kicker" style={{ margin: 0 }}>{t('ui.49')}</p>
          <div style={{ font: "600 16px 'Golos Text'", margin: '10px 0 6px' }}>{t('ui.50')}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 'auto' }}>{t('ui.51')}</div>
        </div>
      </div>
    </main>
  );
}
