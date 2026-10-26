import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import { auth } from './firebase.js';
import { lessonsCall, fmtDay, fmtTime } from './lessonsApi.js';
import './Notifications.css';

// Колокольчик уведомлений для ребёнка и родителя. «Прочитано» хранится в браузере по ключу уведомления.
const readKey = (uid) => `synaq-notifications-read:${uid}`;
const loadRead = (uid) => { try { return new Set(JSON.parse(localStorage.getItem(readKey(uid))) || []); } catch { return new Set(); } };
const saveRead = (uid, set) => { try { localStorage.setItem(readKey(uid), JSON.stringify([...set].slice(-200))); } catch { /* без памяти браузера всё работает */ } };

export function notificationText(item, lang, role) {
  const ru = lang === 'ru';
  const when = item.startAt ? `${fmtDay(item.startAt, lang)}, ${fmtTime(item.startAt)}` : '';
  switch (item.kind) {
    case 'lesson_now': return ru ? `Урок с наставником ${item.mentorName} уже скоро — можно заходить!` : `${item.mentorName} тәлімгермен сабақ жақында — кіруге болады!`;
    case 'lesson_today': return ru ? `Скоро урок: ${when}, наставник ${item.mentorName}` : `Жақында сабақ: ${when}, тәлімгер ${item.mentorName}`;
    case 'book_prompt': return role === 'child'
      ? (ru ? `У вас осталось уроков: ${item.left}. Запишитесь на урок с наставником!` : `Қалған сабақ: ${item.left}. Тәлімгермен сабаққа жазылыңыз!`)
      : (ru ? `У ребёнка осталось уроков: ${item.left}. Напомните записаться.` : `Баланың қалған сабағы: ${item.left}. Жазылуды еске салыңыз.`);
    case 'period_ending': return ru ? `Пакет уроков заканчивается через ${item.days} дн., осталось уроков: ${item.left}` : `Сабақ пакеті ${item.days} күннен кейін бітеді, қалған сабақ: ${item.left}`;
    case 'rate_prompt': return ru ? `Оцените урок с наставником ${item.mentorName}` : `${item.mentorName} тәлімгермен сабақты бағалаңыз`;
    case 'credit_returned': return ru ? `Наставник ${item.mentorName} не пришёл — урок вернулся в пакет` : `${item.mentorName} тәлімгер келмеді — сабақ пакетке қайтарылды`;
    case 'plan_ending': return ru ? `Подписка заканчивается через ${item.days} дн.` : `Жазылым ${item.days} күннен кейін аяқталады`;
    default: return '';
  }
}

export default function Notifications({ role = 'child', onOpenLessons, onOpenPlan }) {
  const { lang } = useLang();
  const uid = auth.currentUser?.uid || '';
  const [items, setItems] = useState([]);
  const [read, setRead] = useState(() => loadRead(uid));
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const mounted = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const ticket = ++generation.current;
    try {
      const result = await lessonsCall({ action: 'notifications' });
      if (mounted.current && generation.current === ticket && auth.currentUser?.uid === uid) setItems(result.items || []);
    } catch { /* уведомления не должны мешать */ }
  }, [uid]);
  useEffect(() => {
    mounted.current = true;
    setItems([]); setRead(loadRead(uid)); setOpen(false);
    load(); const id = setInterval(load, 120000);
    return () => { mounted.current = false; generation.current++; clearInterval(id); };
  }, [load]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (box.current && !box.current.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const escape = e => { if (e.key === 'Escape') { setOpen(false); box.current?.querySelector('button')?.focus(); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  const unread = items.filter((item) => !read.has(item.key));
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
    if (!next && items.length) { const merged = new Set([...read, ...items.map((i) => i.key)]); setRead(merged); saveRead(uid, merged); }
  };
  return (
    <div ref={box} style={{ position: 'relative' }}>
      <button type="button" className="logout notification-trigger" onClick={toggle} aria-label={lang === 'ru' ? 'Уведомления' : 'Хабарландырулар'} aria-haspopup="dialog" aria-expanded={open}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1" /></svg>{unread.length > 0 && <b className="notification-badge">{unread.length}</b>}
      </button>
      {open && (
        <div className="card notifications-panel" role="dialog" aria-label={lang === 'ru' ? 'Уведомления' : 'Хабарландырулар'} onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); box.current?.querySelector('button')?.focus(); } }}>
          <div className="notification-heading"><strong>{lang === 'ru' ? 'Уведомления' : 'Хабарландырулар'}</strong><button type="button" aria-label={lang === 'ru' ? 'Закрыть уведомления' : 'Хабарландыруларды жабу'} onClick={toggle}>×</button></div>
          {!items.length && <p className="muted" style={{ margin: '8px 0 0' }}>{lang === 'ru' ? 'Пока ничего нового.' : 'Әзірге жаңалық жоқ.'}</p>}
          {items.map((item) => (
            <button key={item.key} type="button" className={`notification-entry${read.has(item.key) ? ' is-read' : ''}`} onClick={() => {
              const merged = new Set([...read, item.key]); setRead(merged); saveRead(uid, merged);
              setOpen(false);
              if (item.kind === 'plan_ending') onOpenPlan?.();
              else onOpenLessons?.();
            }}>
              {notificationText(item, lang, role)}
            </button>))}
        </div>)}
    </div>
  );
}
