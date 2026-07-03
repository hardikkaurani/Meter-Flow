// Raw per-request usage log (MongoDB). Written fire-and-forget by the gateway
// in Phase 3, then aggregated into Postgres by a BullMQ job in Phase 4.
import { mongoose } from '../config/mongo.js';

const usageLogSchema = new mongoose.Schema(
  {
    apiKeyId: { type: String, required: true, index: true },
    apiId: { type: String, index: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
    latencyMs: { type: Number, required: true },
    responseSize: { type: Number, default: 0 },
    ip: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { collection: 'usage_logs', versionKey: false },
);

// Compound index for the common aggregation query: per key, over a time range.
usageLogSchema.index({ apiKeyId: 1, timestamp: 1 });

export const UsageLog = mongoose.model('UsageLog', usageLogSchema);
