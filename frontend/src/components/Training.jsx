import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api.js';
import { auth, saveAttempt, getAttempts, setFlag, getFlags } from '../firebase.js';

const LT = ['A', 'B', 'C', 'D', 'E'];
const norm = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '').replace(',', '.').replace(/%$/, '')
  .replace(/(км|мм|см|м|мин|кг|г|л|тг|га|°)$/u, '');

export default function Training({ school }) {
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState(null);
  const [empty, setEmpty] = useState(false);
  const [stat, setStat] = useState({});
  const [topic, setTopic] = useState(null);
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [secs, setSecs] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    api.subjects(school).then((subs) => {
      if (subs) setSubjects(subs); else api.topics(school).then(setTopics).catch(() => {});
    }).catch(() => api.topics(school).then(setTopics).catch(() => {}));
    if (auth.currentUser) getAttempts(auth.currentUser.uid).then((att) => {
      const byTopic = {}, seen = new Set();
      att.forEach((a) => { if (a.correct && !seen.has(a.qid)) { seen.add(a.qid); byTopic[a.topic] = (byTopic[a.topic] || 0) + 1; } });
      setStat(byTopic);
    }).catch(() => {});
  }, [school]);

  useEffect(() => {
    if (!items.length || checked) return;
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [items, i, checked]);

  async function openSubject(sub) {
    if (!sub.count) { setEmpty(true); setTopic(sub); return; }
    const qs = await api.subjectQuestions(sub.id, school);
    const flags = auth.currentUser ? await getFlags(auth.currentUser.uid).catch(() => []) : [];
    qs._flags = new Set(flags);
    setEmpty(false); setTopic(sub); setItems(qs); setI(0); reset(qs, 0);
  }
  async function openTopic(t) {
    const qs = await api.topicQuestions(t.id, true, school);
    const flags = auth.currentUser ? await getFlags(auth.currentUser.uid).catch(() => []) : [];
    qs._flags = new Set(flags);
    setTopic(t); setItems(qs); setI(0); reset(qs, 0);
  }
  const reset = (list = items, idx = i) => {
    setAnswer(''); setChecked(false); setSecs(0);
    setFlagged(list._flags ? list._flags.has(list[idx]?.id) : false);
  };
  const next = () => { if (i + 1 < items.length) { const n = i + 1; setI(n); reset(items, n); } else { setTopic(null); setItems([]); } };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  function check(good) {
    setChecked(true);
    if (auth.currentUser) saveAttempt(auth.currentUser.uid, { qid: q.id, topic: q.topic, correct: good, secs }).catch(() => {});
  }
  function toggleFlag() {
    const on = !flagged; setFlagged(on);
    if (auth.currentUser) setFlag(auth.currentUser.uid, q.id, on).catch(() => {});
  }

  // ── пустой предмет (толтырылуда) ──
  if (topic && empty) return (
    <main>
      <button className="link" onClick={() => { setTopic(null); setEmpty(false); }}>← Пәндер</button>
      <h1 style={{ marginTop: 10 }}>{topic.name}</h1>
      <div className="card" style={{ marginTop: 16, textAlign:'center', padding: 36 }}>
        <p className="muted">Бұл пән бойынша есептер толтырылып жатыр. Жақында қосылады.</p>
      </div>
    </main>
  );

  // ── список предметов (НИШ/БИЛ) ──
  if (!topic && subjects) return (
    <main>
      <p className="kicker">Пәндер</p>
      <div className="list" style={{ marginTop: 8 }}>
        {subjects.map((sub, k) => (
          <div className="row-item" key={sub.id} onClick={() => openSubject(sub)}>
            <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#B7B0A2', width: 26 }}>{String(k + 1).padStart(2, '0')}</span>
            <b style={{ flex: 1 }}>{sub.name}</b>
            <span className="rt">{sub.count ? sub.count + ' сұрақ' : 'жақында'}</span>
          </div>
        ))}
      </div>
    </main>
  );

  // ── список тем (РФМШ) ──
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
            const solved = stat[t.id] || 0, pct = Math.round(solved / t.count * 100);
            return (
              <div className="row-item" key={t.id} onClick={() => openTopic(t)}>
                <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#B7B0A2', width: 26 }}>{String(k + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1 }}>
                  <b>{t.name}</b>
                  <div style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 3 }}>{t.count} сұрақ</div>
                </div>
                <div style={{ width: 120 }}><div className="bar"><i style={{ width: pct + '%' }} /></div></div>
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

  // ── задача (экзаменационный вид) ──
  const q = items[i];
  const ok = checked && (q.options ? answer === q.answer : norm(answer) === norm(q.answer));
  return (
    <main>
      <div className="exam-top">
        <span className="ttl">{topic.name}</span>
        <span className="clock">{fmt(secs)}</span>
      </div>
      <div className="qhead">
        <span className="qnum-chip">{i + 1}/{items.length}</span>
        <button className={'flagbtn' + (flagged ? ' on' : '')} onClick={toggleFlag}><span className="fl">⚑</span> Кейін қайталау</button>
      </div>

      <p className="stmt">{q.statement}</p>
      {q.image && <img className="fig" src={q.image} alt="сурет" />}

      {/* Варианты A–E или поле; после проверки — вместо ответа выходит разбор */}
      {!checked ? (
        q.options ? (
          <div className="opts">
            {q.options.map((o, k) => (
              <button key={k} className={'opt' + (answer === o ? ' sel' : '')} onClick={() => setAnswer(o)}>
                <span className="lt">{LT[k]}</span><span>{o}</span>
              </button>
            ))}
          </div>
        ) : (
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Жауабың" />
        )
      ) : (
        <>
          {q.options && (
            <div className="opts" style={{ marginBottom: 14 }}>
              {q.options.map((o, k) => (
                <div key={k} className={'opt' + (o === q.answer ? ' ok' : (o === answer ? ' bad' : ''))}>
                  <span className="lt">{LT[k]}</span><span>{o}</span>
                </div>
              ))}
            </div>
          )}
          <div className={ok ? 'fb ok' : 'fb no'}>{ok ? 'Дұрыс!' : `Қате. Дұрыс жауап: ${q.answer}`}</div>
          <div className="sol"><div className="lead">Толық талдау</div>{q.solution}</div>
        </>
      )}

      <div className="navbar">
        <button className="btn ghost" onClick={() => { setTopic(null); setItems([]); }}>← Тақырыптар</button>
        {!checked
          ? <button className="btn" disabled={!(answer && answer.toString().trim())} onClick={() => check(q.options ? answer === q.answer : norm(answer) === norm(q.answer))}>Тексеру</button>
          : <button className="btn accent" onClick={next}>Келесі →</button>}
      </div>
    </main>
  );
}
