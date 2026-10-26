import React, { useEffect, useRef, useState } from 'react';
import { NIS_PHASES } from '../../../shared/nis-exam.mjs';
import MockQuestionNavigator from './MockQuestionNavigator.jsx';
import MockFinishDialog from './MockFinishDialog.jsx';
import useScreenStart from '../useScreenStart.js';
import './MockExperience.css';

const names = {
  ru:['Математика','Количественные характеристики','Естествознание','Языковой тест'],
  kk:['Математика','Сандық сипаттамалар','Жаратылыстану','Тілдік тест'],
};
const time = seconds => `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
// The transport owns time and closed answers. The player only navigates the active block.
export default function NisExam({ initial, lang, transport, onChange, onComplete, renderQuestion, notice }) {
  const ru = lang === 'ru';
  const [record,setRecord] = useState(initial);
  const current = useRef(initial), mounted = useRef(true), queue = useRef(Promise.resolve());
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [confirm,setConfirm] = useState(false);
  const [now,setNow] = useState(Date.now());
  const locked = useRef(false);
  const commit = patch => {
    if (!mounted.current) return;
    const next = {...current.current,...patch}; current.current=next; setRecord(next); onChange(next);
  };
  const serverNow = () => Date.now() + (current.current.clockOffsetMs || 0);
  const accept = data => {
    setNow(Date.now());
    const old = current.current;
    const changed = data.nis.phase !== old.nis.phase || data.nis.waiting !== old.nis.waiting || data.nis.ready !== old.nis.ready;
    // A response to an earlier save must not erase a more recent click.
    const answers = changed ? {...data.nis.answers} : {...data.nis.answers,...old.answers};
    commit({nis:data.nis,answers,deadline:data.deadline,clockOffsetMs:data.serverNow-Date.now(),
      index:changed ? Math.min(179,(NIS_PHASES[data.nis.phase]?.first || 180)-1) : old.index,
      revision:changed ? data.nis.revision : Math.max(old.revision || 0,data.nis.revision)});
  };
  const snapshot = () => {
    const r=current.current,p=NIS_PHASES[r.nis.phase];
    return {phase:r.nis.phase,revision:r.revision || 0,answers:Object.fromEntries(Object.entries(r.answers).filter(([n])=>Number(n)>=p.first&&Number(n)<=p.last))};
  };
  const enqueue = operation => {
    const promise=queue.current.catch(()=>{}).then(operation);
    queue.current=promise; return promise;
  };
  const save = () => {
    if (locked.current || current.current.nis.waiting || current.current.nis.ready) return;
    const body=snapshot();
    return enqueue(()=>transport({op:'save',...body})).then(data=>{if(mounted.current) {accept(data);setError('');}},()=>{
      if(mounted.current)setError(ru?'Не удалось сохранить ответы на сервере. Проверь интернет и нажми «Сохранить повторно».':'Жауаптар серверге сақталмады. Интернетті тексеріп, «Қайта сақтау» түймесін бас.');
    });
  };
  async function advance(op='advance') {
    if (locked.current || !mounted.current) return;
    locked.current=true; setBusy(true); setConfirm(false); setError('');
    const body=op==='begin-day2'?{op}:{op,...snapshot()};
    try {
      const data=await enqueue(()=>transport(body));
      if(mounted.current)accept(data);
    } catch {
      if(mounted.current)setError(ru?'Не удалось перейти дальше. Ответы остались в этой вкладке. Повтори переход.':'Келесі бөлім ашылмады. Жауаптар осы қойындыда қалды. Қайта көр.');
    } finally { locked.current=false;if(mounted.current)setBusy(false); }
  }
  async function finish() {
    if(locked.current)return;
    locked.current=true;setBusy(true);setError('');
    try {const result=await transport({op:'submit'});if(mounted.current)onComplete(result);}
    catch {if(mounted.current)setError(ru?'Не удалось получить результат. Нажми «Повторить завершение».':'Нәтиже алынбады. Аяқтауды қайтала.');}
    finally{locked.current=false;if(mounted.current)setBusy(false);}
  }
  useEffect(()=>{mounted.current=true;
    if (!current.current.nis.waiting && !current.current.nis.ready && current.current.nis.deadline > serverNow() && (current.current.revision || 0) > current.current.nis.revision) save();
    return()=>{mounted.current=false;};},[]);
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);
  const nis=record.nis, phase=NIS_PHASES[nis.phase];
  const left=nis.deadline?Math.max(0,Math.ceil((nis.deadline-now-(record.clockOffsetMs||0))/1000)):0;
  useEffect(()=>{
    if(nis.ready) {if(!busy && !error)finish();return;}
    if(!nis.waiting && left<=0 && !busy && !error) advance();
  },[nis.phase,nis.waiting,nis.ready,left,busy]);
  const questions=phase?record.test.questions.filter(q=>q.num>=phase.first&&q.num<=phase.last):[];
  const selected=Math.max(0,questions.findIndex(q=>q.num===record.index+1));
  useScreenStart(`nis:${nis.phase}:${nis.waiting}:${selected}`, !nis.waiting && !nis.ready ? '.mock-question-panel' : undefined);
  const q=questions[selected], answered=questions.filter(q=>String(record.answers[q.num]||'').trim()).length;
  const pick=value=>{
    if(locked.current||serverNow()>=nis.deadline)return;
    const r=current.current;
    commit({answers:{...r.answers,[q.num]:value},revision:(r.revision||0)+1});save();
  };
  const go=index=>{if(!locked.current&&index>=0&&index<questions.length)commit({index:questions[index].num-1});};
  return <main className="mock-experience mock-exam-page nis-exam">
    {notice}
    <div className="mock-page-heading"><div><span className="mock-eyebrow">НИШ · SYNAQ · {ru?'ТРЕНИРОВОЧНЫЙ ФОРМАТ':'ЖАТТЫҒУ ФОРМАТЫ'}</span>
      <h1>{nis.ready?(ru?'Тест завершён':'Тест аяқталды'):nis.waiting?(ru?'Первый день завершён':'Бірінші күн аяқталды'):(names[lang]||names.kk)[nis.phase]}</h1>
      <p>{ru?'День 1: 60 + 30 + 30 минут. День 2: языки — 120 минут. Закрытые разделы нельзя изменить.':'1-күн: 60 + 30 + 30 минут. 2-күн: тілдер — 120 минут. Аяқталған бөлімді өзгерте алмайсың.'}</p></div>
      {!nis.ready&&!nis.waiting&&<strong className="clock" role="timer" aria-label={ru?'Осталось в разделе':'Бөлімнің қалған уақыты'}>{time(left)}</strong>}</div>
    <ol className="nis-phases">{NIS_PHASES.map((p,i)=><li key={p.subject} aria-current={i===nis.phase?'step':undefined} className={i<nis.phase?'done':i===nis.phase?'active':''}><span>{i<nis.phase?'✓':i+1}</span>{(names[lang]||names.kk)[i]}<small>{p.minutes} {ru?'мин':'мин'}</small></li>)}</ol>
    {error&&<div className="mock-empty-note" role="alert"><p>{error}</p><button type="button" className="btn" disabled={busy} onClick={()=>nis.ready?finish():nis.waiting?advance('begin-day2'):left<=0?advance():save()}>{nis.ready?(ru?'Повторить завершение':'Аяқтауды қайталау'):left>0&&!nis.waiting?(ru?'Сохранить повторно':'Қайта сақтау'):(ru?'Повторить переход':'Қайта өту')}</button></div>}
    {nis.ready?<p role="status">{busy?(ru?'Проверяем ответы…':'Жауаптар тексерілуде…'):''}</p>:nis.waiting?<section className="mock-question-panel"><h2>{ru?'Языковой тест — отдельным этапом':'Тілдік тест — бөлек кезең'}</h2><p>{ru?'120 заданий первого дня сохранены. Можно отдохнуть и вернуться к языкам позже в течение 7 дней с начала попытки. Таймер второго дня начнётся только по кнопке.':'Бірінші күннің 120 тапсырмасы сақталды. Демалып, сынақ басталғаннан кейін 7 күн ішінде тілдерге орала аласың. Екінші күннің таймері түймені басқанда ғана басталады.'}</p><button type="button" className="btn" disabled={busy} onClick={()=>advance('begin-day2')}>{busy?'…':ru?'Начать день 2 · 120 минут':'2-күнді бастау · 120 минут'}</button></section>:<>
      <p className="mock-empty-note">{ru?`День ${phase.day} · ${answered} из ${questions.length} ответов. Можно переходить только внутри этого раздела.`:`${phase.day}-күн · ${answered}/${questions.length} жауап. Тек осы бөлім ішінде ауыса аласың.`}</p>
      <div className="mock-workspace"><MockQuestionNavigator questions={questions} selectedIndex={selected} onSelect={go} lang={lang} disabled={busy||left<=0} statusFor={q=>record.answers[q.num]?'answered':'unanswered'}/>
      <section className="mock-question-panel"><div className="mock-question-heading"><h2>{ru?'Задание':'Тапсырма'} {q.num}</h2></div>
        {renderQuestion(q,record.answers[q.num]||'',pick,busy||left<=0)}
        <div className="mock-question-footer"><button type="button" className="btn ghost" disabled={selected===0||busy||left<=0} onClick={()=>go(selected-1)}>← {ru?'Назад':'Артқа'}</button><span>{selected+1}/{questions.length}</span>{selected+1<questions.length?<button type="button" className="btn" disabled={busy||left<=0} onClick={()=>go(selected+1)}>{ru?'Далее':'Келесі'} →</button>:<button type="button" className="btn" disabled={busy} onClick={()=>setConfirm(true)}>{ru?'Завершить раздел':'Бөлімді аяқтау'}</button>}</div>
        <button type="button" className="btn ghost" disabled={busy} onClick={()=>setConfirm(true)}>{ru?'Завершить раздел досрочно':'Бөлімді ерте аяқтау'}</button>
      </section></div>
    </>}
    {confirm&&<MockFinishDialog section lang={lang} answered={answered} total={questions.length} onCancel={()=>setConfirm(false)} onConfirm={()=>advance()}/>}
  </main>;
}
