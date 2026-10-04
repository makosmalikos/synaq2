import React, { useEffect, useRef, useState } from 'react';
import { ADMIN_TOPICS, normalizeTask, validateTask, parseCsv, csvTemplate } from './adminTaskModel.js';

const messages = {
  ru: {
    kicker:'УПРАВЛЕНИЕ КОНТЕНТОМ', title:'Хорошие задачи. Понятный процесс.', intro:'Создавайте задания, проверяйте решения и публикуйте в общий банк для практики и пробников.',
    editor:'Добавить задачу', bank:'Банк задач', import:'Массовая загрузка', draft:'Черновик', reviewed:'Проверено', published:'Опубликовано',
    flow:'1. Черновик → 2. Проверка → 3. Публикация', school:'Школа', topic:'Тема', lang:'Язык задания', difficulty:'Сложность', type:'Тип ответа', open:'Короткий ответ', mcq:'Выбор ответа',
    statement:'Условие', answer:'Правильный ответ', solution:'Пошаговое решение', sourceNote:'Источник / заметка', option:'Вариант', addOption:'Добавить вариант', remove:'Удалить вариант',
    preview:'Предпросмотр', student:'Так ученик увидит задачу', check:'Ответ и разбор для проверки', save:'Сохранить черновик', review:'Отметить проверенным', publish:'Опубликовать в банк',
    confirm:'Я проверил условие, правильный ответ и объяснение.', saved:'Сохранено.', local:'Черновик сохранён на этом устройстве.', localError:'Автосохранение недоступно. Сохраните черновик кнопкой ниже.',
    locked:'Опубликованная задача защищена от изменения, чтобы сохранить результаты учеников. Для похожей задачи создайте копию и измените условие.', copy:'Создать копию', new:'Новая задача', resume:'Восстановлен ваш незавершённый черновик.',
    search:'Поиск по условию или теме', all:'Все статусы', refresh:'Обновить', more:'Загрузить ещё', bankHint:'Здесь показаны задачи, добавленные через админку. Поиск и фильтры работают по загруженным записям.', discard:'Открыть другую задачу? Несохранённые изменения текущей формы будут потеряны.', loaded:'Загружено задач', empty:'Задач пока нет', noMatch:'Нет задач по выбранному фильтру', edit:'Открыть', loading:'Загрузка…',
    uploadTitle:'Из таблицы — в банк задач', uploadHint:'Скачайте шаблон, заполните его в Excel и сохраните как CSV UTF-8. За один раз можно загрузить до 100 задач, файл до 1 МБ.', template:'Скачать шаблон CSV', file:'Выбрать CSV', csv:'Содержимое CSV — можно исправить прямо здесь', parse:'Проверить таблицу',
    csvHint:'Тема указывается кодом из списка ниже. Ответ для выбора — полный текст правильного варианта. Переносы строк внутри ячейки поддерживаются.', topicCodes:'Коды тем', rows:'Задач в таблице', valid:'Готово к импорту', invalid:'С ошибками', row:'Строка', importSave:'Сохранить как черновики', importDone:'Задачи импортированы как черновики. Откройте их в банке, проверьте и опубликуйте.',
    importNote:'Импорт не публикует задачи. Проверка формата не подтверждает правильность решения.', retry:'Исправьте отмеченные строки и снова проверьте таблицу.', busy:'Сохранение…', correct:'Правильный', required:'Заполните поля для проверки',
    bad_topic:'Выберите существующую тему.', bad_school:'Школа не соответствует теме.', bad_difficulty:'Сложность должна быть от 1 до 5.', bad_lang:'Проверьте язык; для языкового предмета он должен совпадать с предметом.', bad_status:'Некорректный статус.', bad_type:'Тип: open или mcq.', bad_statement:'Нужно условие до 4000 символов.', bad_solution:'Нужно решение до 4000 символов.', bad_source:'Источник — до 500 символов.', bad_answer:'Нужен ответ до 1000 символов.', bad_options:'Нужно 2–8 непустых вариантов до 1000 символов.', dup_options:'Варианты ответа повторяются.', answer_not_in_options:'Ответ должен совпадать с одним из вариантов.', duplicate_task:'Такая задача уже есть в банке или в этой таблице.', csv_headers:'Проверьте заголовки столбцов по шаблону.', csv_columns:'Количество ячеек не совпадает с заголовками.', csv_quotes:'Некорректные кавычки в CSV.', file_too_large:'Файл превышает 1 МБ.', batch_size:'Таблица должна содержать от 1 до 100 задач.', validation_failed:'Проверьте заполнение полей.', stale_revision:'Задачу уже изменили. Обновите банк и откройте актуальную версию.', published_locked:'Опубликованную задачу можно только скопировать.', review_required:'Сначала сохраните проверенную версию, затем опубликуйте.', not_allowed:'Нет доступа. Войдите заново как администратор.', server_not_configured:'Сервер сохранения не настроен.', payload_too_large:'Объём данных слишком большой. Разделите таблицу на меньшие части.', failed:'Не удалось выполнить запрос. Данные сохранены в форме; попробуйте снова.', not_found:'Задача не найдена.',
  },
  kk: {
    kicker:'КОНТЕНТТІ БАСҚАРУ', title:'Сапалы тапсырмалар. Түсінікті жұмыс.', intro:'Тапсырма жасаңыз, шешімін тексеріңіз және жаттығулар мен сынақтарға арналған ортақ қорға жариялаңыз.',
    editor:'Тапсырма қосу', bank:'Тапсырмалар қоры', import:'Жаппай жүктеу', draft:'Жоба', reviewed:'Тексерілген', published:'Жарияланған',
    flow:'1. Жоба → 2. Тексеру → 3. Жариялау', school:'Мектеп', topic:'Тақырып', lang:'Тапсырма тілі', difficulty:'Қиындық', type:'Жауап түрі', open:'Қысқа жауап', mcq:'Жауап таңдау',
    statement:'Шарт', answer:'Дұрыс жауап', solution:'Қадамдық шешім', sourceNote:'Дереккөз / ескерту', option:'Нұсқа', addOption:'Нұсқа қосу', remove:'Нұсқаны жою',
    preview:'Алдын ала қарау', student:'Оқушы тапсырманы осылай көреді', check:'Тексеруге арналған жауап пен шешім', save:'Жобаны сақтау', review:'Тексерілген деп белгілеу', publish:'Қорға жариялау', confirm:'Шартты, дұрыс жауапты және түсіндірмені тексердім.', saved:'Сақталды.', local:'Жоба осы құрылғыда сақталды.', localError:'Автосақтау қолжетімсіз. Төмендегі батырмамен сақтаңыз.',
    locked:'Оқушылар нәтижелерін сақтау үшін жарияланған тапсырма өзгертілмейді. Ұқсас тапсырма үшін көшірме жасап, шартын өзгертіңіз.', copy:'Көшірме жасау', new:'Жаңа тапсырма', resume:'Аяқталмаған жобаңыз қалпына келтірілді.',
    search:'Шарт немесе тақырып бойынша іздеу', all:'Барлық күй', refresh:'Жаңарту', more:'Тағы жүктеу', bankHint:'Мұнда әкімші қосқан тапсырмалар көрсетіледі. Іздеу мен сүзгілер жүктелген жазбаларға қолданылады.', discard:'Басқа тапсырманы ашу керек пе? Осы форманың сақталмаған өзгерістері жоғалады.', loaded:'Жүктелген тапсырмалар', empty:'Тапсырмалар әзірге жоқ', noMatch:'Бұл сүзгі бойынша тапсырма жоқ', edit:'Ашу', loading:'Жүктелуде…',
    uploadTitle:'Кестеден — тапсырмалар қорына', uploadHint:'Үлгіні жүктеп, Excel-де толтырыңыз және CSV UTF-8 форматында сақтаңыз. Бір ретте 100 тапсырмаға дейін, файл 1 МБ-қа дейін.', template:'CSV үлгісін жүктеу', file:'CSV таңдау', csv:'CSV мазмұны — осында түзетуге болады', parse:'Кестені тексеру', csvHint:'Тақырып төмендегі кодпен беріледі. Таңдау сұрағының жауабы — дұрыс нұсқаның толық мәтіні. Ұяшық ішіндегі жаңа жолдар қолдау табады.', topicCodes:'Тақырып кодтары', rows:'Кестедегі тапсырмалар', valid:'Импортқа дайын', invalid:'Қателері бар', row:'Жол', importSave:'Жоба ретінде сақтау', importDone:'Тапсырмалар жоба ретінде импортталды. Қордан ашып, тексеріңіз және жариялаңыз.', importNote:'Импорт тапсырмаларды жарияламайды. Форматты тексеру шешімнің дұрыстығын растамайды.', retry:'Белгіленген жолдарды түзетіп, кестені қайта тексеріңіз.', busy:'Сақталуда…', correct:'Дұрыс', required:'Тексеру үшін өрістерді толтырыңыз',
    bad_topic:'Қолданыстағы тақырыпты таңдаңыз.', bad_school:'Мектеп тақырыпқа сәйкес емес.', bad_difficulty:'Қиындық 1–5 аралығында болуы керек.', bad_lang:'Тілді тексеріңіз; тіл пәнінде пәнмен сәйкес болуы керек.', bad_status:'Күй қате.', bad_type:'Түрі: open немесе mcq.', bad_statement:'Шарт қажет, 4000 таңбаға дейін.', bad_solution:'Шешім қажет, 4000 таңбаға дейін.', bad_source:'Дереккөз 500 таңбаға дейін.', bad_answer:'Жауап қажет, 1000 таңбаға дейін.', bad_options:'2–8 бос емес нұсқа қажет, әрқайсысы 1000 таңбаға дейін.', dup_options:'Жауап нұсқалары қайталанады.', answer_not_in_options:'Жауап нұсқалардың бірімен сәйкес болуы керек.', duplicate_task:'Бұл тапсырма қорда немесе кестеде бар.', csv_headers:'Баған атауларын үлгімен салыстырыңыз.', csv_columns:'Ұяшық саны бағандарға сәйкес емес.', csv_quotes:'CSV тырнақшалары қате.', file_too_large:'Файл 1 МБ-тан үлкен.', batch_size:'Кестеде 1–100 тапсырма болуы керек.', validation_failed:'Өрістерді тексеріңіз.', stale_revision:'Тапсырма өзгертілген. Қорды жаңартып, қайта ашыңыз.', published_locked:'Жарияланған тапсырмадан көшірме жасаңыз.', review_required:'Алдымен тексерілген нұсқаны сақтаңыз, кейін жариялаңыз.', not_allowed:'Қолжетімсіз. Әкімші ретінде қайта кіріңіз.', server_not_configured:'Сақтау сервері бапталмаған.', payload_too_large:'Деректер тым үлкен. Кестені шағын бөліктерге бөліңіз.', failed:'Сұрау орындалмады. Деректер формада қалды; қайта көріңіз.', not_found:'Тапсырма табылмады.',
  },
};
const blank = (lang='ru') => ({ school:'РФМШ', topic:'eq', lang, difficulty:2, type:'open', statement:'', options:['','','',''], answer:'', solution:'', sourceNote:'', status:'draft' });
function restore(key,lang) {
  try { const raw = JSON.parse(localStorage.getItem(key)); if (raw?.version === 1 && raw.task && typeof raw.task.statement === 'string' && ADMIN_TOPICS.some((tp) => tp.id === raw.task.topic) && ['draft','reviewed'].includes(raw.task.status)) return { ...blank(), ...raw.task, options:Array.isArray(raw.task.options) ? raw.task.options : ['','','',''] }; } catch { /* storage optional */ }
  return blank(lang);
}
export default function AdminWorkspace({ request, lang='ru', storageKey='synaq-admin-draft' }) {
  const w = messages[lang] || messages.ru;
  const [tab,setTab] = useState('editor');
  const [form,setForm] = useState(() => restore(storageKey,lang));
  const [preview,setPreview] = useState(false), [checked,setChecked] = useState(false);
  const [error,setError] = useState(''), [notice,setNotice] = useState(''), [busy,setBusy] = useState(false), [localError,setLocalError] = useState(false);
  const [tasks,setTasks] = useState([]), [cursor,setCursor] = useState(null), [loading,setLoading] = useState(false), [search,setSearch] = useState(''), [status,setStatus] = useState('');
  const [csv,setCsv] = useState(''), [rows,setRows] = useState([]), [imported,setImported] = useState(false);
  const dirty = useRef(Boolean(form.statement));
  const saving = useRef(false), loadingRef = useRef(false), fileRef = useRef(null);
  const locked = form.status === 'published';
  const topicName = (id) => ADMIN_TOPICS.find((item) => item.id === id)?.[lang] || id;
  const errorText = (code) => w[code] || w.failed;
  useEffect(() => {
    try { if (!locked) localStorage.setItem(storageKey,JSON.stringify({version:1,task:form})); setLocalError(false); }
    catch { setLocalError(true); }
  },[form, storageKey, locked]);
  const change = (key,value) => {
    dirty.current = true;
    setForm((old) => ({ ...old, [key]:value, status:'draft' }));
    setChecked(false); setPreview(false); setError(''); setNotice('');
  };
  const load = async (more=false) => {
    if (loadingRef.current) return;
    loadingRef.current = true; setLoading(true); setError('');
    try { const data = await request({method:'GET', ...(more && cursor ? { queryCursor:cursor } : {}) });
      setTasks((old) => more ? [...old,...data.tasks.filter((task) => !old.some((item) => item.id === task.id))] : data.tasks); setCursor(data.cursor);
    } catch (cause) { setError(errorText(cause.message)); }
    finally { setLoading(false); loadingRef.current = false; }
  };
  const open = (task) => { if (dirty.current && !window.confirm(w.discard)) return; dirty.current=false; setForm({ ...task, options:task.options || ['','','',''] }); setTab('editor'); setPreview(task.status !== 'draft'); setChecked(false); setError(''); setNotice(''); };
  const newTask = () => { if (dirty.current && !window.confirm(w.discard)) return; dirty.current=false; setForm(blank(lang)); setPreview(false); setChecked(false); setError(''); setNotice(''); setTab('editor'); };
  const save = async (nextStatus) => {
    if (saving.current) return;
    const task = normalizeTask({ ...form, status:nextStatus });
    const errors = validateTask(task,nextStatus !== 'draft');
    if (errors.length) { setError(errors.map(errorText).join(' ')); return; }
    saving.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const data = await request({ method:form.id ? 'PATCH' : 'POST', body:JSON.stringify({ ...task, ...(form.id ? {id:form.id,revision:form.revision} : {}) }) });
      setForm({ ...task, id:data.id, revision:(form.revision || 0)+1, options:task.options || ['','','',''] });
      dirty.current=false; if (nextStatus === 'published') { try { localStorage.removeItem(storageKey); } catch {} } setNotice(w.saved); setChecked(false);
      setTasks((old) => old.map((item) => item.id === data.id ? { ...task,id:data.id,revision:(form.revision || 0)+1 } : item));
    } catch (cause) { setError(errorText(cause.message)); }
    finally { saving.current = false; setBusy(false); }
  };
  const analyze = () => {
    setError(''); setImported(false);
    try { setRows(parseCsv(csv)); } catch (cause) { setRows([]); setError(errorText(cause.message)); }
  };
  const file = async (event) => {
    const selected = event.target.files?.[0]; if (!selected) return;
    setRows([]); setImported(false); setError('');
    if (selected.size > 1000000) { setError(w.file_too_large); event.target.value=''; return; }
    try { const text = await selected.text(); setCsv(text); setRows(parseCsv(text)); }
    catch (cause) { setError(errorText(cause.message)); }
    event.target.value='';
  };
  const importTasks = async () => {
    if (saving.current || !rows.length || rows.some((row) => row.errors.length) || imported) return;
    saving.current = true; setBusy(true); setError('');
    try { await request({method:'POST', body:JSON.stringify({tasks:rows.map((row) => row.task)})}); setImported(true); setNotice(w.importDone); }
    catch (cause) {
      setError(errorText(cause.message));
      if (cause.issues) setRows((old) => old.map((row) => ({ ...row,errors:cause.issues.find((issue) => issue.row === row.row)?.errors || row.errors })));
    } finally { saving.current = false; setBusy(false); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([csvTemplate()],{type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a'); link.href=url; link.download='synaq-tasks-template.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  const visible = tasks.filter((task) => (!status || task.status === status) && `${task.statement} ${topicName(task.topic)}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <section className="aw">
    <div className="aw-hero"><div><p>{w.kicker}</p><h1>{w.title}</h1><span>{w.intro}</span></div><div className="aw-hero-mark" aria-hidden="true">✦</div></div>
    <div className="aw-toolbar"><nav className="aw-tabs" aria-label={w.kicker}>{['editor','bank','import'].map((item) => <button disabled={busy} key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); setError(''); setNotice(''); if (item === 'bank') load(); }}>{w[item]}</button>)}</nav><span className="aw-flow">{w.flow}</span></div>
    {error && <div className="aw-alert error" role="alert">{error}</div>}
    {notice && <div className="aw-alert success" role="status">{notice}</div>}
    {tab === 'editor' && <>
      <div className="aw-editor-heading"><span className={`aw-status ${form.status}`}>{w[form.status]}</span><button disabled={busy} className="aw-button secondary" onClick={newTask}>{w.new}</button></div>
      {locked && <p className="aw-alert">{w.locked} <button className="aw-button secondary" onClick={() => { const {id,revision,...copy} = form; open({ ...copy, status:'draft' }); }}>{w.copy}</button></p>}
      <div className="aw-editor-layout">
        <form className="aw-card" onSubmit={(event) => { event.preventDefault(); const errors=validateTask(form,true); if (errors.length) setError(errors.map(errorText).join(' ')); else {setPreview(true);setError('');} }}>
          <fieldset disabled={busy || locked}>
            <div className="aw-fields">
              <label>{w.topic}<select value={form.topic} onChange={(e) => { const tp=ADMIN_TOPICS.find((item) => item.id === e.target.value); dirty.current=true; setForm((old) => ({...old,topic:tp.id,school:tp.schools.includes(old.school)?old.school:tp.schools[0],lang:({kaz:'kk',rus:'ru',eng:'en'}[tp.subject] || old.lang),status:'draft'}));setPreview(false);setChecked(false); }}>
                {ADMIN_TOPICS.map((tp) => <option key={tp.id} value={tp.id}>{tp[lang] || tp.ru}</option>)}
              </select></label>
              <label>{w.school}<select value={form.school} onChange={(e) => change('school',e.target.value)}>{ADMIN_TOPICS.find((tp) => tp.id === form.topic)?.schools.map((school) => <option key={school}>{school}</option>)}</select></label>
              <label>{w.lang}<select value={form.lang} onChange={(e) => change('lang',e.target.value)}><option value="ru">Русский</option><option value="kk">Қазақша</option><option value="en">English</option></select></label>
              <label>{w.difficulty}<select value={form.difficulty} onChange={(e) => change('difficulty',Number(e.target.value))}>{[1,2,3,4,5].map((n) => <option key={n}>{n}</option>)}</select></label>
            </div>
            <label>{w.type}<select value={form.type} onChange={(e) => { change('type',e.target.value); change('answer',''); }}><option value="open">{w.open}</option><option value="mcq">{w.mcq}</option></select></label>
            <label>{w.statement}<textarea rows={6} maxLength={4000} value={form.statement} onChange={(e) => change('statement',e.target.value)} /></label>
            {form.type === 'mcq' && <div className="aw-options"><span>{w.answer}</span>{form.options.map((option,index) => <div className="aw-option-input" key={index}>
              <input type="radio" name="answer" aria-label={`${w.correct} ${String.fromCharCode(65+index)}`} checked={!!option && form.answer === option} onChange={() => change('answer',option)} />
              <label><span>{String.fromCharCode(65+index)}</span><input aria-label={`${w.option} ${String.fromCharCode(65+index)}`} maxLength={1000} value={option} onChange={(e) => {const options=[...form.options];options[index]=e.target.value;dirty.current=true;setForm((old)=>({...old,options,answer:old.answer===option?e.target.value:old.answer,status:'draft'}));setPreview(false);setChecked(false);}} /></label>
              {form.options.length > 2 && <button type="button" aria-label={`${w.remove} ${String.fromCharCode(65+index)}`} className="aw-remove" onClick={() => {change('options',form.options.filter((_,i)=>i!==index));if(form.answer===option)change('answer','');}}>×</button>}
            </div>)}{form.options.length < 8 && <button type="button" className="aw-button secondary" onClick={() => change('options',[...form.options,''])}>{w.addOption}</button>}</div>}
            {form.type === 'open' && <label>{w.answer}<input maxLength={1000} value={form.answer} onChange={(e) => change('answer',e.target.value)} /></label>}
            <label>{w.solution}<textarea rows={5} maxLength={4000} value={form.solution} onChange={(e) => change('solution',e.target.value)} /></label>
            <label>{w.sourceNote}<input maxLength={500} value={form.sourceNote} onChange={(e) => change('sourceNote',e.target.value)} /></label>
          </fieldset>
          {!locked && <div className="aw-actions"><button type="button" disabled={busy} className="aw-button secondary" onClick={() => save('draft')}>{busy ? w.busy : w.save}</button><button type="submit" disabled={busy} className="aw-button">{w.preview}</button></div>}
          {!locked && <p className="aw-hint" role="status">{localError ? w.localError : w.local}</p>}
        </form>
        <aside className="aw-preview"><div className="aw-card"><p className="aw-eyebrow">{w.student}</p><div className="aw-tags"><span>{form.school}</span><span>{topicName(form.topic)}</span><span>{form.lang.toUpperCase()}</span></div><h2 className="aw-statement">{form.statement || w.statement}</h2>{form.type === 'mcq' && <div className="aw-answer-options">{form.options.map((option,i) => <div key={i}><b>{String.fromCharCode(65+i)}</b><span>{option || '…'}</span></div>)}</div>}</div>
          {preview && <div className="aw-card"><p className="aw-eyebrow">{w.check}</p><strong>{form.answer}</strong><p className="aw-solution">{form.solution}</p>{form.sourceNote && <p className="aw-hint">{form.sourceNote}</p>}
            {!locked && (form.status === 'reviewed' ? <button disabled={busy} className="aw-button" onClick={() => save('published')}>{busy ? w.busy : w.publish}</button> : <><label className="aw-check"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />{w.confirm}</label><button disabled={busy || !checked || !form.id} className="aw-button" onClick={() => save('reviewed')}>{w.review}</button>{!form.id && <p className="aw-hint">{w.save}</p>}</>)}
          </div>}
        </aside>
      </div>
    </>}
    {tab === 'bank' && <div className="aw-card"><div className="aw-bank-tools"><label className="aw-search">{w.search}<input type="search" value={search} onChange={(e)=>setSearch(e.target.value)} /></label><label>{w.all}<select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">{w.all}</option>{['draft','reviewed','published'].map((value)=><option key={value} value={value}>{w[value]}</option>)}</select></label><button className="aw-button secondary" disabled={loading} onClick={()=>load()}>{w.refresh}</button></div><p className="aw-hint">{w.bankHint}<br />{w.loaded}: {tasks.length}</p>
      {!visible.length && <p>{loading ? w.loading : tasks.length ? w.noMatch : w.empty}</p>}
      <div className="aw-task-list">{visible.map((task)=><article key={task.id}><div><div className="aw-tags"><span className={`aw-status ${task.status}`}>{w[task.status]}</span><span>{task.school} · {task.lang.toUpperCase()}</span><span>{topicName(task.topic)}</span></div><p>{task.statement}</p></div><button className="aw-button secondary" onClick={()=>open(task)}>{w.edit}</button></article>)}</div>
      {cursor && <button className="aw-button secondary" disabled={loading} onClick={()=>load(true)}>{loading?w.loading:w.more}</button>}
    </div>}
    {tab === 'import' && <div className="aw-card"><p className="aw-eyebrow">CSV / EXCEL</p><h2>{w.uploadTitle}</h2><p className="aw-hint">{w.uploadHint}</p><div className="aw-actions"><button className="aw-button secondary" onClick={download}>{w.template}</button><button disabled={busy} className="aw-button" onClick={()=>fileRef.current?.click()}>{w.file}</button><input ref={fileRef} type="file" accept=".csv,.tsv,text/csv" onChange={file} hidden /></div>
      <details className="aw-code-list"><summary>{w.topicCodes}</summary>{ADMIN_TOPICS.map((tp)=><p key={tp.id}><code>{tp.id}</code> — {tp[lang]} · {tp.schools.join(', ')}</p>)}</details>
      <p className="aw-hint">{w.csvHint}</p><label>{w.csv}<textarea className="aw-csv" disabled={busy} rows={7} value={csv} onChange={(e)=>{setCsv(e.target.value);setRows([]);setImported(false);setNotice('');}} /></label><button className="aw-button secondary" disabled={busy || !csv} onClick={analyze}>{w.parse}</button>
      {!!rows.length && <><div className="aw-import-stats"><span>{w.rows}: <b>{rows.length}</b></span><span>{w.valid}: <b>{rows.filter((row)=>!row.errors.length).length}</b></span><span>{w.invalid}: <b>{rows.filter((row)=>row.errors.length).length}</b></span></div><div className="aw-import-rows">{rows.map((row)=><details key={row.row} className={row.errors.length?'has-errors':''}><summary>{w.row} {row.row} · {row.task.statement.slice(0,90) || w.statement}<span>{row.errors.length?'!':'✓'}</span></summary>{row.errors.map((code)=><p className="aw-error-text" key={code}>{errorText(code)}</p>)}<p className="aw-statement">{row.task.statement}</p>{row.task.options && <ul>{row.task.options.map((option,index)=><li key={index}>{option}</li>)}</ul>}<p><b>{w.answer}:</b> {row.task.answer}</p><p className="aw-solution">{row.task.solution}</p></details>)}</div><p className="aw-hint">{w.importNote}</p><button className="aw-button" disabled={busy || imported || rows.some((row)=>row.errors.length)} onClick={importTasks}>{busy?w.busy:w.importSave}</button></>}
    </div>}
  </section>;
}
