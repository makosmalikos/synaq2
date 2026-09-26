const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { Readable } = require('node:stream');

// Resolve through the actual production consumer, not an unrelated hoisted copy.
const fromStorage = createRequire(require.resolve('@google-cloud/storage'));
const fromGaxios = createRequire(fromStorage.resolve('gaxios'));
const { Gaxios } = fromStorage('gaxios');

test('Firebase Admin auth keeps a CommonJS-compatible JWKS verifier for Vercel', () => {
  const fromAdmin = createRequire(require.resolve('firebase-admin/app'));
  const fromJwks = createRequire(fromAdmin.resolve('jwks-rsa/package.json'));
  assert.match(fromAdmin('jwks-rsa/package.json').version, /^3\./);
  assert.match(fromJwks('jose/package.json').version, /^4\./);
  assert.equal(typeof fromAdmin('jwks-rsa'), 'function');
  assert.equal(typeof fromAdmin('firebase-admin/auth').getAuth, 'function');
});

test('gaxios 6 scoped uuid override preserves its CommonJS v4 contract', () => {
  assert.match(fromStorage('gaxios/package.json').version, /^6\./);
  assert.match(fromGaxios('uuid/package.json').version, /^11\./);
  assert.match(fromGaxios.resolve('uuid'), /[/\\]dist[/\\]cjs[/\\]/);
  const uuid = fromGaxios('uuid');
  const id = uuid.v4();
  assert.equal(uuid.validate(id), true);
  assert.equal(uuid.version(id), 4);
});

test('gaxios production multipart path generates matching UUID boundaries without network', async () => {
  const seenBoundaries = new Set();
  const client = new Gaxios();
  // Any accidental adapter fallback must fail before it can open a connection.
  client._defaultAdapter = async () => { throw Error('network is forbidden in this test'); };
  for (let i = 0; i < 2; i++) {
    const result = await client.request({
      url: 'https://no-network.example.invalid/upload', method: 'POST', retry: false,
      multipart: [
        { headers: { 'Content-Type': 'application/json' }, content: '{"name":"test.txt"}' },
        { headers: { 'Content-Type': 'text/plain' }, content: Readable.from([Buffer.from('local payload')]) },
      ],
      adapter: async (options) => {
        const match = options.headers['Content-Type'].match(/^multipart\/related; boundary=([\da-f-]+)$/);
        assert.ok(match, 'multipart content type has an explicit boundary');
        const boundary = match[1];
        assert.equal(fromGaxios('uuid').version(boundary), 4);
        assert.equal(seenBoundaries.has(boundary), false, 'each request has a fresh boundary');
        seenBoundaries.add(boundary);
        const chunks = [];
        for await (const chunk of options.body) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks).toString('utf8');
        assert.equal(body,
          `--${boundary}\r\nContent-Type: application/json\r\n\r\n{"name":"test.txt"}\r\n`
          + `--${boundary}\r\nContent-Type: text/plain\r\n\r\nlocal payload\r\n--${boundary}--`);
        return { status: 200, statusText: 'OK', headers: {}, config: options, data: { local: true } };
      },
    });
    assert.deepEqual(result.data, { local: true });
  }
  assert.equal(seenBoundaries.size, 2);
});
