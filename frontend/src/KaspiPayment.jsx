import React, { useEffect, useRef } from 'react';
import { useLang } from './i18n.jsx';
import { KASPI_PAYMENT_URL } from './checkoutMessages.js';
import './KaspiPayment.css';

const paymentCopy = {
  kk: {
    studentEmail: 'Оқушының synaq.app аккаунтының email-ы — міндетті өріс.',
    emailHint: 'Оқушы логинмен кірсе, логин@synaq.kids мекенжайын көрсетіңіз.',
    parentPhone: 'Байланысу үшін ата-ананың телефон нөмірі — міндетті өріс.',
    activation: 'Төлемді тексергеннен кейін қолжетімділікті қолмен қосамыз. Чекті сақтаңыз. Төлеген болсаңыз, қосылуын күтіңіз және қайта төлемеңіз.',
    return: 'Төлемнен кейін Synaq-қа оралыңыз.',
  },
  ru: {
    studentEmail: 'Email аккаунта ученика на synaq.app — обязательное поле.',
    emailHint: 'Если ученик входит по логину, укажите логин@synaq.kids.',
    parentPhone: 'Номер телефона родителя для связи — обязательное поле.',
    activation: 'После проверки оплаты мы подключим доступ вручную. Сохраните чек. Если уже оплатили, дождитесь подключения и не оплачивайте повторно.',
    return: 'После оплаты вернитесь на Synaq.',
  },
};


export function KaspiPaymentInfo() {
  const { t, lang } = useLang();
  const copy = paymentCopy[lang === 'ru' ? 'ru' : 'kk'];
  return <div className="kaspi-payment-info">
    <p>{t('subscription.paymentSub')}</p>
    <ul><li>{copy.studentEmail}</li><li>{copy.parentPhone}</li></ul>
    <p>{copy.emailHint}</p>
    <p>{copy.activation}</p>
  </div>;
}

export default function KaspiPayment({ payment, onClose }) {
  const { t, lang } = useLang();
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const amount = new Intl.NumberFormat(lang === 'kk' ? 'kk-KZ' : 'ru-RU').format(payment.priceKzt);
  return <dialog ref={dialog} className="kaspi-payment-dialog" aria-labelledby="kaspi-payment-title" onCancel={onClose}>
    <button type="button" className="kaspi-payment-close" onClick={onClose} aria-label={lang === 'ru' ? 'Закрыть' : 'Жабу'}>×</button>
    <h2 id="kaspi-payment-title">{t('subscription.paymentTitle')}</h2>
    <p className="kaspi-payment-amount">{payment.plan === 'mentor' ? `Pro · ${payment.lessons} ${lang === 'ru' ? 'урока в неделю' : 'сабақ / апта'}` : 'Standard'} · {amount} ₸</p>
    <KaspiPaymentInfo />
    <a className="btn primary" href={KASPI_PAYMENT_URL} target="_blank" rel="noopener noreferrer">{t('subscription.cta')}</a>
    <p>{paymentCopy[lang === 'ru' ? 'ru' : 'kk'].return}</p>
  </dialog>;
}
