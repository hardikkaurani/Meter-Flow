// Central env config. Loaded once, validated, and reused everywhere.
import 'dotenv/config';

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  databaseUrl: required('DATABASE_URL', 'postgresql://meterflow:meterflow@localhost:5432/meterflow?schema=public'),
  mongoUrl: required('MONGO_URL', 'mongodb://localhost:27017/meterflow_logs'),

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: required('JWT_SECRET', 'change-me-in-production'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  apiKeyPepper: process.env.API_KEY_PEPPER ?? 'change-me-too',
};

export const isProd = config.env === 'production';
