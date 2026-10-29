import React, { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import { centerCall, centerError } from './centerApi.js';
import './CenterWorkspace.css';

export default function CenterEnrollment({ childUid, childName }) {
  const { lang } = useLang(), text = (ru, kk) => lang === 'ru' ? ru : kk;
  const [data, setData] = useState(null), [error, setError] = useState(''), [code, setCode] = useState('');
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(false);
  const active = useRef(true), lock = useRef(false);
  const load = async () => {
    const next = await centerCall({ action: 'student', childUid });
    if (active.current) setData(next);
  };
  useEffect(() => {
    active.current = true;
    load().catch(e => { if (active.current) setError(centerError(e, lang)); });
    return () => { active.current = false; };
  }, [childUid]);
  const run = async (action) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); window.dispatchEvent(new Event('synaq:center-change')); }
    catch (e) { if (active.current) setError(centerError(e, lang)); }
    finally { lock.current = false; if (active.current) setBusy(false); }
  };
  return <section className="cw-enrollment" id={`parent-center-${childUid}`}><span className="cw-eyebrow">SYNAQ CENTERS</span><h2>{text('Подключение к центру', 'Орталыққа қосылу')}{childName ? ` · ${childName}` : ''}</h2>
    {error && <p className="cw-alert" role="alert">{error}<button disabled={busy} onClick={() => run(load)}>{text('Обновить', 'Жаңарту')}</button></p>}
    {!data && !error && <p role="status">{text('Загружаем данные центра…', 'Орталық деректері жүктелуде…')}</p>}
    {data?.enrollment ? <><p><strong>{data.enrollment.centerName}</strong> · {data.enrollment.groupName}</p><p>{data.enrollment.licensed ? text('Центр предоставляет доступ к тренировкам, школьной программе и пробникам.', 'Орталық жаттығуларға, мектеп бағдарламасына және сынақтарға қолжетімділік береді.') : text('Подключение к группе активно. Учебный доступ определяется вашим семейным тарифом.', 'Топқа қосылу белсенді. Оқу қолжетімділігі отбасы тарифімен анықталады.')}</p><p>{text('Расписание и результаты доступны выше в разделе «Учёба в центре». Преподаватель видит имя, класс и выполнение назначенных тем с момента подключения.', 'Кесте мен нәтижелер жоғарыдағы «Орталықтағы оқу» бөлімінде. Мұғалім қосылған уақыттан бері аты-жөнін, сыныбын және берілген тақырыптардың орындалуын көреді.')}</p><button disabled={busy} onClick={() => run(async () => { await centerCall({ action: 'leave', childUid }); await load(); setConsent(false); setCode(''); })}>{text('Отключить ребёнка от центра', 'Баланы орталықтан ажырату')}</button></> : data && <form onSubmit={e => { e.preventDefault(); run(async () => { await centerCall({ action: 'enroll', childUid, code: code.trim(), consent }); await load(); }); }}>
      <p>{text('Получите код группы у преподавателя. Учебный прогресс ребёнка сохранится.', 'Топ кодын мұғалімнен алыңыз. Баланың оқу нәтижелері сақталады.')}</p><label>{text('Код группы', 'Топ коды')}<input required autoComplete="off" value={code} onChange={e => setCode(e.target.value)} /></label>
      <label className="cw-consent"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{text('Разрешаю центру видеть имя, класс и результаты ребёнка по назначенным темам с момента подключения. Доступ можно отозвать здесь.', 'Орталыққа қосылған сәттен бастап баланың аты-жөнін, сыныбын және берілген тақырыптар бойынша нәтижелерін көруге рұқсат беремін. Рұқсатты осында қайтарып алуға болады.')}</span></label>
      <button className="cw-primary" disabled={busy || !consent}>{text('Подключить к группе', 'Топқа қосу')} →</button>
    </form>}
  </section>;
}
