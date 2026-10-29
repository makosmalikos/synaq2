const DAY = 86400000;
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const text = (value, max, required = false) => typeof value === 'string' && value.trim().length <= max && (!required || value.trim().length > 0);
const safeLink = value => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
};
function lessonFields(body, at) {
  const { title, startsAt, endsAt, location = '', meetingUrl = '', notes = '' } = body;
  if (!text(title, 120, true) || !text(location, 200) || !text(notes, 1000) || !text(meetingUrl, 500) || !safeLink(meetingUrl)
    || !Number.isSafeInteger(startsAt) || !Number.isSafeInteger(endsAt) || startsAt <= at || startsAt > at + 90 * DAY
    || endsAt - startsAt < 15 * 60000 || endsAt - startsAt > 240 * 60000) throw fail('invalid_lesson');
  return { title: title.trim(), startsAt, endsAt, location: location.trim(), meetingUrl: meetingUrl.trim(), notes: notes.trim() };
}
const overlaps = (a, b) => a.startsAt < b.endsAt && b.startsAt < a.endsAt;
const same = (a, b) => Object.keys(b).every(key => a[key] === b[key]);
const scheduleCollection = (db, centerId, groupId) => db.collection('centers').doc(centerId).collection('groups').doc(groupId).collection('schedule');
async function readSchedule(db, centerId, groupId, at) {
  const snapshot = await scheduleCollection(db, centerId, groupId).where('startsAt', '>=', at - 7 * DAY).where('startsAt', '<', at + 90 * DAY + 1).orderBy('startsAt').limit(1001).get();
  return { schedule: snapshot.docs.slice(0, 1000).map(doc => ({ id: doc.id, ...doc.data() })), scheduleTruncated: snapshot.size > 1000 };
}
async function mutateSchedule({ db, user, body, at, groupContext }) {
  if (typeof body.id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(body.id)) throw fail('invalid_lesson');
  const creating = body.action === 'schedule_create', cancelling = body.action === 'schedule_cancel';
  const fields = cancelling ? null : lessonFields(body, at);
  const weeks = creating ? body.weeks ?? 1 : 1;
  if (!Number.isSafeInteger(weeks) || weeks < 1 || weeks > 12 || (fields && fields.startsAt + (weeks - 1) * 7 * DAY > at + 90 * DAY)) throw fail('invalid_lesson');
  return db.runTransaction(async tx => {
    await groupContext(tx, user, body);
    const collection = scheduleCollection(db, body.centerId, body.groupId);
    const events = [];
    for (let i = 0; i < weeks; i++) {
      const ref = collection.doc(creating ? `${body.id}_${i}` : body.id);
      const previous = (await tx.get(ref)).data();
      const next = fields && { ...fields, startsAt: fields.startsAt + i * 7 * DAY, endsAt: fields.endsAt + i * 7 * DAY };
      if (creating && previous && !same(previous, { ...next, seriesId: body.id, seriesWeeks: weeks })) throw fail('id_conflict', 409);
      if (!creating && !previous) throw fail('lesson_not_found', 404);
      if (!creating && (!Number.isSafeInteger(body.version) || previous.version !== body.version)) throw fail('lesson_changed', 409);
      if (!creating && (previous.status === 'cancelled' || previous.startsAt <= at)) throw fail('lesson_closed', 409);
      events.push({ ref, previous, next });
    }
    if (creating && events.every(event => event.previous)) return { ok: true };
    if (creating && events.some(event => event.previous)) throw fail('id_conflict', 409);
    const upcoming = (await tx.get(collection.where('startsAt', '>=', at - DAY))).docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const others = upcoming.filter(event => event.status !== 'cancelled' && event.endsAt > at && !events.some(e => e.ref.path.endsWith('/' + event.id)));
    if (!cancelling && others.length + weeks > 200) throw fail('schedule_limit', 409);
    if (!cancelling && events.some(event => others.some(other => overlaps(event.next, other)))) throw fail('lesson_overlap', 409);
    for (const event of events) {
      tx.set(event.ref, { ...event.previous, ...event.next, status: cancelling ? 'cancelled' : 'scheduled',
        version: (event.previous?.version || 0) + 1, createdAt: event.previous?.createdAt || at, updatedAt: at, updatedBy: user.uid,
        ...(creating ? { seriesId: body.id, seriesWeeks: weeks } : {}) });
    }
    return { ok: true };
  });
}
module.exports = { readSchedule, mutateSchedule };
