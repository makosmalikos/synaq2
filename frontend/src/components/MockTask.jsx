import React, { useEffect, useState } from 'react';
import { auth } from '../firebase.js';
import { translateQuestions } from '../translateQuestions.js';
import MathText from './MathText.jsx';
import QuestionFigure from './QuestionFigure.jsx';
import FigureOption, { hasFigureOptions, mainFigureSrc } from './FigureOption.jsx';
import Explain from './Explain.jsx';
import { rfmshPoints } from '../rfmshScoring.js';
import { Kolhar } from './Training.jsx';

export default function MockTask({ question, lang, value = '', onPick, disabled = false, reveal = false, correct = false }) {
  const [translation, setTranslation] = useState(null);
  const uid = auth.currentUser?.uid;
  const ru = lang === 'ru';
  useEffect(() => {
    if (question.unavailable) return;
    let alive = true;
    translateQuestions([question], lang).then(([translated]) => {
      if (alive && auth.currentUser?.uid === uid) setTranslation({ source: question, lang, uid, question: translated });
    }, () => {});
    return () => { alive = false; };
  }, [question, lang, uid]);
  const q = translation?.source === question && translation.lang === lang && translation.uid === uid ? translation.question : question;
  if (q.unavailable) return <p className="mock-empty-note">{ru ? 'Это задание больше недоступно. Его результат сохранён в итогах теста.' : 'Бұл тапсырма енді қолжетімсіз. Нәтижесі сынақ қорытындысында сақталған.'}</p>;
  return <div className="mock-task">
    {q.needsTranslation && <p className="muted" role="status">{ru ? 'Перевод временно недоступен. Показан оригинал.' : 'Аударма уақытша қолжетімсіз. Түпнұсқа көрсетілген.'}</p>}
    {q.subject === 'kolzar' ? <Kolhar q={reveal ? q : { ...q, answer: undefined }} answer={value} onPick={onPick} disabled={disabled || reveal} correct={reveal ? correct : null} /> : <>
      <div className="mock-statement">{String(q.statement || '').split(/\n{2,}/).map((paragraph, i) => <p className="stmt" key={i}><MathText text={paragraph} /></p>)}</div>
      {mainFigureSrc(q) && <QuestionFigure src={mainFigureSrc(q)} questionId={q.qid || q.id} />}
      {q.options ? <div className={`opts${hasFigureOptions(q) ? ' figure-options' : ''}`}>
        {q.options.map((option, index) => {
          const isAnswer = reveal && String(option).trim() === String(q.answer).trim();
          const chosen = String(value).trim() === String(option).trim();
          const content = <><span className="lt">{'ABCDEFGH'[index]}</span><span className="mock-option-copy"><FigureOption question={q} value={option} />{reveal && (isAnswer || chosen) && <small>{[chosen && (ru ? 'Твой ответ' : 'Сенің жауабың'), isAnswer && (ru ? 'Правильный ответ' : 'Дұрыс жауап')].filter(Boolean).join(' · ')}</small>}</span></>;
          return reveal ? <div key={index} className={`opt${isAnswer ? ' ok' : chosen ? ' bad' : ''}`}>{content}</div>
            : <button type="button" key={index} disabled={disabled} aria-pressed={chosen} className={`opt${chosen ? ' sel' : ''}`} onClick={() => onPick(option)}>{content}</button>;
        })}
      </div> : !reveal && <input inputMode={rfmshPoints(q) !== null ? 'numeric' : undefined} aria-label={rfmshPoints(q) !== null ? (ru ? 'Ответ — целое число' : 'Жауап — бүтін сан') : (ru ? 'Твой ответ' : 'Сенің жауабың')} maxLength={2000} disabled={disabled} value={value} onChange={event => onPick(event.target.value)} placeholder={rfmshPoints(q) !== null ? (ru ? 'Введите целое число' : 'Бүтін санды енгіз') : (ru ? 'Введи ответ' : 'Жауабыңды енгіз')} />}
    </>}
    {reveal && <>
      {(!q.options || q.subject === 'kolzar') && <div className="mock-answer-comparison"><div><span>{ru ? 'Твой ответ' : 'Сенің жауабың'}</span><strong><MathText text={String(value).trim() || '—'} /></strong></div><div className="is-correct"><span>{ru ? 'Правильный ответ' : 'Дұрыс жауап'}</span><strong><FigureOption question={q} value={q.answer} /></strong></div></div>}
      <Explain q={q} given={correct ? null : value || null} />
    </>}
  </div>;
}
