// Нормализация и проверка ответов в открытом формате (как на РФМШ).
const UNITS = ['км', 'см', 'мм', 'дм', 'м', 'кг', 'г', 'л', 'мл', 'тг', 'га',
  'мин', 'сек', 'сағат', 'сағ', 'ч', 'сынып', '°', 'градус', 'шт', 'адам'];

export function normalize(raw) {
  if (raw == null) return '';
  let s = String(raw).trim().toLowerCase();
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/,/g, '.');
  s = s.replace(/%/g, '');
  s = s.replace(/\u2212/g, '-');
  for (const u of UNITS) {
    const re = new RegExp('\\s*' + u.replace('.', '\\.') + '\\.?$', 'i');
    s = s.replace(re, '');
  }
  s = s.replace(/\s+/g, ' ').trim();
  // склеить пробелы-разделители тысяч: "50 000" -> "50000", но не трогать перечисления "1 4 9"
  if (/^-?\d{1,3}( \d{3})+$/.test(s)) s = s.replace(/ /g, '');
  if (/^-?\d+\.\d+$/.test(s)) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

export function isCorrect(userAnswer, key) {
  if (key == null) return null;
  const u = normalize(userAnswer);
  if (!u) return false;
  const variants = String(key).split('|').map((k) => normalize(k));
  const asSet = (str) => str.split(/[\s;]+/).filter(Boolean).sort().join(' ');
  for (const v of variants) {
    if (u === v) return true;
    if (v.includes(' ') && asSet(u) === asSet(v)) return true;
    const a = parseFloat(u), b = parseFloat(v);
    if (!Number.isNaN(a) && !Number.isNaN(b) && Math.abs(a - b) < 1e-9) return true;
  }
  return false;
}
