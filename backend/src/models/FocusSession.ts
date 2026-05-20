import { Schema, model, Document, Types } from 'mongoose';

export interface IFocusSession extends Document {
  userId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  activityName: string;
  category: string;
  syncedToClockify: boolean;
  skipped?: boolean;
  clockifyTimeEntryId?: string;
  createdAt: Date;
}

const FocusSessionSchema = new Schema<IFocusSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationSeconds: { type: Number, required: true, default: 0 },
  activityName: { type: String, required: true },
  category: { type: String, required: true, default: 'Other' },
  syncedToClockify: { type: Boolean, default: false },
  skipped: { type: Boolean, default: false },
  clockifyTimeEntryId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

FocusSessionSchema.index({ userId: 1, startTime: -1 });

export const FocusSession = model<IFocusSession>('FocusSession', FocusSessionSchema);
