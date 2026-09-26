const test = require('node:test');
const assert = require('node:assert/strict');
const { PLAN_CATALOG, familyPlan, hasAtLeast, dailyTaskLimit } = require('../backend/lib/plans');

const NOW = Date.parse('2026-09-26T00:00:00Z');

test('three-tier plan resolver preserves legacy Pro and fails expired or malformed grants closed', () => {
  assert.equal(familyPlan(null, NOW), 'free');
  assert.equal(familyPlan({ plan: 'standard' }, NOW), 'standard');
  assert.equal(familyPlan({ plan: 'pro' }, NOW), 'pro');
  assert.equal(familyPlan({ pro: true }, NOW), 'pro');
  assert.equal(familyPlan({ plan: 'standard', planExpiresAt: new Date(NOW + 1000) }, NOW), 'standard');
  assert.equal(familyPlan({ plan: 'standard', planExpiresAt: new Date(NOW - 1) }, NOW), 'free');
  assert.equal(familyPlan({ plan: 'pro', planExpiresAt: 'invalid' }, NOW), 'free');
  assert.equal(familyPlan({ plan: 'vip', pro: false }, NOW), 'free');
});

test('plan capabilities and task limits increase monotonically', () => {
  assert.deepEqual(Object.keys(PLAN_CATALOG), ['free', 'standard', 'pro']);
  assert.deepEqual(Object.values(PLAN_CATALOG).map((plan) => plan.priceKzt), [0, 2990, 5999]);
  assert.equal(dailyTaskLimit('free'), 5);
  assert.equal(dailyTaskLimit('standard'), 20);
  assert.equal(dailyTaskLimit('pro'), null);
  assert.equal(hasAtLeast({ plan: 'standard' }, 'standard', NOW), true);
  assert.equal(hasAtLeast({ plan: 'standard' }, 'pro', NOW), false);
  assert.equal(hasAtLeast({ pro: true }, 'standard', NOW), true);
});
