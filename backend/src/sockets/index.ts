import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface ServerToClientEvents {
  'usage:telemetry': (data: { apiKeyId: string; latencyMs: number; statusCode: number; timestamp: string }) => void;
  'billing:invoice_generated': (data: { invoiceId: string; totalAmount: number }) => void;
}

export interface ClientToServerEvents {
  'subscribe:org': (orgId: string) => void;
  'unsubscribe:org': (orgId: string) => void;
}

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export function initSockets(server: HttpServer): SocketIOServer {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('subscribe:org', (orgId: string) => {
      socket.join(`org:${orgId}`);
      logger.info(`[Socket.io] Client ${socket.id} joined room org:${orgId}`);
    });

    socket.on('unsubscribe:org', (orgId: string) => {
      socket.leave(`org:${orgId}`);
      logger.info(`[Socket.io] Client ${socket.id} left room org:${orgId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  logger.info('[Socket.io] Server initialized successfully');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server not initialized!');
  }
  return io;
}
