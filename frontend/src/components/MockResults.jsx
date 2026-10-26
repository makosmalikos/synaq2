import React, { useMemo, useState } from 'react';
import { mockDisplayScore, formatStudyTime } from '../analytics.js';
import { isCorrect } from '../grading.js';
import { groupMockQuestions, mockNavigationGroups, hasMockAnswer, mockMistakes, mockReviewQuestions, mockReviewStatus, mockReviewSummary, mockSubjectLabel } from '../mockReviewModel.js';
import MockQuestionNavigator from './MockQuestionNavigator.jsx';
import MockTask from './MockTask.jsx';
import useScreenStart from '../useScreenStart.js';
import './MockExperience.css';
import { rfmshLevelLabel } from '../rfmshScoring.js';

export default function MockResults({ result, test, school, lang, onBack, backLabel, children }) {
  const ru = lang === 'ru';
  const [mode, setMode] = useState('summary');
  const [filter, setFilter] = useState('all');
  const [index, setIndex] = useState(0);
  const [retryAnswers, setRetryAnswers] = useState({});
  const review = useMemo(() => mockReviewQuestions(result, test), [result, test]);
  const mistakes = useMemo(() => mockMistakes(review), [review]);
  const summary = mockReviewSummary(review, school);
  const score = mockDisplayScore({ ...result, school });
  const weightedRfmsh = school === 'РФМШ' && result.scoring === 'rfmsh';
  const scoreGroups = weightedRfmsh ? mockNavigationGroups(review) : groupMockQuestions(review);
  const groupLabel = group => group.examLevel ? rfmshLevelLabel(group.questions[0].question,lang) : mockSubjectLabel(group.subject,lang);
  const questions = mode === 'retry' || filter === 'mistakes' ? mistakes : review;
  const question = questions[index];
  const retry = question && retryAnswers[question.num];
  const completed = mistakes.filter(row => retryAnswers[row.num]?.correct === true).length;
  const open = (nextMode, nextFilter = 'all') => { setMode(nextMode); setFilter(nextFilter); setIndex(0); };
  const percentage = summary.total ? Math.round(summary.correct / summary.total * 100) : 0;
  const allCorrect = review.some(row => !row.unavailable) && review.every(row => row.unavailable || row.correct === true);
  useScreenStart(`mock-result:${mode}:${filter}:${index}`, mode !== 'summary' ? '.mock-question-panel' : undefined);

  function updateRetry(value) {
    if (retry?.checked) return;
    setRetryAnswers(current => ({ ...current, [question.num]: { value, checked: false } }));
  }
  function checkRetry() {
    if (!question || !hasMockAnswer(retry?.value) || retry.checked) return;
    setRetryAnswers(current => ({ ...current, [question.num]: {
      value: retry.value, checked: true, correct: isCorrect(retry.value, question),
    } }));
  }

  if (mode === 'summary') return <main className="mock-experience mock-results">
    <div className="mock-page-heading"><div><span className="mock-eyebrow">{school} · SYNAQ</span><h1>{ru ? 'Результат пробника' : 'Сынақ нәтижесі'}</h1><p>{ru ? 'Твои баллы, ответы и следующий шаг в подготовке.' : 'Ұпайларың, жауаптарың және дайындықтың келесі қадамы.'}</p></div><button type="button" className="btn ghost" onClick={onBack}>{backLabel || (ru ? 'К пробникам' : 'Сынақтарға')}</button></div>
    <div className="mock-result-actions"><button type="button" className="mock-primary-action" disabled={!review.length} onClick={() => open('review')}>{ru ? 'Посмотреть разбор' : 'Талдауды көру'}<span aria-hidden="true">→</span></button><button type="button" className="mock-secondary-action" disabled={!mistakes.length} onClick={() => open('retry')}>{ru ? 'Работа над ошибками' : 'Қатемен жұмыс'}<span>{mistakes.length}</span></button></div>
    {result.shortened && <p className="mock-empty-note">{ru ? 'Сокращённый вариант' : 'Қысқартылған нұсқа'} · {result.total}/{result.targetCount}</p>}
    <div className="mock-results-overview">
      <div className="mock-score-column">
        <section className="mock-score-card">
          <span className="mock-score-badge">✓ {ru ? 'Тест завершён' : 'Сынақ аяқталды'}</span>
          <p>{school === 'БИЛ' || weightedRfmsh ? (ru ? 'Общий балл' : 'Жалпы ұпай') : (ru ? 'Верные ответы' : 'Дұрыс жауаптар')}</p>
          <div className="mock-score-value">{score.score}<span>/ {score.max}</span></div>
          <p className="mock-scoring-note">{weightedRfmsh ? (ru ? 'A: 3 балла · B: 5 баллов · C: 7 баллов. Ошибка и пропуск — 0.' : 'A: 3 ұпай · B: 5 ұпай · C: 7 ұпай. Қате мен жауапсыз тапсырма — 0.') : school === 'БИЛ' ? (ru ? 'Верно +4 · ошибка −1 · пропуск 0' : 'Дұрыс +4 · қате −1 · жауапсыз 0') : (ru ? 'Число верных ответов — тренировочный результат. НИШ использует шкалу Cito с психометрическим выравниванием: этот процент нельзя перевести в официальные 1500 баллов.' : 'Дұрыс жауап саны — жаттығу нәтижесі. НЗМ Cito психометриялық шкаласын қолданады: бұл пайыз ресми 1500 ұпайға айналдырылмайды.')}</p>
          <div className="mock-score-bottom"><div className="mock-score-ring" style={{ '--progress': `${percentage}%` }}><span><strong>{percentage}%</strong><small>{ru ? 'верно' : 'дұрыс'}</small></span></div><div><span>{ru ? 'Время прохождения' : 'Өту уақыты'}</span><strong>{formatStudyTime(result.spentSec || 0, lang)}</strong><small>{ru ? 'Результат сохранён' : 'Нәтиже сақталды'}</small></div></div>
        </section>
        <div className="mock-result-counts"><div className="is-correct"><strong>{summary.correct}</strong><span>{ru ? 'Верно' : 'Дұрыс'}</span></div><div className="is-wrong"><strong>{summary.wrong}</strong><span>{ru ? 'Ошибок' : 'Қате'}</span></div><div><strong>{summary.unanswered}</strong><span>{ru ? 'Без ответа' : 'Жауапсыз'}</span></div></div>
      </div>
      <section className="mock-subject-results"><h2>{weightedRfmsh ? (ru ? 'По уровням сложности' : 'Күрделілік деңгейлері бойынша') : (ru ? 'По предметам' : 'Пәндер бойынша')}</h2><p>{ru ? 'Посмотри, что уже получается и к чему стоит вернуться.' : 'Қай тақырыпты меңгергеніңді, қайсына оралу керегін көр.'}</p>
        {scoreGroups.map(group => {
          const stats = mockReviewSummary(group.questions.map(item => item.question), school);
          return <article key={group.examLevel || group.subject}><div><h3>{groupLabel(group)}</h3><strong>{stats.unavailable ? '—' : stats.score}<small>/ {stats.max}</small></strong></div><div className="mock-subject-bar" role="progressbar" aria-label={`${groupLabel(group)}: ${ru ? 'верные ответы' : 'дұрыс жауаптар'}`} aria-valuemin={0} aria-valuemax={stats.total} aria-valuenow={stats.correct}><i style={{ width: `${stats.total ? stats.correct / stats.total * 100 : 0}%` }} /></div><p>{stats.correct} {ru ? 'верно' : 'дұрыс'} · {stats.wrong} {ru ? 'ошибок' : 'қате'} · {stats.unanswered} {ru ? 'без ответа' : 'жауапсыз'}{stats.unavailable ? ` · ${stats.unavailable} ${ru ? 'недоступно' : 'қолжетімсіз'}` : ''}</p></article>;
        })}
      </section>
    </div>
    {allCorrect && <p className="mock-empty-note">{ru ? 'Все доступные задания решены верно. Отличный результат!' : 'Қолжетімді тапсырмалардың барлығы дұрыс шешілді. Керемет нәтиже!'}</p>}
    {!review.length && <p className="mock-empty-note">{ru ? 'Для этого старого результата разбор заданий не сохранился.' : 'Бұл ескі нәтиженің тапсырма талдауы сақталмаған.'}</p>}
    {children}
  </main>;

  return <main className="mock-experience mock-review-page">
    <button type="button" className="mock-back-link" onClick={() => open('summary')}>← {ru ? 'К результату' : 'Нәтижеге оралу'}</button>
    <div className="mock-page-heading"><div><span className="mock-eyebrow">{school} · {ru ? 'ПРОБНЫЙ ТЕСТ' : 'СЫНАҚ ТЕСТІ'}</span><h1>{mode === 'retry' ? (ru ? 'Работа над ошибками' : 'Қатемен жұмыс') : (ru ? 'Разбор пробника' : 'Сынақты талдау')}</h1><p>{mode === 'retry' ? (ru ? 'Реши заново ошибки и пропуски. Исходный результат теста сохранится.' : 'Қате және жауапсыз тапсырмаларды қайта шеш. Бастапқы нәтиже сақталады.') : (ru ? 'Сравни свой ответ с правильным и посмотри объяснение.' : 'Жауабыңды дұрыс жауаппен салыстырып, түсіндірмені қара.')}</p></div><div className="mock-review-counter"><strong>{mode === 'retry' ? completed : summary.correct}</strong><span>/ {mode === 'retry' ? mistakes.length : summary.total}</span><small>{mode === 'retry' ? (ru ? 'исправлено' : 'түзетілді') : (ru ? 'верно' : 'дұрыс')}</small></div></div>
    {mode === 'review' && <div className="mock-review-filters"><button type="button" aria-pressed={filter === 'all'} onClick={() => open('review')}>{ru ? 'Все задания' : 'Барлық тапсырмалар'} · {review.length}</button><button type="button" aria-pressed={filter === 'mistakes'} onClick={() => open('review', 'mistakes')}>{ru ? 'Ошибки и пропуски' : 'Қате және жауапсыз'} · {mistakes.length}</button><button type="button" disabled={!mistakes.length} onClick={() => open('retry')}>{ru ? 'Решить заново' : 'Қайта шешу'} →</button></div>}
    {mode === 'retry' && completed === mistakes.length && mistakes.length > 0 && <p className="mock-retry-complete" role="status">✓ {ru ? 'Все ошибки исправлены! Можно вернуться к результату или повторить задания ещё раз.' : 'Барлық қате түзетілді! Нәтижеге оралуға немесе тапсырмаларды қайталауға болады.'}<button type="button" onClick={() => { setRetryAnswers({}); setIndex(0); }}>{ru ? 'Повторить' : 'Қайталау'}</button></p>}
    {question ? <div className="mock-workspace">
      <MockQuestionNavigator questions={questions} selectedIndex={index} onSelect={setIndex} lang={lang} review
        statusFor={row => mode === 'retry' ? (retryAnswers[row.num]?.checked ? (retryAnswers[row.num].correct ? 'correct' : 'wrong') : 'unanswered') : mockReviewStatus(row)} />
      <section className="mock-question-panel" key={question.num}>
        <div className="mock-question-heading"><div><span>{rfmshLevelLabel(question,lang) || mockSubjectLabel(question.subject || 'math', lang)}</span><h2>{ru ? 'Задание' : 'Тапсырма'} {question.num}</h2></div><span className={`mock-status is-${mode === 'retry' ? (retry?.checked ? retry.correct ? 'correct' : 'wrong' : 'unanswered') : mockReviewStatus(question)}`}>{mode === 'retry' && !retry?.checked ? (ru ? 'Реши самостоятельно' : 'Өзің шешіп көр') : question.unavailable ? (ru ? 'Недоступно' : 'Қолжетімсіз') : (mode === 'retry' ? retry.correct : question.correct) ? (ru ? 'Верно' : 'Дұрыс') : (mode === 'retry' || hasMockAnswer(question.your)) ? (ru ? 'Ошибка' : 'Қате') : (ru ? 'Без ответа' : 'Жауапсыз')}</span></div>
        <MockTask question={question} lang={lang} value={mode === 'retry' ? retry?.value || '' : question.your || ''} onPick={updateRetry} reveal={mode === 'review' || !!retry?.checked} correct={mode === 'retry' ? !!retry?.correct : question.correct} />
        {mode === 'retry' && <div className="mock-retry-controls">{!retry?.checked ? <button type="button" className="btn" disabled={!hasMockAnswer(retry?.value)} onClick={checkRetry}>{ru ? 'Проверить ответ' : 'Жауапты тексеру'}</button> : <><p role="status">{retry.correct ? (ru ? 'Ошибка исправлена. Продолжай!' : 'Қате түзетілді. Жалғастыр!') : (ru ? 'Посмотри объяснение и попробуй ещё раз.' : 'Түсіндірмені қарап, қайта көр.')}</p><button type="button" className="btn ghost" onClick={() => setRetryAnswers(current => ({ ...current, [question.num]: { value: '', checked: false } }))}>{ru ? 'Решить ещё раз' : 'Тағы шешу'}</button></>}</div>}
        <div className="mock-question-footer"><button type="button" className="btn ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>← {ru ? 'Назад' : 'Артқа'}</button><span>{index + 1} / {questions.length}</span><button type="button" className="btn" disabled={index === questions.length - 1} onClick={() => setIndex(index + 1)}>{ru ? 'Далее' : 'Келесі'} →</button></div>
      </section>
    </div> : <p className="mock-empty-note">{ru ? 'В этом списке нет заданий.' : 'Бұл тізімде тапсырма жоқ.'}</p>}
  </main>;
}
