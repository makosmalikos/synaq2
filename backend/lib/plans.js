const PLAN_CATALOG = require('../../shared/plans.json');
const PLAN_RANK = Object.freeze(Object.fromEntries(
  Object.entries(PLAN_CATALOG).map(([plan, settings]) => [plan, settings.rank]),
));

function millis(value) {
  return value?.toMillis?.() ?? (value instanceof Date ? value.getTime()
    : typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : 0);
}

function validPlan(value) {
  return Object.prototype.hasOwnProperty.call(PLAN_RANK, value) ? value : null;
}

function familyPlan(family, at = Date.now()) {
  if (!family || typeof family !== 'object') return 'free';
  const explicit = validPlan(family.plan);
  const plan = explicit || (family.pro === true ? 'pro' : 'free');
  const rawExpiry = family.planExpiresAt ?? family.proExpiresAt;
  if (rawExpiry == null) return plan;
  const expiry = millis(rawExpiry);
  return Number.isFinite(expiry) && expiry > at ? plan : 'free';
}

function planRank(plan) {
  return PLAN_RANK[validPlan(plan) || 'free'];
}

function hasAtLeast(family, required, at = Date.now()) {
  return planRank(familyPlan(family, at)) >= planRank(required);
}

function dailyTaskLimit(plan) {
  return PLAN_CATALOG[validPlan(plan) || 'free'].tasksPerDay;
}

module.exports = { PLAN_CATALOG, PLAN_RANK, millis, validPlan, familyPlan, planRank, hasAtLeast, dailyTaskLimit };
