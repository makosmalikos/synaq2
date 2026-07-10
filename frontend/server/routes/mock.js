import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { auth, saveMock } from '../firebase.js';

// Мок-тест недели: один вариант, сам сменяется каждую неделю. Результат + разбор сохраняются.
export default function Mock({ school }) {
  const [weekly, setWeekly] = useState(null);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => { api.mockWeekly(school).then(setWeekly).catch(() => {}); }, [school]);
  useEffect(() => {
    if (!test || result) return;
    if (left <= 0) { submit(); return; }
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [test, left, result]);

  async function start() {
    const t = await api.mockGet(weekly.id);
    setTest(t); setAnswers({}); setI(0); setLeft(t.timeLimitMin * 60); setResult(null);
  }
  async function submit() {
    const r = await api.mockSubmit(test.id, answers);
    setResult(r);
    if (auth.currentUser) saveMock(auth.currentUser.uid, {
      testId: test.id, title: weekly.title, score: r.score, gradable: r.gradable, total: r.total, review: r.review,
    }).catch(() => {});
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // экран старта — одна карточка недели
  if (!test && !result) return (
    <main>
      <p className="kicker">Апталық сынақ</p>
      <h1>Осы аптаның сынағы</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 20 }}>Әр аптада жаңа нұсқа. Нақты емтихан форматы: таймер, ашық жауап, соңында балл мен талдау.</p>
      {weekly ? (
        <div className="hero-card">
          <p className="kicker" style={{ margin: '0 0 8px' }}>{weekly.week}-нұсқа</p>
          <h2 style={{ marginBottom: 6 }}>{weekly.count} есеп · {weekly.timeLimitMin} мин</h2>
          <p style={{ margin: '0 0 20px' }}>Аяқтаған соң нәтиже прогреске сақталады.</p>
          <button className="btn accent" onClick={start}>Бастау →</button>
        </div>
      ) : <p className="muted">Жүктелуде…</p>}
    </main>
  );

  if (result) return (
    <main>
      <p className="kicker">Нәтиже</p>
      <div className="hero-card" style={{ marginBottom: 18 }}>
        <div style={{ font: "700 44px 'Lora',serif", lineHeight: 1 }}>{result.score}<span style={{ fontSize: 20, color: '#9A9384' }}> / {result.gradable}</span></div>
        <p style={{ margin: '10px 0 0' }}>балл · прогреске сақталды</p>
      </div>
      <p className="kicker">Талдау</p>
      <ol className="review">
        {result.review.map((r) => (
          <li key={r.num} className={r.correct ? 'ok' : 'no'}>
            №{r.num}: сенің «{r.your ?? '—'}» · дұрыс «{r.answer ?? '?'}»{r.note ? <em> · {r.note}</em> : null}
          </li>
        ))}
      </ol>
      <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => { setTest(null); setResult(null); }}>← Артқа</button>
    </main>
  );

  const q = test.questions[i];
  return (
    <main>
      <div className="row"><span className="tag">{weekly.title}</span><span className="timer">⏱ {fmt(left)}</span></div>
      <div className="kicker" style={{ margin: '0 0 10px' }}>№{q.num} · {i + 1}/{test.questions.length}</div>
      <p className="stmt">{q.statement}</p>
      {q.image && <img className="fig" src={q.image} alt="сурет" />}
      <input value={answers[q.num] || ''} onChange={(e) => setAnswers({ ...answers, [q.num]: e.target.value })} placeholder="Жауап (тек енгіз, тексеру — соңында)" />
      <div className="row" style={{ marginTop: 4 }}>
        <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Артқа</button>
        {i + 1 < test.questions.length
          ? <button className="btn" onClick={() => setI(i + 1)}>Келесі →</button>
          : <button className="btn accent" onClick={submit}>Аяқтау</button>}
      </div>
    </main>
  );
}
