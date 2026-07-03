// Mongo = raw, high-volume usage logs. Flexible schema, cheap writes.
import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectMongo() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUrl);
  console.log('[mongo] connected');
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}

export { mongoose };
