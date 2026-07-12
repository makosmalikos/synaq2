import React, { useEffect, useState, useRef } from 'react';
import { api, isCorrect } from '../api.js';
import { auth, saveMock } from '../firebase.js';
import Explain from './Explain.jsx';

const LT = ['A', 'B', 'C', 'D', 'E'];
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

// Мок-тест строго по школам: экзамен у каждой свой, вариант должен быть
// цельным. Это не то же самое, что дайындык, где банк общий.
export default function Mock() {
  const [schools, setSchools] = useState([]);
  const [school, setSchool] = useState(null);
  const [list, setList] = useState([]);
  const [test, setTest] = useState(null);
  const [meta, setMeta] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [hideTimer, setHideTimer] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [result, setResult] = useState(null);
  const tick = useRef(null);

  useEffect(() => { api.schools().then(setSchools).catch(() => {}); }, []);
  useEffect(() => { if (school) api.mockList(school).then(setList).catch(() => {}); }, [school]);

  useEffect(() => {
    if (!test || result) return;
    tick.current = setInterval(() => setLeft((s) => {
      if (s <= 1) { clearInterval(tick.current); submit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(tick.current);
  }, [test, result]);

  async function open(v) {
    const t = await api.mockGet(v.id, 'kk');
    if (!t) return;
    setMeta(v); setTest(t); setAnswers({}); setFlags({}); setI(0);
    setLeft((v.timeLimitMin || 60) * 60); setResult(null);
  }

  async function submit() {
    const r = await api.mockSubmit(test.id, answers, 'kk');
    setResult(r);
    if (auth.currentUser) {
      saveMock(auth.currentUser.uid, {
        testId: test.id, school: meta.school, title: meta.title,
        score: r.score, gradable: r.gradable, total: r.total, review: r.review,
        points: r.points ?? null, scoring: r.scoring ?? null,
      }).catch(() => {});
    }
  }
  const back = () => { setTest(null); setResult(null); setMeta(null); };

  // ── выбор школы ──
  if (!school) return (
    <main>
      <p className="kicker">Мок-тест</p>
      <h1>Қай мектептің сынағы?</h1>
      <p className="muted" style={{ marginTop: 6 }}>Әр мектептің емтихан форматы бөлек.</p>
      <div className="list" style={{ marginTop: 16 }}>
        {schools.map((s) => (
          <div className="row-item" key={s.code}
            onClick={() => s.variants && setSchool(s.code)}
            style={{ opacity: s.variants ? 1 : 0.5, cursor: s.variants ? 'pointer' : 'default' }}>
            <b style={{ font: "700 18px 'Lora',serif", flex: 1 }}>{s.code}</b>
            <span className="rt">
              {s.variants ? `${s.variants} нұсқа · ${s.questions} есеп →` : 'Жақында ашылады'}
            </span>
          </div>
        ))}
      </div>
    </main>
  );

  // ── выбор варианта ──
  if (!test) return (
    <main>
      <button className="link" onClick={() => setSchool(null)}>← Мектептер</button>
      <h1>{school}</h1>
      <p className="kicker">Нұсқаны таңда</p>
      <div className="list">
        {list.map((v) => (
          <div className="row-item" key={v.id} onClick={() => open(v)}>
            <b style={{ flex: 1 }}>{v.title}</b>
            <span className="rt">{v.count} есеп · {v.timeLimitMin} мин →</span>
          </div>
        ))}
      </div>
    </main>
  );

  // ── результат ──
  if (result) return (
    <main>
      <p className="kicker">Нәтиже · {meta.school}</p>
      <div className="hero-card" style={{ marginBottom: 18 }}>
        {result.scoring === 'bil' ? (
          <>
            <div style={{ font: "700 44px 'Lora',serif", lineHeight: 1 }}>
              {result.points}<span style={{ fontSize: 20, color: '#9A9384' }}> / {result.maxPoints}</span>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 14 }}>
              ұпай · {result.score} дұрыс, {result.wrong} қате
              {result.cancelled > 0 && <> · 4 қате үшін <b>{result.cancelled}</b> дұрыс жауап жойылды</>}
            </p>
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 12.5 }}>
              Әр 4 қате 1 дұрыс жауапты жояды, қалғаны 1,5-ке көбейтіледі.
            </p>
          </>
        ) : (
          <>
            <div style={{ font: "700 44px 'Lora',serif", lineHeight: 1 }}>
              {result.score}<span style={{ fontSize: 20, color: '#9A9384' }}> / {result.gradable}</span>
            </div>
            <p style={{ margin: '10px 0 0' }}>балл · прогреске сақталды</p>
          </>
        )}
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
      <button className="btn ghost" style={{ marginTop: 16 }} onClick={back}>← Нұсқалар</button>
    </main>
  );

  // ── прохождение ──
  const q = test.questions[i];
  const toggleFlag = () => setFlags({ ...flags, [q.num]: !flags[q.num] });
  const pick = (val) => setAnswers({ ...answers, [q.num]: val });
  const answered = (n) => answers[n] != null && answers[n] !== '';

  return (
    <main>
      <div className="exam-top">
        <span className="ttl">{meta.title}</span>
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
