const BIL_FORMAT = 'bil-mcq-reading-2026-v1';
const NIS_FORMAT = 'nis-sections-2026-v1';
// Additional distractors are editorial choices for the adapted four-choice edition.
// They do not change the source key or pretend to be the original official wording.
const extra = {
  rus_05: 'Телепередача всегда помогает точнее замечать насыщение.',
  rus_10: 'Объяснить устройство современных водопроводных труб.',
  eng_46: 'How to book an overseas holiday.',
  eng_47: 'It compares the price of different nuts.',
  eng_48: 'To warn that email is always dangerous.',
  eng_49: 'A library card.',
  eng_50: 'Internet use has completely stopped.',
  eng_51: 'None of the three parts.',
  eng_52: 'All traffic has been banned.',
  eng_54: 'He plans to replace workshops with car racing.',
  eng_55: 'To explain how to buy a stadium ticket.',
  eng_56: 'Its ability to live without water.',
  eng_57: 'As a result of this discovery.',
  eng_58: 'To advertise dogs for sale.',
  eng_59: 'None of the three parts.',
  eng_60: 'How to Train a Guard Dog.',
};
const clean = value => String(value).replace(/^[A-EА-Е]\)\s*/u, '').trim();
function examChoice(q) {
  if (q.subject === 'kolzar') {
    const options = ['А', 'В', 'Тең', 'Анықтау мүмкін емес'];
    return options.includes(String(q.answer).trim()) ? {...q, options, answer:String(q.answer).trim()} : null;
  }
  if (!Array.isArray(q.options)) return null;
  // Lettered figure choices refer to individual assets; never relabel or drop them.
  const letterFigure = q.image && (/bil_v1_q14\.(png|svg)/.test(q.image) || /\/figures\/opts\//.test(q.image))
    && q.options.every(o => /^[A-EА-Е]$/.test(clean(o)));
  if (letterFigure && q.options.length !== 4) return null;
  const answer = clean(q.answer), choices = q.options.map(clean);
  const added = extra[q.id.replace('nis_official_language_2024_', '')];
  if (choices.length === 3 && added) choices.push(added);
  if (choices.length < 4 || !choices.includes(answer)) return null;
  const options = choices.slice(0,4);
  if (!options.includes(answer)) options[3] = answer;
  if (new Set(options).size !== 4) return null;
  return {...q,answer,options};
}
function examEligible(q, school, subject) {
  if (school === 'БИЛ' && subject === 'reading' && !/^bil_official_2025_reading_/.test(q.id)) return false;
  if (school === 'НИШ' && ['rus','kaz','eng'].includes(subject)
    && !q.id.startsWith(`nis_official_language_2024_${subject}_`)) return false;
  return !!examChoice(q);
}
module.exports = { BIL_FORMAT, NIS_FORMAT, examChoice, examEligible };
