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

// A child signs in with "<code>@synaq.kids" plus a PIN that the parent picks, and
// Firebase Auth has no app-level lockout, so trivially guessable PINs are
// rejected on the server (reported as `weak_password`, which the existing
// sign-up and PIN-reset screens already translate).
const COMMON_PINS = new Set([
  '123456', '1234567', '12345678', '123456789', '1234567890', '654321', '111111', '000000',
  '121212', '123123', '112233', '159753', '147258', '696969', '987654', '987654321',
  'password', 'password1', 'qwerty', 'qwerty123', 'qwertyuiop', 'asdfgh', 'asdfghjkl',
  'abcdef', 'abc123', 'iloveyou', 'admin123', 'synaq', 'synaq123', 'qazwsx', 'zxcvbn',
]);

function isWeakPin(pin, code = '') {
  const value = String(pin ?? '');
  const lower = value.toLowerCase();
  if (value.length < 6) return true;
  const codes = [...lower].map((char) => char.codePointAt(0));
  const step = codes[1] - codes[0];
  const repeated = codes.every((c) => c === codes[0]);
  // 123456, 345678, 987654 ... (always +1 or always -1 in char code)
  const sequence = Math.abs(step) === 1 && codes.every((c, i) => i === 0 || c - codes[i - 1] === step);
  if (repeated || sequence || COMMON_PINS.has(lower)) return true;
  // A PIN equal to the login code is the first thing anyone would try.
  const login = String(code || '').trim().toLowerCase().replace(/@synaq\.kids$/, '');
  return !!login && lower === login;
}

module.exports = { PLAN_CATALOG, PLAN_RANK, millis, validPlan, familyPlan, planRank, hasAtLeast, dailyTaskLimit, isWeakPin };
