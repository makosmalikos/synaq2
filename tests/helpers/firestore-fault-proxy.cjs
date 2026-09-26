const net = require('node:net');
const { once } = require('node:events');

// A real transport outage for the Node Firestore SDK: disableNetwork() only
// stops its streams, while transaction RPCs can still connect directly.
async function firestoreFaultProxy() {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:18080') throw Error('Local emulator required');
  let online = true;
  const sockets = new Set();
  const server = net.createServer((client) => {
    if (!online) { client.destroy(); return; }
    const upstream = net.connect(18080, '127.0.0.1');
    for (const socket of [client, upstream]) {
      sockets.add(socket);
      socket.on('error', () => { client.destroy(); upstream.destroy(); });
      socket.on('close', () => { sockets.delete(socket); client.destroy(); upstream.destroy(); });
    }
    client.pipe(upstream); upstream.pipe(client);
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    port: server.address().port,
    disconnect() { online = false; for (const socket of sockets) socket.destroy(); },
    reconnect() { online = true; },
    close() { for (const socket of sockets) socket.destroy(); return new Promise((resolve) => server.close(resolve)); },
  };
}

module.exports = { firestoreFaultProxy };
