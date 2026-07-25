import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  KEY_PEPPER: z.string().min(16, 'KEY_PEPPER must be at least 16 characters long for secure key hashing'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables configuration:', _env.error.format());
  throw new Error('Environment variable validation failed. Check your .env setup.');
}

export const env = _env.data;

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  postgresUrl: env.DATABASE_URL,
  mongoUrl: env.MONGO_URI,
  redisUrl: env.REDIS_URL,
  jwtSecret: env.JWT_SECRET,
  keyPepper: env.KEY_PEPPER,
  corsOrigin: env.CORS_ORIGIN,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
};
