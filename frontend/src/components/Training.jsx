import React, { useEffect, useState, useRef, useMemo } from 'react';
import { api, isCorrect } from '../api.js';
import { POOL } from '../bank.js';
import { auth, saveAttempt, getSolved, setFlag, getFlags } from '../firebase.js';
import Explain from './Explain.jsx';

const LT = ['A', 'B', 'C', 'D', 'E'];
const BLOCKS = [
  { id: 'math',  title: 'Математика' },
  { id: 'logic', title: 'Логика' },
  { id: 'lang',  title: 'Тілдер' },
];
// id → тема, чтобы не фильтровать весь пул на каждый рендер
const TOPIC_OF = Object.fromEntries(POOL.map((q) => [q.id, q.topic]));

export default function Training({ schools = ['РФМШ'] }) {
  const [topics, setTopics] = useState([]);
  const [solved, setSolved] = useState(new Set());
  const [flags, setFlags] = useState(new Set());
  const [topic, setTopic] = useState(null);
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [secs, setSecs] = useState(0);
  const timer = useRef(null);

  const key = schools.join(',');

  useEffect(() => {
    api.topics(schools).then(setTopics).catch(() => {});
    if (!auth.currentUser) return;
    getSolved(auth.currentUser.uid).then((r) => setSolved(new Set(r.map((x) => x.qid)))).catch(() => {});
    getFlags(auth.currentUser.uid).then((f) => setFlags(new Set(f))).catch(() => {});
  }, [key]);

  useEffect(() => {
    if (!items.length || checked) return;
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [items, i, checked]);

  // сколько задач темы уже решено
  const solvedIn = useMemo(() => {
    const m = {};
    solved.forEach((id) => { const t = TOPIC_OF[id]; if (t) m[t] = (m[t] || 0) + 1; });
    return m;
  }, [solved]);

  const start = (t, list) => { setTopic(t); setItems(list); setI(0); setAnswer(''); setChecked(false); setSecs(0); };
  const openTopic = async (t) => start(t, await api.topicQuestions(t.id, schools, 'kk'));
  const openMixed = async () => start({ id: '_mix', name: 'Аралас дайындық' }, await api.mixed(schools, 'kk', 20));
  const next = () => {
    if (i + 1 < items.length) { setI(i + 1); setAnswer(''); setChecked(false); setSecs(0); }
    else { setTopic(null); setItems([]); }
  };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  function check() {
    const q = items[i];
    const ok = isCorrect(answer, q);
    setChecked(true);
    if (ok) setSolved((s) => new Set(s).add(q.id));
    if (auth.currentUser) {
      saveAttempt(auth.currentUser.uid, { qid: q.id, topic: q.topic, school: q.school, correct: ok, secs }).catch(() => {});
    }
  }
  function toggleFlag() {
    const q = items[i];
    const on = !flags.has(q.id);
    setFlags((s) => { const n = new Set(s); if (on) n.add(q.id); else n.delete(q.id); return n; });
    if (auth.currentUser) setFlag(auth.currentUser.uid, q.id, on).catch(() => {});
  }

  // ── список тем ──
  if (!topic) {
    const Group = ({ title, arr }) => !arr.length ? null : (
      <>
        <div className="row" style={{ margin: '26px 0 12px' }}>
          <span className="kicker" style={{ margin: 0 }}>{title}</span>
          <span className="tag">{arr.reduce((s, t) => s + t.count, 0)} есеп</span>
        </div>
        <div className="list">
          {arr.map((t, k) => {
            const done = Math.min(solvedIn[t.id] || 0, t.count);
            const pct = Math.round(done / t.count * 100);
            return (
              <div className="row-item" key={t.id} onClick={() => openTopic(t)}>
                <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#B7B0A2', width: 26 }}>{String(k + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1 }}>
                  <b>{t.name}</b>
                  <div style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 3 }}>
                    {t.count} сұрақ · {t.schools.join(' · ')}
                  </div>
                </div>
                <div style={{ width: 110 }}><div className="bar"><i style={{ width: pct + '%' }} /></div></div>
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
        <p className="muted" style={{ marginTop: 6 }}>
          Дайындық: <b>{schools.join(' · ')}</b>.{schools.length > 1 && ' Есептер таңдалған мектептердің бәрінен араласып беріледі.'}
        </p>

        {schools.length > 1 && (
          <div className="hero-card" style={{ marginTop: 16 }}>
            <h2>Аралас дайындық</h2>
            <p>{schools.join(' + ')} есептері кезектесіп келеді.</p>
            <button className="btn accent" onClick={openMixed}>Бастау →</button>
          </div>
        )}

        {BLOCKS.map((b) => <Group key={b.id} title={b.title} arr={topics.filter((t) => t.block === b.id)} />)}
      </main>
    );
  }

  // ── задача ──
  const q = items[i];
  if (!q) return (
    <main>
      <button className="link" onClick={() => { setTopic(null); setItems([]); }}>← Тақырыптар</button>
      <p className="muted" style={{ marginTop: 14 }}>Бұл тақырыпта есеп жоқ.</p>
    </main>
  );
  const ok = checked && isCorrect(answer, q);

  return (
    <main>
      <div className="exam-top">
        <span className="ttl">{topic.name}</span>
        <span className="clock">{fmt(secs)}</span>
      </div>
      <div className="qhead">
        <span className="qnum-chip">{i + 1}/{items.length}</span>
        <span style={chip}>{q.school}</span>
        {q.needsTranslation && <span style={{ ...chip, color: '#9A9384' }} title="Қазақша аудармасы әзірге жоқ">рус</span>}
        <button className={'flagbtn' + (flags.has(q.id) ? ' on' : '')} onClick={toggleFlag}>
          <span className="fl">⚑</span> Кейін қайталау
        </button>
      </div>

      <p className="stmt">{q.statement}</p>
      {q.image && <img className="fig" src={q.image} alt="сурет" />}

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
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Жауабың"
            onKeyDown={(e) => { if (e.key === 'Enter' && answer.trim()) check(); }} />
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
          <div className={ok ? 'fb ok' : 'fb no'}>{ok ? 'Дұрыс!' : `Қате. Дұрыс жауап: ${q.answer ?? '—'}`}</div>
          <Explain q={q} given={ok ? null : answer} />
        </>
      )}

      <div className="navbar">
        <button className="btn ghost" onClick={() => { setTopic(null); setItems([]); }}>← Тақырыптар</button>
        {!checked
          ? <button className="btn" disabled={!(answer && answer.toString().trim())} onClick={check}>Тексеру</button>
          : <button className="btn accent" onClick={next}>Келесі →</button>}
      </div>
    </main>
  );
}

const chip = {
  font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase',
  color: '#6B655B', border: '1px solid rgba(23,20,15,.18)', padding: '3px 7px',
};
