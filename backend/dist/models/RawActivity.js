"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawActivity = void 0;
const mongoose_1 = require("mongoose");
const RawActivitySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
exports.RawActivity = (0, mongoose_1.model)('RawActivity', RawActivitySchema);
