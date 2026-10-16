import React, { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import { lessonsCall, fmtDay, fmtTime } from './lessonsApi.js';

// Напоминание ребёнку о ближайшем уроке: за сутки — плашка, за 10 минут — кнопка входа.
export default function LessonReminder({ go, tab }) {
  const { lang } = useLang();
  const [lesson, setLesson] = useState(null);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await lessonsCall({ action: 'overview' });
        if (!alive) return;
        setTick(data.now);
        setLesson(data.lessons.filter((l) => l.status === 'booked' && l.endAt > data.now).sort((a, b) => a.startAt - b.startAt)[0] || null);
      } catch { /* напоминание не должно мешать учёбе */ }
    };
    load();
    const id = setInterval(load, 120000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  if (!lesson || tab === 'mentor' || lesson.startAt - tick > 24 * 3600000) return null;
  const soon = lesson.canJoin;
  const text = lang === 'ru'
    ? (soon ? `Урок с наставником ${lesson.mentorName} уже скоро!` : `Урок с наставником ${lesson.mentorName}: ${fmtDay(lesson.startAt, lang)}, ${fmtTime(lesson.startAt)}`)
    : (soon ? `${lesson.mentorName} тәлімгермен сабақ жақында!` : `${lesson.mentorName} тәлімгермен сабақ: ${fmtDay(lesson.startAt, lang)}, ${fmtTime(lesson.startAt)}`);
  return <div className="card" role="status" style={{ margin: '12px 20px', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
    <b>{text}</b>
    <button className="btn accent" type="button" onClick={() => go('mentor')}>{soon ? (lang === 'ru' ? 'Войти' : 'Кіру') : (lang === 'ru' ? 'Открыть' : 'Ашу')}</button>
  </div>;
}
