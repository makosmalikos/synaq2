import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { auth, saveMock } from '../firebase.js';
import Explain from './Explain.jsx';

const LT = ['A', 'B', 'C', 'D', 'E'];

export default function Mock({ schools = ['РФМШ'] }) {
  const [weekly, setWeekly] = useState(null);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});      // num -> true
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [hideTimer, setHideTimer] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { api.mockWeekly(schools).then(setWeekly).catch(() => {}); }, [schools.join(',')]);
  useEffect(() => {
    if (!test || result) return;
    if (left <= 0) { submit(); return; }
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [test, left, result]);

  async function start() {
    const t = await api.mockGet(weekly.id, 'kk');
    setTest(t); setAnswers({}); setFlags({}); setI(0); setLeft(t.timeLimitMin * 60); setResult(null); setNavOpen(false);
  }
  async function submit() {
    const r = await api.mockSubmit(test.id, answers, 'kk');
    setResult(r);
    if (auth.currentUser) saveMock(auth.currentUser.uid, { testId: test.id, school: weekly.school, title: weekly.title, score: r.score, gradable: r.gradable, total: r.total, review: r.review }).catch(() => {});
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── старт ──
  if (!test && !result) return (
    <main>
      <p className="kicker">Апталық сынақ</p>
      <h1>Осы аптаның сынағы</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 20 }}>Әр аптада жаңа нұсқа. Нақты емтихан форматы: таймер, сұрақтарды белгілеу, соңында балл мен талдау.</p>
      {weekly ? (
        <div className="hero-card">
          <p className="kicker" style={{ margin: '0 0 8px' }}>{weekly.week}-нұсқа</p>
          <h2 style={{ marginBottom: 6 }}>{weekly.count} сұрақ · {weekly.timeLimitMin} мин</h2>
          <p style={{ margin: '0 0 20px' }}>Аяқтаған соң нәтиже прогреске сақталады.</p>
          <button className="btn accent" onClick={start}>Бастау →</button>
        </div>
      ) : <p className="muted">Жүктелуде…</p>}
    </main>
  );

  // ── результат ──
  if (result) return (
    <main>
      <p className="kicker">Нәтиже</p>
      <div className="hero-card" style={{ marginBottom: 18 }}>
        <div style={{ font: "700 44px 'Lora',serif", lineHeight: 1 }}>{result.score}<span style={{ fontSize: 20, color: '#9A9384' }}> / {result.gradable}</span></div>
        <p style={{ margin: '10px 0 0' }}>балл · прогреске сақталды</p>
      </div>
      <p className="kicker">Талдау</p>
      <div className="list">
        {result.review.map((r) => (
          <div key={r.num} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ font: "600 13px 'IBM Plex Mono',monospace", color: r.correct ? '#4C7A4E' : '#B0342B' }}>
                {r.correct ? '✓' : '✗'} №{r.num}
              </span>
              <span className="muted" style={{ fontSize: 13 }}>
                сенің «{r.your ?? '—'}» · дұрыс «{r.answer ?? '?'}»
              </span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5 }}>{r.statement}</p>
            {!r.correct && <Explain q={r} given={r.your} />}
          </div>
        ))}
      </div>
      <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => { setTest(null); setResult(null); }}>← Артқа</button>
    </main>
  );

  // ── прохождение (экзаменационный вид) ──
  const q = test.questions[i];
  const toggleFlag = () => setFlags({ ...flags, [q.num]: !flags[q.num] });
  const pick = (val) => setAnswers({ ...answers, [q.num]: val });
  const answered = (n) => answers[n] != null && answers[n] !== '';

  return (
    <main>
      <div className="exam-top">
        <span className="ttl">{weekly.title}</span>
        <span className="clock" onClick={() => setHideTimer(!hideTimer)} style={{ cursor: 'pointer' }}>
          {hideTimer ? '⏱ көрсету' : fmt(left)}
        </span>
      </div>

      <div className="qhead">
        <span className="qnum-chip">{q.num}</span>
        <button className={'flagbtn' + (flags[q.num] ? ' on' : '')} onClick={toggleFlag}>
          <span className="fl">⚑</span> Белгілеу
        </button>
      </div>

      <p className="stmt">{q.statement}</p>
      {q.image && <img className="fig" src={q.image} alt="сурет" />}

      {q.options ? (
        <div className="opts">
          {q.options.map((o, k) => (
            <button key={k} className={'opt' + (answers[q.num] === o ? ' sel' : '')} onClick={() => pick(o)}>
              <span className="lt">{LT[k]}</span><span>{o}</span>
            </button>
          ))}
        </div>
      ) : (
        <input value={answers[q.num] || ''} onChange={(e) => pick(e.target.value)} placeholder="Жауабыңды жаз" />
      )}

      {navOpen && (
        <div className="qgrid" style={{ marginTop: 18 }}>
          {test.questions.map((qq, k) => (
            <div key={qq.num}
              className={'qcell' + (answered(qq.num) ? ' done' : '') + (k === i ? ' cur' : '') + (flags[qq.num] ? ' flag' : '')}
              onClick={() => { setI(k); setNavOpen(false); }}>{qq.num}</div>
          ))}
        </div>
      )}

      <div className="navbar">
        <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>← Артқа</button>
        <button className="navpill" onClick={() => setNavOpen(!navOpen)}>Сұрақ {i + 1} / {test.questions.length} ▲</button>
        {i + 1 < test.questions.length
          ? <button className="btn" onClick={() => setI(i + 1)}>Келесі →</button>
          : <button className="btn accent" onClick={submit}>Аяқтау</button>}
      </div>
    </main>
  );
}
