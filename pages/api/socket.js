import { WebSocketServer } from 'ws';

let wss;

// This is required to prevent multiple WS servers during Next.js hot-reload in dev
function getWSServer(server) {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/api/socket') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    });

    wss.on('connection', (ws) => {
      console.log('Client connected to WS');

      // Simple ping/pong keepalive
      const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ event: 'ping' }));
      }, 30000);

      ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected from WS');
      });

      ws.on('error', (err) => {
        console.error('WS error:', err);
      });
    });
  }
  return wss;
}

export default function handler(req, res) {
  if (res.socket.server.wss) {
    res.end();
    return;
  }
  console.log('Initializing WebSocket server...');
  res.socket.server.wss = getWSServer(res.socket.server);
  res.end();
}