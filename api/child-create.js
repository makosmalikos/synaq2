// A child identity is owned by a durable, server-written reservation BEFORE
// Auth creation. Recovery only ever looks up that reserved UID, never an email.
const { getAdmin } = require('../backend/lib/firebase-admin');
const { createHash, randomUUID } = require('node:crypto');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESERVED_UID = /^synaqkid_[a-f0-9]{32}$/;
const PET_AVATARS = new Set(['owl', 'fox', 'panda', 'lion', 'penguin', 'koala']);
const failure = (message, status = 409) => Object.assign(new Error(message), { status });

function proofOf(proof, parentUid, hash, code) {
  if (!proof || proof.parentUid !== parentUid || proof.hash !== hash || proof.code !== code) throw failure('request_conflict');
  if (typeof proof.childUid !== 'string' || !proof.childUid) throw failure('request_incomplete');
  if (proof.version === 2) {
    if (!RESERVED_UID.test(proof.childUid) || !['reserved', 'complete', 'cancelled'].includes(proof.status)) throw failure('request_incomplete');
  } else if (proof.version != null || proof.status != null) throw failure('request_incomplete');
  return proof;
}

const complete = (proof) => proof.version == null || proof.status === 'complete';
const refsOf = (db, proof) => ({
  family: db.collection('families').doc(proof.parentUid),
  child: db.collection('families').doc(proof.parentUid).collection('children').doc(proof.childUid),
  index: db.collection('childIndex').doc(proof.childUid),
});
function linksMatch(child, index, proof) {
  return child.exists && index.exists && child.data().code === proof.code
    && index.data().parentUid === proof.parentUid && index.data().linkedByServer === true;
}
function identityMatches(identity, proof) {
  return identity?.uid === proof.childUid && identity.email === `${proof.code}@synaq.kids` && identity.disabled !== true;
}

async function completedRequest(db, auth, proof) {
  if (!complete(proof)) return null;
  const refs = refsOf(db, proof);
  const [child, index] = await Promise.all([refs.child.get(), refs.index.get()]);
  if (!linksMatch(child, index, proof)) throw failure('request_incomplete');
  let identity;
  try { identity = await auth.getUser(proof.childUid); }
  catch (error) {
    if (error.code === 'auth/user-not-found') throw failure('request_incomplete');
    throw error;
  }
  if (!identityMatches(identity, proof)) throw failure('request_incomplete');
  return { childUid: proof.childUid, code: proof.code };
}

async function reserve(db, requestRef, parentUid, hash, code, requestId) {
  const candidateUid = `synaqkid_${randomUUID().replaceAll('-', '')}`;
  return db.runTransaction(async (tx) => {
    const existing = await tx.get(requestRef);
    if (existing.exists) return proofOf(existing.data(), parentUid, hash, code);
    const familyRef = db.collection('families').doc(parentUid);
    const rateRef = db.collection('childCreateLimits').doc(parentUid);
    const [family, children, rate] = await Promise.all([
      tx.get(familyRef), tx.get(familyRef.collection('children').limit(1)), tx.get(rateRef),
    ]);
    if (!family.exists) throw failure('family_missing');
    if (!children.empty || family.data().childAccountUid) throw failure('child_limit');
    const day = new Date().toISOString().slice(0, 10), previous = rate.data() || {};
    const count = previous.day === day && Number.isSafeInteger(previous.count) && previous.count >= 0 ? previous.count : 0;
    if (count >= 10) throw failure('rate_limit', 429);
    const record = { version: 2, status: 'reserved', parentUid, requestId, hash,
      childUid: candidateUid, code, createdAt: new Date(), updatedAt: new Date() };
    tx.create(requestRef, record);
    tx.set(rateRef, { day, count: count + 1 });
    return record;
  });
}

