import React, { useCallback, useEffect, useState } from 'react';
import { auth } from './firebase.js';

// Сколько детей зарегистрировано и сколько задач решено. Видно только админам.
export default function AdminStats({ lang }) {
  const text = (ru, kk) => (lang === 'ru' ? ru : kk);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('login_required');
      const response = await fetch('/api/admin-stats', { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'failed');
      setData(body);
    } catch { setError(text('Не удалось загрузить статистику', 'Статистиканы жүктеу мүмкін болмады')); }
  }, [lang]);
  useEffect(() => { load(); }, [load]);
  const fmt = (n) => (n == null ? '—' : new Intl.NumberFormat('ru-RU').format(n));
  const cards = data ? [
    [text('Учеников зарегистрировано', 'Тіркелген оқушылар'), data.students],
    [text('Задач решено верно', 'Дұрыс шешілген есептер'), data.tasksCorrect],
    [text('Задач отвечено всего', 'Барлық жауап берілген есептер'), data.tasksSolved],
    [text('Семей (родителей)', 'Отбасылар (ата-ана)'), data.parents],
  ] : [];
  return <section>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <h1 style={{ margin: 0 }}>{text('Статистика', 'Статистика')}</h1>
      <button type="button" className="logout" onClick={load}>{text('Обновить', 'Жаңарту')}</button>
    </div>
    {error && <p role="alert" style={{ color: '#DC2626' }}>{error}</p>}
    {!data && !error && <p className="muted">{text('Загрузка…', 'Жүктелуде…')}</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
      {cards.map(([label, value]) => <div className="card" key={label}>
        <div className="muted" style={{ fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 34, fontWeight: 800 }}>{fmt(value)}</div>
      </div>)}
    </div>
  </section>;
}
