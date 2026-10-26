import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { MENTOR_TOPICS } from '../mentorTopics.generated.js';
import { lessonsCall, lessonError, fmtDay, fmtTime, dayKey } from '../lessonsApi.js';
import BrandLoader from './BrandLoader.jsx';
import useScreenStart from '../useScreenStart.js';
import { auth } from '../firebase.js';
import { openLesson } from '../openLesson.js';
import './Mentor.css';

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
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [lessonLink, setLessonLink] = useState(null);
  const mounted = useRef(false);
  const requests = useRef(0);
  const selectionRequest = useRef(0);
  const busyRef = useRef(false);
  const topicName = MATH.find(t => t.id === topic)?.[lang === 'ru' ? 'nameRu' : 'name'] || '';
  useScreenStart(`mentor:${step}:${data?.plan?.active === true}`);

  const load = useCallback(async () => {
    const ticket = ++requests.current, uid = auth.currentUser?.uid;
    const current = () => mounted.current && ticket === requests.current && auth.currentUser?.uid === uid;
    try { const next = await lessonsCall({ action: 'overview' }); if (current()) { setData(next); setError(''); } }
    catch (e) { if (current()) setError(e.message); }
  }, []);
  useEffect(() => {
    mounted.current = true; load(); const id = setInterval(load, 60000);
    return () => { mounted.current = false; requests.current++; selectionRequest.current++; clearInterval(id); };
  }, [load]);

  const startBooking = async () => {
    const ticket = ++selectionRequest.current, uid = auth.currentUser?.uid;
    const current = () => mounted.current && ticket === selectionRequest.current && auth.currentUser?.uid === uid;
    setStep('topic'); setTopic(''); setPicked([]); setUnclear([]); setMentor(null); setSelectedSlot(null); setError(''); setNotice(''); setLessonLink(null);
    try { const result = await lessonsCall({ action: 'unclear_list' }); if (current()) setUnclear(result.tasks || []); }
    catch { if (current()) setUnclear([]); }
  };
  const chooseMentor = async (m) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const ticket = ++selectionRequest.current, uid = auth.currentUser?.uid;
    const current = () => mounted.current && ticket === selectionRequest.current && auth.currentUser?.uid === uid;
    setMentor(m); setSlots([]); setSelectedSlot(null); setBusy(true); setError('');
    try { const result = await lessonsCall({ action: 'slots', mentorId: m.id }); if (current()) { setSlots(result.slots || []); setStep('time'); } }
    catch (e) { if (current()) setError(e.message); }
    finally { busyRef.current = false; if (current()) setBusy(false); }
  };
  const book = async (startAt) => {
    if (busyRef.current || !mentor || !slots.includes(startAt) || !topicName) return;
    busyRef.current = true;
    const uid = auth.currentUser?.uid;
    const current = () => mounted.current && auth.currentUser?.uid === uid;
    setBusy(true); setError(''); setLessonLink(null);
    try {
      await lessonsCall({ action: 'book', mentorId: mentor.id, startAt, topic: topicName, taskIds: picked.map((p) => p.qid) });
      if (!current()) return;
      for (const p of picked) lessonsCall({ action: 'unclear_remove', key: p.key }).catch(() => {});
      setNotice(text('Вы записаны! Ссылка откроется за 10 минут до урока.', 'Жазылдыңыз! Сілтеме сабаққа 10 минут қалғанда ашылады.'));
      setStep('home'); await load();
    } catch (e) {
      if (!current()) return;
      setError(e.message);
      if (['slot_taken', 'slot_unavailable'].includes(e.message)) {
        setSelectedSlot(null); setSlots([]);
        try { const result = await lessonsCall({ action: 'slots', mentorId: mentor.id }); if (current()) setSlots(result.slots || []); } catch { /* keep the original actionable error */ }
      }
      if (['no_credits', 'mentor_plan_required'].includes(e.message)) await load();
    } finally { busyRef.current = false; if (current()) setBusy(false); }
  };
  const act = async (body) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const uid = auth.currentUser?.uid;
    const current = () => mounted.current && auth.currentUser?.uid === uid;
    setBusy(true); setError(''); setLessonLink(null);
    try {
      if (body.action === 'join') {
        const url = await openLesson(lessonsCall, body.id, { current });
        if (current()) setLessonLink(url);
      } else {
        await lessonsCall(body);
        if (!current()) return;
        if (body.action === 'complain') setNotice(text('Спасибо, мы получили жалобу.', 'Рақмет, шағымыңыз қабылданды.'));
        await load();
      }
    } catch (e) { if (current()) setError(e.message); }
    finally { busyRef.current = false; if (current()) setBusy(false); }
  };
  const cancel = async (lesson) => {
    const msg = lesson.freeCancel
      ? text('Отменить урок? Он вернётся в ваш пакет.', 'Сабақты болдырмау керек пе? Ол пакетке қайтады.')
      : text('До урока меньше 24 часов — урок сгорит. Всё равно отменить?', 'Сабаққа 24 сағаттан аз — сабақ жанып кетеді. Бәрібір болдырмаймыз ба?');
    if (!window.confirm(msg)) return;
    await act({ action: 'cancel', id: lesson.id });
  };
  const complain = async (id) => {
    const message = window.prompt(text('Что случилось? Мы разберёмся.', 'Не болды? Біз анықтаймыз.'));
    if (!message?.trim()) return;
    await act({ action: 'complain', id, text: message });
  };

  const days = useMemo(() => {
    const map = new Map();
    for (const s of slots) { const k = dayKey(s); map.set(k, [...(map.get(k) || []), s]); }
    return [...map.values()];
  }, [slots]);

  if (!data) return <main className="mentor-page">{error ? <section className="mentor-error" role="alert"><h1>{text('Не удалось загрузить уроки', 'Сабақтар жүктелмеді')}</h1><p>{lessonError(error, text)}</p><button className="btn" type="button" onClick={load}>{text('Повторить', 'Қайталау')}</button></section> : <BrandLoader />}</main>;
  const { plan, lessons, mentors } = data;
  const now = data.now;
  const upcoming = lessons.filter((l) => l.status === 'booked' && l.endAt > now).sort((a, b) => a.startAt - b.startAt);
  const past = lessons.filter((l) => !upcoming.includes(l));
  const statusLabel = { completed: text('проведён', 'өтті'), no_show_child: text('вы не пришли', 'сіз келмедіңіз'), no_show_mentor: text('наставник не пришёл — урок вернулся', 'тәлімгер келмеді — сабақ қайтарылды'),
    cancelled: text('отменён', 'болдырылмады'), cancelled_late: text('отменён поздно', 'кеш болдырылмады'), booked: text('записан', 'жазылған') };

  if (!plan.active) return (
    <main className="mentor-page">
      <section className="mentor-intro" aria-labelledby="mentor-intro-title"><div><span className="mentor-tag">{text('SYNAQ · НАСТАВНИК', 'SYNAQ · ТӘЛІМГЕР')}</span><h1 id="mentor-intro-title">{text('Разберём сложное вместе', 'Қиын тақырыпты бірге түсінейік')}</h1><p>{text('Индивидуальные уроки математики по 40 минут. Свои вопросы, понятное объяснение и поддержка наставника.', '40 минуттық жеке математика сабақтары. Өз сұрақтарың, түсінікті жауап және тәлімгер қолдауы.')}</p><button type="button" onClick={onUpgrade}>{text('Посмотреть тарифы', 'Тарифтерді қарау')}<span aria-hidden="true">→</span></button><small>{text('Живые уроки доступны в Pro с наставником.', 'Жеке сабақтар тәлімгермен Pro тарифінде қолжетімді.')}</small></div><img src="/mascot/synaq-owl-study.webp" width="640" height="640" alt="" /></section>
      <div className="mentor-benefits">{[
        [text('Твоя тема', 'Өзің таңдаған тақырып'), text('Повтори сложный раздел или принеси задачу, с которой нужна помощь.', 'Қиын бөлімді қайтала немесе көмек керек есепті әкел.')],
        [text('Удобное время', 'Ыңғайлы уақыт'), text('Выбери наставника и свободное время в расписании.', 'Тәлімгерді және кестедегі бос уақытты таңда.')],
        [text('Один на один', 'Жеке қолдау'), text('40 минут внимания твоим вопросам и способу решения.', 'Сұрақтарың мен шешу жолына арналған 40 минут.')],
      ].map(([title, copy], index) => <article key={title}><span aria-hidden="true">0{index + 1}</span><h2>{title}</h2><p>{copy}</p></article>)}</div>
    </main>
  );

  return (
    <main className="mentor-page">
      <p className="kicker">{text('НАСТАВНИК', 'ТӘЛІМГЕР')}</p>
      <h1>{text('Уроки с наставником', 'Тәлімгермен сабақтар')}</h1>
      {step !== 'home' && <ol className="mentor-booking-steps" aria-label={text('Этапы записи', 'Жазылу қадамдары')}>{[['topic', text('Тема', 'Тақырып')], ['mentor', text('Наставник', 'Тәлімгер')], ['time', text('Время', 'Уақыт')]].map(([id, label], index) => <li key={id} aria-current={step === id ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>}
      {error && <p className="card" role="alert" style={{ color: 'var(--accent)' }}>{lessonError(error, text)}</p>}
      {notice && <p className="card" role="status">{notice}</p>}
      {lessonLink && <p className="card" role="status"><a href={lessonLink} target="_blank" rel="noopener noreferrer">{text('Открыть видеосвязь с наставником', 'Тәлімгермен бейнебайланысты ашу')}</a></p>}

      {step === 'home' && <>
        <div className="card" style={{ marginTop: 12 }}>
          <b>{text(`Осталось уроков: ${plan.left} из ${plan.quota}`, `Қалған сабақ: ${plan.left} / ${plan.quota}`)}</b>
          <p className="muted" style={{ margin: '4px 0 12px' }}>{text('Запись — не позже чем за 12 часов. Бесплатная отмена — за 24 часа.', 'Жазылу — кемінде 12 сағат бұрын. Тегін болдырмау — 24 сағат бұрын.')}</p>
          <button className="btn accent" type="button" disabled={busy || plan.left < 1} onClick={startBooking}>{text('Записаться на урок', 'Сабаққа жазылу')}</button>
        </div>
        <h2 style={{ marginTop: 24 }}>{text('Ближайшие уроки', 'Жақын сабақтар')}</h2>
        {!upcoming.length && <p className="muted">{text('Пока нет записей.', 'Әзірге жазылым жоқ.')}</p>}
        {upcoming.map((l) => (
          <div className="card" key={l.id} style={{ marginBottom: 10 }}>
            <b>{fmtDay(l.startAt, lang)}, {fmtTime(l.startAt)}</b> · {l.mentorName}
            <div className="muted">{l.topic}{l.taskIds.length ? ` · ${text('задач', 'есеп')}: ${l.taskIds.length}` : ''}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button className="btn accent" type="button" disabled={busy || !l.canJoin} onClick={() => act({ action: 'join', id: l.id })}>{l.canJoin ? text('Войти на урок', 'Сабаққа кіру') : text('Ссылка откроется за 10 минут', 'Сілтеме 10 минутта ашылады')}</button>
              {l.canCancel && <button className="btn ghost" type="button" disabled={busy} onClick={() => cancel(l)}>{text('Отменить', 'Болдырмау')}</button>}
            </div>
          </div>))}
        {!!past.length && <><h2 style={{ marginTop: 24 }}>{text('Прошедшие', 'Өткен')}</h2>
          {past.slice(0, 10).map((l) => (
            <div className="card" key={l.id} style={{ marginBottom: 10 }}>
              <b>{fmtDay(l.startAt, lang)}, {fmtTime(l.startAt)}</b> · {l.mentorName} <span className="tag">{statusLabel[l.status] || l.status}</span>
              <div className="muted">{l.topic}</div>
              {l.status === 'completed' && (l.rating
                ? <div style={{ marginTop: 6 }}>{stars(l.rating)}</div>
                : <div style={{ marginTop: 8 }}>{text('Оцените урок: ', 'Сабақты бағалаңыз: ')}{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className="btn ghost" style={{ padding: '2px 8px' }} disabled={busy} onClick={() => act({ action: 'rate', id: l.id, stars: n })}>{n}★</button>)}</div>)}
              {['completed', 'no_show_child', 'no_show_mentor'].includes(l.status) && !l.complained
                && <button type="button" className="btn ghost" style={{ marginTop: 8 }} disabled={busy} onClick={() => complain(l.id)}>{text('Пожаловаться', 'Шағымдану')}</button>}
            </div>))}</>}
      </>}

      {step === 'topic' && <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>{text('1. Какая тема?', '1. Қай тақырып?')}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MATH.map((t) => { const name = lang === 'ru' ? t.nameRu : t.name;
            return <button key={t.id} type="button" aria-pressed={topic === t.id} className={`btn ${topic === t.id ? 'accent' : 'ghost'}`} onClick={() => setTopic(t.id)}>{name}</button>; })}
        </div>
        {!!unclear.length && <><h3>{text('Задачи, которые вы не поняли (по желанию)', 'Түсінбеген есептер (қалауыңыз бойынша)')}</h3>
          {unclear.map((u) => { const on = picked.some((p) => p.key === u.key);
            return <label key={u.key} style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
              <input type="checkbox" checked={on} disabled={!on && picked.length >= 10} onChange={() => setPicked((p) => on ? p.filter((x) => x.key !== u.key) : [...p, u])} />
              <span>{u.preview || u.qid}</span></label>; })}</>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn ghost" type="button" onClick={() => setStep('home')}>{text('Назад', 'Артқа')}</button>
          <button className="btn accent" type="button" disabled={busy || !topic} onClick={() => setStep('mentor')}>{text('Дальше', 'Әрі қарай')}</button>
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
        <button className="btn ghost" type="button" disabled={busy} onClick={() => setStep('topic')}>{text('Назад', 'Артқа')}</button>
      </div>}

      {step === 'time' && <div style={{ marginTop: 12 }}>
        <h2>{text(`3. Время у наставника ${mentor.name}`, `3. ${mentor.name} тәлімгердің уақыты`)}</h2>
        <section className="mentor-booking-summary" aria-live="polite"><div><strong>{selectedSlot ? `${fmtDay(selectedSlot, lang)} · ${fmtTime(selectedSlot)}` : text('Выбери удобное время', 'Ыңғайлы уақытты таңда')}</strong><p>{selectedSlot ? `${topicName} · ${text('40 минут · 1 урок из пакета', '40 минут · пакеттен 1 сабақ')}` : text('Сначала выбери время, затем подтверди запись.', 'Алдымен уақытты таңдап, содан кейін жазылуды раста.')}</p></div><button type="button" className="btn accent" disabled={!selectedSlot || busy} onClick={() => book(selectedSlot)}>{busy ? text('Записываем…', 'Жазылуда…') : text('Подтвердить запись', 'Жазылуды растау')}</button></section>
        {!days.length && <p className="muted">{text('Свободных окон пока нет.', 'Бос уақыт әзірге жоқ.')}</p>}
        <div className="mentor-slots">
        {days.map((list) => (
          <div className="card mentor-slot-card" key={list[0]}>
            <b>{fmtDay(list[0], lang)}</b>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {list.map((s) => <button key={s} type="button" className="btn ghost" aria-pressed={selectedSlot === s} aria-label={`${fmtDay(s, lang)}, ${fmtTime(s)}`} disabled={busy} onClick={() => setSelectedSlot(s)}>{fmtTime(s)}</button>)}
            </div>
          </div>))}
        </div>
        <button className="btn ghost" type="button" disabled={busy} onClick={() => setStep('mentor')}>{text('Назад', 'Артқа')}</button>
      </div>}
    </main>
  );
}
