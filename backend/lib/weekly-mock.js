const crypto = require('node:crypto');

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PRICE_KZT = 2500;

function weeklyWindow(at = Date.now()) {
  const local = new Date(at + ALMATY_OFFSET_MS);
  const sinceMonday = (local.getUTCDay() + 6) % 7;
  const mondayLocalUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - sinceMonday);
  const startsAt = mondayLocalUtc - ALMATY_OFFSET_MS;
  const endsAt = startsAt + WEEK_MS;
  return { weekKey: new Date(mondayLocalUtc).toISOString().slice(0, 10), startsAt, endsAt };
}

function validWeekKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function passId(parentUid, weekKey) {
  return crypto.createHash('sha256').update(`${parentUid}:${weekKey}`).digest('hex');
}

function deterministicOrder(items, seed) {
  return [...items].sort((a, b) => {
    const left = crypto.createHash('sha256').update(`${seed}:${a.id}`).digest('hex');
    const right = crypto.createHash('sha256').update(`${seed}:${b.id}`).digest('hex');
    return left.localeCompare(right) || String(a.id).localeCompare(String(b.id));
  });
}

module.exports = { ALMATY_OFFSET_MS, WEEK_MS, PRICE_KZT, weeklyWindow, validWeekKey, passId, deterministicOrder };
