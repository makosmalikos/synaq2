import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderEdition, verifyEdition } from '../scripts/editorial/grade6-absolute-equations-models.mjs';
import { mathFragments } from '../frontend/src/mathPresentation.js';

const pack = JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-absolute-equations.json', import.meta.url), 'utf8'));
const rows = pack.editions;
const keys = ['9 нүктесінен 4 бірлік қашықтықтағы нүктелер', '|x| = -7', '-2,5; 9,5', 'x - 7 = 3 немесе x - 7 = -3', '7', '5', '-8; -4', '-11; 11', '15', '7', '-8; 8', '9', '10', '2'];
const decimal = x => Number(x.replace(',', '.'));
const roots = s => s.split('; ').map(decimal);
const exactRoots = (center, radius) => radius < 0 ? [] : radius === 0 ? [center] : [center - radius, center + radius];

test('all14 hand answers keep closed Standard access and complete source roles', () => {
  assert.equal(rows.length, 14);
  rows.forEach((r, i) => {
    assert.equal(r.answer, keys[i]);
    assert.equal(verifyEdition(r).answer, keys[i]);
    assert.equal(r.minimumPlan, 'pro'); assert.equal(r.grade, 6);
    assert.equal(r.editorialStatus, 'draft'); assert.equal(r.topic, 'eq');
    if (r.options) assert.equal(r.options.filter(o => o === keys[i]).length, 1);
  });
});

test('absolute distance has exactly zero, one or two roots, including shifted negative centers', () => {
  let checked = 0;
  for (let c = -30; c <= 30; c++) for (let radius = -5; radius <= 20; radius++) {
    const expected = exactRoots(c, radius);
    const observed = [];
    for (let x = -55; x <= 55; x++) if (Math.abs(x - c) === radius) observed.push(x);
    assert.deepEqual(observed, expected);
    assert.equal(expected.length, radius < 0 ? 0 : radius === 0 ? 1 : 2);
    checked++;
  }
  assert.equal(checked, 1586);
  assert.match(rows[0].solution, /9 - 4 = 5 және 9 \+ 4 = 13/);
  assert.deepEqual(exactRoots(9, 4), [5, 13]);
  assert.notDeepEqual(exactRoots(-9, 4), [5, 13]);
  assert.notDeepEqual(exactRoots(4, 9), [5, 13]);
});

test('negative target is impossible while zero target and negative variable have valid roots', () => {
  assert.deepEqual(rows[1].options, ['|x| = 0', '|x| = -7', '|-x| = 7', '|x| = 7']);
  assert.deepEqual(exactRoots(0, -7), []);
  assert.deepEqual(exactRoots(0, 0), [0]);
  for (let x = -100; x <= 100; x++) assert.ok(Math.abs(-x) === Math.abs(x));
  assert.deepEqual(roots(rows[7].answer), [-11, 11]);
  assert.deepEqual(roots(rows[10].answer), [-8, 8]);
});

test('decimal center and both signed roots checked with integer tenths, not rounded floating comparisons', () => {
  const scaled = roots(rows[2].answer).map(x => x * 10);
  assert.deepEqual(scaled, [-25, 95]);
  for (const x of scaled) assert.equal(Math.abs(x - 35), 60);
  const valid = rows[2].options.filter(o => {
    const candidates = roots(o).map(x => x * 10);
    return candidates.length === 2 && new Set(candidates).size === 2 && candidates.every(x => Math.abs(x - 35) === 60);
  });
  assert.deepEqual(valid, [rows[2].answer]);
  let domains = 0;
  for (let center = 1; center < 100; center++) if (center % 10) for (let d = 1; d <= 20; d++) if (center < d * 10) {
    const out = renderEdition({ ...rows[2], params: { centerTenths: center, distance: d } });
    assert.deepEqual(roots(out.answer).map(x => Math.round(x * 10)), [center - d * 10, center + d * 10]);
    domains++;
  }
  assert.ok(domains > 1000);
});

test('definition changes right side sign and keeps the entire inner expression in both branches', () => {
  assert.deepEqual(rows[3].options, [
    'x - 7 = 3 немесе x - 7 = -3',
    'x - 7 = 3 немесе x + 7 = 3',
    'x - 7 = 3 немесе x - 7 = 0',
    'x = 3 немесе x = -3',
  ]);
  assert.deepEqual(exactRoots(7, 3), [4, 10]);
  for (let x = -30; x <= 30; x++) assert.equal(Math.abs(x - 7) === 3, x - 7 === 3 || x - 7 === -3);
  assert.notEqual(Math.abs(-4 - 7) === 3, -4 - 7 === 3 || -4 + 7 === 3);
});

