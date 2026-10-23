import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MODEL_IDS, verifyEdition } from '../scripts/editorial/fraction-models.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const rows = JSON.parse(fs.readFileSync(new URL('../problems/editorial/synaq-standard-fractions.json', import.meta.url), 'utf8'));

// This oracle does NOT call buildEdition/renderEdition/verifyEdition to calculate
// expected answers. It reconstructs discrete inventories, searches candidate
// unknowns, or simulates time/price changes from the independent word model.
function onlyInteger(from, to, predicate, label) {
  const matches = [];
  for (let n = from; n <= to; n++) if (predicate(n)) matches.push(n);
  assert.equal(matches.length, 1, `${label}: expected one physically possible integer`);
  return matches[0];
}
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => a / gcd(a, b) * b;

function independentAnswer(row) {
  const p = row.params;
  switch (row.modelId) {
    case 'fraction-unit-capacity':
      return onlyInteger(1, p.total, signs => signs * p.perUnit * p.denominator === p.total * p.numerator, 'LED stock allocation');
    case 'inverse-fraction-remaining': {
      const whole = onlyInteger(p.knownPart + 1, p.knownPart * p.denominator,
        stops => stops * p.numerator === p.knownPart * p.denominator, 'Map stop count');
      return whole - p.knownPart;
    }
    case 'same-whole-two-shares-capacity':
      return onlyInteger(1, p.total, pieces => (p.total - pieces * p.pieceLength) * p.firstDenominator * p.secondDenominator
        === p.total * (p.firstNumerator * p.secondDenominator + p.secondNumerator * p.firstDenominator), 'Thread inventory balance');
    case 'mixed-mass-consumption-conversion': {
      // Integer ticks of the smallest common kg measure, rather than rational
      // subtraction from the authoring solver.
      const ticksPerKg = [p.blueDenominator, p.whiteDenominator, p.perItemDenominator].reduce(lcm, 1);
      const stockTicks = p.blueWhole * ticksPerKg + p.blueNumerator * ticksPerKg / p.blueDenominator
        + p.whiteWhole * ticksPerKg + p.whiteNumerator * ticksPerKg / p.whiteDenominator;
      const consumedTicks = p.items * p.perItemNumerator * ticksPerKg / p.perItemDenominator;
      assert.ok(stockTicks > consumedTicks);
      assert.equal(1000 % ticksPerKg, 0, 'Every tick is an integer number of grams in this edition');
      return (stockTicks - consumedTicks) * (1000 / ticksPerKg);
    }
    case 'different-wholes-share-comparison': {
      const firstRead = onlyInteger(1, p.firstPages, pages => pages * p.firstDenominator === p.firstPages * p.firstNumerator, 'First book pages');
      const secondRead = onlyInteger(1, p.secondPages, pages => pages * p.secondDenominator === p.secondPages * p.secondNumerator, 'Second book pages');
      assert.ok(secondRead > firstRead);
      return secondRead - firstRead;
    }
    case 'complementary-shares-difference':
      return onlyInteger(1, p.unsoldExcess * p.partDenominator, tickets => {
        if (tickets * p.partNumerator % p.partDenominator !== 0) return false;
        const sold = tickets * p.partNumerator / p.partDenominator;
        return (tickets - sold) - sold === p.unsoldExcess;
      }, 'Sold and unsold tickets');
    case 'nested-percent-selection': {
      const robotics = onlyInteger(1, p.total, count => count * 100 === p.total * p.firstPercent, 'Festival first group');
      return onlyInteger(1, robotics, count => count * 100 === robotics * p.secondPercent, 'Festival conditional group');
    }
    case 'inverse-discount-fixed-fee':
      return onlyInteger(1, p.paid * 100, original => original * (100 - p.discountPercent) + p.delivery * 100 === p.paid * 100,
        'Original price reproduces the complete paid receipt');
    case 'sequential-relative-price-changes': {
      // An explicit money ledger in hundredths of a tenge, independently of the
      // multiplicative-rational expression in the authoring model.
      const original = p.originalPrice * 100;
      const increase = original * p.increasePercent / 100;
      assert.ok(Number.isInteger(increase));
      const raised = original + increase;
      const discount = raised * p.discountPercent / 100;
      assert.ok(Number.isInteger(discount));
      const final = raised - discount;
      assert.ok(final > original);
      assert.equal((final - original) % 100, 0);
      return (final - original) / 100;
    }
    case 'dilution-solute-conservation': {
      const allMass = p.initialMass + p.addedWater;
      return onlyInteger(1, p.initialPercent - 1, newPercent => newPercent * allMass === p.initialMass * p.initialPercent,
        'The original solute mass is conserved');
    }
    case 'three-way-ratio-budget-difference': {
      const units = onlyInteger(1, p.total, scale => p.weights.reduce((sum, w) => sum + scale * w, 0) === p.total, 'Conserved three-part budget');
      const allocations = p.weights.map(w => units * w);
      assert.equal(allocations.reduce((sum, amount) => sum + amount, 0), p.total);
      return allocations[1] - allocations[0];
    }
    case 'ratio-scale-from-difference': {
      const smaller = onlyInteger(1, p.difference * p.largerWeight, mass =>
        (mass + p.difference) * p.smallerWeight === mass * p.largerWeight, 'Two collected masses');
      return smaller + (smaller + p.difference);
    }
    case 'inverse-resource-after-elapsed-use': {
      let remaining = p.initialPeople * p.initialDays;
      for (let day = 0; day < p.elapsedDays; day++) remaining -= p.initialPeople;
      const people = p.initialPeople + p.addedPeople;
      return onlyInteger(1, p.initialDays, days => days * people === remaining, 'Remaining person-day inventory');
    }
    case 'piecewise-joint-production': {
      let items = 0;
      for (let minute = 0; minute < p.togetherMinutes + p.secondAloneMinutes; minute++) {
        if (minute < p.togetherMinutes) items += p.firstRate;
        items += p.secondRate;
      }
      return items;
    }
    case 'unit-price-from-two-differences':
      return onlyInteger(1, p.largerPayment, price => p.largerPayment % price === 0 && p.smallerPayment % price === 0
        && p.largerPayment / price - p.smallerPayment / price === p.countDifference, 'Identical marker unit price');
    case 'meeting-with-delayed-departure':
      return onlyInteger(1, p.distance * 60, minute => {
        // Positions are measured in 1/60 km. The first tourist has walked the
        // delay plus these minutes; the second has walked only these minutes.
        const fromLeft = p.firstSpeed * (p.delayMinutes + minute);
        const fromRight = p.distance * 60 - p.secondSpeed * minute;
        return fromLeft === fromRight;
      }, 'Meeting of the two independently tracked positions');
    case 'river-round-trip-time': {
      const downMinutes = onlyInteger(1, p.distanceEachWay * 60, minute =>
        (p.stillSpeed + p.currentSpeed) * minute === p.distanceEachWay * 60, 'Outward leg distance');
      const upMinutes = onlyInteger(1, p.distanceEachWay * 60, minute =>
        (p.stillSpeed - p.currentSpeed) * minute === p.distanceEachWay * 60, 'Return leg distance');
      assert.equal((downMinutes + upMinutes) % 60, 0);
      return (downMinutes + upMinutes) / 60;
    }
    default: throw Error(`Missing independent word-model oracle: ${row.modelId}`);
  }
}

