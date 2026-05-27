"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FocusSession = void 0;
const mongoose_1 = require("mongoose");
const FocusSessionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
exports.FocusSession = (0, mongoose_1.model)('FocusSession', FocusSessionSchema);
