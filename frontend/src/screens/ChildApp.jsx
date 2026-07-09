import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { fmtTime, lvlColor, lvlOf, lvlTag } from '../lib/ui.js';
import { saveAttempt, saveMockResult, childMocks } from '../lib/auth.js';

const NAV = [
  ['home', 'Басты бет'], ['training', 'Дайындық'], ['mock', 'Апталық сынақ'], ['progress', 'Прогресс'],
];

function Sidebar({ nav, setNav, who, onSignOut }) {
  return (
    <aside className="sidebar">
      <div className="side-brand"><span className="name">Synaq</span><span className="sub">сынақ</span></div>
      {NAV.map(([k, label], i) => (
        <button key={k} className={'nav-item' + (nav === k ? ' on' : '')} onClick={() => setNav(k)}>
          <span className="n">0{i + 1}</span>{label}
          {k === 'mock' && <span className="nav-badge">8</span>}
        </button>
      ))}
      <div className="side-foot">
        <div className="who">
          <div className="avatar" style={{ background: 'var(--ink)' }}>{(who.name || 'Б').charAt(0)}</div>
          <div><div className="nm">{who.name}</div><div className="sb">{who.klass || 6} сынып</div></div>
        </div>
        <button className="logout" onClick={onSignOut}>Шығу</button>
      </div>
    </aside>
  );
}

