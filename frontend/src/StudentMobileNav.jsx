import React from 'react';
import './StudentMobileNav.css';

export default function StudentMobileNav({ tab, lang, menuOpen, onPick, onMenu, Icon }) {
  const labels = lang === 'ru'
    ? { home: 'Главная', training: 'Практика', duel: 'Дуэли', progress: 'Прогресс', more: 'Ещё' }
    : { home: 'Басты', training: 'Жаттығу', duel: 'Дуэль', progress: 'Прогресс', more: 'Мәзір' };
  const active = menuOpen || !['home', 'training', 'duel', 'progress'].includes(tab) ? 'more' : tab;
  return <nav className="student-mobile-nav" aria-label={lang === 'ru' ? 'Быстрые разделы' : 'Жылдам бөлімдер'}>
    {Object.entries(labels).map(([id, title]) => <button key={id} type="button" className={active === id ? 'is-active' : ''}
      aria-current={id === tab && !menuOpen ? 'page' : undefined}
      aria-controls={id === 'more' ? 'student-navigation' : undefined}
      aria-expanded={id === 'more' ? menuOpen : undefined}
      onClick={id === 'more' ? onMenu : () => onPick(id)}>
      <span className="student-mobile-nav-icon"><Icon name={id} /></span><span>{title}</span>
    </button>)}
  </nav>;
}
