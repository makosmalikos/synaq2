import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLang } from '../i18n.jsx';
import { api, isCorrect, translateQuestions } from '../api.js';

import { POOL } from '../bank.js';
import { auth, saveAttempt, getSolved, setFlag, getFlags, isPro, todayCount } from '../firebase.js';
import Explain from './Explain.jsx';

const LT = ['A', 'B', 'C', 'D', 'E'];
// Блоки раздельно: язык и математика в одной ленте — бессмыслица.
// Заголовок — через t(), чтобы шёл за выбранным языком интерфейса (не только сами задачи).
const BLOCKS = [
  { id: 'math',     titleKey: 'ui.68', only: null },
  { id: 'logic',    titleKey: 'ui.69', only: null },
  { id: 'lang_kaz', titleKey: 'ui.70', only: 'lang_kaz' },
  { id: 'lang_rus', titleKey: 'ui.71', only: 'lang_rus' },
  { id: 'lang_eng', titleKey: 'ui.72', only: 'lang_eng' },
];
// id → тема, чтобы не фильтровать весь пул на каждый рендер
const TOPIC_OF = Object.fromEntries(POOL.map((q) => [q.id, q.topic]));


// ── КОЛХАР: екі баған + салыстыру батырмалары ──
// statement форматы: "Салыстыр...:\n[ортақ шарт]\nА) ...\nВ) ..."
// Шартты абзацтарға бөліп шығарамыз (тілдік есептерде мәтін мен сұрақ бөлек тұрады).
const Stmt = ({ text }) => (
  <>
    {String(text || '').split(/\n{2,}/).map((p, i) => (
      <p className="stmt" key={i} style={i ? { marginTop: 14 } : undefined}>{p}</p>
    ))}
  </>
);

