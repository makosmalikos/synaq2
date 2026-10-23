const test = require('node:test');
const assert = require('node:assert/strict');
const { schoolGrade, isSchoolCourse, trainingGradeAllowed } = require('../backend/lib/training-grade');
const course = (grade, extra = {}) => ({ id: `zerek_course_extra_000000000000000${grade}`, grade,
  practiceOnly: true, school: 'Математика', subject: 'math', ...extra });

test('school-grade ceilings retain lower-grade revision and unknown legacy profiles', () => {
  const rows = [course(4), course(5), course(6)];
  assert.deepEqual(rows.filter(q => trainingGradeAllowed(q, '4')).map(q => q.grade), [4]);
  assert.deepEqual(rows.filter(q => trainingGradeAllowed(q, 6)).map(q => q.grade), [4, 5, 6]);
  assert.deepEqual(rows.filter(q => trainingGradeAllowed(q, 3)), []);
  assert.deepEqual(rows.filter(q => trainingGradeAllowed(q, '2')), []);
  assert.deepEqual(rows.filter(q => trainingGradeAllowed(q, '11')).map(q => q.grade), [4, 5, 6]);
  for (const value of [undefined, null, '', '4A', '12', 12, true, {}, []]) {
    assert.equal(schoolGrade(value), null);
    assert.ok(rows.every(q => trainingGradeAllowed(q, value)), String(value));
  }
  assert.equal(schoolGrade(' 4 '), 4);
});

test('admission grade, ungraded records and other question sources keep their prior availability', () => {
  for (const question of [
    { id: 'nish-admission', grade: 7, school: 'НИШ' },
    { id: 'legacy-olympiad', grade: 6, practiceOnly: true, school: 'Математика', subject: 'math' },
    course(undefined), course(7), course(6, { practiceOnly: false }),
    course(6, { school: 'НИШ' }), course(6, { subject: 'logic' }),
  ]) {
    assert.equal(isSchoolCourse(question), false, question.id);
    assert.equal(trainingGradeAllowed(question, 4), true, question.id);
  }
  assert.equal(isSchoolCourse(course(6, { id: 'zerek_course_1234567890abcdef' })), true);
});

test('actual bank selection filters before shuffle and catalog counters use the same available pool', async () => {
  const { POOL } = await import('../frontend/src/bank.js');
  const { fakeFirestore } = require('./helpers/fake-firestore.cjs');
  const seed = Object.fromEntries([4,5,6].map(grade => [`bankTasks/synaq_adapted_grade_test_${grade}`, {
    ...course(grade), id: undefined, minimumPlan: 'pro', editorialStatus: 'verified', sourceProvider: 'zerek',
    status: 'published', topic: 'num', statement: '2 + 2?', answer: '4', solution: '2+2=4',
  }]));
  const content = require('../api/learning').content(fakeFirestore(seed));
  // Exercise the content provider with its entire topic; HTTP request bounds
  // remain separately enforced by learning-service (at most 60 questions).
  const request = { topicId: 'num', mixed: false, excludeIds: [], limit: 100000, plan: 'pro' };
  const younger = await content.getTrainingQuestions({ ...request, gradeCeiling: 4 });
  const older = await content.getTrainingQuestions({ ...request, gradeCeiling: 6 });
  const all = await content.getTrainingQuestions(request);
  assert.ok(younger.length < older.length);
  assert.equal(younger.some(q => isSchoolCourse(q) && q.grade > 4), false);
  for (const grade of [4, 5, 6]) assert.ok(older.some(q => isSchoolCourse(q) && q.grade === grade));
  const legacy = POOL.find(q => q.topic === 'num' && q.grade == null && q.answer != null);
  assert.ok(legacy);
  assert.ok(younger.some(q => q.id === legacy.id));
  assert.equal(all.length, older.length);
  assert.equal(younger.some(q => q.answer !== undefined || q.solution !== undefined), false);
  const [youngTopics, oldTopics] = await Promise.all([
    content.getTrainingTopics({ gradeCeiling: 4, plan: 'pro' }), content.getTrainingTopics({ gradeCeiling: 6, plan: 'pro' }),
  ]);
  const { getStandardBank } = require('../backend/lib/standard-bank');
  const excluded = 2 + [...POOL, ...getStandardBank()].filter(q => q.topic === 'num' && isSchoolCourse(q) && q.grade > 4).length;
  assert.equal(oldTopics.find(t => t.id === 'num').count - youngTopics.find(t => t.id === 'num').count, excluded);
});
