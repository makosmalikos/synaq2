import React from 'react';
import { useLang } from './i18n.jsx';

const EARN = [
  { icon: '✓', key: 'answer', xp: '+5 XP', tone: 'blue' },
  { icon: '⚡', key: 'hour', xp: '+100 XP', tone: 'orange' },
  { icon: '⚔', key: 'duel', xp: '+50 XP', tone: 'violet' },
  { icon: '◎', key: 'mock', xp: '+XP', tone: 'green' },
];

export default function Rewards({ xp = 0, onGoTraining }) {
  const { t } = useLang();
  return (
    <main className="rewards-page">
      <header className="section-title">
        <span className="section-eyebrow">SYNAQ XP</span>
        <h1>{t('rewards.title')}</h1>
        <p>{t('rewards.sub')}</p>
      </header>

      <section className="rewards-balance">
        <span>{t('rewards.balance')}</span>
        <strong><i>★</i>{xp}</strong>
        <small>{t('rewards.balanceHint')}</small>
      </section>

      <section className="rewards-panel">
        <h2>{t('rewards.earn')}</h2>
        <div className="rewards-earn-grid">
          {EARN.map((item) => (
            <article className={`reward-earn reward-${item.tone}`} key={item.key}>
              <span className="reward-icon">{item.icon}</span>
              <b>{t(`rewards.${item.key}`)}</b>
              <strong>{item.xp}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="rewards-store">
        <div>
          <span className="section-eyebrow">{t('rewards.storeKicker')}</span>
          <h2>{t('rewards.store')}</h2>
          <p>{t('rewards.storeHint')}</p>
        </div>
        <button onClick={onGoTraining}>{t('rewards.train')}</button>
      </section>
    </main>
  );
}
