const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const enabled = !!process.env.FIREBASE_AUTH_EMULATOR_HOST && !!process.env.FIRESTORE_EMULATOR_HOST;
function configure() {
  if (!enabled) return;
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
  for (const key of Object.keys(process.env)) if (/^(?:FIREBASE_CLIENT_EMAIL|FIREBASE_PRIVATE_KEY|GOOGLE_APPLICATION_CREDENTIALS|FIREBASE_CONFIG|GEMINI_|DODO_)/.test(key)) delete process.env[key];
  Object.assign(process.env, { SYNAQ_USE_EMULATORS: '1', FIREBASE_PROJECT_ID: 'demo-synaq-tests', GOOGLE_CLOUD_PROJECT: 'demo-synaq-tests', GCLOUD_PROJECT: 'demo-synaq-tests', NODE_ENV: 'test' });
}
async function shutdown() {
  if (!enabled) return;
  await require('../../backend/lib/firebase-admin').getAdmin().db.terminate();
  const { getApps, deleteApp } = require('firebase-admin/app');
  for (const app of getApps()) await deleteApp(app);
}
async function liveFixture(action, plan = 'pro') {
  const { db, auth } = require('../../backend/lib/firebase-admin').getAdmin();
  const { loadEmulatorClient, sdk } = require('./emulator-browser-client.cjs');
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12), uid = 'deep' + suffix, parentUid = 'deepparent' + suffix;
  const clients = [], extra = [], periodEnd = Date.now() + 30 * 86400000;
  const server = require('../../backend/server').createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    await db.doc('families/' + parentUid).set({ plan, planExpiresAt: periodEnd, parentName: 'Deep scenario' });
    const child = { code: uid, klass: '6', parentUid, name: 'Deep scenario' };
    await db.doc(`families/${parentUid}/children/${uid}`).set(child);
    await db.doc('childIndex/' + uid).set(child);
    await auth.createUser({ uid, email: uid + '@synaq.kids', password: 'deep-test-pin-123' });
    await auth.createUser({ uid: parentUid, email: parentUid + '@example.test', password: 'deep-test-parent-123', emailVerified: true });
    const client = await loadEmulatorClient(uid); clients.push(client);
    await client.loginChild(uid, 'deep-test-pin-123');
    const parent = await loadEmulatorClient(parentUid); clients.push(parent);
    await parent.loginParent(parentUid + '@example.test', 'deep-test-parent-123');
    const token = await client.auth.currentUser.getIdToken(), parentToken = await parent.auth.currentUser.getIdToken();
    const post = async (route, body, actor = token) => {
      const at = performance.now();
      const response = await fetch(origin + '/api/' + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(actor ? { Authorization: 'Bearer ' + actor } : {}) }, body: JSON.stringify(body) });
      const raw = await response.text();
      return { status: response.status, body: JSON.parse(raw), ms: performance.now() - at, bytes: Buffer.byteLength(raw) };
    };
    await action({ db, uid, parentUid, periodEnd, token, parentToken, post, client, origin, track: path => extra.push(path) });
  } finally {
    for (const client of clients) { await sdk.terminate(client.db); await sdk.deleteApp(client.auth.app); }
    await new Promise(resolve => { server.close(resolve); server.closeIdleConnections?.(); });
    for (const [collection, field, value] of [
      ['learningSessions', 'uid', uid], ['mockSessions', 'uid', uid], ['diagnosticSessions', 'uid', uid],
      ['rewardRequests', 'childUid', uid], ['lessons', 'childUid', uid], ['lessonSlots', 'childUid', uid], ['lessonCredits', 'parentUid', parentUid],
    ]) {
      const rows = await db.collection(collection).where(field, '==', value).get();
      for (const doc of rows.docs) await doc.ref.delete();
    }
    for (const path of extra) await db.doc(path).delete();
    for (const collection of ['learningRateLimits', 'mockRateLimits', 'diagnosticRateLimits', 'rewardWallets']) await db.doc(collection + '/' + uid).delete();
    await db.recursiveDelete(db.doc('results/' + uid));
    await db.recursiveDelete(db.doc('families/' + parentUid));
    await db.doc('childIndex/' + uid).delete();
    for (const id of [uid, parentUid]) await auth.deleteUser(id).catch(error => { if (error.code !== 'auth/user-not-found') throw error; });
  }
}
module.exports = { enabled, configure, shutdown, liveFixture };
