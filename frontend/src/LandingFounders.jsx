import React from 'react';
import { useLang } from './i18n.jsx';
import './LandingFounders.css';

const founders = [
  { id: 'malika', name: 'Малика Ерболат', school: 'rfmsh', facts: ['school', 'incubator', 'award'] },
  { id: 'nurislam', name: 'Нұрислам Алдабергенұлы', school: 'bil', facts: ['school', 'olympiads', 'coach'] },
];

export default function LandingFounders() {
  const { t } = useLang();
  return (
    <section id="founders" className="lp-founders" aria-labelledby="founders-title">
      <div className="lp-founders-heading">
        <h2 id="founders-title">{t('founders.title')}</h2>
        <p>{t('founders.intro')}</p>
      </div>
      <div className="lp-founders-grid">
        {founders.map(({ id, name, school, facts }) => (
          <article className={`lp-founder lp-founder-${id}`} key={id}>
            <div className="lp-founder-photo">
              <img src={`/landing/mobile/founder-${id}-800.webp`} srcSet={`/landing/mobile/founder-${id}-480.webp 480w, /landing/mobile/founder-${id}-800.webp 800w`} sizes="(max-width: 700px) calc(100vw - 70px), 480px" alt={name} width={1000} height={id === 'malika' ? 1778 : 1225} loading="lazy" decoding="async" />
            </div>
            <div className="lp-founder-nameplate">
              <h3>{name}</h3>
              <span>{t(`founders.${id}.role`)}</span>
            </div>
            <div className="lp-founder-body">
              <div className="lp-founder-school">
                <img src={`/landing/mobile/school-${school}.webp`} alt="" width="30" height="30" loading="lazy" decoding="async" />
                <span>{t(`founders.${id}.badge`)}</span>
              </div>
              <ul>
                <li>{t(`founders.${id}.story`)}</li>
                {facts.filter(fact => fact !== 'school').map(fact => <li key={fact}>{t(`founders.${id}.${fact}`)}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
