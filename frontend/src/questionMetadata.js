// Shared, bank-free question normalization and quarantine rules.
const KK_LETTERS = /[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/;
const SUBJ_LANG = { kaz: 'kk', rus: 'ru', eng: 'en' };
const TOPIC_LANG = { lang_kaz: 'kk', lang_rus: 'ru', lang_eng: 'en' };
export function detectLang(q) {
  return SUBJ_LANG[q.subject] || TOPIC_LANG[q.topic] || (KK_LETTERS.test(q.statement || '') ? 'kk' : 'ru');
}

const MISSING_FIGURES = new Set([
  '/figures/logic66.png',
  '/figures/logic67.png',
  '/figures/logic68.png',
  '/figures/logic69.png',
  '/figures/logic70.png',
  '/figures/a2_img1.png',
  '/figures/a2_img2.png',
  '/figures/a2_img3.png',
  '/figures/a2_img4.png',
  '/figures/a2_img5.png',
  '/figures/a2_img6.png',
  '/figures/a2_img7.png',
  '/figures/a2_img8.png',
  '/figures/a2_img9.png',
  '/figures/a2_img10.png',
  '/figures/a2_img11.png',
  '/figures/a2_img13.png',
]);

export function quarantineReason(q) {
  if (!q.id || !String(q.id).trim()) return 'missing_id';
  if (!q.statement || !String(q.statement).trim()) return 'missing_statement';
  if (q.answer == null || !String(q.answer).trim()) return 'missing_answer';
  if (q.options != null && (!Array.isArray(q.options) || q.options.length < 2)) return 'insufficient_options';
  if (Array.isArray(q.options) && !q.options.map(String).includes(String(q.answer))) return 'answer_not_in_options';
  if (q.image && MISSING_FIGURES.has(q.image)) return 'missing_image';
  return null;
}

export function normalizeAdminTask(raw) {
  return {
    id: raw.id,
    school: raw.school || null,
    subject: raw.subject || ({ lang_kaz: 'kaz', lang_rus: 'rus', lang_eng: 'eng', kolzar: 'kolzar', mtx: 'logic', seq: 'logic', spat: 'logic', comb: 'logic' }[raw.topic] || 'math'),
    topic: raw.topic || null,
    difficulty: raw.difficulty ?? null,
    statement: raw.statement || '',
    answer: raw.answer ?? null,
    solution: raw.solution || '',
    image: raw.image || null,
    options: Array.isArray(raw.options) ? raw.options : null,
    lang: detectLang({ topic: raw.topic, statement: raw.statement }),
  };
}

export function partitionAdminTasks(tasks, existingIds) {
  const seenIds = new Set(existingIds);
  const active = [], quarantined = [];
  for (const raw of tasks) {
    const q = normalizeAdminTask(raw);
    const reason = seenIds.has(q.id) ? 'duplicate_id' : quarantineReason(q);
    if (reason) { quarantined.push({ ...q, quarantineReason: reason }); continue; }
    seenIds.add(q.id);
    active.push(q);
  }
  return { active, quarantined };
}
