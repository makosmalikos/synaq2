import React, { useEffect, useState } from 'react';
import { centerCall, centerError } from './centerApi.js';
import CenterPortal from './CenterPortal.jsx';
import BrandLoader from './components/BrandLoader.jsx';

export default function ParentCenterHome({ childrenList, lang, onAvailability, children }) {
  const ru = lang === 'ru', ids = childrenList.map(child => child.uid).join('|');
  const [snapshot, setState] = useState({ ids: '', results: [], error: null, loading: true });
  const state = snapshot.ids === ids ? snapshot : { results: [], error: null, loading: true };
  const [revision, setRevision] = useState(0), [selected, setSelected] = useState('');
  const [mode, setMode] = useState('center'), [view, setView] = useState('home');
  useEffect(() => {
    let current = true;
    setState(previous => ({ ids, results: previous.ids === ids ? previous.results : [], error: null, loading: true }));
    Promise.all(ids ? ids.split('|').map(async childUid => {
      try { return { childUid, data: await centerCall({ action: 'student', childUid }) }; }
      catch (error) { return { childUid, data: null, error }; }
    }) : []).then(results => {
      if (!current) return;
      setState({ ids, results, loading: false, error: results.find(result => result.error)?.error || null });
      const connected = results.filter(result => result.data?.enrollment);
      onAvailability(connected.length > 0);
      setSelected(value => results.some(result => result.childUid === value) ? value : connected[0]?.childUid || results[0]?.childUid || '');
    });
    return () => { current = false; };
  }, [ids, revision, onAvailability]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('focus', refresh); window.addEventListener('synaq:center-change', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('synaq:center-change', refresh); };
  }, []);
  const connected = state.results.some(result => result.data?.enrollment);
  const result = state.results.find(result => result.childUid === selected);
  const child = childrenList.find(child => child.uid === selected);
  return <>
    <section className="cp-parent-shell" id="parent-center-overview" aria-label={ru ? 'Обучение в центре' : 'Орталықтағы оқу'}>
      {state.loading && !state.results.length && childrenList.length > 0 && <BrandLoader compact />}
      {state.error && <p role="alert" className="cw-alert">{centerError(state.error, lang)}<button onClick={() => setRevision(value => value + 1)}>{ru ? 'Повторить' : 'Қайталау'}</button></p>}
      {connected && <>
        <div className="cp-parent-toolbar"><div className="cp-parent-switch"><button aria-pressed={mode === 'center'} onClick={() => setMode('center')}>{ru ? 'Учёба в центре' : 'Орталықтағы оқу'}</button><button aria-pressed={mode === 'personal'} onClick={() => setMode('personal')}>{ru ? 'Общая подготовка' : 'Жалпы дайындық'}</button></div>
          {mode === 'center' && <label>{ru ? 'Ребёнок' : 'Бала'}<select className="cp-child-select" value={selected} onChange={event => { setSelected(event.target.value); setView('home'); }}>{childrenList.map(c => <option key={c.uid} value={c.uid}>{c.name}</option>)}</select></label>}
        </div>
        {mode === 'center' && <><div className="cp-parent-tabs"><div className="cp-parent-switch">{[['home', ru ? 'Обзор' : 'Шолу'], ['assignments', ru ? 'Задания' : 'Тапсырмалар'], ['schedule', ru ? 'Расписание' : 'Кесте'], ['centerProgress', ru ? 'Результаты' : 'Нәтижелер']].map(([id, title]) => <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>{title}</button>)}</div><div className="cp-refresh"><button disabled={state.loading} onClick={() => setRevision(value => value + 1)}>{state.loading ? (ru ? 'Обновляем…' : 'Жаңартылуда…') : (ru ? 'Обновить' : 'Жаңарту')} ↻</button></div></div>{result?.data && <CenterPortal data={result.data} parent lang={lang} name={child?.name} view={view} onNavigate={setView} />}{result?.error && <p role="status" className="cp-empty">{ru ? 'Данные этого ребёнка не загрузились. Нажмите «Повторить» выше.' : 'Бұл баланың деректері жүктелмеді. Жоғарыдағы «Қайталау» түймесін басыңыз.'}</p>}</>}
      </>}

    </section>
    {((!state.loading && !connected) || (state.results.length > 0 && mode === 'personal')) && children}
  </>;
}
