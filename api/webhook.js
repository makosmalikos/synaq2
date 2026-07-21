// POST /api/webhook — Dodo Payments жазылым өзгергенде осында хабарлайды.
// 1) қолтаңбаны тексереміз (әйтпесе кез келген адам өзіне pro қосып алар еді),
// 2) metadata-дан parentUid аламыз,
// 3) families/{parentUid}.pro-ны қоямыз/алып тастаймыз.
//
// CommonJS — explain.js сияқты (package.json-да "type": "module" жоқ).

const crypto = require('crypto');

const rawBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

// Standard Webhooks: HMAC-SHA256("{id}.{timestamp}.{body}"), кілт — whsec_ кейінгі бөлігі.
function verify(raw, headers, secret) {
  const id = headers['webhook-id'];
  const ts = headers['webhook-timestamp'];
  const sigHeader = headers['webhook-signature'];
  if (!id || !ts || !sigHeader || !secret) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;   // ескі сұранысты қабылдамаймыз

  const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key)
    .update(`${id}.${ts}.${raw.toString('utf8')}`)
    .digest('base64');

  return String(sigHeader).split(' ').some((part) => {
    const sig = part.split(',')[1];
    if (!sig || sig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  });
}

// firebase-admin тек осы жерде керек — жоғарыда жүктесек, функция мүлде іске қосылмай қалуы мүмкін.
async function store() {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

const ON = { pro: true };
const OFF = { pro: false };
const MAP = {
  'subscription.active': ON,        // төледі / жаңартты
  'subscription.renewed': ON,
  'subscription.cancelled': OFF,
  'subscription.expired': OFF,
  'subscription.failed': OFF,
  'payment.refunded': OFF,          // ақшасын қайтарды
  // 'subscription.on_hold' — қолжетімділікті алмаймыз, тек белгілеп қоямыз
};

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  const raw = await rawBody(req);
  if (!verify(raw, req.headers, process.env.DODO_WEBHOOK_SECRET)) {
    return res.status(403).send('bad signature');
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); }
  catch { return res.status(400).send('bad json'); }

  const type = event.type || event.event_type;
  const data = event.data || {};
  const uid = data.metadata?.parentUid || data.subscription?.metadata?.parentUid;

  // Пайдаланушыға байланбаған төлем — 200 қайтарамыз, әйтпесе Dodo шексіз қайталайды.
  if (!uid) { console.warn('parentUid жоқ:', type); return res.status(200).send('ok'); }

  const patch = MAP[type];
  if (!patch && type !== 'subscription.on_hold') return res.status(200).send('ignored');

  try {
    const db = await store();
    await db.collection('families').doc(uid).set({
      ...(patch || {}),
      dodoSubId: data.subscription_id || data.id || null,
      dodoStatus: type,
      proUpdatedAt: new Date(),
    }, { merge: true });

    if (patch && typeof patch.pro === 'boolean') {
      const kids = await db.collection('families').doc(uid).collection('children').get();
      const batch = db.batch();
      kids.forEach((doc) => {
        batch.set(db.collection('childIndex').doc(doc.id), { pro: patch.pro }, { merge: true });
      });
      if (!kids.empty) await batch.commit();
    }
  } catch (e) {
    console.error('firestore қатесі', e);
    return res.status(500).send('db error');    // Dodo қайта жібереді
  }

  return res.status(200).send('ok');
};

module.exports = handler;
// Қолтаңба шикі байттар бойынша есептеледі — Vercel парсерін өшіреміз.
// (module.exports-тан КЕЙІН тұруы керек, әйтпесе қайта жазылып кетеді.)
module.exports.config = { api: { bodyParser: false } };
