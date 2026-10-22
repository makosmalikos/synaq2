export const TRAINING_SUBJECTS = [
  { id: 'math', ru: 'Математика', kk: 'Математика' },
  { id: 'logic', ru: 'Логика', kk: 'Логика' },
  { id: 'science', ru: 'Естествознание', kk: 'Жаратылыстану' },
  { id: 'language', ru: 'Языки и чтение', kk: 'Тілдер және оқу' },
  { id: 'other', ru: 'Другие темы', kk: 'Басқа тақырыптар' },
];

const RU_TOPIC_NAMES = { kolzar: 'Сравнение величин', reading: 'Грамотность чтения', lang_kaz: 'Казахский язык', lang_rus: 'Русский язык', lang_eng: 'Английский язык' };
export function trainingTopicName(topic, lang) {
  return lang === 'ru' ? topic.nameRu || RU_TOPIC_NAMES[topic.id] || topic.name : topic.name;
}

export function trainingSubject(topic) {
  if (['math', 'logic', 'science'].includes(topic.block)) return topic.block;
  if (topic.block === 'reading' || String(topic.block).startsWith('lang_')
    || String(topic.id).startsWith('lang_')) return 'language';
  return 'other';
}

export function trainingTopicCount(topic) {
  const count = topic.gradableCount ?? topic.count;
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

export function trainingCatalog(topics, { subject = 'all', query = '' } = {}) {
  const search = String(query).trim().toLocaleLowerCase();
  return TRAINING_SUBJECTS.map(group => ({ ...group, topics: topics.filter(topic =>
    trainingTopicCount(topic) > 0 && trainingSubject(topic) === group.id
    && (subject === 'all' || subject === group.id)
    && (!search || [topic.name, trainingTopicName(topic, 'ru'), ...(topic.schools || [])].join(' ').toLocaleLowerCase().includes(search)))
  })).filter(group => group.topics.length);
}
