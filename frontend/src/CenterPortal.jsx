import React from 'react';
import { centerDate, progressLabel } from './centerApi.js';
import './CenterPortal.css';

export function CenterScheduleList({ schedule = [], lang, compact = false }) {
  const ru = lang === 'ru', at = Date.now();
  const ordered = [...schedule].sort((a, b) => a.startsAt - b.startsAt);
  const events = compact ? ordered.filter(event => event.status !== 'cancelled' && event.endsAt > at).slice(0, 3) : ordered;
  return <div className="cp-schedule">{!events.length && <p className="cp-empty">{ru ? 'Ближайших занятий пока нет. Расписание появится, когда преподаватель его добавит.' : 'Әзірге алдағы сабақтар жоқ. Мұғалім қосқан кезде кесте пайда болады.'}</p>}{events.map(event => <article key={event.id} className={`cp-lesson ${event.status === 'cancelled' ? 'is-cancelled' : ''}`}>
    <div className="cp-lesson-time"><strong>{centerDate(event.startsAt, lang)}</strong><span>{ru ? 'до ' : 'дейін '}{new Intl.DateTimeFormat(ru ? 'ru-RU' : 'kk-KZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty' }).format(event.endsAt)}</span></div>
    <div><h3>{event.title}</h3><p>{event.location || (event.meetingUrl ? (ru ? 'Онлайн' : 'Онлайн') : (ru ? 'Место уточняется' : 'Орын нақтылануда'))}</p>{event.notes && <p>{event.notes}</p>}<span className="cp-tag">{event.status === 'cancelled' ? (ru ? 'Отменено' : 'Тоқтатылды') : event.endsAt <= at ? (ru ? 'Время занятия прошло' : 'Сабақ уақыты өтті') : event.startsAt <= at ? (ru ? 'Сейчас по расписанию' : 'Кесте бойынша қазір') : (ru ? 'Запланировано' : 'Жоспарланған')}</span></div>
    {event.meetingUrl && event.status !== 'cancelled' && event.endsAt > at && <a className="cp-link" href={event.meetingUrl} target="_blank" rel="noopener noreferrer">{ru ? 'Открыть урок ↗' : 'Сабақты ашу ↗'}</a>}
  </article>)}</div>;
}

export function CenterTasks({ data, lang, onTrainTopic, limit }) {
  const ru = lang === 'ru', progress = data.students[0]?.progress || {};
  const tasks = [...data.assignments].sort((a, b) => Number(!!progress[a.id]?.completedAt) - Number(!!progress[b.id]?.completedAt) || a.dueAt - b.dueAt);
  return <>{!tasks.length && <p className="cp-empty">{ru ? 'Новых заданий за последние 30 дней пока нет.' : 'Соңғы 30 күнде жаңа тапсырмалар жоқ.'}</p>}<div className="cp-task-grid">{tasks.slice(0, limit ?? tasks.length).map(a => {
    const p = progress[a.id]; if (!p) return null;
    return <article className="cp-task" key={a.id}><span className={`cw-status ${p.status}`}>{progressLabel(p.status, lang)}</span><h3>{a.title}</h3>{a.instructions && <p>{a.instructions}</p>}<small>{ru ? 'До ' : 'Мерзімі: '}{centerDate(a.dueAt, lang)}</small><progress value={p.answered} max={p.target} aria-label={ru ? 'Выполнение задания' : 'Тапсырманың орындалуы'} /><div className="cp-task-result"><strong>{p.answered}/{p.target}</strong><span>{p.accuracy == null ? (ru ? 'Ещё нет ответов' : 'Әлі жауап жоқ') : `${ru ? 'Точность' : 'Дәлдік'} ${p.accuracy}%`}</span></div>{onTrainTopic && <button className="cp-primary" onClick={() => onTrainTopic(a.topicId, p.completedAt ? null : { limit: p.target - p.answered, excludeIds: p.questionIds || [] })}>{p.completedAt ? (ru ? 'Повторить тему' : 'Тақырыпты қайталау') : (ru ? 'Выполнить задание' : 'Тапсырманы орындау')} →</button>}</article>;
  })}</div></>;
}

