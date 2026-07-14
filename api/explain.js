// Разбор задачи через Claude. Vercel-функция, а не фронт — принципиально.
//
// Ключ НЕЛЬЗЯ класть в frontend/: Vite вшивает всё в бандл, и ключ уезжает
// в браузер каждого посетителя. Здесь он живёт в переменной окружения Vercel
// и наружу не выходит.
//
// Настроить один раз: Vercel → Project → Settings → Environment Variables →
//   ANTHROPIC_API_KEY = sk-ant-...
// (по желанию) ANTHROPIC_MODEL = claude-sonnet-5

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const FIREBASE_WEB_KEY = process.env.FIREBASE_WEB_KEY || 'AIzaSyATdVvMsNkN0F66XipkShtFe0wKizu2r6o';

// Проверяем, что зовёт наш залогиненный пользователь, а не случайный бот:
// эндпоинт публичный, и без этого им можно молча жечь наш баланс.
async function verifyUser(idToken) {
  if (!idToken) return false;
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    return r.ok;
  } catch { return false; }
}

function buildPrompt({ statement, answer, hint, hasImage, given, lang }) {
  const kk = lang !== 'ru';
  const langLine = kk
    ? 'Пиши ТОЛЬКО на казахском языке.'
    : 'Пиши ТОЛЬКО на русском языке.';

  const rules = [
    langLine,
    'Читатель — ребёнок 11–13 лет, готовится в РФМШ / НИШ / БИЛ. Он умный, но многого ещё не проходил.',
    '',
    'Как объяснять:',
    '— Пронумерованными шагами. В каждом шаге сначала ЗАЧЕМ мы это делаем, потом само действие.',
    '— Короткие предложения. Живой человеческий язык.',
    '— Не пиши «очевидно», «легко видеть», «понятно, что» — если бы это было очевидно, ребёнок не открыл бы разбор.',
    '— Не используй терминов вне программы 5–7 класса. Нужен термин — объясни его одним предложением прямо там.',
    '— Не пересказывай условие в первом шаге. Сразу к делу.',
    '— 120–200 слов. Обычный текст, без markdown и заголовков.',
    '',
    `Правильный ответ известен: «${answer}». Твой разбор обязан привести именно к нему.`,
    'Никогда не выдумывай другой ответ. Если твои вычисления с ним не сходятся — значит, ты неверно понял условие, перечитай.',
  ];

  if (hint) rules.push(`Черновая подсказка от составителя (можешь опереться, но разверни её по-человечески): ${hint}`);
  if (hasImage) rules.push('ВАЖНО: к задаче есть рисунок, и ты его НЕ видишь. Не выдумывай числа с рисунка. Объясни метод и честно скажи, что нужное значение надо взять с рисунка.');

  let task = `Задача:\n${statement}`;
  if (given) {
    task += `\n\nРебёнок ответил «${given}» — это неверно. В самом конце добавь один короткий абзац: где, скорее всего, ошибка, из-за которой получилось именно «${given}». Если понять не можешь — назови типичную ловушку этой задачи.`;
  }
  const last = kk ? 'Соңында бөлек жолмен: Жауабы: <ответ>' : 'В конце отдельной строкой: Ответ: <ответ>';
  rules.push(last);

  return { system: rules.join('\n'), user: task };
}

// Перевод условий задач. Тот же ключ Claude, отдельный режим: { mode: 'translate' }.
// Языковые задачи (орыс/ағылшын/қазақ тілі) сюда не приходят — фильтр стоит на фронте.
const TRANSLATE_SYSTEM = (lang) => [
  lang === 'kk'
    ? 'Переведи школьные задачи по математике и логике на КАЗАХСКИЙ язык.'
    : 'Переведи школьные задачи по математике и логике на РУССКИЙ язык.',
  '',
  'Жёсткие правила:',
  '— Числа, единицы измерения, имена собственные и формулы НЕ меняй.',
  '— Не решай задачу и не добавляй пояснений. Только перевод.',
  '— Смысл сохраняй дословно: это экзаменационные задачи, вольность меняет ответ.',
  '— Школьная терминология (теңдеу, бөлшек, пайыз, аудан, жылдамдық...).',
  '',
  'Ответь ТОЛЬКО валидным JSON {"id": {"statement": "...", "solution": "..."}}, без markdown.',
].join('\n');

async function handleTranslate(res, key, body) {
  const { items = [], lang = 'kk' } = body;
  if (!items.length) return res.status(200).json({});

  try {
    const payload = {};
    for (const it of items.slice(0, 30)) payload[it.id] = { statement: it.statement, solution: it.solution || '' };

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: TRANSLATE_SYSTEM(lang),
        messages: [{ role: 'user', content: JSON.stringify(payload) }],
      }),
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream' });

    const data = await r.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
      .replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    console.error('translate failed', e);
    return res.status(500).json({ error: 'failed' });   // фронт покажет оригинал
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'no_api_key' });

  const auth = req.headers.authorization || '';
  const ok = await verifyUser(auth.startsWith('Bearer ') ? auth.slice(7) : null);
  if (!ok) return res.status(401).json({ error: 'unauthorized' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // Режим перевода условий — тот же эндпоинт, чтобы не плодить функции.
  if (body.mode === 'translate') return handleTranslate(res, key, body);

  const { statement, answer, hint = '', hasImage = false, given = null, lang = 'kk' } = body;
  if (!statement || String(statement).length > 4000) return res.status(400).json({ error: 'bad_statement' });

  const { system, user } = buildPrompt({ statement, answer, hint, hasImage, given, lang });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 900,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('anthropic error', r.status, detail.slice(0, 300));
      return res.status(502).json({ error: 'upstream', status: r.status });
    }

    const data = await r.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!text) return res.status(502).json({ error: 'empty' });
    return res.status(200).json({ text, model: MODEL });
  } catch (e) {
    console.error('explain failed', e);
    return res.status(500).json({ error: 'failed' });
  }
};
