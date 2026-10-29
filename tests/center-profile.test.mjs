import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../frontend/src/firebase.js', import.meta.url), 'utf8');
const body = source.slice(source.indexOf('function applyCenterProfile('), source.indexOf('\nfunction watchChildProfile('));
const merge = vm.runInNewContext(`(${body})`, { Date, expiryMillis: value => Number(value) });
const profile = { name: 'Student', plan: 'free', pro: false };
test('center cabinet membership does not depend on a paid license and cannot grant pro by itself', () => {
  const seat = { active: true, centerId: 'center', groupId: 'group' };
  const result = merge(profile, null, seat);
  assert.equal(result.centerEnrollment.centerId, 'center');
  assert.equal(result.plan, 'free');
  assert.equal(result.pro, false);
  assert.equal(merge(profile, null, { ...seat, active: false }).centerEnrollment, undefined);
  assert.equal(merge(profile, { active: true, expiresAt: Date.now() - 1 }, seat).centerEnrollment.groupId, 'group');
});
test('center license upgrades free access while preserving a higher family plan', () => {
  const license = { active: true, name: 'Center', expiresAt: Date.now() + 60000 };
  const seat = { active: true, centerId: 'center', groupId: 'group' };
  assert.equal(merge(profile, license, seat).plan, 'pro');
  assert.equal(merge({ ...profile, plan: 'mentor', pro: true }, license, seat).plan, 'mentor');
  assert.equal(profile.centerEnrollment, undefined);
});
