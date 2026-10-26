import React, { useRef } from 'react';
import NisExam from './NisExam.jsx';
import { startNis, updateNis, NIS_FORMAT } from '../../../shared/nis-exam.mjs';
import QuestionFigure from './QuestionFigure.jsx';
import FigureOption, { mainFigureSrc } from './FigureOption.jsx';

export default function PublicNisExam({mock, saved, lang, onProgress, onComplete, durable = true}) {
  const initial = useRef(null);
  if(!initial.current) {
    const nis=saved?.nis || startNis(Date.now());
    initial.current={id:'public-nis',test:{examFormat:NIS_FORMAT,questions:mock.questions.map((q,i)=>({...q,num:i+1,subject:q.topic}))},nis,
      answers:saved?.answers || nis.answers,index:saved?.index || 0,revision:saved?.revision || nis.revision,deadline:nis.deadline || Date.now()+7*86400000,clockOffsetMs:0};
  }
  const current=useRef(initial.current);
  const ru=lang==='ru';
  return <NisExam initial={initial.current} lang={lang} notice={!durable && <p role="alert">{ru ? 'Браузер не смог сохранить попытку. Не закрывайте эту страницу до завершения.' : 'Браузер сынақты сақтай алмады. Аяқталғанша бетті жаппаңыз.'}</p>}
    transport={async change=>{
      if(change.op==='submit')return {...current.current.answers};
      const nis=updateNis(current.current.nis,change,Date.now());
      return {nis,deadline:nis.deadline || Date.now()+7*86400000,serverNow:Date.now()};
    }}
    onChange={record=>{current.current=record;onProgress({nis:record.nis,answers:record.answers,index:record.index,revision:record.revision},record.deadline);}}
    onComplete={answers=>onComplete(Object.fromEntries(mock.questions.map((q,i)=>[q.id,answers[i+1]||''])))}
    renderQuestion={(q,value,onPick,disabled)=><div className="mock-task"><div className="mock-statement">{q.statement.split(/\n{2,}/).map((p,i)=><p className="stmt" key={i}>{p}</p>)}</div>{mainFigureSrc(q)&&<QuestionFigure src={mainFigureSrc(q)} questionId={q.id}/>}
      <div className="opts">{q.options.map((option,i)=><button type="button" key={i} className={`opt${value===option?' sel':''}`} aria-pressed={value===option} disabled={disabled} onClick={()=>onPick(option)}><span className="lt">{'ABCD'[i]}</span><span className="mock-option-copy"><FigureOption question={q} value={option}/></span></button>)}</div></div>}/>;
}
