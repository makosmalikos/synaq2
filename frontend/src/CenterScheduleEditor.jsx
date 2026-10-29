import React, { useEffect, useRef, useState } from 'react';
import { almatyInput, almatyTime, centerDate } from './centerApi.js';

export default function CenterScheduleEditor({ schedule, group, lang, busy, onRun, onSave }) {
  const ru = lang === 'ru';
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const [editing, setEditing] = useState(null), [cancelId, setCancelId] = useState(null);
  const [title, setTitle] = useState(''), [start, setStart] = useState(() => almatyInput(Date.now() + 86400000));
  const [duration, setDuration] = useState(60), [weeks, setWeeks] = useState(1);
  const [location, setLocation] = useState(''), [meetingUrl, setMeetingUrl] = useState(''), [notes, setNotes] = useState('');
  const titleInput = useRef(null);
  useEffect(() => { if (editing) titleInput.current?.focus(); }, [editing]);
  const reset = () => { setEditing(null); setDraftId(crypto.randomUUID()); setTitle(''); setLocation(''); setMeetingUrl(''); setNotes(''); setWeeks(1); };
  const edit = event => {
    setEditing(event); setTitle(event.title); setStart(almatyInput(event.startsAt)); setDuration((event.endsAt - event.startsAt) / 60000);
    setLocation(event.location); setMeetingUrl(event.meetingUrl); setNotes(event.notes); setWeeks(1);
  };
  return <div className="cw-assignment-grid">
    <section className="cw-panel"><h2>{editing ? (ru ? 'Изменить занятие' : 'Сабақты өзгерту') : (ru ? 'Новое занятие' : 'Жаңа сабақ')}</h2><p>{ru ? 'Расписание увидят ученики группы и их родители. Все даты и время — Алматы.' : 'Кестені топ оқушылары мен олардың ата-аналары көреді. Барлық күн мен уақыт — Алматы.'}</p>
      <form onSubmit={event => { event.preventDefault(); onRun(async () => {
        const startsAt = almatyTime(start);
        await onSave({ action: editing ? 'schedule_update' : 'schedule_create', id: editing?.id || draftId,
          ...(editing ? { version: editing.version } : { weeks: Number(weeks) }), title, startsAt,
          endsAt: startsAt + Number(duration) * 60000, location, meetingUrl, notes }); reset();
      }); }}>
        <label>{ru ? 'Тема занятия' : 'Сабақ тақырыбы'}<input ref={titleInput} required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder={ru ? 'Математика · дроби' : 'Математика · бөлшектер'} /></label>
        <div className="cw-form-row"><label>{ru ? 'Начало · Алматы' : 'Басталуы · Алматы'}<input required type="datetime-local" value={start} min={almatyInput(Date.now())} max={almatyInput(Date.now() + 90 * 86400000)} onInput={e => setStart(e.currentTarget.value)} onChange={e => setStart(e.target.value)} /></label><label>{ru ? 'Длительность, минут' : 'Ұзақтығы, минут'}<input required type="number" min="15" max="240" value={duration} onChange={e => setDuration(e.target.value)} /></label></div>
        {!editing && <label>{ru ? 'Повторять каждую неделю' : 'Әр апта сайын қайталау'}<select value={weeks} onChange={e => setWeeks(e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i === 0 ? (ru ? 'Одно занятие' : 'Бір сабақ') : (ru ? `Всего занятий: ${i + 1}` : `${i + 1} апта · ${i + 1} сабақ`)}</option>)}</select></label>}
        <label>{ru ? 'Кабинет или адрес' : 'Кабинет немесе мекенжай'}<input maxLength={200} value={location} onChange={e => setLocation(e.target.value)} /></label>
        <label>{ru ? 'Ссылка на онлайн-урок (HTTPS)' : 'Онлайн сабаққа сілтеме (HTTPS)'}<input type="url" maxLength={500} placeholder="https://…" value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} /></label>
        <label>{ru ? 'Что нужно подготовить' : 'Не дайындау керек'}<textarea maxLength={1000} rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></label>
        <button className="cw-primary" disabled={busy || !group}>{editing ? (ru ? 'Сохранить изменения' : 'Өзгерістерді сақтау') : (ru ? 'Добавить в расписание' : 'Кестеге қосу')}</button>
        {editing && <button type="button" disabled={busy} onClick={reset}>{ru ? 'Отменить редактирование' : 'Өңдеуден бас тарту'}</button>}
      </form>
    </section>
    <section className="cw-panel"><h2>{ru ? 'Расписание группы' : 'Топ кестесі'}</h2><p>{ru ? 'Прошлая неделя и ближайшие 90 дней. Перенос или отмена меняет только выбранное занятие.' : 'Өткен апта және алдағы 90 күн. Өзгерту не тоқтату тек таңдалған сабаққа қатысты.'}</p>{!schedule?.length && <p className="cw-empty">{ru ? 'Занятия ещё не добавлены.' : 'Сабақтар әлі қосылмаған.'}</p>}
      {schedule?.map(event => <article className="cw-assignment" key={event.id}><span className="cw-eyebrow">{centerDate(event.startsAt, lang)} · {(event.endsAt - event.startsAt) / 60000} {ru ? 'мин' : 'мин'}</span><h3>{event.title}</h3><p>{event.location}</p>{event.status === 'cancelled' ? <small>{ru ? 'Отменено' : 'Тоқтатылды'}</small> : event.startsAt <= Date.now() ? <small>{ru ? 'Время занятия наступило' : 'Сабақ уақыты келді'}</small> : <div className="cw-toolbar-actions"><button disabled={busy} onClick={() => edit(event)}>{ru ? 'Изменить / перенести' : 'Өзгерту / ауыстыру'}</button><button disabled={busy} onClick={() => setCancelId(event.id)}>{ru ? 'Отменить занятие' : 'Сабақты тоқтату'}</button></div>}{cancelId === event.id && <div className="cw-alert"><span>{ru ? 'Ученики и родители увидят отмену этого занятия.' : 'Оқушылар мен ата-аналар сабақтың тоқтатылғанын көреді.'}</span><button disabled={busy} onClick={() => onRun(async () => { await onSave({ action: 'schedule_cancel', id: event.id, version: event.version }); setCancelId(null); if (editing?.id === event.id) reset(); })}>{ru ? 'Подтвердить отмену' : 'Тоқтатуды растау'}</button><button disabled={busy} onClick={() => setCancelId(null)}>{ru ? 'Оставить' : 'Қалдыру'}</button></div>}</article>)}
    </section>
  </div>;
}
