// POST /api/checkout  { uid, email }  →  { url }
// Создаёт оплату в Polar и возвращает ссылку, куда отправить родителя.
// uid кладём в metadata — именно по нему вебхук потом найдёт, кому включить Pro.

const POLAR_API = process.env.POLAR_SANDBOX === '1'
  ? 'https://sandbox-api.polar.sh'
  : 'https://api.polar.sh';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { uid, email } = req.body || {};
  if (!uid) return res.status(400).json({ error: 'uid керек' });

  try {
    const r = await fetch(`${POLAR_API}/v1/checkouts/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [process.env.POLAR_PRODUCT_ID],   // ID тарифа Pro из дашборда Polar
        customer_email: email || undefined,
        success_url: `${process.env.APP_URL}/app?paid=1`,
        metadata: { parentUid: uid },               // ← вернётся в вебхуке
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('polar checkout failed', data);
      return res.status(502).json({ error: 'Polar қатесі' });
    }
    return res.status(200).json({ url: data.url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Сервер қатесі' });
  }
}
