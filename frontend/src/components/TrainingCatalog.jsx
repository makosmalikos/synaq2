import React, { useState } from 'react';
import { trainingCatalog, trainingTopicCount, trainingTopicName } from '../trainingCatalogModel.js';
import './TrainingCatalog.css';

const words = {
  ru: { eyebrow: 'ТВОЯ ТРЕНИРОВКА', title: 'Какой навык прокачаем?', intro: 'Выбери тему или решай математику из разных разделов.', mixed: 'Смешанная практика', mixedNote: 'Математика для подготовки к БИЛ, НИШ и РФМШ.', start: 'Начать тренировку', all: 'Все темы', search: 'Найти тему или школу', clear: 'Сбросить поиск', found: 'Тем найдено', topics: 'Темы', done: 'Выполнено', available: 'Доступно', locked: 'Открыть со Standard', empty: 'Такой темы пока не нашли', emptyNote: 'Попробуй другое название или выбери все темы.', note: 'Счётчик показывает выполненные задания. Точность ответов — в разделе «Прогресс».', free: 'На бесплатном тарифе доступны подборка новых задач, первая тема и смешанная практика. Для остальных тем нужен Standard.' },
  kk: { eyebrow: 'СЕНІҢ ЖАТТЫҒУЫҢ', title: 'Қай дағдыны дамытамыз?', intro: 'Тақырыпты таңда немесе әр бөлімнен математикалық есептер шығар.', mixed: 'Аралас жаттығу', mixedNote: 'БИЛ, НИШ және РФМШ-ға дайындық математикасы.', start: 'Жаттығуды бастау', all: 'Барлық тақырып', search: 'Тақырып не мектеп іздеу', clear: 'Іздеуді тазарту', found: 'Табылған тақырып', topics: 'Тақырып', done: 'Орындалды', available: 'Қолжетімді', locked: 'Standard арқылы ашу', empty: 'Мұндай тақырып табылмады', emptyNote: 'Басқа атауды жаз немесе барлық тақырыпты таңда.', note: 'Санауыш орындалған есептерді көрсетеді. Жауап дәлдігі «Прогресс» бөлімінде.', free: 'Тегін тарифте жаңа есептер жинағы, алғашқы тақырып пен аралас жаттығу ашық. Қалған тақырыптарға Standard қажет.' },
};

function PracticeIcon({ kind = 'arrow' }) {
  const paths = { arrow: 'M4 12h16m-6-6 6 6-6 6', chevron: 'm9 5 7 7-7 7', check: 'm5 12 4 4L19 6' };
  return <svg className="practice-action-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[kind]} /></svg>;
}

function SubjectArt({ subject }) {
  if (subject === 'logic' || subject === 'science') return <img src={`/landing/benefits-3d/${subject === 'logic' ? 'puzzle' : 'compass'}-280.webp`} width="280" height="280" alt="" loading="lazy" decoding="async" />;
  return <span className={`practice-tiles is-${subject}`} aria-hidden="true"><i>{subject === 'math' ? '÷' : 'Ә'}</i><b>{subject === 'math' ? '+' : 'A'}</b></span>;
}

