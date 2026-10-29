import React, { useEffect, useRef, useState } from 'react';
import { centerCall, centerError, almatyInput, almatyTime } from './centerApi.js';
import './CenterWorkspace.css';

export default function AdminCenters({ lang }) {
  const text = (ru, kk) => lang === 'ru' ? ru : kk;
  const [centers, setCenters] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false);
  const alive = useRef(true), lock = useRef(false);
  const load = async () => { const data = await centerCall({ action: 'admin_list' }); if (alive.current) { setCenters(data.centers); setLoaded(true); } };
  const run = async (fn) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await fn(); } catch (e) { if (alive.current) setError(centerError(e, lang)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  useEffect(() => { alive.current = true; run(load); return () => { alive.current = false; }; }, []);
  return <section className="cw-admin"><h1>{text('Образовательные центры', 'Білім беру орталықтары')}</h1><p>{text('Ручная активация лицензий после согласования условий с центром. Включает тренировки, школьную программу и пробники. Оплата здесь не списывается.', 'Орталықпен шарттар келісілгеннен кейін лицензия қолмен қосылады. Жаттығулар, мектеп бағдарламасы және сынақтар кіреді. Мұнда төлем алынбайды.')}</p><button className="btn" disabled={busy} onClick={() => run(load)}>{text('Обновить список', 'Тізімді жаңарту')}</button>{error && <p role="alert" className="cw-alert">{error}</p>}{!loaded && !error && <p role="status">{text('Загрузка…', 'Жүктелуде…')}</p>}{loaded && !centers.length && <p>{text('Центры пока не зарегистрированы.', 'Орталықтар әлі тіркелмеген.')}</p>}<div className="cw-admin-grid">{centers.map(c => <License key={`${c.id}:${c.license?.updatedAt || 0}`} center={c} busy={busy} text={text} save={body => run(async () => { await centerCall(body); await load(); })} />)}</div></section>;
}
function License({ center, busy, text, save }) {
  const [seats, setSeats] = useState(center.license?.seatLimit || Math.max(30, center.studentCount));
  const [expiry, setExpiry] = useState(almatyInput(Math.max(center.license?.expiresAt || 0, Date.now() + 30 * 86400000)));
  const [active, setActive] = useState(center.license?.active || false);
  return <article className="cw-panel"><h2>{center.name}</h2><p>{center.ownerEmail}<br />{center.studentCount} {text('учеников', 'оқушы')} · {center.groupCount} {text('групп', 'топ')}</p><form onSubmit={e => { e.preventDefault(); save({ action: 'license', centerId: center.id, active, seatLimit: Number(seats), expiresAt: almatyTime(expiry) }); }}><label>{text('Количество мест (до 100)', 'Орын саны (100-ге дейін)')}<input type="number" required min={Math.max(1, center.studentCount)} max="100" value={seats} onChange={e => setSeats(e.target.value)} /></label><label>{text('Доступ до · Алматы', 'Қолжетімділік мерзімі · Алматы')}<input required type="datetime-local" value={expiry} onChange={e => setExpiry(e.target.value)} /></label><label><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />{text('Лицензия активна', 'Лицензия белсенді')}</label><button className="btn accent" disabled={busy}>{text('Сохранить лицензию', 'Лицензияны сақтау')}</button></form></article>;
}
