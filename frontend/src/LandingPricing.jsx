import React from 'react';
import { useLang } from './i18n.jsx';
import { planPrice } from './plans.js';

export default function LandingPricing({ onStart, onBuyPlan }) {
  const { lang, t } = useLang();
  const ru = lang === 'ru';
  const [lessons, setLessons] = React.useState(2);
  const features = (items) => <ul>{items.map(([text, available = true]) => <li key={text} className={available ? '' : 'is-unavailable'}><i aria-hidden="true">{available ? '✓' : '−'}</i><span>{text}</span></li>)}</ul>;
  return <section id="pricing" className="sx-pricing" aria-labelledby="sx-pricing-title">
    <header><h2 id="sx-pricing-title">{ru ? 'Подготовка в вашем темпе.' : 'Өзіңізге ыңғайлы дайындық.'}<br /><span>{ru ? 'Выберите свой формат.' : 'Өз форматыңызды таңдаңыз.'}</span></h2><p>{ru ? 'Начните бесплатно. Подключите больше возможностей, когда будете готовы.' : 'Тегін бастаңыз. Дайын болғанда қосымша мүмкіндіктерді қосыңыз.'}</p></header>
    <div className="sx-pricing-grid">
      <article className="sx-plan"><div className="sx-plan-labels"><h3>{ru ? 'Бесплатно' : 'Тегін'}</h3></div><p className="sx-plan-price">{planPrice('free', lang)}</p><p className="sx-plan-description">{ru ? 'Познакомиться с платформой' : 'Платформамен танысу'}</p>{features([[t('plan.f1')], [t('plan.f2')], [ru ? 'Без личного наставника' : 'Жеке тәлімгерсіз', false]])}<button className="sx-plan-button" onClick={onStart}>{t('lp.12')}</button></article>
      <article className="sx-plan"><div className="sx-plan-labels"><h3>Standard</h3><span>{ru ? 'Самостоятельно' : 'Өз бетімен'}</span></div><p className="sx-plan-price">{planPrice('pro', lang)}<small>{t('lp.67')}</small></p><p className="sx-plan-description">{ru ? 'Регулярная практика и помощь ИИ' : 'Тұрақты жаттығу және ЖИ көмегі'}</p>{features([[t('plan.s1')], [t('plan.s2')], [t('plan.s3')], [ru ? 'Без личного наставника' : 'Жеке тәлімгерсіз', false]])}<button className="sx-plan-button" onClick={onBuyPlan('pro')}>{t('plan.chooseStandard')}</button></article>
      <article className="sx-plan sx-plan-mentor"><div className="sx-plan-labels"><h3>PRO</h3><span className="sx-plan-highlight">{ru ? 'С наставником' : 'Тәлімгермен'}</span></div><p className="sx-plan-price" aria-live="polite">{planPrice('mentor', lang, lessons)}<small>{t('lp.67')}</small></p><p className="sx-plan-description">{ru ? 'Платформа + индивидуальные уроки' : 'Платформа + жеке сабақтар'}</p>{features([[t('lp.69')], [t('lp.70')], [t('lp.72')], [t('lp.73')]])}<div className="sx-lesson-switch" role="group" aria-label={ru ? 'Уроков в неделю' : 'Аптасына сабақ саны'}>{[2, 3].map(n => <button type="button" key={n} aria-pressed={lessons === n} onClick={() => setLessons(n)}>{ru ? `${n} урока / нед.` : `Аптасына ${n} сабақ`}</button>)}</div><button className="sx-plan-button" onClick={onBuyPlan('mentor', lessons)}>{ru ? 'Выбрать PRO' : 'PRO таңдау'}</button></article>
    </div>
  </section>;
}
