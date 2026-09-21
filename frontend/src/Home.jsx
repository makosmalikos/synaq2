import React from 'react';
import { useLang } from './i18n.jsx';
import { xpLevel } from './xp.js';
import { topicName } from './diagnosticData.js';

const DashboardIcon = ({ type }) => {
  if (type === 'duel') return <span aria-hidden="true">⚔</span>;
  if (type === 'mock') return <span aria-hidden="true">✓</span>;
  return <span aria-hidden="true">↗</span>;
};

export default function Home({ go, name, xp = 0, diagnosticPlan, onTrainTopic }) {
  const { t, lang } = useLang();
  const lvl = xpLevel(xp);
  const levelXp = xp % 500;
  const levelProgress = Math.min(100, Math.round((levelXp / 500) * 100));
  const xpLeft = levelXp === 0 && xp > 0 ? 500 : 500 - levelXp;
  const rankedTopics = diagnosticPlan?.topics
    ? [...diagnosticPlan.topics].sort((a, b) => a.pct - b.pct)
    : [];
  const belowTarget = rankedTopics.filter((item) => item.pct < 70);
  const weakTopics = (belowTarget.length ? belowTarget : rankedTopics).slice(0, 3);
  const planCopy = lang === 'ru' ? {
    kicker: 'ПО РЕЗУЛЬТАТАМ ДИАГНОСТИКИ', title: 'Ваш план на 7 дней',
    score: 'готовность', intro: 'Начните со слабых тем — маршрут уже собран.',
    tasks: 'задач', start: 'Начать практику', repeat: 'Повторить диагностику на 7-й день',
  } : {
    kicker: 'ДИАГНОСТИКА НӘТИЖЕСІ БОЙЫНША', title: '7 күндік жеке жоспарың',
    score: 'дайындық', intro: 'Әлсіз тақырыптардан баста — бағытың дайын.',
    tasks: 'есеп', start: 'Жаттығуды бастау', repeat: '7-күні диагностиканы қайталау',
  };
  const diagnosticTarget = diagnosticPlan?.target === 'general'
    ? (lang === 'ru' ? 'Общая математика' : 'Жалпы математика')
    : diagnosticPlan?.target;

  return (
    <main className="home-dashboard">
      <div className="home-heading">
        <div>
          <p className="home-kicker">{t('ui.46')}</p>
          <h1>{t('home.hi')}, {name}!</h1>
          <p>{t('home.today')}</p>
        </div>
      </div>

      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-hero-label">{t('home.plan')}</span>
          <h2>{t('ui.47')}</h2>
          <p>{t('ui.48')}</p>
          <button className="home-primary" onClick={() => go('training')}>
            <span className="home-play">▶</span>{t('ui.5')}
          </button>
        </div>
        <div className="home-hero-visual" aria-hidden="true">
          <div className="home-hero-ring" />
          <div className="home-float home-float-a">+5 XP</div>
          <div className="home-float home-float-b">{levelProgress}%</div>
          <img src="/hero/students/cutout-2.png" alt="" />
        </div>
      </section>

      <section className="home-stats" aria-label={t('home.stats')}>
        <div className="home-stat home-stat-xp">
          <div className="home-stat-icon">★</div>
          <div><span>{t('xp.title')}</span><strong>{xp} XP</strong></div>
        </div>
        <div className="home-stat home-stat-level">
          <div className="home-stat-icon">◆</div>
          <div><span>{t('xp.level')}</span><strong>{lvl}</strong></div>
        </div>
        <div className="home-stat home-stat-progress">
          <div className="home-stat-top"><span>{t('home.toNext')}</span><strong>{xpLeft} XP</strong></div>
          <div className="home-stat-bar"><i style={{ width: `${levelProgress}%` }} /></div>
          <small>{levelProgress}% · {t('home.xpProgress')}</small>
        </div>
      </section>

      {!!diagnosticPlan && (
        <section className="home-diagnostic-plan">
          <div className="home-plan-head">
            <div>
              <span>{planCopy.kicker}</span>
              <h2>{planCopy.title}</h2>
              <p>{planCopy.intro}</p>
            </div>
            <div className="home-plan-score"><strong>{diagnosticPlan.readiness}%</strong><span>{planCopy.score}</span></div>
          </div>
          <div className="home-plan-days">
            {weakTopics.map((item, index) => (
              <button key={item.id} type="button" onClick={() => onTrainTopic?.(item.trainingTopicId)}>
                <span className="home-plan-day">{lang === 'ru' ? 'День' : 'Күн'} {index * 2 + 1}</span>
                <strong>{topicName(item.id, lang)}</strong>
                <small>{item.pct}% · {5 + index * 2} {planCopy.tasks}</small>
                <em>{planCopy.start} →</em>
              </button>
            ))}
            <button type="button" className="home-plan-repeat" onClick={() => { window.history.pushState({}, '', '/diagnostic'); window.location.reload(); }}>
              <span className="home-plan-day">{lang === 'ru' ? 'День 7' : '7-күн'}</span>
              <strong>{planCopy.repeat}</strong>
              <small>{diagnosticPlan.grade} {lang === 'ru' ? 'класс' : 'сынып'} · {diagnosticTarget}</small>
              <em>↻</em>
            </button>
          </div>
        </section>
      )}

      <div className="home-section-head">
        <div>
          <span>{t('home.quick')}</span>
          <h2>{t('home.choose')}</h2>
        </div>
      </div>

      <section className="home-actions">
        <button className="home-action home-action-duel" onClick={() => go('duel')}>
          <span className="home-action-icon"><DashboardIcon type="duel" /></span>
          <span className="home-action-copy"><small>{t('ui.56')}</small><strong>{t('duel.title')}</strong><em>{t('home.duelText')}</em></span>
          <span className="home-action-arrow">→</span>
        </button>
        <button className="home-action home-action-mock" onClick={() => go('mock')}>
          <span className="home-action-icon"><DashboardIcon type="mock" /></span>
          <span className="home-action-copy"><small>{t('ui.49')}</small><strong>{t('ui.50')}</strong><em>{t('home.mockText')}</em></span>
          <span className="home-action-arrow">→</span>
        </button>
        <button className="home-action home-action-progress" onClick={() => go('progress')}>
          <span className="home-action-icon"><DashboardIcon type="progress" /></span>
          <span className="home-action-copy"><small>{t('nav.progress')}</small><strong>{t('home.progressTitle')}</strong><em>{t('home.progressText')}</em></span>
          <span className="home-action-arrow">→</span>
        </button>
      </section>
    </main>
  );
}
