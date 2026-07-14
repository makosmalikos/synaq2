import React from 'react';
import { useLang } from './i18n.jsx';

export default function Home({ go, name }) {
  const { t } = useLang();
  return (
    <main>
      <p className="kicker">{t('ui.46')}</p>
      <h1 style={{ fontSize: 30 }}>Сәлем, {name}!</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>
        Бүгін де бір қадам алға. Тақырып таңдап баста немесе мок-сынақ өт.
      </p>

      <div className="hero-card">
        <h2>{t('ui.47')}</h2>
        <p>{t('ui.48')}</p>
        <button className="btn accent" onClick={() => go('training')}>{t('ui.5')}</button>
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card click" onClick={() => go('mock')}>
          <p className="kicker" style={{ margin: 0 }}>{t('ui.49')}</p>
          <div style={{ font: "600 16px 'Golos Text'", margin: '10px 0 6px' }}>{t('ui.50')}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 'auto' }}>{t('ui.51')}</div>
        </div>
        <div className="card click" onClick={() => go('progress')}>
          <p className="kicker" style={{ margin: 0 }}>{t('ui.42')}</p>
          <div style={{ font: "600 16px 'Golos Text'", margin: '10px 0 6px' }}>{t('ui.43')}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 'auto' }}>{t('ui.52')}</div>
        </div>
      </div>
    </main>
  );
}
