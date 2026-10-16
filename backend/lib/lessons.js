// Общая логика уроков с наставником: время (Алматы, UTC+5), слоты, статусы.
const LESSON_MS = 40 * 60000;
const MIN_AHEAD_MS = 12 * 3600000;       // записаться можно не позже чем за 12 часов
const FREE_CANCEL_MS = 24 * 3600000;     // бесплатная отмена — не позже чем за 24 часа
const MAX_AHEAD_MS = 21 * 86400000;      // не дальше 3 недель вперёд
const JOIN_BEFORE_MS = 10 * 60000;       // ссылка открывается за 10 минут
const JOIN_AFTER_MS = 10 * 60000;
const COUNTED = new Set(['booked', 'completed', 'no_show_child', 'cancelled_late']); // тратят урок из пакета
const PAID = new Set(['completed', 'no_show_child']);                                // оплачиваются наставнику

function almaty(ms) {
  const shifted = new Date(ms + 5 * 3600000);
  return { date: shifted.toISOString().slice(0, 10), day: shifted.getUTCDay() || 7, time: shifted.toISOString().slice(11, 16) };
}
// Состояние, которое видят все: прошедший непомеченный урок считается проведённым.
function effectiveStatus(lesson, now) {
  return lesson.status === 'booked' && Number(lesson.endAt) < now ? 'completed' : lesson.status;
}
// Свободные начала уроков наставника в окне записи.
function slotStarts(slots, now, periodEnd) {
  const out = [];
  for (let i = 0; i <= 22; i += 1) {
    const { date, day } = almaty(now + i * 86400000);
    for (const slot of slots || []) {
      if (slot.day !== day) continue;
      const startAt = Date.parse(`${date}T${slot.time}:00+05:00`);
      if (startAt >= now + MIN_AHEAD_MS && startAt <= now + MAX_AHEAD_MS && startAt < periodEnd) out.push(startAt);
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}
const isSlot = (slots, startAt, now, periodEnd) => slotStarts(slots, now, periodEnd).includes(startAt);

module.exports = { LESSON_MS, MIN_AHEAD_MS, FREE_CANCEL_MS, MAX_AHEAD_MS, JOIN_BEFORE_MS, JOIN_AFTER_MS, COUNTED, PAID,
  almaty, effectiveStatus, slotStarts, isSlot };
