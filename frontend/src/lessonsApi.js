import { auth } from './firebase.js';

// Все действия с уроками идут через сервер: ребёнок и родитель не пишут в базу напрямую.
export async function lessonsCall(body) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw Object.assign(new Error('login_required'), { status: 401 });
  const response = await fetch('/api/lessons', { method: 'POST', body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'failed'), { status: response.status });
  return data;
}

const TZ = 'Asia/Almaty';
export const fmtDay = (ms, lang) => new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'kk-KZ', { weekday: 'short', day: 'numeric', month: 'long', timeZone: TZ }).format(ms);
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
