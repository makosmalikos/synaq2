// Рост питомца считается из XP — отдельно ничего не хранится.
export const PET_STAGES = [
  { stage: 1, min: 0, ru: 'Яйцо', kk: 'Жұмыртқа' },
  { stage: 2, min: 100, ru: 'Малыш', kk: 'Бөбек' },
  { stage: 3, min: 500, ru: 'Подросток', kk: 'Жасөспірім' },
  { stage: 4, min: 1500, ru: 'Взрослый', kk: 'Ересек' },
  { stage: 5, min: 4000, ru: 'Легенда', kk: 'Аңыз' },
];

export function petStage(xp = 0) {
  const value = Math.max(0, Number(xp) || 0);
  let index = 0;
  PET_STAGES.forEach((item, i) => { if (value >= item.min) index = i; });
  const current = PET_STAGES[index];
  const next = PET_STAGES[index + 1] || null;
  const progress = next ? Math.min(1, (value - current.min) / (next.min - current.min)) : 1;
  return { ...current, next, progress, xpToNext: next ? next.min - value : 0 };
}
