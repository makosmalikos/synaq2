import React, { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import { auth, getAttempts, getMocks, getXpSummary, isPro } from './firebase.js';
import { api, topicStats, weekHours, mockSeries } from './api.js';
import { xpLevel } from './xp.js';
import { buildDiagnosis, pickDiagnosticMock } from './diagnosis.js';
import DiagnosisReport from './components/DiagnosisReport.jsx';

const LEVEL_TXT = { strong: 'МЫҚТЫ', mid: 'ОРТАША', weak: 'ӘЛСІЗ' };
const LEVEL_COL = { strong: '#4C7A4E', mid: '#B8892B', weak: '#B0342B' };

export default function Progress({ onXpLoad, onTrainTopic }) {
  const { t, lang } = useLang();
  const [stats, setStats] = useState(null);
  const [week, setWeek] = useState([]);
  const [mocks, setMocks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [pro, setPro] = useState(false);
  const [xpInfo, setXpInfo] = useState({ xp: 0, studySecs: 0 });
  const [open, setOpen] = useState(null);   // раскрытый мок
  const [q, setQ] = useState(null);         // раскрытая задача в разборе

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    (async () => {
      const [att, mk, topicList, xp, hasPro] = await Promise.all([
        getAttempts(u.uid).catch(() => []),
        getMocks(u.uid).catch(() => []),
        api.topics(),
        getXpSummary(u.uid).catch(() => ({ xp: 0, studySecs: 0 })),
        isPro(u.uid).catch(() => false),
      ]);
      setTopics(topicList);
      setStats(topicStats(att, topicList));
      setWeek(weekHours(att));
      setMocks(mk);
      setXpInfo(xp);
      setPro(!!hasPro);
      onXpLoad?.(xp.xp || 0);
    })();
  }, []);

  // ── разбор одного мока ──
  if (open) return (
    <main>
      <button className="link" onClick={() => { setOpen(null); setQ(null); }}>← {t('ui.42')}</button>
      <h1 style={{ marginBottom: 4 }}>{open.school || 'Мок-тест'}</h1>
      <p className="kicker">{fmtDate(open.at)} · {open.score}/{open.gradable} балл{open.spentSec ? ` · ${fmtSpent(open.spentSec)}` : ''}</p>

      {open.review ? (
        <div className="list" style={{ marginTop: 16 }}>
          {open.review.map((r) => {
            const on = q === r.num;
            return (
              <div key={r.num} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                <div onClick={() => setQ(on ? null : r.num)}
                  style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '13px 18px', cursor: 'pointer' }}>
                  <span style={{ font: "600 13px 'IBM Plex Mono',monospace", color: r.correct ? LEVEL_COL.strong : LEVEL_COL.weak }}>
                    {r.correct ? '✓' : '✗'} №{r.num}
                  </span>
                  <span className="muted" style={{ fontSize: 13, flex: 1 }}>
                    сенің «{r.your ?? '—'}» · дұрыс «{r.answer ?? '?'}»
                  </span>
                  <span className="muted" style={{ fontSize: 13 }}>{on ? '▲' : '▼'}</span>
                </div>
                {on && (
                  <div style={{ padding: '0 18px 16px' }}>
                    {String(r.statement || '').split(/\n{2,}/).map((p, i) => (
                      <p className="stmt" key={i} style={{ fontSize: 14.5 }}>{p}</p>
                    ))}
                    {r.image && <img className="fig" src={r.image} alt="сурет" />}
                    {r.solution && <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55 }}>{r.solution}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : <p className="muted">{t('ui.41')}</p>}
    </main>
  );

  if (!stats) return <main><p className="muted">{t('common.loading')}</p></main>;

  const total = week.reduce((s, d) => s + d.hours, 0);
  const maxH = Math.max(1, ...week.map((d) => d.hours));
  const series = mockSeries(mocks);
  const diagMock = pickDiagnosticMock(mocks);
  const diagnosis = diagMock?.review?.length
    ? buildDiagnosis(diagMock.review, topics, lang)
    : null;

  const proUnlockHint = () => alert(t('diag.parentPro'));

  return (
    <main>
      <h1>{t('prog.title')}</h1>

      {diagnosis ? (
        <DiagnosisReport
          diagnosis={diagnosis}
          pro={pro}
          onUnlock={proUnlockHint}
          onTrainTopic={pro ? onTrainTopic : undefined}
          compact
        />
      ) : (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--accent)', background: '#FBF3E3' }}>
          <p className="kicker" style={{ color: 'var(--accent)', margin: '0 0 8px' }}>{t('diag.noData')}</p>
          <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{t('diag.noDataSub')}</p>
        </div>
      )}

      <div style={{ borderTop: '2px solid var(--ink)', margin: '22px 0' }} />

      <div className="hero-card" style={{ marginBottom: 16 }}>
        <p className="kicker" style={{ margin: 0 }}>{t('xp.title')}</p>
        <div style={{ font: "700 40px 'Lora',serif", color: 'var(--accent)', lineHeight: 1.1 }}>{xpInfo.xp || 0} XP</div>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
          {t('xp.level')} {xpLevel(xpInfo.xp)} · {Math.floor((xpInfo.studySecs || 0) / 3600)} {t('xp.hoursDone')}
        </p>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 12.5 }}>{t('xp.rules')}</p>
      </div>

      <div style={{ borderTop: '2px solid var(--ink)', margin: '14px 0 22px' }} />

      {/* Сағаттар — апта бойынша */}
      <div className="card">
        <div className="row" style={{ marginBottom: 18 }}>
          <span style={{ fontSize: 15 }}>{t('prog.hours')}</span>
          <b style={{ font: "700 16px 'IBM Plex Mono',monospace", color: 'var(--accent)' }}>{total.toFixed(1)} сағ</b>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
          {week.map((d) => (
            <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ font: "600 11px 'IBM Plex Mono',monospace", color: d.hours ? 'var(--accent)' : '#B7B0A2', marginBottom: 4 }}>
                {d.hours ? `${d.hours}с` : ''}
              </div>
              <div style={{
                height: `${(d.hours / maxH) * 78}px`, minHeight: d.hours ? 4 : 0,
                background: d.hours >= maxH * 0.6 ? 'var(--accent)' : '#D8D3C8',
              }} />
              <div style={{ font: "500 11px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 6 }}>{d.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Тақырыптар және деңгей */}
      <div className="list" style={{ marginTop: 16 }}>
        {stats.length ? stats.map((s) => (
          <div key={s.id} className="row-item" style={{ cursor: 'default' }}>
            <b style={{ flex: 1 }}>{s.name}</b>
            <div style={{ width: 150 }}>
              <div className="bar"><i style={{ width: s.pct + '%', background: LEVEL_COL[s.level] }} /></div>
            </div>
            <span style={{
              font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em',
              color: LEVEL_COL[s.level], border: `1px solid ${LEVEL_COL[s.level]}`,
              padding: '3px 9px', width: 82, textAlign: 'center',
            }}>{LEVEL_TXT[s.level]}</span>
          </div>
        )) : <div style={{ padding: 18 }}><p className="muted" style={{ margin: 0 }}>{t('prog.empty')}</p></div>}
      </div>

      {/* Мок-тест тарихы */}
      {!!series.length && (
        <>
          <p className="kicker" style={{ marginTop: 26 }}>{t('ui.43')}</p>
          <div className="list">
            {mocks.map((m, k) => (
              <div className="row-item" key={k} onClick={() => setOpen(m)}>
                <div style={{ flex: 1 }}>
                  <b>{m.school || 'Мок-тест'}</b>
                  <div style={{ font: "500 12px 'IBM Plex Mono',monospace", color: '#9A9384', marginTop: 3 }}>
                    {fmtDate(m.at)}{m.spentSec ? ` · ${fmtSpent(m.spentSec)}` : ''}
                  </div>
                </div>
                <span className="rt">{m.score}/{m.gradable} балл →</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function fmtDate(at) {
  const ms = at?.seconds ? at.seconds * 1000 : (at ? Date.parse(at) : NaN);
  if (!ms || Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleString('kk-KZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}
const fmtSpent = (s) => `${Math.floor(s / 60)} мин ${String(s % 60).padStart(2, '0')} сек`;