test('pilot has 17 authored editions: six fractions, four percentages, seven ratio/work/motion models', () => {
  assert.equal(rows.length, 17);
  assert.equal(new Set(rows.map(row => row.editionId)).size, 17);
  assert.equal(new Set(rows.map(row => row.modelId)).size, 17);
  assert.deepEqual(new Set(rows.map(row => row.modelId)), new Set(MODEL_IDS));
  assert.equal(rows.filter(row => row.topic === 'frac').length, 6);
  assert.equal(rows.filter(row => row.topic === 'pct').length, 4);
  assert.equal(rows.filter(row => ['ratio', 'work'].includes(row.topic)).length, 7);
});

for (const row of rows) {
  test(`${row.editionId}: independently solved, unique, and matched to exact rendered givens`, () => {
    const expected = String(independentAnswer(row));
    assert.equal(row.answer, expected, 'Editorial key disagrees with the independent word model');
    const verified = verifyEdition(row);
    assert.equal(verified.answer, expected);
    assert.ok(verified.checks.length >= 4 && verified.checks.every(check => typeof check === 'string' && check.length > 5));
    assert.ok(row.statement.length > 100 && row.solution.length > 100);
    assert.ok(/[әіңғүұқөһ]/i.test(row.statement));
    assert.equal(row.image, undefined, 'Every condition in this text-only pilot must be self-contained');
    assert.equal(row.options, undefined);
  });

  test(`${row.editionId}: text/parameter drift and foreign provenance are rejected`, () => {
    assert.throws(() => verifyEdition({ ...row, statement: row.statement + ' Қосымша шарт.' }), /Statement/);
    assert.throws(() => verifyEdition({ ...row, solution: row.solution + '\n0 = 1.' }), /Solution/);
    const changed = structuredClone(row);
    const key = Object.keys(changed.params).find(key => Number.isInteger(changed.params[key]));
    changed.params[key] += 1;
    assert.throws(() => verifyEdition(changed), 'Changed numeric givens must require re-render/review');
    assert.throws(() => verifyEdition({ ...row, sourceRefs: [{ ...row.sourceRefs[0], sourceId: '0000000000000000' }] }), /references/);
    assert.throws(() => verifyEdition({ ...row, adaptationChanges: [] }), /disclosure/);
  });
}

