import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import { CURRICULUM, createCurriculumQuestions, curriculumAnswersMatch } from './curriculumData.js';
import { auth, saveAttempt, startLearningSession } from './firebase.js';

const curriculumPracticeKey = (uid) => `synaq_curriculum_practice_v1_${uid}`;
const blockedPracticeCodes = new Set(['learning/daily-limit', 'learning/pro-required', 'learning/session-expired', 'learning/rate-limit']);

export function readCurriculumPractice(uid, storage) {
  try {
    const raw = (storage || globalThis.sessionStorage).getItem(curriculumPracticeKey(uid));
    if (!raw) return { record: null, error: null };
    const record = JSON.parse(raw);
    if (!record || record.version !== 1 || record.uid !== uid || typeof record.id !== 'string' || !record.id
      || !CURRICULUM[record.grade]?.some((item) => item.key === record.topicKey)
      || ![5, 10, 15, 20].includes(record.count) || !['easy', 'medium', 'hard', 'mixed'].includes(record.level)
      || !Number.isInteger(record.index) || record.index < 0 || record.index >= record.count
      || !Number.isInteger(record.score) || record.score < 0 || record.score > record.index + 1
      || typeof record.answer !== 'string' || record.answer.length > 2000 || typeof record.finished !== 'boolean'
      || (record.feedback !== null && typeof record.feedback?.correct !== 'boolean')
      || (record.pendingStart && (typeof record.pendingStart.id !== 'string' || !record.pendingStart.id))
      || (record.questionSession && (typeof record.questionSession.id !== 'string'
        || typeof record.questionSession.question?.text?.ru !== 'string'
        || typeof record.questionSession.question?.text?.kk !== 'string'))
      || (record.pendingSave && (record.pendingSave.id !== record.questionSession?.id
        || record.pendingSave.payload?.sessionId !== record.questionSession?.id
        || typeof record.pendingSave.payload?.answer !== 'string'))
      || (record.pendingStart && record.pendingSave) || (record.feedback && record.pendingSave)
      || (!record.finished && !record.questionSession && !record.pendingStart)) return { record: null, error: 'invalid' };
    return { record, error: null };
  } catch (error) {
    return { record: null, error: error instanceof SyntaxError ? 'invalid' : 'unavailable' };
  }
}

export function writeCurriculumPractice(record, storage) {
  try {
    (storage || globalThis.sessionStorage).setItem(curriculumPracticeKey(record.uid), JSON.stringify({ ...record, version: 1 }));
    return true;
  } catch { return false; }
}

export function clearCurriculumPractice(uid, id, storage) {
  try {
    const target = storage || globalThis.sessionStorage;
    const { record, error } = readCurriculumPractice(uid, target);
    if (id && error) return false;
    if (!id || record?.id === id) target.removeItem(curriculumPracticeKey(uid));
    return true;
  } catch { return false; }
}

