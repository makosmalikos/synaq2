// Данные вшиты в приложение (data.js) — бэкенд не требуется.
import { topics, questions, variants } from './data.js';

const rfmsh = questions.filter(q => q.school === 'РФМШ');
const bilQ = questions.filter(q => q.school === 'БИЛ');
const poolFor = (school) => (school === 'БИЛ' ? bilQ : rfmsh);
const shuffle = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

const norm = (v) => (v ?? '').toString().trim().toLowerCase()
  .replace(/\s+/g, '').replace(',', '.').replace(/%$/, '')
  .replace(/(км|мм|см|м|мин|кг|г|л|тг|га|°)$/u, '');

const P = (x) => Promise.resolve(x);

export const api = {
  topics: (school) => P(
    topics.map(t => ({ ...t, count: poolFor(school).filter(q => q.topic === t.id).length })).filter(t => t.count > 0)
  ),
  topicQuestions: (id, mix = true, school) => {
    let items = poolFor(school).filter(q => q.topic === id);
    if (mix) items = shuffle(items);
    return P(items);
  },
  mixed: (limit = 15, school) => P(shuffle(poolFor(school)).slice(0, limit)),

  mockWeekly: (school) => {
    const list = variants.filter(v => (school === 'БИЛ' ? v.id.startsWith('bil') : v.id.startsWith('rfmsh')));
    if (!list.length) return P(null);
    const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
    const idx = ((week % list.length) + list.length) % list.length;
    const v = list[idx];
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
