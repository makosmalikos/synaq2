import PwaInstall from './PwaInstall.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from './firebase.js';
import { useLang, LangToggle } from './i18n.jsx';
import Brand from './Brand.jsx';
import BrandLoader from './components/BrandLoader.jsx';
import { centerCall, centerError, centerDate, almatyInput, almatyTime, progressLabel, journalCsv } from './centerApi.js';
import './CenterWorkspace.css';
import CenterScheduleEditor from './CenterScheduleEditor.jsx';

export default function CenterWorkspace({ onExit }) {
  const { lang } = useLang(), text = (ru, kk) => lang === 'ru' ? ru : kk;
  const [data, setData] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [section, setSection] = useState('journal'), [groupId, setGroupId] = useState('');
  const [code, setCode] = useState(() => new URLSearchParams(window.location.search).get('invite') || '');
  const [invitation, setInvitation] = useState(null), [notice, setNotice] = useState('');
  const [centerName, setCenterName] = useState(''), [groupName, setGroupName] = useState(''), [teacherUid, setTeacherUid] = useState('');
  const [email, setEmail] = useState(''), [title, setTitle] = useState(''), [topicId, setTopicId] = useState('num');
  const [target, setTarget] = useState(10), [instructions, setInstructions] = useState('');
  const [due, setDue] = useState(() => almatyInput(Date.now() + 3 * 86400000));
  const [search, setSearch] = useState('');
  const [removingStudent, setRemovingStudent] = useState('');
  const lock = useRef(false), version = useRef(0), alive = useRef(true);
  const errorBox = useRef(null);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);
  const centerId = useRef(crypto.randomUUID()), newGroupId = useRef(crypto.randomUUID()), assignmentId = useRef(crypto.randomUUID());
  const load = async (selected = groupId) => {
    const request = ++version.current;
    const result = await centerCall({ action: 'workspace', groupId: selected });
    if (alive.current && request === version.current) {
      setData(result); setGroupId(result.selectedGroupId || '');
      setTeacherUid(value => result.staff.some(s => s.uid === value) ? value : result.staff[0]?.uid || '');
    }
  };
  useEffect(() => {
    alive.current = true;
    load('').catch(e => { if (alive.current) setError(centerError(e, lang)); });
    return () => { alive.current = false; version.current++; };
  }, []);
  const run = async (work) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); }
    catch (e) { if (alive.current) setError(centerError(e, lang)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const mutate = async (body) => {
    await centerCall({ centerId: data?.center?.id, groupId, ...body });
    await load();
  };
  const submit = (work) => (event) => { event.preventDefault(); run(work); };
  const owner = data?.center?.role === 'owner';
  const group = data?.groups.find(g => g.id === groupId);
  const filtered = data?.students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) || [];
  const maxTarget = Math.min(50, data?.topics.find(topic => topic.id === topicId)?.count || 50);
  const completed = data?.students.reduce((n, s) => n + Object.values(s.progress).filter(p => p.completedAt).length, 0) || 0;
  const total = (data?.students.length || 0) * (data?.assignments.length || 0);
  const overdue = data?.students.filter(s => Object.values(s.progress).some(p => p.status === 'overdue')).length || 0;
  const invite = (kind) => run(async () => {
    const result = await centerCall({ action: 'invite', centerId: data.center.id, groupId, kind, ...(kind === 'teacher' ? { email } : {}) });
    setInvitation({ ...result, kind, groupName: group?.name });
  });
  const selectGroup = (value) => run(async () => { setInvitation(null); setRemovingStudent(''); await load(value); });
  const studentRemoval = student => removingStudent === student.childUid ? <div className="cw-remove-confirm" role="group" aria-label={text('Подтверждение отключения', 'Ажыратуды растау')}><span>{text(`Отключить ${student.name} от группы?`, `${student.name} оқушысын топтан ажырату керек пе?`)}</span><button disabled={busy} onClick={() => run(async () => { await mutate({ action: 'remove_student', childUid: student.childUid }); setRemovingStudent(''); })}>{text('Да, отключить', 'Иә, ажырату')}</button><button disabled={busy} onClick={() => setRemovingStudent('')}>{text('Оставить', 'Қалдыру')}</button></div> : <button className="cw-remove" disabled={busy} onClick={() => setRemovingStudent(student.childUid)}>{text('Отключить', 'Ажырату')}</button>;
  const exportJournal = () => {
    const url = URL.createObjectURL(new Blob([journalCsv(data.students, data.assignments)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'synaq-journal.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="cw-app">
    <header className="cw-header">
      <div className="cw-header-inner">
        <a href="/" className="cw-brand"><Brand compact /><span>{text('Для центров', 'Орталықтарға')}</span></a>
        <nav aria-label={text('Разделы центра', 'Орталық бөлімдері')}>
          {['journal', 'assignments', 'schedule', ...(owner ? ['team'] : [])].map(id => <button key={id} aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}>{({ schedule: text('Расписание', 'Кесте'), journal: text('Журнал группы', 'Топ журналы'), assignments: text('Задания', 'Тапсырмалар'), team: text('Группы и команда', 'Топтар мен ұжым') })[id]}</button>)}
          <PwaInstall />
        </nav>
        <div className="cw-header-actions"><LangToggle /><a href="/app">{text('Семейный кабинет', 'Отбасы кабинеті')}</a><button onClick={onExit}>{text('Выйти', 'Шығу')}</button></div>
      </div>
    </header>
    <main className="cw-main">
      <div className="cw-topbar">
        <div className="cw-center-label"><span>{owner ? text('Кабинет руководителя', 'Басшы кабинеті') : data?.center ? text('Кабинет преподавателя', 'Мұғалім кабинеті') : text('Начало работы', 'Жұмысты бастау')}</span><strong>{data?.center?.name || text('Synaq для центров', 'Орталықтарға арналған Synaq')}</strong></div>
        <button disabled={busy} onClick={() => run(() => load())}>{busy ? '…' : text('Обновить данные', 'Деректерді жаңарту')} ↻</button>
      </div>
      <PwaInstall card />
      {error && <div ref={errorBox} tabIndex={-1} className="cw-alert" role="alert">{error}{!data && <button disabled={busy} onClick={() => run(() => load(''))}>{text('Повторить', 'Қайталау')}</button>}</div>}
      {notice && <div className="cw-notice" role="status">{notice}</div>}
      {!data && !error && <BrandLoader />}
      {data && !data.center && <>
        <div className="cw-heading"><span className="cw-eyebrow">SYNAQ CENTERS</span><h1>{text('Ваш центр. Одна платформа.', 'Сіздің орталық. Бір платформа.')}</h1><p>{text('Объедините группы, самостоятельную практику и результаты учеников.', 'Топтарды, өздік жаттығуды және оқушылар нәтижелерін біріктіріңіз.')}</p></div>
        <div className="cw-setup-grid">
          <section className="cw-panel"><span className="cw-step">01</span><h2>{text('Я руководитель центра', 'Мен орталық басшысымын')}</h2><p>{text('Создайте центр, добавьте группы и пригласите преподавателей. Подключение учебной лицензии — через администратора Synaq.', 'Орталық пен топтарды құрып, мұғалімдерді шақырыңыз. Оқу лицензиясын Synaq әкімшісі қосады.')}</p>
            <form onSubmit={submit(async () => { await centerCall({ action: 'create', id: centerId.current, name: centerName }); await load(''); setSection('team'); })}>
              <label>{text('Название центра', 'Орталық атауы')}<input required maxLength={100} value={centerName} onChange={e => setCenterName(e.target.value)} placeholder="Bilim Academy" /></label><button className="cw-primary" disabled={busy}>{text('Создать центр', 'Орталық құру')} →</button>
            </form>
          </section>
          <section className="cw-panel"><span className="cw-step">02</span><h2>{text('Я преподаватель', 'Мен мұғаліммін')}</h2><p>{text('Введите код от руководителя. Приглашение привязано к вашей подтверждённой почте.', 'Басшы берген кодты енгізіңіз. Шақыру расталған поштаңызға байланған.')}</p>
            <form onSubmit={submit(async () => { await centerCall({ action: 'join_staff', code: code.trim() }); await load(''); })}>
              <label>{text('Код приглашения', 'Шақыру коды')}<input required value={code} onChange={e => setCode(e.target.value)} autoComplete="off" /></label><button className="cw-primary" disabled={busy}>{text('Присоединиться', 'Қосылу')} →</button>
            </form>
            {!auth.currentUser?.emailVerified && <div className="cw-verification"><button disabled={busy} onClick={() => run(async () => { await sendEmailVerification(auth.currentUser); setNotice(text('Письмо отправлено. Откройте ссылку для подтверждения.', 'Хат жіберілді. Растау сілтемесін ашыңыз.')); })}>{text('Подтвердить почту', 'Поштаны растау')}</button><button disabled={busy} onClick={() => run(async () => { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); setNotice(auth.currentUser.emailVerified ? text('Почта подтверждена.', 'Пошта расталды.') : text('Почта ещё не подтверждена.', 'Пошта әлі расталмады.')); })}>{text('Проверить почту', 'Поштаны тексеру')}</button></div>}
          </section>
        </div>
      </>}
      {data?.center && <>
        <div className={`cw-heading ${section === 'journal' ? 'cw-hero' : ''}`}><span className="cw-eyebrow">{text('УЧИМСЯ ВМЕСТЕ', 'БІРГЕ ҮЙРЕНЕМІЗ')}</span><h1>{section === 'journal' ? text('Вся группа перед вами', 'Бүкіл топ көз алдыңызда') : section === 'assignments' ? text('Практика между занятиями', 'Сабақ арасындағы жаттығу') : section === 'schedule' ? text('Расписание вашего центра', 'Орталықтың сабақ кестесі') : text('Центр начинается с команды', 'Орталық ұжымнан басталады')}</h1><p>{text('Помогайте ученикам двигаться вперёд. Задания, практика и прогресс вашей группы — здесь.', 'Оқушыларға алға жылжуға көмектесіңіз. Топтың тапсырмалары, жаттығулары мен жетістіктері осында.')}</p>{section === 'journal' && <><button className="cw-primary cw-hero-action" onClick={() => setSection('assignments')}>{text('Назначить задание', 'Тапсырма беру')} <span aria-hidden="true">↗</span></button><img className="cw-hero-owl" src="/mascot/synaq-owl-study.webp" alt="" width="220" height="220" /></>}</div>
        <div className="cw-license"><span className={`cw-dot ${data.center.license?.active && data.center.license.expiresAt > Date.now() ? 'on' : ''}`} /><span>{data.center.license?.active && data.center.license.expiresAt > Date.now() ? text(`Учебная лицензия до ${centerDate(data.center.license.expiresAt, lang)} · ${data.center.studentCount}/${data.center.license.seatLimit} мест`, `${centerDate(data.center.license.expiresAt, lang)} дейін оқу лицензиясы · ${data.center.studentCount}/${data.center.license.seatLimit} орын`) : text('Лицензия не активна. Ученики используют свои тарифы. Подключение до 30 учеников; для учебной лицензии обратитесь в Synaq.', 'Лицензия белсенді емес. Оқушылар өз тарифін қолданады. 30 оқушыға дейін қосуға болады; оқу лицензиясы үшін Synaq-қа жазыңыз.')}</span></div>
        <div className="cw-metrics"><article><span>{text('Учеников в группе', 'Топтағы оқушылар')}</span><strong>{data.students.length}</strong><small>{group?.name || text('Создайте первую группу', 'Алғашқы топты құрыңыз')}</small></article><article><span>{text('Заданий за 30 дней', '30 күндегі тапсырмалар')}</span><strong>{data.assignments.length}</strong><small>{text('Активные задания', 'Белсенді тапсырмалар')}</small></article><article><span>{text('Выполнение заданий', 'Тапсырмалардың орындалуы')}</span><strong>{total ? Math.round(completed / total * 100) + '%' : '—'}</strong><small>{completed} / {total}</small></article><article><span>{text('Нужна поддержка', 'Қолдау қажет')}</span><strong>{overdue}</strong><small>{text('Учеников с просрочкой', 'Мерзімі өткен оқушылар')}</small></article></div>
        {section !== 'team' && <div className="cw-toolbar"><label>{text('Группа', 'Топ')}<select aria-label={text('Выбрать группу', 'Топты таңдау')} disabled={busy || !data.groups.length} value={groupId} onChange={e => selectGroup(e.target.value)}>{!data.groups.length && <option value="">{text('Пока нет групп', 'Топтар әлі жоқ')}</option>}{data.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label><div className="cw-toolbar-actions">{group && <button disabled={busy} onClick={() => invite('student')}>+ {text('Пригласить учеников', 'Оқушыларды шақыру')}</button>}{owner && <button onClick={() => setSection('team')}>+ {text('Новая группа', 'Жаңа топ')}</button>}</div></div>}
        {invitation && <section className="cw-invite" role="status"><div><strong>{invitation.kind === 'student' ? text(`Приглашение в группу «${invitation.groupName}»`, `«${invitation.groupName}» тобына шақыру`) : text('Приглашение преподавателя', 'Мұғалімге шақыру')}</strong><p>{invitation.kind === 'student' ? text('Передайте родителям. В кабинете родителя: «Подключение к центру» → ввести код. Новый код заменяет предыдущий.', 'Ата-аналарға беріңіз. Ата-ана кабинетінде: «Орталыққа қосылу» → кодты енгізу. Жаңа код ескісін ауыстырады.') : text('Передайте преподавателю. Войти нужно с указанной почтой.', 'Мұғалімге беріңіз. Көрсетілген пошта арқылы кіру керек.')}</p><code>{invitation.code}</code><small>{text('Действует до ', 'Жарамды мерзімі: ')}{centerDate(invitation.expiresAt, lang)}</small></div><button onClick={() => run(async () => { await navigator.clipboard.writeText(invitation.kind === 'teacher' ? `${window.location.origin}/centers?invite=${invitation.code}` : invitation.code); setNotice(text('Приглашение скопировано.', 'Шақыру көшірілді.')); })}>{text('Копировать', 'Көшіру')}</button></section>}
        {section === 'journal' && <section className="cw-panel cw-journal"><div className="cw-panel-head"><div><h2>{text('Журнал результатов', 'Нәтижелер журналы')}</h2><p>{text('Уникальные задачи по теме после назначения и подключения к группе. Время — Алматы.', 'Тапсырма берілгеннен және топқа қосылғаннан кейінгі бірегей есептер. Уақыт — Алматы.')}</p></div><button disabled={!data.students.length || !data.assignments.length || busy} onClick={exportJournal}>{text('Скачать CSV', 'CSV жүктеу')} ↓</button></div>
          <input aria-label={text('Поиск ученика', 'Оқушыны іздеу')} placeholder={text('Найти ученика…', 'Оқушыны табу…')} value={search} onChange={e => setSearch(e.target.value)} />
          {data.students.some(s => s.truncated) && <p className="cw-alert">{text('Часть результатов не вошла в лимит 1000 ответов на ученика. Показаны неполные данные; проценты могут быть занижены.', 'Бір оқушыға 1000 жауап шегінен асқан нәтижелер қамтылмады. Деректер толық емес; пайыздар төмен болуы мүмкін.')}</p>}
          {data.students.length > 0 && <div className="cw-journal-mobile">{filtered.map(s => <details key={s.childUid} className="cw-student-card"><summary><span className="cw-avatar" aria-hidden="true">{s.name.slice(0, 1)}</span><span><strong>{s.name}{s.truncated && ' *'}</strong><small>{text('Выполнено заданий', 'Орындалған тапсырмалар')}: {Object.values(s.progress).filter(p => p.completedAt).length}/{data.assignments.length}</small></span></summary><div className="cw-student-card-body">{data.assignments.map(a => { const p = s.progress[a.id]; return <article key={a.id}><h3>{a.title}</h3><small>{text('До ', 'Мерзімі: ')}{centerDate(a.dueAt, lang)}</small><div className="cw-student-result"><strong>{p.answered}/{p.target}</strong><span className={`cw-status ${p.status}`}>{progressLabel(p.status, lang)}</span></div><small>{p.accuracy == null ? text('Ещё нет ответов', 'Әлі жауап жоқ') : text(`Точность ${p.accuracy}%`, `Дәлдік ${p.accuracy}%`)}</small></article>; })}{!data.assignments.length && <p>{text('Назначьте первое задание во вкладке «Задания».', '«Тапсырмалар» бөлімінде алғашқы тапсырманы беріңіз.')}</p>}{studentRemoval(s)}</div></details>)}{!filtered.length && <p className="cw-empty">{text('Ученики не найдены.', 'Оқушылар табылмады.')}</p>}</div>}
          {!data.students.length ? <div className="cw-empty"><span>↗</span><h3>{text('Здесь появится ваша группа', 'Мұнда сіздің тобыңыз көрсетіледі')}</h3><p>{group ? text('Создайте приглашение и передайте код родителям учеников.', 'Шақыру жасап, кодты оқушылардың ата-аналарына беріңіз.') : text('Руководитель создаёт группу и назначает преподавателя.', 'Басшы топты құрып, мұғалімді тағайындайды.')}</p></div> : <div className="cw-table-wrap cw-journal-desktop"><table><thead><tr><th>{text('Ученик', 'Оқушы')}</th>{data.assignments.map(a => <th key={a.id}>{a.title}<small>{centerDate(a.dueAt, lang)}</small></th>)}</tr></thead><tbody>{filtered.map(s => <tr key={s.childUid}><th scope="row"><span className="cw-avatar">{s.name.slice(0, 1)}</span>{s.name}{s.truncated && ' *'}<small>{s.klass ? text(`${s.klass} класс`, `${s.klass} сынып`) : ''}</small>{studentRemoval(s)}</th>{data.assignments.map(a => { const p = s.progress[a.id]; return <td key={a.id}><strong>{p.answered}/{p.target}</strong><span className={`cw-status ${p.status}`}>{progressLabel(p.status, lang)}</span><small>{p.accuracy == null ? '—' : text(`Точность ${p.accuracy}%`, `Дәлдік ${p.accuracy}%`)}</small></td>; })}</tr>)}</tbody></table>{!filtered.length && <p className="cw-empty">{text('Ученики не найдены.', 'Оқушылар табылмады.')}</p>}{!data.assignments.length && <p className="cw-empty">{text('Назначьте первое задание во вкладке «Задания».', '«Тапсырмалар» бөлімінде алғашқы тапсырманы беріңіз.')}</p>}</div>}
        </section>}
        {section === 'schedule' && data.scheduleTruncated && <p className="cw-alert" role="status">{text('Показаны первые 1000 записей расписания. Остальные занятия не отображены.', 'Кестенің алғашқы 1000 жазбасы көрсетілді. Қалған сабақтар көрсетілмеді.')}</p>}
        {section === 'schedule' && <CenterScheduleEditor key={groupId} schedule={data.schedule} group={group} lang={lang} busy={busy} onRun={run} onSave={mutate} />}
        {section === 'assignments' && <div className="cw-assignment-grid"><section className="cw-panel"><h2>{text('Новое задание', 'Жаңа тапсырма')}</h2><p>{text('Выберите тему и число разных задач. Неверные ответы тоже учитываются в выполнении; точность показывается отдельно.', 'Тақырып пен әртүрлі есеп санын таңдаңыз. Қате жауаптар да орындауға есептеледі; дәлдік бөлек көрсетіледі.')}</p><form onSubmit={submit(async () => { await mutate({ action: 'assign', id: assignmentId.current, title, instructions, topicId, target: Number(target), dueAt: almatyTime(due) }); assignmentId.current = crypto.randomUUID(); setTitle(''); setInstructions(''); setNotice(text('Задание назначено группе.', 'Тапсырма топқа берілді.')); })}>
          <label>{text('Название', 'Атауы')}<input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder={text('Закрепляем дроби', 'Бөлшектерді бекіту')} /></label>
          <label>{text('Тема', 'Тақырып')}<select value={topicId} onChange={e => { setTopicId(e.target.value); const count = data.topics.find(t => t.id === e.target.value)?.count || 50; setTarget(value => Math.min(Number(value) || 1, count, 50)); }}>{data.topics.filter(t => t.count > 0).map(t => <option key={t.id} value={t.id}>{lang === 'ru' ? t.nameRu || t.name : t.name}</option>)}</select></label>
          <div className="cw-form-row"><label>{text('Количество задач', 'Есеп саны')}<input required type="number" min="1" max={maxTarget} value={target} onChange={e => setTarget(e.target.value)} /></label><label>{text('Срок · Алматы', 'Мерзім · Алматы')}<input required type="datetime-local" value={due} min={almatyInput(Date.now())} max={almatyInput(Date.now() + 30 * 86400000)} onInput={e => setDue(e.currentTarget.value)} onChange={e => setDue(e.target.value)} /></label></div>
          <label>{text('Комментарий ученикам', 'Оқушыларға түсініктеме')}<textarea maxLength={1000} rows={3} value={instructions} onChange={e => setInstructions(e.target.value)} /></label>
          <button className="cw-primary" disabled={busy || !group}>{text('Назначить группе', 'Топқа беру')} →</button>
        </form></section><section className="cw-panel"><h2>{text('Задания группы', 'Топ тапсырмалары')}</h2>{!data.assignments.length && <p className="cw-empty">{text('Пока нет заданий за последние 30 дней.', 'Соңғы 30 күнде тапсырмалар жоқ.')}</p>}{data.assignments.map(a => <article className="cw-assignment" key={a.id}><span className="cw-eyebrow">{a.target} {text('ЗАДАЧ', 'ЕСЕП')}</span><h3>{a.title}</h3><p>{a.instructions}</p><small>{text('До ', 'Мерзімі: ')}{centerDate(a.dueAt, lang)}</small><button disabled={busy} onClick={() => run(() => mutate({ action: 'archive_assignment', id: a.id }))}>{text('В архив', 'Мұрағатқа')}</button></article>)}</section></div>}
        {section === 'team' && owner && <div className="cw-assignment-grid"><section className="cw-panel"><h2>{text('Группы', 'Топтар')}</h2><form onSubmit={submit(async () => { await mutate({ action: 'group', id: newGroupId.current, name: groupName, teacherUid }); newGroupId.current = crypto.randomUUID(); setGroupName(''); })}><label>{text('Название группы', 'Топ атауы')}<input required maxLength={100} value={groupName} onChange={e => setGroupName(e.target.value)} placeholder={text('НИШ · 6 класс · утро', 'НЗМ · 6 сынып · таңғы')} /></label><label>{text('Преподаватель', 'Мұғалім')}<select value={teacherUid} onChange={e => setTeacherUid(e.target.value)}>{data.staff.map(s => <option value={s.uid} key={s.uid}>{s.name}</option>)}</select></label><button className="cw-primary" disabled={busy}>{text('Создать группу', 'Топ құру')} +</button></form>
          <div className="cw-list">{data.groups.map(g => <article key={g.id}><div><strong>{g.name}</strong><small>{data.staff.find(s => s.uid === g.teacherUid)?.name}</small></div><label><span className="cw-sr-only">{text('Преподаватель группы', 'Топ мұғалімі')} {g.name}</span><select disabled={busy} value={g.teacherUid} onChange={e => run(() => mutate({ action: 'group', id: g.id, name: g.name, teacherUid: e.target.value }))}>{data.staff.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}</select></label><button disabled={busy} onClick={() => { setSection('journal'); selectGroup(g.id); }}>{text('Открыть', 'Ашу')} →</button></article>)}</div>
        </section><section className="cw-panel"><h2>{text('Команда центра', 'Орталық ұжымы')}</h2><p>{text('Преподаватель видит только назначенные ему группы. Руководитель видит весь центр.', 'Мұғалім тек өзіне берілген топтарды көреді. Басшы бүкіл орталықты көреді.')}</p><form onSubmit={e => { e.preventDefault(); invite('teacher'); }}><label>{text('Почта преподавателя', 'Мұғалім поштасы')}<input required type="email" maxLength={120} value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@example.kz" /></label><button className="cw-primary" disabled={busy}>{text('Создать приглашение', 'Шақыру жасау')} →</button></form><div className="cw-list">{data.staff.map(s => <article key={s.uid}><div><strong>{s.name}</strong><small>{s.role === 'owner' ? text('Руководитель', 'Басшы') : text('Преподаватель', 'Мұғалім')}</small></div>{s.role !== 'owner' && <button disabled={busy} onClick={() => run(() => mutate({ action: 'remove_teacher', teacherUid: s.uid }))}>{text('Отключить', 'Ажырату')}</button>}</article>)}</div><p className="cw-footnote">{text('При отключении преподавателя его группы переходят руководителю.', 'Мұғалім ажыратылғанда оның топтары басшыға өтеді.')}</p></section></div>}
      </>}
    </main>
  </div>;
}
