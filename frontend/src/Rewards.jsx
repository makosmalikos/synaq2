import React, { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import { rewardRequest } from './firebase.js';

const copy = {
  ru: {
    title: 'Награды за подготовку', sub: 'Решай задачи, собирай коины и выбирай награду.',
    balance: 'Доступно', earned: 'Заработано', rule: '1 проверенный XP = 1 коин. XP и уровень при обмене не уменьшаются.',
    catalog: 'Каталог наград', parent: 'Заявку подтвердит родитель. После этого команда SYNAQ свяжется с ним для выдачи награды.',
    ask: 'Выбрать', wait: 'Не хватает коинов', pending: 'Заявка уже отправлена',
    loading: 'Загружаем магазин…', retry: 'Повторить', error: 'Магазин сейчас недоступен. Попробуйте позже.',
    confirm: 'Отправить заявку на эту награду родителю?', cancel: 'Отменить заявку', history: 'Мои заявки',
    limits: 'Не более одной награды за 30 дней. Наличие и способ выдачи подтвердим до оформления.',
    status: { pending_parent: 'Ждёт родителя', pending_fulfillment: 'Готовим выдачу', fulfilled: 'Выдано', cancelled: 'Отменено', rejected: 'Отклонено родителем', declined: 'Недоступно — коины возвращены' },
    problem: { insufficient_coins: 'Недостаточно коинов.', active_request: 'Сначала дождитесь решения по текущей заявке.', monthly_limit: 'Следующую награду можно выбрать через 30 дней после предыдущей.', default: 'Не удалось отправить заявку. Попробуйте позже.' },
  },
  kk: {
    title: 'Дайындық үшін сыйлықтар', sub: 'Есеп шығар, коин жина және сыйлық таңда.',
    balance: 'Қолжетімді', earned: 'Жиналды', rule: '1 тексерілген XP = 1 коин. Айырбастағанда XP мен деңгей азаймайды.',
    catalog: 'Сыйлықтар каталогы', parent: 'Өтінімді ата-ана растайды. Содан кейін SYNAQ тобы сыйлықты беру үшін онымен хабарласады.',
    ask: 'Таңдау', wait: 'Коин жеткіліксіз', pending: 'Өтінім жіберілген',
    loading: 'Дүкен жүктелуде…', retry: 'Қайталау', error: 'Дүкен қазір қолжетімсіз. Кейінірек қайталаңыз.',
    confirm: 'Осы сыйлыққа өтінімді ата-анаңа жібересің бе?', cancel: 'Өтінімді болдырмау', history: 'Менің өтінімдерім',
    limits: '30 күнде бір сыйлықтан артық берілмейді. Бар-жоғын және беру жолын рәсімдеуге дейін растаймыз.',
    status: { pending_parent: 'Ата-ананы күтуде', pending_fulfillment: 'Сыйлық дайындалуда', fulfilled: 'Берілді', cancelled: 'Болдырылмады', rejected: 'Ата-ана қабылдамады', declined: 'Қолжетімсіз — коин қайтарылды' },
    problem: { insufficient_coins: 'Коин жеткіліксіз.', active_request: 'Алдыңғы өтінімнің шешімін күтіңіз.', monthly_limit: 'Келесі сыйлықты алдыңғысынан 30 күн өткен соң таңдауға болады.', default: 'Өтінім жіберілмеді. Кейінірек қайталаңыз.' },
  },
};

export default function Rewards() {
  const { lang } = useLang();
  const c = copy[lang] || copy.ru;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try { setError(''); setData(await rewardRequest()); }
    catch { setError(c.error); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (body) => {
    setBusy(true); setError('');
    try { await rewardRequest(body); await load(); }
    catch (cause) { setError(c.problem[cause.message] || c.problem.default); }
    finally { setBusy(false); }
  };
  const active = data?.requests?.find((item) => ['pending_parent', 'pending_fulfillment'].includes(item.status));
  const name = (id) => data?.rewards?.find((reward) => reward.id === id)?.title?.[lang] || id;
  const locale = lang === 'ru' ? 'ru-RU' : 'kk-KZ';
  return <main className="rewards-page">
    <header className="section-title"><span className="section-eyebrow">SYNAQ COINS</span><h1>{c.title}</h1><p>{c.sub}</p></header>
    {!data && !error && <p role="status">{c.loading}</p>}
    {error && <div className="rewards-alert" role="alert">{error} <button type="button" onClick={load}>{c.retry}</button></div>}
    {data && <>
      <section className="rewards-wallet">
        <div><span>{c.balance}</span><strong><i aria-hidden="true">✦</i>{data.balance.toLocaleString(locale)}</strong><small>{lang === 'ru' ? 'коинов' : 'коин'} · {c.earned}: {data.xp.toLocaleString(locale)}</small></div>
        <p>{c.rule}</p>
      </section>
      <section className="rewards-catalog" aria-labelledby="rewards-catalog-title">
        <div className="rewards-catalog-head"><h2 id="rewards-catalog-title">{c.catalog}</h2><p>{c.parent}</p></div>
        <div className="rewards-products">
          {data.rewards.map((reward) => <article className={`rewards-product rewards-product-${reward.id}`} key={reward.id}>
            <div className="rewards-product-art" aria-hidden="true"><span>{reward.id === 'book' ? 'АБ' : reward.id === 'steam' ? 'S' : '★'}</span></div>
            <div className="rewards-product-body"><span className="rewards-product-value">{reward.value}</span><h3>{reward.title[lang] || reward.title.ru}</h3><p>{reward.detail[lang] || reward.detail.ru}</p><div className="rewards-product-bottom"><b>{reward.price.toLocaleString(locale)} ✦</b><button type="button" disabled={busy || !!active || data.balance < reward.price} onClick={() => window.confirm(c.confirm) && act({ action: 'claim', rewardId: reward.id })}>{active ? c.pending : data.balance < reward.price ? c.wait : c.ask}</button></div></div>
          </article>)}
        </div>
        <p className="rewards-footnote">{c.limits}</p>
      </section>
      {!!data.requests.length && <section className="rewards-history"><h2>{c.history}</h2>{data.requests.slice(0, 5).map((item) => <div className="rewards-history-row" key={item.id}><span>{name(item.rewardId)}<small>{c.status[item.status]}</small></span><strong>{item.price.toLocaleString(locale)} ✦</strong>{item.status === 'pending_parent' && <button type="button" disabled={busy} onClick={() => act({ action: 'cancel', id: item.id })}>{c.cancel}</button>}</div>)}</section>}
    </>}
  </main>;
}
