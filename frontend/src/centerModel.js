const kazakhMonths = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
export function centerDate(at, lang) {
  const date = new Date(at);
  if (lang === 'ru') return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty',
  }).format(date);
  // Some browsers lack Kazakh month names and render ICU placeholders (M10).
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Almaty',
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${Number(parts.day)} ${kazakhMonths[Number(parts.month) - 1]}, ${parts.hour}:${parts.minute}`;
}
export const almatyInput = (at) => new Date(at + 5 * 3600000).toISOString().slice(0, 16);
export const almatyTime = (value) => Date.parse(`${value}:00+05:00`);
export const progressLabel = (status, lang) => ({
  completed: ['Выполнено', 'Орындалды'], late: ['С опозданием', 'Кешіктірілді'], overdue: ['Просрочено', 'Мерзімі өтті'],
  in_progress: ['В процессе', 'Орындалуда'], pending: ['Не начато', 'Басталмады'],
}[status] || ['Нет данных', 'Деректер жоқ'])[lang === 'ru' ? 0 : 1];

export function journalCsv(students, assignments) {
  const cell = (value) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [
    ['Ученик / Оқушы', ...assignments.map(a => a.title)],
    ...students.map(s => [s.name, ...assignments.map(a => {
      const p = s.progress[a.id];
      return `${p.answered}/${p.target}; ${p.accuracy == null ? '—' : p.accuracy + '%'}; ${p.status}${s.truncated ? '; неполные данные' : ''}`;
    })]),
  ].map(row => row.map(cell).join(';')).join('\r\n');
}
