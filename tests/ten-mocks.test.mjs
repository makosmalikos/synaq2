import test from 'node:test';
import assert from 'node:assert/strict';
import { expandedQuestions } from '../frontend/src/expandedQuestionBank.js';
import { ensureBankReady } from '../frontend/src/bank.js';
import { api, MOCK_SPECS } from '../frontend/src/api.js';

await ensureBankReady(async () => []);

test('the authored expansion is structurally complete and has unique IDs', () => {
  assert.equal(expandedQuestions.length, 1340);
  assert.equal(new Set(expandedQuestions.map((question) => question.id)).size, expandedQuestions.length);
  for (const question of expandedQuestions) {
    assert.ok(question.statement.length > 15, question.id);
    assert.ok(String(question.answer).length > 0, question.id);
    assert.ok(question.solution.length > 10, question.id);
    if (question.options) {
      assert.ok(question.options.length === 3 || question.options.length === 4, question.id);
      assert.equal(new Set(question.options).size, question.options.length, question.id);
      assert.ok(question.options.includes(question.answer), question.id);
    }
  }
});

for (const school of Object.keys(MOCK_SPECS)) {
  test(`${school} can build ten full exams without repeating a question`, async () => {
    const used = new Set();
    for (let attempt = 1; attempt <= 10; attempt++) {
      const exam = await api.mockRandom(school, { excludeQuestionIds: used });
      assert.equal(exam.questions.length, MOCK_SPECS[school].count, `attempt ${attempt}`);
      assert.equal(exam.shortened, false, `attempt ${attempt}`);
      for (const question of exam.questions) {
        assert.equal(used.has(question.id), false, `${question.id} repeated on attempt ${attempt}`);
        used.add(question.id);
      }
    }
    assert.equal(used.size, MOCK_SPECS[school].count * 10);
  });
}
