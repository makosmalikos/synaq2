import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {catalogLevelCounts, classifyCourseCapture, collectZerekProgress, localQuestionAccounting,
  reconcileCourseOccurrences} from '../scripts/zerek-source-progress.mjs';

const question = id => ({id, checked: true, statement: 'Есептеңдер: 2 + 2.',
  solution: '2 + 2 = 4. Жауабы: 4.', sourceAnswer: '4'});
const occurrence = (file, index, id) => ({file, index, sourceContentId: id, sourceAnswer: '4'});

test('visible locked-level counts are observations, not guesses or completed captures', () => {
  const counts = catalogLevelCounts({meta: {level: 1, expected: 16}, text:
    '🟢 Негізгі деңгей\nШешілген есеп: 2/16\n🔒 Орта деңгей\n«Негізгі деңгей» меңгерілгенде ашылады\n16 есеп\n🔒 Күрделі деңгей\n12 есеп\n🔒 Тақырыптық тест\nМеңгерілген деңгей: 0/1'});
  assert.deepEqual(counts, {1: 16, 2: 16, 3: 12});
  const missing = classifyCourseCapture(null, counts[2], true);
  assert.equal(missing.expected, 16);
  assert.equal(missing.observedExpected, true);
  assert.equal(missing.complete, false);
});

test('partial or incorrectly marked snapshots never advance completed capture progress', () => {
  const partial = classifyCourseCapture({status: 'capturing', expected: 2,
    questions: [question('a'), question('b')]}, 16);
  assert.equal(partial.complete, false);
  assert.equal(partial.questions.length, 0);
  assert.equal(partial.partialReviewedQuestions, 2);
  const truncated = classifyCourseCapture({status: 'captured', expected: 2,
    questions: [question('a')]}, 16);
  assert.equal(truncated.invalidCompletedSnapshot, true);
  const repeated = classifyCourseCapture({status: 'captured', expected: 2,
    questions: [question('a'), question('a')]}, 16);
  assert.equal(repeated.complete, false);
  const complete = classifyCourseCapture({status: 'captured', expected: 2,
    questions: [question('a'), question('b')]}, 16);
  assert.equal(complete.complete, true);
  assert.equal(complete.expected, 2);
  assert.equal(complete.observedExpected, true);
});

test('the original course batch and later repeated content are covered once', () => {
  const original = occurrence('a-level1.json', 0, 'same');
  const repeated = occurrence('b-level2.json', 0, 'same');
  const baseline = [{file: original.file, captureIndex: 0, sourceContentId: 'same',
    id: 'initial', status: 'ready'}];
  const rows = reconcileCourseOccurrences([original, repeated], baseline, [], [], new Set(['initial']));
  assert.deepEqual(rows.map(r => r.status), ['archived_pending_adaptation', 'duplicate']);
  const conflicted = reconcileCourseOccurrences([original, {...repeated, sourceAnswer: '5'}],
    baseline, [], [], new Set(['initial']));
  assert.equal(conflicted[1].status, 'needs_review');
});

test('captured, reviewed and locally prepared originals remain different stages', () => {
  const occurrences = ['live', 'duplicate', 'blocked', 'ready', 'new', 'missing']
    .map((id, index) => occurrence('a-level2.json', index, id));
  const dispositions = [
    {...occurrences[0], id: 'task-live', status: 'published_local'},
    {...occurrences[1], duplicateOf: 'task-live', status: 'duplicate'},
    {...occurrences[2], status: 'needs_review'},
    {...occurrences[5], id: 'task-absent', status: 'published_local'},
  ];
  const audit = [{...occurrences[2], status: 'needs_review'},
    {...occurrences[3], status: 'source_review_ready'}];
  const rows = reconcileCourseOccurrences(occurrences, [], dispositions, audit, new Set(['task-live']));
  assert.deepEqual(rows.map(r => r.status), ['archived_pending_adaptation', 'duplicate', 'needs_review',
    'review_ready', 'pending_review', 'missing_prepared_local']);
});

test('prepared source archives and active adaptations are accounted for separately', () => {
  const original = {id: 'zerek_course_original'};
  const adaptation = {id: 'synaq_adapted_new', editorialStatus: 'verified', minimumPlan: 'pro'};
  const unverified = {id: 'synaq_adapted_draft', editorialStatus: 'draft', minimumPlan: 'pro'};
  const report = localQuestionAccounting([original], [adaptation, unverified], [adaptation, {id: 'unrelated'}]);
  assert.equal(report.preparedLocal, 3);
  assert.equal(report.stagedLocal, 2);
  assert.equal(report.activeLocal, 1);
  assert.equal(report.originalPreparedLocal, 1);
  assert.equal(report.originalActiveLocal, 0);
  assert.equal(report.adaptedPreparedLocal, 2);
  assert.equal(report.adaptedActive, 1);
  assert.equal(report.preparedLocal, report.stagedLocal + report.activeLocal);
  assert.deepEqual(report.invalidAdaptedActiveIds, []);
  const leaked = localQuestionAccounting([original], [unverified], [original, unverified]);
  assert.deepEqual(leaked.originalActiveIds, [original.id]);
  assert.deepEqual(leaked.invalidAdaptedActiveIds, [unverified.id]);
});