export function curriculumPracticeError(code, ru) {
  if (code === 'learning/daily-limit') return ru ? 'На сегодня использованы 5 бесплатных ответов. Продолжи завтра или открой Pro.' : 'Бүгінгі 5 тегін жауап қолданылды. Ертең жалғастыр немесе Pro аш.';
  if (code === 'learning/pro-required') return ru ? 'Для этой темы или сложности нужен Pro. Можно вернуться к доступным урокам.' : 'Бұл тақырып немесе деңгей үшін Pro қажет. Қолжетімді сабақтарға оралуға болады.';
  if (code === 'learning/session-expired') return ru ? 'Срок этой задачи истёк. Начни новую задачу — сохранённые результаты останутся.' : 'Бұл есептің мерзімі аяқталды. Жаңа есепті баста — сақталған нәтижелер қалады.';
  if (code === 'learning/rate-limit') return ru ? 'Слишком много запусков за сегодня. Сохранённые результаты доступны; продолжи позже.' : 'Бүгін тым көп іске қосу болды. Сақталған нәтижелер қолжетімді; кейін жалғастыр.';
  return ru ? 'Не удалось связаться с сервером. Ответ и текущая задача не изменены. Попробуй ещё раз.' : 'Сервермен байланысу мүмкін болмады. Жауабың және ағымдағы есеп өзгерген жоқ. Қайта көр.';
}
const copies={ru:{eyebrow:'ШКОЛЬНАЯ ПРОГРАММА',title:'Программа 3–6 классов',subtitle:'Разбор каждой темы, примеры и практика по уровню сложности.',grade:'Класс',quarter:'четверть',lessons:'уроков',hours:'ч',standard:'8 уроков в Standard',proAccess:'остальные — Pro',pro:'PRO',upgrade:'Открыть с Pro',back:'К программе',lesson:'РАЗБОР ТЕМЫ',prior:'Что нужно знать заранее',plan:'В этом разборе',explain:'Коротко и понятно',example:'Разберём на примере',rule:'Сначала пойми правило, затем решай. После ответа SYNAQ покажет объяснение.',practice:'Практика',choose:'Настрой тренировку',count:'Количество задач',difficulty:'Сложность',mixed:'Любая',easy:'Лёгкая',medium:'Средняя',hard:'Сложная',start:'Начать',check:'Проверить',next:'Следующая',correct:'Верно!',wrong:'Пока неверно',answer:'Введите ответ',done:'Тренировка завершена',result:'правильных ответов',again:'Ещё раз',list:'Другие темы',soon:'Подробные разборы для этого класса добавляются. Уже сейчас можно посмотреть маршрут тем.'},kk:{eyebrow:'МЕКТЕП БАҒДАРЛАМАСЫ',title:'3–6 сынып бағдарламасы',subtitle:'Әр тақырыпқа түсіндірме, мысал және деңгей бойынша жаттығу.',grade:'Сынып',quarter:'тоқсан',lessons:'сабақ',hours:'сағ',standard:'Standard-та 8 сабақ',proAccess:'қалғаны — Pro',pro:'PRO',upgrade:'Pro арқылы ашу',back:'Бағдарламаға',lesson:'ТАҚЫРЫПТЫ ТАЛДАУ',prior:'Алдын ала нені білу керек',plan:'Бұл талдауда',explain:'Қысқа әрі түсінікті',example:'Мысалмен талдайық',rule:'Алдымен ережені түсін, содан кейін есеп шығар. Жауаптан соң SYNAQ түсіндірмені көрсетеді.',practice:'Жаттығу',choose:'Жаттығуды бапта',count:'Есеп саны',difficulty:'Күрделілік',mixed:'Аралас',easy:'Жеңіл',medium:'Орташа',hard:'Күрделі',start:'Бастау',check:'Тексеру',next:'Келесі',correct:'Дұрыс!',wrong:'Әзірге қате',answer:'Жауапты енгізіңіз',done:'Жаттығу аяқталды',result:'дұрыс жауап',again:'Қайтадан',list:'Басқа тақырыптар',soon:'Бұл сыныптың толық талдаулары дайындалып жатыр. Қазір тақырыптар бағытын көруге болады.'}};

