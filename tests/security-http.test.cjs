const { test } = require('node:test');
const assert = require('node:assert/strict');
const { gzipSync } = require('node:zlib');
const { once } = require('node:events');
const { createApp } = require('../backend/server');

test('compressed request bodies are rejected before endpoint execution, including trailing compressed bytes', async t => {
  let called = 0;
  const server = createApp({ handlers: { lead: (_req, res) => { called++; res.json({ ok: true }); } } }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeIdleConnections?.(); }));
  const url = `http://127.0.0.1:${server.address().port}/api/lead`;
  for (const body of [gzipSync('{"value":1}'), Buffer.concat([gzipSync('{"value":1}'), Buffer.from('trailing bytes')])]) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body });
    assert.equal(response.status, 415); assert.deepEqual(await response.json(), { error: 'unsupported_encoding' });
    assert.equal(response.headers.get('x-powered-by'), null);
  }
  assert.equal(called, 0);
  const normal = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"value":1}' });
  assert.equal(normal.status, 200); assert.equal(called, 1);
});

test('oversized JSON is rejected with 413 before a handler can allocate database work', async t => {
  let called = false;
  const server = createApp({ handlers: { lead: (_req, res) => { called = true; res.json({ ok: true }); } } }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeIdleConnections?.(); }));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/lead`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: 'x'.repeat(1048576) }) });
  assert.equal(response.status, 413); assert.equal(called, false);
});
