import React from 'react';
import { useLang } from './i18n.jsx';

export default function League() {
  const { t } = useLang();
  return (
    <main className="league-page">
      <header className="section-title">
        <span className="section-eyebrow">SYNAQ LEAGUE</span>
        <h1>{t('league.title')}</h1>
        <p>{t('league.sub')}</p>
      </header>
      <section className="league-stage">
        <div className="league-orbit league-orbit-one" />
        <div className="league-orbit league-orbit-two" />
        <span className="league-cup">♛</span>
        <h2>{t('league.week')}</h2>
        <p>{t('league.honest')}</p>
        <div className="league-rules">
          <span><b>+5 XP</b>{t('league.correct')}</span>
          <span><b>+50 XP</b>{t('league.duel')}</span>
          <span><b>TOP 3</b>{t('league.top')}</span>
        </div>
      </section>
    </main>
  );
}
