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
              <img src={`/founders/${id}.webp`} alt={name} width={1000} height={id === 'malika' ? 1778 : 1225} loading="lazy" decoding="async" />
            </div>
            <div className="lp-founder-nameplate">
              <h3>{name}</h3>
              <span>{t(`founders.${id}.role`)}</span>
            </div>
            <div className="lp-founder-body">
              <div className="lp-founder-school">
                <img src={`/schools/${school}.png`} alt="" width="30" height="30" loading="lazy" />
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
