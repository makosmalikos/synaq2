// Данные вшиты в приложение (data.js) — бэкенд не требуется.
import { topics, questions, variants, nishMath, bilQ } from './data.js';

const rfmsh = questions.filter(q => q.school === 'РФМШ');
const shuffle = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

const norm = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '').replace(',', '.').replace(/%$/, '')
  .replace(/(км|мм|см|м|мин|кг|г|л|тг|га|°)$/u, '');

const P = (x) => Promise.resolve(x);

export const api = {
  // РФМШ — по темам
  topics: () => P(
    topics.map(t => ({ ...t, count: rfmsh.filter(q => q.topic === t.id).length })).filter(t => t.count > 0)
  ),
  topicQuestions: (id, mix = true) => {
    let items = rfmsh.filter(q => q.topic === id);
    if (mix) items = shuffle(items);
    return P(items);
  },
  mixed: (limit = 15) => P(shuffle(rfmsh).slice(0, limit)),

  // НИШ — по предметам
  subjects: (school) => {
    if (school === 'БИЛ') return P([
      { id: 'math',   name: 'Математика',        count: bilQ.filter(q => q.subject === 'math').length },
      { id: 'kolzar', name: 'Сандық сипаттама',  count: bilQ.filter(q => q.subject === 'kolzar').length },
      { id: 'kaz',    name: 'Қазақ тілі',        count: bilQ.filter(q => q.subject === 'kaz').length },
    ]);
    if (school === 'НИШ') {
      const n = (s) => nishMath.filter(q => q.subject === s).length;
      return P([
        { id: 'math',   name: 'Математика',   count: n('math') },
        { id: 'kolzar', name: 'Колзар',        count: n('kolzar') },
        { id: 'eng',    name: 'Ағылшын тілі',  count: n('eng') },
        { id: 'rus',    name: 'Орыс тілі',     count: n('rus') },
        { id: 'kaz',    name: 'Қазақ тілі',    count: n('kaz') },
      ]);
    }
    return P(null); // РФМШ → темы
  },
  subjectQuestions: (subject, school) => {
    if (school === 'БИЛ') return P(shuffle(bilQ.filter(q => q.subject === subject)));
    if (school !== 'НИШ') return P([]);
    return P(shuffle(nishMath.filter(q => q.subject === subject)));
  },

  mockWeekly: () => {
    if (!variants.length) return P(null);
    const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
    const idx = ((week % variants.length) + variants.length) % variants.length;
    const v = variants[idx];
    return P({ id: v.id, week: idx + 1, title: `Осы аптаның сынағы · ${idx + 1}-нұсқа`, timeLimitMin: v.timeLimitMin, count: v.questions.length });
  },
  mockGet: (id) => {
    const v = variants.find(x => x.id === id);
    if (!v) return P(null);
    return P({ ...v, questions: v.questions.map(({ answer, solution, note, ...rest }) => rest) });
  },
  mockSubmit: (id, answers) => {
    const v = variants.find(x => x.id === id);
    if (!v) return P(null);
    let correct = 0, gradable = 0;
    const review = v.questions.map(q => {
      const has = q.answer != null; if (has) gradable++;
      const ua = norm(answers[q.num]);
      const ok = has && ua !== '' && ua === norm(q.answer);
      if (ok) correct++;
      return { num: q.num, topic: q.topic, your: answers[q.num] ?? null, answer: q.answer, correct: ok, note: q.note || null };
    });
    return P({ score: correct, gradable, total: v.questions.length, review });
  },
};
