import React from 'react';
import Brand from './Brand.jsx';
import { LangToggle, useLang } from './i18n.jsx';

export default function Subscription({ active = false, onBack }) {
  const { t } = useLang();

  return (
    <main className="subscription-page">
      <div className="subscription-orb subscription-orb-one" />
      <div className="subscription-orb subscription-orb-two" />

      <div className="subscription-wrap">
        <div className="subscription-topbar">
          <div className="subscription-brand">
            <Brand compact />
            <i />
            <span className="subscription-label">{t('subscription.label')}</span>
          </div>

          <div className="subscription-trust">
            <span><b>✓</b>{t('subscription.family')}</span>
            <span><b>●</b>{t('subscription.activation')}</span>
          </div>

          <div className="subscription-top-actions">
            <LangToggle />
            <button type="button" className="subscription-back" onClick={onBack}>← {t('subscription.back')}</button>
          </div>
        </div>

        <section className="subscription-hero">
          <span className="subscription-kicker">⚡ {t('subscription.kicker')}</span>
          <h1>{t('subscription.titleStart')} <em>SYNAQ Pro</em></h1>
          <p>{t('subscription.subtitle')}</p>
        </section>

        <section className="subscription-choice" aria-labelledby="subscription-plan-title">
          <span className="subscription-section-label">{t('subscription.tariff')}</span>
          <article className={`subscription-plan${active ? ' active' : ''}`}>
            <div className="subscription-plan-check">✓</div>
            <div className="subscription-plan-copy">
              <div className="subscription-plan-name">
                <h2 id="subscription-plan-title">SYNAQ Pro</h2>
                {active && <span>{t('plan.active')}</span>}
              </div>
              <p>{t('subscription.period')}</p>
              <strong>{t('plan.proPrice')}<small>{t('plan.month')}</small></strong>
            </div>
            <ul>
              <li>✓ {t('plan.p1')}</li>
              <li>✓ {t('plan.p2')}</li>
              <li>✓ {t('plan.p3')}</li>
              <li>✓ {t('plan.p4')}</li>
            </ul>
          </article>
        </section>

        <section className="subscription-payment">
          <span className="subscription-section-label">{t('subscription.payment')}</span>
          <div className="subscription-payment-card">
            <div className="subscription-payment-mark">S</div>
            <div>
              <strong>{active ? t('subscription.activeTitle') : t('subscription.paymentTitle')}</strong>
              <p>{active ? t('plan.activeNote') : t('subscription.paymentSub')}</p>
            </div>
            {!active && <span className="subscription-secure">✓ {t('subscription.secure')}</span>}
          </div>
        </section>

        <div className="subscription-checkout">
          <div>
            <span>{active ? t('subscription.status') : t('subscription.order')}</span>
            <strong>{active ? t('plan.activeNote') : 'SYNAQ Pro'}</strong>
          </div>
          {!active && <b>{t('plan.proPrice')}</b>}
          {active ? (
            <button type="button" className="subscription-done" onClick={onBack}>{t('subscription.continue')}</button>
          ) : (
            <a href="https://wa.me/message/HAJDNIM2MPOCM1" target="_blank" rel="noreferrer">
              <span aria-hidden="true">◉</span>{t('subscription.cta')}
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
