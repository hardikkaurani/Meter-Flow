import mongoose, { Schema, Document } from 'mongoose';

export interface IUsageLog extends Document {
  apiKeyId: string;
  apiId: string;
  endpointId: string;
  path: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  ip: string;
  userAgent?: string;
  cost: number;
  timestamp: Date;
}

const UsageLogSchema: Schema = new Schema(
  {
    apiKeyId: { type: String, required: true, index: true },
    apiId: { type: String, required: true, index: true },
    endpointId: { type: String, required: true },
    path: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true, index: true },
    latencyMs: { type: Number, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String },
    cost: { type: Number, required: true, default: 0 },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: 'usage_logs',
  }
);

// Compound indexes for fast telemetry queries and time-series aggregation workers
UsageLogSchema.index({ apiKeyId: 1, timestamp: -1 });
UsageLogSchema.index({ apiId: 1, timestamp: -1 });

export const UsageLog = mongoose.model<IUsageLog>('UsageLog', UsageLogSchema);
