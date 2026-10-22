const clients = new Set();

export function addRealtimeClient(res, userId = null) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  const client = { res, userId };
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
  const payload = `data: ${JSON.stringify({ type: 'click', ...event })}\n\n`;
  for (const client of clients) {
    try {
      if (!client.userId || !event.userId || client.userId.toString() === event.userId.toString()) {
        client.res.write(payload);
      }
    } catch {
      clients.delete(client);
    }
  }
}
