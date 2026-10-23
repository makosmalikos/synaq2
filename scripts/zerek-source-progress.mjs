// Source capture progress is deliberately separate from the size of the SYNAQ bank.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const LEVEL_COUNTS = {1: 16, 2: 16, 3: 12, test: 10};
const LEVELS = [1, 2, 3, 'test'];
const MODULES = [
  ['zerekReviewedQuestions.js', 'zerekReviewedQuestions'],
  ['zerekImportedQuestions.js', 'zerekImportedQuestions'],
  ['zerekCourseQuestions.js', 'zerekCourseQuestions'],
  ['zerekCourseExpansionQuestions.js', 'zerekCourseExpansionQuestions'],
];
const ADAPTED_MODULE = 'backend/data/synaqAdaptedQuestions.json';
const CAPTURE_FREEZE = {stoppedByUser: true, frozenAt: '2026-10-23',
  reason: 'The user stopped further Zerek collection. Unselected source material is not an outstanding import target.'};
const sum = values => values.reduce((a, b) => a + b, 0);
const percent = (n, d) => d ? Math.round(n / d * 10000) / 100 : 0;
const tally = values => values.reduce((a, v) => (a[v] = (a[v] || 0) + 1, a), {});
const nonempty = v => v != null && String(v).trim().length > 0;
const officialKey = q => nonempty(q.sourceAnswer) ||
  (q.options || []).filter(o => o.correct === true).length === 1 ||
  /Дұрыс\s+жауап\s*:/i.test(q.openAnswerText || '');

// Capture snapshots are replaced atomically. Reports/published modules can be rewritten
// in place, so retry those reads rather than observing half of a concurrent publish.
async function stableRead(filename, parse, optional = false) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const before = await fs.stat(filename);
      const text = await fs.readFile(filename, 'utf8');
      const after = await fs.stat(filename);
      if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ino !== after.ino) {
        throw Error('File changed during progress snapshot: ' + filename);
      }
      return await parse(text);
    } catch (error) {
      if (optional && error.code === 'ENOENT') return null;
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }
  throw lastError;
}
const readJSON = (filename, optional = false) => stableRead(filename, JSON.parse, optional);

export function catalogLevelCounts(catalog) {
  const counts = {};
  const text = catalog?.text || '';
  const headings = [...text.matchAll(/^(?:🟢|🟡|🔴|🔒)\s+(Негізгі|Орта|Күрделі)\s+деңгей/gm)];
  for (let i = 0; i < headings.length; i++) {
    const level = {Негізгі: 1, Орта: 2, Күрделі: 3}[headings[i][1]];
    const section = text.slice(headings[i].index, headings[i + 1]?.index ?? text.length);
    const match = section.match(/Шешілген\s+есеп:\s*\d+\/(\d+)|(\d+)\s+есеп/);
    if (match) counts[level] = Number(match[1] || match[2]);
  }
  if (LEVELS.includes(catalog?.meta?.level) && Number.isInteger(catalog.meta.expected)) {
    counts[catalog.meta.level] = catalog.meta.expected;
  }
  return counts;
}

export function classifyCourseCapture(data, fallbackExpected, fallbackObserved = false) {
  const snapshotExpected = Number.isInteger(data?.expected) && data.expected > 0;
  const observedExpected = snapshotExpected || fallbackObserved;
  const expected = snapshotExpected ? data.expected : fallbackExpected;
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const reviewed = questions.filter(q => nonempty(q.id) && q.checked === true &&
    nonempty(q.statement) && nonempty(q.solution) && nonempty(q.sourceAnswer));
  const distinctIds = new Set(questions.map(q => q.id)).size === questions.length;
  const complete = data?.status === 'captured' && reviewed.length === expected &&
    questions.length === expected && distinctIds;
  return {expected, observedExpected, complete, questions: complete ? questions : [],
    partialReviewedQuestions: complete ? 0 : reviewed.length,
    invalidCompletedSnapshot: data?.status === 'captured' && !complete};
}

const occurrenceKey = r => `${r.file}:${r.index ?? r.captureIndex}:${r.sourceContentId}`;
const normalizedKey = v => String(v ?? '').normalize('NFKC').replace(/\s+/g, '');

