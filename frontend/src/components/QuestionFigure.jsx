import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { isPrivateFigure, fetchPrivateFigure } from '../privateFigures.js';
import './QuestionFigure.css';

export default function QuestionFigure({ src, questionId }) {
  const dialog = useRef(null);
  const [loaded,setLoaded]=useState(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
  const { lang } = useLang();
  const kk = lang === 'kz' || lang === 'kk';
  const expand = kk ? 'Суретті үлкейту' : 'Увеличить схему';
  const close = kk ? 'Жабу' : 'Закрыть';
  const protectedFigure=isPrivateFigure(src);
  const visibleSrc=protectedFigure?(loaded?.source===src&&loaded?.questionId===questionId?loaded.url:null):src;
  useEffect(() => { dialog.current?.close(); }, [src]);
  useEffect(()=>{
    if(!protectedFigure)return;
    const controller=new AbortController();let active=true,objectUrl;
    setLoaded(null);setFailed(false);
    fetchPrivateFigure(questionId,{signal:controller.signal}).then(blob=>{
      if(!active)return;
      objectUrl=URL.createObjectURL(blob);setLoaded({source:src,questionId,url:objectUrl});
    }).catch(()=>{if(active)setFailed(true);});
    return ()=>{active=false;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[src,questionId,protectedFigure,retry]);
  if(!visibleSrc)return <div className="question-figure" role="status">
    {failed?<><p>{kk?'Сурет жүктелмеді. Байланысты тексеріп, қайта көріңдер.':'Не удалось загрузить схему. Проверьте соединение и повторите.'}</p><button type="button" onClick={()=>setRetry(n=>n+1)}>{kk?'Қайта жүктеу':'Повторить'}</button></>:<p>{kk?'Сурет жүктелуде…':'Загружаем схему…'}</p>}
  </div>;
  return <div className="question-figure">
    <button type="button" className="question-figure-open" onClick={() => dialog.current?.showModal()} aria-label={expand}>
      <img src={visibleSrc} decoding="async" alt={kk ? 'Тапсырмаға арналған сурет' : 'Схема к заданию'} />
      <span className="question-figure-hint">{expand} ↗</span>
    </button>
    <dialog ref={dialog} className="question-figure-dialog" aria-label={expand} onClick={event => {
      if (event.target === event.currentTarget) dialog.current.close();
    }}>
      <div className="question-figure-toolbar"><button type="button" onClick={() => dialog.current.close()} autoFocus>{close} ×</button></div>
      <div className="question-figure-scroll"><img src={visibleSrc} alt={kk ? 'Тапсырмаға арналған сурет' : 'Схема к заданию'} /></div>
    </dialog>
  </div>;
}
