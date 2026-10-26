import test from 'node:test';
import assert from 'node:assert/strict';
import { translateQuestions } from '../frontend/src/translateQuestions.js';
const auth = { currentUser: { uid: 'kid', getIdToken: async () => 'token' } };
const q = (id, extra = {}) => ({ id, statement: 'Қанша?', lang: 'kk', options: ['A', 'B'], answer: 'B', ...extra });
const deps = { loadAuth: async () => ({ auth }) };
const ok = data => ({ ok: true, status: 200, json: async () => data });

test('translation changes prose only; options and grading keys stay original', async () => {
  const question = q('translation-fields');
  const result = await translateQuestions([question], 'ru', { ...deps, fetcher: async () => ok({ [question.id]: { statement: 'Сколько?', options: ['wrong'], answer: 'wrong' } }) });
  assert.equal(result[0].statement, 'Сколько?');
  assert.deepEqual(result[0].options, ['A', 'B']); assert.equal(result[0].answer, 'B');
  assert.equal(question.statement, 'Қанша?');
});

test('language subjects and already matching content make no translation calls', async () => {
  const list = [q('rus', { subject: 'rus' }), q('eng', { subject: 'eng' }), q('kaz', { subject: 'kaz' }), q('matching', { lang: 'ru' })];
  const result = await translateQuestions(list, 'ru', { loadAuth: () => { throw Error('must not authenticate'); } });
  assert.deepEqual(result, list);
});

test('unchanged text uses cached translation, edited source is translated again', async () => {
  let calls = 0;
  const question = q('translation-cache');
  const options = { ...deps, fetcher: async () => { calls++; return ok({ [question.id]: { statement: `Version ${calls}` } }); } };
  assert.equal((await translateQuestions([question], 'ru', options))[0].statement, 'Version 1');
  assert.equal((await translateQuestions([question], 'ru', options))[0].statement, 'Version 1');
  assert.equal((await translateQuestions([{ ...question, statement: 'Жаңа мәтін' }], 'ru', options))[0].statement, 'Version 2');
  assert.equal(calls, 2);
});

test('stalled translation falls back to original and a later retry can succeed', async () => {
  const question = q('translation-timeout'); let signal;
  const result = await translateQuestions([question], 'ru', { ...deps, timeoutMs: 15, fetcher: async (_, options) => { signal = options.signal; return new Promise(() => {}); } });
  assert.equal(signal.aborted, true); assert.equal(result[0].statement, question.statement); assert.equal(result[0].needsTranslation, true);
  const retried = await translateQuestions([question], 'ru', { ...deps, fetcher: async () => ok({ [question.id]: { statement: 'Сколько?' } }) });
  assert.equal(retried[0].statement, 'Сколько?');
});

test('long sessions evict oldest prose rather than accumulating the complete bank in memory', async () => {
  let calls = 0;
  const options = { ...deps, fetcher: async (_, { body }) => { calls++; return ok(Object.fromEntries(JSON.parse(body).items.map(item => [item.id, { statement: 'Перевод' }]))); } };
  const oldest = q('eviction-oldest');
  await translateQuestions([oldest], 'ru', options);
  await translateQuestions(Array.from({ length: 256 }, (_, i) => q(`eviction-${i}`)), 'ru', options);
  const before = calls; await translateQuestions([oldest], 'ru', options); assert.equal(calls, before + 1);
});
