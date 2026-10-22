import { CURRICULUM_CATALOG as CURRICULUM } from './curriculumCatalog.generated.js';

export const CURRICULUM_ATTEMPT_LIMIT = 500;
export const CURRICULUM_TOPIC_WINDOW = 10;
const allTopics = new Map(Object.values(CURRICULUM).flat().map((topic) => [topic.key, topic]));
const theoryKey = (uid) => `synaq_curriculum_theory_v1_${uid}`;
export const emptyCurriculumTheory = (uid) => ({ version: 1, uid, lessons: {} });
export const curriculumLessonPages = (topic) => ['intro', ...Array.from({length:topic.chapterCount ?? topic.lecture.length},(_,index)=>index), 'check', 'summary'];

export function curriculumTheoryStudied(topic, lesson) {
  return !!lesson && Number.isFinite(lesson.studiedAt) && lesson.studiedAt > 0 && lesson.checkPassed === true
    && curriculumLessonPages(topic).slice(0, -2).every((step) => lesson.completedSteps?.includes(step));
}

function validTheory(record, uid) {
  if (!uid || record?.version !== 1 || record.uid !== uid || !record.lessons || typeof record.lessons !== 'object'
    || Array.isArray(record.lessons)) return false;
  return Object.entries(record.lessons).every(([key, lesson]) => {
    const topic = allTopics.get(key);
    if (!topic || !lesson || typeof lesson !== 'object') return false;
    const pages = curriculumLessonPages(topic);
    return pages.includes(lesson.lastStep) && Array.isArray(lesson.completedSteps)
      && lesson.completedSteps.length <= pages.length - 2
      && new Set(lesson.completedSteps).size === lesson.completedSteps.length
      && lesson.completedSteps.every((step) => pages.slice(0, -2).includes(step))
      && typeof lesson.checkPassed === 'boolean' && Number.isFinite(lesson.updatedAt) && lesson.updatedAt > 0
      && (lesson.studiedAt === null || curriculumTheoryStudied(topic, lesson));
  });
}

export function readCurriculumTheory(uid, storage) {
  if (!uid) return { record: emptyCurriculumTheory(uid), error: null };
  try {
    const raw = (storage || globalThis.localStorage).getItem(theoryKey(uid));
    if (!raw) return { record: emptyCurriculumTheory(uid), error: null };
    const record = JSON.parse(raw);
    return validTheory(record, uid) ? { record, error: null } : { record: emptyCurriculumTheory(uid), error: 'invalid' };
  } catch (error) {
    return { record: emptyCurriculumTheory(uid), error: error instanceof SyntaxError ? 'invalid' : 'unavailable' };
  }
}

export function writeCurriculumTheory(uid, record, storage) {
  if (!validTheory(record, uid)) return false;
  try {
    (storage || globalThis.localStorage).setItem(theoryKey(uid), JSON.stringify(record));
    return true;
  } catch { return false; }
}

// Reading and self-checks are local study aids. This record never awards XP or
// counts as verified practice. Opening the summary is deliberately insufficient.
export function updateCurriculumTheory(record, topic, { step, advance = false, checkPassed = false, now = Date.now() }) {
  if (!record?.uid || !allTopics.has(topic?.key)) return record;
  const pages = curriculumLessonPages(topic), index = pages.indexOf(step);
  if (index < 0 || !Number.isFinite(now) || now <= 0) return record;
  const previous = record.lessons[topic.key] || { completedSteps: [], checkPassed: false, studiedAt: null };
  const lesson = { ...previous, completedSteps: [...previous.completedSteps], lastStep: step, updatedAt: now };
  if (advance && step !== 'summary' && (step !== 'check' || checkPassed)) {
    if (step === 'check') lesson.checkPassed = true;
    else if (!lesson.completedSteps.includes(step)) lesson.completedSteps.push(step);
    lesson.lastStep = pages[index + 1];
    if (lesson.checkPassed && pages.slice(0, -2).every((part) => lesson.completedSteps.includes(part))) {
      lesson.studiedAt ||= now;
    }
  }
  return { ...record, lessons: { ...record.lessons, [topic.key]: lesson } };
}

export function curriculumResumeStep(topic, lesson) {
  if (curriculumTheoryStudied(topic, lesson)) return 'summary';
  return curriculumLessonPages(topic).slice(0, -2).find((step) => !lesson?.completedSteps?.includes(step)) ?? 'check';
}

export function mergeCurriculumLesson(topic, left, right) {
  if (!left) return right;
  if (!right) return left;
  const latest = left.updatedAt >= right.updatedAt ? left : right;
  const merged = { ...latest, completedSteps: curriculumLessonPages(topic).slice(0, -2)
    .filter((step) => left.completedSteps.includes(step) || right.completedSteps.includes(step)),
  checkPassed: left.checkPassed || right.checkPassed };
  const complete = merged.checkPassed && merged.completedSteps.length === curriculumLessonPages(topic).length - 2;
  merged.studiedAt = complete ? Math.min(...[left.studiedAt, right.studiedAt, merged.updatedAt].filter((value) => value > 0)) : null;
  return merged;
}

export function validCurriculumLesson(key, lesson) {
  return validTheory({ version: 1, uid: 'validate', lessons: { [key]: lesson } }, 'validate');
}

