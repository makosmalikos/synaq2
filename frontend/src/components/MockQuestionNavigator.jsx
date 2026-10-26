import React from 'react';
import { groupMockQuestions, mockSubjectLabel } from '../mockReviewModel.js';
import './MockExperience.css';

export default function MockQuestionNavigator({ questions, selectedIndex, onSelect, statusFor, lang, review = false, disabled = false, flags = {} }) {
  const ru = lang === 'ru';
  const labels = {
    answered: ru ? 'Есть ответ' : 'Жауап берілді', unanswered: ru ? 'Без ответа' : 'Жауапсыз',
    correct: ru ? 'Верно' : 'Дұрыс', wrong: ru ? 'Ошибка' : 'Қате',
    unavailable: ru ? 'Недоступно' : 'Қолжетімсіз',
  };
  return <nav className="mock-navigator" aria-label={ru ? 'Навигация по заданиям' : 'Тапсырмалар бойынша өту'}>
    <div className="mock-navigator-heading"><h2>{ru ? 'Задания' : 'Тапсырмалар'}</h2><span>{questions.length}</span></div>
    <p className="mock-navigator-hint">{ru ? 'Выбери любой номер, чтобы открыть задание.' : 'Тапсырманы ашу үшін кез келген нөмірді таңда.'}</p>
    <div className="mock-legend">
      {(review ? ['correct', 'wrong', 'unanswered'] : ['answered', 'unanswered']).map(status => <span key={status}><i className={`is-${status}`} />{labels[status]}</span>)}
    </div>
    <div className="mock-navigator-groups">
      {groupMockQuestions(questions).map(group => <section key={group.subject}>
        <div className="mock-group-heading"><h3>{mockSubjectLabel(group.subject, lang)}</h3><span>{group.questions.filter(({ question }) => ['answered', 'correct'].includes(statusFor(question))).length}/{group.questions.length}</span></div>
        <div className="mock-number-grid">{group.questions.map(({ question, index }) => {
          const status = statusFor(question);
          const mark = { answered: '✓', correct: '✓', wrong: '×', unanswered: '−', unavailable: '?' }[status];
          return <button type="button" key={question.num} disabled={disabled} aria-current={index === selectedIndex ? 'step' : undefined}
            aria-label={`${ru ? 'Задание' : 'Тапсырма'} ${question.num}: ${labels[status]}${flags[question.num] ? (ru ? ', отмечено' : ', белгіленген') : ''}`}
            className={`mock-number is-${status}${index === selectedIndex ? ' is-current' : ''}`}
            onClick={() => onSelect(index)}>{question.num}<span className="mock-number-state" aria-hidden="true">{mark}</span>{flags[question.num] && <span className="mock-number-flag" aria-hidden="true">•</span>}</button>;
        })}</div>
      </section>)}
    </div>
  </nav>;
}
