import payments from '../../shared/payments.json' with { type: 'json' };
const WHATSAPP_PAYMENT_URL = payments.whatsappUrl;

// Only the chosen product goes into the draft; account details are entered by
// the customer in WhatsApp. Opening a chat never confirms payment or access.
export function paymentWhatsAppUrl({ plan = 'pro', lessons = 2, lang = 'ru', weekly = false, changingPlan = false } = {}) {
  const ru = lang === 'ru';
  const product = weekly ? (ru ? 'пробники на текущую неделю' : 'осы аптаның сынақтары')
    : plan === 'mentor' ? `Pro (${lessons === 3 ? 3 : 2} ${ru ? 'урока в неделю' : 'сабақ / апта'})` : 'Standard';
  const text = ru
    ? `Здравствуйте! Хочу ${changingPlan ? 'перейти на' : 'приобрести'} ${product} в SYNAQ. Пришлите, пожалуйста, реквизиты для перевода${changingPlan ? ' и сумму доплаты' : ''}.\nEmail или логин ученика: \nТелефон родителя (обязательно): `
    : `Сәлеметсіз бе! SYNAQ-та ${product} ${changingPlan ? 'тарифіне ауысқым келеді' : 'сатып алғым келеді'}. Аударым деректерін${changingPlan ? ' және қосымша төлем сомасын' : ''} жіберіңізші.\nОқушының email-ы немесе логині: \nАта-ананың телефоны (міндетті): `;
  return `${WHATSAPP_PAYMENT_URL}?text=${encodeURIComponent(text)}`;
}
