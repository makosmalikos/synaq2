import catalog from '../../shared/plans.json';

export const PLAN_CATALOG = Object.freeze(catalog);

export function planPrice(plan, lang = 'ru', lessons = null) {
  const value = lessons ? PLAN_CATALOG[plan]?.lessonPricesKzt?.[lessons] : PLAN_CATALOG[plan]?.priceKzt;
  if (!Number.isSafeInteger(value) || value < 0) return '';
  return `${new Intl.NumberFormat(lang === 'kk' ? 'kk-KZ' : 'ru-RU').format(value)} ₸`;
}
