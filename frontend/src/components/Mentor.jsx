import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { MENTOR_TOPICS } from '../topicCatalog.generated.js';
import { lessonsCall, lessonError, fmtDay, fmtTime, dayKey } from '../lessonsApi.js';

const MATH = MENTOR_TOPICS;
const stars = (n) => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0));

// Экран ребёнка: запись на урок с наставником (только математика).
export default function Mentor({ onUpgrade }) {
  const { lang } = useLang();
  const text = (ru, kk) => (lang === 'ru' ? ru : kk);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('home');           // home → topic → mentor → time
  const [topic, setTopic] = useState('');
  const [unclear, setUnclear] = useState([]);
  const [picked, setPicked] = useState([]);
  const [mentor, setMentor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const fail = (e) => setError(lessonError(e.message, text));
  const load = useCallback(async () => {
    try { setData(await lessonsCall({ action: 'overview' })); setError(''); } catch (e) { fail(e); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);

  const startBooking = async () => {
    setStep('topic'); setTopic(''); setPicked([]); setMentor(null); setError(''); setNotice('');
    try { setUnclear((await lessonsCall({ action: 'unclear_list' })).tasks || []); } catch { setUnclear([]); }
  };
  const chooseMentor = async (m) => {
    setMentor(m); setBusy(true); setError('');
    try { setSlots((await lessonsCall({ action: 'slots', mentorId: m.id })).slots || []); setStep('time'); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };
  const book = async (startAt) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await lessonsCall({ action: 'book', mentorId: mentor.id, startAt, topic, taskIds: picked.map((p) => p.qid) });
      for (const p of picked) lessonsCall({ action: 'unclear_remove', key: p.key }).catch(() => {});
      setNotice(text('Вы записаны! Ссылка откроется за 10 минут до урока.', 'Жазылдыңыз! Сілтеме сабаққа 10 минут қалғанда ашылады.'));
      setStep('home'); await load();
    } catch (e) { fail(e); if (['slot_taken', 'slot_unavailable'].includes(e.message)) chooseMentor(mentor); }
    finally { setBusy(false); }
  };
  const join = async (id) => {
    setError('');
    try { const { url } = await lessonsCall({ action: 'join', id }); window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { fail(e); }
  };
  const cancel = async (lesson) => {
    const msg = lesson.freeCancel
      ? text('Отменить урок? Он вернётся в ваш пакет.', 'Сабақты болдырмау керек пе? Ол пакетке қайтады.')
      : text('До урока меньше 24 часов — урок сгорит. Всё равно отменить?', 'Сабаққа 24 сағаттан аз — сабақ жанып кетеді. Бәрібір болдырмаймыз ба?');
    if (!window.confirm(msg)) return;
    try { await lessonsCall({ action: 'cancel', id: lesson.id }); await load(); } catch (e) { fail(e); }
  };
  const rate = async (id, value) => { try { await lessonsCall({ action: 'rate', id, stars: value }); await load(); } catch (e) { fail(e); } };
  const complain = async (id) => {
    const message = window.prompt(text('Что случилось? Мы разберёмся.', 'Не болды? Біз анықтаймыз.'));
    if (!message?.trim()) return;
    try { await lessonsCall({ action: 'complain', id, text: message }); setNotice(text('Спасибо, мы получили жалобу.', 'Рақмет, шағымыңыз қабылданды.')); await load(); } catch (e) { fail(e); }
  };

  const days = useMemo(() => {
    const map = new Map();
    for (const s of slots) { const k = dayKey(s); map.set(k, [...(map.get(k) || []), s]); }
    return [...map.values()];
  }, [slots]);

  if (!data) return <main><p className="muted">{error || '…'}</p></main>;
  const { plan, lessons, mentors } = data;
  const now = data.now;
  const upcoming = lessons.filter((l) => l.status === 'booked' && l.endAt > now).sort((a, b) => a.startAt - b.startAt);
  const past = lessons.filter((l) => !upcoming.includes(l));
  const statusLabel = { completed: text('проведён', 'өтті'), no_show_child: text('вы не пришли', 'сіз келмедіңіз'), no_show_mentor: text('наставник не пришёл — урок вернулся', 'тәлімгер келмеді — сабақ қайтарылды'),
    cancelled: text('отменён', 'болдырылмады'), cancelled_late: text('отменён поздно', 'кеш болдырылмады'), booked: text('записан', 'жазылған') };

  if (!plan.active) return (
    <main>
      <p className="kicker">{text('НАСТАВНИК', 'ТӘЛІМГЕР')}</p>
      <h1>{text('Живые уроки математики', 'Математика бойынша тірі сабақтар')}</h1>
      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ marginTop: 0 }}>{text('Индивидуальные уроки по 40 минут с наставником. Вы выбираете тему, наставника и удобное время. Уроки доступны в тарифе Pro с наставником.', 'Тәлімгермен 40 минуттық жеке сабақтар. Тақырыпты, тәлімгерді және ыңғайлы уақытты өзіңіз таңдайсыз. Сабақтар тәлімгермен Pro тарифінде қолжетімді.')}</p>
        <button className="btn accent" type="button" onClick={onUpgrade}>{text('Посмотреть тарифы', 'Тарифтерді қарау')}</button>
      </div>
    </main>
  );

  return (
    <main>
      <p className="kicker">{text('НАСТАВНИК', 'ТӘЛІМГЕР')}</p>
      <h1>{text('Уроки с наставником', 'Тәлімгермен сабақтар')}</h1>
      {error && <p className="card" role="alert" style={{ color: 'var(--accent)' }}>{error}</p>}
      {notice && <p className="card" role="status">{notice}</p>}

      {step === 'home' && <>
        <div className="card" style={{ marginTop: 12 }}>
          <b>{text(`Осталось уроков: ${plan.left} из ${plan.quota}`, `Қалған сабақ: ${plan.left} / ${plan.quota}`)}</b>
          <p className="muted" style={{ margin: '4px 0 12px' }}>{text('Запись — не позже чем за 12 часов. Бесплатная отмена — за 24 часа.', 'Жазылу — кемінде 12 сағат бұрын. Тегін болдырмау — 24 сағат бұрын.')}</p>
          <button className="btn accent" type="button" disabled={plan.left < 1} onClick={startBooking}>{text('Записаться на урок', 'Сабаққа жазылу')}</button>
        </div>
        <h2 style={{ marginTop: 24 }}>{text('Ближайшие уроки', 'Жақын сабақтар')}</h2>
        {!upcoming.length && <p className="muted">{text('Пока нет записей.', 'Әзірге жазылым жоқ.')}</p>}
        {upcoming.map((l) => (
          <div className="card" key={l.id} style={{ marginBottom: 10 }}>
            <b>{fmtDay(l.startAt, lang)}, {fmtTime(l.startAt)}</b> · {l.mentorName}
            <div className="muted">{l.topic}{l.taskIds.length ? ` · ${text('задач', 'есеп')}: ${l.taskIds.length}` : ''}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button className="btn accent" type="button" disabled={!l.canJoin} onClick={() => join(l.id)}>{l.canJoin ? text('Войти на урок', 'Сабаққа кіру') : text('Ссылка откроется за 10 минут', 'Сілтеме 10 минутта ашылады')}</button>
              {l.canCancel && <button className="btn ghost" type="button" onClick={() => cancel(l)}>{text('Отменить', 'Болдырмау')}</button>}
            </div>
          </div>))}
        {!!past.length && <><h2 style={{ marginTop: 24 }}>{text('Прошедшие', 'Өткен')}</h2>
          {past.slice(0, 10).map((l) => (
            <div className="card" key={l.id} style={{ marginBottom: 10 }}>
              <b>{fmtDay(l.startAt, lang)}, {fmtTime(l.startAt)}</b> · {l.mentorName} <span className="tag">{statusLabel[l.status] || l.status}</span>
              <div className="muted">{l.topic}</div>
              {l.status === 'completed' && (l.rating
                ? <div style={{ marginTop: 6 }}>{stars(l.rating)}</div>
                : <div style={{ marginTop: 8 }}>{text('Оцените урок: ', 'Сабақты бағалаңыз: ')}{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className="btn ghost" style={{ padding: '2px 8px' }} onClick={() => rate(l.id, n)}>{n}★</button>)}</div>)}
              {['completed', 'no_show_child', 'no_show_mentor'].includes(l.status) && !l.complained
                && <button type="button" className="btn ghost" style={{ marginTop: 8 }} onClick={() => complain(l.id)}>{text('Пожаловаться', 'Шағымдану')}</button>}
            </div>))}</>}
      </>}

      {step === 'topic' && <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>{text('1. Какая тема?', '1. Қай тақырып?')}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MATH.map((t) => { const name = lang === 'ru' ? t.nameRu : t.name;
            return <button key={t.id} type="button" className={`btn ${topic === name ? 'accent' : 'ghost'}`} onClick={() => setTopic(name)}>{name}</button>; })}
        </div>
        {!!unclear.length && <><h3>{text('Задачи, которые вы не поняли (по желанию)', 'Түсінбеген есептер (қалауыңыз бойынша)')}</h3>
          {unclear.map((u) => { const on = picked.some((p) => p.key === u.key);
            return <label key={u.key} style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
              <input type="checkbox" checked={on} disabled={!on && picked.length >= 10} onChange={() => setPicked((p) => on ? p.filter((x) => x.key !== u.key) : [...p, u])} />
              <span>{u.preview || u.qid}</span></label>; })}</>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn ghost" type="button" onClick={() => setStep('home')}>{text('Назад', 'Артқа')}</button>
          <button className="btn accent" type="button" disabled={!topic} onClick={() => setStep('mentor')}>{text('Дальше', 'Әрі қарай')}</button>
        </div>
      </div>}

      {step === 'mentor' && <div style={{ marginTop: 12 }}>
        <h2>{text('2. Выберите наставника', '2. Тәлімгерді таңдаңыз')}</h2>
        {!mentors.length && <p className="muted">{text('Наставники скоро появятся.', 'Тәлімгерлер жақында қосылады.')}</p>}
        {mentors.map((m) => (
          <div className="card" key={m.id} style={{ marginBottom: 10 }}>
            <b>{m.name}</b> {m.id === data.previousMentorId && <span className="tag">{text('ваш прошлый наставник', 'сіздің бұрынғы тәлімгеріңіз')}</span>}
            <div>{m.rating ? <>{stars(m.rating)} <b>{m.rating}</b> <span className="muted">({m.ratingCount})</span></> : <span className="muted">{text('новый наставник', 'жаңа тәлімгер')}</span>}</div>
            {m.bio && <p className="muted" style={{ margin: '6px 0' }}>{m.bio}</p>}
            {m.comments.map((c, i) => <div key={i} className="muted" style={{ fontStyle: 'italic' }}>«{c}»</div>)}
            <button className="btn accent" type="button" style={{ marginTop: 10 }} disabled={busy} onClick={() => chooseMentor(m)}>{text('Выбрать', 'Таңдау')}</button>
          </div>))}
        <button className="btn ghost" type="button" onClick={() => setStep('topic')}>{text('Назад', 'Артқа')}</button>
      </div>}

      {step === 'time' && <div style={{ marginTop: 12 }}>
        <h2>{text(`3. Время у наставника ${mentor.name}`, `3. ${mentor.name} тәлімгердің уақыты`)}</h2>
        {!days.length && <p className="muted">{text('Свободных окон пока нет.', 'Бос уақыт әзірге жоқ.')}</p>}
        {days.map((list) => (
          <div className="card" key={list[0]} style={{ marginBottom: 10 }}>
            <b>{fmtDay(list[0], lang)}</b>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {list.map((s) => <button key={s} type="button" className="btn" disabled={busy} onClick={() => book(s)}>{fmtTime(s)}</button>)}
            </div>
          </div>))}
        <button className="btn ghost" type="button" onClick={() => setStep('mentor')}>{text('Назад', 'Артқа')}</button>
      </div>}
    </main>
  );
}