export default function TrainingCatalog({ topics, solvedIn = {}, pro, freeTopicId, lang, onPreview, onOpen, onMixed, onUpgrade, notice }) {
  const locale = lang === 'ru' ? 'ru' : 'kk', c = words[locale];
  const [subject, setSubject] = useState('all'), [query, setQuery] = useState('');
  const preview = topics.find(topic => topic.id === 'free-preview');
  const regularTopics = topics.filter(topic => topic.id !== 'free-preview');
  const groups = trainingCatalog(regularTopics, { subject, query });
  const choices = trainingCatalog(regularTopics);
  const count = groups.reduce((sum, group) => sum + group.topics.length, 0);
  const reset = () => { setQuery(''); setSubject('all'); };
  return <main className="practice-catalog">
    {notice}
    <header className="practice-heading"><span>{c.eyebrow}</span><h1>{c.title}</h1><p>{c.intro}</p></header>
    {preview && <section className="practice-preview" aria-labelledby="practice-preview-title">
      <div><span>{locale === 'ru' ? 'БЕСПЛАТНАЯ ПОДБОРКА' : 'ТЕГІН ЕСЕПТЕР ЖИНАҒЫ'}</span><h2 id="practice-preview-title">{locale === 'ru' ? 'Попробуй новые задачи' : 'Жаңа есептерді шығарып көр'}</h2><p>{locale === 'ru' ? 'Геометрия, дроби и текстовые задачи. Свои схемы и подробный разбор после ответа. До 5 задач в день бесплатно.' : 'Геометрия, бөлшектер және мәтіндік есептер. Өз сызбаларымыз бен жауаптан кейінгі толық талдау. Күніне 5 есепке дейін тегін.'}</p></div>
      <button type="button" onClick={onPreview}>{locale === 'ru' ? 'Решать бесплатно' : 'Тегін шығару'}<PracticeIcon /></button>
    </section>}
    <section className="practice-mixed" aria-labelledby="practice-mixed-title">
      <div><span className="practice-mixed-tag">БИЛ · НИШ · РФМШ</span><h2 id="practice-mixed-title">{c.mixed}</h2><p>{c.mixedNote}</p><button type="button" onClick={onMixed}>{c.start}<PracticeIcon /></button></div>
      <img src="/mascot/synaq-owl-study.webp" width="640" height="640" alt="" decoding="async" />
    </section>
    <div className="practice-subjects" aria-label={locale === 'ru' ? 'Направления практики' : 'Жаттығу бағыттары'}>
      {choices.map(group => <button type="button" key={group.id} className={`practice-subject is-${group.id}${subject === group.id ? ' is-selected' : ''}`} aria-pressed={subject === group.id} onClick={() => { setSubject(subject === group.id ? 'all' : group.id); setQuery(''); }}>
        <div className="practice-subject-art" aria-hidden="true"><SubjectArt subject={group.id}/></div><strong>{group[locale]}</strong><small>{c.topics}: {group.topics.length}</small><span className="practice-subject-arrow" aria-hidden="true"><PracticeIcon kind={subject === group.id ? 'check' : 'arrow'} /></span>
      </button>)}
    </div>
    <section className="practice-directory" aria-labelledby="practice-topics-title">
      <div className="practice-tools"><button type="button" className={subject === 'all' ? 'is-selected' : ''} aria-pressed={subject === 'all'} onClick={() => setSubject('all')}>{c.all}</button><label><span className="practice-search-label">{c.search}</span><input type="search" placeholder={c.search} value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      <div className="practice-directory-heading"><h2 id="practice-topics-title">{subject === 'all' ? c.all : choices.find(group => group.id === subject)?.[locale]}</h2><span role="status">{c.found}: {count}</span></div>
      {!pro && <p className="practice-access-note">{c.free}</p>}
      {groups.map(group => <section key={group.id} className={`practice-group is-${group.id}`}><h3>{group[locale]}</h3><div className="practice-topic-list">{group.topics.map(topic => {
        const total = trainingTopicCount(topic), done = Math.min(Math.max(0, solvedIn[topic.id] || 0), total);
        const locked = !pro && topic.id !== freeTopicId;
        return <button type="button" key={topic.id} className={`practice-topic${locked ? ' is-locked' : ''}`} onClick={() => locked ? onUpgrade?.() : onOpen(topic)} aria-label={`${trainingTopicName(topic, locale)} · ${c.done}: ${done} / ${total} · ${locked ? c.locked : c.available}`}>
          <div className="practice-topic-copy"><strong>{trainingTopicName(topic, locale)}</strong><small>{(topic.schools || []).join(' · ')}</small><span>{c.done}: {done} / {total}</span></div>
          <div className="practice-topic-side"><span className={locked ? 'practice-lock' : 'practice-open'}>{locked ? 'Standard' : <PracticeIcon kind="chevron" />}</span><div className="practice-topic-bar" aria-hidden="true"><i style={{width:`${done / total * 100}%`}}/></div></div>
        </button>;
      })}</div></section>)}
      {!count && <div className="practice-empty"><strong>{c.empty}</strong><p>{c.emptyNote}</p><button type="button" onClick={reset}>{c.clear}</button></div>}
      <p className="practice-note">{c.note}</p>
    </section>
  </main>;
}