export function Kolhar({ q, answer, onPick, disabled, correct }) {
  const lines = (q.statement || '').split('\n');
  const a = (lines.find((l) => l.startsWith('А)')) || '').slice(2).trim();
  const b = (lines.find((l) => l.startsWith('В)')) || '').slice(2).trim();
  const note = lines.slice(1).filter((l) => !l.startsWith('А)') && !l.startsWith('В)')).join(' ').trim();

  // «А» = А үлкен, «В» = В үлкен, «Тең» = тең
  const BTN = [
    { v: 'А',   sign: '>', label: 'А үлкен' },
    { v: 'Тең', sign: '=', label: 'Тең' },
    { v: 'В',   sign: '<', label: 'В үлкен' },
  ];
  if (q.options?.includes('Анықтау мүмкін емес')) {
    BTN.push({ v: 'Анықтау мүмкін емес', sign: '?', label: 'Анықтау мүмкін емес' });
  }

  const col = {
    flex: '1 1 200px', minWidth: 200, background: '#fff', border: '1px solid var(--line)',
    borderRadius: 12, padding: '18px 18px 20px',
  };
  const tag = {
    font: "700 12px 'IBM Plex Mono',monospace", letterSpacing: '.14em',
    color: '#B0342B', display: 'block', marginBottom: 10,
  };

  return (
    <div>
      {note && <p className="muted" style={{ margin: '0 0 12px', fontSize: 14 }}>{note}</p>}

      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={col}><span style={tag}>А</span>
          <span style={{ fontSize: 16, lineHeight: 1.5 }}>{a}</span></div>
        <div style={col}><span style={tag}>В</span>
          <span style={{ fontSize: 16, lineHeight: 1.5 }}>{b}</span></div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {BTN.map((o) => {
          const sel = answer === o.v;
          const good = disabled && o.v === q.answer;
          const bad = disabled && sel && correct === false;
          return (
            <button key={o.v} disabled={disabled} onClick={() => onPick(o.v)}
              style={{
                flex: o.sign === '?' ? '1 1 100%' : 1, minWidth: 90, padding: '14px 10px',
                borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
                border: '1px solid ' + (good ? '#4C7A4E' : bad ? '#B0342B' : sel ? 'var(--ink)' : 'var(--line)'),
                background: good ? 'rgba(76,122,78,.12)' : bad ? 'rgba(176,52,43,.1)' : sel ? 'var(--ink)' : '#fff',
                color: good ? '#2F5A31' : bad ? '#B0342B' : sel ? 'var(--bg)' : 'var(--ink)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
              <span style={{ font: "700 22px 'Lora',serif", lineHeight: 1 }}>{o.sign}</span>
              <span style={{ font: "600 12.5px 'Golos Text'" }}>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Training({ onXp, startTopicId, onTopicOpened }) {
  const { t, lang } = useLang();
  const [topics, setTopics] = useState([]);
  const [solved, setSolved] = useState(new Set());
  const [flags, setFlags] = useState(new Set());
  const [topic, setTopic] = useState(null);
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [secs, setSecs] = useState(0);
  const [pro, setPro] = useState(true);        // тексерілгенше бөгемейміз
  const [done, setDone] = useState(0);
  const [xpPop, setXpPop] = useState(null);         // бүгін шығарған есеп саны
  const FREE_DAY = 5;                          // тегін тарифте күніне 5 есеп
  const locked = !pro && done >= FREE_DAY;
  const timer = useRef(null);

  useEffect(() => {
    const u = auth.currentUser;
    if (u) {
      isPro(u.uid).then(setPro).catch(() => setPro(false));
      todayCount(u.uid).then(setDone).catch(() => {});
    }
    api.topics().then(setTopics).catch(() => {});
    if (!auth.currentUser) return;
    getSolved(auth.currentUser.uid).then((r) => setSolved(new Set(r.map((x) => x.qid)))).catch(() => {});
    getFlags(auth.currentUser.uid).then((f) => setFlags(new Set(f))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!startTopicId || !topics.length) return;
    const tp = topics.find((x) => x.id === startTopicId);
    if (!tp) return;
    (async () => {
      const list = await translateQuestions(await api.topicQuestions(tp.id), lang);
      setTopic(tp);
      setItems(list);
      setI(0);
      setAnswer('');
      setChecked(false);
      setSecs(0);
      onTopicOpened?.();
    })();
  }, [startTopicId, topics, lang, onTopicOpened]);

  useEffect(() => {
    if (!items.length || checked) return;
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [items, i, checked]);

  // сколько задач темы уже решено
  // тегін тарифте ашық болатын жалғыз тақырып — тізімдегі біріншісі
  const b0 = topics.length ? topics[0].id : null;

  const solvedIn = useMemo(() => {
    const m = {};
    solved.forEach((id) => { const t = TOPIC_OF[id]; if (t) m[t] = (m[t] || 0) + 1; });
    return m;
  }, [solved]);

  const start = (t, list) => { setTopic(t); setItems(list); setI(0); setAnswer(''); setChecked(false); setSecs(0); };
  const openTopic = async (tp) => start(tp, await translateQuestions(await api.topicQuestions(tp.id), lang));
  const openMixed = async () => start({ id: '_mix', name: t('ui.3') }, await translateQuestions(await api.mixed(lang, 20, 'math'), lang));
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
      if (ok) {
        setXpPop(5);
        onXp?.(5);
        setTimeout(() => setXpPop(null), 1800);
      }
      if (!pro) setDone((n) => n + 1);
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
        </div>
        <div className="list">
          {arr.map((t, k) => {
            const done = Math.min(solvedIn[t.id] || 0, t.count);
            const pct = Math.round(done / t.count * 100);
            const shut = !pro && !(b0 && t.id === b0);      // тегін тарифте — бір ғана тақырып
            return (
              <div className="row-item" key={t.id}
                onClick={() => (shut ? null : openTopic(t))}
                style={{ opacity: shut ? 0.45 : 1, cursor: shut ? 'default' : 'pointer' }}>
                <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#B7B0A2', width: 26 }}>{String(k + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1 }}>
                  <b>{t.name}</b>
                  <div style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 3 }}>
                    {t.schools.join(' · ')}
                  </div>
                </div>
                <div style={{ width: 110 }}><div className="bar"><i style={{ width: pct + '%' }} /></div></div>
                <span style={{ font: "600 13px 'IBM Plex Mono',monospace", width: 46, textAlign: 'right', color: pct >= 60 ? '#4C7A4E' : '#6B655B' }}>
                  {shut ? '🔒' : pct + '%'}
                </span>
              </div>
            );
          })}
        </div>
      </>
    );

    return (
      <main>
        <p className="kicker">{t('ui.1')}</p>
        <h1>{t('ui.2')}</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Есептер үш мектептің бәрінен араласып беріледі.
        </p>

        <div className="hero-card" style={{ marginTop: 16 }}>
          <h2>{t('ui.3')}</h2>
          <p>{t('ui.4')}</p>
          <button className="btn accent" onClick={openMixed}>{t('ui.5')}</button>
        </div>

        {BLOCKS.map((b) => (
          <Group key={b.id} title={t(b.titleKey)}
            arr={topics.filter((tp) => (b.only ? tp.id === b.only : tp.block === b.id))} />
        ))}
      </main>
    );
  }

  // ── тегін тариф лимиті ──
  if (topic && locked) return (
    <main>
      <button className="link" onClick={() => { setTopic(null); setItems([]); }}>{t('ui.6')}</button>
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px' }}>Бүгінгі лимит бітті</h2>
        <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>
          Ертең тағы {FREE_DAY} есеп ашылады.
        </p>
      </div>
    </main>
  );

  // ── задача ──
  const q = items[i];
  if (!q) return (
    <main>
      <button className="link" onClick={() => { setTopic(null); setItems([]); }}>{t('ui.6')}</button>
      <p className="muted" style={{ marginTop: 14 }}>{t('ui.7')}</p>
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

      {/* КОЛХАР: екі баған + салыстыру батырмалары. Қалғаны — әдеттегі көрініс. */}
      {q.subject === 'kolzar' ? (
        <Kolhar q={q} answer={answer} onPick={setAnswer} disabled={checked} correct={checked ? ok : null} />
      ) : (
        <>
          <Stmt text={q.statement} />
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
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={t('ui.10')}
                onKeyDown={(e) => { if (e.key === 'Enter' && answer.trim()) check(); }} />
            )
          ) : (
            q.options && (
              <div className="opts" style={{ marginBottom: 14 }}>
                {q.options.map((o, k) => (
                  <div key={k} className={'opt' + (o === q.answer ? ' ok' : (o === answer ? ' bad' : ''))}>
                    <span className="lt">{LT[k]}</span><span>{o}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {checked && (
        <>
          <div className={ok ? 'fb ok' : 'fb no'}>{ok ? t('ui.66') : `${t('ui.67')} ${q.answer ?? '—'}`}</div>
          {xpPop && <div className="xp-pop">+{xpPop} XP</div>}
          <Explain q={q} given={ok ? null : answer} />
        </>
      )}

      <div className="navbar">
        <button className="btn ghost" onClick={() => { setTopic(null); setItems([]); }}>{t('ui.6')}</button>
        {!checked
          ? <button className="btn" disabled={!(answer && answer.toString().trim())} onClick={check}>{t('ui.8')}</button>
          : <button className="btn accent" onClick={next}>{t('ui.9')}</button>}
      </div>
    </main>
  );
}

const chip = {
  font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase',
  color: '#6B655B', border: '1px solid rgba(23,20,15,.18)', padding: '3px 7px',
};
