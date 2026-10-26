import React from 'react';
import './MockCatalog.css';

const schoolImages = { 'РФМШ': 'rfmsh', 'НИШ': 'nis', 'БИЛ': 'bil' };
const kazakhMonths = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];

function CatalogIcon({ kind = 'arrow' }) {
  const paths = {
    arrow: 'M4 12h16m-6-6 6 6-6 6',
    clock: 'M12 8v4l3 2',
    tasks: 'M8 7h8M8 12h8M8 17h5M5 3h14v18H5z',
    check: 'm5 12 4 4L19 6',
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{kind === 'clock' && <circle cx="12" cy="12" r="9" />}<path d={paths[kind]} /></svg>;
}

export default function MockCatalog({ schools, weekly, lang, starting, paying, onStart, onBuy, onRefresh, notice }) {
  const ru = lang === 'ru';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(weekly.weekKey || '') ? new Date(`${weekly.weekKey}T12:00:00`) : null;
  const week = date && !Number.isNaN(date.getTime()) ? (ru
    ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date)
    : `${date.getDate()} ${kazakhMonths[date.getMonth()]}`) : '';
  const scoring = {
    'РФМШ': ru ? 'Результат — число верных ответов. Официальный балл зависит от уровней A/B/C.' : 'Нәтиже — дұрыс жауап саны. Ресми ұпай A/B/C деңгейлеріне тәуелді.',
    'НИШ': ru ? 'Результат — число верных ответов. Официальный результат НИШ рассчитывается отдельно.' : 'Нәтиже — дұрыс жауап саны. НЗМ ресми нәтижесі бөлек есептеледі.',
    'БИЛ': ru ? '+4 за верный ответ, −1 за неверный. За пропуск — 0 баллов.' : 'Дұрыс жауапқа +4, қате жауапқа −1. Жауапсыз сұраққа — 0 ұпай.',
  };
  return <main className="mock-experience mock-catalog">
    <div className="mock-catalog-notices">{notice}</div>
    <section className="mock-catalog-hero" aria-labelledby="mock-catalog-title">
      <div className="mock-catalog-hero-copy">
        <span className="mock-catalog-tag">{ru ? 'ПРОБНИК НЕДЕЛИ' : 'АПТАЛЫҚ СЫНАҚ'}{week && ` · ${week}`}</span>
        <h1 id="mock-catalog-title">{ru ? 'Проверь готовность к поступлению' : 'Оқуға түсуге дайындығыңды тексер'}</h1>
        <p>{ru ? 'Пройди тест в своём темпе, узнай результат и разбери ошибки.' : 'Сынақтан өз қарқыныңмен өт, нәтижеңді біліп, қателеріңді талда.'}</p>
        {weekly.access ? <span className="mock-catalog-access"><CatalogIcon kind="check" />{weekly.pro ? (ru ? 'Включено в Standard и Pro' : 'Standard және Pro құрамында') : (ru ? 'Доступ на эту неделю открыт' : 'Осы аптаға қолжетімділік ашық')}</span> : <button className="mock-catalog-primary" type="button" disabled={paying} onClick={onBuy}>{paying ? (ru ? 'Открываем оплату…' : 'Төлем ашылуда…') : `${ru ? 'Открыть все пробники' : 'Барлық сынақты ашу'} · ${weekly.priceKzt?.toLocaleString('ru-RU')} ₸`}<CatalogIcon /></button>}
      </div>
      <img src="/mascot/synaq-owl-study.webp" width="640" height="640" alt="" decoding="async" />
    </section>
    {!weekly.access && <div className="mock-catalog-payment"><p>{ru ? 'Одна оплата — три варианта на текущую неделю. В Standard и Pro доступ уже включён.' : 'Бір төлем — осы аптадағы үш нұсқа. Standard және Pro жазылымында қолжетімділік бар.'}</p><button type="button" onClick={onRefresh}>{ru ? 'Уже оплатили? Проверить доступ' : 'Төледіңіз бе? Қолжетімділікті тексеру'}</button></div>}
    <header className="mock-catalog-heading"><div><h2>{ru ? 'Выбери свою школу' : 'Өз мектебіңді таңда'}</h2><p>{ru ? 'Новые вопросы — каждый понедельник.' : 'Жаңа сұрақтар — әр дүйсенбіде.'}</p></div><span>БИЛ · НИШ · РФМШ</span></header>
    <div className="mock-catalog-grid">
      {schools.map(s => <article className="mock-catalog-school" key={s.code}>
        <div className="mock-catalog-school-top"><span className="mock-catalog-school-logo">{schoolImages[s.code] && <img src={`/schools/${schoolImages[s.code]}.png`} width="80" height="80" alt="" />}</span><span className="mock-catalog-school-kind">{ru ? 'Пробный тест' : 'Сынақ тесті'}</span></div>
        <h3>{s.code}</h3>
        <div className="mock-catalog-stats"><span><CatalogIcon kind="tasks" />{s.count} {ru ? 'заданий' : 'тапсырма'}</span><span><CatalogIcon kind="clock" />{s.timeLimitMin} {ru ? 'мин' : 'мин'}</span></div>
        <p className="mock-catalog-scoring">{scoring[s.code]}</p>
        {s.shortened && <p className="mock-catalog-shortened">{ru ? 'Сокращённый вариант' : 'Қысқартылған нұсқа'} · {s.count}/{s.targetCount}</p>}
        {weekly.access ? <button type="button" className="mock-catalog-primary" disabled={!s.ready || starting} onClick={() => s.ready && !starting && onStart(s.code)} aria-label={`${ru ? 'Начать пробник' : 'Сынақты бастау'} ${s.code}`}>{!s.ready ? (ru ? 'Скоро появится' : 'Жақында') : starting ? (ru ? 'Подготавливаем тест…' : 'Сынақ дайындалуда…') : (ru ? 'Начать пробник' : 'Сынақты бастау')}<CatalogIcon /></button> : <span className="mock-catalog-locked">{ru ? 'Откроется после оплаты' : 'Төлемнен кейін ашылады'}</span>}
      </article>)}
    </div>
    <p className="mock-catalog-note">{ru ? 'После теста: результат по предметам, разбор каждого ответа и работа над ошибками.' : 'Сынақтан кейін: пәндер бойынша нәтиже, әр жауапты талдау және қателермен жұмыс.'}</p>
  </main>;
}
