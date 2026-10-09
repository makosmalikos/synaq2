import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewedBilArchive } from '../frontend/src/reviewedBilArchive.js';
import { POOL } from '../frontend/src/bank.js';

const byId = new Map(reviewedBilArchive.map((question) => [question.id, question]));
const math = (number) => byId.get(`bil_archive_m_${String(number).padStart(4, '0')}`);
const logic = (number) => byId.get(`bil_archive_l_${String(number).padStart(4, '0')}`);

test('reviewed archive is published with unique, gradable questions', () => {
  assert.equal(byId.size, reviewedBilArchive.length);
  for (const question of reviewedBilArchive) {
    assert.equal(POOL.find((item) => item.id === question.id)?.school, 'БИЛ');
    assert.ok(question.statement?.trim());
    assert.ok(question.solution?.trim());
    assert.ok(question.answer?.trim());
    if (question.options) assert.ok(question.options.includes(question.answer));
    assert.equal(question.image, undefined);
  }
});

test('known corrupted archive answers use independently calculated values', () => {
  assert.equal(math(11).answer, String(56 * 0.16).replace('.', ','));
  assert.equal(math(12).answer, String(16 * 0.56).replace('.', ','));
  assert.equal(math(19).answer, (22 * 0.55 * 1.7).toFixed(2).replace('.', ','));
  assert.equal(math(22).answer, '3');
  assert.equal(math(32).answer, String((7 * 7 - 3 * 3) / ((4 * 4 + 3 * 3) * 0.1)));
  assert.equal(math(34).answer, 'В');
  assert.equal(math(35).answer, 'Тең');
  assert.equal(logic(9).answer, '15');
  assert.equal(logic(12).answer, '2');
  assert.equal(logic(20).answer, String(29 - (-14) + 1));
  assert.equal(logic(21).answer, String(Math.round(3 / (3 / 4 - 2 / 3))));
  assert.equal(logic(23).answer, '0');
  assert.equal(math(99).answer, 'B және D');
});

test('incomplete source records are not exposed as questions', () => {
  for (const id of ['bil_archive_m_0010', 'bil_archive_m_0036', 'bil_archive_l_0002', 'bil_archive_l_0003', 'bil_archive_l_0007', 'bil_archive_l_0013', 'bil_archive_l_0018']) {
    assert.equal(byId.has(id), false, id);
  }
  assert.match(math(5).statement, /бәрі.*кемінде біреуін/);
  assert.ok(reviewedBilArchive.every((question) => !/СУРЕТ ҚАЖЕТ|Сұрақ №/.test(question.statement)));
});
