import React, { useEffect, useState } from 'react';

export function openParentSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  if (section.tagName === 'DETAILS') section.open = true;
  const heading = section.querySelector('h1,h2,summary') || section;
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
  if (id === 'parent-overview') window.scrollTo({ top: 0, behavior: 'instant' });
  else section.scrollIntoView({ block: 'start', behavior: 'instant' });
}

export default function ParentSectionNav({ lang, hasChildren, hasLessons }) {
  const ru = lang === 'ru';
  const [active, setActive] = useState('parent-overview');
  const sections = [
    ['parent-overview', ru ? 'Обзор' : 'Шолу'],
    ...(hasChildren ? [['pdr-topics', ru ? 'Отчёт' : 'Есеп']] : []),
    ['parent-profile', ru ? 'Ребёнок' : 'Бала'],
    ...(hasChildren ? [['parent-rewards', ru ? 'Награды' : 'Сыйлықтар']] : []),
    ...(hasLessons ? [['parent-lessons', ru ? 'Уроки' : 'Сабақтар']] : []),
    ['parent-settings', ru ? 'Настройки' : 'Баптаулар'],
  ];
  useEffect(() => {
    const update = () => {
      let current = 'parent-overview';
      const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
      const boundary = atBottom ? Math.max(145, window.innerHeight * .6) : 145;
      for (const [id] of sections) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= boundary) current = id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [hasChildren, hasLessons]);
  const open = id => {
    openParentSection(id);
    setActive(id);
  };
  return <nav className="parent-section-nav" aria-label={ru ? 'Разделы кабинета родителя' : 'Ата-ана кабинетінің бөлімдері'}>{sections.map(([id, label]) => <button type="button" key={id} aria-current={active === id ? 'location' : undefined} onClick={() => open(id)}>{label}</button>)}</nav>;
}
