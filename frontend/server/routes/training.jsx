import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api.js';
import { auth, saveAttempt, getAttempts } from '../firebase.js';

const norm = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '').replace(',', '.').replace(/%$/, '')
  .replace(/(км|мм|см|м|мин|кг|г|л|тг|га|°)$/u, '');

export default function Training({ school }) {
  const [topics, setTopics] = useState([]);
  const [stat, setStat] = useState({}); // topicId -> {solved, count}
  const [topic, setTopic] = useState(null);
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [secs, setSecs] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    api.topics(school).then(setTopics).catch(() => {});
    if (auth.currentUser) getAttempts(auth.currentUser.uid).then((att) => {
      const byTopic = {};
      const seen = new Set();
      att.forEach((a) => {
        if (a.correct && !seen.has(a.qid)) { seen.add(a.qid); byTopic[a.topic] = (byTopic[a.topic] || 0) + 1; }
      });
      setStat(byTopic);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!items.length || checked) return;
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [items, i, checked]);

  async function openTopic(t) {
    const qs = await api.topicQuestions(t.id, true, school);
    setTopic(t); setItems(qs); setI(0); reset();
  }
  const reset = () => { setAnswer(''); setChecked(false); setSecs(0); };
  const next = () => { if (i + 1 < items.length) { setI(i + 1); reset(); } else { setTopic(null); setItems([]); } };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function check() {
    setChecked(true);
    const good = norm(answer) === norm(q.answer);
    if (auth.currentUser) saveAttempt(auth.currentUser.uid, { qid: q.id, topic: q.topic, correct: good, secs }).catch(() => {});
  }

  // ── список тем, сгруппированный по блокам ──
  if (!topic) {
    const math = topics.filter((t) => t.block === 'math');
    const logic = topics.filter((t) => t.block === 'logic');
    const total = topics.reduce((s, t) => s + t.count, 0) || 1;
    const share = (arr) => Math.round(arr.reduce((s, t) => s + t.count, 0) / total * 100);
    const Group = ({ title, arr }) => (
      <>
        <div className="row" style={{ margin: '26px 0 12px' }}>
          <span className="kicker" style={{ margin: 0 }}>{title}</span>
          <span className="tag">{share(arr)}% емтихан</span>
        </div>
        <div className="list">
          {arr.map((t, k) => {
            const solved = stat[t.id] || 0;
            const pct = Math.round(solved / t.count * 100);
            return (
              <div className="row-item" key={t.id} onClick={() => openTopic(t)}>
                <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#B7B0A2', width: 26 }}>{String(k + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1 }}>
                  <b>{t.name}</b>
                  <div style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 3 }}>{t.count} сұрақ</div>
                </div>
                <div style={{ width: 120 }}>
                  <div className="bar"><i style={{ width: pct + '%' }} /></div>
                </div>
                <span style={{ font: "600 13px 'IBM Plex Mono',monospace", width: 46, textAlign: 'right', color: pct >= 60 ? '#4C7A4E' : '#6B655B' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </>
    );
    return (
      <main>
        <p className="kicker">Тақырыптар</p>
        <h1>Тақырыпты таңда</h1>
        <p className="muted" style={{ marginTop: 6 }}>Әр тақырып бойынша нақты есептер. Ашық жауап.</p>
        {math.length > 0 && <Group title="Математика" arr={math} />}
        {logic.length > 0 && <Group title="Логика" arr={logic} />}
      </main>
    );
  }

  const q = items[i];
  const ok = checked && norm(answer) === norm(q.answer);
  return (
    <main>
      <div className="row">
        <button className="link" onClick={() => { setTopic(null); setItems([]); }}>← Артқа</button>
        <span className="tag">{topic.name} · {i + 1}/{items.length}</span>
        <span className="timer">⏱ {fmt(secs)}</span>
      </div>
      <p className="stmt">{q.statement}</p>
      {q.image && <img className="fig" src={q.image} alt="сурет" />}
      <input value={answer} disabled={checked} onChange={(e) => setAnswer(e.target.value)} placeholder="Жауабың" />
      {!checked
        ? <button className="btn full" disabled={!answer.trim()} onClick={check}>Тексеру</button>
        : (
          <>
            <div className={ok ? 'fb ok' : 'fb no'}>{ok ? 'Дұрыс!' : `Қате. Дұрыс жауап: ${q.answer}`}</div>
            <div className="sol"><div className="lead">Толық талдау</div>{q.solution}</div>
            <button className="btn full accent" style={{ marginTop: 14 }} onClick={next}>Келесі →</button>
          </>
        )}
    </main>
  );
}
