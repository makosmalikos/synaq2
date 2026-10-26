import React from 'react';
import { useLang } from './i18n.jsx';
import { planPrice } from './plans.js';
import './ParentPlans.css';

const PlanIcon = ({ check = false }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={check ? 'm5 12 4 4L19 6' : 'M4 12h16m-6-6 6 6-6 6'} /></svg>;

export default function ParentPlans({ plan, paying, upgrading, paymentPending, checkoutHold, upgradeSent, onBuy, onUpgrade }) {
  const { t, lang } = useLang();
  const text = (ru, kk) => lang === 'ru' ? ru : kk;
  const blocked = upgrading || paying || paymentPending || checkoutHold;
  const pendingLabel = upgrading ? text('Отправляем заявку…', 'Өтінім жіберілуде…') : checkoutHold ? text('Нужна проверка оплаты', 'Төлемді тексеру қажет') : paymentPending ? text('Проверяем оплату…', 'Төлем тексерілуде…') : paying ? text('Открываем оплату…', 'Төлем ашылуда…') : null;
  const cards = [
    { id: 'free', title: text('Бесплатный', 'Тегін'), intro: text('Познакомиться с платформой', 'Платформамен танысу'), features: ['plan.f1', 'plan.f2'] },
    { id: 'pro', title: 'Standard', intro: text('Самостоятельная подготовка', 'Өз бетінше дайындық'), features: ['plan.s1', 'plan.s2', 'plan.s3', 'plan.s4'] },
    { id: 'mentor', title: text('Pro с наставником', 'Тәлімгермен Pro'), intro: text('Подготовка с личной поддержкой', 'Жеке қолдаумен дайындық'), features: ['plan.p1', 'plan.p2', 'plan.p3', 'plan.p4'] },
  ];
  return <section className="parent-plans" aria-labelledby="parent-plans-title">
    <div className="parent-plans-heading"><h2 id="parent-plans-title">{text('Тариф вашей семьи', 'Отбасыңыздың тарифі')}</h2><p>{text('Выберите подходящий формат подготовки.', 'Өзіңізге ыңғайлы дайындық форматын таңдаңыз.')}</p></div>
    <div className="parent-plans-grid">{cards.map(card => {
      const active = plan === card.id;
      return <article key={card.id} className={`family-plan family-plan-${card.id}${active ? ' is-current' : ''}`}>
        <div className="family-plan-label"><span className="family-plan-symbol" aria-hidden="true">{card.id === 'free' ? '01' : card.id === 'pro' ? '02' : '03'}</span>{active && <span className="family-plan-badge"><PlanIcon check />{text('Ваш тариф', 'Сіздің тарифіңіз')}</span>}</div>
        <h3>{card.title}</h3><p className="family-plan-intro">{card.intro}</p>
        <div className="family-plan-price">{card.id === 'mentor' && <small>{t('plan.from')}</small>}<strong>{card.id === 'free' ? t('plan.freePrice') : planPrice(card.id, lang)}</strong>{card.id !== 'free' && <span>{t('plan.month')}</span>}</div>
        <ul>{card.features.map(key => <li key={key}><PlanIcon check /><span>{t(key)}</span></li>)}</ul>
        {card.id === 'free' && <p className="family-plan-footnote">{text('Для знакомства. Полные пробники и все темы доступны в Standard.', 'Танысуға арналған. Толық сынақтар мен барлық тақырыптар Standard тарифінде.')}</p>}
        <div className="family-plan-actions">
          {active ? <p className="family-plan-active"><PlanIcon check />{text('Тариф подключён', 'Тариф қосылған')}</p> : card.id === 'pro' && plan === 'mentor' ? <p className="family-plan-included">{text('Всё включено в ваш Pro', 'Барлығы Pro тарифіңізде бар')}</p> : card.id === 'pro' && plan === 'free' ? <button type="button" disabled={blocked} onClick={() => onBuy('pro')}>{pendingLabel || t('plan.chooseStandard')}<PlanIcon /></button> : card.id === 'mentor' ? (
            plan === 'pro' && upgradeSent ? <p className="family-plan-active" role="status">{text('Заявка отправлена — мы свяжемся с вами', 'Өтінім жіберілді — сізбен байланысамыз')}</p> : <>{[2, 3].map(n => <button key={n} type="button" disabled={blocked} onClick={() => plan === 'pro' ? onUpgrade(n) : onBuy('mentor', n)}>{pendingLabel || `${plan === 'pro' ? text('Перейти: ', 'Көшу: ') : ''}${t('plan.lessons' + n)}${plan === 'pro' ? '' : ` · ${planPrice('mentor', lang, n)}`}`}<PlanIcon /></button>)}{plan === 'pro' && <p className="family-plan-footnote">{text('Переход оформим с вами вручную, без двойной оплаты.', 'Көшуді сізбен бірге қолмен, қос төлемсіз рәсімдейміз.')}</p>}</>
          ) : null}
        </div>
      </article>;
    })}</div>
  </section>;
}