export default function Curriculum({initialGrade,isPro=false,onUpgrade=()=>{},onXp}){
 const {lang}=useLang(),c=copies[lang==='ru'?'ru':'kk'],local=v=>v?.[lang==='ru'?'ru':'kk']||'';
 const reader=lang==='ru'?{contents:'Содержание',intro:'О чём тема',self:'Проверь себя',summary:'Итоги',part:'Часть',of:'из',definition:'Главная мысль',steps:'Решение по шагам',yourTurn:'Теперь попробуй сам',tryHere:'Закрепи эту часть',continue:'Продолжить',previous:'Назад',remaining:'Перед практикой проверь понимание темы.',great:'Отлично — правило понятно.',retry:'Посмотри на пример и попробуй ещё раз.',ready:'Ты разобрал тему',readyText:'Главное правило, пример и проверка пройдены. Теперь закрепи навык задачами разного уровня.'}:{contents:'Мазмұны',intro:'Тақырып туралы',self:'Өзіңді тексер',summary:'Қорытынды',part:'Бөлім',of:'ішінен',definition:'Негізгі ой',steps:'Қадамдық шешім',yourTurn:'Енді өзің орында',tryHere:'Осы бөлімді бекіт',continue:'Жалғастыру',previous:'Артқа',remaining:'Жаттығуға дейін тақырыпты түсінгеніңді тексер.',great:'Өте жақсы — ереже түсінікті.',retry:'Мысалға қарап, қайтадан орындап көр.',ready:'Тақырыпты меңгердің',readyText:'Негізгі ережені, мысалды және тексеруді өттің. Енді дағдыңды әр деңгейдегі есептермен бекіт.'};
 const parsed=Number.parseInt(initialGrade,10);const [grade,setGrade]=useState(parsed>=3&&parsed<=6?parsed:3),[topic,setTopic]=useState(null),[dialog,setDialog]=useState(false),[count,setCount]=useState(5),[level,setLevel]=useState(isPro?'mixed':'easy'),[session,setSession]=useState(null),[lessonStep,setLessonStep]=useState('intro'),[miniQ,setMiniQ]=useState(null),[miniAnswer,setMiniAnswer]=useState(''),[miniFeedback,setMiniFeedback]=useState(null);
 const gradeTopics=CURRICULUM[grade]||[];
 const uid=auth.currentUser?.uid||null;
 const [saveState,setSaveState]=useState('idle'),[requestError,setRequestError]=useState(''),[ready,setReady]=useState(false),[recoveryError,setRecoveryError]=useState(false),[recoveryAvailable,setRecoveryAvailable]=useState(true);
 const practiceRef=useRef(null),operationRef=useRef(null),mounted=useRef(false),onXpRef=useRef(onXp);
 onXpRef.current=onXp;
 const isCurrent=()=>mounted.current&&auth.currentUser?.uid===uid;
 const grouped=useMemo(()=>[1,2,3,4].map(q=>gradeTopics.filter(t=>t.quarter===q)),[grade]);
 const standardKeys=useMemo(()=>new Set(grouped.flatMap(items=>items.slice(0,2).map(t=>t.key))),[grouped]);
 const canOpen=t=>isPro||standardKeys.has(t.key);

 useEffect(()=>{
   mounted.current=true;
   const warn=(event)=>{if(practiceRef.current&&!practiceRef.current.finished&&(!recoveryAvailable||practiceRef.current.pendingSave)){event.preventDefault();event.returnValue=''}};
   window.addEventListener('beforeunload',warn);
   return()=>{mounted.current=false;window.removeEventListener('beforeunload',warn)};
 },[recoveryAvailable]);

 function storePractice(record){
   practiceRef.current=record;
   setRecoveryAvailable(writeCurriculumPractice(record));
   setSession(record);
   return record;
 }

 useEffect(()=>{
   practiceRef.current=null;operationRef.current=null;
   setSession(null);setTopic(null);setDialog(false);setSaveState('idle');setRequestError('');setRecoveryError(false);setRecoveryAvailable(true);
   if(!uid){setReady(true);return}
   const {record,error}=readCurriculumPractice(uid);
   setRecoveryAvailable(error!=='unavailable');setRecoveryError(error==='invalid');
   if(record){
     practiceRef.current=record;setSession(record);setGrade(record.grade);setCount(record.count);setLevel(record.level);
     setTopic(CURRICULUM[record.grade].find(item=>item.key===record.topicKey));
     setRequestError(record.errorCode||'');
     setSaveState(record.feedback?'saved':'idle');
     if(!blockedPracticeCodes.has(record.errorCode)){
       if(record.pendingSave)void persist();
       else if(record.pendingStart)void requestQuestion();
     }
   }
   setReady(true);
 },[uid]);

 // An actual subscription update may unblock the same question. This runs only
 // on entitlement changes, never loops on a server rejection.
 useEffect(()=>{
   const practice=practiceRef.current;
   if(!isCurrent()||!isPro||!practice||practice.uid!==uid||operationRef.current
     ||!['learning/daily-limit','learning/pro-required'].includes(practice.errorCode))return;
   storePractice({...practice,errorCode:null});setRequestError('');
   if(practice.pendingSave)void persist();else if(practice.pendingStart)void requestQuestion();
 },[isPro,uid]);

 async function requestQuestion(){
   const practice=practiceRef.current,pending=practice?.pendingStart;
   if(!isCurrent()||!pending||practice.uid!==uid||operationRef.current)return;
   const operation={type:'start',id:pending.id};operationRef.current=operation;
   setSaveState('starting');setRequestError('');
   try{
     const value=await startLearningSession(uid,{mode:'curriculum',topicKey:practice.topicKey,level:practice.level},pending.id);
     if(!value||typeof value.id!=='string'||!value.id||typeof value.question?.text?.ru!=='string'||typeof value.question?.text?.kk!=='string')throw new Error('invalid_session');
     if(!isCurrent()||practiceRef.current?.id!==practice.id||practiceRef.current.pendingStart?.id!==pending.id)return;
     storePractice({...practiceRef.current,questionSession:value,pendingStart:null,answer:'',feedback:null,errorCode:null});
     setSaveState('idle');
   }catch(error){
     if(!isCurrent()||practiceRef.current?.id!==practice.id||practiceRef.current.pendingStart?.id!==pending.id)return;
     const code=error.code||'network';
     storePractice({...practiceRef.current,errorCode:code});setRequestError(code);setSaveState('error');
   }finally{if(operationRef.current===operation){operationRef.current=null;if(isCurrent())setSaveState(value=>value==='starting'?'idle':value)}}
 }

 function begin(){
   if(!isCurrent()||operationRef.current||recoveryError||!topic||(practiceRef.current&&!practiceRef.current.finished))return;
   if(!canOpen(topic)){onUpgrade();return}
   const record={uid,id:crypto.randomUUID(),grade,topicKey:topic.key,count:isPro?count:5,level:isPro?level:'easy',
     index:0,score:0,finished:false,questionSession:null,answer:'',feedback:null,pendingSave:null,
     pendingStart:{id:crypto.randomUUID()},errorCode:null};
   storePractice(record);setDialog(false);setRequestError('');void requestQuestion();
 }

 function changeAnswer(value){
   const practice=practiceRef.current;
   if(!isCurrent()||!practice||practice.uid!==uid||practice.feedback||practice.pendingSave||operationRef.current)return;
   storePractice({...practice,answer:value.slice(0,2000)});
 }

 function check(){
   const practice=practiceRef.current;
   if(!isCurrent()||!practice||practice.uid!==uid||operationRef.current||practice.pendingSave||practice.pendingStart
     ||!practice.questionSession||practice.feedback||!practice.answer.trim()||blockedPracticeCodes.has(practice.errorCode))return;
   const id=practice.questionSession.id;
   storePractice({...practice,pendingSave:{id,payload:{sessionId:id,answer:practice.answer.trim()}},errorCode:null});
   void persist();
 }

 async function persist(){
   const practice=practiceRef.current,pending=practice?.pendingSave;
   if(!isCurrent()||!pending||practice.uid!==uid||operationRef.current)return;
   const operation={type:'save',id:pending.id};operationRef.current=operation;
   setSaveState('saving');setRequestError('');
   try{
     const result=await saveAttempt(uid,pending.payload,pending.id);
     if(typeof result?.correct!=='boolean')throw new Error('invalid_grade');
     if(!isCurrent()||practiceRef.current?.id!==practice.id||practiceRef.current.pendingSave!==pending)return;
     storePractice({...practiceRef.current,pendingSave:null,feedback:{correct:result.correct,answer:result.answer,solution:result.solution||{}},
       score:practice.score+(result.correct?1:0),errorCode:null});
     setSaveState('saved');
     onXpRef.current?.(result.saved?result.gain:0,result.totalXp);
   }catch(error){
     if(!isCurrent()||practiceRef.current?.id!==practice.id||practiceRef.current.pendingSave!==pending)return;
     const code=error.code||'network';
     storePractice({...practiceRef.current,errorCode:code});setRequestError(code);setSaveState('error');
   }finally{if(operationRef.current===operation){operationRef.current=null;if(isCurrent())setSaveState(value=>value==='saving'?'idle':value)}}
 }

 function next(){
   const practice=practiceRef.current;
   if(!isCurrent()||!practice||practice.uid!==uid||operationRef.current||practice.pendingSave||practice.pendingStart||!practice.feedback)return;
   if(practice.index+1>=practice.count){
     const complete={...practice,finished:true};practiceRef.current=complete;setSession(complete);
     if(!clearCurriculumPractice(uid,practice.id))setRecoveryAvailable(false);
     return;
   }
   storePractice({...practice,index:practice.index+1,questionSession:null,answer:'',feedback:null,pendingStart:{id:crypto.randomUUID()},errorCode:null});
   void requestQuestion();
 }

 function replaceExpired(){
   const practice=practiceRef.current;
   if(!isCurrent()||!practice||practice.errorCode!=='learning/session-expired'||operationRef.current)return;
   storePractice({...practice,questionSession:null,answer:'',feedback:null,pendingSave:null,pendingStart:{id:crypto.randomUUID()},errorCode:null});
   setRequestError('');void requestQuestion();
 }

 function leave(){
   const practice=practiceRef.current;
   if(!isCurrent()||operationRef.current||(practice?.pendingSave&&!blockedPracticeCodes.has(practice.errorCode)))return;
   if(practice&&!clearCurriculumPractice(uid,practice.id))setRecoveryAvailable(false);
   practiceRef.current=null;setTopic(null);setSession(null);setDialog(false);setLessonStep('intro');setRequestError('');setSaveState('idle');
 }

 function returnToLesson(){
   const practice=practiceRef.current;
   if(!isCurrent()||operationRef.current||(practice?.pendingSave&&!blockedPracticeCodes.has(practice.errorCode)))return;
   if(practice&&!clearCurriculumPractice(uid,practice.id))setRecoveryAvailable(false);
   practiceRef.current=null;setSession(null);setDialog(false);setLessonStep('summary');setRequestError('');setSaveState('idle');
 }
 const openTopic=t=>{if(!canOpen(t)){onUpgrade();return}setTopic(t);setLessonStep('intro');setMiniQ(createCurriculumQuestions(t,'easy',1)[0]);setMiniAnswer('');setMiniFeedback(null)};
 const goStep=step=>{setLessonStep(step);if(step==='check'||typeof step==='number'){const difficulty=typeof step==='number'&&step>1?'medium':'easy';setMiniQ(createCurriculumQuestions(topic,difficulty,1)[0]);setMiniAnswer('');setMiniFeedback(null)}};
 const recoveryNotice=!recoveryAvailable&&<p role="alert">{lang==='ru'?'Автосохранение в этой вкладке недоступно. Не обновляй страницу и не переходи в другой раздел до сохранения ответа.':'Бұл қойындыда автоматты сақтау қолжетімсіз. Жауап сақталғанша бетті жаңартпа және басқа бөлімге өтпе.'}</p>;
 const blocked=blockedPracticeCodes.has(requestError);
 const saveNotice=<>{recoveryNotice}{requestError&&<p role="alert">{curriculumPracticeError(requestError,lang==='ru')} {!blocked&&<button className="link" onClick={()=>practiceRef.current?.pendingSave?persist():requestQuestion()}>{lang==='ru'?'Повторить':'Қайталау'}</button>}{['learning/daily-limit','learning/pro-required'].includes(requestError)&&<button className="link" onClick={onUpgrade}>{c.upgrade}</button>}{requestError==='learning/session-expired'&&<button className="link" onClick={replaceExpired}>{lang==='ru'?'Новая задача':'Жаңа есеп'}</button>}</p>}{['saving','starting'].includes(saveState)&&<p role="status">{saveState==='starting'?(lang==='ru'?'Подготавливаем задачу…':'Есеп дайындалуда…'):(lang==='ru'?'Проверяем и сохраняем ответ…':'Жауап тексеріліп, сақталуда…')}</p>}</>;
 if(!ready||(session&&session.uid!==uid))return <main className="curriculum-page"><p role="status">{lang==='ru'?'Загружаем практику…':'Жаттығу жүктелуде…'}</p></main>;
 if(recoveryError)return <main className="curriculum-page"><p role="alert">{lang==='ru'?'Не удалось прочитать сохранённую практику. Она не была перезаписана. Можно удалить повреждённую копию и начать заново.':'Сақталған жаттығуды оқу мүмкін болмады. Ол қайта жазылған жоқ. Бүлінген көшірмені жойып, жаңадан бастауға болады.'}</p><button className="btn" onClick={()=>{if(clearCurriculumPractice(uid,null))setRecoveryError(false);else setRecoveryAvailable(false)}}>{lang==='ru'?'Удалить локальную копию':'Жергілікті көшірмені жою'}</button>{recoveryNotice}</main>;
 if(session&&topic){
   if(session.finished)return <main className="curriculum-page curriculum-practice-page"><section className="curriculum-result"><span>✓</span><h1>{c.done}</h1><strong>{session.score}/{session.count}</strong><p>{c.result}</p>{recoveryNotice}<div><button onClick={begin}>{c.again}</button><button className="ghost" onClick={leave}>{c.list}</button></div></section></main>;
   const q=session.questionSession?.question,feedback=session.feedback;
   const busy=['starting','saving'].includes(saveState);
   return <main className="curriculum-page curriculum-practice-page">
     <button className="curriculum-back" disabled={busy||!!session.pendingSave&&!blocked} onClick={returnToLesson}>← {local(topic.title)}</button>
     <section className="curriculum-practice-card"><header><div><span>{c.practice}</span><h1>{local(topic.title)}</h1></div><b>{session.index+1} / {session.count}</b></header>
       <div className="curriculum-practice-track"><i style={{width:`${(session.index+1)/session.count*100}%`}}/></div>
       {q&&<><p className="curriculum-question">{local(q.text)}</p>
         <input autoFocus inputMode="text" readOnly={!!feedback||!!session.pendingSave||busy||blocked} value={session.answer} onChange={e=>changeAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')(feedback?next():check())}} placeholder={c.answer}/>
         {feedback&&<div className={`curriculum-feedback ${feedback.correct?'ok':'bad'}`}><b>{feedback.correct?c.correct:c.wrong}</b><p>{local(feedback.solution)}</p></div>}
       </>}
       {saveNotice}
       {q&&!blocked&&<button className="curriculum-train" disabled={!session.answer.trim()||busy||!!session.pendingSave} onClick={feedback?next:check}>{feedback?c.next:c.check} →</button>}
     </section>
   </main>;
 }
 if(topic){
  const pages=['intro',...topic.lecture.map((_,i)=>i),'check','summary'];
  const pageIndex=pages.indexOf(lessonStep), chapter=typeof lessonStep==='number'?topic.lecture[lessonStep]:null;
  const advance=()=>goStep(pages[Math.min(pageIndex+1,pages.length-1)]), retreat=()=>goStep(pages[Math.max(pageIndex-1,0)]);
  return <main className="curriculum-page curriculum-detail"><button className="curriculum-back" onClick={leave}>← {c.back}</button><div className="curriculum-reader">
   <nav className="curriculum-reader-nav" aria-label={reader.contents}><strong className="curriculum-reader-nav-title">{reader.contents}</strong>{pages.map((page)=>{const label=page==='intro'?reader.intro:page==='check'?reader.self:page==='summary'?reader.summary:local(topic.lecture[page][0]);return <button key={String(page)} className={lessonStep===page?'on':''} onClick={()=>goStep(page)}><i>{page==='intro'?'·':page==='check'?'?':page==='summary'?'★':page+1}</i><span>{label}</span></button>})}</nav>
   <article className="curriculum-reader-body">
    <div className="curriculum-reader-progress"><i style={{width:`${(pageIndex+1)/pages.length*100}%`}}/></div>
    {lessonStep==='intro'&&<><div className="curriculum-lesson-top"><span>{c.lesson}</span><b>{grade} {c.grade.toLowerCase()} · {topic.hours} {c.hours}</b></div><h1>{local(topic.title)}</h1><p className="curriculum-intro">{local(topic.summary)}</p><section className="curriculum-prior"><span>✓</span><div><b>{c.prior}</b><p>{local(topic.prerequisites)}</p></div></section><h2>{c.plan}</h2><ol className="curriculum-outline">{topic.steps.map((s,i)=><li key={i}><i>{i+1}</i><span>{local(s)}</span></li>)}</ol><div className="curriculum-reader-meta">{reader.part}: {topic.lecture.length} · {c.practice}: {count}</div></>}
    {chapter&&<><div className="curriculum-part-label">{reader.part} {lessonStep+1} {reader.of} {topic.lecture.length}</div><h1>{local(chapter[0])}</h1><section className="curriculum-definition"><span>{reader.definition}</span><p>{local(chapter[1])}</p></section><section className="curriculum-worked"><span>{reader.steps}</span><h3>{c.example}</h3><div className="curriculum-formula">{local(chapter[2])}</div><ol>{topic.steps.map((step,i)=><li key={i}>{local(step)}</li>)}</ol></section><section className="curriculum-chapter-check"><span>{reader.tryHere}</span><p>{local(miniQ?.text)}</p><div><input inputMode="text" value={miniAnswer} onChange={e=>setMiniAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&miniAnswer.trim())setMiniFeedback(curriculumAnswersMatch(miniAnswer,miniQ.answer))}} placeholder={c.answer}/><button disabled={!miniAnswer.trim()} onClick={()=>setMiniFeedback(curriculumAnswersMatch(miniAnswer,miniQ.answer))}>{c.check}</button></div>{miniFeedback!==null&&<aside className={miniFeedback?'ok':'bad'}><b>{miniFeedback?reader.great:reader.retry}</b><small>{local(miniQ.solution)}</small></aside>}</section><section className="curriculum-tip"><span>!</span><p>{c.rule}</p></section></>}
    {lessonStep==='check'&&<><div className="curriculum-part-label">{reader.self}</div><h1>{reader.yourTurn}</h1><p className="curriculum-intro">{reader.remaining}</p><section className="curriculum-mini-check"><p>{local(miniQ?.text)}</p><input inputMode="text" value={miniAnswer} onChange={e=>setMiniAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&miniAnswer.trim())setMiniFeedback(curriculumAnswersMatch(miniAnswer,miniQ.answer))}} placeholder={c.answer}/><button disabled={!miniAnswer.trim()} onClick={()=>setMiniFeedback(curriculumAnswersMatch(miniAnswer,miniQ.answer))}>{c.check}</button>{miniFeedback!==null&&<div className={miniFeedback?'ok':'bad'}><b>{miniFeedback?reader.great:reader.retry}</b><p>{local(miniQ.solution)}</p></div>}</section></>}
    {lessonStep==='summary'&&<section className="curriculum-reader-summary"><span>✓</span><h1>{reader.ready}</h1><p>{reader.readyText}</p><div>{topic.steps.map((s,i)=><b key={i}>✓ {local(s)}</b>)}</div><button className="curriculum-train" onClick={()=>setDialog(true)}>{c.practice} →</button></section>}
    {lessonStep!=='summary'&&<footer className="curriculum-reader-actions"><button disabled={pageIndex===0} onClick={retreat}>← {reader.previous}</button><button className="primary" onClick={advance}>{reader.continue} →</button></footer>}
   </article>
  </div>{dialog&&<div className="curriculum-modal" role="dialog" aria-modal="true" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(false)}}><section><button className="curriculum-modal-close" onClick={()=>setDialog(false)}>×</button><span>{c.practice}</span><h2>{c.choose}</h2><label>{c.count}</label><div className="curriculum-counts">{[5,10,15,20].map(n=>{const locked=!isPro&&n>5;return <button className={`${count===n?'on ':''}${locked?'locked':''}`} onClick={()=>locked?onUpgrade():setCount(n)} key={n}>{n}{locked&&<small>PRO</small>}</button>})}</div><label>{c.difficulty}</label><div className="curriculum-levels">{['easy','medium','hard','mixed'].map(v=>{const locked=!isPro&&v!=='easy';return <button className={`${level===v?'on ':''}${locked?'locked':''}`} onClick={()=>locked?onUpgrade():setLevel(v)} key={v}>{c[v]}{locked&&<small>PRO</small>}</button>})}</div><button className="curriculum-train" onClick={begin}>{c.start} →</button></section></div>}</main>
 }
 return <main className="curriculum-page"><header className="curriculum-header"><div><span className="section-eyebrow">{c.eyebrow}</span><h1>{c.title}</h1><p>{c.subtitle}</p><div className="curriculum-meta"><b>{gradeTopics.length} {c.lessons}</b><span>{isPro?`${gradeTopics.reduce((n,t)=>n+t.hours,0)} ${c.hours} · 4 ${c.quarter}`:`${c.standard} · ${c.proAccess}`}</span></div></div><div className="curriculum-grade"><span>{c.grade}</span><div>{[3,4,5,6].map(n=><button className={grade===n?'on':''} onClick={()=>{setGrade(n);setTopic(null)}} key={n}>{n}</button>)}</div></div></header><div className="curriculum-quarters">{grouped.map((items,qi)=><section className="curriculum-quarter" key={qi}><div className="curriculum-quarter-title"><span>{String(qi+1).padStart(2,'0')}</span><h2>{qi+1} {c.quarter}</h2><b>{items.reduce((n,t)=>n+t.hours,0)} {c.hours}</b></div><div className="curriculum-topic-list">{items.map((t,i)=>{const open=canOpen(t);return <button className={`curriculum-topic${open?'':' is-locked'}`} onClick={()=>openTopic(t)} aria-label={`${local(t.title)}${open?'':` · ${c.upgrade}`}`} key={t.key}><span>{String(i+1).padStart(2,'0')}</span><div><b>{local(t.title)}</b><small>{local(t.unit)} · {t.hours} {c.hours}</small></div><i>{open?'→':c.pro}</i></button>})}</div></section>)}</div></main>
}
