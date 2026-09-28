const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(`${__dirname}/../frontend/src/Landing.jsx`, 'utf8');

test('landing lead form opens the verified SYNAQ WhatsApp chat with a prefilled message', () => {
  assert.match(source, /WHATSAPP_LEAD_URL\s*=\s*'https:\/\/wa\.me\/77773424043'/);
  assert.match(source, /window\.location\.assign\(`\$\{WHATSAPP_LEAD_URL\}\?text=\$\{encodeURIComponent\(message\)\}`\)/);
  assert.match(source, /keepalive:\s*true/);
  assert.doesNotMatch(source, /mailto:support@synaq\.app\?subject/);
});