async function ensureIdentity(auth, proof, name, pin) {
  let identity;
  try {
    identity = await auth.createUser({ uid: proof.childUid, email: `${proof.code}@synaq.kids`, password: pin, displayName: name });
  } catch (creationError) {
    // Handles both uid-already-exists and a lost successful Auth response.
    // Never use getUserByEmail: ownership comes only from the prior reservation.
    try { identity = await auth.getUser(proof.childUid); }
    catch (lookupError) {
      if (lookupError.code !== 'auth/user-not-found') throw lookupError;
      if (creationError.code === 'auth/email-already-exists') throw failure('email-already-in-use');
      if (creationError.code === 'auth/uid-already-exists') throw failure('request_incomplete');
      throw creationError;
    }
  }
  if (!identityMatches(identity, proof)) throw failure('request_incomplete');
}

async function finish(db, requestRef, proof, name, klass, avatar) {
  const refs = refsOf(db, proof);
  await db.runTransaction(async (tx) => {
    const [request, family, child, index, children] = await Promise.all([
      tx.get(requestRef), tx.get(refs.family), tx.get(refs.child), tx.get(refs.index),
      tx.get(refs.family.collection('children').limit(1)),
    ]);
    const current = proofOf(request.data(), proof.parentUid, proof.hash, proof.code);
    if (current.childUid !== proof.childUid) throw failure('request_incomplete');
    if (complete(current)) {
      if (!linksMatch(child, index, current)) throw failure('request_incomplete');
      return;
    }
    if (current.status === 'cancelled') throw failure(current.reason || 'request_incomplete');
    if (!family.exists) throw failure('family_missing');
    if (child.exists || index.exists) throw failure('request_incomplete');
    if (!children.empty || family.data().childAccountUid) throw failure('child_limit');
    const data = family.data(), expiry = data.proExpiresAt;
    const expires = expiry?.toMillis?.() ?? (expiry instanceof Date ? expiry.getTime()
      : typeof expiry === 'string' ? Date.parse(expiry) : NaN);
    const pro = data.pro === true && (expiry == null || (Number.isFinite(expires) && expires > Date.now()));
    tx.create(refs.child, { name, klass, avatar, code: proof.code, createdAt: new Date() });
    tx.create(refs.index, { parentUid: proof.parentUid, name, klass, avatar, pro, linkedByServer: true });
    // This shared family write serializes distinct reservations racing for the
    // last child slot, including legacy families without the marker.
    tx.set(refs.family, { childAccountUid: proof.childUid }, { merge: true });
    tx.set(requestRef, { status: 'complete', completedAt: new Date(), updatedAt: new Date() }, { merge: true });
  });
}

