import useScreenStart from './useScreenStart.js';
import useModalFocus from './useModalFocus.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import { CURRICULUM, createCurriculumQuestions, curriculumAnswersMatch } from './curriculumData.js';
import { auth, saveAttempt, startLearningSession } from './firebase.js';
import CurriculumVideoLesson from './CurriculumVideoLesson.jsx';
import { curriculumLessonPages, curriculumResumeStep, curriculumTheoryStudied } from './curriculumProgress.js';
import { useCurriculumProgress } from './useCurriculumProgress.js';
import './CurriculumProgress.css';

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
  if (code === 'learning/daily-limit') return ru ? 'На сегодня использованы 5 бесплатных ответов. Продолжи завтра или выбери Standard.' : 'Бүгінгі 5 тегін жауап қолданылды. Ертең жалғастыр немесе Standard таңда.';
  if (code === 'learning/pro-required') return ru ? 'Для этой темы или сложности нужен Standard. Можно вернуться к доступным урокам.' : 'Бұл тақырып немесе деңгей үшін Standard қажет. Қолжетімді сабақтарға оралуға болады.';
  if (code === 'learning/session-expired') return ru ? 'Срок этой задачи истёк. Начни новую задачу — сохранённые результаты останутся.' : 'Бұл есептің мерзімі аяқталды. Жаңа есепті баста — сақталған нәтижелер қалады.';
  if (code === 'learning/rate-limit') return ru ? 'Слишком много запусков за сегодня. Сохранённые результаты доступны; продолжи позже.' : 'Бүгін тым көп іске қосу болды. Сақталған нәтижелер қолжетімді; кейін жалғастыр.';
  return ru ? 'Не удалось связаться с сервером. Ответ и текущая задача не изменены. Попробуй ещё раз.' : 'Сервермен байланысу мүмкін болмады. Жауабың және ағымдағы есеп өзгерген жоқ. Қайта көр.';
}
const copies={ru:{eyebrow:'ШКОЛЬНАЯ ПРОГРАММА',title:'Программа 3–6 классов',subtitle:'Разбор каждой темы, примеры и практика по уровню сложности.',grade:'Класс',quarter:'четверть',lessons:'уроков',hours:'ч',standard:'8 уроков по архивному тарифу',proAccess:'все темы — в новом Standard',pro:'STANDARD',upgrade:'Открыть со Standard',back:'К программе',lesson:'РАЗБОР ТЕМЫ',prior:'Что нужно знать заранее',plan:'В этом разборе',explain:'Коротко и понятно',example:'Разберём на примере',rule:'Сначала пойми правило, затем решай. После ответа SYNAQ покажет объяснение.',practice:'Практика',choose:'Настрой тренировку',count:'Количество задач',difficulty:'Сложность',mixed:'Любая',easy:'Лёгкая',medium:'Средняя',hard:'Сложная',start:'Начать',check:'Проверить',next:'Следующая',correct:'Верно!',wrong:'Пока неверно',answer:'Введите ответ',done:'Тренировка завершена',result:'правильных ответов',again:'Ещё раз',list:'Другие темы',soon:'Подробные разборы для этого класса добавляются. Уже сейчас можно посмотреть маршрут тем.'},kk:{eyebrow:'МЕКТЕП БАҒДАРЛАМАСЫ',title:'3–6 сынып бағдарламасы',subtitle:'Әр тақырыпқа түсіндірме, мысал және деңгей бойынша жаттығу.',grade:'Сынып',quarter:'тоқсан',lessons:'сабақ',hours:'сағ',standard:'Архивтік тарифте 8 сабақ',proAccess:'барлық тақырып — жаңа Standard-та',pro:'STANDARD',upgrade:'Standard арқылы ашу',back:'Бағдарламаға',lesson:'ТАҚЫРЫПТЫ ТАЛДАУ',prior:'Алдын ала нені білу керек',plan:'Бұл талдауда',explain:'Қысқа әрі түсінікті',example:'Мысалмен талдайық',rule:'Алдымен ережені түсін, содан кейін есеп шығар. Жауаптан соң SYNAQ түсіндірмені көрсетеді.',practice:'Жаттығу',choose:'Жаттығуды бапта',count:'Есеп саны',difficulty:'Күрделілік',mixed:'Аралас',easy:'Жеңіл',medium:'Орташа',hard:'Күрделі',start:'Бастау',check:'Тексеру',next:'Келесі',correct:'Дұрыс!',wrong:'Әзірге қате',answer:'Жауапты енгізіңіз',done:'Жаттығу аяқталды',result:'дұрыс жауап',again:'Қайтадан',list:'Басқа тақырыптар',soon:'Бұл сыныптың толық талдаулары дайындалып жатыр. Қазір тақырыптар бағытын көруге болады.'}};

