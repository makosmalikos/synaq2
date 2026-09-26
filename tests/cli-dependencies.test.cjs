const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { Readable } = require('node:stream');
const path = require('node:path');

const fromCli = createRequire(require.resolve('firebase-tools/package.json'));

test('Firebase CLI CSV auth import preserves quoted fields, Unicode and 1000-user batching', async () => {
  const commandPath = fromCli.resolve('./lib/commands/auth-import.js');
  const fromCommand = createRequire(commandPath);
  const importer = fromCommand('../accountImporter');
  let action;
  class Command {
    description() { return this; }
    option() { return this; }
    before() { return this; }
    action(fn) { action = fn; return this; }
  }
  const csv = Array.from({ length: 1001 }, (_, i) =>
    `user${i},child${i}@example.test,true,,,"Айша, ученик ${i}",`).join('\r\n');
  const bytes = Buffer.from(csv);
  const chunks = Array.from({ length: Math.ceil(bytes.length / 7) }, (_, i) => bytes.subarray(i * 7, (i + 1) * 7));
  let imported;
  const context = { exports: {},
    require(name) {
      if (name === '../command') return { Command };
      if (name === '../projectUtils') return { needProjectId: () => 'demo-dependency-tests' };
      if (name === '../requirePermissions') return { requirePermissions() { throw Error('network forbidden'); } };
      if (name === '../logger') return { logger: { info() {}, debug() {} } };
      if (name === 'fs-extra') return { stat: async () => ({ size: Buffer.byteLength(csv) }),
        createReadStream: () => Readable.from(chunks) };
      if (name === '../accountImporter') return { ...importer,
        serialImportUsers: async (projectId, options, batches) => { imported = { projectId, options, batches }; } };
      return fromCommand(name);
    },
  };
  vm.runInNewContext(fs.readFileSync(commandPath, 'utf8'), context, { filename: commandPath });
  await action('fixture.csv', {});
  assert.equal(imported.projectId, 'demo-dependency-tests');
  assert.equal(imported.batches.length, 2);
  assert.equal(imported.batches[0].length, 1000);
  assert.equal(imported.batches[1].length, 1);
  const first = imported.batches[0][0];
  assert.equal(first.localId, 'user0');
  assert.equal(first.email, 'child0@example.test');
  assert.equal(first.emailVerified, true);
  assert.equal(first.displayName, 'Айша, ученик 0');
  assert.equal(first.passwordHash, undefined);
  assert.equal(imported.batches[1][0].localId, 'user1000');
  assert.match(fromCli.resolve('csv-parse'), /dist[/\\]cjs[/\\]index\.cjs$/);
});

test('patched CSV duplicate-column handling does not replace record prototypes', () => {
  const { parse } = fromCli('csv-parse/sync');
  const records = parse('__proto__,__proto__,name\none,two,test\n', {
    columns: true, group_columns_by_name: true,
  });
  assert.equal(Object.getPrototypeOf(records[0]), Object.prototype);
  assert.equal(Object.hasOwn(records[0], '__proto__'), true);
  assert.deepEqual(records[0].__proto__, ['one', 'two']);
  assert.equal(records[0].name, 'test');
});

test('Pubsub uses patched OTel core and preserves trace propagation without an exporter or network', () => {
  const pubsubPath = fromCli.resolve('@google-cloud/pubsub');
  const fromPubsub = createRequire(pubsubPath);
  const { version } = fromPubsub('@opentelemetry/core/package.json');
  const [major, minor] = version.split('.').map(Number);
  assert.equal(major, 2);
  assert.ok(minor >= 8);
  const telemetry = require(path.join(path.dirname(pubsubPath), 'telemetry-tracing.js'));
  const spanContext = { traceId: '1234567890abcdef1234567890abcdef', spanId: '1234567890abcdef', traceFlags: 1 };
  const span = { spanContext: () => spanContext };
  const message = { attributes: { existing: 'preserved' } };
  telemetry.setGloballyEnabled(true);
  try {
    telemetry.injectSpan(span, message);
    assert.equal(message.attributes.googclient_traceparent,
      '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01');
    assert.equal(message.attributes.existing, 'preserved');
    assert.equal(telemetry.containsSpanContext(message), true);
    // Simulate transmission: attributes survive, the in-process span reference does not.
    const received = { attributes: { ...message.attributes } };
    const extracted = telemetry.extractSpan(received, 'projects/demo-dependency-tests/subscriptions/test');
    assert.equal(extracted.spanContext().traceId, spanContext.traceId);
    assert.equal(extracted.spanContext().spanId, spanContext.spanId);
    assert.equal(extracted.spanContext().traceFlags, 1);
    assert.equal(received.parentSpan, extracted);
  } finally {
    telemetry.setGloballyEnabled(false);
  }
});

test('patched OTel baggage propagator rejects an oversized header', () => {
  const fromPubsub = createRequire(fromCli.resolve('@google-cloud/pubsub'));
  const { W3CBaggagePropagator } = fromPubsub('@opentelemetry/core');
  const { ROOT_CONTEXT, propagation, defaultTextMapGetter } = fromPubsub('@opentelemetry/api');
  const carrier = { baggage: `oversized=${'x'.repeat(9000)}` };
  const result = new W3CBaggagePropagator().extract(ROOT_CONTEXT, carrier, defaultTextMapGetter);
  assert.equal(propagation.getBaggage(result), undefined);
});
