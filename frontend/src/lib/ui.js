// Мелкие визуальные помощники (уровни владения темой — как в исходном макете).
export const lvlOf = (pct) => (pct >= 70 ? 'strong' : pct >= 52 ? 'medium' : 'weak');
export const lvlColor = (l) => (l === 'strong' ? 'var(--green)' : l === 'medium' ? 'var(--gold)' : 'var(--accent)');
export const lvlTint = (l) => (l === 'strong' ? 'var(--green-tint)' : l === 'medium' ? 'var(--gold-tint)' : 'var(--accent-tint)');
export const lvlTag = (l) => (l === 'strong' ? 'Мықты' : l === 'medium' ? 'Орташа' : 'Әлсіз');
export const fmtTime = (sec) => {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};
export const SCHOOLS = [
  { code: 'rfmsh', name: 'РФМШ', full: 'Республикалық физика-математика мектебі', grades: '5–7 сын.', ratio: '10+/орын', ready: true },
  { code: 'nish',  name: 'НИШ',  full: 'Назарбаев Зияткерлік мектептері',         grades: '7 сын.',   ratio: '8/орын',   ready: false },
  { code: 'bil',   name: 'БИЛ',  full: 'Білім-Инновация лицейлері',               grades: '6–7 сын.', ratio: '6/орын',   ready: false },
];
