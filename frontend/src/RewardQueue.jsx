import React, { useEffect, useState } from 'react';
import { rewardRequest } from './firebase.js';

const names = { book: 'Книга / 3 000 ₸', steam: 'Steam / $5', brawl: 'Brawl Pass' };
const statuses = { pending_parent: 'Ждёт родителя', pending_fulfillment: 'Нужно выдать', fulfilled: 'Выдано', cancelled: 'Отменено', rejected: 'Отклонено', declined: 'Недоступно, коины возвращены' };

export default function RewardQueue() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const load = async () => {
    try { setError(''); setItems((await rewardRequest()).requests || []); }
    catch { setError('Не удалось загрузить заявки.'); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (id, action) => {
    setBusy(id); setError('');
    try { await rewardRequest({ id, action }); await load(); }
    catch { setError('Не удалось обновить заявку.'); }
    finally { setBusy(''); }
  };
  return <section className="admin-reward-queue">
    <div className="parent-reward-head"><h1>Заявки на награды</h1><button type="button" onClick={load}>Обновить</button></div>
    {error && <p role="alert">{error}</p>}
    {!items.length && !error && <p>Заявок пока нет.</p>}
    {items.map((item) => <article className="parent-reward-request" key={item.id}>
      <div><strong>{names[item.rewardId] || item.rewardId}</strong><span>{statuses[item.status] || item.status} · {item.price.toLocaleString('ru-RU')} коинов</span><small>Родитель: {item.parentEmail || item.parentUid} · ученик: {item.childUid}</small></div>
      {item.status === 'pending_fulfillment' && <div className="parent-reward-actions"><button type="button" disabled={busy === item.id} onClick={() => act(item.id, 'decline')}>Недоступно, вернуть коины</button><button type="button" disabled={busy === item.id} onClick={() => window.confirm('Награда действительно выдана?') && act(item.id, 'fulfill')}>Выдано</button></div>}
    </article>)}
  </section>;
}
