const { BIL_FORMAT, NIS_FORMAT, examChoice, examEligible } = require('./school-exam-format');
const { randomSample } = require('./random-sample');
const SPECS = Object.freeze({
  'РФМШ': { count: 30, minutes: 120, subjects: [[null, 30, 1]] },
  'НИШ': { count: 180, minutes: 240, subjects: [['math', 40, 1], ['kolzar', 60, 1], ['science', 20, 1], ['eng', 20, 2], ['rus', 20, 2], ['kaz', 20, 2]] },
  'БИЛ': { count: 60, minutes: 110, subjects: [['math', 40, 1], ['logic', 10, 1], ['reading', 10, 1]] },
});
const { deterministicOrder } = require('./weekly-mock');
const { scoreBil } = require('./bil-scoring');
const { FORMAT: RFM, reviewedLevel, examQuestion, integerAnswerCorrect } = require('./rfmsh-format');
const { publicQuestionAllowed } = require('./question-access');

const { loadPublishedBank: loadBank } = require('./published-bank');

const gradable = (question) => question?.id && question?.statement && question.answer != null
  && !['', '-', '—'].includes(String(question.answer).trim())
  && (!question.options || (Array.isArray(question.options) && question.options.length >= 2
    && question.options.map(String).includes(String(question.answer))));
const publicQuestion = ({ answer, solution, note, ...question }) => question;

function poolFor(pool, school, subject, exam = true) {
  return pool.filter((question) => !question.practiceOnly && gradable(question) && publicQuestionAllowed(question)
    && (school === 'БИЛ' ? ['БИЛ', 'КТЛ'].includes(question.school)
      : question.school === school || (school === 'НИШ' && subject === 'kaz' && question.school === 'БИЛ'))
    && (subject == null || question.subject === subject)
    && (!exam || school === 'РФМШ' || examEligible(question, school, subject)));
}

function preferFresh(items, count, excluded) {
  const ids = new Set(excluded || []);
  const fresh = [], previous = [];
  for (const item of items) (ids.has(item.id) ? previous : fresh).push(item);
  const selected = randomSample(fresh, count);
  return selected.concat(randomSample(previous, count - selected.length));
}

function availability(pool, school) {
  if (school === 'РФМШ') {
    const candidates = poolFor(pool, school, null);
    const levels = Object.entries(RFM.levels).map(([level,spec]) => ({level,...spec,available:candidates.filter(q=>reviewedLevel(q)===level).length}));
    const ready = levels.every(level=>level.available>=level.count);
    return {code:school,ready,count:ready?RFM.count:0,targetCount:RFM.count,shortened:false,missingSubjects:[],sections:1,timeLimitMin:RFM.minutes,scoring:RFM.scoring,examFormat:RFM.version,maxPoints:RFM.maxPoints,levels};
  }
  const spec = SPECS[school];
  const subjects = spec.subjects.map(([subject, target, section]) => ({
    subject, target, section, count: Math.min(target, poolFor(pool, school, subject).length),
  }));
  const count = subjects.reduce((sum, item) => sum + item.count, 0);
  return { code: school, ready: count === spec.count, count, targetCount: spec.count,
    shortened: count < spec.count, missingSubjects: subjects.filter((item) => item.count < item.target),
    sections: new Set(subjects.filter((item) => item.count).map((item) => item.section)).size,
    timeLimitMin: spec.minutes, examFormat: school === 'НИШ' ? NIS_FORMAT : BIL_FORMAT,
  };
}

async function mockCatalog(db) {
  const pool = await loadBank(db);
  return Object.keys(SPECS).map((school) => availability(pool, school));
}

function buildRfmsh(pool, select) {
  const questions = [];
  const candidates = poolFor(pool, 'РФМШ', null);
  for (const [level,spec] of Object.entries(RFM.levels)) {
    const eligible = candidates.filter(q=>reviewedLevel(q)===level);
    if (eligible.length < spec.count) return null;
    for (const q of select(eligible,spec.count,level)) questions.push({...examQuestion(q,level),num:questions.length+1,section:1});
  }
  return {school:'РФМШ',title:'РФМШ · Пробный тест',timeLimitMin:RFM.minutes,sections:1,shortened:false,targetCount:RFM.count,scoring:RFM.scoring,examFormat:RFM.version,maxPoints:RFM.maxPoints,questions};
}

