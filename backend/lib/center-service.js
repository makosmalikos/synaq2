const { randomBytes, createHash } = require('node:crypto');
const { millis } = require('./plans');
const { readSchedule, mutateSchedule } = require('./center-schedule');

const DAY = 86400000;
const MAX_STUDENTS = 100;
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const id = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const label = (value, max = 100) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const normEmail = (value) => String(value || '').trim().toLowerCase();
const digest = (value) => createHash('sha256').update(value).digest('hex');
const kid = (user) => /^[a-z0-9]+@synaq\.kids$/.test(user?.email || '');
const docs = (snapshot) => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
const canTeach = (staff, group) => staff.role === 'owner' || group.teacherUid === staff.uid;
function synaqAdmin(user) {
  const allowed = [process.env.ADMIN_EMAIL_1 || 'makosmalikos@gmail.com', process.env.ADMIN_EMAIL_2 || 'nurss.aldb@gmail.com'].map(normEmail);
  return user?.admin === true && user.adminAuthVersion === 2 && allowed.includes(normEmail(user.email));
}

// Homework is a target number of distinct verified training questions on a
// topic. Replays, unverified legacy answers and work before enrollment do not
// count. A submission completed after its deadline is explicitly marked late.
function assignmentProgress(assignment, seat, attempts, at = Date.now(), includeQuestionIds = false) {
  const start = Math.max(assignment.createdAt, seat.joinedAt);
  const unique = new Map();
  for (const attempt of attempts) {
    const time = millis(attempt.at);
    if (attempt.verified !== true || typeof attempt.correct !== 'boolean' || !attempt.qid
      || attempt.curriculumTopicKey || attempt.topic !== assignment.topicId || time < start || time > at) continue;
    if (!unique.has(attempt.qid) || time < millis(unique.get(attempt.qid).at)) unique.set(attempt.qid, attempt);
  }
  const answers = [...unique.values()].sort((a, b) => millis(a.at) - millis(b.at)).slice(0, assignment.target);
  const completedAt = answers.length >= assignment.target ? millis(answers.at(-1).at) : null;
  return { ...(includeQuestionIds ? { questionIds: answers.map(a => a.qid) } : {}), answered: answers.length, target: assignment.target,
    accuracy: answers.length ? Math.round(100 * answers.filter(a => a.correct).length / answers.length) : null,
    completedAt, status: completedAt ? completedAt <= assignment.dueAt ? 'completed' : 'late'
      : at > assignment.dueAt ? 'overdue' : answers.length ? 'in_progress' : 'pending' };
}