test('numerical variants remain distinct prepared IDs and never claim semantic uniqueness', () => {
  const variants = [{id: 'zerek_a', statement: '2 + 3'}, {id: 'zerek_b', statement: '5 + 7'}];
  const report = localQuestionAccounting(variants, [], []);
  assert.equal(report.preparedLocal, 2);
  assert.equal(report.stagedLocal, 2);
  assert.equal(report.activeLocal, 0);
  assert.equal(report.duplicatePreparedIds, 0);
});

test('filesystem inventory ignores mastery checkpoints, test mirrors and excluded grade 7', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'zerek-progress-'));
  const write = async (relative, value) => {
    const filename = path.join(root, relative);
    await fs.mkdir(path.dirname(filename), {recursive: true});
    await fs.writeFile(filename, typeof value === 'string' ? value : JSON.stringify(value));
  };
  try {
    await write('package.json', {type: 'module'});
    const base = 'problems/sources/zerek/';
    const file = '4-math-1-1-level1.json';
    const task = {id: 'initial', sourceContentId: 'original'};
    await write(base + 'catalog.json', {collections: []});
    await write(base + 'course-topics-4-6.json', {courses: [
      {course: '4-math', grade: 4, topics: [{path: '/courses/4-math/1-1'}]},
      {course: '7-math', grade: 7, topics: [{path: '/courses/7-math/1-1'}]},
    ]});
    await write(base + 'import-dispositions.json', {records: []});
    await write(base + 'courses/review-dispositions.json', {records: [
      {file, captureIndex: 0, sourceContentId: 'original', id: task.id, status: 'ready'},
    ]});
    const capture = {course: '4-math', topic: '1-1', grade: 4, level: 1,
      expected: 1, status: 'captured', questions: [question('original')]};
    await write(base + 'courses/' + file, capture);
    await write(base + 'courses/4-math-1-1-catalog.json', {meta: {level: 1, expected: 1},
      text: '🟢 Негізгі деңгей\n1 есеп\n🔒 Орта деңгей\n1 есеп\n🔒 Күрделі деңгей\n1 есеп'});
    await write(base + 'courses/tests/4-math-1-1.json', {...capture, level: 'test'});
    await write(base + 'courses/mastery-4-math-1-1-1.json', capture);
    await write(base + 'courses/7-math-1-1-level1.json', {...capture, course: '7-math', grade: 7});
    for (const name of ['Reviewed', 'Imported', 'Course', 'CourseExpansion']) {
      const exported = 'zerek' + name + 'Questions';
      await write(`frontend/src/${exported}.js`, `export const ${exported} = ${JSON.stringify(name === 'Course' ? [task] : [])};`);
    }
    const adapted = {id: 'synaq_adapted_fixture', editorialStatus: 'verified', minimumPlan: 'pro'};
    await write('backend/data/synaqAdaptedQuestions.json', [adapted]);
    await write('backend/lib/standard-bank.js', `export function getStandardBank() { return [${JSON.stringify(adapted)}]; }`);
    await write('frontend/src/bank.js', 'export const POOL = [];');
    const report = await collectZerekProgress(root);
    assert.equal(report.scope.courseTopics, 1);
    assert.equal(report.source.courses.completedUnits, 1);
    assert.equal(report.source.courses.expectedUnits, 4);
    assert.equal(report.source.courses.capturedQuestions, 1);
    assert.equal(report.source.courses.expectedQuestions, 4);
    assert.equal(report.source.total.capturedPercentEstimate, 25);
    assert.equal(report.snapshot.stoppedByUser, true);
    assert.equal(report.snapshot.frozenAt, '2026-10-23');
    assert.equal(report.snapshot.concurrentCapture, false);
    assert.equal(report.source.total.unselectedSourceQuestionsEstimate, 3);
    assert.equal(report.source.total.outstandingCollectionTarget, false);
    assert.equal(report.localImport.preparedLocal, 2);
    assert.equal(report.localImport.originalPreparedLocal, 1);
    assert.equal(report.localImport.stagedLocal, 1);
    assert.equal(report.localImport.activeLocal, 1);
    assert.equal(report.localImport.adaptedActive, 1);
    assert.equal(report.localImport.publishedLocal, undefined);
    assert.equal(report.localImport.sourceOccurrences.archived_pending_adaptation, 1);
    assert.match(report.scope.counting, /no count here represents semantic uniqueness/);
    assert.deepEqual(report.consistency.errors, []);
    assert.deepEqual(report.consistency.warnings, []);
  } finally {
    await fs.rm(root, {recursive: true, force: true});
  }
});
