// POST /api/webhook — Dodo Payments жазылым өзгергенде осында хабарлайды.
// 1) қолтаңбаны тексереміз (әйтпесе кез келген адам өзіне pro қосып алар еді),
// 2) metadata-дан parentUid аламыз,
// 3) families/{parentUid}.pro-ны қоямыз/алып тастаймыз және балаларға көшіреміз.
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

async function syncChildrenPro(db, parentUid, pro) {
  const children = await db.collection('families').doc(parentUid).collection('children').get();
  const refs = children.docs.map((child) => db.collection('childIndex').doc(child.id));

  // Firestore batch-те 500 жазба шегі бар. Қазір бір бала ғана, бірақ функция өсуге дайын.
  for (let start = 0; start < refs.length; start += 450) {
    const batch = db.batch();
    refs.slice(start, start + 450).forEach((ref) => {
      batch.set(ref, { parentUid, pro: !!pro }, { merge: true });
    });
    await batch.commit();
  }
}

// ── Почему Pro иногда не включался после оплаты ──
// По документации Dodo (Subscription Integration Guide + Metadata reference)
// metadata из /checkouts привязывается к объекту Payment, а не гарантированно
// к Subscription. При первой оплате подписки Dodo шлёт ДВА события:
// subscription.active (сразу) и отдельно payment.succeeded (чуть позже,
// когда прошло реальное списание). Раньше payment.succeeded вообще не было
// в MAP — а именно в нём metadata.parentUid приходит надёжнее всего. Если
// на subscription.active metadata почему-то пустая — parentUid терялся,
// хендлер тихо возвращал 200 (без ошибки, без ретрая Dodo) — платёж прошёл,
// а Pro не включался. 'payment.refunded' в реальном API Dodo не существует —
// правильное имя события 'refund.succeeded'.
const ON = { pro: true };
const OFF = { pro: false };
const MAP = {
  'payment.succeeded': ON,          // сюда checkout-metadata попадает надёжнее всего
  'subscription.active': ON,        // первая активация / реактивация
  'subscription.renewed': ON,
  'subscription.cancelled': OFF,
  'subscription.expired': OFF,
  'subscription.failed': OFF,
  'refund.succeeded': OFF,          // ақшасын қайтарды
  // 'subscription.on_hold' — қолжетімділікті алмаймыз, тек белгілеп қоямыз
};

const DODO_API = process.env.DODO_ENV === 'test_mode'
  ? 'https://test.dodopayments.com'
  : 'https://live.dodopayments.com';

// Если parentUid нет прямо в теле вебхука — подтягиваем полный объект по id
// через REST. GET /payments/{id} и GET /subscriptions/{id} по документации
// Dodo гарантированно возвращают metadata, даже когда в самом вебхуке её нет.
// Пробуем несколько правдоподобных id из payload — так это работает и для
// payment-, и для subscription-, и для refund-событий без знания точной формы.
async function fetchMetadata(data) {
  if (!process.env.DODO_PAYMENTS_API_KEY) return null;
  const attempts = [];
  if (data.payload_type === 'Subscription' && data.id) attempts.push(['subscriptions', data.id]);
  if (data.id) attempts.push(['payments', data.id]);
  if (data.payment_id) attempts.push(['payments', data.payment_id]);
  if (data.subscription_id) attempts.push(['subscriptions', data.subscription_id]);
  for (const [path, id] of attempts) {
    try {
      const r = await fetch(`${DODO_API}/${path}/${id}`, {
        headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}` },
      });
      if (r.ok) {
        const obj = await r.json().catch(() => null);
        if (obj?.metadata?.parentUid) return obj.metadata;
      }
    } catch (e) {
      console.error('dodo fetch-by-id failed', path, id, e.message);
    }
  }
  return null;
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  const raw = await rawBody(req);
  if (!verify(raw, req.headers, process.env.DODO_WEBHOOK_SECRET)) {
    // Частая причина «оплатил — Pro не появился»: DODO_WEBHOOK_SECRET не задан
    // или задан не в том Vercel-окружении (Production/Preview). Логируем явно,
    // чтобы это было видно в логах функции, а не терялось молча.
    console.error('webhook: bad signature — hasSecret =', !!process.env.DODO_WEBHOOK_SECRET);
    return res.status(403).send('bad signature');
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); }
  catch { return res.status(400).send('bad json'); }

  const type = event.type || event.event_type;
  const data = event.data || {};

  const patch = MAP[type];
  if (!patch && type !== 'subscription.on_hold') {
    console.log('webhook: событие проигнорировано —', type);
    return res.status(200).send('ignored');
  }

  let uid = data.metadata?.parentUid;
  if (!uid) {
    // metadata не пришла прямо в вебхуке — подтягиваем объект по id (см. fetchMetadata).
    const fetched = await fetchMetadata(data);
    uid = fetched?.parentUid;
  }

  // Пайдаланушыға байланбаған төлем — 200 қайтарамыз, әйтпесе Dodo шексіз қайталайды.
  if (!uid) {
    console.warn('webhook: parentUid не найден —', type, 'id=', data.id, 'subscription_id=', data.subscription_id);
    return res.status(200).send('ok');
  }

  console.log('webhook:', type, '→ uid', uid, 'pro=', patch?.pro);

  try {
    const db = await store();
    await db.collection('families').doc(uid).set({
      ...(patch || {}),
      dodoSubId: data.subscription_id || data.id || null,
      dodoStatus: type,
      proUpdatedAt: new Date(),
    }, { merge: true });
    if (typeof patch?.pro === 'boolean') {
      await syncChildrenPro(db, uid, patch.pro);
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