function createCenterService({ db, now = Date.now, token = () => randomBytes(18).toString('base64url'), topics }) {
  const root = (name, key) => db.collection(name).doc(key);
  const centerRef = (key) => root('centers', key);
  const sub = (centerId, name) => centerRef(centerId).collection(name);
  async function staffContext(reader, user, centerId) {
    if (kid(user) || !id(centerId)) throw fail('not_allowed', 403);
    const membership = (await reader.get(root('centerStaff', user.uid))).data();
    if (!membership?.active || membership.centerId !== centerId) throw fail('not_allowed', 403);
    const center = (await reader.get(centerRef(centerId))).data();
    if (!center) throw fail('center_not_found', 404);
    return { ...membership, uid: user.uid, center };
  }
  async function groupContext(tx, user, body) {
    const staff = await staffContext(tx, user, body.centerId);
    if (!id(body.groupId)) throw fail('invalid_group');
    const group = (await tx.get(sub(body.centerId, 'groups').doc(body.groupId))).data();
    if (!group || !canTeach(staff, group)) throw fail('not_allowed', 403);
    return { staff, group };
  }
  async function childOf(tx, user, childUid) {
    if (kid(user) || !id(childUid)) throw fail('parent_required', 403);
    const index = (await tx.get(root('childIndex', childUid))).data();
    const child = (await tx.get(root('families', user.uid).collection('children').doc(childUid))).data();
    if (index?.parentUid !== user.uid || !child) throw fail('not_child_owner', 403);
    return child;
  }
  const reader = { get: ref => ref.get() };
  async function resultsFor(seat, assignments, at, includeQuestionIds = false) {
    if (!assignments.length) return { progress: {}, truncated: false };
    const earliest = Math.max(seat.joinedAt, Math.min(...assignments.map(a => a.createdAt)));
    const snapshot = await root('results', seat.childUid).collection('attempts')
      .where('at', '>=', new Date(earliest)).orderBy('at', 'asc').limit(1001).get();
    const attempts = docs(snapshot).slice(0, 1000);
    return { progress: Object.fromEntries(assignments.map(a => [a.id, assignmentProgress(a, seat, attempts, at, includeQuestionIds)])), truncated: snapshot.size > 1000 };
  }
  async function studentSnapshot(user, childUid) {
    if (kid(user)) {
      if (childUid && childUid !== user.uid) throw fail('not_allowed', 403);
      childUid = user.uid;
    } else await childOf(reader, user, childUid);
    const seat = (await reader.get(root('centerSeats', childUid))).data();
    if (!seat?.active) return { enrollment: null, assignments: [], students: [], schedule: [] };
    const group = (await reader.get(sub(seat.centerId, 'groups').doc(seat.groupId))).data();
    const center = (await reader.get(centerRef(seat.centerId))).data();
    const license = (await reader.get(root('centerLicenses', seat.centerId))).data();
    if (!group || !center) throw fail('center_not_found', 404);
    const assignments = docs(await sub(seat.centerId, 'assignments').where('groupId', '==', seat.groupId).get())
      .filter(a => a.active && a.createdAt >= now() - 30 * DAY).sort((a, b) => b.createdAt - a.createdAt);
    const result = await resultsFor({ ...seat, childUid }, assignments, now(), true);
    const scheduleData = await readSchedule(db, seat.centerId, seat.groupId, now());
    const teacher = (await reader.get(sub(seat.centerId, 'members').doc(group.teacherUid))).data();
    return { enrollment: { centerId: seat.centerId, centerName: center.name, groupName: group.name, groupId: seat.groupId,
      teacherName: teacher?.active ? teacher.name : '', licensed: license?.active === true && millis(license.expiresAt) > now() }, assignments, ...scheduleData,
      students: [{ childUid, name: seat.name, ...result }] };
  }
  return async function act(user, body) {
    if (!user?.uid || !user.email) throw fail('login_required', 401);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('invalid_body');
    const at = now();
    if (body.action === 'admin_list') {
      if (!synaqAdmin(user)) throw fail('not_allowed', 403);
      const centers = docs(await db.collection('centers').orderBy('createdAt', 'desc').limit(100).get());
      const licenses = await Promise.all(centers.map(c => root('centerLicenses', c.id).get()));
      return { centers: centers.map((c, i) => ({ ...c, license: licenses[i].data() || null })) };
    }
    if (body.action === 'license') {
      if (!synaqAdmin(user)) throw fail('not_allowed', 403);
      if (!id(body.centerId) || typeof body.active !== 'boolean' || !Number.isSafeInteger(body.seatLimit)
        || body.seatLimit < 1 || body.seatLimit > MAX_STUDENTS || !Number.isSafeInteger(body.expiresAt)
        || body.expiresAt <= at || body.expiresAt > at + 366 * DAY) throw fail('invalid_license');
      return db.runTransaction(async tx => {
        const center = (await tx.get(centerRef(body.centerId))).data();
        if (!center) throw fail('center_not_found', 404);
        if (center.studentCount > body.seatLimit) throw fail('seat_limit_below_usage', 409);
        tx.set(root('centerLicenses', body.centerId), { name: center.name, active: body.active,
          seatLimit: body.seatLimit, expiresAt: body.expiresAt, updatedAt: at, updatedBy: user.uid });
        return { ok: true };
      });
    }
    if (body.action === 'student') return studentSnapshot(user, body.childUid);
    if (['schedule_create', 'schedule_update', 'schedule_cancel'].includes(body.action)) return mutateSchedule({ db, user, body, at, groupContext });
    if (body.action === 'workspace') {
      if (kid(user)) throw fail('staff_required', 403);
      const membership = (await reader.get(root('centerStaff', user.uid))).data();
      if (!membership?.active) return { center: null, groups: [], staff: [], assignments: [], students: [], schedule: [], topics: await topics() };
      const staff = await staffContext(reader, user, membership.centerId), centerId = membership.centerId;
      const groups = docs(await sub(centerId, 'groups').get()).filter(g => canTeach(staff, g));
      const selected = groups.find(g => g.id === body.groupId) || groups[0];
      const assignments = selected ? docs(await sub(centerId, 'assignments').where('groupId', '==', selected.id).get())
        .filter(a => a.active && a.createdAt >= at - 30 * DAY).sort((a, b) => b.createdAt - a.createdAt) : [];
      const seats = selected ? docs(await db.collection('centerSeats').where('centerId', '==', centerId).get())
        .filter(s => s.active && s.groupId === selected.id).sort((a, b) => a.name.localeCompare(b.name, 'ru')) : [];
      const students = await Promise.all(seats.map(async s => ({ childUid: s.id, name: s.name, klass: s.klass, ...await resultsFor({ ...s, childUid: s.id }, assignments, at) })));
      const members = docs(await sub(centerId, 'members').get());
      return { center: { id: centerId, name: staff.center.name, studentCount: staff.center.studentCount,
        role: staff.role, license: (await reader.get(root('centerLicenses', centerId))).data() || null },
        groups, selectedGroupId: selected?.id || '', staff: members.filter(m => m.active).map(m => ({ uid: m.id, name: m.name, role: m.role })),
        assignments, students, ...(selected ? await readSchedule(db, centerId, selected.id, at) : { schedule: [], scheduleTruncated: false }), topics: await topics() };
    }
    if (body.action === 'create') {
      if (kid(user) || !label(body.name) || !id(body.id)) throw fail('invalid_center');
      return db.runTransaction(async tx => {
        const existing = (await tx.get(root('centerStaff', user.uid))).data();
        if (existing?.active) {
          if (existing.role === 'owner' && existing.centerId === body.id) return { centerId: existing.centerId };
          throw fail('already_staff', 409);
        }
        const ref = centerRef(body.id);
        if ((await tx.get(ref)).exists) throw fail('id_conflict', 409);
        const membership = { centerId: body.id, role: 'owner', active: true, name: user.name || user.email, email: normEmail(user.email), joinedAt: at };
        tx.create(ref, { name: body.name.trim(), ownerUid: user.uid, ownerEmail: normEmail(user.email), studentCount: 0, groupCount: 0, staffCount: 1, createdAt: at });
        tx.set(root('centerStaff', user.uid), membership);
        tx.set(sub(body.id, 'members').doc(user.uid), membership);
        return { centerId: body.id };
      });
    }
    if (body.action === 'join_staff' || body.action === 'enroll') {
      if (kid(user) || typeof body.code !== 'string' || !/^[A-Za-z0-9_-]{24}$/.test(body.code)) throw fail('invalid_invite');
      return db.runTransaction(async tx => {
        const inviteRef = root('centerInvites', digest(body.code)), invitation = (await tx.get(inviteRef)).data();
        if (!invitation || invitation.expiresAt <= at || invitation.revoked) throw fail('invite_expired', 410);
        const ref = centerRef(invitation.centerId), center = (await tx.get(ref)).data();
        if (!center) throw fail('center_not_found', 404);
        if (body.action === 'join_staff') {
          if (invitation.kind !== 'teacher' || invitation.email !== normEmail(user.email)) throw fail('invite_email_mismatch', 403);
          if (user.email_verified !== true) throw fail('verified_email_required', 403);
          const existing = (await tx.get(root('centerStaff', user.uid))).data();
          if (existing?.active && existing.centerId === invitation.centerId) return { ok: true };
          if (existing?.active || invitation.usedBy) throw fail('already_staff', 409);
          if (center.staffCount >= 20) throw fail('staff_limit', 409);
          const membership = { centerId: invitation.centerId, role: 'teacher', active: true, name: user.name || user.email,
            email: normEmail(user.email), joinedAt: at };
          tx.set(root('centerStaff', user.uid), membership);
          tx.set(sub(invitation.centerId, 'members').doc(user.uid), membership);
          tx.update(inviteRef, { usedBy: user.uid });
          tx.update(ref, { staffCount: center.staffCount + 1 });
          return { ok: true };
        }
        if (invitation.kind !== 'student' || body.consent !== true) throw fail('consent_required');
        const child = await childOf(tx, user, body.childUid);
        const group = (await tx.get(sub(invitation.centerId, 'groups').doc(invitation.groupId))).data();
        if (!group || group.inviteHash !== digest(body.code)) throw fail('invite_expired', 410);
        const seatRef = root('centerSeats', body.childUid), old = (await tx.get(seatRef)).data();
        if (old?.active) {
          if (old.centerId === invitation.centerId && old.groupId === invitation.groupId) return { ok: true };
          throw fail('already_enrolled', 409);
        }
        const license = (await tx.get(root('centerLicenses', invitation.centerId))).data();
        const limit = license?.active === true && license.expiresAt > at ? license.seatLimit : 30;
        if (center.studentCount >= limit) throw fail('seat_limit', 409);
        tx.set(seatRef, { centerId: invitation.centerId, groupId: invitation.groupId, childUid: body.childUid,
          parentUid: user.uid, name: child.name || '', klass: child.klass || '', active: true, joinedAt: at, consentAt: at });
        tx.update(ref, { studentCount: center.studentCount + 1 });
        return { ok: true };
      });
    }
    if (body.action === 'leave') return db.runTransaction(async tx => {
      await childOf(tx, user, body.childUid);
      const ref = root('centerSeats', body.childUid), seat = (await tx.get(ref)).data();
      if (!seat?.active) return { ok: true };
      const center = (await tx.get(centerRef(seat.centerId))).data();
      tx.update(ref, { active: false, leftAt: at });
      if (center) tx.update(centerRef(seat.centerId), { studentCount: Math.max(0, center.studentCount - 1) });
      return { ok: true };
    });
    if (body.action === 'group') {
      if (!id(body.id) || !label(body.name) || !id(body.teacherUid)) throw fail('invalid_group');
      return db.runTransaction(async tx => {
        const staff = await staffContext(tx, user, body.centerId);
        if (staff.role !== 'owner') throw fail('owner_required', 403);
        const teacher = (await tx.get(sub(body.centerId, 'members').doc(body.teacherUid))).data();
        if (!teacher?.active) throw fail('invalid_teacher');
        const ref = sub(body.centerId, 'groups').doc(body.id), previous = (await tx.get(ref)).data();
        if (!previous && staff.center.groupCount >= 30) throw fail('group_limit', 409);
        tx.set(ref, { ...previous, name: body.name.trim(), teacherUid: body.teacherUid, createdAt: previous?.createdAt || at,
          assignmentCount: previous?.assignmentCount || 0 });
        if (!previous) tx.update(centerRef(body.centerId), { groupCount: staff.center.groupCount + 1 });
        return { ok: true };
      });
    }
    if (body.action === 'invite') {
      if (!['student', 'teacher'].includes(body.kind)) throw fail('invalid_invite');
      const code = token(), hash = digest(code);
      return db.runTransaction(async tx => {
        const staff = await staffContext(tx, user, body.centerId);
        let group;
        if (body.kind === 'teacher') {
          if (staff.role !== 'owner') throw fail('owner_required', 403);
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail(body.email)) || body.email.length > 120) throw fail('invalid_email');
        } else ({ group } = await groupContext(tx, user, body));
        const inviteRate = (await tx.get(root('centerInviteRates', body.centerId))).data();
        const day = Math.floor(at / DAY), count = inviteRate?.day === day ? inviteRate.count : 0;
        if (count >= 100) throw fail('rate_limit', 429);
        tx.set(root('centerInviteRates', body.centerId), { day, count: count + 1 });
        tx.create(root('centerInvites', hash), { centerId: body.centerId, kind: body.kind,
          ...(group ? { groupId: body.groupId } : { email: normEmail(body.email) }), createdBy: user.uid, createdAt: at, expiresAt: at + 7 * DAY });
        if (group) tx.update(sub(body.centerId, 'groups').doc(body.groupId), { inviteHash: hash });
        return { code, expiresAt: at + 7 * DAY };
      });
    }
    if (body.action === 'remove_student') return db.runTransaction(async tx => {
      const { group } = await groupContext(tx, user, body);
      if (!id(body.childUid)) throw fail('invalid_student');
      const seatRef = root('centerSeats', body.childUid), seat = (await tx.get(seatRef)).data();
      if (!seat?.active || seat.centerId !== body.centerId || seat.groupId !== body.groupId) throw fail('not_allowed', 403);
      const center = (await tx.get(centerRef(body.centerId))).data();
      tx.update(seatRef, { active: false, leftAt: at });
      tx.update(centerRef(body.centerId), { studentCount: Math.max(0, center.studentCount - 1) });
      return { ok: !!group };
    });
    if (body.action === 'remove_teacher') return db.runTransaction(async tx => {
      const staff = await staffContext(tx, user, body.centerId);
      if (staff.role !== 'owner' || !id(body.teacherUid) || body.teacherUid === user.uid) throw fail('owner_required', 403);
      const memberRef = sub(body.centerId, 'members').doc(body.teacherUid), member = (await tx.get(memberRef)).data();
      if (!member?.active || member.role !== 'teacher') throw fail('invalid_teacher');
      const groups = docs(await tx.get(sub(body.centerId, 'groups'))).filter(g => g.teacherUid === body.teacherUid);
      tx.update(root('centerStaff', body.teacherUid), { active: false });
      tx.update(memberRef, { active: false });
      for (const group of groups) tx.update(sub(body.centerId, 'groups').doc(group.id), { teacherUid: user.uid });
      tx.update(centerRef(body.centerId), { staffCount: Math.max(1, staff.center.staffCount - 1) });
      return { ok: true };
    });
    if (body.action === 'assign') {
      if (!id(body.id) || !label(body.title, 120) || (body.instructions != null && (typeof body.instructions !== 'string' || body.instructions.length > 1000))
        || !Number.isSafeInteger(body.target) || body.target < 1 || body.target > 50
        || !Number.isSafeInteger(body.dueAt) || body.dueAt <= at || body.dueAt > at + 30 * DAY
        || !(await topics()).some(t => t.id === body.topicId && t.count >= body.target)) throw fail('invalid_assignment');
      return db.runTransaction(async tx => {
        const { group } = await groupContext(tx, user, body);
        const ref = sub(body.centerId, 'assignments').doc(body.id), existing = (await tx.get(ref)).data();
        if (existing) {
          if (existing.groupId !== body.groupId || existing.createdBy !== user.uid
            || existing.title !== body.title.trim() || existing.instructions !== (body.instructions || '').trim()
            || existing.topicId !== body.topicId || existing.target !== body.target || existing.dueAt !== body.dueAt) throw fail('id_conflict', 409);
          return { ok: true };
        }
        const recent = docs(await tx.get(sub(body.centerId, 'assignments').where('groupId', '==', body.groupId)))
          .filter(a => a.active && a.createdAt >= at - 30 * DAY);
        if (recent.length >= 100) throw fail('assignment_limit', 409);
        tx.create(ref, { groupId: body.groupId, title: body.title.trim(), instructions: (body.instructions || '').trim(),
          topicId: body.topicId, target: body.target, dueAt: body.dueAt, createdAt: at, createdBy: user.uid, active: true });
        tx.update(sub(body.centerId, 'groups').doc(body.groupId), { assignmentCount: group.assignmentCount + 1 });
        return { ok: true };
      });
    }
    if (body.action === 'archive_assignment') return db.runTransaction(async tx => {
      await groupContext(tx, user, body);
      if (!id(body.id)) throw fail('invalid_assignment');
      const ref = sub(body.centerId, 'assignments').doc(body.id), assignment = (await tx.get(ref)).data();
      if (!assignment || assignment.groupId !== body.groupId) throw fail('not_allowed', 403);
      tx.update(ref, { active: false, archivedAt: at });
      return { ok: true };
    });
    throw fail('unknown_action');
  };
}

module.exports = { createCenterService, assignmentProgress, synaqAdmin };
