import http from 'node:http';
import { config } from './config/index.js';
import { createApp } from './app.js';
import { connectPostgres, disconnectPostgres } from './config/prisma.js';
import { connectMongo, disconnectMongo } from './config/mongo.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initSockets } from './sockets/index.js';
import { logger } from './utils/logger.js';

async function start(): Promise<void> {
  // Connect all datastores before accepting traffic
  await Promise.all([connectPostgres(), connectMongo(), connectRedis()]);

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);

  server.listen(config.port, () => {
    logger.info(`[Server] MeterFlow backend listening on http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`[Server] ${signal} received, gracefully shutting down...`);
    server.close();
    await Promise.allSettled([disconnectPostgres(), disconnectMongo(), disconnectRedis()]);
    logger.info('[Server] Shutdown complete.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
