import React, { useEffect, useRef, useState } from 'react';
import { auth, rewardRequest } from './firebase.js';
import BrandLoader from './components/BrandLoader.jsx';

const names = { book: ['Книга на выбор', 'Таңдаған кітап'], steam: ['Steam $5', 'Steam $5'], brawl: ['Brawl Pass', 'Brawl Pass'] };

export default function RewardApprovals({ children, lang }) {
  const ru = lang === 'ru';
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);
  const request = useRef(0);
  const acting = useRef(false);
  const load = async () => {
    const ticket = ++request.current, uid = auth.currentUser?.uid;
    const current = () => mounted.current && ticket === request.current && auth.currentUser?.uid === uid;
    setError(''); setLoading(true);
    try { const result = await rewardRequest(); if (current()) setRequests(result.requests || []); }
    catch { if (current()) setError('load'); }
    finally { if (current()) setLoading(false); }
  };
  useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; request.current++; }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (id, action) => {
    if (acting.current) return;
    const uid = auth.currentUser?.uid;
    const current = () => mounted.current && auth.currentUser?.uid === uid;
    acting.current = true;
    request.current++; // A pre-action refresh must not restore an old request.
    setBusy(id); setError('');
    try { await rewardRequest({ id, action }); if (current()) await load(); }
    catch { if (current()) setError('action'); }
    finally { acting.current = false; if (current()) { setBusy(''); setLoading(false); } }
  };
  const pending = requests.filter((item) => item.status === 'pending_parent');
  return <section className="parent-reward-approvals">
    <div className="parent-reward-head"><div><span className="parent-reward-symbol" aria-hidden="true">✦</span><h2>{ru ? 'Награды ребёнка' : 'Баланың сыйлықтары'}</h2></div><button type="button" disabled={loading || !!busy} onClick={load}>{ru ? 'Обновить' : 'Жаңарту'}</button></div>
    {error && <p role="alert">{error === 'load' ? (ru ? 'Не удалось загрузить заявки на награды.' : 'Сыйлық өтінімдері жүктелмеді.') : (ru ? 'Не удалось обработать заявку.' : 'Өтінім өңделмеді.')}</p>}
    {loading && !requests.length && <BrandLoader compact />}
    {!loading && !pending.length && !error && <div className="parent-reward-empty"><p>{ru ? 'Здесь появятся награды, которые выберет ребёнок.' : 'Балаңыз таңдаған сыйлықтар осында көрінеді.'}</p><small>{ru ? 'Вы сможете подтвердить обмен коинов на подарок.' : 'Коинді сыйлыққа айырбастауды растай аласыз.'}</small></div>}
    {pending.map((item) => <article key={item.id} className="parent-reward-request">
      <div><strong>{children.find((child) => child.uid === item.childUid)?.name || (ru ? 'Ребёнок' : 'Бала')}</strong><span>{names[item.rewardId]?.[ru ? 0 : 1] || item.rewardId} · {item.price.toLocaleString(ru ? 'ru-RU' : 'kk-KZ')} {ru ? 'коинов' : 'коин'}</span></div>
      <div className="parent-reward-actions"><button type="button" disabled={!!busy || loading} onClick={() => act(item.id, 'reject')}>{ru ? 'Отклонить' : 'Қабылдамау'}</button><button type="button" disabled={!!busy || loading} onClick={() => act(item.id, 'approve')}>{ru ? 'Подтвердить' : 'Растау'}</button></div>
    </article>)}
    <small>{ru ? 'После подтверждения команда SYNAQ свяжется с вами по поводу выдачи. Если награда недоступна, коины вернутся ребёнку.' : 'Растағаннан кейін SYNAQ тобы сыйлықты беру үшін сізбен хабарласады. Сыйлық қолжетімсіз болса, коин қайтарылады.'}</small>
  </section>;
}
