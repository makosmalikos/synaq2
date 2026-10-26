import React, { useCallback, useEffect, useRef, useState } from 'react';
import BrandLoader from './components/BrandLoader.jsx';
import { useLang } from './i18n.jsx';
import { lessonsCall, lessonError, fmtDay, fmtTime } from './lessonsApi.js';
import { auth } from './firebase.js';
import { openLesson } from './openLesson.js';

// Родитель видит записи ребёнка, может открыть ссылку, отменить урок или пожаловаться.
export default function ParentLessons() {
  const { lang } = useLang();
  const text = (ru, kk) => (lang === 'ru' ? ru : kk);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lessonLink, setLessonLink] = useState(null);
  const acting = useRef(false);
  const mounted = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const ticket = ++generation.current;
    const uid = auth.currentUser?.uid;
    const current = () => mounted.current && ticket === generation.current && auth.currentUser?.uid === uid;
    try { const next = await lessonsCall({ action: 'overview' }); if (current()) { setData(next); setError(''); } }
    catch (e) { if (current()) setError(e.message); }
  }, [lang]);
  useEffect(() => { mounted.current = true; load(); const id = setInterval(load, 60000); return () => { mounted.current = false; generation.current++; clearInterval(id); }; }, [load]);
  if (!data) return <div className="parent-lessons card">{error ? <div role="alert"><p>{lessonError(error, text)}</p><button type="button" className="btn" onClick={load}>{text('Повторить', 'Қайталау')}</button></div> : <BrandLoader compact />}</div>;
  const act = async (body) => {
    if (acting.current) return;
    const uid = auth.currentUser?.uid;
    const current = () => mounted.current && auth.currentUser?.uid === uid;
    acting.current = true; setBusy(true); setError(''); setLessonLink(null);
    try {
      if (body.action === 'join') {
        const url = await openLesson(lessonsCall, body.id, { current });
        if (current()) setLessonLink(url);
      } else { await lessonsCall(body); if (current()) await load(); }
    } catch (e) { if (current()) setError(e.message); }
    finally { acting.current = false; if (current()) setBusy(false); }
  };
  const { plan, lessons, now } = data;
  const upcoming = lessons.filter((l) => l.status === 'booked' && l.endAt > now).sort((a, b) => a.startAt - b.startAt);
  const done = lessons.filter((l) => l.status === 'completed').length;
  return (
    <div className="card parent-lessons">
      <span className="parent-eyebrow">{text('Личная поддержка', 'Жеке қолдау')}</span><h2>{text('Уроки с наставником', 'Тәлімгермен сабақтар')}</h2>
      <p style={{ margin: '6px 0 12px' }}>{text(`Осталось уроков в этом месяце: ${plan.left} из ${plan.quota}. Записывается ребёнок в своём кабинете.`, `Осы айда қалған сабақ: ${plan.left} / ${plan.quota}. Баланың өз кабинетінде жазылады.`)}</p>
      {error && <p role="alert" style={{ color: 'var(--accent)' }}>{lessonError(error, text)}</p>}
      {lessonLink && <p role="status"><a href={lessonLink} target="_blank" rel="noopener noreferrer">{text('Открыть видеосвязь с наставником', 'Тәлімгермен бейнебайланысты ашу')}</a></p>}
      {!upcoming.length && <div className="parent-lessons-empty"><strong>{text('Пока нет запланированных уроков', 'Әзірге жоспарланған сабақ жоқ')}</strong><p>{text('Ребёнок может выбрать тему, наставника и время в своём кабинете. После записи урок появится здесь.', 'Балаңыз өз кабинетінде тақырып, тәлімгер және уақыт таңдай алады. Жазылған сабақ осы жерде көрінеді.')}</p></div>}
      {upcoming.map((l) => (
        <div key={l.id} style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
          <b>{fmtDay(l.startAt, lang)}, {fmtTime(l.startAt)}</b> · {l.mentorName}
          <div className="muted">{l.topic}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn" type="button" disabled={busy || !l.canJoin} onClick={() => act({ action: 'join', id: l.id })}>
              {l.canJoin ? text('Открыть урок', 'Сабақты ашу') : text('Ссылка за 10 минут до урока', 'Сілтеме 10 минут бұрын')}</button>
            {l.canCancel && <button className="btn ghost" type="button" disabled={busy} onClick={() => {
              if (window.confirm(l.freeCancel ? text('Отменить урок? Он вернётся в пакет.', 'Сабақты болдырмау керек пе? Ол пакетке қайтады.') : text('До урока меньше 24 часов — урок сгорит. Отменить?', 'Сабаққа 24 сағаттан аз — сабақ жанады. Болдырамыз ба?'))) act({ action: 'cancel', id: l.id });
            }}>{text('Отменить', 'Болдырмау')}</button>}
          </div>
        </div>))}
      <p className="muted" style={{ margin: '12px 0 0' }}>{text(`Проведено уроков: ${done}`, `Өткен сабақ: ${done}`)}</p>
    </div>
  );
}