export function reconcileCourseOccurrences(occurrences, baseline, dispositions, audit, prepared) {
  const baselineByOccurrence = new Map(baseline.map(r => [occurrenceKey(r), r]));
  const dispositionByOccurrence = new Map(dispositions.map(r => [occurrenceKey(r), r]));
  const auditByOccurrence = new Map(audit.map(r => [occurrenceKey(r), r]));
  const baselineByContent = new Map(baseline.map(r => [r.sourceContentId, r]));
  const rawByOccurrence = new Map(occurrences.map(r => [occurrenceKey(r), r]));
  const rows = [];
  for (const o of occurrences) {
    const key = occurrenceKey(o);
    const initial = baselineByOccurrence.get(key);
    const disposition = dispositionByOccurrence.get(key);
    const reviewed = auditByOccurrence.get(key);
    const r = initial || disposition;
    let status;
    if (reviewed?.status === 'needs_review') status = 'needs_review';
    else if (r && ['ready', 'published_local'].includes(r.status)) {
      status = prepared.has(r.id) ? 'archived_pending_adaptation' : 'missing_prepared_local';
    } else if (r?.status === 'duplicate') status = 'duplicate';
    else if (reviewed?.status === 'source_review_ready') status = 'review_ready';
    else if (r?.status === 'needs_review') status = 'needs_review';
    else {
      // The expansion audit excludes IDs in the first 176-task batch. A later
      // occurrence of that exact content is covered once, not imported twice.
      const prior = baselineByContent.get(o.sourceContentId);
      const original = prior && rawByOccurrence.get(occurrenceKey(prior));
      if (prior && original && prepared.has(prior.id)) {
        status = normalizedKey(original.sourceAnswer) === normalizedKey(o.sourceAnswer)
          ? 'duplicate' : 'needs_review';
      } else status = 'pending_review';
    }
    rows.push({...o, status});
  }
  return rows;
}

function summarizeUnits(units) {
  return {
    expectedUnits: units.length,
    completedUnits: units.filter(u => u.complete).length,
    partialUnits: units.filter(u => u.exists && !u.complete).length,
    missingUnits: units.filter(u => !u.exists).length,
    capturedQuestions: sum(units.map(u => u.questions.length)),
    expectedQuestions: sum(units.map(u => u.expected)),
    expectedUnitsObserved: units.filter(u => u.observedExpected).length,
    expectedUnitsAssumed: units.filter(u => !u.observedExpected).length,
    expectedCountSources: tally(units.map(u => u.expectedCountSource)),
    partialReviewedQuestions: sum(units.map(u => u.partialReviewedQuestions)),
  };
}

async function preparedModules(root) {
  const result = [];
  for (const [filename, exported] of MODULES) {
    const full = path.join(root, 'frontend/src', filename);
    if (filename === 'zerekReviewedQuestions.js') {
      // This immutable first batch uses a small JS factory rather than JSON.
      const module = await import(pathToFileURL(full).href);
      result.push({file: filename, questions: module[exported]});
    } else {
      const questions = await stableRead(full, text => {
        const marker = `export const ${exported} = `;
        const start = text.indexOf(marker);
        if (start < 0) throw Error('Unknown prepared module format: ' + filename);
        return JSON.parse(text.slice(start + marker.length).trim().replace(/;\s*$/, ''));
      });
      result.push({file: filename, questions});
    }
  }
  return result;
}

async function activeLocalQuestions(root) {
  const bank = path.join(root, 'frontend/src/bank.js');
  return await stableRead(bank, async () => {
    const module = await import(pathToFileURL(bank).href + '?progress=' + Date.now());
    if (!Array.isArray(module.POOL)) throw Error('Active bank has no POOL array.');
    const serverFile = path.join(root, 'backend/lib/standard-bank.js');
    const serverQuestions = await stableRead(serverFile, async () => {
      const server = await import(pathToFileURL(serverFile).href + '?progress=' + Date.now());
      return (server.getStandardBank || server.default?.getStandardBank)();
    }, true) || [];
    return [...module.POOL, ...serverQuestions];
  }, true) || [];
}

async function adaptedLocalQuestions(root) {
  return await readJSON(path.join(root, ADAPTED_MODULE), true) || [];
}

