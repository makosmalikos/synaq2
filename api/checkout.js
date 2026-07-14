// POST /api/checkout  { uid, email }  →  { url }
// Dodo Payments-те төлем сессиясын ашып, сілтемесін қайтарады.
// uid-ті metadata-ға саламыз — вебхук сол арқылы кімге pro қосу керегін біледі.
//
// CommonJS (module.exports) — explain.js сияқты. ESM-ге көшірмеңіз:
// түбірдегі package.json-да "type": "module" жоқ, Vercel функцияны іске қоса алмайды.

const API = process.env.DODO_ENV === 'test_mode'
  ? 'https://test.dodopayments.com'
  : 'https://live.dodopayments.com';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { uid, email, name } = req.body || {};
  if (!uid) return res.status(400).json({ error: 'uid керек' });

  if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.DODO_PRODUCT_ID) {
    console.error('DODO_PAYMENTS_API_KEY немесе DODO_PRODUCT_ID жоқ');
    return res.status(500).json({ error: 'Төлем баптаулары толық емес' });
  }

  try {
    const r = await fetch(`${API}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: process.env.DODO_PRODUCT_ID, quantity: 1 }],
        customer: email ? { email, name: name || undefined } : undefined,
        return_url: `${process.env.APP_URL || 'https://synaq.app'}/app?paid=1`,
        metadata: { parentUid: uid },
      }),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.checkout_url) {
      console.error('dodo checkout failed', r.status, data);
      return res.status(502).json({ error: `Dodo ${r.status}` });
    }
    return res.status(200).json({ url: data.checkout_url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Сервер қатесі' });
  }
};
