const MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
const SHORT_MONTHS = ['қаң.', 'ақп.', 'нау.', 'сәу.', 'мам.', 'мау.', 'шіл.', 'там.', 'қыр.', 'қаз.', 'қар.', 'жел.'];
const WEEKDAYS = { Mon: ['дс', 'дүйсенбі'], Tue: ['сс', 'сейсенбі'], Wed: ['ср', 'сәрсенбі'], Thu: ['бс', 'бейсенбі'], Fri: ['жм', 'жұма'], Sat: ['сб', 'сенбі'], Sun: ['жс', 'жексенбі'] };

// Some browsers have incomplete kk-KZ date data and render months as “M10”.
// Numeric date parts retain timezone handling; visible Kazakh labels are ours.
export function displayDate(value, lang = 'kk', options = { day: 'numeric', month: 'short' }) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  const timeZone = options.timeZone || 'Asia/Almaty';
  if (lang === 'ru') return new Intl.DateTimeFormat('ru-RU', { ...options, timeZone }).format(date);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone, day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short',
  }).formatToParts(date).map(part => [part.type, part.value]));
  const numericMonth = ['numeric', '2-digit'].includes(options.month);
  const dateParts = [];
  if (options.day) dateParts.push(options.day === '2-digit' ? parts.day : String(Number(parts.day)));
  if (options.month) dateParts.push(numericMonth ? (options.month === '2-digit' ? parts.month : String(Number(parts.month))) : (options.month === 'long' ? MONTHS : SHORT_MONTHS)[Number(parts.month) - 1]);
  if (options.year) dateParts.push(options.year === '2-digit' ? parts.year.slice(-2) : parts.year);
  let label = dateParts.join(numericMonth ? '.' : ' ');
  if (options.weekday) label = `${WEEKDAYS[parts.weekday]?.[options.weekday === 'long' ? 1 : 0] || ''}${label ? `, ${label}` : ''}`;
  if (options.hour) {
    const clock = new Intl.DateTimeFormat('ru-RU', { timeZone, hour: options.hour, minute: options.minute, second: options.second, hourCycle: 'h23' }).format(date);
    label += `${label ? ', ' : ''}${clock}`;
  }
  return label;
}
