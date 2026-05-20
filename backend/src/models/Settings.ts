import { Schema, model, Document, Types } from 'mongoose';

export interface ISettings extends Document {
  userId: Types.ObjectId;
  theme: 'light' | 'dark';
  idleTimeoutMinutes: number;
  mergeThresholdMinutes: number;
  trackingEnabled: boolean;
  clockify: {
    apiKey: string;
    workspaceId: string;
    projectIdMap: Map<string, string>;
    autoSync: boolean;
  };
  privacy: {
    ignoreUrls: string[];
    ignoreAppNames: string[];
  };
  createdAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
  trackingEnabled: { type: Boolean, default: true },
  idleTimeoutMinutes: { type: Number, default: 5 },
  mergeThresholdMinutes: { type: Number, default: 2 },
  clockify: {
    apiKey: { type: String, default: '' },
    workspaceId: { type: String, default: '' },
    projectIdMap: { type: Map, of: String, default: {} },
    autoSync: { type: Boolean, default: false }
  },
  privacy: {
    ignoreUrls: { type: [String], default: [] },
    ignoreAppNames: { type: [String], default: [] }
  },
  createdAt: { type: Date, default: Date.now }
});

export const Settings = model<ISettings>('Settings', SettingsSchema);
