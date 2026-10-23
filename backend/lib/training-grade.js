// A question's grade may mean admission into a school, not a learning grade.
// Only this reviewed course import has a reliable school-grade interpretation.
const { isVerifiedAdaptation } = require('./question-access');
function schoolGrade(klass) {
  const grade = typeof klass === 'string' && /^(?:[1-9]|1[01])$/.test(klass.trim()) ? Number(klass.trim()) : klass;
  return Number.isInteger(grade) && grade >= 1 && grade <= 11 ? grade : null;
}

function isSchoolCourse(question) {
  return question?.practiceOnly === true && question.subject === 'math' && question.school === 'Математика'
    && (/^zerek_course_(?:extra_)?[a-f0-9]{16}$/.test(question.id || '')
      || (question.sourceProvider === 'zerek' && isVerifiedAdaptation(question)))
    && [4, 5, 6].includes(question.grade);
}

function trainingGradeAllowed(question, gradeCeiling) {
  const grade = schoolGrade(gradeCeiling);
  return grade === null || !isSchoolCourse(question) || question.grade <= grade;
}

module.exports = { schoolGrade, isSchoolCourse, trainingGradeAllowed };
