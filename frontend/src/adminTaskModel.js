// One taxonomy and validator for the admin UI and the authenticated API.
export const ADMIN_TOPICS = [
  ['eq','math','Уравнения и упрощение','Теңдеулер және ықшамдау',['РФМШ','НИШ']],
  ['num','math','Числа и делимость','Сандар және бөлінгіштік',['РФМШ','НИШ']],
  ['work','math','Работа и производительность','Жұмыс және өнімділік',['РФМШ','НИШ']],
  ['ratio','math','Отношения и движение','Бөліктер, қатынастар, қозғалыс',['РФМШ','НИШ']],
  ['geo','math','Геометрия','Геометрия',['РФМШ','НИШ']],
  ['frac','math','Вычисления и дроби','Есептеулер және бөлшектер',['РФМШ','НИШ']],
  ['pct','math','Проценты','Пайыздар',['РФМШ','НИШ']],
  ['sys','math','Системы и неравенства','Теңдеулер жүйесі, теңсіздіктер',['РФМШ','НИШ','БИЛ']],
  ['kolzar','kolzar','Количественные сравнения','Сандық салыстыру',['НИШ']],
  ['science','science','Естествознание','Жаратылыстану',['НИШ']],
  ['reading','reading','Читательская грамотность','Оқу сауаттылығы',['БИЛ']],
  ['seq','logic','Последовательности','Фигуралар/сандар тізбегі',['РФМШ','НИШ','БИЛ']],
  ['mtx','logic','Матрицы и аналогии','Матрицалар және аналогиялар',['РФМШ','НИШ','БИЛ']],
  ['spat','logic','Пространственное мышление','Кеңістіктік ойлау',['РФМШ','НИШ','БИЛ']],
  ['comb','logic','Комбинаторика и логика','Сандық/комбинаторлық логика',['РФМШ','НИШ','БИЛ']],
  ['lang_kaz','kaz','Казахский язык','Қазақ тілі',['НИШ']],
  ['lang_rus','rus','Русский язык','Орыс тілі',['НИШ']],
  ['lang_eng','eng','Английский язык','Ағылшын тілі',['НИШ']],
].map(([id, subject, ru, kk, schools]) => ({ id, subject, ru, kk, schools }));
export const STATUSES = ['draft', 'reviewed', 'published'];
export const CSV_COLUMNS = ['school','topic','lang','difficulty','type','statement','option_a','option_b','option_c','option_d','option_e','option_f','option_g','option_h','answer','solution','sourceNote'];
export function normalizeTask(raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
  const topic = ADMIN_TOPICS.find((item) => item.id === raw.topic);
  const text = (value) => typeof value === 'string' ? value.trim() : '';
  return { school: text(raw.school), topic: text(raw.topic), subject: topic?.subject || '',
    lang: text(raw.lang) || ({ kaz:'kk', rus:'ru', eng:'en' }[topic?.subject] || (/[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/.test(raw.statement || '') ? 'kk' : 'ru')),
    difficulty: Number(raw.difficulty), type: text(raw.type), statement: text(raw.statement),
    options: raw.type === 'mcq' && Array.isArray(raw.options) ? raw.options.map(text) : null,
    answer: text(raw.answer), solution: text(raw.solution), sourceNote: text(raw.sourceNote),
    status: raw.status == null ? 'draft' : text(raw.status) };
}
export function validateTask(raw, complete = true) {
  const task = normalizeTask(raw), errors = [];
  const topic = ADMIN_TOPICS.find((item) => item.id === task.topic);
  if (!topic) errors.push('bad_topic');
  else if (!topic.schools.includes(task.school)) errors.push('bad_school');
  if (![1,2,3,4,5].includes(task.difficulty)) errors.push('bad_difficulty');
  if (!['ru','kk','en'].includes(task.lang) || ({ kaz:'kk', rus:'ru', eng:'en' }[task.subject] && task.lang !== { kaz:'kk', rus:'ru', eng:'en' }[task.subject])) errors.push('bad_lang');
  if (!STATUSES.includes(task.status)) errors.push('bad_status');
  if (!['open','mcq'].includes(task.type)) errors.push('bad_type');
  if (!task.statement || task.statement.length > 4000) errors.push('bad_statement');
  if (task.solution.length > 4000 || (complete && !task.solution)) errors.push('bad_solution');
  if (task.sourceNote.length > 500) errors.push('bad_source');
  if (task.answer.length > 1000 || (complete && !task.answer)) errors.push('bad_answer');
  if (task.type === 'mcq') {
    const options = task.options;
    if (!options || options.length < 2 || options.length > 8 || options.some((item) => !item || item.length > 1000)) errors.push('bad_options');
    else {
      if (new Set(options).size !== options.length) errors.push('dup_options');
      if ((complete || task.answer) && !options.includes(task.answer)) errors.push('answer_not_in_options');
    }
  }
  return [...new Set(errors)];
}
export const contentKey = (raw) => {
  const task = normalizeTask(raw);
  return [task.school, task.lang, task.statement.replace(/\s+/gu,' ').toLocaleLowerCase()].join('|');
};
export function parseCsv(text) {
  if (typeof text !== 'string' || text.length > 1000000) throw new Error('file_too_large');
  text = text.replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const separator = first.includes(';') ? ';' : first.includes('\t') ? '\t' : ',';
  const rows = [], row = []; let value = '', quoted = false, afterQuote = false;
  for (let i = 0; i <= text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char == null) throw new Error('csv_quotes');
      if (char === '"') { if (text[i + 1] === '"') { value += '"'; i++; } else { quoted = false; afterQuote = true; } }
      else value += char;
    } else if (char === '"') {
      if (value || afterQuote) throw new Error('csv_quotes');
      quoted = true;
    } else if (char === separator || char === '\n' || char === '\r' || char == null) {
      row.push(value); value = ''; afterQuote = false;
      if (char !== separator) {
        if (row.some((cell) => cell.trim())) rows.push([...row]);
        row.length = 0;
        if (char === '\r' && text[i+1] === '\n') i++;
      }
    } else {
      if (afterQuote && !/\s/.test(char)) throw new Error('csv_quotes');
      if (!afterQuote) value += char;
    }
  }
  const headers = rows.shift()?.map((cell) => cell.trim());
  if (!headers || ['school','topic','difficulty','type','statement','answer','solution'].some((key) => !headers.includes(key)) || new Set(headers).size !== headers.length || headers.some((key) => !CSV_COLUMNS.includes(key))) throw new Error('csv_headers');
  if (!rows.length || rows.length > 100) throw new Error('batch_size');
  const seen = new Set();
  return rows.map((cells, index) => {
    const raw = Object.fromEntries(headers.map((key, i) => [key, cells[i] || '']));
    raw.options = 'abcdefgh'.split('').map((key) => raw[`option_${key}`] || '').filter((item) => item.trim());
    const task = normalizeTask({ ...raw, status:'draft' });
    const key = contentKey(task), errors = validateTask(task, true);
    if (cells.length !== headers.length) errors.push('csv_columns');
    if (seen.has(key)) errors.push('duplicate_task');
    seen.add(key);
    return { row:index+2, task, errors };
  });
}
export function csvTemplate() {
  const example = ['БИЛ','seq','ru','2','mcq','Продолжите ряд: 3, 6, 9, …','10','11','12','13','','','','','12','Каждое следующее число на 3 больше предыдущего.','Авторское задание'];
  const escape = (value) => `"${value.replaceAll('"','""')}"`;
  return '\uFEFF' + [CSV_COLUMNS, example].map((row) => row.map(escape).join(';')).join('\r\n');
}
