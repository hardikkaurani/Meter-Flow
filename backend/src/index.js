// Backend entrypoint: wires datastores, HTTP server, and sockets, then listens.
import http from 'node:http';
import { config } from './config/index.js';
import { createApp } from './app.js';
import { connectPostgres, disconnectPostgres } from './config/prisma.js';
import { connectMongo, disconnectMongo } from './config/mongo.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initSockets } from './sockets/index.js';

async function start() {
  // Connect datastores up front so the server only accepts traffic when ready.
  await Promise.all([connectPostgres(), connectMongo(), connectRedis()]);

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);

  server.listen(config.port, () => {
    console.log(`[server] MeterFlow backend listening on http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close();
    await Promise.allSettled([disconnectPostgres(), disconnectMongo(), disconnectRedis()]);
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