// A prepared source archive is not a published bank. Inspect actual POOL
// membership, and count authored adaptations separately from original records.
export function localQuestionAccounting(originals, adaptations, activeQuestions) {
  const originalIds = new Set(originals.map(q => q.id));
  const adaptedIds = new Set(adaptations.map(q => q.id));
  const preparedIds = new Set([...originalIds, ...adaptedIds]);
  const activeIds = new Set(activeQuestions.map(q => q.id).filter(id => preparedIds.has(id)));
  const originalActive = [...originalIds].filter(id => activeIds.has(id));
  const adaptedActive = [...adaptedIds].filter(id => activeIds.has(id));
  return {preparedLocal: preparedIds.size, stagedLocal: preparedIds.size - activeIds.size,
    activeLocal: activeIds.size, originalPreparedLocal: originalIds.size,
    originalStagedLocal: originalIds.size - originalActive.length,
    originalActiveLocal: originalActive.length, adaptedPreparedLocal: adaptedIds.size,
    adaptedStagedLocal: adaptedIds.size - adaptedActive.length, adaptedActive: adaptedActive.length,
    originalActiveIds: originalActive,
    invalidAdaptedActiveIds: activeQuestions.filter(q => adaptedIds.has(q.id) &&
      (!/^synaq_adapted_/.test(q.id || '') || q.editorialStatus !== 'verified' || !['pro', 'mentor'].includes(q.minimumPlan))).map(q => q.id),
    duplicatePreparedIds: originals.length + adaptations.length - preparedIds.size};
}