async function createMock(db, school, excluded = []) {
  const pool = await loadBank(db), spec = SPECS[school];
  if (!spec) return null;
  const info = availability(pool, school);
  if (!info.ready) return null;
  if (school === 'РФМШ') return buildRfmsh(pool, (items,count) => preferFresh(items,count,excluded));
  const questions = [];
  for (const [subject, target, section] of spec.subjects) {
    const candidates = poolFor(pool, school, subject);
    for (const question of preferFresh(candidates, target, excluded)) {
      questions.push({ ...examChoice(question), num: questions.length + 1, subject: subject || question.subject || null, section });
    }
  }
  return { school, title: school === 'РФМШ' ? 'РФМШ · Пробный тест' : `${school} · Пробный тест`,
    timeLimitMin: info.timeLimitMin, sections: info.sections, shortened: info.shortened,
    targetCount: info.targetCount, examFormat: info.examFormat, questions };
}

async function createWeeklyMock(db, school, weekKey) {
  const pool = await loadBank(db), spec = SPECS[school];
  if (!spec) return null;
  const info = availability(pool, school);
  if (!info.ready) return null;
  if (school === 'РФМШ') {
    const variant = buildRfmsh(pool, (items,count,level) => deterministicOrder(items, `${weekKey}:РФМШ:${level}`).slice(0,count));
    return variant && {...variant,title:'РФМШ · Недельный пробник',weekKey};
  }
  const questions = [];
  for (const [subject, target, section] of spec.subjects) {
    const candidates = deterministicOrder(poolFor(pool, school, subject), `${weekKey}:${school}:${subject || 'all'}`);
    for (const question of candidates.slice(0, target)) {
      questions.push({ ...examChoice(question), num: questions.length + 1, subject: subject || question.subject || null, section });
    }
  }
  return { school, title: `${school} · Недельный пробник`, weekKey,
    timeLimitMin: info.timeLimitMin, sections: info.sections, shortened: info.shortened,
    targetCount: info.targetCount, examFormat: info.examFormat, questions };
}

// Fixed, reviewed selections shared with the landing demo. No random or weekly
// seed can widen this free offering. Resolve original content on the server.
const PREVIEW_IDS = require('../data/freePreviewMocks.json');
function previewQuestion(question, school) {
  if (school === 'РФМШ') {
    if (question.options?.length || !/^-?\d+$/.test(String(question.answer).trim())) throw new Error('preview_format_unavailable');
    return examQuestion(question);
  }
  const clean = value => String(value).replace(/^[A-EА-Е]\)\s*/u, '').trim();
  const answer = clean(question.answer), options = question.options?.map(clean).slice(0, 4);
  if (!options || options.length !== 4) throw new Error('preview_format_unavailable');
  if (!options.includes(answer)) options[3] = answer;
  if (new Set(options).size !== 4) throw new Error('preview_format_unavailable');
  return { ...question, answer, options };
}
async function createPreviewMock(db, school) {
  const ids = PREVIEW_IDS[school];
  if (!ids) return null;
  const byId = new Map((await loadBank(db)).map(question => [question.id, question]));
  const questions = ids.map((id, index) => {
    const question = byId.get(id);
    if (!gradable(question) || !publicQuestionAllowed(question) || question.practiceOnly
      || !(school === 'БИЛ' ? ['БИЛ', 'КТЛ'].includes(question.school) : question.school === school)) throw new Error('preview_question_unavailable');
    return { ...previewQuestion(question, school), num: index + 1, section: 1 };
  });
  return { school, title: `${school} · Бесплатный ознакомительный пробник`, preview: true,
    timeLimitMin: SPECS[school].minutes, sections: 1, shortened: false, targetCount: SPECS[school].count, ...(school === 'РФМШ' ? {scoring:RFM.scoring,examFormat:RFM.version,maxPoints:RFM.maxPoints} : {}), questions };
}

