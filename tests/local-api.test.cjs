const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, ENDPOINTS } = require('../backend/server');

async function serve(t, handlers = {}) {
  const server = createApp({ handlers }).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(() => new Promise((resolve) => {
    // Node's fetch pool may retain an idle keep-alive socket after the last
    // endpoint. Do not let a completed routing test wait for that client TTL.
    server.close(resolve);
    server.closeIdleConnections?.();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('all serverless APIs are mounted locally with parsed JSON', async (t) => {
  const handlers = Object.fromEntries(ENDPOINTS.map((name) => [name, (req, res) => res.json({ name, body: req.body })]));
  const url = await serve(t, handlers);
  for (const name of ENDPOINTS) {
    const response = await fetch(`${url}/api/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"value":1}' });
    assert.equal(response.status, 200, name);
    assert.deepEqual(await response.json(), { name, body: { value: 1 } });
  }
});

test('webhook receives byte-for-byte raw JSON before express parser', async (t) => {
  const url = await serve(t, { webhook: async (req, res) => {
    assert.equal(req.body, undefined);
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    res.json({ raw: Buffer.concat(chunks).toString('utf8') });
  } });
  const body = '{ "event": "тест",\n "value": 1 }';
  const response = await fetch(`${url}/api/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  assert.deepEqual(await response.json(), { raw: body });
});

test('unknown APIs and invalid JSON return JSON errors; legacy API remains available', async (t) => {
  const url = await serve(t);
  const absent = await fetch(`${url}/api/does-not-exist`);
  assert.equal(absent.status, 404);
  assert.deepEqual(await absent.json(), { error: 'not_found' });
  const invalid = await fetch(`${url}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: 'invalid_json' });
  const legacy = await fetch(`${url}/api/training/topics`);
  assert.equal(legacy.status, 200);
  assert.ok(Array.isArray(await legacy.json()));
});
