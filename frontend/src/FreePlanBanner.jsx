import React from 'react';
import './FreePlanBanner.css';

export default function FreePlanBanner({ lang, onUpgrade }) {
  const ru = lang === 'ru';
  return <section className="free-plan-banner" aria-label={ru ? 'Ваш тариф' : 'Сіздің тарифіңіз'}>
    <div className="free-plan-banner-inner">
      <p>{ru ? 'Вы используете ' : 'Сіз '}<strong>{ru ? 'бесплатную версию' : 'тегін нұсқаны'}</strong>{ru ? '' : ' пайдаланып жатырсыз'}</p>
      <button type="button" onClick={onUpgrade}>
        {ru ? 'Выбрать Standard или Pro' : 'Standard немесе Pro таңдау'}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  </section>;
}
