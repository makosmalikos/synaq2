import React, { useEffect, useState, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { api, isCorrect, translateQuestions } from '../api.js';

import { auth, saveMock } from '../firebase.js';
import Explain from './Explain.jsx';
import { Kolhar } from './Training.jsx';

const LT = ['A', 'B', 'C', 'D', 'E'];
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

// Мок-тест строго по школам: экзамен у каждой свой, вариант должен быть
// цельным. Это не то же самое, что дайындык, где банк общий.
export default function Mock() {
  const { t, lang } = useLang();
  const [schools, setSchools] = useState([]);
  const [school, setSchool] = useState(null);
  const [pause, setPause] = useState(false);   // экран перерыва между секциями
  const [test, setTest] = useState(null);
  const [meta, setMeta] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [hideTimer, setHideTimer] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [open_, setOpen] = useState(null);   // раскрытая задача в разборе
  const tick = useRef(null);

  useEffect(() => { api.schools().then(setSchools).catch(() => {}); }, []);


  useEffect(() => {
    if (!test || result || pause) return;
    tick.current = setInterval(() => setLeft((s) => {
      if (s <= 1) { clearInterval(tick.current); submit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(tick.current);
  }, [test, result, pause]);

  // Школа → сразу случайный вариант. Никакого выбора «нұсқа».
  async function startExam(code) {
    const v = await api.mockRandom(code);
    if (!v) return;
    const qs = await translateQuestions(v.questions, lang);   // языковые задачи не трогаются
    setSchool(code);
    setMeta({ school: code, sections: v.sections });
    setTest({ ...v, questions: qs });
    setAnswers({}); setFlags({}); setI(0); setPause(false);
    setLeft((v.timeLimitMin || 60) * 60); setResult(null);
  }

  const back = () => { setTest(null); setResult(null); setMeta(null); setSchool(null); setPause(false); };

  // ── выбор школы ──
  if (!school) return (
    <main>
      <p className="kicker">{t('ui.11')}</p>
      <h1>{t('ui.12')}</h1>
      <p className="muted" style={{ marginTop: 6 }}>{t('ui.13')}</p>
      <div className="list" style={{ marginTop: 16 }}>
        {schools.map((s) => (
          <div className="row-item" key={s.code}
            onClick={() => s.ready && startExam(s.code)}
            style={{ opacity: s.ready ? 1 : 0.5, cursor: s.ready ? 'pointer' : 'default' }}>
            <b style={{ font: "700 18px 'Lora',serif", flex: 1 }}>{s.code}</b>
            <span className="rt">{s.ready ? '→' : t('ui.60')}</span>
          </div>
        ))}
      </div>
    </main>
  );

  // ── перерыв между секциями (НИШ: математика+колзар → языки) ──
  if (test && pause) return (
    <main style={{ textAlign: 'center', paddingTop: 60 }}>
      <p className="kicker">{t('ui.61')}</p>
      <h1 style={{ marginBottom: 8 }}>{t('ui.62')}</h1>
      <p className="muted" style={{ maxWidth: 380, margin: '0 auto 24px' }}>{t('ui.63')}</p>
      <button className="btn" onClick={() => setPause(false)}>{t('ui.64')}</button>
      <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>{t('ui.65')}</p>
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
            <p style={{ margin: '10px 0 0' }}>{t('ui.18')}</p>
          </>
        )}
      </div>
      <p className="kicker">{t('ui.19')}</p>
      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{t('ui.20')}</p>
      <div className="list">
        {result.review.map((r) => {
          const on = open_ === r.num;
          return (
            <div key={r.num} style={{ borderBottom: '1px solid var(--line)' }}>
              <div onClick={() => setOpen(on ? null : r.num)}
                style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '14px 0', cursor: 'pointer' }}>
                <span style={{ font: "600 13px 'IBM Plex Mono',monospace", color: r.correct ? '#4C7A4E' : '#B0342B' }}>
                  {r.correct ? '✓' : '✗'} №{r.num}
                </span>
                <span className="muted" style={{ fontSize: 13, flex: 1 }}>
                  сенің «{r.your ?? '—'}» · дұрыс «{r.answer ?? '?'}»
                </span>
                <span className="muted" style={{ fontSize: 13 }}>{on ? '▲' : '▼'}</span>
              </div>
              {on && (
                <div style={{ padding: '0 0 16px' }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{r.statement}</p>
                  {r.image && <img className="fig" src={r.image} alt="сурет" />}
                  {r.solution && (
                    <p className="muted" style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.55 }}>{r.solution}</p>
                  )}
                  <Explain q={r} given={r.correct ? null : r.your} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button className="btn ghost" style={{ marginTop: 16 }} onClick={back}>{t('ui.21')}</button>
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

      {q.subject === 'kolzar' ? (
        <Kolhar q={q} answer={answers[q.num]} onPick={pick} disabled={false} correct={null} />
      ) : (
        <>
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
            <input value={answers[q.num] || ''} onChange={(e) => pick(e.target.value)} placeholder={t('ui.24')} />
          )}
        </>
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
        <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>{t('ui.22')}</button>
        <button className="navpill" onClick={() => setNavOpen(!navOpen)}>Сұрақ {i + 1} / {test.questions.length} ▲</button>
        {i + 1 < test.questions.length
          ? <button className="btn" onClick={() => {
              const cur = test.questions[i]?.section;
              const nxt = test.questions[i + 1]?.section;
              setI(i + 1);
              if (nxt && cur && nxt !== cur) setPause(true);   // секция кончилась → перерыв
            }}>{t('ui.9')}</button>
          : <button className="btn accent" onClick={submit}>{t('ui.23')}</button>}
      </div>
    </main>
  );
}
