import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { POOL } from '../frontend/src/bank.js';
const { publicQuestionAllowed } = createRequire(import.meta.url)('../backend/lib/question-access');

const root = fileURLToPath(new URL('../frontend/public/', import.meta.url));
const byId = new Map(POOL.map((question) => [question.id, question]));
const sequence = (prefix, start, end) => Array.from(
  { length: end - start + 1 },
  (_, index) => `${prefix}${String(start + index).padStart(2, '0')}`,
);
const archive = (numbers) => numbers.map((number) => `bil_archive_m_${String(number).padStart(4, '0')}`);

// Fixed, reviewed selections. Bank insertion order must never change a public mock.
const specs = {
  'РФМШ': {
    minutes: 120,
    subjects: [[null, 1, [
      ...sequence('synaq_fit_rf_', 1, 8),
      ...sequence('synaq_fit2_rf_', 1, 12),
      ...[2, 3, 4, 6, 7, 9, 10, 12, 14, 17].map((number) => `v1_${number}`),
    ]]],
  },
  'НИШ': {
    minutes: 240,
    subjects: [
      ['math', 1, [
        ...sequence('synaq_fit_nis_', 1, 4),
        ...sequence('synaq_fit2_nis_', 1, 4),
        ...sequence('lg', 55, 65),
        ...[2, 3, 5, 6, 7].map((number) => `bk_${number}`),
        ...Array.from({ length: 10 }, (_, index) => `a2m${index + 1}`),
        ...[12, 13, 14, 16, 21, 22].map((number) => `a2m${number}`),
      ]],
      ['kolzar', 1, [
        ...Array.from({ length: 36 }, (_, index) => `kz${index + 1}`),
        ...sequence('synaq_fit_nis_', 5, 8),
        ...sequence('synaq_fit2_nis_', 5, 8),
        ...[1, 2, 4, 5, 6, 7, 8, 9, 13, 16, 19, 20, 21, 22, 23, 24].map((number) => `kzx${number}`),
      ]],
      ['science', 1, null, 20],
      ['rus', 2, null, 20],
      ['kaz', 2, Array.from({ length: 20 }, (_, index) => `nis_official_language_2024_kaz_${index + 21}`)],
      ['eng', 2, null, 20],
    ],
  },
  'БИЛ': {
    minutes: 110,
    subjects: [
      ['math', 1, [
        ...sequence('synaq_fit_bil_', 1, 4),
        ...sequence('synaq_fit2_bil_', 1, 4),
        ...archive([1, 2, 96, 99, 100]),
        ...sequence('bil_t1_', 1, 23).filter((id) => !['bil_t1_09', 'bil_t1_22'].includes(id)),
        ...[1, 3, 6, 11, 14, 19].map((number) => `bil_t2_${String(number).padStart(2, '0')}`),
      ]],
      ['logic', 1, [
        ...sequence('synaq_fit_bil_', 5, 8),
        ...sequence('synaq_fit2_bil_', 5, 8),
        'bil_logic_synaq_10',
        'bil_logic_synaq_18',
      ]],
      ['reading', 1, null, 10],
    ],
  },
};

const valid = (question) => publicQuestionAllowed(question) && !question?.practiceOnly && question?.id && question?.statement
  && question.answer != null && !['', '-', '—'].includes(String(question.answer).trim())
  && (!question.options || (Array.isArray(question.options)
    && question.options.map(String).includes(String(question.answer))));
const cleanOption = (value) => String(value).replace(/^[A-EА-Е]\)\s*/u, '').trim();
const comparisonOptions = [
  'Колонка А больше',
  'Колонка В больше',
  'Равны',
  'Недостаточно информации',
];

function normalize(question, school, subject, section) {
  let options = null;
  let answer = String(question.answer);
  if (school === 'РФМШ') {
    if (question.options?.length || !/^-?\d+$/.test(answer.trim())) {
      throw new Error(`РФМШ: expected an integer free response in ${question.id}`);
    }
  } else if (subject === 'kolzar') {
    const answers = { 'А': 0, 'В': 1, 'Тең': 2, 'Анықтау мүмкін емес': 3 };
    const index = answers[answer.trim()];
    if (index === undefined) throw new Error(`НИШ: invalid comparison answer in ${question.id}: ${answer}`);
    options = comparisonOptions;
    answer = options[index];
  } else {
    if (!Array.isArray(question.options) || question.options.length < 4) {
      throw new Error(`${school}: expected four choices in ${question.id}`);
    }
    const originalAnswer = cleanOption(answer);
    let choices = question.options.map(cleanOption);
    if (!choices.includes(originalAnswer)) throw new Error(`Answer absent in ${question.id}`);
    if (choices.length > 4) {
      choices = choices.slice(0, 4);
      if (!choices.includes(originalAnswer)) choices[3] = originalAnswer;
    }
    if (choices.length !== 4 || new Set(choices).size !== 4) {
      throw new Error(`Invalid choices in ${question.id}`);
    }
    options = choices;
    answer = originalAnswer;
  }
  if (question.image) {
    const imagePath = path.join(root, question.image.replace(/^\//, ''));
    if (!fs.existsSync(imagePath)) throw new Error(`Missing image for ${question.id}: ${imagePath}`);
  }
  return {
    id: `public-${school}-${question.id}`,
    topic: subject || question.subject || question.topic || 'math',
    section,
    statement: question.statement,
    options,
    answer,
    image: question.image || null,
  };
}

const output = {};
for (const [school, spec] of Object.entries(specs)) {
  const questions = [];
  const seen = new Set();
  for (const [subject, section, selectedIds, fallbackCount] of spec.subjects) {
    const ids = selectedIds || POOL.filter((question) => valid(question)
      && question.school === school && question.subject === subject
      && Array.isArray(question.options) && question.options.length >= 4)
      .slice(0, fallbackCount).map((question) => question.id);
    if (ids.length !== (fallbackCount || (subject === 'math' ? 40 : subject === 'kolzar' ? 60 : subject === 'logic' || subject === 'reading' ? 10 : school === 'РФМШ' ? 30 : 20))) {
      throw new Error(`${school}/${subject}: unexpected selection length ${ids.length}`);
    }
    for (const id of ids) {
      const question = byId.get(id);
      if (!valid(question) || (school === 'БИЛ' ? !['БИЛ', 'КТЛ'].includes(question.school) : question.school !== school)
        || (subject !== null && question.subject !== subject) || seen.has(id)) {
        throw new Error(`Invalid selection ${school}/${subject}: ${id}`);
      }
      seen.add(id);
      questions.push(normalize(question, school, subject, section));
    }
  }
  output[school] = { minutes: spec.minutes, questions };
}

const destination = new URL('../frontend/src/publicMockData.generated.js', import.meta.url);
fs.writeFileSync(destination, `// Generated by scripts/generate-public-mocks.mjs. Do not edit manually.\nexport const PUBLIC_MOCKS = Object.freeze(${JSON.stringify(output)});\n`);
console.log(Object.fromEntries(Object.entries(output).map(([school, mock]) => [school, mock.questions.length])));
