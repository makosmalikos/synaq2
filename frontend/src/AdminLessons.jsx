import React, { useCallback, useEffect, useState } from 'react';
import { auth } from './firebase.js';
import { POOL } from './bank.js';
import { fmtDay, fmtTime } from './lessonsApi.js';

async function api(method, { body, query = '' } = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('login_required');
  const response = await fetch(`/api/admin-lessons${query}`, { method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'failed');
  return data;
}

// Админка уроков: кто, когда, что не так; выплаты наставникам за месяц.
export default function AdminLessons({ lang }) {
  const text = (ru, kk) => (lang === 'ru' ? ru : kk);
  const [lessons, setLessons] = useState([]);
  const [payouts, setPayouts] = useState(null);
  const [month, setMonth] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty' }).format(new Date()).slice(0, 7));
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      setLessons((await api('GET')).lessons || []);
      setPayouts(await api('GET', { query: `?view=payouts&month=${month}` }));
      setError('');
    } catch { setError(text('Не удалось загрузить уроки.', 'Сабақтарды жүктеу мүмкін болмады.')); }
  }, [month]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  const mark = async (id, status) => {
    try { await api('POST', { body: { id, status } }); await load(); } catch { setError(text('Не удалось сохранить отметку.', 'Белгіні сақтау мүмкін болмады.')); }
  };
  const label = { booked: text('записан', 'жазылған'), completed: text('проведён', 'өтті'), no_show_child: text('ребёнок не пришёл', 'бала келмеді'),
    no_show_mentor: text('наставник не пришёл', 'тәлімгер келмеді'), cancelled: text('отменён', 'болдырылмады'), cancelled_late: text('отменён поздно', 'кеш болдырылмады') };
  const statement = (qid) => POOL.find((q) => q.id === qid)?.statement?.slice(0, 80) || qid;
  const kzt = (n) => `${new Intl.NumberFormat('ru-RU').format(n)} ₸`;

  return (
    <section className="aw">
      <h1 style={{ margin: '0 0 12px' }}>{text('Уроки и выплаты', 'Сабақтар мен төлемдер')}</h1>
      {error && <div className="card" style={{ color: 'var(--accent)', marginBottom: 12 }}>{error}</div>}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <b>{text('Выплаты наставникам за', 'Тәлімгерлерге төлем:')}</b>
          <input type="month" style={{ width: 'auto', margin: 0 }} value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        {payouts && (payouts.mentors.length
          ? <>{payouts.mentors.map((m) => <div key={m.mentorId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--line)' }}>
              <span>{m.mentorName} · {m.lessons} {text('уроков', 'сабақ')}</span><b>{kzt(m.amountKzt)}</b></div>)}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}><b>{text('Итого', 'Барлығы')}</b><b>{kzt(payouts.totalKzt)}</b></div></>
          : <p className="muted" style={{ margin: '8px 0 0' }}>{text('Оплачиваемых уроков нет.', 'Төленетін сабақ жоқ.')}</p>)}
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>{text('Оплачиваются проведённые уроки и неявка ребёнка. Если наставник не пришёл — не оплачивается. Прошедший урок без отметки считается проведённым.', 'Өткен сабақ және баланың келмеуі төленеді. Тәлімгер келмесе — төленбейді. Белгісіз өткен сабақ өткен деп саналады.')}</p>
      </div>
      <h2>{text('Все записи', 'Барлық жазылымдар')}</h2>
      {!lessons.length && <div className="card"><p className="muted" style={{ margin: 0 }}>{text('Записей пока нет.', 'Жазылым әзірге жоқ.')}</p></div>}
      <div style={{ display: 'grid', gap: 10 }}>
        {lessons.map((l) => (
          <article className="card" key={l.id} style={{ borderColor: l.complaint ? '#DC2626' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div><b>{fmtDay(l.startAt, lang)}, {fmtTime(l.startAt)}</b> · {l.childName || '—'} → {l.mentorName}</div>
              <span className="tag">{label[l.status] || l.status}</span>
            </div>
            <div className="muted">{l.topic}{l.rating ? ` · ★${l.rating}${l.ratingComment ? ` «${l.ratingComment}»` : ''}` : ''}</div>
            {l.taskIds.length > 0 && <ul style={{ margin: '6px 0', paddingLeft: 18 }}>{l.taskIds.map((q) => <li key={q}>{statement(q)}</li>)}</ul>}
            {l.complaint && <p style={{ color: '#DC2626', margin: '6px 0' }}>{text('Жалоба', 'Шағым')} ({l.complaint.by === 'child' ? text('ребёнок', 'бала') : text('родитель', 'ата-ана')}): {l.complaint.text}</p>}
            {['booked', 'completed', 'no_show_child', 'no_show_mentor'].includes(l.markedStatus) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {['completed', 'no_show_child', 'no_show_mentor'].map((s) => <button key={s} type="button" className="btn ghost" disabled={l.status === s} onClick={() => mark(l.id, s)}>{label[s]}</button>)}
              </div>)}
          </article>))}
      </div>
    </section>
  );
}
