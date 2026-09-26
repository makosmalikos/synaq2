// Нормализация ответа: пробелы, запятая/точка, %. Единицы измерения здесь
// НЕ срезаются — см. splitUnit ниже, их нужно сверять, а не просто выбрасывать.
export const norm = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '').replace(',', '.').replace(/%$/, '');

const UNIT_RE = /(км|мм|см|м|мин|кг|г|л|тг|га|°)$/u;
// Отделяет единицу измерения с конца уже нормализованной строки.
const splitUnit = (v) => {
  const m = v.match(UNIT_RE);
  return m ? { base: v.slice(0, -m[0].length), unit: m[0] } : { base: v, unit: null };
};

// "12.5" и "12.50" — одно и то же число, но как строки не равны; для похожих
// на десятичную дробь значений сравниваем численно, а не посимвольно.
const NUM_RE = /^-?\d+(\.\d+)?$/;
const numsEqual = (a, b) => NUM_RE.test(a) && NUM_RE.test(b) && parseFloat(a) === parseFloat(b);

// Ответ-заглушка ('—' или '-') — вопрос показываем (в отличие от answer:null,
// который вообще уходит в карантин в bank.js), но автопроверкой не считаем.
// Раньше это условие было продублировано в трёх местах (isCorrect,
// topicQuestions, mockSubmit) и с разными наборами заглушек ('—' проверялся
// везде, а обычный дефис '-' — только здесь), так что вопрос с "-" мог
// попасть в подборку и всегда засчитываться как ошибка без явного повода.
const UNGRADABLE = new Set(['—', '-']);
export const isGradable = (q) => q?.answer != null
  && String(q.answer).trim() !== ''
  && !UNGRADABLE.has(String(q.answer).trim());

// Проверка ответа. Для теста с вариантами — точное совпадение опции.
export function isCorrect(given, q) {
  if (!isGradable(q)) return false;
  const ans = String(q.answer).trim();
  if (q.options) return String(given).trim() === ans;
  const a0 = norm(given);
  if (a0 === '') return false;
  const a = splitUnit(a0);
  const b = splitUnit(norm(q.answer));
  // Единицы указаны с обеих сторон и они разные ("100см" против "100км") —
  // это разные величины, даже если число совпадает. Раньше unit просто
  // срезался с обеих строк без сверки, и такой ответ засчитывался верным.
  if (a.unit && b.unit && a.unit !== b.unit) return false;
  return a.base === b.base || numsEqual(a.base, b.base);
}