export function curriculumAccessibleKeys(grade, plan = 'free') {
  const topics = CURRICULUM[grade] || [];
  if (plan === 'pro' || plan === 'mentor') return new Set(topics.map((topic) => topic.key));
  return new Set([1, 2, 3, 4].flatMap((quarter) => topics.filter((topic) => topic.quarter === quarter)
    .slice(0, plan === 'standard' ? 2 : 1).map((topic) => topic.key)));
}

function attemptTime(at) {
  const value = at?.toMillis?.() ?? (typeof at?.seconds === 'number' ? at.seconds * 1000 : new Date(at).getTime());
  return Number.isFinite(value) ? value : 0;
}

// Older server attempts kept only the broad training topic. Their server-issued
// question IDs still contain the lesson key; retain this history after upgrading.
export function curriculumAttemptTopic(attempt) {
  if(allTopics.has(attempt?.curriculumTopicKey)) return attempt.curriculumTopicKey;
  if(allTopics.has(attempt?.topic)) return attempt.topic;
  if(attempt?.school==='curriculum'&&typeof attempt.qid==='string') {
    return [...allTopics.keys()].find(key=>attempt.qid.startsWith(`${key}-`)) || null;
  }
  return null;
}

export function curriculumProgressModel({ grade = 3, plan = 'free', attempts = [], theory,
  historyLimit = CURRICULUM_ATTEMPT_LIMIT, now = Date.now() } = {}) {
  const available = curriculumAccessibleKeys(grade, plan), byTopic = new Map(), seen = new Set();
  const historyTruncated = attempts.length >= historyLimit;
  const recent = [...attempts].filter((attempt) => attempt?.verified === true && typeof attempt.correct === 'boolean'
    && typeof attempt.sessionId === 'string' && attempt.sessionId && allTopics.has(curriculumAttemptTopic(attempt))
    && attemptTime(attempt.at) > 0 && attemptTime(attempt.at) <= Number(now))
    .sort((a, b) => attemptTime(b.at) - attemptTime(a.at)).slice(0, historyLimit);
  for (const attempt of recent) {
    if (seen.has(attempt.sessionId)) continue;
    seen.add(attempt.sessionId);
    const key = curriculumAttemptTopic(attempt);
    const answers = byTopic.get(key) || [];
    if (answers.length < CURRICULUM_TOPIC_WINDOW) answers.push(attempt.correct);
    byTopic.set(key, answers);
  }
  const topics = (CURRICULUM[grade] || []).map((topic) => {
    const answers = byTopic.get(topic.key) || [], correct = answers.filter(Boolean).length;
    const lesson = theory?.lessons?.[topic.key];
    return { topic, accessible: available.has(topic.key), theoryStudied: curriculumTheoryStudied(topic, lesson),
      theoryStarted: !!lesson, resumeStep: curriculumResumeStep(topic, lesson),
      practiceMastered: answers.length >= (historyTruncated ? CURRICULUM_TOPIC_WINDOW : 5) && correct / answers.length >= .8,
      practiceCount: answers.length, practiceAccuracy: answers.length ? Math.round(correct / answers.length * 100) : null };
  });
  const next = topics.find((item) => item.accessible && !item.theoryStudied)
    || topics.find((item) => item.accessible && !item.practiceMastered);
  return { topics, nextTopic: next?.topic || null, nextKind: next ? (next.theoryStudied ? 'practice' : 'theory') : null,
    studiedCount: topics.filter((item) => item.theoryStudied).length,
    masteredCount: topics.filter((item) => item.practiceMastered).length, availableCount: available.size, historyTruncated };
}

// A UID-bound controller makes delayed callbacks and account switches unable
// to write another child's progress. Invalid stored data is left untouched.
export function createCurriculumTheoryStore(uid, { storage, isCurrent = () => true, onChange = () => {} } = {}) {
  let { record, error } = readCurriculumTheory(uid, storage);
  return {
    snapshot: () => ({ record, error }),
    merge(lessons) {
      if (!uid || !isCurrent()) return null;
      const merged = { ...record.lessons };
      for (const [key, lesson] of Object.entries(lessons)) {
        if (validCurriculumLesson(key, lesson)) merged[key] = mergeCurriculumLesson(allTopics.get(key), merged[key], lesson);
      }
      record = { ...record, lessons: merged };
      if (error !== 'invalid') error = writeCurriculumTheory(uid, record, storage) ? null : 'unavailable';
      onChange({ record, error });
      return record;
    },
    update(topic, action) {
      if (!uid || !isCurrent()) return null;
      record = updateCurriculumTheory(record, topic, action);
      if (error !== 'invalid') error = writeCurriculumTheory(uid, record, storage) ? null : 'unavailable';
      const next = { record, error };
      onChange(next);
      return next;
    },
  };
}

export async function loadCurriculumAttempts(uid, load, onChange, { isCurrent = () => true, timeoutMs = 12000 } = {}) {
  let timer;
  try {
    const attempts = await Promise.race([
      Promise.resolve().then(() => load(uid, CURRICULUM_ATTEMPT_LIMIT)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('history-timeout')), timeoutMs); }),
    ]);
    if (isCurrent()) onChange({ status: 'ready', attempts });
  } catch {
    if (isCurrent()) onChange({ status: 'error', attempts: [] });
  } finally { clearTimeout(timer); }
}
