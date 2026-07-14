// POST /api/webhook — сюда стучится Polar при любом изменении подписки.
// 1) проверяем подпись (иначе кто угодно сможет выдать себе Pro),
// 2) достаём parentUid из metadata,
// 3) ставим/снимаем pro в families/{parentUid}.

import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Vercel по умолчанию сам парсит тело запроса. Подпись считается по СЫРЫМ байтам,
// поэтому парсинг отключаем и читаем поток руками.
export const config = { api: { bodyParser: false } };

const rawBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

function db() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // в переменной окружения переносы строк экранированы
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  let event;
  try {
    const body = await rawBody(req);
    event = validateEvent(body, req.headers, process.env.POLAR_WEBHOOK_SECRET);
  } catch (e) {
    if (e instanceof WebhookVerificationError) return res.status(403).send('bad signature');
    console.error(e);
    return res.status(400).send('bad request');
  }

  const sub = event.data || {};
  const uid = sub.metadata?.parentUid || sub.subscription?.metadata?.parentUid;
  if (!uid) {
    // Платёж не привязан к пользователю — отвечаем 200, иначе Polar будет ретраить вечно.
    console.warn('нет parentUid в событии', event.type);
    return res.status(200).send('ok');
  }

  // Что делаем с каждым событием.
  const ON  = { pro: true };
  const OFF = { pro: false };
  const MAP = {
    'subscription.active':      ON,   // оплатил или продлил
    'subscription.uncanceled':  ON,   // передумал отменять
    'subscription.resumed':     ON,
    'subscription.revoked':     OFF,  // период кончился, доступа больше нет
    'order.refunded':           OFF,  // вернули деньги
    // 'subscription.canceled' — доступ НЕ снимаем: он оплачен до конца периода.
    //  Polar сам пришлёт revoked, когда период истечёт.
  };

  const patch = MAP[event.type];
  if (!patch) return res.status(200).send('ignored');

  try {
    await db().collection('families').doc(uid).set({
      ...patch,
      polarSubId: sub.id || null,
      polarStatus: event.type,
      proUpdatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('firestore жаңарту қатесі', e);
    return res.status(500).send('db error');   // Polar повторит попытку
  }

  return res.status(200).send('ok');
}
