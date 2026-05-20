import { Schema, model, Document, Types } from 'mongoose';

export interface IRawActivity extends Document {
  userId: Types.ObjectId;
  timestamp: Date;
  appName: string;
  windowTitle: string;
  browserUrl?: string;
  isIdle: boolean;
  durationSeconds: number;
  category: string;
}

const RawActivitySchema = new Schema<IRawActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  appName: { type: String, required: true },
  windowTitle: { type: String, required: true },
  browserUrl: { type: String },
  isIdle: { type: Boolean, default: false },
  durationSeconds: { type: Number, required: true, default: 5 },
  category: { type: String, required: true, default: 'Other' }
});

// Compound index for query efficiency
RawActivitySchema.index({ userId: 1, timestamp: -1 });

export const RawActivity = model<IRawActivity>('RawActivity', RawActivitySchema);
