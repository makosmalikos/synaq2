import React, { useEffect, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import './QuestionFigure.css';

export default function QuestionFigure({ src }) {
  const dialog = useRef(null);
  const { lang } = useLang();
  const kk = lang === 'kz' || lang === 'kk';
  const expand = kk ? 'Суретті үлкейту' : 'Увеличить схему';
  const close = kk ? 'Жабу' : 'Закрыть';
  useEffect(() => { dialog.current?.close(); }, [src]);
  return <div className="question-figure">
    <button type="button" className="question-figure-open" onClick={() => dialog.current?.showModal()} aria-label={expand}>
      <img src={src} alt={kk ? 'Тапсырмаға арналған сурет' : 'Схема к заданию'} />
      <span className="question-figure-hint">{expand} ↗</span>
    </button>
    <dialog ref={dialog} className="question-figure-dialog" onClick={event => {
      if (event.target === event.currentTarget) dialog.current.close();
    }}>
      <div className="question-figure-toolbar"><button type="button" onClick={() => dialog.current.close()} autoFocus>{close} ×</button></div>
      <div className="question-figure-scroll"><img src={src} alt={kk ? 'Тапсырмаға арналған сурет' : 'Схема к заданию'} /></div>
    </dialog>
  </div>;
}