export async function collectZerekProgress(root = ROOT) {
  const startedAt = new Date().toISOString();
  const base = path.join(root, 'problems/sources/zerek');
  const [catalog, courseCatalog, collectionReview, baseline, expansion, audit, modules, adaptations, active] = await Promise.all([
    readJSON(path.join(base, 'catalog.json')),
    readJSON(path.join(base, 'course-topics-4-6.json')),
    readJSON(path.join(base, 'import-dispositions.json')),
    readJSON(path.join(base, 'courses/review-dispositions.json')),
    readJSON(path.join(base, 'courses/expansion-dispositions.json'), true),
    readJSON(path.join(base, 'courses/expansion-audit.json'), true),
    preparedModules(root),
    adaptedLocalQuestions(root),
    activeLocalQuestions(root),
  ]);
  const errors = [], warnings = [];
  const preparedQuestions = modules.flatMap(m => m.questions);
  const preparedIds = new Set(preparedQuestions.map(q => q.id));
  const accounting = localQuestionAccounting(preparedQuestions, adaptations, active);
  if (accounting.duplicatePreparedIds) errors.push('Prepared original/adapted task IDs are not unique.');
  if (accounting.originalActiveLocal) errors.push('Original Zerek tasks remain in active POOL; they must stay staged pending adaptation.');
  if (accounting.invalidAdaptedActiveIds.length) errors.push('Active adaptations lack the verified namespace/editorial/paid-plan contract.');
  const collectionRows = [], collections = [];
  const collectionDispositions = new Map(collectionReview.records.map(r => [`${r.collection}:${r.number}`, r]));
  for (const entry of catalog.collections) {
    const id = entry.path.split('/').at(-1);
    const data = await readJSON(path.join(base, 'collections', id + '.json'), true);
    const expected = entry.questionCount;
    if (!Number.isInteger(expected) || expected < 1) throw Error('Missing collection count: ' + id);
    const questions = data?.questions || [];
    const complete = entry.status === 'captured' && entry.sourceReviewCaptured === true &&
      data?.sourceReviewCaptured === true && data.count === expected && questions.length === expected &&
      new Set(questions.map(q => q.number)).size === expected &&
      questions.every(q => nonempty(q.statement) && nonempty(q.solution) && officialKey(q));
    collections.push({id, school: entry.school, expected, complete});
    if (!complete && entry.status === 'captured') errors.push('Invalid completed collection: ' + id);
    if (!complete) continue;
    for (const q of questions) {
      const r = collectionDispositions.get(`${id}:${q.number}`);
      let status = r?.status;
      if (status === 'ready') status = preparedIds.has(r.id) ? 'archived_pending_adaptation' : 'missing_prepared_local';
      if (status === 'previous_batch') {
        status = preparedQuestions.some(p => p.sourceUrl === data.url && p.sourceNumber === q.number)
          ? 'archived_pending_adaptation' : 'missing_prepared_local';
      }
      collectionRows.push({school: entry.school, status: status || 'pending_review'});
    }
  }

  const units = [], occurrences = [], byGrade = {};
  const courses = courseCatalog.courses.filter(c => [4, 5, 6].includes(c.grade));
  for (const course of courses) {
    for (const topic of course.topics) {
      const topicId = topic.path.split('/').at(-1);
      const visibleCatalog = await readJSON(path.join(base, 'courses', `${course.course}-${topicId}-catalog.json`), true);
      const observedCounts = catalogLevelCounts(visibleCatalog);
      const testArchive = await readJSON(path.join(base, 'courses/tests', `${course.course}-${topicId}.json`), true);
      if (testArchive?.course === course.course && testArchive.topic === topicId &&
        Number.isInteger(testArchive.expected) && testArchive.expected > 0) observedCounts.test = testArchive.expected;
      for (const level of LEVELS) {
        const file = `${course.course}-${topicId}-level${level}.json`;
        const data = await readJSON(path.join(base, 'courses', file), true);
        if (data && (data.course !== course.course || data.topic !== topicId ||
          data.grade !== course.grade || data.level !== level)) errors.push('Course file identity mismatch: ' + file);
        const state = classifyCourseCapture(data, observedCounts[level] || LEVEL_COUNTS[level], Boolean(observedCounts[level]));
        const expectedCountSource = Number.isInteger(data?.expected) ? 'capture_ui'
          : observedCounts[level] ? (level === 'test' ? 'test_intro_ui' : 'catalog_ui') : 'assumed_default';
        const unit = {...state, file, grade: course.grade, topic: topic.path, level,
          exists: data !== null, expectedCountSource};
        units.push(unit);
        if (state.invalidCompletedSnapshot) errors.push('Invalid completed course snapshot: ' + file);
        if (state.complete) state.questions.forEach((q, index) => occurrences.push({
          file, index, sourceContentId: q.id, sourceAnswer: q.sourceAnswer, grade: course.grade, level,
        }));
      }
    }
    const gradeUnits = units.filter(u => u.grade === course.grade);
    const totals = summarizeUnits(gradeUnits);
    byGrade[course.grade] = {
      topics: {catalog: course.topics.length,
        withCapture: course.topics.filter(t => gradeUnits.some(u => u.topic === t.path && u.complete)).length,
        complete: course.topics.filter(t => gradeUnits.filter(u => u.topic === t.path && u.complete).length === 4).length},
      ...totals,
      levels: Object.fromEntries(LEVELS.map(level => [level, summarizeUnits(gradeUnits.filter(u => u.level === level))])),
      capturedPercentEstimate: percent(totals.capturedQuestions, totals.expectedQuestions),
    };
  }
  const courseRows = reconcileCourseOccurrences(occurrences, baseline.records,
    expansion?.records || [], audit?.records || [], preparedIds);
  const sourceStatuses = tally([...collectionRows, ...courseRows].map(r => r.status));
  const courseTotals = summarizeUnits(units);
  const capturedCollections = collections.filter(c => c.complete);
  const collectionCapturedQuestions = sum(capturedCollections.map(c => c.expected));
  const collectionExpectedQuestions = sum(collections.map(c => c.expected));
  const capturedQuestions = collectionCapturedQuestions + courseTotals.capturedQuestions;
  const expectedQuestions = collectionExpectedQuestions + courseTotals.expectedQuestions;
  if (sum(Object.values(sourceStatuses)) !== capturedQuestions) errors.push('Source disposition partition mismatch.');
  if (sourceStatuses.missing_prepared_local) errors.push(`${sourceStatuses.missing_prepared_local} source records refer to missing prepared local tasks.`);
  if ((sourceStatuses.archived_pending_adaptation || 0) !== preparedIds.size) {
    warnings.push('Prepared original task count and archived source occurrences differ; inspect duplicate coverage or a newer review snapshot.');
  }
  const completedAt = new Date().toISOString();
  return {
    snapshot: {startedAt, completedAt, concurrentCapture: false, ...CAPTURE_FREEZE},
    scope: {collectionCatalog: catalog.collections.length, grades: [4, 5, 6], excludedGrades: [7],
      courseTopics: sum(courses.map(c => c.topics.length)),
      counting: 'Source occurrences are counted once per canonical collection/level/test; mastery files and courses/tests mirrors are excluded. Content IDs, prepared local IDs and active bank IDs are separate counts. Numerical variants are retained; no count here represents semantic uniqueness.'},
    source: {
      collections: {catalog: collections.length, complete: capturedCollections.length,
        capturedQuestions: collectionCapturedQuestions, expectedQuestions: collectionExpectedQuestions,
        bySchool: Object.fromEntries([...new Set(collections.map(c => c.school))].map(school => {
          const rows = collections.filter(c => c.school === school);
          return [school, {catalog: rows.length, complete: rows.filter(c => c.complete).length,
            capturedQuestions: sum(rows.filter(c => c.complete).map(c => c.expected)),
            expectedQuestions: sum(rows.map(c => c.expected))}];
        }))},
      courses: {...courseTotals, uniqueContentIds: new Set(occurrences.map(r => r.sourceContentId)).size,
        completeTopics: sum(Object.values(byGrade).map(g => g.topics.complete)), byGrade},
      total: {capturedQuestions, expectedQuestions,
        expectedIsEstimate: courseTotals.expectedUnitsAssumed > 0,
        unselectedSourceQuestionsEstimate: expectedQuestions - capturedQuestions,
        capturedPercentEstimate: percent(capturedQuestions, expectedQuestions),
        unselectedSourcePercentEstimate: percent(expectedQuestions - capturedQuestions, expectedQuestions),
        collectionStopped: true, outstandingCollectionTarget: false},
      expectationBasis: {observedCollectionQuestionCounts: true,
        unobservedCourseUnitDefaults: LEVEL_COUNTS,
        note: 'The denominator describes the unselected source catalog and remains an estimate where unit counts are unobserved. Collection stopped by user on 2026-10-23; the difference is not work left to collect. Partial snapshots do not count as completed or enter the captured-question total.'},
    },
    localImport: {...accounting,
      byModule: {...Object.fromEntries(modules.map(m => [m.file, m.questions.length])),
        [ADAPTED_MODULE]: adaptations.length},
      sourceOccurrences: sourceStatuses,
      collectionOccurrences: tally(collectionRows.map(r => r.status)),
      courseOccurrences: tally(courseRows.map(r => r.status)),
      note: 'preparedLocal counts physical original plus adapted task IDs; preparedLocal = stagedLocal + activeLocal. Original modules are an offline archive pending adaptation, not published platform tasks. adaptedActive is the subset of the authored adaptation module actually loaded by the server-only Standard registry; activeLocal is originalActiveLocal + adaptedActive. duplicate means exact source content already covered, not semantic equality or a removed numerical variant. pending_review means captured material newer than its preparation snapshot.'},
    consistency: {errors, warnings},
    references: {collectionCatalog: 'problems/sources/zerek/catalog.json',
      courseCatalog: 'problems/sources/zerek/course-topics-4-6.json',
      collections: 'problems/sources/zerek/collections/',
      canonicalCourseSnapshots: 'problems/sources/zerek/courses/*-level{1,2,3,test}.json',
      collectionDispositions: 'problems/sources/zerek/import-dispositions.json',
      initialCourseDispositions: 'problems/sources/zerek/courses/review-dispositions.json',
      expansionDispositions: 'problems/sources/zerek/courses/expansion-dispositions.json',
      adaptedQuestions: ADAPTED_MODULE, activeBank: ['frontend/src/bank.js', 'backend/lib/standard-bank.js']},
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await collectZerekProgress();
  if (process.argv.includes('--write')) {
    const destination = path.join(ROOT, 'problems/sources/zerek/import-progress.json');
    const temporary = destination + '.tmp';
    await fs.writeFile(temporary, JSON.stringify(report, null, 2) + '\n');
    await fs.rename(temporary, destination);
  }
  console.log(JSON.stringify(report));
  if (report.consistency.errors.length) process.exitCode = 1;
}
