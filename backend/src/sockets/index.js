// Socket.io for the live usage dashboard. Dashboard clients subscribe to a
// per-API-key room ("usage:<apiKeyId>"); the gateway broadcasts each metered
// request into that room via emitUsage().
import { Server } from 'socket.io';
import { config } from '../config/index.js';

let io = null;

const room = (apiKeyId) => `usage:${apiKeyId}`;

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    // Client asks to watch a specific key's live traffic.
    socket.on('subscribe', (apiKeyId) => {
      if (typeof apiKeyId === 'string' && apiKeyId) socket.join(room(apiKeyId));
    });
    socket.on('unsubscribe', (apiKeyId) => {
      if (typeof apiKeyId === 'string' && apiKeyId) socket.leave(room(apiKeyId));
    });
  });

  console.log('[socket] initialized');
  return io;
}

// Broadcast a single usage event to everyone watching this key. Best-effort:
// no-op if sockets aren't up yet (e.g. during a script/worker context).
export function emitUsage(apiKeyId, event) {
  if (!io) return;
  io.to(room(apiKeyId)).emit('usage', { apiKeyId, ...event });
}

export function getIo() {
  if (!io) throw new Error('Socket.io not initialized yet');
  return io;
}
