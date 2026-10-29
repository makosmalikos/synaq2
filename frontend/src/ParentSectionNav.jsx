import React, { useEffect, useRef, useState } from 'react';

export function openParentSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  window.dispatchEvent(new CustomEvent('synaq:parent-section', { detail: id }));
  if (section.tagName === 'DETAILS') section.open = true;
  const heading = section.querySelector('h1,h2,summary') || section;
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
  if (id === 'parent-overview') window.scrollTo({ top: 0, behavior: 'instant' });
  else section.scrollIntoView({ block: 'start', behavior: 'instant' });
}

export default function ParentSectionNav({ lang, hasChildren, hasLessons, hasCenters = false }) {
  const ru = lang === 'ru';
  const [active, setActive] = useState('parent-overview');
  const requested = useRef(null);
  const sections = [
    ['parent-overview', ru ? 'Обзор' : 'Шолу'],
    ...(hasCenters ? [['parent-center-overview', ru ? 'Мой центр' : 'Менің орталығым']] : []),
    ...(hasChildren && !hasCenters ? [['pdr-topics', ru ? 'Отчёт' : 'Есеп']] : []),
    ['parent-profile', ru ? 'Ребёнок' : 'Бала'],
    ...(hasChildren ? [['parent-rewards', ru ? 'Награды' : 'Сыйлықтар']] : []),
    ...(hasLessons ? [['parent-lessons', ru ? 'Уроки' : 'Сабақтар']] : []),
    ['parent-settings', ru ? 'Настройки' : 'Баптаулар'],
  ];
  useEffect(() => {
    if (!sections.some(([id]) => id === requested.current)) requested.current = null;
    const update = () => {
      // At the page bottom several sections can share the viewport. Keep an
      // explicit destination selected until the parent starts scrolling again.
      if (requested.current) return;
      let current = 'parent-overview';
      const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
      const boundary = atBottom ? Math.max(145, window.innerHeight * .6) : 145;
      for (const [id] of sections) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= boundary) current = id;
      }
      setActive(current);
    };
    const onOpen = event => {
      if (!sections.some(([id]) => id === event.detail)) return;
      requested.current = event.detail;
      setActive(event.detail);
    };
    const release = () => { requested.current = null; };
    const onKey = event => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) release();
    };
    const onPointer = event => {
      if (event.clientX >= document.documentElement.clientWidth) release();
    };
    const onResize = () => { release(); update(); };
    window.addEventListener('synaq:parent-section', onOpen);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('wheel', release, { passive: true });
    window.addEventListener('touchmove', release, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('resize', onResize);
    update();
    return () => {
      window.removeEventListener('synaq:parent-section', onOpen);
      window.removeEventListener('scroll', update);
      window.removeEventListener('wheel', release);
      window.removeEventListener('touchmove', release);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('resize', onResize);
    };
  }, [hasChildren, hasLessons, hasCenters]);
  const open = id => {
    openParentSection(id);
    setActive(id);
  };
  return <nav className="parent-section-nav" aria-label={ru ? 'Разделы кабинета родителя' : 'Ата-ана кабинетінің бөлімдері'}>{sections.map(([id, label]) => <button type="button" key={id} aria-current={active === id ? 'location' : undefined} onClick={() => open(id)}>{label}</button>)}</nav>;
}
