import React, { useLayoutEffect, useId, useRef } from 'react';

export default function MockFinishDialog({ lang, answered, total, onCancel, onConfirm, section = false }) {
  const dialog = useRef(null);
  const id = useId();
  const ru = lang === 'ru';
  const remaining = total - answered;
  useLayoutEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={dialog} className="mock-finish-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={onCancel}>
    <span className="mock-eyebrow">SYNAQ · {ru ? 'ПРОБНЫЙ ТЕСТ' : 'СЫНАҚ ТЕСТІ'}</span>
    <h2 id={`${id}-title`}>{section ? (ru ? 'Завершить этот раздел?' : 'Осы бөлімді аяқтау керек пе?') : (ru ? 'Завершить пробник?' : 'Сынақты аяқтайсың ба?')}</h2>
    <p className="mock-finish-count">{ru ? 'Ответов' : 'Жауаптар'}: <strong>{answered} / {total}</strong>{remaining > 0 && <span>{ru ? 'Без ответа' : 'Жауапсыз'}: <strong>{remaining}</strong></span>}</p>
    <p id={`${id}-description`}>{section ? (ru ? 'Вернуться к разделу и изменить ответы будет нельзя. Неиспользованное время не переносится.' : 'Бөлімге қайтып, жауаптарды өзгерте алмайсың. Қалған уақыт келесі бөлімге қосылмайды.') : ru
      ? 'После завершения изменить ответы нельзя. Ты сможешь посмотреть разбор и заново решить ошибки.'
      : 'Аяқтағаннан кейін жауаптарды өзгерте алмайсың. Талдауды қарап, қателермен қайта жұмыс істей аласың.'}</p>
    <div className="mock-finish-actions">
      <button type="button" className="btn ghost" onClick={onCancel} autoFocus>{ru ? 'Продолжить тест' : 'Сынақты жалғастыру'}</button>
      <button type="button" className="btn" onClick={onConfirm}>{section ? (ru ? 'Завершить раздел' : 'Бөлімді аяқтау') : (ru ? 'Завершить и посмотреть результат' : 'Аяқтап, нәтижені көру')}</button>
    </div>
  </dialog>;
}
