const clients = new Set();

export function addRealtimeClient(res, userId = null) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  const client = { res, userId: userId ? userId.toString() : null };
  clients.add(client);

  const heartbeat = setInterval(() => {
    try {
      res.write(':ping\n\n');
    } catch {
      clearInterval(heartbeat);
      clients.delete(client);
    }
  }, 20000);

  res.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

export function broadcastRealtimeClick(event) {
  if (!event || !event.userId) return;

  const eventUserId = event.userId.toString();
  const payload = `data: ${JSON.stringify({ type: 'click', data: event, ...event })}\n\n`;

  for (const client of clients) {
    try {
      if (client.userId && client.userId === eventUserId) {
        client.res.write(payload);
      }
    } catch {
      clients.delete(client);
    }
  }
}
