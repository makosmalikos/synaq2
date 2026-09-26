import React, { useState } from 'react';
import Brand from './Brand.jsx';
import { LangToggle, useLang } from './i18n.jsx';
import { planPrice } from './plans.js';

export default function Subscription({ currentPlan = 'free', onBack }) {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState(currentPlan === 'pro' ? 'pro' : 'standard');
  const ru = lang === 'ru';
  const plans = [
    { id: 'free', name: t('plan.free'), price: planPrice('free', lang), features: [t('plan.f1'), t('plan.f2'), '5 AI'], tone: 'free' },
    { id: 'standard', name: t('plan.standard'), price: planPrice('standard', lang), features: [t('plan.s1'), t('plan.s2'), t('plan.s3'), t('plan.s4')], tone: 'standard' },
    { id: 'pro', name: 'SYNAQ Pro', price: planPrice('pro', lang), features: [t('plan.p1'), t('plan.p2'), t('plan.p3'), t('plan.p4')], tone: 'pro' },
  ];
  const chosen = plans.find((item) => item.id === selected);
  const active = currentPlan === selected;

  return (
    <main className="subscription-page">
      <div className="subscription-orb subscription-orb-one" /><div className="subscription-orb subscription-orb-two" />
      <div className="subscription-wrap">
        <div className="subscription-topbar">
          <div className="subscription-brand"><Brand compact /><i /><span className="subscription-label">{t('subscription.label')}</span></div>
          <div className="subscription-trust"><span><b>✓</b>{t('subscription.family')}</span><span><b>●</b>{t('subscription.activation')}</span></div>
          <div className="subscription-top-actions"><LangToggle /><button type="button" className="subscription-back" onClick={onBack}>← {t('subscription.back')}</button></div>
        </div>

        <section className="subscription-hero">
          <span className="subscription-kicker">⚡ {t('subscription.kicker')}</span>
          <h1>{ru ? 'Выберите подходящий' : 'Өзіңізге ыңғайлы'} <em>{ru ? 'тариф' : 'тарифті таңдаңыз'}</em></h1>
          <p>{ru ? 'Начните бесплатно, выберите Стандартный для регулярной подготовки или Pro для полного доступа.' : 'Тегін бастаңыз, тұрақты дайындыққа Стандартты, толық қолжетімділікке Pro таңдаңыз.'}</p>
        </section>

        <section className="subscription-choice subscription-plans" aria-label={t('subscription.tariff')}>
          {plans.map((item) => {
            const isCurrent = currentPlan === item.id, isSelected = selected === item.id;
            return <button type="button" key={item.id} className={`subscription-plan-card is-${item.tone}${isSelected ? ' selected' : ''}${isCurrent ? ' active' : ''}`}
              onClick={() => item.id !== 'free' && setSelected(item.id)} aria-pressed={isSelected}>
              <span className="subscription-plan-status">{isCurrent ? t('plan.current') : isSelected ? '✓' : ''}</span>
              <strong>{item.name}</strong><b>{item.price}<small>{item.id === 'free' ? '' : t('plan.month')}</small></b>
              <ul>{item.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
              {item.id === 'standard' && <em>{ru ? 'Оптимальный выбор' : 'Оңтайлы таңдау'}</em>}
            </button>;
          })}
        </section>

        <section className="subscription-payment">
          <span className="subscription-section-label">{t('subscription.payment')}</span>
          <div className="subscription-payment-card"><div className="subscription-payment-mark">S</div><div>
            <strong>{active ? t('subscription.activeTitle') : t('subscription.paymentTitle')}</strong>
            <p>{active ? t('plan.activeNote') : t('subscription.paymentSub')}</p>
          </div>{!active && <span className="subscription-secure">✓ {t('subscription.secure')}</span>}</div>
        </section>

        <div className="subscription-checkout"><div><span>{active ? t('subscription.status') : t('subscription.order')}</span><strong>{chosen.name}</strong></div>
          <b>{chosen.price}</b>{active ? <button type="button" className="subscription-done" onClick={onBack}>{t('subscription.continue')}</button>
            : <a href="https://wa.me/message/HAJDNIM2MPOCM1" target="_blank" rel="noreferrer"><span aria-hidden="true">◉</span>{t('subscription.cta')}</a>}</div>
      </div>
    </main>
  );
}
