import React, { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import { rewardRequest } from './firebase.js';
import './Rewards.css';

const copy = {
  ru: {
    eyebrow: 'МАГАЗИН НАГРАД', title: 'Твои знания.', accent: 'Твои награды.', sub: 'Решай задачи, копи коины и выбирай то, что нравится.',
    balance: 'Твой кошелёк', coins: 'коинов', available: 'Можно потратить на награды', earn: 'Заработать коины',
    experience: 'Твой опыт', xpRule: 'XP повышает уровень и растит питомца. При обмене коинов опыт сохраняется.',
    catalog: 'На что копим?', catalogSub: 'Книги, игры и новые впечатления — выбирай свою цель.',
    ask: 'Выбрать награду', pending: 'Заявка отправлена', otherPending: 'Есть активная заявка', enough: 'Коинов хватает!',
    loading: 'Загружаем твой магазин…', retry: 'Повторить', error: 'Не получилось загрузить магазин. Попробуй ещё раз.',
    confirm: 'Отправить заявку родителю? Коины зарезервируем, XP останется прежним.', cancel: 'Отменить заявку', history: 'Мои заявки',
    how: 'Как получить награду', steps: [['Копи коины', 'Занимайся и решай задачи.'], ['Выбери награду', 'При заявке коины резервируются.'], ['Получи с родителем', 'Родитель подтвердит заявку, а команда SYNAQ поможет с выдачей.']],
    limits: 'Одна награда за 30 дней. Наличие и способ выдачи подтвердим до оформления.',
    status: { pending_parent: 'Ждёт подтверждения родителя', pending_fulfillment: 'Готовим выдачу', fulfilled: 'Выдано', cancelled: 'Отменено', rejected: 'Отклонено родителем', declined: 'Недоступно — коины возвращены' },
    problem: { insufficient_coins: 'Недостаточно коинов.', active_request: 'Сначала дождись решения по текущей заявке.', monthly_limit: 'Следующую награду можно выбрать через 30 дней после предыдущей.', default: 'Не удалось отправить заявку. Попробуй позже.' },
  },
  kk: {
    eyebrow: 'СЫЙЛЫҚТАР ДҮКЕНІ', title: 'Сенің білімің.', accent: 'Сенің сыйлығың.', sub: 'Есеп шығар, коин жина және ұнаған сыйлығыңды таңда.',
    balance: 'Сенің әмияның', coins: 'коин', available: 'Сыйлықтарға жұмсай аласың', earn: 'Коин жинау',
    experience: 'Сенің тәжірибең', xpRule: 'XP деңгейіңді көтеріп, серігіңді өсіреді. Коинды айырбастағанда тәжірибең сақталады.',
    catalog: 'Сыйлығыңды таңда', catalogSub: 'Кітаптар, ойындар және жаңа әсерлер — мақсатыңды таңда.',
    ask: 'Сыйлықты таңдау', pending: 'Өтінім жіберілді', otherPending: 'Белсенді өтінім бар', enough: 'Коин жеткілікті!',
    loading: 'Дүкенің жүктелуде…', retry: 'Қайталау', error: 'Дүкен жүктелмеді. Қайта көріңіз.',
    confirm: 'Өтінімді ата-анаңа жібересің бе? Коиндар сақталып қойылады, XP өзгермейді.', cancel: 'Өтінімді болдырмау', history: 'Менің өтінімдерім',
    how: 'Сыйлықты қалай алуға болады', steps: [['Коин жина', 'Оқы және есеп шығар.'], ['Сыйлық таңда', 'Өтінім бергенде коиндар сақталып қойылады.'], ['Ата-анаңмен бірге ал', 'Ата-анаң өтінімді растайды, ал SYNAQ тобы сыйлықты алуға көмектеседі.']],
    limits: '30 күнде бір сыйлық. Бар-жоғын және беру жолын рәсімдеуге дейін растаймыз.',
    status: { pending_parent: 'Ата-ананың растауын күтуде', pending_fulfillment: 'Сыйлық дайындалуда', fulfilled: 'Берілді', cancelled: 'Болдырылмады', rejected: 'Ата-ана қабылдамады', declined: 'Қолжетімсіз — коин қайтарылды' },
    problem: { insufficient_coins: 'Коин жеткіліксіз.', active_request: 'Алдыңғы өтінімнің шешімін күт.', monthly_limit: 'Келесі сыйлықты алдыңғысынан 30 күн өткен соң таңдауға болады.', default: 'Өтінім жіберілмеді. Кейінірек қайталаңыз.' },
  },
};
const art = {
  book: { src: '/rewards/books.webp', width: 560, height: 373 },
  steam: { src: '/rewards/steam-logo.png', width: 460, height: 215, brand: 'STEAM' },
  brawl: { src: '/rewards/brawl-pass.webp', width: 620, height: 458, brand: 'BRAWL STARS' },
};
const Arrow = () => <span aria-hidden="true">↗</span>;
const Coin = ({ className = '' }) => <span className={`rs-coin ${className}`} aria-hidden="true">S</span>;
const Xp = () => <svg className="rs-xp-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="m14 2-2 8h8L9 23l2-9H3L14 2Z" fill="currentColor" /></svg>;

export default function Rewards({ onGoTraining }) {
  const { lang } = useLang();
  const c = copy[lang] || copy.ru;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const request = useRef(0);
  const mounted = useRef(false);
  const load = async () => {
    const id = ++request.current;
    setError(''); setLoading(true);
    try { const result = await rewardRequest(); if (request.current === id) setData(result); }
    catch { if (request.current === id) setError('load'); }
    finally { if (request.current === id) setLoading(false); }
  };
  useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; request.current += 1; }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (body) => {
    setBusy(true); setError('');
    const id = request.current;
    try { await rewardRequest(body); if (request.current === id) await load(); }
    catch (cause) { if (request.current === id) setError(cause.message || 'default'); }
    finally { if (mounted.current) setBusy(false); }
  };
  const active = data?.requests?.find((item) => ['pending_parent', 'pending_fulfillment'].includes(item.status));
  const name = (id) => data?.rewards?.find((reward) => reward.id === id)?.title?.[lang] || id;
  // Spaced thousands work in both languages, even without browser kk-KZ locale data.
  const format = (value) => value.toLocaleString('ru-RU');
  return <main className="reward-shop">
    <header className="rs-heading"><div><span className="rs-eyebrow">{c.eyebrow}</span><h1>{c.title} <span>{c.accent}</span></h1></div><p>{c.sub}</p></header>
    {loading && !data && <div className="rs-loading" role="status"><Coin /><span>{c.loading}</span></div>}
    {error && <div className="rs-alert" role="alert"><span>{error === 'load' ? c.error : c.problem[error] || c.problem.default}</span><button type="button" disabled={loading || busy} onClick={load}>{c.retry}</button></div>}
    {data && <>
      <div className="rs-balances">
        <section className="rs-wallet" aria-labelledby="rs-wallet-title">
          <div className="rs-wallet-copy"><h2 id="rs-wallet-title">{c.balance}</h2><div className="rs-wallet-amount"><Coin /><strong>{format(data.balance)}</strong><span>{c.coins}</span></div><p>{c.available}</p><button type="button" className="rs-earn" onClick={onGoTraining}>{c.earn}<Arrow /></button></div>
          <div className="rs-wallet-art" aria-hidden="true"><Coin /><Coin /><Coin /></div>
        </section>
        <section className="rs-experience" aria-labelledby="rs-xp-title"><div className="rs-xp-top"><Xp /><h2 id="rs-xp-title">{c.experience}</h2></div><strong>{format(data.xp)} <small>XP</small></strong><p>{c.xpRule}</p></section>
      </div>
      <section className="rs-catalog" aria-labelledby="rs-catalog-title">
        <div className="rs-section-heading"><h2 id="rs-catalog-title">{c.catalog}</h2><p>{c.catalogSub}</p></div>
        <div className="rs-products">
          {data.rewards.map((reward) => {
            const remaining = Math.max(0, reward.price - data.balance);
            const progress = Math.min(100, Math.floor(data.balance / reward.price * 100));
            const visual = art[reward.id];
            const selected = active?.rewardId === reward.id;
            return <article className={`rs-product rs-product-${reward.id}`} key={reward.id}>
              <div className="rs-product-art"><span className="rs-brand">{reward.id === 'book' ? (lang === 'ru' ? 'КНИГИ' : 'КІТАПТАР') : visual?.brand || 'SYNAQ'}</span><span className="rs-value">{reward.value}</span>{reward.id === 'steam' ? <div className="rs-steam-card" role="img" aria-label={lang === 'ru' ? 'Подарочная карта Steam на 5 долларов' : '5 долларлық Steam сыйлық картасы'}><span className="rs-steam-card-value">$5</span><img src="/rewards/steam-logo.png" alt="" width="460" height="215" loading="lazy" decoding="async" /><span className="rs-steam-card-caption">DIGITAL GIFT CARD</span></div> : visual ? <img src={visual.src} width={visual.width} height={visual.height} alt={reward.title[lang] || reward.title.ru} loading="lazy" decoding="async" /> : <Coin />}</div>
              <div className="rs-product-body"><h3>{reward.title[lang] || reward.title.ru}</h3><p className="rs-description">{reward.detail[lang] || reward.detail.ru}</p>
                <div className="rs-product-bottom"><div className="rs-price"><Coin /><b>{format(reward.price)}</b><span>{c.coins}</span></div>
                  <div className="rs-progress" role="progressbar" aria-label={`${reward.title[lang] || reward.title.ru}: ${c.coins}`} aria-valuemin={0} aria-valuemax={reward.price} aria-valuenow={Math.min(data.balance, reward.price)}><i style={{ width: `${progress}%` }} /></div>
                  <p className="rs-remaining">{active ? (selected ? c.status[active.status] : c.otherPending) : remaining ? (lang === 'ru' ? `Осталось накопить ${format(remaining)} коинов` : `Тағы ${format(remaining)} коин жинау керек`) : c.enough}</p>
                  <button type="button" className={`rs-action ${remaining ? 'rs-action-earn' : ''}`} disabled={busy || loading || !!active} onClick={() => remaining ? onGoTraining?.() : window.confirm(c.confirm) && act({ action: 'claim', rewardId: reward.id })}>{active ? (selected ? c.pending : c.otherPending) : remaining ? c.earn : c.ask}<Arrow /></button>
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>
      <section className="rs-how" aria-labelledby="rs-how-title"><h2 id="rs-how-title">{c.how}</h2><ol role="list">{c.steps.map(([title, description], index) => <li key={title}><span className="rs-step" aria-hidden="true">{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div></li>)}</ol><p className="rs-footnote">{c.limits}</p></section>
      {!!data.requests.length && <section className="rs-history"><h2>{c.history}</h2>{data.requests.slice(0, 5).map((item) => <div className="rs-history-row" key={item.id}><span>{name(item.rewardId)}<small>{c.status[item.status]}</small></span><strong><Coin />{format(item.price)} <small>{c.coins}</small></strong>{item.status === 'pending_parent' && <button type="button" disabled={busy || loading} onClick={() => act({ action: 'cancel', id: item.id })}>{c.cancel}</button>}</div>)}</section>}
    </>}
  </main>;
}