async function restoreMock(db, session) {
  const pool = await loadBank(db), byId = new Map(pool.map((question) => [question.id, question]));
  const questions = (session.questionRefs || []).map((ref, index) => {
    const question = byId.get(ref.id);
    if (!gradable(question) || !publicQuestionAllowed(question) || ref.num !== index + 1 || ![1, 2].includes(ref.section)) throw new Error('question_unavailable');
    const rfmsh = session.scoring === RFM.scoring && session.examFormat === RFM.version;
    if (rfmsh && (session.school !== 'РФМШ' || ref.examLevel !== Object.keys(RFM.levels)[Math.floor(index / 10)])) throw new Error('rfmsh_session_unavailable');
    // Historical sessions keep their original question and unweighted result.
    const restored = rfmsh ? examQuestion(question, ref.examLevel) : [BIL_FORMAT,NIS_FORMAT].includes(session.examFormat) ? examChoice(question) : session.preview === true && session.school !== 'РФМШ' ? previewQuestion(question, session.school) : question;
    if (!restored) throw new Error('question_format_unavailable');
    return { ...restored, num: ref.num, section: ref.section, subject: ref.subject || question.subject || null };
  });
  if (session.scoring === RFM.scoring && (session.examFormat !== RFM.version || questions.length !== RFM.count || session.timeLimitMin !== RFM.minutes)) throw new Error('rfmsh_session_unavailable');
  if (!questions.length || questions.length > SPECS[session.school].count) throw new Error('question_unavailable');
  return { id: session.attemptId, school: session.school, title: session.title,
    timeLimitMin: session.timeLimitMin, sections: session.sections, shortened: !!session.shortened,
    targetCount: session.targetCount, ...([BIL_FORMAT,NIS_FORMAT].includes(session.examFormat) ? {examFormat:session.examFormat} : {}), ...(session.scoring === RFM.scoring ? {scoring:RFM.scoring,examFormat:RFM.version,maxPoints:RFM.maxPoints} : {}), questions };
}

async function gradeMock(db, session, answers) {
  const { isCorrect, norm } = await import('../../frontend/src/grading.js');
  const variant = await restoreMock(db, session);
  let correct = 0, gradableCount = 0, wrong = 0;
  const review = variant.questions.map((question) => {
    const has = gradable(question);
    if (has) gradableCount += 1;
    const ok = has && (variant.scoring === RFM.scoring ? integerAnswerCorrect(answers[question.num], question.answer) : isCorrect(answers[question.num], question));
    if (ok) correct += 1;
    else if (has && norm(answers[question.num]) !== '') wrong += 1;
    return { qid: question.id, num: question.num, topic: question.topic || null,
      subject: question.subject || null, section: question.section, lang: question.lang || null,
      school: variant.school, ...(variant.scoring === RFM.scoring ? {examLevel:question.examLevel,examPoints:question.examPoints,examFormat:RFM.version} : {}), statement: question.statement,
      solution: question.solution || '', image: question.image || null, options: question.options || null,
      your: answers[question.num] ?? null, answer: question.answer, correct: ok, note: question.note || null };
  });
  if (variant.school === 'БИЛ') {
    return { ...scoreBil(correct, wrong, gradableCount), gradable: gradableCount, total: review.length, review };
  }
  return { score: correct, gradable: gradableCount, total: review.length, review, ...(variant.scoring === RFM.scoring ? {scoring:RFM.scoring,examFormat:RFM.version,points:review.reduce((sum,q)=>sum+(q.correct?q.examPoints:0),0),maxPoints:RFM.maxPoints,wrong,unanswered:gradableCount-correct-wrong} : {}) };
}

function publicMock(variant) {
  if (variant.questions.some((question) => !publicQuestionAllowed(question))) throw Object.assign(new Error('question-unavailable'), { status: 404 });
  return { ...variant, questions: variant.questions.map(publicQuestion) };
}

module.exports = { SPECS, mockCatalog, createMock, createWeeklyMock, createPreviewMock, restoreMock, gradeMock, publicMock };
