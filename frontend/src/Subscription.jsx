import { KASPI_PAYMENT_URL } from './checkoutMessages.js';
import { KaspiPaymentInfo } from './KaspiPayment.jsx';
import React, { useState } from 'react';
import Brand from './Brand.jsx';
import { LangToggle, useLang } from './i18n.jsx';
import { planPrice } from './plans.js';

export default function Subscription({ currentPlan = 'free', onBack }) {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState(currentPlan === 'mentor' ? 'pro' : 'standard');
  const ru = lang === 'ru';
  const [lessons, setLessons] = useState(2);
  const plans = [
    { id: 'free', name: t('plan.free'), price: planPrice('free', lang), features: [t('plan.f1'), t('plan.f2'), '5 AI'], tone: 'free' },
    { id: 'standard', name: t('plan.standard'), price: planPrice('pro', lang), features: [t('plan.s1'), t('plan.s2'), t('plan.s3'), t('plan.s4')], tone: 'standard' },
    { id: 'pro', name: t('plan.pro'), price: planPrice('mentor', lang, lessons), features: [t('plan.p1'), t('plan.p2'), t('plan.p3'), t('plan.p4')], tone: 'pro' },
  ];
  const chosen = plans.find((item) => item.id === selected);
  const shownPlan = currentPlan === 'pro' ? 'standard' : currentPlan === 'mentor' ? 'pro' : currentPlan === 'standard' ? 'legacy' : currentPlan;
  const active = shownPlan === selected;
  const changingPlan = currentPlan !== 'free' && !active;

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
          <p>{ru ? 'Начните бесплатно, выберите Standard для самостоятельной подготовки или Pro с живыми уроками наставника.' : 'Тегін бастаңыз, өз бетінше дайындалуға Standard, тірі сабақтарға тәлімгермен Pro таңдаңыз.'}</p>
        </section>

        {currentPlan === 'standard' && <p className="subscription-legacy-note">{ru ? 'У вас архивный Standard — 2 990 ₸/мес. Его лимиты сохраняются. Новый Standard за 5 999 ₸/мес. включает все темы и задачи без дневного лимита.' : 'Сізде архивтік Standard — айына 2 990 ₸. Оның лимиттері сақталады. Айына 5 999 ₸ жаңа Standard-та барлық тақырыптар мен есептер күндік шектеусіз ашылады.'}</p>}
        <section className="subscription-choice subscription-plans" aria-label={t('subscription.tariff')}>
          {plans.map((item) => {
            const isCurrent = shownPlan === item.id, isSelected = selected === item.id;
            return <button type="button" key={item.id} className={`subscription-plan-card is-${item.tone}${isSelected ? ' selected' : ''}${isCurrent ? ' active' : ''}`}
              onClick={() => item.id !== 'free' && setSelected(item.id)} aria-pressed={isSelected}>
              <span className="subscription-plan-status">{isCurrent ? t('plan.current') : isSelected ? '✓' : ''}</span>
              <strong>{item.name}</strong><b>{item.price}<small>{item.id === 'free' ? '' : t('plan.month')}</small></b>
              <ul>{item.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
              {item.id === 'standard' && <em>{ru ? 'Оптимальный выбор' : 'Оңтайлы таңдау'}</em>}
            </button>;
          })}
        </section>

        {selected === 'pro' && !active && <label className="subscription-lesson-choice">{ru ? 'Уроки с наставником' : 'Тәлімгермен сабақтар'}
          <select value={lessons} onChange={(event) => setLessons(Number(event.target.value))}>
            {[2, 3].map((count) => <option key={count} value={count}>{t('plan.lessons' + count)} · {planPrice('mentor', lang, count)}</option>)}
          </select>
        </label>}
        <section className="subscription-payment">
          <span className="subscription-section-label">{t('subscription.payment')}</span>
          <div className="subscription-payment-card"><div className="subscription-payment-mark">K</div><div>
            <strong>{active ? t('subscription.activeTitle') : changingPlan ? (ru ? 'Смена тарифа' : 'Тарифті ауыстыру') : t('subscription.paymentTitle')}</strong>
            {active ? <p>{t('plan.activeNote')}</p> : changingPlan ? <p>{ru ? 'Напишите нам, чтобы согласовать смену действующего тарифа и сумму доплаты.' : 'Қолданыстағы тарифті ауыстыру мен қосымша төлем сомасын келісу үшін бізге жазыңыз.'}</p> : <KaspiPaymentInfo />}
          </div>{!active && <span className="subscription-secure">✓ {t('subscription.secure')}</span>}</div>
        </section>

        <div className="subscription-checkout"><div><span>{active ? t('subscription.status') : t('subscription.order')}</span><strong>{chosen.name}</strong></div>
          <b>{chosen.price}</b>{active ? <button type="button" className="subscription-done" onClick={onBack}>{t('subscription.continue')}</button>
            : <a href={changingPlan ? "https://wa.me/message/HAJDNIM2MPOCM1" : KASPI_PAYMENT_URL} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">◉</span>{changingPlan ? (ru ? 'Обсудить смену тарифа' : 'Тарифті ауыстыруды талқылау') : t('subscription.cta')}</a>}</div>
      </div>
    </main>
  );
}
