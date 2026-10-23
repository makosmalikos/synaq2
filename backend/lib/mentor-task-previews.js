const { findTrainingQuestion } = require('./training-question');
const { questionAccessAllowed } = require('./question-access');

async function mentorTaskPreviews(db, tasks, lookup = findTrainingQuestion, { plan = 'free' } = {}) {
  return Promise.all(tasks.map(async task => {
    // Return a strict projection: neither answers nor private saved-note fields.
    const item = { key: task.key, qid: task.qid, topic: task.topic || '', preview: '' };
    try {
      const question = await lookup(db, task.qid);
      if (questionAccessAllowed(question, plan) && typeof question?.statement === 'string') item.preview = question.statement.replace(/\s+/g, ' ').slice(0, 120);
    } catch { /* Keep a saved task selectable if its preview is unavailable. */ }
    return item;
  }));
}
module.exports = { mentorTaskPreviews };
