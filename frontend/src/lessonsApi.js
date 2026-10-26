import { auth } from './firebase.js';
import { authenticatedRequest } from './authenticatedRequest.js';
import { displayDate } from './displayDate.js';

// Все действия с уроками идут через сервер: ребёнок и родитель не пишут в базу напрямую.
export const lessonsCall = (body) => authenticatedRequest(auth, '/api/lessons', { body, authError: 'login_required', fallback: 'failed' });

const TZ = 'Asia/Almaty';
export const fmtDay = (ms, lang) => displayDate(ms, lang, { weekday: 'short', day: 'numeric', month: 'long', timeZone: TZ });
export const fmtTime = (ms) => new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(ms);
export const dayKey = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(ms);

export function lessonError(code, text) {
  const map = {
    slot_taken: text('Это время уже занято. Выберите другое.', 'Бұл уақыт бос емес. Басқасын таңдаңыз.'),
    slot_unavailable: text('Это время недоступно. Выберите другое.', 'Бұл уақыт қолжетімсіз. Басқасын таңдаңыз.'),
    no_credits: text('Уроки в этом месяце закончились.', 'Бұл айдағы сабақтар таусылды.'),
    mentor_plan_required: text('Нужен тариф Pro с наставником.', 'Тәлімгермен Pro тарифі қажет.'),
    cannot_cancel: text('Этот урок уже нельзя отменить.', 'Бұл сабақты енді болдырмау мүмкін емес.'),
    too_early: text('Ссылка откроется за 10 минут до начала.', 'Сілтеме басталуына 10 минут қалғанда ашылады.'),
    no_link: text('Ссылки пока нет. Напишите в поддержку.', 'Сілтеме әзірге жоқ. Қолдауға жазыңыз.'),
    cannot_rate: text('Оценить урок нельзя.', 'Сабақты бағалау мүмкін емес.'),
    topic_required: text('Выберите тему урока.', 'Сабақ тақырыбын таңдаңыз.'),
  };
  return map[code] || text('Не получилось. Повторите позже.', 'Болмады. Кейінірек қайталаңыз.');
}
