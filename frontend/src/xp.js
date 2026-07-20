// XP жүйесі — барлық ережелер бір жерде.
export const XP = {
  CORRECT: 5,           // дұрыс жауап (тренировка)
  HOUR: 100,            // әр толық сағат дайындық
  DUEL_CORRECT: 5,      // дуэльде дұрыс
  DUEL_SPEED: 3,        // раундта бірінші дұрыс жауап
  DUEL_WIN: 50,         // дуэльді жеңу
};

export const DUEL_SIZE = 15;
export const DUEL_ROUND_SEC = 35;

export function duelXpGain({ scores, speedWins, role, winner }) {
  if (!role) return 0;
  const correct = scores?.[role] || 0;
  const speed = speedWins?.[role] || 0;
  let total = correct * XP.DUEL_CORRECT + speed * XP.DUEL_SPEED;
  if (winner === role) total += XP.DUEL_WIN;
  return total;
}

export function xpLevel(xp) {
  return Math.floor((xp || 0) / 500) + 1;
}