// ---------- Тренажёр (открытый ответ) ----------
function Training({ childUid, demo }) {
  const [topics, setTopics] = useState([]);
  const [active, setActive] = useState(null);      // topic id
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState('');
  const [result, setResult] = useState(null);      // {correct, solution, answer}
  const [stats, setStats] = useState({ done: 0, correct: 0 });
  const [secs, setSecs] = useState(0);
  const timer = useRef(null);

  useEffect(() => { api.topics().then(setTopics).catch(() => {}); }, []);
  useEffect(() => {
    if (queue.length && !result) {
      setSecs(0);
      timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
      return () => clearInterval(timer.current);
    }
  }, [idx, queue, result]);

  const start = async (tid) => {
    const qs = await api.topicQuestions(tid, 6);
    setActive(tid); setQueue(qs); setIdx(0); setAns(''); setResult(null); setStats({ done: 0, correct: 0 });
  };
  const check = async () => {
    clearInterval(timer.current);
    const q = queue[idx];
    const r = await api.checkTraining(q.id, ans);
    setResult(r);
    setStats((s) => ({ done: s.done + 1, correct: s.correct + (r.correct ? 1 : 0) }));
    if (!demo && childUid) saveAttempt(childUid, { qid: q.id, topic: q.topic, correct: !!r.correct, secs }).catch(() => {});
  };
  const next = () => {
    if (idx + 1 >= queue.length) { setQueue([]); setActive(null); return; }
    setIdx(idx + 1); setAns(''); setResult(null);
  };

  if (!active) {
    return (
      <div className="rise">
        <p className="page-eyebrow">Дайындық</p>
        <h1 className="page-title">Тақырып таңда</h1>
        <p className="page-sub">Әр тақырып — РФМШ-2025 нұсқаларынан алынған нақты есептер. Ашық жауап.</p>
        <div className="card">
          {topics.map((t, i) => (
            <div key={t.id} className="trow" style={{ cursor: 'pointer' }} onClick={() => start(t.id)}>
              <span className="num">0{i + 1}</span>
              <span className="nm">{t.name}</span>
              <span className="cnt">{t.count} есеп</span>
              <span className="mono" style={{ color: 'var(--accent)' }}>→</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!queue.length) {
    return (
      <div className="rise">
        <p className="page-eyebrow">Қорытынды</p>
        <h1 className="page-title">{stats.correct} / {stats.done} дұрыс</h1>
        <p className="page-sub">Жарайсың! Тағы бір тақырыпты пысықтайық.</p>
        <button className="btn btn-dark" style={{ maxWidth: 260 }} onClick={() => setActive(null)}>Тақырыптарға оралу</button>
      </div>
    );
  }

  const q = queue[idx];
  const prog = Math.round((idx / queue.length) * 100);
  return (
    <div className="rise" style={{ maxWidth: 640 }}>
      <div className="q-progress"><span style={{ width: `${prog}%` }} /></div>
      <div className="q-wrap">
        <div className="q-top">
          <span className="q-sub" style={{ margin: 0 }}>Есеп {idx + 1} / {queue.length}</span>
          <span className="pill">{fmtTime(secs)}</span>
        </div>
        {q.image && <div className="q-image mono" style={{ color: 'var(--muted)' }}>[сурет: {q.image}]</div>}
        <div className="q-statement">{q.statement}</div>
        <div className="answer-in">
          <input autoFocus value={ans} disabled={!!result}
            className={result ? (result.correct ? 'ok' : 'bad') : ''}
            onChange={(e) => setAns(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (result ? next() : ans && check())}
            placeholder="Жауабыңды жаз…" />
          {!result
            ? <button className="btn btn-dark" style={{ width: 'auto', padding: '0 24px' }} disabled={!ans} onClick={check}>Тексеру</button>
            : <button className="btn btn-dark" style={{ width: 'auto', padding: '0 24px' }} onClick={next}>Келесі →</button>}
        </div>
        {result && (
          <div className={'feedback' + (result.correct ? ' good' : '')}>
            <div className="ft" style={{ color: result.correct ? 'var(--green)' : 'var(--accent)' }}>
              {result.correct ? 'Дұрыс' : (result.gradable ? `Дұрыс жауап: ${result.answer}` : 'Бұл есеп ресми кілт бойынша тексеріледі')}
            </div>
            <div className="fx">{result.solution}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Мок-тест (экзамен режимі) ----------
function Mock({ childUid, demo }) {
  const [list, setList] = useState([]);
  const [stage, setStage] = useState('list');     // list | run | done
  const [variant, setVariant] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);
  const timer = useRef(null);

  useEffect(() => { api.mockList().then(setList).catch(() => {}); }, []);
  useEffect(() => {
    if (stage !== 'run') return;
    timer.current = setInterval(() => setLeft((s) => {
      if (s <= 1) { clearInterval(timer.current); submit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(timer.current);
  }, [stage]);

  const begin = async (id) => {
    const v = await api.mock(id);
    setVariant(v); setStage('run'); setIdx(0); setAnswers({}); setFlags({});
    setLeft((v.timeLimitMin || 90) * 60); setResult(null);
  };
  const submit = async () => {
    clearInterval(timer.current);
    const r = await api.submitMock(variant.id, answers);
    setResult(r); setStage('done');
    if (!demo && childUid) saveMockResult(childUid, {
      testId: r.testId, title: r.title, score: r.score, gradable: r.gradable, total: r.total,
    }).catch(() => {});
  };

  if (stage === 'list') {
    return (
      <div className="rise">
        <p className="page-eyebrow">Апталық сынақ</p>
        <h1 className="page-title">Толық нұсқалар</h1>
        <p className="page-sub">РФМШ-2025, 7 сынып. 30 есеп, ашық жауап, қатаң таймер — нағыз емтихандай.</p>
        <div className="card">
          {list.map((v, i) => (
            <div key={v.id} className="trow" style={{ cursor: 'pointer' }} onClick={() => begin(v.id)}>
              <span className="num">0{i + 1}</span>
              <span className="nm">{v.title}</span>
              <span className="cnt">{v.count} есеп · {v.timeLimitMin} мин</span>
              <span className="mono" style={{ color: 'var(--accent)' }}>Бастау →</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'run') {
    const q = variant.questions[idx];
    const low = left < 300;
    return (
      <div className="rise" style={{ maxWidth: 680 }}>
        <div className="mock-head">
          <div><p className="page-eyebrow" style={{ margin: 0 }}>{variant.title}</p></div>
          <span className={'timer' + (low ? ' low' : '')}>{fmtTime(left)}</span>
        </div>
        <div className="q-wrap">
          <div className="q-top">
            <span className="q-sub" style={{ margin: 0 }}>Есеп {q.num} / {variant.questions.length}</span>
            <button className="pill" style={{ cursor: 'pointer', borderColor: flags[q.num] ? 'var(--accent)' : 'var(--muted2)', color: flags[q.num] ? 'var(--accent)' : 'var(--muted2)', background: flags[q.num] ? 'var(--accent-tint)' : 'transparent' }}
              onClick={() => setFlags({ ...flags, [q.num]: !flags[q.num] })}>
              {flags[q.num] ? '⚑ Белгіленді' : '⚐ Белгілеу'}
            </button>
          </div>
          {q.image && <div className="q-image mono" style={{ color: 'var(--muted)' }}>[сурет: {q.image}]</div>}
          <div className="q-statement">{q.statement}</div>
          <div className="answer-in">
            <input value={answers[q.num] || ''} onChange={(e) => setAnswers({ ...answers, [q.num]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && idx < variant.questions.length - 1 && setIdx(idx + 1)}
              placeholder="Жауабыңды жаз…" />
          </div>
          <div className="row-actions">
            <button className="inline-btn" style={{ border: '1px solid var(--line)', background: 'transparent', color: 'var(--muted)', opacity: idx === 0 ? .5 : 1 }}
              disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Алдыңғы</button>
            {idx < variant.questions.length - 1
              ? <button className="inline-btn" style={{ background: 'var(--ink)', color: 'var(--card)' }} onClick={() => setIdx(idx + 1)}>Келесі →</button>
              : <button className="inline-btn" style={{ background: 'var(--accent)', color: '#fff' }} onClick={submit}>Аяқтау →</button>}
          </div>
        </div>
        <div className="palette">
          {variant.questions.map((qq, i) => (
            <button key={qq.num}
              className={'pal' + (answers[qq.num] ? ' answered' : '') + (flags[qq.num] ? ' flagged' : '') + (i === idx ? ' cur' : '')}
              onClick={() => setIdx(i)}>{qq.num}</button>
          ))}
        </div>
        <button className="btn btn-ghost" style={{ marginTop: 16, border: 'none', color: 'var(--muted)' }} onClick={() => { clearInterval(timer.current); setStage('list'); }}>Шығу (сақталмайды)</button>
      </div>
    );
  }

  // done
  const pct = result.gradable ? Math.round((result.score / result.gradable) * 100) : 0;
  const verdict = pct >= 75 ? 'Тамаша нәтиже — емтихан деңгейіне жақынсың.' : pct >= 50 ? 'Жақсы жүріс. Әлсіз тақырыптарды пысықта.' : 'Бастама жасалды. Күнделікті жаттығу балды көтереді.';
  return (
    <div className="rise" style={{ maxWidth: 700 }}>
      <p className="page-eyebrow">Нәтиже · {result.title}</p>
      <div className="q-wrap" style={{ marginBottom: 18 }}>
        <div className="result-score">{result.score} <span style={{ color: 'var(--faint)', fontSize: 26 }}>/ {result.gradable}</span></div>
        <p className="page-sub" style={{ margin: '8px 0 0' }}>{verdict}</p>
      </div>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-h"><span className="t">Тақырыптар бойынша</span></div>
        {Object.entries(result.perTopic).map(([tid, b]) => {
          const p = Math.round((b.correct / b.total) * 100), l = lvlOf(p);
          return (
            <div key={tid} className="trow">
              <span className="nm">{tid}</span>
              <span className="cnt">{b.correct} / {b.total}</span>
              <div className="bar"><span style={{ width: `${p}%`, background: lvlColor(l) }} /></div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="card-h"><span className="t">Есептердің талдауы</span></div>
        {result.review.map((r) => (
          <div key={r.num} className="trow" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <span className="num">{r.num}</span>
              <span className="nm" style={{ fontWeight: 500, fontSize: 14 }}>{r.statement}</span>
              <span className="tag" style={{ color: r.correct ? 'var(--green)' : (r.correctAnswer ? 'var(--accent)' : 'var(--muted2)'), borderColor: r.correct ? 'var(--green)' : (r.correctAnswer ? 'var(--accent)' : 'var(--muted2)') }}>
                {r.correct ? 'Дұрыс' : (r.correctAnswer ? 'Қате' : 'Кілт')}
              </span>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', paddingLeft: 32 }}>
              {r.correctAnswer ? `Жауап: ${r.correctAnswer}` : 'Ресми кілт бойынша'} · Сенікі: {r.userAnswer || '—'}
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-dark" style={{ maxWidth: 260, marginTop: 18 }} onClick={() => setStage('list')}>Нұсқаларға оралу</button>
    </div>
  );
}

function Home({ who, setNav }) {
  return (
    <div className="rise">
      <p className="page-eyebrow">Басты бет · {who.klass || 6} сынып</p>
      <h1 className="page-title">Сәлем, {who.name}!</h1>
      <p className="page-sub">Бүгін бір қадам жақынырақ. Тренажёр немесе апталық сынақтан баста.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="reco">
          <div className="rt">Дайындық</div>
          <div className="rd">12 тақырып бойынша РФМШ есептері. Әр қатеге толық талдау.</div>
          <button onClick={() => setNav('training')}>Бастау →</button>
        </div>
        <div className="reco" style={{ background: 'var(--accent)' }}>
          <div className="rt">Апталық сынақ</div>
          <div className="rd" style={{ color: '#F7D9D5' }}>8 толық нұсқа. Нағыз емтихан жағдайында өзіңді сына.</div>
          <button style={{ background: 'var(--ink)' }} onClick={() => setNav('mock')}>Сынаққа кірісу →</button>
        </div>
      </div>
    </div>
  );
}

function Progress({ childUid, demo }) {
  const [mocks, setMocks] = useState([]);
  useEffect(() => { if (!demo && childUid) childMocks(childUid).then(setMocks).catch(() => {}); }, [childUid, demo]);
  return (
    <div className="rise">
      <p className="page-eyebrow">Прогресс</p>
      <h1 className="page-title">Менің нәтижелерім</h1>
      {demo
        ? <p className="page-sub">Демо-режимде нәтижелер сақталмайды. Firebase қосылса, әр сынақ осы жерде жиналады.</p>
        : mocks.length === 0
          ? <p className="page-sub">Әзірге сынақ тапсырмағансың. Бірінші сынақтан кейін нәтижелер осында пайда болады.</p>
          : (
            <div className="card">
              {mocks.map((m, i) => (
                <div key={i} className="trow">
                  <span className="num">0{i + 1}</span>
                  <span className="nm">{m.title}</span>
                  <span className="cnt">{m.score} / {m.gradable}</span>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}

export default function ChildApp({ session, onSignOut, demo }) {
  const [nav, setNav] = useState('home');
  const who = { name: session.user.displayName || 'Бала', klass: 6 };
  const childUid = session.user.uid;
  return (
    <div className="shell">
      <Sidebar nav={nav} setNav={setNav} who={who} onSignOut={onSignOut} />
      <main className="main">
        {nav === 'home' && <Home who={who} setNav={setNav} />}
        {nav === 'training' && <Training childUid={childUid} demo={demo} />}
        {nav === 'mock' && <Mock childUid={childUid} demo={demo} />}
        {nav === 'progress' && <Progress childUid={childUid} demo={demo} />}
      </main>
    </div>
  );
}
