import React, { useRef, useState } from 'react';
import { ParentDashboardView } from './ParentDashboard.jsx';
import PetAvatar from './PetAvatar.jsx';
import { buildDiagnosticShareText, daysUntilDiagnostic } from './platformDiagnostic.js';
import './ParentReport.css';

export default function ParentReport({ child, summary, mocks = [], diagnostics = [], lang, onBack }) {
  const text = (ru, kk) => lang === 'ru' ? ru : kk;
  const locale = lang === 'ru' ? 'ru-RU' : 'kk-KZ';
  const [filter, setFilter] = useState('all');
  const topicSection = useRef(null);
  const topicName = topic => lang === 'ru' ? topic.nameRu || topic.name : topic.name;
  const topics = [...summary.topics].sort((a, b) => a.pct - b.pct);
  const level = topic => topic.count < 3 ? 'new' : topic.pct >= 70 ? 'strong' : 'practice';
  const visible = topics.filter(topic => filter === 'all' || level(topic) === filter);
  const diagnostic = diagnostics[0];
  const days = diagnostic ? daysUntilDiagnostic(diagnostic.completedAt) : 0;
  const dateLabel = value => {
    const ms = value?.at?.toMillis?.() || (value?.at?.seconds || 0) * 1000 || Date.parse(value?.completedAt || '');
    return Number.isFinite(ms) && ms > 0 ? new Date(ms).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : text('Дата не указана', 'Күні көрсетілмеген');
  };

  return <main className="pd-report">
    <button type="button" className="pdr-back" onClick={onBack}>← {text('К обзору семьи', 'Отбасы шолуына')}</button>
    <div className="pdr-heading">
      <div className="pdr-child"><PetAvatar id={child.avatar} /><div><span className="pd-eyebrow">{text('Подготовка ребёнка', 'Баланың дайындығы')}</span><h1>{child.name}</h1><p>{text('Прогресс, который легко понять. Следующий шаг, который легко сделать.', 'Түсінікті прогресс. Орындауға оңай келесі қадам.')}</p></div></div>
      <span className="pd-chip">{text('Обзор за 7 дней', '7 күндік шолу')}</span>
    </div>

    <ParentDashboardView child={child} summary={summary} lang={lang} detailsLabel={text('Посмотреть все темы', 'Барлық тақырыптарды көру')} onDetails={() => topicSection.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })} />

    <section ref={topicSection} className="pdr-topics" aria-label={text('Подробный прогресс по темам', 'Тақырыптар бойынша толық прогресс')}>
      <div className="pdr-section-heading"><div><span className="pd-eyebrow">{text('Полная картина', 'Толық көрініс')}</span><h2>{text('Карта тем', 'Тақырыптар картасы')}</h2><p>{text('Каждая тема — маленький шаг к уверенности.', 'Әр тақырып — сенімділікке бір қадам.')}</p></div><span className="pd-chip">{topics.length} {text('тем в практике', 'жаттығу тақырыбы')}</span></div>
      <div className="pdr-filters" aria-label={text('Фильтр тем', 'Тақырып сүзгісі')}>
        {[['all', text('Все темы', 'Барлық тақырыптар')], ['practice', text('Стоит повторить', 'Қайталау керек')], ['strong', text('Получается хорошо', 'Жақсы нәтиже')]].map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label} <span>{id === 'all' ? topics.length : topics.filter(topic => level(topic) === id).length}</span></button>)}
      </div>
      <div className={`pdr-topic-grid${visible.length === 1 ? ' pdr-topic-grid-single' : ''}`}>
        {visible.map(topic => {
          const tone = level(topic);
          return <article key={topic.id} className={`pdr-topic-card pdr-topic-${tone}`}>
            <div className="pdr-topic-top"><span className="pd-icon" aria-hidden="true">{tone === 'strong' ? '✓' : tone === 'new' ? '✦' : '↗'}</span><span className="pdr-status">{tone === 'strong' ? text('Хорошая база', 'Жақсы негіз') : tone === 'new' ? text('Первые шаги', 'Алғашқы қадамдар') : text('Ещё немного практики', 'Тағы біраз жаттығу')}</span></div>
            <h3>{topicName(topic)}</h3>
            <div className="pdr-topic-score"><strong>{topic.pct}%</strong><span>{text('верных ответов', 'дұрыс жауап')}</span></div>
            <div className="pd-topic-track"><i style={{ width: `${topic.pct}%` }} /></div>
            <div className="pdr-topic-meta"><span>{topic.count} {text('ответов', 'жауап')}</span>{topic.delta !== null && <span>{topic.delta > 0 ? '+' : ''}{topic.delta} {text('п. п. за неделю', 'п. т. бір аптада')}</span>}</div>
            <p>{tone === 'new' ? text('Пока мало ответов для вывода. Дайте ребёнку время освоиться.', 'Қорытынды үшін жауап аз. Балаңызға үйренуге уақыт беріңіз.') : tone === 'strong' ? text('Похвалите за старание и закрепите результат несколькими задачами.', 'Еңбегін мақтап, нәтижені бірнеше есеппен бекітіңіз.') : text('Разберите одну ошибку вместе, затем предложите 5 похожих задач.', 'Бір қатені бірге талдап, содан кейін 5 ұқсас есеп ұсыныңыз.')}</p>
          </article>;
        })}
      </div>
      {!visible.length && <div className="pdr-empty"><span className="pd-icon" aria-hidden="true">✦</span><h3>{topics.length ? text('Здесь пока нет тем', 'Мұнда тақырып әлі жоқ') : text('Первые результаты уже скоро', 'Алғашқы нәтижелер жақында көрінеді')}</h3><p>{topics.length ? text('Выберите другой фильтр, чтобы увидеть остальные темы.', 'Қалған тақырыптарды көру үшін басқа сүзгіні таңдаңыз.') : text('После первой тренировки здесь появятся темы, точность ответов и рекомендации.', 'Алғашқы жаттығудан кейін тақырыптар, жауап дәлдігі және ұсыныстар көрінеді.')}</p></div>}
    </section>

    <div className="pdr-history-grid">
      <section className="pd-panel pdr-diagnostic">
        <div className="pd-panel-head"><div><span className="pd-eyebrow">SYNAQ DIAGNOSTIC</span><h3>{text('Диагностика знаний', 'Білім диагностикасы')}</h3></div><span className="pd-icon" aria-hidden="true">◎</span></div>
        {diagnostic ? <>
          <div className="pdr-diagnostic-result"><div className="pdr-score-ring" style={{ '--score': `${Math.max(0, Math.min(100, diagnostic.readiness || 0)) * 3.6}deg` }}><strong>{diagnostic.readiness}%</strong><span>{text('по диагностике', 'диагностикада')}</span></div><div><strong>{diagnostic.correct}/{diagnostic.total}</strong><p>{text('правильных ответов', 'дұрыс жауап')}</p><small>{dateLabel(diagnostic)}</small></div></div>
          <div className="pdr-diagnostic-topics">{(diagnostic.topics || []).filter(topic => topic.level !== 'strong').slice(0, 3).map(topic => <div key={topic.moduleId}><span>{topic.title?.[lang]}</span><strong>{topic.pct}%</strong></div>)}</div>
          <p className="pdr-diagnostic-next">{days ? text(`Следующая проверка через ${days} дн.`, `Келесі тексеруге ${days} күн қалды.`) : text('Можно пройти повторную диагностику.', 'Диагностиканы қайта өтуге болады.')}</p>
          <div className="pdr-diagnostic-history">{diagnostics.slice(0, 6).reverse().map((item, index) => <div key={item.id || index}><strong>{item.readiness}%</strong><small>{dateLabel(item)}</small></div>)}</div>
          <a className="pdr-share" href={`https://wa.me/?text=${encodeURIComponent(buildDiagnosticShareText(diagnostic, child.name, lang))}`} target="_blank" rel="noreferrer">{text('Поделиться результатом', 'Нәтижемен бөлісу')} · WhatsApp ↗</a>
        </> : <div className="pdr-empty pdr-empty-compact"><span aria-hidden="true">◎</span><h3>{text('Познакомимся с сильными сторонами', 'Мықты тұстарымен танысайық')}</h3><p>{text('После диагностики в кабинете ребёнка здесь появится результат и темы для повторения.', 'Баланың кабинетіндегі диагностикадан кейін нәтиже мен қайталау тақырыптары көрінеді.')}</p></div>}
      </section>
      <section className="pd-panel"><div className="pd-panel-head"><div><span className="pd-eyebrow">{text('Путь к результату', 'Нәтижеге жету жолы')}</span><h3>{text('История пробных тестов', 'Сынақтар тарихы')}</h3></div><span className="pd-icon" aria-hidden="true">✓</span></div>
        {mocks.length ? <div className="pdr-test-list">{mocks.map((mock, index) => <article key={mock.id || index}><span className="pdr-test-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{mock.school || text('Пробный тест', 'Сынақ')}</strong><small>{dateLabel(mock)}</small></div><span className="pdr-test-score">{mock.score ?? 0}/{mock.gradable ?? '—'}<small>{text('баллов', 'балл')}</small></span></article>)}</div> : <div className="pdr-empty pdr-empty-compact"><span aria-hidden="true">✓</span><h3>{text('Первый пробник ещё впереди', 'Алғашқы сынақ әлі алда')}</h3><p>{text('Когда ребёнок пройдёт тест, здесь появятся дата, школа и набранные баллы.', 'Балаңыз сынақтан өткен соң, күні, мектебі және жинаған ұпайы көрсетіледі.')}</p></div>}
      </section>
    </div>
  </main>;
}