export default function CenterPortal({ data, lang, view = 'home', parent = false, name, onTrainTopic, onNavigate }) {
  const Heading = parent ? 'h2' : 'h1';
  const ru = lang === 'ru', e = data.enrollment, progress = data.students[0]?.progress || {};
  const completed = Object.values(progress).filter(p => p.completedAt).length;
  const overdue = Object.values(progress).filter(p => p.status === 'overdue').length;
  const titles = { home: parent ? (ru ? 'Как идут дела в центре' : 'Орталықтағы оқу барысы') : (ru ? `Привет, ${name || data.students[0]?.name || 'ученик'}!` : `Сәлем, ${name || data.students[0]?.name || 'оқушы'}!`), assignments: ru ? 'Задания моей группы' : 'Тобымның тапсырмалары', schedule: ru ? 'Расписание группы' : 'Топ кестесі', centerProgress: ru ? 'Прогресс в центре' : 'Орталықтағы нәтиже' };
  if (!e) return <p className="cp-empty">{ru ? 'Подключение к центру не найдено. Родитель может подключить ребёнка по коду группы.' : 'Орталыққа қосылу табылмады. Ата-ана баланы топ коды арқылы қоса алады.'}</p>;
  return <div className="center-portal">
    <header className={`cp-heading ${view === 'home' ? 'cp-hero' : ''}`}><span className="cp-eyebrow">{e.centerName} · {e.groupName}</span><Heading>{titles[view]}</Heading><p>{parent ? (ru ? `Ребёнок: ${name || data.students[0]?.name}. Расписание, задания и результаты — в одном месте.` : `Бала: ${name || data.students[0]?.name}. Кесте, тапсырмалар мен нәтижелер бір жерде.`) : (ru ? 'Твои занятия, задания преподавателя и маленькие победы.' : 'Сабақтарың, мұғалім тапсырмалары және шағын жеңістерің.')}</p>{e.teacherName && <small>{ru ? 'Преподаватель: ' : 'Мұғалім: '}{e.teacherName}</small>}{view === 'home' && <img src="/mascot/synaq-owl-study.webp" alt="" width="170" height="170" />}</header>
    {view === 'home' && <p className="cp-access">{e.licensed ? (ru ? 'Учебный доступ предоставляет центр.' : 'Оқу қолжетімділігін орталық береді.') : (ru ? 'Вы подключены к группе. Доступ к учебным материалам определяется семейным тарифом.' : 'Топқа қосылдыңыз. Оқу материалдарына қолжетімділік отбасы тарифіне байланысты.')}</p>}
    {data.scheduleTruncated && <p role="status" className="cw-alert">{ru ? 'Показана только часть расписания: слишком много записей, включая отменённые. Уточните остальные занятия у центра.' : 'Кесте толық көрсетілмеді: тоқтатылған сабақтарды қоса алғанда жазбалар тым көп. Қалған сабақтарды орталықтан нақтылаңыз.'}</p>}
    {data.students[0]?.truncated && <p role="status" className="cw-alert">{ru ? 'Показана часть ответов. Прогресс может быть неполным.' : 'Жауаптардың бір бөлігі көрсетілген. Нәтиже толық болмауы мүмкін.'}</p>}
    {(view === 'home' || view === 'centerProgress') && <><div className="cp-metrics"><article><span>{ru ? 'Выполнено заданий' : 'Орындалған тапсырмалар'}</span><strong>{completed}<small> / {data.assignments.length}</small></strong></article><article><span>{ru ? 'Осталось выполнить' : 'Орындау қалды'}</span><strong>{data.assignments.length - completed}</strong></article><article><span>{ru ? 'Просрочено' : 'Мерзімі өткен'}</span><strong>{overdue}</strong></article></div><p className="cp-note">{ru ? 'Задания за последние 30 дней. Точность ответов показана отдельно от выполнения.' : 'Соңғы 30 күндегі тапсырмалар. Жауап дәлдігі орындалудан бөлек көрсетілген.'}</p></>}
    {(view === 'home' || view === 'schedule') && <section className="cp-panel"><div className="cp-panel-head"><div><h2>{ru ? 'Занятия центра' : 'Орталық сабақтары'}</h2><p>{ru ? 'Время Алматы · изменения видны после обновления' : 'Алматы уақыты · өзгерістер жаңартудан кейін көрінеді'}</p></div>{view === 'home' && onNavigate && <button onClick={() => onNavigate('schedule')}>{ru ? 'Всё расписание →' : 'Толық кесте →'}</button>}</div><CenterScheduleList schedule={data.schedule} lang={lang} compact={view === 'home'} /></section>}
    {view !== 'schedule' && <section className="cp-panel"><div className="cp-panel-head"><div><h2>{parent ? (ru ? 'Задания ребёнка' : 'Баланың тапсырмалары') : (ru ? 'Задания преподавателя' : 'Мұғалім тапсырмалары')}</h2><p>{ru ? 'Разные задачи по теме после назначения. Время — Алматы.' : 'Берілгеннен кейінгі тақырыптағы әртүрлі есептер. Уақыт — Алматы.'}</p></div>{view === 'home' && onNavigate && <button onClick={() => onNavigate('assignments')}>{ru ? 'Все задания →' : 'Барлық тапсырмалар →'}</button>}</div><CenterTasks data={data} lang={lang} onTrainTopic={parent ? undefined : onTrainTopic} limit={view === 'home' ? 3 : undefined} /></section>}
  </div>;
}