test('smaller larger and positive requests choose from the whole root set rather than dropping a branch', () => {
  assert.equal(Math.min(...exactRoots(12, 5)), Number(rows[4].answer));
  assert.equal(Math.max(...exactRoots(4, 11)), Number(rows[8].answer));
  assert.equal(exactRoots(-8, 13).filter(x => x > 0).at(0), Number(rows[5].answer));
  assert.deepEqual(exactRoots(-6, 2), roots(rows[6].answer));
  for (let offset = 2; offset <= 30; offset++) for (let d = 1; d < offset; d++) {
    const out = renderEdition({ ...rows[6], params: { offset, distance: d } });
    assert.deepEqual(roots(out.answer), [-offset - d, -offset + d]);
    assert.ok(roots(out.answer).every(x => x < 0));
    const valid = out.options.filter(o => {
      const candidate = roots(o);
      return candidate.length === 2 && new Set(candidate).size === 2 && candidate.every(x => Math.abs(x + offset) === d);
    });
    assert.deepEqual(valid, [out.answer]);
  }
});

test('subtracting the smaller negative root doubles radius and outside addition is removed first', () => {
  assert.equal(35 - (-35), Number(rows[9].answer) * 10);
  assert.notEqual(35 - 35, Number(rows[9].answer) * 10);
  for (let radius = 5; radius < 100; radius += 10) {
    const out = renderEdition({ ...rows[9], params: { radiusTenths: radius } });
    assert.equal(Number(out.answer) * 10, radius - (-radius));
  }
  assert.equal(Math.abs(Number(rows[11].answer)) + 5, 14);
  assert.equal(Math.abs(-9) + 5, 14);
  assert.notEqual(Math.abs(14) + 5, 14);
  assert.equal(Math.abs(Number(rows[12].answer) - 10), 0);
  assert.equal(new Set(exactRoots(10, 0)).size, 1);
});

test('listed candidate substitution has exactly one valid option although full equation has two roots', () => {
  assert.deepEqual(rows[13].options, ['-2', '2', '12', '-7']);
  assert.deepEqual(rows[13].options.map(x => Math.abs(Number(x) + 5)), [3, 7, 17, 2]);
  assert.deepEqual(exactRoots(-5, 7), [-12, 2]);
  assert.deepEqual(rows[13].options.filter(x => Math.abs(Number(x) + 5) === 7), [rows[13].answer]);
  assert.ok(!rows[13].options.includes('-12'));
});

test('allcontent edits missing parameters and invalid radius or selection domains fail closed', () => {
  for (const r of rows) {
    for (const field of ['statement', 'answer', 'solution']) assert.throws(() => verifyEdition({ ...r, [field]: r[field] + 'changed' }));
    if (r.options) assert.throws(() => verifyEdition({ ...r, options: r.options.slice().reverse() }));
    for (const key of Object.keys(r.params)) {
      const p = { ...r.params }; delete p[key];
      assert.throws(() => renderEdition({ ...r, params: p }));
    }
  }
  for (const [index, patch] of [[0, { center: 4 }], [1, { distance: 0 }], [2, { centerTenths: 40 }], [2, { centerTenths: 65 }], [3, { distance: -1 }], [4, { center: 0 }], [5, { offset: 13 }], [6, { distance: 6 }], [7, { distance: 0 }], [8, { distance: 1.5 }], [9, { radiusTenths: 30 }], [9, { radiusTenths: 34 }], [10, { distance: -8 }], [11, { total: 5 }], [12, { center: 0 }], [13, { distance: 5 }]]) {
    assert.throws(() => renderEdition({ ...rows[index], params: { ...rows[index].params, ...patch } }));
  }
});

test('absolute notation remains native plain text and exactly all14 saved nonvisual sources are covered', () => {
  const source = JSON.parse(fs.readFileSync(new URL('../problems/sources/zerek/courses/6-math-4-3-level1.json', import.meta.url), 'utf8'));
  const saved = source.questions.filter(q => !q.images?.length && !q.svg?.length);
  assert.deepEqual(rows.flatMap(r => r.sourceRefs.map(x => x.sourceId)).sort(), saved.map(q => q.id).sort());
  for (const r of rows) {
    const old = saved.find(q => q.id === r.sourceRefs[0].sourceId);
    assert.equal(old.checked, true); assert.notEqual(old.statement.normalize('NFKC'), r.statement.normalize('NFKC'));
    for (const text of [r.statement, r.solution, r.answer, ...r.options || []]) {
      assert.doesNotMatch(text, /[\\$]|NaN|Infinity/);
      assert.ok(mathFragments(text).every(n => n.type !== 'table'));
    }
  }
  assert.match(pack.scope, /Closed author draft/);
});
