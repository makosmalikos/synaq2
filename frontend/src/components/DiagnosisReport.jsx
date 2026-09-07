import React from 'react';
import { useLang } from '../i18n.jsx';

const LEVEL_COL = { strong: '#4C7A4E', mid: '#B8892B', weak: '#B0342B' };
const LEVEL_TXT = { strong: 'МЫҚТЫ', mid: 'ОРТАША', weak: 'ӘЛСІЗ' };

function TopicCard({ topic, t }) {
  return (
    <article className={`diagnosis-topic-card diagnosis-topic-${topic.level}`}>
      <div className="diagnosis-topic-head">
        <b>{topic.name}</b>
        <span>{topic.pct}%</span>
      </div>
      <p className="diagnosis-topic-explanation">
        {topic.explanation}
      </p>
      <p className="diagnosis-topic-meta">
        {topic.correct}/{topic.graded} {t('diag.correct')} · {topic.wrong} {t('diag.wrong')}
      </p>
    </article>
  );
}

export default function DiagnosisReport({ diagnosis, pro, onUnlock, onTrainTopic, compact = false }) {
  const { t, lang } = useLang();
  if (!diagnosis) return null;

  const { weakest2, topics, weak, strong, errors, plan, readiness } = diagnosis;
  const locked = !pro;

  return (
    <section className="diag-wrap" style={{ marginTop: compact ? 0 : 18 }}>
      <p className="kicker">{t('diag.title')}</p>
      {!compact && (
        <p className="muted" style={{ fontSize: 14, margin: '0 0 14px', lineHeight: 1.55 }}>
          {t('diag.sub')}
        </p>
      )}

      <div className="diagnosis-readiness">
        <div className="diagnosis-readiness-copy">
          <span>{t('diag.readiness')}</span>
          <strong>{readiness}%</strong>
        </div>
        <div className="diagnosis-readiness-track"><i style={{ width: `${readiness}%` }} /></div>
      </div>

      <p className="kicker" style={{ marginTop: 16 }}>{t('diag.weakest')}</p>
      {weakest2.map((tp) => <TopicCard key={tp.id} topic={tp} t={t} />)}

      <div className={'diag-locked' + (locked ? ' is-locked' : '')}>
        {locked && (
          <div className="diag-lock-overlay">
            <p style={{ margin: '0 0 12px', font: "600 16px 'Golos Text'" }}>{t('diag.lockedTitle')}</p>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13.5, lineHeight: 1.5 }}>{t('diag.lockedSub')}</p>
            <button type="button" className="btn accent" onClick={onUnlock}>{t('diag.unlock')}</button>
          </div>
        )}

        <div className="diag-lock-content">
          {!!weak.length && (
            <>
              <p className="kicker">{t('diag.allWeak')}</p>
              {weak.map((tp) => <TopicCard key={tp.id} topic={tp} t={t} />)}
            </>
          )}

          {!!strong.length && (
            <>
              <p className="kicker" style={{ marginTop: 16 }}>{t('diag.strong')}</p>
              {strong.map((tp) => <TopicCard key={tp.id} topic={tp} t={t} />)}
            </>
          )}

          {!!topics.length && topics.length > 2 && (
            <>
              <p className="kicker" style={{ marginTop: 16 }}>{t('diag.allTopics')}</p>
              <div className="list">
                {topics.map((tp) => (
                  <div key={tp.id} className="row-item" style={{ cursor: 'default' }}>
                    <b style={{ flex: 1 }}>{tp.name}</b>
                    <span className="diagnosis-level" style={{ color: LEVEL_COL[tp.level] }}>
                      {tp.pct}% · {LEVEL_TXT[tp.level]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!!errors.length && (
            <>
              <p className="kicker" style={{ marginTop: 16 }}>{t('diag.errors')}</p>
              <div className="list">
                {errors.slice(0, 12).map((e) => (
                  <div key={`${e.topicId}-${e.num}`} className="row-item" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                    <span className="diagnosis-error-title">
                      №{e.num} · {e.topicName}
                    </span>
                    <span className="muted" style={{ fontSize: 13 }}>
                      {t('diag.yourAnswer')}: «{e.your ?? '—'}» → {t('diag.rightAnswer')}: «{e.answer ?? '?'}»
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!!plan.length && (
            <>
              <p className="kicker" style={{ marginTop: 16 }}>{t('diag.plan')}</p>
              <div className="card" style={{ background: '#FBF3E3', borderColor: 'var(--mid,#B8892B)' }}>
                <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 14.5 }}>
                  {plan.map((p) => (
                    <li key={p.topicId} style={{ marginBottom: 8 }}>
                      {p.line}
                      {onTrainTopic && (
                        <button
                          type="button"
                          className="link"
                          style={{ display: 'block', marginTop: 4, padding: 0 }}
                          onClick={() => onTrainTopic(p.topicId)}
                        >
                          {t('diag.practice')} →
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}

          {!!plan.length && pro && (
            <>
              <p className="kicker" style={{ marginTop: 16 }}>{t('diag.tasks')}</p>
              {plan.map((p) => (
                <div key={p.topicId} className="card" style={{ marginBottom: 8 }}>
                  <b>{p.topicName}</b>
                  <p className="muted" style={{ margin: '6px 0 10px', fontSize: 13 }}>
                    {lang === 'ru'
                      ? `В банке ${p.taskCount}+ задач по этой теме.`
                      : `Банкте ${p.taskCount}+ есеп бар.`}
                  </p>
                  {onTrainTopic && (
                    <button type="button" className="btn ghost" onClick={() => onTrainTopic(p.topicId)}>
                      {t('diag.startPractice')}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
