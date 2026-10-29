const { familyPlan, hasFullAccess, millis } = require('./plans');

// Membership and licenses are server-owned. A group invitation never grants
// paid access; only a Synaq administrator can activate a center license.
async function centerAccess(db, uid, tx = null, at = Date.now()) {
  const read = (ref) => tx ? tx.get(ref) : ref.get();
  const seat = (await read(db.collection('centerSeats').doc(uid))).data();
  if (!seat?.active || typeof seat.centerId !== 'string' || seat.centerId.includes('/')) return null;
  const license = (await read(db.collection('centerLicenses').doc(seat.centerId))).data();
  const expiresAt = millis(license?.expiresAt);
  return license?.active === true && Number.isFinite(expiresAt) && expiresAt > at
    ? { centerId: seat.centerId, centerName: license.name, expiresAt } : null;
}

async function learningFamily(db, uid, family, tx = null, at = Date.now()) {
  if (hasFullAccess(familyPlan(family, at))) return family;
  const access = await centerAccess(db, uid, tx, at);
  return access ? { ...family, plan: 'pro', planExpiresAt: new Date(access.expiresAt) } : family;
}

module.exports = { centerAccess, learningFamily };
