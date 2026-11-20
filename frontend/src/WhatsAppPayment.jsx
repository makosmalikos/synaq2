import React, { useEffect, useRef } from 'react';
import { useLang } from './i18n.jsx';
import { paymentWhatsAppUrl } from './whatsappPayment.js';
import './WhatsAppPayment.css';

const paymentCopy = {
  kk: {
    instructions: 'WhatsApp-қа жазыңыз. Аударым деректерін жібереміз. Міндетті түрде көрсетіңіз:',
    studentEmail: 'Оқушының synaq.app аккаунтының email-ы немесе логині — міндетті.',
    emailHint: 'Оқушы логинмен кірсе, логин@synaq.kids мекенжайын көрсетіңіз.',
    parentPhone: 'Байланысу үшін ата-ананың телефон нөмірі — міндетті.',
    activation: 'Аударымнан кейін чекті WhatsApp-қа жіберіңіз. Төлемді тексеріп, қолжетімділікті қолмен қосамыз. Автоматты төлем жоқ. Төлеген болсаңыз, қосылуын күтіңіз.',
    return: 'Төлемнен кейін Synaq-қа оралыңыз.',
  },
  ru: {
    instructions: 'Напишите нам в WhatsApp — отправим реквизиты для перевода. Обязательно укажите:',
    studentEmail: 'Email или логин аккаунта ученика на synaq.app — обязательно.',
    emailHint: 'Если ученик входит по логину, укажите логин@synaq.kids.',
    parentPhone: 'Номер телефона родителя для связи — обязательно.',
    activation: 'После перевода отправьте чек в WhatsApp. Проверим оплату и подключим доступ вручную. Автосписаний нет. Если уже оплатили, дождитесь подключения.',
    return: 'После оплаты вернитесь на Synaq.',
  },
};


export function WhatsAppPaymentInfo() {
  const { lang } = useLang();
  const copy = paymentCopy[lang === 'ru' ? 'ru' : 'kk'];
  return <div className="whatsapp-payment-info">
    <p>{copy.instructions}</p>
    <ul><li>{copy.studentEmail}</li><li>{copy.parentPhone}</li></ul>
    <p>{copy.emailHint}</p>
    <p>{copy.activation}</p>
  </div>;
}

export default function WhatsAppPayment({ payment, onClose }) {
  const { t, lang } = useLang();
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const amount = new Intl.NumberFormat(lang === 'kk' ? 'kk-KZ' : 'ru-RU').format(payment.priceKzt);
  return <dialog ref={dialog} className="whatsapp-payment-dialog" aria-labelledby="whatsapp-payment-title" onCancel={onClose}>
    <button type="button" className="whatsapp-payment-close" onClick={onClose} aria-label={lang === 'ru' ? 'Закрыть' : 'Жабу'}>×</button>
    <h2 id="whatsapp-payment-title">{t('subscription.paymentTitle')}</h2>
    <p className="whatsapp-payment-amount">{payment.plan === 'mentor' ? `Pro · ${payment.lessons} ${lang === 'ru' ? 'урока в неделю' : 'сабақ / апта'}` : 'Standard'} · {amount} ₸</p>
    <WhatsAppPaymentInfo />
    <a className="btn primary" href={paymentWhatsAppUrl({ ...payment, lang })} target="_blank" rel="noopener noreferrer">{t('subscription.cta')}</a>
    <p>{paymentCopy[lang === 'ru' ? 'ru' : 'kk'].return}</p>
  </dialog>;
}