export default function Curriculum({initialGrade,initialTopicKey,onTopicOpened,plan='free',onUpgrade=()=>{},onXp}){
 const {lang}=useLang(),c=copies[lang==='ru'?'ru':'kk'],local=v=>v?.[lang==='ru'?'ru':'kk']||'';
 const isPro=plan==='pro'||plan==='mentor',isStandard=plan==='standard';
 const localVideoPreview=import.meta.env.DEV&&auth.currentUser?.email==='therayisl@synaq.kids';
 const reader=lang==='ru'?{contents:'Содержание',intro:'О чём тема',self:'Проверь себя',summary:'Итоги',part:'Часть',of:'из',definition:'Главная мысль',steps:'Решение по шагам',yourTurn:'Теперь попробуй сам',tryHere:'Закрепи эту часть',continue:'Продолжить',previous:'Назад',remaining:'Перед практикой проверь понимание темы.',great:'Отлично — правило понятно.',retry:'Посмотри на пример и попробуй ещё раз.',ready:'Ты разобрал тему',readyText:'Главное правило, пример и проверка пройдены. Теперь закрепи навык задачами разного уровня.'}:{contents:'Мазмұны',intro:'Тақырып туралы',self:'Өзіңді тексер',summary:'Қорытынды',part:'Бөлім',of:'ішінен',definition:'Негізгі ой',steps:'Қадамдық шешім',yourTurn:'Енді өзің орында',tryHere:'Осы бөлімді бекіт',continue:'Жалғастыру',previous:'Артқа',remaining:'Жаттығуға дейін тақырыпты түсінгеніңді тексер.',great:'Өте жақсы — ереже түсінікті.',retry:'Мысалға қарап, қайтадан орындап көр.',ready:'Теорияны оқып шықтың',readyText:'Негізгі ережені, мысалды және тексеруді өттің. Енді дағдыңды әр деңгейдегі есептермен бекіт.'};
 const parsed=Number.parseInt(initialGrade,10);const [grade,setGrade]=useState(parsed>=3&&parsed<=6?parsed:3),[topic,setTopic]=useState(null),[dialog,setDialog]=useState(false),[count,setCount]=useState(5),[level,setLevel]=useState(isPro?'mixed':isStandard?'medium':'easy'),[session,setSession]=useState(null),[lessonStep,setLessonStep]=useState('intro'),[miniQ,setMiniQ]=useState(null),[miniAnswer,setMiniAnswer]=useState(''),[miniFeedback,setMiniFeedback]=useState(null);
 const [selectedQuarter,setSelectedQuarter]=useState(null),[showAllTopics,setShowAllTopics]=useState(false),[contentsOpen,setContentsOpen]=useState(false);
 const gradeTopics=CURRICULUM[grade]||[];
 const uid=auth.currentUser?.uid||null;
 const [lastSavedAttempt,setLastSavedAttempt]=useState(null);
 const progress=useCurriculumProgress(uid,grade,plan,{savedAttemptId:lastSavedAttempt});
 const requestedTopicRef=useRef(null);
 useEffect(()=>{if(session?.uid===uid&&session.feedback)setLastSavedAttempt(session.questionSession?.id||null)},[uid,session?.feedback,session?.questionSession?.id]);
 const [saveState,setSaveState]=useState('idle'),[requestError,setRequestError]=useState(''),[ready,setReady]=useState(false),[recoveryError,setRecoveryError]=useState(false),[recoveryAvailable,setRecoveryAvailable]=useState(true);
 const practiceRef=useRef(null),operationRef=useRef(null),mounted=useRef(false),onXpRef=useRef(onXp);
 onXpRef.current=onXp;
 const isCurrent=()=>mounted.current&&auth.currentUser?.uid===uid;
 const grouped=useMemo(()=>[1,2,3,4].map(q=>gradeTopics.filter(t=>t.quarter===q)),[grade]);
 const freeKeys=useMemo(()=>new Set(grouped.flatMap(items=>items.slice(0,1).map(t=>t.key))),[grouped]);
 const standardKeys=useMemo(()=>new Set(grouped.flatMap(items=>items.slice(0,2).map(t=>t.key))),[grouped]);
 const dialogRef=useRef(null);
 useModalFocus(dialog,dialogRef,()=>setDialog(false));
 useScreenStart(`${topic?.key}:${lessonStep}:${session?.index}:${!!session?.finished}`);
 const canOpen=t=>isPro||(isStandard?standardKeys:freeKeys).has(t.key)||(localVideoPreview&&t.key==='g3-review-2');

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
   if(!isCurrent()||plan==='free'||!practice||practice.uid!==uid||operationRef.current
     ||!['learning/daily-limit','learning/pro-required'].includes(practice.errorCode))return;
   storePractice({...practice,errorCode:null});setRequestError('');
   if(practice.pendingSave)void persist();else if(practice.pendingStart)void requestQuestion();
 },[plan,uid]);

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
   const allowedCount=isPro?count:isStandard?Math.min(count,20):5;
   const allowedLevel=isPro?level:isStandard&&['easy','medium'].includes(level)?level:'easy';
   const record={uid,id:crypto.randomUUID(),grade,topicKey:topic.key,count:allowedCount,level:allowedLevel,
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
 const openTopic=t=>{if(!canOpen(t)){onUpgrade();return}setSelectedQuarter(t.quarter);setContentsOpen(false);const saved=progress.theory.lessons[t.key];const step=saved?.lastStep==='summary'&&!curriculumTheoryStudied(t,saved)?curriculumResumeStep(t,saved):saved?.lastStep??'intro';setTopic(t);setLessonStep(step);setMiniQ(createCurriculumQuestions(t,typeof step==='number'&&step>1?'medium':'easy',1)[0]);setMiniAnswer('');setMiniFeedback(null)};
 const goStep=(step,remember=true)=>{setContentsOpen(false);setLessonStep(step);if(remember)progress.updateTheory(topic,{step});if(step==='check'||typeof step==='number'){const difficulty=typeof step==='number'&&step>1?'medium':'easy';setMiniQ(createCurriculumQuestions(topic,difficulty,1)[0]);setMiniAnswer('');setMiniFeedback(null)}};
 useEffect(()=>{
   if(!ready||session||recoveryError||progress.syncStatus==='loading'||!initialTopicKey||requestedTopicRef.current===`${uid}:${initialTopicKey}`)return;
   const target=gradeTopics.find(item=>item.key===initialTopicKey);
   if(target){requestedTopicRef.current=`${uid}:${initialTopicKey}`;openTopic(target);onTopicOpened?.(initialTopicKey)}
 },[ready,uid,initialTopicKey,session,recoveryError,grade,progress.syncStatus]);
 const theoryStorageText=progress.syncStatus==='synced'
   ?(lang==='ru'?'Прогресс разбора сохранён в аккаунте.':'Талдау барысы аккаунтта сақталды.')
   :progress.syncStatus==='loading'||progress.syncStatus==='saving'
     ?(lang==='ru'?'Синхронизируем прогресс разбора…':'Талдау барысы синхрондалуда…')
     :progress.theoryError
       ?(lang==='ru'?'Прогресс разбора пока не сохранён. Оставь страницу открытой и повтори синхронизацию.':'Талдау барысы әлі сақталған жоқ. Бетті ашық қалдырып, синхрондауды қайтала.')
       :(lang==='ru'?'Прогресс разбора сохранён на этом устройстве. Синхронизация пока недоступна.':'Талдау барысы осы құрылғыда сақталды. Синхрондау әзірге қолжетімсіз.');
 const progressNotice=<p className="curriculum-progress-note" role="status">{theoryStorageText}{progress.syncStatus==='local'&&<button className="link" onClick={progress.retry}>{lang==='ru'?'Повторить':'Қайталау'}</button>}</p>;
 const nextAvailable=progress.nextTopic;
 const openNextLesson=()=>{if(!nextAvailable)return;practiceRef.current=null;setSession(null);setDialog(false);openTopic(nextAvailable)};
 const recoveryNotice=!recoveryAvailable&&<p role="alert">{lang==='ru'?'Автосохранение в этой вкладке недоступно. Не обновляй страницу и не переходи в другой раздел до сохранения ответа.':'Бұл қойындыда автоматты сақтау қолжетімсіз. Жауап сақталғанша бетті жаңартпа және басқа бөлімге өтпе.'}</p>;
 const blocked=blockedPracticeCodes.has(requestError);
 const saveNotice=<>{recoveryNotice}{requestError&&<p role="alert">{curriculumPracticeError(requestError,lang==='ru')} {!blocked&&<button className="link" onClick={()=>practiceRef.current?.pendingSave?persist():requestQuestion()}>{lang==='ru'?'Повторить':'Қайталау'}</button>}{['learning/daily-limit','learning/pro-required'].includes(requestError)&&<button className="link" onClick={onUpgrade}>{c.upgrade}</button>}{requestError==='learning/session-expired'&&<button className="link" onClick={replaceExpired}>{lang==='ru'?'Новая задача':'Жаңа есеп'}</button>}</p>}{['saving','starting'].includes(saveState)&&<p role="status">{saveState==='starting'?(lang==='ru'?'Подготавливаем задачу…':'Есеп дайындалуда…'):(lang==='ru'?'Проверяем и сохраняем ответ…':'Жауап тексеріліп, сақталуда…')}</p>}</>;
 if(!ready||(session&&session.uid!==uid))return <main className="curriculum-page"><p role="status">{lang==='ru'?'Загружаем практику…':'Жаттығу жүктелуде…'}</p></main>;
 if(recoveryError)return <main className="curriculum-page"><p role="alert">{lang==='ru'?'Не удалось прочитать сохранённую практику. Она не была перезаписана. Можно удалить повреждённую копию и начать заново.':'Сақталған жаттығуды оқу мүмкін болмады. Ол қайта жазылған жоқ. Бүлінген көшірмені жойып, жаңадан бастауға болады.'}</p><button className="btn" onClick={()=>{if(clearCurriculumPractice(uid,null))setRecoveryError(false);else setRecoveryAvailable(false)}}>{lang==='ru'?'Удалить локальную копию':'Жергілікті көшірмені жою'}</button>{recoveryNotice}</main>;
 if(session&&topic){
   if(session.finished)return <main className="curriculum-page curriculum-practice-page"><section className="curriculum-result"><span>✓</span><h1>{c.done}</h1><strong>{session.score}/{session.count}</strong><p>{c.result}</p>{recoveryNotice}<div><button onClick={begin}>{c.again}</button><button className="ghost" onClick={leave}>{c.list}</button>{nextAvailable&&<button className="ghost" onClick={openNextLesson}>{lang==='ru'?'Следующий шаг':'Келесі қадам'} →</button>}</div></section></main>;
   const q=session.questionSession?.question,feedback=session.feedback;
   const busy=['starting','saving'].includes(saveState);
   return <main className="curriculum-page curriculum-practice-page">
     <button className="curriculum-back" disabled={busy||!!session.pendingSave&&!blocked} onClick={returnToLesson}>← {local(topic.title)}</button>
     <section className="curriculum-practice-card"><header><div><span>{c.practice}</span><h1>{local(topic.title)}</h1></div><b>{session.index+1} / {session.count}</b></header>
       <div className="curriculum-practice-track" role="progressbar" aria-label={lang==='ru'?'Проверенные ответы':'Тексерілген жауаптар'} aria-valuemin={0} aria-valuemax={session.count} aria-valuenow={session.index+(feedback?1:0)}><i style={{width:`${(session.index+(feedback?1:0))/session.count*100}%`}}/></div>
       {q&&<><p className="curriculum-question">{local(q.text)}</p>
         <input autoFocus aria-label={c.answer} inputMode="text" readOnly={!!feedback||!!session.pendingSave||busy||blocked} value={session.answer} onChange={e=>changeAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')(feedback?next():check())}} placeholder={c.answer}/>
         {feedback&&<div className={`curriculum-feedback ${feedback.correct?'ok':'bad'}`}><b>{feedback.correct?c.correct:c.wrong}</b><p>{local(feedback.solution)}</p></div>}
       </>}
       {saveNotice}
       {q&&!blocked&&<button className="curriculum-train" disabled={!session.answer.trim()||busy||!!session.pendingSave} onClick={feedback?next:check}>{feedback?c.next:c.check} →</button>}
     </section>
   </main>;
 }
 if(topic){
  const pages=curriculumLessonPages(topic);
  const lessonProgress=progress.theory.lessons[topic.key],studied=curriculumTheoryStudied(topic,lessonProgress);
  const resumeStep=curriculumResumeStep(topic,lessonProgress);
  const completedParts=lessonProgress?.completedSteps?.length||0;
  const resumeLabel=resumeStep==='intro'?reader.intro:resumeStep==='check'?reader.self:resumeStep==='summary'?reader.summary:local(topic.lecture[resumeStep][0]);
  const pageIndex=pages.indexOf(lessonStep), chapter=typeof lessonStep==='number'?topic.lecture[lessonStep]:null;
  const stepLabel=lessonStep==='intro'?reader.intro:lessonStep==='check'?reader.self:lessonStep==='summary'?reader.summary:local(chapter?.[0]);
  const completedTheorySteps=completedParts+(lessonProgress?.checkPassed?1:0);
  const advance=()=>{if(lessonStep==='check'&&miniFeedback!==true)return;progress.updateTheory(topic,{step:lessonStep,advance:true,checkPassed:miniFeedback===true});goStep(pages[Math.min(pageIndex+1,pages.length-1)],false)}, retreat=()=>goStep(pages[Math.max(pageIndex-1,0)]);
  return <main className="curriculum-page curriculum-detail"><button className="curriculum-back" onClick={leave}>← {c.back}</button><div className="curriculum-reader">
   <nav className={`curriculum-reader-nav${contentsOpen?' is-open':''}`} aria-label={reader.contents}>
    <strong className="curriculum-reader-nav-title">{reader.contents}</strong>
    <button className="curriculum-contents-toggle" aria-expanded={contentsOpen} aria-controls="curriculum-contents-list" onClick={()=>setContentsOpen(value=>!value)}><span><small>{reader.contents}{lessonStep!=='summary'&&` · ${lang==='ru'?'Шаг':'Қадам'} ${pageIndex+1}/${pages.length-1}`}</small><b>{stepLabel}</b></span><i aria-hidden="true">{contentsOpen?'−':'+'}</i></button>
    <div className="curriculum-reader-links" id="curriculum-contents-list">{pages.map((page)=>{const label=page==='intro'?reader.intro:page==='check'?reader.self:page==='summary'?reader.summary:local(topic.lecture[page][0]);return <button key={String(page)} className={lessonStep===page?'on':''} aria-current={lessonStep===page?'step':undefined} onClick={()=>goStep(page)}><i aria-hidden="true">{lessonProgress?.completedSteps?.includes(page)||(page==='check'&&lessonProgress?.checkPassed)?'✓':page==='intro'?'·':page==='check'?'?':page==='summary'?'★':page+1}</i><span>{label}</span></button>})}</div>
   </nav>
   <article className="curriculum-reader-body">
    <section className="curriculum-resume" aria-label={lang==='ru'?'Прогресс урока':'Сабақ барысы'}><div><strong>{studied?(lang==='ru'?'Теория изучена':'Теория оқылды'):(lang==='ru'?`Пройдено шагов: ${completedTheorySteps} из ${pages.length-1}`:`Өтілген қадамдар: ${completedTheorySteps} / ${pages.length-1}`)}</strong><span>{studied?(lang==='ru'?'Теперь закрепи её проверенными задачами.':'Енді оны тексерілетін есептермен бекіт.'):(lang==='ru'?`Продолжить: ${resumeLabel}`:`Жалғастыру: ${resumeLabel}`)}</span></div>{!studied&&resumeStep!==lessonStep&&<button onClick={()=>goStep(resumeStep)}>{reader.continue} →</button>}</section>
    {progressNotice}
    <div className="curriculum-reader-progress" role="progressbar" aria-label={lang==='ru'?'Пройдено шагов теории':'Өтілген теория қадамдары'} aria-valuemin={0} aria-valuemax={pages.length-1} aria-valuenow={completedTheorySteps}><i style={{width:`${completedTheorySteps/(pages.length-1)*100}%`}}/></div>
    {lessonStep==='intro'&&<><div className="curriculum-lesson-top"><span>{c.lesson}</span><b>{grade} {c.grade.toLowerCase()} · {topic.hours} {c.hours}</b></div><h1>{local(topic.title)}</h1><p className="curriculum-intro">{local(topic.summary)}</p>{topic.key==='g3-review-1'&&<CurriculumVideoLesson lang={lang} onComplete={()=>setDialog(true)}/>} {topic.key==='g3-review-2'&&<CurriculumVideoLesson lang={lang} lesson="compare-100" onComplete={()=>setDialog(true)}/>}<section className="curriculum-prior"><span>✓</span><div><b>{c.prior}</b><p>{local(topic.prerequisites)}</p></div></section><h2>{c.plan}</h2><ol className="curriculum-outline">{topic.steps.map((s,i)=><li key={i}><i>{i+1}</i><span>{local(s)}</span></li>)}</ol><div className="curriculum-reader-meta">{reader.part}: {topic.lecture.length} · {c.practice}: {count}</div></>}
    {chapter&&<><div className="curriculum-part-label">{reader.part} {lessonStep+1} {reader.of} {topic.lecture.length}</div><h1>{local(chapter[0])}</h1><section className="curriculum-definition"><span>{reader.definition}</span><p>{local(chapter[1])}</p></section><section className="curriculum-worked"><span>{reader.steps}</span><h3>{c.example}</h3><div className="curriculum-formula">{local(chapter[2])}</div><ol>{topic.steps.map((step,i)=><li key={i}>{local(step)}</li>)}</ol></section><section className="curriculum-chapter-check"><span>{reader.tryHere}</span><p>{local(miniQ?.text)}</p><div><input aria-label={c.answer} inputMode="text" value={miniAnswer} onChange={e=>setMiniAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&miniAnswer.trim())setMiniFeedback(curriculumAnswersMatch(miniAnswer,miniQ.answer))}} placeholder={c.answer}/><button disabled={!miniAnswer.trim()} onClick={()=>setMiniFeedback(curriculumAnswersMatch(miniAnswer,miniQ.answer))}>{c.check}</button></div>{miniFeedback!==null&&<aside className={miniFeedback?'ok':'bad'}><b>{miniFeedback?reader.great:reader.retry}</b><small>{local(miniQ.solution)}</small></aside>}</section><section className="curriculum-tip"><span>!</span><p>{c.rule}</p></section></>}
    {lessonStep==='check'&&<><div className="curriculum-part-label">{reader.self}</div><h1>{reader.yourTurn}</h1><p className="curriculum-intro">{reader.remaining}</p><section className="curriculum-mini-check"><p>{local(miniQ?.text)}</p><input aria-label={c.answer} inputMode="text" value={miniAnswer} onChange={e=>setMiniAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&miniAnswer.trim())setMiniFeedback(curriculumAnswersMatch(miniAnswer,miniQ.answer))}} placeholder={c.answer}/><button disabled={!miniAnswer.trim()} onClick={()=>setMiniFeedback(curriculumAnswersMatch(miniAnswer,miniQ.answer))}>{c.check}</button>{miniFeedback!==null&&<div className={miniFeedback?'ok':'bad'}><b>{miniFeedback?reader.great:reader.retry}</b><p>{local(miniQ.solution)}</p></div>}</section></>}
    {lessonStep==='summary'&&<section className="curriculum-reader-summary"><span>{studied?'✓':'◌'}</span><h1>{studied?reader.ready:reader.summary}</h1><p>{studied?reader.readyText:(lang==='ru'?'Пройди все части и самопроверку, чтобы завершить разбор. Практика проверяется отдельно.':'Талдауды аяқтау үшін барлық бөлім мен өзіндік тексеруді өт. Жаттығу бөлек тексеріледі.')}</p><div>{topic.steps.map((s,i)=><b key={i}>{local(s)}</b>)}</div>{!studied&&<button className="curriculum-continue-theory" onClick={()=>goStep(resumeStep)}>{reader.continue}: {resumeLabel} →</button>}<button className="curriculum-train" onClick={()=>setDialog(true)}>{c.practice} →</button>{studied&&nextAvailable&&nextAvailable.key!==topic.key&&<button className="curriculum-continue-theory" onClick={openNextLesson}>{lang==='ru'?'Следующий урок':'Келесі сабақ'}: {local(nextAvailable.title)} →</button>}</section>}
    {lessonStep!=='summary'&&<footer className="curriculum-reader-actions"><button disabled={pageIndex===0} onClick={retreat}>← {reader.previous}</button><button className="primary" disabled={lessonStep==='check'&&miniFeedback!==true} onClick={advance}>{reader.continue} →</button></footer>}
   </article>
  </div>{dialog&&<div ref={dialogRef} tabIndex={-1} className="curriculum-modal" role="dialog" aria-modal="true" aria-label={c.choose} onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(false)}}><section><button className="curriculum-modal-close" aria-label={lang==='ru'?'Закрыть':'Жабу'} onClick={()=>setDialog(false)}>×</button><span>{c.practice}</span><h2>{c.choose}</h2><label>{c.count}</label><div className="curriculum-counts">{[5,10,15,20].map(n=>{const locked=plan==='free'&&n>5;return <button className={`${count===n?'on ':''}${locked?'locked':''}`} onClick={()=>locked?onUpgrade():setCount(n)} key={n}>{n}{locked&&<small>STANDARD</small>}</button>})}</div><label>{c.difficulty}</label><div className="curriculum-levels">{['easy','medium','hard','mixed'].map(v=>{const locked=plan==='free'?v!=='easy':!isPro&&!['easy','medium'].includes(v);return <button className={`${level===v?'on ':''}${locked?'locked':''}`} onClick={()=>locked?onUpgrade():setLevel(v)} key={v}>{c[v]}{locked&&<small>STANDARD</small>}</button>})}</div><button className="curriculum-train" onClick={begin}>{c.start} →</button></section></div>}</main>
 }
 const quarter=selectedQuarter??nextAvailable?.quarter??1;
 const quarterTopics=grouped[quarter-1]||[];
 const shownTopics=showAllTopics?quarterTopics:quarterTopics.slice(0,6);
 const topicStatuses=new Map(progress.topics.map(item=>[item.topic.key,item]));
 const recommendationPending=progress.syncStatus==='loading'||(progress.nextKind!=='theory'&&progress.historyStatus==='loading');
 const recommendationReady=!recommendationPending&&(progress.nextKind==='theory'||progress.historyStatus==='ready');
 const theoryReady=progress.syncStatus!=='loading';
 const nextStatus=nextAvailable?topicStatuses.get(nextAvailable.key):null;
 const nextAction=progress.nextKind==='practice'?c.practice:nextStatus?.theoryStarted?reader.continue:(lang==='ru'?'Начать урок':'Сабақты бастау');
 const selectQuarter=value=>{setSelectedQuarter(value);setShowAllTopics(false)};
 const changeGrade=value=>{setGrade(value);setSelectedQuarter(null);setShowAllTopics(false);setTopic(null)};
 const openRecommendation=()=>{if(!recommendationReady||!nextAvailable)return;openTopic(nextAvailable);if(progress.nextKind==='practice')setDialog(true)};
 return <main className="curriculum-page curriculum-catalog">
  <header className="curriculum-catalog-heading"><div><span>{c.eyebrow}</span><h1>{lang==='ru'?'Моя программа':'Менің бағдарламам'}</h1></div><div className="curriculum-grade" role="group" aria-label={c.grade}><span>{c.grade}</span><div>{[3,4,5,6].map(n=><button className={grade===n?'on':''} aria-pressed={grade===n} aria-label={`${n} ${c.grade.toLowerCase()}`} onClick={()=>changeGrade(n)} key={n}>{n}</button>)}</div></div></header>
  <section className="curriculum-path-hero" aria-label={lang==='ru'?'Следующий шаг':'Келесі қадам'}>
   <div className="curriculum-path-copy"><span className="curriculum-path-eyebrow">{lang==='ru'?'ШАГ ЗА ШАГОМ — К ЗНАНИЯМ':'БІЛІМГЕ ҚАДАМ БАС'}</span><h2>{!recommendationReady?(recommendationPending?(lang==='ru'?'Находим твой следующий шаг…':'Келесі қадамыңды іздеудеміз…'):(lang==='ru'?'Выбери тему ниже':'Төменнен тақырып таңда')):nextAvailable?local(nextAvailable.title):(lang==='ru'?'Вернёмся к любимой теме?':'Ұнаған тақырыпқа оралайық па?')}</h2><p>{!recommendationReady?(recommendationPending?(lang==='ru'?'Загружаем сохранённый прогресс.':'Сақталған барыс жүктелуде.'):(lang==='ru'?'Результаты практики пока недоступны. Можно открыть урок и повторить тему.':'Жаттығу нәтижелері әзірге қолжетімсіз. Сабақты ашып, тақырыпты қайталай аласың.')):nextAvailable?(progress.nextKind==='practice'?(lang==='ru'?'Теория уже изучена. Закрепи её задачами с проверкой.':'Теория оқылды. Енді оны тексерілетін есептермен бекіт.'):(lang==='ru'?'Сначала понятный разбор, затем пример и твоя практика.':'Алдымен түсінікті талдау, содан кейін мысал мен жаттығу.')):(lang==='ru'?'Выбери урок ниже, чтобы повторить правило и потренироваться.':'Ережені қайталап, жаттығу үшін төменнен сабақ таңда.')}</p>
    {recommendationReady&&nextAvailable&&<><div className="curriculum-path-meta"><span>{nextAvailable.quarter} {c.quarter}</span><span>{progress.nextKind==='practice'?c.practice:(lang==='ru'?'Теория + примеры':'Теория + мысалдар')}</span></div><button className="curriculum-path-start" onClick={openRecommendation}>{nextAction}<span aria-hidden="true">→</span></button></>}
   </div><div className="curriculum-owl-scene" aria-hidden="true"><span>÷</span><img src="/mascot/synaq-owl-study.webp" width="240" height="240" alt=""/><span>+</span></div>
  </section>
  <section className="curriculum-course-progress" aria-label={lang==='ru'?'Прогресс программы':'Бағдарлама барысы'}>
   <div className="curriculum-progress-counts"><div><span className="curriculum-progress-symbol" aria-hidden="true">≡</span><div><strong>{theoryReady?progress.studiedCount:'—'}<small> / {gradeTopics.length}</small></strong><span>{lang==='ru'?'Теория изучена':'Теория оқылды'}</span></div><div className="curriculum-stat-track" aria-hidden="true"><i style={{width:`${theoryReady?progress.studiedCount/gradeTopics.length*100:0}%`}}/></div></div><div><span className="curriculum-progress-symbol" aria-hidden="true">✓</span><div><strong>{progress.historyStatus==='ready'?progress.masteredCount:'—'}<small> / {gradeTopics.length}</small></strong><span>{lang==='ru'?'Закреплено практикой':'Жаттығумен бекітілді'}</span></div><div className="curriculum-stat-track" aria-hidden="true"><i style={{width:`${progress.historyStatus==='ready'?progress.masteredCount/gradeTopics.length*100:0}%`}}/></div></div></div>
   <details className="curriculum-progress-explainer"><summary>{lang==='ru'?'Как считается прогресс':'Барыс қалай есептеледі'}</summary><p>{lang==='ru'?'Теория: пройди все части урока и самопроверку. Практика: минимум 5 проверенных ответов и 80% верных в последних 10 ответах темы. Учитываются последние 500 ответов; при 500 и более ответах нужны 10 ответов по теме.':'Теория: сабақтың барлық бөлімі мен өзіндік тексеруден өт. Жаттығу: кемінде 5 тексерілген жауап және тақырыптың соңғы 10 жауабында 80% дұрыстық. Соңғы 500 жауап есептеледі; 500 немесе одан көп жауап болса, тақырыптан 10 жауап қажет.'}</p></details>
   {progressNotice}{progress.historyStatus==='error'&&<p className="curriculum-progress-note" role="alert">{lang==='ru'?'Не удалось загрузить результаты практики.':'Жаттығу нәтижелері жүктелмеді.'}<button className="link" onClick={progress.retry}>{lang==='ru'?'Повторить':'Қайталау'}</button></p>}
  </section>
  <section className="curriculum-catalog-topics" aria-labelledby="curriculum-topics-heading">
   <div className="curriculum-catalog-section-title"><div><span>{grade} {c.grade.toLowerCase()} · {gradeTopics.length} {c.lessons}</span><h2 id="curriculum-topics-heading">{lang==='ru'?'Твоя карта тем':'Сенің тақырыптар картаң'}</h2></div><span className="curriculum-catalog-mark" aria-hidden="true">↗</span></div>
   <div className="curriculum-quarter-picker" role="group" aria-label={lang==='ru'?'Выбрать четверть':'Тоқсанды таңдау'}>{grouped.map((items,index)=><button key={index} className={quarter===index+1?'on':''} aria-pressed={quarter===index+1} aria-controls="curriculum-quarter-panel" onClick={()=>selectQuarter(index+1)}><b>{index+1}</b><span>{c.quarter}</span></button>)}</div>
   <section className="curriculum-quarter" id="curriculum-quarter-panel" aria-labelledby="curriculum-quarter-heading">
    <div className="curriculum-quarter-title"><span aria-hidden="true">{String(quarter).padStart(2,'0')}</span><div><h3 id="curriculum-quarter-heading">{local(quarterTopics[0]?.unit)}</h3><p>{quarterTopics.length} {c.lessons} · {quarterTopics.reduce((n,t)=>n+t.hours,0)} {c.hours}</p></div></div>
    <div className="curriculum-topic-list">{shownTopics.map((t,i)=>{const open=canOpen(t),status=topicStatuses.get(t.key),saved=progress.theory.lessons[t.key],theoryParts=(saved?.completedSteps?.length||0)+(saved?.checkPassed?1:0),isNext=recommendationReady&&nextAvailable?.key===t.key;return <button className={`curriculum-topic${open?'':' is-locked'}${isNext?' is-next':''}`} onClick={()=>openTopic(t)} key={t.key}><span className="curriculum-topic-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div><span className="curriculum-topic-meta">{isNext?<em>{lang==='ru'?'ТВОЙ СЛЕДУЮЩИЙ ШАГ':'СЕНІҢ КЕЛЕСІ ҚАДАМЫҢ'}</em>:!open?<em className="curriculum-locked-label">{c.pro}</em>:<span>{lang==='ru'?'УРОК':'САБАҚ'} {i+1}</span>}<span>{t.hours} {c.hours}</span></span><b>{local(t.title)}</b><span className="curriculum-topic-status">{theoryReady&&status?.theoryStudied?<em>{lang==='ru'?'✓ Теория изучена':'✓ Теория оқылды'}</em>:theoryReady&&status?.theoryStarted?<em>Теория: {theoryParts}/{curriculumLessonPages(t).length-1}</em>:<em className="not-started">{!open?(lang==='ru'?'Открыть со Standard':'Standard арқылы ашу'):(lang==='ru'?'Разбор и практика':'Талдау мен жаттығу')}</em>}{progress.historyStatus==='ready'&&status?.practiceMastered&&<em className="mastered">{lang==='ru'?'✓ Закреплено':'✓ Бекітілді'}</em>}{progress.historyStatus==='ready'&&status?.practiceCount>0&&!status.practiceMastered&&<em className="in-progress">{c.practice}: {status.practiceAccuracy}% · {status.practiceCount}/10</em>}</span></div><i aria-hidden="true">{open?'→':<svg width="17" height="19" viewBox="0 0 20 22" fill="none"><rect x="3" y="9" width="14" height="11" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M6 9V6a4 4 0 0 1 8 0v3M10 13v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}</i></button>})}</div>
    {quarterTopics.length>6&&<button className="curriculum-show-topics" aria-expanded={showAllTopics} onClick={()=>setShowAllTopics(value=>!value)}>{showAllTopics?(lang==='ru'?'Показать меньше':'Азырақ көрсету'):(lang==='ru'?`Показать остальные темы (${quarterTopics.length-6})`:`Қалған тақырыптарды көрсету (${quarterTopics.length-6})`)}<span aria-hidden="true">{showAllTopics?'−':'+'}</span></button>}
   </section>
   <p className="curriculum-access-note">{isPro?(lang==='ru'?'Все темы этого класса доступны. Выбирай четверть и учись в своём темпе.':'Бұл сыныптың барлық тақырыбы қолжетімді. Тоқсанды таңдап, өз қарқыныңмен оқы.'):(isStandard?(lang==='ru'?'В твоём архивном тарифе открыты первые 2 урока каждой четверти.':'Архивтік тарифіңде әр тоқсанның алғашқы 2 сабағы ашық.'):(lang==='ru'?'Первый урок каждой четверти доступен бесплатно.':'Әр тоқсанның бірінші сабағы тегін қолжетімді.'))}{!isPro&&<button onClick={onUpgrade}>{c.upgrade} →</button>}</p>
  </section>
 </main>
}
