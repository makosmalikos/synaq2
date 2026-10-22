import React, { useEffect, useState } from 'react';
import { auth } from './firebase.js';

const DAYS = {
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  kk: ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс'],
};
const EMPTY = { name: '', email: '', phone: '', meetLink: '', bio: '', active: true, slots: [] };

async function api(method, { body, query = '' } = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('login_required');
  const response = await fetch(`/api/admin-mentors${query}`, { method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'failed');
  return data;
}

export default function AdminMentors({ lang }) {
  const ru = lang === 'ru';
  const text = (a, b) => (ru ? a : b);
  const days = DAYS[ru ? 'ru' : 'kk'];
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | { id?, ...поля }
  const [saving, setSaving] = useState(false);
  const [pickDay, setPickDay] = useState(1);
  const [pickTime, setPickTime] = useState('17:00');

  const errors = {
    invalid_name: text('Укажите имя (до 80 символов).', 'Атын жазыңыз (80 таңбаға дейін).'),
    invalid_email: text('Проверьте email.', 'Email-ді тексеріңіз.'),
    invalid_link: text('Ссылка на Meet должна начинаться с https://', 'Meet сілтемесі https:// деп басталуы керек'),
    invalid_slots: text('Проверьте время в расписании.', 'Кестедегі уақытты тексеріңіз.'),
  };
  const load = async () => {
    setLoading(true); setError('');
    try { setMentors((await api('GET')).mentors || []); }
    catch { setError(text('Не удалось загрузить наставников.', 'Тәлімгерлерді жүктеу мүмкін болмады.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      await api('POST', { body: editing });
      setEditing(null);
      await load();
    } catch (e) { setError(errors[e.message] || text('Не удалось сохранить.', 'Сақтау мүмкін болмады.')); }
    finally { setSaving(false); }
  };
  const toggle = async (mentor) => {
    setError('');
    try { await api('POST', { body: { ...mentor, active: !mentor.active } }); await load(); }
    catch { setError(text('Не удалось изменить статус.', 'Күйін өзгерту мүмкін болмады.')); }
  };
  const addSlot = () => {
    if (!/^\d\d:\d\d$/.test(pickTime)) return;
    setEditing((m) => m.slots.some((s) => s.day === pickDay && s.time === pickTime) ? m
      : { ...m, slots: [...m.slots, { day: pickDay, time: pickTime }].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)) });
  };
  const removeSlot = (slot) => setEditing((m) => ({ ...m, slots: m.slots.filter((s) => s !== slot) }));
  const set = (key) => (event) => setEditing((m) => ({ ...m, [key]: event.target.value }));

  if (editing) return (
    <section className="aw">
      <h1 style={{ margin: '0 0 12px' }}>{editing.id ? text('Наставник', 'Тәлімгер') : text('Новый наставник', 'Жаңа тәлімгер')}</h1>
      {error && <div className="card" style={{ color: 'var(--accent)', marginBottom: 12 }}>{error}</div>}
      <form className="card" onSubmit={save}>
        <label>{text('Имя', 'Аты')}<input required maxLength={80} value={editing.name} onChange={set('name')} /></label>
        <label>Email<input required type="email" value={editing.email} onChange={set('email')} /></label>
        <label>{text('Телефон / WhatsApp', 'Телефон / WhatsApp')}<input maxLength={30} value={editing.phone} onChange={set('phone')} /></label>
        <label>{text('Постоянная ссылка Google Meet', 'Тұрақты Google Meet сілтемесі')}<input type="url" placeholder="https://meet.google.com/..." value={editing.meetLink} onChange={set('meetLink')} /></label>
        <label>{text('О наставнике (коротко)', 'Тәлімгер туралы (қысқаша)')}<textarea rows={3} maxLength={500} value={editing.bio} onChange={set('bio')} /></label>
        <div>
          <b>{text('Расписание на неделю (время начала, урок 40 минут, время Алматы)', 'Апталық кесте (басталу уақыты, сабақ 40 минут, Алматы уақыты)')}</b>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
            <select style={{ width: 'auto', margin: 0 }} value={pickDay} onChange={(e) => setPickDay(Number(e.target.value))}>{days.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select>
            <input type="time" style={{ width: 'auto', margin: 0 }} value={pickTime} onChange={(e) => setPickTime(e.target.value)} />
            <button type="button" className="btn" onClick={addSlot}>+ {text('Добавить время', 'Уақыт қосу')}</button>
          </div>
          {days.map((d, i) => {
            const list = editing.slots.filter((s) => s.day === i + 1);
            return <div key={d} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '4px 0' }}>
              <span style={{ width: 28, fontWeight: 700 }}>{d}</span>
              {list.length ? list.map((s) => <button type="button" key={s.time} className="tag" title={text('Убрать', 'Алып тастау')} onClick={() => removeSlot(s)}>{s.time} ✕</button>)
                : <span className="muted">{text('выходной', 'демалыс')}</span>}
            </div>;
          })}
        </div>
        <label className="aw-check"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing((m) => ({ ...m, active: e.target.checked }))} />{text('Активен (виден детям при записи)', 'Белсенді (жазылғанда балаларға көрінеді)')}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn accent" disabled={saving}>{saving ? '…' : text('Сохранить', 'Сақтау')}</button>
          <button type="button" className="btn ghost" onClick={() => { setEditing(null); setError(''); }}>{text('Отмена', 'Бас тарту')}</button>
        </div>
      </form>
    </section>
  );

  return (
    <section className="aw">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', marginBottom: 16, flexWrap: 'wrap' }}>
        <div><h1 style={{ margin: '0 0 4px' }}>{text('Наставники', 'Тәлімгерлер')}</h1>
          <p className="muted" style={{ margin: 0 }}>{text('Оплата наставнику — 3 000 ₸ за урок. Преподают только математику.', 'Тәлімгерге төлем — сабағына 3 000 ₸. Тек математика.')}</p></div>
        <button type="button" className="btn accent" onClick={() => { setEditing({ ...EMPTY }); setError(''); }}>+ {text('Добавить наставника', 'Тәлімгер қосу')}</button>
      </div>
      {error && <div className="card" style={{ color: 'var(--accent)', marginBottom: 12 }}>{error}</div>}
      {loading ? <div className="card"><p style={{ margin: 0 }}>…</p></div>
        : !mentors.length ? <div className="card"><p className="muted" style={{ margin: 0 }}>{text('Наставников пока нет. Нажмите «Добавить наставника».', 'Тәлімгер әзірге жоқ. «Тәлімгер қосу» түймесін басыңыз.')}</p></div>
        : <div style={{ display: 'grid', gap: 12 }}>{mentors.map((m) => (
          <article className="card" key={m.id} style={{ opacity: m.active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div><div style={{ font: "700 17px 'Golos Text',system-ui,sans-serif" }}>{m.name}</div>
                <div className="muted" style={{ fontSize: 13 }}>{m.email}{m.phone ? ` · ${m.phone}` : ''}</div></div>
              <span className="tag">{m.active ? text('активен', 'белсенді') : text('скрыт', 'жасырын')}</span>
            </div>
            <p className="muted" style={{ margin: '8px 0' }}>{m.meetLink ? <a href={m.meetLink} target="_blank" rel="noreferrer">Google Meet</a> : text('Ссылка Meet не указана', 'Meet сілтемесі көрсетілмеген')} · {m.slots.length} {text('слотов в неделю', 'слот аптасына')}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={() => { setEditing({ ...m }); setError(''); }}>{text('Изменить / расписание', 'Өзгерту / кесте')}</button>
              <button type="button" className="btn ghost" onClick={() => toggle(m)}>{m.active ? text('Скрыть', 'Жасыру') : text('Включить', 'Қосу')}</button>
            </div>
          </article>))}</div>}
    </section>
  );
}
