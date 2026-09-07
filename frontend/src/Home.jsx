import React from 'react';
import { useLang } from './i18n.jsx';
import { xpLevel } from './xp.js';

const DashboardIcon = ({ type }) => {
  if (type === 'duel') return <span aria-hidden="true">⚔</span>;
  if (type === 'mock') return <span aria-hidden="true">✓</span>;
  return <span aria-hidden="true">↗</span>;
};

export default function Home({ go, name, xp = 0 }) {
  const { t } = useLang();
  const lvl = xpLevel(xp);
  const levelXp = xp % 500;
  const levelProgress = Math.min(100, Math.round((levelXp / 500) * 100));
  const xpLeft = levelXp === 0 && xp > 0 ? 500 : 500 - levelXp;

  return (
    <main className="home-dashboard">
      <div className="home-heading">
        <div>
          <p className="home-kicker">{t('ui.46')}</p>
          <h1>{t('home.hi')}, {name}!</h1>
          <p>{t('home.today')}</p>
        </div>
      </div>

      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-hero-label">{t('home.plan')}</span>
          <h2>{t('ui.47')}</h2>
          <p>{t('ui.48')}</p>
          <button className="home-primary" onClick={() => go('training')}>
            <span className="home-play">▶</span>{t('ui.5')}
          </button>
        </div>
        <div className="home-hero-visual" aria-hidden="true">
          <div className="home-hero-ring" />
          <div className="home-float home-float-a">+5 XP</div>
          <div className="home-float home-float-b">{levelProgress}%</div>
          <img src="/hero/students/cutout-2.png" alt="" />
        </div>
      </section>

      <section className="home-stats" aria-label={t('home.stats')}>
        <div className="home-stat home-stat-xp">
          <div className="home-stat-icon">★</div>
          <div><span>{t('xp.title')}</span><strong>{xp} XP</strong></div>
        </div>
        <div className="home-stat home-stat-level">
          <div className="home-stat-icon">◆</div>
          <div><span>{t('xp.level')}</span><strong>{lvl}</strong></div>
        </div>
        <div className="home-stat home-stat-progress">
          <div className="home-stat-top"><span>{t('home.toNext')}</span><strong>{xpLeft} XP</strong></div>
          <div className="home-stat-bar"><i style={{ width: `${levelProgress}%` }} /></div>
          <small>{levelProgress}% · {t('home.xpProgress')}</small>
        </div>
      </section>

      <div className="home-section-head">
        <div>
          <span>{t('home.quick')}</span>
          <h2>{t('home.choose')}</h2>
        </div>
      </div>

      <section className="home-actions">
        <button className="home-action home-action-duel" onClick={() => go('duel')}>
          <span className="home-action-icon"><DashboardIcon type="duel" /></span>
          <span className="home-action-copy"><small>{t('ui.56')}</small><strong>{t('duel.title')}</strong><em>{t('home.duelText')}</em></span>
          <span className="home-action-arrow">→</span>
        </button>
        <button className="home-action home-action-mock" onClick={() => go('mock')}>
          <span className="home-action-icon"><DashboardIcon type="mock" /></span>
          <span className="home-action-copy"><small>{t('ui.49')}</small><strong>{t('ui.50')}</strong><em>{t('home.mockText')}</em></span>
          <span className="home-action-arrow">→</span>
        </button>
        <button className="home-action home-action-progress" onClick={() => go('progress')}>
          <span className="home-action-icon"><DashboardIcon type="progress" /></span>
          <span className="home-action-copy"><small>{t('nav.progress')}</small><strong>{t('home.progressTitle')}</strong><em>{t('home.progressText')}</em></span>
          <span className="home-action-arrow">→</span>
        </button>
      </section>
    </main>
  );
}