test('all cited archival tasks exist and conditions differ beyond replacing numbers', () => {
  const cache = new Map();
  const skeleton = text => text.toLowerCase().replace(/\d+(?:[.,]\d+)?/g, '#').replace(/[^\p{L}#]+/gu, ' ').trim();
  for (const row of rows) for (const ref of row.sourceRefs) {
    assert.match(ref.sourceFile, /^problems\/sources\/zerek\/courses\/[456]-math-[a-z0-9-]+\.json$/);
    if (!cache.has(ref.sourceFile)) cache.set(ref.sourceFile, JSON.parse(fs.readFileSync(root + ref.sourceFile, 'utf8')));
    const source = cache.get(ref.sourceFile);
    assert.equal(source.status, 'captured');
    const original = source.questions.find(question => question.id === ref.sourceId);
    assert.ok(original?.checked && original.sourceAnswer, `${row.editionId}: missing checked source reference`);
    assert.notEqual(skeleton(row.statement), skeleton(original.statement));
    assert.notEqual(row.solution, original.solution);
  }
  // A different numeric skeleton is only a mechanical-copy check. It is NOT
  // evidence that numeric variants constitute different mathematical meanings.
});

test('physically invalid fractional/percentage/time models cannot be published', () => {
  const change = (modelId, patch) => {
    const row = rows.find(row => row.modelId === modelId);
    assert.throws(() => verifyEdition({ ...row, params: { ...row.params, ...patch } }));
  };
  change('fraction-unit-capacity', { denominator: 0 });
  change('same-whole-two-shares-capacity', { firstNumerator: 15 });
  change('mixed-mass-consumption-conversion', { items: 100 });
  change('different-wholes-share-comparison', { firstPages: 600 });
  change('complementary-shares-difference', { partNumerator: 5 });
  change('nested-percent-selection', { firstPercent: 100 });
  change('inverse-discount-fixed-fee', { delivery: 12000 });
  change('sequential-relative-price-changes', { discountPercent: 99 });
  change('dilution-solute-conservation', { addedWater: 0 });
  change('three-way-ratio-budget-difference', { weights: [3, 0, 4] });
  change('ratio-scale-from-difference', { smallerWeight: 8 });
  change('inverse-resource-after-elapsed-use', { elapsedDays: 15 });
  change('piecewise-joint-production', { firstRate: 0 });
  change('unit-price-from-two-differences', { countDifference: 0 });
  change('meeting-with-delayed-departure', { firstSpeed: 100 });
  change('river-round-trip-time', { currentSpeed: 15 });
});
