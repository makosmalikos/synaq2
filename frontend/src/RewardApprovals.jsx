import React, { useEffect, useState } from 'react';
import { rewardRequest } from './firebase.js';

const names = { book: ['Книга на выбор', 'Таңдаған кітап'], steam: ['Steam $5', 'Steam $5'], brawl: ['Brawl Pass', 'Brawl Pass'] };

export default function RewardApprovals({ children, lang }) {
  const ru = lang === 'ru';
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const load = async () => {
    try { setError(''); setRequests((await rewardRequest()).requests || []); }
    catch { setError(ru ? 'Не удалось загрузить заявки на награды.' : 'Сыйлық өтінімдері жүктелмеді.'); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (id, action) => {
    setBusy(id); setError('');
    try { await rewardRequest({ id, action }); await load(); }
    catch { setError(ru ? 'Не удалось обработать заявку.' : 'Өтінім өңделмеді.'); }
    finally { setBusy(''); }
  };
  const pending = requests.filter((item) => item.status === 'pending_parent');
  return <section className="parent-reward-approvals">
    <div className="parent-reward-head"><div><span className="parent-reward-symbol" aria-hidden="true">✦</span><h2>{ru ? 'Награды ребёнка' : 'Баланың сыйлықтары'}</h2></div><button type="button" onClick={load}>{ru ? 'Обновить' : 'Жаңарту'}</button></div>
    {error && <p role="alert">{error}</p>}
    {!pending.length && !error && <div className="parent-reward-empty"><p>{ru ? 'Здесь появятся награды, которые выберет ребёнок.' : 'Балаңыз таңдаған сыйлықтар осында көрінеді.'}</p><small>{ru ? 'Вы сможете подтвердить обмен коинов на подарок.' : 'Коинді сыйлыққа айырбастауды растай аласыз.'}</small></div>}
    {pending.map((item) => <article key={item.id} className="parent-reward-request">
      <div><strong>{children.find((child) => child.uid === item.childUid)?.name || (ru ? 'Ребёнок' : 'Бала')}</strong><span>{names[item.rewardId]?.[ru ? 0 : 1] || item.rewardId} · {item.price.toLocaleString(ru ? 'ru-RU' : 'kk-KZ')} {ru ? 'коинов' : 'коин'}</span></div>
      <div className="parent-reward-actions"><button type="button" disabled={busy === item.id} onClick={() => act(item.id, 'reject')}>{ru ? 'Отклонить' : 'Қабылдамау'}</button><button type="button" disabled={busy === item.id} onClick={() => act(item.id, 'approve')}>{ru ? 'Подтвердить' : 'Растау'}</button></div>
    </article>)}
    <small>{ru ? 'После подтверждения команда SYNAQ свяжется с вами по поводу выдачи. Если награда недоступна, коины вернутся ребёнку.' : 'Растағаннан кейін SYNAQ тобы сыйлықты беру үшін сізбен хабарласады. Сыйлық қолжетімсіз болса, коин қайтарылады.'}</small>
  </section>;
}
