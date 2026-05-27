"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const mongoose_1 = require("mongoose");
const SettingsSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
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
exports.Settings = (0, mongoose_1.model)('Settings', SettingsSchema);
