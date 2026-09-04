import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLang } from '../i18n.jsx';
import { api, isCorrect, translateQuestions } from '../api.js';
import { auth, saveMock, isPro, getDiagnosticStatus, markDiagnosticComplete, getMocks } from '../firebase.js';
import { buildDiagnosis } from '../diagnosis.js';
import Explain from './Explain.jsx';
import DiagnosisReport from './DiagnosisReport.jsx';
import { Kolhar } from './Training.jsx';

const LT = ['A', 'B', 'C', 'D', 'E'];

const recentKey = (school, type) => `synaq_recent_${type}_${school}`;
const readRecent = (school, type) => {
  try { return JSON.parse(localStorage.getItem(recentKey(school, type)) || '[]'); }
  catch { return []; }
};
const rememberRecent = (school, type, values, limit) => {
  try {
    const merged = [...new Set([...values, ...readRecent(school, type)])].slice(0, limit);
    localStorage.setItem(recentKey(school, type), JSON.stringify(merged));
  } catch {}
};

function formatExamTimer(totalSec, lang) {
  const s = Math.max(0, totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0 && m === 0 && sec === 0) {
    if (lang === 'ru') return `${h} ${h === 1 ? 'час' : h < 5 ? 'часа' : 'часов'}`;
    return `${h} сағат`;
  }
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const Stmt = ({ text }) => (
  <>
    {String(text || '').split(/\n{2,}/).map((p, i) => (
      <p className="stmt" key={i} style={i ? { marginTop: 14 } : undefined}>{p}</p>
    ))}
  </>
);

export default function Mock({ onTrainTopic, onGoProgress }) {
  const { t, lang } = useLang();
  const [schools, setSchools] = useState([]);
  const [school, setSchool] = useState(null);
  const [pause, setPause] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [pro, setPro] = useState(null);
  const [diagUsed, setDiagUsed] = useState(null);
  const [topics, setTopics] = useState([]);
  const [test, setTest] = useState(null);
  const [meta, setMeta] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [hideTimer, setHideTimer] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [open_, setOpen] = useState(null);
  const [isDiagnosticRun, setIsDiagnosticRun] = useState(false);
  const tick = useRef(null);

  useEffect(() => {
    api.schools().then(setSchools).catch(() => {});
    api.topics().then(setTopics).catch(() => {});
    const u = auth.currentUser;
    if (!u) return;
    Promise.all([
      isPro(u.uid).then(setPro).catch(() => setPro(false)),
      getDiagnosticStatus(u.uid).then((s) => setDiagUsed(s.used)).catch(() => setDiagUsed(false)),
    ]);
  }, []);

  useEffect(() => {
    if (!test || result || pause) return;
    tick.current = setInterval(() => setLeft((s) => {
      if (s <= 1) { clearInterval(tick.current); submit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(tick.current);
  }, [test, result, pause]);

  const diagnosis = useMemo(() => {
    if (!result?.review?.length || !topics.length) return null;
    return buildDiagnosis(result.review, topics, lang);
  }, [result, topics, lang]);

  async function startExam(code, diagnostic = false) {
    const uid = auth.currentUser?.uid;
    const history = uid ? await getMocks(uid).catch(() => []) : [];
    const excludeQuestionIds = [
      ...readRecent(code, 'questions'),
      ...history.flatMap((m) => api.reviewQuestionIds(m.review || [])),
    ];
    const excludeVariantIds = [
      ...readRecent(code, 'variants'),
      ...history.map((m) => m.sourceId || api.reviewVariantId(code, m.review || [])).filter(Boolean),
    ];
    // lang передаём, чтобы свежесгенерированные (не из банка) задачи сразу
    // приходили на языке интерфейса — без этого их пришлось бы прогонять
    // через платный/медленный перевод (translateQuestions) на каждый мок.
    const v = await api.mockRandom(code, { excludeQuestionIds, excludeVariantIds }, lang);
    if (!v) return;
    rememberRecent(code, 'questions', v.questions.map((q) => q.id).filter(Boolean), 600);
    if (v.sourceId) rememberRecent(code, 'variants', [v.sourceId], 7);
    const qs = await translateQuestions(v.questions, lang);
    setSchool(code);
    setIsDiagnosticRun(diagnostic);
    setMeta({ school: code, sections: v.sections, diagnostic });
    setTest({ ...v, questions: qs });
    setAnswers({}); setFlags({}); setI(0); setPause(false); setStartedAt(Date.now());
    setLeft((v.timeLimitMin || 60) * 60); setResult(null);
  }

  async function submit() {
    if (!test) return;
    clearInterval(tick.current);
    const r = await api.mockSubmit(test.id, answers);
    if (!r) return;
    const spentSec = startedAt ? Math.round((Date.now() - startedAt) / 1000) : null;
    setResult(r);
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const payload = {
      ...r,
      school: meta?.school || school,
      spentSec,
      limitMin: test.timeLimitMin || null,
      diagnostic: isDiagnosticRun || (!pro && !diagUsed),
    };
    try {
      await saveMock(uid, payload);
      if (payload.diagnostic && !pro) {
        await markDiagnosticComplete(uid);
        setDiagUsed(true);
      }
    } catch {}
  }

  const back = () => {
    setTest(null); setResult(null); setMeta(null); setSchool(null);
    setPause(false); setIsDiagnosticRun(false);
  };

  const proUnlockHint = () => {
    alert(t('diag.parentPro'));
  };

  // ── тегін: диагностикалық сынақ немесе Pro upsell ──
  if (!school && pro === false && diagUsed !== null) {
    if (!diagUsed) {
      return (
        <main>
          <p className="kicker">{t('diag.freeMock')}</p>
          <h1>{t('diag.freeMockTitle')}</h1>
          <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>{t('diag.freeMockSub')}</p>
          <div className="list" style={{ marginTop: 16 }}>
            {schools.map((s) => (
              <div className="row-item" key={s.code}
                onClick={() => s.ready && startExam(s.code, true)}
                style={{ opacity: s.ready ? 1 : 0.5, cursor: s.ready ? 'pointer' : 'default' }}>
                <b style={{ font: "700 18px 'Lora',serif", flex: 1 }}>{s.code}</b>
                <span className="rt">{s.ready ? t('diag.startFree') : t('ui.60')}</span>
              </div>
            ))}
          </div>
        </main>
      );
    }
    return (
      <main>
        <p className="kicker">{t('ui.11')}</p>
        <h1>{t('ui.12')}</h1>
        <div className="card" style={{ marginTop: 18, borderColor: 'var(--accent)' }}>
          <p className="kicker" style={{ color: 'var(--accent)', margin: '0 0 8px' }}>{t('diag.doneFree')}</p>
          <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.6 }}>{t('diag.doneFreeSub')}</p>
          {onGoProgress && (
            <button type="button" className="btn accent" style={{ marginBottom: 10 }} onClick={onGoProgress}>
              {t('diag.viewInProgress')}
            </button>
          )}
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>{t('diag.parentPro')}</p>
        </div>
      </main>
    );
  }

  if (!school && pro === null) {
    return <main><p className="muted">{t('common.loading')}</p></main>;
  }

  if (!school) return (
    <main>
      <p className="kicker">{t('ui.11')}</p>
      <h1>{t('ui.12')}</h1>
      <p className="muted" style={{ marginTop: 6 }}>{t('ui.13')}</p>
      <div className="list" style={{ marginTop: 16 }}>
        {schools.map((s) => (
          <div className="row-item" key={s.code}
            onClick={() => s.ready && startExam(s.code, false)}
            style={{ opacity: s.ready ? 1 : 0.5, cursor: s.ready ? 'pointer' : 'default' }}>
            <b style={{ font: "700 18px 'Lora',serif", flex: 1 }}>{s.code}</b>
            <span className="rt">{s.ready ? '→' : t('ui.60')}</span>
          </div>
        ))}
      </div>
    </main>
  );

  if (test && pause) return (
    <main style={{ textAlign: 'center', paddingTop: 60 }}>
      <p className="kicker">{t('ui.61')}</p>
      <h1 style={{ marginBottom: 8 }}>{t('ui.62')}</h1>
      <p className="muted" style={{ maxWidth: 380, margin: '0 auto 24px' }}>{t('ui.63')}</p>
      <button type="button" className="btn" onClick={() => setPause(false)}>{t('ui.64')}</button>
      <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>{t('ui.65')}</p>
    </main>
  );

  if (result) return (
    <main>
      <p className="kicker">{t('diag.result')} · {meta.school}</p>
      <div className="hero-card" style={{ marginBottom: 18 }}>
        {result.scoring === 'bil' ? (
          <>
            <div style={{ font: "700 44px 'Lora',serif", lineHeight: 1 }}>
              {result.points}<span style={{ fontSize: 20, color: '#9A9384' }}> / {result.maxPoints}</span>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 14 }}>
              {result.score} {t('diag.correctShort')}, {result.wrong} {t('diag.wrong')}
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

      {diagnosis && (
        <DiagnosisReport
          diagnosis={diagnosis}
          pro={!!pro}
          onUnlock={proUnlockHint}
          onTrainTopic={pro ? onTrainTopic : undefined}
        />
      )}

      {pro && (
        <>
          <p className="kicker" style={{ marginTop: 22 }}>{t('ui.19')}</p>
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
                      «{r.your ?? '—'}» · «{r.answer ?? '?'}»
                    </span>
                    <span className="muted" style={{ fontSize: 13 }}>{on ? '▲' : '▼'}</span>
                  </div>
                  {on && (
                    <div style={{ padding: '0 0 16px' }}>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{r.statement}</p>
                      {r.image && <img className="fig" src={r.image} alt="" />}
                      {r.solution && <p className="muted" style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.55 }}>{r.solution}</p>}
                      <Explain q={r} given={r.correct ? null : r.your} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <button type="button" className="btn ghost" style={{ marginTop: 16 }} onClick={back}>{t('ui.21')}</button>
    </main>
  );

  const q = test.questions[i];
  const toggleFlag = () => setFlags({ ...flags, [q.num]: !flags[q.num] });
  const pick = (val) => setAnswers({ ...answers, [q.num]: val });
  const answered = (n) => answers[n] != null && answers[n] !== '';

  return (
    <main>
      <div className="exam-top">
        <span className="ttl">{meta.title || meta.school}</span>
        <span className="clock" onClick={() => setHideTimer(!hideTimer)} style={{ cursor: 'pointer' }}>
          {hideTimer ? '⏱' : formatExamTimer(left, lang)}
        </span>
      </div>

      {isDiagnosticRun && !pro && (
        <p className="pill" style={{ marginBottom: 12 }}>{t('diag.freeMockBadge')}</p>
      )}

      <div className="qhead">
        <span className="qnum-chip">{q.num}</span>
        <button type="button" className={'flagbtn' + (flags[q.num] ? ' on' : '')} onClick={toggleFlag}>
          <span className="fl">⚑</span> {t('diag.flag')}
        </button>
      </div>

      {q.subject === 'kolzar' ? (
        <Kolhar q={q} answer={answers[q.num]} onPick={pick} disabled={false} correct={null} />
      ) : (
        <>
          <Stmt text={q.statement} />
          {q.image && <img className="fig" src={q.image} alt="" />}
          {q.options ? (
            <div className="opts">
              {q.options.map((o, k) => (
                <button type="button" key={k} className={'opt' + (answers[q.num] === o ? ' sel' : '')} onClick={() => pick(o)}>
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
        <button type="button" className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>{t('ui.22')}</button>
        <button type="button" className="navpill" onClick={() => setNavOpen(!navOpen)}>{i + 1} / {test.questions.length} ▲</button>
        {i + 1 < test.questions.length
          ? <button type="button" className="btn" onClick={() => {
              const cur = test.questions[i]?.section;
              const nxt = test.questions[i + 1]?.section;
              setI(i + 1);
              if (nxt && cur && nxt !== cur) setPause(true);
            }}>{t('ui.9')}</button>
          : <button type="button" className="btn accent" onClick={submit}>{t('ui.23')}</button>}
      </div>
    </main>
  );
}
