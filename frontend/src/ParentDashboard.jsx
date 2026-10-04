import React, { useEffect, useState } from 'react';
import { getAttempts, getMocks, getXpSummary } from './firebase.js';
import { loadTopicCatalog } from './topicCatalog.js';
import { parentSummary } from './parentAnalytics.js';
import { formatStudyTime } from './analytics.js';
import { xpLevel } from './xp.js';
import PetAvatar from './PetAvatar.jsx';
import BrandLoader from './components/BrandLoader.jsx';
import './ParentDashboard.css';

export function ParentDashboardView({ child, summary: s, lang, onDetails }) {
  const text = (ru, kk) => lang === 'ru' ? ru : kk;
  const locale = lang === 'ru' ? 'ru-RU' : 'kk-KZ';
  const title = a => lang === 'ru' ? a.nameRu || a.name : a.name;
  const weak = s.weak[0], improved = s.improved[0];
  const insight = improved
    ? text(`В теме «${title(improved)}» точность выросла на ${improved.delta} п. п. за неделю.`, `«${title(improved)}» тақырыбында дәлдік бір аптада ${improved.delta} пайыздық тармаққа өсті.`)
    : s.delta > 0 ? text(`Точность ответов выросла на ${s.delta} п. п. за неделю.`, `Жауап дәлдігі бір аптада ${s.delta} пайыздық тармаққа өсті.`)
    : s.currentCount ? text(`За 7 дней решено ${s.currentCount} задач. Точность ответов — ${s.accuracy}%.`, `7 күнде ${s.currentCount} есеп шығарылды. Жауап дәлдігі — ${s.accuracy}%.`)
    : text('Новая неделя — новый маленький шаг. Помогите ребёнку начать с короткого занятия.', 'Жаңа апта — жаңа шағын қадам. Балаңызға қысқа сабақтан бастауға көмектесіңіз.');
  const max = Math.max(1, ...s.days.map(d => d.count));
  return <div className="parent-dashboard">
    <section className="pd-hero">
      <div className="pd-hero-copy"><span className="pd-eyebrow">{text('Рядом на каждом шаге', 'Әр қадамда бірге')}</span>
        <h2>{text('Большой путь начинается с маленьких побед.', 'Үлкен жол кішкентай жеңістерден басталады.')}</h2>
        <p>{insight} {weak && text(`Сейчас стоит уделить внимание теме «${title(weak)}».`, `Қазір «${title(weak)}» тақырыбына көңіл бөлген жөн.`)}</p>
        <button className="home-primary" onClick={onDetails}>{text('Подробный отчёт', 'Толық есеп')} <span aria-hidden="true">↗</span></button>
      </div>
      <div className="pd-visual" aria-hidden="true"><div className="pd-orbit" /><img src="/hero/students/cutout-2.png" alt="" /><span className="pd-float pd-float-one">✓ {text('Шаг за шагом', 'Қадам сайын')}</span><span className="pd-float pd-float-two">{s.currentCount} {text('задач за неделю', 'есеп бір аптада')}</span></div>
    </section>
    <div className="pd-metrics">
      {[['◎', text('Точность за 7 дней', '7 күндегі дәлдік'), s.accuracy === null ? '—' : `${s.accuracy}%`, s.delta === null ? text('Набираем данные для сравнения', 'Салыстыру үшін дерек жиналуда') : text(`${s.delta > 0 ? '+' : ''}${s.delta} п. п. к прошлой неделе`, `Өткен аптамен: ${s.delta > 0 ? '+' : ''}${s.delta} п. т.`)],
        ['✓', text('Освоено по практике', 'Жаттығуда меңгерілген'), s.mastered, text('От 10 ответов и 70% точности', 'Кемінде 10 жауап және 70% дәлдік')],
        ['◷', text('Время практики', 'Жаттығу уақыты'), formatStudyTime(s.seconds, lang), text('За последние 7 дней', 'Соңғы 7 күнде')],
        ['↗', text('Регулярность', 'Тұрақтылық'), `${s.days.filter(d => d.active).length}/7`, text('Дней с практикой или тестами', 'Жаттығу немесе сынақ күндері')]].map(([icon,label,value,note],i) => <article className={`pd-metric pd-tone-${i}`} key={label}><span className="pd-icon" aria-hidden="true">{icon}</span><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
    </div>
    <div className="pd-grid">
      <section className="pd-panel"><div className="pd-panel-head"><div><span className="pd-eyebrow">{text('Ритм подготовки', 'Дайындық ырғағы')}</span><h3>{text('Активность ребёнка', 'Баланың белсенділігі')}</h3></div><span className="pd-chip">7 {text('дней', 'күн')}</span></div>
        <div className="pd-bars" aria-label={text('Решённые задачи за последние 7 дней', 'Соңғы 7 күнде шығарылған есептер')}>{s.days.map(d => <div key={d.date.toISOString()} aria-label={`${d.date.toLocaleDateString(locale)}: ${d.count} ${text('задач', 'есеп')}`}><strong>{d.count}</strong><div className="pd-bar-track"><i style={{height:`${d.count/max*100}%`}} /></div><span>{d.date.toLocaleDateString(locale,{weekday:'short'})}</span><small>{d.date.getDate()}</small>{d.active && <b className="pd-day-dot" aria-label={text('Был активен', 'Белсенді болды')} />}</div>)}</div>
        <p className="pd-footnote">{text('Последнее занятие:', 'Соңғы сабақ:')} {s.lastAt ? new Date(s.lastAt).toLocaleString(locale,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : text('ещё нет занятий', 'сабақ әлі жоқ')}</p>
      </section>
      <section className="pd-panel pd-next"><span className="pd-icon" aria-hidden="true">✦</span><span className="pd-eyebrow">{text('Ближайший шаг', 'Келесі қадам')}</span><h3>{weak ? text(`Повторить: ${title(weak)}`, `Қайталау: ${title(weak)}`) : s.topics.length ? text('Закрепить сильные темы', 'Мықты тақырыптарды бекіту') : text('Начать с первой тренировки', 'Алғашқы жаттығудан бастау')}</h3>
        <p>{weak ? text(`Сейчас ${weak.pct}% верных ответов в этой теме. Предложите ребёнку разобрать ошибки и решить несколько похожих задач.`, `Бұл тақырыпта дұрыс жауаптар — ${weak.pct}%. Балаңызға қателерін талдап, ұқсас есептер шығаруды ұсыныңыз.`) : text('Предложите ребёнку открыть тренировку и решить 5–10 задач в удобном темпе.', 'Балаңызға жаттығуды ашып, өз қарқынымен 5–10 есеп шығаруды ұсыныңыз.')}</p>
        <div className="pd-next-time"><span aria-hidden="true">◷</span> 15 {text('минут', 'минут')}<small>{text('Рекомендуемая длительность', 'Ұсынылатын ұзақтық')}</small></div>
        <p className="pd-support">{text('Спросите: «Какую задачу было интересно решать?» Похвалите за старание.', '«Қай есепті шығару қызық болды?» деп сұрап, еңбегін мақтаңыз.')}</p>
      </section>
      <section className="pd-panel"><div className="pd-panel-head"><div><span className="pd-eyebrow">{text('Что получается', 'Не жақсы шығады')}</span><h3>{text('Прогресс по темам', 'Тақырыптар бойынша прогресс')}</h3></div><span aria-hidden="true">↗</span></div>
        {s.topics.length ? [...s.topics].sort((a,b)=>a.pct-b.pct).slice(0,4).map(a => <div className="pd-topic" key={a.id}><div><strong>{title(a)}</strong><span>{a.pct}%</span></div><div className="pd-topic-track"><i style={{width:`${a.pct}%`,background:a.pct>=70?'#23AA85':a.pct>=50?'#F2AF43':'#F08562'}} /></div><small>{a.delta > 0 ? text(`+${a.delta} п. п. за неделю`, `Аптада +${a.delta} п. т.`) : a.count < 3 ? text('Пока мало ответов для вывода', 'Қорытынды үшін жауап аз') : a.pct>=70 ? text('Получается хорошо', 'Жақсы нәтиже') : text('Нужно ещё немного практики', 'Тағы біраз жаттығу қажет')}</small></div>) : <p className="pd-empty">{text('После первых ответов здесь появятся сильные темы и точки роста.', 'Алғашқы жауаптардан кейін мықты және қайталауды қажет ететін тақырыптар көрінеді.')}</p>}
      </section>
      <section className="pd-panel"><div className="pd-panel-head"><div><span className="pd-eyebrow">{text('Результаты занятий', 'Сабақ нәтижелері')}</span><h3>{text('Динамика пробных тестов', 'Сынақ нәтижелерінің өзгеруі')}</h3></div><span className="pd-chip">{text('Точность, %', 'Дәлдік, %')}</span></div>
        {s.tests.length ? <><div className="pd-test-chart">{s.tests.map((a,i)=><div key={i}><strong>{a.pct}%</strong><div className="pd-test-track"><i style={{height:`${a.pct}%`}} /></div><small>{a.date.toLocaleDateString(locale,{day:'numeric',month:'short'})}</small></div>)}</div><p className="pd-footnote">{text('Последний тест:', 'Соңғы сынақ:')} {s.tests.at(-1).school} · {s.tests.at(-1).score}/{s.tests.at(-1).gradable}</p><small className="pd-muted">{text('Тесты разных школ могут отличаться по сложности.', 'Әртүрлі мектеп сынақтарының қиындығы өзгеше болуы мүмкін.')}</small></> : <p className="pd-empty">{text('Пробных тестов пока нет. После первого теста здесь появится результат.', 'Сынақ әлі жоқ. Алғашқы сынақтан кейін нәтиже осында көрінеді.')}</p>}
      </section>
    </div>
    <div className="pd-rewards"><span aria-hidden="true">★</span><div><strong>{text('Маленькие победы тоже важны', 'Кішкентай жеңістер де маңызды')}</strong><p>{Number(child.xp)||0} XP · {text('Уровень', 'Деңгей')} {xpLevel(Number(child.xp)||0)}</p></div><PetAvatar id={child.avatar} size="small" /></div>
    <p className="pd-data-note">{text('Обзор рассчитан по последним 500 ответам и 50 тестам. Освоение темы — оценка по практике; завершение уроков здесь не учитывается.', 'Шолу соңғы 500 жауап пен 50 сынақ бойынша есептеледі. Тақырыпты меңгеру жаттығу арқылы бағаланады; сабақтарды аяқтау есепке алынбайды.')}</p>
  </div>;
}

export default function ParentDashboard({ children, lang, onDetails }) {
  const [selected, setSelected] = useState('');
  const child = children.find(c => c.uid === selected) || children[0];
  const uid = child?.uid;
  const [report, setReport] = useState(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setReport(null); setError(false);
    if (uid) Promise.all([getAttempts(uid), getMocks(uid), loadTopicCatalog(), getXpSummary(uid)]).then(([attempts,mocks,topics,xp])=>{ if(alive) setReport({uid,xp:xp.xp,summary:parentSummary(attempts,mocks,topics)}); }).catch(()=>{ if(alive) setError(true); });
    return () => { alive = false; };
  }, [uid,retry]);
  if (!child) return null;
  return <section aria-label={lang==='ru'?'Обзор ребёнка':'Балаға шолу'}>
    <div className="pd-child-picker">{children.map(c=><button type="button" key={c.uid} aria-pressed={c.uid===uid} onClick={()=>setSelected(c.uid)}><PetAvatar id={c.avatar} size="small" /><span>{c.name}</span>{c.uid===uid&&<span aria-hidden="true">✓</span>}</button>)}</div>
    {error ? <div className="pd-panel" role="alert"><p>{lang==='ru'?'Не удалось загрузить прогресс ребёнка. Попробуйте ещё раз.':'Баланың прогресі жүктелмеді. Қайта көріңіз.'}</p><button className="btn" onClick={()=>setRetry(n=>n+1)}>{lang==='ru'?'Повторить':'Қайталау'}</button></div> : report?.uid===uid ? <ParentDashboardView child={{...child,xp:report.xp}} summary={report.summary} lang={lang} onDetails={()=>onDetails(child)} /> : <BrandLoader />}
  </section>;
}