async function cancelAndCleanup(db, auth, requestRef, proof, reason) {
  const refs = refsOf(db, proof);
  try {
    const safe = await db.runTransaction(async (tx) => {
      const [request, child, index, anyFamily, anyMarker] = await Promise.all([
        tx.get(requestRef), tx.get(refs.child), tx.get(refs.index),
        // Requires the children.code collection-group index declared in
        // firestore.indexes.json. A missing index must block deletion safely.
        tx.get(db.collectionGroup('children').where('code', '==', proof.code).limit(1)),
        tx.get(db.collection('families').where('childAccountUid', '==', proof.childUid).limit(1)),
      ]);
      const current = proofOf(request.data(), proof.parentUid, proof.hash, proof.code);
      if (current.childUid !== proof.childUid || complete(current) || child.exists || index.exists) return false;
      if (current.status !== 'cancelled') tx.set(requestRef, { status: 'cancelled', reason, updatedAt: new Date() }, { merge: true });
      return anyFamily.empty && anyMarker.empty;
    });
    if (!safe) return;
    let identity;
    try { identity = await auth.getUser(proof.childUid); }
    catch (error) { if (error.code === 'auth/user-not-found') return; throw error; }
    if (!identityMatches(identity, proof)) return;
    // The cancelled state prohibits later finalization. Check all ownership
    // links once more after the Auth read before touching the reserved identity.
    const [latest, child, index, anyFamily, anyMarker] = await Promise.all([
      requestRef.get(), refs.child.get(), refs.index.get(),
      db.collectionGroup('children').where('code', '==', proof.code).limit(1).get(),
      db.collection('families').where('childAccountUid', '==', proof.childUid).limit(1).get(),
    ]);
    const current = proofOf(latest.data(), proof.parentUid, proof.hash, proof.code);
    if (current.childUid !== proof.childUid || current.status !== 'cancelled'
        || child.exists || index.exists || !anyFamily.empty || !anyMarker.empty) return;
    await auth.deleteUser(proof.childUid);
  } catch {
    // Read failure is never evidence of absence. Keep the durable reservation;
    // the same request may retry cleanup without deleting an unrelated identity.
    console.warn('child-create cleanup not confirmed; reservation retained');
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  let db, auth, requestRef, proof;
  try {
    const token = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'login_required' });
    ({ db, auth } = getAdmin());
    const parent = await auth.verifyIdToken(token, true);
    if (!parent.email || parent.email.endsWith('@synaq.kids')) return res.status(403).json({ error: 'parent_required' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const name = String(body.name || '').trim(), klass = String(body.klass || '').trim();
    const requestedAvatar = body.avatar == null ? '' : String(body.avatar).trim().toLowerCase();
    const avatar = requestedAvatar || 'owl';
    const code = String(body.code || '').trim().toLowerCase().replace(/@synaq\.kids$/, ''), pin = String(body.pin || '');
    if (!name || name.length > 80 || !/^[a-z0-9]{3,32}$/.test(code) || !/^([1-9]|1[01])?$/.test(klass) || !PET_AVATARS.has(avatar)) return res.status(400).json({ error: 'invalid_child' });
    if (pin.length < 6 || pin.length > 128) return res.status(400).json({ error: 'weak_password' });
    const requestId = body.requestId == null ? null : String(body.requestId).toLowerCase();
    if (requestId !== null && !UUID.test(requestId)) return res.status(400).json({ error: 'invalid_request_id' });
    const hashPayload = { name, klass, code, pin };
    if (requestedAvatar) hashPayload.avatar = avatar;
    const hash = createHash('sha256').update(JSON.stringify(hashPayload)).digest('hex');
    // Old callers without UUIDs also get a prior reservation and stable recovery.
    requestRef = db.collection('childCreateRequests').doc(`${parent.uid}_${requestId || `legacy_${hash}`}`);
    proof = await reserve(db, requestRef, parent.uid, hash, code, requestId);
    const completed = await completedRequest(db, auth, proof);
    if (completed) return res.status(200).json(completed);
    if (proof.status === 'cancelled') {
      await cancelAndCleanup(db, auth, requestRef, proof, proof.reason || 'request_incomplete');
      throw failure(proof.reason || 'request_incomplete');
    }
    await ensureIdentity(auth, proof, name, pin);
    await finish(db, requestRef, proof, name, klass, avatar);
    return res.status(201).json({ childUid: proof.childUid, code });
  } catch (e) {
    if (proof && !complete(proof)) {
      try {
        const latest = proofOf((await requestRef.get()).data(), proof.parentUid, proof.hash, proof.code);
        const committed = await completedRequest(db, auth, latest);
        if (committed) return res.status(201).json(committed);
      } catch { /* An unavailable read-back must never trigger Auth deletion. */ }
      if (proof.status !== 'cancelled' && ['child_limit', 'email-already-in-use'].includes(e.message)) {
        await cancelAndCleanup(db, auth, requestRef, proof, e.message);
      }
    }
    if (e.code?.startsWith('auth/id-token') || ['auth/argument-error', 'auth/user-disabled'].includes(e.code)) return res.status(401).json({ error: 'login_required' });
    if (e.status) return res.status(e.status).json({ error: e.message });
    if (e instanceof SyntaxError) return res.status(400).json({ error: 'invalid_child' });
    console.error('child-create', e.code || 'child_create_failed');
    return res.status(500).json({ error: 'child_create_failed' });
  }
};
